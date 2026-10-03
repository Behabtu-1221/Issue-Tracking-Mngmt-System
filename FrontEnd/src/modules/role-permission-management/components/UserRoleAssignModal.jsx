import React, { useState, useEffect } from 'react';
import { X, UserCheck, Shield, Check, AlertCircle } from 'lucide-react';
import rbacApi from '../api/rbacApi';
import { FormField } from '../../../components/common/FormField';
import { rolePermissionSchemas } from '../../../validation';

const glassCard = {
  background: 'var(--glass-bg)',
  border: '1px solid rgba(148, 163, 184, 0.15)',
  borderRadius: '18px',
  backdropFilter: 'blur(16px)',
  padding: '24px'
};

export default function UserRoleAssignModal({ userToAssign, onClose, onSuccess }) {
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

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100
    }} onClick={onClose}>
      <div style={{
        ...glassCard, width: '520px', maxWidth: '92vw',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        boxShadow: '0 25px 70px rgba(0,0,0,0.6)'
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <UserCheck size={24} color="#818cf8" />
            <div>
              <h3 style={{ margin: 0, color: '#f1f5f9', fontSize: '17px', fontWeight: 700 }}>
                Assign Employee Role
              </h3>
              <p style={{ margin: '2px 0 0', color: '#94a3b8', fontSize: '12px' }}>
                Allocate security authority and granular permissions
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {errorMsg && (
          <div style={{
            padding: '10px 14px', borderRadius: '10px', marginBottom: '16px', fontSize: '13px',
            background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444'
          }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleAssign} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: 'var(--bg-tertiary)', padding: '14px 18px', borderRadius: '12px' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Selected Employee:</div>
            <div style={{ fontSize: '15px', color: '#f1f5f9', fontWeight: 700, marginTop: '2px' }}>
              {userToAssign?.FirstName} {userToAssign?.LastName}
            </div>
            <div style={{ fontSize: '12px', color: '#818cf8' }}>
              {userToAssign?.Email} • {userToAssign?.JobTitle || 'Employee'}
            </div>
          </div>

          <FormField
            label="Select System or Company Role"
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
              style={{
                width: '100%',
                background: 'var(--bg-tertiary)',
                border: assignErrors.roleId ? '1px solid #ef4444' : '1px solid rgba(148, 163, 184, 0.15)',
                borderRadius: '10px',
                padding: '10px 14px',
                color: '#f1f5f9',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            >
              <option value="">-- Choose Role --</option>
              {roles.map(r => (
                <option key={r.RoleID || r.id} value={r.RoleID || r.id}>
                  {r.RoleName || r.roleName} ({r.RoleCode || r.roleCode})
                </option>
              ))}
            </select>
          </FormField>

          {selectedRoleObj && (
            <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: '12px', padding: '14px' }}>
              <div style={{ fontSize: '12px', color: '#818cf8', fontWeight: 700 }}>
                Role Preview: {selectedRoleObj.RoleName || selectedRoleObj.roleName}
              </div>
              <div style={{ fontSize: '11.5px', color: '#cbd5e1', marginTop: '4px' }}>
                {selectedRoleObj.Description || selectedRoleObj.description || 'Custom organizational authority role'}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(100, 116, 139, 0.2)', border: '1px solid rgba(148, 163, 184, 0.15)',
                borderRadius: '10px', padding: '10px 18px', color: '#94a3b8', fontWeight: 600, fontSize: '13px', cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                border: 'none', borderRadius: '10px', padding: '10px 22px',
                color: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)'
              }}
            >
              {submitting ? 'Assigning...' : 'Assign Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
