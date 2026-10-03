import React from 'react';
import DocumentCategoriesTab from '../components/DocumentCategoriesTab';

export default function DocCategoriesPage() {
  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
<h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>Document Categories & Taxonomy</h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Organize documents into structured taxonomy categories, icons, and classification standards
</p>
      </div>

      <DocumentCategoriesTab />
    </div>
  );
}
