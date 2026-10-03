import React from 'react';
import LeasesTab from '../components/LeasesTab';

export default function TenantLeasesPage() {
  return (
    <div>
{/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
<h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
          Lease Contracts & Portfolio
        </h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Commercial lease agreements, terms, pricing rules, and contract renewals
</p>
      </div>

      <LeasesTab />
    </div>
  );
}
