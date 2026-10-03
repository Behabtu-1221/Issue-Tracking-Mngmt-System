import React, { useState } from 'react';
import { X, Bookmark, Check, Shield } from 'lucide-react';
import reportingApi from '../api/reportingApi';

export default function SavedReportModal({
  isOpen,
  onClose,
  activeFilters = {},
  reportType = 'REQUEST_ANALYTICS',
  onSuccess
}) {
  const [reportName, setReportName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('PRIVATE');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!reportName.trim()) {
      setError('Please provide a descriptive report name.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      await reportingApi.createSavedReport({
        ReportName: reportName.trim(),
        Description: description.trim() || null,
        ReportTypeCode: reportType,
        ConfigJson: activeFilters,
        VisibilityCode: visibility
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to save report preset:', err);
      setError(err.response?.data?.message || 'Failed to save report. Please check required fields.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.7)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '520px',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
        border: '1px solid var(--glass-border, rgba(148, 163, 184, 0.2))'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(148, 163, 184, 0.15)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(59, 130, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#3b82f6'
            }}>
              <Bookmark size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Save Report Preset</h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Store current filter parameters for instant 1-click execution
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="btn-icon" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', fontSize: '0.82rem' }}>
              {error}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
              Report Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Monthly SLA Risk Watch"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              className="form-control"
              style={{ width: '100%', padding: '8px 12px', fontSize: '0.88rem', borderRadius: '8px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
              Description
            </label>
            <textarea
              rows={2}
              placeholder="Brief description of the metrics and purpose..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-control"
              style={{ width: '100%', padding: '8px 12px', fontSize: '0.85rem', borderRadius: '8px', resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
              Sharing & Visibility Scope
            </label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="form-control"
              style={{ width: '100%', padding: '8px 12px', fontSize: '0.85rem', borderRadius: '8px' }}
            >
              <option value="PRIVATE">Private (Only You)</option>
              <option value="TEAM">My Team Members</option>
              <option value="DEPARTMENT">My Entire Department</option>
              <option value="COMPANY">Company-Wide (Tenant)</option>
              <option value="BUSINESS_PARK">Business Park Global</option>
            </select>
          </div>

          {/* Active Filter Summary Box */}
          <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', fontSize: '0.78rem' }}>
            <div style={{ fontWeight: 700, color: '#3b82f6', marginBottom: '4px' }}>Captured Filter Snapshot:</div>
            <div style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>
              Timeframe: {activeFilters.dateRange || '30D'} | Priority: {activeFilters.priority || 'ALL'} | Status: {activeFilters.status || 'ALL'}
            </div>
          </div>

          {/* Modal Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={onClose} disabled={saving} className="btn btn-outline" style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem' }}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 20px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700 }}>
              {saving ? 'Saving...' : 'Save Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
