import React, { useState, useEffect } from 'react';
import { Monitor, RefreshCw, LogOut, ShieldAlert, CheckCircle2, Cpu } from 'lucide-react';
import identityApi from '../api/identityApi';
import ConfirmDialogModal from '../../../components/common/ConfirmDialogModal';
import AlertDialogModal from '../../../components/common/AlertDialogModal';

export default function ActiveSessionsTab() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Glass Dialog Modals State
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'error' });

  const showAlert = (title, message, type = 'error') => {
    setAlertConfig({ isOpen: true, title, message, type });
  };

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await identityApi.getMySessions();
      if (res.data && res.data.status === 'success') {
        const raw = res.data.data.sessions || res.data.data || [];
        setSessions(Array.isArray(raw) ? raw : []);
      }
    } catch (err) {
      console.error('Failed to load active sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevokeSession = (sessionId) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Revoke Active Session',
      message: 'Are you sure you want to terminate this active login session across your devices?',
      type: 'warning',
      confirmText: 'Revoke Session',
      onConfirm: async () => {
        try {
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          await identityApi.revokeMySession(sessionId);
          fetchSessions();
        } catch (err) {
          showAlert('Session Revocation Failed', 'Failed to revoke active session.', 'error');
        }
      }
    });
  };

  return (
    <div>
      {/* Header */}
    <div style={{ marginBottom: '24px' }}>
{/* Header */}
        <div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>Active Authentication Sessions</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Monitor active login sessions across devices and terminate unauthorized connections.
          </p>
        </div>

        <button
          onClick={fetchSessions}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            borderRadius: 'var(--border-radius-sm)',
            background: 'var(--bg-tertiary)',
            color: 'white',
            border: '1px solid var(--glass-border)',
            cursor: 'pointer',
            fontSize: '0.88rem'
          }}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh Sessions
        </button>
      </div>

      {/* Sessions List */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <RefreshCw className="animate-spin" size={28} style={{ marginBottom: '12px' }} />
            <p>Scanning active session state...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <Monitor size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <p>No active sessions detected.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table className="custom-table" style={{ width: '100%', minWidth: '850px' }}>
            <thead>
              <tr>
                <th>Device / Browser</th>
                <th>IP Address</th>
                <th>Login Timestamp</th>
                <th>Session Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session, idx) => (
                <tr key={session.SessionID || idx}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Monitor size={20} color="var(--accent-primary)" />
                      <div>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                          {session.UserAgent || 'Chrome Web Session'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          ID: #{session.SessionID || 'CURRENT'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'monospace' }}>{session.IpAddress || '127.0.0.1'}</td>
                  <td style={{ fontSize: '0.85rem' }}>
                    {session.CreatedDate ? new Date(session.CreatedDate).toLocaleString() : 'Just now'}
                  </td>
                  <td>
                    <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                      <CheckCircle2 size={12} style={{ marginRight: '4px' }} /> ACTIVE
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => handleRevokeSession(session.SessionID)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: 'var(--border-radius-sm)',
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: 'var(--color-danger)',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: '600'
                      }}
                    >
                      <LogOut size={14} /> Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Shared Glass Modals */}
      <ConfirmDialogModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        confirmText={confirmConfig.confirmText}
        onConfirm={confirmConfig.onConfirm}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />

      <AlertDialogModal
        isOpen={alertConfig.isOpen}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
