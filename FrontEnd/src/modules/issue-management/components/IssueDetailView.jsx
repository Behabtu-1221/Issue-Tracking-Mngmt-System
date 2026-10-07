import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Clock,
  AlertTriangle,
  User,
  Building,
  Tag,
  MessageSquare,
  Search as SearchIcon,
  Wrench,
  FileText,
  Send,
  Shield,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Calendar,
  MapPin,
  Paperclip,
  Download,
  Eye,
  Upload,
  Plus,
  Star,
  X
} from 'lucide-react';
import issueManagementApi from '../api/issueManagementApi';
import fileDocumentApi from '../../file-document/api/fileDocumentApi';
import DocumentMediaReader from '../../file-document/components/DocumentMediaReader';
import ConfirmDialogModal from '../../../components/common/ConfirmDialogModal';
import AlertDialogModal from '../../../components/common/AlertDialogModal';
import { requestSchemas } from '../../../validation';
import { FormField } from '../../../components/common/FormField';
import { usePermissionContext } from '../../role-permission-management/contexts/PermissionContext';
import approvalApi from '../../approval/api/approvalApi';
import ApprovalDetailModal from '../../approval/components/ApprovalDetailModal';
import ManualAssignModal from '../../dispatch/components/ManualAssignModal';
import ConversationPanel from '../../communication/components/ConversationPanel';
import InternalNotesPanel from '../../communication/components/InternalNotesPanel';
import { useTranslation } from '../../../i18n';

export const IssueDetailView = ({ issue, onBack, onRefresh }) => {
  const { t, isRTL } = useTranslation();
  const { user, isParkAdmin, isCompanyAdmin } = usePermissionContext();

  const isTenantRep = !isParkAdmin && (
    isCompanyAdmin ||
    (user?.roles && user.roles.some(r => (typeof r === 'string' ? r : r.RoleCode || r.name) === 'TENANT_REPRESENTATIVE')) ||
    user?.userTypeCode === 'TENANT_REPRESENTATIVE'
  );
  const [detailData, setDetailData] = useState(null);
  const [investigations, setInvestigations] = useState([]);
  const [resolutions, setResolutions] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('timeline');
  const [approvalWorkflow, setApprovalWorkflow] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Glass Dialog Modals State
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'error' });

  // Satisfaction Feedback & Resolution Confirmation State
  const [feedback, setFeedback] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    Rating: 5,
    ResolutionConfirmed: true,
    Comments: '',
    TimelinessRating: 5,
    QualityRating: 5
  });
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  const showAlert = (title, message, type = 'error') => {
    setAlertConfig({ isOpen: true, title, message, type });
  };

  // Comment form
  const [newComment, setNewComment] = useState('');
  const [commentError, setCommentError] = useState(null);
  const [isInternal, setIsInternal] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  // Investigation form
  const [showInvestigationForm, setShowInvestigationForm] = useState(false);
  const [investigationErrors, setInvestigationErrors] = useState({});
  const [investigationForm, setInvestigationForm] = useState({
    RootCauseSummary: '',
    RootCauseDetails: '',
    CorrectiveActionsTaken: '',
    PreventiveActionsProposed: ''
  });
  const [submittingInvestigation, setSubmittingInvestigation] = useState(false);

  // Resolution form
  const [showResolutionForm, setShowResolutionForm] = useState(false);
  const [resolutionErrors, setResolutionErrors] = useState({});
  const [resolutionForm, setResolutionForm] = useState({
    ResolutionTypeCode: 'PERMANENT_FIX',
    ResolutionSummary: '',
    ActionStepsTaken: '',
    VerificationNotes: ''
  });
  const [submittingResolution, setSubmittingResolution] = useState(false);

  const [feedbackErrors, setFeedbackErrors] = useState({});

  const [documents, setDocuments] = useState([]);
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [newDocFile, setNewDocFile] = useState(null);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const issueId = issue?.IssueRequestID;

  useEffect(() => {
    if (issueId) fetchAllData();
  }, [issueId]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [detailRes, invRes, resRes, comRes, docRes, feedRes, apprRes] = await Promise.allSettled([
        issueManagementApi.getIssueById(issueId),
        issueManagementApi.getInvestigationByIssueId(issueId),
        issueManagementApi.getResolutionByIssueId(issueId),
        issueManagementApi.getCommentsByIssueId(issueId),
        fileDocumentApi.getDocuments({ entityRefType: 'ISSUE_REQUEST', entityRefId: issueId }),
        issueManagementApi.getFeedback(issueId),
        approvalApi.getApprovalByRequestId(issueId)
      ]);
      if (detailRes.status === 'fulfilled') setDetailData(detailRes.value.data?.data);
      if (invRes.status === 'fulfilled') {
        const d = invRes.value.data?.data;
        setInvestigations(Array.isArray(d) ? d : (d ? [d] : []));
      }
      if (resRes.status === 'fulfilled') {
        const d = resRes.value.data?.data;
        setResolutions(Array.isArray(d) ? d : (d ? [d] : []));
      }
      if (comRes.status === 'fulfilled') {
        const d = comRes.value.data?.data;
        setComments(Array.isArray(d) ? d : (d ? [d] : []));
      }
      if (docRes.status === 'fulfilled') {
        const docs = docRes.value.data?.data?.documents || [];
        setDocuments(docs);
      }
      if (feedRes.status === 'fulfilled') {
        setFeedback(feedRes.value.data?.data || null);
      }
      if (apprRes.status === 'fulfilled') {
        setApprovalWorkflow(apprRes.value.data?.data || null);
      }
    } catch (err) {
      console.error('Fetch all data failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    setFeedbackErrors({});

    const validation = requestSchemas.feedbackForm(feedbackForm);
    if (!validation.isValid) {
      setFeedbackErrors(validation.errors);
      return;
    }

    setSubmittingFeedback(true);
    try {
      await issueManagementApi.submitFeedback(issueId, {
        Rating: validation.sanitized.Rating,
        ResolutionConfirmed: feedbackForm.ResolutionConfirmed ? 1 : 0,
        Comments: validation.sanitized.Comments || '',
        TimelinessRating: validation.sanitized.TimelinessRating,
        QualityRating: validation.sanitized.QualityRating
      });
      showAlert('Feedback Recorded', 'Thank you! Your satisfaction feedback has been submitted and the issue is confirmed closed.', 'success');
      setShowFeedbackModal(false);
      fetchAllData();
      if (onRefresh) onRefresh();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit feedback';
      showAlert('Operation Error', msg, 'error');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleUploadAttachment = async (e) => {
    e.preventDefault();
    if (!newDocFile) return;
    try {
      setUploadingDoc(true);
      const formData = new FormData();
      formData.append('file', newDocFile);
      formData.append('title', newDocTitle || newDocFile.name);
      formData.append('entityRefType', 'ISSUE_REQUEST');
      formData.append('entityRefId', issueId);
      formData.append('tags', 'issue_attachment');

      await fileDocumentApi.uploadFile(formData);
      setNewDocFile(null);
      setNewDocTitle('');
      setShowAddDocModal(false);
      fetchAllData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to upload attachment';
      showAlert('Attachment Error', msg, 'error');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    setCommentError(null);
    const effectiveIsInternal = isTenantRep ? false : isInternal;
    const validation = requestSchemas.commentForm({ CommentText: newComment, IsInternal: effectiveIsInternal });
    if (!validation.isValid) {
      setCommentError(validation.errors.CommentText);
      return;
    }

    setSubmittingComment(true);
    try {
      await issueManagementApi.addComment({
        IssueRequestID: issueId,
        UserID: user?.UserID || user?.userId || 1,
        CommentText: validation.sanitized.CommentText,
        IsInternal: validation.sanitized.IsInternal ? 1 : 0
      });
      setNewComment('');
      setIsInternal(false);
      setCommentError(null);
      fetchAllData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add comment';
      showAlert('Operation Error', msg, 'error');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleInvestigationChange = (field, value) => {
    setInvestigationForm(prev => ({ ...prev, [field]: value }));
    if (investigationErrors[field]) {
      setInvestigationErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleAddInvestigation = async (e) => {
    e.preventDefault();
    const validation = requestSchemas.investigationForm(investigationForm);
    if (!validation.isValid) {
      setInvestigationErrors(validation.errors);
      return;
    }
    setSubmittingInvestigation(true);
    try {
      await issueManagementApi.saveInvestigation({
        IssueRequestID: issueId,
        InvestigatorUserID: user?.UserID || user?.userId || 1,
        ...validation.sanitized
      });
      setInvestigationForm({ RootCauseSummary: '', RootCauseDetails: '', CorrectiveActionsTaken: '', PreventiveActionsProposed: '' });
      setInvestigationErrors({});
      setShowInvestigationForm(false);
      fetchAllData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save investigation';
      showAlert('Operation Error', msg, 'error');
    } finally {
      setSubmittingInvestigation(false);
    }
  };

  const handleResolutionChange = (field, value) => {
    setResolutionForm(prev => ({ ...prev, [field]: value }));
    if (resolutionErrors[field]) {
      setResolutionErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleAddResolution = async (e) => {
    e.preventDefault();
    const validation = requestSchemas.resolutionForm(resolutionForm);
    if (!validation.isValid) {
      setResolutionErrors(validation.errors);
      return;
    }
    setSubmittingResolution(true);
    try {
      await issueManagementApi.saveResolution({
        IssueRequestID: issueId,
        ResolverUserID: user?.UserID || user?.userId || 1,
        ...validation.sanitized
      });
      setResolutionForm({ ResolutionTypeCode: 'PERMANENT_FIX', ResolutionSummary: '', ActionStepsTaken: '', VerificationNotes: '' });
      setResolutionErrors({});
      setShowResolutionForm(false);
      fetchAllData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save resolution';
      showAlert('Operation Error', msg, 'error');
    } finally {
      setSubmittingResolution(false);
    }
  };

  const d = detailData || issue;

  const getStatusBadge = (status) => {
    const styles = {
      NEW: { bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' },
      PENDING_APPROVAL: { bg: 'rgba(234, 179, 8, 0.15)', color: '#facc15', border: 'rgba(234, 179, 8, 0.4)' },
      APPROVED: { bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: 'rgba(16, 185, 129, 0.4)' },
      ASSIGNED: { bg: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: 'rgba(168, 85, 247, 0.3)' },
      IN_PROGRESS: { bg: 'rgba(14, 165, 233, 0.15)', color: '#38bdf8', border: 'rgba(14, 165, 233, 0.3)' },
      PENDING: { bg: 'rgba(249, 115, 22, 0.15)', color: '#fb923c', border: 'rgba(249, 115, 22, 0.3)' },
      RESOLVED: { bg: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', border: 'rgba(34, 197, 94, 0.3)' },
      CLOSED: { bg: 'rgba(100, 116, 139, 0.15)', color: '#94a3b8', border: 'rgba(100, 116, 139, 0.3)' },
      CANCELLED: { bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: 'rgba(239, 68, 68, 0.3)' }
    };
    const s = styles[status] || styles.NEW;
    return (
      <span style={{ padding: '5px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700', letterSpacing: '0.5px', backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
        {status?.replace('_', ' ')}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const styles = { CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#3b82f6', LOW: '#64748b' };
    return (
      <span style={{ padding: '3px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '800', backgroundColor: styles[priority] || '#3b82f6', color: '#fff' }}>
        {priority}
      </span>
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const sectionBtnStyle = (isActive) => ({
    padding: '10px 20px',
    backgroundColor: isActive ? 'rgba(138, 75, 255, 0.15)' : 'transparent',
    border: 'none',
    borderBottom: isActive ? '3px solid var(--accent-primary)' : '3px solid transparent',
    borderRadius: '8px 8px 0 0',
    color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
    fontWeight: isActive ? '700' : '500',
    fontSize: '0.88rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    whiteSpace: 'nowrap'
  });

  if (loading && !d) {
    return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>{t('issues.loadingDetails', 'Loading issue details...')}</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Back Button */}
      <button
        onClick={onBack}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '8px 16px', borderRadius: '8px',
          border: '1px solid var(--glass-border)',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          color: 'var(--text-secondary)', cursor: 'pointer',
          fontWeight: '600', fontSize: '0.85rem',
          alignSelf: 'flex-start'
        }}
      >
        <ArrowLeft size={16} style={{ transform: isRTL ? 'rotate(180deg)' : 'none' }} /> {t('issues.backToRequests', 'Back to Requests')}
      </button>

      {/* Issue Header Card */}
      <div className="glass-panel" style={{ padding: '28px', borderRadius: 'var(--border-radius-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'monospace', fontWeight: '800', fontSize: '1.1rem', color: 'var(--accent-primary)' }}>
                {d.RequestNumber}
              </span>
              {getStatusBadge(d.StatusCode)}
              {getPriorityBadge(d.PriorityCode)}
              <span style={{ padding: '3px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', backgroundColor: 'rgba(255,255,255,0.08)', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)' }}>
                {d.RequestTypeCode?.replace('_', ' ')}
              </span>
              {(d.IsMajorIncident === 1 || d.IsMajorIncident === true) && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '800', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
                  <AlertTriangle size={12} /> {t('issues.majorIncident', 'MAJOR INCIDENT')}
                </span>
              )}
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '8px', letterSpacing: '-0.3px' }}>
              {d.Title}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', maxWidth: '700px' }}>
              {d.Description}
            </p>
          </div>
        </div>

        {/* Metadata Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '18px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <User size={16} style={{ color: 'var(--accent-primary)' }} />
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('issues.requester', 'Requester')}</div>
              <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{d.RequesterName || 'N/A'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Tag size={16} style={{ color: '#10b981' }} />
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('issues.service', 'Service')}</div>
              <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{d.ServiceName || 'N/A'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building size={16} style={{ color: '#f59e0b' }} />
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('issues.assignedStaff', 'Assigned Dept')}</div>
              <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{d.AssignedDepartmentName || 'Unassigned'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calendar size={16} style={{ color: '#60a5fa' }} />
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('issues.submitted', 'Submitted')}</div>
              <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.85rem' }}>{formatDate(d.CreatedDate)}</div>
            </div>
          </div>
          {d.BuildingName && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <MapPin size={16} style={{ color: '#ec4899' }} />
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('issues.locationDetails', 'Location')}</div>
                <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{d.BuildingName}{d.OfficeSpaceNumber ? ` / ${d.OfficeSpaceNumber}` : ''}</div>
              </div>
            </div>
          )}
          {d.CategoryCode && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Tag size={16} style={{ color: '#a78bfa' }} />
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('issues.category', 'Category')}</div>
                <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{d.CategoryCode}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Multi-Level Approval & Assignment Workflow Pipeline Tracker ── */}
      <div className="glass-panel" style={{
        padding: '24px 28px',
        borderRadius: 'var(--border-radius-md)',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 41, 59, 0.85) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#94a3b8', fontWeight: 700 }}>
                {t('issues.enterpriseGovernance', 'Enterprise Governance Workflow')}
              </span>
              {approvalWorkflow?.TotalStages > 1 ? (
                <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.25)', border: '1px solid rgba(168, 85, 247, 0.5)', color: '#c084fc', fontWeight: 800 }}>
                  {t('issues.multiLevelApproval', 'Multi-Level Approval Required')}
                </span>
              ) : (
                <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.4)', color: '#60a5fa', fontWeight: 800 }}>
                  {t('issues.standardDeptReview', 'Standard Department Review')}
                </span>
              )}
            </div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
              {t('issues.approvalLifecycle', 'Approval & Assignment Lifecycle')}
            </h3>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {d.StatusCode === 'PENDING_APPROVAL' && approvalWorkflow && (
              <button
                onClick={() => setShowApprovalModal(true)}
                style={{
                  padding: '9px 18px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                  border: 'none', color: '#fff', fontWeight: 700, fontSize: '0.85rem',
                  display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)'
                }}
              >
                <Shield size={16} /> Review Approval (Stage {approvalWorkflow.CurrentStageNumber} of {approvalWorkflow.TotalStages})
              </button>
            )}

            {d.StatusCode === 'APPROVED' && (isParkAdmin || !isTenantRep) && (
              <button
                onClick={() => setShowAssignModal(true)}
                style={{
                  padding: '9px 18px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none', color: '#fff', fontWeight: 700, fontSize: '0.85rem',
                  display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
                }}
              >
                <Wrench size={16} /> {t('issues.dispatchTechTeam', 'Dispatch Technician / Team')}
              </button>
            )}
          </div>
        </div>

        {/* Workflow Progression Stepper */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          {/* Step 1: Submission & Department Determination */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px', padding: '14px 16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800 }}>
                ✓
              </div>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc' }}>{t('issues.stepSubmitted', '1. Submitted')}</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              Routed to <strong>{d.AssignedDepartmentName || 'Department'}</strong>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>
              {formatDate(d.CreatedDate)}
            </div>
          </div>

          {/* Step 2: Department Manager Review (Stage 1) */}
          {(() => {
            const st1 = approvalWorkflow?.stages?.find(s => s.StageNumber === 1);
            const isApproved = st1?.StageStatusCode === 'APPROVED' || ['APPROVED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(d.StatusCode);
            const isRejected = st1?.StageStatusCode === 'REJECTED' || (d.StatusCode === 'CANCELLED' && approvalWorkflow?.CurrentStageNumber === 1);
            const isPending = d.StatusCode === 'PENDING_APPROVAL' && approvalWorkflow?.CurrentStageNumber === 1;

            return (
              <div style={{
                background: isPending ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                border: isPending ? '1px solid rgba(245, 158, 11, 0.4)' : isApproved ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px', padding: '14px 16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%',
                    background: isApproved ? '#10b981' : isRejected ? '#ef4444' : isPending ? '#f59e0b' : '#475569',
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800
                  }}>
                    {isApproved ? '✓' : isRejected ? '✕' : '2'}
                  </div>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc' }}>{t('issues.stepDeptManager', '2. Dept Manager')}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: isApproved ? '#34d399' : isRejected ? '#f87171' : isPending ? '#fbbf24' : '#94a3b8', fontWeight: isPending ? 700 : 500 }}>
                  {isApproved ? `Approved (${st1?.DecisionUserName || 'Manager'})` : isRejected ? 'Rejected' : isPending ? '● Awaiting Dept Review' : 'Pending'}
                </div>
                {st1?.DecisionDateTime && (
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>
                    {formatDate(st1.DecisionDateTime)}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Step 3: Park Administrator Authorization (Stage 2) */}
          {(() => {
            const hasStage2 = approvalWorkflow ? approvalWorkflow.TotalStages > 1 : (d.PriorityCode === 'CRITICAL' || d.PriorityCode === 'HIGH' || d.IsMajorIncident === 1);
            if (!hasStage2) {
              return (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.02)', border: '1px dashed rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px', padding: '14px 16px', opacity: 0.7
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#334155', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800 }}>
                      -
                    </div>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#94a3b8' }}>{t('issues.stepParkAdmin', '3. Park Admin')}</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    Not Required (Routine Request)
                  </div>
                </div>
              );
            }

            const st2 = approvalWorkflow?.stages?.find(s => s.StageNumber === 2);
            const isApproved = st2?.StageStatusCode === 'APPROVED' || (['APPROVED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(d.StatusCode) && approvalWorkflow?.TotalStages > 1);
            const isRejected = st2?.StageStatusCode === 'REJECTED' || (d.StatusCode === 'CANCELLED' && approvalWorkflow?.CurrentStageNumber === 2);
            const isPending = d.StatusCode === 'PENDING_APPROVAL' && approvalWorkflow?.CurrentStageNumber === 2;
            const isWaitingStage1 = d.StatusCode === 'PENDING_APPROVAL' && approvalWorkflow?.CurrentStageNumber === 1;

            return (
              <div style={{
                background: isPending ? 'rgba(168, 85, 247, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                border: isPending ? '1px solid rgba(168, 85, 247, 0.5)' : isApproved ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px', padding: '14px 16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%',
                    background: isApproved ? '#a855f7' : isRejected ? '#ef4444' : isPending ? '#8b5cf6' : '#475569',
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800
                  }}>
                    {isApproved ? '✓' : isRejected ? '✕' : '3'}
                  </div>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc' }}>{t('issues.stepParkAdmin', '3. Park Admin')}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: isApproved ? '#c084fc' : isRejected ? '#f87171' : isPending ? '#c084fc' : '#94a3b8', fontWeight: isPending ? 700 : 500 }}>
                  {isApproved ? `Authorized (${st2?.DecisionUserName || 'Admin'})` : isRejected ? 'Rejected by Admin' : isPending ? '● Awaiting Admin Sign-off' : isWaitingStage1 ? 'Queued (Awaiting Dept)' : 'Pending'}
                </div>
                {st2?.DecisionDateTime && (
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>
                    {formatDate(st2.DecisionDateTime)}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Step 4: Department Technician / Team Assignment */}
          {(() => {
            const isAssigned = ['ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(d.StatusCode);
            const isAwaitingDispatch = d.StatusCode === 'APPROVED';

            return (
              <div style={{
                background: isAwaitingDispatch ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                border: isAwaitingDispatch ? '1px solid rgba(16, 185, 129, 0.4)' : isAssigned ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px', padding: '14px 16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%',
                    background: isAssigned ? '#a855f7' : isAwaitingDispatch ? '#10b981' : '#475569',
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800
                  }}>
                    {isAssigned ? '✓' : '4'}
                  </div>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc' }}>{t('issues.stepDispatch', '4. Dispatch')}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: isAssigned ? '#c084fc' : isAwaitingDispatch ? '#34d399' : '#94a3b8', fontWeight: isAwaitingDispatch ? 700 : 500 }}>
                  {isAssigned ? (d.AssignedUserName ? `Assigned: ${d.AssignedUserName}` : (d.TeamName ? `Team: ${d.TeamName}` : 'Assigned')) : isAwaitingDispatch ? '● Ready for Assignment' : 'Locked (Pending Approval)'}
                </div>
              </div>
            );
          })()}

          {/* Step 5: Execution & Resolution */}
          {(() => {
            const isResolved = ['RESOLVED', 'CLOSED'].includes(d.StatusCode);
            const isInProgress = d.StatusCode === 'IN_PROGRESS';

            return (
              <div style={{
                background: isInProgress ? 'rgba(14, 165, 233, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                border: isInProgress ? '1px solid rgba(14, 165, 233, 0.4)' : isResolved ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px', padding: '14px 16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%',
                    background: isResolved ? '#10b981' : isInProgress ? '#0284c7' : '#475569',
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800
                  }}>
                    {isResolved ? '✓' : '5'}
                  </div>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc' }}>{t('issues.stepResolution', '5. Resolution')}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: isResolved ? '#34d399' : isInProgress ? '#38bdf8' : '#94a3b8', fontWeight: isInProgress ? 700 : 500 }}>
                  {isResolved ? 'Resolved' : isInProgress ? '● Field Work Active' : 'Queued'}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* ── Tenant Satisfaction & Resolution Confirmation Card ── */}
      {(d.StatusCode === 'RESOLVED' || d.StatusCode === 'CLOSED') && (
        <div className="glass-panel" style={{
          padding: '22px 26px',
          borderRadius: 'var(--border-radius-md)',
          background: feedback
            ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(59, 130, 246, 0.05) 100%)'
            : 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(138, 75, 255, 0.08) 100%)',
          border: feedback ? '1px solid rgba(34, 197, 94, 0.25)' : '1px solid rgba(245, 158, 11, 0.3)',
          marginBottom: '20px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {feedback ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '20px', background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', fontSize: '0.75rem', fontWeight: 800 }}>
                      <CheckCircle2 size={13} /> {feedback.ResolutionConfirmed ? t('issues.confirmedByRequester', 'Resolution Confirmed by Requester') : t('issues.contestedByRequester', 'Resolution Contested')}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {t('issues.submittedOn', 'Submitted')} {formatDate(feedback.CreatedDate)}
                    </span>
                  </div>
                  <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {t('issues.satisfactionTitle', 'Tenant Satisfaction Feedback & Review')}
                  </h4>
                </div>

                {/* Rating Stars Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        size={16}
                        fill={star <= feedback.Rating ? '#f59e0b' : 'none'}
                        color={star <= feedback.Rating ? '#f59e0b' : 'var(--text-muted)'}
                      />
                    ))}
                  </div>
                  <span style={{ fontWeight: 800, color: '#f59e0b', fontSize: '0.9rem', marginLeft: '4px' }}>
                    {feedback.Rating}/5
                  </span>
                </div>
              </div>

              {feedback.Comments && (
                <p style={{ margin: '0 0 14px', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, fontStyle: 'italic', background: 'rgba(0,0,0,0.15)', padding: '12px 16px', borderRadius: '8px', borderLeft: '3px solid #f59e0b' }}>
                  "{feedback.Comments}"
                </p>
              )}

              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {feedback.TimelinessRating && (
                  <div>{t('issues.timelinessScore', 'Timeliness Score')}: <strong style={{ color: 'var(--text-primary)' }}>{feedback.TimelinessRating}/5</strong></div>
                )}
                {feedback.QualityRating && (
                  <div>{t('issues.qualityScore', 'Work Quality Score')}: <strong style={{ color: 'var(--text-primary)' }}>{feedback.QualityRating}/5</strong></div>
                )}
                {feedback.SubmittedByName && (
                  <div>{t('issues.reviewedBy', 'Reviewed by')}: <strong style={{ color: 'var(--text-primary)' }}>{feedback.SubmittedByName}</strong></div>
                )}
              </div>
            </div>
          ) : d.StatusCode === 'RESOLVED' ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b', fontSize: '0.8rem', fontWeight: 700, marginBottom: '2px' }}>
                    <CheckCircle2 size={16} /> {t('issues.workCompletedByStaff', 'Work Completed by Field Staff')}
                  </div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {t('issues.confirmResolutionPrompt', 'Confirm Resolution & Rate Service Quality')}
                  </h4>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {t('issues.confirmResolutionDesc', 'Please confirm that this request was resolved to your satisfaction and rate the maintenance service to close this ticket.')}
                  </p>
                </div>

                <button
                  className="btn-primary"
                  onClick={() => setShowFeedbackModal(true)}
                  style={{ padding: '9px 20px', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem' }}
                >
                  <Star size={16} fill="#fff" /> {t('issues.submitSatisfactionFeedback', 'Submit Satisfaction Feedback')}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Section Tabs */}
      <div style={{ borderBottom: '1px solid var(--glass-border)', display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '0' }}>
        <button style={sectionBtnStyle(activeSection === 'timeline')} onClick={() => setActiveSection('timeline')}>
          <Clock size={16} /> {t('issues.timelineTab', 'Timeline & Audit Trail')}
        </button>
        <button style={sectionBtnStyle(activeSection === 'investigation')} onClick={() => setActiveSection('investigation')}>
          <SearchIcon size={16} /> {t('issues.investigationTab', 'Investigation')} ({investigations.length})
        </button>
        <button style={sectionBtnStyle(activeSection === 'resolution')} onClick={() => setActiveSection('resolution')}>
          <Wrench size={16} /> {t('issues.resolutionTab', 'Resolution')} ({resolutions.length})
        </button>
        <button style={sectionBtnStyle(activeSection === 'comments')} onClick={() => setActiveSection('comments')}>
          <MessageSquare size={16} /> {t('issues.commentsTab', 'Discussion')} ({comments.length})
        </button>
        <button style={sectionBtnStyle(activeSection === 'attachments')} onClick={() => setActiveSection('attachments')}>
          <Paperclip size={16} /> {t('issues.attachmentsTab', 'Attachments & Documents')} ({documents.length})
        </button>
      </div>

      {/* Section Content */}
      <div>
        {/* Timeline & Audit Trail */}
        {activeSection === 'timeline' && (
          <div className="glass-panel" style={{ padding: '28px', borderRadius: 'var(--border-radius-md)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} style={{ color: 'var(--accent-primary)' }} /> {t('issues.activityTimeline', 'Activity Timeline')}
            </h3>
            {(detailData?.timelineHistory || []).length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '30px' }}>{t('issues.noTimelineEvents', 'No timeline events recorded yet.')}</p>
            ) : (
              <div style={{ position: 'relative', paddingLeft: '30px' }}>
                {/* Vertical Line */}
                <div style={{ position: 'absolute', left: '11px', top: '6px', bottom: '6px', width: '2px', backgroundColor: 'var(--glass-border)', borderRadius: '2px' }} />
                {(detailData?.timelineHistory || []).map((event, idx) => (
                  <div key={idx} style={{ position: 'relative', marginBottom: '20px', paddingBottom: '20px', borderBottom: idx < (detailData?.timelineHistory?.length || 0) - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                    {/* Dot */}
                    <div style={{ position: 'absolute', left: '-24px', top: '4px', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)', border: '2px solid var(--bg-primary)', boxShadow: '0 0 8px rgba(138, 75, 255, 0.4)' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                        {event.ActionTypeCode?.replace(/_/g, ' ')}
                      </span>
                      {event.FieldName && (
                        <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>
                          {event.FieldName}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                      {event.OldValue && <span>Changed from <strong style={{ color: '#f87171' }}>{event.OldValue}</strong> to </span>}
                      {event.NewValue && <strong style={{ color: '#4ade80' }}>{event.NewValue}</strong>}
                      {event.Remarks && <span style={{ display: 'block', marginTop: '4px', fontStyle: 'italic', color: 'var(--text-muted)' }}>{event.Remarks}</span>}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <User size={12} /> {event.PerformedByName || 'System'} · {formatDate(event.CreatedDate)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Investigation Section */}
        {activeSection === 'investigation' && (
          <div className="glass-panel" style={{ padding: '28px', borderRadius: 'var(--border-radius-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <SearchIcon size={18} style={{ color: '#f59e0b' }} /> {t('issues.rootCauseInvestigation', 'Root Cause Investigation')}
              </h3>
              {d.StatusCode !== 'CLOSED' && d.StatusCode !== 'CANCELLED' && !isTenantRep && (
                <button
                  className="btn-primary"
                  onClick={() => setShowInvestigationForm(!showInvestigationForm)}
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  {showInvestigationForm ? t('common.cancel', 'Cancel') : t('issues.newInvestigation', '+ New Investigation')}
                </button>
              )}
            </div>

            {showInvestigationForm && (
              <form onSubmit={handleAddInvestigation} style={{ marginBottom: '24px', padding: '20px', borderRadius: '12px', backgroundColor: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <FormField
                      label={t('issues.rootCauseSummary', 'Root Cause Summary')}
                      id="RootCauseSummary"
                      required
                      error={investigationErrors.RootCauseSummary}
                      helpText="Concise summary of why the failure occurred (5-1000 characters)."
                    >
                      <input
                        id="RootCauseSummary"
                        type="text"
                        value={investigationForm.RootCauseSummary}
                        onChange={(e) => handleInvestigationChange('RootCauseSummary', e.target.value)}
                        placeholder="Brief root cause explanation..."
                        style={{
                          width: '100%', padding: '10px 14px',
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          border: investigationErrors.RootCauseSummary ? '1px solid var(--color-danger, #ef4444)' : '1px solid var(--glass-border)',
                          borderRadius: '8px', color: 'var(--text-primary)', outline: 'none'
                        }}
                      />
                    </FormField>
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <FormField
                      label={t('issues.rootCauseDetails', 'Detailed Investigation Findings')}
                      id="RootCauseDetails"
                      error={investigationErrors.RootCauseDetails}
                    >
                      <textarea
                        id="RootCauseDetails"
                        rows={3}
                        value={investigationForm.RootCauseDetails}
                        onChange={(e) => handleInvestigationChange('RootCauseDetails', e.target.value)}
                        placeholder="Detailed investigation findings, logs, and diagnostic observations..."
                        style={{
                          width: '100%', padding: '10px 14px',
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          border: investigationErrors.RootCauseDetails ? '1px solid var(--color-danger, #ef4444)' : '1px solid var(--glass-border)',
                          borderRadius: '8px', color: 'var(--text-primary)', resize: 'vertical', outline: 'none'
                        }}
                      />
                    </FormField>
                  </div>

                  <div>
                    <FormField
                      label={t('issues.correctiveActions', 'Corrective Actions Taken')}
                      id="CorrectiveActionsTaken"
                      error={investigationErrors.CorrectiveActionsTaken}
                    >
                      <textarea
                        id="CorrectiveActionsTaken"
                        rows={2}
                        value={investigationForm.CorrectiveActionsTaken}
                        onChange={(e) => handleInvestigationChange('CorrectiveActionsTaken', e.target.value)}
                        placeholder="Steps taken to correct the problem..."
                        style={{
                          width: '100%', padding: '10px 14px',
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          border: investigationErrors.CorrectiveActionsTaken ? '1px solid var(--color-danger, #ef4444)' : '1px solid var(--glass-border)',
                          borderRadius: '8px', color: 'var(--text-primary)', resize: 'vertical', outline: 'none'
                        }}
                      />
                    </FormField>
                  </div>

                  <div>
                    <FormField
                      label={t('issues.preventiveActions', 'Preventive Actions Proposed')}
                      id="PreventiveActionsProposed"
                      error={investigationErrors.PreventiveActionsProposed}
                    >
                      <textarea
                        id="PreventiveActionsProposed"
                        rows={2}
                        value={investigationForm.PreventiveActionsProposed}
                        onChange={(e) => handleInvestigationChange('PreventiveActionsProposed', e.target.value)}
                        placeholder="Proposed actions to prevent recurrence..."
                        style={{
                          width: '100%', padding: '10px 14px',
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          border: investigationErrors.PreventiveActionsProposed ? '1px solid var(--color-danger, #ef4444)' : '1px solid var(--glass-border)',
                          borderRadius: '8px', color: 'var(--text-primary)', resize: 'vertical', outline: 'none'
                        }}
                      />
                    </FormField>
                  </div>
                </div>
                <button type="submit" className="btn-primary" disabled={submittingInvestigation} style={{ padding: '10px 24px' }}>
                  {submittingInvestigation ? t('issues.savingInvestigation', 'Saving...') : t('issues.saveInvestigation', 'Save Investigation')}
                </button>
              </form>
            )}

            {investigations.length === 0 && !showInvestigationForm ? (
              <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '30px' }}>{t('issues.noInvestigations', 'No investigation records. Click "New Investigation" to document root cause analysis.')}</p>
            ) : (
              investigations.map((inv, idx) => (
                <div key={inv.RootCauseID || idx} style={{ padding: '18px', marginBottom: '14px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
                  <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '10px' }}>{inv.RootCauseSummary}</div>
                  {inv.RootCauseDetails && <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '12px' }}>{inv.RootCauseDetails}</p>}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {inv.CorrectiveActionsTaken && (
                      <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(34, 197, 94, 0.06)', border: '1px solid rgba(34, 197, 94, 0.15)' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#4ade80', marginBottom: '4px', textTransform: 'uppercase' }}>{t('issues.correctiveActions', 'Corrective Actions')}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{inv.CorrectiveActionsTaken}</div>
                      </div>
                    )}
                    {inv.PreventiveActionsProposed && (
                      <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(59, 130, 246, 0.06)', border: '1px solid rgba(59, 130, 246, 0.15)' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#60a5fa', marginBottom: '4px', textTransform: 'uppercase' }}>{t('issues.preventiveActions', 'Preventive Actions')}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{inv.PreventiveActionsProposed}</div>
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={12} /> {t('issues.investigator', 'Investigator')}: {inv.InvestigatorName || 'N/A'} · {formatDate(inv.CreatedDate)}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Resolution Section */}
        {activeSection === 'resolution' && (
          <div className="glass-panel" style={{ padding: '28px', borderRadius: 'var(--border-radius-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wrench size={18} style={{ color: '#10b981' }} /> {t('issues.resolutionRecords', 'Resolution Records')}
              </h3>
              {d.StatusCode !== 'CLOSED' && d.StatusCode !== 'CANCELLED' && !isTenantRep && (
                <button
                  className="btn-primary"
                  onClick={() => setShowResolutionForm(!showResolutionForm)}
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  {showResolutionForm ? t('common.cancel', 'Cancel') : t('issues.addResolution', '+ Add Resolution')}
                </button>
              )}
            </div>

            {showResolutionForm && (
              <form onSubmit={handleAddResolution} style={{ marginBottom: '24px', padding: '20px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <FormField
                      label={t('issues.resolutionType', 'Resolution Type')}
                      id="ResolutionTypeCode"
                      required
                      error={resolutionErrors.ResolutionTypeCode}
                    >
                      <select
                        id="ResolutionTypeCode"
                        value={resolutionForm.ResolutionTypeCode}
                        onChange={(e) => handleResolutionChange('ResolutionTypeCode', e.target.value)}
                        style={{
                          width: '100%', padding: '10px 14px',
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          border: resolutionErrors.ResolutionTypeCode ? '1px solid var(--color-danger, #ef4444)' : '1px solid var(--glass-border)',
                          borderRadius: '8px', color: 'var(--text-primary)'
                        }}
                      >
                        <option value="PERMANENT_FIX">Permanent Fix</option>
                        <option value="WORKAROUND">Workaround</option>
                        <option value="REPLACEMENT">Replacement</option>
                      </select>
                    </FormField>
                  </div>

                  <div>
                    <FormField
                      label={t('issues.resolutionSummary', 'Resolution Summary')}
                      id="ResolutionSummary"
                      required
                      error={resolutionErrors.ResolutionSummary}
                      helpText="Brief description of what was resolved (5-1000 characters)."
                    >
                      <input
                        id="ResolutionSummary"
                        type="text"
                        value={resolutionForm.ResolutionSummary}
                        onChange={(e) => handleResolutionChange('ResolutionSummary', e.target.value)}
                        placeholder="Brief summary of what was resolved..."
                        style={{
                          width: '100%', padding: '10px 14px',
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          border: resolutionErrors.ResolutionSummary ? '1px solid var(--color-danger, #ef4444)' : '1px solid var(--glass-border)',
                          borderRadius: '8px', color: 'var(--text-primary)', outline: 'none'
                        }}
                      />
                    </FormField>
                  </div>

                  <div>
                    <FormField
                      label={t('issues.actionStepsTaken', 'Action Steps Taken')}
                      id="ActionStepsTaken"
                      error={resolutionErrors.ActionStepsTaken}
                    >
                      <textarea
                        id="ActionStepsTaken"
                        rows={2}
                        value={resolutionForm.ActionStepsTaken}
                        onChange={(e) => handleResolutionChange('ActionStepsTaken', e.target.value)}
                        placeholder="Numbered steps taken to resolve..."
                        style={{
                          width: '100%', padding: '10px 14px',
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          border: resolutionErrors.ActionStepsTaken ? '1px solid var(--color-danger, #ef4444)' : '1px solid var(--glass-border)',
                          borderRadius: '8px', color: 'var(--text-primary)', resize: 'vertical', outline: 'none'
                        }}
                      />
                    </FormField>
                  </div>

                  <div>
                    <FormField
                      label={t('issues.verificationNotes', 'Verification Notes')}
                      id="VerificationNotes"
                      error={resolutionErrors.VerificationNotes}
                    >
                      <textarea
                        id="VerificationNotes"
                        rows={2}
                        value={resolutionForm.VerificationNotes}
                        onChange={(e) => handleResolutionChange('VerificationNotes', e.target.value)}
                        placeholder="How resolution was tested and verified..."
                        style={{
                          width: '100%', padding: '10px 14px',
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          border: resolutionErrors.VerificationNotes ? '1px solid var(--color-danger, #ef4444)' : '1px solid var(--glass-border)',
                          borderRadius: '8px', color: 'var(--text-primary)', resize: 'vertical', outline: 'none'
                        }}
                      />
                    </FormField>
                  </div>
                </div>
                <button type="submit" className="btn-primary" disabled={submittingResolution} style={{ padding: '10px 24px' }}>
                  {submittingResolution ? t('issues.savingInvestigation', 'Saving...') : t('issues.saveResolution', 'Save Resolution')}
                </button>
              </form>
            )}

            {resolutions.length === 0 && !showResolutionForm ? (
              <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '30px' }}>{t('issues.noResolutions', 'No resolution records. Click "Add Resolution" to document the solution.')}</p>
            ) : (
              resolutions.map((res, idx) => (
                <div key={res.ResolutionID || idx} style={{ padding: '18px', marginBottom: '14px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <CheckCircle2 size={18} style={{ color: '#4ade80' }} />
                    <span style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)' }}>{res.ResolutionSummary}</span>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '700', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                      {res.ResolutionTypeCode?.replace('_', ' ')}
                    </span>
                  </div>
                  {res.ActionStepsTaken && <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '8px', whiteSpace: 'pre-wrap' }}>{res.ActionStepsTaken}</p>}
                  {res.VerificationNotes && (
                    <div style={{ padding: '10px', borderRadius: '6px', backgroundColor: 'rgba(59, 130, 246, 0.06)', border: '1px solid rgba(59, 130, 246, 0.15)', marginBottom: '8px' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#60a5fa', marginBottom: '4px', textTransform: 'uppercase' }}>{t('issues.verificationNotes', 'Verification Notes')}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{res.VerificationNotes}</div>
                    </div>
                  )}
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={12} /> {t('issues.resolvedBy', 'Resolved by')}: {res.ResolverName || 'N/A'} · {formatDate(res.CreatedDate || res.ResolvedDateTime)}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Comments / Discussion Section */}
        {activeSection === 'comments' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <ConversationPanel
              issueRequestId={d.IssueRequestID || issue?.IssueRequestID || issue?.RequestID}
              currentUserId={user?.UserID || user?.userId || user?.id}
            />

            {!isTenantRep && (
              <InternalNotesPanel
                requestId={d.IssueRequestID || issue?.IssueRequestID || issue?.RequestID}
              />
            )}
          </div>
        )}



        {/* ── Attachments & Linked Documents Section ── */}
        {activeSection === 'attachments' && (
          <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--border-radius-md)' }}>
            <DocumentMediaReader
              documents={documents}
              canUpload={true}
              onUpload={() => setShowAddDocModal(true)}
            />

            {/* Quick Upload Modal */}
            {showAddDocModal && (
              <div style={{ position: 'fixed', inset: 0, background: 'var(--modal-backdrop, rgba(16, 20, 24, 0.78))', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <div className="glass-panel" style={{ width: '100%', maxWidth: '460px', padding: '24px', borderRadius: '16px' }}>
                  <h4 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 700 }}>{t('issues.attachFileToIssue', 'Attach File to Issue')} #{issueId}</h4>
                  <form onSubmit={handleUploadAttachment} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>{t('issues.selectFile', 'Select File')}</label>
                      <input
                        type="file"
                        required
                        onChange={(e) => setNewDocFile(e.target.files[0])}
                        style={{ width: '100%', padding: '8px', borderRadius: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>{t('issues.docTitleOptional', 'Document Title (optional)')}</label>
                      <input
                        type="text"
                        placeholder="e.g. Photo of HVAC leak"
                        value={newDocTitle}
                        onChange={(e) => setNewDocTitle(e.target.value)}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                      <button type="button" onClick={() => setShowAddDocModal(false)} style={{ padding: '8px 16px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', cursor: 'pointer' }}>{t('common.cancel', 'Cancel')}</button>
                      <button type="submit" disabled={uploadingDoc} style={{ padding: '8px 20px', borderRadius: '8px', background: 'var(--accent-gradient)', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                        {uploadingDoc ? t('issues.uploading', 'Uploading...') : t('issues.uploadAndAttach', 'Upload & Attach')}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

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

      {/* ── Satisfaction Rating & Confirmation Modal ── */}
      {showFeedbackModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--modal-backdrop, rgba(16, 20, 24, 0.78))', backdropFilter: 'blur(8px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', padding: '28px', borderRadius: '20px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                  <Star size={20} fill="#f59e0b" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>{t('issues.tenantFeedbackAndConfirmation', 'Tenant Feedback & Confirmation')}</h3>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>Issue #{d.RequestNumber}</p>
                </div>
              </div>
              <button onClick={() => setShowFeedbackModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitFeedback} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Overall Star Rating */}
              <div style={{ textAlign: 'center', padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                  {t('issues.overallSatisfaction', 'Overall Satisfaction Rating *')}
                </label>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                  {[1, 2, 3, 4, 5].map(star => {
                    const isFilled = (hoverRating || feedbackForm.Rating) >= star;
                    return (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setFeedbackForm(prev => ({ ...prev, Rating: star }))}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px',
                          transform: isFilled ? 'scale(1.15)' : 'scale(1)',
                          transition: 'transform 0.15s ease'
                        }}
                      >
                        <Star
                          size={28}
                          fill={isFilled ? '#f59e0b' : 'none'}
                          color={isFilled ? '#f59e0b' : 'var(--text-muted)'}
                        />
                      </button>
                    );
                  })}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 700, marginTop: '6px' }}>
                  {feedbackForm.Rating === 5 ? 'Excellent — Highly Satisfied' :
                   feedbackForm.Rating === 4 ? 'Good — Satisfied' :
                   feedbackForm.Rating === 3 ? 'Average — Acceptable' :
                   feedbackForm.Rating === 2 ? 'Poor — Needs Improvement' : 'Very Poor'}
                </div>
                {feedbackErrors.Rating && (
                  <div style={{ color: 'var(--color-danger, #ef4444)', fontSize: '0.78rem', fontWeight: 600, marginTop: '6px' }}>
                    {feedbackErrors.Rating}
                  </div>
                )}
              </div>

              {/* Resolution Confirmed Toggle */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  {t('issues.wasIssueResolved', 'Was your issue resolved satisfactorily?')}
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setFeedbackForm(prev => ({ ...prev, ResolutionConfirmed: true }))}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '10px',
                      border: feedbackForm.ResolutionConfirmed ? '1px solid #22c55e' : '1px solid var(--glass-border)',
                      background: feedbackForm.ResolutionConfirmed ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255,255,255,0.03)',
                      color: feedbackForm.ResolutionConfirmed ? '#4ade80' : 'var(--text-secondary)',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <CheckCircle2 size={16} /> {t('issues.yesResolved', 'Yes, Issue Resolved')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedbackForm(prev => ({ ...prev, ResolutionConfirmed: false }))}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '10px',
                      border: !feedbackForm.ResolutionConfirmed ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                      background: !feedbackForm.ResolutionConfirmed ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.03)',
                      color: !feedbackForm.ResolutionConfirmed ? '#f87171' : 'var(--text-secondary)',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <XCircle size={16} /> {t('issues.noStillIssues', 'No, Still Having Issues')}
                  </button>
                </div>
              </div>

              {/* Specific ratings */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    {t('issues.responseTimeliness', 'Response Timeliness')}
                  </label>
                  <select
                    value={feedbackForm.TimelinessRating}
                    onChange={(e) => setFeedbackForm(prev => ({ ...prev, TimelinessRating: Number(e.target.value) }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                  >
                    <option value={5}>5 - Very Fast</option>
                    <option value={4}>4 - Fast</option>
                    <option value={3}>3 - On Time</option>
                    <option value={2}>2 - Delayed</option>
                    <option value={1}>1 - Unacceptable</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    {t('issues.technicalQuality', 'Technical Quality')}
                  </label>
                  <select
                    value={feedbackForm.QualityRating}
                    onChange={(e) => setFeedbackForm(prev => ({ ...prev, QualityRating: Number(e.target.value) }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                  >
                    <option value={5}>5 - High Quality</option>
                    <option value={4}>4 - Good Quality</option>
                    <option value={3}>3 - Average</option>
                    <option value={2}>2 - Substandard</option>
                    <option value={1}>1 - Defective</option>
                  </select>
                </div>
              </div>

              {/* Feedback comments */}
              <FormField
                label={t('issues.feedbackCommentsOptional', 'Comments & Feedback (optional)')}
                id="feedbackComments"
                error={feedbackErrors.Comments}
              >
                <textarea
                  id="feedbackComments"
                  rows={3}
                  value={feedbackForm.Comments}
                  onChange={(e) => {
                    setFeedbackForm(prev => ({ ...prev, Comments: e.target.value }));
                    if (feedbackErrors.Comments) setFeedbackErrors(prev => ({ ...prev, Comments: null }));
                  }}
                  placeholder="Share details regarding the maintenance or resolution experience..."
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '8px',
                    background: 'var(--bg-tertiary)',
                    border: feedbackErrors.Comments ? '1px solid var(--color-danger, #ef4444)' : '1px solid var(--glass-border)',
                    color: 'var(--text-primary)', fontSize: '0.85rem', resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
              </FormField>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowFeedbackModal(false)}
                  style={{ padding: '9px 18px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submittingFeedback}
                  style={{ padding: '9px 24px', borderRadius: '8px', background: 'var(--accent-gradient)', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <CheckCircle2 size={16} /> {submittingFeedback ? t('issues.submittingFeedback', 'Submitting...') : t('issues.submitAndClose', 'Submit Feedback & Close Ticket')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Approval Detail Modal ── */}
      {showApprovalModal && approvalWorkflow && (
        <ApprovalDetailModal
          isOpen={showApprovalModal}
          onClose={() => setShowApprovalModal(false)}
          approval={approvalWorkflow}
          onSubmitDecision={async (decisionData) => {
            await approvalApi.submitDecision(decisionData);
            setShowApprovalModal(false);
            await fetchAllData();
            onRefresh?.();
          }}
        />
      )}

      {/* ── Manual Dispatch Assignment Modal ── */}
      {showAssignModal && (
        <ManualAssignModal
          request={d}
          onClose={() => setShowAssignModal(false)}
          onAssigned={() => {
            setShowAssignModal(false);
            fetchAllData();
            onRefresh?.();
          }}
        />
      )}
    </div>
  );
};

export default IssueDetailView;
