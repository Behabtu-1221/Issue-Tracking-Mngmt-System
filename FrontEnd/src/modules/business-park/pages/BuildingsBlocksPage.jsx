import React from 'react';
import BuildingsTab from '../components/BuildingsTab';

export default function BuildingsBlocksPage() {
  return (
    <div>
{/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
<h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
          Buildings & Blocks
        </h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Commercial buildings, structural towers, and block management
</p>
      </div>

      <BuildingsTab />
    </div>
  );
}
