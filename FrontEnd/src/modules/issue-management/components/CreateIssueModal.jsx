import React, { useState, useEffect, useRef } from 'react';
import {
  X, Plus, AlertTriangle, Paperclip, FileText, Trash2,
  Shield, Clock, Sparkles, Layers, User, Tag
} from 'lucide-react';
import issueManagementApi from '../api/issueManagementApi';
import fileDocumentApi from '../../file-document/api/fileDocumentApi';
import serviceCatalogApi from '../../service-catalog/api/serviceCatalogApi';
import { usePermissionContext } from '../../role-permission-management/contexts/PermissionContext';
import { requestSchemas } from '../../../validation';
import { FormField } from '../../../components/common/FormField';

export const CreateIssueModal = ({ isOpen, onClose, onCreated, services: propServices = [] }) => {
  const { user } = usePermissionContext();
  const [servicesList, setServicesList] = useState([]);
  const [selectedServiceMeta, setSelectedServiceMeta] = useState(null);

  const [form, setForm] = useState({
    ServiceID: '',
    Title: '',
    Description: '',
    RequestTypeCode: 'INCIDENT',
    PriorityCode: 'MEDIUM',
    CategoryCode: '',
    RequesterUserID: user?.UserID || user?.userId || 1,
    TenantID: user?.TenantID || user?.tenantId || '',
    AssignedDepartmentID: user?.DepartmentID || user?.departmentId || '',
    BuildingID: '',
    OfficeSpaceID: '',
    IsMajorIncident: 0,
    EstimatedCost: 0
  });

  const [attachedFiles, setAttachedFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (propServices && propServices.length > 0) {
        setServicesList(propServices);
      } else {
        serviceCatalogApi.getServices()
          .then(res => setServicesList(res.data?.data?.services || res.data?.data || []))
          .catch(() => {});
      }

      setForm({
        ServiceID: '',
        Title: '',
        Description: '',
        RequestTypeCode: 'INCIDENT',
        PriorityCode: 'MEDIUM',
        CategoryCode: '',
        RequesterUserID: user?.UserID || user?.userId || 1,
        TenantID: user?.TenantID || user?.tenantId || '',
        AssignedDepartmentID: user?.DepartmentID || user?.departmentId || '',
        BuildingID: '',
        OfficeSpaceID: '',
        IsMajorIncident: 0,
        EstimatedCost: 0
      });
      setAttachedFiles([]);
      setSelectedServiceMeta(null);
      setFieldErrors({});
      setServerError(null);
    }
  }, [isOpen, propServices, user]);

  const handleFieldChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: null }));
    }
    if (serverError) {
      setServerError(null);
    }
  };

  const handleServiceSelect = (serviceId) => {
    const sId = Number(serviceId);
    handleFieldChange('ServiceID', serviceId);
    const found = servicesList.find(s => Number(s.ServiceID) === sId);
    if (found) {
      setSelectedServiceMeta(found);
      if (found.EstimatedCost) {
        setForm(prev => ({
          ...prev,
          EstimatedCost: found.EstimatedCost,
          CategoryCode: found.CategoryCode || prev.CategoryCode
        }));
      }
    } else {
      setSelectedServiceMeta(null);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setAttachedFiles((prev) => [...prev, ...files]);
    if (fieldErrors.Attachments) {
      setFieldErrors(prev => ({ ...prev, Attachments: null }));
    }
  };

  const handleRemoveFile = (index) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

    const validation = requestSchemas.createIssueRequest(
      {
        Title: form.Title,
        Description: form.Description,
        ServiceID: form.ServiceID,
        PriorityCode: form.PriorityCode,
        RequestTypeCode: form.RequestTypeCode,
        RequesterUserID: form.RequesterUserID,
        CategoryCode: form.CategoryCode,
        TenantID: form.TenantID,
        BuildingID: form.BuildingID,
        OfficeSpaceID: form.OfficeSpaceID,
        AssignedDepartmentID: form.AssignedDepartmentID,
        IsMajorIncident: form.IsMajorIncident,
        EstimatedCost: form.EstimatedCost
      },
      attachedFiles
    );

    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        Title: validation.sanitized.Title,
        Description: validation.sanitized.Description,
        PriorityCode: validation.sanitized.PriorityCode,
        RequestTypeCode: validation.sanitized.RequestTypeCode
      };
      if (!payload.BuildingID) delete payload.BuildingID;
      if (!payload.OfficeSpaceID) delete payload.OfficeSpaceID;
      if (!payload.CategoryCode) delete payload.CategoryCode;
      payload.ServiceID = Number(payload.ServiceID);
      payload.RequesterUserID = Number(payload.RequesterUserID);
      payload.IsMajorIncident = payload.IsMajorIncident ? 1 : 0;

      // 1. Submit Issue Request to Backend
      const res = await issueManagementApi.createIssue(payload);
      const createdData = res.data?.data || {};
      const newIssueId = createdData.IssueRequestID || createdData.id || createdData;

      // 2. Upload and link attached documents to File & Document Management module
      if (attachedFiles.length > 0 && newIssueId) {
        for (const file of attachedFiles) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('title', `${form.Title} - Attachment`);
          formData.append('description', `Attached to Issue Request #${newIssueId}`);
          formData.append('entityRefType', 'ISSUE_REQUEST');
          formData.append('entityRefId', newIssueId);
          formData.append('tags', 'issue_attachment, request');

          try {
            await fileDocumentApi.uploadFile(formData);
          } catch (uploadErr) {
            console.error('File attachment upload failed:', uploadErr);
          }
        }
      }

      onCreated?.();
      onClose();
    } catch (err) {
      setServerError(err.response?.data?.message || 'Failed to submit issue request');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const baseInputStyle = (hasError) => ({
    width: '100%',
    padding: '10px 14px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: hasError ? '1px solid var(--color-danger, #ef4444)' : '1px solid var(--glass-border)',
    borderRadius: '8px',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box'
  });

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(6px)'
    }}>
      <div className="glass-panel" style={{
        width: '100%', maxWidth: '720px', maxHeight: '90vh', overflow: 'auto',
        borderRadius: 'var(--border-radius-lg)', padding: '0'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 28px',
          borderBottom: '1px solid var(--glass-border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(138, 75, 255, 0.08), rgba(14, 165, 233, 0.06))'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(138, 75, 255, 0.15)' }}>
              <Plus size={20} style={{ color: 'var(--accent-primary)' }} />
            </div>
            <div>
              <h2 style={{ fontWeight: '700', fontSize: '1.2rem', letterSpacing: '-0.3px' }}>Submit New Issue Request</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Fill in details and attach supporting documents/photos</p>
            </div>
          </div>
          <button onClick={onClose} style={{ padding: '6px', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ padding: '28px' }}>
          {serverError && (
            <div style={{ marginBottom: '18px', padding: '12px 16px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#f87171', fontSize: '0.85rem' }}>
              {serverError}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
            {/* Title */}
            <div style={{ gridColumn: '1 / -1' }}>
              <FormField
                label="Issue Title"
                id="Title"
                required
                icon={Sparkles}
                error={fieldErrors.Title}
                helpText="Brief, descriptive title summarizing the problem."
              >
                <input
                  id="Title"
                  type="text"
                  value={form.Title}
                  onChange={(e) => handleFieldChange('Title', e.target.value)}
                  placeholder="e.g. AC unit in meeting room 302 not cooling properly"
                  style={baseInputStyle(Boolean(fieldErrors.Title))}
                />
              </FormField>
            </div>

            {/* Description */}
            <div style={{ gridColumn: '1 / -1' }}>
              <FormField
                label="Detailed Description"
                id="Description"
                required
                icon={FileText}
                error={fieldErrors.Description}
                helpText="Provide full details: when it started, observable symptoms, and operational impact."
              >
                <textarea
                  id="Description"
                  rows={4}
                  value={form.Description}
                  onChange={(e) => handleFieldChange('Description', e.target.value)}
                  placeholder="Provide a comprehensive description of the problem..."
                  style={{ ...baseInputStyle(Boolean(fieldErrors.Description)), resize: 'vertical' }}
                />
              </FormField>
            </div>

            {/* Service Selection */}
            <div>
              <FormField
                label="Service Catalog Item"
                id="ServiceID"
                required
                icon={Layers}
                error={fieldErrors.ServiceID}
                helpText="Select corresponding service offering."
              >
                <select
                  id="ServiceID"
                  value={form.ServiceID}
                  onChange={(e) => handleServiceSelect(e.target.value)}
                  style={baseInputStyle(Boolean(fieldErrors.ServiceID))}
                >
                  <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>-- Select Service from Catalog --</option>
                  {servicesList.map((svc) => (
                    <option key={svc.ServiceID} value={svc.ServiceID} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                      {svc.ServiceName} ({svc.ServiceCode || `ID #${svc.ServiceID}`})
                    </option>
                  ))}
                </select>
              </FormField>
              {selectedServiceMeta && (
                <div style={{ marginTop: '8px', padding: '8px 12px', borderRadius: '6px', background: 'rgba(79, 70, 229, 0.1)', border: '1px solid rgba(79, 70, 229, 0.2)', fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <span><strong>Cost:</strong> {selectedServiceMeta.EstimatedCost ? `${selectedServiceMeta.EstimatedCost} ${selectedServiceMeta.CurrencyCode || 'ETB'}` : 'Standard'}</span>
                  <span><Shield size={12} style={{ verticalAlign: 'middle', marginRight: '4px', color: '#6366f1' }} /><strong>Governance:</strong> Auto-Routed</span>
                </div>
              )}
            </div>

            {/* Request Type */}
            <div>
              <FormField
                label="Request Classification"
                id="RequestTypeCode"
                required
                error={fieldErrors.RequestTypeCode}
              >
                <select
                  id="RequestTypeCode"
                  value={form.RequestTypeCode}
                  onChange={(e) => handleFieldChange('RequestTypeCode', e.target.value)}
                  style={baseInputStyle(Boolean(fieldErrors.RequestTypeCode))}
                >
                  <option value="INCIDENT" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Incident</option>
                  <option value="MAINTENANCE" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Maintenance</option>
                  <option value="COMPLAINT" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Complaint</option>
                  <option value="DISRUPTION" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Disruption</option>
                  <option value="SERVICE_REQUEST" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Service Request</option>
                </select>
              </FormField>
            </div>

            {/* Priority */}
            <div>
              <FormField
                label="Urgency / Priority"
                id="PriorityCode"
                required
                icon={Clock}
                error={fieldErrors.PriorityCode}
              >
                <select
                  id="PriorityCode"
                  value={form.PriorityCode}
                  onChange={(e) => handleFieldChange('PriorityCode', e.target.value)}
                  style={baseInputStyle(Boolean(fieldErrors.PriorityCode))}
                >
                  <option value="LOW" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Low — Routine</option>
                  <option value="MEDIUM" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Medium — Standard</option>
                  <option value="HIGH" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>High — Important</option>
                  <option value="CRITICAL" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Critical — Emergency</option>
                </select>
              </FormField>
            </div>

            {/* Category Code */}
            <div>
              <FormField
                label="Category Code"
                id="CategoryCode"
                icon={Tag}
                error={fieldErrors.CategoryCode}
                helpText="Optional category code (e.g. FACILITIES, IT)."
              >
                <input
                  id="CategoryCode"
                  type="text"
                  value={form.CategoryCode}
                  onChange={(e) => handleFieldChange('CategoryCode', e.target.value.toUpperCase())}
                  placeholder="e.g. FACILITIES, IT, SECURITY"
                  style={baseInputStyle(Boolean(fieldErrors.CategoryCode))}
                />
              </FormField>
            </div>

            {/* Requester User ID */}
            <div>
              <FormField
                label="Requester User ID"
                id="RequesterUserID"
                required
                icon={User}
                error={fieldErrors.RequesterUserID}
              >
                <input
                  id="RequesterUserID"
                  type="number"
                  min="1"
                  value={form.RequesterUserID}
                  onChange={(e) => handleFieldChange('RequesterUserID', e.target.value)}
                  style={baseInputStyle(Boolean(fieldErrors.RequesterUserID))}
                />
              </FormField>
            </div>

            {/* Major Incident Flag */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '26px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-secondary)', fontWeight: '600' }}>
                <input
                  type="checkbox"
                  checked={form.IsMajorIncident === 1 || form.IsMajorIncident === true}
                  onChange={(e) => handleFieldChange('IsMajorIncident', e.target.checked ? 1 : 0)}
                  style={{ accentColor: '#ef4444', width: '16px', height: '16px' }}
                />
                <AlertTriangle size={14} style={{ color: '#f87171' }} />
                Flag as Major Incident
              </label>
            </div>

            {/* ── File & Document Attachment Section ── */}
            <div style={{ gridColumn: '1 / -1', borderTop: '1px dashed var(--glass-border)', paddingTop: '16px', marginTop: '6px' }}>
              <FormField
                label="Attach Supporting Files & Documents"
                id="attachments"
                icon={Paperclip}
                error={fieldErrors.Attachments}
                helpText="Upload relevant error logs, photos, or diagnostic files (up to 5 files, 10MB each)."
              >
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: fieldErrors.Attachments ? '2px dashed var(--color-danger, #ef4444)' : '2px dashed var(--glass-border)',
                    borderRadius: '12px', padding: '20px',
                    textAlign: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.02)',
                    transition: 'all 0.2s'
                  }}
                >
                  <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  <Paperclip size={24} color="var(--accent-primary)" style={{ marginBottom: '6px' }} />
                  <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>Click to browse or attach files/photos</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Images, PDFs, Word, Excel, CSV (Saved directly to Document Repository)
                  </div>
                </div>
              </FormField>

              {attachedFiles.length > 0 && (
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {attachedFiles.map((file, idx) => (
                    <div key={idx} style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={16} color="#818cf8" />
                        <span style={{ fontWeight: 600 }}>{file.name}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>({(file.size / 1024).toFixed(1)} KB)</span>
                      </div>
                      <button type="button" onClick={() => handleRemoveFile(idx)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '2px' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--glass-border)' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 24px', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: '600' }}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting} style={{ padding: '10px 28px' }}>
              {submitting ? 'Submitting & Uploading Files...' : 'Submit Issue Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateIssueModal;
