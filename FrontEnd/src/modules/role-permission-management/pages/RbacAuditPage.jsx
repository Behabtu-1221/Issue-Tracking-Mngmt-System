import React from 'react';
import { FileText } from 'lucide-react';
import RbacAuditLogsTab from '../components/RbacAuditLogsTab';
import { useTranslation } from '../../../i18n';

export default function RbacAuditPage() {
  const { t } = useTranslation();

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            {t('rbac.tabAuditTrail', 'Security Audit Trail')}
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            {t('rbac.governanceSubtitle', 'Role change logs, permission mutation history, and governance security traces')}
          </p>
        </div>
      </div>

      {/* Audit Log View */}
      <RbacAuditLogsTab />
    </div>
  );
}
