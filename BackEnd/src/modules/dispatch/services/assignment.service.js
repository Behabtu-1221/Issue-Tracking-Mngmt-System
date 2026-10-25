import { query } from '../../../database/connection.js';
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

    // 1. Check if user is designated Manager of any department
    const [dept] = await query(
      `SELECT DepartmentID FROM Department WHERE ManagerUserID = ? AND IsDeleted = 0 LIMIT 1`,
      [userId]
    );
    if (dept) return dept.DepartmentID;

    // 2. Check EmployeeAssignment prioritized by manager/dispatcher roles
    const [emp] = await query(
      `SELECT ea.DepartmentID 
       FROM EmployeeAssignment ea 
       LEFT JOIN UserRole ur ON ea.UserID = ur.UserID 
       LEFT JOIN Role r ON ur.RoleID = r.RoleID 
       WHERE ea.UserID = ? AND ea.IsActive = 1 AND ea.IsDeleted = 0 
       ORDER BY (CASE WHEN r.RoleCode IN ('DEPARTMENT_MANAGER', 'MANAGER', 'DISPATCHER') THEN 1 ELSE 2 END) ASC 
       LIMIT 1`,
      [userId]
    );
    return emp ? emp.DepartmentID : null;
  },

  async isUserParkAdmin(userId) {
    if (!userId || userId === 1) return true;
    const [user] = await query(
      `SELECT u.UserID 
       FROM \`User\` u
       LEFT JOIN UserRole ur ON u.UserID = ur.UserID 
       LEFT JOIN Role r ON ur.RoleID = r.RoleID 
       WHERE u.UserID = ? 
         AND (r.RoleCode IN ('PARK_SUPER_ADMIN', 'PARK_ADMIN', 'SUPER_ADMIN') 
              OR u.UserTypeCode IN ('PARK_SUPER_ADMIN', 'PARK_ADMIN', 'SUPER_ADMIN'))`,
      [userId]
    );
    return Boolean(user);
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

  async manualAssign({ RequestID, AssignedUserID, AssignedTeamID, Remarks, expectedRowVersion }, actionUserId = 1) {
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

    // CRITICAL RULE: Request MUST be in APPROVED or NEW state before it can be assigned
    if (!['APPROVED', 'NEW'].includes(issue.StatusCode)) {
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
    const resolvedRowVersion = expectedRowVersion || Remarks?.expectedRowVersion || issue.RowVersion || null;

    const createdAssignmentId = await unitOfWork.execute(async (tx) => {
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
        expectedRowVersion: resolvedRowVersion,
        ModifiedBy: actionUserId
      }, tx);

      const assignTargetDesc = AssignedUserID ? `Technician ${technicianName} (#${AssignedUserID})` : `Technical Team '${teamName}' (#${AssignedTeamID})`;
      const assignRemarks = (typeof Remarks === 'string' ? Remarks : '') || `Assigned to ${assignTargetDesc} by department manager/dispatcher.`;

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
        OldValue: issue.StatusCode,
        NewValue: 'ASSIGNED',
        ActionTypeCode: 'ASSIGNED',
        Remarks: assignRemarks
      }, tx);

      // 8. Notify Assigned Technician / Team & Requester via Transactional Outbox
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

      return assignmentId;
    });

    // 9. Start / update SLA timers (after successful commit)
    try {
      await slaClockService.startClockForIssue(RequestID, 1, issue.PriorityCode || 'MEDIUM', actionUserId);
    } catch (slaErr) {
      console.warn('SLA Clock notice upon assignment:', slaErr.message);
    }

    return assignmentRepository.findById(createdAssignmentId);
  },

  async autoAssign(RequestID, actionUserId = 1) {
    if (!RequestID) {
      throw new AppError('RequestID is required', 400);
    }

    const issue = await issueRequestRepository.findById(RequestID);
    if (!issue) {
      throw new AppError(`Issue request with ID ${RequestID} not found`, 404);
    }

    if (!['APPROVED', 'NEW'].includes(issue.StatusCode)) {
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

    // Announce status change to Requester, Approvers, and Managers
    try {
      const issue = await issueRequestRepository.findById(assignment.RequestID);
      await notificationService.notifyEvent('REQUEST_STATUS_CHANGED', {
        issue,
        requestId: assignment.RequestID,
        status: 'IN_PROGRESS',
        remarks: 'Technician has arrived on site and initiated field execution.'
      }, userId);
    } catch (notifErr) {
      console.warn('[Dispatch] Start work notification notice:', notifErr.message);
    }

    return assignmentRepository.findById(assignmentId);
  },

  async pauseWork(assignmentId, pauseReasonOrData, userId = 1) {
    const assignment = await assignmentRepository.findById(assignmentId);
    if (!assignment) throw new AppError('Assignment not found', 404);

    const pauseReason = typeof pauseReasonOrData === 'string'
      ? pauseReasonOrData
      : (pauseReasonOrData?.pauseReason || pauseReasonOrData?.remarks || 'Work paused by technician');

    await assignmentRepository.updateAssignment(assignmentId, {
      AssignmentStatusCode: 'PAUSED',
      ModifiedBy: userId
    });

    // Update IssueRequest status to PENDING
    await query(
      `UPDATE IssueRequest SET StatusCode = 'PENDING', ModifiedBy = ?, ModifiedDate = CURRENT_TIMESTAMP(6) WHERE IssueRequestID = ?`,
      [userId, assignment.RequestID]
    );

    await assignmentRepository.createHistory({
      AssignmentID: assignmentId,
      ActionUserID: userId,
      ActionTypeCode: 'WORK_PAUSED',
      Remarks: pauseReason,
      CreatedBy: userId
    });

    await issueHistoryRepository.create({
      IssueRequestID: assignment.RequestID,
      UserID: userId,
      FieldName: 'StatusCode',
      OldValue: 'IN_PROGRESS',
      NewValue: 'PENDING',
      ActionTypeCode: 'WORK_PAUSED',
      Remarks: `Work paused by technician: ${pauseReason}`
    });

    // Announce pause to Requester and Approver(s)
    try {
      const issue = await issueRequestRepository.findById(assignment.RequestID);
      await notificationService.notifyEvent('REQUEST_STATUS_CHANGED', {
        issue,
        requestId: assignment.RequestID,
        status: 'PENDING',
        remarks: `Work paused by technician: ${pauseReason}`
      }, userId);
    } catch (notifErr) {
      console.warn('[Dispatch] Pause work notification notice:', notifErr.message);
    }

    return assignmentRepository.findById(assignmentId);
  },

  async resumeWork(assignmentId, resumeData = {}, userId = 1) {
    const assignment = await assignmentRepository.findById(assignmentId);
    if (!assignment) throw new AppError('Assignment not found', 404);

    const remarks = typeof resumeData === 'string'
      ? resumeData
      : (resumeData?.remarks || resumeData?.notes || 'Technician resumed field work execution');

    await assignmentRepository.updateAssignment(assignmentId, {
      AssignmentStatusCode: 'IN_PROGRESS',
      ModifiedBy: userId
    });

    await query(
      `UPDATE IssueRequest SET StatusCode = 'IN_PROGRESS', ModifiedBy = ?, ModifiedDate = CURRENT_TIMESTAMP(6) WHERE IssueRequestID = ?`,
      [userId, assignment.RequestID]
    );

    await assignmentRepository.createHistory({
      AssignmentID: assignmentId,
      ActionUserID: userId,
      ActionTypeCode: 'WORK_RESUMED',
      Remarks: remarks,
      CreatedBy: userId
    });

    await issueHistoryRepository.create({
      IssueRequestID: assignment.RequestID,
      UserID: userId,
      FieldName: 'StatusCode',
      OldValue: 'PENDING',
      NewValue: 'IN_PROGRESS',
      ActionTypeCode: 'WORK_RESUMED',
      Remarks: `Work execution resumed: ${remarks}`
    });

    // Announce resumption to Requester and Approver(s)
    try {
      const issue = await issueRequestRepository.findById(assignment.RequestID);
      await notificationService.notifyEvent('REQUEST_STATUS_CHANGED', {
        issue,
        requestId: assignment.RequestID,
        status: 'IN_PROGRESS',
        remarks: `Work execution resumed by technician: ${remarks}`
      }, userId);
    } catch (notifErr) {
      console.warn('[Dispatch] Resume work notification notice:', notifErr.message);
    }

    return assignmentRepository.findById(assignmentId);
  },

  async updateProgress(assignmentId, progressData = {}, userId = 1) {
    const assignment = await assignmentRepository.findById(assignmentId);
    if (!assignment) throw new AppError('Assignment not found', 404);

    const rawPct = progressData.progressPercentage ?? progressData.percentage ?? 0;
    const progressPercentage = Math.min(100, Math.max(0, Number(rawPct)));
    const milestone = (progressData.milestone || progressData.progressMilestone || 'Field Work Execution').trim();
    const remarks = (progressData.remarks || progressData.notes || progressData.workNotes || 'Technician posted field progress update').trim();
    const estimatedCompletion = progressData.estimatedCompletion || null;
    const timeSpentMinutes = progressData.timeSpentMinutes ? Number(progressData.timeSpentMinutes) : null;

    const issue = await issueRequestRepository.findById(assignment.RequestID);
    if (!issue) throw new AppError('Associated issue request not found', 404);

    let customData = {};
    try {
      customData = typeof issue.CustomFieldsDataJson === 'string'
        ? JSON.parse(issue.CustomFieldsDataJson)
        : (issue.CustomFieldsDataJson || {});
    } catch (e) {
      customData = {};
    }

    const previousProgress = customData.progressPercentage || 0;
    customData.progressPercentage = progressPercentage;
    customData.progressMilestone = milestone;
    customData.latestProgressNotes = remarks;
    customData.lastProgressUpdatedAt = new Date().toISOString();
    customData.lastProgressUpdatedBy = userId;
    if (estimatedCompletion) customData.estimatedCompletion = estimatedCompletion;
    if (timeSpentMinutes) customData.totalTimeSpentMinutes = (customData.totalTimeSpentMinutes || 0) + timeSpentMinutes;

    // Ensure status is IN_PROGRESS if it was ASSIGNED, ACCEPTED, or PENDING
    let newStatusCode = issue.StatusCode;
    if (['ASSIGNED', 'ACCEPTED', 'PENDING'].includes(issue.StatusCode)) {
      newStatusCode = 'IN_PROGRESS';
      await assignmentRepository.updateAssignment(assignmentId, {
        AssignmentStatusCode: 'IN_PROGRESS',
        StartDateTime: assignment.StartDateTime || new Date().toISOString().slice(0, 19).replace('T', ' '),
        ModifiedBy: userId
      });
    }

    await query(
      `UPDATE IssueRequest 
       SET CustomFieldsDataJson = ?, 
           StatusCode = ?, 
           ModifiedBy = ?, 
           ModifiedDate = CURRENT_TIMESTAMP(6) 
       WHERE IssueRequestID = ?`,
      [JSON.stringify(customData), newStatusCode, userId, assignment.RequestID]
    );

    await assignmentRepository.createHistory({
      AssignmentID: assignmentId,
      ActionUserID: userId,
      ActionTypeCode: 'PROGRESS_UPDATED',
      Remarks: `Progress: ${progressPercentage}% (${milestone}). ${remarks}`,
      CreatedBy: userId
    });

    await issueHistoryRepository.create({
      IssueRequestID: assignment.RequestID,
      UserID: userId,
      FieldName: 'ProgressPercentage',
      OldValue: `${previousProgress}%`,
      NewValue: `${progressPercentage}% (${milestone})`,
      ActionTypeCode: 'PROGRESS_UPDATED',
      Remarks: remarks
    });

    // Real-Time Notification Broadcast to Requester & Approvers & Dept Manager
    try {
      const updatedIssue = await issueRequestRepository.findById(assignment.RequestID);
      const [tech] = await query('SELECT CONCAT(FirstName, " ", LastName) AS FullName FROM `User` WHERE UserID = ?', [userId]);
      const technicianName = tech?.FullName || 'Assigned Technician';

      await notificationService.notifyEvent('REQUEST_PROGRESS_UPDATED', {
        issue: updatedIssue,
        requestId: assignment.RequestID,
        progressPercentage,
        milestone,
        remarks,
        technicianName,
        status: newStatusCode
      }, userId);
    } catch (notifErr) {
      console.warn('[Dispatch] Progress update notification notice:', notifErr.message);
    }

    return {
      assignmentId,
      requestId: assignment.RequestID,
      progressPercentage,
      milestone,
      remarks,
      status: newStatusCode,
      customFields: customData
    };
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
