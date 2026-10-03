import React, { useState, useEffect } from 'react';
import { X, RefreshCw, MessageSquare, ShieldAlert } from 'lucide-react';
import issueManagementApi from '../api/issueManagementApi';
import { requestSchemas } from '../../../validation';
import { FormField } from '../../../components/common/FormField';

const STATUS_TRANSITIONS = {
  NEW: ['APPROVED', 'ASSIGNED', 'IN_PROGRESS', 'CANCELLED'],
  PENDING_APPROVAL: ['APPROVED', 'ASSIGNED', 'CANCELLED'],
  APPROVED: ['ASSIGNED', 'IN_PROGRESS', 'CANCELLED'],
  ASSIGNED: ['IN_PROGRESS', 'PENDING', 'CANCELLED'],
  IN_PROGRESS: ['PENDING', 'RESOLVED', 'CANCELLED'],
  PENDING: ['IN_PROGRESS', 'RESOLVED', 'CANCELLED'],
  RESOLVED: ['CLOSED'],
  CLOSED: [],
  CANCELLED: []
};

export const StatusUpdateModal = ({ isOpen, onClose, issue, onStatusUpdated }) => {
  const [newStatus, setNewStatus] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState(null);

  const availableStatuses = STATUS_TRANSITIONS[issue?.StatusCode] || [];

  useEffect(() => {
    if (isOpen && issue) {
      setNewStatus(availableStatuses[0] || '');
      setRemarks('');
      setFieldErrors({});
      setServerError(null);
    }
  }, [isOpen, issue]);

  const handleStatusChange = (status) => {
    setNewStatus(status);
    if (fieldErrors.Status) {
      setFieldErrors(prev => ({ ...prev, Status: null }));
    }
    if (serverError) {
      setServerError(null);
    }
  };

  const handleRemarksChange = (value) => {
    setRemarks(value);
    if (fieldErrors.Remarks) {
      setFieldErrors(prev => ({ ...prev, Remarks: null }));
    }
    if (serverError) {
      setServerError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

    const validation = requestSchemas.statusUpdateForm({
      Status: newStatus,
      Remarks: remarks
    });

    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      return;
    }

    setSubmitting(true);
    try {
      await issueManagementApi.updateStatus(issue.IssueRequestID, {
        statusCode: validation.sanitized.Status,
        remarks: validation.sanitized.Remarks || undefined
      });
      onStatusUpdated?.();
      onClose();
    } catch (err) {
      setServerError(err.response?.data?.message || 'Failed to update issue status');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !issue) return null;

  const getStatusColor = (status) => {
    const colors = {
      NEW: '#60a5fa',
      APPROVED: '#38bdf8',
      ASSIGNED: '#c084fc',
      IN_PROGRESS: '#facc15',
      PENDING: '#fb923c',
      RESOLVED: '#4ade80',
      CLOSED: '#94a3b8',
      CANCELLED: '#f87171'
    };
    return colors[status] || '#60a5fa';
  };

  const isJustificationRequired = newStatus === 'PENDING' || newStatus === 'CANCELLED' || newStatus === 'REJECTED';

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
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(14, 165, 233, 0.06))'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.15)' }}>
              <RefreshCw size={20} style={{ color: '#60a5fa' }} />
            </div>
            <div>
              <h2 style={{ fontWeight: '700', fontSize: '1.1rem' }}>Update Status</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {issue.RequestNumber} — Current: <strong style={{ color: getStatusColor(issue.StatusCode) }}>{issue.StatusCode?.replace('_', ' ')}</strong>
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

          {availableStatuses.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p style={{ fontWeight: '600', marginBottom: '4px' }}>No transitions available</p>
              <p style={{ fontSize: '0.85rem' }}>This issue is in a terminal state ({issue.StatusCode}).</p>
            </div>
          ) : (
            <>
              {/* Status Select Buttons */}
              <FormField
                label="Target Status Transition"
                id="newStatus"
                required
                icon={RefreshCw}
                error={fieldErrors.Status}
                helpText="Select the next allowable lifecycle status for this request."
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {availableStatuses.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => handleStatusChange(status)}
                      style={{
                        padding: '10px 18px',
                        borderRadius: '10px',
                        border: newStatus === status ? `2px solid ${getStatusColor(status)}` : '1px solid var(--glass-border)',
                        backgroundColor: newStatus === status ? `${getStatusColor(status)}15` : 'rgba(255,255,255,0.03)',
                        color: newStatus === status ? getStatusColor(status) : 'var(--text-secondary)',
                        fontWeight: newStatus === status ? '700' : '500',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {status.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </FormField>

              {/* Status Remarks */}
              <FormField
                label="Transition Remarks / Justification"
                id="remarks"
                required={isJustificationRequired}
                icon={MessageSquare}
                error={fieldErrors.Remarks}
                helpText={isJustificationRequired ? 'Reason is required when placing on hold or cancelling.' : 'Optional explanation or status notes.'}
              >
                <textarea
                  id="remarks"
                  rows={3}
                  value={remarks}
                  onChange={(e) => handleRemarksChange(e.target.value)}
                  placeholder={isJustificationRequired ? 'Provide the specific reason or blocker for this status update...' : 'Optional notes about this status change...'}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: fieldErrors.Remarks ? '1px solid var(--color-danger, #ef4444)' : '1px solid var(--glass-border)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </FormField>

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
                  {submitting ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default StatusUpdateModal;
