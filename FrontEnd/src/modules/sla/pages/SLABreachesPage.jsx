import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from '../../../i18n/LanguageContext';
import SLABreachMonitoringTab from '../components/SLABreachMonitoringTab';

export default function SLABreachesPage() {
  const { t } = useTranslation();
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>
          {t('sla.tabs.breaches', 'Breach Log & Violations')}
        </h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          {t('sla.breachesSubtitle', 'SLA breach history, response & resolution violations, escalation chain audit trails')}
        </p>
      </div>

      <SLABreachMonitoringTab />
    </div>
  );
}
