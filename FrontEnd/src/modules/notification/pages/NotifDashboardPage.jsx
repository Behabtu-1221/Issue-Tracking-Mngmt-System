import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Inbox, BookOpen, History, Clock, Send, RefreshCw,
  Home, ChevronRight, ArrowUpRight, ShieldCheck, Activity, BarChart2,
  Sliders, Sparkles, AlertTriangle, CheckCircle2, Wrench, LifeBuoy
} from 'lucide-react';
import notificationApi from '../api/notificationApi';
import NotifMetricsHeader from '../components/NotifMetricsHeader';
import SendNotificationModal from '../components/SendNotificationModal';
import { useAuth } from '../../authentication/contexts/AuthContext';
import { useTranslation } from '../../../i18n/LanguageContext';

const glassCard = {
  background: 'var(--glass-bg)',
  border: '1px solid var(--glass-border)',
  borderRadius: '20px',
  backdropFilter: 'blur(16px)',
  padding: '24px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
};

export default function NotifDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [metrics, setMetrics] = useState(null);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [recentReminders, setRecentReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);

  const userRole = (user?.role || user?.RoleName || '').toUpperCase();
  const isStaff = ['SUPER_ADMIN', 'PARK_ADMIN', 'DEPARTMENT_MANAGER', 'TECHNICIAN', 'STAFF', 'ADMIN'].some(r => userRole.includes(r)) || !userRole;
  const isAdmin = ['SUPER_ADMIN', 'PARK_ADMIN', 'ADMIN'].some(r => userRole.includes(r));
  const isTech = userRole.includes('TECH');
  const isManager = userRole.includes('MANAGER');

  const getRoleBadge = () => {
    if (isAdmin) return { label: t('approval.adminCommand', 'Admin Command'), color: '#818cf8', bg: 'rgba(99, 102, 241, 0.15)', border: 'rgba(99, 102, 241, 0.35)' };
    if (isTech) return { label: t('approval.technicianDesk', 'Technician Desk'), color: '#34d399', bg: 'rgba(52, 211, 153, 0.15)', border: 'rgba(52, 211, 153, 0.35)' };
    if (isManager) return { label: t('approval.departmentDispatch', 'Department Dispatch'), color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)', border: 'rgba(251, 191, 36, 0.35)' };
    return { label: t('approval.requesterPortal', 'Requester Portal'), color: '#60a5fa', bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.35)' };
  };

  const roleMeta = getRoleBadge();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [metricsRes, inboxRes, remRes] = await Promise.allSettled([
        notificationApi.getOverviewMetrics(),
        notificationApi.getInbox({ limit: 4 }),
        notificationApi.getReminders()
      ]);

      if (metricsRes.status === 'fulfilled') {
        setMetrics(metricsRes.value.data?.data || null);
      }
      if (inboxRes.status === 'fulfilled') {
        const rawInbox = inboxRes.value.data?.data || inboxRes.value.data?.notifications || [];
        setRecentNotifications(Array.isArray(rawInbox) ? rawInbox.slice(0, 4) : []);
      }
      if (remRes.status === 'fulfilled') {
        const rawRem = remRes.value.data?.data || [];
        setRecentReminders(Array.isArray(rawRem) ? rawRem.slice(0, 4) : []);
      }
    } catch (err) {
      console.error('Failed to fetch notification dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const m = metrics || {};

  const allNavCards = [
    {
      id: 'inbox',
      title: t('notifications.tabs.inbox', 'Alert Feed & Inbox'),
      desc: t('notifications.inboxTab.subtitle', 'Personalized broadcast alerts, work assignments, and unread feeds'),
      val: (m.unreadInApp || m.unreadCount || 0) + ' ' + t('notifications.unread', 'Unread'),
      icon: Inbox,
      color: '#6366f1',
      bg: 'rgba(99, 102, 241, 0.15)',
      route: '/notifications/inbox'
    },
    {
      id: 'preferences',
      title: t('notifications.tabs.preferences', 'Delivery Preferences'),
      desc: t('notifications.preferencesTab.subtitle', 'Configure email vs in-app delivery toggles per operational event'),
      val: t('notifications.preferencesTab.title', 'Custom Channels'),
      icon: Sliders,
      color: '#0ea5e9',
      bg: 'rgba(14, 165, 233, 0.15)',
      route: '/profile?tab=notifications'
    },
    {
      id: 'reminders',
      title: t('notifications.tabs.reminders', 'Automated Reminders'),
      desc: t('notifications.remindersTab.subtitle', 'Scheduled SLA escalation checkpoints and pending task reminders'),
      val: (m.pendingReminders || 0) + ' ' + t('notifications.pending', 'Scheduled'),
      icon: Clock,
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.15)',
      route: '/notifications/reminders'
    },
    {
      id: 'templates',
      title: t('notifications.tabs.templates', 'Notification Layouts'),
      desc: t('notifications.templatesTab.subtitle', 'Mustache HTML email bodies, placeholders, and trigger parameters'),
      val: t('notifications.templatesTab.title', 'Production Templates'),
      icon: BookOpen,
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.15)',
      route: '/notifications/templates',
      adminOnly: true
    },
    {
      id: 'log',
      title: t('notifications.tabs.log', 'Delivery Audit Log'),
      desc: t('notifications.deliveryLogTab.subtitle', 'Historical SMTP transmission logs, latency traces, and delivery audits'),
      val: (m.emailsDelivered || 0) + ' ' + t('notifications.delivered', 'Delivered'),
      icon: History,
      color: '#8b5cf6',
      bg: 'rgba(139, 92, 246, 0.15)',
      route: '/notifications/log',
      adminOnly: true
    }
  ];

  const quickNavCards = allNavCards.filter(c => !c.adminOnly || isStaff || isAdmin);

  const formatRelativeTime = (d) => {
    if (!d) return '';
    const now = new Date();
    const date = new Date(d);
    const diffSec = Math.floor((now - date) / 1000);
    if (diffSec < 60) return t('common.justNow', 'Just now');
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{
              padding: '3px 10px', borderRadius: '20px', fontSize: '0.74rem',
              fontWeight: 800, background: roleMeta.bg, color: roleMeta.color,
              border: `1px solid ${roleMeta.border}`, letterSpacing: '0.4px',
              display: 'inline-flex', alignItems: 'center', gap: '5px'
            }}>
              <Sparkles size={12} /> {roleMeta.label}
            </span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '3px 10px', borderRadius: '20px',
              background: 'rgba(74, 222, 128, 0.12)', border: '1px solid rgba(74, 222, 128, 0.3)',
              color: '#4ade80', fontSize: '0.72rem', fontWeight: 700
            }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px #4ade80' }} />
              {t('notifications.engineBadge', 'Live Notification Engine')}
            </span>
          </div>

          <h1 style={{
            fontSize: '1.9rem', fontWeight: 800, margin: 0,
            color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px'
          }}>
            <Bell size={32} color="#6366f1" />
            {t('notifications.title', 'Alerts & Notification')} <span style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{t('common.operations', 'Operations')}</span>
          </h1>
          <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {t('notifications.managementSubtitle', 'Real-time SMTP alert transmission, personalized delivery preferences, templates & automated SLA reminders')}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {(isStaff || isAdmin) && (
            <button
              onClick={() => setShowDispatchModal(true)}
              style={{
                background: 'var(--accent-gradient)',
                border: 'none',
                borderRadius: '12px',
                padding: '9px 18px',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
                transition: 'all 0.2s'
              }}
            >
              <Send size={15} />
              <span>{t('notifications.sendNotifBtn', 'Dispatch / Test Email')}</span>
            </button>
          )}

          <button
            onClick={fetchData}
            disabled={loading}
            style={{
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: '12px',
              padding: '9px 16px',
              color: 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backdropFilter: 'blur(12px)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            <span>{t('common.refresh', 'Refresh')}</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Header */}
      <NotifMetricsHeader metrics={metrics} activeTab="dashboard" onTabChange={(tabId) => navigate(`/notifications/${tabId}`)} />

      {/* Module Navigation Grid */}
      <div>
        <h2 style={{
          fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)',
          margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <BarChart2 size={18} color="#6366f1" />
          {t('notifications.workflowsTitle', 'Notification Workflows & Functional Centers')}
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '18px'
        }}>
          {quickNavCards.map((card) => {
            const Icon = card.icon;
            const isHovered = hoveredCard === card.id;
            return (
              <div
                key={card.id}
                onClick={() => navigate(card.route)}
                onMouseEnter={() => setHoveredCard(card.id)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  ...glassCard,
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: isHovered ? 'translateY(-4px)' : 'none',
                  borderColor: isHovered ? card.color : 'var(--glass-border)',
                  boxShadow: isHovered ? `0 12px 28px -6px ${card.color}25` : '0 4px 16px rgba(0,0,0,0.06)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div style={{
                    width: '46px', height: '46px', borderRadius: '14px', background: card.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: card.color, border: `1px solid ${card.color}40`,
                    transition: 'transform 0.3s',
                    transform: isHovered ? 'rotate(-6deg) scale(1.08)' : 'rotate(0) scale(1)'
                  }}>
                    <Icon size={22} />
                  </div>

                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    color: isHovered ? card.color : 'var(--text-muted)',
                    fontSize: '0.78rem', fontWeight: 700, transition: 'color 0.2s'
                  }}>
                    <span>{t('notifications.openModule', 'Open Module')}</span>
                    <ArrowUpRight size={14} />
                  </div>
                </div>

                <h3 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {card.title}
                </h3>
                <p style={{ margin: '0 0 16px', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {card.desc}
                </p>

                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '5px 12px', borderRadius: '8px',
                  background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                  fontSize: '0.78rem', fontWeight: 700, color: card.color
                }}>
                  <ShieldCheck size={13} />
                  <span>{card.val}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2-Column Live Feed Preview: Recent Notifications & Scheduled Reminders */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '22px' }}>
        {/* Left Column: Recent Unread / Active Notifications */}
        <div style={{
          ...glassCard,
          display: 'flex',
          flexDirection: 'column',
          padding: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '10px',
                background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Inbox size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {t('notifications.recentStreamTitle', 'Recent Notifications Stream')}
                </h3>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  {t('notifications.recentStreamSub', 'Latest alerts dispatched to your account')}
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate('/notifications/inbox')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '6px 12px', borderRadius: '8px',
                background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.25)',
                color: '#818cf8', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer'
              }}
            >
              <span>{t('notifications.viewAll', 'View All')}</span>
              <ArrowUpRight size={13} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)' }}>
                <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px', color: '#6366f1' }} />
                <span style={{ fontSize: '0.8rem' }}>{t('common.loading', 'Loading alerts...')}</span>
              </div>
            ) : recentNotifications.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '40px 16px', borderRadius: '14px',
                background: 'var(--bg-tertiary)', border: '1px dashed var(--glass-border)',
                color: 'var(--text-muted)'
              }}>
                <Bell size={28} color="rgba(148, 163, 184, 0.3)" style={{ marginBottom: '8px' }} />
                <div style={{ fontSize: '0.86rem', fontWeight: 600 }}>{t('notifications.inboxTab.emptyTitle', 'Your inbox is all clear')}</div>
                <div style={{ fontSize: '0.76rem', marginTop: '2px' }}>{t('notifications.inboxTab.emptyDesc', 'No pending alerts or notifications.')}</div>
              </div>
            ) : (
              recentNotifications.map((n) => (
                <div
                  key={n.UserNotificationID}
                  onClick={() => navigate('/notifications/inbox')}
                  style={{
                    padding: '12px 16px', borderRadius: '12px',
                    background: n.IsRead ? 'var(--bg-tertiary)' : 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(79, 70, 229, 0.04) 100%)',
                    border: n.IsRead ? '1px solid var(--glass-border)' : '1px solid rgba(99, 102, 241, 0.3)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', gap: '12px', transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateX(3px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                        {n.Title}
                      </span>
                      {!n.IsRead && (
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ef4444' }} />
                      )}
                    </div>
                    <div style={{
                      fontSize: '0.78rem', color: 'var(--text-secondary)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px'
                    }}>
                      {n.MessageText}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {formatRelativeTime(n.NotificationDate || n.CreatedDate)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Scheduled Automated Reminders */}
        <div style={{
          ...glassCard,
          display: 'flex',
          flexDirection: 'column',
          padding: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Clock size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {t('notifications.remindersTab.title', 'Active Scheduled Reminders')}
                </h3>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  {t('notifications.remindersTab.subtitle', 'Automated SLA alerts & task checkpoints')}
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate('/notifications/reminders')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '6px 12px', borderRadius: '8px',
                background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)',
                color: '#f59e0b', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer'
              }}
            >
              <span>{t('notifications.viewAll', 'View All')}</span>
              <ArrowUpRight size={13} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)' }}>
                <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px', color: '#f59e0b' }} />
                <span style={{ fontSize: '0.8rem' }}>{t('common.loading', 'Loading reminders...')}</span>
              </div>
            ) : recentReminders.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '40px 16px', borderRadius: '14px',
                background: 'var(--bg-tertiary)', border: '1px dashed var(--glass-border)',
                color: 'var(--text-muted)'
              }}>
                <Clock size={28} color="rgba(148, 163, 184, 0.3)" style={{ marginBottom: '8px' }} />
                <div style={{ fontSize: '0.86rem', fontWeight: 600 }}>{t('notifications.noReminders', 'No scheduled reminders')}</div>
                <div style={{ fontSize: '0.76rem', marginTop: '2px' }}>{t('notifications.noRemindersSub', 'Set up reminders for SLA checks or ticket follow-ups.')}</div>
              </div>
            ) : (
              recentReminders.map((r) => {
                const isCompleted = r.Status === 'COMPLETED';
                return (
                  <div
                    key={r.NotificationReminderID}
                    onClick={() => navigate('/notifications/reminders')}
                    style={{
                      padding: '12px 16px', borderRadius: '12px',
                      background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between', gap: '12px', transition: 'all 0.2s',
                      opacity: isCompleted ? 0.7 : 1
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateX(3px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--text-primary)', textDecoration: isCompleted ? 'line-through' : 'none' }}>
                        {r.Title}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {new Date(r.ReminderDateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <span style={{
                      padding: '2px 8px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 800,
                      background: isCompleted ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                      color: isCompleted ? '#10b981' : '#f59e0b'
                    }}>
                      {r.Status}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Dispatch Modal */}
      <SendNotificationModal
        isOpen={showDispatchModal}
        onClose={() => setShowDispatchModal(false)}
        onSuccess={fetchData}
      />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
