import React, { useState } from 'react';
import { Calendar, Clock, Play, Trash2, CheckCircle2, AlertCircle, Plus, Mail, FileText, Send } from 'lucide-react';
import reportingApi from '../../api/reportingApi';
import ReportDataTable from '../ReportDataTable';
import { ActionButton } from '../../../../components/common/ActionButton';

export default function SchedulesTab({
  schedules = [],
  executions = [],
  loading,
  onOpenCreateModal,
  onRefresh
}) {
  const [triggeringId, setTriggeringId] = useState(null);

  const handleTrigger = async (id, name) => {
    try {
      setTriggeringId(id);
      const res = await reportingApi.triggerReportSchedule(id);
      alert(res.data?.message || `Schedule '${name}' triggered successfully.`);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to trigger schedule:', err);
      alert('Failed to trigger report schedule execution.');
    } finally {
      setTriggeringId(null);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove schedule '${name}'?`)) return;
    try {
      await reportingApi.deleteReportSchedule(id);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to delete schedule:', err);
      alert('Failed to delete schedule.');
    }
  };

  const executionColumns = [
    {
      key: 'ReportName',
      label: 'Report Name',
      sortable: true,
      render: (val) => <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{val}</span>
    },
    { key: 'ReportTypeCode', label: 'Domain', sortable: true },
    {
      key: 'TriggerType',
      label: 'Trigger Mode',
      sortable: true,
      render: (val) => (
        <span style={{ padding: '2px 8px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 700, background: val === 'SCHEDULED_TRIGGER' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(59, 130, 246, 0.15)', color: val === 'SCHEDULED_TRIGGER' ? '#a855f7' : '#3b82f6' }}>
          {val}
        </span>
      )
    },
    { key: 'ExportFormat', label: 'Format', sortable: true },
    {
      key: 'RowCount',
      label: 'Rows Processed',
      sortable: true,
      render: (val) => `${val || 0} rows`
    },
    {
      key: 'DurationMs',
      label: 'Duration',
      sortable: true,
      render: (val) => `${val || 0} ms`
    },
    {
      key: 'StatusCode',
      label: 'Status',
      sortable: true,
      render: (val) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 700, background: val === 'SUCCESS' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: val === 'SUCCESS' ? '#10b981' : '#ef4444' }}>
          {val === 'SUCCESS' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
          {val}
        </span>
      )
    },
    { key: 'ExecutedByName', label: 'Triggered By', sortable: true },
    {
      key: 'ExecutionStartDateTime',
      label: 'Executed Timestamp',
      sortable: true,
      render: (val) => val ? new Date(val).toLocaleString() : '—'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Automated Report Schedules</h3>
          <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Recurring background export generation and automated stakeholder delivery
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCreateModal}
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700 }}
        >
          <Plus size={15} /> Create Schedule
        </button>
      </div>

      {/* Schedules Grid */}
      {loading ? (
        <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading active schedules...</div>
      ) : schedules.length === 0 ? (
        <div className="glass-panel" style={{ padding: '36px', textAlign: 'center', borderRadius: '16px' }}>
          <Clock size={32} color="var(--text-muted)" style={{ margin: '0 auto 8px', opacity: 0.5 }} />
          <h4 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 700 }}>No Recurring Schedules Configured</h4>
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Create automated schedules to receive weekly or monthly reports directly via email.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {schedules.map((s) => {
            const isTriggering = triggeringId === s.ReportScheduleID;
            let recipients;
            try {
              recipients = typeof s.RecipientsJson === 'string' ? JSON.parse(s.RecipientsJson) : (s.RecipientsJson || []);
            } catch { recipients = []; }

            return (
              <div
                key={s.ReportScheduleID}
                className="glass-panel"
                style={{
                  padding: '20px',
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderTop: '3px solid #a855f7'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>{s.ScheduleName}</h4>
                    <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 800, background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>
                      {s.FrequencyCode}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                    Domain: <strong style={{ color: 'var(--text-primary)' }}>{s.ReportTypeCode}</strong> ({s.ExportFormat})
                  </div>

                  {recipients.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                      <Mail size={13} color="#3b82f6" />
                      <span>{recipients.join(', ')}</span>
                    </div>
                  )}
                </div>

                <div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '12px', borderTop: '1px solid rgba(148, 163, 184, 0.15)', paddingTop: '10px' }}>
                    Last run: {s.LastRunDateTime ? new Date(s.LastRunDateTime).toLocaleString() : 'Never triggered'}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => handleTrigger(s.ReportScheduleID, s.ScheduleName)}
                      disabled={isTriggering}
                      className="btn btn-outline"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600 }}
                    >
                      <Send size={12} /> {isTriggering ? 'Executing...' : 'Trigger Now'}
                    </button>

                    <ActionButton
                      variant="delete"
                      onClick={() => handleDelete(s.ReportScheduleID, s.ScheduleName)}
                      title="Remove Schedule"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Execution History Table */}
      <ReportDataTable
        title="Automated & Export Execution Log"
        columns={executionColumns}
        data={executions}
        reportType="GENERAL"
        loading={loading}
        showExport={false}
      />
    </div>
  );
}
