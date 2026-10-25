import React from 'react';
import { useTranslation } from '../../../i18n/LanguageContext';
import ActivityTimelineTab from '../components/ActivityTimelineTab';
import { Activity } from 'lucide-react';

export default function CommTimelinePage() {
  const { t } = useTranslation();
  return (
    <div style={{ padding: '28px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Activity size={28} color="#4ade80" />
          {t('communication.tabs.timeline', 'Activity & Audit Log')}
        </h1>
        <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          {t('communication.subtitle', 'Comprehensive timeline of all communication events, status changes, and system activities')}
        </p>
      </div>
      <ActivityTimelineTab />
    </div>
  );
}
