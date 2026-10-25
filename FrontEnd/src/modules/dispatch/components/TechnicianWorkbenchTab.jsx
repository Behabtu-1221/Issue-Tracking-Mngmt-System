import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../../i18n';
import dispatchApi from '../api/dispatchApi';
import {
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  MessageSquare,
  Wrench,
  ShieldCheck,
  AlertCircle,
  FileText,
  X,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import AlertDialogModal from '../../../components/common/AlertDialogModal';
import { FormField } from '../../../components/common/FormField';
import { dispatchSchemas } from '../../../validation';

export default function TechnicianWorkbenchTab() {
  const { t } = useTranslation();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Glass Alert Modal State
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'error' });

  // Workbench Action Modal State (Decline, Pause, Complete)
  const [activeModal, setActiveModal] = useState({
    isOpen: false,
    assignment: null,
    actionType: null // 'reject' | 'pause' | 'complete'
  });

  const [modalData, setModalData] = useState({
    rejectionReason: '',
    pauseReason: '',
    workNotes: '',
    ResolutionTypeCode: 'PERMANENT_FIX',
    ActionStepsTaken: '',
    VerificationNotes: ''
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [submittingAction, setSubmittingAction] = useState(false);

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

  const openActionModal = (assignment, actionType) => {
    setActiveModal({
      isOpen: true,
      assignment,
      actionType
    });
    setModalData({
      rejectionReason: '',
      pauseReason: '',
      workNotes: '',
      ResolutionTypeCode: 'PERMANENT_FIX',
      ActionStepsTaken: '',
      VerificationNotes: ''
    });
    setFieldErrors({});
  };

  const closeActionModal = () => {
    setActiveModal({ isOpen: false, assignment: null, actionType: null });
    setFieldErrors({});
    setSubmittingAction(false);
  };

  useEffect(() => {
    fetchMyWorkbench();
  }, []);

  const fetchMyWorkbench = async () => {
    try {
      setLoading(true);
      const res = await dispatchApi.getMyWorkbench(1); // User 1 as default technician
      setAssignments(res.data?.data?.assignments || []);
    } catch (err) {
      console.error('Failed to fetch technician workbench', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSimpleAction = async (id, actionType) => {
    try {
      if (actionType === 'accept') {
        await dispatchApi.acceptAssignment(id);
        showAlert(t('dispatch.jobAccepted'), t('dispatch.jobAcceptedMsg'), 'success');
      } else if (actionType === 'start') {
        await dispatchApi.startWork(id);
        showAlert(t('dispatch.workStarted'), t('dispatch.workStartedMsg'), 'success');
      }
      fetchMyWorkbench();
    } catch (err) {
      showAlert(t('dispatch.workbenchActionFailed'), err.response?.data?.message || `Failed to ${actionType} assignment`, 'error');
    }
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    const { assignment, actionType } = activeModal;
    if (!assignment || !actionType) return;

    let validation;
    if (actionType === 'reject') {
      validation = dispatchSchemas.declineAssignmentForm({
        rejectionReason: modalData.rejectionReason
      });
    } else if (actionType === 'pause') {
      validation = dispatchSchemas.pauseWorkForm({
        pauseReason: modalData.pauseReason
      });
    } else if (actionType === 'complete') {
      validation = dispatchSchemas.completeWorkForm({
        workNotes: modalData.workNotes,
        ResolutionTypeCode: modalData.ResolutionTypeCode,
        ActionStepsTaken: modalData.ActionStepsTaken,
        VerificationNotes: modalData.VerificationNotes
      });
    }

    if (validation && !validation.isValid) {
      setFieldErrors(validation.errors);
      return;
    }

    try {
      setSubmittingAction(true);
      setFieldErrors({});

      if (actionType === 'reject') {
        await dispatchApi.rejectAssignment(assignment.AssignmentID, validation.sanitized);
        showAlert(t('dispatch.assignmentDeclined'), `${t('dispatch.assignmentDeclinedMsg')} #${assignment.RequestNumber}`, 'info');
      } else if (actionType === 'pause') {
        await dispatchApi.pauseWork(assignment.AssignmentID, validation.sanitized);
        showAlert(t('dispatch.workPaused'), `${t('dispatch.workPausedMsg')} #${assignment.RequestNumber}`, 'warning');
      } else if (actionType === 'complete') {
        await dispatchApi.completeWork(assignment.AssignmentID, validation.sanitized);
        showAlert(t('dispatch.jobCompleted'), `${t('dispatch.jobCompletedMsg')} #${assignment.RequestNumber}`, 'success');
      }

      closeActionModal();
      fetchMyWorkbench();
    } catch (err) {
      showAlert(t('dispatch.operationFailed'), err.response?.data?.message || `Failed to submit ${actionType} action.`, 'error');
    } finally {
      setSubmittingAction(false);
    }
  };

  const getActionHeaderInfo = (actionType) => {
    switch (actionType) {
      case 'reject':
        return {
          icon: XCircle,
          stripClass: 'accent-strip-danger',
          gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          title: t('dispatch.declineServiceAssignment'),
          subtitle: 'Decline service assignment and return to dispatch queue'
        };
      case 'pause':
        return {
          icon: Pause,
          stripClass: 'accent-strip-warning',
          gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          title: t('dispatch.pauseFieldWork'),
          subtitle: 'Temporarily suspend operational progress on this work order'
        };
      case 'progress':
        return {
          icon: TrendingUp,
          stripClass: 'accent-strip-brand',
          gradient: 'var(--accent-gradient)',
          title: 'Broadcast Field Work Progress Update',
          subtitle: 'Broadcast real-time execution milestones to requesters & approvers'
        };
      case 'complete':
      default:
        return {
          icon: CheckCircle2,
          stripClass: 'accent-strip-success',
          gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          title: t('dispatch.completeWorkLogResolution'),
          subtitle: 'Log final resolution details and mark work order as resolved'
        };
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'IN_PROGRESS':
        return <span className="badge badge-primary"><Zap size={13} /> {t('dispatch.statusInProgress')}</span>;
      case 'PAUSED':
        return <span className="badge badge-warning"><Pause size={13} /> {t('dispatch.statusPaused')}</span>;
      case 'ACCEPTED':
        return <span className="badge badge-info"><CheckCircle2 size={13} /> {t('dispatch.statusAccepted')}</span>;
      case 'COMPLETED':
        return <span className="badge badge-success"><CheckCircle2 size={13} /> {t('dispatch.statusCompleted')}</span>;
      case 'REJECTED':
        return <span className="badge badge-danger"><XCircle size={13} /> {t('dispatch.statusDeclined')}</span>;
      default:
        return <span className="badge badge-info"><Clock size={13} /> {t('dispatch.statusAssignedToYou')}</span>;
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
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: '900', margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Wrench color="var(--accent-primary)" size={22} /> {t('dispatch.workbenchTitle')}
        </h3>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
          {t('dispatch.workbenchDesc')}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>{t('dispatch.loadingFieldAssignments')}</div>
      ) : assignments.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Wrench size={42} style={{ opacity: 0.4, marginBottom: '12px', color: 'var(--accent-primary)' }} />
          <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)' }}>{t('dispatch.noFieldAssignments')}</div>
          <div style={{ fontSize: '0.82rem' }}>{t('dispatch.noFieldAssignmentsDesc')}</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          {assignments.map((a) => {
            const isAssigned = a.AssignmentStatusCode === 'ASSIGNED';
            const isAccepted = a.AssignmentStatusCode === 'ACCEPTED';
            const isInProgress = a.AssignmentStatusCode === 'IN_PROGRESS';
            const isPaused = a.AssignmentStatusCode === 'PAUSED';
            const isCompleted = a.AssignmentStatusCode === 'COMPLETED';

            return (
              <div
                key={a.AssignmentID}
                style={{
                  background: 'var(--bg-tertiary)',
                  border: isInProgress ? '2px solid var(--accent-primary)' : '1px solid var(--glass-border)',
                  borderRadius: '18px',
                  padding: '22px',
                  boxShadow: isInProgress ? 'var(--glow-accent)' : 'none',
                  transition: 'all 0.3s'
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--accent-primary)', background: 'rgba(99, 102, 241, 0.15)', padding: '3px 8px', borderRadius: '6px' }}>
                    {a.RequestNumber}
                  </span>
                  {getStatusBadge(a.AssignmentStatusCode)}
                </div>

                {/* Title */}
                <div style={{ fontWeight: '800', fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
                  {a.RequestTitle}
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  {t('dispatch.serviceLabel')}: <strong>{a.ServiceName}</strong> • {t('common.priority')}: <strong style={{ color: a.PriorityCode === 'CRITICAL' ? '#ef4444' : '#f59e0b' }}>{a.PriorityCode}</strong>
                </div>

                {/* State Transition Actions */}
                {!isCompleted && (
                  <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '14px', border: '1px solid var(--glass-border)' }}>
                    {isAssigned && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <button
                          onClick={() => handleSimpleAction(a.AssignmentID, 'accept')}
                          className="btn btn-primary"
                          style={{ padding: '10px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                        >
                          <CheckCircle2 size={16} /> {t('dispatch.acceptJob')}
                        </button>
                        <button
                          onClick={() => openActionModal(a, 'reject')}
                          className="btn btn-danger"
                          style={{ padding: '10px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                        >
                          <XCircle size={16} /> {t('dispatch.declineJob')}
                        </button>
                      </div>
                    )}

                    {(isAccepted || isPaused) && (
                      <button
                        onClick={() => handleSimpleAction(a.AssignmentID, 'start')}
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                      >
                        <Play size={18} /> {t('dispatch.startWorkExecution')}
                      </button>
                    )}

                    {isInProgress && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <button
                          onClick={() => openActionModal(a, 'pause')}
                          style={{
                            padding: '11px', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.4)',
                            background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontWeight: '800',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                            transition: 'all 0.2s'
                          }}
                        >
                          <Pause size={16} /> {t('dispatch.pauseWork')}
                        </button>
                        <button
                          onClick={() => openActionModal(a, 'complete')}
                          className="btn btn-success"
                          style={{
                            padding: '11px', fontWeight: '800', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', gap: '6px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            border: 'none', color: '#ffffff', borderRadius: '10px', cursor: 'pointer'
                          }}
                        >
                          <CheckCircle2 size={16} /> {t('dispatch.completeJob')}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {isCompleted && (
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '12px 16px', borderRadius: '12px', fontSize: '0.82rem', color: '#10b981', fontWeight: '700' }}>
                    {t('dispatch.jobCompletedResolved')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Validated Action Modal (Decline, Pause, Complete) */}
      {activeModal.isOpen && activeModal.assignment && (() => {
        const headerInfo = getActionHeaderInfo(activeModal.actionType);
        const ActionIcon = headerInfo.icon;

        return (
          <div 
            onClick={closeActionModal}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'var(--modal-backdrop, rgba(16, 20, 24, 0.78))', backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px'
            }}
          >
            <div 
              role="dialog"
              aria-modal="true"
              aria-labelledby="workbench-action-title"
              className={`modal-card ${headerInfo.stripClass} enterprise-card`}
              style={{
                background: 'var(--bg-secondary)', border: '1px solid var(--glass-border-accent)',
                borderRadius: 'var(--border-radius-lg, 18px)', width: '100%', maxWidth: '580px', maxHeight: '90vh',
                boxShadow: 'var(--modal-shadow, 0 25px 70px rgba(0, 0, 0, 0.5))', display: 'flex', flexDirection: 'column',
                overflow: 'hidden', position: 'relative'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--glass-border)',
                background: 'var(--bg-tertiary)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexShrink: 0
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: headerInfo.gradient,
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    flexShrink: 0
                  }}>
                    <ActionIcon size={20} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {t('dispatch.workbenchExecution')} • {activeModal.assignment.RequestNumber}
                      </span>
                    </div>
                    <h3 id="workbench-action-title" style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {headerInfo.title}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={closeActionModal}
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

              {/* Modal Form Body */}
              <form onSubmit={handleModalSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1, margin: 0 }}>
                <div style={{
                  padding: 'clamp(16px, 3vw, 24px)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '18px',
                  overflowY: 'auto',
                  flex: 1
                }}>
                  {/* Context Summary */}
              <div style={{ padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{t('dispatch.targetRequest')} </span>
                <strong style={{ color: 'var(--text-primary)' }}>{activeModal.assignment.RequestTitle}</strong>
              </div>

              {/* Decline Form */}
              {activeModal.actionType === 'reject' && (
                <FormField
                  label={t('dispatch.reasonForDeclining')}
                  required
                  error={fieldErrors.rejectionReason}
                  icon={XCircle}
                  helpText={t('dispatch.reasonForDecliningHelp')}
                >
                  <textarea
                    rows={4}
                    value={modalData.rejectionReason}
                    onChange={(e) => {
                      setModalData(prev => ({ ...prev, rejectionReason: e.target.value }));
                      clearFieldError('rejectionReason');
                    }}
                    placeholder={t('dispatch.reasonForDecliningPlaceholder')}
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: '12px',
                      background: 'var(--bg-tertiary)',
                      border: `1px solid ${fieldErrors.rejectionReason ? 'rgba(239, 68, 68, 0.5)' : 'var(--glass-border)'}`,
                      color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box',
                      resize: 'vertical'
                    }}
                  />
                </FormField>
              )}

              {/* Pause Form */}
              {activeModal.actionType === 'pause' && (
                <FormField
                  label={t('dispatch.reasonForPausing')}
                  required
                  error={fieldErrors.pauseReason}
                  icon={Pause}
                  helpText={t('dispatch.reasonForPausingHelp')}
                >
                  <textarea
                    rows={4}
                    value={modalData.pauseReason}
                    onChange={(e) => {
                      setModalData(prev => ({ ...prev, pauseReason: e.target.value }));
                      clearFieldError('pauseReason');
                    }}
                    placeholder={t('dispatch.reasonForPausingPlaceholder')}
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: '12px',
                      background: 'var(--bg-tertiary)',
                      border: `1px solid ${fieldErrors.pauseReason ? 'rgba(239, 68, 68, 0.5)' : 'var(--glass-border)'}`,
                      color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box',
                      resize: 'vertical'
                    }}
                  />
                </FormField>
              )}

              {/* Complete Form */}
              {activeModal.actionType === 'complete' && (
                <>
                  <FormField
                    label={t('dispatch.resolutionType')}
                    required
                    error={fieldErrors.ResolutionTypeCode}
                    icon={CheckCircle2}
                  >
                    <select
                      value={modalData.ResolutionTypeCode}
                      onChange={(e) => {
                        setModalData(prev => ({ ...prev, ResolutionTypeCode: e.target.value }));
                        clearFieldError('ResolutionTypeCode');
                      }}
                      style={{
                        width: '100%', padding: '12px 14px', borderRadius: '12px',
                        background: 'var(--bg-tertiary)',
                        border: `1px solid ${fieldErrors.ResolutionTypeCode ? 'rgba(239, 68, 68, 0.5)' : 'var(--glass-border)'}`,
                        color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box'
                      }}
                    >
                      <option value="PERMANENT_FIX">{t('dispatch.permanentFix')}</option>
                      <option value="WORKAROUND">{t('dispatch.workaround')}</option>
                      <option value="REPLACEMENT">{t('dispatch.replacement')}</option>
                    </select>
                  </FormField>

                  <FormField
                    label={t('dispatch.workNotesLabel')}
                    required
                    error={fieldErrors.workNotes}
                    icon={FileText}
                    helpText={t('dispatch.workNotesHelp')}
                  >
                    <textarea
                      rows={4}
                      value={modalData.workNotes}
                      onChange={(e) => {
                        setModalData(prev => ({ ...prev, workNotes: e.target.value }));
                        clearFieldError('workNotes');
                      }}
                      placeholder={t('dispatch.workNotesPlaceholder')}
                      style={{
                        width: '100%', padding: '12px 14px', borderRadius: '12px',
                        background: 'var(--bg-tertiary)',
                        border: `1px solid ${fieldErrors.workNotes ? 'rgba(239, 68, 68, 0.5)' : 'var(--glass-border)'}`,
                        color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box',
                        resize: 'vertical'
                      }}
                    />
                  </FormField>

                  <FormField
                    label={t('dispatch.actionStepsTakenLabel')}
                    error={fieldErrors.ActionStepsTaken}
                    icon={Wrench}
                  >
                    <textarea
                      rows={2}
                      value={modalData.ActionStepsTaken}
                      onChange={(e) => {
                        setModalData(prev => ({ ...prev, ActionStepsTaken: e.target.value }));
                        clearFieldError('ActionStepsTaken');
                      }}
                      placeholder={t('dispatch.actionStepsTakenPlaceholder')}
                      style={{
                        width: '100%', padding: '12px 14px', borderRadius: '12px',
                        background: 'var(--bg-tertiary)',
                        border: `1px solid ${fieldErrors.ActionStepsTaken ? 'rgba(239, 68, 68, 0.5)' : 'var(--glass-border)'}`,
                        color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box',
                        resize: 'vertical'
                      }}
                    />
                  </FormField>
                </>
              )}
                </div>

                {/* Action Buttons Footer */}
                <div style={{
                  padding: '14px 20px',
                  borderTop: '1px solid var(--glass-border)',
                  background: 'var(--bg-tertiary)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  flexShrink: 0
                }}>
                  <button
                    type="button"
                    onClick={closeActionModal}
                    className="btn btn-secondary touch-target-sm"
                    style={{ padding: '9px 18px', borderRadius: 'var(--border-radius-sm)' }}
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={submittingAction}
                    className="touch-target-sm"
                    style={{
                      padding: '9px 22px', borderRadius: 'var(--border-radius-sm)', border: 'none',
                      fontWeight: 700, fontSize: '0.88rem', cursor: submittingAction ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff',
                      background: activeModal.actionType === 'reject'
                        ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                        : activeModal.actionType === 'pause'
                          ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                          : activeModal.actionType === 'progress'
                            ? 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)'
                            : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      boxShadow: 'var(--glow-accent)',
                      transition: 'all 0.2s'
                    }}
                  >
                    {submittingAction ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    {submittingAction ? t('dispatch.processing') : (
                      activeModal.actionType === 'reject' ? t('dispatch.confirmDecline') :
                      activeModal.actionType === 'pause' ? t('dispatch.confirmPause') :
                      activeModal.actionType === 'progress' ? 'Broadcast Progress Update' :
                      t('dispatch.completeAndResolve')
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Glass Alert Modal */}
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
