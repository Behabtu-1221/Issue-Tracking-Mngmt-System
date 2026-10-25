import React from 'react';
import { useTranslation } from '../../../i18n/LanguageContext';
import ServiceCategoryMappingTab from '../components/ServiceCategoryMappingTab';

export default function ServiceCategoryMappingsPage() {
  const { t } = useTranslation();

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>
          {t('catalog.pages.mappingsTitle', 'Category Routing Mappings')}
        </h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          {t('catalog.pages.mappingsDesc', 'Map service categories to responsible departments for automatic ticket routing')}
        </p>
      </div>
      <ServiceCategoryMappingTab />
    </div>
  );
}

