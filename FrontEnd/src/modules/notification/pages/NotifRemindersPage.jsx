import React, { useState } from 'react';
import { Clock, RefreshCw } from 'lucide-react';
import NotifRemindersTab from '../components/NotifRemindersTab';
import { useTranslation } from '../../../i18n/LanguageContext';

export default function NotifRemindersPage() {
  const { t } = useTranslation();
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
            <Clock size={28} color="#f59e0b" />
            {t('notifications.remindersTab.title', 'Scheduled Task & SLA Reminders')}
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            {t('notifications.remindersTab.subtitle', 'Automated calendar reminders, follow-up deadlines & SLA escalation alerts')}
          </p>
        </div>

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

      <NotifRemindersTab key={refreshKey} />
    </div>
  );
}
