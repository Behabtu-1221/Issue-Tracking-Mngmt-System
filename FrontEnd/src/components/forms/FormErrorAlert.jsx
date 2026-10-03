import React from 'react';
import { AlertCircle, ShieldAlert, X } from 'lucide-react';

export default function FormErrorAlert({
  title = 'Please correct the following errors',
  error,
  errors = [],
  onClose
}) {
  const errorList = Array.isArray(errors) ? errors : (error ? [error] : []);

  if (!error && errorList.length === 0) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        padding: '14px 18px',
        borderRadius: '12px',
        background: 'rgba(239, 68, 68, 0.12)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        color: '#f87171',
        fontSize: '0.88rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        position: 'relative'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
          <ShieldAlert size={18} />
          <span>{title}</span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#f87171',
              cursor: 'pointer',
              padding: '2px'
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {errorList.length === 1 ? (
        <div style={{ color: 'var(--text-primary)', opacity: 0.9 }}>
          {errorList[0]}
        </div>
      ) : (
        <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {errorList.map((err, idx) => (
            <li key={idx} style={{ color: 'var(--text-primary)', opacity: 0.9 }}>
              {typeof err === 'object' ? (err.message || err.msg || JSON.stringify(err)) : err}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
