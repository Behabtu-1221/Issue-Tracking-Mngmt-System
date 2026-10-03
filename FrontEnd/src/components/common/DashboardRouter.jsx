import React from 'react';
import { usePermissionContext } from '../../modules/role-permission-management/contexts/PermissionContext';
import EmployeeDashboardPage from '../../modules/issue-management/pages/EmployeeDashboardPage';
import TechnicianDashboardPage from '../../modules/technician/pages/TechnicianDashboardPage';
import ManagerDashboardPage from '../../modules/issue-management/pages/ManagerDashboardPage';
import {
  Building2, Activity, ListChecks, CheckCircle2, Clock, AlertTriangle,
  Users, ShieldCheck, FileText, ArrowUpRight, BarChart3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function AdminOverviewDashboard() {
  const navigate = useNavigate();
  const { user, isParkAdmin } = usePermissionContext();

  const parkCards = [
    { title: 'Business Park Topology', desc: 'Campus, Buildings, Floors, Facilities', icon: Building2, path: '/parks/dashboard', permission: 'Building.Read' },
    { title: 'Tenants & Leasing', desc: 'Directory, Leases, Space Allocations', icon: Users, path: '/tenants/dashboard', permission: 'Tenant.Read' },
    { title: 'Service Requests Tracker', desc: '7-stage Status Lifecycle & Dispatches', icon: ListChecks, path: '/issues/dashboard', permission: 'Request.Read' },
    { title: 'Executive BI & Analytics', desc: 'Cross-module telemetry, SLA & exports', icon: BarChart3, path: '/reports/dashboard', permission: 'Report.View' },
    { title: 'Governance & RBAC Matrix', desc: 'Role definitions, permissions, audit', icon: ShieldCheck, path: '/roles/dashboard', permission: 'Role.Read' }
  ];

  const tenantRepCards = [
    { title: 'Company Overview & Space', desc: 'Active leases, office allocations & campus location', icon: Building2, path: '/tenants/dashboard', permission: 'Tenant.Read' },
    { title: 'Company Requests Tracker', desc: 'Track tickets, resolution status & live updates', icon: ListChecks, path: '/issues/tracker', permission: 'Request.Read' },
    { title: 'Service Catalog', desc: 'Explore park maintenance & support services', icon: ShieldCheck, path: '/services/directory', permission: 'Request.Read' },
    { title: 'Lease Agreements', desc: 'Commercial lease contracts, terms & renewals', icon: FileText, path: '/tenants/leases', permission: 'Tenant.Read' },
    { title: 'Reports & Performance', desc: 'Issue resolution analytics, SLA compliance & trends', icon: BarChart3, path: '/reports/dashboard', permission: 'Report.View' }
  ];

  const companyCards = [
    { title: 'Company Organization', desc: 'Departments, Teams, Org Structure', icon: Building2, path: '/organization/dashboard', permission: 'Department.Read' },
    { title: 'Company User Directory', desc: 'Employee Accounts, Password Resets & Roles', icon: Users, path: '/users/dashboard', permission: 'User.Read.Company' },
    { title: 'Service Requests Tracker', desc: 'Issue Requests, Approvals & Status', icon: ListChecks, path: '/issues/dashboard', permission: 'Request.Read' },
    { title: 'Operational Analytics', desc: 'Department metrics, turnaround & reports', icon: BarChart3, path: '/reports/dashboard', permission: 'Report.View' },
    { title: 'Roles & Permission Matrix', desc: 'Custom Company Roles & Security', icon: ShieldCheck, path: '/roles/dashboard', permission: 'Role.Read' }
  ];

  const isTenantRep = !isParkAdmin && (
    (user?.roles && user.roles.some(r => (typeof r === 'string' ? r : r.RoleCode || r.name) === 'TENANT_REPRESENTATIVE')) ||
    user?.userTypeCode === 'TENANT_REPRESENTATIVE' ||
    user?.TenantID
  );

  const cards = isParkAdmin ? parkCards : isTenantRep ? tenantRepCards : companyCards;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Overview Header Banner */}
      <div className="glass-panel" style={{
        padding: '24px 28px',
        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15) 0%, rgba(124, 58, 237, 0.1) 100%)',
        borderRadius: '16px',
        border: '1px solid rgba(37, 99, 235, 0.25)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ padding: '3px 10px', borderRadius: '12px', background: 'var(--accent-gradient)', color: '#fff', fontSize: '0.75rem', fontWeight: 800 }}>
              {isParkAdmin ? 'Business Park Management' : isTenantRep ? 'Tenant Self-Service Portal' : 'Company Administration'}
            </span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            System Overview <span className="glow-text">Dashboard</span>
          </h1>
          <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            {isParkAdmin
              ? 'Welcome to the Business Park Service & IT Management Control Center.'
              : isTenantRep
                ? 'Welcome to your Tenant Self-Service Portal. Submit requests, view lease agreements, and track facilities services.'
                : 'Welcome to your Company IT & Service Management Administration Workspace.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '20px', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa', fontSize: '0.78rem', fontWeight: 700 }}>
            <Activity size={14} /> {isParkAdmin ? 'Multi-Tenant Active' : 'Company Isolated Scope'}
          </span>
        </div>
      </div>

      {/* Modules Quick Access Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        {cards.map(mod => {
          const Icon = mod.icon;
          return (
            <div
              key={mod.title}
              className="glass-panel"
              onClick={() => navigate(mod.path)}
              style={{
                padding: '20px',
                borderRadius: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '130px'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--accent-primary)';
                e.currentTarget.style.transform = 'translateY(-3px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--glass-border)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 700 }}>{mod.title}</h4>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>{mod.desc}</p>
                </div>
                <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(37,99,235,0.15)', color: 'var(--accent-primary)' }}>
                  <Icon size={20} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-primary)', marginTop: '12px' }}>
                Launch Module <ArrowUpRight size={14} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Embedded Employee Quick Request View for Admins as well */}
      <EmployeeDashboardPage />
    </div>
  );
}

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
    return <AdminOverviewDashboard />;
  }

  // Pure Employee role lands directly on Employee Dashboard
  return <EmployeeDashboardPage />;
}

export default DashboardRouter;
