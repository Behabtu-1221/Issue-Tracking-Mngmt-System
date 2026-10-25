import React from 'react';
import TeamsPositionsTab from '../components/TeamsPositionsTab';
import { useTranslation } from '../../../i18n';

export default function OrgTeamsPage() {
  const { t } = useTranslation();

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          {t('organization.teamsSubtitle', 'Functional operational teams, team leaders, job position titles, grade levels, and responsibilities')}
        </p>
      </div>

      <TeamsPositionsTab />
    </div>
  );
}
