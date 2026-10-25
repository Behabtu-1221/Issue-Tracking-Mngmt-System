import React, { useState } from 'react';
import { Layers, ShieldCheck, Tag, FileText, Sparkles, RefreshCw, User, Plus } from 'lucide-react';
import { FormField } from '../../../components/common/FormField';
import { approvalSchemas } from '../../../validation';
import { ActionButton } from '../../../components/common/ActionButton';
import { ModalCard } from '../../../components/common/ModalCard';

export default function CreateWorkflowModal({ isOpen, onClose, onSubmit }) {
  const [requestId, setRequestId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [stages, setStages] = useState([
    { StageNumber: 1, ApproverUserID: 1, ApproverGroupID: '' },
    { StageNumber: 2, ApproverUserID: 2, ApproverGroupID: '' }
  ]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const clearFieldError = (field) => {
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleAddStage = () => {
    setStages([
      ...stages,
      { StageNumber: stages.length + 1, ApproverUserID: 1, ApproverGroupID: '' }
    ]);
    clearFieldError('stages');
  };

  const handleRemoveStage = (idx) => {
    if (stages.length === 1) return;
    const updated = stages.filter((_, i) => i !== idx).map((s, i) => ({ ...s, StageNumber: i + 1 }));
    setStages(updated);
    setErrors(prev => {
      const next = { ...prev };
      delete next[`stage_${idx}`];
      delete next[`stage_${idx}_ApproverUserID`];
      return next;
    });
  };

  const handleStageChange = (idx, field, value) => {
    const updated = [...stages];
    updated[idx][field] = value;
    setStages(updated);
    setErrors(prev => {
      const next = { ...prev };
      delete next[`stage_${idx}`];
      delete next[`stage_${idx}_${field}`];
      delete next.stages;
      return next;
    });
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = approvalSchemas.createWorkflowForm({
      RequestID: requestId,
      Title: title,
      Description: description,
      stages
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    try {
      setSubmitting(true);
      await onSubmit(validation.sanitized);
    } catch (err) {
      alert('Failed to initiate approval workflow: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalCard
      isOpen={isOpen}
      onClose={handleClose}
      title="Initiate Approval Workflow"
      subtitle="Configure single or multi-level approval stages for a service request"
      icon={Layers}
      accentStrip="purple"
      maxWidth="660px"
      onSubmit={handleSubmit}
      submitting={submitting}
      submitText="Initiate Approval Workflow"
      cancelText="Cancel"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div className="form-grid-2">
          <FormField label="Issue Request ID" required error={errors.RequestID} icon={Tag}>
            <input
              type="number"
              value={requestId}
              onChange={(e) => {
                setRequestId(e.target.value);
                clearFieldError('RequestID');
              }}
              placeholder="e.g. 101"
              className={`form-control ${errors.RequestID ? 'input-error' : ''}`}
            />
          </FormField>

          <FormField label="Workflow Title" required error={errors.Title} icon={Sparkles}>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                clearFieldError('Title');
              }}
              placeholder="e.g. HVAC Replacement Approval"
              className={`form-control ${errors.Title ? 'input-error' : ''}`}
            />
          </FormField>
        </div>

        <FormField label="Workflow Justification & Context" error={errors.Description} icon={FileText} helpText="Optional context or background rationale for approvers (max 1000 characters)">
          <textarea
            rows={3}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              clearFieldError('Description');
            }}
            placeholder="Provide background context or justification for approvers..."
            className={`form-control ${errors.Description ? 'input-error' : ''}`}
          />
        </FormField>

        {/* Multi-Stage Configuration */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <ShieldCheck size={14} color="var(--accent-primary)" /> Approval Stages Pipeline
            </label>
            <button
              type="button"
              onClick={handleAddStage}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <Plus size={14} /> Add Stage
            </button>
          </div>

          {errors.stages && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: 'var(--color-danger, #ef4444)',
              fontSize: '0.8rem',
              fontWeight: 600,
              marginBottom: '10px'
            }}>
              <span>{errors.stages}</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {stages.map((st, idx) => {
              const stageError = errors[`stage_${idx}`] || errors[`stage_${idx}_ApproverUserID`];
              return (
                <div
                  key={idx}
                  style={{
                    background: 'var(--bg-tertiary)',
                    border: stageError ? '1.5px solid var(--color-danger, #ef4444)' : '1px solid var(--glass-border)',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px'
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'var(--brand-primary, #2563eb)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '800',
                    fontSize: '0.85rem',
                    flexShrink: 0
                  }}>
                    {st.StageNumber}
                  </div>

                  <div style={{ flex: 1 }}>
                    <FormField
                      label={`Stage ${st.StageNumber} Approver User ID`}
                      required
                      error={stageError}
                      icon={User}
                    >
                      <input
                        type="number"
                        value={st.ApproverUserID}
                        onChange={(e) => handleStageChange(idx, 'ApproverUserID', e.target.value)}
                        placeholder="e.g. 1"
                        className={`form-control ${stageError ? 'input-error' : ''}`}
                      />
                    </FormField>
                  </div>

                  {stages.length > 1 && (
                    <ActionButton
                      variant="delete"
                      onClick={() => handleRemoveStage(idx)}
                      title="Remove Stage"
                      style={{ flexShrink: 0, marginTop: stageError ? '-16px' : '0' }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ModalCard>
  );
}
