import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  MessageSquare, Send, User, Clock, CheckCheck, Check,
  Paperclip, MoreVertical, ChevronDown, Search, Loader2,
  AlertCircle, Sparkles, ExternalLink, Zap, Shield, CheckCircle2,
  HelpCircle, RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import communicationApi from '../api/communicationApi';
import { useAuth } from '../../authentication/contexts/AuthContext';

/**
 * ConversationPanel — Internationally Accepted, Production-Ready Request Messaging Thread
 * Slack/Teams grade chat experience with real-time polling, role badges, canned responses,
 * date dividers, read receipts, and keyboard shortcuts.
 */
export default function ConversationPanel({ issueRequestId, currentUserId, compact = false, onRequestOpen }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const effectiveUserId = currentUserId || user?.id || user?.userId || user?.UserID || 1;
  const userRole = (user?.userTypeCode || user?.role || '').toUpperCase();
  const isStaff = userRole.includes('ADMIN') || userRole.includes('TECH') || userRole.includes('MANAGER');

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [showQuickReplies, setShowQuickReplies] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const pollRef = useRef(null);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  const loadConversation = useCallback(async (isSilent = false) => {
    if (!issueRequestId) return;
    try {
      if (!isSilent) setError(null);

      // Get or create conversation
      const convRes = await communicationApi.getOrCreateRequestConversation(issueRequestId);
      const convId = convRes.data?.data?.conversationId || convRes.data?.data?.ConversationID;
      if (!convId) {
        if (!isSilent) setLoading(false);
        return;
      }

      // Load conversation detail
      const detailRes = await communicationApi.getConversationByRequestId(issueRequestId);
      const detail = detailRes.data?.data;
      setConversation(detail);
      setParticipants(detail?.participants || []);

      // Load messages
      const msgRes = await communicationApi.getMessages(convId, { limit: 100 });
      const rawM = msgRes.data?.data;
      const mList = Array.isArray(rawM)
        ? rawM
        : Array.isArray(rawM?.messages)
          ? rawM.messages
          : [];
      
      setMessages(prev => {
        if (prev.length !== mList.length) {
          setTimeout(() => scrollToBottom(true), 100);
        }
        return mList;
      });

      // Mark as read
      await communicationApi.markAsRead(convId).catch(() => {});
    } catch (err) {
      console.error('Failed to load conversation:', err);
      if (!isSilent) setError('Failed to load conversation thread. Please check network connection.');
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [issueRequestId, scrollToBottom]);

  useEffect(() => {
    setLoading(true);
    loadConversation(false);

    // Active polling every 12 seconds for responsive live sync
    pollRef.current = setInterval(() => {
      loadConversation(true);
    }, 12000);

    return () => clearInterval(pollRef.current);
  }, [issueRequestId, loadConversation]);

  useEffect(() => {
    scrollToBottom(false);
  }, [messages.length, scrollToBottom]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!messageText.trim() || sending) return;

    const payloadText = messageText.trim();
    setSending(true);
    try {
      await communicationApi.sendRequestMessage(issueRequestId, payloadText);
      setMessageText('');
      await loadConversation(true);
      setTimeout(() => {
        scrollToBottom(true);
        inputRef.current?.focus();
      }, 100);
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Could not send message. Please retry.');
    } finally {
      setSending(false);
    }
  };

  const handleQuickReply = (text) => {
    setMessageText(text);
    inputRef.current?.focus();
  };

  const cannedResponses = useMemo(() => {
    if (isStaff) {
      return [
        { label: 'On My Way', text: "Hello! I am on my way to your location to inspect this issue." },
        { label: 'Diagnosing', text: "Currently diagnosing the root cause on-site. Will update shortly." },
        { label: 'Parts Ordered', text: "Replacement parts have been requested. Expected delivery soon." },
        { label: 'Work Completed', text: "Work on this request has been completed. Please test and confirm." },
        { label: 'Need Info', text: "Could you please provide additional details or photos of the problem?" }
      ];
    } else {
      return [
        { label: 'Thanks', text: "Thank you for the update!" },
        { label: 'Confirmed', text: "The issue is now fully resolved on my end. Thank you!" },
        { label: 'Available Now', text: "I am currently at my desk and available for inspection." },
        { label: 'Urgent Help', text: "Please expedite if possible as this is impacting our daily operations." }
      ];
    }
  }, [isStaff]);

  const formatMessageTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getDayDivider = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diffDays = Math.round((today - target) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleBadge = (roleCode) => {
    const code = (roleCode || '').toUpperCase();
    if (code.includes('ADMIN')) return { label: 'Admin', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' };
    if (code.includes('TECH')) return { label: 'Technician', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)' };
    if (code.includes('MANAGER')) return { label: 'Manager', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' };
    if (code.includes('TENANT')) return { label: 'Tenant', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' };
    return { label: 'Requester', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.15)' };
  };

  const getPriorityStyle = (priority) => {
    const p = (priority || '').toUpperCase();
    if (p === 'CRITICAL') return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)' };
    if (p === 'HIGH') return { color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)', border: 'rgba(249, 115, 22, 0.3)' };
    if (p === 'MEDIUM') return { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.3)' };
    return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)' };
  };

  const getStatusStyle = (status) => {
    const s = (status || '').toUpperCase();
    if (s === 'RESOLVED' || s === 'CLOSED') return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' };
    if (s === 'IN_PROGRESS' || s === 'ASSIGNED') return { color: '#6366f1', bg: 'rgba(99, 102, 241, 0.15)' };
    if (s === 'CANCELLED') return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' };
    return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' };
  };

  const handleNavigateToRequest = () => {
    if (onRequestOpen) {
      onRequestOpen(issueRequestId);
    } else {
      navigate(`/issues`);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: compact ? '420px' : '620px', background: 'var(--bg-secondary)',
        borderRadius: '16px', border: '1px solid var(--glass-border)', gap: '12px'
      }}>
        <Loader2 size={28} className="spin" color="var(--accent-primary)" />
        <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem', fontWeight: 600 }}>
          Synchronizing secure conversation thread...
        </span>
      </div>
    );
  }

  if (error && messages.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: compact ? '420px' : '620px', background: 'var(--bg-secondary)',
        borderRadius: '16px', border: '1px solid var(--glass-border)', padding: '24px', textAlign: 'center'
      }}>
        <AlertCircle size={36} color="#ef4444" style={{ marginBottom: '12px' }} />
        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>Conversation Unavailable</div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '340px' }}>
          {error}
        </div>
        <button
          onClick={() => loadConversation(false)}
          style={{
            marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px', borderRadius: '8px', background: 'var(--bg-tertiary)',
            border: '1px solid var(--glass-border)', color: 'var(--text-primary)', cursor: 'pointer',
            fontSize: '0.85rem', fontWeight: 600
          }}
        >
          <RefreshCw size={14} /> Retry Connection
        </button>
      </div>
    );
  }

  const pStyle = getPriorityStyle(conversation?.RequestPriority);
  const sStyle = getStatusStyle(conversation?.RequestStatus);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: compact ? '480px' : '640px',
      background: 'var(--bg-secondary)',
      border: '1px solid var(--glass-border-accent)',
      borderRadius: compact ? '12px' : '20px',
      boxShadow: 'var(--shadow-lg)',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* ── Thread Header ── */}
      <div style={{
        padding: '14px 20px',
        background: 'linear-gradient(180deg, var(--bg-tertiary) 0%, rgba(255,255,255,0.01) 100%)',
        borderBottom: '1px solid var(--glass-border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '12px'
      }}>
        {/* Left: Request Context */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <div style={{
            padding: '10px', borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(124,58,237,0.15) 100%)',
            color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <MessageSquare size={18} />
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {conversation?.IssueRequestCode && (
                <button
                  onClick={handleNavigateToRequest}
                  title="Click to view issue request"
                  style={{
                    fontFamily: 'monospace', fontWeight: 800, fontSize: '0.78rem',
                    padding: '3px 8px', borderRadius: '6px',
                    background: 'rgba(99,102,241,0.12)', color: '#818cf8',
                    border: '1px solid rgba(99,102,241,0.25)', cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: '4px'
                  }}
                >
                  {conversation.IssueRequestCode} <ExternalLink size={10} />
                </button>
              )}

              {conversation?.RequestPriority && (
                <span style={{
                  padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem',
                  fontWeight: 700, color: pStyle.color, background: pStyle.bg,
                  border: `1px solid ${pStyle.border}`
                }}>
                  {conversation.RequestPriority}
                </span>
              )}

              {conversation?.RequestStatus && (
                <span style={{
                  padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem',
                  fontWeight: 700, color: sStyle.color, background: sStyle.bg
                }}>
                  {conversation.RequestStatus}
                </span>
              )}
            </div>

            <div style={{
              fontWeight: 800, fontSize: '0.96rem', color: 'var(--text-primary)',
              marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>
              {conversation?.RequestTitle || conversation?.Title || 'Service Request Discussion'}
            </div>
          </div>
        </div>

        {/* Right: Live Sync & Participants */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Pulsing Live indicator */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            fontSize: '0.72rem', fontWeight: 700, color: '#4ade80',
            background: 'rgba(74, 222, 128, 0.1)', border: '1px solid rgba(74, 222, 128, 0.25)',
            padding: '4px 10px', borderRadius: '20px'
          }}>
            <span style={{
              width: '7px', height: '7px', borderRadius: '50%', background: '#4ade80',
              boxShadow: '0 0 8px #4ade80', display: 'inline-block'
            }} />
            Live Sync
          </div>

          {/* Participant Avatars */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {participants.slice(0, 4).map((p, idx) => {
              const b = getRoleBadge(p.RoleCode || p.UserTypeCode);
              return (
                <div
                  key={p.UserID || idx}
                  title={`${p.FullName || p.Username} (${b.label})`}
                  style={{
                    width: '30px', height: '30px', borderRadius: '50%',
                    background: b.bg, border: `2px solid ${b.color}`, color: b.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '0.72rem',
                    marginLeft: idx > 0 ? '-8px' : 0, zIndex: 10 - idx
                  }}
                >
                  {getInitials(p.FullName || p.Username)}
                </div>
              );
            })}
            {participants.length > 4 && (
              <div style={{
                width: '30px', height: '30px', borderRadius: '50%',
                background: 'var(--bg-tertiary)', border: '2px solid var(--glass-border)',
                color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '0.68rem', fontWeight: 800,
                marginLeft: '-8px'
              }}>
                +{participants.length - 4}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Message Stream ── */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '20px',
        display: 'flex', flexDirection: 'column', gap: '6px'
      }}>
        {messages.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', flex: 1, padding: '40px', textAlign: 'center'
          }}>
            <div style={{
              padding: '16px', borderRadius: '50%', background: 'rgba(99,102,241,0.08)',
              color: 'var(--accent-primary)', marginBottom: '14px'
            }}>
              <MessageSquare size={36} />
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
              No messages logged yet
            </div>
            <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '360px', lineHeight: 1.5 }}>
              Begin collaborating with technicians, facility managers, and requesters on this service ticket.
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isOwn = Number(msg.SenderUserID) === Number(effectiveUserId);
            const prevMsg = index > 0 ? messages[index - 1] : null;
            const isFirstOfSender = !prevMsg || Number(prevMsg.SenderUserID) !== Number(msg.SenderUserID);
            const dayDivider = !prevMsg || getDayDivider(prevMsg.SentDateTime) !== getDayDivider(msg.SentDateTime)
              ? getDayDivider(msg.SentDateTime)
              : null;
            const roleBadge = getRoleBadge(msg.SenderRoleCode);

            return (
              <React.Fragment key={msg.MessageID || index}>
                {/* Date Divider */}
                {dayDivider && (
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '18px 0 10px'
                  }}>
                    <span style={{
                      fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)',
                      padding: '4px 12px', borderRadius: '12px',
                      background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)'
                    }}>
                      {dayDivider}
                    </span>
                  </div>
                )}

                {/* Message Bubble Container */}
                <div style={{
                  display: 'flex',
                  justifyContent: isOwn ? 'flex-end' : 'flex-start',
                  alignItems: 'flex-end',
                  gap: '8px',
                  marginTop: isFirstOfSender ? '10px' : '2px'
                }}>
                  {/* Avatar on left for other participants */}
                  {!isOwn && (
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      background: roleBadge.bg, border: `1.5px solid ${roleBadge.color}`,
                      color: roleBadge.color, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800,
                      flexShrink: 0, opacity: isFirstOfSender ? 1 : 0
                    }}>
                      {getInitials(msg.SenderName)}
                    </div>
                  )}

                  {/* Message Body */}
                  <div style={{ maxWidth: '75%', minWidth: '120px' }}>
                    {/* Header with Sender Name & Role */}
                    {!isOwn && isFirstOfSender && (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        marginBottom: '3px', fontSize: '0.75rem'
                      }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          {msg.SenderName}
                        </span>
                        <span style={{
                          fontSize: '0.65rem', fontWeight: 800, padding: '1px 6px',
                          borderRadius: '6px', background: roleBadge.bg, color: roleBadge.color
                        }}>
                          {roleBadge.label}
                        </span>
                      </div>
                    )}

                    <div style={{
                      padding: '11px 15px',
                      borderRadius: isOwn
                        ? '16px 16px 4px 16px'
                        : '16px 16px 16px 4px',
                      background: isOwn
                        ? 'var(--accent-gradient)'
                        : 'var(--bg-tertiary)',
                      border: isOwn
                        ? 'none'
                        : '1px solid var(--glass-border)',
                      color: isOwn ? '#ffffff' : 'var(--text-primary)',
                      boxShadow: isOwn
                        ? '0 4px 15px rgba(99, 102, 241, 0.25)'
                        : 'none',
                      fontSize: '0.88rem',
                      lineHeight: '1.45',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}>
                      {msg.MessageText}

                      {/* Timestamp & Read Status */}
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                        gap: '4px', marginTop: '4px', fontSize: '0.68rem',
                        color: isOwn ? 'rgba(255,255,255,0.75)' : 'var(--text-muted)'
                      }}>
                        <span>{formatMessageTime(msg.SentDateTime)}</span>
                        {isOwn && (
                          (msg.ReadCount > 1 || msg.IsRead) ? (
                            <CheckCheck size={13} color="#4ade80" />
                          ) : (
                            <Check size={13} color="rgba(255,255,255,0.7)" />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Canned Responses Quick Bar ── */}
      <div style={{
        padding: '8px 20px',
        background: 'rgba(255,255,255,0.02)',
        borderTop: '1px solid var(--glass-border)',
        display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto'
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)',
          whiteSpace: 'nowrap'
        }}>
          <Zap size={13} color="var(--accent-primary)" /> Quick:
        </div>
        {cannedResponses.map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleQuickReply(item.text)}
            style={{
              padding: '4px 10px', borderRadius: '12px',
              background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
              color: 'var(--text-secondary)', fontSize: '0.72rem', fontWeight: 600,
              cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent-primary)'; e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* ── Input Box & Send Bar ── */}
      <form onSubmit={handleSend} style={{
        padding: '14px 20px',
        background: 'var(--bg-tertiary)',
        borderTop: '1px solid var(--glass-border)',
        display: 'flex', alignItems: 'flex-end', gap: '10px'
      }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <textarea
            ref={inputRef}
            rows={1}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type a message to stakeholders... (Enter to send, Shift+Enter for new line)"
            disabled={sending}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            style={{
              width: '100%',
              padding: '11px 14px',
              borderRadius: '12px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-primary)',
              fontSize: '0.88rem',
              outline: 'none',
              resize: 'none',
              maxHeight: '120px',
              minHeight: '44px',
              boxSizing: 'border-box',
              fontFamily: 'inherit',
              lineHeight: 1.4
            }}
          />
        </div>

        <button
          type="submit"
          disabled={!messageText.trim() || sending}
          style={{
            height: '44px', padding: '0 18px',
            borderRadius: '12px', border: 'none',
            background: messageText.trim() ? 'var(--accent-gradient)' : 'var(--bg-primary)',
            color: messageText.trim() ? '#ffffff' : 'var(--text-muted)',
            fontWeight: 700, fontSize: '0.88rem',
            cursor: messageText.trim() ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            boxShadow: messageText.trim() ? '0 4px 15px rgba(99, 102, 241, 0.3)' : 'none',
            transition: 'all 0.2s ease', flexShrink: 0
          }}
        >
          {sending ? (
            <Loader2 size={18} className="spin" />
          ) : (
            <>
              <Send size={16} /> Send
            </>
          )}
        </button>
      </form>
    </div>
  );
}
