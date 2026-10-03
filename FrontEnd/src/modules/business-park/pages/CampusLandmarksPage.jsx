import React from 'react';
import CampusLocationsTab from '../components/CampusLocationsTab';

export default function CampusLandmarksPage() {
  return (
    <div>
{/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
<h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
          Campus Landmarks
        </h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Physical campus location hierarchy, waypoints, and landmarks
</p>
      </div>

      <CampusLocationsTab />
    </div>
  );
}
