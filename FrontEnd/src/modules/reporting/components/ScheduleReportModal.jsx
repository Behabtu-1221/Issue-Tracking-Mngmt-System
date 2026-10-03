import React, { useState } from 'react';
import { X, Calendar, Clock, Mail, Check } from 'lucide-react';
import reportingApi from '../api/reportingApi';

export default function ScheduleReportModal({
  isOpen,
  onClose,
  savedReports = [],
  onSuccess
}) {
  const [scheduleName, setScheduleName] = useState('');
  const [reportType, setReportType] = useState('EXECUTIVE_SUMMARY');
  const [savedReportId, setSavedReportId] = useState('');
  const [frequency, setFrequency] = useState('WEEKLY');
  const [format, setFormat] = useState('CSV');
  const [recipients, setRecipients] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!scheduleName.trim()) {
      setError('Please provide a schedule name.');
      return;
    }

    const emailList = recipients
      .split(',')
      .map((e) => e.trim())
      .filter((e) => e.length > 0);

    if (emailList.length === 0) {
      setError('Please enter at least one recipient email address.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      await reportingApi.createReportSchedule({
        ScheduleName: scheduleName.trim(),
        ReportTypeCode: reportType,
        SavedReportID: savedReportId ? Number(savedReportId) : null,
        FrequencyCode: frequency,
        ExportFormat: format,
        RecipientsJson: emailList,
        Status: 'ACTIVE'
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to create report schedule:', err);
      setError(err.response?.data?.message || 'Failed to create schedule. Please verify inputs.');
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
        maxWidth: '540px',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
        border: '1px solid var(--glass-border, rgba(148, 163, 184, 0.2))'
      }}>
        {/* Header */}
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
              background: 'rgba(168, 85, 247, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#a855f7'
            }}>
              <Calendar size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Schedule Automated Report</h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Configure recurring email deliveries to key stakeholders
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="btn-icon" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', fontSize: '0.82rem' }}>
              {error}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
              Schedule Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Weekly Management Operational Summary"
              value={scheduleName}
              onChange={(e) => setScheduleName(e.target.value)}
              className="form-control"
              style={{ width: '100%', padding: '8px 12px', fontSize: '0.88rem', borderRadius: '8px' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                Report Domain
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="form-control"
                style={{ width: '100%', padding: '8px 12px', fontSize: '0.85rem', borderRadius: '8px' }}
              >
                <option value="EXECUTIVE_SUMMARY">Executive Overview</option>
                <option value="REQUEST_ANALYTICS">Issue & Request Analytics</option>
                <option value="WORKLOAD_ANALYTICS">Technician Workload</option>
                <option value="SLA_ANALYTICS">SLA & Breach Watch</option>
                <option value="TENANT_ANALYTICS">Tenant Benchmarks</option>
                <option value="DEPARTMENT_ANALYTICS">Department Efficiency</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                Delivery Frequency
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="form-control"
                style={{ width: '100%', padding: '8px 12px', fontSize: '0.85rem', borderRadius: '8px' }}
              >
                <option value="DAILY">Daily (Every Morning 08:00)</option>
                <option value="WEEKLY">Weekly (Every Monday 08:00)</option>
                <option value="MONTHLY">Monthly (1st of every month)</option>
                <option value="QUARTERLY">Quarterly</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                Saved Report Template
              </label>
              <select
                value={savedReportId}
                onChange={(e) => setSavedReportId(e.target.value)}
                className="form-control"
                style={{ width: '100%', padding: '8px 12px', fontSize: '0.85rem', borderRadius: '8px' }}
              >
                <option value="">Default Parameters</option>
                {savedReports.map((r) => (
                  <option key={r.SavedReportID} value={r.SavedReportID}>{r.ReportName}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                Export Format
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="form-control"
                style={{ width: '100%', padding: '8px 12px', fontSize: '0.85rem', borderRadius: '8px' }}
              >
                <option value="CSV">CSV Spreadsheet (.csv)</option>
                <option value="EXCEL">Microsoft Excel (.xls)</option>
                <option value="PDF">Print / PDF Summary</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
              Recipient Emails (Comma separated) *
            </label>
            <input
              type="text"
              required
              placeholder="manager@businesspark.com, operations@businesspark.com"
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              className="form-control"
              style={{ width: '100%', padding: '8px 12px', fontSize: '0.88rem', borderRadius: '8px' }}
            />
          </div>

          {/* Modal Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={onClose} disabled={saving} className="btn btn-outline" style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem' }}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 20px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700 }}>
              {saving ? 'Scheduling...' : 'Create Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
