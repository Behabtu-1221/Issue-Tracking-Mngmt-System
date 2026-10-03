import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function FormField({
  label,
  name,
  required = false,
  error,
  helperText,
  children,
  style = {}
}) {
  const errorId = name ? `${name}-error` : undefined;
  const helperId = name ? `${name}-helper` : undefined;
  const describedBy = [error ? errorId : null, helperText ? helperId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', ...style }}>
      {label && (
        <label
          htmlFor={name}
          style={{
            display: 'block',
            fontSize: '0.85rem',
            fontWeight: 700,
            color: 'var(--text-primary)'
          }}
        >
          {label} {required && <span style={{ color: '#ef4444', marginLeft: '2px' }}>*</span>}
        </label>
      )}

      {/* Render child input with injected aria attributes if single element */}
      {React.isValidElement(children)
        ? React.cloneElement(children, {
            id: children.props.id || name,
            name: children.props.name || name,
            'aria-invalid': Boolean(error),
            'aria-describedby': describedBy,
            style: {
              ...(children.props.style || {}),
              border: error ? '1px solid #ef4444' : (children.props.style?.border || '1px solid var(--glass-border)')
            }
          })
        : children}

      {error ? (
        <div
          id={errorId}
          role="alert"
          style={{
            fontSize: '0.8rem',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginTop: '2px',
            fontWeight: 600
          }}
        >
          <AlertCircle size={14} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      ) : helperText ? (
        <div
          id={helperId}
          style={{
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            marginTop: '2px'
          }}
        >
          {helperText}
        </div>
      ) : null}
    </div>
  );
}
