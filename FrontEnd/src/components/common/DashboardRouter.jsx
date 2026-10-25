import React from 'react';
import { usePermissionContext } from '../../modules/role-permission-management/contexts/PermissionContext';
import EmployeeDashboardPage from '../../modules/issue-management/pages/EmployeeDashboardPage';
import TechnicianDashboardPage from '../../modules/technician/pages/TechnicianDashboardPage';
import ManagerDashboardPage from '../../modules/issue-management/pages/ManagerDashboardPage';
import AdminDashboardPage from '../../pages/AdminDashboardPage';

export function DashboardRouter() {
  const { isParkAdmin, isCompanyAdmin, hasPermission } = usePermissionContext();

  const isTechnicianUser = hasPermission('Issue.Read.Assigned') && !isParkAdmin && !isCompanyAdmin && !hasPermission('Issue.Assign') && !hasPermission('Building.Read');
  const isManagerUser = !isParkAdmin && !isCompanyAdmin && (hasPermission('Issue.Assign') || hasPermission('Issue.Approve'));
  const isManagementUser = isParkAdmin || isCompanyAdmin || hasPermission('Building.Read') || hasPermission('Tenant.Read');

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
