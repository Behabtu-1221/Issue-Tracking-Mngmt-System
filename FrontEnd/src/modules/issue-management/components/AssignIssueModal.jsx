import React, { useState, useEffect } from 'react';
import { UserCheck } from 'lucide-react';
import issueManagementApi from '../api/issueManagementApi';
import { ModalCard } from '../../../components/common/ModalCard';
import { FormField } from '../../../components/common/FormField';

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

  return (
    <ModalCard
      isOpen={isOpen}
      onClose={onClose}
      title="Assign Department"
      subtitle={`${issue.RequestNumber || ''} — ${issue.Title?.substring(0, 45) || ''}${issue.Title?.length > 45 ? '...' : ''}`}
      icon={UserCheck}
      accentStrip="purple"
      maxWidth="500px"
      onSubmit={handleSubmit}
      submitting={submitting}
      submitText="Assign Department"
      cancelText="Cancel"
      error={error}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <FormField
          label="Target Department ID"
          required
          hint="ID of the department taking ownership of this request"
        >
          <input
            type="number"
            required
            min="1"
            className="form-control"
            value={assignedDepartmentId}
            onChange={(e) => setAssignedDepartmentId(e.target.value)}
            placeholder="Enter the department ID to assign"
          />
        </FormField>

        <FormField
          label="Assignment Remarks"
          hint="Optional assignment instructions or notes"
        >
          <textarea
            rows={3}
            className="form-control"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Optional assignment instructions or notes..."
          />
        </FormField>
      </div>
    </ModalCard>
  );
};

export default AssignIssueModal;
