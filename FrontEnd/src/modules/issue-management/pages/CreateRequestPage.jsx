import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  LifeBuoy, ArrowLeft, Upload, Paperclip, CheckCircle, FileText,
  Trash2, Shield, Clock, Plus, AlertCircle, CheckCircle2, ChevronRight, X,
  Building2, User, Layers, ShieldCheck, Lock, Mail, Phone, Sparkles,
  AlertTriangle
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
  const [isDragging, setIsDragging] = useState(false);
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
      const newFiles = Array.from(e.dataTransfer.files);
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
      <div className="form-card accent-strip-cyan" style={{
        padding: '18px 24px',
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
      <form onSubmit={handleSubmit} className="form-card accent-strip-brand enterprise-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {/* Section 1: Campus Location & Service Category */}
        <div>
          <div className="form-section-header">
            <span className="form-section-number">1</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                {t('issues.locationCategoryTitle', 'Campus Location & Service Domain')}
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                {t('issues.locationCategorySubtitle', 'Identify campus premises and service classification')}
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: 'var(--color-text-main)' }}>
                {t('issues.campus', 'Business Park Campus')}
              </label>
              <div style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-elevated)',
                color: 'var(--color-text-main)',
                fontSize: '0.9rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxSizing: 'border-box'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                  <Building2 size={16} color="var(--color-primary, #0284c7)" style={{ flexShrink: 0 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span style={{ fontWeight: 800 }}>{businessParkName}</span>
                    {tenantNameDisplay && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                        {t('nav.tenants', 'Tenant')}: {tenantNameDisplay}
                      </span>
                    )}
                  </div>
                </div>
                <Lock size={15} color="var(--color-text-secondary)" title="Registered campus location" />
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
                className={`enterprise-input ${formErrors.ServiceCategoryID ? 'input-error' : ''}`}
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
          <div style={{ marginTop: '16px' }}>
            <FormField
              label={t('issues.serviceItemOptional', 'Service Catalog Item (Optional)')}
              id="ServiceID"
              icon={FileText}
              error={formErrors.ServiceID}
              helpText={t('issues.serviceOptionalHelp', 'Optional. Leave blank when raising a typed or ad-hoc request.')}
            >
              <select
                id="ServiceID"
                value={form.ServiceID}
                onChange={e => handleServiceSelect(e.target.value)}
                className={`enterprise-input ${formErrors.ServiceID ? 'input-error' : ''}`}
              >
                <option value="">{t('issues.chooseServiceOptional', '-- None / General Request (No Catalog Item) --')}</option>
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
              <div style={{
                marginTop: '8px',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(37,99,235,0.08)',
                border: '1px solid rgba(37,99,235,0.2)',
                fontSize: '0.82rem',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap'
              }}>
                <span><strong>SLA Target:</strong> {selectedService.SLATargetHours || 24} hours</span>
                <span><strong>Description:</strong> {selectedService.Description || 'Standard tenant service.'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Urgency & Priority Level */}
        <div>
          <div className="form-section-header">
            <span className="form-section-number">2</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                {t('issues.urgencyPriority', 'Urgency & Impact Level')}
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                {t('issues.urgencySubtitle', 'Choose appropriate SLA response priority for facility dispatch')}
              </p>
            </div>
          </div>

          <FormField
            label=""
            id="PriorityCode"
            required
            error={formErrors.PriorityCode}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              {[
                { code: 'LOW', label: t('issues.priorityLow', 'Low'), desc: 'Routine request · 48h SLA', color: '#94a3b8', icon: Clock, badge: 'Standard' },
                { code: 'MEDIUM', label: t('issues.priorityMedium', 'Medium'), desc: 'Normal dispatch · 24h SLA', color: '#38bdf8', icon: Sparkles, badge: 'Normal' },
                { code: 'HIGH', label: t('issues.priorityHigh', 'High'), desc: 'Urgent response · 8h SLA', color: '#facc15', icon: AlertCircle, badge: 'Important' },
                { code: 'URGENT', label: t('issues.priorityUrgent', 'Urgent'), desc: 'Critical halt · Immediate', color: '#f87171', icon: AlertTriangle, badge: 'Emergency' }
              ].map(p => {
                const isSel = form.PriorityCode === p.code;
                const IconComponent = p.icon;
                return (
                  <div
                    key={p.code}
                    onClick={() => handleInputChange('PriorityCode', p.code)}
                    className={`form-selection-tile ${isSel ? 'selected' : ''}`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleInputChange('PriorityCode', p.code)}
                    style={{
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: '110px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: isSel ? `${p.color}25` : 'rgba(255,255,255,0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: p.color,
                        transition: 'all 0.2s ease'
                      }}>
                        <IconComponent size={18} />
                      </div>
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '2px 7px',
                        borderRadius: '12px',
                        background: isSel ? `${p.color}25` : 'var(--color-elevated)',
                        color: isSel ? p.color : 'var(--color-text-secondary)',
                        border: `1px solid ${isSel ? p.color : 'var(--color-border)'}`
                      }}>
                        {p.badge}
                      </span>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: isSel ? p.color : 'var(--color-text-main)' }}>
                        {p.label}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginTop: '2px', lineHeight: 1.3 }}>
                        {p.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </FormField>
        </div>

        {/* Section 3: Subject Title & Detailed Description */}
        <div>
          <div className="form-section-header">
            <span className="form-section-number">3</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                {t('issues.requestDetailsTitle', 'Subject & Issue Description')}
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                {t('issues.requestDetailsSubtitle', 'Provide detailed summary and symptoms for engineering staff')}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                className={`enterprise-input ${formErrors.Title ? 'input-error' : ''}`}
              />
            </FormField>

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
                className={`enterprise-input ${formErrors.Description ? 'input-error' : ''}`}
                style={{ resize: 'vertical' }}
              />
            </FormField>
          </div>
        </div>

        {/* Section 4: File Attachments Uploader */}
        <div>
          <div className="form-section-header">
            <span className="form-section-number">4</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                {t('issues.attachmentsTitle', 'Supporting Documents & Photos')}
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                {t('issues.attachmentsSubtitle', 'Attach diagnostics, screenshots, or equipment photos (Optional)')}
              </p>
            </div>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            style={{ display: 'none' }}
          />

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
            <div className="dropzone-icon" style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: 'rgba(37, 99, 235, 0.1)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px'
            }}>
              <Upload size={22} />
            </div>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
              {t('issues.dragDropBrowse', 'Click to browse or drag and drop files here')}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              {t('issues.fileSupportHint', 'Upload photos, error screenshots, PDFs, or equipment logs (Max 10 MB per file)')}
            </div>
          </div>

          {attachedFiles.length > 0 && (
            <div style={{ marginTop: '14px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
              {attachedFiles.map((file, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                  }}
                  className="hover:border-blue-400 hover:shadow-md"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'rgba(37, 99, 235, 0.1)',
                      color: 'var(--color-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <FileText size={16} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--color-text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={file.name}>
                        {file.name}
                      </div>
                      <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.72rem' }}>
                        {(file.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#f87171',
                      width: '26px',
                      height: '26px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      flexShrink: 0,
                      transition: 'all 0.15s ease'
                    }}
                    title="Remove attachment"
                    className="hover:bg-red-500 hover:text-white"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px', borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
          <button type="button" onClick={() => navigate('/issues/my-requests')} className="btn btn-secondary">
            {t('common.cancel', 'Cancel')}
          </button>

          <button type="submit" disabled={submitting} className="btn btn-primary" style={{ padding: '10px 24px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} />
            {submitting ? t('issues.submitting', 'Submitting Request...') : t('issues.submitServiceRequest', 'Submit Service Request')}
          </button>
        </div>

      </form>
    </div>
  );
}
