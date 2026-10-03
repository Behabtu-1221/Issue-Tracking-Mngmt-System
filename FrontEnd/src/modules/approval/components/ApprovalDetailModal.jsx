import React, { useState } from 'react';
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

export default function ApprovalDetailModal({ isOpen, onClose, approval, onSubmitDecision }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'details' | 'documents' | 'pipeline' | 'audit'
  const [decisionCode, setDecisionCode] = useState('APPROVED');
  const [comments, setComments] = useState('');
  const [decisionErrors, setDecisionErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  if (!isOpen || !approval) return null;

  const currentStage = (approval.stages || []).find(
    (st) => st.StageNumber === approval.CurrentStageNumber && st.StageStatusCode === 'PENDING'
  );
  const isPending = approval.ApprovalStatusCode === 'PENDING';

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
    try {
      setSubmitting(true);
      await onSubmitDecision({
        ApprovalID: approval.ApprovalID,
        DecisionCode: validation.sanitized.DecisionCode,
        Comments: validation.sanitized.Comments
      });
      setComments('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record approval decision');
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
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '20px'
    }}>
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--glass-border)',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '960px',
        maxHeight: '92vh',
        boxShadow: '0 25px 70px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
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
            <h2 style={{ fontSize: '1.3rem', fontWeight: '900', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              {approval.Title || approval.RequestTitle}
            </h2>
          </div>

          <button
            onClick={handleClose}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '10px',
              borderRadius: '12px',
              transition: 'all 0.2s'
            }}
          >
            <X size={20} />
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
            { id: 'overview', label: 'Overview & Decision', icon: ShieldCheck },
            { id: 'details', label: 'Issue & Location', icon: FileText },
            { id: 'documents', label: `Documents & Media (${documentsList.length})`, icon: ImageIcon },
            { id: 'pipeline', label: 'Stage Pipeline', icon: Layers },
            { id: 'audit', label: 'Audit Trail', icon: History }
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

              {/* Action Decision Form */}
              {isPending && currentStage ? (
                <div style={{
                  background: 'var(--bg-tertiary)',
                  border: '2px solid var(--accent-primary)',
                  borderRadius: '20px',
                  padding: '24px',
                  boxShadow: 'var(--glow-accent)'
                }}>
                  <div style={{ fontSize: '1rem', fontWeight: '900', color: 'var(--accent-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={18} /> ACTION STAGE {currentStage.StageNumber} DECISION
                  </div>

                  {/* Action Selector */}
                  <div style={{ marginBottom: '18px' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>
                      SELECT DECISION ACTION
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
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
                        <CheckCircle2 size={18} /> Approve
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
                        <RotateCcw size={18} /> Return
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
                        <XCircle size={18} /> Reject
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
                    {submitting ? 'Recording Decision...' : `Confirm & Record Decision (${decisionCode})`}
                  </button>
                </div>
              ) : (
                <div style={{
                  padding: '18px 24px',
                  background: 'var(--bg-tertiary)',
                  borderRadius: '16px',
                  border: '1px solid var(--glass-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ fontWeight: '700', color: 'var(--text-secondary)' }}>
                    Workflow Status: <strong>{approval.ApprovalStatusCode}</strong>
                  </div>
                  {approval.FinalActionedByName && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
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
