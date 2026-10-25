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
  X,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Lock,
  CheckCheck,
  Filter,
  Layers,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Terminal,
  Award,
  GitCommit,
  TrendingUp,
  Activity
} from 'lucide-react';
import issueManagementApi from '../api/issueManagementApi';
import fileDocumentApi from '../../file-document/api/fileDocumentApi';
import DocumentMediaReader from '../../file-document/components/DocumentMediaReader';
import ConfirmDialogModal from '../../../components/common/ConfirmDialogModal';
import AlertDialogModal from '../../../components/common/AlertDialogModal';
import { requestSchemas } from '../../../validation';
import { FormField } from '../../../components/common/FormField';
import { usePermissionContext } from '../../role-permission-management/contexts/PermissionContext';
import { STORAGE_KEYS } from '../../authentication/constants/authConstants';
import approvalApi from '../../approval/api/approvalApi';
import ApprovalDetailModal from '../../approval/components/ApprovalDetailModal';
import ManualAssignModal from '../../dispatch/components/ManualAssignModal';
import ConversationPanel from '../../communication/components/ConversationPanel';
import InternalNotesPanel from '../../communication/components/InternalNotesPanel';
import { useTranslation } from '../../../i18n';
import { getServerBaseUrl } from '../../../api/client';

// Token retrieval helper
const getToken = () => {
  return (
    sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) ||
    localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) ||
    sessionStorage.getItem('token') ||
    localStorage.getItem('token') ||
    ''
  );
};

// Check if a document is an image
const isImageDoc = (doc) => {
  if (!doc) return false;
  const mime = (doc.MimeType || '').toLowerCase();
  const ext = (doc.FileExtension || (doc.FileName || '').split('.').pop() || '').toLowerCase();
  return mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp'].includes(ext);
};

// Construct authenticated stream preview URL
const getDocumentPreviewUrl = (doc) => {
  if (!doc) return '';
  const id = doc.DocumentID || doc.DocumentUUID;
  const token = getToken();
  return `${getServerBaseUrl()}/api/documents/${id}/preview?token=${encodeURIComponent(token)}`;
};

// Format file size
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// Humanized relative time
const formatRelativeTime = (dateStr) => {
  if (!dateStr) return '';
  const now = new Date();
  const past = new Date(dateStr);
  const diffSec = Math.floor((now - past) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return past.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

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

  // Evidence Photos Lightbox & Timeline Filter State
  const [lightboxDoc, setLightboxDoc] = useState(null);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [lightboxRotation, setLightboxRotation] = useState(0);
  const [timelineFilter, setTimelineFilter] = useState('ALL'); // 'ALL' | 'STATUS' | 'ASSIGNMENT' | 'APPROVAL'
  const [discussionSubTab, setDiscussionSubTab] = useState('public'); // 'public' | 'notes'

  const issueId = issue?.IssueRequestID;

  // Filter attached images vs other documents
  const imageDocuments = documents.filter(isImageDoc);
  const otherDocuments = documents.filter(d => !isImageDoc(d));

  const openLightbox = (doc) => {
    setLightboxDoc(doc);
    setLightboxZoom(1);
    setLightboxRotation(0);
  };

  const closeLightbox = () => {
    setLightboxDoc(null);
    setLightboxZoom(1);
    setLightboxRotation(0);
  };

  const nextLightboxImage = () => {
    if (!lightboxDoc || imageDocuments.length <= 1) return;
    const currentId = lightboxDoc.DocumentID || lightboxDoc.DocumentUUID;
    const idx = imageDocuments.findIndex(d => (d.DocumentID || d.DocumentUUID) === currentId);
    const nextIdx = (idx + 1) % imageDocuments.length;
    setLightboxDoc(imageDocuments[nextIdx]);
    setLightboxZoom(1);
    setLightboxRotation(0);
  };

  const prevLightboxImage = () => {
    if (!lightboxDoc || imageDocuments.length <= 1) return;
    const currentId = lightboxDoc.DocumentID || lightboxDoc.DocumentUUID;
    const idx = imageDocuments.findIndex(d => (d.DocumentID || d.DocumentUUID) === currentId);
    const prevIdx = (idx - 1 + imageDocuments.length) % imageDocuments.length;
    setLightboxDoc(imageDocuments[prevIdx]);
    setLightboxZoom(1);
    setLightboxRotation(0);
  };

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

  const refreshDocuments = async () => {
    try {
      const docRes = await fileDocumentApi.getDocuments({ entityRefType: 'ISSUE_REQUEST', entityRefId: issueId });
      const docs = docRes.data?.data?.documents || [];
      setDocuments(docs);
    } catch (err) {
      console.error('Refresh documents failed:', err);
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
    const s = (status || '').toUpperCase();
    const clsMap = {
      NEW: 'status-new',
      PENDING_APPROVAL: 'status-pending-approval',
      APPROVED: 'status-resolved',
      ASSIGNED: 'status-assigned',
      IN_PROGRESS: 'status-in-progress',
      PENDING: 'status-pending',
      RESOLVED: 'status-resolved',
      CLOSED: 'status-closed',
      CANCELLED: 'status-cancelled'
    };
    return (
      <span className={`status-badge ${clsMap[s] || 'status-new'}`}>
        {status?.replace('_', ' ')}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const p = (priority || '').toUpperCase();
    const clsMap = {
      CRITICAL: 'priority-critical',
      HIGH: 'priority-high',
      MEDIUM: 'priority-medium',
      LOW: 'priority-low'
    };
    return (
      <span className={`priority-chip ${clsMap[p] || 'priority-medium'}`}>
        {priority}
      </span>
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const sectionBtnStyle = (isActive) => ({
    padding: '10px 18px',
    backgroundColor: isActive ? 'var(--color-elevated)' : 'transparent',
    border: 'none',
    borderBottom: isActive ? '3px solid var(--color-primary)' : '3px solid transparent',
    borderRadius: '8px 8px 0 0',
    color: isActive ? 'var(--color-text)' : 'var(--color-text-secondary)',
    fontWeight: isActive ? '700' : '500',
    fontSize: '0.88rem',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
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
      <button onClick={onBack} className="btn btn-secondary" style={{ alignSelf: 'flex-start' }}>
        <ArrowLeft size={16} style={{ transform: isRTL ? 'rotate(180deg)' : 'none' }} /> {t('issues.backToRequests', 'Back to Requests')}
      </button>

      {/* Issue Header Card */}
      <div className="enterprise-card p-4 sm:p-6 lg:p-7">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4.5 mt-5 pt-4 border-t border-[var(--glass-border)]">
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

        {/* ── Real-Time Request Progress & Status Announcement Card ── */}
        {(() => {
          let custom = {};
          try {
            custom = d.CustomFieldsDataJson
              ? (typeof d.CustomFieldsDataJson === 'string' ? JSON.parse(d.CustomFieldsDataJson) : d.CustomFieldsDataJson)
              : {};
          } catch (e) {}

          const pct = custom.progressPercentage !== undefined
            ? Number(custom.progressPercentage)
            : (d.StatusCode === 'RESOLVED' || d.StatusCode === 'CLOSED' ? 100 : (d.StatusCode === 'IN_PROGRESS' ? 35 : (d.StatusCode === 'ASSIGNED' ? 15 : (d.StatusCode === 'APPROVED' ? 10 : 0))));

          const milestone = custom.progressMilestone || (
            d.StatusCode === 'NEW' ? 'Registered & Awaiting Initial Review' :
            d.StatusCode === 'PENDING_APPROVAL' ? 'Under Management Approval Review' :
            d.StatusCode === 'APPROVED' ? 'Approved & Queued for Technician Dispatch' :
            d.StatusCode === 'ASSIGNED' ? 'Technician Assigned & En Route' :
            d.StatusCode === 'IN_PROGRESS' ? 'Active Field Execution' :
            d.StatusCode === 'PENDING' ? 'Work On Hold / Awaiting Parts' :
            d.StatusCode === 'RESOLVED' ? 'Service Completed - Ready for Sign-Off' :
            d.StatusCode === 'CLOSED' ? 'Officially Verified & Closed' :
            'Active Request'
          );

          const notes = custom.latestProgressNotes || '';
          const lastUpdated = custom.lastProgressUpdatedAt;

          const getStatusTheme = (status) => {
            switch (status) {
              case 'RESOLVED':
              case 'CLOSED':
                return { bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.3)', color: '#10b981', gradient: 'linear-gradient(90deg, #10b981, #059669)' };
              case 'IN_PROGRESS':
                return { bg: 'rgba(99, 102, 241, 0.08)', border: 'rgba(99, 102, 241, 0.3)', color: '#818cf8', gradient: 'linear-gradient(90deg, #6366f1, #3b82f6)' };
              case 'PENDING':
                return { bg: 'rgba(245, 158, 11, 0.08)', border: 'rgba(245, 158, 11, 0.3)', color: '#f59e0b', gradient: 'linear-gradient(90deg, #f59e0b, #d97706)' };
              case 'APPROVED':
              case 'ASSIGNED':
                return { bg: 'rgba(59, 130, 246, 0.08)', border: 'rgba(59, 130, 246, 0.3)', color: '#60a5fa', gradient: 'linear-gradient(90deg, #3b82f6, #06b6d4)' };
              default:
                return { bg: 'rgba(255, 255, 255, 0.03)', border: 'var(--glass-border)', color: 'var(--text-secondary)', gradient: 'linear-gradient(90deg, #64748b, #475569)' };
            }
          };

          const theme = getStatusTheme(d.StatusCode);

          return (
            <div style={{
              marginTop: '22px', padding: '18px 20px', borderRadius: '16px',
              background: theme.bg, border: `1.5px solid ${theme.border}`,
              display: 'flex', flexDirection: 'column', gap: '12px',
              boxShadow: d.StatusCode === 'IN_PROGRESS' ? '0 0 20px rgba(99, 102, 241, 0.12)' : 'none'
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={18} color={theme.color} />
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: theme.color }}>
                    Live Request Progress & Execution Status
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {lastUpdated && (
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      Updated {formatRelativeTime(lastUpdated)}
                    </span>
                  )}
                  <span style={{
                    fontSize: '0.9rem', fontWeight: 900, color: theme.color,
                    padding: '2px 10px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.08)'
                  }}>
                    {pct}% Complete
                  </span>
                </div>
              </div>

              {/* Progress Track */}
              <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{
                  width: `${pct}%`, height: '100%',
                  background: theme.gradient, borderRadius: '999px',
                  transition: 'width 0.5s ease-in-out'
                }} />
              </div>

              {/* Current Milestone & Notes */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>
                    Current Milestone Stage
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Activity size={14} color={theme.color} /> {milestone.replace(/_/g, ' ')}
                  </div>
                </div>

                {notes && (
                  <div style={{
                    flex: 1, minWidth: '260px', padding: '8px 12px', borderRadius: '10px',
                    background: 'rgba(0, 0, 0, 0.15)', borderLeft: `3px solid ${theme.color}`,
                    fontSize: '0.82rem', color: 'var(--text-secondary)'
                  }}>
                    <strong style={{ color: 'var(--text-primary)' }}>Technician Note:</strong> "{notes}"
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* ── Attached Evidence & Photos Strip ── */}
        <div style={{ marginTop: '22px', paddingTop: '18px', borderTop: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                <ImageIcon size={16} />
              </div>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {t('issues.evidencePhotos', 'Attached Evidence & Media Photos')}
              </h4>
              <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '12px', background: 'var(--color-elevated)', border: '1px solid var(--color-border)', color: 'var(--text-secondary)', fontWeight: 700 }}>
                {imageDocuments.length} {imageDocuments.length === 1 ? 'image' : 'images'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowAddDocModal(true)}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '6px 12px' }}
            >
              <Upload size={13} /> {t('issues.attachEvidence', 'Attach Photo / Evidence')}
            </button>
          </div>

          {imageDocuments.length === 0 ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px',
              padding: '14px 18px', borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px dashed var(--color-border)',
              fontSize: '0.85rem', color: 'var(--text-muted)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ImageIcon size={18} style={{ color: 'var(--text-muted)' }} />
                <span>{t('issues.noImagesAttached', 'No evidence images attached yet. Visual proof speeds up technician diagnostics.')}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAddDocModal(true)}
                style={{
                  background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 700,
                  fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                }}
              >
                <Plus size={14} /> {t('issues.uploadNow', 'Upload Photo')}
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '14px' }}>
              {imageDocuments.map((doc, idx) => {
                const docId = doc.DocumentID || doc.DocumentUUID;
                const previewUrl = getDocumentPreviewUrl(doc);
                const ext = (doc.FileExtension || (doc.FileName || '').split('.').pop() || 'IMG').toUpperCase();
                return (
                  <div key={docId || idx} className="evidence-card">
                    <div className="evidence-thumbnail-wrapper">
                      <img
                        src={previewUrl}
                        alt={doc.Title || doc.FileName || 'Evidence Image'}
                        className="evidence-thumbnail"
                        loading="lazy"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      <div className="evidence-overlay">
                        <button
                          type="button"
                          className="evidence-btn-action"
                          onClick={() => openLightbox(doc)}
                          title="View Full Resolution"
                        >
                          <Eye size={16} />
                        </button>
                        <a
                          href={previewUrl}
                          download={doc.FileName || 'evidence.jpg'}
                          className="evidence-btn-action"
                          title="Download Image"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Download size={15} />
                        </a>
                      </div>
                      <span style={{
                        position: 'absolute', top: '8px', right: '8px',
                        fontSize: '0.65rem', fontWeight: 800, padding: '2px 6px',
                        borderRadius: '4px', background: 'rgba(0,0,0,0.65)', color: '#fff',
                        backdropFilter: 'blur(4px)'
                      }}>
                        {ext}
                      </span>
                    </div>
                    <div style={{ padding: '10px 12px', background: 'var(--color-surface)' }}>
                      <div style={{
                        fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                      }} title={doc.Title || doc.FileName}>
                        {doc.Title || doc.FileName}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        <span>{formatFileSize(doc.FileSizeBytes)}</span>
                        <span>{formatRelativeTime(doc.CreatedDate)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Multi-Level Approval & Assignment Workflow Pipeline Tracker ── */}
      <div className="glass-panel p-4 sm:p-6 lg:p-7" style={{
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-3.5">
          {/* Step 1: Submission & Department Determination */}
          <div className="workflow-step-tile">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800 }}>
                ✓
              </div>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text)' }}>{t('issues.stepSubmitted', '1. Submitted')}</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
              Routed to <strong style={{ color: 'var(--color-text)' }}>{d.AssignedDepartmentName || 'Department'}</strong>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
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
              <div className={`workflow-step-tile ${isPending ? 'step-active' : ''}`} style={{
                background: isPending ? 'rgba(245, 158, 11, 0.08)' : undefined,
                border: isPending ? '1.5px solid #f59e0b' : isApproved ? '1px solid rgba(16, 185, 129, 0.35)' : undefined
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%',
                    background: isApproved ? '#10b981' : isRejected ? '#ef4444' : isPending ? '#f59e0b' : '#64748b',
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800
                  }}>
                    {isApproved ? '✓' : isRejected ? '✕' : '2'}
                  </div>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text)' }}>{t('issues.stepDeptManager', '2. Dept Manager')}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: isApproved ? '#10b981' : isRejected ? '#ef4444' : isPending ? '#d97706' : 'var(--color-text-secondary)', fontWeight: isPending ? 700 : 500 }}>
                  {isApproved ? `Approved (${st1?.DecisionUserName || 'Manager'})` : isRejected ? 'Rejected' : isPending ? '● Awaiting Dept Review' : 'Pending'}
                </div>
                {st1?.DecisionDateTime && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
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
                <div className="workflow-step-tile" style={{ opacity: 0.65, borderStyle: 'dashed' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#64748b', color: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800 }}>
                      -
                    </div>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>{t('issues.stepParkAdmin', '3. Park Admin')}</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
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
              <div className={`workflow-step-tile ${isPending ? 'step-active' : ''}`} style={{
                background: isPending ? 'rgba(168, 85, 247, 0.08)' : undefined,
                border: isPending ? '1.5px solid #a855f7' : isApproved ? '1px solid rgba(168, 85, 247, 0.35)' : undefined
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%',
                    background: isApproved ? '#a855f7' : isRejected ? '#ef4444' : isPending ? '#8b5cf6' : '#64748b',
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800
                  }}>
                    {isApproved ? '✓' : isRejected ? '✕' : '3'}
                  </div>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text)' }}>{t('issues.stepParkAdmin', '3. Park Admin')}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: isApproved ? '#9333ea' : isRejected ? '#ef4444' : isPending ? '#9333ea' : 'var(--color-text-secondary)', fontWeight: isPending ? 700 : 500 }}>
                  {isApproved ? `Authorized (${st2?.DecisionUserName || 'Admin'})` : isRejected ? 'Rejected by Admin' : isPending ? '● Awaiting Admin Sign-off' : isWaitingStage1 ? 'Queued (Awaiting Dept)' : 'Pending'}
                </div>
                {st2?.DecisionDateTime && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
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
              <div className={`workflow-step-tile ${isAwaitingDispatch ? 'step-active' : ''}`} style={{
                background: isAwaitingDispatch ? 'rgba(16, 185, 129, 0.08)' : undefined,
                border: isAwaitingDispatch ? '1.5px solid #10b981' : isAssigned ? '1px solid rgba(168, 85, 247, 0.35)' : undefined
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%',
                    background: isAssigned ? '#a855f7' : isAwaitingDispatch ? '#10b981' : '#64748b',
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800
                  }}>
                    {isAssigned ? '✓' : '4'}
                  </div>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text)' }}>{t('issues.stepDispatch', '4. Dispatch')}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: isAssigned ? '#9333ea' : isAwaitingDispatch ? '#10b981' : 'var(--color-text-secondary)', fontWeight: isAwaitingDispatch ? 700 : 500 }}>
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
              <div className={`workflow-step-tile ${isInProgress ? 'step-active' : ''}`} style={{
                background: isInProgress ? 'rgba(14, 165, 233, 0.08)' : undefined,
                border: isInProgress ? '1.5px solid #0284c7' : isResolved ? '1px solid rgba(16, 185, 129, 0.35)' : undefined
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%',
                    background: isResolved ? '#10b981' : isInProgress ? '#0284c7' : '#64748b',
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800
                  }}>
                    {isResolved ? '✓' : '5'}
                  </div>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text)' }}>{t('issues.stepResolution', '5. Resolution')}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: isResolved ? '#10b981' : isInProgress ? '#0284c7' : 'var(--color-text-secondary)', fontWeight: isInProgress ? 700 : 500 }}>
                  {isResolved ? 'Resolved' : isInProgress ? '● Field Work Active' : 'Queued'}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* ── Requester Resolution Confirmation Action Alert (when RESOLVED & awaiting confirmation) ── */}
      {d.StatusCode === 'RESOLVED' && !feedback && (
        <div className="glass-panel" style={{
          padding: '16px 22px',
          borderRadius: 'var(--border-radius-md)',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(138, 75, 255, 0.08) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
              <CheckCircle2 size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {t('issues.workCompletedByStaff', 'Work Completed by Field Staff')}
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {t('issues.confirmResolutionPrompt', 'Confirm Resolution & Rate Service Quality')}
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn-primary"
            onClick={() => setActiveSection('resolution')}
            style={{ padding: '8px 18px', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}
          >
            <Star size={15} fill="#fff" /> {t('issues.confirmResolution', 'Confirm Resolution')} &rarr;
          </button>
        </div>
      )}

      {/* ── Modern Interactive Segmented Tabs Navigation ── */}
      <div
        className="enterprise-segmented-tabs"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px',
          borderRadius: '16px',
          background: 'var(--color-surface, rgba(255, 255, 255, 0.04))',
          border: '1px solid var(--color-border, rgba(255, 255, 255, 0.1))',
          boxShadow: 'var(--shadow-sm, 0 2px 8px rgba(0, 0, 0, 0.04))',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          position: 'relative'
        }}
      >
        {/* Tab 1: Timeline */}
        <button
          type="button"
          onClick={() => setActiveSection('timeline')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 18px',
            borderRadius: '11px',
            border: activeSection === 'timeline' ? '1px solid rgba(99, 102, 241, 0.45)' : '1px solid transparent',
            background: activeSection === 'timeline'
              ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.22) 0%, rgba(124, 58, 237, 0.18) 100%)'
              : 'transparent',
            color: activeSection === 'timeline'
              ? 'var(--color-primary, #818cf8)'
              : 'var(--color-text-secondary, #94a3b8)',
            fontWeight: activeSection === 'timeline' ? 800 : 600,
            fontSize: '0.86rem',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            whiteSpace: 'nowrap',
            boxShadow: activeSection === 'timeline' ? '0 2px 10px rgba(99, 102, 241, 0.2)' : 'none'
          }}
        >
          <Clock size={16} />
          <span>Timeline</span>
        </button>

        {/* Tab 2: Investigation */}
        <button
          type="button"
          onClick={() => setActiveSection('investigation')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 18px',
            borderRadius: '11px',
            border: activeSection === 'investigation' ? '1px solid rgba(99, 102, 241, 0.45)' : '1px solid transparent',
            background: activeSection === 'investigation'
              ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.22) 0%, rgba(124, 58, 237, 0.18) 100%)'
              : 'transparent',
            color: activeSection === 'investigation'
              ? 'var(--color-primary, #818cf8)'
              : 'var(--color-text-secondary, #94a3b8)',
            fontWeight: activeSection === 'investigation' ? 800 : 600,
            fontSize: '0.86rem',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            whiteSpace: 'nowrap',
            boxShadow: activeSection === 'investigation' ? '0 2px 10px rgba(99, 102, 241, 0.2)' : 'none'
          }}
        >
          <SearchIcon size={16} />
          <span>Investigation</span>
          <span style={{
            fontSize: '0.72rem',
            fontWeight: 800,
            padding: '2px 7px',
            borderRadius: '12px',
            background: activeSection === 'investigation' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255, 255, 255, 0.08)',
            color: activeSection === 'investigation' ? '#ffffff' : 'var(--color-text-muted, #94a3b8)'
          }}>
            {investigations.length}
          </span>
        </button>

        {/* Tab 3: Resolution */}
        <button
          type="button"
          onClick={() => setActiveSection('resolution')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 18px',
            borderRadius: '11px',
            border: activeSection === 'resolution' ? '1px solid rgba(99, 102, 241, 0.45)' : '1px solid transparent',
            background: activeSection === 'resolution'
              ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.22) 0%, rgba(124, 58, 237, 0.18) 100%)'
              : 'transparent',
            color: activeSection === 'resolution'
              ? 'var(--color-primary, #818cf8)'
              : 'var(--color-text-secondary, #94a3b8)',
            fontWeight: activeSection === 'resolution' ? 800 : 600,
            fontSize: '0.86rem',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            whiteSpace: 'nowrap',
            boxShadow: activeSection === 'resolution' ? '0 2px 10px rgba(99, 102, 241, 0.2)' : 'none'
          }}
        >
          <Wrench size={16} />
          <span>Resolution</span>
          <span style={{
            fontSize: '0.72rem',
            fontWeight: 800,
            padding: '2px 7px',
            borderRadius: '12px',
            background: activeSection === 'resolution' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255, 255, 255, 0.08)',
            color: activeSection === 'resolution' ? '#ffffff' : 'var(--color-text-muted, #94a3b8)'
          }}>
            {resolutions.length}
          </span>
        </button>

        {/* Tab 4: Discussion */}
        <button
          type="button"
          onClick={() => setActiveSection('comments')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 18px',
            borderRadius: '11px',
            border: activeSection === 'comments' ? '1px solid rgba(99, 102, 241, 0.45)' : '1px solid transparent',
            background: activeSection === 'comments'
              ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.22) 0%, rgba(124, 58, 237, 0.18) 100%)'
              : 'transparent',
            color: activeSection === 'comments'
              ? 'var(--color-primary, #818cf8)'
              : 'var(--color-text-secondary, #94a3b8)',
            fontWeight: activeSection === 'comments' ? 800 : 600,
            fontSize: '0.86rem',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            whiteSpace: 'nowrap',
            boxShadow: activeSection === 'comments' ? '0 2px 10px rgba(99, 102, 241, 0.2)' : 'none'
          }}
        >
          <MessageSquare size={16} />
          <span>Discussion</span>
          <span style={{
            fontSize: '0.72rem',
            fontWeight: 800,
            padding: '2px 7px',
            borderRadius: '12px',
            background: activeSection === 'comments' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255, 255, 255, 0.08)',
            color: activeSection === 'comments' ? '#ffffff' : 'var(--color-text-muted, #94a3b8)'
          }}>
            {comments.length}
          </span>
        </button>
      </div>

      {/* Section Content */}
      <div>
        {/* ── 1. Lifecycle Timeline & Audit Trail ── */}
        {activeSection === 'timeline' && (() => {
          const rawEvents = detailData?.timelineHistory || [];
          const filteredEvents = rawEvents.filter(ev => {
            if (timelineFilter === 'ALL') return true;
            if (timelineFilter === 'PROGRESS') return ev.ActionTypeCode === 'PROGRESS_UPDATED' || ev.FieldName === 'ProgressPercentage';
            if (timelineFilter === 'STATUS') return ev.FieldName === 'StatusCode' || (ev.ActionTypeCode || '').includes('STATUS');
            if (timelineFilter === 'ASSIGNMENT') return ev.FieldName?.includes('Assign') || (ev.ActionTypeCode || '').includes('ASSIGN') || (ev.ActionTypeCode || '').includes('DISPATCH');
            if (timelineFilter === 'APPROVAL') return (ev.ActionTypeCode || '').includes('APPROV') || ev.FieldName?.includes('Approval');
            return true;
          });

          // Milestone calculation
          const statusOrder = ['NEW', 'PENDING_APPROVAL', 'APPROVED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
          const currentStatusIdx = statusOrder.indexOf(d.StatusCode);
          const isClosed = d.StatusCode === 'CLOSED';
          const isResolved = d.StatusCode === 'RESOLVED' || isClosed;
          const isAssigned = ['ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(d.StatusCode);
          const isApproved = ['APPROVED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(d.StatusCode);

          return (
            <div className="enterprise-card" style={{ padding: '24px' }}>
              {/* Milestone Progress Bar */}
              <div style={{ marginBottom: '28px', padding: '18px 20px', borderRadius: '14px', background: 'var(--color-elevated)', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--color-primary)' }}>
                    Enterprise ITIL Lifecycle Milestones
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Current State: <strong style={{ color: 'var(--text-primary)' }}>{d.StatusCode?.replace(/_/g, ' ')}</strong>
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                  {[
                    { label: '1. Registered', done: true, active: d.StatusCode === 'NEW' },
                    { label: '2. Review & Approval', done: isApproved, active: d.StatusCode === 'PENDING_APPROVAL' },
                    { label: '3. Technician Dispatch', done: isAssigned, active: d.StatusCode === 'APPROVED' },
                    { label: '4. Resolution Executed', done: isResolved, active: d.StatusCode === 'IN_PROGRESS' },
                    { label: '5. Sign-Off & Closed', done: isClosed, active: d.StatusCode === 'RESOLVED' }
                  ].map((st, sIdx) => (
                    <div key={sIdx} style={{
                      padding: '10px 12px', borderRadius: '10px',
                      background: st.active ? 'var(--color-primary-subtle, rgba(99, 102, 241, 0.12))' : st.done ? 'rgba(34, 197, 94, 0.08)' : 'rgba(255,255,255,0.02)',
                      border: st.active ? '1.5px solid var(--color-primary)' : st.done ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid var(--color-border)',
                      display: 'flex', alignItems: 'center', gap: '8px',
                      transition: 'all 0.2s ease'
                    }}>
                      <div style={{
                        width: '20px', height: '20px', borderRadius: '50%',
                        background: st.done ? '#22c55e' : st.active ? 'var(--color-primary)' : 'var(--color-border)',
                        color: '#fff', fontSize: '11px', fontWeight: 800,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {st.done ? '✓' : sIdx + 1}
                      </div>
                      <span style={{ fontSize: '0.78rem', fontWeight: st.active ? 800 : 600, color: st.active ? 'var(--color-primary)' : st.done ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {st.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Event Stream Filter Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={18} style={{ color: 'var(--accent-primary)' }} /> {t('issues.activityTimeline', 'Activity Timeline & Audit Trail')}
                </h3>

                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {[
                    { id: 'ALL', label: `All Activity (${rawEvents.length})` },
                    { id: 'PROGRESS', label: 'Progress Updates' },
                    { id: 'STATUS', label: 'Status Changes' },
                    { id: 'ASSIGNMENT', label: 'Assignments' },
                    { id: 'APPROVAL', label: 'Approvals' }
                  ].map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setTimelineFilter(f.id)}
                      style={{
                        padding: '4px 10px', borderRadius: '14px', fontSize: '0.75rem', fontWeight: 600,
                        border: timelineFilter === f.id ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                        background: timelineFilter === f.id ? 'var(--color-primary)' : 'var(--color-elevated)',
                        color: timelineFilter === f.id ? '#fff' : 'var(--color-text-secondary)',
                        cursor: 'pointer', transition: 'all 0.15s ease'
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredEvents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                  <Clock size={32} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>{t('issues.noTimelineEvents', 'No timeline events recorded matching the selected filter.')}</p>
                </div>
              ) : (
                <div style={{ position: 'relative', paddingLeft: '32px' }}>
                  {/* Vertical Track Line */}
                  <div style={{
                    position: 'absolute', left: '13px', top: '8px', bottom: '8px',
                    width: '2px', background: 'linear-gradient(180deg, var(--color-primary) 0%, var(--glass-border) 100%)',
                    borderRadius: '2px'
                  }} />

                  {filteredEvents.map((event, idx) => {
                    const isProgress = event.ActionTypeCode === 'PROGRESS_UPDATED' || event.FieldName === 'ProgressPercentage';
                    const isStatus = event.FieldName === 'StatusCode' || (event.ActionTypeCode || '').includes('STATUS');
                    const isAssign = event.FieldName?.includes('Assign') || (event.ActionTypeCode || '').includes('ASSIGN');
                    const isApprov = (event.ActionTypeCode || '').includes('APPROV');

                    return (
                      <div key={event.IssueRequestHistoryID || idx} style={{ position: 'relative', marginBottom: '22px' }}>
                        {/* Event Node Circle */}
                        <div style={{
                          position: 'absolute', left: '-27px', top: '4px',
                          width: '16px', height: '16px', borderRadius: '50%',
                          backgroundColor: idx === 0 ? 'var(--color-primary)' : 'var(--color-surface)',
                          border: `2px solid ${isProgress ? 'var(--color-primary)' : 'var(--color-primary)'}`,
                          boxShadow: idx === 0 ? '0 0 10px rgba(99, 102, 241, 0.6)' : 'none',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }} />

                        {/* Event Card */}
                        <div className="timeline-audit-card">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800,
                                background: isProgress ? 'rgba(99, 102, 241, 0.16)' : isStatus ? 'rgba(59, 130, 246, 0.12)' : isAssign ? 'rgba(168, 85, 247, 0.12)' : isApprov ? 'rgba(34, 197, 94, 0.12)' : 'rgba(255,255,255,0.06)',
                                color: isProgress ? '#a5b4fc' : isStatus ? '#60a5fa' : isAssign ? '#c084fc' : isApprov ? '#4ade80' : 'var(--text-secondary)'
                              }}>
                                {isProgress ? <TrendingUp size={11} /> : isStatus ? <RefreshCw size={11} /> : isAssign ? <Wrench size={11} /> : isApprov ? <Shield size={11} /> : <GitCommit size={11} />}
                                {isProgress ? 'FIELD WORK PROGRESS' : event.ActionTypeCode?.replace(/_/g, ' ')}
                              </span>

                              {event.FieldName && (
                                <span style={{ fontSize: '0.72rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                                  Field: {event.FieldName}
                                </span>
                              )}
                            </div>

                            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                              {formatRelativeTime(event.CreatedDate || event.ActionDateTime)}
                            </span>
                          </div>

                          {/* Transition Visualizer */}
                          {(event.OldValue || event.NewValue) && (
                            <div style={{
                              display: 'inline-flex', alignItems: 'center', gap: '8px',
                              padding: '6px 12px', borderRadius: '8px',
                              background: 'rgba(0,0,0,0.12)', margin: '4px 0 8px', fontSize: '0.82rem'
                            }}>
                              {event.OldValue && (
                                <span style={{ color: '#f87171', fontWeight: 600, textDecoration: 'line-through' }}>
                                  {event.OldValue}
                                </span>
                              )}
                              {event.OldValue && event.NewValue && (
                                <ArrowRight size={13} style={{ color: 'var(--text-muted)' }} />
                              )}
                              {event.NewValue && (
                                <span style={{ color: '#4ade80', fontWeight: 700 }}>
                                  {event.NewValue}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Remarks / Audit Notes */}
                          {event.Remarks && (
                            <div style={{
                              margin: '6px 0 8px', padding: '8px 12px', borderRadius: '6px',
                              background: 'rgba(255, 255, 255, 0.02)', borderLeft: '3px solid var(--color-primary)',
                              fontSize: '0.82rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.5
                            }}>
                              "{event.Remarks}"
                            </div>
                          )}

                          {/* Performer Details Footer */}
                          <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '8px', paddingTop: '6px',
                            borderTop: '1px solid rgba(255,255,255,0.04)', flexWrap: 'wrap', gap: '6px'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div style={{
                                width: '18px', height: '18px', borderRadius: '50%',
                                background: 'var(--color-primary)', color: '#fff', fontSize: '10px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800
                              }}>
                                {(event.PerformedByName || 'S').charAt(0).toUpperCase()}
                              </div>
                              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                {event.PerformedByName || 'System Automation'}
                              </span>
                              {event.PerformedByEmail && <span>({event.PerformedByEmail})</span>}
                            </div>
                            <span>{formatDate(event.CreatedDate || event.ActionDateTime)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* ── 2. Investigation & Root Cause Section ── */}
        {activeSection === 'investigation' && (
          <div className="glass-panel" style={{ padding: '28px', borderRadius: 'var(--border-radius-md)' }}>
            {/* Diagnostic Header & Status */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <SearchIcon size={18} style={{ color: '#f59e0b' }} />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    {t('issues.rootCauseInvestigation', 'Root Cause Investigation & Diagnostics')}
                  </h3>
                  <span style={{
                    fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: '12px',
                    background: investigations.length > 0 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: investigations.length > 0 ? '#4ade80' : '#f59e0b',
                    border: investigations.length > 0 ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)'
                  }}>
                    {investigations.length > 0 ? `✓ ${investigations.length} Diagnostic Findings Documented` : '● Diagnostic In Progress'}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  ISO/IEC 20000 & ITIL standard problem management analysis, acute failure cause, and corrective/preventive actions (CAPA).
                </p>
              </div>

              {d.StatusCode !== 'CLOSED' && d.StatusCode !== 'CANCELLED' && !isTenantRep && (
                <button
                  className="btn-primary"
                  onClick={() => setShowInvestigationForm(!showInvestigationForm)}
                  style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={15} /> {showInvestigationForm ? t('common.cancel', 'Cancel') : t('issues.newInvestigation', 'Document Findings')}
                </button>
              )}
            </div>

            {/* Investigation Form (Staff) */}
            {showInvestigationForm && (
              <form onSubmit={handleAddInvestigation} style={{ marginBottom: '24px', padding: '22px', borderRadius: '12px', backgroundColor: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
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
                        placeholder="e.g. Compressor capacitor degradation due to ambient thermal overload..."
                        className={`enterprise-input ${investigationErrors.RootCauseSummary ? 'input-error' : ''}`}
                      />
                    </FormField>
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <FormField
                      label={t('issues.rootCauseDetails', 'Detailed Investigation Findings & Diagnostics')}
                      id="RootCauseDetails"
                      error={investigationErrors.RootCauseDetails}
                    >
                      <textarea
                        id="RootCauseDetails"
                        rows={3}
                        value={investigationForm.RootCauseDetails}
                        onChange={(e) => handleInvestigationChange('RootCauseDetails', e.target.value)}
                        placeholder="Diagnostic multimeter readings, telemetry logs, inspection notes, component wear analysis..."
                        className="enterprise-input"
                        style={{ resize: 'vertical' }}
                      />
                    </FormField>
                  </div>

                  <div>
                    <FormField
                      label={t('issues.correctiveActions', 'Corrective Actions Taken (Immediate Fix)')}
                      id="CorrectiveActionsTaken"
                      error={investigationErrors.CorrectiveActionsTaken}
                    >
                      <textarea
                        id="CorrectiveActionsTaken"
                        rows={2}
                        value={investigationForm.CorrectiveActionsTaken}
                        onChange={(e) => handleInvestigationChange('CorrectiveActionsTaken', e.target.value)}
                        placeholder="Immediate steps executed to restore normal operations..."
                        className="enterprise-input"
                        style={{ resize: 'vertical' }}
                      />
                    </FormField>
                  </div>

                  <div>
                    <FormField
                      label={t('issues.preventiveActions', 'Preventive Actions Proposed (CAPA Framework)')}
                      id="PreventiveActionsProposed"
                      error={investigationErrors.PreventiveActionsProposed}
                    >
                      <textarea
                        id="PreventiveActionsProposed"
                        rows={2}
                        value={investigationForm.PreventiveActionsProposed}
                        onChange={(e) => handleInvestigationChange('PreventiveActionsProposed', e.target.value)}
                        placeholder="Maintenance schedule adjustments, shielding upgrades, firmware patch to prevent recurrence..."
                        className="enterprise-input"
                        style={{ resize: 'vertical' }}
                      />
                    </FormField>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" onClick={() => setShowInvestigationForm(false)} className="btn btn-secondary">
                    {t('common.cancel', 'Cancel')}
                  </button>
                  <button type="submit" className="btn-primary" disabled={submittingInvestigation} style={{ padding: '9px 22px' }}>
                    {submittingInvestigation ? t('issues.savingInvestigation', 'Saving...') : t('issues.saveInvestigation', 'Save Investigation')}
                  </button>
                </div>
              </form>
            )}

            {/* Empty State: Diagnostic Framework Roadmap */}
            {investigations.length === 0 && !showInvestigationForm ? (
              <div style={{
                padding: '30px', borderRadius: '12px', background: 'var(--color-elevated)',
                border: '1px solid var(--color-border)', textAlign: 'center'
              }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                  <SearchIcon size={24} />
                </div>
                <h4 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Engineering Diagnostic Procedure Active
                </h4>
                <p style={{ margin: '0 auto 20px', maxWidth: '600px', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  Technical specialists perform root cause analysis (5-Whys & failure mode evaluation) for equipment breakdowns and critical incidents. Diagnostic findings, corrective fixes, and long-term preventive actions will appear here upon specialist inspection.
                </p>

                {/* 3-Step Process Guide */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', maxWidth: '750px', margin: '0 auto 20px', textAlign: 'left' }}>
                  <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#f59e0b', marginBottom: '4px' }}>STEP 1: TRIAGE</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Identify symptoms, isolate affected circuits or hardware modules.</div>
                  </div>
                  <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#60a5fa', marginBottom: '4px' }}>STEP 2: ROOT CAUSE</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Determine primary trigger (mechanical, electrical, software, environmental).</div>
                  </div>
                  <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#4ade80', marginBottom: '4px' }}>STEP 3: CAPA ACTION</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Apply immediate repair and establish preventive actions to eliminate recurrence.</div>
                  </div>
                </div>

                {!isTenantRep && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowInvestigationForm(true)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Plus size={14} /> Record Diagnostic Findings Now
                  </button>
                )}
              </div>
            ) : (
              investigations.map((inv, idx) => (
                <div key={inv.RootCauseID || idx} style={{
                  padding: '22px', marginBottom: '16px', borderRadius: '12px',
                  backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
                }}>
                  {/* Top Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Diagnosed Root Cause
                      </span>
                      <h4 style={{ margin: '4px 0 0', fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                        {inv.RootCauseSummary}
                      </h4>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {formatDate(inv.CreatedDate)}
                    </span>
                  </div>

                  {/* Findings / Logs */}
                  {inv.RootCauseDetails && (
                    <div style={{
                      padding: '12px 14px', borderRadius: '8px', background: 'rgba(0,0,0,0.18)',
                      border: '1px solid rgba(255,255,255,0.05)', marginBottom: '14px',
                      fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--text-secondary)',
                      lineHeight: 1.6, whiteSpace: 'pre-wrap'
                    }}>
                      {inv.RootCauseDetails}
                    </div>
                  )}

                  {/* Dual Actions Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginTop: '10px' }}>
                    <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: 'rgba(34, 197, 94, 0.06)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 800, color: '#4ade80', marginBottom: '6px', textTransform: 'uppercase' }}>
                        <CheckCircle2 size={14} /> {t('issues.correctiveActions', 'Corrective Actions Taken (Immediate Fix)')}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {inv.CorrectiveActionsTaken || 'Immediate remediation executed as per protocol.'}
                      </div>
                    </div>

                    <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: 'rgba(59, 130, 246, 0.06)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 800, color: '#60a5fa', marginBottom: '6px', textTransform: 'uppercase' }}>
                        <Shield size={14} /> {t('issues.preventiveActions', 'Preventive Actions Proposed (CAPA Framework)')}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {inv.PreventiveActionsProposed || 'Preventive maintenance schedule updated.'}
                      </div>
                    </div>
                  </div>

                  {/* Investigator Signature */}
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={13} /> {t('issues.investigator', 'Lead Investigator')}: <strong style={{ color: 'var(--text-primary)' }}>{inv.InvestigatorName || 'Engineering Specialist'}</strong>
                    {inv.InvestigatorEmail && <span>({inv.InvestigatorEmail})</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── 3. Resolution Confirmation Section (Direct implementation of user screenshot!) ── */}
        {activeSection === 'resolution' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {/* Part A: Requester Resolution Sign-Off & Service Satisfaction Review */}
            <div className="glass-panel" style={{ padding: '26px 30px', borderRadius: 'var(--border-radius-md)' }}>
              {feedback ? (
                /* Verified Certificate */
                <div className="resolution-certificate">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '6px',
                          padding: '4px 12px', borderRadius: '20px',
                          background: feedback.ResolutionConfirmed ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                          color: feedback.ResolutionConfirmed ? '#4ade80' : '#f87171',
                          fontSize: '0.8rem', fontWeight: 800,
                          border: feedback.ResolutionConfirmed ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)'
                        }}>
                          <CheckCheck size={15} />
                          {feedback.ResolutionConfirmed ? t('issues.confirmedByRequester', 'Resolution Confirmed & Signed Off by Requester') : t('issues.contestedByRequester', 'Resolution Contested by Requester')}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Verified on {formatDate(feedback.CreatedDate)}
                        </span>
                      </div>
                      <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Official Verified Sign-Off & Quality Assessment Certificate
                      </h3>
                    </div>

                    {/* Overall Star Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.35)' }}>
                      <div style={{ display: 'flex', gap: '3px' }}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star
                            key={star}
                            size={18}
                            fill={star <= feedback.Rating ? '#f59e0b' : 'none'}
                            color={star <= feedback.Rating ? '#f59e0b' : 'var(--text-muted)'}
                          />
                        ))}
                      </div>
                      <span style={{ fontWeight: 800, color: '#f59e0b', fontSize: '1rem', marginLeft: '4px' }}>
                        {feedback.Rating}.0 / 5.0
                      </span>
                    </div>
                  </div>

                  {feedback.Comments && (
                    <div style={{
                      margin: '14px 0', padding: '14px 18px', borderRadius: '10px',
                      background: 'rgba(0,0,0,0.18)', borderLeft: '4px solid #f59e0b',
                      fontSize: '0.92rem', color: 'var(--text-primary)', fontStyle: 'italic', lineHeight: 1.6
                    }}>
                      "{feedback.Comments}"
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginTop: '14px' }}>
                    <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Response Timeliness</div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                        {feedback.TimelinessRating || feedback.Rating}/5 ★
                      </div>
                    </div>
                    <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Workmanship & Quality</div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                        {feedback.QualityRating || feedback.Rating}/5 ★
                      </div>
                    </div>
                    <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Verified By</div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                        {feedback.SubmittedByName || d.RequesterName || 'Requester'}
                      </div>
                    </div>
                  </div>
                </div>
              ) : d.StatusCode === 'RESOLVED' ? (
                /* Interactive Requester Sign-off Form */
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontSize: '0.82rem', fontWeight: 800, marginBottom: '4px' }}>
                    <CheckCircle2 size={18} /> {t('issues.workCompletedByStaff', 'Work Completed by Field Staff')}
                  </div>
                  <h3 style={{ margin: '0 0 6px', fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {t('issues.confirmResolutionPrompt', 'Confirm Resolution & Submit Satisfaction Feedback')}
                  </h3>
                  <p style={{ margin: '0 0 20px', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                    {t('issues.confirmResolutionDesc', 'Please confirm that this request was resolved to your satisfaction and rate the maintenance service to close this ticket.')}
                  </p>

                  <form onSubmit={handleSubmitFeedback} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    {/* Toggle: Confirmed vs Contested */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '8px' }}>
                        {t('issues.wasIssueResolved', 'Was your issue resolved satisfactorily?')}
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', maxWidth: '500px' }}>
                        <button
                          type="button"
                          onClick={() => setFeedbackForm(prev => ({ ...prev, ResolutionConfirmed: true }))}
                          style={{
                            padding: '12px 14px', borderRadius: '10px',
                            border: feedbackForm.ResolutionConfirmed ? '2px solid #22c55e' : '1px solid var(--color-border)',
                            background: feedbackForm.ResolutionConfirmed ? 'rgba(34, 197, 94, 0.12)' : 'var(--color-elevated)',
                            color: feedbackForm.ResolutionConfirmed ? '#22c55e' : 'var(--color-text-secondary)',
                            fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                          }}
                        >
                          <CheckCircle2 size={18} /> {t('issues.yesResolved', 'Yes, Fully Resolved')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setFeedbackForm(prev => ({ ...prev, ResolutionConfirmed: false }))}
                          style={{
                            padding: '12px 14px', borderRadius: '10px',
                            border: !feedbackForm.ResolutionConfirmed ? '2px solid #ef4444' : '1px solid var(--color-border)',
                            background: !feedbackForm.ResolutionConfirmed ? 'rgba(239, 68, 68, 0.12)' : 'var(--color-elevated)',
                            color: !feedbackForm.ResolutionConfirmed ? '#f87171' : 'var(--color-text-secondary)',
                            fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                          }}
                        >
                          <XCircle size={18} /> {t('issues.noStillIssues', 'No, Problem Persists')}
                        </button>
                      </div>
                    </div>

                    {/* 5-Star Interactive Rating */}
                    <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--color-elevated)', border: '1px solid var(--color-border)', maxWidth: '500px' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px' }}>
                        {t('issues.overallSatisfaction', 'Overall Satisfaction Rating *')}
                      </label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {[1, 2, 3, 4, 5].map(star => {
                          const isFilled = (hoverRating || feedbackForm.Rating) >= star;
                          return (
                            <button
                              type="button"
                              key={star}
                              onClick={() => setFeedbackForm(prev => ({ ...prev, Rating: star }))}
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(0)}
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
                            >
                              <Star
                                size={26}
                                fill={isFilled ? '#f59e0b' : 'none'}
                                color={isFilled ? '#f59e0b' : 'var(--text-muted)'}
                              />
                            </button>
                          );
                        })}
                        <span style={{ fontSize: '0.85rem', color: '#f59e0b', fontWeight: 800, marginLeft: '8px' }}>
                          {(hoverRating || feedbackForm.Rating) === 5 ? '★ 5 - Outstanding & Exceptional' :
                           (hoverRating || feedbackForm.Rating) === 4 ? '★ 4 - Very Good & Prompt' :
                           (hoverRating || feedbackForm.Rating) === 3 ? '★ 3 - Satisfactory & Acceptable' :
                           (hoverRating || feedbackForm.Rating) === 2 ? '★ 2 - Substandard Experience' :
                           '★ 1 - Unsatisfactory'}
                        </span>
                      </div>
                    </div>

                    {/* Dual Sub-scores */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', maxWidth: '500px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px' }}>
                          {t('issues.responseTimeliness', 'Response Timeliness')}
                        </label>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {[1, 2, 3, 4, 5].map(v => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => setFeedbackForm(prev => ({ ...prev, TimelinessRating: v }))}
                              style={{
                                flex: 1, padding: '7px 0', borderRadius: '6px',
                                border: feedbackForm.TimelinessRating === v ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                                background: feedbackForm.TimelinessRating === v ? 'var(--color-primary)' : 'var(--color-elevated)',
                                color: feedbackForm.TimelinessRating === v ? '#fff' : 'var(--text-secondary)',
                                fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer'
                              }}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px' }}>
                          {t('issues.technicalQuality', 'Technical Quality')}
                        </label>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {[1, 2, 3, 4, 5].map(v => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => setFeedbackForm(prev => ({ ...prev, QualityRating: v }))}
                              style={{
                                flex: 1, padding: '7px 0', borderRadius: '6px',
                                border: feedbackForm.QualityRating === v ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                                background: feedbackForm.QualityRating === v ? 'var(--color-primary)' : 'var(--color-elevated)',
                                color: feedbackForm.QualityRating === v ? '#fff' : 'var(--text-secondary)',
                                fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer'
                              }}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Remarks Textarea */}
                    <div style={{ maxWidth: '600px' }}>
                      <FormField
                        label={t('issues.feedbackCommentsOptional', 'Comments & Observations (Optional)')}
                        id="inTabFeedbackComments"
                      >
                        <textarea
                          id="inTabFeedbackComments"
                          rows={3}
                          value={feedbackForm.Comments}
                          onChange={(e) => setFeedbackForm(prev => ({ ...prev, Comments: e.target.value }))}
                          placeholder="Share observations regarding technician conduct, turnaround speed, or resolution quality..."
                          className="enterprise-input"
                          style={{ resize: 'vertical' }}
                        />
                      </FormField>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        type="submit"
                        disabled={submittingFeedback}
                        className="btn-primary"
                        style={{ padding: '11px 24px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                      >
                        <CheckCircle2 size={16} /> {submittingFeedback ? t('issues.submittingFeedback', 'Submitting...') : t('issues.submitAndClose', 'Confirm Resolution & Close Ticket')}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                /* Ticket not yet resolved */
                <div style={{
                  padding: '22px 26px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(99, 102, 241, 0.04) 100%)',
                  border: '1.5px solid rgba(59, 130, 246, 0.25)',
                  boxShadow: '0 4px 20px rgba(59, 130, 246, 0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{
                        width: '42px', height: '42px', borderRadius: '12px',
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(99, 102, 241, 0.15) 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa',
                        boxShadow: '0 2px 10px rgba(59, 130, 246, 0.2)', flexShrink: 0
                      }}>
                        <Clock size={22} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <h4 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                            Technical Resolution Workflow in Progress
                          </h4>
                          <span style={{
                            fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: '20px',
                            background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)'
                          }}>
                            ● ACTIVE DISPATCH
                          </span>
                        </div>
                        <p style={{ margin: '3px 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                          Once the assigned maintenance team completes field work and marks this ticket as resolved, you can confirm the fix and submit satisfaction feedback right here.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 3-Step Live Progress Stepper */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '10px',
                    paddingTop: '12px',
                    borderTop: '1px solid rgba(59, 130, 246, 0.12)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem' }}>
                      <CheckCircle2 size={15} color="#22c55e" />
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>1. Request Registered</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem' }}>
                      <div style={{ width: '15px', height: '15px', borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 8px #3b82f6' }}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#fff' }} />
                      </div>
                      <span style={{ color: '#60a5fa', fontWeight: 800 }}>2. Diagnostics & Repair Active</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem' }}>
                      <Clock size={15} color="var(--text-muted)" />
                      <span style={{ color: 'var(--text-muted)' }}>3. Requester Sign-off & Review</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Part B: Technical Resolution Documentation & Actions Taken */}
            <div className="glass-panel" style={{ padding: '28px', borderRadius: 'var(--border-radius-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                    <Wrench size={18} style={{ color: '#10b981' }} /> {t('issues.resolutionRecords', 'Technical Resolution Records & Action Steps')}
                  </h3>
                  <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Field technician documentation, repair methodology, replacement parts, and verification testing procedures.
                  </p>
                </div>

                {d.StatusCode !== 'CLOSED' && d.StatusCode !== 'CANCELLED' && !isTenantRep && (
                  <button
                    className="btn-primary"
                    onClick={() => setShowResolutionForm(!showResolutionForm)}
                    style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Plus size={15} /> {showResolutionForm ? t('common.cancel', 'Cancel') : t('issues.addResolution', 'Add Resolution')}
                  </button>
                )}
              </div>

              {/* Add Resolution Form (Staff) */}
              {showResolutionForm && (
                <form onSubmit={handleAddResolution} style={{ marginBottom: '24px', padding: '20px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
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
                          className="enterprise-input"
                        >
                          <option value="PERMANENT_FIX">Permanent Fix</option>
                          <option value="WORKAROUND">Workaround / Temporary Mitigation</option>
                          <option value="REPLACEMENT">Equipment Replacement</option>
                          <option value="CALIBRATION">Re-calibration / Tuning</option>
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
                          placeholder="e.g. Replaced faulty relay and restored stable 240V feed..."
                          className={`enterprise-input ${resolutionErrors.ResolutionSummary ? 'input-error' : ''}`}
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
                          placeholder="Numbered steps taken to resolve (e.g. 1. Power cycled, 2. Rewired terminal...)"
                          className="enterprise-input"
                          style={{ resize: 'vertical' }}
                        />
                      </FormField>
                    </div>

                    <div>
                      <FormField
                        label={t('issues.verificationNotes', 'Verification & Testing Notes')}
                        id="VerificationNotes"
                        error={resolutionErrors.VerificationNotes}
                      >
                        <textarea
                          id="VerificationNotes"
                          rows={2}
                          value={resolutionForm.VerificationNotes}
                          onChange={(e) => handleResolutionChange('VerificationNotes', e.target.value)}
                          placeholder="Testing protocols used (e.g. Temperature held at 21C for 2h without tripping)..."
                          className="enterprise-input"
                          style={{ resize: 'vertical' }}
                        />
                      </FormField>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button type="button" onClick={() => setShowResolutionForm(false)} className="btn btn-secondary">
                      {t('common.cancel', 'Cancel')}
                    </button>
                    <button type="submit" className="btn-primary" disabled={submittingResolution} style={{ padding: '9px 22px' }}>
                      {submittingResolution ? t('issues.savingInvestigation', 'Saving...') : t('issues.saveResolution', 'Save Resolution')}
                    </button>
                  </div>
                </form>
              )}

              {/* Resolution Records List */}
              {resolutions.length === 0 && !showResolutionForm ? (
                <div style={{
                  padding: '36px 24px', textAlign: 'center',
                  background: 'var(--color-elevated, rgba(255, 255, 255, 0.02))',
                  borderRadius: '16px', border: '1px dashed var(--color-border, rgba(255, 255, 255, 0.15))',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px'
                }}>
                  <div style={{
                    width: '52px', height: '52px', borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.12)', color: '#10b981',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid rgba(16, 185, 129, 0.25)'
                  }}>
                    <Wrench size={24} />
                  </div>
                  <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    No Resolution Records Documented Yet
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-muted)', maxWidth: '520px', lineHeight: 1.5 }}>
                    The assigned maintenance technician will log the technical solution, replacement parts, and verification test results upon completing work.
                  </p>
                </div>
              ) : (
                resolutions.map((res, idx) => (
                  <div key={res.ResolutionID || idx} style={{
                    padding: '20px', marginBottom: '14px', borderRadius: '12px',
                    backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                      <CheckCircle2 size={18} style={{ color: '#4ade80' }} />
                      <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                        {res.ResolutionSummary}
                      </span>
                      <span style={{
                        padding: '3px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800,
                        backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)'
                      }}>
                        {res.ResolutionTypeCode?.replace('_', ' ')}
                      </span>
                    </div>

                    {res.ActionStepsTaken && (
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                          Action Steps Taken:
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
                          {res.ActionStepsTaken}
                        </p>
                      </div>
                    )}

                    {res.VerificationNotes && (
                      <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(59, 130, 246, 0.06)', border: '1px solid rgba(59, 130, 246, 0.15)', marginBottom: '12px' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#60a5fa', marginBottom: '4px', textTransform: 'uppercase' }}>
                          {t('issues.verificationNotes', 'Verification & Quality Testing')}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{res.VerificationNotes}</div>
                      </div>
                    )}

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <User size={13} /> {t('issues.resolvedBy', 'Resolved by')}: <strong style={{ color: 'var(--text-primary)' }}>{res.ResolverName || 'Maintenance Specialist'}</strong> · {formatDate(res.CreatedDate || res.ResolvedDateTime)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── 4. Comments & Discussions Section ── */}
        {activeSection === 'comments' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Sub-tab navigation for Staff vs Public */}
            {!isTenantRep && (
              <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
                <button
                  type="button"
                  onClick={() => setDiscussionSubTab('public')}
                  style={{
                    padding: '6px 14px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700,
                    border: discussionSubTab === 'public' ? '1px solid var(--color-primary)' : '1px solid transparent',
                    background: discussionSubTab === 'public' ? 'var(--color-primary)' : 'transparent',
                    color: discussionSubTab === 'public' ? '#fff' : 'var(--text-secondary)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                >
                  <MessageSquare size={14} /> Public Requester Thread
                </button>
                <button
                  type="button"
                  onClick={() => setDiscussionSubTab('notes')}
                  style={{
                    padding: '6px 14px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700,
                    border: discussionSubTab === 'notes' ? '1px solid #f59e0b' : '1px solid transparent',
                    background: discussionSubTab === 'notes' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                    color: discussionSubTab === 'notes' ? '#f59e0b' : 'var(--text-secondary)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                >
                  <Lock size={14} /> Staff Confidential Notes
                </button>
              </div>
            )}

            {discussionSubTab === 'public' || isTenantRep ? (
              <ConversationPanel
                issueRequestId={d.IssueRequestID || issue?.IssueRequestID || issue?.RequestID}
                currentUserId={user?.UserID || user?.userId || user?.id}
                onAttachmentUploaded={refreshDocuments}
              />
            ) : (
              <div>
                <div style={{
                  padding: '10px 16px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.25)', color: '#f59e0b', fontSize: '0.8rem',
                  fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px'
                }}>
                  <Lock size={15} />
                  <span>Confidential Internal Notes — Visible only to Managers, Technicians & Admins (Isolated from Requester).</span>
                </div>
                <InternalNotesPanel
                  requestId={d.IssueRequestID || issue?.IssueRequestID || issue?.RequestID}
                  onAttachmentUploaded={refreshDocuments}
                />
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
        <div 
          onClick={() => setShowFeedbackModal(false)}
          style={{ position: 'fixed', inset: 0, background: 'var(--modal-backdrop, rgba(16, 20, 24, 0.78))', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
          <div 
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-modal-title"
            className="modal-card accent-strip-amber enterprise-card"
            style={{ width: '100%', maxWidth: '520px', padding: '28px', borderRadius: 'var(--border-radius-lg, 18px)', boxShadow: 'var(--modal-shadow, 0 25px 50px -12px rgba(0,0,0,0.5))', position: 'relative' }}
            onClick={(e) => e.stopPropagation()}
          >
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
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: 'var(--color-text-main)' }}>
                  {t('issues.overallSatisfaction', 'Overall Satisfaction Rating *')}
                </label>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
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
                          padding: '6px',
                          transform: isFilled ? 'scale(1.25)' : 'scale(1)',
                          transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}
                        className="hover:scale-125"
                      >
                        <Star
                          size={30}
                          fill={isFilled ? '#f59e0b' : 'none'}
                          color={isFilled ? '#f59e0b' : 'var(--color-text-secondary)'}
                          style={{ filter: isFilled ? 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.45))' : 'none' }}
                        />
                      </button>
                    );
                  })}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#f59e0b', fontWeight: 800, marginTop: '8px' }}>
                  {(hoverRating || feedbackForm.Rating) === 5 ? '★ 5 - Outstanding & Exceptional' :
                   (hoverRating || feedbackForm.Rating) === 4 ? '★ 4 - Very Good & Prompt' :
                   (hoverRating || feedbackForm.Rating) === 3 ? '★ 3 - Satisfactory & Acceptable' :
                   (hoverRating || feedbackForm.Rating) === 2 ? '★ 2 - Substandard Experience' :
                   '★ 1 - Unsatisfactory'}
                </div>
                {feedbackErrors.Rating && (
                  <div style={{ color: 'var(--color-error, #ef4444)', fontSize: '0.78rem', fontWeight: 600, marginTop: '6px' }}>
                    {feedbackErrors.Rating}
                  </div>
                )}
              </div>

              {/* Resolution Confirmed Toggle */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '8px' }}>
                  {t('issues.wasIssueResolved', 'Was your issue resolved satisfactorily?')}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setFeedbackForm(prev => ({ ...prev, ResolutionConfirmed: true }))}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: feedbackForm.ResolutionConfirmed ? '2px solid #22c55e' : '1px solid var(--color-border)',
                      background: feedbackForm.ResolutionConfirmed ? 'rgba(34, 197, 94, 0.12)' : 'var(--color-elevated)',
                      color: feedbackForm.ResolutionConfirmed ? '#22c55e' : 'var(--color-text-secondary)',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease',
                      boxShadow: feedbackForm.ResolutionConfirmed ? '0 0 12px rgba(34, 197, 94, 0.2)' : 'none'
                    }}
                  >
                    <CheckCircle2 size={18} /> {t('issues.yesResolved', 'Yes, Fully Resolved')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedbackForm(prev => ({ ...prev, ResolutionConfirmed: false }))}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: !feedbackForm.ResolutionConfirmed ? '2px solid #ef4444' : '1px solid var(--color-border)',
                      background: !feedbackForm.ResolutionConfirmed ? 'rgba(239, 68, 68, 0.12)' : 'var(--color-elevated)',
                      color: !feedbackForm.ResolutionConfirmed ? '#f87171' : 'var(--color-text-secondary)',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease',
                      boxShadow: !feedbackForm.ResolutionConfirmed ? '0 0 12px rgba(239, 68, 68, 0.2)' : 'none'
                    }}
                  >
                    <XCircle size={18} /> {t('issues.noStillIssues', 'No, Still Experiencing Issues')}
                  </button>
                </div>
              </div>

              {/* Specific interactive ratings */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '6px' }}>
                    {t('issues.responseTimeliness', 'Response Timeliness')}
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[1, 2, 3, 4, 5].map((val) => {
                      const isSel = feedbackForm.TimelinessRating === val;
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setFeedbackForm(prev => ({ ...prev, TimelinessRating: val }))}
                          style={{
                            flex: 1,
                            padding: '8px 0',
                            borderRadius: '8px',
                            border: isSel ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                            background: isSel ? 'var(--color-primary)' : 'var(--color-elevated)',
                            color: isSel ? '#ffffff' : 'var(--color-text-secondary)',
                            fontWeight: 700,
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: '4px', textAlign: 'center' }}>
                    {feedbackForm.TimelinessRating === 5 ? 'Very Prompt' : feedbackForm.TimelinessRating === 1 ? 'Severely Delayed' : `Score: ${feedbackForm.TimelinessRating}/5`}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '6px' }}>
                    {t('issues.technicalQuality', 'Technical Quality')}
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[1, 2, 3, 4, 5].map((val) => {
                      const isSel = feedbackForm.QualityRating === val;
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setFeedbackForm(prev => ({ ...prev, QualityRating: val }))}
                          style={{
                            flex: 1,
                            padding: '8px 0',
                            borderRadius: '8px',
                            border: isSel ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                            background: isSel ? 'var(--color-primary)' : 'var(--color-elevated)',
                            color: isSel ? '#ffffff' : 'var(--color-text-secondary)',
                            fontWeight: 700,
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: '4px', textAlign: 'center' }}>
                    {feedbackForm.QualityRating === 5 ? 'High Quality Fix' : feedbackForm.QualityRating === 1 ? 'Defective' : `Score: ${feedbackForm.QualityRating}/5`}
                  </div>
                </div>
              </div>

              {/* Feedback comments */}
              <FormField
                label={t('issues.feedbackCommentsOptional', 'Comments & Observations (Optional)')}
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
                  placeholder="Share details regarding technician conduct, speed, or equipment resolution..."
                  className={`enterprise-input ${feedbackErrors.Comments ? 'input-error' : ''}`}
                  style={{ resize: 'vertical' }}
                />
              </FormField>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowFeedbackModal(false)}
                  className="btn btn-secondary"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submittingFeedback}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
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
      {/* ── Interactive Fullscreen Image Lightbox Modal ── */}
      {lightboxDoc && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(5, 8, 14, 0.92)',
            backdropFilter: 'blur(12px)',
            zIndex: 2000,
            display: 'flex', flexDirection: 'column'
          }}
          onClick={closeLightbox}
        >
          {/* Lightbox Header Bar */}
          <div
            style={{
              padding: '16px 24px', display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', background: 'rgba(15, 23, 42, 0.85)',
              borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
                <ImageIcon size={18} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: '#f8fafc' }}>
                  {lightboxDoc.Title || lightboxDoc.FileName}
                </h4>
                <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                  <span>{formatFileSize(lightboxDoc.FileSizeBytes)}</span>
                  <span>•</span>
                  <span>{formatDate(lightboxDoc.CreatedDate)}</span>
                  {imageDocuments.length > 1 && (
                    <>
                      <span>•</span>
                      <span>Image {imageDocuments.findIndex(d => (d.DocumentID || d.DocumentUUID) === (lightboxDoc.DocumentID || lightboxDoc.DocumentUUID)) + 1} of {imageDocuments.length}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Action Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <a
                href={getDocumentPreviewUrl(lightboxDoc)}
                download={lightboxDoc.FileName || 'evidence.jpg'}
                className="btn btn-secondary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '6px 14px' }}
                onClick={(e) => e.stopPropagation()}
              >
                <Download size={14} /> Download
              </a>
              <button
                type="button"
                onClick={closeLightbox}
                style={{
                  width: '36px', height: '36px', borderRadius: '8px',
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                  color: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.15s ease'
                }}
                title="Close (Esc)"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Canvas View Area */}
          <div
            style={{
              flex: 1, position: 'relative', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', padding: '30px'
            }}
          >
            {/* Prev Button */}
            {imageDocuments.length > 1 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); prevLightboxImage(); }}
                style={{
                  position: 'absolute', left: '24px', top: '50%', transform: 'translateY(-50%)',
                  width: '44px', height: '44px', borderRadius: '50%',
                  background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.2)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', zIndex: 10, transition: 'all 0.18s ease'
                }}
                title="Previous Image"
              >
                <ChevronLeft size={24} />
              </button>
            )}

            {/* Image display */}
            <img
              src={getDocumentPreviewUrl(lightboxDoc)}
              alt={lightboxDoc.Title || lightboxDoc.FileName}
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: '90%', maxHeight: '82vh',
                objectFit: 'contain',
                transform: `scale(${lightboxZoom}) rotate(${lightboxRotation}deg)`,
                transition: 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8)',
                borderRadius: '8px'
              }}
            />

            {/* Next Button */}
            {imageDocuments.length > 1 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); nextLightboxImage(); }}
                style={{
                  position: 'absolute', right: '24px', top: '50%', transform: 'translateY(-50%)',
                  width: '44px', height: '44px', borderRadius: '50%',
                  background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.2)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', zIndex: 10, transition: 'all 0.18s ease'
                }}
                title="Next Image"
              >
                <ChevronRight size={24} />
              </button>
            )}
          </div>

          {/* Floating Zoom & Rotate Toolbar */}
          <div
            style={{
              padding: '14px 24px', display: 'flex', justifyContent: 'center',
              background: 'rgba(15, 23, 42, 0.85)', borderTop: '1px solid rgba(255,255,255,0.1)',
              gap: '10px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightboxZoom(z => Math.max(0.5, z - 0.25))}
              style={{ padding: '6px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
            >
              <ZoomOut size={15} /> Zoom Out
            </button>
            <button
              type="button"
              onClick={() => { setLightboxZoom(1); setLightboxRotation(0); }}
              style={{ padding: '6px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}
            >
              {Math.round(lightboxZoom * 100)}% (Reset)
            </button>
            <button
              type="button"
              onClick={() => setLightboxZoom(z => Math.min(3, z + 0.25))}
              style={{ padding: '6px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
            >
              <ZoomIn size={15} /> Zoom In
            </button>
            <button
              type="button"
              onClick={() => setLightboxRotation(r => (r + 90) % 360)}
              style={{ padding: '6px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
            >
              <RotateCw size={15} /> Rotate 90°
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default IssueDetailView;
