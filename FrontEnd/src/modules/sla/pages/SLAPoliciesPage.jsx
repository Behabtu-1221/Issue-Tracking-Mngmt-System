import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from '../../../i18n/LanguageContext';
import SLAPoliciesTab from '../components/SLAPoliciesTab';

export default function SLAPoliciesPage() {
  const { t } = useTranslation();
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>
          {t('sla.tabs.policies', 'SLA Policies & Targets')}
        </h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          {t('sla.policiesSubtitle', 'Configure response & resolution time targets, escalation chains, and compliance thresholds')}
        </p>
      </div>

      <SLAPoliciesTab />
    </div>
  );
}
