import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck, Plus, Check, Search, RefreshCw, ChevronRight, ChevronDown,
  Building2, Users, Layers, BookOpen, Bell, BarChart2, FileText,
  Shield, Settings, Wrench, Package, Sliders, Download, Lock, CheckSquare,
  Square, Sparkles, Filter, Info, ShieldAlert, ArrowUpDown, X
} from 'lucide-react';
import { PERMISSION_MODULE_TREE, ADMIN_SCOPES } from '../constants/permissionConstants';
import rbacApi from '../api/rbacApi';
import { usePermission } from '../hooks/usePermission';
import Can from '../guards/Can';
import { useTranslation } from '../../../i18n';

const SCOPE_COLORS = {
  OWN: { bg: 'rgba(234, 179, 8, 0.15)', text: '#eab308', border: 'rgba(234, 179, 8, 0.3)' },
  DEPARTMENT: { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' },
  COMPANY: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)' },
  ALL: { bg: 'rgba(168, 85, 247, 0.15)', text: '#a855f7', border: 'rgba(168, 85, 247, 0.3)' }
};

const MODULE_ICONS = {
  MOD_PARK: Building2, MOD_TENANT: Package, MOD_ORG: Layers, MOD_IAM: Users,
  MOD_RBAC: Shield, MOD_CATALOG: Settings, MOD_ISSUE: Wrench, MOD_KB: BookOpen,
  MOD_NOTIF: Bell, MOD_REPORT: BarChart2, MOD_AUDIT: FileText
};

export default function RolePermissionMatrix({ onOpenCreateRole, onOpenEditRole }) {
  const { t } = useTranslation();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [expandedModules, setExpandedModules] = useState({});
  const [expandedGroups, setExpandedGroups] = useState({});
  const [cellUpdating, setCellUpdating] = useState({});
  const [toastMessage, setToastMessage] = useState(null);
  const [editRoleMenu, setEditRoleMenu] = useState(null);

  const { userScope, isParkAdmin, isCompanyAdmin } = usePermission();

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await rbacApi.getRoles();
      if (res.data && res.data.status === 'success') {
        const fetchedRoles = res.data.data.roles || res.data.data || [];
        setRoles(Array.isArray(fetchedRoles) ? fetchedRoles : []);
      }
    } catch (err) {
      console.error('Failed to load roles matrix:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
    const mods = {};
    const grps = {};
    PERMISSION_MODULE_TREE.forEach(mod => {
      mods[mod.moduleCode] = true;
      mod.groups.forEach(grp => { grps[grp.groupCode] = true; });
    });
    setExpandedModules(mods);
    setExpandedGroups(grps);
  }, []);

  const getRolePermissionCodes = (role) => {
    if (!role) return [];
    if (role.PermissionCodes && Array.isArray(role.PermissionCodes)) {
      return role.PermissionCodes;
    }
    if (role.permissions && Array.isArray(role.permissions)) {
      return role.permissions.map(p => typeof p === 'string' ? p : (p.PermissionCode || p.code || ''));
    }
    return [];
  };

  const isPermissionGranted = (role, permCode) => {
    const perms = getRolePermissionCodes(role);
    return perms.includes('*') || perms.includes(permCode);
  };

  const isProtectedRole = (role) => {
    if (!role) return false;
    const code = (role.RoleCode || role.roleCode || '').toUpperCase();
    return code === 'SUPER_ADMIN' || code === 'SYSTEM_ADMINISTRATOR';
  };

  // Toggle single cell permission
  const handleToggleCell = async (role, permCode, permName) => {
    if (isProtectedRole(role)) {
      showToast(`Role '${role.RoleName || role.roleName}' is system-protected with full wildcard access.`, 'warning');
      return;
    }

    const roleId = role.RoleID || role.roleId;
    const cellKey = `${roleId}_${permCode}`;
    setCellUpdating(prev => ({ ...prev, [cellKey]: true }));

    const currentCodes = getRolePermissionCodes(role).filter(c => c !== '*');
    const wasGranted = currentCodes.includes(permCode);
    const newCodes = wasGranted
      ? currentCodes.filter(c => c !== permCode)
      : [...currentCodes, permCode];

    try {
      await rbacApi.syncRolePermissions(roleId, newCodes);

      // Update local state immediately
      setRoles(prevRoles => prevRoles.map(r => {
        if ((r.RoleID || r.roleId) === roleId) {
          return {
            ...r,
            PermissionCodes: newCodes,
            permissions: newCodes
          };
        }
        return r;
      }));

      showToast(`Permission '${permName || permCode}' ${wasGranted ? 'revoked from' : 'granted to'} '${role.RoleName || role.roleName}'.`, 'success');
    } catch (err) {
      console.error('Failed to sync permission cell:', err);
      showToast(err.response?.data?.message || 'Failed to update permission.', 'error');
    } finally {
      setCellUpdating(prev => ({ ...prev, [cellKey]: false }));
    }
  };

  // Bulk Grant or Revoke Group for Role
  const handleBulkGroupToggle = async (role, groupPermissions, grant = true) => {
    if (isProtectedRole(role)) {
      showToast(`Role '${role.RoleName}' is system-protected.`, 'warning');
      return;
    }

    const roleId = role.RoleID || role.roleId;
    const currentCodes = getRolePermissionCodes(role).filter(c => c !== '*');
    const groupCodes = groupPermissions.map(p => p.code);

    let newCodes = [];
    if (grant) {
      const added = new Set([...currentCodes, ...groupCodes]);
      newCodes = Array.from(added);
    } else {
      newCodes = currentCodes.filter(c => !groupCodes.includes(c));
    }

    try {
      await rbacApi.syncRolePermissions(roleId, newCodes);
      setRoles(prevRoles => prevRoles.map(r => {
        if ((r.RoleID || r.roleId) === roleId) {
          return { ...r, PermissionCodes: newCodes, permissions: newCodes };
        }
        return r;
      }));
      showToast(`${grant ? 'Granted' : 'Revoked'} ${groupCodes.length} permissions for '${role.RoleName}'.`, 'success');
    } catch (err) {
      showToast('Bulk update failed.', 'error');
    }
  };

  // Export Matrix to CSV
  const handleExportCSV = () => {
    const activeRoles = filteredRoles;
    const headers = ['Module', 'Group', 'Permission Code', 'Permission Name', 'Scope', ...activeRoles.map(r => `"${r.RoleName || r.roleName}"`)];

    const rows = [];
    filteredModules.forEach(mod => {
      mod.groups.forEach(grp => {
        grp.permissions.forEach(perm => {
          const row = [
            `"${mod.moduleName}"`,
            `"${grp.groupName}"`,
            `"${perm.code}"`,
            `"${perm.name}"`,
            `"${perm.scope}"`,
            ...activeRoles.map(r => isPermissionGranted(r, perm.code) ? '"GRANTED"' : '"DENIED"')
          ];
          rows.push(row.join(','));
        });
      });
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rbac_permission_matrix_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('RBAC Permission Matrix exported to CSV.', 'success');
  };

  // Filtered Roles
  const filteredRoles = useMemo(() => {
    if (roleFilter === 'ALL') return roles;
    return roles.filter(r => String(r.RoleID || r.roleId) === String(roleFilter));
  }, [roles, roleFilter]);

  // Filtered Modules
  const filteredModules = useMemo(() => {
    return PERMISSION_MODULE_TREE.filter(mod => {
      if (moduleFilter !== 'ALL' && mod.moduleCode !== moduleFilter) return false;
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      if (mod.moduleName.toLowerCase().includes(term)) return true;
      return mod.groups.some(g =>
        g.groupName.toLowerCase().includes(term) ||
        g.permissions.some(p => p.name.toLowerCase().includes(term) || p.code.toLowerCase().includes(term))
      );
    });
  }, [moduleFilter, searchTerm]);

  // Total Metrics
  const matrixStats = useMemo(() => {
    let totalPerms = 0;
    PERMISSION_MODULE_TREE.forEach(mod => {
      mod.groups.forEach(grp => {
        totalPerms += grp.permissions.length;
      });
    });

    let totalGrants = 0;
    roles.forEach(r => {
      const perms = getRolePermissionCodes(r);
      if (perms.includes('*')) {
        totalGrants += totalPerms;
      } else {
        totalGrants += perms.length;
      }
    });

    return { totalPerms, totalRoles: roles.length, totalGrants };
  }, [roles]);

  const toggleExpandModule = (code) => setExpandedModules(prev => ({ ...prev, [code]: !prev[code] }));
  const toggleExpandGroup = (code) => setExpandedGroups(prev => ({ ...prev, [code]: !prev[code] }));

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Toast Notification Pill */}
      {toastMessage && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px', zIndex: 10000,
          background: toastMessage.type === 'error' ? 'rgba(239, 68, 68, 0.95)' : toastMessage.type === 'warning' ? 'rgba(234, 179, 8, 0.95)' : 'rgba(16, 185, 129, 0.95)',
          color: '#ffffff', padding: '12px 20px', borderRadius: '12px',
          boxShadow: '0 12px 32px rgba(0,0,0,0.3)', fontWeight: 700, fontSize: '0.88rem',
          display: 'flex', alignItems: 'center', gap: '10px', backdropFilter: 'blur(8px)',
          animation: 'slideDown 0.3s ease-out'
        }}>
          {toastMessage.type === 'error' ? <ShieldAlert size={18} /> : <Check size={18} />}
          <span>{toastMessage.message}</span>
        </div>
      )}

      {/* KPI Metrics Dashboard Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '18px 20px', borderRadius: '16px', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)' }}>
            <Shield size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {t('rbac.activeSecurityRoles', 'Active Security Roles')}
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>{matrixStats.totalRoles}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px 20px', borderRadius: '16px', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-success)' }}>
            <Sliders size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {t('rbac.totalSystemPermissions', 'Total System Permissions')}
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>{matrixStats.totalPerms}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px 20px', borderRadius: '16px', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
            <Sparkles size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {t('rbac.activeMatrixGrants', 'Active Matrix Grants')}
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>{matrixStats.totalGrants}</div>
          </div>
        </div>
      </div>

      {/* Control Toolbar Panel */}
      <div className="glass-panel" style={{ padding: '18px 24px', borderRadius: '16px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder={t('rbac.searchMatrixPlaceholder', 'Search permission code, name, or group (e.g., Office.Manage)...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px 10px 42px',
                background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                borderRadius: '10px', color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none'
              }}
            />
          </div>

          {/* Module Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={15} color="var(--text-muted)" />
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              style={{
                background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                borderRadius: '10px', padding: '10px 14px', color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none'
              }}
            >
              <option value="ALL">{t('rbac.allSystemModules', 'All System Modules ({count})', { count: PERMISSION_MODULE_TREE.length })}</option>
              {PERMISSION_MODULE_TREE.map(mod => (
                <option key={mod.moduleCode} value={mod.moduleCode}>{mod.moduleName}</option>
              ))}
            </select>
          </div>

          {/* Role Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={15} color="var(--text-muted)" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{
                background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                borderRadius: '10px', padding: '10px 14px', color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none'
              }}
            >
              <option value="ALL">{t('rbac.allRolesCount', 'All Roles ({count})', { count: roles.length })}</option>
              {roles.map(r => (
                <option key={r.RoleID || r.roleId} value={r.RoleID || r.roleId}>
                  {r.RoleName || r.roleName} ({r.RoleCode || r.roleCode})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Second Row: Mass Actions & Export */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '14px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button type="button" onClick={expandAll} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.84rem', fontWeight: 700, cursor: 'pointer' }}>
              {t('rbac.expandAllSections', '+ Expand All Sections')}
            </button>
            <span style={{ color: 'var(--glass-border)' }}>|</span>
            <button type="button" onClick={collapseAll} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer' }}>
              {t('rbac.collapseAllSections', '- Collapse All')}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleExportCSV}
              title="Export RBAC Permission Matrix to CSV Spreadsheet"
              style={{
                background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                borderRadius: '10px', padding: '9px 16px', color: 'var(--text-primary)', fontSize: '0.84rem',
                fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              <Download size={15} /> {t('rbac.exportMatrixCsv', 'Export Matrix (CSV)')}
            </button>

            <button
              onClick={fetchRoles}
              title="Refresh matrix definitions"
              style={{
                background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                borderRadius: '10px', padding: '9px 16px', color: 'var(--text-primary)', fontSize: '0.84rem',
                fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> {t('rbac.refreshMatrix', 'Refresh Matrix')}
            </button>

            <Can permission="Role.Create">
              <button
                onClick={onOpenCreateRole}
                style={{
                  background: 'var(--accent-gradient)',
                  border: 'none', borderRadius: '10px', padding: '9px 18px',
                  color: '#ffffff', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  boxShadow: 'var(--shadow-md)'
                }}
              >
                <Plus size={16} /> {t('rbac.createCustomRole', 'Create Custom Role')}
              </button>
            </Can>
          </div>
        </div>
      </div>

      {/* Permission Matrix Main Interactive Table Container */}
      <div className="glass-panel custom-scrollbar" style={{
        padding: 0, overflow: 'auto', minHeight: '540px', maxHeight: 'calc(100vh - 240px)',
        position: 'relative', border: '1px solid var(--glass-border)', borderRadius: '16px'
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '80px 20px' }}>
            <RefreshCw className="animate-spin" size={36} style={{ marginBottom: '14px', color: 'var(--accent-primary)' }} />
            <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>{t('rbac.loadingMatrix', 'Loading Enterprise Permission Matrix...')}</div>
          </div>
        ) : filteredRoles.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px 20px' }}>
            {t('rbac.noRolesFoundMatrix', 'No security roles found. Create a role or adjust filters.')}
          </div>
        ) : (
          <table className="custom-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr>
                <th style={{
                  width: '380px', minWidth: '380px',
                  background: 'var(--bg-tertiary)', color: 'var(--text-primary)', padding: '16px 20px', textAlign: 'left',
                  position: 'sticky', top: 0, left: 0, zIndex: 3, borderBottom: '2px solid var(--accent-primary)',
                  boxShadow: '4px 0 12px rgba(0, 0, 0, 0.15)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sliders size={16} color="var(--accent-primary)" />
                    <span style={{ fontWeight: 800, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {t('rbac.systemModuleResourceScope', 'System Module / Resource Scope')}
                    </span>
                  </div>
                </th>

                {filteredRoles.map(r => {
                  const isProtected = isProtectedRole(r);
                  return (
                    <th key={r.RoleID || r.roleCode} style={{
                      textAlign: 'center', minWidth: '165px', padding: '14px 12px',
                      background: 'var(--bg-tertiary)', position: 'sticky', top: 0, zIndex: 2,
                      borderBottom: '2px solid var(--accent-primary)', borderLeft: '1px solid var(--glass-border)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        {isProtected && <Lock size={13} color="var(--color-warning)" title="System Protected Role" />}
                        <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{r.RoleName || r.roleName}</div>
                      </div>
                      <code style={{ fontSize: '0.72rem', color: 'var(--accent-primary)', display: 'block', marginTop: '2px', fontFamily: 'monospace' }}>
                        {r.RoleCode || r.roleCode}
                      </code>

                      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '6px' }}>
                        <Can permission="Role.Update">
                          {!isProtected && (
                            <button
                              onClick={() => onOpenEditRole && onOpenEditRole(r)}
                              title="Edit Role Configuration"
                              style={{
                                background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.35)',
                                color: 'var(--accent-primary)', cursor: 'pointer', borderRadius: '6px',
                                fontSize: '0.72rem', padding: '2px 8px', fontWeight: 700
                              }}
                            >
                              {t('rbac.editRole', 'Edit Role')}
                            </button>
                          )}
                        </Can>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {filteredModules.map(mod => {
                const ModIcon = MODULE_ICONS[mod.moduleCode] || Layers;
                const isModExpanded = !!expandedModules[mod.moduleCode];

                return (
                  <React.Fragment key={mod.moduleCode}>
                    {/* Level 1: System Module Group Banner */}
                    <tr
                      style={{ background: 'var(--bg-tertiary)', cursor: 'pointer' }}
                      onClick={() => toggleExpandModule(mod.moduleCode)}
                    >
                      <td colSpan={filteredRoles.length + 1} style={{
                        padding: '12px 20px', borderTop: '1px solid var(--glass-border)',
                        position: 'sticky', left: 0, zIndex: 1
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {isModExpanded ? <ChevronDown size={16} color="var(--accent-primary)" /> : <ChevronRight size={16} color="var(--text-muted)" />}
                          <div style={{
                            width: '28px', height: '28px', borderRadius: '8px', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', background: 'rgba(99, 102, 241, 0.15)',
                            color: 'var(--accent-primary)'
                          }}>
                            <ModIcon size={16} />
                          </div>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '0.88rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {mod.moduleName}
                          </span>
                          <span style={{
                            background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)',
                            color: 'var(--accent-primary)', fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: '12px'
                          }}>
                            {t('rbac.permissionsCount', '{count} Permissions', { count: mod.groups.flatMap(g => g.permissions).length })}
                          </span>
                        </div>
                      </td>
                    </tr>

                    {/* Level 2: Permission Sub-Groups */}
                    {isModExpanded && mod.groups.map(grp => {
                      const isGrpExpanded = !!expandedGroups[grp.groupCode];
                      const visiblePerms = searchTerm.trim()
                        ? grp.permissions.filter(p =>
                          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.code.toLowerCase().includes(searchTerm.toLowerCase()))
                        : grp.permissions;
                      if (searchTerm.trim() && visiblePerms.length === 0 && !grp.groupName.toLowerCase().includes(searchTerm.toLowerCase())) return null;

                      return (
                        <React.Fragment key={grp.groupCode}>
                          {/* Sub-Group Header Row */}
                          <tr
                            style={{ background: 'var(--bg-secondary)', cursor: 'pointer' }}
                            onClick={() => toggleExpandGroup(grp.groupCode)}
                          >
                            <td colSpan={filteredRoles.length + 1} style={{
                              padding: '10px 20px 10px 42px', borderTop: '1px solid var(--glass-border)',
                              position: 'sticky', left: 0, zIndex: 1
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {isGrpExpanded ? <ChevronDown size={14} color="var(--accent-primary)" /> : <ChevronRight size={14} color="var(--text-muted)" />}
                                <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.84rem' }}>
                                  ▸ {grp.groupName}
                                </span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                  {t('rbac.itemsCount', '({count} items)', { count: grp.permissions.length })}
                                </span>
                              </div>
                            </td>
                          </tr>

                          {/* Level 3: Individual Permission Rows */}
                          {isGrpExpanded && (searchTerm.trim() ? visiblePerms : grp.permissions).map(perm => {
                            const scopeStyle = SCOPE_COLORS[perm.scope] || SCOPE_COLORS.COMPANY;

                            return (
                              <tr key={perm.code} style={{ transition: 'background 0.15s ease' }}>
                                <td style={{
                                  padding: '10px 16px 10px 64px',
                                  background: 'var(--bg-secondary)', position: 'sticky', left: 0, zIndex: 1,
                                  borderBottom: '1px solid var(--glass-border)',
                                  boxShadow: '4px 0 10px rgba(0, 0, 0, 0.05)'
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.84rem' }}>{perm.name}</span>
                                    {perm.scope && (
                                      <span style={{
                                        background: scopeStyle.bg, color: scopeStyle.text,
                                        border: `1px solid ${scopeStyle.border}`,
                                        fontSize: '0.68rem', fontWeight: 800, padding: '1px 6px', borderRadius: '4px',
                                        textTransform: 'uppercase'
                                      }}>
                                        {perm.scope}
                                      </span>
                                    )}
                                  </div>
                                  <code style={{ fontSize: '0.74rem', color: 'var(--accent-primary)', fontFamily: 'monospace', display: 'block', marginTop: '2px' }}>
                                    {perm.code}
                                  </code>
                                  {perm.description && (
                                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                      {perm.description}
                                    </div>
                                  )}
                                </td>

                                {/* Role Columns Interactive Cells */}
                                {filteredRoles.map(r => {
                                  const granted = isPermissionGranted(r, perm.code);
                                  const isProtected = isProtectedRole(r);
                                  const roleId = r.RoleID || r.roleId;
                                  const isUpdating = !!cellUpdating[`${roleId}_${perm.code}`];

                                  return (
                                    <td
                                      key={`${roleId}-${perm.code}`}
                                      onClick={() => !isUpdating && handleToggleCell(r, perm.code, perm.name)}
                                      title={isProtected ? 'Protected Wildcard Role' : `${granted ? 'Revoke' : 'Grant'} ${perm.name} for ${r.RoleName}`}
                                      style={{
                                        textAlign: 'center', verticalAlign: 'middle', padding: '8px',
                                        borderBottom: '1px solid var(--glass-border)',
                                        borderLeft: '1px solid var(--glass-border)',
                                        background: granted ? 'rgba(16, 185, 129, 0.04)' : 'transparent',
                                        cursor: isProtected ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.15s ease'
                                      }}
                                    >
                                      {isUpdating ? (
                                        <RefreshCw size={16} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
                                      ) : isProtected ? (
                                        <span style={{
                                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                          width: '26px', height: '26px', borderRadius: '50%',
                                          background: 'rgba(234, 179, 8, 0.15)', border: '1px solid rgba(234, 179, 8, 0.35)',
                                          color: 'var(--color-warning)'
                                        }}>
                                          <Lock size={13} />
                                        </span>
                                      ) : granted ? (
                                        <span style={{
                                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                          width: '28px', height: '28px', borderRadius: '8px',
                                          background: 'rgba(16, 185, 129, 0.18)', border: '1px solid rgba(16, 185, 129, 0.4)',
                                          color: 'var(--color-success)', boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)'
                                        }}>
                                          <Check size={16} />
                                        </span>
                                      ) : (
                                        <span style={{
                                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                          width: '26px', height: '26px', borderRadius: '8px',
                                          background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                                          color: 'var(--text-muted)'
                                        }}>
                                          +
                                        </span>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
