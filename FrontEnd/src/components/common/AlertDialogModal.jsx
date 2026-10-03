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
          bannerBg: 'linear-gradient(135deg, rgba(229, 72, 77, 0.14) 0%, rgba(185, 28, 28, 0.05) 100%)',
          bannerBorder: 'rgba(229, 72, 77, 0.3)',
          badgeBorder: 'rgba(229, 72, 77, 0.4)',
          iconColor: '#E5484D',
          msgBg: 'rgba(229, 72, 77, 0.1)',
          msgBorder: 'rgba(229, 72, 77, 0.25)',
          msgColor: '#fca5a5',
          btnBg: 'linear-gradient(135deg, #E5484D 0%, #c73e43 100%)',
          btnShadow: '0 4px 18px rgba(229, 72, 77, 0.35)',
          btnBorder: '1px solid rgba(254, 202, 202, 0.3)',
          accentColor: '#E5484D'
        };
      case 'success':
        return {
          icon: CustomIcon || CheckCircle2,
          bannerBg: 'linear-gradient(135deg, rgba(47, 191, 113, 0.14) 0%, rgba(4, 120, 87, 0.05) 100%)',
          bannerBorder: 'rgba(47, 191, 113, 0.3)',
          badgeBorder: 'rgba(47, 191, 113, 0.4)',
          iconColor: '#2FBF71',
          msgBg: 'rgba(47, 191, 113, 0.1)',
          msgBorder: 'rgba(47, 191, 113, 0.25)',
          msgColor: '#7ae2ab',
          btnBg: 'linear-gradient(135deg, #2FBF71 0%, #239b5b 100%)',
          btnShadow: '0 4px 18px rgba(47, 191, 113, 0.35)',
          btnBorder: '1px solid rgba(167, 243, 208, 0.3)',
          accentColor: '#2FBF71'
        };
      case 'warning':
        return {
          icon: CustomIcon || AlertTriangle,
          bannerBg: 'linear-gradient(135deg, rgba(242, 176, 30, 0.14) 0%, rgba(180, 83, 9, 0.05) 100%)',
          bannerBorder: 'rgba(242, 176, 30, 0.3)',
          badgeBorder: 'rgba(242, 176, 30, 0.4)',
          iconColor: '#F2B01E',
          msgBg: 'rgba(242, 176, 30, 0.1)',
          msgBorder: 'rgba(242, 176, 30, 0.25)',
          msgColor: '#fde047',
          btnBg: 'linear-gradient(135deg, #F2B01E 0%, #d89912 100%)',
          btnShadow: '0 4px 18px rgba(242, 176, 30, 0.35)',
          btnBorder: '1px solid rgba(253, 230, 138, 0.3)',
          accentColor: '#F2B01E'
        };
      default:
        return {
          icon: CustomIcon || Info,
          bannerBg: 'linear-gradient(135deg, rgba(56, 163, 255, 0.14) 0%, rgba(47, 129, 247, 0.05) 100%)',
          bannerBorder: 'rgba(56, 163, 255, 0.3)',
          badgeBorder: 'rgba(56, 163, 255, 0.4)',
          iconColor: '#38A3FF',
          msgBg: 'rgba(56, 163, 255, 0.1)',
          msgBorder: 'rgba(56, 163, 255, 0.25)',
          msgColor: '#a8dbff',
          btnBg: 'linear-gradient(135deg, #2F81F7 0%, #1f6feb 100%)',
          btnShadow: '0 4px 18px rgba(47, 129, 247, 0.35)',
          btnBorder: '1px solid rgba(199, 210, 254, 0.3)',
          accentColor: '#2F81F7'
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
        background: 'var(--modal-backdrop, rgba(16, 20, 24, 0.78))',
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
          background: 'var(--color-elevated, #20262D)',
          borderRadius: '24px',
          border: '1px solid var(--color-border, #303841)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.45)',
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
