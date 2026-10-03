import React from 'react';
import SubTenantsTab from '../components/SubTenantsTab';

export default function TenantSubTenantsPage() {
  return (
    <div>
{/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
<h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
          Sub-Tenants Hierarchy
        </h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Parent tenant corporate relationships, sub-leases, and branch office hierarchies
</p>
      </div>

      <SubTenantsTab />
    </div>
  );
}
