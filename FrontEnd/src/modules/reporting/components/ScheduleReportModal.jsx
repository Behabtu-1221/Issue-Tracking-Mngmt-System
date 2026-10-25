import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import reportingApi from '../api/reportingApi';
import { ModalCard } from '../../../components/common/ModalCard';
import { FormField } from '../../../components/common/FormField';

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
    <ModalCard
      isOpen={isOpen}
      onClose={onClose}
      title="Schedule Automated Report"
      subtitle="Configure recurring email deliveries to key stakeholders"
      icon={Calendar}
      accentStrip="purple"
      maxWidth="540px"
      onSubmit={handleSubmit}
      submitting={saving}
      submitText="Create Schedule"
      cancelText="Cancel"
      error={error}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <FormField
          label="Schedule Name"
          required
          hint="Descriptive name for this recurring scheduled job"
        >
          <input
            type="text"
            required
            placeholder="e.g. Weekly Management Operational Summary"
            value={scheduleName}
            onChange={(e) => setScheduleName(e.target.value)}
            className="form-control"
          />
        </FormField>

        <div className="form-grid-2">
          <FormField label="Report Domain">
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="form-control"
            >
              <option value="EXECUTIVE_SUMMARY">Executive Overview</option>
              <option value="REQUEST_ANALYTICS">Issue & Request Analytics</option>
              <option value="WORKLOAD_ANALYTICS">Technician Workload</option>
              <option value="SLA_ANALYTICS">SLA & Breach Watch</option>
              <option value="TENANT_ANALYTICS">Tenant Benchmarks</option>
              <option value="DEPARTMENT_ANALYTICS">Department Efficiency</option>
            </select>
          </FormField>

          <FormField label="Delivery Frequency">
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="form-control"
            >
              <option value="DAILY">Daily (Every Morning 08:00)</option>
              <option value="WEEKLY">Weekly (Every Monday 08:00)</option>
              <option value="MONTHLY">Monthly (1st of every month)</option>
              <option value="QUARTERLY">Quarterly</option>
            </select>
          </FormField>
        </div>

        <div className="form-grid-2">
          <FormField label="Saved Report Template">
            <select
              value={savedReportId}
              onChange={(e) => setSavedReportId(e.target.value)}
              className="form-control"
            >
              <option value="">Default Parameters</option>
              {savedReports.map((r) => (
                <option key={r.SavedReportID} value={r.SavedReportID}>{r.ReportName}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Export Format">
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="form-control"
            >
              <option value="CSV">CSV Spreadsheet (.csv)</option>
              <option value="EXCEL">Microsoft Excel (.xls)</option>
              <option value="PDF">Print / PDF Summary</option>
            </select>
          </FormField>
        </div>

        <FormField
          label="Recipient Emails (Comma separated)"
          required
          hint="One or more valid email addresses"
        >
          <input
            type="text"
            required
            placeholder="manager@businesspark.com, operations@businesspark.com"
            value={recipients}
            onChange={(e) => setRecipients(e.target.value)}
            className="form-control"
          />
        </FormField>
      </div>
    </ModalCard>
  );
}
