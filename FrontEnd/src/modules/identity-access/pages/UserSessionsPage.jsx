import React from 'react';
import { useTranslation } from '../../../i18n';
import ActiveSessionsTab from '../components/ActiveSessionsTab';

export default function UserSessionsPage() {
  const { t } = useTranslation();

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>
          {t('identity.sessionsTitle')}
        </h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          {t('identity.sessionsSubtitle')}
        </p>
      </div>

      <ActiveSessionsTab />
    </div>
  );
}
