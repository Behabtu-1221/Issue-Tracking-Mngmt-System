import React from 'react';
import LocalizationTab from '../components/LocalizationTab';

export default function ConfigLocalizationPage() {
  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
<h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>Localization & <span className="glow-text">i18n</span></h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Multi-language translation keys, regional date/number formats, and currency rules
</p>
      </div>
      <LocalizationTab />
    </div>
  );
}
