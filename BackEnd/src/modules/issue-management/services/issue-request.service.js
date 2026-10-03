import issueRequestRepository from '../repositories/issue-request.repository.js';
import issueHistoryRepository from '../repositories/issue-history.repository.js';
import serviceGovernanceRepository from '../../service-catalog/repositories/service-governance.repository.js';
import serviceCategoryMappingRepository from '../../service-catalog/repositories/service-category-mapping.repository.js';
import { slaClockService } from '../../sla/services/sla-clock.service.js';
import { approvalService } from '../../approval/services/approval.service.js';
import { notificationService } from '../../notification/services/notification.service.js';
import AppError from '../../../shared/errors/AppError.js';
import { query } from '../../../database/connection.js';

export const issueRequestService = {
  async getOverviewMetrics(tenantId) {
    return issueRequestRepository.getOverviewMetrics(tenantId);
  },

  async getIssues(params, dataScope) {
    const mergedParams = typeof params === 'object' && params !== null ? { ...params } : {};
    if (dataScope && !mergedParams.dataScope) {
      mergedParams.dataScope = dataScope;
    }
    return issueRequestRepository.findAll(mergedParams);
  },

  async getIssueById(id, dataScope) {
    const issue = await issueRequestRepository.findById(id, dataScope);
    if (!issue) {
      throw new AppError(`Issue request with ID ${id} not found`, 404);
    }

    // Attach timeline history
    const history = await issueHistoryRepository.findByIssueRequestId(id);
    return {
      ...issue,
      timelineHistory: history || []
    };
  },

  async createIssue(data, userId) {
    const requesterId = data.RequesterUserID || userId || 1;
    let assignedDeptId = data.AssignedDepartmentID || null;
    let resolvedDeptName = null;
    let categoryCode = data.CategoryCode || null;
    let estimatedCost = data.EstimatedCost !== undefined ? data.EstimatedCost : null;

    // 1. Resolve Service details (ServiceCategoryID, CategoryCode, EstimatedCost) if ServiceID provided
    if (data.ServiceID) {
      try {
        const [svc] = await query(
          `SELECT s.ServiceID, s.ServiceCategoryID, s.EstimatedCost, sc.CategoryCode, sc.CategoryName
           FROM Service s
           LEFT JOIN ServiceCategory sc ON s.ServiceCategoryID = sc.ServiceCategoryID
           WHERE s.ServiceID = ? AND s.IsDeleted = 0`,
          [data.ServiceID]
        );
        if (svc) {
          if (!categoryCode && svc.CategoryCode) {
            categoryCode = svc.CategoryCode;
          }
          if (estimatedCost === null && svc.EstimatedCost !== null) {
            estimatedCost = Number(svc.EstimatedCost);
          }
        }
      } catch (svcErr) {
        console.warn('Service lookup notice:', svcErr.message);
      }
    }

    // 2. Department Resolution: Check servicedepartment mapping table
    if (!assignedDeptId && data.ServiceID) {
      try {
        const [sd] = await query(
          `SELECT sd.DepartmentID, d.DepartmentName, d.DepartmentCode
           FROM servicedepartment sd
           JOIN Department d ON sd.DepartmentID = d.DepartmentID
           WHERE sd.ServiceID = ? AND sd.IsActive = 1 AND sd.IsDeleted = 0
           ORDER BY sd.IsPrimary DESC
           LIMIT 1`,
          [data.ServiceID]
        );
        if (sd && sd.DepartmentID) {
          assignedDeptId = sd.DepartmentID;
          resolvedDeptName = sd.DepartmentName;
        }
      } catch (deptErr) {
        console.warn('Service department lookup notice:', deptErr.message);
      }
    }

    // Fallback if still no department: check requester's department or default to Facilities Management (Dept 1)
    if (!assignedDeptId) {
      try {
        const [emp] = await query(`SELECT DepartmentID FROM EmployeeAssignment WHERE UserID = ? AND IsActive = 1 AND IsDeleted = 0 LIMIT 1`, [requesterId]);
        if (emp && emp.DepartmentID) {
          assignedDeptId = emp.DepartmentID;
        }
      } catch (empErr) {
        console.warn('Employee dept fallback notice:', empErr.message);
      }
    }
    if (!assignedDeptId) {
      assignedDeptId = 1; // Facilities Management
    }

    if (!resolvedDeptName && assignedDeptId) {
      try {
        const [d] = await query(`SELECT DepartmentName FROM Department WHERE DepartmentID = ?`, [assignedDeptId]);
        if (d) resolvedDeptName = d.DepartmentName;
      } catch (dErr) {
        console.warn('Dept name lookup notice:', dErr.message);
      }
    }

    if (!categoryCode) {
      categoryCode = 'FACILITIES';
    }

    // Mandatory workflow: Every submitted request requires Department Manager review & approval
    const initialStatus = 'PENDING_APPROVAL';

    const newIssue = await issueRequestRepository.create({
      ...data,
      CategoryCode: categoryCode,
      AssignedDepartmentID: assignedDeptId,
      StatusCode: initialStatus,
      RequesterUserID: requesterId,
      CreatedBy: userId || requesterId
    });

    // Record audit trail history
    const routingInfo = resolvedDeptName ? ` Automatically routed to ${resolvedDeptName}.` : (assignedDeptId ? ` Assigned to department #${assignedDeptId}.` : '');
    await issueHistoryRepository.create({
      IssueRequestID: newIssue.IssueRequestID,
      UserID: userId || requesterId,
      ActionTypeCode: 'ISSUE_SUBMITTED',
      Remarks: `Issue request '${newIssue.RequestNumber}' submitted.` + routingInfo + ' Initiated multi-level approval governance.'
    });

    // Trigger Automated Approval Workflow (evaluates 1-stage routine or 2-stage multi-level workflow)
    try {
      await approvalService.createApprovalWorkflow({
        RequestID: newIssue.IssueRequestID
      }, userId || requesterId);
    } catch (apprErr) {
      console.warn('Approval workflow auto-trigger notice:', apprErr.message);
    }

    // Trigger Centralized Notification Event
    try {
      await notificationService.notifyEvent('ISSUE_CREATED', {
        issue: newIssue,
        requestId: newIssue.IssueRequestID,
        title: newIssue.Title,
        requestNumber: newIssue.RequestNumber,
        departmentName: resolvedDeptName,
        priority: newIssue.PriorityCode
      }, userId || requesterId);
    } catch (notifErr) {
      console.warn('Issue creation notification notice:', notifErr.message);
    }

    return newIssue;
  },

  async updateIssue(id, data, userId) {
    const existing = await issueRequestRepository.findById(id);
    if (!existing) {
      throw new AppError(`Issue request with ID ${id} not found`, 404);
    }

    // Business Rule: Closed issues are read-only unless reopened
    if (existing.StatusCode === 'CLOSED' && data.StatusCode !== 'NEW' && data.StatusCode !== 'ASSIGNED' && data.StatusCode !== 'IN_PROGRESS') {
      throw new AppError('Closed issue requests are read-only and cannot be modified unless explicitly reopened.', 400);
    }

    const updated = await issueRequestRepository.update(id, { ...data, ModifiedBy: userId });

    // Record audit trail if status changed
    if (data.StatusCode && data.StatusCode !== existing.StatusCode) {
      await issueHistoryRepository.create({
        IssueRequestID: id,
        UserID: userId || 1,
        FieldName: 'StatusCode',
        OldValue: existing.StatusCode,
        NewValue: data.StatusCode,
        ActionTypeCode: 'STATUS_CHANGED',
        Remarks: `Issue status updated from ${existing.StatusCode} to ${data.StatusCode}`
      });
    }

    // Record audit trail if assigned department changed
    if (data.AssignedDepartmentID && Number(data.AssignedDepartmentID) !== Number(existing.AssignedDepartmentID)) {
      await issueHistoryRepository.create({
        IssueRequestID: id,
        UserID: userId || 1,
        FieldName: 'AssignedDepartmentID',
        OldValue: existing.AssignedDepartmentID ? String(existing.AssignedDepartmentID) : 'None',
        NewValue: String(data.AssignedDepartmentID),
        ActionTypeCode: 'ASSIGNED',
        Remarks: `Assigned to department ID ${data.AssignedDepartmentID}`
      });
    }

    return updated;
  },

  async assignIssue(id, { assignedDepartmentId, remarks }, userId) {
    const existing = await issueRequestRepository.findById(id);
    if (!existing) {
      throw new AppError(`Issue request with ID ${id} not found`, 404);
    }

    const nextStatus = existing.StatusCode === 'NEW' ? 'ASSIGNED' : existing.StatusCode;
    const updated = await issueRequestRepository.update(id, {
      AssignedDepartmentID: assignedDepartmentId,
      StatusCode: nextStatus,
      ModifiedBy: userId
    });

    await issueHistoryRepository.create({
      IssueRequestID: id,
      UserID: userId || 1,
      FieldName: 'AssignedDepartmentID',
      OldValue: existing.AssignedDepartmentID ? String(existing.AssignedDepartmentID) : 'Unassigned',
      NewValue: String(assignedDepartmentId),
      ActionTypeCode: 'ASSIGNED',
      Remarks: remarks || `Assigned to department ID ${assignedDepartmentId}`
    });

    return updated;
  },

  async updateStatus(id, statusCode, remarks, userId) {
    const existing = await issueRequestRepository.findById(id);
    if (!existing) {
      throw new AppError(`Issue request with ID ${id} not found`, 404);
    }

    const payload = { StatusCode: statusCode, ModifiedBy: userId };
    if (statusCode === 'RESOLVED') {
      payload.ActualResolutionDateTime = new Date();
    } else if (statusCode === 'CLOSED') {
      payload.ClosedDateTime = new Date();
    }

    const updated = await issueRequestRepository.update(id, payload);

    await issueHistoryRepository.create({
      IssueRequestID: id,
      UserID: userId || 1,
      FieldName: 'StatusCode',
      OldValue: existing.StatusCode,
      NewValue: statusCode,
      ActionTypeCode: 'STATUS_CHANGED',
      Remarks: remarks || `Status changed to ${statusCode}`
    });

    // Centralized Notification on status transition
    try {
      if (statusCode === 'RESOLVED') {
        await notificationService.notifyEvent('ISSUE_RESOLVED', {
          issue: updated,
          requestId: id,
          remarks
        }, userId);
      } else if (statusCode === 'CLOSED') {
        await notificationService.notifyEvent('REQUEST_CLOSED', {
          issue: updated,
          requestId: id,
          remarks
        }, userId);
      } else {
        await notificationService.notifyEvent('REQUEST_STATUS_CHANGED', {
          issue: updated,
          requestId: id,
          status: statusCode,
          remarks
        }, userId);
      }
    } catch (notifErr) {
      console.warn('Status change notification notice:', notifErr.message);
    }

    return updated;
  },

  async cancelIssue(id, cancellationReason, userId) {
    const existing = await issueRequestRepository.findById(id);
    if (!existing) {
      throw new AppError(`Issue request with ID ${id} not found`, 404);
    }

    if (existing.StatusCode === 'CLOSED' || existing.StatusCode === 'RESOLVED') {
      throw new AppError(`Cannot cancel issue request '${existing.RequestNumber}' because it is already ${existing.StatusCode}.`, 400);
    }

    const updated = await issueRequestRepository.update(id, {
      StatusCode: 'CANCELLED',
      CancellationReason: cancellationReason || 'Cancelled by user',
      ModifiedBy: userId
    });

    await issueHistoryRepository.create({
      IssueRequestID: id,
      UserID: userId || 1,
      FieldName: 'StatusCode',
      OldValue: existing.StatusCode,
      NewValue: 'CANCELLED',
      ActionTypeCode: 'STATUS_CHANGED',
      Remarks: `Issue cancelled. Reason: ${cancellationReason || 'Not specified'}`
    });

    try {
      await notificationService.notifyEvent('REQUEST_CANCELLED', {
        issue: updated,
        requestId: id,
        remarks: cancellationReason
      }, userId);
    } catch (notifErr) {
      console.warn('Cancel notification notice:', notifErr.message);
    }

    return updated;
  },

  async reopenIssue(id, remarks, userId) {
    const existing = await issueRequestRepository.findById(id);
    if (!existing) {
      throw new AppError(`Issue request with ID ${id} not found`, 404);
    }

    const updated = await issueRequestRepository.update(id, {
      StatusCode: 'IN_PROGRESS',
      ModifiedBy: userId
    });

    await issueHistoryRepository.create({
      IssueRequestID: id,
      UserID: userId || 1,
      FieldName: 'StatusCode',
      OldValue: existing.StatusCode,
      NewValue: 'IN_PROGRESS',
      ActionTypeCode: 'ISSUE_REOPENED',
      Remarks: remarks || 'Issue reopened by user'
    });

    try {
      await notificationService.notifyEvent('REQUEST_REOPENED', {
        issue: updated,
        requestId: id,
        remarks
      }, userId);
    } catch (notifErr) {
      console.warn('Reopen notification notice:', notifErr.message);
    }

    return updated;
  },

  async submitFeedback(id, feedbackData, actor) {
    const issue = await issueRequestRepository.findById(id);
    if (!issue) {
      throw new AppError(`Issue request with ID ${id} not found`, 404);
    }

    const isParkAdmin = ['SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN'].includes((actor?.userTypeCode || '').toUpperCase());
    if (!isParkAdmin && actor?.tenantId && Number(issue.TenantID) !== Number(actor.tenantId)) {
      throw new AppError(`Issue request with ID ${id} not found`, 404);
    }

    const status = (issue.StatusCode || '').toUpperCase();
    if (status !== 'RESOLVED' && status !== 'CLOSED') {
      throw new AppError('Feedback can only be submitted for resolved or closed requests', 400);
    }

    const [existingFeedback] = await query(
      `SELECT FeedbackID FROM IssueRequestFeedback WHERE IssueRequestID = ? AND IsDeleted = 0`,
      [id]
    );

    if (existingFeedback) {
      throw new AppError('Feedback has already been submitted for this request', 409);
    }

    const rating = Math.min(Math.max(Number(feedbackData.Rating) || 5, 1), 5);
    const timeliness = feedbackData.TimelinessRating ? Math.min(Math.max(Number(feedbackData.TimelinessRating), 1), 5) : null;
    const quality = feedbackData.QualityRating ? Math.min(Math.max(Number(feedbackData.QualityRating), 1), 5) : null;
    const resolutionConfirmed = feedbackData.ResolutionConfirmed !== undefined ? (feedbackData.ResolutionConfirmed ? 1 : 0) : 1;

    await query(
      `INSERT INTO IssueRequestFeedback (
        IssueRequestID, TenantID, SubmittedByUserID, Rating, ResolutionConfirmed, Comments, TimelinessRating, QualityRating, CreatedBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        issue.TenantID,
        actor?.userId || 1,
        rating,
        resolutionConfirmed,
        feedbackData.Comments || null,
        timeliness,
        quality,
        actor?.userId || 1
      ]
    );

    if (resolutionConfirmed === 1 && status === 'RESOLVED') {
      await issueRequestRepository.update(id, {
        StatusCode: 'CLOSED',
        ClosedDateTime: new Date(),
        ModifiedBy: actor?.userId || 1
      });

      await issueHistoryRepository.create({
        IssueRequestID: id,
        UserID: actor?.userId || 1,
        FieldName: 'StatusCode',
        OldValue: 'RESOLVED',
        NewValue: 'CLOSED',
        ActionTypeCode: 'ISSUE_CLOSED',
        Remarks: `Issue automatically closed after tenant satisfaction feedback submission (Rating: ${rating}/5).`
      });
    }

    const [created] = await query(
      `SELECT f.*, CONCAT(u.FirstName, ' ', u.LastName) AS SubmittedByName
       FROM IssueRequestFeedback f
       JOIN \`User\` u ON f.SubmittedByUserID = u.UserID
       WHERE f.IssueRequestID = ? AND f.IsDeleted = 0`,
      [id]
    );

    return created;
  },

  async getFeedback(id, actor) {
    const issue = await issueRequestRepository.findById(id);
    if (!issue) {
      throw new AppError(`Issue request with ID ${id} not found`, 404);
    }

    const isParkAdmin = ['SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN'].includes((actor?.userTypeCode || '').toUpperCase());
    if (!isParkAdmin && actor?.tenantId && Number(issue.TenantID) !== Number(actor.tenantId)) {
      throw new AppError(`Issue request with ID ${id} not found`, 404);
    }

    const [feedback] = await query(
      `SELECT f.*, CONCAT(u.FirstName, ' ', u.LastName) AS SubmittedByName
       FROM IssueRequestFeedback f
       JOIN \`User\` u ON f.SubmittedByUserID = u.UserID
       WHERE f.IssueRequestID = ? AND f.IsDeleted = 0`,
      [id]
    );

    return feedback || null;
  },

  async deleteIssue(id, userId) {
    const existing = await issueRequestRepository.findById(id);
    if (!existing) {
      throw new AppError(`Issue request with ID ${id} not found`, 404);
    }

    await issueRequestRepository.softDelete(id, userId);
    return { message: `Issue request '${existing.RequestNumber}' deleted successfully.` };
  }
};

export default issueRequestService;
