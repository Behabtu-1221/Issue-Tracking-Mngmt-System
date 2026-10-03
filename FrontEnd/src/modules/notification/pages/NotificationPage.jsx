import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Bell, BookOpen, History, Clock, Send, RefreshCw, Inbox,
  Sliders, ShieldCheck, Sparkles, ArrowRight
} from 'lucide-react';
import notificationApi from '../api/notificationApi';
import NotifMetricsHeader from '../components/NotifMetricsHeader';
import NotifInboxTab from '../components/NotifInboxTab';
import NotifTemplatesTab from '../components/NotifTemplatesTab';
import NotifDeliveryLogTab from '../components/NotifDeliveryLogTab';
import NotifRemindersTab from '../components/NotifRemindersTab';
import NotifPreferencesTab from '../components/NotifPreferencesTab';
import SendNotificationModal from '../components/SendNotificationModal';
import { useAuth } from '../../authentication/contexts/AuthContext';

export default function NotificationPage({ initialTab = 'inbox' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const userRole = (user?.role || user?.RoleName || '').toUpperCase();
  const isStaff = ['SUPER_ADMIN', 'PARK_ADMIN', 'DEPARTMENT_MANAGER', 'TECHNICIAN', 'STAFF', 'ADMIN'].some(r => userRole.includes(r)) || !userRole;
  const isAdmin = ['SUPER_ADMIN', 'PARK_ADMIN', 'ADMIN'].some(r => userRole.includes(r));
  const isTech = userRole.includes('TECH');
  const isManager = userRole.includes('MANAGER');

  // Infer tab from URL path if available
  const getTabFromPath = () => {
    const parts = location.pathname.split('/');
    const lastPart = parts[parts.length - 1];
    if (['inbox', 'preferences', 'templates', 'log', 'reminders'].includes(lastPart)) {
      return lastPart;
    }
    return initialTab;
  };

  const [activeTab, setActiveTab] = useState(getTabFromPath());
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await notificationApi.getOverviewMetrics();
      setMetrics(res.data?.data || null);
    } catch (err) {
      console.error('Failed to fetch notification metrics:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  useEffect(() => {
    const current = getTabFromPath();
    if (current !== activeTab) {
      setActiveTab(current);
    }
  }, [location.pathname, initialTab]);

  const handleTabSelect = (tabId) => {
    setActiveTab(tabId);
    navigate(`/notifications/${tabId}`);
  };

  const allNavTabs = [
    {
      id: 'inbox',
      label: 'Inbox & Alerts',
      icon: Inbox,
      count: metrics?.unreadInApp || metrics?.unreadCount || undefined
    },
    {
      id: 'preferences',
      label: 'Delivery Preferences',
      icon: Sliders
    },
    {
      id: 'reminders',
      label: 'Automated Reminders',
      icon: Clock,
      count: metrics?.pendingReminders || undefined
    },
    {
      id: 'templates',
      label: 'Notification Layouts',
      icon: BookOpen,
      adminOnly: true
    },
    {
      id: 'log',
      label: 'Delivery Audit Log',
      icon: History,
      adminOnly: true,
      count: metrics?.emailsDelivered || undefined
    }
  ];

  // Filter tabs by role: regular employees/tenants see inbox, preferences, reminders
  const navTabs = allNavTabs.filter(tab => !tab.adminOnly || isStaff || isAdmin);

  const getRoleBadge = () => {
    if (isAdmin) return { label: 'Admin Command', color: '#818cf8', bg: 'rgba(99, 102, 241, 0.15)', border: 'rgba(99, 102, 241, 0.35)' };
    if (isTech) return { label: 'Technician Desk', color: '#34d399', bg: 'rgba(52, 211, 153, 0.15)', border: 'rgba(52, 211, 153, 0.35)' };
    if (isManager) return { label: 'Department Dispatch', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)', border: 'rgba(251, 191, 36, 0.35)' };
    return { label: 'Requester Portal', color: '#60a5fa', bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.35)' };
  };

  const roleMeta = getRoleBadge();

  return (
    <div style={{ padding: '24px 28px', maxWidth: '1600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{
              padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem',
              fontWeight: 800, background: roleMeta.bg, color: roleMeta.color,
              border: `1px solid ${roleMeta.border}`, letterSpacing: '0.4px',
              display: 'inline-flex', alignItems: 'center', gap: '5px'
            }}>
              <Sparkles size={11} /> {roleMeta.label}
            </span>
          </div>

          <h1 style={{
            margin: 0, fontSize: '1.85rem', fontWeight: 800,
            color: 'var(--text-primary)', letterSpacing: '-0.02em',
            display: 'flex', alignItems: 'center', gap: '10px'
          }}>
            <Bell size={28} color="#6366f1" />
            Notification & Alert Center
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
            Real-time event broadcasting, personal alert feeds, delivery channels, and scheduled task reminders
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
                gap: '7px',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
                transition: 'all 0.2s'
              }}
            >
              <Send size={15} />
              <span>Dispatch / Test Alert</span>
            </button>
          )}

          <button
            onClick={fetchMetrics}
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
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Header */}
      <NotifMetricsHeader metrics={metrics} activeTab={activeTab} onTabChange={handleTabSelect} />

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex', gap: '8px',
        borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px',
        overflowX: 'auto'
      }}>
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabSelect(tab.id)}
              style={{
                background: isActive ? 'var(--accent-gradient)' : 'var(--bg-tertiary)',
                border: isActive ? '1px solid transparent' : '1px solid var(--glass-border)',
                borderRadius: '12px', padding: '9px 18px',
                color: isActive ? '#fff' : 'var(--text-secondary)',
                fontWeight: isActive ? 700 : 500, fontSize: '0.84rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s',
                whiteSpace: 'nowrap',
                boxShadow: isActive ? '0 4px 14px rgba(99, 102, 241, 0.35)' : 'none'
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span style={{
                  fontSize: '0.68rem', padding: '1px 6px', borderRadius: '10px',
                  background: isActive ? 'rgba(255, 255, 255, 0.25)' : 'rgba(148, 163, 184, 0.15)',
                  color: isActive ? '#fff' : 'var(--text-muted)', fontWeight: 700
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'inbox' && <NotifInboxTab onRefreshMetrics={fetchMetrics} />}
        {activeTab === 'preferences' && <NotifPreferencesTab />}
        {activeTab === 'reminders' && <NotifRemindersTab onRefreshMetrics={fetchMetrics} />}
        {activeTab === 'templates' && <NotifTemplatesTab />}
        {activeTab === 'log' && <NotifDeliveryLogTab />}
      </div>

      {/* Dispatch Modal */}
      <SendNotificationModal
        isOpen={showDispatchModal}
        onClose={() => setShowDispatchModal(false)}
        onSuccess={fetchMetrics}
      />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
