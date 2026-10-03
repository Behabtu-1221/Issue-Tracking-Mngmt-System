import { query } from '../../../database/connection.js';

export const approvalRuleEngineService = {
  /**
   * Evaluates an issue request to determine its required approval stages.
   * Routine requests:
   *   Stage 1: Department Manager Approval
   * High-impact / higher-level requests:
   *   Stage 1: Department Manager Approval
   *   Stage 2: Business Park Administrator Approval
   *
   * @param {Object} issueData - Issue request attributes
   * @returns {Promise<{ requiresHigherApproval: boolean, reasons: string[], stages: Array, totalStages: number }>}
   */
  async evaluateApprovalWorkflow(issueData) {
    const reasons = [];
    let requiresHigherApproval = false;

    const estimatedCost = Number(issueData.EstimatedCost || 0);
    const priority = (issueData.PriorityCode || 'MEDIUM').toUpperCase();
    const isMajor = Boolean(issueData.IsMajorIncident);
    const serviceId = issueData.ServiceID ? Number(issueData.ServiceID) : null;
    const tenantId = issueData.TenantID ? Number(issueData.TenantID) : null;
    const deptId = issueData.AssignedDepartmentID ? Number(issueData.AssignedDepartmentID) : null;

    // 1. Check Priority Level (CRITICAL / HIGH)
    if (priority === 'CRITICAL') {
      requiresHigherApproval = true;
      reasons.push('Critical priority incident requires Business Park Administrator authorization.');
    } else if (priority === 'HIGH') {
      requiresHigherApproval = true;
      reasons.push('High priority service request requires Business Park Administrator oversight.');
    }

    // 2. Check Major Incident Flag
    if (isMajor) {
      requiresHigherApproval = true;
      reasons.push('Designated Major Incident requires Business Park Administrator sign-off.');
    }

    // 3. Check Cost Thresholds (Database-driven via ApprovalThreshold or fallback threshold)
    let costThreshold = 5000; // Default 5,000 threshold
    try {
      const thresholdRows = await query(
        `SELECT * FROM ApprovalThreshold 
         WHERE IsDeleted = 0 
           AND (TenantID = ? OR TenantID IS NULL)
         ORDER BY MaxAutoApproveAmount ASC`,
        [tenantId]
      );

      if (thresholdRows && thresholdRows.length > 0) {
        for (const t of thresholdRows) {
          const maxAuto = Number(t.MaxAutoApproveAmount || 0);
          if (estimatedCost > maxAuto) {
            requiresHigherApproval = true;
            reasons.push(`Estimated cost (${estimatedCost.toLocaleString()} ${t.CurrencyCode || 'ETB'}) exceeds auto-approve limit of ${maxAuto.toLocaleString()} ${t.CurrencyCode || 'ETB'}.`);
            break;
          }
        }
      } else if (estimatedCost >= costThreshold) {
        requiresHigherApproval = true;
        reasons.push(`Estimated cost (${estimatedCost.toLocaleString()}) exceeds standard policy threshold of ${costThreshold.toLocaleString()}.`);
      }
    } catch (err) {
      console.warn('ApprovalThreshold evaluation notice:', err.message);
      if (estimatedCost >= costThreshold) {
        requiresHigherApproval = true;
        reasons.push(`Estimated cost exceeds standard policy threshold (${costThreshold.toLocaleString()}).`);
      }
    }

    // 4. Check Service-Specific Governance Rules
    if (serviceId) {
      try {
        const [serviceRule] = await query(
          `SELECT * FROM ServiceApprovalRule 
           WHERE ServiceID = ? AND IsActive = 1 AND IsDeleted = 0 
           LIMIT 1`,
          [serviceId]
        );

        if (serviceRule) {
          if (serviceRule.RequiredStagesCount >= 2) {
            requiresHigherApproval = true;
            reasons.push(`Service governance policy '${serviceRule.ApprovalRuleName}' mandates multi-level administrator sign-off.`);
          }
        }

        // Check if service category is infrastructure-related
        const [service] = await query(
          `SELECT s.ServiceName, sc.CategoryName, sc.CategoryCode
           FROM Service s
           LEFT JOIN ServiceCategory sc ON s.ServiceCategoryID = sc.ServiceCategoryID
           WHERE s.ServiceID = ? AND s.IsDeleted = 0`,
          [serviceId]
        );

        if (service) {
          const categoryCode = (service.CategoryCode || '').toUpperCase();
          const categoryName = (service.CategoryName || '').toUpperCase();
          if (categoryCode.includes('INFRA') || categoryName.includes('INFRASTRUCTURE') || categoryCode.includes('POWER') || categoryCode.includes('HVAC_CENTRAL')) {
            requiresHigherApproval = true;
            reasons.push(`Infrastructure modification service category ('${service.CategoryName}') requires Park Administrator approval.`);
          }
        }
      } catch (svcErr) {
        console.warn('ServiceApprovalRule lookup notice:', svcErr.message);
      }
    }

    // 5. Look up Department Manager for AssignedDepartmentID
    let deptManagerUserId = null;
    let deptName = 'Responsible Department';
    if (deptId) {
      try {
        const [dept] = await query(
          `SELECT DepartmentID, DepartmentName, ManagerUserID FROM Department WHERE DepartmentID = ?`,
          [deptId]
        );
        if (dept) {
          deptName = dept.DepartmentName;
          deptManagerUserId = dept.ManagerUserID;
        }

        // Fallback: If ManagerUserID is null in Department, check EmployeeAssignment for a user with DEPARTMENT_MANAGER role
        if (!deptManagerUserId) {
          const [managerUser] = await query(
            `SELECT ea.UserID 
             FROM EmployeeAssignment ea
             JOIN UserRole ur ON ea.UserID = ur.UserID
             JOIN Role r ON ur.RoleID = r.RoleID
             WHERE ea.DepartmentID = ? AND ea.IsActive = 1 AND ea.IsDeleted = 0
               AND r.RoleCode = 'DEPARTMENT_MANAGER'
             LIMIT 1`,
            [deptId]
          );
          if (managerUser) {
            deptManagerUserId = managerUser.UserID;
          }
        }
      } catch (deptErr) {
        console.warn('Department lookup notice:', deptErr.message);
      }
    }

    // 6. Look up Business Park Administrator (Stage 2 Approver)
    let parkAdminUserId = null;
    if (requiresHigherApproval) {
      try {
        const [adminUser] = await query(
          `SELECT u.UserID 
           FROM User u
           JOIN UserRole ur ON u.UserID = ur.UserID
           JOIN Role r ON ur.RoleID = r.RoleID
           WHERE r.RoleCode IN ('PARK_SUPER_ADMIN', 'PARK_ADMIN')
             AND u.IsActive = 1 AND u.IsDeleted = 0
           ORDER BY u.UserID ASC
           LIMIT 1`
        );
        if (adminUser) {
          parkAdminUserId = adminUser.UserID;
        }
      } catch (adminErr) {
        console.warn('Park Admin lookup notice:', adminErr.message);
      }
    }

    // 7. Assemble Stages
    const stages = [
      {
        StageNumber: 1,
        StageName: `Department Manager Review & Approval (${deptName})`,
        ApproverRoleCode: 'DEPARTMENT_MANAGER',
        DepartmentID: deptId,
        ApproverUserID: deptManagerUserId,
        SequenceNumber: 1,
        Description: `Mandatory operational and budget review by ${deptName} Management.`
      }
    ];

    if (requiresHigherApproval) {
      stages.push({
        StageNumber: 2,
        StageName: 'Business Park Administrator Approval',
        ApproverRoleCode: 'PARK_SUPER_ADMIN',
        DepartmentID: null,
        ApproverUserID: parkAdminUserId,
        SequenceNumber: 2,
        Description: `Higher-level administrative authorization: ${reasons.join(' | ')}`
      });
    }

    return {
      requiresHigherApproval,
      reasons,
      totalStages: stages.length,
      stages
    };
  }
};

export default approvalRuleEngineService;
