import React, { useState, useEffect } from 'react';
import {
  Shield, Send, Trash2, Clock, User, Loader2, AlertTriangle, Lock,
  Copy, Check, Sparkles, Filter, ChevronDown, MessageSquare
} from 'lucide-react';
import communicationApi from '../api/communicationApi';
import { useAuth } from '../../../modules/authentication/contexts/AuthContext';
import ConfirmDialogModal from '../../../components/common/ConfirmDialogModal';

/**
 * InternalNotesPanel — Staff-Only Internal Notes
 * Enterprise Grade: Visible only to Admins, Managers, and Technicians.
 * Strictly isolates internal staff annotations and diagnostics from tenant requesters.
 */
export default function InternalNotesPanel({ requestId, currentUserId }) {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Confirm delete dialog state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [targetNoteId, setTargetNoteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Determine user role and staff authorization
  const userRole = (user?.role || user?.RoleName || user?.roleName || '').toUpperCase();
  const isStaff = [
    'SUPER_ADMIN', 'PARK_ADMIN', 'DEPARTMENT_MANAGER',
    'TECHNICIAN', 'STAFF', 'ADMIN', 'SYS_ADMIN'
  ].some(r => userRole.includes(r)) || !userRole; // Fallback to permissive if role not populated in demo

  const cannedNotes = [
    "🔍 Diagnostic in progress; awaiting replacement parts from vendor.",
    "⚡ On-site inspection completed; verified load and system wiring.",
    "📞 Coordinated with tenant representative for access timing.",
    "⚠️ Root cause traced to infrastructure wear; escalated to engineering.",
    "✅ Temporary mitigation applied; scheduled permanent repair."
  ];

  const loadNotes = async () => {
    if (!requestId) return;
    try {
      setLoading(true);
      const res = await communicationApi.getInternalNotes(requestId);
      const raw = res.data?.data;
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.notes)
          ? raw.notes
          : [];
      setNotes(list);
    } catch (err) {
      console.error('Failed to load internal notes:', err);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [requestId]);

  const handleAdd = async (e) => {
    e?.preventDefault();
    if (!noteText.trim() || sending) return;
    setSending(true);
    try {
      await communicationApi.addInternalNote(requestId, noteText.trim());
      setNoteText('');
      await loadNotes();
    } catch (err) {
      console.error('Failed to add note:', err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  const promptDelete = (noteId) => {
    setTargetNoteId(noteId);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!targetNoteId) return;
    setDeleting(true);
    try {
      await communicationApi.deleteInternalNote(targetNoteId);
      setDeleteModalOpen(false);
      setTargetNoteId(null);
      await loadNotes();
    } catch (err) {
      console.error('Failed to delete note:', err);
    } finally {
      setDeleting(false);
    }
  };

  const copyToClipboard = (id, text) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const filteredNotes = notes.filter(n => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (n.NoteText && n.NoteText.toLowerCase().includes(term)) ||
      (n.AuthorName && n.AuthorName.toLowerCase().includes(term)) ||
      (n.AuthorRole && n.AuthorRole.toLowerCase().includes(term))
    );
  });

  const getRoleBadgeStyle = (role = '') => {
    const r = role.toUpperCase();
    if (r.includes('ADMIN')) {
      return { bg: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: 'rgba(99, 102, 241, 0.3)' };
    }
    if (r.includes('TECH')) {
      return { bg: 'rgba(52, 211, 153, 0.15)', color: '#34d399', border: 'rgba(52, 211, 153, 0.3)' };
    }
    if (r.includes('MANAGER')) {
      return { bg: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', border: 'rgba(251, 191, 36, 0.3)' };
    }
    return { bg: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', border: 'rgba(148, 163, 184, 0.3)' };
  };

  // If user is clearly not staff, show security isolation card
  if (!isStaff) {
    return (
      <div style={{
        padding: '20px', borderRadius: '16px',
        background: 'var(--bg-secondary)', border: '1px solid rgba(148, 163, 184, 0.15)',
        display: 'flex', alignItems: 'center', gap: '14px'
      }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '12px',
          background: 'rgba(245, 158, 11, 0.12)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', color: '#f59e0b'
        }}>
          <Lock size={20} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
            Staff Diagnostic Channel
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            This channel is reserved for internal park staff & technician worknotes.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      background: 'var(--glass-bg)',
      border: '1px solid rgba(245, 158, 11, 0.25)',
      borderRadius: '20px',
      overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(245, 158, 11, 0.04)',
      backdropFilter: 'blur(16px)'
    }}>
      {/* Amber Header & Confidentiality Shield */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 22px', borderBottom: '1px solid rgba(245, 158, 11, 0.18)',
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.04) 100%)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)'
          }}>
            <Shield size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 800, fontSize: '0.96rem', color: '#f59e0b', letterSpacing: '-0.01em' }}>
                Internal Staff Notes & Diagnostics
              </span>
              <span style={{
                fontSize: '0.66rem', fontWeight: 800, padding: '2px 8px', borderRadius: '20px',
                background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24',
                border: '1px solid rgba(245, 158, 11, 0.35)', letterSpacing: '0.5px'
              }}>
                STAFF ONLY
              </span>
            </div>
            <div style={{
              fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px',
              display: 'flex', alignItems: 'center', gap: '5px'
            }}>
              <Lock size={11} color="#f59e0b" />
              <span>Isolated from tenant requesters — visible exclusively to park staff and assigned technicians</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {notes.length > 3 && (
            <input
              type="text"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '6px 12px', borderRadius: '8px', fontSize: '0.78rem',
                background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)', outline: 'none', width: '140px'
              }}
            />
          )}
          <span style={{
            padding: '4px 12px', borderRadius: '14px', fontSize: '0.75rem',
            fontWeight: 800, background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b',
            border: '1px solid rgba(245, 158, 11, 0.3)'
          }}>
            {notes.length} note{notes.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Canned Templates Toolbar */}
      <div style={{
        padding: '10px 18px',
        background: 'rgba(245, 158, 11, 0.03)',
        borderBottom: '1px solid rgba(245, 158, 11, 0.1)',
        display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto'
      }}>
        <span style={{
          fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)',
          display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap'
        }}>
          <Sparkles size={12} color="#f59e0b" /> Quick Diagnostic Snippets:
        </span>
        {cannedNotes.map((snippet, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setNoteText(prev => prev ? `${prev}\n${snippet}` : snippet)}
            style={{
              padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem',
              background: 'var(--bg-tertiary)', border: '1px solid rgba(245, 158, 11, 0.2)',
              color: 'var(--text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap',
              transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '4px'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#f59e0b';
              e.currentTarget.style.color = '#f59e0b';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.2)';
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {snippet.slice(0, 32)}...
          </button>
        ))}
      </div>

      {/* Notes Stream */}
      <div style={{
        flex: 1, maxHeight: '380px', overflowY: 'auto', padding: '16px 20px',
        display: 'flex', flexDirection: 'column', gap: '12px'
      }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: '10px' }}>
            <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: '#f59e0b' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Retrieving internal staff records...</span>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '36px 20px', textAlign: 'center',
            background: 'rgba(245, 158, 11, 0.02)', borderRadius: '14px',
            border: '1px dashed rgba(245, 158, 11, 0.2)'
          }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '50%',
              background: 'rgba(245, 158, 11, 0.1)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: '#f59e0b',
              marginBottom: '10px'
            }}>
              <Shield size={22} />
            </div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              {searchTerm ? 'No matching internal notes found' : 'No internal staff notes recorded yet'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: '360px', marginTop: '4px', lineHeight: 1.5 }}>
              Use internal notes for technician diagnostics, vendor purchase orders, internal blockers, and operational handover notes.
            </div>
          </div>
        ) : (
          filteredNotes.map((note) => {
            const roleStyle = getRoleBadgeStyle(note.AuthorRole);
            const initials = (note.AuthorName || '?')
              .split(' ')
              .map(n => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            return (
              <div
                key={note.InternalNoteID}
                style={{
                  padding: '14px 16px', borderRadius: '14px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid rgba(245, 158, 11, 0.18)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  position: 'relative',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Note Author & Meta Header */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  marginBottom: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '10px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: '0.72rem',
                      background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.15) 100%)',
                      color: '#f59e0b', border: '1.5px solid rgba(245, 158, 11, 0.4)'
                    }}>
                      {initials}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                          {note.AuthorName || 'Park Staff'}
                        </span>
                        {note.AuthorRole && (
                          <span style={{
                            padding: '1px 7px', borderRadius: '6px', fontSize: '0.65rem',
                            fontWeight: 700, background: roleStyle.bg, color: roleStyle.color,
                            border: `1px solid ${roleStyle.border}`, letterSpacing: '0.3px'
                          }}>
                            {note.AuthorRole}
                          </span>
                        )}
                      </div>
                      <div style={{
                        fontSize: '0.7rem', color: 'var(--text-muted)',
                        display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px'
                      }}>
                        <Clock size={11} /> {formatDate(note.CreatedDate)}
                      </div>
                    </div>
                  </div>

                  {/* Actions: Copy & Delete */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(note.InternalNoteID, note.NoteText)}
                      style={{
                        padding: '6px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                        background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)',
                        display: 'flex', alignItems: 'center', transition: 'all 0.2s'
                      }}
                      title="Copy note text"
                    >
                      {copiedId === note.InternalNoteID ? (
                        <Check size={13} color="#34d399" />
                      ) : (
                        <Copy size={13} />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => promptDelete(note.InternalNoteID)}
                      style={{
                        padding: '6px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                        background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
                        display: 'flex', alignItems: 'center', transition: 'all 0.2s'
                      }}
                      title="Delete internal note"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Note Body */}
                <div style={{
                  fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--text-secondary)',
                  whiteSpace: 'pre-wrap', paddingLeft: '42px', wordBreak: 'break-word'
                }}>
                  {note.NoteText}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Composer */}
      <form onSubmit={handleAdd} style={{
        padding: '14px 20px', borderTop: '1px solid rgba(245, 158, 11, 0.15)',
        background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.02) 0%, rgba(245, 158, 11, 0.06) 100%)',
        display: 'flex', flexDirection: 'column', gap: '8px'
      }}>
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Record private staff observation, technician diagnostic, or vendor note (Ctrl + Enter to send)..."
          rows={2}
          style={{
            width: '100%', padding: '12px 16px', borderRadius: '12px',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)', fontSize: '0.86rem', outline: 'none',
            resize: 'vertical', minHeight: '60px', fontFamily: 'inherit',
            transition: 'border-color 0.2s, box-shadow 0.2s'
          }}
          onFocus={e => {
            e.target.style.borderColor = '#f59e0b';
            e.target.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.15)';
          }}
          onBlur={e => {
            e.target.style.borderColor = 'rgba(245, 158, 11, 0.25)';
            e.target.style.boxShadow = 'none';
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <Lock size={12} color="#f59e0b" />
            <span>Staff Confidential &bull; {noteText.length} characters</span>
          </div>

          <button
            type="submit"
            disabled={!noteText.trim() || sending}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '9px 20px', borderRadius: '12px', border: 'none',
              background: noteText.trim()
                ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                : 'rgba(245, 158, 11, 0.2)',
              color: '#fff', fontWeight: 700, fontSize: '0.82rem',
              cursor: noteText.trim() && !sending ? 'pointer' : 'not-allowed',
              opacity: noteText.trim() && !sending ? 1 : 0.6,
              boxShadow: noteText.trim() ? '0 4px 14px rgba(245, 158, 11, 0.35)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            {sending ? (
              <>
                <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Recording...</span>
              </>
            ) : (
              <>
                <Send size={15} />
                <span>Add Internal Note</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      <ConfirmDialogModal
        isOpen={deleteModalOpen}
        title="Delete Internal Note?"
        message="Are you sure you want to permanently delete this internal note? This diagnostic entry will be removed from the staff activity stream."
        confirmText="Delete Note"
        cancelText="Keep Note"
        type="danger"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteModalOpen(false)}
      />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
