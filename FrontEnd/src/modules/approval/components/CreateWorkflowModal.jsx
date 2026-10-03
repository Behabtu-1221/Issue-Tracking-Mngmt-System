import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Trash2, Layers, ShieldCheck, Tag, FileText, Sparkles, RefreshCw, User, AlertCircle } from 'lucide-react';
import { FormField } from '../../../components/common/FormField';
import { approvalSchemas } from '../../../validation';

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
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'var(--modal-backdrop, rgba(16, 20, 24, 0.78))', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px'
    }}>
      <div style={{
        background: 'var(--bg-secondary)', border: '1px solid var(--glass-border-accent)',
        borderRadius: '24px', width: '100%', maxWidth: '640px', maxHeight: '90vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid var(--glass-border)', background: 'var(--bg-tertiary)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(138, 75, 255, 0.15)', color: 'var(--accent-primary)' }}>
              <Layers size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)' }}>Initiate Approval Workflow</h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>Configure single or multi-level approval stages for a service request</p>
            </div>
          </div>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}><X size={18} /></button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
            <FormField label="Issue Request ID" required error={errors.RequestID} icon={Tag}>
              <input
                type="number"
                value={requestId}
                onChange={(e) => {
                  setRequestId(e.target.value);
                  clearFieldError('RequestID');
                }}
                placeholder=""
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  background: 'var(--bg-tertiary)',
                  border: errors.RequestID ? '1.5px solid var(--color-danger, #ef4444)' : '1px solid var(--glass-border)',
                  borderRadius: 'var(--border-radius-sm)',
                  color: 'var(--text-primary)',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
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
                placeholder=""
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  background: 'var(--bg-tertiary)',
                  border: errors.Title ? '1.5px solid var(--color-danger, #ef4444)' : '1px solid var(--glass-border)',
                  borderRadius: 'var(--border-radius-sm)',
                  color: 'var(--text-primary)',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
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
              style={{
                width: '100%',
                padding: '11px 14px',
                background: 'var(--bg-tertiary)',
                border: errors.Description ? '1.5px solid var(--color-danger, #ef4444)' : '1px solid var(--glass-border)',
                borderRadius: 'var(--border-radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '0.88rem',
                outline: 'none',
                boxSizing: 'border-box',
                resize: 'vertical'
              }}
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
                style={{ background: 'rgba(138, 75, 255, 0.12)', border: '1px solid var(--accent-primary)', color: 'var(--accent-primary)', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}
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
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{errors.stages}</span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {stages.map((st, idx) => {
                const stageError = errors[`stage_${idx}`] || errors[`stage_${idx}_ApproverUserID`];
                return (
                  <div key={idx} style={{ background: 'var(--bg-tertiary)', border: stageError ? '1.5px solid var(--color-danger, #ef4444)' : '1px solid var(--glass-border)', padding: '14px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-gradient)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.85rem', flexShrink: 0 }}>
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
                          placeholder=""
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            background: 'var(--bg-secondary)',
                            border: stageError ? '1.5px solid var(--color-danger, #ef4444)' : '1px solid var(--glass-border)',
                            borderRadius: '6px',
                            color: 'var(--text-primary)',
                            fontSize: '0.84rem',
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                        />
                      </FormField>
                    </div>

                    {stages.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStage(idx)}
                        style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '8px', borderRadius: '8px', cursor: 'pointer', flexShrink: 0, marginTop: stageError ? '-16px' : '0' }}
                        title="Remove Stage"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px', paddingTop: '16px', borderTop: '1px solid var(--glass-border)', flexShrink: 0 }}>
            <button type="button" onClick={handleClose} style={{ padding: '10px 18px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={submitting} style={{ padding: '10px 22px', borderRadius: 'var(--border-radius-sm)', border: 'none', background: 'var(--accent-gradient)', color: '#ffffff', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', boxShadow: 'var(--glow-accent)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {submitting && <RefreshCw size={14} className="spin" />}
              {submitting ? 'Creating Workflow...' : 'Initiate Approval Workflow'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
