import React from 'react';
import LeasesTab from '../components/LeasesTab';
import { useTranslation } from '../../../i18n';

export default function TenantLeasesPage() {
  const { t } = useTranslation();

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
          {t('tenant.leases')}
        </h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          {t('tenant.leasesSubtitle')}
        </p>
      </div>

      <LeasesTab />
    </div>
  );
}
