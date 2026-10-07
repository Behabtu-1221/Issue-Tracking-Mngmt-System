import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  LifeBuoy, ArrowLeft, Upload, Paperclip, CheckCircle, FileText,
  Trash2, Shield, Clock, Plus, AlertCircle, CheckCircle2, ChevronRight, X,
  Building2, User, Layers, ShieldCheck, Lock, Mail, Phone, Sparkles
} from 'lucide-react';
import issueManagementApi from '../api/issueManagementApi';
import serviceCatalogApi from '../../service-catalog/api/serviceCatalogApi';
import fileDocumentApi from '../../file-document/api/fileDocumentApi';
import orgApi from '../../organization/api/orgApi';
import parkApi from '../../business-park/api/parkApi';
import { usePermissionContext } from '../../role-permission-management/contexts/PermissionContext';
import { requestSchemas, fileSchemas } from '../../../validation';
import { FormField } from '../../../components/common/FormField';
import { useTranslation } from '../../../i18n';

export default function CreateRequestPage() {
  const { t, isRTL } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialServiceId = searchParams.get('serviceId') || '';

  const { user } = usePermissionContext();

  const [categoriesList, setCategoriesList] = useState([]);
  const [servicesList, setServicesList] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const [form, setForm] = useState({
    ServiceCategoryID: '',
    ServiceID: initialServiceId,
    TenantID: user?.TenantID || '',
    Title: '',
    Description: '',
    PriorityCode: 'MEDIUM',
    CategoryCode: ''
  });

  const [attachedFiles, setAttachedFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const fileInputRef = useRef(null);
  const [businessPark, setBusinessPark] = useState(null);

  // Fetch registered business park data from API
  useEffect(() => {
    parkApi.getParks()
      .then((res) => {
        const parks = res.data?.data?.parks || res.data?.data || [];
        if (Array.isArray(parks) && parks.length > 0) {
          setBusinessPark(parks[0]);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch registered parks:', err?.message);
      });
  }, []);

  // Sync user tenant if user context updates
  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        TenantID: user.TenantID || user.tenantId || prev.TenantID
      }));
    }
  }, [user]);

  // Load service categories and services
  useEffect(() => {
    Promise.all([
      serviceCatalogApi.getCategories().catch(() => ({ data: { data: [] } })),
      serviceCatalogApi.getServices().catch(() => ({ data: { data: { services: [] } } }))
    ])
      .then(([catRes, svcRes]) => {
        const catList = catRes.data?.data?.categories || catRes.data?.data || [];
        const svcList = svcRes.data?.data?.services || svcRes.data?.data || [];

        setCategoriesList(Array.isArray(catList) ? catList : []);
        setServicesList(Array.isArray(svcList) ? svcList : []);

        if (initialServiceId) {
          const found = svcList.find(s => String(s.ServiceID) === String(initialServiceId));
          if (found) {
            setSelectedService(found);
            setForm(prev => ({
              ...prev,
              ServiceID: found.ServiceID,
              ServiceCategoryID: found.ServiceCategoryID || prev.ServiceCategoryID,
              CategoryCode: found.CategoryCode || ''
            }));
          }
        }
      })
      .catch(err => console.error('Failed to load initial form metadata:', err));
  }, [initialServiceId]);

  const handleCategorySelect = (cId) => {
    const foundCat = categoriesList.find(c => String(c.ServiceCategoryID) === String(cId));
    setForm(prev => ({
      ...prev,
      ServiceCategoryID: cId,
      ServiceID: '',
      CategoryCode: foundCat ? foundCat.CategoryCode : ''
    }));
    setSelectedService(null);
    setFormErrors(prev => ({ ...prev, ServiceCategoryID: null, ServiceID: null }));
    if (error) setError(null);
  };

  const handleServiceSelect = (sId) => {
    const found = servicesList.find(s => String(s.ServiceID) === String(sId));
    setSelectedService(found || null);
    setForm(prev => ({
      ...prev,
      ServiceID: sId,
      ServiceCategoryID: found ? (found.ServiceCategoryID || prev.ServiceCategoryID) : prev.ServiceCategoryID,
      CategoryCode: found ? (found.CategoryCode || prev.CategoryCode) : prev.CategoryCode
    }));
    setFormErrors(prev => ({ ...prev, ServiceID: null, ServiceCategoryID: null }));
    if (error) setError(null);
  };

  const handleInputChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: null }));
    }
    if (error) setError(null);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const combined = [...attachedFiles, ...newFiles];

      const check = fileSchemas.validateAttachments(combined);
      if (!check.isValid) {
        setError(check.error);
        return;
      }
      setError(null);
      setAttachedFiles(combined);
    }
  };

  const removeFile = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setError(null);
    setFormErrors({});

    const validation = requestSchemas.createIssueRequest(form, attachedFiles);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    setSubmitting(true);

    try {
      const currentUserId = user?.UserID || user?.userId;
      const currentTenantId = user?.TenantID || user?.tenantId;

      const payload = {
        ServiceCategoryID: validation.sanitized.ServiceCategoryID ? Number(validation.sanitized.ServiceCategoryID) : null,
        ServiceID: validation.sanitized.ServiceID ? Number(validation.sanitized.ServiceID) : null,
        TenantID: form.TenantID ? Number(form.TenantID) : (currentTenantId ? Number(currentTenantId) : null),
        Title: validation.sanitized.Title,
        Description: validation.sanitized.Description,
        RequestTypeCode: 'INCIDENT',
        PriorityCode: validation.sanitized.PriorityCode || 'MEDIUM',
        CategoryCode: form.CategoryCode || 'GENERAL',
        RequesterUserID: currentUserId ? Number(currentUserId) : 1
      };

      const res = await issueManagementApi.createIssue(payload);
      const createdIssue = res.data?.data;

      // 2. Upload attached documents if any
      if (attachedFiles.length > 0 && createdIssue?.IssueRequestID) {
        for (const file of attachedFiles) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('title', file.name);
          formData.append('entityRefType', 'ISSUE_REQUEST');
          formData.append('entityRefId', createdIssue.IssueRequestID);
          formData.append('tags', 'issue_attachment');
          try {
            await fileDocumentApi.uploadFile(formData);
          } catch (fileErr) {
            console.warn('File upload failed:', fileErr);
          }
        }
      }

      setSuccessMsg('Your service request has been submitted successfully!');
      setTimeout(() => {
        navigate('/issues/my-requests');
      }, 1500);
    } catch (err) {
      console.error('Failed to submit service request:', err);
      setError(err.response?.data?.message || 'Failed to submit service request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const fName = user?.FirstName || user?.firstName || '';
  const lName = user?.LastName || user?.lastName || '';
  const requesterFullName = (fName || lName)
    ? `${fName} ${lName}`.trim()
    : (user?.Username || user?.username || 'Current Employee');
  const userIdDisplay = user?.UserID || user?.userId || 'N/A';
  const businessParkName = businessPark?.BusinessParkName || user?.BusinessParkName || user?.businessParkName || 'Ethiopian IT Park';
  const tenantNameDisplay = user?.TenantName || user?.tenantName || user?.CompanyName || user?.companyName || null;
  const emailDisplay = user?.Email || user?.email || 'N/A';
  const phoneDisplay = user?.PhoneNumber || user?.phoneNumber || user?.MobileNumber || user?.mobileNumber || 'N/A';

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <button
            onClick={() => navigate('/issues/my-requests')}
            style={{
              background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600, marginBottom: '8px'
            }}
          >
            <ArrowLeft size={16} style={{ transform: isRTL ? 'rotate(180deg)' : 'none' }} /> {t('issues.backToRequests', 'Back to My Requests')}
          </button>
          <h1 style={{ fontSize: '1.7rem', fontWeight: 800, margin: 0 }}>
            {t('issues.createIssue', 'Create New Service Request')}
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            {t('dashboard.employeeSubtitle', 'Submit a new business park service request or report an issue to facility engineers.')}
          </p>
        </div>
      </div>

      {/* Auto-Fetched Requester Profile Information Box */}
      <div className="glass-panel" style={{
        padding: '18px 24px',
        background: 'linear-gradient(135deg, rgba(37,99,235,0.12) 0%, rgba(124,58,237,0.08) 100%)',
        borderRadius: '16px',
        border: '1px solid rgba(37, 99, 235, 0.25)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>
            <User size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>{t('issues.requesterCard', 'Auto-Fetched Requester')}</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>{requesterFullName}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 700 }}>ID: #{userIdDisplay}</div>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>{t('issues.campus', 'Business Park / Campus')}</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Building2 size={15} color="#60a5fa" /> {businessParkName}
          </div>
          {tenantNameDisplay && (
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>{t('nav.tenants', 'Tenant')}: {tenantNameDisplay}</div>
          )}
        </div>

        <div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>{t('issues.contactDetails', 'Contact Email & Phone')}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <div>{emailDisplay}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{phoneDisplay}</div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(74, 222, 128, 0.15)', border: '1px solid rgba(74, 222, 128, 0.3)', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', fontWeight: 600 }}>
          <CheckCircle2 size={20} /> {successMsg}
        </div>
      )}
      {error && (
        <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', fontWeight: 600 }}>
          <AlertCircle size={20} /> {error}
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Company & Service Category Selection */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
              {t('issues.campus', 'Business Park Campus')}
            </label>
            <div style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid var(--glass-border)',
              background: 'rgba(255,255,255,0.03)',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxSizing: 'border-box'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                <Building2 size={16} color="var(--accent-primary, #0284c7)" style={{ flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span style={{ fontWeight: 800 }}>{businessParkName}</span>
                  {tenantNameDisplay && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                      {t('nav.tenants', 'Tenant')}: {tenantNameDisplay}
                    </span>
                  )}
                </div>
              </div>
              <Lock size={15} color="var(--text-muted)" title="Registered campus location" />
            </div>
          </div>

          <FormField
            label={t('issues.category', 'Service Category')}
            id="ServiceCategoryID"
            required
            icon={Layers}
            error={formErrors.ServiceCategoryID}
            helpText={t('issues.selectDomain', 'Select domain of request')}
          >
            <select
              id="ServiceCategoryID"
              value={form.ServiceCategoryID}
              onChange={e => handleCategorySelect(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: formErrors.ServiceCategoryID ? '1px solid var(--color-danger, #ef4444)' : '1px solid var(--glass-border)',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            >
              <option value="">{t('issues.chooseCategory', '-- Select Service Category --')}</option>
              {categoriesList.map(c => (
                <option key={c.ServiceCategoryID} value={c.ServiceCategoryID}>
                  {c.CategoryName} ({c.CategoryCode})
                </option>
              ))}
            </select>
          </FormField>
        </div>

        {/* Specific Service Selection (Optional) */}
        <div>
          <FormField
            label={t('issues.serviceItem', 'Specific Catalog Service (Optional)')}
            id="ServiceID"
            icon={FileText}
            error={formErrors.ServiceID}
          >
            <select
              id="ServiceID"
              value={form.ServiceID}
              onChange={e => handleServiceSelect(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: formErrors.ServiceID ? '1px solid var(--color-danger, #ef4444)' : '1px solid var(--glass-border)',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            >
              <option value="">{t('issues.chooseService', '-- General Category Request --')}</option>
              {servicesList
                .filter(s => !form.ServiceCategoryID || String(s.ServiceCategoryID) === String(form.ServiceCategoryID))
                .map(s => (
                  <option key={s.ServiceID} value={s.ServiceID}>
                    {s.ServiceName} ({s.CategoryName || s.CategoryCode || 'General'})
                  </option>
                ))}
            </select>
          </FormField>
          {selectedService && (
            <div style={{ marginTop: '8px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)', fontSize: '0.8rem', color: '#60a5fa' }}>
              <strong>SLA Target:</strong> {selectedService.SLATargetHours || 24} hours | <strong>Description:</strong> {selectedService.Description || 'Standard tenant service.'}
            </div>
          )}
        </div>

        {/* Priority */}
        <div>
          <FormField
            label={t('issues.urgencyPriority', 'Urgency / Priority Level')}
            id="PriorityCode"
            required
            icon={Clock}
            error={formErrors.PriorityCode}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              {[
                { code: 'LOW', label: t('issues.priorityLow', 'Low'), desc: 'Routine request', color: '#94a3b8' },
                { code: 'MEDIUM', label: t('issues.priorityMedium', 'Medium'), desc: 'Standard response', color: '#60a5fa' },
                { code: 'HIGH', label: t('issues.priorityHigh', 'High'), desc: 'Important issue', color: '#facc15' },
                { code: 'URGENT', label: t('issues.priorityUrgent', 'Urgent'), desc: 'Severe impact', color: '#f87171' }
              ].map(p => {
                const isSel = form.PriorityCode === p.code;
                return (
                  <div
                    key={p.code}
                    onClick={() => handleInputChange('PriorityCode', p.code)}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      background: isSel ? 'rgba(37,99,235,0.15)' : 'var(--bg-tertiary)',
                      border: isSel ? `2px solid ${p.color}` : '1px solid var(--glass-border)',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: p.color }}>{p.label}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.desc}</div>
                  </div>
                );
              })}
            </div>
          </FormField>
        </div>

        {/* Subject Title */}
        <FormField
          label={t('issues.requestTitle', 'Subject / Request Title')}
          id="Title"
          required
          icon={Sparkles}
          error={formErrors.Title}
          helpText="Brief summary of the issue (min 3 characters)."
        >
          <input
            id="Title"
            type="text"
            placeholder={t('issues.titlePlaceholder', 'e.g. AC unit in office 304 making loud noise')}
            value={form.Title}
            onChange={e => handleInputChange('Title', e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '8px',
              border: formErrors.Title ? '1px solid var(--color-danger, #ef4444)' : '1px solid var(--glass-border)',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </FormField>

        {/* Detailed Description */}
        <FormField
          label={t('issues.descriptionDetails', 'Detailed Request Description')}
          id="Description"
          required
          icon={FileText}
          error={formErrors.Description}
          helpText="Explain symptoms, locations, and when this started (min 10 characters)."
        >
          <textarea
            id="Description"
            rows={5}
            placeholder={t('issues.descPlaceholder', 'Please describe the issue or service required in detail, including specific building, floor, room number, or symptom...')}
            value={form.Description}
            onChange={e => handleInputChange('Description', e.target.value)}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: '8px',
              border: formErrors.Description ? '1px solid var(--color-danger, #ef4444)' : '1px solid var(--glass-border)',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              resize: 'vertical',
              fontFamily: 'inherit',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </FormField>

        {/* File Attachments Uploader */}
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
            {t('issues.attachFiles', 'Upload Supporting Documents / Photos (Optional)')}
          </label>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            style={{ display: 'none' }}
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed var(--glass-border)',
              borderRadius: '12px',
              padding: '24px',
              textAlign: 'center',
              cursor: 'pointer',
              background: 'rgba(255,255,255,0.02)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
          >
            <Upload size={28} style={{ color: 'var(--accent-primary)', marginBottom: '8px' }} />
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {t('issues.dragDropBrowse', 'Click to browse or drop files here')}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {t('issues.fileSupportHint', 'Upload photos, error screenshots, PDFs, or equipment logs (Max 10 MB per file)')}
            </div>
          </div>

          {attachedFiles.length > 0 && (
            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {attachedFiles.map((file, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--glass-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.83rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={16} color="var(--accent-primary)" />
                    <span style={{ fontWeight: 600 }}>{file.name}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px', borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
          <button
            type="button"
            onClick={() => navigate('/issues/my-requests')}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: '1px solid var(--glass-border)',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {t('common.cancel', 'Cancel')}
          </button>

          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--accent-gradient)',
              color: '#ffffff',
              fontWeight: 700,
              cursor: submitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
              opacity: submitting ? 0.7 : 1
            }}
          >
            <Plus size={18} />
            {submitting ? t('issues.submitting', 'Submitting Request...') : t('issues.submitServiceRequest', 'Submit Service Request')}
          </button>
        </div>

      </form>
    </div>
  );
}
