import React, { useState, useEffect } from 'react';
import {
  Send, Mail, X, CheckCircle2, AlertCircle, Eye,
  Sparkles, Loader2, BookOpen, Layers, Users
} from 'lucide-react';
import notificationApi from '../api/notificationApi';
import { useAuth } from '../../authentication/contexts/AuthContext';

const glassCard = {
  background: 'var(--glass-bg)',
  border: '1px solid var(--glass-border)',
  borderRadius: '20px',
  backdropFilter: 'blur(16px)',
  padding: '24px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
};

export default function SendNotificationModal({ isOpen, onClose, onSuccess }) {
  const { user } = useAuth();
  const currentUserId = user?.id || user?.userId || user?.UserID || 1;
  const currentUserEmail = user?.email || user?.Email || '';

  const [activeMode, setActiveMode] = useState('DISPATCH'); // DISPATCH or TEST_EMAIL
  const [typeCode, setTypeCode] = useState('ISSUE_CREATED');
  const [toEmail, setToEmail] = useState(currentUserEmail || '');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [requestNumber, setRequestNumber] = useState('REQ-2026-0042');
  const [recipientTarget, setRecipientTarget] = useState('SELF'); // SELF or ALL
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (!toEmail && currentUserEmail) {
        setToEmail(currentUserEmail);
      }
      // Load templates to offer pre-fill
      notificationApi.getTemplates()
        .then(res => setTemplates(res.data?.data || []))
        .catch(() => {});
    }
  }, [isOpen, currentUserEmail]);

  if (!isOpen) return null;

  const handleTemplateSelect = (templateId) => {
    if (!templateId) return;
    const found = templates.find(t => String(t.NotificationTemplateID) === String(templateId));
    if (found) {
      if (found.TemplateSubject) setTitle(found.TemplateSubject);
      if (found.TemplateBody) setMessage(found.TemplateBody);
      if (found.TypeCode) setTypeCode(found.TypeCode);
    }
  };

  const handleDispatch = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setStatusMsg(null);
    try {
      const recipientIds = recipientTarget === 'SELF' ? [currentUserId] : [currentUserId];
      const res = await notificationApi.dispatchNotification({
        typeCode,
        recipientUserIds: recipientIds,
        contextData: {
          title: title || undefined,
          message: message || undefined,
          requestNumber: requestNumber || undefined,
          userName: user?.name || user?.username || 'Facility User'
        }
      });
      const notifId = res.data?.data?.notificationId;
      setStatusMsg({
        type: 'success',
        text: `Alert dispatched successfully! (Reference #${notifId || 'OK'})`
      });
      if (onSuccess) onSuccess();
    } catch (err) {
      setStatusMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to dispatch notification'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestEmail = async (e) => {
    e?.preventDefault();
    if (!toEmail.trim()) {
      setStatusMsg({ type: 'error', text: 'Please enter a valid recipient email address' });
      return;
    }
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await notificationApi.sendTestEmail({ toEmail: toEmail.trim() });
      const preview = res.data?.data?.previewUrl;
      setStatusMsg({
        type: 'success',
        text: `SMTP test email delivered to ${toEmail}! ${preview ? `(Preview: ${preview})` : ''}`
      });
      if (onSuccess) onSuccess();
    } catch (err) {
      setStatusMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to send test email through SMTP gateway'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 10000, padding: '20px'
    }} onClick={onClose}>
      <div style={{
        ...glassCard, width: '560px', maxWidth: '100%',
        border: '1px solid rgba(99, 102, 241, 0.35)',
        boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6)',
        animation: 'fadeInUp 0.25s ease-out'
      }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(79, 70, 229, 0.15) 100%)',
              color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Send size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 800 }}>
                Notification Dispatch & SMTP Test
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Trigger system event notifications or test production mail delivery
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', background: 'var(--bg-tertiary)', padding: '4px', borderRadius: '10px' }}>
          <button
            type="button"
            onClick={() => { setActiveMode('DISPATCH'); setStatusMsg(null); }}
            style={{
              flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
              background: activeMode === 'DISPATCH' ? 'var(--accent-gradient)' : 'transparent',
              color: activeMode === 'DISPATCH' ? '#fff' : 'var(--text-secondary)',
              fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s'
            }}
          >
            <Sparkles size={14} />
            <span>Event Dispatch (In-App)</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveMode('TEST_EMAIL'); setStatusMsg(null); }}
            style={{
              flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
              background: activeMode === 'TEST_EMAIL' ? 'var(--accent-gradient)' : 'transparent',
              color: activeMode === 'TEST_EMAIL' ? '#fff' : 'var(--text-secondary)',
              fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s'
            }}
          >
            <Mail size={14} />
            <span>SMTP Mail Test</span>
          </button>
        </div>

        {/* Status Feedback Banner */}
        {statusMsg && (
          <div style={{
            padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', fontSize: '0.82rem',
            background: statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: statusMsg.type === 'success' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
            color: statusMsg.type === 'success' ? '#10b981' : '#ef4444',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            {statusMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span style={{ flex: 1, wordBreak: 'break-word' }}>{statusMsg.text}</span>
          </div>
        )}

        {/* Dispatch Form */}
        {activeMode === 'DISPATCH' ? (
          <form onSubmit={handleDispatch} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {templates.length > 0 && (
              <div>
                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.74rem', fontWeight: 700, marginBottom: '6px' }}>
                  Pre-Fill from Existing Template (Optional)
                </label>
                <select
                  onChange={(e) => handleTemplateSelect(e.target.value)}
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: '10px',
                    background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                    color: 'var(--text-primary)', fontSize: '0.84rem', outline: 'none', boxSizing: 'border-box'
                  }}
                >
                  <option value="">Select a template to pre-fill subject & body...</option>
                  {templates.map(t => (
                    <option key={t.NotificationTemplateID} value={t.NotificationTemplateID}>
                      {t.TemplateCode} &bull; {t.TypeName || t.TemplateCode}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.74rem', fontWeight: 700, marginBottom: '6px' }}>
                  Event Type
                </label>
                <select
                  value={typeCode}
                  onChange={(e) => setTypeCode(e.target.value)}
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: '10px',
                    background: 'var(--bg-tertiary)', border: '1px solid rgba(99, 102, 241, 0.3)',
                    color: 'var(--text-primary)', fontSize: '0.84rem', outline: 'none', boxSizing: 'border-box'
                  }}
                >
                  <option value="ISSUE_CREATED">ISSUE_CREATED (New Request)</option>
                  <option value="ISSUE_ASSIGNED">ISSUE_ASSIGNED (Dispatch Alert)</option>
                  <option value="SLA_BREACH">SLA_BREACH (Urgent SLA Breach)</option>
                  <option value="APPROVAL_REQUIRED">APPROVAL_REQUIRED (Approval Needed)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.74rem', fontWeight: 700, marginBottom: '6px' }}>
                  Target Request Number
                </label>
                <input
                  type="text"
                  value={requestNumber}
                  onChange={(e) => setRequestNumber(e.target.value)}
                  placeholder="e.g. REQ-2026-0042"
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: '10px',
                    background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                    color: 'var(--text-primary)', fontSize: '0.84rem', outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.74rem', fontWeight: 700, marginBottom: '6px' }}>
                Notification Title / Subject
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Alert title (e.g. Server Room Temperature Alert)"
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: '10px',
                  background: 'var(--bg-tertiary)', border: '1px solid rgba(99, 102, 241, 0.3)',
                  color: 'var(--text-primary)', fontSize: '0.84rem', outline: 'none', boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.74rem', fontWeight: 700, marginBottom: '6px' }}>
                Message Content
              </label>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Message body content..."
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: '10px',
                  background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                  color: 'var(--text-primary)', fontSize: '0.84rem', outline: 'none',
                  resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '9px 18px', borderRadius: '10px',
                  background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                  color: 'var(--text-secondary)', fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '9px 22px', borderRadius: '10px', border: 'none',
                  background: 'var(--accent-gradient)', color: '#fff',
                  fontSize: '0.84rem', fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)'
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Dispatching...</span>
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    <span>Dispatch Alert</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* SMTP Test Email Form */
          <form onSubmit={handleSendTestEmail} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{
              padding: '12px 14px', borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)',
              display: 'flex', alignItems: 'center', gap: '10px'
            }}>
              <Mail size={18} color="#10b981" />
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Sends an HTML validation email through the active SMTP transport to verify mail server credentials and template rendering.
              </div>
            </div>

            <div>
              <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.74rem', fontWeight: 700, marginBottom: '6px' }}>
                Recipient Email Address *
              </label>
              <input
                type="email"
                required
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                placeholder="name@domain.com"
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '10px',
                  background: 'var(--bg-tertiary)', border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '9px 18px', borderRadius: '10px',
                  background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                  color: 'var(--text-secondary)', fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading || !toEmail.trim()}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '9px 22px', borderRadius: '10px', border: 'none',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#fff', fontSize: '0.84rem', fontWeight: 700,
                  cursor: loading ? 'wait' : 'pointer',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Delivering...</span>
                  </>
                ) : (
                  <>
                    <Mail size={15} />
                    <span>Send Test Email</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

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
