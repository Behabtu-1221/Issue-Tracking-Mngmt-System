import React from 'react';
import FloorsTab from '../components/FloorsTab';
import { useTranslation } from '../../../i18n';

export default function FloorsLevelPage() {
  const { t } = useTranslation();

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
          {t('businessPark.floorsLevels')}
        </h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          {t('businessPark.floorsSubtitle')}
        </p>
      </div>

      <FloorsTab />
    </div>
  );
}
