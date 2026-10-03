import React from 'react';
import CampusProfileTab from '../components/CampusProfileTab';

export default function CampusProfilePage() {
  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
          Park Profile Configuration
        </h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Central Business Park profile, identity, legal TIN, address, and operational parameters
        </p>
      </div>

      <CampusProfileTab />
    </div>
  );
}
