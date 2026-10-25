import React, { useState, useEffect, useRef } from 'react';
import {
  X, Plus, AlertTriangle, Paperclip, FileText, Trash2,
  Shield, Clock, Sparkles, Layers, User, Tag, Upload, AlertCircle
} from 'lucide-react';
import issueManagementApi from '../api/issueManagementApi';
import fileDocumentApi from '../../file-document/api/fileDocumentApi';
import serviceCatalogApi from '../../service-catalog/api/serviceCatalogApi';
import { usePermissionContext } from '../../role-permission-management/contexts/PermissionContext';
import { requestSchemas } from '../../../validation';
import { FormField } from '../../../components/common/FormField';
import { useTranslation } from '../../../i18n';

export const CreateIssueModal = ({ isOpen, onClose, onCreated, services: propServices = [] }) => {
  const { t, isRTL } = useTranslation();
  const { user } = usePermissionContext();
  const [categoriesList, setCategoriesList] = useState([]);
  const [servicesList, setServicesList] = useState([]);
  const [selectedServiceMeta, setSelectedServiceMeta] = useState(null);

  const [form, setForm] = useState({
    ServiceCategoryID: '',
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
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      Promise.all([
        serviceCatalogApi.getCategories().catch(() => ({ data: { data: [] } })),
        propServices && propServices.length > 0
          ? Promise.resolve({ data: { data: { services: propServices } } })
          : serviceCatalogApi.getServices().catch(() => ({ data: { data: { services: [] } } }))
      ]).then(([catRes, svcRes]) => {
        const cats = catRes.data?.data?.categories || catRes.data?.data || [];
        const svcs = svcRes.data?.data?.services || svcRes.data?.data || [];
        setCategoriesList(Array.isArray(cats) ? cats : []);
        setServicesList(Array.isArray(svcs) ? svcs : []);
      }).catch(err => {
        console.warn('Failed to load metadata in CreateIssueModal:', err);
      });

      setForm({
        ServiceCategoryID: '',
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

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleFieldChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: null }));
    }
    if (serverError) {
      setServerError(null);
    }
  };

  const handleCategorySelect = (categoryId) => {
    const found = categoriesList.find(c => String(c.ServiceCategoryID) === String(categoryId));
    setForm(prev => ({
      ...prev,
      ServiceCategoryID: categoryId,
      CategoryCode: found ? found.CategoryCode : '',
      ServiceID: ''
    }));
    setSelectedServiceMeta(null);
    if (fieldErrors.ServiceCategoryID) {
      setFieldErrors(prev => ({ ...prev, ServiceCategoryID: null }));
    }
    if (fieldErrors.ServiceID) {
      setFieldErrors(prev => ({ ...prev, ServiceID: null }));
    }
  };

  const handleServiceSelect = (serviceId) => {
    handleFieldChange('ServiceID', serviceId);
    if (!serviceId) {
      setSelectedServiceMeta(null);
      return;
    }
    const sId = Number(serviceId);
    const found = servicesList.find(s => Number(s.ServiceID) === sId);
    if (found) {
      setSelectedServiceMeta(found);
      setForm(prev => ({
        ...prev,
        ServiceID: serviceId,
        ServiceCategoryID: found.ServiceCategoryID ? String(found.ServiceCategoryID) : prev.ServiceCategoryID,
        CategoryCode: found.CategoryCode || prev.CategoryCode,
        EstimatedCost: found.EstimatedCost ? Number(found.EstimatedCost) : prev.EstimatedCost
      }));
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

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      setAttachedFiles((prev) => [...prev, ...files]);
      if (fieldErrors.Attachments) {
        setFieldErrors(prev => ({ ...prev, Attachments: null }));
      }
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
        ServiceCategoryID: form.ServiceCategoryID,
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
        RequestTypeCode: validation.sanitized.RequestTypeCode,
        ServiceCategoryID: form.ServiceCategoryID ? Number(form.ServiceCategoryID) : null,
        ServiceID: form.ServiceID ? Number(form.ServiceID) : null,
        RequesterUserID: Number(form.RequesterUserID || user?.UserID || 1),
        CategoryCode: form.CategoryCode || 'GENERAL',
        IsMajorIncident: form.IsMajorIncident ? 1 : 0
      };
      if (!payload.BuildingID) delete payload.BuildingID;
      if (!payload.OfficeSpaceID) delete payload.OfficeSpaceID;

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
    boxSizing: 'border-box'
  });

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--modal-backdrop, rgba(16, 20, 24, 0.78))',
        backdropFilter: 'blur(12px)',
        padding: 'clamp(8px, 2.5vw, 20px)'
      }}
      onClick={onClose}
    >
      <div
        className="modal-card accent-strip-brand enterprise-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-issue-title"
        style={{
          width: '100%', maxWidth: '750px', maxHeight: '92vh',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          borderRadius: 'var(--border-radius-lg, 18px)', padding: '0',
          background: 'var(--color-surface, var(--bg-secondary))',
          boxShadow: 'var(--shadow-lg)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (Pinned) */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--color-border-subtle, var(--glass-border))',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'var(--bg-tertiary)', flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '10px',
              background: 'var(--accent-gradient)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: '#ffffff',
              boxShadow: 'var(--glow-accent)', flexShrink: 0
            }}>
              <Plus size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--accent-primary)' }}>
                Service Management Gateway
              </div>
              <h2 id="create-issue-title" style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.3px', margin: '2px 0 0', color: 'var(--text-primary)' }}>
                {t('issues.submitServiceRequest', 'Submit New Issue Request')}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-icon touch-target-sm"
            style={{ borderRadius: '8px' }}
            aria-label={t('common.close', 'Close')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body (Scrollable Form) */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: 'clamp(16px, 3vw, 24px)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {serverError && (
              <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: 'var(--color-error-bg)', border: '1px solid var(--color-error-border)', color: 'var(--color-error)', fontSize: '0.85rem' }}>
                {serverError}
              </div>
            )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-5">
            {/* Title */}
            <div className="sm:col-span-2">
              <FormField
                label={t('issues.requestTitle', 'Issue Title')}
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
                  placeholder={t('issues.titlePlaceholder', 'e.g. AC unit in meeting room 302 not cooling properly')}
                  className={`enterprise-input ${fieldErrors.Title ? 'input-error' : ''}`}
                />
              </FormField>
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <FormField
                label={t('issues.descriptionDetails', 'Detailed Description')}
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
                  placeholder={t('issues.descPlaceholder', 'Provide a comprehensive description of the problem...')}
                  className={`enterprise-input ${fieldErrors.Description ? 'input-error' : ''}`}
                  style={{ resize: 'vertical' }}
                />
              </FormField>
            </div>

            {/* Service Category / Domain */}
            <div>
              <FormField
                label={t('issues.category', 'Service Category / Domain')}
                id="ServiceCategoryID"
                icon={Layers}
                error={fieldErrors.ServiceCategoryID}
                helpText={t('issues.selectDomainHelp', 'Select operational domain or general area')}
              >
                <select
                  id="ServiceCategoryID"
                  value={form.ServiceCategoryID}
                  onChange={(e) => handleCategorySelect(e.target.value)}
                  className={`enterprise-input ${fieldErrors.ServiceCategoryID ? 'input-error' : ''}`}
                >
                  <option value="">-- {t('issues.allCategories', 'General / All Categories')} --</option>
                  {categoriesList.map((c) => (
                    <option key={c.ServiceCategoryID} value={c.ServiceCategoryID}>
                      {c.CategoryName} ({c.CategoryCode})
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            {/* Request Type */}
            <div>
              <FormField
                label={t('issues.requestType', 'Request Classification')}
                id="RequestTypeCode"
                required
                error={fieldErrors.RequestTypeCode}
              >
                <select
                  id="RequestTypeCode"
                  value={form.RequestTypeCode}
                  onChange={(e) => handleFieldChange('RequestTypeCode', e.target.value)}
                  className={`enterprise-input ${fieldErrors.RequestTypeCode ? 'input-error' : ''}`}
                >
                  <option value="INCIDENT">{t('issues.incident', 'Incident')}</option>
                  <option value="MAINTENANCE">{t('issues.maintenance', 'Maintenance')}</option>
                  <option value="COMPLAINT">{t('issues.complaint', 'Complaint')}</option>
                  <option value="DISRUPTION">{t('issues.disruption', 'Disruption')}</option>
                  <option value="SERVICE_REQUEST">{t('issues.serviceRequest', 'Service Request')}</option>
                </select>
              </FormField>
            </div>

            {/* Specific Service Selection (Optional) */}
            <div className="sm:col-span-2">
              <FormField
                label={t('issues.serviceItemOptional', 'Specific Service Item (Optional)')}
                id="ServiceID"
                icon={FileText}
                error={fieldErrors.ServiceID}
                helpText={t('issues.serviceItemHint', 'Optional. Only select if raising a request for a specific catalog offering; leave blank for direct typed requests.')}
              >
                <select
                  id="ServiceID"
                  value={form.ServiceID}
                  onChange={(e) => handleServiceSelect(e.target.value)}
                  className={`enterprise-input ${fieldErrors.ServiceID ? 'input-error' : ''}`}
                >
                  <option value="">-- {t('issues.chooseServiceOptional', 'None / Free-form Request (No Specific Service Item)')} --</option>
                  {servicesList
                    .filter((s) => !form.ServiceCategoryID || String(s.ServiceCategoryID) === String(form.ServiceCategoryID))
                    .map((svc) => (
                      <option key={svc.ServiceID} value={svc.ServiceID}>
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

            {/* Priority Selection (Full Width 4-Tile Grid) */}
            <div className="sm:col-span-2">
              <FormField
                label={t('issues.urgencyPriority', 'Urgency & SLA Priority Level')}
                id="PriorityCode"
                required
                icon={Clock}
                error={fieldErrors.PriorityCode}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: '10px' }}>
                  {[
                    { code: 'LOW', label: t('issues.priorityLow', 'Low'), desc: 'Routine · 48h SLA', color: '#94a3b8', icon: Clock, badge: 'Standard' },
                    { code: 'MEDIUM', label: t('issues.priorityMedium', 'Medium'), desc: 'Normal · 24h SLA', color: '#38bdf8', icon: Sparkles, badge: 'Normal' },
                    { code: 'HIGH', label: t('issues.priorityHigh', 'High'), desc: 'Urgent · 8h SLA', color: '#facc15', icon: AlertCircle, badge: 'Important' },
                    { code: 'CRITICAL', label: t('issues.priorityCritical', 'Critical'), desc: 'Emergency · 2h SLA', color: '#f87171', icon: AlertTriangle, badge: 'Emergency' }
                  ].map(p => {
                    const isSel = form.PriorityCode === p.code;
                    const IconComponent = p.icon;
                    return (
                      <div
                        key={p.code}
                        onClick={() => handleFieldChange('PriorityCode', p.code)}
                        className={`form-selection-tile ${isSel ? 'selected' : ''}`}
                        role="button"
                        tabIndex={0}
                        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleFieldChange('PriorityCode', p.code)}
                        style={{
                          position: 'relative',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          minHeight: '85px',
                          padding: '10px 12px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <div style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '6px',
                            background: isSel ? `${p.color}25` : 'rgba(255,255,255,0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: p.color
                          }}>
                            <IconComponent size={15} />
                          </div>
                          <span style={{
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            padding: '2px 6px',
                            borderRadius: '10px',
                            background: isSel ? `${p.color}25` : 'var(--color-elevated)',
                            color: isSel ? p.color : 'var(--color-text-secondary)',
                            border: `1px solid ${isSel ? p.color : 'var(--color-border)'}`
                          }}>
                            {p.badge}
                          </span>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: isSel ? p.color : 'var(--color-text-main)' }}>
                            {p.label}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                            {p.desc}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </FormField>
            </div>

            {/* Category Code */}
            <div>
              <FormField
                label={t('issues.category', 'Category Code')}
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
                  className={`enterprise-input ${fieldErrors.CategoryCode ? 'input-error' : ''}`}
                />
              </FormField>
            </div>

            {/* Requester User ID */}
            <div>
              <FormField
                label={t('issues.requester', 'Requester User ID')}
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
                  className={`enterprise-input ${fieldErrors.RequesterUserID ? 'input-error' : ''}`}
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
                {t('issues.flagMajorIncident', 'Flag as Major Incident')}
              </label>
            </div>

            {/* ── File & Document Attachment Section ── */}
            <div className="sm:col-span-2" style={{ borderTop: '1px dashed var(--color-border)', paddingTop: '16px', marginTop: '6px' }}>
              <FormField
                label={t('issues.attachFiles', 'Attach Supporting Files & Documents')}
                id="attachments"
                icon={Paperclip}
                error={fieldErrors.Attachments}
                helpText="Upload relevant error logs, photos, or diagnostic files (up to 5 files, 10MB each)."
              >
                <div
                  className={`enterprise-dropzone ${isDragging ? 'dragover' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  <div className="dropzone-icon" style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: 'rgba(37, 99, 235, 0.1)',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 8px'
                  }}>
                    <Upload size={18} />
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                    {t('issues.dragDropBrowse', 'Click to browse or drop files here')}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                    {t('issues.fileSupportHint', 'Images, PDFs, Word, Excel, CSV (Saved directly to Document Repository)')}
                  </div>
                </div>
              </FormField>

              {attachedFiles.length > 0 && (
                <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px' }}>
                  {attachedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.82rem',
                        gap: '8px',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.03)'
                      }}
                      className="hover:border-blue-400"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                        <FileText size={15} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                        <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={file.name}>
                          {file.name}
                        </span>
                        <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.72rem', flexShrink: 0 }}>
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleRemoveFile(idx); }}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: 'none',
                          borderRadius: '4px',
                          color: '#f87171',
                          width: '22px',
                          height: '22px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          flexShrink: 0
                        }}
                        title="Remove file"
                        className="hover:bg-red-500 hover:text-white"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer (Pinned) */}
        <div style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--color-border-subtle, var(--glass-border))',
            background: 'var(--bg-tertiary)',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
            gap: '12px',
            flexShrink: 0
          }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary touch-target-sm"
              disabled={submitting}
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              className="btn btn-primary touch-target-sm"
              disabled={submitting}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <Plus size={16} />
              {submitting ? t('issues.submitting', 'Submitting & Uploading Files...') : t('issues.submitServiceRequest', 'Submit Issue Request')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateIssueModal;
