import React from 'react';
import FinancialsTab from '../components/FinancialsTab';
import { useTranslation } from '../../../i18n/LanguageContext';

export default function OrgFinancialsPage() {
  const { t } = useTranslation();

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          {t('organization.financialsSubtitle', 'Financial cost centers, department budget codes, GL accounts, and operational expenditure tracking')}
        </p>
      </div>

      <FinancialsTab />
    </div>
  );
}
