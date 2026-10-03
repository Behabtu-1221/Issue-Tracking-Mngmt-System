import React from 'react';
import FeatureFlagsTab from '../components/FeatureFlagsTab';

export default function ConfigFlagsPage() {
  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
<h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>Feature Toggles & <span className="glow-text">Flags</span></h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Canary deployments, feature toggles, dynamic module activation, and runtime switches
</p>
      </div>
      <FeatureFlagsTab />
    </div>
  );
}
