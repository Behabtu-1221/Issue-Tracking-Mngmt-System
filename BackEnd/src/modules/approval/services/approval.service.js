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
import { query } from '../../../database/connection.js';
import AppError from '../../../shared/errors/AppError.js';

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

  async createApprovalWorkflow(data, userId) {
    const issue = await issueRequestRepository.findById(data.RequestID);
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

    const approvalId = await approvalRepository.createApproval({
      RequestID: data.RequestID,
      ApprovalRuleID: data.ApprovalRuleID || null,
      Title: title,
      Description: description,
      TotalStages: stagesInput.length,
      CreatedBy: userId || 1
    });

    for (let i = 0; i < stagesInput.length; i++) {
      const stage = stagesInput[i];
      await approvalRepository.createStage({
        ApprovalID: approvalId,
        StageNumber: stage.StageNumber || (i + 1),
        ApproverUserID: stage.ApproverUserID || null,
        ApproverGroupID: stage.ApproverGroupID || null,
        SequenceNumber: stage.SequenceNumber || (i + 1),
        CreatedBy: userId || 1
      });
    }

    // Ensure IssueRequest status is PENDING_APPROVAL
    await issueRequestService.updateStatus(
      data.RequestID,
      'PENDING_APPROVAL',
      `Approval workflow initiated with ${stagesInput.length} stage(s): Stage 1 (Department Manager)${stagesInput.length > 1 ? ', Stage 2 (Business Park Administrator)' : ''}.`,
      userId
    );

    // Audit Trail
    await approvalHistoryRepository.create({
      ApprovalID: approvalId,
      UserID: userId || 1,
      ActionTypeCode: 'WORKFLOW_INITIATED',
      Remarks: `Approval workflow initiated with ${stagesInput.length} stage(s). Reasons: ${evalReasons.join('; ') || 'Standard department governance policy'}`
    });

    // Notify Stage 1 Approver (Department Manager) via Centralized Notification Service
    try {
      await notificationService.notifyEvent('APPROVAL_REQUIRED', {
        issue,
        requestId: issue.IssueRequestID,
        title: issue.Title,
        requestNumber: issue.RequestNumber,
        departmentName: issue.DepartmentName,
        priority: issue.PriorityCode,
        estimatedCost: issue.EstimatedCost,
        TriggeredByTable: 'Approval',
        TriggeredByID: approvalId
      }, userId || 1);
    } catch (notifErr) {
      console.warn('Initial approval notification notice:', notifErr.message);
    }

    return approvalRepository.findById(approvalId);
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
    const [userRole] = await query(
      `SELECT r.RoleCode FROM UserRole ur JOIN Role r ON ur.RoleID = r.RoleID WHERE ur.UserID = ?`,
      [decisionUserId]
    );
    const roleCode = userRole ? userRole.RoleCode : '';
    const isSuperAdmin = decisionUserId === 1 || ['PARK_SUPER_ADMIN', 'PARK_ADMIN'].includes(roleCode);

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
      // 3. User with DEPARTMENT_MANAGER role assigned to that department
      if (!isAuthorized && issue.AssignedDepartmentID) {
        const [empDept] = await query(
          `SELECT ea.UserID 
           FROM EmployeeAssignment ea
           JOIN UserRole ur ON ea.UserID = ur.UserID
           JOIN Role r ON ur.RoleID = r.RoleID
           WHERE ea.DepartmentID = ? AND ea.UserID = ? AND ea.IsActive = 1 AND ea.IsDeleted = 0
             AND r.RoleCode = 'DEPARTMENT_MANAGER'`,
          [issue.AssignedDepartmentID, decisionUserId]
        );
        if (empDept) isAuthorized = true;
      }
      // 4. Delegations
      if (!isAuthorized && currentStage.ApproverUserID) {
        const isDelegated = await approvalDelegationRepository.isUserDelegated(currentStage.ApproverUserID, decisionUserId);
        if (isDelegated) isAuthorized = true;
      }
      // 5. System Administrator override
      if (!isAuthorized && isSuperAdmin) {
        isAuthorized = true;
      }

      if (!isAuthorized) {
        throw new AppError(
          `Unauthorized: Only the Department Manager for department #${issue.AssignedDepartmentID} or an authorized supervisor can approve Stage 1.`,
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

    // 1. Record decision in ApprovalDecision table
    await approvalRepository.recordDecision({
      ApprovalStageID: currentStage.ApprovalStageID,
      DecisionUserID: decisionUserId,
      DecisionCode: data.DecisionCode,
      Comments: data.Comments || null,
      CreatedBy: decisionUserId
    });

    const now = new Date();

    // 2. State Machine Transitions
    if (data.DecisionCode === 'APPROVED') {
      await approvalRepository.updateStageStatus(currentStage.ApprovalStageID, 'APPROVED', decisionUserId);

      if (approval.CurrentStageNumber >= approval.TotalStages) {
        // FINAL STAGE APPROVED -> Workflow Completed -> Issue becomes APPROVED (assignable)
        await approvalRepository.updateApproval(approval.ApprovalID, {
          ApprovalStatusCode: 'APPROVED',
          FinalActionedByUserID: decisionUserId,
          FinalActionedDateTime: now,
          ModifiedBy: decisionUserId
        });

        // Set IssueRequest StatusCode to 'APPROVED' (ready for Department Manager assignment)
        await issueRequestService.updateStatus(
          approval.RequestID,
          'APPROVED',
          `Full approval workflow successfully completed (${approval.TotalStages} stage(s) approved). Request is authorized and awaiting technician assignment by department management.`,
          decisionUserId
        );

        // Record Approval History
        await approvalHistoryRepository.create({
          ApprovalID: approval.ApprovalID,
          UserID: decisionUserId,
          ActionTypeCode: 'WORKFLOW_APPROVED',
          Remarks: `All ${approval.TotalStages} stage(s) approved. Final authorization granted. Request is now in APPROVED state awaiting technician assignment.`
        });

        // Start SLA Clock upon final approval
        try {
          await slaClockService.startClockForIssue(approval.RequestID, 1, issue.PriorityCode || 'MEDIUM', decisionUserId);
        } catch (slaErr) {
          console.warn('SLA Clock start notice upon approval:', slaErr.message);
        }

        // Notify Department Manager, Dispatcher, and Requester via Centralized Event
        try {
          await notificationService.notifyEvent('APPROVAL_COMPLETED', {
            issue,
            requestId: approval.RequestID,
            title: issue.Title,
            requestNumber: issue.RequestNumber,
            remarks: data.Comments,
            TriggeredByTable: 'IssueRequest',
            TriggeredByID: approval.RequestID
          }, decisionUserId);
        } catch (notifErr) {
          console.warn('Final approval notification notice:', notifErr.message);
        }

      } else {
        // ADVANCE TO NEXT STAGE (e.g. from Stage 1 Department Manager to Stage 2 Business Park Administrator)
        const nextStageNumber = approval.CurrentStageNumber + 1;
        await approvalRepository.updateApproval(approval.ApprovalID, {
          CurrentStageNumber: nextStageNumber,
          ModifiedBy: decisionUserId
        });

        await approvalHistoryRepository.create({
          ApprovalID: approval.ApprovalID,
          UserID: decisionUserId,
          ActionTypeCode: 'STAGE_APPROVED',
          Remarks: `Stage ${currentStage.StageNumber} (Department Review) approved. Advanced to Stage ${nextStageNumber} for Business Park Administrator authorization.`
        });

        await issueHistoryRepository.create({
          IssueRequestID: approval.RequestID,
          UserID: decisionUserId,
          FieldName: 'ApprovalStage',
          OldValue: `Stage ${currentStage.StageNumber}`,
          NewValue: `Stage ${nextStageNumber}`,
          ActionTypeCode: 'STAGE_APPROVED',
          Remarks: `Department Manager review approved. Awaiting higher-level Business Park Administrator authorization.`
        });

        // Trigger Centralized Notifications: Department Approved + Higher-Level Approval Required
        try {
          await notificationService.notifyEvent('DEPARTMENT_APPROVED', {
            issue,
            requestId: approval.RequestID,
            title: issue.Title,
            requestNumber: issue.RequestNumber,
            remarks: data.Comments,
            TriggeredByTable: 'Approval',
            TriggeredByID: approval.ApprovalID
          }, decisionUserId);

          await notificationService.notifyEvent('HIGHER_APPROVAL_REQUIRED', {
            issue,
            requestId: approval.RequestID,
            title: issue.Title,
            requestNumber: issue.RequestNumber,
            remarks: data.Comments,
            approvalReasons: approval.Title,
            TriggeredByTable: 'Approval',
            TriggeredByID: approval.ApprovalID
          }, decisionUserId);
        } catch (notifErr) {
          console.warn('Stage 2 notification notice:', notifErr.message);
        }
      }

    } else if (data.DecisionCode === 'REJECTED') {
      // REJECTION RULE: Immediately terminate workflow as REJECTED and cancel IssueRequest
      await approvalRepository.updateStageStatus(currentStage.ApprovalStageID, 'REJECTED', decisionUserId);

      await approvalRepository.updateApproval(approval.ApprovalID, {
        ApprovalStatusCode: 'REJECTED',
        FinalActionedByUserID: decisionUserId,
        FinalActionedDateTime: now,
        ModifiedBy: decisionUserId
      });

      const rejectReason = data.Comments || 'Rejected during approval workflow';

      // Update IssueRequest status to CANCELLED
      await issueRequestService.cancelIssue(
        approval.RequestID,
        `Rejected at Stage ${currentStage.StageNumber}: ${rejectReason}`,
        decisionUserId
      );

      await approvalHistoryRepository.create({
        ApprovalID: approval.ApprovalID,
        UserID: decisionUserId,
        ActionTypeCode: 'WORKFLOW_REJECTED',
        Remarks: `Request rejected at Stage ${currentStage.StageNumber}. Remarks: ${rejectReason}`
      });

      // Notify Requester of Rejection
      try {
        await notificationService.notifyEvent('APPROVAL_REJECTED', {
          issue,
          requestId: approval.RequestID,
          title: issue.Title,
          requestNumber: issue.RequestNumber,
          remarks: rejectReason,
          TriggeredByTable: 'Approval',
          TriggeredByID: approval.ApprovalID
        }, decisionUserId);
      } catch (notifErr) {
        console.warn('Rejection notification notice:', notifErr.message);
      }

    } else if (data.DecisionCode === 'RETURNED_FOR_CORRECTION') {
      // RETURNED FOR CORRECTION: Mark as RETURNED and reset issue status to PENDING
      await approvalRepository.updateStageStatus(currentStage.ApprovalStageID, 'RETURNED', decisionUserId);

      await approvalRepository.updateApproval(approval.ApprovalID, {
        ApprovalStatusCode: 'RETURNED',
        FinalActionedByUserID: decisionUserId,
        FinalActionedDateTime: now,
        ModifiedBy: decisionUserId
      });

      const returnReason = data.Comments || 'Returned for correction';

      await issueRequestService.updateStatus(
        approval.RequestID,
        'PENDING',
        `Returned for correction at Stage ${currentStage.StageNumber}: ${returnReason}`,
        decisionUserId
      );

      await approvalHistoryRepository.create({
        ApprovalID: approval.ApprovalID,
        UserID: decisionUserId,
        ActionTypeCode: 'RETURNED_FOR_CORRECTION',
        Remarks: `Returned for correction at Stage ${currentStage.StageNumber}. Comments: ${returnReason}`
      });
    }

    return approvalRepository.findById(approval.ApprovalID);
  }
};

export default approvalService;
