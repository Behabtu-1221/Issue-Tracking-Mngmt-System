import React, { useState, useEffect } from 'react';
import serviceCatalogApi from '../api/serviceCatalogApi';
import ServiceGovernanceTab from '../components/ServiceGovernanceTab';

export default function ServiceGovernancePage() {
  const [services, setServices] = useState([]);
  useEffect(() => {
    serviceCatalogApi.getServices().then(r => setServices(r.data?.data?.services || [])).catch(() => {});
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
<h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>Governance & Routing Rules</h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Approval workflows, multi-level governance chains, auto-assignment rules, and routing configurations
</p>
      </div>
      <ServiceGovernanceTab services={services} />
    </div>
  );
}
