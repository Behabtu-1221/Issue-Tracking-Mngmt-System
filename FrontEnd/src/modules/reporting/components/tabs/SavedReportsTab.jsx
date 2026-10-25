import React from 'react';
import { Bookmark, Play, Trash2, Globe, Building2, User, Plus, Clock } from 'lucide-react';
import reportingApi from '../../api/reportingApi';
import { ActionButton, ActionGroup } from '../../../../components/common/ActionButton';

export default function SavedReportsTab({
  savedReports = [],
  loading,
  onRunReport,
  onOpenCreateModal,
  onRefresh
}) {
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete saved report '${name}'?`)) return;
    try {
      await reportingApi.deleteSavedReport(id);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to delete report:', err);
      alert('Failed to delete saved report');
    }
  };

  const getVisibilityIcon = (code) => {
    switch (code) {
      case 'BUSINESS_PARK':
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 700, background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}><Globe size={11} /> Global Park</span>;
      case 'COMPANY':
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 700, background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}><Building2 size={11} /> Company</span>;
      default:
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 700, background: 'rgba(148, 163, 184, 0.15)', color: '#64748b' }}><User size={11} /> Private</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Saved Report Presets & Query Library</h3>
          <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Reusable customized filter views and cross-module telemetry definitions
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCreateModal}
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700 }}
        >
          <Plus size={15} /> Save Active Query
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading saved reports...</div>
      ) : savedReports.length === 0 ? (
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', borderRadius: '16px' }}>
          <Bookmark size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 700 }}>No Saved Reports Yet</h4>
          <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Configure your filters on any analytics tab and click "Save Current Preset" to store it here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {savedReports.map((r) => (
            <div
              key={r.SavedReportID}
              className="glass-panel"
              style={{
                padding: '20px',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderLeft: '4px solid var(--accent-primary, #3b82f6)',
                transition: 'all 0.2s ease'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {r.ReportName}
                  </h4>
                  {getVisibilityIcon(r.VisibilityCode)}
                </div>

                <p style={{ margin: '0 0 14px', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  {r.Description || 'Custom reporting definition'}
                </p>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                  <Clock size={12} /> Created: {new Date(r.CreatedDate).toLocaleDateString()} by {r.CreatorName || 'User'}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid rgba(148, 163, 184, 0.15)' }}>
                  <button
                    type="button"
                    onClick={() => onRunReport(r)}
                    className="btn btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700 }}
                  >
                    <Play size={13} fill="#ffffff" /> Run Report
                  </button>

                  <ActionButton
                    variant="delete"
                    onClick={() => handleDelete(r.SavedReportID, r.ReportName)}
                    title="Delete Saved Report"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
