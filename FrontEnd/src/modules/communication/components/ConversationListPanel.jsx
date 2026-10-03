import React, { useState, useEffect, useMemo } from 'react';
import {
  MessageSquare, Search, Filter, Clock, ChevronRight,
  Loader2, Inbox, AlertCircle, RefreshCw, CheckCircle2,
  AlertTriangle, Flame, Shield, Building2
} from 'lucide-react';
import communicationApi from '../api/communicationApi';

/**
 * ConversationListPanel — Professional Master List of Conversations
 * Filter by All, Unread, High Priority, Open Requests.
 * Instant search, active conversation indicator, priority badges, and unread counters.
 */
export default function ConversationListPanel({
  currentUserId,
  selectedConversationId,
  onSelectConversation
}) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL'); // ALL, UNREAD, URGENT, OPEN
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const loadConversations = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await communicationApi.getUserConversations({ page, limit });
      const raw = res.data?.data;
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.conversations)
          ? raw.conversations
          : [];
      setConversations(list);
      setTotal(raw?.total ?? list.length);
    } catch (err) {
      console.error('Failed to load conversations:', err);
      setConversations([]);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [page]);

  const safeConversations = Array.isArray(conversations) ? conversations : [];

  const filtered = useMemo(() => {
    return safeConversations.filter(c => {
      // Filter tab check
      if (activeFilter === 'UNREAD' && (c.UnreadCount || 0) <= 0) return false;
      if (activeFilter === 'URGENT') {
        const p = (c.RequestPriority || '').toUpperCase();
        if (p !== 'CRITICAL' && p !== 'HIGH') return false;
      }
      if (activeFilter === 'OPEN') {
        const s = (c.RequestStatus || '').toUpperCase();
        if (s === 'RESOLVED' || s === 'CLOSED' || s === 'CANCELLED') return false;
      }

      // Search query check
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (c.Title || '').toLowerCase().includes(q) ||
        (c.IssueRequestCode || '').toLowerCase().includes(q) ||
        (c.RequestTitle || '').toLowerCase().includes(q) ||
        (c.TenantName || '').toLowerCase().includes(q) ||
        (c.RequesterName || '').toLowerCase().includes(q)
      );
    });
  }, [safeConversations, activeFilter, searchQuery]);

  const totalUnreadCount = useMemo(() => {
    return safeConversations.reduce((acc, curr) => acc + (curr.UnreadCount || 0), 0);
  }, [safeConversations]);

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHrs / 24);

    if (diffMin < 1) return 'now';
    if (diffMin < 60) return `${diffMin}m`;
    if (diffHrs < 24) return `${diffHrs}h`;
    if (diffDays === 1) return 'Yday';
    if (diffDays < 7) return `${diffDays}d`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getPriorityBadge = (p) => {
    const priority = (p || '').toUpperCase();
    if (priority === 'CRITICAL') return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', label: 'Critical' };
    if (priority === 'HIGH') return { color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)', label: 'High' };
    if (priority === 'MEDIUM') return { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', label: 'Med' };
    return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', label: 'Low' };
  };

  const getStatusBadge = (s) => {
    const status = (s || '').toUpperCase();
    if (status === 'RESOLVED' || status === 'CLOSED') {
      return { bg: 'rgba(74,222,128,0.12)', color: '#4ade80' };
    }
    if (status === 'IN_PROGRESS' || status === 'ASSIGNED') {
      return { bg: 'rgba(99,102,241,0.15)', color: '#818cf8' };
    }
    if (status === 'CANCELLED') {
      return { bg: 'rgba(239,68,68,0.12)', color: '#f87171' };
    }
    return { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24' };
  };

  const getInitials = (name) => {
    if (!name) return 'REQ';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'var(--bg-secondary)', border: '1px solid var(--glass-border-accent)',
      borderRadius: '20px', overflow: 'hidden', boxShadow: 'var(--shadow-lg)'
    }}>
      {/* ── Header ── */}
      <div style={{
        padding: '16px 20px', borderBottom: '1px solid var(--glass-border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'var(--bg-tertiary)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            padding: '9px', borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(124,58,237,0.15) 100%)',
            color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Inbox size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--text-primary)' }}>
              Discussions
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              {safeConversations.length} active ticket thread{safeConversations.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        <button
          onClick={() => loadConversations(false)}
          disabled={loading}
          title="Refresh discussions"
          style={{
            padding: '8px', borderRadius: '8px', border: '1px solid var(--glass-border)',
            background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', transition: 'all 0.2s'
          }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
        </button>
      </div>

      {/* ── Search Bar ── */}
      <div style={{
        padding: '12px 16px', borderBottom: '1px solid var(--glass-border)',
        background: 'rgba(255,255,255,0.01)', position: 'relative'
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '8px 12px', borderRadius: '10px',
          background: 'var(--bg-primary)', border: '1px solid var(--glass-border)'
        }}>
          <Search size={14} color="var(--text-muted)" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search code, title, requester..."
            style={{
              flex: 1, border: 'none', background: 'transparent',
              color: 'var(--text-primary)', fontSize: '0.84rem', outline: 'none'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                background: 'none', border: 'none', color: 'var(--text-muted)',
                cursor: 'pointer', fontSize: '0.8rem', padding: '0 4px'
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── Filter Chips ── */}
      <div style={{
        padding: '8px 16px', display: 'flex', gap: '6px',
        borderBottom: '1px solid var(--glass-border)', overflowX: 'auto',
        background: 'rgba(255,255,255,0.02)'
      }}>
        {[
          { id: 'ALL', label: 'All' },
          { id: 'UNREAD', label: `Unread (${totalUnreadCount})`, highlight: totalUnreadCount > 0 },
          { id: 'URGENT', label: 'High Priority' },
          { id: 'OPEN', label: 'Open' }
        ].map((tab) => {
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              style={{
                padding: '4px 10px', borderRadius: '14px', border: '1px solid',
                fontSize: '0.74rem', fontWeight: isActive ? 700 : 500,
                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s ease',
                background: isActive ? 'var(--accent-gradient)' : 'var(--bg-tertiary)',
                borderColor: isActive ? 'transparent' : 'var(--glass-border)',
                color: isActive ? '#ffffff' : (tab.highlight ? '#f87171' : 'var(--text-secondary)')
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Conversation Cards List ── */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '10px 12px',
        display: 'flex', flexDirection: 'column', gap: '8px'
      }}>
        {loading && safeConversations.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
            <Loader2 size={24} className="spin" color="var(--accent-primary)" />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', padding: '50px 20px', textAlign: 'center'
          }}>
            <MessageSquare size={32} color="rgba(99,102,241,0.25)" />
            <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-secondary)', marginTop: '12px' }}>
              {searchQuery ? 'No matching discussions' : 'No conversations found'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '240px' }}>
              {searchQuery ? 'Try modifying your search or clearing filters.' : 'Tickets with active messaging will appear here.'}
            </div>
          </div>
        ) : (
          filtered.map((conv) => {
            const isSelected = selectedConversationId && (
              Number(selectedConversationId) === Number(conv.ConversationID) ||
              Number(selectedConversationId) === Number(conv.ReferenceIssueRequestID)
            );
            const statusStyle = getStatusBadge(conv.RequestStatus);
            const priorityBadge = getPriorityBadge(conv.RequestPriority);
            const hasUnread = Number(conv.UnreadCount || 0) > 0;

            return (
              <div
                key={conv.ConversationID || conv.ReferenceIssueRequestID}
                onClick={() => onSelectConversation?.(conv)}
                style={{
                  padding: '13px 14px', borderRadius: '14px',
                  background: isSelected
                    ? 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(124,58,237,0.08) 100%)'
                    : (hasUnread ? 'rgba(99,102,241,0.05)' : 'var(--bg-tertiary)'),
                  border: isSelected
                    ? '1.5px solid var(--accent-primary)'
                    : (hasUnread ? '1px solid rgba(99,102,241,0.3)' : '1px solid var(--glass-border)'),
                  cursor: 'pointer', transition: 'all 0.18s ease',
                  borderLeft: isSelected ? '4px solid var(--accent-primary)' : undefined,
                  boxShadow: isSelected ? '0 4px 15px rgba(99, 102, 241, 0.15)' : 'none'
                }}
                onMouseEnter={e => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = hasUnread ? 'rgba(99,102,241,0.3)' : 'var(--glass-border)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                {/* Top Row: Code, Priority, Status, Time */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {conv.IssueRequestCode && (
                      <span style={{
                        fontFamily: 'monospace', fontWeight: 800, fontSize: '0.72rem',
                        padding: '2px 6px', borderRadius: '5px',
                        background: 'rgba(99,102,241,0.12)', color: '#818cf8'
                      }}>
                        {conv.IssueRequestCode}
                      </span>
                    )}

                    {conv.RequestPriority && (
                      <span style={{
                        fontSize: '0.66rem', fontWeight: 700, padding: '1px 5px',
                        borderRadius: '4px', background: priorityBadge.bg, color: priorityBadge.color
                      }}>
                        {priorityBadge.label}
                      </span>
                    )}

                    {conv.RequestStatus && (
                      <span style={{
                        fontSize: '0.66rem', fontWeight: 700, padding: '1px 6px',
                        borderRadius: '4px', ...statusStyle
                      }}>
                        {conv.RequestStatus}
                      </span>
                    )}
                  </div>

                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {formatTime(conv.LastMessageAt || conv.CreatedDate)}
                  </span>
                </div>

                {/* Middle Row: Title */}
                <div style={{
                  fontWeight: hasUnread ? 800 : 600,
                  fontSize: '0.88rem',
                  color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  marginBottom: '4px'
                }}>
                  {conv.RequestTitle || conv.Title || 'Service Request'}
                </div>

                {/* Bottom Row: Context & Unread counter */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    fontSize: '0.72rem', color: 'var(--text-muted)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}>
                    {conv.TenantName && (
                      <span>🏢 {conv.TenantName}</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    {hasUnread && (
                      <span style={{
                        padding: '2px 7px', borderRadius: '10px', fontSize: '0.66rem',
                        fontWeight: 800, background: '#ef4444', color: '#ffffff',
                        boxShadow: '0 0 8px rgba(239, 68, 68, 0.4)'
                      }}>
                        {conv.UnreadCount} new
                      </span>
                    )}
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {conv.MessageCount || 0} msgs
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Pagination ── */}
      {total > limit && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '10px 16px', borderTop: '1px solid var(--glass-border)',
          background: 'var(--bg-tertiary)', fontSize: '0.76rem'
        }}>
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            style={{
              padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--glass-border)',
              background: 'transparent', color: 'var(--text-secondary)', cursor: page <= 1 ? 'not-allowed' : 'pointer'
            }}
          >
            ← Prev
          </button>
          <span style={{ color: 'var(--text-muted)' }}>
            Page {page} of {Math.ceil(total / limit)}
          </span>
          <button
            disabled={page * limit >= total}
            onClick={() => setPage(p => p + 1)}
            style={{
              padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--glass-border)',
              background: 'transparent', color: 'var(--text-secondary)', cursor: page * limit >= total ? 'not-allowed' : 'pointer'
            }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
