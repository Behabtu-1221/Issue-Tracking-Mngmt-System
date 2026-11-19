import React from 'react';
import { usePermissionContext } from '../../modules/role-permission-management/contexts/PermissionContext';
import EmployeeDashboardPage from '../../modules/issue-management/pages/EmployeeDashboardPage';
import TechnicianDashboardPage from '../../modules/technician/pages/TechnicianDashboardPage';
import ManagerDashboardPage from '../../modules/issue-management/pages/ManagerDashboardPage';
import AdminDashboardPage from '../../pages/AdminDashboardPage';

export function DashboardRouter() {
  const { isParkAdmin, isCompanyAdmin, hasPermission, user } = usePermissionContext();

  const roleCode = (
    user?.roleCode ||
    user?.RoleCode ||
    user?.userTypeCode ||
    (user?.roles && user.roles[0]?.RoleCode) ||
    (typeof user?.roles?.[0] === 'string' ? user.roles[0] : '') ||
    ''
  ).toUpperCase();

  const isSystemAdmin =
    isParkAdmin ||
    roleCode === 'PARK_SUPER_ADMIN' ||
    roleCode === 'PARK_ADMIN' ||
    roleCode === 'SUPER_ADMIN' ||
    roleCode === 'SYSTEM_ADMIN' ||
    roleCode === 'SYSTEM_ADMINISTRATOR' ||
    roleCode === 'BUSINESS_PARK_ADMIN' ||
    roleCode === 'SYSADMIN';

  // System Administrator / Park Administrator always lands directly on Admin Operations Center
  if (isSystemAdmin) {
    return <AdminDashboardPage />;
  }

  const isTechnicianUser = hasPermission('Issue.Read.Assigned') && !isCompanyAdmin && !hasPermission('Issue.Assign') && !hasPermission('Building.Read');
  const isManagerUser = !isCompanyAdmin && (hasPermission('Issue.Assign') || hasPermission('Issue.Approve'));
  const isManagementUser = isCompanyAdmin || hasPermission('Building.Read') || hasPermission('Tenant.Read');

  if (isTechnicianUser) {
    return <TechnicianDashboardPage />;
  }

  if (isManagerUser) {
    return <ManagerDashboardPage />;
  }

  if (isManagementUser) {
    return <AdminDashboardPage />;
  }

  // Pure Employee role lands directly on Employee Dashboard
  return <EmployeeDashboardPage />;
}

export default DashboardRouter;
