import React from 'react';
import { useTranslation } from '../../../i18n';
import { ChevronRight } from 'lucide-react';
import TechnicianWorkbenchTab from '../components/TechnicianWorkbenchTab';

export default function DispatchWorkbenchPage() {
  const { t } = useTranslation();

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          {t('dispatch.workbenchPageSubtitle')}
        </p>
      </div>

      <TechnicianWorkbenchTab />
    </div>
  );
}
