import React from 'react';
import DocumentRepositoryTab from '../components/DocumentRepositoryTab';

export default function DocRepositoryPage() {
  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
<h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>Central Document Repository</h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Upload, search, preview, stream download, and manage document attachments across enterprise records
</p>
      </div>

      <DocumentRepositoryTab />
    </div>
  );
}
