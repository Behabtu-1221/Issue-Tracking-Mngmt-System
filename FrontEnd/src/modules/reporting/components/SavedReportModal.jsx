import React, { useState } from 'react';
import { Bookmark } from 'lucide-react';
import reportingApi from '../api/reportingApi';
import { ModalCard } from '../../../components/common/ModalCard';
import { FormField } from '../../../components/common/FormField';

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
    <ModalCard
      isOpen={isOpen}
      onClose={onClose}
      title="Save Report Preset"
      subtitle="Store current filter parameters for instant 1-click execution"
      icon={Bookmark}
      accentStrip="brand"
      maxWidth="520px"
      onSubmit={handleSave}
      submitting={saving}
      submitText="Save Report"
      cancelText="Cancel"
      error={error}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <FormField
          label="Report Name"
          required
          hint="Descriptive name for quick recognition"
        >
          <input
            type="text"
            required
            placeholder="e.g. Monthly SLA Risk Watch"
            value={reportName}
            onChange={(e) => setReportName(e.target.value)}
            className="form-control"
          />
        </FormField>

        <FormField
          label="Description"
          hint="Brief explanation of the metrics and purpose"
        >
          <textarea
            rows={2}
            placeholder="Brief description of the metrics and purpose..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="form-control"
          />
        </FormField>

        <FormField
          label="Sharing & Visibility Scope"
          hint="Controls who can view and run this report template"
        >
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            className="form-control"
          >
            <option value="PRIVATE">Private (Only You)</option>
            <option value="TEAM">My Team Members</option>
            <option value="DEPARTMENT">My Entire Department</option>
            <option value="COMPANY">Company-Wide (Tenant)</option>
            <option value="BUSINESS_PARK">Business Park Global</option>
          </select>
        </FormField>

        {/* Active Filter Summary Box */}
        <div style={{
          padding: '12px 14px',
          borderRadius: '10px',
          background: 'rgba(37, 99, 235, 0.06)',
          border: '1px solid rgba(37, 99, 235, 0.2)',
          fontSize: '0.8rem'
        }}>
          <div style={{ fontWeight: 700, color: 'var(--brand-primary, #2563eb)', marginBottom: '4px' }}>
            Captured Filter Snapshot:
          </div>
          <div style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>
            Timeframe: {activeFilters.dateRange || '30D'} | Priority: {activeFilters.priority || 'ALL'} | Status: {activeFilters.status || 'ALL'}
          </div>
        </div>
      </div>
    </ModalCard>
  );
}
