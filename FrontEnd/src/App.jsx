import React from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import ConfigDashboardPage from './modules/configuration-management/pages/ConfigDashboardPage';
import ConfigSettingsPage from './modules/configuration-management/pages/ConfigSettingsPage';
import ConfigLookupsPage from './modules/configuration-management/pages/ConfigLookupsPage';
import ConfigSequencesPage from './modules/configuration-management/pages/ConfigSequencesPage';
import ConfigCalendarsPage from './modules/configuration-management/pages/ConfigCalendarsPage';
import ConfigFlagsPage from './modules/configuration-management/pages/ConfigFlagsPage';
import ConfigRulesPage from './modules/configuration-management/pages/ConfigRulesPage';
import ConfigLocalizationPage from './modules/configuration-management/pages/ConfigLocalizationPage';
import ConfigBootstrapPage from './modules/configuration-management/pages/ConfigBootstrapPage';
import RbacDashboardPage from './modules/role-permission-management/pages/RbacDashboardPage';
import RbacRolesManagementPage from './modules/role-permission-management/pages/RbacRolesManagementPage';
import RbacMatrixPage from './modules/role-permission-management/pages/RbacMatrixPage';
import RbacAssignmentsPage from './modules/role-permission-management/pages/RbacAssignmentsPage';
import RbacAuditPage from './modules/role-permission-management/pages/RbacAuditPage';
import OrgDashboardPage from './modules/organization/pages/OrgDashboardPage';
import OrgDepartmentsPage from './modules/organization/pages/OrgDepartmentsPage';
import OrgTeamsPage from './modules/organization/pages/OrgTeamsPage';
import OrgAssignmentsPage from './modules/organization/pages/OrgAssignmentsPage';
import OrgFinancialsPage from './modules/organization/pages/OrgFinancialsPage';
import DispatchPage from './modules/dispatch/pages/DispatchPage';
import NotifDashboardPage from './modules/notification/pages/NotifDashboardPage';
import NotifInboxPage from './modules/notification/pages/NotifInboxPage';
import NotifPreferencesPage from './modules/notification/pages/NotifPreferencesPage';
import NotifTemplatesPage from './modules/notification/pages/NotifTemplatesPage';
import NotifDeliveryLogPage from './modules/notification/pages/NotifDeliveryLogPage';
import NotifRemindersPage from './modules/notification/pages/NotifRemindersPage';
import DocDashboardPage from './modules/file-document/pages/DocDashboardPage';
import DocRepositoryPage from './modules/file-document/pages/DocRepositoryPage';
import DocCategoriesPage from './modules/file-document/pages/DocCategoriesPage';
import DocVersionsPage from './modules/file-document/pages/DocVersionsPage';
import DocSecurityPage from './modules/file-document/pages/DocSecurityPage';

import { PermissionProvider } from './modules/role-permission-management/contexts/PermissionContext';
import ProtectedRoute from './modules/role-permission-management/guards/ProtectedRoute';
import DashboardRouter from './components/common/DashboardRouter';
import ErrorBoundary from './components/common/ErrorBoundary';

import { AuthProvider } from './modules/authentication/contexts/AuthContext';
import { RequireAuth, GuestOnly } from './modules/authentication/guards/AuthGuards';
import LoginPage from './modules/authentication/pages/LoginPage';
import FirstLoginPasswordChangePage from './modules/authentication/pages/FirstLoginPasswordChangePage';
import ForgotPasswordPage from './modules/authentication/pages/ForgotPasswordPage';
import ResetPasswordPage from './modules/authentication/pages/ResetPasswordPage';

import ProfileManagementPage from './modules/identity-access/pages/ProfileManagementPage';
import ParkDashboardPage from './modules/business-park/pages/ParkDashboardPage';
import CampusProfilePage from './modules/business-park/pages/CampusProfilePage';
import BuildingsBlocksPage from './modules/business-park/pages/BuildingsBlocksPage';
import FloorsLevelPage from './modules/business-park/pages/FloorsLevelPage';
import OfficeUnitsPage from './modules/business-park/pages/OfficeUnitsPage';
import FacilityZonesPage from './modules/business-park/pages/FacilityZonesPage';
import CampusLandmarksPage from './modules/business-park/pages/CampusLandmarksPage';

import TenantDashboardPage from './modules/tenant/pages/TenantDashboardPage';
import TenantDirectoryPage from './modules/tenant/pages/TenantDirectoryPage';
import TenantLeasesPage from './modules/tenant/pages/TenantLeasesPage';
import TenantAllocationsPage from './modules/tenant/pages/TenantAllocationsPage';
import TenantSubTenantsPage from './modules/tenant/pages/TenantSubTenantsPage';
import TenantContactsPage from './modules/tenant/pages/TenantContactsPage';

import ServiceDashboardPage from './modules/service-catalog/pages/ServiceDashboardPage';
import ServiceDirectoryPage from './modules/service-catalog/pages/ServiceDirectoryPage';
import ServiceCategoriesPage from './modules/service-catalog/pages/ServiceCategoriesPage';
import ServicePricingPage from './modules/service-catalog/pages/ServicePricingPage';
import ServiceRequirementsPage from './modules/service-catalog/pages/ServiceRequirementsPage';
import ServiceGovernancePage from './modules/service-catalog/pages/ServiceGovernancePage';
import ServiceCategoryMappingsPage from './modules/service-catalog/pages/ServiceCategoryMappingsPage';

import IssueDashboardPage from './modules/issue-management/pages/IssueDashboardPage';
import IssueTrackerPage from './modules/issue-management/pages/IssueTrackerPage';
import IssueKnownPage from './modules/issue-management/pages/IssueKnownPage';
import IssueStatusFlowPage from './modules/issue-management/pages/IssueStatusFlowPage';
import CreateRequestPage from './modules/issue-management/pages/CreateRequestPage';
import MyRequestsPage from './modules/issue-management/pages/MyRequestsPage';
import RequestHistoryPage from './modules/issue-management/pages/RequestHistoryPage';

import ApprovalDashboardPage from './modules/approval/pages/ApprovalDashboardPage';
import ApprovalQueuePage from './modules/approval/pages/ApprovalQueuePage';
import ApprovalDelegationsPage from './modules/approval/pages/ApprovalDelegationsPage';
import ApprovalRulesPage from './modules/approval/pages/ApprovalRulesPage';

import DispatchDashboardPage from './modules/dispatch/pages/DispatchDashboardPage';
import DispatchQueuePage from './modules/dispatch/pages/DispatchQueuePage';
import DispatchWorkbenchPage from './modules/dispatch/pages/DispatchWorkbenchPage';
import DispatchRosterPage from './modules/dispatch/pages/DispatchRosterPage';

import SLADashboardPage from './modules/sla/pages/SLADashboardPage';
import SLAClocksPage from './modules/sla/pages/SLAClocksPage';
import SLABreachesPage from './modules/sla/pages/SLABreachesPage';
import SLAPoliciesPage from './modules/sla/pages/SLAPoliciesPage';

import CommDashboardPage from './modules/communication/pages/CommDashboardPage';
import CommDiscussionsPage from './modules/communication/pages/CommDiscussionsPage';
import CommAnnouncementsPage from './modules/communication/pages/CommAnnouncementsPage';
import CommChannelsPage from './modules/communication/pages/CommChannelsPage';
import CommTimelinePage from './modules/communication/pages/CommTimelinePage';

import UserDashboardPage from './modules/identity-access/pages/UserDashboardPage';
import UserDirectoryPage from './modules/identity-access/pages/UserDirectoryPage';
import UserRolesPage from './modules/identity-access/pages/UserRolesPage';
import UserSessionsPage from './modules/identity-access/pages/UserSessionsPage';
import UserAuditPage from './modules/identity-access/pages/UserAuditPage';

import TechnicianDashboardPage from './modules/technician/pages/TechnicianDashboardPage';
import TechAssignedRequestsPage from './modules/technician/pages/TechAssignedRequestsPage';
import TechWorkHistoryPage from './modules/technician/pages/TechWorkHistoryPage';
import TechRequestDetailPage from './modules/technician/pages/TechRequestDetailPage';

import ReportsDashboardPage from './modules/reporting/pages/ReportsDashboardPage';
import ExecutiveDashboardPage from './modules/reporting/pages/ExecutiveDashboardPage';
import RequestAnalyticsPage from './modules/reporting/pages/RequestAnalyticsPage';
import WorkloadAnalyticsPage from './modules/reporting/pages/WorkloadAnalyticsPage';
import SlaAnalyticsPage from './modules/reporting/pages/SlaAnalyticsPage';
import SavedReportsPage from './modules/reporting/pages/SavedReportsPage';

/* Authenticated shell wrapper — provides DashboardLayout + PermissionProvider */
function AuthenticatedShell() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavigate = (menu) => {
    navigate(`/${menu}`);
  };

  const activeMenu = location.pathname.startsWith('/') ? location.pathname.slice(1) : location.pathname;

  return (
    <PermissionProvider>
      <DashboardLayout activeMenu={activeMenu} onNavigate={handleNavigate}>
        <Routes>
          <Route path="technician" element={<Navigate to="/technician/dashboard" replace />} />
          <Route path="technician/dashboard" element={<ProtectedRoute permission="Issue.Read.Assigned" onBack={() => handleNavigate('dashboard')}><TechnicianDashboardPage /></ProtectedRoute>} />
          <Route path="technician/assigned" element={<ProtectedRoute permission="Issue.Read.Assigned" onBack={() => handleNavigate('dashboard')}><TechAssignedRequestsPage defaultStatus="ALL" /></ProtectedRoute>} />
          <Route path="technician/in-progress" element={<ProtectedRoute permission="Issue.Read.Assigned" onBack={() => handleNavigate('dashboard')}><TechAssignedRequestsPage defaultStatus="IN_PROGRESS" /></ProtectedRoute>} />
          <Route path="technician/pending" element={<ProtectedRoute permission="Issue.Read.Assigned" onBack={() => handleNavigate('dashboard')}><TechAssignedRequestsPage defaultStatus="PAUSED" /></ProtectedRoute>} />
          <Route path="technician/resolved" element={<ProtectedRoute permission="Issue.Read.Assigned" onBack={() => handleNavigate('dashboard')}><TechWorkHistoryPage /></ProtectedRoute>} />
          <Route path="technician/request/:id" element={<ProtectedRoute permission="Issue.Read.Assigned" onBack={() => handleNavigate('technician/assigned')}><TechRequestDetailPage /></ProtectedRoute>} />
          <Route path="parks" element={<Navigate to="/parks/dashboard" replace />} />
          <Route path="parks/dashboard" element={<ProtectedRoute requireParkAdmin={true} permission="Building.Read" onBack={() => handleNavigate('dashboard')}><ParkDashboardPage /></ProtectedRoute>} />
          <Route path="parks/campus" element={<ProtectedRoute requireParkAdmin={true} permission="Building.Read" onBack={() => handleNavigate('dashboard')}><CampusProfilePage /></ProtectedRoute>} />
          <Route path="parks/buildings" element={<ProtectedRoute requireParkAdmin={true} permission="Building.Read" onBack={() => handleNavigate('dashboard')}><BuildingsBlocksPage /></ProtectedRoute>} />
          <Route path="parks/floors" element={<ProtectedRoute requireParkAdmin={true} permission="Building.Read" onBack={() => handleNavigate('dashboard')}><FloorsLevelPage /></ProtectedRoute>} />
          <Route path="parks/offices" element={<ProtectedRoute requireParkAdmin={true} permission="Building.Read" onBack={() => handleNavigate('dashboard')}><OfficeUnitsPage /></ProtectedRoute>} />
          <Route path="parks/zones" element={<ProtectedRoute requireParkAdmin={true} permission="Building.Read" onBack={() => handleNavigate('dashboard')}><FacilityZonesPage /></ProtectedRoute>} />
          <Route path="parks/landmarks" element={<ProtectedRoute requireParkAdmin={true} permission="Building.Read" onBack={() => handleNavigate('dashboard')}><CampusLandmarksPage /></ProtectedRoute>} />
          
          <Route path="tenants" element={<Navigate to="/tenants/dashboard" replace />} />
          <Route path="tenants/dashboard" element={<ProtectedRoute permission="Tenant.Read" onBack={() => handleNavigate('dashboard')}><TenantDashboardPage /></ProtectedRoute>} />
          <Route path="tenants/directory" element={<ProtectedRoute requireParkAdmin={true} permission="Tenant.Read" onBack={() => handleNavigate('dashboard')}><TenantDirectoryPage /></ProtectedRoute>} />
          <Route path="tenants/leases" element={<ProtectedRoute permission="Tenant.Read" onBack={() => handleNavigate('dashboard')}><TenantLeasesPage /></ProtectedRoute>} />
          <Route path="tenants/allocations" element={<ProtectedRoute permission="Tenant.Read" onBack={() => handleNavigate('dashboard')}><TenantAllocationsPage /></ProtectedRoute>} />
          <Route path="tenants/sub-tenants" element={<ProtectedRoute requireParkAdmin={true} permission="Tenant.Read" onBack={() => handleNavigate('dashboard')}><TenantSubTenantsPage /></ProtectedRoute>} />
          <Route path="tenants/contacts" element={<ProtectedRoute permission="Tenant.Read" onBack={() => handleNavigate('dashboard')}><TenantContactsPage /></ProtectedRoute>} />
          
          <Route path="services" element={<Navigate to="/services/dashboard" replace />} />
          <Route path="services/dashboard" element={<ProtectedRoute permission="Request.Read" onBack={() => handleNavigate('dashboard')}><ServiceDashboardPage /></ProtectedRoute>} />
          <Route path="services/directory" element={<ProtectedRoute permission="Request.Read" onBack={() => handleNavigate('dashboard')}><ServiceDirectoryPage /></ProtectedRoute>} />
          <Route path="services/categories" element={<ProtectedRoute permission="Request.Read" onBack={() => handleNavigate('dashboard')}><ServiceCategoriesPage /></ProtectedRoute>} />
          <Route path="services/category-mappings" element={<ProtectedRoute permission="Request.Read" onBack={() => handleNavigate('dashboard')}><ServiceCategoryMappingsPage /></ProtectedRoute>} />
          <Route path="services/pricing" element={<ProtectedRoute permission="Request.Read" onBack={() => handleNavigate('dashboard')}><ServicePricingPage /></ProtectedRoute>} />
          <Route path="services/requirements" element={<ProtectedRoute permission="Request.Read" onBack={() => handleNavigate('dashboard')}><ServiceRequirementsPage /></ProtectedRoute>} />
          <Route path="services/governance" element={<ProtectedRoute permission="Request.Read" onBack={() => handleNavigate('dashboard')}><ServiceGovernancePage /></ProtectedRoute>} />
          
          <Route path="issues" element={<Navigate to="/issues/my-requests" replace />} />
          <Route path="issues/dashboard" element={<ProtectedRoute permission="Report.View" onBack={() => handleNavigate('dashboard')}><IssueDashboardPage /></ProtectedRoute>} />
          <Route path="issues/tracker" element={<ProtectedRoute permission="Request.Read" onBack={() => handleNavigate('dashboard')}><IssueTrackerPage /></ProtectedRoute>} />
          <Route path="issues/create" element={<ProtectedRoute permission="Request.Create" onBack={() => handleNavigate('dashboard')}><CreateRequestPage /></ProtectedRoute>} />
          <Route path="issues/my-requests" element={<ProtectedRoute permission="Request.Read" onBack={() => handleNavigate('dashboard')}><MyRequestsPage /></ProtectedRoute>} />
          <Route path="issues/history" element={<ProtectedRoute permission="Request.Read" onBack={() => handleNavigate('dashboard')}><RequestHistoryPage /></ProtectedRoute>} />
          <Route path="issues/status-flow" element={<ProtectedRoute permission="Request.Update" onBack={() => handleNavigate('dashboard')}><IssueStatusFlowPage /></ProtectedRoute>} />
          <Route path="issues/known" element={<ProtectedRoute permission="Knowledge.Read" onBack={() => handleNavigate('dashboard')}><IssueKnownPage /></ProtectedRoute>} />
          
          <Route path="approvals" element={<Navigate to="/approvals/dashboard" replace />} />
          <Route path="approvals/dashboard" element={<ProtectedRoute permission="Request.Approve" onBack={() => handleNavigate('dashboard')}><ApprovalDashboardPage /></ProtectedRoute>} />
          <Route path="approvals/queue" element={<ProtectedRoute permission="Request.Approve" onBack={() => handleNavigate('dashboard')}><ApprovalQueuePage /></ProtectedRoute>} />
          <Route path="approvals/delegations" element={<ProtectedRoute permission="Request.Approve" onBack={() => handleNavigate('dashboard')}><ApprovalDelegationsPage /></ProtectedRoute>} />
          <Route path="approvals/rules" element={<ProtectedRoute permission="Request.Approve" onBack={() => handleNavigate('dashboard')}><ApprovalRulesPage /></ProtectedRoute>} />
          
          <Route path="dispatch" element={<Navigate to="/dispatch/dashboard" replace />} />
          <Route path="dispatch/dashboard" element={<ProtectedRoute permission="Request.Assign" onBack={() => handleNavigate('dashboard')}><DispatchDashboardPage /></ProtectedRoute>} />
          <Route path="dispatch/queue" element={<ProtectedRoute permission="Request.Assign" onBack={() => handleNavigate('dashboard')}><DispatchQueuePage /></ProtectedRoute>} />
          <Route path="dispatch/workbench" element={<ProtectedRoute permission="Request.Assign" onBack={() => handleNavigate('dashboard')}><DispatchWorkbenchPage /></ProtectedRoute>} />
          <Route path="dispatch/roster" element={<ProtectedRoute permission="Request.Assign" onBack={() => handleNavigate('dashboard')}><DispatchRosterPage /></ProtectedRoute>} />
          <Route path="dispatch/teams" element={<ProtectedRoute permission="Request.Assign" onBack={() => handleNavigate('dashboard')}><DispatchPage /></ProtectedRoute>} />
          
          <Route path="sla" element={<Navigate to="/sla/dashboard" replace />} />
          <Route path="sla/dashboard" element={<ProtectedRoute permission="Report.View" onBack={() => handleNavigate('dashboard')}><SLADashboardPage /></ProtectedRoute>} />
          <Route path="sla/clocks" element={<ProtectedRoute permission="Report.View" onBack={() => handleNavigate('dashboard')}><SLAClocksPage /></ProtectedRoute>} />
          <Route path="sla/breaches" element={<ProtectedRoute permission="Report.View" onBack={() => handleNavigate('dashboard')}><SLABreachesPage /></ProtectedRoute>} />
          <Route path="sla/policies" element={<ProtectedRoute permission="Report.View" onBack={() => handleNavigate('dashboard')}><SLAPoliciesPage /></ProtectedRoute>} />
          
          <Route path="communication" element={<Navigate to="/communication/dashboard" replace />} />
          <Route path="communication/dashboard" element={<ProtectedRoute permission="Communication.Read" onBack={() => handleNavigate('dashboard')}><CommDashboardPage /></ProtectedRoute>} />
          <Route path="communication/discussions" element={<ProtectedRoute permission="Communication.Read" onBack={() => handleNavigate('dashboard')}><CommDiscussionsPage /></ProtectedRoute>} />
          <Route path="communication/announcements" element={<ProtectedRoute permission="Communication.Read" onBack={() => handleNavigate('dashboard')}><CommAnnouncementsPage /></ProtectedRoute>} />
          <Route path="communication/channels" element={<ProtectedRoute permission="Communication.Read" onBack={() => handleNavigate('dashboard')}><CommChannelsPage /></ProtectedRoute>} />
          <Route path="communication/timeline" element={<ProtectedRoute permission="Communication.Read" onBack={() => handleNavigate('dashboard')}><CommTimelinePage /></ProtectedRoute>} />
          <Route path="notifications" element={<Navigate to="/notifications/dashboard" replace />} />
          <Route path="notifications/dashboard" element={<ProtectedRoute anyPermission={['Notification.Manage', 'Request.Read', 'Communication.Read']} onBack={() => handleNavigate('dashboard')}><NotifDashboardPage /></ProtectedRoute>} />
          <Route path="notifications/inbox" element={<ProtectedRoute anyPermission={['Notification.Manage', 'Request.Read', 'Communication.Read']} onBack={() => handleNavigate('dashboard')}><NotifInboxPage /></ProtectedRoute>} />
          <Route path="notifications/preferences" element={<ProtectedRoute anyPermission={['Notification.Manage', 'Request.Read', 'Communication.Read']} onBack={() => handleNavigate('dashboard')}><NotifPreferencesPage /></ProtectedRoute>} />
          <Route path="notifications/reminders" element={<ProtectedRoute anyPermission={['Notification.Manage', 'Request.Read', 'Communication.Read']} onBack={() => handleNavigate('dashboard')}><NotifRemindersPage /></ProtectedRoute>} />
          <Route path="notifications/templates" element={<ProtectedRoute permission="Notification.Manage" onBack={() => handleNavigate('dashboard')}><NotifTemplatesPage /></ProtectedRoute>} />
          <Route path="notifications/log" element={<ProtectedRoute permission="Notification.Manage" onBack={() => handleNavigate('dashboard')}><NotifDeliveryLogPage /></ProtectedRoute>} />
          <Route path="organization" element={<Navigate to="/organization/dashboard" replace />} />
          <Route path="organization/dashboard" element={<ProtectedRoute permission="Department.Read" onBack={() => handleNavigate('dashboard')}><OrgDashboardPage /></ProtectedRoute>} />
          <Route path="organization/units" element={<Navigate to="/organization/departments" replace />} />
          <Route path="organization/departments" element={<ProtectedRoute permission="Department.Read" onBack={() => handleNavigate('dashboard')}><OrgDepartmentsPage /></ProtectedRoute>} />
          <Route path="organization/teams" element={<ProtectedRoute permission="Department.Read" onBack={() => handleNavigate('dashboard')}><OrgTeamsPage /></ProtectedRoute>} />
          <Route path="organization/assignments" element={<ProtectedRoute permission="Department.Read" onBack={() => handleNavigate('dashboard')}><OrgAssignmentsPage /></ProtectedRoute>} />
          <Route path="organization/financials" element={<ProtectedRoute permission="Department.Read" onBack={() => handleNavigate('dashboard')}><OrgFinancialsPage /></ProtectedRoute>} />
          <Route path="documents" element={<Navigate to="/documents/dashboard" replace />} />
          <Route path="documents/dashboard" element={<ProtectedRoute permission="Document.Read" onBack={() => handleNavigate('dashboard')}><DocDashboardPage /></ProtectedRoute>} />
          <Route path="documents/repository" element={<ProtectedRoute permission="Document.Read" onBack={() => handleNavigate('dashboard')}><DocRepositoryPage /></ProtectedRoute>} />
          <Route path="documents/categories" element={<ProtectedRoute permission="Document.Read" onBack={() => handleNavigate('dashboard')}><DocCategoriesPage /></ProtectedRoute>} />
          <Route path="documents/versions" element={<ProtectedRoute permission="Document.Read" onBack={() => handleNavigate('dashboard')}><DocVersionsPage /></ProtectedRoute>} />
          <Route path="documents/security" element={<ProtectedRoute permission="Document.Read" onBack={() => handleNavigate('dashboard')}><DocSecurityPage /></ProtectedRoute>} />
          <Route path="configuration" element={<Navigate to="/configuration/dashboard" replace />} />
          <Route path="configuration/dashboard" element={<ProtectedRoute permission="Building.Manage" onBack={() => handleNavigate('dashboard')}><ConfigDashboardPage /></ProtectedRoute>} />
          <Route path="configuration/settings" element={<ProtectedRoute permission="Building.Manage" onBack={() => handleNavigate('dashboard')}><ConfigSettingsPage /></ProtectedRoute>} />
          <Route path="configuration/lookups" element={<ProtectedRoute permission="Building.Manage" onBack={() => handleNavigate('dashboard')}><ConfigLookupsPage /></ProtectedRoute>} />
          <Route path="configuration/sequences" element={<ProtectedRoute permission="Building.Manage" onBack={() => handleNavigate('dashboard')}><ConfigSequencesPage /></ProtectedRoute>} />
          <Route path="configuration/calendars" element={<ProtectedRoute permission="Building.Manage" onBack={() => handleNavigate('dashboard')}><ConfigCalendarsPage /></ProtectedRoute>} />
          <Route path="configuration/flags" element={<ProtectedRoute permission="Building.Manage" onBack={() => handleNavigate('dashboard')}><ConfigFlagsPage /></ProtectedRoute>} />
          <Route path="configuration/rules" element={<ProtectedRoute permission="Building.Manage" onBack={() => handleNavigate('dashboard')}><ConfigRulesPage /></ProtectedRoute>} />
          <Route path="configuration/localization" element={<ProtectedRoute permission="Building.Manage" onBack={() => handleNavigate('dashboard')}><ConfigLocalizationPage /></ProtectedRoute>} />
          <Route path="configuration/bootstrap" element={<ProtectedRoute permission="Building.Manage" onBack={() => handleNavigate('dashboard')}><ConfigBootstrapPage /></ProtectedRoute>} />
          <Route path="users" element={<Navigate to="/users/dashboard" replace />} />
          <Route path="users/dashboard" element={<ProtectedRoute permission="User.Read" onBack={() => handleNavigate('dashboard')}><UserDashboardPage /></ProtectedRoute>} />
          <Route path="users/directory" element={<ProtectedRoute permission="User.Read" onBack={() => handleNavigate('dashboard')}><UserDirectoryPage /></ProtectedRoute>} />
          <Route path="users/roles" element={<ProtectedRoute permission="User.Read" onBack={() => handleNavigate('dashboard')}><UserRolesPage /></ProtectedRoute>} />
          <Route path="users/sessions" element={<ProtectedRoute permission="User.Read" onBack={() => handleNavigate('dashboard')}><UserSessionsPage /></ProtectedRoute>} />
          <Route path="users/audit" element={<ProtectedRoute permission="User.Read" onBack={() => handleNavigate('dashboard')}><UserAuditPage /></ProtectedRoute>} />
          <Route path="roles" element={<Navigate to="/roles/dashboard" replace />} />
          <Route path="roles/dashboard" element={<ProtectedRoute permission="Role.Read" onBack={() => handleNavigate('dashboard')}><RbacDashboardPage /></ProtectedRoute>} />
          <Route path="roles/management" element={<ProtectedRoute permission="Role.Read" onBack={() => handleNavigate('dashboard')}><RbacRolesManagementPage /></ProtectedRoute>} />
          <Route path="roles/matrix" element={<ProtectedRoute permission="Role.Read" onBack={() => handleNavigate('dashboard')}><RbacMatrixPage /></ProtectedRoute>} />
          <Route path="roles/assignments" element={<ProtectedRoute permission="Role.Read" onBack={() => handleNavigate('dashboard')}><RbacAssignmentsPage /></ProtectedRoute>} />
          <Route path="roles/audit" element={<ProtectedRoute permission="Role.Read" onBack={() => handleNavigate('dashboard')}><RbacAuditPage /></ProtectedRoute>} />
          <Route path="identity" element={<ProtectedRoute permission="Role.Read" onBack={() => handleNavigate('dashboard')}><RbacDashboardPage /></ProtectedRoute>} />
          
          {/* Module 15: Analysis & Reporting Management Routes */}
          <Route path="reports" element={<Navigate to="/reports/dashboard" replace />} />
          <Route path="reports/dashboard" element={<ProtectedRoute permission="Report.View" onBack={() => handleNavigate('dashboard')}><ReportsDashboardPage /></ProtectedRoute>} />
          <Route path="reports/executive" element={<ProtectedRoute permission="Report.View" onBack={() => handleNavigate('dashboard')}><ExecutiveDashboardPage /></ProtectedRoute>} />
          <Route path="reports/requests" element={<ProtectedRoute permission="Report.View" onBack={() => handleNavigate('dashboard')}><RequestAnalyticsPage /></ProtectedRoute>} />
          <Route path="reports/workload" element={<ProtectedRoute permission="Report.View" onBack={() => handleNavigate('dashboard')}><WorkloadAnalyticsPage /></ProtectedRoute>} />
          <Route path="reports/sla" element={<ProtectedRoute permission="Report.View" onBack={() => handleNavigate('dashboard')}><SlaAnalyticsPage /></ProtectedRoute>} />
          <Route path="reports/tenants" element={<ProtectedRoute requireParkAdmin={true} permission="Tenant.Read" onBack={() => handleNavigate('dashboard')}><ReportsDashboardPage defaultTab="tenants" /></ProtectedRoute>} />
          <Route path="reports/departments" element={<ProtectedRoute permission="Department.Read" onBack={() => handleNavigate('dashboard')}><ReportsDashboardPage defaultTab="departments" /></ProtectedRoute>} />
          <Route path="reports/saved" element={<ProtectedRoute permission="Report.View" onBack={() => handleNavigate('dashboard')}><SavedReportsPage /></ProtectedRoute>} />
          <Route path="reports/schedules" element={<ProtectedRoute permission="Report.Schedule" onBack={() => handleNavigate('dashboard')}><ReportsDashboardPage defaultTab="schedules" /></ProtectedRoute>} />

          <Route path="profile" element={<ProfileManagementPage />} />
          <Route path="dashboard" element={<DashboardRouter />} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Routes>
      </DashboardLayout>
    </PermissionProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Routes>
          {/* Public / Guest-only routes */}
          <Route path="/" element={<GuestOnly><LoginPage /></GuestOnly>} />
          <Route path="/forgot-password" element={<GuestOnly><ForgotPasswordPage /></GuestOnly>} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* First-login mandatory password change */}
          <Route path="/first-login-password-change" element={
            <RequireAuth><FirstLoginPasswordChangePage /></RequireAuth>
          } />

          {/* All authenticated module routes */}
          <Route path="/*" element={
            <RequireAuth><AuthenticatedShell /></RequireAuth>
          } />
        </Routes>
      </AuthProvider>
    </ErrorBoundary>
  );
}
