import React, { useState, useEffect } from 'react';
import { ShieldAlert, Search, RefreshCw, FileText, Download } from 'lucide-react';
import rbacApi from '../api/rbacApi';
import { useTranslation } from '../../../i18n';

const glassCard = {
  background: 'var(--glass-bg)',
  border: '1px solid rgba(148, 163, 184, 0.12)',
  borderRadius: '18px',
  backdropFilter: 'blur(16px)',
  padding: '24px'
};

export default function RbacAuditLogsTab() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await rbacApi.getRbacAuditLogs();
      if (res.data && res.data.status === 'success') {
        setLogs(res.data.data.logs || res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load RBAC audit trail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (log.EventType && log.EventType.toLowerCase().includes(q)) ||
      (log.ActorUsername && log.ActorUsername.toLowerCase().includes(q)) ||
      (log.TargetEntity && log.TargetEntity.toLowerCase().includes(q)) ||
      (log.Details && log.Details.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Controls */}
      <div style={{ ...glassCard, padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            type="text"
            placeholder={t('rbac.searchAuditPlaceholder', 'Search RBAC audit logs...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%', background: 'var(--bg-tertiary)',
              border: '1px solid rgba(148, 163, 184, 0.15)', borderRadius: '10px',
              padding: '8px 12px 8px 34px', color: '#f1f5f9', fontSize: '13px', outline: 'none', boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={fetchLogs}
            style={{
              background: 'var(--bg-tertiary)', border: '1px solid rgba(148, 163, 184, 0.15)',
              borderRadius: '10px', padding: '9px 14px', color: '#cbd5e1', fontSize: '13px',
              fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> {t('rbac.refreshTrail', 'Refresh Trail')}
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div style={{ ...glassCard, padding: 0, overflowX: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#64748b', padding: '60px' }}>{t('rbac.loadingAudit', 'Loading RBAC Audit Log Trail...')}</div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#64748b', padding: '60px' }}>
            <FileText size={36} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <p>{t('rbac.noAuditRecorded', 'No authorization mutation events recorded yet.')}</p>
          </div>
        ) : (
          <table className="custom-table" style={{ width: '100%', minWidth: '800px' }}>
            <thead>
              <tr>
                <th>{t('rbac.timestamp', 'Timestamp')}</th>
                <th>{t('rbac.eventAction', 'Event Action')}</th>
                <th>{t('rbac.actorAdmin', 'Actor (Admin)')}</th>
                <th>{t('rbac.targetEntity', 'Target Entity')}</th>
                <th>{t('rbac.auditDetails', 'Audit Details')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((l, i) => (
                <tr key={l.AuditLogID || i}>
                  <td style={{ fontSize: '12px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                    {l.CreatedDate ? new Date(l.CreatedDate).toLocaleString() : 'Just now'}
                  </td>
                  <td>
                    <span className="badge badge-info" style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                      {l.EventType || l.Action || 'ROLE_MUTATION'}
                    </span>
                  </td>
                  <td style={{ color: '#818cf8', fontWeight: 600 }}>@{l.ActorUsername || 'system_admin'}</td>
                  <td style={{ color: '#f1f5f9' }}>{l.TargetEntity || l.EntityName || 'Role / User'}</td>
                  <td style={{ color: '#cbd5e1', fontSize: '12.5px' }}>{l.Details || l.Description || 'Permission updated'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
