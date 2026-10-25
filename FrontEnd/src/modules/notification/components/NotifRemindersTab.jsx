import React, { useState, useEffect } from 'react';
import {
  Clock, Plus, CheckCircle2, Calendar, User, X,
  Search, Filter, AlertTriangle, ArrowRight, Loader2,
  FileText, ChevronDown, Check, Sparkles, RefreshCw
} from 'lucide-react';
import notificationApi from '../api/notificationApi';
import issueManagementApi from '../../issue-management/api/issueManagementApi';

const glassCard = {
  background: 'var(--glass-bg)',
  border: '1px solid var(--glass-border)',
  borderRadius: 'var(--border-radius-lg, 18px)',
  backdropFilter: 'blur(16px)',
  padding: '24px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
};

export default function NotifRemindersTab({ onRefreshMetrics }) {
  const [reminders, setReminders] = useState([]);
  const [requestsList, setRequestsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [completingId, setCompletingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL'); // ALL, PENDING, DUE_SOON, OVERDUE, COMPLETED
  const [searchQuery, setSearchQuery] = useState('');

  const [form, setForm] = useState({
    Title: '',
    MessageText: '',
    ReminderDateTime: '',
    LinkedIssueRequestID: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const loadReminders = async () => {
    setLoading(true);
    try {
      const res = await notificationApi.getReminders();
      const raw = res.data?.data || [];
      setReminders(Array.isArray(raw) ? raw : []);
    } catch (e) {
      console.error('Failed to load reminders:', e);
      setReminders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReminders();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showModal) {
        setShowModal(false);
      }
    };
    if (showModal) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal]);

  // Fetch requests list for the dropdown
  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const res = await issueManagementApi.getIssues({ limit: 100 });
        const list = res.data?.data?.issues || res.data?.data || [];
        setRequestsList(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error('Failed to load requests for reminder selector:', err);
      }
    };
    fetchIssues();
  }, []);

  const handleCreate = async (e) => {
    e?.preventDefault();
    if (!form.Title.trim() || !form.ReminderDateTime || submitting) return;
    setSubmitting(true);
    try {
      await notificationApi.createReminder({
        Title: form.Title.trim(),
        MessageText: form.MessageText.trim(),
        ReminderDateTime: form.ReminderDateTime.replace('T', ' '),
        LinkedIssueRequestID: form.LinkedIssueRequestID ? Number(form.LinkedIssueRequestID) : null
      });
      setForm({ Title: '', MessageText: '', ReminderDateTime: '', LinkedIssueRequestID: '' });
      setShowModal(false);
      await loadReminders();
      if (onRefreshMetrics) onRefreshMetrics();
    } catch (e) {
      console.error('Failed to create reminder:', e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async (id) => {
    setCompletingId(id);
    try {
      await notificationApi.completeReminder(id);
      await loadReminders();
      if (onRefreshMetrics) onRefreshMetrics();
    } catch (e) {
      console.error('Failed to complete reminder:', e);
    } finally {
      setCompletingId(null);
    }
  };

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getUrgencyStatus = (reminder) => {
    if (reminder.Status === 'COMPLETED') {
      return {
        label: 'COMPLETED',
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.15)',
        border: 'rgba(16, 185, 129, 0.3)'
      };
    }
    const due = new Date(reminder.ReminderDateTime);
    const now = new Date();
    const diffHours = (due - now) / (1000 * 60 * 60);

    if (diffHours < 0) {
      return {
        label: 'OVERDUE',
        color: '#ef4444',
        bg: 'rgba(239, 68, 68, 0.15)',
        border: 'rgba(239, 68, 68, 0.35)',
        pulse: true
      };
    }
    if (diffHours <= 24) {
      return {
        label: 'DUE TODAY',
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.15)',
        border: 'rgba(245, 158, 11, 0.35)'
      };
    }
    return {
      label: 'UPCOMING',
      color: '#6366f1',
      bg: 'rgba(99, 102, 241, 0.15)',
      border: 'rgba(99, 102, 241, 0.3)'
    };
  };

  // Filter reminders
  const filteredReminders = reminders.filter(r => {
    const isCompleted = r.Status === 'COMPLETED';
    const due = new Date(r.ReminderDateTime);
    const now = new Date();
    const isOverdue = !isCompleted && due < now;
    const isDueSoon = !isCompleted && !isOverdue && (due - now) <= 24 * 3600 * 1000;

    if (activeFilter === 'PENDING' && isCompleted) return false;
    if (activeFilter === 'COMPLETED' && !isCompleted) return false;
    if (activeFilter === 'OVERDUE' && !isOverdue) return false;
    if (activeFilter === 'DUE_SOON' && !isDueSoon && !isOverdue) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (r.Title || '').toLowerCase().includes(q);
      const matchMsg = (r.MessageText || '').toLowerCase().includes(q);
      const matchActor = (r.CreatorName || '').toLowerCase().includes(q);
      return matchTitle || matchMsg || matchActor;
    }
    return true;
  });

  const pendingCount = reminders.filter(r => r.Status !== 'COMPLETED').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Bar */}
      <div style={{
        ...glassCard,
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 320px' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.15) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.35)'
          }}>
            <Clock size={20} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 800 }}>
                Automated Task & SLA Reminders
              </h3>
              <span style={{
                background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b',
                padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 800,
                border: '1px solid rgba(245, 158, 11, 0.3)'
              }}>
                {pendingCount} Active
              </span>
            </div>
            <p style={{ margin: '2px 0 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              Schedule automated time-based alert dispatches for ticket follow-ups, SLA checkpoints & approvals
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', width: '200px' }}>
            <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search reminders..."
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
            onClick={loadReminders}
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

          <button
            onClick={() => setShowModal(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '9px 18px', borderRadius: '10px', border: 'none',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#fff', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)', transition: 'all 0.2s'
            }}
          >
            <Plus size={16} />
            <span>New Reminder</span>
          </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {[
          { id: 'ALL', label: 'All Reminders', count: reminders.length },
          { id: 'PENDING', label: 'Pending', count: pendingCount },
          { id: 'DUE_SOON', label: 'Due Today', count: reminders.filter(r => r.Status !== 'COMPLETED' && (new Date(r.ReminderDateTime) - new Date()) <= 24 * 3600 * 1000).length },
          { id: 'COMPLETED', label: 'Completed', count: reminders.filter(r => r.Status === 'COMPLETED').length }
        ].map(chip => {
          const isActive = activeFilter === chip.id;
          return (
            <button
              key={chip.id}
              onClick={() => setActiveFilter(chip.id)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '7px 14px', borderRadius: 'var(--border-radius-lg, 18px)',
                fontSize: '0.78rem', fontWeight: isActive ? 700 : 500,
                background: isActive ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'var(--bg-tertiary)',
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

      {/* Reminders Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px 0' }}>
          <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px', color: '#f59e0b' }} />
          <span style={{ fontSize: '0.86rem' }}>Loading automated reminders...</span>
        </div>
      ) : filteredReminders.length === 0 ? (
        <div style={{ ...glassCard, textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <Clock size={42} color="rgba(148, 163, 184, 0.3)" style={{ marginBottom: '12px' }} />
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
            No reminders found in this category
          </div>
          <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>
            Click &ldquo;New Reminder&rdquo; above to set a scheduled notification.
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '18px' }}>
          {filteredReminders.map((r, i) => {
            const urgency = getUrgencyStatus(r);
            const isCompleted = r.Status === 'COMPLETED';

            return (
              <div
                key={r.NotificationReminderID || i}
                style={{
                  ...glassCard,
                  position: 'relative',
                  padding: '22px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: isCompleted ? '1px solid var(--glass-border)' : `1px solid ${urgency.border}`,
                  opacity: isCompleted ? 0.75 : 1,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isCompleted ? 'none' : `0 4px 20px ${urgency.bg}`,
                  animation: `fadeInUp 0.25s ease-out ${Math.min(i * 0.05, 0.4)}s both`
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
                    <h4 style={{
                      margin: 0, color: 'var(--text-primary)',
                      fontSize: '0.98rem', fontWeight: 800,
                      textDecoration: isCompleted ? 'line-through' : 'none'
                    }}>
                      {r.Title}
                    </h4>

                    <span style={{
                      background: urgency.bg, color: urgency.color,
                      border: `1px solid ${urgency.border}`,
                      padding: '2px 8px', borderRadius: '6px', fontSize: '0.68rem',
                      fontWeight: 800, letterSpacing: '0.4px', whiteSpace: 'nowrap'
                    }}>
                      {urgency.label}
                    </span>
                  </div>

                  {r.MessageText && (
                    <p style={{
                      margin: '0 0 14px', color: 'var(--text-secondary)',
                      fontSize: '0.85rem', lineHeight: 1.55,
                      whiteSpace: 'pre-wrap'
                    }}>
                      {r.MessageText}
                    </p>
                  )}
                </div>

                <div style={{
                  paddingTop: '14px',
                  borderTop: '1px solid var(--glass-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <span style={{
                      fontSize: '0.74rem', color: urgency.color, fontWeight: 700,
                      display: 'flex', alignItems: 'center', gap: '5px'
                    }}>
                      <Calendar size={12} />
                      <span>{formatDate(r.ReminderDateTime)}</span>
                    </span>

                    {r.LinkedIssueRequestID && (
                      <span style={{
                        fontSize: '0.72rem', color: '#818cf8', fontWeight: 700,
                        display: 'flex', alignItems: 'center', gap: '4px'
                      }}>
                        <FileText size={11} />
                        <span>Linked Request #{r.LinkedIssueRequestID}</span>
                      </span>
                    )}
                  </div>

                  {!isCompleted && (
                    <button
                      onClick={() => handleComplete(r.NotificationReminderID)}
                      disabled={completingId === r.NotificationReminderID}
                      style={{
                        padding: '6px 14px', borderRadius: '8px',
                        background: 'rgba(16, 185, 129, 0.15)', color: '#10b981',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '5px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = '#10b981';
                        e.currentTarget.style.color = '#fff';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)';
                        e.currentTarget.style.color = '#10b981';
                      }}
                    >
                      {completingId === r.NotificationReminderID ? (
                        <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                      ) : (
                        <Check size={13} />
                      )}
                      <span>Mark Done</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Reminder Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'var(--modal-backdrop, rgba(16, 20, 24, 0.78))',
          backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 10000, padding: '20px'
        }} onClick={() => setShowModal(false)}>
          <div style={{
            ...glassCard, width: '500px', maxWidth: '100%',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
            animation: 'fadeInUp 0.25s ease-out'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '10px',
                  background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)', flexShrink: 0
                }}>
                  <Clock size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 800 }}>
                    Schedule New Reminder
                  </h3>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Automated alert notification will trigger at the chosen time
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="btn-icon touch-target-sm"
                aria-label="Close dialog"
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Reminder Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Check UPS battery backup voltage"
                  value={form.Title}
                  onChange={(e) => setForm({ ...form, Title: e.target.value })}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '10px',
                    background: 'var(--bg-tertiary)', border: '1px solid rgba(245, 158, 11, 0.3)',
                    color: 'var(--text-primary)', fontSize: '0.86rem', outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Scheduled Trigger Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={form.ReminderDateTime}
                  onChange={(e) => setForm({ ...form, ReminderDateTime: e.target.value })}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '10px',
                    background: 'var(--bg-tertiary)', border: '1px solid rgba(245, 158, 11, 0.3)',
                    color: 'var(--text-primary)', fontSize: '0.86rem', outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Link to Ticket / Service Request (Optional)
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={form.LinkedIssueRequestID}
                    onChange={(e) => setForm({ ...form, LinkedIssueRequestID: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 36px 10px 14px', borderRadius: '10px',
                      background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                      color: 'var(--text-primary)', fontSize: '0.84rem', outline: 'none',
                      appearance: 'none', cursor: 'pointer', boxSizing: 'border-box'
                    }}
                  >
                    <option value="">No linked ticket (General Reminder)</option>
                    {requestsList.map(r => {
                      const id = String(r.IssueRequestID || r.RequestID);
                      const code = r.RequestCode || `REQ-${id}`;
                      const title = (r.Title || '').slice(0, 40);
                      return (
                        <option key={id} value={id}>
                          {code} &bull; {title}
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown size={16} color="#94a3b8" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Notes / Detailed Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Additional context, action steps, or technician notes..."
                  value={form.MessageText}
                  onChange={(e) => setForm({ ...form, MessageText: e.target.value })}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '10px',
                    background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                    color: 'var(--text-primary)', fontSize: '0.84rem', outline: 'none',
                    resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '10px 18px', borderRadius: '10px',
                    background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                    color: 'var(--text-secondary)', fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting || !form.Title.trim() || !form.ReminderDateTime}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    padding: '10px 22px', borderRadius: '10px', border: 'none',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: '#fff', fontSize: '0.84rem', fontWeight: 700,
                    cursor: submitting ? 'wait' : 'pointer',
                    boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)', transition: 'all 0.2s'
                  }}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Scheduling...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Create Reminder</span>
                    </>
                  )}
                </button>
              </div>
            </form>
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
