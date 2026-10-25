import React from 'react';
import { useTranslation } from '../../../i18n/LanguageContext';
import AnnouncementsTab from '../components/AnnouncementsTab';
import { Megaphone } from 'lucide-react';

export default function CommAnnouncementsPage() {
  const { t } = useTranslation();
  return (
    <div style={{ padding: '28px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Megaphone size={28} color="#f59e0b" />
          {t('communication.tabs.announcements', 'Broadcast Announcements')}
        </h1>
        <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          {t('communication.subtitle', 'Publish and manage tenant-wide or park-wide announcements')}
        </p>
      </div>
      <AnnouncementsTab />
    </div>
  );
}
