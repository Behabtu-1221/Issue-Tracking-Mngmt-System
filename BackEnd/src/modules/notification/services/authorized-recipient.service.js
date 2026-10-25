import { query } from '../../../database/connection.js';

export const authorizedRecipientService = {
  /**
   * Authoritatively determines the list of eligible, authorized recipient users
   * for a specific business notification event.
   *
   * @param {string} eventCode - Business event type code (e.g. 'ISSUE_CREATED', 'APPROVAL_REQUIRED', etc.)
   * @param {Object} contextData - Context attributes (e.g. { requestId, issue, approval, ... })
   * @param {number} actorUserId - User initiating the action
   * @returns {Promise<Array<{ userId: number, email: string, fullName: string, roleCode?: string }>>}
   */
  async resolveRecipients(eventCode, contextData = {}, actorUserId = null) {
    const recipientsMap = new Map(); // Keyed by UserID to eliminate duplicate recipients

    const addRecipient = (user) => {
      if (!user || !user.UserID) return;
      const uid = Number(user.UserID);
      if (!recipientsMap.has(uid)) {
        recipientsMap.set(uid, {
          userId: uid,
          email: user.Email || null,
          fullName: user.FullName || `${user.FirstName || ''} ${user.LastName || ''}`.trim() || 'User',
          roleCode: user.RoleCode || null
        });
      }
    };

    // 1. Fetch Authoritative Issue Context if requestId is present
    let issue = contextData.issue || null;
    const requestId = contextData.requestId || contextData.IssueRequestID || issue?.IssueRequestID;

    if (!issue && requestId) {
      const [found] = await query(
        `SELECT ir.*, d.DepartmentName, d.ManagerUserID, t.CompanyName AS TenantName,
                u.Email AS RequesterEmail, CONCAT(u.FirstName, ' ', u.LastName) AS RequesterName,
                u.TenantID AS RequesterTenantID
         FROM IssueRequest ir
         LEFT JOIN Department d ON ir.AssignedDepartmentID = d.DepartmentID
         LEFT JOIN Tenant t ON ir.TenantID = t.TenantID
         LEFT JOIN \`User\` u ON ir.RequesterUserID = u.UserID
         WHERE ir.IssueRequestID = ? AND ir.IsDeleted = 0`,
        [requestId]
      );
      issue = found;
    }

    const tenantId = issue?.TenantID || contextData.tenantId || null;
    const deptId = issue?.AssignedDepartmentID || contextData.departmentId || null;

    // Helper functions for role-based scoped queries
    const getRequester = async () => {
      if (!issue?.RequesterUserID) return null;
      const [u] = await query(
        `SELECT u.UserID, u.Email, CONCAT(u.FirstName, ' ', u.LastName) AS FullName, u.TenantID, 'REQUESTER' AS RoleCode
         FROM \`User\` u WHERE u.UserID = ? AND u.IsActive = 1 AND u.IsDeleted = 0`,
        [issue.RequesterUserID]
      );
      return u || null;
    };

    const getTenantRepresentatives = async (tId) => {
      if (!tId) return [];
      return await query(
        `SELECT u.UserID, u.Email, CONCAT(u.FirstName, ' ', u.LastName) AS FullName, r.RoleCode
         FROM \`User\` u
         JOIN UserRole ur ON u.UserID = ur.UserID
         JOIN Role r ON ur.RoleID = r.RoleID
         WHERE u.TenantID = ? AND r.RoleCode = 'TENANT_REPRESENTATIVE' AND u.IsActive = 1 AND u.IsDeleted = 0`,
        [tId]
      );
    };

    const getDepartmentManagers = async (dId) => {
      if (!dId) return [];
      return await query(
        `SELECT DISTINCT u.UserID, u.Email, CONCAT(u.FirstName, ' ', u.LastName) AS FullName, 'DEPARTMENT_MANAGER' AS RoleCode
         FROM \`User\` u
         LEFT JOIN Department d ON d.ManagerUserID = u.UserID AND d.DepartmentID = ?
         LEFT JOIN EmployeeAssignment ea ON ea.UserID = u.UserID AND ea.DepartmentID = ? AND ea.IsActive = 1 AND ea.IsDeleted = 0
         LEFT JOIN UserRole ur ON ur.UserID = u.UserID
         LEFT JOIN Role r ON ur.RoleID = r.RoleID AND r.RoleCode = 'DEPARTMENT_MANAGER'
         WHERE (d.DepartmentID IS NOT NULL OR (ea.DepartmentID IS NOT NULL AND r.RoleID IS NOT NULL))
           AND u.IsActive = 1 AND u.IsDeleted = 0`,
        [dId, dId]
      );
    };

    const getDepartmentDispatchers = async (dId) => {
      if (!dId) return [];
      return await query(
        `SELECT DISTINCT u.UserID, u.Email, CONCAT(u.FirstName, ' ', u.LastName) AS FullName, 'DISPATCHER' AS RoleCode
         FROM \`User\` u
         JOIN EmployeeAssignment ea ON ea.UserID = u.UserID AND ea.DepartmentID = ? AND ea.IsActive = 1 AND ea.IsDeleted = 0
         JOIN UserRole ur ON ur.UserID = u.UserID
         JOIN Role r ON ur.RoleID = r.RoleID AND r.RoleCode = 'DISPATCHER'
         WHERE u.IsActive = 1 AND u.IsDeleted = 0`,
        [dId]
      );
    };

    const getParkAdministrators = async () => {
      return await query(
        `SELECT DISTINCT u.UserID, u.Email, CONCAT(u.FirstName, ' ', u.LastName) AS FullName, 'PARK_ADMIN' AS RoleCode
         FROM \`User\` u
         LEFT JOIN UserRole ur ON ur.UserID = u.UserID
         LEFT JOIN Role r ON ur.RoleID = r.RoleID
         WHERE (r.RoleCode IN ('PARK_SUPER_ADMIN', 'PARK_ADMIN') OR u.UserTypeCode IN ('PARK_ADMIN', 'PARK_SUPER_ADMIN') OR u.UserID = 1)
           AND u.IsActive = 1 AND u.IsDeleted = 0`
      );
    };

    const getAssignedTechnicians = async (reqId) => {
      if (!reqId) return [];
      const [assignment] = await query(
        `SELECT a.AssignmentID, a.AssignedUserID, a.AssignedTeamID
         FROM Assignment a
         WHERE a.RequestID = ? AND a.IsDeleted = 0
         ORDER BY a.AssignmentID DESC LIMIT 1`,
        [reqId]
      );
      if (!assignment) return [];

      if (assignment.AssignedUserID) {
        return await query(
          `SELECT u.UserID, u.Email, CONCAT(u.FirstName, ' ', u.LastName) AS FullName, 'TECHNICIAN' AS RoleCode
           FROM \`User\` u WHERE u.UserID = ? AND u.IsActive = 1 AND u.IsDeleted = 0`,
          [assignment.AssignedUserID]
        );
      }

      if (assignment.AssignedTeamID) {
        return await query(
          `SELECT DISTINCT u.UserID, u.Email, CONCAT(u.FirstName, ' ', u.LastName) AS FullName, 'TECHNICIAN' AS RoleCode
           FROM TeamAssignment ta
           JOIN \`User\` u ON ta.UserID = u.UserID
           WHERE ta.TeamID = ? AND ta.IsActive = 1 AND ta.IsDeleted = 0 AND u.IsActive = 1`,
          [assignment.AssignedTeamID]
        );
      }
      return [];
    };

    const getRequestApprovers = async (reqId) => {
      if (!reqId) return [];
      try {
        return await query(
          `SELECT DISTINCT u.UserID, u.Email, CONCAT(u.FirstName, ' ', u.LastName) AS FullName, 'APPROVER' AS RoleCode
           FROM Approval a
           JOIN ApprovalStage ast ON a.ApprovalID = ast.ApprovalID
           LEFT JOIN ApprovalDecision ad ON ast.ApprovalStageID = ad.ApprovalStageID
           LEFT JOIN \`User\` u ON (u.UserID = ad.DecisionUserID OR u.UserID = ast.ApproverUserID)
           WHERE a.RequestID = ? AND u.UserID IS NOT NULL AND u.IsActive = 1 AND u.IsDeleted = 0`,
          [reqId]
        );
      } catch (err) {
        console.warn('getRequestApprovers error:', err.message);
        return [];
      }
    };

    // 2. Event-Specific Authoritative Resolution
    switch (eventCode) {
      case 'ISSUE_CREATED':
      case 'REQUEST_SUBMITTED': {
        // A. Confirm to Requester
        const requester = await getRequester();
        if (requester) addRecipient(requester);

        // B. Department Manager(s) of responsible department
        const deptMgrs = await getDepartmentManagers(deptId);
        deptMgrs.forEach(addRecipient);
        break;
      }

      case 'APPROVAL_REQUIRED': {
        // Stage 1: Department Manager Approval Required
        const deptMgrs = await getDepartmentManagers(deptId);
        deptMgrs.forEach(addRecipient);
        break;
      }

      case 'HIGHER_APPROVAL_REQUIRED': {
        // Stage 2: Business Park Administrator higher-level approval required
        const parkAdmins = await getParkAdministrators();
        parkAdmins.forEach(addRecipient);

        // Notify Requester of progression to executive review
        const requester = await getRequester();
        if (requester) addRecipient(requester);
        break;
      }

      case 'DEPARTMENT_APPROVED': {
        // A. Requester informed of Stage 1 sign-off
        const requester = await getRequester();
        if (requester) addRecipient(requester);

        // B. Administrators informed that request advanced to higher-level review
        const parkAdmins = await getParkAdministrators();
        parkAdmins.forEach(addRecipient);
        break;
      }

      case 'APPROVAL_COMPLETED':
      case 'ISSUE_APPROVED_FOR_DISPATCH': {
        // A. Requester informed that work is fully authorized
        const requester = await getRequester();
        if (requester) addRecipient(requester);

        // B. Responsible Department Manager & Dispatchers informed to dispatch work
        const deptMgrs = await getDepartmentManagers(deptId);
        deptMgrs.forEach(addRecipient);

        const dispatchers = await getDepartmentDispatchers(deptId);
        dispatchers.forEach(addRecipient);
        break;
      }

      case 'APPROVAL_REJECTED':
      case 'DEPARTMENT_REJECTED': {
        // Requester informed of rejection
        const requester = await getRequester();
        if (requester) addRecipient(requester);
        break;
      }

      case 'ISSUE_ASSIGNED': {
        // A. Assigned Technician(s) or Team members
        const techs = await getAssignedTechnicians(requestId);
        techs.forEach(addRecipient);

        // Also add explicitly passed assigned user if freshly assigned
        if (contextData.assignedUserId) {
          const [u] = await query(
            `SELECT u.UserID, u.Email, CONCAT(u.FirstName, ' ', u.LastName) AS FullName, 'TECHNICIAN' AS RoleCode
             FROM \`User\` u WHERE u.UserID = ? AND u.IsActive = 1 AND u.IsDeleted = 0`,
            [contextData.assignedUserId]
          );
          if (u) addRecipient(u);
        }

        // B. Requester informed that technician is assigned
        const requester = await getRequester();
        if (requester) addRecipient(requester);

        // C. Department Manager
        const deptMgrs = await getDepartmentManagers(deptId);
        deptMgrs.forEach(addRecipient);
        break;
      }

      case 'ASSIGNMENT_REASSIGNED': {
        // A. Newly assigned technician
        const techs = await getAssignedTechnicians(requestId);
        techs.forEach(addRecipient);

        // B. Previously assigned technician (if passed)
        if (contextData.previousUserId) {
          const [prev] = await query(
            `SELECT u.UserID, u.Email, CONCAT(u.FirstName, ' ', u.LastName) AS FullName, 'TECHNICIAN' AS RoleCode
             FROM \`User\` u WHERE u.UserID = ? AND u.IsActive = 1 AND u.IsDeleted = 0`,
            [contextData.previousUserId]
          );
          if (prev) addRecipient(prev);
        }

        // C. Requester
        const requester = await getRequester();
        if (requester) addRecipient(requester);
        break;
      }

      case 'REQUEST_STATUS_CHANGED': {
        // Requester informed of all status transitions
        const requester = await getRequester();
        if (requester) addRecipient(requester);

        // Approvers informed of progress and status changes
        const approvers = await getRequestApprovers(requestId);
        approvers.forEach(addRecipient);

        // Department Manager informed
        const deptMgrs = await getDepartmentManagers(deptId);
        deptMgrs.forEach(addRecipient);

        // Assigned technicians informed
        const techs = await getAssignedTechnicians(requestId);
        techs.forEach(addRecipient);
        break;
      }

      case 'REQUEST_PROGRESS_UPDATED': {
        // Requester informed of real-time progress update
        const requester = await getRequester();
        if (requester) addRecipient(requester);

        // Approvers informed of field work execution progress
        const approvers = await getRequestApprovers(requestId);
        approvers.forEach(addRecipient);

        // Department Manager informed
        const deptMgrs = await getDepartmentManagers(deptId);
        deptMgrs.forEach(addRecipient);

        // Technicians
        const techs = await getAssignedTechnicians(requestId);
        techs.forEach(addRecipient);
        break;
      }

      case 'ISSUE_RESOLVED': {
        // Requester informed to verify resolution
        const requester = await getRequester();
        if (requester) addRecipient(requester);

        // Approvers informed of resolution
        const approvers = await getRequestApprovers(requestId);
        approvers.forEach(addRecipient);

        // Department Manager informed
        const deptMgrs = await getDepartmentManagers(deptId);
        deptMgrs.forEach(addRecipient);

        // Assigned technicians
        const techs = await getAssignedTechnicians(requestId);
        techs.forEach(addRecipient);
        break;
      }

      case 'REQUEST_CLOSED': {
        // Requester informed of closure
        const requester = await getRequester();
        if (requester) addRecipient(requester);

        // Approvers informed of closure
        const approvers = await getRequestApprovers(requestId);
        approvers.forEach(addRecipient);

        // Department Manager informed
        const deptMgrs = await getDepartmentManagers(deptId);
        deptMgrs.forEach(addRecipient);

        // Assigned technicians
        const techs = await getAssignedTechnicians(requestId);
        techs.forEach(addRecipient);
        break;
      }

      case 'REQUEST_CANCELLED': {
        const requester = await getRequester();
        if (requester) addRecipient(requester);

        const approvers = await getRequestApprovers(requestId);
        approvers.forEach(addRecipient);

        const deptMgrs = await getDepartmentManagers(deptId);
        deptMgrs.forEach(addRecipient);

        const techs = await getAssignedTechnicians(requestId);
        techs.forEach(addRecipient);
        break;
      }

      case 'REQUEST_REOPENED': {
        const deptMgrs = await getDepartmentManagers(deptId);
        deptMgrs.forEach(addRecipient);

        const dispatchers = await getDepartmentDispatchers(deptId);
        dispatchers.forEach(addRecipient);
        break;
      }

      case 'SLA_WARNING': {
        // Assigned technician & department dispatchers / managers
        const techs = await getAssignedTechnicians(requestId);
        techs.forEach(addRecipient);

        const deptMgrs = await getDepartmentManagers(deptId);
        deptMgrs.forEach(addRecipient);

        const dispatchers = await getDepartmentDispatchers(deptId);
        dispatchers.forEach(addRecipient);
        break;
      }

      case 'SLA_BREACH': {
        // Assigned technician, department manager, and Park Admin
        const techs = await getAssignedTechnicians(requestId);
        techs.forEach(addRecipient);

        const deptMgrs = await getDepartmentManagers(deptId);
        deptMgrs.forEach(addRecipient);

        const parkAdmins = await getParkAdministrators();
        parkAdmins.forEach(addRecipient);
        break;
      }

      case 'NEW_COMMENT': {
        // Requester, assigned technician, and department manager
        const requester = await getRequester();
        if (requester) addRecipient(requester);

        const techs = await getAssignedTechnicians(requestId);
        techs.forEach(addRecipient);

        const deptMgrs = await getDepartmentManagers(deptId);
        deptMgrs.forEach(addRecipient);
        break;
      }

      case 'SYSTEM_ANNOUNCEMENT': {
        // If tenantId specified, only users of that tenant; otherwise all active users or admins
        if (tenantId) {
          const tenantUsers = await query(
            `SELECT u.UserID, u.Email, CONCAT(u.FirstName, ' ', u.LastName) AS FullName
             FROM \`User\` u WHERE u.TenantID = ? AND u.IsActive = 1 AND u.IsDeleted = 0`,
            [tenantId]
          );
          tenantUsers.forEach(addRecipient);
        } else {
          const parkAdmins = await getParkAdministrators();
          parkAdmins.forEach(addRecipient);
        }
        break;
      }

      default: {
        // Fallback: if explicit recipientUserIds provided, validate their existence
        if (Array.isArray(contextData.recipientUserIds)) {
          const explicitUsers = await query(
            `SELECT u.UserID, u.Email, CONCAT(u.FirstName, ' ', u.LastName) AS FullName
             FROM \`User\` u WHERE u.UserID IN (?) AND u.IsActive = 1 AND u.IsDeleted = 0`,
            [contextData.recipientUserIds.length > 0 ? contextData.recipientUserIds : [0]]
          );
          explicitUsers.forEach(addRecipient);
        }
        break;
      }
    }

    // 3. STRICT MULTI-TENANT ISOLATION CHECK
    // If the request belongs to a specific tenant, ensure NO tenant user belonging to a
    // different tenant can ever receive this notification.
    const results = [];
    for (const [, user] of recipientsMap.entries()) {
      // Don't notify the actor of their own direct action, EXCEPT for request submission confirmation
      if (actorUserId && user.userId === Number(actorUserId) && eventCode !== 'ISSUE_CREATED' && eventCode !== 'REQUEST_SUBMITTED') {
        continue;
      }

      // Check tenant isolation: If user is a tenant user (has a TenantID), it MUST match the issue's TenantID
      if (tenantId) {
        const [uRecord] = await query(`SELECT TenantID, UserTypeCode FROM \`User\` WHERE UserID = ?`, [user.userId]);
        if (uRecord && uRecord.TenantID && Number(uRecord.TenantID) !== Number(tenantId)) {
          // BOLA / Cross-Tenant Breach Prevented!
          console.warn(`[Security Alert] Blocked cross-tenant notification recipient UserID ${user.userId} (Tenant ${uRecord.TenantID}) for Request Tenant ${tenantId}`);
          continue;
        }
      }

      results.push(user);
    }

    return results;
  }
};

export default authorizedRecipientService;
