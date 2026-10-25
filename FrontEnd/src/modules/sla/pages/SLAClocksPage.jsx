import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from '../../../i18n/LanguageContext';
import SLADashboardTab from '../components/SLADashboardTab';

export default function SLAClocksPage() {
  const { t } = useTranslation();
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>
          {t('sla.tabs.clocks', 'SLA Dashboard & Live Clocks')}
        </h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          {t('sla.clocksSubtitle', 'Real-time response & resolution SLA timers, countdown clocks, and performance compliance tracking')}
        </p>
      </div>

      <SLADashboardTab />
    </div>
  );
}
