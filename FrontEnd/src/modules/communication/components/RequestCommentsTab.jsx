import React, { useState, useEffect, useRef } from 'react';
import {
  Send, Lock, Globe, Search, ChevronDown, Trash2, Clock, User,
  Loader2, RefreshCw, MessageSquare, AlertCircle, Shield
} from 'lucide-react';
import communicationApi from '../api/communicationApi';
import issueManagementApi from '../../issue-management/api/issueManagementApi';
import { useAuth } from '../../../modules/authentication/contexts/AuthContext';
import ConfirmDialogModal from '../../../components/common/ConfirmDialogModal';

const glassCard = {
  background: 'var(--glass-bg)',
  border: '1px solid var(--glass-border)',
  borderRadius: '20px',
  backdropFilter: 'blur(16px)',
  padding: '24px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
};

export default function RequestCommentsTab({ initialRequestId }) {
  const { user } = useAuth();
  const [issueId, setIssueId] = useState(initialRequestId ? String(initialRequestId) : '');
  const [requestsList, setRequestsList] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [targetCommentId, setTargetCommentId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const scrollRef = useRef(null);

  const userRole = (user?.role || user?.RoleName || '').toUpperCase();
  const isStaff = ['SUPER_ADMIN', 'PARK_ADMIN', 'DEPARTMENT_MANAGER', 'TECHNICIAN', 'STAFF', 'ADMIN'].some(r => userRole.includes(r)) || !userRole;

  // Load requests list for the dropdown
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await issueManagementApi.getIssues({ limit: 100 });
        const list = res.data?.data?.issues || res.data?.data || [];
        setRequestsList(Array.isArray(list) ? list : []);

        if (!initialRequestId && list.length > 0) {
          setIssueId(String(list[0].IssueRequestID || list[0].RequestID || ''));
        }
      } catch (err) {
        console.error('Failed to load issues for comments selector:', err);
      }
    };
    fetchRequests();
  }, [initialRequestId]);

  const loadComments = async () => {
    if (!issueId) return;
    setLoading(true);
    try {
      const res = await communicationApi.getComments(issueId);
      const raw = res.data?.data;
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.comments)
          ? raw.comments
          : [];
      setComments(list);
    } catch (e) {
      console.error('Failed to load comments:', e);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (issueId) {
      loadComments();
    }
  }, [issueId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!commentText.trim() || !issueId || sending) return;
    setSending(true);
    try {
      await communicationApi.addComment({
        IssueRequestID: Number(issueId),
        CommentText: commentText.trim(),
        IsInternal: isInternal
      });
      setCommentText('');
      await loadComments();
    } catch (e) {
      console.error('Failed to post comment:', e);
    } finally {
      setSending(false);
    }
  };

  const promptDelete = (id) => {
    setTargetCommentId(id);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!targetCommentId) return;
    setDeleting(true);
    try {
      await communicationApi.deleteComment(targetCommentId);
      setDeleteModalOpen(false);
      setTargetCommentId(null);
      await loadComments();
    } catch (e) {
      console.error('Failed to delete comment:', e);
    } finally {
      setDeleting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatDate = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    return dt.toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const selectedReq = requestsList.find(r => String(r.IssueRequestID || r.RequestID) === String(issueId));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Searchable Issue Selector Header */}
      <div style={{
        ...glassCard,
        padding: '18px 24px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 340px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(79, 70, 229, 0.1) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#6366f1', border: '1px solid rgba(99, 102, 241, 0.3)'
          }}>
            <MessageSquare size={20} />
          </div>

          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '4px' }}>
              Select Request Discussion:
            </label>
            <div style={{ position: 'relative' }}>
              <select
                value={issueId}
                onChange={(e) => setIssueId(e.target.value)}
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
                  <option value="">No requests available</option>
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={loadComments}
            disabled={loading}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: '10px',
              border: '1px solid var(--glass-border)',
              background: 'var(--bg-tertiary)', color: 'var(--text-secondary)',
              fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            <span>Refresh</span>
          </button>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600 }}>
            {comments.length} message{comments.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Comment Stream */}
      <div style={{
        ...glassCard,
        padding: '0',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '440px',
        maxHeight: '560px',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--glass-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '10px', height: '10px', borderRadius: '50%',
              background: '#10b981', boxShadow: '0 0 10px rgba(16, 185, 129, 0.6)'
            }} />
            <span style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '0.94rem' }}>
              Request Discussion Thread
            </span>
          </div>
          {selectedReq && (
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {selectedReq.RequestCode || `#${issueId}`} &bull; {selectedReq.Title}
            </span>
          )}
        </div>

        {/* Messages List */}
        <div ref={scrollRef} style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '50px 0' }}>
              <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px', color: '#6366f1' }} />
              <span style={{ fontSize: '0.85rem' }}>Loading conversation history...</span>
            </div>
          ) : comments.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px 0' }}>
              <MessageSquare size={36} color="rgba(148, 163, 184, 0.3)" style={{ marginBottom: '12px' }} />
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                No messages yet on this request
              </div>
              <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                Use the input field below to post an update or technical question.
              </div>
            </div>
          ) : (
            comments.map((c) => {
              return (
                <div
                  key={c.IssueRequestCommentID}
                  style={{
                    background: c.IsInternal
                      ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(217, 119, 6, 0.04) 100%)'
                      : 'var(--bg-tertiary)',
                    border: `1px solid ${c.IsInternal ? 'rgba(245, 158, 11, 0.25)' : 'var(--glass-border)'}`,
                    borderRadius: '16px',
                    padding: '16px 20px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                    transition: 'all 0.2s ease',
                    animation: 'fadeInUp 0.25s ease-out'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '30px', height: '30px', borderRadius: '10px',
                        background: c.IsInternal
                          ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                          : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', boxShadow: c.IsInternal ? '0 2px 8px rgba(245, 158, 11, 0.3)' : '0 2px 8px rgba(99, 102, 241, 0.3)'
                      }}>
                        {c.IsInternal ? <Lock size={13} /> : <Globe size={13} />}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.86rem' }}>
                            {c.AuthorName || 'Requester'}
                          </span>
                          {c.IsInternal && (
                            <span style={{
                              background: 'rgba(245, 158, 11, 0.15)',
                              color: '#f59e0b',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '0.65rem',
                              fontWeight: 800,
                              letterSpacing: '0.5px',
                              border: '1px solid rgba(245, 158, 11, 0.3)'
                            }}>STAFF ONLY</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={11} /> {formatDate(c.CreatedDate)}
                      </span>
                      {isStaff && (
                        <button
                          onClick={() => promptDelete(c.IssueRequestCommentID)}
                          style={{
                            background: 'transparent', border: 'none', cursor: 'pointer',
                            color: 'var(--text-muted)', padding: '4px', borderRadius: '6px',
                            display: 'flex', alignItems: 'center', transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                          title="Delete comment"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  <p style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.86rem',
                    lineHeight: 1.6,
                    margin: '6px 0 0',
                    paddingLeft: '40px',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {c.CommentText}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Composer */}
        <form onSubmit={handleSend} style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--glass-border)',
          background: 'rgba(255, 255, 255, 0.02)',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-end'
        }}>
          {/* Internal / Public toggle for staff */}
          {isStaff && (
            <button
              type="button"
              onClick={() => setIsInternal(!isInternal)}
              title={isInternal ? 'Internal Staff Note' : 'Public to Requester'}
              style={{
                background: isInternal
                  ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                  : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                border: 'none',
                borderRadius: '12px',
                width: '42px',
                height: '42px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.25s',
                color: '#fff',
                flexShrink: 0,
                boxShadow: isInternal ? '0 4px 12px rgba(245, 158, 11, 0.35)' : '0 4px 12px rgba(99, 102, 241, 0.35)'
              }}
            >
              {isInternal ? <Lock size={16} /> : <Globe size={16} />}
            </button>
          )}

          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isInternal
                ? 'Write private internal staff note (Enter to send)...'
                : 'Write message visible to requester and stakeholders (Enter to send)...'
            }
            rows={2}
            style={{
              flex: 1,
              background: 'var(--bg-tertiary)',
              border: `1px solid ${isInternal ? 'rgba(245, 158, 11, 0.35)' : 'rgba(99, 102, 241, 0.35)'}`,
              borderRadius: '12px',
              padding: '10px 16px',
              color: 'var(--text-primary)',
              fontSize: '0.86rem',
              outline: 'none',
              resize: 'none',
              lineHeight: 1.5,
              transition: 'all 0.2s ease',
              fontFamily: 'inherit'
            }}
          />

          <button
            type="submit"
            disabled={!commentText.trim() || sending}
            style={{
              background: commentText.trim()
                ? 'var(--accent-gradient)'
                : 'rgba(100, 116, 139, 0.25)',
              border: 'none',
              borderRadius: '12px',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: commentText.trim() && !sending ? 'pointer' : 'default',
              transition: 'all 0.2s',
              flexShrink: 0,
              color: '#fff',
              boxShadow: commentText.trim() ? '0 4px 14px rgba(99, 102, 241, 0.35)' : 'none'
            }}
          >
            {sending ? (
              <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Send size={18} />
            )}
          </button>
        </form>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDialogModal
        isOpen={deleteModalOpen}
        title="Delete Discussion Message?"
        message="Are you sure you want to permanently delete this comment from the request discussion stream?"
        confirmText="Delete Message"
        cancelText="Cancel"
        type="danger"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteModalOpen(false)}
      />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
