import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, Plus, Edit2, Trash2, Sliders, Search, RefreshCw,
  Shield, Key, Lock, Users, Layers, AlertCircle, CheckCircle2,
  ChevronRight, Building2, UserCheck, Info
} from 'lucide-react';
import rbacApi from '../api/rbacApi';
import CompanyRoleModal from '../components/CompanyRoleModal';
import ConfirmDialogModal from '../../../components/common/ConfirmDialogModal';
import AlertDialogModal from '../../../components/common/AlertDialogModal';
import { usePermission } from '../hooks/usePermission';
import { useTranslation } from '../../../i18n';

export default function RbacRolesManagementPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isParkAdmin, isCompanyAdmin } = usePermission();

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'SYSTEM' | 'CUSTOM'

  // Modals state
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleToEdit, setRoleToEdit] = useState(null);

  // Glass Dialog Modals State
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', type: 'danger', confirmText: 'Confirm', onConfirm: () => {} });
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'success' });

  const showAlert = (title, message, type = 'success') => {
    setAlertConfig({ isOpen: true, title, message, type });
  };

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await rbacApi.getRoles();
      if (res.data && res.data.status === 'success') {
        setRoles(res.data.data.roles || res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch roles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleOpenCreateRole = () => {
    setRoleToEdit(null);
    setShowRoleModal(true);
  };

  const handleOpenEditRole = (role) => {
    setRoleToEdit(role);
    setShowRoleModal(true);
  };

  const handleDeleteRole = (role) => {
    const isSystemRole = role.IsSystemRole || role.isSystemRole || ['SUPER_ADMIN', 'PARK_ADMIN', 'TENANT_REPRESENTATIVE', 'TENANT_ADMIN', 'COMPANY_ADMIN', 'DISPATCHER', 'TECHNICIAN', 'EMPLOYEE'].includes((role.RoleCode || '').toUpperCase());

    if (isSystemRole) {
      showAlert(t('rbac.protectedSystemRole', 'Protected System Role'), t('rbac.protectedSystemRoleDesc', { name: role.RoleName || role.roleName }, `The role "${role.RoleName || role.roleName}" is a core system role and cannot be deleted. You can edit its permissions or create a custom role instead.`), 'warning');
      return;
    }

    setConfirmConfig({
      isOpen: true,
      title: t('rbac.deleteCustomRoleTitle', 'Delete Custom Role'),
      message: t('rbac.deleteCustomRolePrompt', { name: role.RoleName || role.roleName }, `Are you sure you want to delete role "${role.RoleName || role.roleName}"? Users assigned to this role will revert to default permissions.`),
      type: 'danger',
      confirmText: t('rbac.deleteRole', 'Delete Role'),
      onConfirm: async () => {
        try {
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          await rbacApi.deleteRole(role.RoleID || role.roleId);
          showAlert(t('rbac.deleteRole', 'Role Deleted'), t('rbac.roleDeletedSuccess', { name: role.RoleName || role.roleName }, `Role "${role.RoleName || role.roleName}" was deleted successfully.`), 'success');
          fetchRoles();
        } catch (err) {
          showAlert(t('rbac.deletionFailed', 'Deletion Failed'), err.response?.data?.message || 'Failed to delete role.', 'error');
        }
      }
    });
  };

  // Filtering
  const filteredRoles = roles.filter(role => {
    const code = (role.RoleCode || role.roleCode || '').toUpperCase();
    const name = (role.RoleName || role.roleName || '').toLowerCase();
    const desc = (role.Description || role.description || '').toLowerCase();
    const searchTerm = search.toLowerCase();

    const isSystem = role.IsSystemRole || role.isSystemRole || ['SUPER_ADMIN', 'PARK_ADMIN', 'TENANT_REPRESENTATIVE', 'TENANT_ADMIN', 'COMPANY_ADMIN', 'DISPATCHER', 'TECHNICIAN', 'EMPLOYEE'].includes(code);

    if (filterType === 'SYSTEM' && !isSystem) return false;
    if (filterType === 'CUSTOM' && isSystem) return false;

    if (!searchTerm) return true;
    return name.includes(searchTerm) || code.includes(searchTerm) || desc.includes(searchTerm);
  });

  const systemRolesCount = roles.filter(r => r.IsSystemRole || r.isSystemRole || ['SUPER_ADMIN', 'PARK_ADMIN', 'TENANT_REPRESENTATIVE', 'TENANT_ADMIN', 'COMPANY_ADMIN', 'DISPATCHER', 'TECHNICIAN', 'EMPLOYEE'].includes((r.RoleCode || '').toUpperCase())).length;
  const customRolesCount = roles.length - systemRolesCount;

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div style={{
        marginBottom: '28px', padding: '24px 28px', borderRadius: '20px',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 41, 59, 0.85) 50%, rgba(15, 23, 42, 0.9) 100%), url("/auth_background.jpg")',
        backgroundSize: 'cover', backgroundPosition: 'center',
        border: '1px solid rgba(138, 75, 255, 0.3)',
        boxShadow: '0 12px 36px rgba(15, 23, 42, 0.35)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px',
        position: 'relative', overflow: 'hidden'
      }}>
        {/* Top Multi-Tone Brand Accent */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
          background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 40%, #0284c7 75%, #10b981 100%)'
        }} />

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
            }}>
              <ShieldCheck size={20} />
            </div>
            <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.85rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
              {t('rbac.tabRoleDefinitions', 'Role Definitions & Governance')}
            </h1>
          </div>
          <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.92rem', maxWidth: '700px' }}>
            {t('rbac.governanceSubtitle', 'Define, create, update, and manage enterprise security roles, tenant access policies, and permission templates.')}
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={handleOpenCreateRole}
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            border: 'none', borderRadius: '14px', padding: '12px 24px',
            color: '#ffffff', fontWeight: 800, fontSize: '0.92rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '9px',
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.35)', transition: 'all 0.25s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(99, 102, 241, 0.45)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(99, 102, 241, 0.35)'; }}
        >
          <Plus size={18} /> {t('rbac.createCustomRole', 'Create Custom Role')}
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div className="glass-panel" style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '14px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
            <Shield size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>{t('rbac.totalConfiguredRoles', 'Total Configured Roles')}</div>
            <div style={{ fontSize: '1.65rem', fontWeight: '800', color: 'var(--text-primary)' }}>{roles.length}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
            <Lock size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>{t('rbac.systemProtectedRoles', 'System Protected Roles')}</div>
            <div style={{ fontSize: '1.65rem', fontWeight: '800', color: 'var(--text-primary)' }}>{systemRolesCount}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '14px', background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', border: '1px solid rgba(168, 85, 247, 0.25)' }}>
            <Key size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>{t('rbac.customTenantRoles', 'Custom Tenant Roles')}</div>
            <div style={{ fontSize: '1.65rem', fontWeight: '800', color: 'var(--text-primary)' }}>{customRolesCount}</div>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '300px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              placeholder={t('rbac.searchRolesPlaceholder', 'Search role name, code, or description...')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px 10px 42px', background: 'var(--bg-tertiary)',
                border: '1px solid var(--glass-border)', borderRadius: '12px',
                color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
            <button
              onClick={() => setFilterType('ALL')}
              style={{
                padding: '6px 14px', borderRadius: '8px', border: 'none',
                background: filterType === 'ALL' ? 'var(--accent-gradient)' : 'transparent',
                color: filterType === 'ALL' ? '#ffffff' : 'var(--text-muted)',
                fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer'
              }}
            >
              {t('rbac.filterAll', 'All')} ({roles.length})
            </button>
            <button
              onClick={() => setFilterType('SYSTEM')}
              style={{
                padding: '6px 14px', borderRadius: '8px', border: 'none',
                background: filterType === 'SYSTEM' ? 'var(--accent-gradient)' : 'transparent',
                color: filterType === 'SYSTEM' ? '#ffffff' : 'var(--text-muted)',
                fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer'
              }}
            >
              {t('rbac.filterSystem', 'System')} ({systemRolesCount})
            </button>
            <button
              onClick={() => setFilterType('CUSTOM')}
              style={{
                padding: '6px 14px', borderRadius: '8px', border: 'none',
                background: filterType === 'CUSTOM' ? 'var(--accent-gradient)' : 'transparent',
                color: filterType === 'CUSTOM' ? '#ffffff' : 'var(--text-muted)',
                fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer'
              }}
            >
              {t('rbac.filterCustom', 'Custom')} ({customRolesCount})
            </button>
          </div>
        </div>

        <button
          onClick={fetchRoles}
          style={{
            padding: '9px 16px', borderRadius: '12px', background: 'var(--bg-tertiary)',
            border: '1px solid var(--glass-border)', color: 'var(--text-secondary)',
            fontSize: '0.86rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> {t('rbac.refreshRoles', 'Refresh Roles')}
        </button>
      </div>

      {/* Role Cards Grid */}
      {loading ? (
        <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
          <RefreshCw className="animate-spin" size={32} style={{ marginBottom: '12px' }} />
          <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{t('rbac.loadingRoles', 'Loading Security Role Definitions...')}</div>
        </div>
      ) : filteredRoles.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Info size={40} style={{ marginBottom: '12px', opacity: 0.6 }} />
          <h3 style={{ margin: '0 0 6px', color: 'var(--text-primary)' }}>{t('rbac.noRolesFound', 'No Roles Found')}</h3>
          <p style={{ margin: 0, fontSize: '0.88rem' }}>{t('rbac.noRolesFoundDesc', 'No role definitions matched your filter search query.')}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '36px' }}>
          {filteredRoles.map(role => {
            const roleCode = (role.RoleCode || role.roleCode || '').toUpperCase();
            const roleName = role.RoleName || role.roleName || 'Unnamed Role';
            const description = role.Description || role.description || 'No description provided for this security role.';
            const isSystemRole = role.IsSystemRole || role.isSystemRole || ['SUPER_ADMIN', 'TENANT_ADMIN', 'DISPATCHER', 'TECHNICIAN', 'EMPLOYEE'].includes(roleCode);
            const permCount = role.PermissionCodes ? role.PermissionCodes.length : (role.permissions ? role.permissions.length : 0);

            return (
              <div
                key={role.RoleID || role.roleId || roleCode}
                className="glass-card"
                style={{
                  padding: '24px', borderRadius: '18px', display: 'flex', flexDirection: 'column',
                  justifyContent: 'space-between', border: '1px solid rgba(148, 163, 184, 0.18)',
                  position: 'relative', overflow: 'hidden', transition: 'all 0.25s ease'
                }}
              >
                {/* Accent Top Border */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                  background: isSystemRole ? 'linear-gradient(90deg, #6366f1 0%, #a855f7 100%)' : 'linear-gradient(90deg, #0284c7 0%, #10b981 100%)'
                }} />

                <div>
                  {/* Card Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '44px', height: '44px', borderRadius: '14px',
                        background: isSystemRole ? 'rgba(99, 102, 241, 0.15)' : 'rgba(2, 132, 199, 0.15)',
                        border: isSystemRole ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid rgba(2, 132, 199, 0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: isSystemRole ? '#818cf8' : '#0284c7'
                      }}>
                        {isSystemRole ? <ShieldCheck size={22} /> : <Key size={22} />}
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {roleName}
                        </h3>
                        <code style={{ fontSize: '0.74rem', color: '#818cf8', marginTop: '2px', display: 'block', fontFamily: 'monospace', fontWeight: 700 }}>
                          {roleCode}
                        </code>
                      </div>
                    </div>

                    <span style={{
                      padding: '4px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 800,
                      background: isSystemRole ? 'rgba(99, 102, 241, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                      color: isSystemRole ? '#818cf8' : '#10b981',
                      border: isSystemRole ? '1px solid rgba(99, 102, 241, 0.25)' : '1px solid rgba(16, 185, 129, 0.25)'
                    }}>
                      {isSystemRole ? t('rbac.systemProtected', 'SYSTEM PROTECTED') : t('rbac.customTenant', 'CUSTOM TENANT')}
                    </span>
                  </div>

                  <p style={{ margin: '0 0 18px', fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                    {description}
                  </p>

                  <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                    <div style={{ padding: '6px 12px', borderRadius: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={14} color="#10b981" /> {permCount > 0 ? t('rbac.permissionsGrantedCount', { count: permCount }, `${permCount} Permissions Granted`) : t('rbac.fullScopeGranted', 'Full Scope Granted')}
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div style={{ display: 'flex', gap: '8px', paddingTop: '14px', borderTop: '1px solid var(--glass-border)', justifyContent: 'space-between' }}>
                  <button
                    onClick={() => navigate('/roles/matrix')}
                    style={{
                      padding: '8px 14px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)',
                      border: '1px solid rgba(99, 102, 241, 0.25)', color: '#818cf8', fontSize: '0.82rem',
                      fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                    }}
                  >
                    <Sliders size={14} /> {t('rbac.matrixMap', 'Matrix Map')}
                  </button>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => handleOpenEditRole(role)}
                      style={{
                        padding: '8px 14px', borderRadius: '10px', background: 'var(--bg-tertiary)',
                        border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontSize: '0.82rem',
                        fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                      }}
                    >
                      <Edit2 size={14} /> {t('rbac.editRole', 'Edit Role')}
                    </button>

                    <button
                      onClick={() => handleDeleteRole(role)}
                      style={{
                        padding: '8px 12px', borderRadius: '10px', background: 'rgba(220, 38, 38, 0.08)',
                        border: '1px solid rgba(220, 38, 38, 0.2)', color: '#ef4444', fontSize: '0.82rem',
                        fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Role Create / Edit Modal */}
      {showRoleModal && (
        <CompanyRoleModal
          roleToEdit={roleToEdit}
          onClose={() => setShowRoleModal(false)}
          onSuccess={() => {
            setShowRoleModal(false);
            fetchRoles();
          }}
        />
      )}

      {/* Glass Modals */}
      <ConfirmDialogModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        confirmText={confirmConfig.confirmText}
        onConfirm={confirmConfig.onConfirm}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />

      <AlertDialogModal
        isOpen={alertConfig.isOpen}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
