import React, { useState, useEffect } from 'react';
import {
  Activity, Clock, MessageSquare, History, Search, User,
  Shield, CheckCircle, AlertTriangle, ArrowRight, RefreshCw,
  Filter, FileText, ChevronDown, Sparkles
} from 'lucide-react';
import communicationApi from '../api/communicationApi';
import issueManagementApi from '../../issue-management/api/issueManagementApi';

const glassCard = {
  background: 'var(--glass-bg)',
  border: '1px solid var(--glass-border)',
  borderRadius: '20px',
  backdropFilter: 'blur(16px)',
  padding: '24px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
};

export default function ActivityTimelineTab({ initialRequestId }) {
  const [selectedIssueId, setSelectedIssueId] = useState(initialRequestId ? String(initialRequestId) : '');
  const [requestsList, setRequestsList] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequestObj, setSelectedRequestObj] = useState(null);

  // Load available requests for the selector
  useEffect(() => {
    const fetchRequests = async () => {
      setLoadingRequests(true);
      try {
        const res = await issueManagementApi.getIssues({ limit: 100 });
        const list = res.data?.data?.issues || res.data?.data || [];
        setRequestsList(Array.isArray(list) ? list : []);

        // If no initialRequestId, default to the first request
        if (!initialRequestId && list.length > 0) {
          const first = list[0];
          const firstId = String(first.IssueRequestID || first.RequestID || first.id || '');
          setSelectedIssueId(firstId);
          setSelectedRequestObj(first);
        } else if (initialRequestId) {
          const found = list.find(r => String(r.IssueRequestID || r.RequestID) === String(initialRequestId));
          if (found) setSelectedRequestObj(found);
        }
      } catch (err) {
        console.error('Failed to fetch requests for timeline:', err);
      } finally {
        setLoadingRequests(false);
      }
    };
    fetchRequests();
  }, [initialRequestId]);

  // Load timeline whenever selectedIssueId changes
  const loadTimeline = async () => {
    if (!selectedIssueId) return;
    setLoadingTimeline(true);
    try {
      const res = await communicationApi.getActivityTimeline(selectedIssueId);
      const raw = res.data?.data;
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.timeline)
          ? raw.timeline
          : [];
      setTimeline(list);

      // Also ensure selectedRequestObj is populated
      if (!selectedRequestObj && requestsList.length > 0) {
        const found = requestsList.find(r => String(r.IssueRequestID || r.RequestID) === String(selectedIssueId));
        if (found) setSelectedRequestObj(found);
      }
    } catch (e) {
      console.error('Failed to load activity timeline:', e);
      setTimeline([]);
    } finally {
      setLoadingTimeline(false);
    }
  };

  useEffect(() => {
    if (selectedIssueId) {
      loadTimeline();
    }
  }, [selectedIssueId]);

  const handleSelectRequest = (id) => {
    setSelectedIssueId(id);
    const found = requestsList.find(r => String(r.IssueRequestID || r.RequestID) === String(id));
    setSelectedRequestObj(found || null);
  };

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  // Filter timeline items
  const filteredTimeline = timeline.filter(item => {
    if (activeFilter === 'STATUS' && item.ItemType !== 'HISTORY') return false;
    if (activeFilter === 'COMMENTS' && item.ItemType !== 'COMMENT') return false;
    if (activeFilter === 'INTERNAL' && item.ItemType !== 'INTERNAL_NOTE' && !item.IsInternal) return false;
    if (activeFilter === 'MESSAGES' && item.ItemType !== 'MESSAGE') return false;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchText = (item.SummaryText || '').toLowerCase().includes(query);
      const matchActor = (item.ActorName || '').toLowerCase().includes(query);
      return matchText || matchActor;
    }
    return true;
  });

  const getPriorityStyle = (p = '') => {
    switch (p.toUpperCase()) {
      case 'CRITICAL': return { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' };
      case 'HIGH': return { bg: 'rgba(249, 115, 22, 0.15)', color: '#f97316', border: 'rgba(249, 115, 22, 0.3)' };
      case 'MEDIUM': return { bg: 'rgba(234, 179, 8, 0.15)', color: '#eab308', border: 'rgba(234, 179, 8, 0.3)' };
      default: return { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' };
    }
  };

  const getStatusStyle = (s = '') => {
    switch (s.toUpperCase()) {
      case 'RESOLVED':
      case 'CLOSED':
        return { bg: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: 'rgba(34, 197, 94, 0.3)' };
      case 'IN_PROGRESS':
      case 'INVESTIGATING':
        return { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' };
      case 'SUBMITTED':
      case 'OPEN':
        return { bg: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', border: 'rgba(168, 85, 247, 0.3)' };
      default:
        return { bg: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', border: 'rgba(148, 163, 184, 0.3)' };
    }
  };

  const getItemTypeMeta = (item) => {
    if (item.ItemType === 'INTERNAL_NOTE' || item.IsInternal) {
      return {
        label: 'Internal Staff Note',
        bg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        glow: 'rgba(245, 158, 11, 0.35)',
        pillBg: 'rgba(245, 158, 11, 0.15)',
        pillColor: '#f59e0b',
        border: 'rgba(245, 158, 11, 0.25)',
        icon: Shield
      };
    }
    if (item.ItemType === 'COMMENT') {
      return {
        label: 'Public Comment',
        bg: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
        glow: 'rgba(99, 102, 241, 0.35)',
        pillBg: 'rgba(99, 102, 241, 0.15)',
        pillColor: '#818cf8',
        border: 'rgba(99, 102, 241, 0.25)',
        icon: MessageSquare
      };
    }
    if (item.ItemType === 'MESSAGE') {
      return {
        label: 'Direct Chat',
        bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        glow: 'rgba(16, 185, 129, 0.35)',
        pillBg: 'rgba(16, 185, 129, 0.15)',
        pillColor: '#34d399',
        border: 'rgba(16, 185, 129, 0.25)',
        icon: MessageSquare
      };
    }
    return {
      label: 'Audit / State Change',
      bg: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      glow: 'rgba(59, 130, 246, 0.35)',
      pillBg: 'rgba(59, 130, 246, 0.15)',
      pillColor: '#60a5fa',
      border: 'rgba(59, 130, 246, 0.25)',
      icon: History
    };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Smart Request Selector Header */}
      <div style={{
        ...glassCard,
        padding: '20px 24px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 340px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(74, 222, 128, 0.2) 0%, rgba(34, 197, 94, 0.1) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#4ade80', border: '1px solid rgba(74, 222, 128, 0.3)'
          }}>
            <Activity size={20} />
          </div>

          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '4px' }}>
              Target Issue Request:
            </label>
            <div style={{ position: 'relative' }}>
              <select
                value={selectedIssueId}
                onChange={(e) => handleSelectRequest(e.target.value)}
                disabled={loadingRequests}
                style={{
                  width: '100%',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  borderRadius: '10px',
                  padding: '9px 36px 9px 14px',
                  color: 'var(--text-primary)',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  outline: 'none',
                  appearance: 'none',
                  cursor: 'pointer'
                }}
              >
                {requestsList.length === 0 ? (
                  <option value="">{loadingRequests ? 'Loading requests...' : 'No requests available'}</option>
                ) : (
                  requestsList.map(r => {
                    const id = String(r.IssueRequestID || r.RequestID || r.id);
                    const code = r.RequestCode || `REQ-${id}`;
                    const title = (r.Title || 'Untitled').slice(0, 48);
                    const status = r.StatusCode || r.Status || '';
                    return (
                      <option key={id} value={id}>
                        {code} &bull; {title} [{status}]
                      </option>
                    );
                  })
                )}
              </select>
              <ChevronDown
                size={16}
                color="#94a3b8"
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              />
            </div>
          </div>
        </div>

        {/* Selected Request Meta Snapshot */}
        {selectedRequestObj && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '8px 14px', borderRadius: '12px',
            background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)'
          }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {selectedRequestObj.RequestCode || `#${selectedIssueId}`}
            </span>
            {selectedRequestObj.PriorityCode && (
              <span style={{
                fontSize: '0.68rem', fontWeight: 800, padding: '2px 8px', borderRadius: '6px',
                ...getPriorityStyle(selectedRequestObj.PriorityCode), border: `1px solid ${getPriorityStyle(selectedRequestObj.PriorityCode).border}`
              }}>
                {selectedRequestObj.PriorityCode}
              </span>
            )}
            {selectedRequestObj.StatusCode && (
              <span style={{
                fontSize: '0.68rem', fontWeight: 800, padding: '2px 8px', borderRadius: '6px',
                ...getStatusStyle(selectedRequestObj.StatusCode), border: `1px solid ${getStatusStyle(selectedRequestObj.StatusCode).border}`
              }}>
                {selectedRequestObj.StatusCode}
              </span>
            )}
          </div>
        )}

        {/* Manual Refresh Button */}
        <button
          onClick={loadTimeline}
          disabled={loadingTimeline}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px', borderRadius: '10px',
            border: '1px solid var(--glass-border)',
            background: 'var(--bg-tertiary)', color: 'var(--text-secondary)',
            fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
        >
          <RefreshCw size={14} style={{ animation: loadingTimeline ? 'spin 1s linear infinite' : 'none' }} />
          <span>Refresh Audit</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center',
        justifyContent: 'space-between', gap: '12px',
        padding: '0 4px'
      }}>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {[
            { id: 'ALL', label: 'All Events', count: timeline.length },
            { id: 'STATUS', label: 'Status & History', count: timeline.filter(t => t.ItemType === 'HISTORY').length },
            { id: 'COMMENTS', label: 'Comments', count: timeline.filter(t => t.ItemType === 'COMMENT').length },
            { id: 'INTERNAL', label: 'Staff Notes', count: timeline.filter(t => t.ItemType === 'INTERNAL_NOTE' || t.IsInternal).length },
            { id: 'MESSAGES', label: 'Direct Chat', count: timeline.filter(t => t.ItemType === 'MESSAGE').length }
          ].map(f => {
            const isActive = activeFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
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
                <span>{f.label}</span>
                <span style={{
                  fontSize: '0.68rem', padding: '1px 6px', borderRadius: '10px',
                  background: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(148,163,184,0.15)',
                  color: isActive ? '#fff' : 'var(--text-muted)', fontWeight: 700
                }}>
                  {f.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search timeline */}
        <div style={{ position: 'relative', width: '220px' }}>
          <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search audit trail..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '7px 12px 7px 32px',
              borderRadius: '20px', background: 'var(--bg-tertiary)',
              border: '1px solid var(--glass-border)', color: 'var(--text-primary)',
              fontSize: '0.78rem', outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Vertical Connected Gradient Timeline */}
      <div style={{ ...glassCard, padding: '28px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={20} color="#6366f1" />
            <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 800 }}>
              Chronological Audit Trail & Event Stream
            </h3>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Showing {filteredTimeline.length} of {timeline.length} logged events
          </span>
        </div>

        {loadingTimeline ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '50px 0' }}>
            <div style={{
              width: '36px', height: '36px', border: '3px solid rgba(99, 102, 241, 0.3)',
              borderTop: '3px solid #6366f1', borderRadius: '50%',
              animation: 'spin 1s linear infinite', margin: '0 auto 12px'
            }} />
            <span style={{ fontSize: '0.85rem' }}>Loading unified audit timeline...</span>
          </div>
        ) : filteredTimeline.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <Activity size={36} color="rgba(148, 163, 184, 0.4)" style={{ marginBottom: '12px' }} />
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              No audit events found
            </div>
            <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>
              {searchQuery ? 'Try clearing your search query filter' : `No activity recorded for Request #${selectedIssueId}`}
            </div>
          </div>
        ) : (
          <div style={{ position: 'relative', paddingLeft: '32px' }}>
            {/* Connected Vertical Gradient Guide */}
            <div style={{
              position: 'absolute', top: '12px', bottom: '12px', left: '13px',
              width: '2px', background: 'linear-gradient(180deg, #6366f1 0%, #3b82f6 50%, rgba(99, 102, 241, 0.1) 100%)'
            }} />

            {filteredTimeline.map((item, index) => {
              const meta = getItemTypeMeta(item);
              const IconComp = meta.icon;

              return (
                <div
                  key={`${item.ItemType}-${item.ItemID || index}`}
                  style={{
                    position: 'relative',
                    marginBottom: '24px',
                    animation: `fadeInUp 0.25s ease-out ${Math.min(index * 0.04, 0.4)}s both`
                  }}
                >
                  {/* Glowing Icon Dot */}
                  <div style={{
                    position: 'absolute',
                    left: '-32px',
                    top: '6px',
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: meta.bg,
                    border: '3px solid var(--bg-primary, #0f172a)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 0 14px ${meta.glow}`,
                    zIndex: 2
                  }}>
                    <IconComp size={12} color="#fff" />
                  </div>

                  {/* Card Body */}
                  <div style={{
                    background: 'var(--bg-tertiary)',
                    border: `1px solid ${meta.border}`,
                    borderRadius: '14px',
                    padding: '16px 20px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateX(3px)';
                      e.currentTarget.style.boxShadow = `0 4px 18px ${meta.glow}`;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateX(0)';
                      e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.06)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '22px', height: '22px', borderRadius: '50%',
                          background: 'rgba(255,255,255,0.08)', display: 'flex',
                          alignItems: 'center', justifyContent: 'center'
                        }}>
                          <User size={12} color="#94a3b8" />
                        </div>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.86rem' }}>
                          {item.ActorName || 'System'}
                        </span>
                        {item.ActorEmail && (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                            ({item.ActorEmail})
                          </span>
                        )}
                        <span style={{
                          background: meta.pillBg, color: meta.pillColor,
                          padding: '2px 8px', borderRadius: '6px', fontSize: '0.68rem',
                          fontWeight: 800, letterSpacing: '0.4px', textTransform: 'uppercase'
                        }}>
                          {meta.label}
                        </span>
                      </div>

                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Clock size={12} /> {formatDate(item.EventDateTime)}
                      </span>
                    </div>

                    <p style={{
                      margin: 0, color: 'var(--text-secondary)',
                      fontSize: '0.86rem', lineHeight: 1.6, whiteSpace: 'pre-wrap'
                    }}>
                      {item.SummaryText}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
