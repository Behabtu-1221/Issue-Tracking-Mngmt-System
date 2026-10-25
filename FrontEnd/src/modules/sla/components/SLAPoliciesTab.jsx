import React, { useState, useEffect } from 'react';
import slaApi from '../api/slaApi';
import ConfirmDialogModal from '../../../components/common/ConfirmDialogModal';
import AlertDialogModal from '../../../components/common/AlertDialogModal';
import { ActionButton } from '../../../components/common/ActionButton';
import { slaSchemas } from '../../../validation';
import {
  ShieldCheck,
  Plus,
  Clock,
  Sliders,
  X,
  Trash2,
  Zap,
  AlertTriangle,
  Flame,
  CheckCircle2,
  FileText,
  Sparkles,
  RefreshCw,
  Layers,
  Tag,
  Check,
  AlertCircle
} from 'lucide-react';
import { FormField } from '../../../components/common/FormField';

export default function SLAPoliciesTab() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // Glass Dialog Modals State
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'error' });

  const showAlert = (title, message, type = 'error') => {
    setAlertConfig({ isOpen: true, title, message, type });
  };

  const clearFieldError = (fieldName) => {
    if (fieldErrors[fieldName]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    }
  };

  const defaultStages = [
    { PriorityCode: 'CRITICAL', TargetResponseMinutes: 15, TargetResolutionMinutes: 120 },
    { PriorityCode: 'HIGH', TargetResponseMinutes: 30, TargetResolutionMinutes: 240 },
    { PriorityCode: 'MEDIUM', TargetResponseMinutes: 60, TargetResolutionMinutes: 480 },
    { PriorityCode: 'LOW', TargetResponseMinutes: 120, TargetResolutionMinutes: 1440 }
  ];

  const [policyForm, setPolicyForm] = useState({
    PolicyName: '',
    Description: '',
    stages: defaultStages
  });

  useEffect(() => {
    fetchPolicies();
  }, []);

  useEffect(() => {
    if (!showModal) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setShowModal(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal]);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const res = await slaApi.getPolicies({});
      const raw = res.data?.data?.policies || res.data?.data || [];
      setPolicies(Array.isArray(raw) ? raw : []);
    } catch (err) {
      console.error('Failed to fetch SLA policies', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePolicy = async (e) => {
    e.preventDefault();

    const validation = slaSchemas.policyForm(policyForm, policyForm.stages);
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      return;
    }

    setFieldErrors({});

    try {
      setSubmitting(true);
      await slaApi.createPolicy({
        ...policyForm,
        PolicyName: validation.sanitized.PolicyName,
        Description: validation.sanitized.Description,
        stages: validation.sanitized.stages
      });
      setShowModal(false);
      setPolicyForm({
        PolicyName: '',
        Description: '',
        stages: defaultStages
      });
      fetchPolicies();
      showAlert('SLA Policy Created', `Policy "${validation.sanitized.PolicyName}" established successfully.`, 'success');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create SLA Policy';
      showAlert('Operation Error', msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStageChange = (idx, field, val) => {
    const updated = [...policyForm.stages];
    updated[idx][field] = val === '' ? '' : Number(val);
    setPolicyForm({ ...policyForm, stages: updated });
    clearFieldError(`stage_${idx}_${field}`);
    clearFieldError('stages');
  };

  const handleAddStage = () => {
    const priorityOptions = ['CRITICAL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW'];
    const usedCodes = policyForm.stages.map(s => s.PriorityCode.toUpperCase());
    const nextCode = priorityOptions.find(code => !usedCodes.includes(code)) || 'CUSTOM';

    setPolicyForm({
      ...policyForm,
      stages: [
        ...policyForm.stages,
        { PriorityCode: nextCode, TargetResponseMinutes: 60, TargetResolutionMinutes: 480 }
      ]
    });
    clearFieldError('stages');
  };

  const handleRemoveStage = (idx) => {
    if (policyForm.stages.length <= 1) {
      showAlert('Configuration Notice', 'At least one priority level is required for an SLA policy.', 'warning');
      return;
    }
    const updated = policyForm.stages.filter((_, i) => i !== idx);
    setPolicyForm({ ...policyForm, stages: updated });
    setFieldErrors({});
  };

  const applyPreset = (presetType) => {
    setFieldErrors({});
    switch (presetType) {
      case 'MISSION_CRITICAL':
        setPolicyForm({
          PolicyName: 'Mission Critical 24/7 SLA',
          Description: 'Ultra-fast response and resolution targets for high-availability IT & facility operations',
          stages: [
            { PriorityCode: 'CRITICAL', TargetResponseMinutes: 15, TargetResolutionMinutes: 60 },
            { PriorityCode: 'HIGH', TargetResponseMinutes: 30, TargetResolutionMinutes: 120 },
            { PriorityCode: 'MEDIUM', TargetResponseMinutes: 60, TargetResolutionMinutes: 240 },
            { PriorityCode: 'LOW', TargetResponseMinutes: 120, TargetResolutionMinutes: 480 }
          ]
        });
        break;
      case 'CORPORATE_STANDARD':
        setPolicyForm({
          PolicyName: 'Standard Corporate SLA',
          Description: 'Balanced operational benchmarks for everyday tenant and business park service requests',
          stages: [
            { PriorityCode: 'CRITICAL', TargetResponseMinutes: 30, TargetResolutionMinutes: 120 },
            { PriorityCode: 'HIGH', TargetResponseMinutes: 60, TargetResolutionMinutes: 240 },
            { PriorityCode: 'MEDIUM', TargetResponseMinutes: 120, TargetResolutionMinutes: 480 },
            { PriorityCode: 'LOW', TargetResponseMinutes: 240, TargetResolutionMinutes: 1440 }
          ]
        });
        break;
      case 'EXTENDED_CARE':
        setPolicyForm({
          PolicyName: 'Extended Non-Urgent SLA',
          Description: 'Relaxed deadlines for non-critical maintenance, enhancements, and general tasks',
          stages: [
            { PriorityCode: 'CRITICAL', TargetResponseMinutes: 60, TargetResolutionMinutes: 240 },
            { PriorityCode: 'HIGH', TargetResponseMinutes: 120, TargetResolutionMinutes: 480 },
            { PriorityCode: 'MEDIUM', TargetResponseMinutes: 240, TargetResolutionMinutes: 1440 },
            { PriorityCode: 'LOW', TargetResponseMinutes: 480, TargetResolutionMinutes: 2880 }
          ]
        });
        break;
      default:
        break;
    }
  };

  const formatDuration = (mins) => {
    const m = Number(mins) || 0;
    if (m <= 0) return '0 min';
    if (m < 60) return `${m} mins`;
    const hours = m / 60;
    if (hours < 24) {
      return Number.isInteger(hours) ? `${hours} hrs` : `${hours.toFixed(1)} hrs`;
    }
    const days = hours / 24;
    return Number.isInteger(days) ? `${days} day${days > 1 ? 's' : ''}` : `${days.toFixed(1)} days`;
  };

  const getPriorityStyle = (code) => {
    const c = (code || '').toUpperCase();
    switch (c) {
      case 'CRITICAL':
        return { bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: 'rgba(239, 68, 68, 0.3)', icon: Zap };
      case 'URGENT':
        return { bg: 'rgba(249, 115, 22, 0.15)', color: '#fb923c', border: 'rgba(249, 115, 22, 0.3)', icon: AlertTriangle };
      case 'HIGH':
        return { bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)', icon: Flame };
      case 'MEDIUM':
        return { bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)', icon: Clock };
      default:
        return { bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: 'rgba(16, 185, 129, 0.3)', icon: CheckCircle2 };
    }
  };

  return (
    <div style={{
      background: 'var(--glass-bg)',
      border: '1px solid var(--glass-border)',
      borderRadius: '20px',
      padding: '24px',
      backdropFilter: 'blur(16px)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)'
    }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '900', margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck color="var(--accent-primary)" size={24} /> SLA Policy & Target Manager
          </h3>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Configure priority-based response and resolution target deadlines for service categories
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: '10px 18px',
            borderRadius: 'var(--border-radius-sm)',
            background: 'var(--accent-gradient)',
            color: '#ffffff',
            border: 'none',
            fontWeight: '700',
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: 'var(--glow-accent)'
          }}
        >
          <Plus size={18} /> New SLA Policy
        </button>
      </div>

      {/* SLA Policies Cards Grid */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw className="spin" size={32} style={{ marginBottom: '16px' }} />
          <p>Loading configured SLA policies...</p>
        </div>
      ) : policies.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-tertiary)', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
          <ShieldCheck size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <p style={{ margin: 0, fontWeight: 600 }}>No SLA policies configured yet.</p>
          <p style={{ fontSize: '0.82rem', marginTop: '4px' }}>Click "New SLA Policy" to define priority target benchmarks.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {policies.map((p) => (
            <div
              key={p.SLAPolicyID}
              style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--glass-border)',
                borderRadius: '18px',
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--text-primary)' }}>{p.PolicyName}</div>
                  <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={12} /> Active Policy
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.4' }}>
                  {p.Description || 'Standard operational SLA policy'}
                </div>
              </div>

              <div style={{
                background: 'var(--bg-secondary)',
                padding: '14px 16px',
                borderRadius: '14px',
                border: '1px solid var(--glass-border)',
                display: 'flex',
                alignItems: 'center',
                justify: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sliders size={16} color="var(--accent-primary)" />
                  <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Configured Tiers</span>
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--accent-primary)' }}>
                  {p.StageCount || 4} Target Levels
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Professional Responsive SLA Policy Creation Modal */}
      {showModal && (
        <div 
          onClick={() => {
            setShowModal(false);
            setFieldErrors({});
          }}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'var(--modal-backdrop, rgba(16, 20, 24, 0.78))', backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: '20px'
          }}
        >
          <div 
            role="dialog"
            aria-modal="true"
            aria-labelledby="sla-modal-title"
            className="modal-card accent-strip-brand enterprise-card"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--glass-border-accent)',
              borderRadius: 'var(--border-radius-lg, 18px)',
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: 'var(--modal-shadow, 0 20px 60px rgba(0, 0, 0, 0.5))',
              animation: 'fadeIn 0.25s ease-out',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--glass-border)',
              background: 'var(--bg-tertiary)',
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'var(--accent-gradient)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--glow-accent)',
                  flexShrink: 0
                }}>
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 id="sla-modal-title" style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Create Enterprise SLA Policy
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Set response & resolution deadline benchmarks across priority levels
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowModal(false);
                  setFieldErrors({});
                }}
                className="btn-icon touch-target-sm"
                aria-label="Close dialog"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreatePolicy} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
              <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Presets Bar */}
                <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '14px 16px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={14} color="var(--accent-primary)" /> Quick Policy Presets
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => applyPreset('MISSION_CRITICAL')}
                      style={{
                        padding: '6px 12px', borderRadius: 'var(--border-radius-sm)',
                        background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#f87171', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '6px'
                      }}
                    >
                      <Zap size={13} /> Mission Critical (24/7)
                    </button>

                    <button
                      type="button"
                      onClick={() => applyPreset('CORPORATE_STANDARD')}
                      style={{
                        padding: '6px 12px', borderRadius: 'var(--border-radius-sm)',
                        background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)',
                        color: '#818cf8', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '6px'
                      }}
                    >
                      <ShieldCheck size={13} /> Corporate Standard
                    </button>

                    <button
                      type="button"
                      onClick={() => applyPreset('EXTENDED_CARE')}
                      style={{
                        padding: '6px 12px', borderRadius: 'var(--border-radius-sm)',
                        background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)',
                        color: '#34d399', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '6px'
                      }}
                    >
                      <Clock size={13} /> Extended Non-Urgent
                    </button>
                  </div>
                </div>

                {/* Main Fields */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                  <FormField
                    label="Policy Name"
                    required
                    error={fieldErrors.PolicyName}
                    icon={Tag}
                  >
                    <input
                      type="text"
                      placeholder="e.g. Platinum Tier Support SLA"
                      value={policyForm.PolicyName}
                      onChange={(e) => {
                        setPolicyForm({ ...policyForm, PolicyName: e.target.value });
                        clearFieldError('PolicyName');
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 'var(--border-radius-sm)',
                        background: 'var(--bg-tertiary)',
                        border: `1px solid ${fieldErrors.PolicyName ? 'rgba(239, 68, 68, 0.5)' : 'var(--glass-border)'}`,
                        color: 'var(--text-primary)',
                        fontSize: '0.88rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </FormField>

                  <FormField
                    label="Policy Scope Description (Optional)"
                    error={fieldErrors.Description}
                    icon={FileText}
                  >
                    <input
                      type="text"
                      placeholder="Brief operational context..."
                      value={policyForm.Description}
                      onChange={(e) => {
                        setPolicyForm({ ...policyForm, Description: e.target.value });
                        clearFieldError('Description');
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 'var(--border-radius-sm)',
                        background: 'var(--bg-tertiary)',
                        border: `1px solid ${fieldErrors.Description ? 'rgba(239, 68, 68, 0.5)' : 'var(--glass-border)'}`,
                        color: 'var(--text-primary)',
                        fontSize: '0.88rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </FormField>
                </div>

                {/* Priority Targets Section */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={16} color="var(--accent-primary)" /> Priority Target Deadlines (Minutes)
                    </label>

                    <button
                      type="button"
                      onClick={handleAddStage}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '4px 10px', borderRadius: 'var(--border-radius-sm)',
                        background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                        color: 'var(--accent-primary)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer'
                      }}
                    >
                      <Plus size={13} /> Add Priority Tier
                    </button>
                  </div>

                  {fieldErrors.stages && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-danger, #ef4444)', fontSize: '0.8rem', marginBottom: '10px' }}>
                      <AlertCircle size={14} /> {fieldErrors.stages}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {policyForm.stages.map((st, idx) => {
                      const pStyle = getPriorityStyle(st.PriorityCode);
                      const PriorityIcon = pStyle.icon;
                      const priorityErr = fieldErrors[`stage_${idx}_PriorityCode`];
                      const respErr = fieldErrors[`stage_${idx}_TargetResponseMinutes`];
                      const resolErr = fieldErrors[`stage_${idx}_TargetResolutionMinutes`];

                      return (
                        <div
                          key={idx}
                          style={{
                            background: 'var(--bg-tertiary)',
                            border: `1px solid ${priorityErr || respErr || resolErr ? 'rgba(239, 68, 68, 0.4)' : pStyle.border}`,
                            borderRadius: '16px',
                            padding: '14px 16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                  padding: '4px 10px', borderRadius: '8px',
                                  background: pStyle.bg, color: pStyle.color, border: `1px solid ${pStyle.border}`,
                                  display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '0.8rem'
                                }}>
                                  <PriorityIcon size={14} />
                                  <input
                                    type="text"
                                    value={st.PriorityCode}
                                    onChange={(e) => {
                                      const updated = [...policyForm.stages];
                                      updated[idx].PriorityCode = e.target.value.toUpperCase();
                                      setPolicyForm({ ...policyForm, stages: updated });
                                      clearFieldError(`stage_${idx}_PriorityCode`);
                                    }}
                                    style={{
                                      background: 'transparent', border: 'none', color: pStyle.color,
                                      fontWeight: 800, fontSize: '0.8rem', width: '90px', outline: 'none', textTransform: 'uppercase'
                                    }}
                                  />
                                </div>
                              </div>
                              {priorityErr && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-danger, #ef4444)', fontSize: '0.74rem', marginTop: '2px' }}>
                                  <AlertCircle size={12} /> {priorityErr}
                                </div>
                              )}
                            </div>

                            <ActionButton
                              variant="delete"
                              size="sm"
                              onClick={() => handleRemoveStage(idx)}
                              title="Remove Priority Tier"
                            />
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Response Target</span>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                                  {formatDuration(st.TargetResponseMinutes)}
                                </span>
                              </div>
                              <input
                                type="number"
                                min="1"
                                value={st.TargetResponseMinutes}
                                onChange={(e) => handleStageChange(idx, 'TargetResponseMinutes', e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '8px 12px',
                                  borderRadius: 'var(--border-radius-sm)',
                                  background: 'var(--bg-secondary)',
                                  border: `1px solid ${respErr ? 'rgba(239, 68, 68, 0.5)' : 'var(--glass-border)'}`,
                                  color: 'var(--text-primary)',
                                  fontSize: '0.85rem',
                                  fontWeight: 600,
                                  outline: 'none',
                                  boxSizing: 'border-box'
                                }}
                              />
                              {respErr && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-danger, #ef4444)', fontSize: '0.74rem', marginTop: '4px' }}>
                                  <AlertCircle size={12} /> {respErr}
                                </div>
                              )}
                            </div>

                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Resolution Target</span>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: pStyle.color }}>
                                  {formatDuration(st.TargetResolutionMinutes)}
                                </span>
                              </div>
                              <input
                                type="number"
                                min="1"
                                value={st.TargetResolutionMinutes}
                                onChange={(e) => handleStageChange(idx, 'TargetResolutionMinutes', e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '8px 12px',
                                  borderRadius: 'var(--border-radius-sm)',
                                  background: 'var(--bg-secondary)',
                                  border: `1px solid ${resolErr ? 'rgba(239, 68, 68, 0.5)' : 'var(--glass-border)'}`,
                                  color: 'var(--text-primary)',
                                  fontSize: '0.85rem',
                                  fontWeight: 600,
                                  outline: 'none',
                                  boxSizing: 'border-box'
                                }}
                              />
                              {resolErr && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-danger, #ef4444)', fontSize: '0.74rem', marginTop: '4px' }}>
                                  <AlertCircle size={12} /> {resolErr}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{
                padding: '16px 24px',
                borderTop: '1px solid var(--glass-border)',
                background: 'var(--bg-tertiary)',
                display: 'flex',
                justify: 'flex-end',
                gap: '12px',
                flexShrink: 0
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setFieldErrors({});
                  }}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 'var(--border-radius-sm)',
                    border: '1px solid var(--glass-border)',
                    background: 'transparent',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '10px 22px',
                    borderRadius: 'var(--border-radius-sm)',
                    border: 'none',
                    background: 'var(--accent-gradient)',
                    color: '#ffffff',
                    fontWeight: '700',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: 'var(--glow-accent)'
                  }}
                >
                  {submitting && <RefreshCw size={14} className="spin" />}
                  {submitting ? 'Creating Policy...' : 'Save & Publish SLA Policy'}
                </button>
              </div>
            </form>
          </div>
        </div>
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
