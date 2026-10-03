import React from 'react';
import { Send, Bell, Mail, Clock } from 'lucide-react';

export default function NotifMetricsHeader({ metrics, activeTab, onTabChange }) {
  const totalSent = metrics?.totalSent || 0;
  const unreadInApp = metrics?.unreadInApp || 0;
  const emailsDelivered = metrics?.emailsDelivered || 0;
  const pendingReminders = metrics?.pendingReminders || 0;

  const cards = [
    {
      id: 'inbox',
      title: 'Unread In-App Alerts',
      value: unreadInApp,
      subtext: 'Requires user attention',
      icon: Bell,
      color: '#ef4444',
      bgGlow: 'rgba(239, 68, 68, 0.18)',
      gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      isPulse: unreadInApp > 0
    },
    {
      id: 'log',
      title: 'Emails Delivered',
      value: emailsDelivered,
      subtext: 'Real SMTP email deliveries',
      icon: Mail,
      color: '#10b981',
      bgGlow: 'rgba(16, 185, 129, 0.18)',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
    },
    {
      id: 'reminders',
      title: 'Active Reminders',
      value: pendingReminders,
      subtext: 'Scheduled automated reminders',
      icon: Clock,
      color: '#f59e0b',
      bgGlow: 'rgba(245, 158, 11, 0.18)',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
    },
    {
      id: 'templates',
      title: 'Total Dispatched',
      value: totalSent,
      subtext: 'Master notifications sent',
      icon: Send,
      color: '#6366f1',
      bgGlow: 'rgba(99, 102, 241, 0.18)',
      gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
    }
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
      gap: '18px',
      marginBottom: '28px'
    }}>
      {cards.map((c) => {
        const Icon = c.icon;
        const isSelected = activeTab === c.id;

        return (
          <div
            key={c.id}
            onClick={() => onTabChange && onTabChange(c.id)}
            style={{
              background: isSelected
                ? 'var(--glass-bg)'
                : 'var(--glass-bg)',
              border: isSelected ? `2px solid ${c.color}` : '1px solid rgba(148, 163, 184, 0.12)',
              borderRadius: '18px',
              padding: '22px',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: isSelected
                ? `0 12px 28px ${c.bgGlow}, inset 0 1px 1px rgba(255, 255, 255, 0.1)`
                : '0 2px 8px rgba(0, 0, 0, 0.2)',
              backdropFilter: 'blur(16px)',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = `0 8px 20px ${c.bgGlow}`;
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
              }
            }}
          >
            {/* Background glow orb */}
            <div style={{
              position: 'absolute',
              top: '-30%',
              right: '-20%',
              width: '140px',
              height: '140px',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${c.bgGlow} 0%, transparent 70%)`,
              pointerEvents: 'none'
            }} />

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
              <div>
                <p style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  color: c.color,
                  marginBottom: '8px',
                  opacity: 0.9
                }}>{c.title}</p>
                <p style={{
                  fontSize: '32px',
                  fontWeight: 800,
                  color: '#f1f5f9',
                  lineHeight: 1,
                  marginBottom: '6px'
                }}>{c.value}</p>
                <p style={{
                  fontSize: '11px',
                  color: 'rgba(148, 163, 184, 0.7)',
                  fontWeight: 500
                }}>{c.subtext}</p>
              </div>

              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: c.gradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 14px ${c.bgGlow}`
              }}>
                <Icon size={22} color="#fff" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
