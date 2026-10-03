import React from 'react';
import SystemSettingsTab from '../components/SystemSettingsTab';

export default function ConfigSettingsPage() {
  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
<h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>System Settings & <span className="glow-text">Parameters</span></h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Global system parameters, security policies, timeout thresholds, and platform-wide defaults
</p>
      </div>
      <SystemSettingsTab />
    </div>
  );
}
