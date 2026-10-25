import React, { useState, useEffect } from 'react';
import DocumentMediaReader from '../../file-document/components/DocumentMediaReader';
import {
  X,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
  ShieldCheck,
  UserCheck,
  ArrowRight,
  MessageSquare,
  History,
  FileText,
  Check,
  AlertCircle,
  Sparkles,
  Building,
  MapPin,
  Tag,
  Briefcase,
  Layers,
  Eye,
  Download,
  File,
  Image as ImageIcon,
  ChevronRight,
  User,
  AlertTriangle,
  Info,
  Maximize2
} from 'lucide-react';
import { FormField } from '../../../components/common/FormField';
import { approvalSchemas } from '../../../validation';
import { useTranslation } from '../../../i18n/LanguageContext';
import { useAuth } from '../../authentication/contexts/AuthContext';

export default function ApprovalDetailModal({ isOpen, onClose, approval, onSubmitDecision }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'details' | 'documents' | 'pipeline' | 'audit'
  const [decisionCode, setDecisionCode] = useState('APPROVED');
  const [comments, setComments] = useState('');
  const [decisionErrors, setDecisionErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [decisionSuccess, setDecisionSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showInlineReader, setShowInlineReader] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen || !approval) return null;

  const userRoles = [
    (user?.userTypeCode || '').toUpperCase(),
    ...(user?.roles || []).map(r => (typeof r === 'string' ? r : r.RoleCode || '').toUpperCase())
  ];
  const isParkAdmin = userRoles.some(rc => ['PARK_SUPER_ADMIN', 'PARK_ADMIN', 'SUPER_ADMIN'].includes(rc)) || user?.userId === 1;

  const currentStage = (approval.stages || []).find(
    (st) => st.StageNumber === approval.CurrentStageNumber && st.StageStatusCode === 'PENDING'
  );
  const isPending = approval.ApprovalStatusCode === 'PENDING';

  const isStage1 = currentStage?.StageNumber === 1;
  const isStage2 = currentStage?.StageNumber === 2;

  // A user can decide if they are a Park Admin / Super Admin, or assigned to this stage
  const canDecideActiveStage = isPending && currentStage && (
    isParkAdmin ||
    (isStage1 && (!currentStage.ApproverUserID || Number(currentStage.ApproverUserID) === Number(user?.userId))) ||
    (isStage2 && isParkAdmin)
  );

  const quickComments = {
    APPROVED: [
      'Approved as per standard governance policy',
      'Verified & approved for execution',
      'Scope and requirements sign-off granted',
      'Budget & resource allocation confirmed'
    ],
    RETURNED_FOR_CORRECTION: [
      'Please provide additional supporting documentation',
      'Requires clarified scope details before approval',
      'Missing vendor / cost estimate breakdown',
      'Please update office space location details'
    ],
    REJECTED: [
      'Request exceeds department budget ceiling',
      'Non-compliant with IT & governance policy',
      'Duplicate request - scope already addressed',
      'Insufficient justification provided'
    ]
  };

  const handleClose = () => {
    setDecisionErrors({});
    setApiError('');
    onClose();
  };

  const handleDecisionSubmit = async (e) => {
    if (e) e.preventDefault();
    const validation = approvalSchemas.decisionForm({
      DecisionCode: decisionCode,
      Comments: comments
    });

    if (!validation.isValid) {
      setDecisionErrors(validation.errors);
      return;
    }

    setDecisionErrors({});
    setApiError('');
    setDecisionSuccess('');
    try {
      setSubmitting(true);
      await onSubmitDecision({
        ApprovalID: approval.ApprovalID,
        DecisionCode: validation.sanitized.DecisionCode,
        Comments: validation.sanitized.Comments
      });
      setComments('');
      setApiError('');
      if (validation.sanitized.DecisionCode === 'APPROVED') {
        if (approval.CurrentStageNumber < approval.TotalStages) {
          setDecisionSuccess(`Stage ${approval.CurrentStageNumber} approved successfully! This request has now advanced to Stage ${approval.CurrentStageNumber + 1} for Business Park Administrator Authorization.`);
        } else {
          setDecisionSuccess('Full approval workflow completed successfully! Request is now authorized for execution.');
        }
      } else if (validation.sanitized.DecisionCode === 'RETURNED_FOR_CORRECTION') {
        setDecisionSuccess(`Request returned for correction at Stage ${approval.CurrentStageNumber}.`);
      } else {
        setDecisionSuccess(`Request rejected at Stage ${approval.CurrentStageNumber}.`);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to record approval decision';
      setApiError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const getPriorityBadge = (priority) => {
    switch ((priority || '').toUpperCase()) {
      case 'URGENT':
      case 'CRITICAL':
        return (
          <span style={{
            background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#ef4444', padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '800',
            display: 'inline-flex', alignItems: 'center', gap: '4px'
          }}>
            <AlertTriangle size={12} /> {priority}
          </span>
        );
      case 'HIGH':
        return (
          <span style={{
            background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.4)',
            color: '#f59e0b', padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '800',
            display: 'inline-flex', alignItems: 'center', gap: '4px'
          }}>
            <AlertCircle size={12} /> High Priority
          </span>
        );
      default:
        return (
          <span style={{
            background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.4)',
            color: 'var(--accent-primary)', padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '800',
            display: 'inline-flex', alignItems: 'center', gap: '4px'
          }}>
            <Info size={12} /> {priority || 'Standard'}
          </span>
        );
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span style={{
            background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#10b981', padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '800',
            display: 'inline-flex', alignItems: 'center', gap: '6px', boxShadow: '0 0 12px rgba(16, 185, 129, 0.2)'
          }}>
            <CheckCircle2 size={14} /> Workflow Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span style={{
            background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#ef4444', padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '800',
            display: 'inline-flex', alignItems: 'center', gap: '6px', boxShadow: '0 0 12px rgba(239, 68, 68, 0.2)'
          }}>
            <XCircle size={14} /> Request Rejected
          </span>
        );
      case 'RETURNED':
        return (
          <span style={{
            background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.4)',
            color: '#f59e0b', padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '800',
            display: 'inline-flex', alignItems: 'center', gap: '6px', boxShadow: '0 0 12px rgba(245, 158, 11, 0.2)'
          }}>
            <RotateCcw size={14} /> Returned for Correction
          </span>
        );
      default:
        return (
          <span style={{
            background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.4)',
            color: 'var(--accent-primary)', padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '800',
            display: 'inline-flex', alignItems: 'center', gap: '6px', boxShadow: '0 0 12px rgba(99, 102, 241, 0.2)'
          }}>
            <Clock size={14} /> Active Stage {approval.CurrentStageNumber} of {approval.TotalStages}
          </span>
        );
    }
  };

  const documentsList = approval.documents || [];

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'var(--modal-backdrop, rgba(16, 20, 24, 0.78))',
        backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, padding: 'clamp(8px, 2.5vw, 20px)'
      }}
      onClick={handleClose}
    >
      <div
        className="modal-card accent-strip-purple enterprise-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="approval-detail-title"
        style={{
          borderRadius: 'var(--border-radius-lg, 18px)',
          width: '100%',
          maxWidth: '960px',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-4" style={{
          borderBottom: '1px solid var(--glass-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-tertiary)',
          flexShrink: 0
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '0.8rem',
                fontWeight: '800',
                color: 'var(--accent-primary)',
                background: 'rgba(99, 102, 241, 0.15)',
                padding: '4px 10px',
                borderRadius: '8px',
                border: '1px solid rgba(99, 102, 241, 0.3)'
              }}>
                {approval.RequestNumber || `APP-#${approval.ApprovalID}`}
              </span>
              {getStatusBadge(approval.ApprovalStatusCode)}
              {approval.IsMajorIncident === 1 && (
                <span style={{
                  background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444',
                  color: '#ef4444', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '900'
                }}>
                  🚨 MAJOR INCIDENT
                </span>
              )}
            </div>
            <h2 id="approval-detail-title" style={{ fontSize: '1.3rem', fontWeight: '900', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              {approval.Title || approval.RequestTitle}
            </h2>
          </div>

          <button
            onClick={handleClose}
            className="btn-icon touch-target-sm"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              transition: 'all 0.2s'
            }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Navigation Bar */}
        <div style={{
          display: 'flex',
          gap: '6px',
          padding: '8px 24px',
          background: 'var(--bg-tertiary)',
          borderBottom: '1px solid var(--glass-border)',
          overflowX: 'auto',
          flexShrink: 0
        }}>
          {[
            { id: 'overview', label: t('approval.detailModal.tabOverview', 'Overview & Decision'), icon: ShieldCheck },
            { id: 'details', label: t('approval.detailModal.tabDetails', 'Issue & Location'), icon: FileText },
            { id: 'documents', label: `${t('approval.detailModal.tabDocuments', 'Documents & Media')} (${documentsList.length})`, icon: ImageIcon },
            { id: 'pipeline', label: t('approval.detailModal.tabPipeline', 'Stage Pipeline'), icon: Layers },
            { id: 'audit', label: t('approval.detailModal.tabAudit', 'Audit Trail'), icon: History }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '9px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  background: isActive ? 'var(--accent-gradient)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-muted)',
                  fontWeight: '700',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                  boxShadow: isActive ? 'var(--glow-accent)' : 'none'
                }}
              >
                <Icon size={15} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Modal Content Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* TAB 1: OVERVIEW & DECISION */}
          {activeTab === 'overview' && (
            <>
              {/* Requester & Meta Card */}
              <div style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--glass-border)',
                borderRadius: '16px',
                padding: '20px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '46px', height: '46px', borderRadius: '50%',
                    background: 'var(--accent-gradient)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: '900', fontSize: '1.2rem',
                    boxShadow: 'var(--glow-accent)'
                  }}>
                    {(approval.RequesterName || 'S')[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.5px' }}>SUBMITTED REQUESTER</div>
                    <div style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--text-primary)' }}>{approval.RequesterName || 'System User'}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{approval.RequesterEmail}</div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.5px' }}>TENANT / ORGANIZATION</div>
                  <div style={{ fontWeight: '800', fontSize: '0.95rem', color: 'var(--text-primary)' }}>{approval.TenantName || 'Business Park Admin'}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Dept: {approval.AssignedDepartmentName || 'Operations'}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.5px' }}>PRIORITY & CATEGORY</div>
                  <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {getPriorityBadge(approval.RequestPriorityCode)}
                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)' }}>{approval.CategoryName || 'General'}</span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.5px' }}>SUBMISSION DATE</div>
                  <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    {new Date(approval.CreatedDate || approval.RequestCreatedDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>

              {/* Justification & Description */}
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', letterSpacing: '0.5px' }}>
                  <FileText size={15} color="var(--accent-primary)" /> REQUEST JUSTIFICATION & DETAILS
                </div>
                <div style={{
                  background: 'var(--bg-tertiary)',
                  padding: '16px 20px',
                  borderRadius: '14px',
                  border: '1px solid var(--glass-border)',
                  fontSize: '0.92rem',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.6'
                }}>
                  {approval.Description || approval.RequestDescription || 'No description submitted.'}
                </div>
              </div>

              {/* Supporting Documents & PDF Reader Section */}
              {documentsList.length > 0 && (
                <div style={{
                  background: 'var(--bg-tertiary)',
                  borderRadius: '16px',
                  border: '1px solid var(--glass-border)',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        padding: '8px',
                        borderRadius: '10px',
                        background: 'rgba(239, 68, 68, 0.15)',
                        color: '#ef4444',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <FileText size={20} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                          ATTACHED SUPPORTING DOCUMENTS & EVIDENCE ({documentsList.length})
                        </div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                          Review attached evidence, quotes, or invoices before recording your approval decision
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setShowInlineReader(!showInlineReader)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '10px',
                          background: showInlineReader ? 'var(--accent-gradient)' : 'var(--bg-secondary)',
                          border: '1px solid var(--glass-border)',
                          color: showInlineReader ? '#ffffff' : 'var(--text-primary)',
                          fontSize: '0.80rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: showInlineReader ? 'var(--glow-accent)' : 'none',
                          transition: 'all 0.2s'
                        }}
                      >
                        <Eye size={15} />
                        {showInlineReader ? 'Hide Document Reader' : 'Open Document / PDF Reader'}
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab('documents')}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '10px',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--glass-border)',
                          color: 'var(--text-secondary)',
                          fontSize: '0.80rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        Full Studio Tab <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Attachment Cards Strip */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                    gap: '10px'
                  }}>
                    {documentsList.map((doc, idx) => {
                      const isPdf = (doc.MimeType === 'application/pdf' || (doc.FileExtension || '').toLowerCase() === 'pdf');
                      const isImg = (doc.MimeType || '').startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes((doc.FileExtension || '').toLowerCase());
                      const isSelected = (selectedDoc?.DocumentID || selectedDoc?.DocumentUUID) === (doc.DocumentID || doc.DocumentUUID);

                      return (
                        <div
                          key={doc.DocumentID || doc.DocumentUUID || idx}
                          onClick={() => {
                            setSelectedDoc(doc);
                            setShowInlineReader(true);
                          }}
                          style={{
                            padding: '12px 14px',
                            borderRadius: '12px',
                            background: isSelected && showInlineReader ? 'rgba(99, 102, 241, 0.16)' : 'var(--bg-secondary)',
                            border: isSelected && showInlineReader ? '1.5px solid var(--accent-primary)' : '1px solid var(--glass-border)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '10px',
                            transition: 'all 0.2s',
                            boxShadow: isSelected && showInlineReader ? '0 0 14px rgba(99, 102, 241, 0.22)' : 'none'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                            <div style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '8px',
                              background: isPdf ? 'rgba(239, 68, 68, 0.15)' : (isImg ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)'),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              {isPdf ? <FileText size={18} color="#ef4444" /> : (isImg ? <ImageIcon size={18} color="#10b981" /> : <File size={18} color="var(--accent-primary)" />)}
                            </div>
                            <div style={{ overflow: 'hidden' }}>
                              <div style={{
                                fontWeight: 700,
                                fontSize: '0.84rem',
                                color: 'var(--text-primary)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>
                                {doc.Title || doc.FileName}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                <span style={{ textTransform: 'uppercase', fontWeight: 700, color: isPdf ? '#ef4444' : (isImg ? '#10b981' : 'var(--text-muted)') }}>
                                  {doc.FileExtension || 'DOC'}
                                </span> • {doc.FileSize ? (doc.FileSize / 1024).toFixed(1) + ' KB' : 'N/A'}
                              </div>
                            </div>
                          </div>

                          <div style={{
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            color: 'var(--accent-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            flexShrink: 0
                          }}>
                            <Eye size={13} /> {isPdf ? 'Read PDF' : 'Preview'}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Inline Document & PDF Reader when toggled */}
                  {showInlineReader && (
                    <div style={{ marginTop: '6px', borderTop: '1px solid var(--glass-border)', paddingTop: '16px' }}>
                      <DocumentMediaReader
                        documents={documentsList}
                        initialDocId={selectedDoc?.DocumentID || selectedDoc?.DocumentUUID || documentsList[0]?.DocumentID || documentsList[0]?.DocumentUUID}
                        compact={true}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Decision Success Banner */}
              {decisionSuccess && (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1.5px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: '16px',
                  padding: '16px 20px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  color: '#10b981'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <CheckCircle2 size={22} style={{ flexShrink: 0 }} />
                    <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>{decisionSuccess}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDecisionSuccess('')}
                    style={{ background: 'transparent', border: 'none', color: '#10b981', cursor: 'pointer', padding: '4px' }}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Action Decision Form or Stage Awaiting Banner */}
              {isPending && currentStage ? (
                canDecideActiveStage ? (
                  <div style={{
                    background: 'var(--bg-tertiary)',
                    border: '2px solid var(--accent-primary)',
                    borderRadius: '20px',
                    padding: '24px',
                    boxShadow: 'var(--glow-accent)'
                  }}>
                    <div style={{ fontSize: '1rem', fontWeight: '900', color: 'var(--accent-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sparkles size={18} /> ACTION STAGE {currentStage.StageNumber} DECISION: {isStage1 ? 'DEPARTMENT REVIEW & APPROVAL' : 'BUSINESS PARK ADMINISTRATOR AUTHORIZATION'}
                    </div>

                    {/* Action Selector */}
                    <div style={{ marginBottom: '18px' }}>
                      <label style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>
                        {t('approval.detailModal.selectDecision', 'SELECT DECISION ACTION')}
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                        <button
                          type="button"
                          onClick={() => setDecisionCode('APPROVED')}
                          style={{
                            padding: '14px',
                            borderRadius: '12px',
                            border: decisionCode === 'APPROVED' ? '2px solid #10b981' : '1px solid var(--glass-border)',
                            background: decisionCode === 'APPROVED' ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-secondary)',
                            color: decisionCode === 'APPROVED' ? '#10b981' : 'var(--text-secondary)',
                            fontWeight: '800',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            boxShadow: decisionCode === 'APPROVED' ? '0 0 16px rgba(16, 185, 129, 0.2)' : 'none',
                            transition: 'all 0.2s'
                          }}
                        >
                          <CheckCircle2 size={18} /> {t('approval.detailModal.approveOption', 'Approve')}
                        </button>

                        <button
                          type="button"
                          onClick={() => setDecisionCode('RETURNED_FOR_CORRECTION')}
                          style={{
                            padding: '14px',
                            borderRadius: '12px',
                            border: decisionCode === 'RETURNED_FOR_CORRECTION' ? '2px solid #f59e0b' : '1px solid var(--glass-border)',
                            background: decisionCode === 'RETURNED_FOR_CORRECTION' ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-secondary)',
                            color: decisionCode === 'RETURNED_FOR_CORRECTION' ? '#f59e0b' : 'var(--text-secondary)',
                            fontWeight: '800',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            boxShadow: decisionCode === 'RETURNED_FOR_CORRECTION' ? '0 0 16px rgba(245, 158, 11, 0.2)' : 'none',
                            transition: 'all 0.2s'
                          }}
                        >
                          <RotateCcw size={18} /> {t('approval.detailModal.returnOption', 'Return')}
                        </button>

                        <button
                          type="button"
                          onClick={() => setDecisionCode('REJECTED')}
                          style={{
                            padding: '14px',
                            borderRadius: '12px',
                            border: decisionCode === 'REJECTED' ? '2px solid #ef4444' : '1px solid var(--glass-border)',
                            background: decisionCode === 'REJECTED' ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-secondary)',
                            color: decisionCode === 'REJECTED' ? '#ef4444' : 'var(--text-secondary)',
                            fontWeight: '800',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            boxShadow: decisionCode === 'REJECTED' ? '0 0 16px rgba(239, 68, 68, 0.2)' : 'none',
                            transition: 'all 0.2s'
                          }}
                        >
                          <XCircle size={18} /> {t('approval.detailModal.rejectOption', 'Reject')}
                        </button>
                      </div>
                    </div>

                    {/* Quick Remark Chips */}
                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                        QUICK REMARK TEMPLATES
                      </label>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {quickComments[decisionCode]?.map((chip, cIdx) => (
                          <button
                            key={cIdx}
                            type="button"
                            onClick={() => {
                              setComments(chip);
                              if (decisionErrors.Comments) {
                                setDecisionErrors(prev => {
                                  const next = { ...prev };
                                  delete next.Comments;
                                  return next;
                                });
                              }
                            }}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '20px',
                              border: '1px solid var(--glass-border)',
                              background: 'var(--bg-secondary)',
                              color: 'var(--text-secondary)',
                              fontSize: '0.76rem',
                              cursor: 'pointer',
                              transition: 'background 0.2s'
                            }}
                          >
                            + {chip}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Comments Box */}
                    <div style={{ marginBottom: '18px' }}>
                      <FormField
                        label="Decision Comments"
                        required={decisionCode !== 'APPROVED'}
                        error={decisionErrors.Comments}
                        icon={MessageSquare}
                        helpText={decisionCode === 'APPROVED' ? 'Optional sign-off comments for record keeping' : 'Mandatory justification for audit compliance (max 1000 characters)'}
                      >
                        <textarea
                          rows={3}
                          value={comments}
                          onChange={(e) => {
                            setComments(e.target.value);
                            if (decisionErrors.Comments) {
                              setDecisionErrors(prev => {
                                const next = { ...prev };
                                delete next.Comments;
                                return next;
                              });
                            }
                          }}
                          placeholder={decisionCode === 'APPROVED' ? 'Optional sign-off comments...' : 'Provide clear justification for rejection or return...'}
                          style={{
                            width: '100%',
                            padding: '14px',
                            borderRadius: '12px',
                            border: decisionErrors.Comments ? '1.5px solid var(--color-danger, #ef4444)' : '1px solid var(--glass-border)',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            fontSize: '0.88rem',
                            outline: 'none',
                            boxSizing: 'border-box',
                            resize: 'vertical'
                          }}
                        />
                      </FormField>
                    </div>

                    {/* API Error Alert */}
                    {apiError && (
                      <div style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '12px',
                        padding: '12px 14px',
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        color: '#ef4444',
                        fontSize: '0.85rem',
                        fontWeight: 600
                      }}>
                        <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>{apiError}</span>
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleDecisionSubmit}
                      style={{
                        width: '100%',
                        padding: '14px',
                        borderRadius: '12px',
                        border: 'none',
                        background: decisionCode === 'APPROVED'
                          ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                          : decisionCode === 'REJECTED'
                          ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                          : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        color: 'white',
                        fontWeight: '800',
                        fontSize: '0.95rem',
                        cursor: 'pointer',
                        boxShadow: 'var(--glow-accent)',
                        transition: 'all 0.2s'
                      }}
                    >
                      {submitting
                        ? t('approval.detailModal.submitting', 'Submitting Decision...')
                        : `${t('approval.detailModal.submitDecision', 'Submit Official Decision')} (${decisionCode})`}
                    </button>
                  </div>
                ) : (
                  /* User is not authorized for active stage - show informative status */
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
                    border: '1.5px solid rgba(99, 102, 241, 0.35)',
                    borderRadius: '20px',
                    padding: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '18px'
                  }}>
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '14px',
                      background: 'rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      <ShieldCheck size={26} color="var(--accent-primary)" />
                    </div>
                    <div>
                      <div style={{ fontSize: '1.02rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>
                        {isStage2
                          ? 'Stage 1 Signed Off — Awaiting Stage 2 Administrator Authorization'
                          : `Awaiting Stage ${currentStage.StageNumber} Review & Sign-off`}
                      </div>
                      <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: '1.45' }}>
                        {isStage2
                          ? 'The Department Manager has successfully approved Stage 1. This multi-level request has advanced to Stage 2 (Business Park Administrator Authorization) and is awaiting executive review and sign-off by Business Park Administrators.'
                          : `This request is pending sign-off by the designated Stage ${currentStage.StageNumber} approver (${currentStage.ApproverUserName || currentStage.ApproverGroupName || 'Authorized Approver'}).`}
                      </div>
                    </div>
                  </div>
                )
              ) : (
                <div style={{
                  padding: '20px 24px',
                  background: approval.ApprovalStatusCode === 'APPROVED' ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-tertiary)',
                  borderRadius: '16px',
                  border: approval.ApprovalStatusCode === 'APPROVED' ? '1.5px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--glass-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {approval.ApprovalStatusCode === 'APPROVED' ? <CheckCircle2 size={24} color="#10b981" /> : <AlertCircle size={24} color="var(--text-muted)" />}
                    <div>
                      <div style={{ fontWeight: '800', color: approval.ApprovalStatusCode === 'APPROVED' ? '#10b981' : 'var(--text-primary)' }}>
                        Workflow Status: <strong>{approval.ApprovalStatusCode}</strong>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {approval.ApprovalStatusCode === 'APPROVED'
                          ? 'All governance stages have been successfully approved. Request authorized for execution.'
                          : `Workflow is currently in ${approval.ApprovalStatusCode} status.`}
                      </div>
                    </div>
                  </div>
                  {approval.FinalActionedByName && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                      Actioned by <strong>{approval.FinalActionedByName}</strong>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* TAB 2: ISSUE & LOCATION DETAILS */}
          {activeTab === 'details' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
              <div style={{ background: 'var(--bg-tertiary)', padding: '20px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--accent-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Tag size={15} /> SERVICE & CATEGORY METADATA
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem' }}>
                  <div><span style={{ color: 'var(--text-muted)' }}>Service Name:</span> <strong>{approval.ServiceName || 'IT Infrastructure'}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Service Code:</span> <strong>{approval.ServiceCode || 'SRV-IT-001'}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Category:</span> <strong>{approval.CategoryName || 'Hardware & Networking'}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Request Type:</span> <strong>{approval.RequestTypeCode || 'INCIDENT'}</strong></div>
                </div>
              </div>

              <div style={{ background: 'var(--bg-tertiary)', padding: '20px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--accent-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building size={15} /> LOCATION & FACILITIES
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem' }}>
                  <div><span style={{ color: 'var(--text-muted)' }}>Building:</span> <strong>{approval.BuildingName || 'Building A - Tech Park'}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Office Space:</span> <strong>{approval.OfficeSpaceNumber || 'Suite 502 (Floor 5)'}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Assigned Department:</span> <strong>{approval.AssignedDepartmentName || 'IT Support'}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Tenant Organization:</span> <strong>{approval.TenantName || 'Acme Tech Solutions'}</strong></div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DOCUMENTS & MEDIA READER */}
          {activeTab === 'documents' && (
            <DocumentMediaReader documents={documentsList} />
          )}

          {/* TAB 4: STAGE PIPELINE */}
          {activeTab === 'pipeline' && (
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={18} color="var(--accent-primary)" /> MULTI-LEVEL GOVERNANCE STAGES
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {(approval.stages || []).map((stage, idx) => {
                  const isActive = stage.StageNumber === approval.CurrentStageNumber && approval.ApprovalStatusCode === 'PENDING';
                  const isCompleted = stage.StageStatusCode === 'APPROVED';
                  const isRejected = stage.StageStatusCode === 'REJECTED';
                  const isReturned = stage.StageStatusCode === 'RETURNED';

                  let borderColor = 'var(--glass-border)';
                  let bgColor = 'var(--bg-tertiary)';
                  let badgeBg = 'rgba(148, 163, 184, 0.2)';
                  let badgeColor = 'var(--text-muted)';

                  if (isActive) {
                    borderColor = '#f59e0b';
                    bgColor = 'rgba(245, 158, 11, 0.08)';
                    badgeBg = '#f59e0b';
                    badgeColor = 'white';
                  }
                  if (isCompleted) {
                    borderColor = '#10b981';
                    bgColor = 'rgba(16, 185, 129, 0.08)';
                    badgeBg = '#10b981';
                    badgeColor = 'white';
                  }
                  if (isRejected) {
                    borderColor = '#ef4444';
                    bgColor = 'rgba(239, 68, 68, 0.08)';
                    badgeBg = '#ef4444';
                    badgeColor = 'white';
                  }

                  return (
                    <div
                      key={stage.ApprovalStageID || idx}
                      style={{
                        background: bgColor,
                        border: `1.5px solid ${borderColor}`,
                        borderRadius: '16px',
                        padding: '18px 22px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                          width: '42px', height: '42px',
                          borderRadius: '50%', background: badgeBg, color: badgeColor,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: '900', fontSize: '1rem'
                        }}>
                          {isCompleted ? <Check size={20} /> : stage.StageNumber}
                        </div>
                        <div>
                          <div style={{ fontWeight: '800', fontSize: '0.98rem', color: 'var(--text-primary)' }}>
                            Stage {stage.StageNumber}: {stage.ApproverUserName || stage.ApproverGroupName || 'Authorized Approver'}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {stage.ApproverGroupName ? `Assigned Group: ${stage.ApproverGroupName}` : 'Direct Individual Sign-off'}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        {stage.StageStatusCode === 'APPROVED' && <span className="badge badge-success"><CheckCircle2 size={13} /> Approved</span>}
                        {stage.StageStatusCode === 'REJECTED' && <span className="badge badge-danger"><XCircle size={13} /> Rejected</span>}
                        {stage.StageStatusCode === 'PENDING' && <span className="badge badge-info"><Clock size={13} /> {isActive ? 'Active Pending' : 'Awaiting'}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: AUDIT LOG TIMELINE */}
          {activeTab === 'audit' && (
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <History size={18} color="var(--accent-primary)" /> IMMUTABLE AUDIT LOG HISTORY
              </div>

              {(!approval.history || approval.history.length === 0) ? (
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                  No audit log entries recorded yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {approval.history.map((h, i) => (
                    <div key={h.ApprovalHistoryID || i} style={{
                      background: 'var(--bg-tertiary)',
                      borderLeft: '4px solid var(--accent-primary)',
                      padding: '12px 16px',
                      borderRadius: '0 12px 12px 0',
                      borderTop: '1px solid var(--glass-border)',
                      borderRight: '1px solid var(--glass-border)',
                      borderBottom: '1px solid var(--glass-border)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontWeight: '800', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                          {h.ActionTypeCode} • {h.PerformedByName}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {h.Remarks}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                        {new Date(h.CreatedDate || h.ActionDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
