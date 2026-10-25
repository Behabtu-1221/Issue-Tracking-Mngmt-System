import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from '../../../i18n/LanguageContext';
import ApprovalRulesGroupsTab from '../components/ApprovalRulesGroupsTab';

export default function ApprovalRulesPage() {
  const { t } = useTranslation();
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>
          {t('approval.rules.title', 'Governance Rules & Chains')}
        </h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          {t('approval.rules.subtitle', 'Configure multi-level approval chains, group memberships, and financial threshold triggers')}
        </p>
      </div>

      <ApprovalRulesGroupsTab />
    </div>
  );
}
