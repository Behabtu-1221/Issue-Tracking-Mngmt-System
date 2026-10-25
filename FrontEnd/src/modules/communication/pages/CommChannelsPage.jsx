import React from 'react';
import { useTranslation } from '../../../i18n/LanguageContext';
import TeamDiscussionsTab from '../components/TeamDiscussionsTab';
import { Users } from 'lucide-react';

export default function CommChannelsPage() {
  const { t } = useTranslation();
  return (
    <div style={{ padding: '28px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Users size={28} color="#38bdf8" />
          {t('communication.tabs.discussions', 'Team Channels')}
        </h1>
        <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          {t('communication.subtitle', 'Inter-departmental collaboration and team discussion spaces')}
        </p>
      </div>
      <TeamDiscussionsTab />
    </div>
  );
}
