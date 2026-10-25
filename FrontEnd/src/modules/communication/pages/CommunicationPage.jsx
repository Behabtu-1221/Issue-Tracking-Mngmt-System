import React, { useState, useEffect } from 'react';
import {
  MessageSquare, Shield, Megaphone, Users, Activity, RefreshCw,
  Inbox, Sparkles, ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../../modules/authentication/contexts/AuthContext';
import { useTranslation } from '../../../i18n/LanguageContext';
import communicationApi from '../api/communicationApi';
import CommMetricsHeader from '../components/CommMetricsHeader';
import RequestCommentsTab from '../components/RequestCommentsTab';
import AnnouncementsTab from '../components/AnnouncementsTab';
import TeamDiscussionsTab from '../components/TeamDiscussionsTab';
import ActivityTimelineTab from '../components/ActivityTimelineTab';
import ConversationListPanel from '../components/ConversationListPanel';
import ConversationPanel from '../components/ConversationPanel';

export default function CommunicationPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const currentUserId = user?.id || user?.userId || user?.UserID || 1;
  const userRole = (user?.role || user?.RoleName || '').toUpperCase();
  const [activeTab, setActiveTab] = useState('conversations');
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedConv, setSelectedConv] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await communicationApi.getOverviewMetrics();
      setMetrics(res.data?.data || null);
    } catch (err) {
      console.error('Failed to fetch communication metrics:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const navTabs = [
    { id: 'conversations', label: t('communication.tabs.conversations', 'Conversations & Chat'), icon: MessageSquare },
    { id: 'comments', label: t('communication.tabs.comments', 'Ticket Comments'), icon: Inbox },
    { id: 'announcements', label: t('communication.tabs.announcements', 'Campus Bulletins'), icon: Megaphone },
    { id: 'discussions', label: t('communication.tabs.discussions', 'Team Channels'), icon: Users },
    { id: 'timeline', label: t('communication.tabs.timeline', 'Audit Timeline'), icon: Activity }
  ];

  const getRoleBadge = () => {
    if (['SUPER_ADMIN', 'PARK_ADMIN', 'ADMIN'].some(r => userRole.includes(r))) {
      return { label: t('communication.roleBadges.admin', 'Admin Command'), color: '#818cf8', bg: 'rgba(99, 102, 241, 0.15)', border: 'rgba(99, 102, 241, 0.35)' };
    }
    if (userRole.includes('TECH')) {
      return { label: t('communication.roleBadges.tech', 'Technician Desk'), color: '#34d399', bg: 'rgba(52, 211, 153, 0.15)', border: 'rgba(52, 211, 153, 0.35)' };
    }
    if (userRole.includes('MANAGER')) {
      return { label: t('communication.roleBadges.manager', 'Department Dispatch'), color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)', border: 'rgba(251, 191, 36, 0.35)' };
    }
    return { label: t('communication.roleBadges.requester', 'Requester Portal'), color: '#60a5fa', bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.35)' };
  };

  const roleMeta = getRoleBadge();

  return (
    <div style={{ padding: isMobile ? '16px' : '28px', maxWidth: '1600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
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
            margin: 0, fontSize: isMobile ? '1.5rem' : '1.85rem', fontWeight: 800,
            color: 'var(--text-primary)', letterSpacing: '-0.02em',
            display: 'flex', alignItems: 'center', gap: '10px'
          }}>
            <MessageSquare size={isMobile ? 24 : 28} color="#6366f1" />
            {t('communication.title', 'Communication & Collaboration Hub')}
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
            {t('communication.subtitle', 'Interactive ticket discussions, staff diagnostics, team channels, campus bulletins & audit history')}
          </p>
        </div>

        <button
          onClick={fetchMetrics}
          disabled={loading}
          style={{
            background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
            borderRadius: '12px', padding: '10px 18px', color: 'var(--text-secondary)',
            fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', display: 'flex',
            alignItems: 'center', gap: '8px', transition: 'all 0.2s', backdropFilter: 'blur(12px)'
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
        >
          <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          <span>{t('communication.refreshBtn', 'Refresh')}</span>
        </button>
      </div>

      {/* KPI Header */}
      <CommMetricsHeader metrics={metrics} activeTab={activeTab} onTabChange={setActiveTab} />

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
              onClick={() => { setActiveTab(tab.id); setSelectedConv(null); }}
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
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'conversations' && (
        <div>
          {isMobile ? (
            /* Mobile Single-Pane Toggle */
            selectedConv ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <button
                  onClick={() => setSelectedConv(null)}
                  style={{
                    alignSelf: 'flex-start',
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    padding: '8px 16px', borderRadius: '10px',
                    background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                    color: 'var(--text-primary)', fontSize: '0.84rem', fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <ArrowLeft size={16} />
                  <span>Back to Discussions List</span>
                </button>
                <ConversationPanel
                  conversationId={selectedConv.ConversationID}
                  issueRequestId={selectedConv.ReferenceIssueRequestID}
                  currentUserId={currentUserId}
                />
              </div>
            ) : (
              <ConversationListPanel
                currentUserId={currentUserId}
                onSelectConversation={setSelectedConv}
              />
            )
          ) : (
            /* Desktop Split Layout */
            <div style={{ display: 'grid', gridTemplateColumns: selectedConv ? '380px 1fr' : '1fr', gap: '20px' }}>
              <ConversationListPanel
                currentUserId={currentUserId}
                onSelectConversation={setSelectedConv}
              />
              {selectedConv && (
                <ConversationPanel
                  conversationId={selectedConv.ConversationID}
                  issueRequestId={selectedConv.ReferenceIssueRequestID}
                  currentUserId={currentUserId}
                />
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'comments' && <RequestCommentsTab />}
      {activeTab === 'announcements' && <AnnouncementsTab />}
      {activeTab === 'discussions' && <TeamDiscussionsTab />}
      {activeTab === 'timeline' && <ActivityTimelineTab />}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
