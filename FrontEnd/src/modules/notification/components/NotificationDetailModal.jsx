import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Bell,
  Clock,
  Calendar,
  Check,
  CheckCircle2,
  ShieldAlert,
  Wrench,
  LifeBuoy,
  ArrowRight,
  ExternalLink,
  Copy,
  Building2,
  Layers,
  Tag,
  Mail,
  Smartphone,
  Radio,
  AlertTriangle,
  Info,
  FileText,
  CheckSquare,
  RefreshCw,
  BookmarkCheck,
  MapPin,
  Lock
} from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { usePermissionContext } from '../../role-permission-management/contexts/PermissionContext';
import notificationApi from '../api/notificationApi';

/**
 * Senior Enterprise Notification Details Modal (WCAG 2.2 Level AA Compliant)
 * 
 * Features:
 * - High-clarity information hierarchy: Category badge, title, metadata strip, distinct message panel & separated technician notes
 * - Robust accessibility: role="dialog", aria-modal="true", keyboard focus trapping, visible focus rings, Escape key handling & focus restoration
 * - Semantic priority & event badges with text labels (color is never the sole indicator)
 * - Real API integration: toggle Mark as Read / Mark as Unread with in-flight state and error recovery
 * - Contextual primary navigation with role-based permission verification
 * - Responsive mobile-first design (tested for 320px up to 1440px+)
 * - Respects prefers-reduced-motion
 */
export default function NotificationDetailModal({
  isOpen,
  notification,
  onClose,
  onMarkRead,
  onMarkUnread,
  onNavigateToResource
}) {
  const { t, locale } = useTranslation();
  const { hasAnyPermission, isParkAdmin } = usePermissionContext();

  const [copied, setCopied] = useState(false);
  const [isUpdatingRead, setIsUpdatingRead] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [localIsRead, setLocalIsRead] = useState(false);

  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);
  const prevActiveElement = useRef(null);
  const copyTimeoutRef = useRef(null);

  // Sync local read state with incoming notification
  useEffect(() => {
    if (notification) {
      setLocalIsRead(Boolean(notification.IsRead));
      setActionError(null);
    }
  }, [notification]);

  // Clean up timers
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  // Accessibility: Focus management, focus trap, and Escape key listener
  useEffect(() => {
    if (!isOpen) return;

    prevActiveElement.current = document.activeElement;

    const modalElement = modalRef.current;
    if (!modalElement) return;

    // Focus the modal or the close button initially
    const focusTimer = setTimeout(() => {
      if (closeButtonRef.current) {
        closeButtonRef.current.focus();
      } else {
        modalElement.focus();
      }
    }, 50);

    const focusableSelectors = [
      'button:not([disabled])',
      '[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ');

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
        return;
      }

      if (e.key === 'Tab') {
        const focusable = modalElement.querySelectorAll(focusableSelectors);
        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first || document.activeElement === modalElement) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      if (prevActiveElement.current && typeof prevActiveElement.current.focus === 'function') {
        try {
          prevActiveElement.current.focus();
        } catch {
          // ignore potential detached node
        }
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen || !notification) return null;

  const n = notification;
  const isUnread = !localIsRead;

  // Normalized Attributes
  const reqNum = n.RequestNumber || (n.Title?.match(/REQ-[0-9-]+/) ? n.Title.match(/REQ-[0-9-]+/)[0] : (n.MessageText?.match(/REQ-[0-9-]+/) ? n.MessageText.match(/REQ-[0-9-]+/)[0] : ''));
  const priority = (n.PriorityCode || (n.Title?.match(/\[(.*?)\]/) ? n.Title.match(/\[(.*?)\]/)[1] : 'MEDIUM')).toUpperCase();
  const status = n.StatusCode || null;
  const department = n.DepartmentName || null;
  const category = n.CategoryCode || null;
  const location = n.BuildingName || null;
  const channel = n.ChannelCode || 'IN_APP';

  // Extract or separate technician notes if present
  const technicianNotes = (() => {
    if (n.TechnicianNotes && typeof n.TechnicianNotes === 'string') return n.TechnicianNotes.trim();
    if (n.ProgressNotes && typeof n.ProgressNotes === 'string') return n.ProgressNotes.trim();
    if (n.Remarks && typeof n.Remarks === 'string') return n.Remarks.trim();
    if (n.Notes && typeof n.Notes === 'string') return n.Notes.trim();
    if (n.WorkLog && typeof n.WorkLog === 'string') return n.WorkLog.trim();

    const text = n.MessageText || '';
    const notesMatch = text.match(/(?:Technician (?:progress )?notes|Work Log \/ Notes|Progress Notes|Notes):\s*["“]?([^"”\n\r]+)["”]?/i);
    if (notesMatch && notesMatch[1]) {
      return notesMatch[1].trim();
    }
    const reasonMatch = text.match(/(?:Reason):\s*["“]?([^"”\n\r]+)["”]?/i);
    if (reasonMatch && reasonMatch[1]) {
      return reasonMatch[1].trim();
    }
    return null;
  })();

  // Date Formatting
  const rawDate = n.CreatedDate || n.NotificationDate;
  let formattedFullDate = 'N/A';
  let formattedRelativeTime = '';
  if (rawDate) {
    try {
      const d = new Date(rawDate);
      formattedFullDate = d.toLocaleDateString(locale === 'am' ? 'am-ET' : 'en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      const now = new Date();
      const diffSec = Math.floor((now - d) / 1000);
      if (diffSec < 60) formattedRelativeTime = t('common.justNow', 'Just now');
      else if (diffSec < 3600) formattedRelativeTime = `${Math.floor(diffSec / 60)}m ago`;
      else if (diffSec < 86400) formattedRelativeTime = `${Math.floor(diffSec / 3600)}h ago`;
      else if (diffSec < 172800) formattedRelativeTime = t('common.yesterday', 'Yesterday');
      else formattedRelativeTime = d.toLocaleDateString(locale === 'am' ? 'am-ET' : 'en-US', { month: 'short', day: 'numeric' });
    } catch {
      formattedFullDate = String(rawDate);
    }
  }

  // Handle Copy Request Number
  const handleCopyReq = async (e) => {
    e.stopPropagation();
    if (!reqNum) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(reqNum);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = reqNum;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Failed to copy ticket ID:', err);
    }
  };

  // Toggle Read / Unread Status with Real API Execution
  const handleToggleReadStatus = async () => {
    if (!n.UserNotificationID || isUpdatingRead) return;
    setIsUpdatingRead(true);
    setActionError(null);
    try {
      if (isUnread) {
        if (onMarkRead) {
          await onMarkRead(n.UserNotificationID);
        } else {
          await notificationApi.markAsRead(n.UserNotificationID);
        }
        setLocalIsRead(true);
      } else {
        if (onMarkUnread) {
          await onMarkUnread(n.UserNotificationID);
        } else {
          await notificationApi.markAsUnread(n.UserNotificationID);
        }
        setLocalIsRead(false);
      }
    } catch (err) {
      console.error('Failed to update notification read status:', err);
      setActionError(isUnread ? 'Failed to mark as read' : 'Failed to mark as unread');
    } finally {
      setIsUpdatingRead(false);
    }
  };

  // Event Badges & Icons
  const getEventBadge = (typeCode = '') => {
    if (typeCode.startsWith('APPROVAL_REQUIRED') || typeCode === 'HIGHER_APPROVAL_REQUIRED') {
      return {
        label: t('notifications.typeApprovalRequired', 'Approval Required'),
        icon: Clock,
        variantClass: 'badge-amber',
        color: '#d97706',
        bg: 'rgba(217, 119, 6, 0.12)',
        border: 'rgba(217, 119, 6, 0.25)'
      };
    }
    if (typeCode === 'ISSUE_APPROVED_FOR_DISPATCH') {
      return {
        label: t('notifications.typeReadyDispatch', 'Ready for Dispatch'),
        icon: Wrench,
        variantClass: 'badge-cyan',
        color: '#0284c7',
        bg: 'rgba(2, 132, 199, 0.12)',
        border: 'rgba(2, 132, 199, 0.25)'
      };
    }
    if (typeCode === 'APPROVAL_COMPLETED' || typeCode === 'DEPARTMENT_APPROVED') {
      return {
        label: t('notifications.typeApproved', 'Approved & Forwarded'),
        icon: CheckCircle2,
        variantClass: 'badge-emerald',
        color: '#059669',
        bg: 'rgba(5, 150, 105, 0.12)',
        border: 'rgba(5, 150, 105, 0.25)'
      };
    }
    if (typeCode === 'ISSUE_RESOLVED' || typeCode === 'REQUEST_CLOSED') {
      return {
        label: t('notifications.typeResolved', 'Resolved & Closed'),
        icon: CheckCircle2,
        variantClass: 'badge-emerald',
        color: '#059669',
        bg: 'rgba(5, 150, 105, 0.12)',
        border: 'rgba(5, 150, 105, 0.25)'
      };
    }
    if (typeCode.startsWith('SLA') || typeCode === 'APPROVAL_REJECTED' || typeCode === 'REQUEST_CANCELLED') {
      return {
        label: typeCode.startsWith('SLA') ? t('notifications.typeSlaAlert', 'SLA Escalation') : t('notifications.typeDeclined', 'Request Update'),
        icon: ShieldAlert,
        variantClass: 'badge-rose',
        color: '#dc2626',
        bg: 'rgba(220, 38, 38, 0.12)',
        border: 'rgba(220, 38, 38, 0.25)'
      };
    }
    if (typeCode === 'ISSUE_ASSIGNED' || typeCode === 'ASSIGNMENT_REASSIGNED') {
      return {
        label: t('notifications.typeWorkOrder', 'Work Order Assigned'),
        icon: Wrench,
        variantClass: 'badge-blue',
        color: '#2563eb',
        bg: 'rgba(37, 99, 235, 0.12)',
        border: 'rgba(37, 99, 235, 0.25)'
      };
    }
    if (typeCode === 'REQUEST_PROGRESS_UPDATED') {
      return {
        label: t('notifications.typeProgress', 'Progress & Milestone'),
        icon: CheckSquare,
        variantClass: 'badge-blue',
        color: '#2563eb',
        bg: 'rgba(37, 99, 235, 0.12)',
        border: 'rgba(37, 99, 235, 0.25)'
      };
    }
    if (typeCode === 'ISSUE_CREATED' || typeCode === 'REQUEST_SUBMITTED') {
      return {
        label: t('notifications.typeTicketCreated', 'Ticket Submitted'),
        icon: LifeBuoy,
        variantClass: 'badge-purple',
        color: '#7c3aed',
        bg: 'rgba(124, 58, 237, 0.12)',
        border: 'rgba(124, 58, 237, 0.25)'
      };
    }
    return {
      label: n.TypeName || t('notifications.typeSystemAlert', 'System Notification'),
      icon: Bell,
      variantClass: 'badge-slate',
      color: '#475569',
      bg: 'rgba(71, 85, 105, 0.12)',
      border: 'rgba(71, 85, 105, 0.25)'
    };
  };

  // Semantic Priority Styles
  const getPriorityBadge = (p = '') => {
    switch (p) {
      case 'CRITICAL':
        return {
          label: 'CRITICAL',
          icon: ShieldAlert,
          style: {
            background: 'var(--color-error-bg, rgba(239, 68, 68, 0.12))',
            color: 'var(--color-error, #b91c1c)',
            border: '1px solid var(--color-error-border, rgba(239, 68, 68, 0.3))'
          }
        };
      case 'HIGH':
        return {
          label: 'HIGH',
          icon: AlertTriangle,
          style: {
            background: 'var(--color-warning-bg, rgba(245, 158, 11, 0.12))',
            color: 'var(--color-warning, #b45309)',
            border: '1px solid var(--color-warning-border, rgba(245, 158, 11, 0.3))'
          }
        };
      case 'MEDIUM':
        return {
          label: 'MEDIUM',
          icon: Info,
          style: {
            background: 'var(--color-primary-subtle, rgba(37, 99, 235, 0.1))',
            color: 'var(--color-primary, #2563eb)',
            border: '1px solid var(--color-primary-border, rgba(37, 99, 235, 0.25))'
          }
        };
      case 'LOW':
      default:
        return {
          label: p || 'LOW',
          icon: CheckCircle2,
          style: {
            background: 'rgba(148, 163, 184, 0.12)',
            color: 'var(--color-text-secondary, #475569)',
            border: '1px solid rgba(148, 163, 184, 0.3)'
          }
        };
    }
  };

  // Channel presentation
  const getChannelInfo = (ch = '') => {
    switch (ch.toUpperCase()) {
      case 'EMAIL':
        return { label: 'Email Dispatch', icon: Mail };
      case 'SMS':
        return { label: 'SMS Alert', icon: Smartphone };
      case 'PUSH':
        return { label: 'Push Notification', icon: Radio };
      case 'IN_APP':
      default:
        return { label: 'In-App Alert', icon: Bell };
    }
  };

  // Primary Action Button Label
  const getActionLabel = () => {
    const code = n.TypeCode || '';
    if (code.includes('APPROVAL')) return t('notifications.actionReviewApproval', 'Review in Approvals');
    if (code === 'ISSUE_APPROVED_FOR_DISPATCH' || code === 'APPROVAL_COMPLETED') return t('notifications.actionOpenDispatch', 'Open Dispatch Queue');
    if (code.includes('ASSIGN')) return t('notifications.actionOpenWorkOrder', 'Open Work Order');
    if (code === 'ISSUE_RESOLVED') return t('notifications.actionInspectResolution', 'Inspect & Confirm Resolution');
    if (code.includes('SLA')) return t('notifications.actionInspectSla', 'Inspect SLA Escalation');
    return t('notifications.actionViewRequest', 'View Related Request');
  };

  const badge = getEventBadge(n.TypeCode);
  const BadgeIcon = badge.icon;
  const prioBadge = getPriorityBadge(priority);
  const PrioIcon = prioBadge.icon;
  const channelInfo = getChannelInfo(channel);
  const ChannelIcon = channelInfo.icon;

  const hasRelatedResource = Boolean(n.TriggeredByID || n.TriggeredByTable === 'IssueRequest');

  // Authorization check for navigating to the related resource
  const isAuthorizedToNavigate = (() => {
    if (!hasRelatedResource) return false;
    if (isParkAdmin) return true;

    const type = n?.TypeCode || '';
    const table = n?.TriggeredByTable || '';

    if (type.startsWith('APPROVAL') || type === 'HIGHER_APPROVAL_REQUIRED' || table === 'Approval') {
      return hasAnyPermission ? hasAnyPermission(['Request.Approve', 'Approval.Manage']) : true;
    }
    if (type === 'ISSUE_APPROVED_FOR_DISPATCH' || type === 'APPROVAL_COMPLETED') {
      return hasAnyPermission ? hasAnyPermission(['Request.Assign', 'Dispatch.Manage', 'Report.View']) : true;
    }
    if (type === 'ISSUE_ASSIGNED' || type === 'ASSIGNMENT_REASSIGNED') {
      return hasAnyPermission ? hasAnyPermission(['Issue.Read.Assigned', 'Request.Read', 'Request.Assign']) : true;
    }
    if (table === 'SLAClock' || type.startsWith('SLA')) {
      return hasAnyPermission ? hasAnyPermission(['Report.View', 'Request.Read']) : true;
    }
    return hasAnyPermission ? hasAnyPermission(['Request.Read', 'Request.Create', 'Report.View']) : true;
  })();

  return (
    <div
      className="modal-overlay itms-notif-backdrop"
      onClick={onClose}
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--modal-backdrop, rgba(15, 23, 42, 0.72))',
        backdropFilter: 'blur(8px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(10px, 3vw, 24px)',
        overflowY: 'auto'
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="notification-detail-heading"
        aria-describedby="notification-detail-subject"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="modal-card accent-strip-brand itms-notif-dialog"
        style={{
          width: '100%',
          maxWidth: '620px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 'var(--border-radius-lg, 18px)',
          border: '1px solid var(--color-border-subtle, var(--glass-border))',
          background: 'var(--color-surface, var(--bg-secondary))',
          boxShadow: 'var(--shadow-lg, 0 20px 40px -10px rgba(0, 0, 0, 0.35))',
          overflow: 'hidden',
          outline: 'none'
        }}
      >
        {/* Screen Reader Announcements */}
        <div className="sr-only" aria-live="polite">
          {copied ? 'Tracking ticket number copied to clipboard' : ''}
          {actionError ? `Notification update error: ${actionError}` : ''}
        </div>

        {/* ── 1. Compact Enterprise Header ── */}
        <div
          className="modal-card-header"
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--color-border-subtle, var(--glass-border))',
            background: 'var(--color-elevated, var(--bg-tertiary))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            {/* Category Icon */}
            <div
              className="form-header-icon"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: badge.bg,
                border: `1px solid ${badge.border}`,
                color: badge.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
              aria-hidden="true"
            >
              <BadgeIcon size={18} />
            </div>

            {/* Title & Category Hierarchy */}
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: badge.color
                  }}
                >
                  {badge.label}
                </span>

                {/* Read / Unread Indicator with Semantic Pill */}
                <span
                  style={{
                    fontSize: '0.68rem',
                    padding: '2px 7px',
                    borderRadius: '6px',
                    fontWeight: 700,
                    letterSpacing: '0.02em',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: isUnread
                      ? 'var(--color-error-bg, rgba(239, 68, 68, 0.12))'
                      : 'var(--color-success-bg, rgba(16, 185, 129, 0.12))',
                    color: isUnread
                      ? 'var(--color-error, #b91c1c)'
                      : 'var(--color-success, #15803d)',
                    border: `1px solid ${
                      isUnread
                        ? 'var(--color-error-border, rgba(239, 68, 68, 0.25))'
                        : 'var(--color-success-border, rgba(16, 185, 129, 0.25))'
                    }`
                  }}
                >
                  {isUnread ? (
                    <>
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'currentColor' }} aria-hidden="true" />
                      {t('notifications.unread', 'Unread')}
                    </>
                  ) : (
                    <>
                      <Check size={11} aria-hidden="true" />
                      {t('notifications.read', 'Read')}
                    </>
                  )}
                </span>
              </div>

              <h2
                id="notification-detail-heading"
                className="form-header-title"
                style={{
                  margin: '2px 0 0',
                  fontSize: '1.02rem',
                  fontWeight: 700,
                  color: 'var(--color-text, var(--text-primary))'
                }}
              >
                {t('notifications.modalTitle', 'Notification Details')}
              </h2>
            </div>
          </div>

          {/* Accessible Close Button */}
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label={t('common.closeNotificationModal', 'Close notification details')}
            className="action-btn action-btn-neutral touch-target-sm focus-visible-ring"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-muted, #64748b)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* ── 2. Scrollable Body Content ── */}
        <div
          className="modal-card-body"
          style={{
            padding: '20px clamp(14px, 3vw, 24px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            overflowY: 'auto',
            flex: 1
          }}
        >
          {/* Action Error Banner if read/unread update failed */}
          {actionError && (
            <div
              role="alert"
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'var(--color-error-bg, rgba(239, 68, 68, 0.1))',
                border: '1px solid var(--color-error-border, rgba(239, 68, 68, 0.25))',
                color: 'var(--color-error, #b91c1c)',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <AlertTriangle size={15} style={{ flexShrink: 0 }} aria-hidden="true" />
              <span style={{ flex: 1 }}>{actionError}</span>
              <button
                type="button"
                onClick={handleToggleReadStatus}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'currentColor',
                  fontWeight: 700,
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontSize: '0.8rem'
                }}
              >
                {t('common.retry', 'Retry')}
              </button>
            </div>
          )}

          {/* Subject & Timestamp Block */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <h3
              id="notification-detail-subject"
              style={{
                margin: 0,
                fontSize: '1.15rem',
                fontWeight: 700,
                lineHeight: 1.4,
                color: 'var(--color-text, var(--text-primary))',
                wordBreak: 'break-word',
                overflowWrap: 'anywhere'
              }}
            >
              {n.Title || t('notifications.untitledAlert', 'System Notification Alert')}
            </h3>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px 12px',
                fontSize: '0.82rem',
                color: 'var(--color-text-muted, #64748b)'
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <Clock size={13} aria-hidden="true" />
                <span>{formattedFullDate}</span>
              </span>
              {formattedRelativeTime && (
                <>
                  <span aria-hidden="true" style={{ opacity: 0.5 }}>•</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-primary, #2563eb)' }}>
                    {formattedRelativeTime}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* ── Main Notification Message Panel ── */}
          <div
            role="region"
            aria-label={t('notifications.messageContent', 'Notification Message Content')}
            style={{
              padding: '16px 18px',
              borderRadius: '12px',
              background: 'var(--color-elevated, var(--bg-tertiary))',
              border: '1px solid var(--color-border-subtle, var(--glass-border))',
              color: 'var(--color-text-secondary, #334155)',
              fontSize: '0.90rem',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              overflowWrap: 'anywhere'
            }}
          >
            {n.MessageText || t('notifications.noMessageText', 'No detailed message provided for this notification.')}
          </div>

          {/* ── Technician Progress Notes Section (Separated cleanly when present) ── */}
          {technicianNotes && (
            <div
              role="region"
              aria-label={t('notifications.technicianNotes', 'Technician Work & Progress Notes')}
              style={{
                padding: '14px 16px',
                borderRadius: '12px',
                background: 'rgba(2, 132, 199, 0.05)',
                border: '1px solid rgba(2, 132, 199, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: '#0284c7'
                }}
              >
                <Wrench size={14} aria-hidden="true" />
                <span>{t('notifications.technicianNotesTitle', 'Technician Progress Notes & Remarks')}</span>
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.88rem',
                  color: 'var(--color-text, var(--text-primary))',
                  lineHeight: 1.55,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}
              >
                {technicianNotes}
              </p>
            </div>
          )}

          {/* ── Scannable Metadata Grid ── */}
          <div
            role="region"
            aria-label={t('notifications.metadataDetails', 'Notification Context & Attributes')}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))',
              gap: '10px',
              marginTop: '2px'
            }}
          >
            {/* Tracking Ticket ID */}
            {reqNum && (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: 'var(--color-elevated, var(--bg-tertiary))',
                  border: '1px solid var(--color-border-subtle, var(--glass-border))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '6px'
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: 'var(--color-text-muted, #64748b)',
                      letterSpacing: '0.03em'
                    }}
                  >
                    {t('notifications.ticketNumber', 'Ticket ID')}
                  </div>
                  <div
                    style={{
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      color: 'var(--color-primary, #2563eb)',
                      marginTop: '2px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                    title={reqNum}
                  >
                    {reqNum}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyReq}
                  title={copied ? t('common.copied', 'Copied to clipboard') : t('common.copyTicketNumber', 'Copy ticket number')}
                  aria-label={`${t('common.copyTicketNumber', 'Copy ticket number')} ${reqNum}`}
                  className="touch-target-sm focus-visible-ring"
                  style={{
                    background: copied ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                    border: 'none',
                    color: copied ? 'var(--color-success, #15803d)' : 'var(--color-text-muted, #64748b)',
                    cursor: 'pointer',
                    padding: '6px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                </button>
              </div>
            )}

            {/* Priority Level */}
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '10px',
                background: 'var(--color-elevated, var(--bg-tertiary))',
                border: '1px solid var(--color-border-subtle, var(--glass-border))'
              }}
            >
              <div
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--color-text-muted, #64748b)',
                  letterSpacing: '0.03em'
                }}
              >
                {t('notifications.priority', 'Priority')}
              </div>
              <div style={{ marginTop: '4px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 7px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    letterSpacing: '0.02em',
                    ...prioBadge.style
                  }}
                >
                  <PrioIcon size={11} aria-hidden="true" />
                  <span>{prioBadge.label}</span>
                </span>
              </div>
            </div>

            {/* Department */}
            {department && (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: 'var(--color-elevated, var(--bg-tertiary))',
                  border: '1px solid var(--color-border-subtle, var(--glass-border))'
                }}
              >
                <div
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--color-text-muted, #64748b)',
                    letterSpacing: '0.03em'
                  }}
                >
                  {t('notifications.department', 'Department')}
                </div>
                <div
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: 'var(--color-text, var(--text-primary))',
                    marginTop: '3px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                  title={department}
                >
                  <Building2 size={13} style={{ flexShrink: 0, color: 'var(--color-primary, #2563eb)' }} aria-hidden="true" />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{department}</span>
                </div>
              </div>
            )}

            {/* Service / Work Category */}
            {category && (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: 'var(--color-elevated, var(--bg-tertiary))',
                  border: '1px solid var(--color-border-subtle, var(--glass-border))'
                }}
              >
                <div
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--color-text-muted, #64748b)',
                    letterSpacing: '0.03em'
                  }}
                >
                  {t('notifications.workCategory', 'Work Category')}
                </div>
                <div
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: 'var(--color-text, var(--text-primary))',
                    marginTop: '3px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                  title={category}
                >
                  <Tag size={13} style={{ flexShrink: 0, color: 'var(--color-primary, #2563eb)' }} aria-hidden="true" />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{category}</span>
                </div>
              </div>
            )}

            {/* Status (if present) */}
            {status && (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: 'var(--color-elevated, var(--bg-tertiary))',
                  border: '1px solid var(--color-border-subtle, var(--glass-border))'
                }}
              >
                <div
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--color-text-muted, #64748b)',
                    letterSpacing: '0.03em'
                  }}
                >
                  {t('common.status', 'Status')}
                </div>
                <div
                  style={{
                    fontSize: '0.80rem',
                    fontWeight: 700,
                    color: 'var(--color-success, #15803d)',
                    marginTop: '3px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {status}
                </div>
              </div>
            )}

            {/* Notification Channel */}
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '10px',
                background: 'var(--color-elevated, var(--bg-tertiary))',
                border: '1px solid var(--color-border-subtle, var(--glass-border))'
              }}
            >
              <div
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--color-text-muted, #64748b)',
                  letterSpacing: '0.03em'
                }}
              >
                {t('notifications.channel', 'Channel')}
              </div>
              <div
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: 'var(--color-text, var(--text-primary))',
                  marginTop: '3px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <ChannelIcon size={13} style={{ flexShrink: 0, color: 'var(--color-text-muted, #64748b)' }} aria-hidden="true" />
                <span>{channelInfo.label}</span>
              </div>
            </div>

            {/* Location / Building (if present) */}
            {location && (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: 'var(--color-elevated, var(--bg-tertiary))',
                  border: '1px solid var(--color-border-subtle, var(--glass-border))'
                }}
              >
                <div
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--color-text-muted, #64748b)',
                    letterSpacing: '0.03em'
                  }}
                >
                  {t('notifications.location', 'Location')}
                </div>
                <div
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: 'var(--color-text, var(--text-primary))',
                    marginTop: '3px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                  title={location}
                >
                  <MapPin size={13} style={{ flexShrink: 0, color: 'var(--color-primary, #2563eb)' }} aria-hidden="true" />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{location}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── 3. Footer Actions (Responsive & Accessible) ── */}
        <div
          className="modal-card-footer"
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--color-border-subtle, var(--glass-border))',
            background: 'var(--color-elevated, var(--bg-tertiary))',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            flexShrink: 0
          }}
        >
          {/* Read / Unread State Toggle */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              type="button"
              onClick={handleToggleReadStatus}
              disabled={isUpdatingRead}
              className="btn btn-secondary touch-target-sm focus-visible-ring"
              style={{
                fontSize: '0.82rem',
                padding: '8px 14px',
                borderRadius: '8px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
              aria-label={isUnread ? t('notifications.markAsRead', 'Mark notification as read') : t('notifications.markAsUnread', 'Mark notification as unread')}
            >
              {isUpdatingRead ? (
                <>
                  <RefreshCw size={13} className="animate-spin" aria-hidden="true" />
                  <span>{t('common.updating', 'Updating...')}</span>
                </>
              ) : isUnread ? (
                <>
                  <Check size={14} style={{ color: 'var(--color-success, #15803d)' }} aria-hidden="true" />
                  <span>{t('notifications.markAsRead', 'Mark as Read')}</span>
                </>
              ) : (
                <>
                  <BookmarkCheck size={14} style={{ color: 'var(--color-primary, #2563eb)' }} aria-hidden="true" />
                  <span>{t('notifications.markAsUnread', 'Mark as Unread')}</span>
                </>
              )}
            </button>
          </div>

          {/* Action Buttons: Close & Primary Resource Navigation */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flexWrap: 'wrap',
              marginLeft: 'auto'
            }}
          >
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary touch-target-sm focus-visible-ring"
              style={{
                fontSize: '0.84rem',
                padding: '9px 16px',
                borderRadius: '8px',
                fontWeight: 600
              }}
            >
              {t('common.close', 'Close')}
            </button>

            {hasRelatedResource && onNavigateToResource && (
              <button
                type="button"
                onClick={() => isAuthorizedToNavigate && onNavigateToResource(n)}
                disabled={!isAuthorizedToNavigate}
                title={!isAuthorizedToNavigate ? t('notifications.unauthorizedResource', 'You do not have permission to view this request') : undefined}
                className="btn btn-primary touch-target focus-visible-ring"
                style={{
                  fontSize: '0.84rem',
                  padding: '9px 18px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  opacity: isAuthorizedToNavigate ? 1 : 0.6,
                  cursor: isAuthorizedToNavigate ? 'pointer' : 'not-allowed'
                }}
              >
                {!isAuthorizedToNavigate && <Lock size={13} aria-hidden="true" />}
                <span>{getActionLabel()}</span>
                {isAuthorizedToNavigate && <ArrowRight size={15} aria-hidden="true" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Scoped CSS for Keyframe Animations & Reduced Motion */}
      <style>{`
        .itms-notif-backdrop {
          animation: itmsFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .itms-notif-dialog {
          animation: itmsScaleUp 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes itmsFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes itmsScaleUp {
          from { opacity: 0; transform: scale(0.97) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .itms-notif-backdrop,
          .itms-notif-dialog {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}
