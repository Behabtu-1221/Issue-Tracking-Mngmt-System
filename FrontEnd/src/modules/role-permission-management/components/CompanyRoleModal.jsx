import React, { useState, useEffect } from 'react';
import {
  X, ShieldCheck, Save, AlertCircle, Search, Sparkles, Filter,
  ChevronRight, ChevronDown, CheckSquare, Square, MinusSquare, Shield, Tag, FileText
} from 'lucide-react';
import { PERMISSION_MODULE_TREE, DEFAULT_ROLE_PRESETS } from '../constants/permissionConstants';
import rbacApi from '../api/rbacApi';
import { FormField } from '../../../components/common/FormField';
import { rolePermissionSchemas } from '../../../validation';

const SCOPE_COLORS = {
  OWN: { bg: 'rgba(234, 179, 8, 0.15)', text: 'var(--color-warning)', border: 'rgba(234, 179, 8, 0.35)' },
  DEPARTMENT: { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.35)' },
  COMPANY: { bg: 'rgba(16, 185, 129, 0.15)', text: 'var(--color-success)', border: 'rgba(16, 185, 129, 0.35)' },
  ALL: { bg: 'rgba(168, 85, 247, 0.15)', text: '#c084fc', border: 'rgba(168, 85, 247, 0.35)' }
};

export default function CompanyRoleModal({ roleToEdit, onClose, onSuccess }) {
  const [roleName, setRoleName] = useState('');
  const [roleCode, setRoleCode] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [basePreset, setBasePreset] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
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

  // Matrix UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [expandedModules, setExpandedModules] = useState({});
  const [expandedGroups, setExpandedGroups] = useState({});

  useEffect(() => {
    if (roleToEdit) {
      setRoleName(roleToEdit.RoleName || roleToEdit.roleName || '');
      setRoleCode(roleToEdit.RoleCode || roleToEdit.roleCode || '');
      setDescription(roleToEdit.Description || roleToEdit.description || '');
      const existing = roleToEdit.PermissionCodes || (roleToEdit.permissions ? roleToEdit.permissions.map(p => p.PermissionCode || p) : []);
      setSelectedPermissions(existing);
    }

    // Default: expand first module only for clarity
    const mods = {};
    const grps = {};
    if (PERMISSION_MODULE_TREE.length > 0) {
      const firstMod = PERMISSION_MODULE_TREE[0];
      mods[firstMod.moduleCode] = true;
      firstMod.groups.forEach(g => { grps[g.groupCode] = true; });
    }
    setExpandedModules(mods);
    setExpandedGroups(grps);
  }, [roleToEdit]);

  // Search auto-expands all modules to show matches
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

  // ── Preset ──
  const handleApplyPreset = (presetKey) => {
    setBasePreset(presetKey);
    const preset = DEFAULT_ROLE_PRESETS[presetKey];
    if (preset) {
      setSelectedPermissions([...preset.permissions]);
      if (!roleName) setRoleName(preset.roleName);
      if (!roleCode) setRoleCode(preset.roleCode);
    }
  };

  // ── Permission Toggle Helpers ──
  const togglePermission = (permCode) => {
    setSelectedPermissions(prev =>
      prev.includes(permCode) ? prev.filter(p => p !== permCode) : [...prev, permCode]
    );
  };

  const toggleGroupAll = (groupPermissions) => {
    const codes = groupPermissions.map(p => p.code);
    const allSelected = codes.every(c => selectedPermissions.includes(c));
    if (allSelected) {
      setSelectedPermissions(prev => prev.filter(p => !codes.includes(p)));
    } else {
      setSelectedPermissions(prev => Array.from(new Set([...prev, ...codes])));
    }
  };

  const toggleModuleAll = (mod) => {
    const allCodes = mod.groups.flatMap(g => g.permissions.map(p => p.code));
    const allSelected = allCodes.every(c => selectedPermissions.includes(c));
    if (allSelected) {
      setSelectedPermissions(prev => prev.filter(p => !allCodes.includes(p)));
    } else {
      setSelectedPermissions(prev => Array.from(new Set([...prev, ...allCodes])));
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

  // ── Filter Modules ──
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

  // ── Submit ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const validation = rolePermissionSchemas.roleForm({
      roleName,
      roleCode,
      description,
      selectedPermissions
    }, !!roleToEdit);

    if (!validation.isValid) {
      setRoleErrors(validation.errors);
      return;
    }
    setRoleErrors({});

    setSubmitting(true);
    try {
      const payload = {
        roleName: validation.sanitized.roleName,
        roleCode: validation.sanitized.roleCode,
        description: validation.sanitized.description || '',
        permissionIds: selectedPermissions
      };
      if (roleToEdit && (roleToEdit.RoleID || roleToEdit.id)) {
        const id = roleToEdit.RoleID || roleToEdit.id;
        await rbacApi.updateRole(id, payload);
        await rbacApi.syncRolePermissions(id, selectedPermissions);
      } else {
        const res = await rbacApi.createRole(payload);
        const newRoleId = res.data?.data?.RoleID || res.data?.data?.id;
        if (newRoleId) await rbacApi.syncRolePermissions(newRoleId, selectedPermissions);
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to save role and permissions');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Count Helpers ──
  const getModuleGrantedCount = (mod) => mod.groups.flatMap(g => g.permissions).filter(p => selectedPermissions.includes(p.code)).length;
  const getModuleTotalCount = (mod) => mod.groups.flatMap(g => g.permissions).length;
  const getGroupGrantedCount = (grp) => grp.permissions.filter(p => selectedPermissions.includes(p.code)).length;

  const getModuleCheckState = (mod) => {
    const allCodes = mod.groups.flatMap(g => g.permissions.map(p => p.code));
    const selected = allCodes.filter(c => selectedPermissions.includes(c));
    if (selected.length === 0) return 'none';
    if (selected.length === allCodes.length) return 'all';
    return 'partial';
  };

  const getGroupCheckState = (grp) => {
    const codes = grp.permissions.map(p => p.code);
    const selected = codes.filter(c => selectedPermissions.includes(c));
    if (selected.length === 0) return 'none';
    if (selected.length === codes.length) return 'all';
    return 'partial';
  };

  const CheckIcon = ({ state, size = 16 }) => {
    if (state === 'all') return <CheckSquare size={size} color="var(--accent-primary)" />;
    if (state === 'partial') return <MinusSquare size={size} color="var(--accent-primary)" />;
    return <Square size={size} color="var(--text-muted)" />;
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px'
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg-secondary)', border: '1px solid var(--glass-border-accent)',
        borderRadius: '20px', color: 'var(--text-primary)',
        width: '900px', maxWidth: '95vw', maxHeight: '90vh',
        display: 'flex', flexDirection: 'column', padding: '24px',
        boxShadow: 'var(--shadow-lg)',
        animation: 'slideUp 0.3s ease-out'
      }} onClick={(e) => e.stopPropagation()}>

        {/* ── HEADER ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '12px', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              background: 'var(--accent-gradient)', color: '#fff',
              boxShadow: 'var(--shadow-md)'
            }}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: 800 }}>
                {roleToEdit ? 'Edit Enterprise Security Role' : 'Create Enterprise Security Role'}
              </h3>
              <p style={{ margin: '2px 0 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                Define security role metadata and assign granular RBAC module permissions
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'var(--text-muted)', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {errorMsg && (
          <div style={{
            padding: '10px 16px', borderRadius: '10px', marginBottom: '14px', fontSize: '0.84rem',
            background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--color-danger)',
            display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, flexShrink: 0
          }}>
            <AlertCircle size={16} /> {errorMsg}
          </div>
        )}

        {/* ── SCROLLABLE BODY ── */}
        <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', minHeight: 0, paddingRight: '4px' }}>
          <form id="roleForm" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

            {/* Preset Templates */}
            {!roleToEdit && (
              <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', padding: '12px 16px', borderRadius: '12px', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <Sparkles size={14} color="var(--accent-primary)" />
                  <span style={{ color: 'var(--text-primary)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Quick Role Preset Blueprint (Optional)
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {Object.keys(DEFAULT_ROLE_PRESETS)
                    .filter(k => !['BUSINESS_PARK_ADMIN', 'PARK_SUPER_ADMIN', 'PARK_ADMIN', 'SUPER_ADMIN', 'TENANT_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'MANAGER', 'DISPATCHER'].includes(k))
                    .map(key => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleApplyPreset(key)}
                      style={{
                        background: basePreset === key ? 'rgba(99, 102, 241, 0.2)' : 'var(--bg-secondary)',
                        border: basePreset === key ? '1px solid var(--accent-primary)' : '1px solid var(--glass-border)',
                        borderRadius: '8px', padding: '6px 12px', color: basePreset === key ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                      ⚡ {DEFAULT_ROLE_PRESETS[key].roleName}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Role Metadata Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', flexShrink: 0 }}>
              <FormField
                label="Role Title"
                required
                icon={Shield}
                error={roleErrors.roleName}
                id="company-role-name"
              >
                <input
                  id="company-role-name"
                  type="text"
                  value={roleName}
                  onChange={(e) => {
                    const nameVal = e.target.value;
                    setRoleName(nameVal);
                    clearRoleError('roleName');
                    if (!roleToEdit && !roleCode) {
                      setRoleCode(nameVal.toUpperCase().replace(/[^A-Z0-9_]/g, '_'));
                      clearRoleError('roleCode');
                    }
                  }}
                  placeholder="e.g. Senior Operations Manager"
                  style={{
                    width: '100%',
                    background: 'var(--bg-tertiary)',
                    border: roleErrors.roleName ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </FormField>

              <FormField
                label="Role Code"
                required
                icon={Tag}
                error={roleErrors.roleCode}
                id="company-role-code"
              >
                <input
                  id="company-role-code"
                  type="text"
                  value={roleCode}
                  onChange={(e) => {
                    setRoleCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_'));
                    clearRoleError('roleCode');
                  }}
                  placeholder="e.g. SR_MANAGER"
                  style={{
                    width: '100%',
                    background: 'var(--bg-tertiary)',
                    border: roleErrors.roleCode ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    color: 'var(--accent-primary)',
                    fontSize: '0.88rem',
                    outline: 'none',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    boxSizing: 'border-box'
                  }}
                />
              </FormField>
            </div>

            <div style={{ flexShrink: 0 }}>
              <FormField
                label="Role Scope Description (Optional)"
                icon={FileText}
                error={roleErrors.description}
                id="company-role-desc"
              >
                <input
                  id="company-role-desc"
                  type="text"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    clearRoleError('description');
                  }}
                  placeholder="e.g. Responsible for reviewing, dispatching, and managing facility service requests"
                  style={{
                    width: '100%',
                    background: 'var(--bg-tertiary)',
                    border: roleErrors.description ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </FormField>
            </div>

            {/* ── PERMISSION MATRIX HEADER & SEARCH TOOLBAR ── */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px',
              background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', padding: '12px 16px', borderRadius: '12px', flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
                  <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text" placeholder="Filter permissions..."
                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)',
                      borderRadius: '8px', padding: '8px 12px 8px 36px', color: 'var(--text-primary)', fontSize: '0.84rem', outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </div>
                <select
                  value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}
                  style={{
                    background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)',
                    borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '0.84rem', outline: 'none'
                  }}
                >
                  <option value="ALL">All Modules</option>
                  {PERMISSION_MODULE_TREE.map(mod => (
                    <option key={mod.moduleCode} value={mod.moduleCode}>{mod.moduleName}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: 'var(--color-success)', fontWeight: 800, fontSize: '0.85rem' }}>
                  ✓ {selectedPermissions.length} Granted
                </span>
                <button type="button" onClick={expandAll} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
                  Expand All
                </button>
                <button type="button" onClick={collapseAll} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                  Collapse All
                </button>
                <button type="button" onClick={() => setSelectedPermissions([])} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
                  Clear All
                </button>
              </div>
            </div>

            {/* ── MODULE → GROUP → PERMISSION TREE ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredModules.map(mod => {
                const isModExpanded = !!expandedModules[mod.moduleCode];
                const modCheckState = getModuleCheckState(mod);
                const grantedCount = getModuleGrantedCount(mod);
                const totalCount = getModuleTotalCount(mod);

                return (
                  <div key={mod.moduleCode} style={{
                    background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                    borderRadius: '14px', overflow: 'hidden', flexShrink: 0
                  }}>
                    {/* Module Header */}
                    <div
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px',
                        background: modCheckState !== 'none' ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                        cursor: 'pointer', userSelect: 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }} onClick={() => toggleExpandModule(mod.moduleCode)}>
                        {isModExpanded ? <ChevronDown size={16} color="var(--accent-primary)" /> : <ChevronRight size={16} color="var(--text-muted)" />}
                        <ShieldCheck size={16} color="var(--accent-primary)" />
                        <span style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '0.86rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{mod.moduleName}</span>
                        <span style={{
                          background: grantedCount > 0 ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-secondary)',
                          border: grantedCount > 0 ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid var(--glass-border)',
                          color: grantedCount > 0 ? 'var(--accent-primary)' : 'var(--text-muted)',
                          fontSize: '0.74rem', fontWeight: 800, padding: '2px 8px', borderRadius: '10px'
                        }}>
                          {grantedCount} / {totalCount} Granted
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); toggleModuleAll(mod); }}
                          style={{
                            background: modCheckState === 'all' ? 'rgba(99, 102, 241, 0.2)' : 'var(--bg-secondary)',
                            border: '1px solid var(--glass-border)', borderRadius: '6px',
                            padding: '4px 10px', fontSize: '0.75rem', fontWeight: 700,
                            color: 'var(--accent-primary)', cursor: 'pointer'
                          }}
                        >
                          {modCheckState === 'all' ? 'Deselect Module' : 'Select All Module'}
                        </button>
                        <div onClick={(e) => { e.stopPropagation(); toggleModuleAll(mod); }} style={{ cursor: 'pointer' }}>
                          <CheckIcon state={modCheckState} />
                        </div>
                      </div>
                    </div>

                    {/* Permission Groups */}
                    {isModExpanded && (
                      <div style={{ padding: '0 12px 12px 12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {mod.groups.map(grp => {
                          const isGrpExpanded = !!expandedGroups[grp.groupCode];
                          const grpCheckState = getGroupCheckState(grp);
                          const grpGranted = getGroupGrantedCount(grp);

                          // Filter permissions by search
                          const visiblePerms = searchTerm.trim()
                            ? grp.permissions.filter(p =>
                              p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              p.code.toLowerCase().includes(searchTerm.toLowerCase()))
                            : grp.permissions;
                          if (searchTerm.trim() && visiblePerms.length === 0 && !grp.groupName.toLowerCase().includes(searchTerm.toLowerCase())) return null;

                          return (
                            <div key={grp.groupCode} style={{
                              background: 'var(--bg-secondary)', borderRadius: '10px',
                              border: grpCheckState !== 'none' ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid var(--glass-border)',
                              flexShrink: 0
                            }}>
                              {/* Group Header */}
                              <div
                                style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                  padding: '10px 14px', cursor: 'pointer', userSelect: 'none'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }} onClick={() => toggleExpandGroup(grp.groupCode)}>
                                  {isGrpExpanded ? <ChevronDown size={14} color="var(--accent-primary)" /> : <ChevronRight size={14} color="var(--text-muted)" />}
                                  <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.82rem' }}>
                                    ▸ {grp.groupName}
                                  </span>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                    ({grpGranted}/{grp.permissions.length})
                                  </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); toggleGroupAll(grp.permissions); }}
                                    style={{
                                      background: 'none', border: 'none', fontSize: '0.75rem',
                                      color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: 700
                                    }}
                                  >
                                    {grpCheckState === 'all' ? 'Deselect' : 'Select All'}
                                  </button>
                                  <div onClick={(e) => { e.stopPropagation(); toggleGroupAll(grp.permissions); }} style={{ cursor: 'pointer' }}>
                                    <CheckIcon state={grpCheckState} size={14} />
                                  </div>
                                </div>
                              </div>

                              {/* Individual Permissions Grid */}
                              {isGrpExpanded && (
                                <div style={{ padding: '4px 14px 12px 34px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '10px' }}>
                                  {(searchTerm.trim() ? visiblePerms : grp.permissions).map(perm => {
                                    const checked = selectedPermissions.includes(perm.code);
                                    const scopeStyle = SCOPE_COLORS[perm.scope] || SCOPE_COLORS.COMPANY;

                                    return (
                                      <div
                                        key={perm.code}
                                        onClick={() => togglePermission(perm.code)}
                                        style={{
                                          display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 12px',
                                          borderRadius: '8px', cursor: 'pointer',
                                          background: checked ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-tertiary)',
                                          border: checked ? '1px solid rgba(99, 102, 241, 0.35)' : '1px solid var(--glass-border)',
                                          transition: 'all 0.15s ease'
                                        }}
                                      >
                                        <input
                                          type="checkbox" checked={checked} onChange={() => {}}
                                          style={{ marginTop: '3px', accentColor: 'var(--accent-primary)', cursor: 'pointer', flexShrink: 0 }}
                                        />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                            <span style={{ color: 'var(--text-primary)', fontSize: '0.84rem', fontWeight: 700 }}>
                                              {perm.name}
                                            </span>
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
                                          <code style={{ fontSize: '0.74rem', color: 'var(--accent-primary)', display: 'block', marginTop: '2px', fontFamily: 'monospace', fontWeight: 600 }}>{perm.code}</code>
                                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>{perm.description}</div>
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
          </form>
        </div>

        {/* ── FOOTER ACTIONS ── */}
        <div style={{
          display: 'flex', gap: '12px', justifyContent: 'space-between', alignItems: 'center',
          paddingTop: '16px', borderTop: '1px solid var(--glass-border)', flexShrink: 0, marginTop: '12px'
        }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', fontWeight: 600 }}>
            ⚡ <strong>{selectedPermissions.length}</strong> permission{selectedPermissions.length !== 1 ? 's' : ''} assigned to this role
          </span>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button" onClick={onClose}
              style={{
                background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                borderRadius: '10px', padding: '10px 20px', color: 'var(--text-secondary)', fontWeight: 600,
                fontSize: '0.88rem', cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit" form="roleForm" disabled={submitting}
              style={{
                background: 'var(--accent-gradient)',
                border: 'none', borderRadius: '10px', padding: '10px 24px',
                color: '#fff', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
                boxShadow: 'var(--shadow-md)',
                display: 'flex', alignItems: 'center', gap: '6px',
                opacity: submitting ? 0.7 : 1
              }}
            >
              <Save size={16} /> {submitting ? '⏳ Saving...' : '✓ Save Role & Permissions'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
