import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * Reusable Production-Ready Form Field Component
 * Standardized for all module forms across the system:
 * - Highlights label and input border with error color on validation failure
 * - Displays short, precise, descriptive inline error with alert icon
 * - Supports custom icons, required indicators, and helper texts
 */
export const FormField = ({
  label,
  id,
  required = false,
  error = null,
  icon: Icon = null,
  helpText = null,
  hint = null,
  style = {},
  labelStyle = {},
  children
}) => {
  const hasError = Boolean(error);
  const helper = helpText || hint;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', ...style }}>
      {label && (
        <label
          htmlFor={id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.78rem',
            color: 'var(--text-primary)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            ...labelStyle
          }}
        >
          {Icon && (
            <Icon
              size={14}
              color="var(--accent-primary, #a855f7)"
              style={{ flexShrink: 0 }}
            />
          )}
          <span>{label}</span>
          {required && (
            <span
              style={{
                color: 'var(--color-danger, #ef4444)',
                fontSize: '0.9rem',
                lineHeight: 1,
                marginLeft: '2px'
              }}
              title="Required field"
            >
              *
            </span>
          )}
        </label>
      )}

      {/* Render children input/select/textarea */}
      {children}

      {/* Inline Precise Error Feedback */}
      {hasError ? (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--color-danger, #ef4444)',
            fontSize: '0.76rem',
            fontWeight: 600,
            marginTop: '2px',
            lineHeight: 1.3,
            paddingLeft: '2px'
          }}
        >
          <AlertCircle size={13} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      ) : helper ? (
        <span
          style={{
            fontSize: '0.74rem',
            color: 'var(--text-muted, #94a3b8)',
            marginTop: '2px',
            paddingLeft: '2px',
            lineHeight: 1.3
          }}
        >
          {helper}
        </span>
      ) : null}
    </div>
  );
};

export default FormField;
