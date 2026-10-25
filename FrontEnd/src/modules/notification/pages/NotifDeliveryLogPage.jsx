import React, { useState } from 'react';
import { History, Send, RefreshCw } from 'lucide-react';
import NotifDeliveryLogTab from '../components/NotifDeliveryLogTab';
import SendNotificationModal from '../components/SendNotificationModal';
import { useAuth } from '../../authentication/contexts/AuthContext';
import { useTranslation } from '../../../i18n/LanguageContext';

export default function NotifDeliveryLogPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
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
            <History size={28} color="#8b5cf6" />
            {t('notifications.deliveryLogTab.title', 'Delivery Audit Log & SMTP Trace')}
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            {t('notifications.deliveryLogTab.subtitle', 'Historical log of dispatched emails, transmission latency, delivery status & error tracebacks')}
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
              <span>{t('notifications.sendNotifBtn', 'Dispatch / Test Email')}</span>
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
            <span>{t('common.refresh', 'Refresh')}</span>
          </button>
        </div>
      </div>

      {/* Main Tab View */}
      <NotifDeliveryLogTab key={refreshKey} />

      {/* Dispatch Modal */}
      <SendNotificationModal
        isOpen={showDispatchModal}
        onClose={() => setShowDispatchModal(false)}
        onSuccess={() => setRefreshKey(prev => prev + 1)}
      />
    </div>
  );
}
