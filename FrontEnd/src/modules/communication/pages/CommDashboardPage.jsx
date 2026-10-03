import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare, Megaphone, Users, Activity, Shield,
  ExternalLink, ArrowUpRight, RefreshCw, Inbox, AlertTriangle,
  Clock, CheckCircle, ChevronRight, Sparkles, Building, User, Lock
} from 'lucide-react';
import communicationApi from '../api/communicationApi';
import { useAuth } from '../../../modules/authentication/contexts/AuthContext';

export default function CommDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [recentConversations, setRecentConversations] = useState([]);
  const [recentAnnouncements, setRecentAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState(null);

  const userRole = (user?.role || user?.RoleName || '').toUpperCase();
  const isStaff = ['SUPER_ADMIN', 'PARK_ADMIN', 'DEPARTMENT_MANAGER', 'TECHNICIAN', 'STAFF', 'ADMIN'].some(r => userRole.includes(r)) || !userRole;
  const isTech = userRole.includes('TECH');
  const isAdmin = ['SUPER_ADMIN', 'PARK_ADMIN', 'ADMIN'].some(r => userRole.includes(r));
  const isManager = userRole.includes('MANAGER');

  const getRoleBadge = () => {
    if (isAdmin) return { label: 'Park Operations Command', color: '#818cf8', bg: 'rgba(99, 102, 241, 0.15)', border: 'rgba(99, 102, 241, 0.35)' };
    if (isTech) return { label: 'Field Technician Desk', color: '#34d399', bg: 'rgba(52, 211, 153, 0.15)', border: 'rgba(52, 211, 153, 0.35)' };
    if (isManager) return { label: 'Department Dispatch Hub', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)', border: 'rgba(251, 191, 36, 0.35)' };
    return { label: 'Requester Support Portal', color: '#60a5fa', bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.35)' };
  };

  const roleBadge = getRoleBadge();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [metricsRes, convRes, annRes] = await Promise.allSettled([
        communicationApi.getOverviewMetrics(),
        communicationApi.getUserConversations({ limit: 4 }),
        communicationApi.getAnnouncements({ limit: 4 })
      ]);

      if (metricsRes.status === 'fulfilled') {
        setMetrics(metricsRes.value.data?.data || null);
      }
      if (convRes.status === 'fulfilled') {
        const convList = convRes.value.data?.data?.conversations || convRes.value.data?.data || [];
        setRecentConversations(Array.isArray(convList) ? convList.slice(0, 4) : []);
      }
      if (annRes.status === 'fulfilled') {
        const rawAnn = annRes.value.data?.data;
        const annList = Array.isArray(rawAnn)
          ? rawAnn
          : Array.isArray(rawAnn?.announcements)
            ? rawAnn.announcements
            : [];
        setRecentAnnouncements(annList.slice(0, 4));
      }
    } catch (err) {
      console.error('Failed to load communication dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const m = metrics || {};

  // Check for critical / emergency announcements
  const criticalAnnouncement = recentAnnouncements.find(a => (a.UrgencyLevel || '').toUpperCase() === 'CRITICAL');

  const kpiCards = [
    {
      key: 'conversations',
      label: 'My Discussions',
      value: loading ? '...' : (m.totalConversations || recentConversations.length || 0),
      sub: 'Active ticket discussion threads',
      icon: MessageSquare,
      color: '#6366f1',
      bg: 'rgba(99, 102, 241, 0.15)',
      border: '#6366f1',
      route: '/communication/discussions'
    },
    {
      key: 'unread',
      label: 'Unread Messages',
      value: loading ? '...' : (m.totalUnreadMessages || 0),
      sub: 'Messages awaiting your attention',
      icon: Inbox,
      color: (m.totalUnreadMessages || 0) > 0 ? '#ef4444' : '#10b981',
      bg: (m.totalUnreadMessages || 0) > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
      border: (m.totalUnreadMessages || 0) > 0 ? '#ef4444' : '#10b981',
      route: '/communication/discussions'
    },
    {
      key: 'announcements',
      label: 'Campus Bulletins',
      value: loading ? '...' : (m.activeAnnouncementsCount || recentAnnouncements.length || 0),
      sub: 'Active broadcast notices',
      icon: Megaphone,
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.15)',
      border: '#f59e0b',
      route: '/communication/announcements'
    },
    {
      key: isStaff ? 'notes' : 'channels',
      label: isStaff ? 'Internal Staff Notes' : 'Team Channels',
      value: loading ? '...' : (isStaff ? (m.internalNotesCount || 0) : (m.activeChannelsCount || 2)),
      sub: isStaff ? 'Staff technical annotations' : 'Collaboration groups',
      icon: isStaff ? Shield : Users,
      color: isStaff ? '#8b5cf6' : '#ec4899',
      bg: isStaff ? 'rgba(139, 92, 246, 0.15)' : 'rgba(236, 72, 153, 0.15)',
      border: isStaff ? '#8b5cf6' : '#ec4899',
      route: isStaff ? '/communication/timeline' : '/communication/channels'
    }
  ];

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div style={{ padding: '28px', maxWidth: '1600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner Alert if Critical Announcement Exists */}
      {criticalAnnouncement && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(185, 28, 28, 0.1) 100%)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '16px',
          padding: '16px 22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          animation: 'pulseGlow 2.5s infinite',
          backdropFilter: 'blur(12px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '12px',
              background: '#ef4444', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 16px rgba(239, 68, 68, 0.6)'
            }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontSize: '0.68rem', fontWeight: 800, padding: '2px 8px', borderRadius: '6px',
                  background: '#ef4444', color: '#fff', letterSpacing: '0.5px'
                }}>
                  CRITICAL PARK ALERT
                </span>
                <span style={{ fontWeight: 800, fontSize: '0.94rem', color: '#fca5a5' }}>
                  {criticalAnnouncement.Title}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(254, 202, 202, 0.85)', marginTop: '2px' }}>
                {criticalAnnouncement.Content?.slice(0, 140)}...
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/communication/announcements')}
            style={{
              padding: '8px 16px', borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.3)', border: '1px solid rgba(239, 68, 68, 0.5)',
              color: '#fff', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap'
            }}
          >
            <span>Read Notice</span>
            <ArrowUpRight size={14} />
          </button>
        </div>
      )}

      {/* Header with Role Pill */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{
              padding: '4px 12px', borderRadius: '20px', fontSize: '0.74rem',
              fontWeight: 800, background: roleBadge.bg, color: roleBadge.color,
              border: `1px solid ${roleBadge.border}`, letterSpacing: '0.4px',
              display: 'inline-flex', alignItems: 'center', gap: '6px'
            }}>
              <Sparkles size={12} />
              {roleBadge.label}
            </span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '4px 10px', borderRadius: '20px',
              background: 'rgba(74, 222, 128, 0.12)', border: '1px solid rgba(74, 222, 128, 0.3)',
              color: '#4ade80', fontSize: '0.72rem', fontWeight: 700
            }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px #4ade80' }} />
              Live Hub Active
            </span>
          </div>

          <h1 style={{
            fontSize: '1.9rem', fontWeight: 800, margin: 0,
            color: 'var(--text-primary)', letterSpacing: '-0.02em',
            display: 'flex', alignItems: 'center', gap: '12px'
          }}>
            <MessageSquare size={32} color="#6366f1" />
            Communication & Collaboration <span style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Center</span>
          </h1>
          <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Unified real-time messaging, staff diagnostics, team channels, and park-wide announcements
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={fetchData}
            disabled={loading}
            style={{
              padding: '9px 18px', borderRadius: '12px',
              border: '1px solid var(--glass-border)', background: 'var(--glass-bg)',
              color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex',
              alignItems: 'center', gap: '8px', fontSize: '0.84rem', fontWeight: 600,
              backdropFilter: 'blur(12px)', transition: 'all 0.2s'
            }}
          >
            <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            <span>Refresh Stream</span>
          </button>
        </div>
      </div>

      {/* 4 Interactive KPI Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '18px'
      }}>
        {kpiCards.map((card) => {
          const Icon = card.icon;
          const isHovered = hoveredCard === card.key;
          return (
            <div
              key={card.key}
              onClick={() => navigate(card.route)}
              onMouseEnter={() => setHoveredCard(card.key)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                background: 'var(--glass-bg)',
                border: isHovered ? `1px solid ${card.border}` : '1px solid var(--glass-border)',
                borderRadius: '20px',
                padding: '24px',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                backdropFilter: 'blur(16px)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                boxShadow: isHovered ? `0 14px 32px -6px ${card.border}33` : '0 4px 16px rgba(0, 0, 0, 0.08)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 700 }}>
                    {card.label}
                  </div>
                  <div style={{ fontSize: '2.1rem', fontWeight: 800, margin: '8px 0 4px', color: card.color, letterSpacing: '-0.02em' }}>
                    {card.value}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{card.sub}</div>
                </div>

                <div style={{
                  width: '52px', height: '52px', borderRadius: '16px', background: card.bg,
                  color: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'transform 0.3s',
                  transform: isHovered ? 'rotate(-6deg) scale(1.08)' : 'rotate(0) scale(1)',
                  boxShadow: `0 4px 14px ${card.bg}`
                }}>
                  <Icon size={26} />
                </div>
              </div>

              <div style={{
                display: 'flex', alignItems: 'center', gap: '5px', marginTop: '16px',
                fontSize: '0.74rem', fontWeight: 700, color: card.color,
                opacity: isHovered ? 1 : 0.6, transition: 'opacity 0.2s'
              }}>
                <span>Open module</span>
                <ExternalLink size={12} />
              </div>
            </div>
          );
        })}
      </div>

      {/* 2-Column Main Workspace: Recent Discussions & Campus Bulletins */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '22px' }}>
        {/* Left Column: Recent Request Discussions */}
        <div style={{
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          borderRadius: '20px',
          padding: '24px',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '10px',
                background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <MessageSquare size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Active Request Discussions
                </h3>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Live conversations with requesters & technicians
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate('/communication/discussions')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '6px 12px', borderRadius: '8px',
                background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.25)',
                color: '#818cf8', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer'
              }}
            >
              <span>View All</span>
              <ArrowUpRight size={13} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px', color: '#6366f1' }} />
                <span style={{ fontSize: '0.8rem' }}>Loading conversations...</span>
              </div>
            ) : recentConversations.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '40px 16px', borderRadius: '14px',
                background: 'var(--bg-tertiary)', border: '1px dashed var(--glass-border)',
                color: 'var(--text-muted)'
              }}>
                <MessageSquare size={28} color="rgba(148, 163, 184, 0.3)" style={{ marginBottom: '8px' }} />
                <div style={{ fontSize: '0.86rem', fontWeight: 600 }}>No active discussions found</div>
                <div style={{ fontSize: '0.76rem', marginTop: '4px' }}>Click below to start a conversation on any open ticket.</div>
                <button
                  onClick={() => navigate('/communication/discussions')}
                  style={{
                    marginTop: '12px', padding: '7px 16px', borderRadius: '8px',
                    background: 'var(--accent-gradient)', border: 'none', color: '#fff',
                    fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  Start Conversation
                </button>
              </div>
            ) : (
              recentConversations.map((conv) => {
                const unread = conv.UnreadCount || 0;
                return (
                  <div
                    key={conv.ConversationID}
                    onClick={() => navigate(`/communication/discussions?requestId=${conv.ReferenceIssueRequestID}`)}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '14px',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--glass-border)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateX(3px)';
                      e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateX(0)';
                      e.currentTarget.style.borderColor = 'var(--glass-border)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(79, 70, 229, 0.15) 100%)',
                        color: '#818cf8', fontWeight: 800, fontSize: '0.78rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {conv.RequestCode ? conv.RequestCode.slice(-3) : '#'}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                            {conv.RequestCode || `Ticket #${conv.ReferenceIssueRequestID}`}
                          </span>
                          {conv.PriorityCode && (
                            <span style={{
                              fontSize: '0.65rem', fontWeight: 800, padding: '1px 6px', borderRadius: '4px',
                              background: conv.PriorityCode === 'CRITICAL' ? 'rgba(239,68,68,0.2)' : 'rgba(99,102,241,0.2)',
                              color: conv.PriorityCode === 'CRITICAL' ? '#ef4444' : '#818cf8'
                            }}>
                              {conv.PriorityCode}
                            </span>
                          )}
                        </div>
                        <div style={{
                          fontSize: '0.78rem', color: 'var(--text-secondary)',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          marginTop: '2px'
                        }}>
                          {conv.LastMessageText || conv.RequestTitle || 'Conversation active'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                      {unread > 0 && (
                        <span style={{
                          padding: '2px 8px', borderRadius: '10px', background: '#ef4444',
                          color: '#fff', fontSize: '0.7rem', fontWeight: 800
                        }}>
                          {unread} new
                        </span>
                      )}
                      <ChevronRight size={16} color="var(--text-muted)" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Campus Bulletins & Announcements */}
        <div style={{
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          borderRadius: '20px',
          padding: '24px',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Megaphone size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Campus Bulletins & Notices
                </h3>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Official broadcast announcements & maintenance alerts
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate('/communication/announcements')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '6px 12px', borderRadius: '8px',
                background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)',
                color: '#f59e0b', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer'
              }}
            >
              <span>View All</span>
              <ArrowUpRight size={13} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px', color: '#f59e0b' }} />
                <span style={{ fontSize: '0.8rem' }}>Loading bulletins...</span>
              </div>
            ) : recentAnnouncements.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '40px 16px', borderRadius: '14px',
                background: 'var(--bg-tertiary)', border: '1px dashed var(--glass-border)',
                color: 'var(--text-muted)'
              }}>
                <Megaphone size={28} color="rgba(148, 163, 184, 0.3)" style={{ marginBottom: '8px' }} />
                <div style={{ fontSize: '0.86rem', fontWeight: 600 }}>No broadcast announcements</div>
                <div style={{ fontSize: '0.76rem', marginTop: '4px' }}>All park operations are currently normal.</div>
              </div>
            ) : (
              recentAnnouncements.map((ann) => {
                const isCrit = (ann.UrgencyLevel || '').toUpperCase() === 'CRITICAL';
                return (
                  <div
                    key={ann.AnnouncementID}
                    onClick={() => navigate('/communication/announcements')}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '14px',
                      background: 'var(--bg-tertiary)',
                      border: isCrit ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid var(--glass-border)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateX(3px)';
                      e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.4)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateX(0)';
                      e.currentTarget.style.borderColor = isCrit ? 'rgba(239, 68, 68, 0.35)' : 'var(--glass-border)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontSize: '0.65rem', fontWeight: 800, padding: '1px 6px', borderRadius: '4px',
                          background: isCrit ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.15)',
                          color: isCrit ? '#ef4444' : '#f59e0b', textTransform: 'uppercase'
                        }}>
                          {ann.UrgencyLevel || 'NORMAL'}
                        </span>
                        <span style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                          {ann.Title}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={10} /> {formatDate(ann.PublishDateTime || ann.CreatedDate)}
                      </span>
                    </div>

                    <div style={{
                      fontSize: '0.78rem', color: 'var(--text-secondary)',
                      lineHeight: 1.45, display: '-webkit-box',
                      WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {ann.Content}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Role-Specific Quick Action Shortcuts Footer */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 24px', background: 'var(--bg-secondary)',
        border: '1px solid var(--glass-border)', borderRadius: '20px',
        flexWrap: 'wrap', gap: '14px'
      }}>
        <div>
          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Quick Communication Navigation
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Jump directly to any communication workflow or collaboration view
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {[
            { label: 'All Discussions', icon: MessageSquare, route: '/communication/discussions' },
            { label: 'Campus Bulletins', icon: Megaphone, route: '/communication/announcements' },
            { label: 'Team Channels', icon: Users, route: '/communication/channels' },
            { label: 'Audit Timeline', icon: Activity, route: '/communication/timeline' }
          ].map((s) => {
            const ShortIcon = s.icon;
            return (
              <button
                key={s.label}
                onClick={() => navigate(s.route)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '7px',
                  fontSize: '0.8rem', padding: '8px 16px', borderRadius: '10px',
                  border: '1px solid var(--glass-border)', background: 'var(--bg-tertiary)',
                  color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'var(--accent-gradient)';
                  e.currentTarget.style.color = '#fff';
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'var(--bg-tertiary)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.borderColor = 'var(--glass-border)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <ShortIcon size={14} />
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 15px rgba(239, 68, 68, 0.2); }
          50% { box-shadow: 0 0 25px rgba(239, 68, 68, 0.4); }
        }
      `}</style>
    </div>
  );
}
