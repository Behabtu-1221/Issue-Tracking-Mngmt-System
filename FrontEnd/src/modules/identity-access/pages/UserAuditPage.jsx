import React from 'react';
import { useTranslation } from '../../../i18n';
import AuditLogsTab from '../components/AuditLogsTab';

export default function UserAuditPage() {
  const { t } = useTranslation();

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        {/* Header */}
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>
          {t('identity.auditTrailTitle')}
        </h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          {t('identity.auditTrailSubtitle')}
        </p>
      </div>

      <AuditLogsTab />
    </div>
  );
}

