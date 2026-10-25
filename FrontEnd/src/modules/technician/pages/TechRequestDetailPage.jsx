import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Clock, AlertTriangle, CheckCircle2, XCircle, Play, Pause,
  Wrench, Send, Paperclip, Upload, FileText, User, Building, Layers,
  AlertCircle, ShieldAlert, Check, RefreshCw, MessageSquare, Info, ChevronRight, HelpCircle
} from 'lucide-react';
import { usePermissionContext } from '../../role-permission-management/contexts/PermissionContext';
import technicianApi from '../api/technicianApi';
import fileDocumentApi from '../../file-document/api/fileDocumentApi';
import DocumentMediaReader from '../../file-document/components/DocumentMediaReader';
import ConversationPanel from '../../communication/components/ConversationPanel';
import InternalNotesPanel from '../../communication/components/InternalNotesPanel';
import { FormField } from '../../../components/common/FormField';
import { slaSchemas } from '../../../validation';
import { useTranslation } from '../../../i18n';

export default function TechRequestDetailPage() {
  const { t, isRTL } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasPermission } = usePermissionContext();

  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState(null);
  const [issueDetail, setIssueDetail] = useState(null);
  const [historyItems, setHistoryItems] = useState([]);
  const [comments, setComments] = useState([]);
  const [documents, setDocuments] = useState([]);

  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [actionSubmitting, setActionSubmitting] = useState(false);

  // Form states
  const [activeTab, setActiveTab] = useState('timeline');

  // Comment input
  const [commentText, setCommentText] = useState('');
  const [isInternal, setIsInternal] = useState(false);

  // Request Info modal
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');
  const [infoError, setInfoError] = useState('');

  // Escalation modal
  const [showEscalationModal, setShowEscalationModal] = useState(false);
  const [escalationForm, setEscalationForm] = useState({ reason: '', details: '' });
  const [escalationErrors, setEscalationErrors] = useState({});

  // Resolution modal
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [resolutionForm, setResolutionForm] = useState({
    ResolutionTypeCode: 'PERMANENT_FIX',
    ResolutionSummary: '',
    ActionStepsTaken: '',
    VerificationNotes: ''
  });
  const [resolutionErrors, setResolutionErrors] = useState({});

  // Investigation form
  const [investigationForm, setInvestigationForm] = useState({
    RootCauseSummary: '',
    RootCauseDetails: '',
    CorrectiveActionsTaken: ''
  });
  const [investigationErrors, setInvestigationErrors] = useState({});

  const clearEscalationError = (f) => {
    if (escalationErrors[f]) setEscalationErrors(prev => { const n = { ...prev }; delete n[f]; return n; });
  };
  const clearInvestigationError = (f) => {
    if (investigationErrors[f]) setInvestigationErrors(prev => { const n = { ...prev }; delete n[f]; return n; });
  };
  const clearResolutionError = (f) => {
    if (resolutionErrors[f]) setResolutionErrors(prev => { const n = { ...prev }; delete n[f]; return n; });
  };

  // Document upload
  const [uploadFile, setUploadFile] = useState(null);

  const currentUserId = user?.UserID || user?.userId;

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      // Fetch assignment record
      const assignRes = await technicianApi.getAssignmentById(id);
      const assignData = assignRes.data?.data;
      setAssignment(assignData);
      setHistoryItems(assignData?.history || []);

      const issueId = assignData?.RequestID || assignData?.IssueRequestID;

      if (issueId) {
        // Fetch detailed issue request, comments, documents
        const [issueRes, commRes, docRes, invRes] = await Promise.allSettled([
          technicianApi.getIssueById(issueId),
          technicianApi.getComments(issueId),
          fileDocumentApi.getDocuments({ entityRefType: 'ISSUE_REQUEST', entityRefId: issueId }),
          technicianApi.getInvestigation(issueId)
        ]);

        if (issueRes.status === 'fulfilled') setIssueDetail(issueRes.value.data?.data);
        if (commRes.status === 'fulfilled') {
          const comList = commRes.value.data?.data;
          setComments(Array.isArray(comList) ? comList : []);
        }
        if (docRes.status === 'fulfilled') {
          const docList = docRes.value.data?.data?.documents || [];
          setDocuments(docList);
        }
        if (invRes.status === 'fulfilled') {
          const inv = invRes.value.data?.data;
          if (inv) {
            const singleInv = Array.isArray(inv) ? inv[0] : inv;
            if (singleInv) {
              setInvestigationForm({
                RootCauseSummary: singleInv.RootCauseSummary || '',
                RootCauseDetails: singleInv.RootCauseDetails || '',
                CorrectiveActionsTaken: singleInv.CorrectiveActionsTaken || ''
              });
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to load request workspace details:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to load assignment details.');
    } finally {
      setLoading(false);
    }
  };

  // Actions
  const handleAccept = async () => {
    try {
      setActionSubmitting(true);
      await technicianApi.acceptAssignment(id);
      setSuccessMsg('Assignment accepted successfully. Status changed to ACCEPTED.');
      loadData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to accept assignment');
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleStartWork = async () => {
    try {
      setActionSubmitting(true);
      await technicianApi.startWork(id);
      setSuccessMsg('Work started successfully! Status updated to IN_PROGRESS.');
      loadData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to start work');
    } finally {
      setActionSubmitting(false);
    }
  };

  const handlePauseWork = async () => {
    try {
      setActionSubmitting(true);
      await technicianApi.pauseWork(id, 'Work paused by technician for diagnostic hold');
      setSuccessMsg('Work paused. Status updated to PAUSED.');
      loadData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to pause work');
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const issueId = assignment?.RequestID;
    try {
      setActionSubmitting(true);
      await technicianApi.addComment({
        IssueRequestID: issueId,
        CommentText: commentText.trim(),
        IsInternal: isInternal ? 1 : 0
      });
      setCommentText('');
      setSuccessMsg('Comment posted successfully.');
      loadData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to post comment');
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleRequestInfo = async (e) => {
    e.preventDefault();
    const validation = slaSchemas.requestInfoForm({ infoMessage });
    if (!validation.isValid) {
      setInfoError(validation.errors.infoMessage);
      return;
    }
    setInfoError('');

    const issueId = assignment?.RequestID;
    try {
      setActionSubmitting(true);
      await technicianApi.requestInfo(issueId, validation.sanitized.infoMessage);
      setShowInfoModal(false);
      setInfoMessage('');
      setSuccessMsg('Information request dispatched to requester.');
      loadData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to request additional information');
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleEscalateSubmit = async (e) => {
    e.preventDefault();
    const validation = slaSchemas.escalateForm(escalationForm);
    if (!validation.isValid) {
      setEscalationErrors(validation.errors);
      return;
    }
    setEscalationErrors({});

    try {
      setActionSubmitting(true);
      await technicianApi.escalateWork(id, validation.sanitized);
      setShowEscalationModal(false);
      setEscalationForm({ reason: '', details: '' });
      setSuccessMsg('Request escalated to Management / Dispatcher queue.');
      loadData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to escalate request');
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleSaveInvestigation = async (e) => {
    e.preventDefault();
    const validation = slaSchemas.investigationForm(investigationForm);
    if (!validation.isValid) {
      setInvestigationErrors(validation.errors);
      return;
    }
    setInvestigationErrors({});

    const issueId = assignment?.RequestID;
    try {
      setActionSubmitting(true);
      await technicianApi.saveInvestigation({
        IssueRequestID: issueId,
        InvestigatorUserID: currentUserId,
        ...validation.sanitized
      });
      setSuccessMsg('Diagnostic investigation findings saved to work history.');
      loadData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to save investigation notes');
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    const validation = slaSchemas.resolutionForm(resolutionForm);
    if (!validation.isValid) {
      setResolutionErrors(validation.errors);
      return;
    }
    setResolutionErrors({});

    try {
      setActionSubmitting(true);
      await technicianApi.completeWork(id, validation.sanitized);
      setShowResolutionModal(false);
      setSuccessMsg('Request successfully resolved and work marked COMPLETED!');
      loadData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to resolve request');
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const issueId = assignment?.RequestID;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', `Technician Evidence - ${file.name}`);
    formData.append('entityRefType', 'ISSUE_REQUEST');
    formData.append('entityRefId', issueId);

    try {
      setActionSubmitting(true);
      await fileDocumentApi.uploadFile(formData);
      setSuccessMsg('Attachment evidence uploaded successfully.');
      loadData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to upload attachment');
    } finally {
      setActionSubmitting(false);
    }
  };

  const getPriorityBadge = (priorityStr) => {
    const p = (priorityStr || '').toUpperCase();
    switch (p) {
      case 'CRITICAL':
      case 'URGENT':
        return { label: p, bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: 'rgba(239, 68, 68, 0.3)' };
      case 'HIGH':
        return { label: 'High', bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' };
      default:
        return { label: 'Medium', bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' };
    }
  };

  const statusCode = (assignment?.AssignmentStatusCode || issueDetail?.StatusCode || '').toUpperCase();

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw className="animate-spin" size={28} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.7 }} />
        {t('technician.loadingWorkspace', 'Loading technician workspace...')}
      </div>
    );
  }

  const reqNum = assignment?.RequestNumber || issueDetail?.RequestNumber || `#${assignment?.RequestID}`;
  const reqTitle = assignment?.RequestTitle || issueDetail?.Title || 'Service Work Order';
  const pBadge = getPriorityBadge(assignment?.PriorityCode || issueDetail?.PriorityCode);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '32px' }}>
      {/* ── BACK BUTTON & MESSAGES ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={() => navigate('/technician/assigned')}
          style={{
            background: 'none', border: 'none', color: 'var(--text-muted)',
            fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
          }}
        >
          <ArrowLeft size={16} style={{ transform: isRTL ? 'rotate(180deg)' : 'none' }} /> {t('technician.backToWork', 'Back to Work Roster')}
        </button>

        {successMsg && (
          <div style={{ padding: '8px 16px', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#4ade80', fontSize: '0.82rem', fontWeight: 600 }}>
            <Check size={14} style={{ display: 'inline', marginRight: '6px' }} /> {successMsg}
          </div>
        )}
        {errorMsg && (
          <div style={{ padding: '8px 16px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '0.82rem', fontWeight: 600 }}>
            <AlertCircle size={14} style={{ display: 'inline', marginRight: '6px' }} /> {errorMsg}
          </div>
        )}
      </div>

      {/* ── REQUEST WORKSPACE HEADER CARD ── */}
      <div className="glass-panel p-4 sm:p-6 lg:p-7 rounded-2xl">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                {reqNum}
              </span>
              <span style={{ padding: '3px 10px', borderRadius: '6px', background: pBadge.bg, color: pBadge.color, border: `1px solid ${pBadge.border}`, fontSize: '0.75rem', fontWeight: 700 }}>
                {pBadge.label} Priority
              </span>
              <span style={{ padding: '3px 10px', borderRadius: '6px', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)', fontSize: '0.75rem', fontWeight: 700 }}>
                Status: {statusCode}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] mb-1.5">
              {reqTitle}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] m-0">
              Service: <strong>{assignment?.ServiceName || issueDetail?.ServiceName || 'General Maintenance'}</strong> •
              Department: <strong>{assignment?.DepartmentName || issueDetail?.AssignedDepartmentName || 'Technical Support'}</strong>
            </p>
          </div>

          {/* SLA Indicator */}
          <div className="w-full sm:w-auto p-3 sm:p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--glass-border)] text-left sm:text-right">
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
              Resolution SLA Target
            </div>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#facc15', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={16} /> {issueDetail?.TargetResolutionDateTime ? new Date(issueDetail.TargetResolutionDateTime).toLocaleString() : 'Standard 24h SLA'}
            </div>
          </div>
        </div>

        {/* ── TECHNICIAN ACTION TOOLBAR ── */}
        <div className="mt-5 pt-4 border-t border-[var(--glass-border)] flex flex-wrap items-center gap-2.5">
          {['ASSIGNED', 'NEW'].includes(statusCode) && (
            <button
              onClick={handleAccept} disabled={actionSubmitting}
              className="touch-target-sm w-full sm:w-auto"
              style={{
                padding: '9px 18px', borderRadius: '8px', background: 'var(--accent-gradient)', border: 'none',
                color: '#ffffff', fontWeight: 700, fontSize: '0.83rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
              }}
            >
              <Check size={16} /> Accept Assignment
            </button>
          )}

          {['ACCEPTED', 'ASSIGNED', 'PAUSED'].includes(statusCode) && (
            <button
              onClick={handleStartWork} disabled={actionSubmitting}
              className="touch-target-sm w-full sm:w-auto"
              style={{
                padding: '9px 18px', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.2)', border: '1px solid rgba(34, 197, 94, 0.4)',
                color: '#4ade80', fontWeight: 700, fontSize: '0.83rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
              }}
            >
              <Play size={16} /> Start Field Work
            </button>
          )}

          {statusCode === 'IN_PROGRESS' && (
            <button
              onClick={handlePauseWork} disabled={actionSubmitting}
              className="touch-target-sm w-full sm:w-auto"
              style={{
                padding: '9px 18px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.2)', border: '1px solid rgba(245, 158, 11, 0.4)',
                color: '#fbbf24', fontWeight: 700, fontSize: '0.83rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
              }}
            >
              <Pause size={16} /> Pause Work
            </button>
          )}

          {!['COMPLETED', 'RESOLVED', 'CLOSED'].includes(statusCode) && (
            <>
              <button
                onClick={() => {
                  setInfoError('');
                  setShowInfoModal(true);
                }}
                disabled={actionSubmitting}
                className="touch-target-sm flex-1 sm:flex-initial"
                style={{
                  padding: '9px 16px', borderRadius: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                  color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.83rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}
              >
                <HelpCircle size={15} color="#60a5fa" /> Request Info
              </button>

              <button
                onClick={() => {
                  setEscalationErrors({});
                  setShowEscalationModal(true);
                }}
                disabled={actionSubmitting}
                className="touch-target-sm flex-1 sm:flex-initial"
                style={{
                  padding: '9px 16px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171', fontWeight: 600, fontSize: '0.83rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}
              >
                <ShieldAlert size={15} /> Escalate
              </button>

              <button
                onClick={() => {
                  setResolutionErrors({});
                  setShowResolutionModal(true);
                }}
                disabled={actionSubmitting}
                className="touch-target w-full sm:w-auto sm:ml-auto"
                style={{
                  padding: '10px 20px', borderRadius: '8px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none',
                  color: '#ffffff', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                }}
              >
                <CheckCircle2 size={16} /> Mark Resolved
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── WORKSPACE DETAIL TABS & PANELS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
        {/* Left Column: Main Tabs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Tab Navigation with horizontal scrolling on mobile */}
          <div className="glass-panel p-1.5 rounded-xl flex items-center gap-1.5 overflow-x-auto max-w-full" style={{ scrollbarWidth: 'none' }}>
            {[
              { id: 'timeline', label: 'Activity Timeline', icon: Clock },
              { id: 'investigation', label: 'Investigation & Findings', icon: FileText },
              { id: 'comments', label: `Discussion (${comments.length})`, icon: MessageSquare },
              { id: 'attachments', label: `Attachments (${documents.length})`, icon: Paperclip }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="touch-target-sm shrink-0 whitespace-nowrap"
                  style={{
                    padding: '8px 14px', borderRadius: '8px', border: 'none',
                    background: isActive ? 'var(--accent-gradient)' : 'transparent',
                    color: isActive ? '#ffffff' : 'var(--text-muted)',
                    fontWeight: isActive ? 700 : 600, fontSize: '0.82rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                  }}
                >
                  <Icon size={15} /> {tab.label}
                </button>
              );
            })}
          </div>

          {/* TAB 1: TIMELINE HISTORY */}
          {activeTab === 'timeline' && (
            <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Field Assignment History & Timeline
              </h3>
              {historyItems.length === 0 ? (
                <div style={{ fontSize: '0.83rem', color: 'var(--text-muted)', padding: '20px', textAlign: 'center' }}>
                  No historical entries recorded yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
                  {historyItems.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                      <div style={{ padding: '6px', borderRadius: '50%', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', marginTop: '2px' }}>
                        <Clock size={14} />
                      </div>
                      <div style={{ flex: 1, background: 'var(--bg-tertiary)', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          <span>{item.ActionTypeCode || 'STATUS_UPDATE'}</span>
                          <span style={{ color: 'var(--text-muted)' }}>{new Date(item.CreatedDate).toLocaleString()}</span>
                        </div>
                        <div style={{ fontSize: '0.83rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          {item.Remarks || 'Assignment status updated'}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--accent-primary)', marginTop: '4px' }}>
                          By: {item.ActionUserName || 'System'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: INVESTIGATION & FINDINGS FORM */}
          {activeTab === 'investigation' && (
            <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
              <h3 style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Technical Investigation & Diagnostic Findings
              </h3>
              <p style={{ margin: '0 0 16px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Record diagnostic findings, root cause analysis, and corrective actions taken during field execution.
              </p>

              <form onSubmit={handleSaveInvestigation} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <FormField
                  label="Root Cause Summary"
                  required
                  error={investigationErrors.RootCauseSummary}
                  icon={FileText}
                  helpText="Brief summary of root cause (5-500 characters)."
                >
                  <input
                    type="text"
                    placeholder="e.g. Damaged fiber optic patch cable in riser conduit B..."
                    value={investigationForm.RootCauseSummary}
                    onChange={e => {
                      setInvestigationForm({ ...investigationForm, RootCauseSummary: e.target.value });
                      clearInvestigationError('RootCauseSummary');
                    }}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '8px',
                      background: 'var(--bg-tertiary)',
                      border: `1px solid ${investigationErrors.RootCauseSummary ? 'rgba(239, 68, 68, 0.5)' : 'var(--glass-border)'}`,
                      color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </FormField>

                <FormField
                  label="Diagnostic Details & Investigation"
                  error={investigationErrors.RootCauseDetails}
                  icon={FileText}
                >
                  <textarea
                    rows={4}
                    placeholder="Full technical analysis, diagnostic steps performed, measurements..."
                    value={investigationForm.RootCauseDetails}
                    onChange={e => {
                      setInvestigationForm({ ...investigationForm, RootCauseDetails: e.target.value });
                      clearInvestigationError('RootCauseDetails');
                    }}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '8px',
                      background: 'var(--bg-tertiary)',
                      border: `1px solid ${investigationErrors.RootCauseDetails ? 'rgba(239, 68, 68, 0.5)' : 'var(--glass-border)'}`,
                      color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box', resize: 'vertical'
                    }}
                  />
                </FormField>

                <FormField
                  label="Corrective Actions Taken"
                  error={investigationErrors.CorrectiveActionsTaken}
                  icon={Wrench}
                >
                  <textarea
                    rows={3}
                    placeholder="Actions performed to fix or mitigate the issue..."
                    value={investigationForm.CorrectiveActionsTaken}
                    onChange={e => {
                      setInvestigationForm({ ...investigationForm, CorrectiveActionsTaken: e.target.value });
                      clearInvestigationError('CorrectiveActionsTaken');
                    }}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '8px',
                      background: 'var(--bg-tertiary)',
                      border: `1px solid ${investigationErrors.CorrectiveActionsTaken ? 'rgba(239, 68, 68, 0.5)' : 'var(--glass-border)'}`,
                      color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box', resize: 'vertical'
                    }}
                  />
                </FormField>

                <button
                  type="submit" disabled={actionSubmitting}
                  style={{
                    alignSelf: 'flex-start', padding: '10px 20px', borderRadius: '8px',
                    background: 'var(--accent-gradient)', border: 'none', color: '#ffffff',
                    fontWeight: 700, fontSize: '0.83rem', cursor: 'pointer'
                  }}
                >
                  Save Diagnostic Findings
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: DISCUSSION & INTERNAL NOTES */}
          {activeTab === 'comments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <ConversationPanel
                issueRequestId={assignment?.RequestID || issueDetail?.IssueRequestID}
                currentUserId={user?.UserID || user?.userId || user?.id}
              />
              <InternalNotesPanel
                requestId={assignment?.RequestID || issueDetail?.IssueRequestID}
              />
            </div>
          )}

          {/* TAB 4: ATTACHMENTS */}
          {activeTab === 'attachments' && (
            <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
              <input type="file" id="tech-file-input" onChange={handleFileUpload} style={{ display: 'none' }} />
              <DocumentMediaReader
                documents={documents}
                canUpload={true}
                onUpload={() => document.getElementById('tech-file-input')?.click()}
              />
            </div>
          )}
        </div>

        {/* Right Column: Request Details Summary Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Request Information Summary */}
          <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
            <h4 style={{ margin: '0 0 14px', fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px' }}>
              Request Metadata
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.82rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Requester: </span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{issueDetail?.RequesterName || assignment?.RequesterName || 'Tenant Employee'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Contact Email: </span>
                <span style={{ color: 'var(--text-primary)' }}>{issueDetail?.RequesterEmail || assignment?.RequesterEmail || 'N/A'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Tenant Company: </span>
                <span style={{ color: 'var(--text-primary)' }}>🏢 {issueDetail?.TenantName || 'Tenant Organization'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Assigned Department: </span>
                <span style={{ color: 'var(--text-primary)' }}>📂 {issueDetail?.AssignedDepartmentName || assignment?.DepartmentName || 'Technical Services'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Location / Building: </span>
                <span style={{ color: 'var(--text-primary)' }}>📍 {issueDetail?.BuildingName || 'Campus Main'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Category: </span>
                <span style={{ color: 'var(--text-primary)' }}>{issueDetail?.CategoryName || 'General Maintenance'}</span>
              </div>
            </div>
          </div>

          {/* Issue Description Box */}
          <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
            <h4 style={{ margin: '0 0 10px', fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Issue Description
            </h4>
            <div style={{ fontSize: '0.83rem', color: 'var(--text-primary)', lineHeight: 1.5, background: 'var(--bg-tertiary)', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--glass-border)', whiteSpace: 'pre-wrap' }}>
              {issueDetail?.Description || assignment?.RequestDescription || 'No description provided.'}
            </div>
          </div>
        </div>
      </div>

            {/* ── MODAL: REQUEST ADDITIONAL INFO ── */}
      {showInfoModal && (
        <div 
          onClick={() => {
            setShowInfoModal(false);
            setInfoError('');
          }}
          style={{ 
            position: 'fixed', inset: 0, 
            background: 'var(--modal-backdrop, rgba(16, 20, 24, 0.78))', 
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            zIndex: 1000, padding: '20px' 
          }}
        >
          <div 
            role="dialog"
            aria-modal="true"
            aria-labelledby="info-modal-title"
            className="modal-card accent-strip-brand enterprise-card" 
            style={{ 
              width: '100%', maxWidth: '480px', maxHeight: '90vh', 
              display: 'flex', flexDirection: 'column', 
              borderRadius: 'var(--border-radius-lg, 18px)', 
              overflow: 'hidden', position: 'relative' 
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid var(--glass-border)',
              background: 'var(--bg-tertiary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  width: '38px', height: '38px', borderRadius: '10px', 
                  background: 'var(--accent-gradient)', color: '#fff', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  boxShadow: 'var(--glow-accent)', flexShrink: 0 
                }}>
                  <HelpCircle size={20} />
                </div>
                <div>
                  <h3 id="info-modal-title" style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Request Additional Information
                  </h3>
                  <div style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Inquire additional technical specs or asset tags from requester
                  </div>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowInfoModal(false);
                  setInfoError('');
                }}
                className="btn-icon touch-target-sm"
                aria-label="Close dialog"
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleRequestInfo} noValidate style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1, margin: 0 }}>
              <div style={{ padding: 'clamp(16px, 3vw, 24px)', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto', flex: 1 }}>
                <FormField
                label="Information Inquired / Question"
                required
                error={infoError}
                icon={HelpCircle}
                hint="Describe what specific information or access is needed from the requester (min 5 characters)."
              >
                <textarea
                  rows={4}
                  placeholder="e.g. Please provide your workstation asset number and floor extension..."
                  value={infoMessage}
                  onChange={e => {
                    setInfoMessage(e.target.value);
                    if (infoError) setInfoError('');
                  }}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '8px',
                    background: 'var(--bg-tertiary)',
                    border: `1px solid ${infoError ? 'rgba(239, 68, 68, 0.5)' : 'var(--glass-border)'}`,
                    color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
              </FormField>
              </div>

              {/* Footer */}
              <div style={{ 
                padding: '14px 20px', borderTop: '1px solid var(--glass-border)', 
                background: 'var(--bg-tertiary)', display: 'flex', gap: '12px', 
                justifyContent: 'flex-end', flexShrink: 0 
              }}>
                <button
                  type="button" 
                  onClick={() => {
                    setShowInfoModal(false);
                    setInfoError('');
                  }}
                  className="btn btn-secondary touch-target-sm"
                  style={{ padding: '8px 16px', borderRadius: 'var(--border-radius-sm)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit" 
                  disabled={actionSubmitting}
                  className="btn btn-primary touch-target-sm"
                  style={{ padding: '8px 20px', borderRadius: 'var(--border-radius-sm)' }}
                >
                  {actionSubmitting ? 'Sending Request...' : 'Send Inquiry to Requester'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ESCALATE REQUEST ── */}
      {showEscalationModal && (
        <div 
          onClick={() => {
            setShowEscalationModal(false);
            setEscalationErrors({});
          }}
          style={{ 
            position: 'fixed', inset: 0, 
            background: 'var(--modal-backdrop, rgba(16, 20, 24, 0.78))', 
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            zIndex: 1000, padding: '20px' 
          }}
        >
          <div 
            role="dialog"
            aria-modal="true"
            aria-labelledby="escalation-modal-title"
            className="modal-card accent-strip-danger enterprise-card" 
            style={{ 
              width: '100%', maxWidth: '500px', maxHeight: '90vh', 
              display: 'flex', flexDirection: 'column', 
              borderRadius: 'var(--border-radius-lg, 18px)', 
              overflow: 'hidden', position: 'relative' 
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid var(--glass-border)',
              background: 'var(--bg-tertiary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  width: '38px', height: '38px', borderRadius: '10px', 
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: '#fff', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)', flexShrink: 0 
                }}>
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h3 id="escalation-modal-title" style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Escalate Request to Management
                  </h3>
                  <div style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Submit escalation for management or dispatcher intervention
                  </div>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowEscalationModal(false);
                  setEscalationErrors({});
                }}
                className="btn-icon touch-target-sm"
                aria-label="Close dialog"
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleEscalateSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1, margin: 0 }}>
              <div style={{ padding: 'clamp(16px, 3vw, 24px)', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto', flex: 1 }}>
                <FormField
                label="Escalation Reason"
                required
                error={escalationErrors.reason}
                icon={ShieldAlert}
              >
                <input
                  type="text"
                  placeholder="e.g. Requires specialized hardware replacement outside scope..."
                  value={escalationForm.reason}
                  onChange={e => {
                    setEscalationForm({ ...escalationForm, reason: e.target.value });
                    clearEscalationError('reason');
                  }}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '8px',
                    background: 'var(--bg-tertiary)',
                    border: `1px solid ${escalationErrors.reason ? 'rgba(239, 68, 68, 0.5)' : 'var(--glass-border)'}`,
                    color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </FormField>

              <FormField
                label="Detailed Technical Explanation"
                error={escalationErrors.details}
                icon={FileText}
                hint="Provide context to the dispatcher or department manager (max 1000 characters)."
              >
                <textarea
                  rows={3}
                  placeholder="Additional context for department manager..."
                  value={escalationForm.details}
                  onChange={e => {
                    setEscalationForm({ ...escalationForm, details: e.target.value });
                    clearEscalationError('details');
                  }}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '8px',
                    background: 'var(--bg-tertiary)',
                    border: `1px solid ${escalationErrors.details ? 'rgba(239, 68, 68, 0.5)' : 'var(--glass-border)'}`,
                    color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
              </FormField>
              </div>

              {/* Footer */}
              <div style={{ 
                padding: '14px 20px', borderTop: '1px solid var(--glass-border)', 
                background: 'var(--bg-tertiary)', display: 'flex', gap: '12px', 
                justifyContent: 'flex-end', flexShrink: 0 
              }}>
                <button
                  type="button" 
                  onClick={() => {
                    setShowEscalationModal(false);
                    setEscalationErrors({});
                  }}
                  className="btn btn-secondary touch-target-sm"
                  style={{ padding: '8px 16px', borderRadius: 'var(--border-radius-sm)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit" 
                  disabled={actionSubmitting}
                  className="touch-target-sm"
                  style={{ 
                    padding: '8px 20px', borderRadius: 'var(--border-radius-sm)', 
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', 
                    border: 'none', color: '#ffffff', fontWeight: 700, cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)'
                  }}
                >
                  {actionSubmitting ? 'Escalating...' : 'Submit Escalation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: STRUCTURED RESOLUTION FORM ── */}
      {showResolutionModal && (
        <div 
          onClick={() => {
            setShowResolutionModal(false);
            setResolutionErrors({});
          }}
          style={{ 
            position: 'fixed', inset: 0, 
            background: 'var(--modal-backdrop, rgba(16, 20, 24, 0.78))', 
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            zIndex: 1000, padding: '20px' 
          }}
        >
          <div 
            role="dialog"
            aria-modal="true"
            aria-labelledby="resolution-modal-title"
            className="modal-card accent-strip-success enterprise-card" 
            style={{ 
              width: '100%', maxWidth: '560px', maxHeight: '90vh', 
              display: 'flex', flexDirection: 'column', 
              borderRadius: 'var(--border-radius-lg, 18px)', 
              overflow: 'hidden', position: 'relative' 
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid var(--glass-border)',
              background: 'var(--bg-tertiary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  width: '38px', height: '38px', borderRadius: '10px', 
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)', flexShrink: 0 
                }}>
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <h3 id="resolution-modal-title" style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Structured Request Resolution
                  </h3>
                  <div style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Complete resolution details to mark this work order as resolved
                  </div>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowResolutionModal(false);
                  setResolutionErrors({});
                }}
                className="btn-icon touch-target-sm"
                aria-label="Close dialog"
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleResolveSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1, margin: 0 }}>
              <div style={{ padding: 'clamp(16px, 3vw, 24px)', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto', flex: 1 }}>
                <FormField
                label="Resolution Type"
                required
                error={resolutionErrors.ResolutionTypeCode}
                icon={Layers}
              >
                <select
                  value={resolutionForm.ResolutionTypeCode}
                  onChange={e => {
                    setResolutionForm({ ...resolutionForm, ResolutionTypeCode: e.target.value });
                    clearResolutionError('ResolutionTypeCode');
                  }}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '8px',
                    background: 'var(--bg-tertiary)',
                    border: `1px solid ${resolutionErrors.ResolutionTypeCode ? 'rgba(239, 68, 68, 0.5)' : 'var(--glass-border)'}`,
                    color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box'
                  }}
                >
                  <option value="PERMANENT_FIX">Permanent Fix (Fully Resolved)</option>
                  <option value="WORKAROUND">Workaround (Temporary Bypass)</option>
                  <option value="REPLACEMENT">Hardware / Asset Replacement</option>
                </select>
              </FormField>

              <FormField
                label="Resolution Summary"
                required
                error={resolutionErrors.ResolutionSummary}
                icon={CheckCircle2}
              >
                <input
                  type="text"
                  placeholder="e.g. Network connectivity restored successfully after router configuration..."
                  value={resolutionForm.ResolutionSummary}
                  onChange={e => {
                    setResolutionForm({ ...resolutionForm, ResolutionSummary: e.target.value });
                    clearResolutionError('ResolutionSummary');
                  }}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '8px',
                    background: 'var(--bg-tertiary)',
                    border: `1px solid ${resolutionErrors.ResolutionSummary ? 'rgba(239, 68, 68, 0.5)' : 'var(--glass-border)'}`,
                    color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </FormField>

              <FormField
                label="Action Steps Taken"
                error={resolutionErrors.ActionStepsTaken}
                icon={FileText}
                hint="Chronological actions taken to repair or address the issue (max 2000 characters)."
              >
                <textarea
                  rows={3}
                  placeholder="Steps taken to fix or replace components..."
                  value={resolutionForm.ActionStepsTaken}
                  onChange={e => {
                    setResolutionForm({ ...resolutionForm, ActionStepsTaken: e.target.value });
                    clearResolutionError('ActionStepsTaken');
                  }}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '8px',
                    background: 'var(--bg-tertiary)',
                    border: `1px solid ${resolutionErrors.ActionStepsTaken ? 'rgba(239, 68, 68, 0.5)' : 'var(--glass-border)'}`,
                    color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
              </FormField>

              <FormField
                label="Verification & Testing Notes"
                error={resolutionErrors.VerificationNotes}
                icon={Check}
                hint="How the fix was validated (e.g. diagnostics ran, user acceptance - max 1000 characters)."
              >
                <input
                  type="text"
                  placeholder="e.g. Ping test verified and user confirmed internet access..."
                  value={resolutionForm.VerificationNotes}
                  onChange={e => {
                    setResolutionForm({ ...resolutionForm, VerificationNotes: e.target.value });
                    clearResolutionError('VerificationNotes');
                  }}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '8px',
                    background: 'var(--bg-tertiary)',
                    border: `1px solid ${resolutionErrors.VerificationNotes ? 'rgba(239, 68, 68, 0.5)' : 'var(--glass-border)'}`,
                    color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </FormField>
              </div>

              {/* Footer */}
              <div style={{ 
                padding: '14px 20px', borderTop: '1px solid var(--glass-border)', 
                background: 'var(--bg-tertiary)', display: 'flex', gap: '12px', 
                justifyContent: 'flex-end', flexShrink: 0 
              }}>
                <button
                  type="button" 
                  onClick={() => {
                    setShowResolutionModal(false);
                    setResolutionErrors({});
                  }}
                  className="btn btn-secondary touch-target-sm"
                  style={{ padding: '8px 16px', borderRadius: 'var(--border-radius-sm)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit" 
                  disabled={actionSubmitting}
                  className="touch-target-sm"
                  style={{ 
                    padding: '10px 22px', borderRadius: 'var(--border-radius-sm)', 
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                    border: 'none', color: '#ffffff', fontWeight: 800, cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
                  }}
                >
                  {actionSubmitting ? 'Resolving...' : 'Confirm & Resolve Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
