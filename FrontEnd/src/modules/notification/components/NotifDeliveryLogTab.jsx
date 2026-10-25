import React, { useState, useEffect } from 'react';
import {
  History, Mail, MessageSquare, PhoneCall, CheckCircle2,
  AlertTriangle, Clock, Search, Filter, Download, Eye,
  RefreshCw, X, ShieldCheck, ArrowUpRight
} from 'lucide-react';
import notificationApi from '../api/notificationApi';

const glassCard = {
  background: 'var(--glass-bg)',
  border: '1px solid var(--glass-border)',
  borderRadius: 'var(--border-radius-lg, 18px)',
  backdropFilter: 'blur(16px)',
  padding: '24px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
};

export default function NotifDeliveryLogTab() {
  const [logs, setLogs] = useState([]);
  const [channelFilter, setChannelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await notificationApi.getDeliveryLog({ channelCode: channelFilter });
      const raw = res.data?.data || [];
      setLogs(Array.isArray(raw) ? raw : []);
    } catch (e) {
      console.error('Failed to load delivery log:', e);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [channelFilter]);

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toUpperCase();
    if (s === 'DELIVERED' || s === 'SENT') {
      return (
        <span style={{
          background: 'rgba(16, 185, 129, 0.15)', color: '#10b981',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          padding: '2px 8px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 800,
          display: 'inline-flex', alignItems: 'center', gap: '4px'
        }}>
          <CheckCircle2 size={11} /> DELIVERED
        </span>
      );
    }
    if (s === 'FAILED' || s === 'BOUNCED') {
      return (
        <span style={{
          background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          padding: '2px 8px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 800,
          display: 'inline-flex', alignItems: 'center', gap: '4px'
        }}>
          <AlertTriangle size={11} /> FAILED
        </span>
      );
    }
    return (
      <span style={{
        background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        padding: '2px 8px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 800,
        display: 'inline-flex', alignItems: 'center', gap: '4px'
      }}>
        <Clock size={11} /> {status || 'PENDING'}
      </span>
    );
  };

  const getChannelBadge = (code) => {
    if (code === 'EMAIL') {
      return (
        <span style={{
          background: 'rgba(16, 185, 129, 0.12)', color: '#10b981',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          padding: '2px 8px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 800,
          display: 'inline-flex', alignItems: 'center', gap: '4px'
        }}>
          <Mail size={11} /> EMAIL
        </span>
      );
    }
    return (
      <span style={{
        background: 'rgba(99, 102, 241, 0.12)', color: '#818cf8',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        padding: '2px 8px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 800,
        display: 'inline-flex', alignItems: 'center', gap: '4px'
      }}>
        <MessageSquare size={11} /> IN_APP
      </span>
    );
  };

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const s = (log.DeliveryStatus || log.Status || '').toUpperCase();
    if (statusFilter === 'DELIVERED' && s !== 'DELIVERED' && s !== 'SENT') return false;
    if (statusFilter === 'FAILED' && s !== 'FAILED' && s !== 'BOUNCED') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchRecip = (log.RecipientAddress || log.Recipient || '').toLowerCase().includes(q);
      const matchSub = (log.Subject || log.Title || '').toLowerCase().includes(q);
      const matchId = String(log.NotificationLogID || '').includes(q);
      return matchRecip || matchSub || matchId;
    }
    return true;
  });

  // Calculate delivery stats
  const totalCount = logs.length;
  const deliveredCount = logs.filter(l => ['DELIVERED', 'SENT'].includes((l.DeliveryStatus || l.Status || '').toUpperCase())).length;
  const failedCount = logs.filter(l => ['FAILED', 'BOUNCED'].includes((l.DeliveryStatus || l.Status || '').toUpperCase())).length;
  const successRate = totalCount > 0 ? Math.round((deliveredCount / totalCount) * 100) : 100;

  const exportCSV = () => {
    if (filteredLogs.length === 0) return;
    const headers = ['LogID', 'Channel', 'Recipient', 'Subject', 'Status', 'Date'];
    const rows = filteredLogs.map(l => [
      l.NotificationLogID,
      l.ChannelCode,
      `"${l.RecipientAddress || l.Recipient || ''}"`,
      `"${(l.Subject || l.Title || '').replace(/"/g, '""')}"`,
      l.DeliveryStatus || l.Status || '',
      `"${l.SentDateTime || l.CreatedDate || ''}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `delivery-audit-log-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Metrics Ribbon */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '14px'
      }}>
        <div style={{ ...glassCard, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <History size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 700 }}>
              Total Transmissions
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
              {totalCount}
            </div>
          </div>
        </div>

        <div style={{ ...glassCard, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.15)', color: '#10b981',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 700 }}>
              Delivery Rate
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>
              {successRate}%
            </div>
          </div>
        </div>

        <div style={{ ...glassCard, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 700 }}>
              Failed Transmissions
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: failedCount > 0 ? '#ef4444' : 'var(--text-muted)', marginTop: '2px' }}>
              {failedCount}
            </div>
          </div>
        </div>

        <div style={{ ...glassCard, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Mail size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 700 }}>
              Audit Protocol
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f59e0b', marginTop: '2px' }}>
              SMTP & In-App
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        ...glassCard,
        padding: '18px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Channel Filters */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {[
              { id: '', label: 'All Channels' },
              { id: 'EMAIL', label: 'Email Only' },
              { id: 'IN_APP', label: 'In-App Only' }
            ].map(ch => (
              <button
                key={ch.id}
                onClick={() => setChannelFilter(ch.id)}
                style={{
                  padding: '7px 12px', borderRadius: '8px',
                  background: channelFilter === ch.id ? 'var(--accent-gradient)' : 'var(--bg-tertiary)',
                  border: channelFilter === ch.id ? '1px solid transparent' : '1px solid var(--glass-border)',
                  color: channelFilter === ch.id ? '#fff' : 'var(--text-secondary)',
                  fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                {ch.label}
              </button>
            ))}
          </div>

          {/* Status Filters */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {[
              { id: 'ALL', label: 'All Statuses' },
              { id: 'DELIVERED', label: 'Delivered' },
              { id: 'FAILED', label: 'Failed' }
            ].map(st => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                style={{
                  padding: '7px 12px', borderRadius: '8px',
                  background: statusFilter === st.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                  border: '1px solid var(--glass-border)',
                  color: statusFilter === st.id ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer'
                }}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ position: 'relative', width: '220px' }}>
            <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search recipient or subject..."
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
            onClick={loadLogs}
            disabled={loading}
            style={{
              padding: '8px 12px', borderRadius: '10px',
              border: '1px solid var(--glass-border)', background: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s'
            }}
            title="Refresh logs"
          >
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>

          <button
            onClick={exportCSV}
            disabled={filteredLogs.length === 0}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px', borderRadius: '10px',
              border: '1px solid var(--glass-border)', background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 600,
              cursor: filteredLogs.length > 0 ? 'pointer' : 'not-allowed'
            }}
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Log Table */}
      <div style={{ ...glassCard, padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px 0' }}>
            <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px', color: '#6366f1' }} />
            <span style={{ fontSize: '0.86rem' }}>Querying delivery transmission audit trail...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px 20px' }}>
            <History size={42} color="rgba(148, 163, 184, 0.3)" style={{ marginBottom: '12px' }} />
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              No audit logs recorded for this criteria
            </div>
            <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>
              Transmissions dispatched by the notification service will appear here.
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--glass-border)' }}>
                  <th style={{ padding: '14px 20px', fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Log Ref</th>
                  <th style={{ padding: '14px 16px', fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Channel</th>
                  <th style={{ padding: '14px 20px', fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Subject / Event Title</th>
                  <th style={{ padding: '14px 20px', fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Recipient Address</th>
                  <th style={{ padding: '14px 16px', fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Delivery Status</th>
                  <th style={{ padding: '14px 20px', fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sent Timestamp</th>
                  <th style={{ padding: '14px 16px', fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-muted)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, index) => (
                  <tr
                    key={log.NotificationLogID || index}
                    onClick={() => setSelectedLog(log)}
                    style={{
                      borderBottom: index < filteredLogs.length - 1 ? '1px solid var(--glass-border)' : 'none',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      background: index % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                    onMouseLeave={e => e.currentTarget.style.background = index % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)'}
                  >
                    <td style={{ padding: '14px 20px', fontWeight: 700, color: '#818cf8', fontSize: '0.84rem', fontFamily: 'monospace' }}>
                      #{log.NotificationLogID}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {getChannelBadge(log.ChannelCode)}
                    </td>
                    <td style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.84rem' }}>
                      {log.Subject || log.Title || 'System Alert'}
                    </td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                      {log.RecipientAddress || log.Recipient || 'User Account'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {getStatusBadge(log.DeliveryStatus || log.Status)}
                    </td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                      {formatDate(log.SentDateTime || log.CreatedDate)}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(log);
                        }}
                        style={{
                          background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.25)',
                          borderRadius: '6px', padding: '4px 8px', color: '#818cf8',
                          cursor: 'pointer', fontSize: '0.74rem', fontWeight: 600
                        }}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Log Detail Modal */}
      {selectedLog && (
        <div style={{
          position: 'fixed', inset: 0, background: 'var(--modal-backdrop, rgba(16, 20, 24, 0.78))',
          backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 10000, padding: '20px'
        }} onClick={() => setSelectedLog(null)}>
          <div style={{
            ...glassCard, width: '560px', maxWidth: '100%',
            border: '1px solid rgba(99, 102, 241, 0.35)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
            animation: 'fadeInUp 0.25s ease-out'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <History size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 800 }}>
                    Transmission Audit Inspection
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Log Reference #{selectedLog.NotificationLogID}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="btn-icon touch-target-sm"
                aria-label="Close dialog"
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Channel</span>
                  <div style={{ marginTop: '4px' }}>{getChannelBadge(selectedLog.ChannelCode)}</div>
                </div>
                <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Status</span>
                  <div style={{ marginTop: '4px' }}>{getStatusBadge(selectedLog.DeliveryStatus || selectedLog.Status)}</div>
                </div>
              </div>

              <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Recipient</span>
                <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {selectedLog.RecipientAddress || selectedLog.Recipient || 'N/A'}
                </div>
              </div>

              <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Subject / Title</span>
                <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {selectedLog.Subject || selectedLog.Title || 'N/A'}
                </div>
              </div>

              {selectedLog.ErrorMessage && (
                <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                  <span style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 700, textTransform: 'uppercase' }}>Error Trace</span>
                  <div style={{ fontSize: '0.8rem', color: '#fca5a5', marginTop: '2px', fontFamily: 'monospace' }}>
                    {selectedLog.ErrorMessage}
                  </div>
                </div>
              )}

              <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Sent Date & Time</span>
                <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {formatDate(selectedLog.SentDateTime || selectedLog.CreatedDate)}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  style={{
                    padding: '8px 20px', borderRadius: '8px',
                    background: 'var(--accent-gradient)', border: 'none',
                    color: '#fff', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
