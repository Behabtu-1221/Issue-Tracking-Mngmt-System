import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X, Plus, AlertTriangle, Paperclip, FileText, Trash2,
  Shield, Clock, Sparkles, Layers, User, Tag, Upload, AlertCircle,
  Building2, MapPin, Wrench, Flame, Briefcase, CheckCircle2, ShieldCheck
} from 'lucide-react';
import issueManagementApi from '../api/issueManagementApi';
import fileDocumentApi from '../../file-document/api/fileDocumentApi';
import serviceCatalogApi from '../../service-catalog/api/serviceCatalogApi';
import parkApi from '../../business-park/api/parkApi';
import orgApi from '../../organization/api/orgApi';
import tenantApi from '../../tenant/api/tenantApi';
import { usePermissionContext } from '../../role-permission-management/contexts/PermissionContext';
import { requestSchemas, fileSchemas } from '../../../validation';
import { FormField } from '../../../components/common/FormField';
import { useTranslation } from '../../../i18n';

export const CreateIssueModal = ({ isOpen, onClose, onCreated, onIssueCreated, services: propServices = [] }) => {
  const { t, isRTL } = useTranslation();
  const { user, isParkAdmin, isCompanyAdmin, isTechnician } = usePermissionContext();

  // ── Role Determination ────────────────────────────────────────────────────────
  const userRoleCode = useMemo(() => {
    return (user?.roles?.[0]?.RoleCode || user?.roles?.[0]?.code || user?.userTypeCode || '').toUpperCase();
  }, [user]);

  const isSuperAdmin = Boolean(
    isParkAdmin || ['SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN', 'BUSINESS_PARK_ADMIN', 'ADMIN'].includes(userRoleCode)
  );
  const isDeptManager = ['DEPARTMENT_MANAGER', 'MANAGER', 'DISPATCHER'].includes(userRoleCode);
  const isTech = Boolean(isTechnician || ['TECHNICIAN', 'PARK_TECHNICIAN'].includes(userRoleCode));
  const isTenantRep = Boolean(
    isCompanyAdmin || ['TENANT_REPRESENTATIVE', 'TENANT_ADMIN', 'COMPANY_ADMIN'].includes(userRoleCode) || user?.TenantID
  );

  // ── Async Lists ───────────────────────────────────────────────────────────────
  const [categoriesList, setCategoriesList] = useState([]);
  const [servicesList, setServicesList] = useState([]);
  const [buildingsList, setBuildingsList] = useState([]);
  const [floorsList, setFloorsList] = useState([]);
  const [officesList, setOfficesList] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [tenantsList, setTenantsList] = useState([]);
  const [selectedServiceMeta, setSelectedServiceMeta] = useState(null);

  // ── Form State ────────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    RequestTypeCode: 'INCIDENT',
    ServiceCategoryID: '',
    ServiceID: '',
    CategoryCode: '',

    TargetScope: isTenantRep ? 'TENANT' : 'PARK_INTERNAL',
    TenantID: user?.TenantID || user?.tenantId || '',
    RequesterUserID: user?.UserID || user?.userId || 1,

    BuildingID: '',
    FloorID: '',
    OfficeSpaceID: '',
    Location: '',

    Title: '',
    Description: '',
    PriorityCode: 'MEDIUM',

    AssignedDepartmentID: user?.DepartmentID || '',
    IsMajorIncident: 0,
    EstimatedCost: 0
  });

  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const fileInputRef = useRef(null);

  // ── Metadata Fetching On Open ─────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      Promise.all([
        serviceCatalogApi.getCategories().catch(() => ({ data: { data: [] } })),
        propServices && propServices.length > 0
          ? Promise.resolve({ data: { data: { services: propServices } } })
          : serviceCatalogApi.getServices().catch(() => ({ data: { data: { services: [] } } })),
        parkApi.getBuildings({ limit: 100 }).catch(() => ({ data: { data: [] } })),
        parkApi.getFloors({ limit: 300 }).catch(() => ({ data: { data: [] } })),
        parkApi.getOffices({ limit: 500 }).catch(() => ({ data: { data: [] } })),
        orgApi.getDepartments({ limit: 100 }).catch(() => ({ data: { data: [] } })),
        tenantApi.getTenants({ limit: 200 }).catch(() => ({ data: { data: [] } }))
      ]).then(([catRes, svcRes, bldRes, flrRes, ofcRes, deptRes, tntRes]) => {
        const cats = catRes.data?.data?.categories || catRes.data?.data || [];
        const svcs = svcRes.data?.data?.services || svcRes.data?.data || [];
        const blds = bldRes.data?.data?.buildings || bldRes.data?.data || [];
        const flrs = flrRes.data?.data?.floors || flrRes.data?.data || [];
        const ofcs = ofcRes.data?.data?.offices || ofcRes.data?.data || [];
        const depts = deptRes.data?.data?.departments || deptRes.data?.data || [];
        const tnts = tntRes.data?.data?.tenants || tntRes.data?.data || [];

        setCategoriesList(Array.isArray(cats) ? cats : []);
        setServicesList(Array.isArray(svcs) ? svcs : []);
        setBuildingsList(Array.isArray(blds) ? blds : []);
        setFloorsList(Array.isArray(flrs) ? flrs : []);
        setOfficesList(Array.isArray(ofcs) ? ofcs : []);
        setDepartmentsList(Array.isArray(depts) ? depts : []);
        setTenantsList(Array.isArray(tnts) ? tnts : []);
      }).catch(err => {
        console.warn('Failed to load metadata in CreateIssueModal:', err);
      });

      // Reset form state on open
      setForm({
        RequestTypeCode: 'INCIDENT',
        ServiceCategoryID: '',
        ServiceID: '',
        CategoryCode: '',
        TargetScope: (user?.TenantID || user?.tenantId) ? 'TENANT' : 'PARK_INTERNAL',
        TenantID: user?.TenantID || user?.tenantId || '',
        RequesterUserID: user?.UserID || user?.userId || 1,
        BuildingID: '',
        FloorID: '',
        OfficeSpaceID: '',
        Location: '',
        Title: '',
        Description: '',
        PriorityCode: 'MEDIUM',
        AssignedDepartmentID: user?.DepartmentID || '',
        IsMajorIncident: 0,
        EstimatedCost: 0
      });
      setAttachedFiles([]);
      setSelectedServiceMeta(null);
      setFieldErrors({});
      setServerError(null);
      setSuccessMsg(null);
    }
  }, [isOpen, propServices, user]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // ── Cascading Dropdown Calculations ───────────────────────────────────────────
  const availableFloors = useMemo(() => {
    if (!form.BuildingID) return floorsList;
    return floorsList.filter(f => String(f.BuildingID) === String(form.BuildingID));
  }, [floorsList, form.BuildingID]);

  const availableOffices = useMemo(() => {
    if (form.FloorID) {
      return officesList.filter(o => String(o.FloorID) === String(form.FloorID));
    }
    if (form.BuildingID) {
      const bFloorIds = availableFloors.map(f => String(f.FloorID));
      return officesList.filter(o => bFloorIds.includes(String(o.FloorID)));
    }
    return officesList;
  }, [officesList, form.FloorID, form.BuildingID, availableFloors]);

  const filteredServices = useMemo(() => {
    if (!form.ServiceCategoryID) return servicesList;
    return servicesList.filter(s => String(s.ServiceCategoryID) === String(form.ServiceCategoryID));
  }, [servicesList, form.ServiceCategoryID]);

  const activeCategoryObj = useMemo(() => {
    return categoriesList.find(c => String(c.ServiceCategoryID) === String(form.ServiceCategoryID));
  }, [categoriesList, form.ServiceCategoryID]);

  // ── Field Change Handlers ─────────────────────────────────────────────────────
  const handleFieldChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: null }));
    }
    if (serverError) {
      setServerError(null);
    }
  };

  const handleBuildingChange = (bId) => {
    setForm(prev => ({
      ...prev,
      BuildingID: bId,
      FloorID: '',
      OfficeSpaceID: ''
    }));
  };

  const handleFloorChange = (fId) => {
    setForm(prev => ({
      ...prev,
      FloorID: fId,
      OfficeSpaceID: ''
    }));
  };

  const handleCategorySelect = (categoryId) => {
    const found = categoriesList.find(c => String(c.ServiceCategoryID) === String(categoryId));
    setForm(prev => ({
      ...prev,
      ServiceCategoryID: categoryId,
      CategoryCode: found ? found.CategoryCode : '',
      AssignedDepartmentID: found?.RoutedDepartmentID || prev.AssignedDepartmentID,
      ServiceID: ''
    }));
    setSelectedServiceMeta(null);
    if (fieldErrors.ServiceCategoryID) {
      setFieldErrors(prev => ({ ...prev, ServiceCategoryID: null }));
    }
  };

  const handleServiceSelect = (serviceId) => {
    handleFieldChange('ServiceID', serviceId);
    if (!serviceId) {
      setSelectedServiceMeta(null);
      return;
    }
    const found = servicesList.find(s => String(s.ServiceID) === String(serviceId));
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
    const combined = [...attachedFiles, ...files];
    const check = fileSchemas.validateAttachments(combined);
    if (!check.isValid) {
      setFieldErrors(prev => ({ ...prev, Attachments: check.error }));
      return;
    }
    setAttachedFiles(combined);
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
      const combined = [...attachedFiles, ...files];
      const check = fileSchemas.validateAttachments(combined);
      if (!check.isValid) {
        setFieldErrors(prev => ({ ...prev, Attachments: check.error }));
        return;
      }
      setAttachedFiles(combined);
      if (fieldErrors.Attachments) {
        setFieldErrors(prev => ({ ...prev, Attachments: null }));
      }
    }
  };

  const handleRemoveFile = (index) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Submit Handler ────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

    const validation = requestSchemas.createIssueRequest(
      {
        ...form,
        Location: form.Location
      },
      attachedFiles
    );

    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      setServerError(t('issues.validationError', 'Please correct the highlighted fields before submitting.'));
      return;
    }

    setSubmitting(true);
    try {
      const currentUserId = user?.UserID || user?.userId || 1;
      const effectiveTenantId = (form.TargetScope === 'TENANT' && form.TenantID)
        ? Number(form.TenantID)
        : (isTenantRep ? Number(user?.TenantID || user?.tenantId) : null);

      const payload = {
        ServiceCategoryID: form.ServiceCategoryID ? Number(form.ServiceCategoryID) : null,
        ServiceID: form.ServiceID ? Number(form.ServiceID) : null,
        TenantID: effectiveTenantId,
        BuildingID: form.BuildingID ? Number(form.BuildingID) : null,
        OfficeSpaceID: form.OfficeSpaceID ? Number(form.OfficeSpaceID) : null,
        AssignedDepartmentID: form.AssignedDepartmentID ? Number(form.AssignedDepartmentID) : undefined,
        Title: validation.sanitized.Title,
        Description: validation.sanitized.Description,
        RequestTypeCode: form.RequestTypeCode || 'INCIDENT',
        PriorityCode: validation.sanitized.PriorityCode || 'MEDIUM',
        CategoryCode: form.CategoryCode || activeCategoryObj?.CategoryCode || 'GENERAL',
        RequesterUserID: Number(form.RequesterUserID || currentUserId),
        IsMajorIncident: form.IsMajorIncident ? 1 : 0,
        EstimatedCost: form.EstimatedCost ? Number(form.EstimatedCost) : 0,
        CustomFieldsDataJson: form.Location ? { specificLocation: form.Location } : null
      };

      const res = await issueManagementApi.createIssue(payload);
      const createdData = res.data?.data || {};
      const newIssueId = createdData.IssueRequestID || createdData.id || createdData;

      // Upload attached files if any
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

      setSuccessMsg(t('issues.requestCreatedSuccess', 'Service request submitted successfully!'));
      setTimeout(() => {
        onCreated?.(res.data || res);
        onIssueCreated?.(res.data || res);
        onClose();
      }, 900);
    } catch (err) {
      setServerError(err.response?.data?.message || 'Failed to submit issue request');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Identity labels
  const fName = user?.FirstName || user?.firstName || '';
  const lName = user?.LastName || user?.lastName || '';
  const requesterFullName = (fName || lName) ? `${fName} ${lName}`.trim() : (user?.Username || user?.username || 'Current User');

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--modal-backdrop, rgba(16, 20, 24, 0.82))',
        backdropFilter: 'blur(12px)',
        padding: 'clamp(8px, 2.5vw, 20px)'
      }}
      onClick={onClose}
    >
      <div
        className="modal-card enterprise-card accent-strip-brand"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-issue-title"
        style={{
          width: '100%', maxWidth: '820px', maxHeight: '92vh',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          borderRadius: 'var(--border-radius-lg, 18px)', padding: '0',
          background: 'var(--color-surface, var(--bg-secondary))',
          boxShadow: 'var(--shadow-xl, 0 25px 50px -12px rgba(0, 0, 0, 0.5))'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header (Pinned) ────────────────────────────────────────── */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--glass-border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'var(--bg-tertiary)', flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              background: 'var(--accent-gradient)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: '#ffffff',
              boxShadow: 'var(--glow-accent)', flexShrink: 0
            }}>
              <Plus size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--accent-primary)' }}>
                {t('issues.modalSubHeader', 'Enterprise ITMS Service Desk')}
              </div>
              <h2 id="create-issue-title" style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.3px', margin: '2px 0 0', color: 'var(--text-primary)' }}>
                {t('issues.submitServiceRequest', 'Submit New Service Request')}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn-icon touch-target-sm"
            style={{ borderRadius: '8px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            aria-label={t('common.close', 'Close')}
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Requester Banner (Compact) ──────────────────────────────────── */}
        <div style={{
          padding: '10px 24px', background: 'rgba(255, 255, 255, 0.02)',
          borderBottom: '1px solid var(--glass-border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontSize: '0.78rem', color: 'var(--text-muted)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={14} color="var(--accent-primary)" />
            <span>Requester: <strong style={{ color: 'var(--text-primary)' }}>{requesterFullName}</strong></span>
            <span style={{ color: 'var(--glass-border)' }}>|</span>
            <span>Role: <strong style={{ color: 'var(--accent-secondary)' }}>
              {isSuperAdmin ? 'Administrator' : isDeptManager ? 'Manager' : isTech ? 'Technician' : isTenantRep ? 'Tenant Representative' : 'Employee'}
            </strong></span>
          </div>

          {isTenantRep && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#10b981', fontWeight: 700 }}>
              <Building2 size={13} /> {user?.TenantName || user?.tenantName || 'Tenant Organization'}
            </span>
          )}
        </div>

        {/* ── Modal Body (Scrollable Form) ─────────────────────────────────── */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
            
            {/* Status Feedback */}
            {successMsg && (
              <div style={{ padding: '14px 18px', borderRadius: '10px', background: 'rgba(74, 222, 128, 0.15)', border: '1px solid rgba(74, 222, 128, 0.3)', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', fontWeight: 600 }}>
                <CheckCircle2 size={18} />
                <span>{successMsg}</span>
              </div>
            )}
            {serverError && (
              <div style={{ padding: '14px 18px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', fontWeight: 600 }}>
                <AlertCircle size={18} />
                <span>{serverError}</span>
              </div>
            )}

            {/* Scope Switcher (Admins & Managers) */}
            {(isSuperAdmin || isDeptManager) && (
              <div style={{ padding: '14px', borderRadius: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent-primary)', letterSpacing: '0.5px' }}>
                    Entity Scope & Client Affiliation
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => handleFieldChange('TargetScope', 'TENANT')}
                      style={{
                        padding: '4px 10px', borderRadius: '6px', cursor: 'pointer',
                        border: form.TargetScope === 'TENANT' ? '1.5px solid var(--accent-primary)' : '1px solid var(--glass-border)',
                        background: form.TargetScope === 'TENANT' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                        color: form.TargetScope === 'TENANT' ? 'var(--text-primary)' : 'var(--text-muted)',
                        fontSize: '0.75rem', fontWeight: 700
                      }}
                    >
                      🏢 Tenant Company
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleFieldChange('TargetScope', 'PARK_INTERNAL');
                        handleFieldChange('TenantID', '');
                      }}
                      style={{
                        padding: '4px 10px', borderRadius: '6px', cursor: 'pointer',
                        border: form.TargetScope === 'PARK_INTERNAL' ? '1.5px solid var(--accent-primary)' : '1px solid var(--glass-border)',
                        background: form.TargetScope === 'PARK_INTERNAL' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                        color: form.TargetScope === 'PARK_INTERNAL' ? 'var(--text-primary)' : 'var(--text-muted)',
                        fontSize: '0.75rem', fontWeight: 700
                      }}
                    >
                      🏞️ Park Operations
                    </button>
                  </div>
                </div>

                {form.TargetScope === 'TENANT' && (
                  <select
                    id="ModalTenantID"
                    value={form.TenantID}
                    onChange={(e) => handleFieldChange('TenantID', e.target.value)}
                    className="enterprise-input"
                  >
                    <option value="">-- Select Client Tenant Company --</option>
                    {tenantsList.map(tnt => (
                      <option key={tnt.TenantID} value={tnt.TenantID}>
                        🏢 {tnt.CompanyName} ({tnt.TenantCode || `TNT #${tnt.TenantID}`})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Request Classification (Pill Badges) */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-primary)' }}>
                {t('issues.requestType', 'Request Classification')} <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                {[
                  { code: 'INCIDENT', label: 'Incident', icon: Sparkles },
                  { code: 'SERVICE_REQUEST', label: 'Service Request', icon: FileText },
                  { code: 'MAINTENANCE', label: 'Maintenance', icon: Wrench },
                  { code: 'DISRUPTION', label: 'Outage', icon: Flame },
                  { code: 'COMPLAINT', label: 'Complaint', icon: AlertCircle }
                ].map(item => {
                  const isSel = form.RequestTypeCode === item.code;
                  const IconComp = item.icon;
                  return (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => handleFieldChange('RequestTypeCode', item.code)}
                      style={{
                        padding: '9px 12px', borderRadius: '8px', cursor: 'pointer',
                        border: isSel ? '2px solid var(--accent-primary)' : '1px solid var(--glass-border)',
                        background: isSel ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-tertiary)',
                        color: isSel ? 'var(--text-primary)' : 'var(--text-muted)',
                        fontSize: '0.8rem', fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <IconComp size={14} color={isSel ? 'var(--accent-primary)' : 'var(--text-muted)'} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <FormField
              label={t('issues.requestTitle', 'Issue Title / Subject')}
              id="ModalTitle"
              required
              icon={Sparkles}
              error={fieldErrors.Title}
              helpText={`${form.Title.length}/255 characters.`}
            >
              <input
                id="ModalTitle"
                type="text"
                maxLength={255}
                value={form.Title}
                onChange={(e) => handleFieldChange('Title', e.target.value)}
                placeholder={t('issues.titlePlaceholder', 'e.g. Core fiber link down in Block B data center')}
                className={`enterprise-input ${fieldErrors.Title ? 'input-error' : ''}`}
              />
            </FormField>

            {/* Description */}
            <FormField
              label={t('issues.descriptionDetails', 'Detailed Problem Description')}
              id="ModalDescription"
              required
              icon={FileText}
              error={fieldErrors.Description}
              helpText={`${form.Description.length}/2000 characters (min 10).`}
            >
              <textarea
                id="ModalDescription"
                rows={3}
                maxLength={2000}
                value={form.Description}
                onChange={(e) => handleFieldChange('Description', e.target.value)}
                placeholder={t('issues.descPlaceholder', 'Describe the exact symptoms, impacted offices, and observed behavior...')}
                className={`enterprise-input ${fieldErrors.Description ? 'input-error' : ''}`}
                style={{ resize: 'vertical' }}
              />
            </FormField>

            {/* Location (Building, Floor, Office) */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-primary)' }}>
                {t('issues.locationSectionTitle', 'Campus Physical Location')}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                <select
                  value={form.BuildingID}
                  onChange={(e) => handleBuildingChange(e.target.value)}
                  className="enterprise-input"
                >
                  <option value="">-- Campus Building --</option>
                  {buildingsList.map(b => (
                    <option key={b.BuildingID} value={b.BuildingID}>🏛️ {b.BuildingName}</option>
                  ))}
                </select>

                <select
                  value={form.FloorID}
                  onChange={(e) => handleFloorChange(e.target.value)}
                  disabled={!form.BuildingID && availableFloors.length === 0}
                  className="enterprise-input"
                >
                  <option value="">-- Floor Level --</option>
                  {availableFloors.map(f => (
                    <option key={f.FloorID} value={f.FloorID}>📶 {f.FloorName}</option>
                  ))}
                </select>

                <select
                  value={form.OfficeSpaceID}
                  onChange={(e) => handleFieldChange('OfficeSpaceID', e.target.value)}
                  className="enterprise-input"
                >
                  <option value="">-- Office / Suite --</option>
                  {availableOffices.map(o => (
                    <option key={o.OfficeSpaceID} value={o.OfficeSpaceID}>🚪 {o.OfficeName} ({o.OfficeNumber})</option>
                  ))}
                </select>
              </div>

              <input
                type="text"
                value={form.Location}
                onChange={(e) => handleFieldChange('Location', e.target.value)}
                placeholder="Specific Room, Desk, Corridor, or Landmark (e.g. Room 204, rack #2)"
                className="enterprise-input"
                style={{ marginTop: '8px' }}
              />
            </div>

            {/* Service Category & Item */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
              <div>
                <FormField
                  label={t('issues.category', 'Service Category')}
                  id="ModalServiceCategoryID"
                  required
                  icon={Layers}
                  error={fieldErrors.ServiceCategoryID}
                >
                  <select
                    id="ModalServiceCategoryID"
                    value={form.ServiceCategoryID}
                    onChange={(e) => handleCategorySelect(e.target.value)}
                    className={`enterprise-input ${fieldErrors.ServiceCategoryID ? 'input-error' : ''}`}
                  >
                    <option value="">-- Select Category --</option>
                    {categoriesList.map(c => (
                      <option key={c.ServiceCategoryID} value={c.ServiceCategoryID}>
                        📂 {c.CategoryName} ({c.CategoryCode}){c.RoutedDepartmentName ? ` → ${c.RoutedDepartmentName}` : ''}
                      </option>
                    ))}
                  </select>
                </FormField>

                {activeCategoryObj?.RoutedDepartmentName && (
                  <div style={{ marginTop: '6px', fontSize: '0.75rem', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Building2 size={13} />
                    <span>Auto-Routed to: <strong>{activeCategoryObj.RoutedDepartmentName}</strong></span>
                  </div>
                )}
              </div>

              <div>
                <FormField
                  label={t('issues.serviceItemOptional', 'Catalog Service Offering (Optional)')}
                  id="ModalServiceID"
                  icon={FileText}
                >
                  <select
                    id="ModalServiceID"
                    value={form.ServiceID}
                    onChange={(e) => handleServiceSelect(e.target.value)}
                    className="enterprise-input"
                  >
                    <option value="">-- Free-form / None --</option>
                    {filteredServices.map(s => (
                      <option key={s.ServiceID} value={s.ServiceID}>
                        ⚙️ {s.ServiceName}
                      </option>
                    ))}
                  </select>
                </FormField>

                {selectedServiceMeta && (
                  <div style={{ marginTop: '6px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    ⏱️ SLA: {selectedServiceMeta.SLATargetHours || 24}h · Cost: {selectedServiceMeta.EstimatedCost ? `${selectedServiceMeta.EstimatedCost} ${selectedServiceMeta.CurrencyCode || 'ETB'}` : 'Standard'}
                  </div>
                )}
              </div>
            </div>

            {/* Urgency & Priority */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-primary)' }}>
                {t('issues.urgencyPriority', 'SLA Urgency & Priority')} <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
                {[
                  { code: 'LOW', label: 'Low', sla: '48h SLA', color: '#94a3b8' },
                  { code: 'MEDIUM', label: 'Medium', sla: '24h SLA', color: '#38bdf8' },
                  { code: 'HIGH', label: 'High', sla: '8h SLA', color: '#facc15' },
                  { code: 'CRITICAL', label: 'Critical', sla: '2h SLA', color: '#f87171' }
                ].map(p => {
                  const isSel = form.PriorityCode === p.code;
                  return (
                    <button
                      key={p.code}
                      type="button"
                      onClick={() => handleFieldChange('PriorityCode', p.code)}
                      style={{
                        padding: '10px 12px', borderRadius: '8px', cursor: 'pointer',
                        border: isSel ? `2px solid ${p.color}` : '1px solid var(--glass-border)',
                        background: isSel ? `${p.color}18` : 'var(--bg-tertiary)',
                        color: isSel ? p.color : 'var(--text-secondary)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span style={{ fontSize: '0.86rem', fontWeight: 800 }}>{p.label}</span>
                      <span style={{ fontSize: '0.68rem', color: isSel ? p.color : 'var(--text-muted)' }}>{p.sla}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Admin Override: Department & Major Incident */}
            {(isSuperAdmin || isDeptManager) && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', paddingTop: '8px', borderTop: '1px dashed var(--glass-border)' }}>
                <FormField
                  label={t('issues.assignedDeptOverride', 'Manual Department Override')}
                  id="ModalAssignedDepartmentID"
                  icon={Building2}
                >
                  <select
                    id="ModalAssignedDepartmentID"
                    value={form.AssignedDepartmentID}
                    onChange={(e) => handleFieldChange('AssignedDepartmentID', e.target.value)}
                    className="enterprise-input"
                  >
                    <option value="">-- Default Auto-Routing --</option>
                    {departmentsList.map(d => (
                      <option key={d.DepartmentID} value={d.DepartmentID}>🏢 {d.DepartmentName}</option>
                    ))}
                  </select>
                </FormField>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '22px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.84rem', fontWeight: 700, color: form.IsMajorIncident ? '#ef4444' : 'var(--text-secondary)' }}>
                    <input
                      type="checkbox"
                      checked={form.IsMajorIncident === 1}
                      onChange={(e) => handleFieldChange('IsMajorIncident', e.target.checked ? 1 : 0)}
                      style={{ accentColor: '#ef4444', width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <Flame size={15} color="#ef4444" />
                    <span>{t('issues.flagMajorIncident', 'Flag as Major Incident')}</span>
                  </label>
                </div>
              </div>
            )}

            {/* Supporting Attachments */}
            <div style={{ borderTop: '1px dashed var(--glass-border)', paddingTop: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-primary)' }}>
                {t('issues.attachmentsTitle', 'Attach Supporting Files & Diagnostics')}
              </label>

              <input
                type="file"
                multiple
                ref={fileInputRef}
                onChange={handleFileChange}
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
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileInputRef.current?.click()}
                style={{
                  padding: '18px', borderRadius: '10px', border: '1.5px dashed var(--glass-border)',
                  background: 'var(--bg-tertiary)', textAlign: 'center', cursor: 'pointer'
                }}
              >
                <Upload size={18} color="var(--accent-primary)" style={{ margin: '0 auto 6px' }} />
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {t('issues.dragDropBrowse', 'Browse files or drag & drop here')}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Images, PDFs, logs (up to 5 files, 10MB each)
                </div>
              </div>

              {attachedFiles.length > 0 && (
                <div style={{ marginTop: '10px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
                  {attachedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-tertiary)',
                        border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between', fontSize: '0.8rem', gap: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                        <FileText size={14} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
                        <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>
                          {file.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleRemoveFile(idx); }}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Modal Footer (Pinned) ────────────────────────────────────────── */}
          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--glass-border)',
            background: 'var(--bg-tertiary)',
            display: 'flex', justifyContent: 'flex-end', gap: '12px',
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
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 800 }}
            >
              <Plus size={16} />
              {submitting ? t('issues.submitting', 'Submitting...') : t('issues.submitBtn', 'Submit Request')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateIssueModal;
