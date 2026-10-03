import assignmentRepository from '../repositories/assignment.repository.js';
import issueRequestRepository from '../../issue-management/repositories/issue-request.repository.js';
import issueHistoryRepository from '../../issue-management/repositories/issue-history.repository.js';
import { notificationService } from '../../notification/services/notification.service.js';
import { slaClockService } from '../../sla/services/sla-clock.service.js';
import AppError, { OptimisticLockError } from '../../../shared/errors/AppError.js';
import unitOfWork from '../../../shared/database/unitOfWork.js';
import outboxService from '../../../shared/outbox/outbox.service.js';

export const assignmentService = {
  async getUserDepartmentId(userId) {
    if (!userId || userId === 1) return null; // Super admin has global scope

    // Check if user is Department Manager
    const [dept] = await query(
      `SELECT DepartmentID FROM Department WHERE ManagerUserID = ? AND IsDeleted = 0 LIMIT 1`,
      [userId]
    );
    if (dept) return dept.DepartmentID;

    // Check EmployeeAssignment
    const [emp] = await query(
      `SELECT DepartmentID FROM EmployeeAssignment WHERE UserID = ? AND IsActive = 1 AND IsDeleted = 0 LIMIT 1`,
      [userId]
    );
    return emp ? emp.DepartmentID : null;
  },

  async isUserParkAdmin(userId) {
    if (!userId || userId === 1) return true;
    const [role] = await query(
      `SELECT r.RoleCode 
       FROM UserRole ur 
       JOIN Role r ON ur.RoleID = r.RoleID 
       WHERE ur.UserID = ? AND r.RoleCode IN ('PARK_SUPER_ADMIN', 'PARK_ADMIN')`,
      [userId]
    );
    return Boolean(role);
  },

  async getOverviewMetrics(tenantId, actionUserId = 1) {
    const isSuper = await this.isUserParkAdmin(actionUserId);
    const deptId = isSuper ? null : await this.getUserDepartmentId(actionUserId);
    return assignmentRepository.getOverviewMetrics(tenantId, deptId);
  },

  async getUnassignedQueue(params = {}, actionUserId = 1) {
    const isSuper = await this.isUserParkAdmin(actionUserId);
    const deptId = isSuper ? (params.departmentId || null) : await this.getUserDepartmentId(actionUserId);
    return assignmentRepository.getUnassignedQueue({ ...params, departmentId: deptId });
  },

  async getAssignments(params = {}, actionUserId = 1) {
    const isSuper = await this.isUserParkAdmin(actionUserId);
    const deptId = isSuper ? (params.departmentId || null) : await this.getUserDepartmentId(actionUserId);
    return assignmentRepository.getAssignments({ ...params, departmentId: deptId });
  },

  async getAssignmentById(id) {
    const assignment = await assignmentRepository.findById(id);
    if (!assignment) {
      throw new AppError('Assignment not found', 404);
    }
    const history = await assignmentRepository.findHistoryByAssignmentId(id);
    return { ...assignment, history };
  },

  async manualAssign({ RequestID, AssignedUserID, AssignedTeamID, Remarks }, actionUserId = 1) {
    if (!RequestID) {
      throw new AppError('RequestID is required', 400);
    }
    if (!AssignedUserID && !AssignedTeamID) {
      throw new AppError('Either an individual Technician (AssignedUserID) or Technical Team (AssignedTeamID) must be selected', 400);
    }

    // 1. Fetch IssueRequest and enforce state integrity
    const issue = await issueRequestRepository.findById(RequestID);
    if (!issue) {
      throw new AppError(`Issue request with ID ${RequestID} not found`, 404);
    }

    // CRITICAL RULE: Request MUST be in APPROVED state before it can be assigned
    if (issue.StatusCode !== 'APPROVED') {
      throw new AppError(
        `Request '${issue.RequestNumber}' cannot be assigned while in '${issue.StatusCode}' status. It must complete all required approvals and be in 'APPROVED' status before assignment.`,
        400
      );
    }

    const assignedDeptId = issue.AssignedDepartmentID;

    // 2. Validate Assigner Authority
    const isSuperAdmin = await this.isUserParkAdmin(actionUserId);
    if (!isSuperAdmin) {
      const userDeptId = await this.getUserDepartmentId(actionUserId);
      if (!userDeptId || Number(userDeptId) !== Number(assignedDeptId)) {
        throw new AppError(
          `Unauthorized: You can only assign requests belonging to your responsible department (#${userDeptId || 'None'}). This request belongs to department #${assignedDeptId}.`,
          403
        );
      }
    }

    // 3. Validate Selected Technician
    let technicianName = '';
    if (AssignedUserID) {
      const [techUser] = await query(
        `SELECT u.UserID, u.FirstName, u.LastName, u.IsActive, ea.DepartmentID, ea.IsActive AS AssignmentActive, r.RoleCode
         FROM \`User\` u
         LEFT JOIN EmployeeAssignment ea ON u.UserID = ea.UserID AND ea.IsActive = 1 AND ea.IsDeleted = 0
         LEFT JOIN UserRole ur ON u.UserID = ur.UserID
         LEFT JOIN Role r ON ur.RoleID = r.RoleID
         WHERE u.UserID = ? AND u.IsDeleted = 0`,
        [AssignedUserID]
      );

      if (!techUser || !techUser.IsActive) {
        throw new AppError('The selected technician is inactive or does not exist.', 400);
      }

      if (assignedDeptId && Number(techUser.DepartmentID) !== Number(assignedDeptId)) {
        throw new AppError(
          `Technician validation failed: ${techUser.FirstName} ${techUser.LastName} belongs to department #${techUser.DepartmentID || 'None'}, which does not match request department #${assignedDeptId}. Cross-department technician assignment is prohibited.`,
          400
        );
      }

      technicianName = `${techUser.FirstName} ${techUser.LastName}`;
    }

    // 4. Validate Selected Technical Team
    let teamName = '';
    if (AssignedTeamID) {
      const [team] = await query(
        `SELECT TeamID, TeamName, DepartmentID, IsActive FROM Team WHERE TeamID = ? AND IsDeleted = 0`,
        [AssignedTeamID]
      );

      if (!team || !team.IsActive) {
        throw new AppError('The selected team is inactive or does not exist.', 400);
      }

      if (assignedDeptId && Number(team.DepartmentID) !== Number(assignedDeptId)) {
        throw new AppError(
          `Team validation failed: Team '${team.TeamName}' belongs to department #${team.DepartmentID}, not request department #${assignedDeptId}.`,
          400
        );
      }

      teamName = team.TeamName;
    }

    // 5. Transactional Execution: Create / Update Assignment
    const expectedRowVersion = Remarks?.expectedRowVersion || issue.RowVersion || null;

    return await unitOfWork.execute(async (tx) => {
      const existing = await assignmentRepository.findByRequestId(RequestID);
      let assignmentId;
      const now = new Date();

      if (existing) {
        assignmentId = existing.AssignmentID;
        await assignmentRepository.updateAssignment(assignmentId, {
          AssignedUserID: AssignedUserID || null,
          AssignedTeamID: AssignedTeamID || null,
          AssignmentStatusCode: 'ASSIGNED',
          ModifiedBy: actionUserId
        }, tx);
      } else {
        assignmentId = await assignmentRepository.createAssignment({
          RequestID,
          AssignedUserID: AssignedUserID || null,
          AssignedTeamID: AssignedTeamID || null,
          AssignmentStatusCode: 'ASSIGNED',
          CreatedBy: actionUserId
        }, tx);
      }

      // 6. Transition IssueRequest to ASSIGNED with Optimistic Locking check
      await issueRequestRepository.update(RequestID, {
        StatusCode: 'ASSIGNED',
        expectedRowVersion,
        ModifiedBy: actionUserId
      }, tx);

      const assignTargetDesc = AssignedUserID ? `Technician ${technicianName} (#${AssignedUserID})` : `Technical Team '${teamName}' (#${AssignedTeamID})`;
      const assignRemarks = Remarks || `Assigned to ${assignTargetDesc} by department manager/dispatcher.`;

      // 7. Audit Histories
      await assignmentRepository.createHistory({
        AssignmentID: assignmentId,
        ActionUserID: actionUserId,
        ActionTypeCode: 'ASSIGNED_MANUALLY',
        Remarks: assignRemarks,
        CreatedBy: actionUserId
      }, tx);

      await issueHistoryRepository.create({
        IssueRequestID: RequestID,
        UserID: actionUserId,
        FieldName: 'StatusCode',
        OldValue: 'APPROVED',
        NewValue: 'ASSIGNED',
        ActionTypeCode: 'ASSIGNED',
        Remarks: assignRemarks
      }, tx);

      // 8. Start / update SLA timers
      try {
        await slaClockService.startClockForIssue(RequestID, 1, issue.PriorityCode || 'MEDIUM', actionUserId);
      } catch (slaErr) {
        console.warn('SLA Clock notice upon assignment:', slaErr.message);
      }

      // 9. Notify Assigned Technician / Team & Requester via Transactional Outbox
      await outboxService.emit(tx, {
        aggregateType: 'Assignment',
        aggregateId: assignmentId,
        eventType: 'ISSUE_ASSIGNED',
        payload: {
          issue,
          requestId: RequestID,
          title: issue.Title,
          requestNumber: issue.RequestNumber,
          priority: issue.PriorityCode,
          assignedUserId: AssignedUserID || null,
          assignedTeamId: AssignedTeamID || null,
          remarks: Remarks,
          actorUserId: actionUserId
        }
      });

      return assignmentRepository.findById(assignmentId);
    });
  },

  async autoAssign(RequestID, actionUserId = 1) {
    if (!RequestID) {
      throw new AppError('RequestID is required', 400);
    }

    const issue = await issueRequestRepository.findById(RequestID);
    if (!issue) {
      throw new AppError(`Issue request with ID ${RequestID} not found`, 404);
    }

    if (issue.StatusCode !== 'APPROVED') {
      throw new AppError(
        `Cannot auto-assign request in '${issue.StatusCode}' status. It must be in 'APPROVED' status before dispatch.`,
        400
      );
    }

    // Find available technician in the issue's department with lowest active workload
    const targetTech = await assignmentRepository.findLowestWorkloadTechnician(issue.AssignedDepartmentID);
    if (!targetTech) {
      throw new AppError(
        `No available active technicians found in responsible department #${issue.AssignedDepartmentID || 'N/A'} for automatic assignment.`,
        400
      );
    }

    return this.manualAssign({
      RequestID,
      AssignedUserID: targetTech.UserID,
      Remarks: `Automatically dispatched based on lowest active workload algorithm to ${targetTech.FullName}`
    }, actionUserId);
  },

  async acceptAssignment(assignmentId, userId = 1) {
    const assignment = await assignmentRepository.findById(assignmentId);
    if (!assignment) throw new AppError('Assignment not found', 404);

    await assignmentRepository.updateAssignment(assignmentId, {
      AssignmentStatusCode: 'ACCEPTED',
      ModifiedBy: userId
    });

    await assignmentRepository.createHistory({
      AssignmentID: assignmentId,
      ActionUserID: userId,
      ActionTypeCode: 'ACCEPTED',
      Remarks: 'Technician accepted field dispatch assignment',
      CreatedBy: userId
    });

    return assignmentRepository.findById(assignmentId);
  },

  async rejectAssignment(assignmentId, rejectionReason, userId = 1) {
    const assignment = await assignmentRepository.findById(assignmentId);
    if (!assignment) throw new AppError('Assignment not found', 404);

    await assignmentRepository.updateAssignment(assignmentId, {
      AssignmentStatusCode: 'REJECTED',
      ModifiedBy: userId
    });

    // Reset IssueRequest back to APPROVED so Department Manager can reassign it
    await query(
      `UPDATE IssueRequest SET StatusCode = 'APPROVED', ModifiedBy = ?, ModifiedDate = CURRENT_TIMESTAMP(6) WHERE IssueRequestID = ?`,
      [userId, assignment.RequestID]
    );

    await assignmentRepository.createHistory({
      AssignmentID: assignmentId,
      ActionUserID: userId,
      ActionTypeCode: 'REJECTED',
      Remarks: rejectionReason || 'Technician declined assignment. Returned to department awaiting assignment queue.',
      CreatedBy: userId
    });

    await issueHistoryRepository.create({
      IssueRequestID: assignment.RequestID,
      UserID: userId,
      FieldName: 'StatusCode',
      OldValue: 'ASSIGNED',
      NewValue: 'APPROVED',
      ActionTypeCode: 'STATUS_CHANGED',
      Remarks: `Technician declined assignment: ${rejectionReason || 'No reason provided'}. Returned to department queue for reassignment.`
    });

    return assignmentRepository.findById(assignmentId);
  },

  async startWork(assignmentId, userId = 1) {
    const assignment = await assignmentRepository.findById(assignmentId);
    if (!assignment) throw new AppError('Assignment not found', 404);

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await assignmentRepository.updateAssignment(assignmentId, {
      AssignmentStatusCode: 'IN_PROGRESS',
      StartDateTime: now,
      ModifiedBy: userId
    });

    await query(
      `UPDATE IssueRequest SET StatusCode = 'IN_PROGRESS', ModifiedBy = ?, ModifiedDate = CURRENT_TIMESTAMP(6) WHERE IssueRequestID = ?`,
      [userId, assignment.RequestID]
    );

    await assignmentRepository.createHistory({
      AssignmentID: assignmentId,
      ActionUserID: userId,
      ActionTypeCode: 'WORK_STARTED',
      Remarks: 'Technician initiated field work execution',
      CreatedBy: userId
    });

    await issueHistoryRepository.create({
      IssueRequestID: assignment.RequestID,
      UserID: userId,
      FieldName: 'StatusCode',
      OldValue: 'ASSIGNED',
      NewValue: 'IN_PROGRESS',
      ActionTypeCode: 'WORK_STARTED',
      Remarks: 'Technician initiated field work execution'
    });

    return assignmentRepository.findById(assignmentId);
  },

  async pauseWork(assignmentId, pauseReason, userId = 1) {
    const assignment = await assignmentRepository.findById(assignmentId);
    if (!assignment) throw new AppError('Assignment not found', 404);

    await assignmentRepository.updateAssignment(assignmentId, {
      AssignmentStatusCode: 'PAUSED',
      ModifiedBy: userId
    });

    await assignmentRepository.createHistory({
      AssignmentID: assignmentId,
      ActionUserID: userId,
      ActionTypeCode: 'WORK_PAUSED',
      Remarks: pauseReason || 'Work paused by technician',
      CreatedBy: userId
    });

    return assignmentRepository.findById(assignmentId);
  },

  async completeWork(assignmentId, bodyOrNotes, userId = 1) {
    const assignment = await assignmentRepository.findById(assignmentId);
    if (!assignment) throw new AppError('Assignment not found', 404);

    const workNotes = typeof bodyOrNotes === 'string' ? bodyOrNotes : (bodyOrNotes?.workNotes || bodyOrNotes?.ResolutionSummary || 'Field work completed successfully by technician');
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const expectedRowVersion = typeof bodyOrNotes === 'object' ? (bodyOrNotes?.expectedRowVersion || bodyOrNotes?.RowVersion) : null;

    return await unitOfWork.execute(async (tx) => {
      await assignmentRepository.updateAssignment(assignmentId, {
        AssignmentStatusCode: 'COMPLETED',
        CompleteDateTime: now,
        ModifiedBy: userId
      }, tx);

      // Update IssueRequest status to RESOLVED with optimistic concurrency check
      await issueRequestRepository.update(assignment.RequestID, {
        StatusCode: 'RESOLVED',
        ActualResolutionDateTime: now,
        expectedRowVersion,
        ModifiedBy: userId
      }, tx);

      // If structured resolution details were provided, insert into Resolution table
      if (typeof bodyOrNotes === 'object' && bodyOrNotes !== null && bodyOrNotes.ResolutionSummary) {
        try {
          await tx.query(
            `INSERT INTO Resolution (IssueRequestID, ResolverUserID, ResolutionTypeCode, ResolutionSummary, ActionStepsTaken, VerificationNotes, CreatedBy)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              assignment.RequestID,
              userId,
              bodyOrNotes.ResolutionTypeCode || 'PERMANENT_FIX',
              bodyOrNotes.ResolutionSummary,
              bodyOrNotes.ActionStepsTaken || null,
              bodyOrNotes.VerificationNotes || null,
              userId
            ]
          );
        } catch (resErr) {
          console.warn('Optional Resolution insert warning:', resErr.message);
        }
      }

      await assignmentRepository.createHistory({
        AssignmentID: assignmentId,
        ActionUserID: userId,
        ActionTypeCode: 'WORK_COMPLETED',
        Remarks: workNotes,
        CreatedBy: userId
      }, tx);

      await issueHistoryRepository.create({
        IssueRequestID: assignment.RequestID,
        UserID: userId,
        FieldName: 'StatusCode',
        OldValue: 'IN_PROGRESS',
        NewValue: 'RESOLVED',
        ActionTypeCode: 'STATUS_CHANGED',
        Remarks: `Work completed by technician. ${workNotes}`
      }, tx);

      // Stop SLA clock on resolution
      try {
        await slaClockService.stopClockForIssue(assignment.RequestID, userId);
      } catch (slaErr) {
        console.warn('SLA Clock stop notice on resolution:', slaErr.message);
      }

      // Enqueue notification via Transactional Outbox
      await outboxService.emit(tx, {
        aggregateType: 'IssueRequest',
        aggregateId: assignment.RequestID,
        eventType: 'ISSUE_RESOLVED',
        payload: {
          requestId: assignment.RequestID,
          remarks: workNotes,
          actorUserId: userId
        }
      });

      return assignmentRepository.findById(assignmentId);
    });
  },

  async escalateWork(assignmentId, { reason, details }, userId = 1) {
    const assignment = await assignmentRepository.findById(assignmentId);
    if (!assignment) throw new AppError('Assignment not found', 404);

    const remarks = `ESCALATED: ${reason || 'Technical escalation'}${details ? ` - ${details}` : ''}`;

    await assignmentRepository.updateAssignment(assignmentId, {
      AssignmentStatusCode: 'PAUSED',
      ModifiedBy: userId
    });

    await query(
      `UPDATE IssueRequest SET StatusCode = 'PENDING', PriorityCode = 'CRITICAL', ModifiedBy = ?, ModifiedDate = CURRENT_TIMESTAMP(6) WHERE IssueRequestID = ?`,
      [userId, assignment.RequestID]
    );

    await assignmentRepository.createHistory({
      AssignmentID: assignmentId,
      ActionUserID: userId,
      ActionTypeCode: 'ESCALATED',
      Remarks: remarks,
      CreatedBy: userId
    });

    // Notify Department Manager & Park Admin of escalation
    try {
      await notificationService.notifyEvent('REQUEST_ESCALATED', {
        requestId: assignment.RequestID,
        remarks,
        TriggeredByTable: 'Assignment',
        TriggeredByID: assignmentId
      }, userId);
    } catch (notifErr) {
      console.warn('Escalation notification notice:', notifErr.message);
    }

    return assignmentRepository.findById(assignmentId);
  },

  async getMyAssignedRequests(userId, params = {}) {
    return assignmentRepository.getAssignments({ ...params, assignedUserId: userId });
  }
};

export default assignmentService;
