import React, { useState, useEffect } from 'react';
import { UserCheck, Shield } from 'lucide-react';
import rbacApi from '../api/rbacApi';
import { FormField } from '../../../components/common/FormField';
import { ModalCard } from '../../../components/common/ModalCard';
import { rolePermissionSchemas } from '../../../validation';
import { useTranslation } from '../../../i18n';

export default function UserRoleAssignModal({ userToAssign, onClose, onSuccess }) {
  const { t } = useTranslation();
  const [roles, setRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [assignErrors, setAssignErrors] = useState({});

  const clearAssignError = (field) => {
    if (assignErrors[field]) {
      setAssignErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  useEffect(() => {
    fetchRoles();
    setAssignErrors({});
    const currentRoles = userToAssign?.Roles || userToAssign?.roles || [];
    if (currentRoles.length > 0) {
      const currentRole = currentRoles[0];
      setSelectedRoleId(currentRole.RoleID || currentRole.id || currentRole.roleId || '');
    }
  }, [userToAssign]);

  const fetchRoles = async () => {
    try {
      const res = await rbacApi.getRoles();
      if (res.data && res.data.status === 'success') {
        setRoles(res.data.data.roles || res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load roles list:', err);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const validation = rolePermissionSchemas.userRoleAssignForm({
      userId: userToAssign?.UserID || userToAssign?.id,
      roleId: selectedRoleId
    });

    if (!validation.isValid) {
      setAssignErrors(validation.errors);
      return;
    }
    setAssignErrors({});

    setSubmitting(true);
    try {
      await rbacApi.assignRoleToUser(validation.sanitized.userId, validation.sanitized.roleId);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to assign role to employee');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedRoleObj = roles.find(r => String(r.RoleID || r.id) === String(selectedRoleId));

  if (!userToAssign) return null;

  return (
    <ModalCard
      isOpen={Boolean(userToAssign)}
      onClose={onClose}
      title={t('rbac.assignEmployeeRoleTitle', 'Assign Employee Role')}
      subtitle={t('rbac.assignEmployeeRoleSubtitle', 'Allocate security authority and granular permissions')}
      icon={UserCheck}
      accentStrip="brand"
      maxWidth="520px"
      onSubmit={handleAssign}
      submitting={submitting}
      submitText={t('rbac.assignRoleBtn', 'Assign Role')}
      cancelText={t('common.cancel', 'Cancel')}
      error={errorMsg}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--glass-border)',
          padding: '14px 18px',
          borderRadius: '12px'
        }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            {t('rbac.selectedEmployee', 'Selected Employee:')}
          </div>
          <div style={{ fontSize: '15px', color: 'var(--text-primary)', fontWeight: 700, marginTop: '2px' }}>
            {userToAssign?.FirstName} {userToAssign?.LastName}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--brand-primary, #2563eb)' }}>
            {userToAssign?.Email} • {userToAssign?.JobTitle || 'Employee'}
          </div>
        </div>

        <FormField
          label={t('rbac.selectRoleLabel', 'Select System or Company Role')}
          required
          icon={Shield}
          error={assignErrors.roleId}
          id="assign-role-id"
        >
          <select
            id="assign-role-id"
            value={selectedRoleId}
            onChange={(e) => {
              setSelectedRoleId(e.target.value);
              clearAssignError('roleId');
            }}
            className={`form-control ${assignErrors.roleId ? 'input-error' : ''}`}
          >
            <option value="">{t('rbac.chooseRoleOption', '-- Choose Role --')}</option>
            {roles.map(r => (
              <option key={r.RoleID || r.id} value={r.RoleID || r.id}>
                {r.RoleName || r.roleName} ({r.RoleCode || r.roleCode})
              </option>
            ))}
          </select>
        </FormField>

        {selectedRoleObj && (
          <div style={{
            background: 'rgba(37, 99, 235, 0.08)',
            border: '1px solid rgba(37, 99, 235, 0.25)',
            borderRadius: '12px',
            padding: '14px'
          }}>
            <div style={{ fontSize: '12px', color: 'var(--brand-primary, #2563eb)', fontWeight: 700 }}>
              {t('rbac.rolePreview', 'Role Preview:')} {selectedRoleObj.RoleName || selectedRoleObj.roleName}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {selectedRoleObj.Description || selectedRoleObj.description || 'Custom organizational authority role'}
            </div>
          </div>
        )}
      </div>
    </ModalCard>
  );
}
