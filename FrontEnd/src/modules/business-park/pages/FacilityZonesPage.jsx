import React from 'react';
import FacilityZonesTab from '../components/FacilityZonesTab';

export default function FacilityZonesPage() {
  return (
    <div>
{/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
<h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
          Facility Zones
        </h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Green parks, parking lots, utility rooms, and security posts
</p>
      </div>

      <FacilityZonesTab />
    </div>
  );
}
