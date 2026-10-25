import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

/**
 * Enterprise FormCard Component
 * In-page clean surface form container with:
 * - Attractive multi-tone top gradient strip
 * - Subtle border & soft shadow
 * - Standardized typography hierarchy & icon container
 * - Consistent section spacing & form action footers
 */
export const FormCard = ({
  title,
  subtitle,
  icon: Icon = null,
  accentStrip = 'brand', // 'brand' | 'primary' | 'purple' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'none'
  onSubmit,
  submitting = false,
  submitText = 'Save Changes',
  cancelText,
  onCancel,
  submitVariant = 'primary', // 'primary' | 'danger'
  error = null,
  headerAction = null,
  children,
  footer,
  className = '',
  style = {},
  bodyStyle = {}
}) => {
  const accentClass = accentStrip === 'none'
    ? 'no-accent-strip'
    : `accent-strip-${accentStrip}`;

  const renderContent = () => (
    <>
      {/* Form Card Header (if title or Icon provided) */}
      {(title || Icon || headerAction) && (
        <div className="form-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            {Icon && (
              <div className="form-header-icon">
                {React.isValidElement(Icon) ? Icon : <Icon size={20} />}
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              {title && <h3 className="form-header-title">{title}</h3>}
              {subtitle && <p className="form-header-subtitle">{subtitle}</p>}
            </div>
          </div>

          {headerAction && (
            <div>{headerAction}</div>
          )}
        </div>
      )}

      {/* Form Card Body */}
      <div className="form-card-body" style={bodyStyle}>
        {error && (
          <div
            role="alert"
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: 'var(--color-danger, #ef4444)',
              fontSize: '0.84rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}
        {children}
      </div>

      {/* Form Card Footer */}
      {footer !== null && (
        footer ? (
          footer
        ) : (onSubmit || onCancel) ? (
          <div className="form-card-footer">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={submitting}
                className="btn btn-secondary"
              >
                {cancelText || 'Cancel'}
              </button>
            )}
            {onSubmit && (
              <button
                type="submit"
                disabled={submitting}
                className={`btn ${submitVariant === 'danger' ? 'btn-danger-solid' : 'btn-primary'}`}
              >
                {submitting && <RefreshCw size={14} className="animate-spin" />}
                <span>{submitText}</span>
              </button>
            )}
          </div>
        ) : null
      )}
    </>
  );

  if (onSubmit) {
    return (
      <form
        onSubmit={onSubmit}
        className={`form-card ${accentClass} ${className}`}
        style={style}
      >
        {renderContent()}
      </form>
    );
  }

  return (
    <div className={`form-card ${accentClass} ${className}`} style={style}>
      {renderContent()}
    </div>
  );
};

export default FormCard;
