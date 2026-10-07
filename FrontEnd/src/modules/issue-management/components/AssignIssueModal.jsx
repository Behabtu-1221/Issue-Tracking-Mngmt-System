import React, { useState, useEffect } from 'react';
import { X, UserCheck } from 'lucide-react';
import issueManagementApi from '../api/issueManagementApi';
import { requestSchemas } from '../../../validation';

export const AssignIssueModal = ({ isOpen, onClose, issue, onAssigned }) => {
  const [assignedDepartmentId, setAssignedDepartmentId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && issue) {
      setAssignedDepartmentId(issue.AssignedDepartmentID || '');
      setRemarks('');
      setError(null);
    }
  }, [isOpen, issue]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!assignedDepartmentId) {
      setError('Please select a target Department for assignment.');
      return;
    }

    setSubmitting(true);
    try {
      await issueManagementApi.assignIssue(issue.IssueRequestID, {
        assignedDepartmentId: Number(assignedDepartmentId),
        remarks: remarks.trim() || undefined
      });
      onAssigned?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign issue');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !issue) return null;

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid var(--glass-border)',
    borderRadius: '8px',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
    outline: 'none'
  };

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
        <form onSubmit={handleSubmit} style={{ padding: '24px 28px' }}>
          {error && (
            <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#f87171', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Department ID
            </label>
            <input
              type="number"
              required
              min="1"
              value={assignedDepartmentId}
              onChange={(e) => setAssignedDepartmentId(e.target.value)}
              placeholder="Enter the department ID to assign"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Assignment Remarks
            </label>
            <textarea
              rows="3"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Optional assignment instructions or notes..."
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--glass-border)' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: '600' }}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting} style={{ padding: '10px 24px' }}>
              {submitting ? 'Assigning...' : 'Assign Department'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignIssueModal;

