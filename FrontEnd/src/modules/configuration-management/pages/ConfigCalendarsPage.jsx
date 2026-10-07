import React from 'react';
import { useTranslation } from '../../../i18n';
import CalendarsTab from '../components/CalendarsTab';

export default function ConfigCalendarsPage() {
  const { t } = useTranslation();

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>
          {t('config.calendarsPageTitle')}
        </h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          {t('config.calendarsPageSubtitle')}
        </p>
      </div>
      <CalendarsTab />
    </div>
  );
}
