import React from 'react';
import KnownIssuesTab from '../components/KnownIssuesTab';
import { useTranslation } from '../../../i18n';

export default function IssueKnownPage() {
  const { t } = useTranslation();

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          {t('knownIssues.subtitle', 'Recurring problems, standard workarounds, and verified resolution articles')}
        </p>
      </div>

      <KnownIssuesTab />
    </div>
  );
}
