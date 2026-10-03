import React, { useState, useEffect } from 'react';
import serviceCatalogApi from '../api/serviceCatalogApi';
import ServiceRequirementsTab from '../components/ServiceRequirementsTab';

export default function ServiceRequirementsPage() {
  const [services, setServices] = useState([]);
  useEffect(() => {
    serviceCatalogApi.getServices().then(r => setServices(r.data?.data?.services || [])).catch(() => {});
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
<h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>Form & File Requirements</h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Dynamic form fields, mandatory file attachments, and request submission requirements per service
</p>
      </div>
      <ServiceRequirementsTab services={services} />
    </div>
  );
}
