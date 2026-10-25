import React from 'react';
import DepartmentsUnitsTab from '../components/DepartmentsUnitsTab';
import { useTranslation } from '../../../i18n/LanguageContext';

export default function OrgDepartmentsPage() {
  const { t } = useTranslation();

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          {t('organization.departmentsSubtitle', 'Department divisions, head of department assignments, business unit codes, and functional areas')}
        </p>
      </div>

      <DepartmentsUnitsTab />
    </div>
  );
}
