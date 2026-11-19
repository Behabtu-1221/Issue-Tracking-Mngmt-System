import React from 'react';
import TeamsPositionsTab from '../components/TeamsPositionsTab';
import DepartmentManagerWorkforceView from '../components/DepartmentManagerWorkforceView';
import { useAuthContext } from '../../authentication/contexts/AuthContext';
import { usePermissionContext } from '../../role-permission-management/contexts/PermissionContext';
import { useTranslation } from '../../../i18n';

export default function OrgTeamsPage() {
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const { isParkAdmin, isCompanyAdmin } = usePermissionContext();

  const activeRoleCode = (user?.roles && user.roles.length > 0)
    ? (typeof user.roles[0] === 'string' ? user.roles[0] : user.roles[0].RoleCode || user.roles[0].code)
    : user?.userTypeCode;

  const isManager = !isParkAdmin && !isCompanyAdmin && (
    activeRoleCode === 'DEPARTMENT_MANAGER' || activeRoleCode === 'MANAGER' || activeRoleCode === 'DISPATCHER'
  );

  if (isManager) {
    return <DepartmentManagerWorkforceView initialTab="teams" />;
  }

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
