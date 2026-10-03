import React from 'react';
import LookupsTab from '../components/LookupsTab';

export default function ConfigLookupsPage() {
  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
<h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>Master Lookups & <span className="glow-text">Dictionaries</span></h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          System-wide code lists, dropdown dictionaries, and custom reference data tables
</p>
      </div>
      <LookupsTab />
    </div>
  );
}
