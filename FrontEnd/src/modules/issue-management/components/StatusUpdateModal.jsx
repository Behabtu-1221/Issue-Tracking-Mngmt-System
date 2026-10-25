import React, { useState, useEffect } from 'react';
import { RefreshCw, MessageSquare } from 'lucide-react';
import issueManagementApi from '../api/issueManagementApi';
import { requestSchemas } from '../../../validation';
import { FormField } from '../../../components/common/FormField';
import { ModalCard } from '../../../components/common/ModalCard';
import { useTranslation } from '../../../i18n';

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
  const { t } = useTranslation();
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
    <ModalCard
      isOpen={isOpen}
      onClose={onClose}
      title={t('issues.updateStatusTitle', 'Update Status')}
      subtitle={`${issue.RequestNumber || ''} — Current: ${issue.StatusCode?.replace('_', ' ') || ''}`}
      icon={RefreshCw}
      accentStrip="brand"
      maxWidth="520px"
      onSubmit={availableStatuses.length > 0 ? handleSubmit : undefined}
      submitting={submitting}
      submitText={t('issues.updateStatusBtn', 'Update Status')}
      cancelText={t('common.cancel', 'Cancel')}
      error={serverError}
    >
      {availableStatuses.length === 0 ? (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <p style={{ fontWeight: '600', marginBottom: '4px' }}>{t('issues.noTransitionsAvailable', 'No transitions available')}</p>
          <p style={{ fontSize: '0.85rem' }}>{t('issues.terminalStateDesc', { status: issue.StatusCode }, `This issue is in a terminal state (${issue.StatusCode}).`)}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Status Select Buttons */}
          <FormField
            label={t('issues.targetStatusTransition', 'Target Status Transition')}
            id="newStatus"
            required
            icon={RefreshCw}
            error={fieldErrors.Status}
            helpText={t('issues.selectNextStatusHelp', 'Select the next allowable lifecycle status for this request.')}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', paddingTop: '4px' }}>
              {availableStatuses.map((status) => {
                const color = getStatusColor(status);
                const isSelected = newStatus === status;
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => handleStatusChange(status)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: isSelected ? `2px solid ${color}` : '1px solid var(--glass-border)',
                      backgroundColor: isSelected ? `${color}18` : 'rgba(255,255,255,0.03)',
                      color: isSelected ? color : 'var(--text-secondary)',
                      fontWeight: isSelected ? '700' : '500',
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {status.replace(/_/g, ' ')}
                  </button>
                );
              })}
            </div>
          </FormField>

          {/* Status Remarks */}
          <FormField
            label={t('issues.transitionRemarks', 'Transition Remarks / Justification')}
            id="remarks"
            required={isJustificationRequired}
            icon={MessageSquare}
            error={fieldErrors.Remarks}
            helpText={isJustificationRequired ? t('issues.justificationRequiredHelp', 'Reason is required when placing on hold or cancelling.') : t('issues.optionalStatusNotesHelp', 'Optional explanation or status notes.')}
          >
            <textarea
              id="remarks"
              rows={3}
              value={remarks}
              onChange={(e) => handleRemarksChange(e.target.value)}
              placeholder={isJustificationRequired ? t('issues.provideReasonPlaceholder', 'Provide the specific reason or blocker for this status update...') : t('issues.optionalNotesPlaceholder', 'Optional notes about this status change...')}
              className={`form-control ${fieldErrors.Remarks ? 'input-error' : ''}`}
            />
          </FormField>
        </div>
      )}
    </ModalCard>
  );
};

export default StatusUpdateModal;
