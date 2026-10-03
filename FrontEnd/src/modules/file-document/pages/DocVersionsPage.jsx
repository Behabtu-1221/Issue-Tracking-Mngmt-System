import React from 'react';
import DocumentVersionsTab from '../components/DocumentVersionsTab';

export default function DocVersionsPage() {
  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
<h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>Version Control & Revision History</h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Track document revisions, author change notes, and download historical file versions
</p>
      </div>

      <DocumentVersionsTab />
    </div>
  );
}
