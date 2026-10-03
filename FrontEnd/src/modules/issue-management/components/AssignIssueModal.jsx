import React, { useState, useEffect } from 'react';
import { X, UserCheck, Building2, MessageSquare, AlertCircle } from 'lucide-react';
import issueManagementApi from '../api/issueManagementApi';
import orgApi from '../../organization/api/orgApi';
import { requestSchemas } from '../../../validation';
import { FormField } from '../../../components/common/FormField';

export const AssignIssueModal = ({ isOpen, onClose, issue, onAssigned }) => {
  const [assignedDepartmentId, setAssignedDepartmentId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [departments, setDepartments] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setAssignedDepartmentId(issue?.AssignedDepartmentID ? String(issue.AssignedDepartmentID) : '');
      setRemarks('');
      setFieldErrors({});
      setServerError(null);

      // Fetch active departments for selector
      setLoadingDepts(true);
      orgApi.getDepartments({ limit: 200 })
        .then(res => {
          const deptList = res.data?.data?.departments || res.data?.data || [];
          setDepartments(Array.isArray(deptList) ? deptList : []);
        })
        .catch(err => {
          console.error('Failed to load departments for assignment modal:', err);
        })
        .finally(() => setLoadingDepts(false));
    }
  }, [isOpen, issue]);

  const handleFieldChange = (field, value) => {
    if (field === 'assignedDepartmentId') {
      setAssignedDepartmentId(value);
    } else if (field === 'remarks') {
      setRemarks(value);
    }
    // Clear inline error on edit
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: null }));
    }
    if (serverError) {
      setServerError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

    const validation = requestSchemas.assignDepartmentForm({
      assignedDepartmentId,
      remarks
    });

    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      return;
    }

    setSubmitting(true);
    try {
      await issueManagementApi.assignIssue(issue.IssueRequestID, {
        assignedDepartmentId: validation.sanitized.assignedDepartmentId,
        remarks: validation.sanitized.remarks
      });
      onAssigned?.();
      onClose();
    } catch (err) {
      setServerError(err.response?.data?.message || 'Failed to assign department to issue');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !issue) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(6px)'
    }}>
      <div className="glass-panel" style={{
        width: '100%', maxWidth: '500px',
        borderRadius: 'var(--border-radius-lg)', padding: '0'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 28px',
          borderBottom: '1px solid var(--glass-border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.08), rgba(138, 75, 255, 0.06))'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.15)' }}>
              <UserCheck size={20} style={{ color: '#c084fc' }} />
            </div>
            <div>
              <h2 style={{ fontWeight: '700', fontSize: '1.1rem' }}>Assign Department</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {issue.RequestNumber} — {issue.Title?.substring(0, 40)}{issue.Title?.length > 40 ? '...' : ''}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ padding: '6px', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {serverError && (
            <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#f87171', fontSize: '0.85rem' }}>
              {serverError}
            </div>
          )}

          {/* Department Selector */}
          <FormField
            label="Target Fulfillment Department"
            id="assignedDepartmentId"
            required
            icon={Building2}
            error={fieldErrors.assignedDepartmentId}
            helpText="Select the department responsible for fulfilling this issue."
          >
            {departments.length > 0 ? (
              <select
                id="assignedDepartmentId"
                value={assignedDepartmentId}
                onChange={(e) => handleFieldChange('assignedDepartmentId', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: fieldErrors.assignedDepartmentId ? '1px solid var(--color-danger, #ef4444)' : '1px solid var(--glass-border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              >
                <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                  {loadingDepts ? 'Loading departments...' : '-- Select Target Department --'}
                </option>
                {departments.map((dept) => (
                  <option
                    key={dept.DepartmentID}
                    value={dept.DepartmentID}
                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  >
                    🏢 {dept.DepartmentName} ({dept.DepartmentCode || 'DEPT'})
                  </option>
                ))}
              </select>
            ) : (
              <input
                id="assignedDepartmentId"
                type="number"
                min="1"
                value={assignedDepartmentId}
                onChange={(e) => handleFieldChange('assignedDepartmentId', e.target.value)}
                placeholder="Enter Department ID (e.g. 101)"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: fieldErrors.assignedDepartmentId ? '1px solid var(--color-danger, #ef4444)' : '1px solid var(--glass-border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            )}
          </FormField>

          {/* Remarks */}
          <FormField
            label="Assignment Remarks"
            id="remarks"
            icon={MessageSquare}
            error={fieldErrors.remarks}
            helpText="Optional routing notes or specific technician instructions (max 1000 characters)."
          >
            <textarea
              id="remarks"
              rows={3}
              value={remarks}
              onChange={(e) => handleFieldChange('remarks', e.target.value)}
              placeholder="Provide assignment context or special instructions for the handling team..."
              style={{
                width: '100%',
                padding: '10px 14px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: fieldErrors.remarks ? '1px solid var(--color-danger, #ef4444)' : '1px solid var(--glass-border)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </FormField>

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--glass-border)' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: '1px solid var(--glass-border)',
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
              style={{ padding: '10px 24px' }}
            >
              {submitting ? 'Assigning...' : 'Assign Department'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignIssueModal;
