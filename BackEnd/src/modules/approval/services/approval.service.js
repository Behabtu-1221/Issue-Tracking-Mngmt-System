import { query } from '../../../database/connection.js';
import approvalRepository from '../repositories/approval.repository.js';
import approvalDelegationRepository from '../repositories/approval-delegation.repository.js';
import approvalGroupRepository from '../repositories/approval-group.repository.js';
import approvalHistoryRepository from '../repositories/approval-history.repository.js';
import approvalRuleEngineService from './approval-rule-engine.service.js';
import issueRequestService from '../../issue-management/services/issue-request.service.js';
import issueRequestRepository from '../../issue-management/repositories/issue-request.repository.js';
import issueHistoryRepository from '../../issue-management/repositories/issue-history.repository.js';
import { notificationService } from '../../notification/services/notification.service.js';
import { slaClockService } from '../../sla/services/sla-clock.service.js';
import AppError, { OptimisticLockError } from '../../../shared/errors/AppError.js';
import unitOfWork from '../../../shared/database/unitOfWork.js';
import outboxService from '../../../shared/outbox/outbox.service.js';

export const approvalService = {
  async getMetrics(tenantId) {
    return approvalRepository.getMetrics(tenantId);
  },

  async getApprovals(params) {
    return approvalRepository.findAll(params);
  },

  async getApprovalById(id) {
    const approval = await approvalRepository.findById(id);
    if (!approval) {
      throw new AppError(`Approval with ID ${id} not found`, 404);
    }
    return approval;
  },

  async getApprovalByRequestId(requestId) {
    const approval = await approvalRepository.findByRequestId(requestId);
    return approval || null;
  },

  async getPendingApprovals(userId) {
    const userGroups = await approvalGroupRepository.findGroupsForUser(userId);
    const groupIds = userGroups.map((g) => g.ApprovalGroupID);
    return approvalRepository.getPendingForUser(userId, groupIds);
  },

  async createApprovalWorkflow(data, userId, tx = null) {
    const issue = await issueRequestRepository.findById(data.RequestID, null, tx);
    if (!issue) {
      throw new AppError(`Issue request with ID ${data.RequestID} not found`, 404);
    }

    let stagesInput = data.stages;
    let evalReasons = [];

    // Dynamically evaluate approval stages using the business rules engine if stages not manually passed
    if (!stagesInput || stagesInput.length === 0) {
      const evalResult = await approvalRuleEngineService.evaluateApprovalWorkflow(issue);
      stagesInput = evalResult.stages;
      evalReasons = evalResult.reasons;
    }

    const title = data.Title || (stagesInput.length > 1
      ? `Multi-Level Approval Required: ${issue.RequestNumber} - ${issue.Title}`
      : `Department Review: ${issue.RequestNumber} - ${issue.Title}`);

    const description = data.Description || (evalReasons.length > 0 ? evalReasons.join(' | ') : issue.Description);

    return await unitOfWork.execute(async (t) => {
      const approvalId = await approvalRepository.createApproval({
        RequestID: data.RequestID,
        ApprovalRuleID: data.ApprovalRuleID || null,
        Title: title,
        Description: description,
        TotalStages: stagesInput.length,
        CreatedBy: userId || 1
      }, t);

      for (let i = 0; i < stagesInput.length; i++) {
        const stage = stagesInput[i];
        await approvalRepository.createStage({
          ApprovalID: approvalId,
          StageNumber: stage.StageNumber || (i + 1),
          ApproverUserID: stage.ApproverUserID || null,
          ApproverGroupID: stage.ApproverGroupID || null,
          SequenceNumber: stage.SequenceNumber || (i + 1),
          CreatedBy: userId || 1
        }, t);
      }

      // Ensure IssueRequest status is PENDING_APPROVAL
      await issueRequestRepository.update(data.RequestID, {
        StatusCode: 'PENDING_APPROVAL',
        ModifiedBy: userId || 1
      }, t);

      // Audit Trail
      await approvalHistoryRepository.create({
        ApprovalID: approvalId,
        UserID: userId || 1,
        ActionTypeCode: 'WORKFLOW_INITIATED',
        Remarks: `Approval workflow initiated with ${stagesInput.length} stage(s). Reasons: ${evalReasons.join('; ') || 'Standard department governance policy'}`
      }, t);

      // Enqueue notification event via Transactional Outbox
      await outboxService.emit(t, {
        aggregateType: 'Approval',
        aggregateId: approvalId,
        eventType: 'APPROVAL_REQUIRED',
        payload: {
          issue,
          requestId: issue.IssueRequestID,
          title: issue.Title,
          requestNumber: issue.RequestNumber,
          departmentName: issue.DepartmentName,
          priority: issue.PriorityCode,
          estimatedCost: issue.EstimatedCost,
          TriggeredByTable: 'Approval',
          TriggeredByID: approvalId,
          actorUserId: userId || 1
        }
      });

      return approvalRepository.findById(approvalId, t);
    }, { tx });
  },

  async submitDecision(data, userId) {
    const approval = await approvalRepository.findById(data.ApprovalID);
    if (!approval) {
      throw new AppError(`Approval with ID ${data.ApprovalID} not found`, 404);
    }

    if (approval.ApprovalStatusCode !== 'PENDING') {
      throw new AppError(`Approval is already in terminal state: ${approval.ApprovalStatusCode}`, 400);
    }

    const decisionUserId = Number(data.DecisionUserID || userId || 1);

    // Find active stage
    const currentStage = (approval.stages || []).find(
      (st) => st.StageNumber === approval.CurrentStageNumber && st.StageStatusCode === 'PENDING'
    );

    if (!currentStage) {
      throw new AppError(`No active pending stage found for approval ID ${data.ApprovalID}`, 404);
    }

    // Load issue details for department context
    const issue = await issueRequestRepository.findById(approval.RequestID);
    if (!issue) {
      throw new AppError(`Associated Issue request with ID ${approval.RequestID} not found`, 404);
    }

    // Role verification for decisionUserId
    const userRoles = await query(
      `SELECT r.RoleCode FROM UserRole ur JOIN Role r ON ur.RoleID = r.RoleID WHERE ur.UserID = ? AND ur.IsActive = 1 AND ur.IsDeleted = 0`,
      [decisionUserId]
    );
    const roleCodes = userRoles.map((r) => (r.RoleCode || '').toUpperCase());

    const [userRecord] = await query(
      `SELECT UserTypeCode FROM \`User\` WHERE UserID = ?`,
      [decisionUserId]
    );
    const userTypeCode = (userRecord?.UserTypeCode || '').toUpperCase();
    if (userTypeCode) roleCodes.push(userTypeCode);

    const isSuperAdmin = decisionUserId === 1 ||
      roleCodes.some((rc) => ['PARK_SUPER_ADMIN', 'PARK_ADMIN', 'SUPER_ADMIN'].includes(rc));

    let isAuthorized = false;

    // Stage 1: Department Manager Approval
    if (currentStage.StageNumber === 1) {
      // 1. Direct assigned approver
      if (currentStage.ApproverUserID && Number(currentStage.ApproverUserID) === decisionUserId) {
        isAuthorized = true;
      }
      // 2. Department Manager of the assigned department
      if (!isAuthorized && issue.AssignedDepartmentID) {
        const [dept] = await query(
          `SELECT DepartmentID FROM Department WHERE DepartmentID = ? AND ManagerUserID = ?`,
          [issue.AssignedDepartmentID, decisionUserId]
        );
        if (dept) isAuthorized = true;
      }
      // 3. User with DEPARTMENT_MANAGER, MANAGER, or DISPATCHER role assigned to that department
      if (!isAuthorized && issue.AssignedDepartmentID) {
        const [empDept] = await query(
          `SELECT ea.UserID 
           FROM EmployeeAssignment ea
           JOIN UserRole ur ON ea.UserID = ur.UserID
           JOIN Role r ON ur.RoleID = r.RoleID
           WHERE ea.DepartmentID = ? AND ea.UserID = ? AND ea.IsActive = 1 AND ea.IsDeleted = 0
             AND r.RoleCode IN ('DEPARTMENT_MANAGER', 'MANAGER', 'DISPATCHER', 'FACILITY_MANAGER')`,
          [issue.AssignedDepartmentID, decisionUserId]
        );
        if (empDept) isAuthorized = true;
      }
      // 4. Any user who is a department manager in Department table if no department assigned yet
      if (!isAuthorized && !issue.AssignedDepartmentID) {
        const [anyDept] = await query(
          `SELECT DepartmentID FROM Department WHERE ManagerUserID = ? AND IsDeleted = 0 LIMIT 1`,
          [decisionUserId]
        );
        if (anyDept) isAuthorized = true;
      }
      // 5. Delegations
      if (!isAuthorized && currentStage.ApproverUserID) {
        const isDelegated = await approvalDelegationRepository.isUserDelegated(currentStage.ApproverUserID, decisionUserId);
        if (isDelegated) isAuthorized = true;
      }
      // 6. System Administrator override
      if (!isAuthorized && isSuperAdmin) {
        isAuthorized = true;
      }

      if (!isAuthorized) {
        throw new AppError(
          `Unauthorized: Only the Department Manager for department #${issue.AssignedDepartmentID || 'N/A'} or an authorized supervisor can approve Stage 1.`,
          403
        );
      }
    }

    // Stage 2: Business Park Administrator Approval (Higher-Level)
    if (currentStage.StageNumber === 2) {
      if (isSuperAdmin) {
        isAuthorized = true;
      }
      if (!isAuthorized && currentStage.ApproverUserID && Number(currentStage.ApproverUserID) === decisionUserId) {
        isAuthorized = true;
      }
      if (!isAuthorized && currentStage.ApproverUserID) {
        const isDelegated = await approvalDelegationRepository.isUserDelegated(currentStage.ApproverUserID, decisionUserId);
        if (isDelegated) isAuthorized = true;
      }

      if (!isAuthorized) {
        throw new AppError(
          'Unauthorized: Stage 2 higher-level authorization requires Business Park Administrator authority (PARK_SUPER_ADMIN / PARK_ADMIN).',
          403
        );
      }
    }

    let isFinalApprovalCompleted = false;

    await unitOfWork.execute(async (tx) => {
      // 1. Record decision in ApprovalDecision table
      await approvalRepository.recordDecision({
        ApprovalStageID: currentStage.ApprovalStageID,
        DecisionUserID: decisionUserId,
        DecisionCode: data.DecisionCode,
        Comments: data.Comments || null,
        CreatedBy: decisionUserId
      }, tx);

      const now = new Date();
      const expectedRowVersion = data.expectedRowVersion || data.RowVersion || issue.RowVersion || null;

      // 2. State Machine Transitions
      if (data.DecisionCode === 'APPROVED') {
        await approvalRepository.updateStageStatus(currentStage.ApprovalStageID, 'APPROVED', decisionUserId, tx);

        if (approval.CurrentStageNumber >= approval.TotalStages) {
          // FINAL STAGE APPROVED -> Workflow Completed -> Issue becomes APPROVED (assignable)
          await approvalRepository.updateApproval(approval.ApprovalID, {
            ApprovalStatusCode: 'APPROVED',
            FinalActionedByUserID: decisionUserId,
            FinalActionedDateTime: now,
            ModifiedBy: decisionUserId
          }, tx);

          // Set IssueRequest StatusCode to 'APPROVED' (Authorized for Dispatch Assignment)
          await issueRequestRepository.update(approval.RequestID, {
            StatusCode: 'APPROVED',
            expectedRowVersion,
            ModifiedBy: decisionUserId
          }, tx);

          // Record Issue History
          await issueHistoryRepository.create({
            IssueRequestID: approval.RequestID,
            UserID: decisionUserId,
            FieldName: 'StatusCode',
            OldValue: issue.StatusCode,
            NewValue: 'APPROVED',
            ActionTypeCode: 'STATUS_CHANGED',
            Remarks: `Full approval workflow completed (${approval.TotalStages} stage(s) approved). Authorized and ready for technician dispatch.`
          }, tx);

          // Record Approval History
          await approvalHistoryRepository.create({
            ApprovalID: approval.ApprovalID,
            UserID: decisionUserId,
            ActionTypeCode: 'WORKFLOW_APPROVED',
            Remarks: `All ${approval.TotalStages} stage(s) approved. Final authorization granted. Request is now in APPROVED state awaiting technician assignment.`
          }, tx);

          isFinalApprovalCompleted = true;

          // Emit Centralized Outbox Events
          await outboxService.emit(tx, {
            aggregateType: 'IssueRequest',
            aggregateId: approval.RequestID,
            eventType: 'APPROVAL_COMPLETED',
            payload: {
              issue: { ...issue, StatusCode: 'APPROVED' },
              requestId: approval.RequestID,
              departmentId: issue.AssignedDepartmentID,
              title: issue.Title,
              requestNumber: issue.RequestNumber,
              remarks: data.Comments,
              actorUserId: decisionUserId
            }
          });

          await outboxService.emit(tx, {
            aggregateType: 'IssueRequest',
            aggregateId: approval.RequestID,
            eventType: 'ISSUE_APPROVED_FOR_DISPATCH',
            payload: {
              issue: { ...issue, StatusCode: 'APPROVED' },
              requestId: approval.RequestID,
              departmentId: issue.AssignedDepartmentID,
              title: issue.Title,
              requestNumber: issue.RequestNumber,
              actorUserId: decisionUserId
            }
          });

        } else {
          // ADVANCE TO NEXT STAGE
          const nextStageNumber = approval.CurrentStageNumber + 1;
          await approvalRepository.updateApproval(approval.ApprovalID, {
            CurrentStageNumber: nextStageNumber,
            ModifiedBy: decisionUserId
          }, tx);

          // Locate next stage in pipeline
          const nextStage = (approval.stages || []).find((st) => st.StageNumber === nextStageNumber);
          if (nextStage && !nextStage.ApproverUserID && !nextStage.ApproverGroupID) {
            // Assign primary Business Park Administrator if approver was not explicitly preset
            const [adminUser] = await query(
              `SELECT u.UserID 
               FROM \`User\` u
               LEFT JOIN UserRole ur ON u.UserID = ur.UserID
               LEFT JOIN Role r ON ur.RoleID = r.RoleID
               WHERE (r.RoleCode IN ('PARK_SUPER_ADMIN', 'PARK_ADMIN') OR u.UserTypeCode IN ('PARK_SUPER_ADMIN', 'PARK_ADMIN') OR u.UserID = 1)
                 AND u.IsActive = 1 AND u.IsDeleted = 0
               ORDER BY u.UserID ASC
               LIMIT 1`
            );
            const defaultAdminId = adminUser ? adminUser.UserID : 1;
            await approvalRepository.updateStageApprover(nextStage.ApprovalStageID, defaultAdminId, null, decisionUserId, tx);
          }

          await approvalHistoryRepository.create({
            ApprovalID: approval.ApprovalID,
            UserID: decisionUserId,
            ActionTypeCode: 'STAGE_APPROVED',
            Remarks: `Stage ${currentStage.StageNumber} (Department Review) approved. Advanced to Stage ${nextStageNumber} for Business Park Administrator authorization.`
          }, tx);

          await issueHistoryRepository.create({
            IssueRequestID: approval.RequestID,
            UserID: decisionUserId,
            FieldName: 'ApprovalStage',
            OldValue: `Stage ${currentStage.StageNumber}`,
            NewValue: `Stage ${nextStageNumber}`,
            ActionTypeCode: 'STAGE_APPROVED',
            Remarks: `Department Manager review approved. Awaiting higher-level Business Park Administrator authorization.`
          }, tx);

          // Outbox event 1: Department Approved for requester & audit tracking
          await outboxService.emit(tx, {
            aggregateType: 'Approval',
            aggregateId: approval.ApprovalID,
            eventType: 'DEPARTMENT_APPROVED',
            payload: {
              issue,
              requestId: approval.RequestID,
              title: issue.Title,
              requestNumber: issue.RequestNumber,
              departmentName: issue.DepartmentName,
              stageNumber: currentStage.StageNumber,
              remarks: data.Comments || 'Department Manager review approved.',
              actorUserId: decisionUserId
            }
          });

          // Outbox event 2: Higher Level Approval Required - alerts Business Park Administrators
          await outboxService.emit(tx, {
            aggregateType: 'Approval',
            aggregateId: approval.ApprovalID,
            eventType: 'HIGHER_APPROVAL_REQUIRED',
            payload: {
              issue,
              requestId: approval.RequestID,
              title: issue.Title,
              requestNumber: issue.RequestNumber,
              departmentName: issue.DepartmentName,
              priority: issue.PriorityCode,
              estimatedCost: issue.EstimatedCost,
              stageNumber: nextStageNumber,
              remarks: data.Comments || `Stage ${currentStage.StageNumber} Department Manager approval signed off. Higher-level authorization required from Business Park Administrators for Stage ${nextStageNumber}.`,
              actorUserId: decisionUserId
            }
          });
        }

      } else if (data.DecisionCode === 'REJECTED') {
        await approvalRepository.updateStageStatus(currentStage.ApprovalStageID, 'REJECTED', decisionUserId, tx);

        await approvalRepository.updateApproval(approval.ApprovalID, {
          ApprovalStatusCode: 'REJECTED',
          FinalActionedByUserID: decisionUserId,
          FinalActionedDateTime: now,
          ModifiedBy: decisionUserId
        }, tx);

        const rejectReason = data.Comments || 'Rejected during approval workflow';

        // Update IssueRequest to CANCELLED with optimistic locking check
        await issueRequestRepository.update(approval.RequestID, {
          StatusCode: 'CANCELLED',
          CancellationReason: `Rejected at Stage ${currentStage.StageNumber}: ${rejectReason}`,
          expectedRowVersion,
          ModifiedBy: decisionUserId
        }, tx);

        await issueHistoryRepository.create({
          IssueRequestID: approval.RequestID,
          UserID: decisionUserId,
          FieldName: 'StatusCode',
          OldValue: issue.StatusCode,
          NewValue: 'CANCELLED',
          ActionTypeCode: 'STATUS_CHANGED',
          Remarks: `Issue cancelled due to rejection at Stage ${currentStage.StageNumber}. Reason: ${rejectReason}`
        }, tx);

        await approvalHistoryRepository.create({
          ApprovalID: approval.ApprovalID,
          UserID: decisionUserId,
          ActionTypeCode: 'WORKFLOW_REJECTED',
          Remarks: `Request rejected at Stage ${currentStage.StageNumber}. Remarks: ${rejectReason}`
        }, tx);

        // Emit Outbox event
        await outboxService.emit(tx, {
          aggregateType: 'Approval',
          aggregateId: approval.ApprovalID,
          eventType: 'APPROVAL_REJECTED',
          payload: {
            issue,
            requestId: approval.RequestID,
            title: issue.Title,
            requestNumber: issue.RequestNumber,
            remarks: rejectReason,
            actorUserId: decisionUserId
          }
        });

      } else if (data.DecisionCode === 'RETURNED_FOR_CORRECTION') {
        await approvalRepository.updateStageStatus(currentStage.ApprovalStageID, 'RETURNED', decisionUserId, tx);

        await approvalRepository.updateApproval(approval.ApprovalID, {
          ApprovalStatusCode: 'RETURNED',
          FinalActionedByUserID: decisionUserId,
          FinalActionedDateTime: now,
          ModifiedBy: decisionUserId
        }, tx);

        const returnReason = data.Comments || 'Returned for correction';

        await issueRequestRepository.update(approval.RequestID, {
          StatusCode: 'PENDING',
          expectedRowVersion,
          ModifiedBy: decisionUserId
        }, tx);

        await issueHistoryRepository.create({
          IssueRequestID: approval.RequestID,
          UserID: decisionUserId,
          FieldName: 'StatusCode',
          OldValue: issue.StatusCode,
          NewValue: 'PENDING',
          ActionTypeCode: 'STATUS_CHANGED',
          Remarks: `Returned for correction at Stage ${currentStage.StageNumber}. Comments: ${returnReason}`
        }, tx);

        await approvalHistoryRepository.create({
          ApprovalID: approval.ApprovalID,
          UserID: decisionUserId,
          ActionTypeCode: 'RETURNED_FOR_CORRECTION',
          Remarks: `Returned for correction at Stage ${currentStage.StageNumber}. Comments: ${returnReason}`
        }, tx);
      }
    });

    if (isFinalApprovalCompleted) {
      try {
        await slaClockService.startClockForIssue(approval.RequestID, 1, issue.PriorityCode || 'MEDIUM', decisionUserId);
      } catch (slaErr) {
        console.warn('SLA Clock start notice upon approval:', slaErr.message);
      }
    }

    return approvalRepository.findById(approval.ApprovalID);
  }
};

export default approvalService;
