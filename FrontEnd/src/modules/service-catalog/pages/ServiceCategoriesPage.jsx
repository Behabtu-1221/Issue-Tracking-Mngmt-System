import React from 'react';
import ServiceCategoriesTab from '../components/ServiceCategoriesTab';

export default function ServiceCategoriesPage() {
  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
<h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>Service Categories & Taxonomy</h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Organize services into logical categories and hierarchical taxonomy structures
</p>
      </div>
      <ServiceCategoriesTab />
    </div>
  );
}
