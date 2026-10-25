import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../../i18n';
import {
  ShieldCheck, Plus, RefreshCw, Check, X, Trash2, Edit, Key, Lock, Users,
  Layers, CheckSquare, Square, MinusSquare, Search, ChevronRight, ChevronDown, AlertCircle,
  Shield, Tag, FileText
} from 'lucide-react';
import identityApi from '../api/identityApi';
import ConfirmDialogModal from '../../../components/common/ConfirmDialogModal';
import AlertDialogModal from '../../../components/common/AlertDialogModal';
import { ActionButton, ActionGroup } from '../../../components/common/ActionButton';
import { FormField } from '../../../components/common/FormField';
import { rolePermissionSchemas } from '../../../validation';
import { PERMISSION_MODULE_TREE, DEFAULT_ROLE_PRESETS, DATA_SCOPES } from '../../role-permission-management/constants/permissionConstants';

const SCOPE_COLORS = {
  OWN: { bg: 'rgba(234, 179, 8, 0.12)', text: '#eab308', border: 'rgba(234, 179, 8, 0.3)' },
  DEPARTMENT: { bg: 'rgba(59, 130, 246, 0.12)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' },
  COMPANY: { bg: 'rgba(16, 185, 129, 0.12)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)' },
  ALL: { bg: 'rgba(168, 85, 247, 0.12)', text: '#a855f7', border: 'rgba(168, 85, 247, 0.3)' }
};

export default function RolesTab() {
  const { t } = useTranslation();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Glass Dialog Modals State
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'error' });

  const showAlert = (title, message, type = 'error') => {
    setAlertConfig({ isOpen: true, title, message, type });
  };

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMatrixModal, setShowMatrixModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  // Permission Matrix state
  const [rolePermissions, setRolePermissions] = useState([]);
  const [matrixSaving, setMatrixSaving] = useState(false);

  // Matrix UI Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [expandedModules, setExpandedModules] = useState({});
  const [expandedGroups, setExpandedGroups] = useState({});

  // Form state
  const [formData, setFormData] = useState({ roleName: '', roleCode: '', description: '', isSystemRole: false });
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [roleErrors, setRoleErrors] = useState({});

  const clearRoleError = (field) => {
    if (roleErrors[field]) {
      setRoleErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const fetchRolesAndPermissions = async () => {
    setLoading(true);
    try {
      const [rolesRes, permRes] = await Promise.all([
        identityApi.getRoles(),
        identityApi.getPermissions()
      ]);

      if (rolesRes.data && rolesRes.data.status === 'success') {
        setRoles(rolesRes.data.data.roles || rolesRes.data.data || []);
      }
      if (permRes.data && permRes.data.status === 'success') {
        setPermissions(permRes.data.data.permissions || permRes.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load roles/permissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRolesAndPermissions();
  }, []);

  const handleSaveRole = async (e) => {
    e.preventDefault();
    setFormError('');

    const validation = rolePermissionSchemas.roleForm(formData, !!selectedRole);
    if (!validation.isValid) {
      setRoleErrors(validation.errors);
      return;
    }
    setRoleErrors({});

    setFormSubmitting(true);
    try {
      const payload = {
        roleName: validation.sanitized.roleName,
        roleCode: validation.sanitized.roleCode,
        description: validation.sanitized.description || '',
        isSystemRole: formData.isSystemRole
      };
      if (selectedRole) {
        await identityApi.updateRole(selectedRole.RoleID, payload);
      } else {
        await identityApi.createRole(payload);
      }
      setShowCreateModal(false);
      setSelectedRole(null);
      setFormData({ roleName: '', roleCode: '', description: '', isSystemRole: false });
      fetchRolesAndPermissions();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save role.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const openMatrixModal = async (role) => {
    setSelectedRole(role);
    setShowMatrixModal(true);
    setSearchTerm('');

    // Pre-load preset permissions if available
    let initialPerms = [];
    const code = (role.RoleCode || '').toUpperCase();
    if (DEFAULT_ROLE_PRESETS[code]) {
      initialPerms = [...DEFAULT_ROLE_PRESETS[code].permissions];
    }
    setRolePermissions(initialPerms);

    // Accordion default: expand first module
    const mods = {};
    const grps = {};
    if (PERMISSION_MODULE_TREE.length > 0) {
      const firstMod = PERMISSION_MODULE_TREE[0];
      mods[firstMod.moduleCode] = true;
      firstMod.groups.forEach(g => { grps[g.groupCode] = true; });
    }
    setExpandedModules(mods);
    setExpandedGroups(grps);

    try {
      const res = await identityApi.getRoleById(role.RoleID);
      if (res.data && res.data.status === 'success') {
        const fullRole = res.data.data;
        const fetchedList = fullRole.permissions || fullRole.Permissions || [];
        const fetchedCodes = fetchedList.map(p => p.PermissionCode || p.PermissionID || p).filter(Boolean);
        if (fetchedCodes.length > 0) {
          setRolePermissions(fetchedCodes);
        }
      }
    } catch (err) {
      console.error('Failed to load role permissions details:', err);
    }
  };

  const togglePermission = (permIdentifier) => {
    if (rolePermissions.includes(permIdentifier)) {
      setRolePermissions(rolePermissions.filter(id => id !== permIdentifier));
    } else {
      setRolePermissions([...rolePermissions, permIdentifier]);
    }
  };

  const toggleGroupAll = (groupPermissions) => {
    const codes = groupPermissions.map(p => p.code);
    const allSelected = codes.every(c => rolePermissions.includes(c));

    if (allSelected) {
      setRolePermissions(rolePermissions.filter(id => !codes.includes(id)));
    } else {
      const combined = new Set([...rolePermissions, ...codes]);
      setRolePermissions(Array.from(combined));
    }
  };

  const toggleModuleAll = (mod) => {
    const allCodes = mod.groups.flatMap(g => g.permissions.map(p => p.code));
    const allSelected = allCodes.every(c => rolePermissions.includes(c));

    if (allSelected) {
      setRolePermissions(rolePermissions.filter(id => !allCodes.includes(id)));
    } else {
      const combined = new Set([...rolePermissions, ...allCodes]);
      setRolePermissions(Array.from(combined));
    }
  };

  const toggleExpandModule = (code) => {
    setExpandedModules(prev => ({ ...prev, [code]: !prev[code] }));
  };

  const toggleExpandGroup = (code) => {
    setExpandedGroups(prev => ({ ...prev, [code]: !prev[code] }));
  };

  const expandAll = () => {
    const mods = {};
    const grps = {};
    PERMISSION_MODULE_TREE.forEach(mod => {
      mods[mod.moduleCode] = true;
      mod.groups.forEach(grp => { grps[grp.groupCode] = true; });
    });
    setExpandedModules(mods);
    setExpandedGroups(grps);
  };

  const collapseAll = () => {
    setExpandedModules({});
    setExpandedGroups({});
  };

  const handleSaveMatrix = async () => {
    if (!selectedRole) return;
    setMatrixSaving(true);

    try {
      await identityApi.syncRolePermissions(selectedRole.RoleID, rolePermissions);
      setShowMatrixModal(false);
      fetchRolesAndPermissions();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to sync permissions.';
      showAlert('Permission Sync Failed', msg, 'error');
    } finally {
      setMatrixSaving(false);
    }
  };

  const handleDeleteRole = (role) => {
    const roleTarget = role || selectedRole;
    if (!roleTarget) return;
    setConfirmConfig({
      isOpen: true,
      title: t('identity.decommissionRoleTitle'),
      message: `${t('identity.decommissionRolePrompt')} "${roleTarget.RoleName}"? ${t('identity.decommissionRoleNotice')}`,
      type: 'danger',
      confirmText: t('identity.deleteRoleBtn'),
      onConfirm: async () => {
        try {
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          await identityApi.deleteRole(roleTarget.RoleID);
          setShowDeleteModal(false);
          fetchRolesAndPermissions();
        } catch (err) {
          const msg = err.response?.data?.message || 'Failed to delete role.';
          showAlert('Action Restricted', msg, 'error');
        }
      }
    });
  };

  // Search auto-expands matching modules
  useEffect(() => {
    if (searchTerm.trim()) {
      const mods = {};
      const grps = {};
      PERMISSION_MODULE_TREE.forEach(mod => {
        mods[mod.moduleCode] = true;
        mod.groups.forEach(grp => { grps[grp.groupCode] = true; });
      });
      setExpandedModules(mods);
      setExpandedGroups(grps);
    }
  }, [searchTerm]);

  // Filter Modules
  const filteredModules = PERMISSION_MODULE_TREE.filter(mod => {
    if (moduleFilter !== 'ALL' && mod.moduleCode !== moduleFilter) return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    if (mod.moduleName.toLowerCase().includes(term)) return true;
    return mod.groups.some(g =>
      g.groupName.toLowerCase().includes(term) ||
      g.permissions.some(p => p.name.toLowerCase().includes(term) || p.code.toLowerCase().includes(term))
    );
  });

  // Count helpers
  const getModuleGrantedCount = (mod) => mod.groups.flatMap(g => g.permissions).filter(p => rolePermissions.includes(p.code)).length;
  const getModuleTotalCount = (mod) => mod.groups.flatMap(g => g.permissions).length;
  const getGroupGrantedCount = (grp) => grp.permissions.filter(p => rolePermissions.includes(p.code)).length;

  const getModuleCheckState = (mod) => {
    const allCodes = mod.groups.flatMap(g => g.permissions.map(p => p.code));
    const selected = allCodes.filter(c => rolePermissions.includes(c));
    if (selected.length === 0) return 'none';
    if (selected.length === allCodes.length) return 'all';
    return 'partial';
  };

  const getGroupCheckState = (grp) => {
    const codes = grp.permissions.map(p => p.code);
    const selected = codes.filter(c => rolePermissions.includes(c));
    if (selected.length === 0) return 'none';
    if (selected.length === codes.length) return 'all';
    return 'partial';
  };

  const CheckIcon = ({ state, size = 16 }) => {
    if (state === 'all') return <CheckSquare size={size} color="var(--accent-primary)" />;
    if (state === 'partial') return <MinusSquare size={size} color="#818cf8" />;
    return <Square size={size} color="#475569" />;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Bar */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '4px' }}>{t('identity.rolesHeader')}</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {t('identity.rolesHeaderDesc')}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={fetchRolesAndPermissions}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px',
              borderRadius: 'var(--border-radius-sm)', background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)', border: '1px solid var(--glass-border)', cursor: 'pointer'
            }}
          >
            <RefreshCw className={loading ? 'animate-spin' : ''} size={16} /> {t('common.refresh')}
          </button>

          <button
            onClick={() => {
              setSelectedRole(null);
              setFormData({ roleName: '', roleCode: '', description: '', isSystemRole: false });
              setRoleErrors({});
              setShowCreateModal(true);
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px',
              borderRadius: 'var(--border-radius-sm)', background: 'var(--accent-gradient)',
              color: '#ffffff', border: 'none', fontWeight: '600', cursor: 'pointer',
              boxShadow: 'var(--glow-accent)', fontSize: '0.88rem'
            }}
          >
            <Plus size={16} /> {t('identity.createSecurityRole')}
          </button>
        </div>
      </div>

      {/* Roles Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <RefreshCw className="animate-spin" size={32} style={{ marginBottom: '16px' }} />
          <p>{t('identity.loadingRoles')}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {roles.map((role) => (
            <div key={role.RoleID} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '4px' }}>{role.RoleName}</h4>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--accent-primary)', background: 'rgba(138, 75, 255, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                      {role.RoleCode}
                    </span>
                  </div>

                  {role.IsSystemRole ? (
                    <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>
                      <Lock size={10} style={{ marginRight: '4px' }} /> {t('identity.systemRole')}
                    </span>
                  ) : (
                    <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>{t('identity.customRole')}</span>
                  )}
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px', minHeight: '40px' }}>
                  {role.Description || 'No description provided for this security role.'}
                </p>
              </div>

              <div>
                <div style={{
                  padding: '12px', borderRadius: 'var(--border-radius-sm)',
                  background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                  marginBottom: '16px', display: 'flex', justifyContent: 'space-around', textAlign: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('identity.permissionsCount')}</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {role.PermissionCount || (role.Permissions ? role.Permissions.length : 0)}
                    </div>
                  </div>
                  <div style={{ borderLeft: '1px solid var(--glass-border)' }} />
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('identity.assignedUsers')}</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--accent-primary)' }}>
                      {role.UserCount || 0}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => openMatrixModal(role)}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      padding: '8px 12px', borderRadius: 'var(--border-radius-sm)',
                      background: 'var(--accent-gradient)', border: 'none', color: 'white',
                      fontWeight: '600', fontSize: '0.82rem', cursor: 'pointer'
                    }}
                  >
                    <Key size={14} /> {t('identity.permissionMatrixBtn')}
                  </button>

                  {!role.IsSystemRole && (
                    <ActionGroup align="right">
                      <ActionButton
                        variant="edit"
                        onClick={() => {
                          setSelectedRole(role);
                          setFormData({ roleName: role.RoleName, roleCode: role.RoleCode, description: role.Description || '', isSystemRole: false });
                          setRoleErrors({});
                          setShowCreateModal(true);
                        }}
                        title={t('common.edit')}
                        icon={<Edit size={14} />}
                      />

                      <ActionButton
                        variant="delete"
                        onClick={() => { setSelectedRole(role); setShowDeleteModal(true); }}
                        title={t('common.delete')}
                        icon={<Trash2 size={14} />}
                      />
                    </ActionGroup>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT ROLE METADATA MODAL */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem' }}>{selectedRole ? t('identity.editRoleModalTitle') : t('identity.createRoleModalTitle')}</h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div style={{ padding: '10px 14px', borderRadius: 'var(--border-radius-sm)', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--color-danger)', fontSize: '0.85rem', marginBottom: '16px' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveRole} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <FormField
                label={t('identity.roleDisplayName')}
                required
                icon={Shield}
                error={roleErrors.roleName}
                id="tab-role-name"
              >
                <input
                  id="tab-role-name"
                  type="text"
                  placeholder={t('identity.roleDisplayNamePlaceholder')}
                  value={formData.roleName}
                  onChange={(e) => {
                    setFormData({ ...formData, roleName: e.target.value });
                    clearRoleError('roleName');
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: 'var(--border-radius-sm)',
                    background: 'var(--bg-tertiary)',
                    border: roleErrors.roleName ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                    color: 'var(--text-primary)'
                  }}
                />
              </FormField>

              <FormField
                label={t('identity.roleUniqueCode')}
                required
                icon={Tag}
                error={roleErrors.roleCode}
                id="tab-role-code"
              >
                <input
                  id="tab-role-code"
                  type="text"
                  placeholder={t('identity.roleUniqueCodePlaceholder')}
                  value={formData.roleCode}
                  onChange={(e) => {
                    setFormData({ ...formData, roleCode: e.target.value.toUpperCase().replace(/\s+/g, '_') });
                    clearRoleError('roleCode');
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: 'var(--border-radius-sm)',
                    background: 'var(--bg-tertiary)',
                    border: roleErrors.roleCode ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                    color: 'var(--text-primary)',
                    fontFamily: 'monospace'
                  }}
                />
              </FormField>

              <FormField
                label={t('identity.roleDescLabel')}
                icon={FileText}
                error={roleErrors.description}
                id="tab-role-desc"
              >
                <textarea
                  id="tab-role-desc"
                  rows={3}
                  placeholder={t('identity.roleDescPlaceholder')}
                  value={formData.description}
                  onChange={(e) => {
                    setFormData({ ...formData, description: e.target.value });
                    clearRoleError('description');
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: 'var(--border-radius-sm)',
                    background: 'var(--bg-tertiary)',
                    border: roleErrors.description ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                    color: 'var(--text-primary)',
                    resize: 'vertical'
                  }}
                />
              </FormField>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button
                  type="button" onClick={() => setShowCreateModal(false)}
                  style={{ padding: '10px 18px', borderRadius: 'var(--border-radius-sm)', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', cursor: 'pointer' }}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit" disabled={formSubmitting}
                  style={{ padding: '10px 20px', borderRadius: 'var(--border-radius-sm)', background: 'var(--accent-gradient)', border: 'none', color: '#ffffff', fontWeight: '600', cursor: 'pointer' }}
                >
                  {formSubmitting ? t('identity.savingRoleBtn') : t('identity.saveRoleBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ENTERPRISE HIERARCHICAL PERMISSION MATRIX MODAL */}
      {showMatrixModal && selectedRole && (
        <div className="modal-overlay" onClick={() => setShowMatrixModal(false)}>
          <div className="modal-content" style={{ width: '840px', maxWidth: '94vw', maxHeight: '88vh', display: 'flex', flexDirection: 'column', padding: '24px' }} onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexShrink: 0 }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', margin: 0 }}>
                  {t('identity.permissionMatrixFor')} <span className="glow-text">{selectedRole.RoleName}</span>
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  {t('identity.matrixHierarchyDesc')} <code>{selectedRole.RoleCode}</code>
                </p>
              </div>
              <button onClick={() => setShowMatrixModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Controls Bar: Search & Module Filter */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px',
              background: 'var(--bg-tertiary)', padding: '10px 14px', borderRadius: 'var(--border-radius-sm)', marginBottom: '14px', flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: '260px' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text" placeholder={t('identity.searchPermPlaceholder')}
                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)',
                      borderRadius: '6px', padding: '7px 10px 7px 30px', color: 'var(--text-primary)', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </div>
                <select
                  value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}
                  style={{
                    background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)',
                    borderRadius: '6px', padding: '7px 10px', color: 'var(--text-primary)', fontSize: '0.82rem', outline: 'none'
                  }}
                >
                  <option value="ALL" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{t('rbac.allSystemModules')}</option>
                  {PERMISSION_MODULE_TREE.map(mod => (
                    <option key={mod.moduleCode} value={mod.moduleCode} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{mod.moduleName}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--accent-primary)', fontWeight: 700, fontSize: '0.82rem' }}>
                  {rolePermissions.length} {t('identity.grantedBadge')}
                </span>
                <button type="button" onClick={expandAll} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.78rem', cursor: 'pointer', textDecoration: 'underline' }}>
                  {t('identity.expandAll')}
                </button>
                <button type="button" onClick={collapseAll} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.78rem', cursor: 'pointer', textDecoration: 'underline' }}>
                  {t('identity.collapseAll')}
                </button>
                <button type="button" onClick={() => setRolePermissions([])} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', fontSize: '0.78rem', cursor: 'pointer', textDecoration: 'underline' }}>
                  {t('identity.clearAll')}
                </button>
              </div>
            </div>

            {/* Tree View Body with Custom Scrollbar & flexShrink: 0 on Module Cards */}
            <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', minHeight: 0, paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredModules.map(mod => {
                const isModExpanded = !!expandedModules[mod.moduleCode];
                const modCheckState = getModuleCheckState(mod);
                const grantedCount = getModuleGrantedCount(mod);
                const totalCount = getModuleTotalCount(mod);

                return (
                  <div key={mod.moduleCode} style={{
                    background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--border-radius-sm)', overflow: 'hidden', flexShrink: 0
                  }}>
                    {/* Module Level Header */}
                    <div
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px',
                        background: modCheckState !== 'none' ? 'rgba(138, 75, 255, 0.08)' : 'transparent',
                        cursor: 'pointer', userSelect: 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }} onClick={() => toggleExpandModule(mod.moduleCode)}>
                        {isModExpanded ? <ChevronDown size={16} color="var(--accent-primary)" /> : <ChevronRight size={16} color="var(--text-muted)" />}
                        <ShieldCheck size={16} color="var(--accent-primary)" />
                        <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                          {mod.moduleName}
                        </span>
                        <span style={{
                          background: grantedCount > 0 ? 'rgba(138, 75, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                          color: grantedCount > 0 ? 'var(--accent-primary)' : 'var(--text-muted)',
                          fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '10px'
                        }}>
                          {grantedCount}/{totalCount}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); toggleModuleAll(mod); }}
                          style={{
                            background: modCheckState === 'all' ? 'rgba(138, 75, 255, 0.2)' : 'rgba(255,255,255,0.04)',
                            border: '1px solid var(--glass-border)', borderRadius: '4px',
                            padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600,
                            color: 'var(--accent-primary)', cursor: 'pointer'
                          }}
                        >
                          {modCheckState === 'all' ? t('identity.deselectModule') : t('identity.selectModule')}
                        </button>
                        <div onClick={(e) => { e.stopPropagation(); toggleModuleAll(mod); }} style={{ cursor: 'pointer' }}>
                          <CheckIcon state={modCheckState} />
                        </div>
                      </div>
                    </div>

                    {/* Permission Groups */}
                    {isModExpanded && (
                      <div style={{ padding: '0 10px 10px 10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {mod.groups.map(grp => {
                          const isGrpExpanded = !!expandedGroups[grp.groupCode];
                          const grpCheckState = getGroupCheckState(grp);
                          const grpGranted = getGroupGrantedCount(grp);

                          const visiblePerms = searchTerm.trim()
                            ? grp.permissions.filter(p =>
                              p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              p.code.toLowerCase().includes(searchTerm.toLowerCase()))
                            : grp.permissions;
                          if (searchTerm.trim() && visiblePerms.length === 0 && !grp.groupName.toLowerCase().includes(searchTerm.toLowerCase())) return null;

                          return (
                            <div key={grp.groupCode} style={{
                              background: 'rgba(0, 0, 0, 0.15)', borderRadius: '6px',
                              border: grpCheckState !== 'none' ? '1px solid rgba(138, 75, 255, 0.2)' : '1px solid transparent',
                              flexShrink: 0
                            }}>
                              {/* Group Level Header */}
                              <div
                                style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                  padding: '9px 12px', cursor: 'pointer', userSelect: 'none'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }} onClick={() => toggleExpandGroup(grp.groupCode)}>
                                  {isGrpExpanded ? <ChevronDown size={14} color="var(--text-muted)" /> : <ChevronRight size={14} color="#475569" />}
                                  <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.85rem' }}>
                                    ▸ {grp.groupName}
                                  </span>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    ({grpGranted}/{grp.permissions.length})
                                  </span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); toggleGroupAll(grp.permissions); }}
                                    style={{
                                      background: 'none', border: 'none', fontSize: '0.75rem',
                                      color: 'var(--accent-primary)', cursor: 'pointer', textDecoration: 'underline'
                                    }}
                                  >
                                    {grpCheckState === 'all' ? t('identity.deselectGroup') : t('identity.selectGroup')}
                                  </button>
                                  <div onClick={(e) => { e.stopPropagation(); toggleGroupAll(grp.permissions); }} style={{ cursor: 'pointer' }}>
                                    <CheckIcon state={grpCheckState} size={14} />
                                  </div>
                                </div>
                              </div>

                              {/* Granular Permissions Checkboxes */}
                              {isGrpExpanded && (
                                <div style={{ padding: '2px 12px 10px 28px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '8px' }}>
                                  {(searchTerm.trim() ? visiblePerms : grp.permissions).map(perm => {
                                    const checked = rolePermissions.includes(perm.code);
                                    const scopeStyle = SCOPE_COLORS[perm.scope] || SCOPE_COLORS.COMPANY;

                                    return (
                                      <div
                                        key={perm.code}
                                        onClick={() => togglePermission(perm.code)}
                                        style={{
                                          display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '8px 10px',
                                          borderRadius: '6px', cursor: 'pointer',
                                          background: checked ? 'rgba(138, 75, 255, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                                          border: checked ? '1px solid var(--accent-primary)' : '1px solid rgba(255,255,255,0.05)',
                                          transition: 'all 0.15s ease'
                                        }}
                                      >
                                        <input
                                          type="checkbox" checked={checked} onChange={() => {}}
                                          style={{ marginTop: '2px', accentColor: 'var(--accent-primary)', cursor: 'pointer', flexShrink: 0 }}
                                        />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                            <span style={{ color: checked ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 }}>
                                              {perm.name}
                                            </span>
                                            {perm.scope && (
                                              <span style={{
                                                background: scopeStyle.bg, color: scopeStyle.text,
                                                border: `1px solid ${scopeStyle.border}`,
                                                fontSize: '0.65rem', fontWeight: 700, padding: '1px 5px', borderRadius: '4px',
                                                textTransform: 'uppercase'
                                              }}>
                                                {perm.scope}
                                              </span>
                                            )}
                                          </div>
                                          <code style={{ fontSize: '0.72rem', color: 'var(--accent-primary)', display: 'block', marginTop: '1px' }}>{perm.code}</code>
                                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '1px' }}>{perm.description}</div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Modal Footer Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '14px', marginTop: '10px', borderTop: '1px solid var(--glass-border)', flexShrink: 0 }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {rolePermissions.length} {t('identity.matrixFooterNotice')} <strong>{selectedRole.RoleName}</strong>
              </span>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button" onClick={() => setShowMatrixModal(false)}
                  style={{ padding: '9px 18px', borderRadius: 'var(--border-radius-sm)', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', cursor: 'pointer' }}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button" onClick={handleSaveMatrix} disabled={matrixSaving}
                  style={{ padding: '9px 22px', borderRadius: 'var(--border-radius-sm)', background: 'var(--accent-gradient)', border: 'none', color: '#ffffff', fontWeight: '600', cursor: 'pointer' }}
                >
                  {matrixSaving ? t('identity.syncingMatrixBtn') : t('identity.syncMatrixBtn')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shared Glass Modals */}
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
