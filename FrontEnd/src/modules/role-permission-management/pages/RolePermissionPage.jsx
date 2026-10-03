import React, { useState } from 'react';
import { ShieldCheck, Sliders, FileText, Plus, Shield } from 'lucide-react';
import RolePermissionMatrix from '../components/RolePermissionMatrix';
import CompanyRoleModal from '../components/CompanyRoleModal';
import RbacAuditLogsTab from '../components/RbacAuditLogsTab';
import RbacRolesManagementPage from './RbacRolesManagementPage';
import Can from '../guards/Can';
import { usePermission } from '../hooks/usePermission';

export default function RolePermissionPage() {
  const [activeTab, setActiveTab] = useState('management'); // management | matrix | audit
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleToEdit, setRoleToEdit] = useState(null);
  const { userScope, isParkAdmin, isCompanyAdmin } = usePermission();

  const handleOpenCreateRole = () => {
    setRoleToEdit(null);
    setShowRoleModal(true);
  };

  const handleOpenEditRole = (role) => {
    setRoleToEdit(role);
    setShowRoleModal(true);
  };

  return (
    <div>
      {/* Page Title & Scope Badge */}
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '2.2rem', marginBottom: '8px' }}>
            Role & Permission <span className="glow-text">Governance</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Enterprise Role-Based Access Control (RBAC), custom role creation, multi-tenant administration scopes, and resource permission matrix.
          </p>
        </div>

        <div style={{
          background: isParkAdmin ? 'rgba(138, 75, 255, 0.15)' : 'rgba(59, 130, 246, 0.15)',
          border: isParkAdmin ? '1px solid rgba(138, 75, 255, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '12px', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          <ShieldCheck size={20} color={isParkAdmin ? '#a855f7' : '#3b82f6'} />
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Active Administration Scope
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: isParkAdmin ? '#a855f7' : '#3b82f6' }}>
              {isParkAdmin ? '🏢 Business Park Administration Scope' : '🏬 Tenant Company Administration Scope'}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Controls */}
      <div style={{
        display: 'flex',
        gap: '6px',
        padding: '6px',
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: 'var(--border-radius-md)',
        marginBottom: '28px',
        overflowX: 'auto'
      }}>
        <button
          onClick={() => setActiveTab('management')}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
            borderRadius: 'var(--border-radius-sm)', border: 'none',
            background: activeTab === 'management' ? 'var(--accent-gradient)' : 'transparent',
            color: activeTab === 'management' ? 'white' : 'var(--text-muted)',
            fontWeight: activeTab === 'management' ? '600' : '500',
            fontSize: '0.88rem', cursor: 'pointer', boxShadow: activeTab === 'management' ? 'var(--glow-accent)' : 'none'
          }}
        >
          <Shield size={16} /> Role Definitions & Creation
        </button>

        <button
          onClick={() => setActiveTab('matrix')}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
            borderRadius: 'var(--border-radius-sm)', border: 'none',
            background: activeTab === 'matrix' ? 'var(--accent-gradient)' : 'transparent',
            color: activeTab === 'matrix' ? 'white' : 'var(--text-muted)',
            fontWeight: activeTab === 'matrix' ? '600' : '500',
            fontSize: '0.88rem', cursor: 'pointer', boxShadow: activeTab === 'matrix' ? 'var(--glow-accent)' : 'none'
          }}
        >
          <Sliders size={16} /> Permission Assignment Matrix
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
            borderRadius: 'var(--border-radius-sm)', border: 'none',
            background: activeTab === 'audit' ? 'var(--accent-gradient)' : 'transparent',
            color: activeTab === 'audit' ? 'white' : 'var(--text-muted)',
            fontWeight: activeTab === 'audit' ? '600' : '500',
            fontSize: '0.88rem', cursor: 'pointer', boxShadow: activeTab === 'audit' ? 'var(--glow-accent)' : 'none'
          }}
        >
          <FileText size={16} /> Security Audit Trail
        </button>
      </div>

      {/* Active Tab View */}
      <div>
        {activeTab === 'management' && <RbacRolesManagementPage />}

        {activeTab === 'matrix' && (
          <RolePermissionMatrix
            onOpenCreateRole={handleOpenCreateRole}
            onOpenEditRole={handleOpenEditRole}
          />
        )}

        {activeTab === 'audit' && <RbacAuditLogsTab />}
      </div>

      {/* Role Create / Edit Modal */}
      {showRoleModal && (
        <CompanyRoleModal
          roleToEdit={roleToEdit}
          onClose={() => setShowRoleModal(false)}
          onSuccess={() => setActiveTab('matrix')}
        />
      )}
    </div>
  );
}
