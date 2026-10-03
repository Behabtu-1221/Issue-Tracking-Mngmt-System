import React from 'react';
import { Sliders } from 'lucide-react';
import NotifPreferencesTab from '../components/NotifPreferencesTab';

export default function NotifPreferencesPage() {
  return (
    <div style={{ padding: '28px', maxWidth: '1600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{
          fontSize: '1.85rem', fontWeight: 800, margin: 0,
          color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px'
        }}>
          <Sliders size={28} color="#6366f1" />
          Alert & Delivery Preferences
        </h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Personalize which event types dispatch in-app notifications versus real-time email alerts
        </p>
      </div>

      <NotifPreferencesTab />
    </div>
  );
}
