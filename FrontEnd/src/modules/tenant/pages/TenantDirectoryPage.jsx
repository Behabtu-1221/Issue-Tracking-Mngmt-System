import React from 'react';
import TenantsTab from '../components/TenantsTab';

export default function TenantDirectoryPage() {
  return (
    <div>
{/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
<h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
          Tenants Directory & Onboarding
        </h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Commercial tenant companies, corporate registration details, and onboarding lifecycle
</p>
      </div>

      <TenantsTab />
    </div>
  );
}
