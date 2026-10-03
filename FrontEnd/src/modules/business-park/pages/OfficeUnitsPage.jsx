import React from 'react';
import OfficeSpacesTab from '../components/OfficeSpacesTab';

export default function OfficeUnitsPage() {
  return (
    <div>
{/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
<h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
          Office Units
        </h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Office inventory, area dimensions, and leasing availability
</p>
      </div>

      <OfficeSpacesTab />
    </div>
  );
}
