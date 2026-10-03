import React from 'react';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';

export default function AccessDeniedPage({ requiredPermission, onBack }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      padding: '40px 20px'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '520px',
        width: '100%',
        padding: '40px',
        textAlign: 'center',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
        animation: 'fadeIn 0.3s ease-out'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#ef4444',
          margin: '0 auto 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <ShieldAlert size={32} />
        </div>

        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          color: 'var(--text-primary)',
          margin: '0 0 10px 0'
        }}>
          403 — Access Denied
        </h2>

        <p style={{
          color: 'var(--text-muted)',
          fontSize: '0.9rem',
          lineHeight: '1.6',
          marginBottom: '20px'
        }}>
          You do not have the required security authority or granular permission to access this enterprise module.
        </p>

        {requiredPermission && (
          <div style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--border-radius-sm)',
            padding: '10px 14px',
            marginBottom: '24px',
            fontSize: '0.8rem',
            color: 'var(--text-muted)'
          }}>
            Missing Required Permission Code:{' '}
            <code style={{ color: '#ef4444', fontWeight: '700' }}>
              {requiredPermission}
            </code>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: 'var(--border-radius-sm)',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--glass-border)',
                color: 'white',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '0.88rem'
              }}
            >
              <ArrowLeft size={16} /> Return to Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
