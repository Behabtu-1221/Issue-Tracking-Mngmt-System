import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Check, CheckCheck, Clock, ShieldAlert, LifeBuoy,
  CheckSquare, Sparkles, Search, Filter, RefreshCw, ExternalLink,
  Wrench, CheckCircle2, AlertTriangle, ArrowRight, Trash2, Eye
} from 'lucide-react';
import notificationApi from '../api/notificationApi';
import NotificationDetailModal from './NotificationDetailModal';
import { useAuth } from '../../authentication/contexts/AuthContext';

const glassCard = {
  background: 'var(--glass-bg)',
  border: '1px solid var(--glass-border)',
  borderRadius: '20px',
  backdropFilter: 'blur(16px)',
  padding: '24px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
};

export default function NotifInboxTab({ onRefreshMetrics }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [activeFilter, setActiveFilter] = useState('ALL'); // ALL, UNREAD, DISPATCH, APPROVAL, SLA, TICKET
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);

  const userRole = (user?.role || user?.RoleName || '').toUpperCase();
  const isTech = userRole.includes('TECH');

  const loadInbox = async () => {
    setLoading(true);
    try {
      const res = await notificationApi.getInbox({
        unreadOnly: activeFilter === 'UNREAD'
      });
      const list = res.data?.data || res.data?.notifications || (Array.isArray(res.data) ? res.data : []);
      setNotifications(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error('Failed to load inbox:', e);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInbox();
  }, [activeFilter]);

  const handleMarkRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications(prev => prev.map(n => n.UserNotificationID === id ? { ...n, IsRead: 1 } : n));
      if (onRefreshMetrics) onRefreshMetrics();
    } catch (e) {
      console.error('Failed to mark notification read:', e);
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await notificationApi.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, IsRead: 1 })));
      if (onRefreshMetrics) onRefreshMetrics();
    } catch (e) {
      console.error('Failed to mark all read:', e);
    } finally {
      setMarkingAll(false);
    }
  };

  const formatRelativeTime = (d) => {
    if (!d) return '';
    const now = new Date();
    const date = new Date(d);
    const diffSec = Math.floor((now - date) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 172800) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatFullDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getTypeMeta = (code = '') => {
    switch (code) {
      case 'ISSUE_ASSIGNED':
      case 'ASSIGNMENT_REASSIGNED':
        return {
          icon: Wrench,
          label: 'Work Dispatch',
          color: '#0ea5e9',
          bg: 'rgba(14, 165, 233, 0.15)',
          border: 'rgba(14, 165, 233, 0.3)'
        };
      case 'SLA_BREACH':
      case 'SLA_WARNING':
        return {
          icon: ShieldAlert,
          label: 'SLA Escalation',
          color: '#ef4444',
          bg: 'rgba(239, 68, 68, 0.15)',
          border: 'rgba(239, 68, 68, 0.3)'
        };
      case 'APPROVAL_REQUIRED':
      case 'HIGHER_APPROVAL_REQUIRED':
        return {
          icon: CheckSquare,
          label: 'Approval Action',
          color: '#f59e0b',
          bg: 'rgba(245, 158, 11, 0.15)',
          border: 'rgba(245, 158, 11, 0.3)'
        };
      case 'APPROVAL_COMPLETED':
      case 'ISSUE_RESOLVED':
        return {
          icon: CheckCircle2,
          label: 'Completed / Approved',
          color: '#10b981',
          bg: 'rgba(16, 185, 129, 0.15)',
          border: 'rgba(16, 185, 129, 0.3)'
        };
      case 'ISSUE_CREATED':
        return {
          icon: LifeBuoy,
          label: 'Ticket Created',
          color: '#6366f1',
          bg: 'rgba(99, 102, 241, 0.15)',
          border: 'rgba(99, 102, 241, 0.3)'
        };
      default:
        return {
          icon: Bell,
          label: 'System Alert',
          color: '#8b5cf6',
          bg: 'rgba(139, 92, 246, 0.15)',
          border: 'rgba(139, 92, 246, 0.3)'
        };
    }
  };

  const handleItemClick = (n) => {
    if (!n.IsRead) {
      handleMarkRead(n.UserNotificationID);
    }
    setSelectedNotif({ ...n, IsRead: 1 });
  };

  const handleNavigateToResource = (n) => {
    setSelectedNotif(null);
    const type = n?.TypeCode || '';
    const table = n?.TriggeredByTable || '';
    const resourceId = n?.TriggeredByID || '';
    const role = userRole;
    const param = resourceId ? `?id=${resourceId}` : '';

    if (type.startsWith('APPROVAL') || table === 'Approval') {
      navigate(`/approvals/queue${param}`);
    } else if (type === 'ISSUE_ASSIGNED' && (isTech || role.includes('TECHNICIAN'))) {
      navigate(resourceId ? `/technician/request/${resourceId}` : '/technician/assigned');
    } else if (type === 'APPROVAL_COMPLETED' && (role.includes('DISPATCH') || role.includes('MANAGER'))) {
      navigate(`/dispatch/queue${param}`);
    } else if (table === 'SLAClock' || type.startsWith('SLA')) {
      navigate('/sla/clocks');
    } else if (role.includes('EMPLOYEE') || role.includes('TENANT')) {
      navigate(`/issues/my-requests${param}`);
    } else {
      navigate(`/issues/tracker${param}`);
    }
  };

  // Filtered list
  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'UNREAD' && n.IsRead) return false;
    if (activeFilter === 'DISPATCH' && !n.TypeCode?.includes('ASSIGN')) return false;
    if (activeFilter === 'APPROVAL' && !n.TypeCode?.includes('APPROVAL')) return false;
    if (activeFilter === 'SLA' && !n.TypeCode?.includes('SLA')) return false;
    if (activeFilter === 'TICKET' && (!n.TypeCode?.includes('ISSUE') || n.TypeCode?.includes('ASSIGN'))) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (n.Title || '').toLowerCase().includes(q);
      const matchMsg = (n.MessageText || '').toLowerCase().includes(q);
      const matchType = (n.TypeName || n.TypeCode || '').toLowerCase().includes(q);
      return matchTitle || matchMsg || matchType;
    }
    return true;
  });

  const unreadTotal = notifications.filter(n => !n.IsRead).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Search & Action Bar */}
      <div style={{
        ...glassCard,
        padding: '18px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 320px' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '12px',
            background: unreadTotal > 0
              ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)'
              : 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(79, 70, 229, 0.1) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: unreadTotal > 0 ? '#ef4444' : '#6366f1',
            border: `1px solid ${unreadTotal > 0 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(99, 102, 241, 0.3)'}`
          }}>
            <Bell size={20} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 800 }}>
                Notification Inbox & Alert Feed
              </h3>
              {unreadTotal > 0 && (
                <span style={{
                  background: '#ef4444', color: '#fff',
                  padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 800
                }}>
                  {unreadTotal} Unread
                </span>
              )}
            </div>
            <p style={{ margin: '2px 0 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              Personalized event broadcasts, ticket status changes, and action alerts
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', width: '220px' }}>
            <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '8px 12px 8px 34px',
                borderRadius: '10px', background: 'var(--bg-tertiary)',
                border: '1px solid var(--glass-border)', color: 'var(--text-primary)',
                fontSize: '0.82rem', outline: 'none'
              }}
            />
          </div>

          <button
            onClick={loadInbox}
            disabled={loading}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px', borderRadius: '10px',
              border: '1px solid var(--glass-border)', background: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            <span>Refresh</span>
          </button>

          {unreadTotal > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingAll}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', borderRadius: '10px', border: 'none',
                background: 'var(--accent-gradient)', color: '#fff',
                fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)',
                transition: 'all 0.2s'
              }}
            >
              <CheckCheck size={15} />
              <span>Mark All Read</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {[
          { id: 'ALL', label: 'All Alerts', count: notifications.length },
          { id: 'UNREAD', label: 'Unread Only', count: unreadTotal },
          { id: 'DISPATCH', label: 'Work Dispatches', count: notifications.filter(n => n.TypeCode?.includes('ASSIGN')).length },
          { id: 'APPROVAL', label: 'Approvals', count: notifications.filter(n => n.TypeCode?.includes('APPROVAL')).length },
          { id: 'SLA', label: 'SLA Escalations', count: notifications.filter(n => n.TypeCode?.includes('SLA')).length },
          { id: 'TICKET', label: 'Ticket Updates', count: notifications.filter(n => n.TypeCode?.includes('ISSUE') && !n.TypeCode?.includes('ASSIGN')).length }
        ].map(chip => {
          const isActive = activeFilter === chip.id;
          return (
            <button
              key={chip.id}
              onClick={() => setActiveFilter(chip.id)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '7px 14px', borderRadius: '20px',
                fontSize: '0.78rem', fontWeight: isActive ? 700 : 500,
                background: isActive ? 'var(--accent-gradient)' : 'var(--bg-tertiary)',
                border: isActive ? '1px solid transparent' : '1px solid var(--glass-border)',
                color: isActive ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap'
              }}
            >
              <span>{chip.label}</span>
              <span style={{
                fontSize: '0.68rem', padding: '1px 6px', borderRadius: '10px',
                background: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(148,163,184,0.15)',
                color: isActive ? '#fff' : 'var(--text-muted)', fontWeight: 700
              }}>
                {chip.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Notification Items List */}
      <div style={{ ...glassCard, padding: '18px 20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px 0' }}>
            <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px', color: '#6366f1' }} />
            <span style={{ fontSize: '0.86rem' }}>Synchronizing notification inbox...</span>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px 20px' }}>
            <Bell size={42} color="rgba(148, 163, 184, 0.3)" style={{ marginBottom: '12px' }} />
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              No notifications in this view
            </div>
            <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>
              {searchQuery ? 'Try clearing your search query' : 'You are all caught up! No alerts awaiting response.'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredNotifications.map((n, i) => {
              const meta = getTypeMeta(n.TypeCode);
              const IconComp = meta.icon;
              const isUnread = !n.IsRead;

              return (
                <div
                  key={n.UserNotificationID || i}
                  onClick={() => handleItemClick(n)}
                  style={{
                    background: isUnread
                      ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(79, 70, 229, 0.04) 100%)'
                      : 'var(--bg-tertiary)',
                    border: isUnread ? '1px solid rgba(99, 102, 241, 0.35)' : '1px solid var(--glass-border)',
                    borderLeft: isUnread ? '4px solid #6366f1' : '1px solid var(--glass-border)',
                    borderRadius: '16px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                    boxShadow: isUnread ? '0 4px 18px rgba(99, 102, 241, 0.1)' : 'none',
                    animation: `fadeInUp 0.25s ease-out ${Math.min(i * 0.04, 0.4)}s both`
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateX(3px)';
                    e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.5)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateX(0)';
                    e.currentTarget.style.borderColor = isUnread ? 'rgba(99, 102, 241, 0.35)' : 'var(--glass-border)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1, minWidth: 0 }}>
                    {/* Event Icon Badge */}
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '12px',
                      background: meta.bg, border: `1px solid ${meta.border}`,
                      color: meta.color, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', flexShrink: 0, marginTop: '2px'
                    }}>
                      <IconComp size={18} />
                    </div>

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <h4 style={{
                          margin: 0,
                          color: isUnread ? 'var(--text-primary)' : 'var(--text-secondary)',
                          fontSize: '0.94rem',
                          fontWeight: isUnread ? 800 : 600
                        }}>
                          {n.Title}
                        </h4>

                        <span style={{
                          background: meta.bg, color: meta.color,
                          padding: '1px 8px', borderRadius: '6px', fontSize: '0.68rem',
                          fontWeight: 800, border: `1px solid ${meta.border}`,
                          letterSpacing: '0.3px', textTransform: 'uppercase'
                        }}>
                          {meta.label}
                        </span>

                        {isUnread && (
                          <span style={{
                            width: '8px', height: '8px', borderRadius: '50%',
                            background: '#ef4444', boxShadow: '0 0 8px #ef4444'
                          }} />
                        )}
                      </div>

                      <p style={{
                        margin: '0 0 8px', color: 'var(--text-secondary)',
                        fontSize: '0.86rem', lineHeight: 1.5,
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical', overflow: 'hidden'
                      }}>
                        {n.MessageText}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)', fontSize: '0.74rem' }}>
                          <Clock size={12} />
                          <span title={formatFullDate(n.NotificationDate || n.CreatedDate)}>
                            {formatRelativeTime(n.NotificationDate || n.CreatedDate)}
                          </span>
                        </span>

                        {n.TriggeredByID && (
                          <span style={{
                            color: '#818cf8', fontSize: '0.74rem', fontWeight: 700,
                            display: 'inline-flex', alignItems: 'center', gap: '4px'
                          }}>
                            <span>Ref #{n.TriggeredByID}</span>
                          </span>
                        )}

                        <span style={{ color: 'var(--accent-primary)', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Eye size={12} /> View Details
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    {isUnread && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkRead(n.UserNotificationID);
                        }}
                        title="Mark as Read"
                        style={{
                          background: 'rgba(99, 102, 241, 0.15)',
                          border: '1px solid rgba(99, 102, 241, 0.3)',
                          borderRadius: '8px',
                          padding: '6px 12px',
                          color: '#818cf8',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          transition: 'all 0.2s'
                        }}
                      >
                        <Check size={13} />
                        <span>Read</span>
                      </button>
                    )}

                    {n.TriggeredByID && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNavigateToResource(n);
                        }}
                        title="Open Resource Directly"
                        style={{
                          background: 'var(--bg-primary)',
                          border: '1px solid var(--glass-border)',
                          borderRadius: '8px',
                          padding: '6px 10px',
                          color: 'var(--text-secondary)',
                          fontSize: '0.76rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.2s'
                        }}
                      >
                        <ExternalLink size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <NotificationDetailModal
        isOpen={!!selectedNotif}
        notification={selectedNotif}
        onClose={() => setSelectedNotif(null)}
        onMarkRead={handleMarkRead}
        onNavigateToResource={handleNavigateToResource}
      />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
