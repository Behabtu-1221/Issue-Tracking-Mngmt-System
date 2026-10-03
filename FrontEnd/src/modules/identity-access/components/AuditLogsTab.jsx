import React, { useState } from 'react';
import { FileText, Search, Shield, Filter, Calendar } from 'lucide-react';

export default function AuditLogsTab() {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Sample initial security events log viewer
  const [logs] = useState([
    { id: 1, event: 'USER_LOGIN_SUCCESS', user: 'admin@platform.com', ip: '127.0.0.1', timestamp: '2026-07-22 14:10:02', status: 'SUCCESS', details: 'User authenticated with JWT access token' },
    { id: 2, event: 'ROLE_PERMISSIONS_UPDATED', user: 'admin@platform.com', ip: '127.0.0.1', timestamp: '2026-07-22 13:45:19', status: 'SUCCESS', details: 'Synced 14 module permissions to COMPLIANCE_OFFICER role' },
    { id: 3, event: 'USER_STATUS_CHANGED', user: 'admin@platform.com', ip: '127.0.0.1', timestamp: '2026-07-22 12:30:44', status: 'SUCCESS', details: 'Transitioned user #104 status to SUSPENDED' },
    { id: 4, event: 'USER_REGISTERED', user: 'system', ip: '127.0.0.1', timestamp: '2026-07-22 10:15:00', status: 'SUCCESS', details: 'Atomic registration created account for john.doe@example.com' },
  ]);

  const filteredLogs = logs.filter(l => 
    l.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
    <div style={{ marginBottom: '24px' }}>
{/* Header */}
        <div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>Security & Audit Trail</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Immutable security log of user authentications, role updates, and account status transitions.
          </p>
        </div>

        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search audit trail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 16px 10px 42px',
              borderRadius: 'var(--border-radius-sm)',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-primary)',
              fontSize: '0.88rem'
            }}
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="glass-panel" style={{ padding: '24px', overflowX: 'auto' }}>
        <table className="custom-table" style={{ width: '100%', minWidth: '950px' }}>
          <thead>
            <tr>
              <th>Event Type</th>
              <th>Triggered By</th>
              <th>IP Address</th>
              <th>Details / Payload</th>
              <th>Timestamp</th>
              <th>Outcome</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => (
              <tr key={log.id}>
                <td>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: '600' }}>
                    {log.event}
                  </span>
                </td>
                <td style={{ fontSize: '0.85rem' }}>{log.user}</td>
                <td style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{log.ip}</td>
                <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{log.details}</td>
                <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{log.timestamp}</td>
                <td>
                  <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>{log.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
