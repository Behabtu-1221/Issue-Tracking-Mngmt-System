import React, { useEffect } from 'react';
import { ShieldAlert, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export default function AlertDialogModal({
  isOpen,
  title,
  message,
  type = 'error',
  buttonText = 'Understand & Dismiss',
  onClose,
  icon: CustomIcon
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape' || e.key === 'Enter') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'error':
        return {
          icon: CustomIcon || ShieldAlert,
          bannerBg: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(185, 28, 28, 0.05) 100%)',
          bannerBorder: 'rgba(239, 68, 68, 0.25)',
          badgeBorder: 'rgba(239, 68, 68, 0.4)',
          iconColor: '#f87171',
          msgBg: 'rgba(239, 68, 68, 0.08)',
          msgBorder: 'rgba(239, 68, 68, 0.2)',
          msgColor: '#fca5a5',
          btnBg: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          btnShadow: '0 4px 18px rgba(239, 68, 68, 0.35)',
          btnBorder: '1px solid rgba(254, 202, 202, 0.3)',
          accentColor: '#f87171'
        };
      case 'success':
        return {
          icon: CustomIcon || CheckCircle2,
          bannerBg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(4, 120, 87, 0.05) 100%)',
          bannerBorder: 'rgba(16, 185, 129, 0.25)',
          badgeBorder: 'rgba(16, 185, 129, 0.4)',
          iconColor: '#34d399',
          msgBg: 'rgba(16, 185, 129, 0.08)',
          msgBorder: 'rgba(16, 185, 129, 0.2)',
          msgColor: '#6ee7b7',
          btnBg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          btnShadow: '0 4px 18px rgba(16, 185, 129, 0.35)',
          btnBorder: '1px solid rgba(167, 243, 208, 0.3)',
          accentColor: '#34d399'
        };
      case 'warning':
        return {
          icon: CustomIcon || AlertTriangle,
          bannerBg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(180, 83, 9, 0.05) 100%)',
          bannerBorder: 'rgba(245, 158, 11, 0.25)',
          badgeBorder: 'rgba(245, 158, 11, 0.4)',
          iconColor: '#fbbf24',
          msgBg: 'rgba(245, 158, 11, 0.08)',
          msgBorder: 'rgba(245, 158, 11, 0.2)',
          msgColor: '#fde047',
          btnBg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          btnShadow: '0 4px 18px rgba(245, 158, 11, 0.35)',
          btnBorder: '1px solid rgba(253, 230, 138, 0.3)',
          accentColor: '#fbbf24'
        };
      default:
        return {
          icon: CustomIcon || Info,
          bannerBg: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(59, 130, 246, 0.05) 100%)',
          bannerBorder: 'rgba(99, 102, 241, 0.25)',
          badgeBorder: 'rgba(99, 102, 241, 0.4)',
          iconColor: '#818cf8',
          msgBg: 'rgba(99, 102, 241, 0.08)',
          msgBorder: 'rgba(99, 102, 241, 0.2)',
          msgColor: '#c7d2fe',
          btnBg: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          btnShadow: '0 4px 18px rgba(99, 102, 241, 0.35)',
          btnBorder: '1px solid rgba(199, 210, 254, 0.3)',
          accentColor: '#818cf8'
        };
    }
  };

  const style = getTypeStyles();
  const IconComponent = style.icon;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        zIndex: 10001,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '480px',
          background: 'var(--bg-secondary, #1e293b)',
          borderRadius: '24px',
          border: '1px solid var(--glass-border-accent, rgba(255, 255, 255, 0.12))',
          boxShadow: '0 32px 72px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Top Graphical Illustration Header */}
        <div
          style={{
            height: '130px',
            background: style.bannerBg,
            borderBottom: `1px solid ${style.bannerBorder}`,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}
        >
          {/* Vector Background Graphic */}
          <svg
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.15 }}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 400 120"
            preserveAspectRatio="none"
          >
            <circle cx="60" cy="30" r="70" fill="currentColor" color={style.accentColor} />
            <circle cx="340" cy="90" r="85" fill="currentColor" color={style.accentColor} />
            <path d="M-10,80 Q120,20 220,90 T410,30" stroke="currentColor" color={style.accentColor} strokeWidth="3" fill="none" />
          </svg>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            style={{
              position: 'absolute',
              right: '16px',
              top: '16px',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: 'var(--text-muted, #94a3b8)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            title="Close"
          >
            <X size={16} />
          </button>

          {/* Central Hero Icon Badge */}
          <div
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '20px',
              background: 'var(--bg-secondary, #1e293b)',
              border: `2px solid ${style.badgeBorder}`,
              boxShadow: `0 8px 24px rgba(0, 0, 0, 0.4)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: style.iconColor,
              transform: 'translateY(10px)'
            }}
          >
            <IconComponent size={34} />
          </div>
        </div>

        {/* Modal Body & Content */}
        <div style={{ padding: '28px 28px 24px', textAlign: 'center' }}>
          <h3
            style={{
              margin: '0 0 12px',
              fontSize: '1.25rem',
              fontWeight: 800,
              color: 'var(--text-primary, #f8fafc)',
              letterSpacing: '-0.01em'
            }}
          >
            {title}
          </h3>

          <div
            style={{
              margin: '0 0 24px',
              fontSize: '0.88rem',
              color: style.msgColor,
              lineHeight: 1.6,
              padding: '14px 18px',
              borderRadius: '16px',
              background: style.msgBg,
              border: `1px solid ${style.msgBorder}`,
              textAlign: 'left'
            }}
          >
            {message}
          </div>

          {/* Action Footer with Pill Button */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
              paddingTop: '16px',
              borderTop: '1px solid var(--glass-border, rgba(255, 255, 255, 0.08))'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-muted)', marginRight: 'auto' }}>
              <Info size={14} />
              <span>System Notification</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 26px',
                borderRadius: '9999px',
                background: style.btnBg,
                border: style.btnBorder,
                color: '#ffffff',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '0.88rem',
                boxShadow: style.btnShadow,
                transition: 'all 0.2s ease'
              }}
            >
              {buttonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
