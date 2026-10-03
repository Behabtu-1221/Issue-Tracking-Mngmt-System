import React, { useState } from 'react';
import { Inbox, Send, RefreshCw, Sparkles } from 'lucide-react';
import NotifInboxTab from '../components/NotifInboxTab';
import SendNotificationModal from '../components/SendNotificationModal';
import { useAuth } from '../../authentication/contexts/AuthContext';

export default function NotifInboxPage() {
  const { user } = useAuth();
  const userRole = (user?.role || user?.RoleName || '').toUpperCase();
  const isStaff = ['SUPER_ADMIN', 'PARK_ADMIN', 'DEPARTMENT_MANAGER', 'TECHNICIAN', 'STAFF', 'ADMIN'].some(r => userRole.includes(r)) || !userRole;

  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div style={{ padding: '24px 28px', maxWidth: '1600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{
            fontSize: '1.85rem', fontWeight: 800, margin: 0,
            color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px'
          }}>
            <Inbox size={28} color="#6366f1" />
            User Inbox & Notification Alerts
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Personal alert feed, ticket progress notifications, work orders & action requests
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isStaff && (
            <button
              onClick={() => setShowDispatchModal(true)}
              style={{
                background: 'var(--accent-gradient)',
                border: 'none',
                borderRadius: '12px',
                padding: '9px 18px',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
                transition: 'all 0.2s'
              }}
            >
              <Send size={15} />
              <span>Dispatch / Test Alert</span>
            </button>
          )}

          <button
            onClick={() => setRefreshKey(prev => prev + 1)}
            style={{
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: '12px',
              padding: '9px 16px',
              color: 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backdropFilter: 'blur(12px)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Tab View */}
      <NotifInboxTab key={refreshKey} />

      {/* Dispatch Modal */}
      <SendNotificationModal
        isOpen={showDispatchModal}
        onClose={() => setShowDispatchModal(false)}
        onSuccess={() => setRefreshKey(prev => prev + 1)}
      />
    </div>
  );
}
