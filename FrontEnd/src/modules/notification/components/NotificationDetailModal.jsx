import React from 'react';
import {
  X,
  Bell,
  Calendar,
  Clock,
  CheckCircle2,
  ShieldAlert,
  Wrench,
  LifeBuoy,
  ArrowRight,
  ExternalLink,
  Check,
  Tag,
  FileText,
  Sparkles,
  Info
} from 'lucide-react';

export default function NotificationDetailModal({
  isOpen,
  notification,
  onClose,
  onMarkRead,
  onNavigateToResource
}) {
  if (!isOpen || !notification) return null;

  const n = notification;
  const isUnread = !n.IsRead;

  const formatFullDate = (d) => {
    if (!d) return 'N/A';
    try {
      const date = new Date(d);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return String(d);
    }
  };

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return '';
    const now = new Date();
    const d = new Date(dateStr);
    const diffSec = Math.floor((now - d) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 172800) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getEventBadge = (typeCode = '') => {
    if (typeCode.startsWith('APPROVAL_REQUIRED') || typeCode === 'HIGHER_APPROVAL_REQUIRED') {
      return {
        label: 'Approval Action Required',
        icon: Clock,
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.15)',
        border: 'rgba(245, 158, 11, 0.3)'
      };
    }
    if (typeCode === 'APPROVAL_COMPLETED' || typeCode === 'DEPARTMENT_APPROVED') {
      return {
        label: 'Approved',
        icon: CheckCircle2,
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.15)',
        border: 'rgba(16, 185, 129, 0.3)'
      };
    }
    if (typeCode === 'ISSUE_RESOLVED' || typeCode === 'REQUEST_CLOSED') {
      return {
        label: 'Resolved / Closed',
        icon: CheckCircle2,
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.15)',
        border: 'rgba(16, 185, 129, 0.3)'
      };
    }
    if (typeCode.startsWith('SLA') || typeCode === 'APPROVAL_REJECTED' || typeCode === 'REQUEST_CANCELLED') {
      return {
        label: 'High Priority / Alert',
        icon: ShieldAlert,
        color: '#ef4444',
        bg: 'rgba(239, 68, 68, 0.15)',
        border: 'rgba(239, 68, 68, 0.3)'
      };
    }
    if (typeCode === 'ISSUE_ASSIGNED' || typeCode === 'ASSIGNMENT_REASSIGNED') {
      return {
        label: 'Work Assigned',
        icon: Wrench,
        color: '#0ea5e9',
        bg: 'rgba(14, 165, 233, 0.15)',
        border: 'rgba(14, 165, 233, 0.3)'
      };
    }
    if (typeCode === 'ISSUE_CREATED') {
      return {
        label: 'New Request Created',
        icon: LifeBuoy,
        color: '#6366f1',
        bg: 'rgba(99, 102, 241, 0.15)',
        border: 'rgba(99, 102, 241, 0.3)'
      };
    }
    return {
      label: n.TypeName || 'System Alert',
      icon: Bell,
      color: '#8b5cf6',
      bg: 'rgba(139, 92, 246, 0.15)',
      border: 'rgba(139, 92, 246, 0.3)'
    };
  };

  const badge = getEventBadge(n.TypeCode);
  const BadgeIcon = badge.icon;

  const hasRelatedResource = Boolean(n.TriggeredByID || n.TriggeredByTable === 'IssueRequest');

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(10, 15, 30, 0.72)',
        backdropFilter: 'blur(10px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '560px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--glass-border)',
          borderRadius: '20px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5), 0 0 30px rgba(99, 102, 241, 0.15)',
          overflow: 'hidden',
          animation: 'scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--glass-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-tertiary)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: badge.bg,
                border: `1px solid ${badge.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: badge.color,
                boxShadow: `0 0 16px ${badge.bg}`
              }}
            >
              <BadgeIcon size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: badge.color
                  }}
                >
                  {badge.label}
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontWeight: 700,
                    background: isUnread ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    color: isUnread ? '#ef4444' : '#10b981'
                  }}
                >
                  {isUnread ? 'Unread' : 'Read'}
                </span>
              </div>
              <h3 style={{ margin: '3px 0 0', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Notification Details
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            title="Close"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-tertiary)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Title & Timestamp */}
          <div>
            <h4
              style={{
                margin: '0 0 6px',
                fontSize: '1.2rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                lineHeight: 1.35
              }}
            >
              {n.Title}
            </h4>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '0.82rem',
                color: 'var(--text-muted)'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Clock size={13} /> {formatFullDate(n.CreatedDate || n.NotificationDate)}
              </span>
              <span>•</span>
              <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>
                {formatRelativeTime(n.CreatedDate || n.NotificationDate)}
              </span>
            </div>
          </div>

          {/* Full Message Box */}
          <div
            style={{
              padding: '16px 18px',
              borderRadius: '12px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-secondary)',
              fontSize: '0.92rem',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap'
            }}
          >
            {n.MessageText}
          </div>

          {/* Metadata Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--glass-border)'
              }}
            >
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Event Type
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, marginTop: '2px' }}>
                {n.TypeName || n.TypeCode}
              </div>
            </div>

            <div
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--glass-border)'
              }}
            >
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Channel
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, marginTop: '2px' }}>
                {n.ChannelCode || 'In-App Alert'}
              </div>
            </div>

            {n.TriggeredByID && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--glass-border)'
                }}
              >
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Reference Record
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: 700, marginTop: '2px' }}>
                  {n.TriggeredByTable || 'Record'} #{n.TriggeredByID}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--glass-border)',
            background: 'var(--bg-tertiary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isUnread ? (
              <button
                onClick={() => onMarkRead?.(n.UserNotificationID)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--glass-border)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
              >
                <Check size={14} color="#10b981" /> Mark as Read
              </button>
            ) : (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <CheckCircle2 size={13} color="#10b981" /> Read
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '9px 18px',
                borderRadius: '10px',
                border: '1px solid var(--glass-border)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Close
            </button>

            {hasRelatedResource && onNavigateToResource && (
              <button
                onClick={() => onNavigateToResource(n)}
                style={{
                  padding: '9px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'var(--accent-gradient, linear-gradient(135deg, #6366f1 0%, #4f46e5 100%))',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
                  transition: 'all 0.2s'
                }}
              >
                View Related Request <ArrowRight size={15} />
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
