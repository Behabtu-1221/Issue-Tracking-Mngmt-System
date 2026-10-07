import React from 'react';
import CampusProfileTab from '../components/CampusProfileTab';
import { useTranslation } from '../../../i18n';

export default function CampusProfilePage() {
  const { t } = useTranslation();

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
          {t('businessPark.campusProfile')}
        </h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          {t('businessPark.campusProfileSubtitle')}
        </p>
      </div>

      <CampusProfileTab />
    </div>
  );
}
