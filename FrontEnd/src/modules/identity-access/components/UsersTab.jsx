import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../../i18n';
import { 
  Users, 
  Search, 
  Plus, 
  RefreshCw, 
  ShieldCheck, 
  MoreVertical, 
  UserCheck, 
  UserX, 
  Trash2, 
  Eye, 
  Key, 
  Activity, 
  X, 
  Check, 
  Lock,
  Mail,
  Phone,
  User as UserIcon,
  Shield,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Camera
} from 'lucide-react';
import identityApi from '../api/identityApi';
import tenantApi from '../../tenant/api/tenantApi';
import orgApi from '../../organization/api/orgApi';
import { usePermissionContext } from '../../role-permission-management/contexts/PermissionContext';
import { ACCOUNT_STATUSES } from '../constants/identityConstants';
import UserRoleAssignModal from '../../role-permission-management/components/UserRoleAssignModal';
import UserRegistrationModal from './UserRegistrationModal';
import ConfirmDialogModal from '../../../components/common/ConfirmDialogModal';
import AlertDialogModal from '../../../components/common/AlertDialogModal';
import { ActionButton, ActionGroup } from '../../../components/common/ActionButton';
import { userSchemas } from '../../../validation';

export default function UsersTab() {
  const { t } = useTranslation();
  const { user, isParkAdmin, isCompanyAdmin } = usePermissionContext();
  const canCreateUser = isParkAdmin || isCompanyAdmin;
  const canManageRoles = isParkAdmin || isCompanyAdmin;
  const [users, setUsers] = useState([]);

  // Glass Dialog Modals State
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'error' });

  const showAlert = (title, message, type = 'error') => {
    setAlertConfig({ isOpen: true, title, message, type });
  };
  const [roles, setRoles] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRoleAssignModal, setShowRoleAssignModal] = useState(false);

  // Detail view state
  const [userSessions, setUserSessions] = useState([]);
  const [userAuditLogs, setUserAuditLogs] = useState([]);
  const [detailTab, setDetailTab] = useState('profile'); // profile | sessions | audit
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    tenantId: '',
    departmentId: '',
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    jobTitle: '',
    userTypeCode: 'STAFF',
    roleId: ''
  });
  const [createdResult, setCreatedResult] = useState(null);
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {
        limit: pageSize,
        offset: (currentPage - 1) * pageSize
      };
      if (searchTerm) params.search = searchTerm;
      if (statusFilter) params.status = statusFilter;
      
      const res = await identityApi.getUsers(params);
      if (res.data && res.data.status === 'success') {
        const userList = res.data.data.users || res.data.data || [];
        const count = res.data.data.total !== undefined ? res.data.data.total : userList.length;
        setUsers(userList);
        setTotalUsers(count);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await identityApi.getRoles();
      if (res.data && res.data.status === 'success') {
        setRoles(res.data.data.roles || res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load roles:', err);
    }
  };

  const fetchTenants = async () => {
    try {
      const res = await tenantApi.getTenants({ limit: 200 });
      if (res.data && (res.data.status === 'success' || res.data.data)) {
        const tenantList = res.data.data?.tenants || res.data.data || [];
        setTenants(Array.isArray(tenantList) ? tenantList : []);
      }
    } catch (err) {
      console.error('Failed to load tenants:', err);
    }
  };

  const fetchDepartmentsForTenant = async (tId) => {
    if (!tId) {
      setDepartments([]);
      return;
    }
    setLoadingDepartments(true);
    try {
      const res = await orgApi.getDepartments({ tenantId: Number(tId), limit: 100 });
      if (res.data && (res.data.status === 'success' || res.data.data)) {
        const list = res.data.data?.departments || res.data.data || [];
        setDepartments(Array.isArray(list) ? list : []);
      } else {
        setDepartments([]);
      }
    } catch (err) {
      console.error('Failed to load departments for tenant:', err);
      setDepartments([]);
    } finally {
      setLoadingDepartments(false);
    }
  };

  const openCreateUserModal = () => {
    const defaultTenantId = isParkAdmin ? '' : (user?.TenantID || '');
    setFormData({
      tenantId: defaultTenantId,
      departmentId: '',
      username: '',
      email: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      jobTitle: '',
      userTypeCode: 'STAFF',
      roleId: ''
    });
    setFormError('');
    setShowCreateModal(true);
    if (defaultTenantId) {
      fetchDepartmentsForTenant(defaultTenantId);
    } else {
      setDepartments([]);
    }
  };

  const handleTenantChange = (tId) => {
    setFormData(prev => ({ ...prev, tenantId: tId, departmentId: '' }));
    if (tId) {
      fetchDepartmentsForTenant(tId);
    } else {
      setDepartments([]);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchTenants();
  }, [searchTerm, statusFilter, currentPage, pageSize]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && createdResult) {
        setCreatedResult(null);
      }
    };
    if (createdResult) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [createdResult]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setFormError('');

    const validation = userSchemas.userForm(formData, false);
    if (!validation.isValid) {
      const firstErr = Object.values(validation.errors)[0];
      setFormError(firstErr);
      return;
    }

    setFormSubmitting(true);

    try {
      const selectedTenantObj = tenants.find(t => String(t.TenantID) === String(formData.tenantId));
      const selectedDeptObj = departments.find(d => String(d.DepartmentID) === String(formData.departmentId));

      const payload = {
        tenantId: formData.tenantId ? Number(formData.tenantId) : undefined,
        departmentId: formData.departmentId ? Number(formData.departmentId) : undefined,
        firstName: validation.sanitized.FirstName,
        lastName: validation.sanitized.LastName,
        email: validation.sanitized.Email,
        username: validation.sanitized.Username,
        phoneNumber: validation.sanitized.PhoneNumber || undefined,
        jobTitle: formData.jobTitle.trim() || undefined,
        userTypeCode: formData.userTypeCode,
        roleIds: formData.roleId ? [Number(formData.roleId)] : undefined
      };

      const res = await identityApi.createUser(payload);
      if (res.data && (res.data.status === 'success' || res.data.status === 'created')) {
        const createdData = {
          ...res.data.data,
          TenantName: selectedTenantObj?.CompanyName || user?.TenantName || user?.CompanyName,
          DepartmentName: selectedDeptObj?.DepartmentName
        };
        setCreatedResult(createdData);
        setShowCreateModal(false);
        setFormData({
          tenantId: '',
          departmentId: '',
          username: '',
          email: '',
          firstName: '',
          lastName: '',
          phoneNumber: '',
          jobTitle: '',
          userTypeCode: 'STAFF',
          roleId: ''
        });
        fetchUsers();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || err.response?.data?.error || 'Failed to register employee account.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const openDetailView = async (user) => {
    setSelectedUser(user);
    setShowDetailModal(true);
    setDetailTab('profile');
    setLoadingDetails(true);

    try {
      const [sessRes, auditRes] = await Promise.allSettled([
        identityApi.getUserSessions(user.UserID),
        identityApi.getUserAuditLog(user.UserID)
      ]);

      if (sessRes.status === 'fulfilled' && sessRes.value.data) {
        setUserSessions(sessRes.value.data.data || []);
      } else {
        setUserSessions([]);
      }

      if (auditRes.status === 'fulfilled' && auditRes.value.data) {
        setUserAuditLogs(auditRes.value.data.data || []);
      } else {
        setUserAuditLogs([]);
      }
    } catch (err) {
      console.error('Failed to load user details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedUser) return;
    try {
      await identityApi.updateUserStatus(selectedUser.UserID, { status: newStatus });
      setShowStatusModal(false);
      fetchUsers();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update user status.';
      showAlert('Status Change Failed', msg, 'error');
    }
  };

  const handleDeleteUser = () => {
    if (!selectedUser) return;
    setConfirmConfig({
      isOpen: true,
      title: t('identity.deleteUserTitle'),
      message: `${t('identity.deleteUserPrompt')} "${selectedUser.Username}" (${selectedUser.Email})? ${t('identity.deleteUserLostAccess')}`,
      type: 'danger',
      confirmText: t('identity.confirmDeleteBtn'),
      onConfirm: async () => {
        try {
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          await identityApi.deleteUser(selectedUser.UserID);
          setShowDeleteModal(false);
          fetchUsers();
        } catch (err) {
          const msg = err.response?.data?.message || 'Failed to delete user.';
          showAlert('Action Restricted', msg, 'error');
        }
      }
    });
  };

  const handleRevokeSession = (sessionId) => {
    if (!selectedUser) return;
    setConfirmConfig({
      isOpen: true,
      title: t('identity.revokeSessionTitle'),
      message: t('identity.revokeSessionConfirm'),
      type: 'warning',
      confirmText: t('identity.revokeSessionBtn'),
      onConfirm: async () => {
        try {
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          await identityApi.revokeUserSession(selectedUser.UserID, sessionId);
          setUserSessions(userSessions.filter(s => s.SessionID !== sessionId));
        } catch (err) {
          showAlert(t('identity.revokeSessionFailed'), t('identity.revokeSessionFailedMsg'), 'error');
        }
      }
    });
  };

  const getStatusBadge = (status) => {
    const sCode = (status || '').toUpperCase();
    const matched = ACCOUNT_STATUSES.find(s => s.value === sCode || (sCode === 'PENDING_ACTIVATION' && s.value === 'MUST_CHANGE_PASSWORD'));
    const getStatusText = (val) => {
      switch (val) {
        case 'ACTIVE': return t('identity.statusActive');
        case 'MUST_CHANGE_PASSWORD':
        case 'PENDING_ACTIVATION': return t('identity.statusPending');
        case 'SUSPENDED': return t('identity.statusSuspended');
        case 'DEACTIVATED': return t('identity.statusDeactivated');
        default: return val || t('identity.statusActive');
      }
    };
    return (
      <span className={`badge ${matched ? matched.badgeClass : 'badge-secondary'}`}>
        {matched ? getStatusText(matched.value) : (sCode || t('identity.statusActive'))}
      </span>
    );
  };

  return (
    <div>
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mb-6 flex-wrap">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 w-full min-w-0">
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder={t('identity.searchUsersPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 16px 10px 42px',
                borderRadius: 'var(--border-radius-sm)',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)',
                fontSize: '0.88rem'
              }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '10px 16px',
              borderRadius: 'var(--border-radius-sm)',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-primary)',
              fontSize: '0.88rem'
            }}
          >
            <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{t('identity.allStatuses')}</option>
            {ACCOUNT_STATUSES.map(st => {
              const stLabel = st.value === 'ACTIVE'
                ? t('identity.statusActive')
                : st.value === 'MUST_CHANGE_PASSWORD'
                  ? t('identity.statusPending')
                  : st.value === 'SUSPENDED'
                    ? t('identity.statusSuspended')
                    : t('identity.statusDeactivated');
              return (
                <option key={st.value} value={st.value} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{stLabel}</option>
              );
            })}
          </select>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
          <button
            onClick={fetchUsers}
            className="touch-target-sm"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: 'var(--border-radius-sm)',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--glass-border)',
              cursor: 'pointer',
              fontSize: '0.88rem'
            }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> {t('common.refresh')}
          </button>

          {canCreateUser && (
            <button
              onClick={openCreateUserModal}
              className="touch-target-sm"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: 'var(--border-radius-sm)',
                background: 'var(--accent-gradient)',
                color: '#ffffff',
                border: 'none',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: 'var(--glow-accent)',
                fontSize: '0.88rem'
              }}
            >
              <Plus size={16} /> {t('identity.registerNewUser')}
            </button>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="table-scroll-container glass-panel" style={{ width: '100%', borderRadius: 'var(--border-radius-md)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <RefreshCw className="animate-spin" size={32} style={{ marginBottom: '16px' }} />
            <p>{t('identity.loadingUsers')}</p>
          </div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <Users size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <p>{t('identity.noUsersFound')}</p>
          </div>
        ) : (
          <table className="custom-table" style={{ width: '100%', minWidth: '1150px' }}>
            <thead>
              <tr>
                <th style={{ minWidth: '200px' }}>{t('identity.thUserIdentity')}</th>
                <th style={{ minWidth: '200px' }}>{t('identity.thCompanyDept')}</th>
                <th style={{ minWidth: '200px' }}>{t('identity.thUsernameEmail')}</th>
                <th style={{ minWidth: '130px', whiteSpace: 'nowrap' }}>{t('identity.thPhone')}</th>
                <th style={{ minWidth: '140px', whiteSpace: 'nowrap' }}>{t('identity.thAccountStatus')}</th>
                <th style={{ minWidth: '160px' }}>{t('identity.thAssignedRoles')}</th>
                <th style={{ textAlign: 'right', minWidth: '160px', whiteSpace: 'nowrap' }}>{t('identity.thActions')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const initials = `${u.FirstName ? u.FirstName[0] : ''}${u.LastName ? u.LastName[0] : ''}` || 'U';
                return (
                  <tr key={u.UserID}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {u.AvatarUrl ? (
                          <img
                            src={u.AvatarUrl}
                            alt={u.FirstName}
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              boxShadow: '0 0 8px rgba(138, 75, 255, 0.3)'
                            }}
                          />
                        ) : (
                          <div style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '50%',
                            background: 'var(--accent-gradient)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '700',
                            fontSize: '0.85rem',
                            color: '#ffffff'
                          }}>
                            {initials}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                            {u.FirstName} {u.LastName}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {u.JobTitle || `ID: #${u.UserID}`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          🏢 {u.TenantName || u.BusinessParkName || 'Ethiopian IT Park'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: 600 }}>
                          📂 {u.DepartmentName || (u.TenantName ? t('identity.tenantOrganization') : t('common.none'))}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontFamily: 'monospace', color: 'var(--accent-primary)', fontSize: '0.83rem', fontWeight: 600 }}>{u.Username}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{u.Email}</div>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{u.PhoneNumber || '—'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{getStatusBadge(u.Status || u.AccountStatusCode)}</td>
                    <td>
                      {((u.Roles && u.Roles.length > 0) || (u.roles && u.roles.length > 0)) ? (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {(u.Roles || u.roles).map((r, i) => (
                            <span
                              key={i}
                              onClick={canManageRoles ? () => { setSelectedUser(u); setShowRoleAssignModal(true); } : undefined}
                              title={canManageRoles ? t('identity.assignRoleTooltip') : undefined}
                              className="badge badge-info"
                              style={{ fontSize: '0.72rem', cursor: canManageRoles ? 'pointer' : 'default', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              🛡️ {typeof r === 'object' ? (r.RoleName || r.roleName || r.RoleCode || r.roleCode) : r}
                            </span>
                          ))}
                        </div>
                      ) : canManageRoles ? (
                        <button
                          onClick={() => { setSelectedUser(u); setShowRoleAssignModal(true); }}
                          style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline', fontWeight: 600 }}
                        >
                          {t('identity.assignRoleAction')}
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t('identity.roleEmployeeLabel')}</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <ActionGroup align="right">
                        <ActionButton
                          variant="neutral"
                          onClick={() => openDetailView(u)}
                          title={t('identity.viewProfileTooltip')}
                          icon={<Eye size={14} />}
                        />
                        <ActionButton
                          variant="view"
                          onClick={() => { setSelectedUser(u); setShowRoleAssignModal(true); }}
                          title={t('identity.assignRoleTooltip')}
                          icon={<Shield size={14} />}
                        />
                        <ActionButton
                          variant="warning"
                          onClick={() => { setSelectedUser(u); setShowStatusModal(true); }}
                          title={t('identity.changeStatusTooltip')}
                          icon={<ShieldCheck size={14} />}
                        />
                        <ActionButton
                          variant="delete"
                          onClick={() => { setSelectedUser(u); setShowDeleteModal(true); }}
                          title={t('identity.deleteUserTooltip')}
                          icon={<Trash2 size={14} />}
                        />
                      </ActionGroup>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Professional Pagination Footer */}
      {!loading && users.length > 0 && (() => {
        const totalPages = Math.max(1, Math.ceil(totalUsers / pageSize));
        const startRecord = (currentPage - 1) * pageSize + 1;
        const endRecord = Math.min(currentPage * pageSize, totalUsers);

        // Build visible page numbers (max 5 centered around current)
        const pages = [];
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);
        if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);
        for (let i = startPage; i <= endPage; i++) pages.push(i);

        return (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--border-radius-md)',
            marginTop: '16px',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            {/* Left: Record Summary */}
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              {t('identity.paginationShowing')} <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{startRecord}–{endRecord}</span> {t('identity.paginationOf')}{' '}
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{totalUsers}</span> {t('identity.paginationUsers')}
            </div>

            {/* Center: Page Navigation Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                title="First Page"
                style={{
                  padding: '6px 8px', borderRadius: '6px', background: 'var(--bg-tertiary)',
                  border: '1px solid var(--glass-border)', color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1,
                  display: 'flex', alignItems: 'center'
                }}
              ><ChevronsLeft size={15} /></button>

              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                title="Previous Page"
                style={{
                  padding: '6px 8px', borderRadius: '6px', background: 'var(--bg-tertiary)',
                  border: '1px solid var(--glass-border)', color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1,
                  display: 'flex', alignItems: 'center'
                }}
              ><ChevronLeft size={15} /></button>

              {pages.map(p => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  style={{
                    padding: '6px 12px', borderRadius: '6px', fontWeight: p === currentPage ? 700 : 500,
                    fontSize: '0.85rem', cursor: 'pointer', border: 'none',
                    background: p === currentPage ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                    color: p === currentPage ? '#ffffff' : 'var(--text-secondary)',
                    boxShadow: p === currentPage ? 'var(--glow-accent)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >{p}</button>
              ))}

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                title="Next Page"
                style={{
                  padding: '6px 8px', borderRadius: '6px', background: 'var(--bg-tertiary)',
                  border: '1px solid var(--glass-border)', color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--text-primary)',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1,
                  display: 'flex', alignItems: 'center'
                }}
              ><ChevronRight size={15} /></button>

              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                title="Last Page"
                style={{
                  padding: '6px 8px', borderRadius: '6px', background: 'var(--bg-tertiary)',
                  border: '1px solid var(--glass-border)', color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--text-primary)',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1,
                  display: 'flex', alignItems: 'center'
                }}
              ><ChevronsRight size={15} /></button>
            </div>

            {/* Right: Page Size Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t('identity.rowsPerPage')}</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                style={{
                  padding: '4px 8px', borderRadius: '6px', background: 'var(--bg-tertiary)',
                  border: '1px solid var(--glass-border)', color: 'var(--text-primary)',
                  fontSize: '0.85rem', cursor: 'pointer'
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        );
      })()}

      {/* CREATE EMPLOYEE REGISTRATION MODAL */}
      <UserRegistrationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={(createdData) => {
          setCreatedResult(createdData);
          fetchUsers();
        }}
        tenants={tenants}
        roles={roles}
        isParkAdmin={isParkAdmin}
        user={user}
      />

      {/* REGISTRATION CONFIRMATION MODAL */}
      {createdResult && (
        <div 
          onClick={() => setCreatedResult(null)}
          className="modal-overlay" 
          style={{
            position: 'fixed', inset: 0, background: 'var(--modal-backdrop, rgba(16, 20, 24, 0.78))', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200
          }}
        >
          <div 
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-created-dialog-title"
            className="modal-card accent-strip-success enterprise-card"
            style={{
              width: '540px', maxWidth: '92vw', background: 'var(--bg-secondary, #0f172a)',
              border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 'var(--border-radius-lg, 18px)', padding: '32px 28px',
              boxShadow: 'var(--modal-shadow, 0 25px 50px -12px rgba(0, 0, 0, 0.6))',
              display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.2s ease-out', position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Badge & Title */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '58px', height: '58px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', margin: '0 auto 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.25)'
              }}>
                <Check size={30} strokeWidth={2.5} />
              </div>
              <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.3px' }}>
                {t('identity.accountCreatedTitle')}
              </h2>
              <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                {t('identity.accountCreatedSubtitle')}
              </p>
            </div>

            {/* Credential Data Box */}
            <div style={{
              background: 'var(--bg-tertiary, rgba(30, 41, 59, 0.6))', border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '14px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{t('identity.employeeNameLabel')}</span>
                <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: 800 }}>
                  {createdResult.FirstName || createdResult.firstName} {createdResult.LastName || createdResult.lastName}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{t('identity.assignedCompanyLabel')}</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  🏢 {createdResult.TenantName || createdResult.CompanyName || 'Acme Technologies PLC'}
                </span>
              </div>

              {(createdResult.DepartmentName || createdResult.departmentName) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{t('identity.assignedDeptLabel')}</span>
                  <span style={{ color: '#818cf8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    📂 {createdResult.DepartmentName || createdResult.departmentName}
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{t('identity.emailAddressLabel')}</span>
                <span style={{ color: '#818cf8', fontWeight: 600 }}>{createdResult.Email || createdResult.email}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{t('identity.permanentUsernameLabel')}</span>
                <span style={{
                  background: 'rgba(99, 102, 241, 0.18)', border: '1px solid rgba(99, 102, 241, 0.3)',
                  color: '#a5b4fc', padding: '4px 12px', borderRadius: '6px', fontSize: '0.88rem', fontWeight: 700, fontFamily: 'monospace'
                }}>
                  {createdResult.generatedUsername || createdResult.Username || createdResult.username}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{t('identity.tempPasswordLabel')}</span>
                <span style={{
                  background: 'rgba(239, 68, 68, 0.18)', border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171', padding: '4px 12px', borderRadius: '6px', fontSize: '0.88rem', fontWeight: 700, fontFamily: 'monospace'
                }}>
                  {createdResult.tempPassword}
                </span>
              </div>
            </div>

            {/* Email Dispatch Result Message */}
            {createdResult.emailSent !== false ? (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: '10px',
                color: '#34d399', fontSize: '0.84rem', fontWeight: 600, lineHeight: '1.4',
                padding: '4px 8px'
              }}>
                <Check size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  {t('identity.emailDispatchedMsg')} <strong>{createdResult.Email || createdResult.email}</strong>.
                </span>
              </div>
            ) : (
              <div style={{
                background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '12px 16px', borderRadius: '10px', fontSize: '0.82rem', color: '#f87171'
              }}>
                <div style={{ fontWeight: 700, marginBottom: '4px' }}>⚠️ {t('identity.emailDeliveryNotice')}</div>
                <div>
                  {t('identity.emailCouldNotDeliver')} <strong>{createdResult.Email || createdResult.email}</strong> ({createdResult.emailError || 'Non-routable domain or SMTP filter'}).
                </div>
                <div style={{ fontSize: '0.76rem', marginTop: '6px', color: 'var(--text-muted)' }}>
                  {t('identity.sharePasswordNotice')}
                </div>
              </div>
            )}

            {createdResult.emailPreviewUrl && (
              <div style={{ textAlign: 'center' }}>
                <a
                  href={createdResult.emailPreviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    color: '#818cf8', background: 'rgba(99, 102, 241, 0.15)',
                    border: '1px solid rgba(99, 102, 241, 0.3)', padding: '8px 16px',
                    borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, textDecoration: 'none'
                  }}
                >
                  ✉️ {t('identity.viewEmailSandbox')}
                </a>
              </div>
            )}

            {/* Done Action Button */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '6px' }}>
              <button
                onClick={() => setCreatedResult(null)}
                style={{
                  minWidth: '130px', padding: '10px 36px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  border: 'none', color: '#ffffff', fontSize: '0.92rem', fontWeight: 700,
                  cursor: 'pointer', boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
                  transition: 'transform 0.15s ease, boxShadow 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(99, 102, 241, 0.4)';
                }}
              >
                {t('identity.btnDone')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* USER DETAIL & AUDIT MODAL */}
      {showDetailModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '700px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: 'var(--accent-gradient)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  color: 'white'
                }}>
                  {`${selectedUser.FirstName ? selectedUser.FirstName[0] : ''}${selectedUser.LastName ? selectedUser.LastName[0] : ''}`}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem' }}>{selectedUser.FirstName} {selectedUser.LastName}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>@{selectedUser.Username} • ID #{selectedUser.UserID}</p>
                </div>
              </div>
              <button onClick={() => setShowDetailModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--glass-border)', marginBottom: '20px' }}>
              <button
                onClick={() => setDetailTab('profile')}
                style={{
                  padding: '8px 16px',
                  background: 'none',
                  border: 'none',
                  borderBottom: detailTab === 'profile' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                  color: detailTab === 'profile' ? 'var(--accent-primary)' : 'var(--text-muted)',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {t('identity.tabProfileMetadata')}
              </button>
              <button
                onClick={() => setDetailTab('sessions')}
                style={{
                  padding: '8px 16px',
                  background: 'none',
                  border: 'none',
                  borderBottom: detailTab === 'sessions' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                  color: detailTab === 'sessions' ? 'var(--accent-primary)' : 'var(--text-muted)',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {t('identity.tabActiveSessionsCount')} ({userSessions.length})
              </button>
              <button
                onClick={() => setDetailTab('audit')}
                style={{
                  padding: '8px 16px',
                  background: 'none',
                  border: 'none',
                  borderBottom: detailTab === 'audit' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                  color: detailTab === 'audit' ? 'var(--accent-primary)' : 'var(--text-muted)',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {t('identity.tabAuditHistoryCount')} ({userAuditLogs.length})
              </button>
            </div>

            {loadingDetails ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                <RefreshCw className="animate-spin" size={24} style={{ marginBottom: '12px' }} />
                <p>{t('identity.fetchingDetails')}</p>
              </div>
            ) : detailTab === 'profile' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: 'var(--border-radius-sm)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('common.email')}</div>
                  <div style={{ fontWeight: '600', marginTop: '4px' }}>{selectedUser.Email}</div>
                </div>
                <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: 'var(--border-radius-sm)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('identity.phoneNumber')}</div>
                  <div style={{ fontWeight: '600', marginTop: '4px' }}>{selectedUser.PhoneNumber || 'N/A'}</div>
                </div>
                <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: 'var(--border-radius-sm)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('identity.thAccountStatus')}</div>
                  <div style={{ marginTop: '6px' }}>{getStatusBadge(selectedUser.Status)}</div>
                </div>
                <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: 'var(--border-radius-sm)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('identity.registrationDate')}</div>
                  <div style={{ fontWeight: '600', marginTop: '4px' }}>
                    {selectedUser.CreatedDate ? new Date(selectedUser.CreatedDate).toLocaleString() : 'N/A'}
                  </div>
                </div>
              </div>
            ) : detailTab === 'sessions' ? (
              userSessions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  {t('identity.noSessionsFound')}
                </div>
              ) : (
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>{t('identity.thIpAddress')}</th>
                      <th>{t('identity.thDeviceBrowser')}</th>
                      <th>{t('identity.thLoginTimestamp')}</th>
                      <th style={{ textAlign: 'right' }}>{t('identity.thActions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userSessions.map((s) => (
                      <tr key={s.SessionID}>
                        <td style={{ fontFamily: 'monospace' }}>{s.IpAddress || '127.0.0.1'}</td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.UserAgent || 'Browser Session'}</td>
                        <td style={{ fontSize: '0.8rem' }}>{new Date(s.CreatedDate || s.LoginTime || Date.now()).toLocaleString()}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            onClick={() => handleRevokeSession(s.SessionID)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '4px',
                              background: 'rgba(239, 68, 68, 0.15)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              color: 'var(--color-danger)',
                              cursor: 'pointer',
                              fontSize: '0.75rem'
                            }}
                          >
                            {t('identity.terminateSessionBtn')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            ) : (
              userAuditLogs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  {t('identity.noAuditFound')}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {userAuditLogs.map((log, idx) => (
                    <div key={idx} style={{
                      padding: '12px',
                      borderRadius: 'var(--border-radius-sm)',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--glass-border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{log.EventType || log.Action || 'Account Activity'}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{log.Details || log.Description || 'System operation executed.'}</div>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {new Date(log.Timestamp || log.CreatedDate || Date.now()).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* STATUS CHANGE MODAL */}
      {showStatusModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '400px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '12px' }}>{t('identity.updateStatusTitle')}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              {t('identity.updateStatusPrompt')} <strong>{selectedUser.Username}</strong>:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              {ACCOUNT_STATUSES.map(st => (
                <button
                  key={st.value}
                  onClick={() => handleStatusChange(st.value)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderRadius: 'var(--border-radius-sm)',
                    background: selectedUser.Status === st.value ? 'var(--accent-gradient)' : 'var(--bg-tertiary)',
                    border: '1px solid var(--glass-border)',
                    color: selectedUser.Status === st.value ? '#ffffff' : 'var(--text-primary)',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  <span>{st.label}</span>
                  {selectedUser.Status === st.value && <Check size={16} />}
                </button>
              ))}
            </div>

            <div style={{ textAlign: 'right' }}>
              <button
                onClick={() => setShowStatusModal(false)}
                style={{ padding: '8px 16px', borderRadius: 'var(--border-radius-sm)', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', cursor: 'pointer' }}
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {showDeleteModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '400px' }}>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--color-danger)', marginBottom: '12px' }}>{t('identity.deleteUserTitle')}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              {t('identity.deleteUserPrompt')} <strong>{selectedUser.Username}</strong> ({selectedUser.Email})? {t('identity.deleteUserLostAccess')}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                style={{ padding: '8px 16px', borderRadius: 'var(--border-radius-sm)', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', cursor: 'pointer' }}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleDeleteUser}
                style={{ padding: '8px 16px', borderRadius: 'var(--border-radius-sm)', background: 'var(--color-danger)', border: 'none', color: '#ffffff', fontWeight: '600', cursor: 'pointer' }}
              >
                {t('identity.confirmDeleteBtn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ROLE ASSIGNMENT MODAL (RBAC INTEGRATION) */}
      {showRoleAssignModal && selectedUser && (
        <UserRoleAssignModal
          userToAssign={selectedUser}
          onClose={() => setShowRoleAssignModal(false)}
          onSuccess={() => fetchUsers()}
        />
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
