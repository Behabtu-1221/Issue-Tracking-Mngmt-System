import React from 'react';
import EmployeeAssignmentsTab from '../components/EmployeeAssignmentsTab';
import { useTranslation } from '../../../i18n/LanguageContext';

export default function OrgAssignmentsPage() {
  const { t } = useTranslation();

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          {t('organization.assignmentsSubtitle', 'Staff member position placements, primary/secondary department roles, and manager reporting lines')}
        </p>
      </div>

      <EmployeeAssignmentsTab />
    </div>
  );
}
