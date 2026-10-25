import React, { useEffect, useRef } from 'react';
import { X, AlertCircle, RefreshCw } from 'lucide-react';

/**
 * Enterprise ModalCard Component (WCAG 2.2 AA Compliant)
 * 
 * Standardized dialog container providing:
 * - Refined 18px corner radius (var(--border-radius-lg))
 * - Multi-layer diffused shadow (var(--shadow-lg))
 * - Subtle border and clean neutral surface
 * - Attractive multi-tone top gradient accent strip
 * - Pinned header with restrained icon container and accessible close button
 * - Scrollable body with responsive padding
 * - Pinned footer with primary/secondary action hierarchy
 * - Complete keyboard navigation, focus trap, Escape key handling & focus restoration
 */
export const ModalCard = ({
  isOpen = true,
  onClose,
  title,
  subtitle,
  category = null,
  icon: Icon = null,
  accentStrip = 'brand', // 'brand' | 'primary' | 'purple' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'none'
  maxWidth = '580px',
  onSubmit,
  submitting = false,
  submitText = 'Save Changes',
  cancelText = 'Cancel',
  submitVariant = 'primary', // 'primary' | 'danger'
  error = null,
  children,
  footer,
  className = '',
  style = {},
  overlayStyle = {},
  bodyStyle = {}
}) => {
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);
  const prevActiveElement = useRef(null);

  // Focus management: Trap focus inside modal & restore on close
  useEffect(() => {
    if (!isOpen) return;

    prevActiveElement.current = document.activeElement;

    const modalElement = modalRef.current;
    if (!modalElement) return;

    const focusTimer = setTimeout(() => {
      if (closeButtonRef.current) {
        closeButtonRef.current.focus();
      } else {
        modalElement.focus();
      }
    }, 50);

    const focusableSelectors = [
      'button:not([disabled])',
      '[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ');

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose && !submitting) {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        const focusable = modalElement.querySelectorAll(focusableSelectors);
        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first || document.activeElement === modalElement) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      if (prevActiveElement.current && typeof prevActiveElement.current.focus === 'function') {
        try {
          prevActiveElement.current.focus();
        } catch {
          // ignore
        }
      }
    };
  }, [isOpen, onClose, submitting]);

  if (!isOpen) return null;

  const accentClass = accentStrip === 'none'
    ? 'no-accent-strip'
    : `accent-strip-${accentStrip}`;

  const renderContent = () => (
    <>
      {/* ── Pinned Modal Header ── */}
      <div
        className="modal-card-header"
        style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--color-border-subtle, var(--glass-border))',
          background: 'var(--color-elevated, var(--bg-tertiary))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          {Icon && (
            <div
              className="form-header-icon"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
              aria-hidden="true"
            >
              {React.isValidElement(Icon) ? Icon : <Icon size={18} />}
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            {category && (
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: 'var(--color-primary, #2563eb)',
                  display: 'block',
                  marginBottom: '2px'
                }}
              >
                {category}
              </span>
            )}
            <h2
              id="modal-card-title"
              className="form-header-title"
              style={{
                margin: 0,
                fontSize: '1.05rem',
                fontWeight: 700,
                color: 'var(--color-text, var(--text-primary))'
              }}
            >
              {title}
            </h2>
            {subtitle && (
              <p
                className="form-header-subtitle"
                style={{
                  margin: '2px 0 0',
                  fontSize: '0.78rem',
                  color: 'var(--color-text-muted, #64748b)'
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {onClose && (
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="action-btn action-btn-neutral touch-target-sm focus-visible-ring"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-muted, #64748b)',
              background: 'transparent',
              border: 'none',
              cursor: submitting ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Close (Esc)"
            aria-label="Close dialog"
          >
            <X size={18} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* ── Scrollable Modal Body ── */}
      <div
        className="modal-card-body"
        style={{
          padding: '20px clamp(16px, 3vw, 24px)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          overflowY: 'auto',
          flex: 1,
          ...bodyStyle
        }}
      >
        {error && (
          <div
            role="alert"
            style={{
              padding: '12px 14px',
              borderRadius: '8px',
              background: 'var(--color-error-bg, rgba(239, 68, 68, 0.1))',
              border: '1px solid var(--color-error-border, rgba(239, 68, 68, 0.25))',
              color: 'var(--color-error, #b91c1c)',
              fontSize: '0.84rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}
        {children}
      </div>

      {/* ── Pinned Modal Footer ── */}
      {footer !== null && (
        footer ? (
          footer
        ) : (
          <div
            className="modal-card-footer"
            style={{
              padding: '14px 20px',
              borderTop: '1px solid var(--color-border-subtle, var(--glass-border))',
              background: 'var(--color-elevated, var(--bg-tertiary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              flexWrap: 'wrap',
              gap: '10px',
              flexShrink: 0
            }}
          >
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="btn btn-secondary touch-target-sm focus-visible-ring"
                style={{
                  fontSize: '0.84rem',
                  padding: '9px 16px',
                  borderRadius: '8px',
                  fontWeight: 600
                }}
              >
                {cancelText}
              </button>
            )}
            {onSubmit && (
              <button
                type="submit"
                disabled={submitting}
                className={`btn ${submitVariant === 'danger' ? 'btn-danger-solid' : 'btn-primary'} touch-target-sm focus-visible-ring`}
                style={{
                  fontSize: '0.84rem',
                  padding: '9px 18px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {submitting && <RefreshCw size={14} className="animate-spin" aria-hidden="true" />}
                <span>{submitText}</span>
              </button>
            )}
          </div>
        )
      )}
    </>
  );

  return (
    <div
      className="modal-overlay"
      onClick={onClose ? () => { if (!submitting) onClose(); } : undefined}
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--modal-backdrop, rgba(15, 23, 42, 0.72))',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(10px, 3vw, 24px)',
        overflowY: 'auto',
        ...overlayStyle
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-card-title"
        tabIndex={-1}
        className={`modal-card ${accentClass} ${className}`}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 'var(--border-radius-lg, 18px)',
          border: '1px solid var(--color-border-subtle, var(--glass-border))',
          background: 'var(--color-surface, var(--bg-secondary))',
          boxShadow: 'var(--shadow-lg, 0 20px 40px -10px rgba(0, 0, 0, 0.35))',
          overflow: 'hidden',
          outline: 'none',
          ...style
        }}
      >
        {onSubmit ? (
          <form
            onSubmit={onSubmit}
            style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              maxHeight: '92vh',
              overflow: 'hidden'
            }}
          >
            {renderContent()}
          </form>
        ) : (
          renderContent()
        )}
      </div>
    </div>
  );
};

export default ModalCard;
