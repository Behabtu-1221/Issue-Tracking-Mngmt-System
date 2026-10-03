import React from 'react';
import AuditLogsTab from '../components/AuditLogsTab';

export default function UserAuditPage() {
  return (
    <div>
    <div style={{ marginBottom: '24px' }}>
{/* Header */}
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>Security Audit Trail & Logs</h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Authentication events, permission changes, password resets, and security compliance audit records
        </p>
      </div>

      <AuditLogsTab />
    </div>
  );
}

