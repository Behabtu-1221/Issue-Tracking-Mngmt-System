import React from 'react';
import TechAssignedRequestsPage from './TechAssignedRequestsPage';
import { useTranslation } from '../../../i18n';

export default function TechWorkHistoryPage() {
  const { t } = useTranslation();
  return (
    <TechAssignedRequestsPage
      defaultStatus="COMPLETED"
      customTitle={t('technician.workHistoryTitle', 'Work History & Completed Tasks')}
    />
  );
}
