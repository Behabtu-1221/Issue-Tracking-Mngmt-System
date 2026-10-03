import React from 'react';
import AllocationsTab from '../components/AllocationsTab';

export default function TenantAllocationsPage() {
  return (
    <div>
{/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
<h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
          Office Space Allocations
        </h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Leased office space assignments, unit allocations, and occupancy mappings
</p>
      </div>

      <AllocationsTab />
    </div>
  );
}
