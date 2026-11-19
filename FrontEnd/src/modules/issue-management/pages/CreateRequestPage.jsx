import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  LifeBuoy, ArrowLeft, Upload, Paperclip, CheckCircle2, FileText,
  Trash2, Shield, Clock, Plus, AlertCircle, ChevronRight, X,
  Building2, User, Layers, ShieldCheck, Lock, Mail, Phone, Sparkles,
  AlertTriangle, MapPin, Wrench, Flame, HelpCircle, Check, Briefcase,
  Sliders, Info, Tag
} from 'lucide-react';
import issueManagementApi from '../api/issueManagementApi';
import serviceCatalogApi from '../../service-catalog/api/serviceCatalogApi';
import fileDocumentApi from '../../file-document/api/fileDocumentApi';
import orgApi from '../../organization/api/orgApi';
import parkApi from '../../business-park/api/parkApi';
import tenantApi from '../../tenant/api/tenantApi';
import { usePermissionContext } from '../../role-permission-management/contexts/PermissionContext';
import { requestSchemas, fileSchemas } from '../../../validation';
import { FormField } from '../../../components/common/FormField';
import { useTranslation } from '../../../i18n';

export default function CreateRequestPage() {
  const { t, isRTL } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialServiceId = searchParams.get('serviceId') || '';

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
  const isInternalStaff = !isTenantRep;

  // ── Async Metadata Lists ──────────────────────────────────────────────────────
  const [businessPark, setBusinessPark] = useState(null);
  const [categoriesList, setCategoriesList] = useState([]);
  const [servicesList, setServicesList] = useState([]);
  const [buildingsList, setBuildingsList] = useState([]);
  const [floorsList, setFloorsList] = useState([]);
  const [officesList, setOfficesList] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [tenantsList, setTenantsList] = useState([]);
  const [loadingMetadata, setLoadingMetadata] = useState(true);

  // ── Form State ────────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    // Request Classification
    RequestTypeCode: 'INCIDENT',
    ServiceCategoryID: '',
    ServiceID: initialServiceId,
    CategoryCode: '',

    // Scope & Requester
    TargetScope: isTenantRep ? 'TENANT' : 'PARK_INTERNAL',
    TenantID: user?.TenantID || user?.tenantId || '',
    RequesterUserID: user?.UserID || user?.userId || 1,

    // Campus Physical Location
    BuildingID: '',
    FloorID: '',
    OfficeSpaceID: '',
    Location: '',

    // Issue Content
    Title: '',
    Description: '',
    PriorityCode: 'MEDIUM',

    // Governance & Dispatch
    AssignedDepartmentID: user?.DepartmentID || '',
    IsMajorIncident: 0,
    EstimatedCost: 0
  });

  const [selectedService, setSelectedService] = useState(null);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const fileInputRef = useRef(null);

  // ── Load All System Metadata ──────────────────────────────────────────────────
  useEffect(() => {
    setLoadingMetadata(true);
    Promise.all([
      parkApi.getParks().catch(() => ({ data: { data: [] } })),
      serviceCatalogApi.getCategories().catch(() => ({ data: { data: [] } })),
      serviceCatalogApi.getServices().catch(() => ({ data: { data: { services: [] } } })),
      parkApi.getBuildings({ limit: 100 }).catch(() => ({ data: { data: [] } })),
      parkApi.getFloors({ limit: 300 }).catch(() => ({ data: { data: [] } })),
      parkApi.getOffices({ limit: 500 }).catch(() => ({ data: { data: [] } })),
      orgApi.getDepartments({ limit: 100 }).catch(() => ({ data: { data: [] } })),
      tenantApi.getTenants({ limit: 200 }).catch(() => ({ data: { data: [] } }))
    ])
      .then(([pkRes, catRes, svcRes, bldRes, flrRes, ofcRes, deptRes, tntRes]) => {
        const parks = pkRes.data?.data?.parks || pkRes.data?.data || [];
        if (Array.isArray(parks) && parks.length > 0) setBusinessPark(parks[0]);

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

        if (initialServiceId) {
          const found = (Array.isArray(svcs) ? svcs : []).find(s => String(s.ServiceID) === String(initialServiceId));
          if (found) {
            setSelectedService(found);
            setForm(prev => ({
              ...prev,
              ServiceID: found.ServiceID,
              ServiceCategoryID: found.ServiceCategoryID ? String(found.ServiceCategoryID) : prev.ServiceCategoryID,
              CategoryCode: found.CategoryCode || prev.CategoryCode,
              EstimatedCost: found.EstimatedCost ? Number(found.EstimatedCost) : prev.EstimatedCost
            }));
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load metadata in CreateRequestPage:', err);
      })
      .finally(() => {
        setLoadingMetadata(false);
      });
  }, [initialServiceId]);

  // Sync user context when profile loads
  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        TenantID: user.TenantID || user.tenantId || prev.TenantID,
        RequesterUserID: user.UserID || user.userId || prev.RequesterUserID,
        TargetScope: (user.TenantID || user.tenantId) ? 'TENANT' : prev.TargetScope,
        AssignedDepartmentID: prev.AssignedDepartmentID || user.DepartmentID || ''
      }));
    }
  }, [user]);

  // ── Cascading Location Dropdowns ──────────────────────────────────────────────
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

  // Filtered services by category
  const filteredServices = useMemo(() => {
    if (!form.ServiceCategoryID) return servicesList;
    return servicesList.filter(s => String(s.ServiceCategoryID) === String(form.ServiceCategoryID));
  }, [servicesList, form.ServiceCategoryID]);

  // Detected mapped department for active category
  const activeCategoryObj = useMemo(() => {
    return categoriesList.find(c => String(c.ServiceCategoryID) === String(form.ServiceCategoryID));
  }, [categoriesList, form.ServiceCategoryID]);

  // ── Form Input Handlers ───────────────────────────────────────────────────────
  const handleInputChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: null }));
    }
    if (error) setError(null);
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

  const handleCategorySelect = (cId) => {
    const foundCat = categoriesList.find(c => String(c.ServiceCategoryID) === String(cId));
    setForm(prev => ({
      ...prev,
      ServiceCategoryID: cId,
      ServiceID: '',
      CategoryCode: foundCat ? foundCat.CategoryCode : '',
      AssignedDepartmentID: foundCat?.RoutedDepartmentID || prev.AssignedDepartmentID
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
      ServiceCategoryID: found ? (found.ServiceCategoryID ? String(found.ServiceCategoryID) : prev.ServiceCategoryID) : prev.ServiceCategoryID,
      CategoryCode: found ? (found.CategoryCode || prev.CategoryCode) : prev.CategoryCode,
      EstimatedCost: found?.EstimatedCost ? Number(found.EstimatedCost) : prev.EstimatedCost
    }));
    setFormErrors(prev => ({ ...prev, ServiceID: null, ServiceCategoryID: null }));
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

  // ── Form Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setError(null);
    setFormErrors({});

    const validation = requestSchemas.createIssueRequest(
      {
        ...form,
        Location: form.Location
      },
      attachedFiles
    );

    if (!validation.isValid) {
      setFormErrors(validation.errors);
      setError(t('issues.validationError', 'Please review the highlighted fields before submitting.'));
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
      const createdIssue = res.data?.data;
      const issueId = createdIssue?.IssueRequestID || createdIssue?.id;

      // Upload attached files to File & Document Management
      if (attachedFiles.length > 0 && issueId) {
        for (const file of attachedFiles) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('title', `${form.Title} - Attachment`);
          formData.append('entityRefType', 'ISSUE_REQUEST');
          formData.append('entityRefId', issueId);
          formData.append('tags', 'issue_attachment, request');
          try {
            await fileDocumentApi.uploadFile(formData);
          } catch (fileErr) {
            console.warn('File upload failed:', fileErr);
          }
        }
      }

      setSuccessMsg(t('issues.requestCreatedSuccess', 'Your service request has been submitted successfully! Redirecting...'));
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

  // Requester identity displays
  const fName = user?.FirstName || user?.firstName || '';
  const lName = user?.LastName || user?.lastName || '';
  const requesterFullName = (fName || lName) ? `${fName} ${lName}`.trim() : (user?.Username || user?.username || 'Current User');
  const userIdDisplay = user?.UserID || user?.userId || 'N/A';
  const businessParkName = businessPark?.BusinessParkName || 'Ethiopian IT Park';
  const tenantNameDisplay = user?.TenantName || user?.tenantName || user?.CompanyName || null;
  const deptNameDisplay = user?.DepartmentName || user?.departmentName || null;

  return (
    <div style={{ maxWidth: '1020px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '60px' }}>
      
      {/* ── Page Header ────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <button
            type="button"
            onClick={() => navigate('/issues/my-requests')}
            style={{
              background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', fontWeight: 600, marginBottom: '6px',
              padding: 0
            }}
          >
            <ArrowLeft size={16} style={{ transform: isRTL ? 'rotate(180deg)' : 'none' }} />
            {t('issues.backToRequests', 'Back to My Requests')}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0, letterSpacing: '-0.4px', color: 'var(--text-primary)' }}>
              {t('issues.createIssue', 'Create New Service Request')}
            </h1>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              padding: '3px 10px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700,
              background: isSuperAdmin ? 'rgba(239, 68, 68, 0.15)' : isDeptManager ? 'rgba(59, 130, 246, 0.15)' : isTenantRep ? 'rgba(16, 185, 129, 0.15)' : 'rgba(139, 92, 246, 0.15)',
              color: isSuperAdmin ? '#ef4444' : isDeptManager ? '#3b82f6' : isTenantRep ? '#10b981' : '#8b5cf6',
              border: `1px solid ${isSuperAdmin ? '#ef444430' : isDeptManager ? '#3b82f630' : isTenantRep ? '#10b98130' : '#8b5cf630'}`
            }}>
              <ShieldCheck size={12} />
              {isSuperAdmin ? 'Super Administrator' : isDeptManager ? 'Department Manager' : isTech ? 'Technician' : isTenantRep ? 'Tenant Representative' : 'Park Employee'}
            </span>
          </div>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            {t('issues.createSubtitle', 'Submit a formal ticket for facility repair, telecom engineering, electrical maintenance, or tenant services.')}
          </p>
        </div>
      </div>

      {/* ── Requester Profile Context Card ────────────────────────────────────── */}
      <div className="glass-panel" style={{
        padding: '20px 24px',
        borderRadius: 'var(--border-radius-lg, 16px)',
        border: '1px solid var(--glass-border)',
        background: 'var(--glass-bg)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px',
        alignItems: 'center'
      }}>
        {/* Requester Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px', height: '46px', borderRadius: '14px',
            background: 'var(--accent-gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, flexShrink: 0,
            boxShadow: 'var(--glow-accent)'
          }}>
            <User size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {t('issues.requesterCard', 'Requester Profile')}
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {requesterFullName}
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--accent-primary)', fontWeight: 700 }}>
              User ID: #{userIdDisplay}
            </div>
          </div>
        </div>

        {/* Affiliation / Tenant / Department */}
        <div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {isTenantRep ? t('nav.tenants', 'Client Organization') : t('organization.department', 'Assigned Department')}
          </div>
          <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
            {isTenantRep ? (
              <>
                <Building2 size={16} color="#10b981" />
                <span>{tenantNameDisplay || 'Authorized Tenant Company'}</span>
              </>
            ) : (
              <>
                <Briefcase size={16} color="#60a5fa" />
                <span>{deptNameDisplay || 'Ethiopian IT Park Staff'}</span>
              </>
            )}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            🏞️ {businessParkName}
          </div>
        </div>

        {/* Contact Info */}
        <div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {t('issues.contactDetails', 'Contact & Verification')}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail size={13} color="var(--text-muted)" />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.Email || user?.email || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Phone size={13} color="var(--text-muted)" />
              <span>{user?.PhoneNumber || user?.phoneNumber || '+251-11-667-0000'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Status Alerts ──────────────────────────────────────────────────────── */}
      {successMsg && (
        <div style={{ padding: '16px 20px', borderRadius: '12px', background: 'rgba(74, 222, 128, 0.15)', border: '1px solid rgba(74, 222, 128, 0.3)', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.92rem', fontWeight: 600 }}>
          <CheckCircle2 size={22} />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div style={{ padding: '16px 20px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.92rem', fontWeight: 600 }}>
          <AlertCircle size={22} />
          <span>{error}</span>
        </div>
      )}

      {/* ── Main Form Container ────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="enterprise-card accent-strip-brand" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* ── SECTION 1: Scope & Organization Selection (Admin & Dept Manager) ── */}
        {(isSuperAdmin || isDeptManager) && (
          <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '24px' }}>
            <div className="form-section-header" style={{ marginBottom: '16px' }}>
              <span className="form-section-number">1</span>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {t('issues.scopeSectionTitle', 'Request Scope & Client Affiliation')}
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {t('issues.scopeSectionDesc', 'Designate whether this request is for an external tenant company or internal campus facility operations.')}
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
              {/* Scope Switcher */}
              <FormField
                label={t('issues.scopeType', 'Target Entity Scope')}
                id="TargetScope"
                required
                icon={Briefcase}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => handleInputChange('TargetScope', 'TENANT')}
                    style={{
                      padding: '11px 14px', borderRadius: '8px', cursor: 'pointer',
                      border: form.TargetScope === 'TENANT' ? '2px solid var(--accent-primary)' : '1px solid var(--glass-border)',
                      background: form.TargetScope === 'TENANT' ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-tertiary)',
                      color: form.TargetScope === 'TENANT' ? 'var(--text-primary)' : 'var(--text-muted)',
                      fontWeight: 700, fontSize: '0.86rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Building2 size={16} color={form.TargetScope === 'TENANT' ? 'var(--accent-primary)' : 'var(--text-muted)'} />
                    <span>🏢 Tenant Client</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleInputChange('TargetScope', 'PARK_INTERNAL');
                      handleInputChange('TenantID', '');
                    }}
                    style={{
                      padding: '11px 14px', borderRadius: '8px', cursor: 'pointer',
                      border: form.TargetScope === 'PARK_INTERNAL' ? '2px solid var(--accent-primary)' : '1px solid var(--glass-border)',
                      background: form.TargetScope === 'PARK_INTERNAL' ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-tertiary)',
                      color: form.TargetScope === 'PARK_INTERNAL' ? 'var(--text-primary)' : 'var(--text-muted)',
                      fontWeight: 700, fontSize: '0.86rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Shield size={16} color={form.TargetScope === 'PARK_INTERNAL' ? 'var(--accent-primary)' : 'var(--text-muted)'} />
                    <span>🏞️ Park Facility</span>
                  </button>
                </div>
              </FormField>

              {/* Tenant Dropdown (Conditional) */}
              {form.TargetScope === 'TENANT' && (
                <FormField
                  label={t('issues.selectTenant', 'Tenant Organization')}
                  id="TenantID"
                  required
                  icon={Building2}
                  error={formErrors.TenantID}
                  helpText={t('issues.selectTenantHelp', 'Select the client company raising or impacted by this issue.')}
                >
                  <select
                    id="TenantID"
                    value={form.TenantID}
                    onChange={(e) => handleInputChange('TenantID', e.target.value)}
                    className={`enterprise-input ${formErrors.TenantID ? 'input-error' : ''}`}
                  >
                    <option value="">-- {t('issues.chooseTenant', 'Select Tenant Organization')} --</option>
                    {tenantsList.map(tnt => (
                      <option key={tnt.TenantID} value={tnt.TenantID}>
                        🏢 {tnt.CompanyName} ({tnt.TenantCode || `TNT #${tnt.TenantID}`})
                      </option>
                    ))}
                  </select>
                </FormField>
              )}
            </div>
          </div>
        )}

        {/* ── SECTION 2: Campus Premises & Location ───────────────────────────── */}
        <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '24px' }}>
          <div className="form-section-header" style={{ marginBottom: '16px' }}>
            <span className="form-section-number">{(isSuperAdmin || isDeptManager) ? '2' : '1'}</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {t('issues.locationSectionTitle', 'Campus Physical Location & Premises')}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {t('issues.locationSectionDesc', 'Specify the exact building, floor level, and office space where maintenance is required.')}
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            {/* Building */}
            <FormField
              label={t('issues.buildingLabel', 'Campus Building / Complex')}
              id="BuildingID"
              icon={Building2}
              error={formErrors.BuildingID}
              helpText={t('issues.buildingHelp', 'Select building location within Ethiopian IT Park.')}
            >
              <select
                id="BuildingID"
                value={form.BuildingID}
                onChange={(e) => handleBuildingChange(e.target.value)}
                className="enterprise-input"
              >
                <option value="">-- {t('issues.allBuildings', 'Select Building')} --</option>
                {buildingsList.map(b => (
                  <option key={b.BuildingID} value={b.BuildingID}>
                    🏛️ {b.BuildingName} ({b.BuildingCode})
                  </option>
                ))}
              </select>
            </FormField>

            {/* Floor / Level (Cascading) */}
            <FormField
              label={t('issues.floorLabel', 'Floor / Level')}
              id="FloorID"
              icon={Layers}
              error={formErrors.FloorID}
              helpText={t('issues.floorHelp', 'Select floor within chosen building.')}
            >
              <select
                id="FloorID"
                value={form.FloorID}
                onChange={(e) => handleFloorChange(e.target.value)}
                disabled={!form.BuildingID && availableFloors.length === 0}
                className="enterprise-input"
              >
                <option value="">-- {t('issues.allFloors', 'Select Floor / Level')} --</option>
                {availableFloors.map(f => (
                  <option key={f.FloorID} value={f.FloorID}>
                    📶 {f.FloorName} ({f.FloorCode || `Level ${f.FloorNumber}`})
                  </option>
                ))}
              </select>
            </FormField>

            {/* Office / Suite / Space (Cascading) */}
            <FormField
              label={t('issues.officeLabel', 'Office Suite / Room Unit')}
              id="OfficeSpaceID"
              icon={MapPin}
              error={formErrors.OfficeSpaceID}
              helpText={t('issues.officeHelp', 'Select office suite or room.')}
            >
              <select
                id="OfficeSpaceID"
                value={form.OfficeSpaceID}
                onChange={(e) => handleInputChange('OfficeSpaceID', e.target.value)}
                className="enterprise-input"
              >
                <option value="">-- {t('issues.allOffices', 'Select Office Unit / Room')} --</option>
                {availableOffices.map(o => (
                  <option key={o.OfficeSpaceID} value={o.OfficeSpaceID}>
                    🚪 {o.OfficeName} ({o.OfficeNumber})
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          {/* Specific Location Landmark / Desk Notes */}
          <div style={{ marginTop: '16px' }}>
            <FormField
              label={t('issues.specificLocation', 'Specific Room, Desk, Corridor, or Landmark')}
              id="Location"
              icon={MapPin}
              error={formErrors.Location}
              helpText={t('issues.specificLocationHelp', 'Optional: e.g. "North wing near elevator #2", "Conference Room B", "Data rack #04"')}
            >
              <input
                id="Location"
                type="text"
                value={form.Location}
                onChange={(e) => handleInputChange('Location', e.target.value)}
                placeholder="e.g. 3rd floor west wing, server rack 4-B, meeting room 302"
                className="enterprise-input"
              />
            </FormField>
          </div>
        </div>

        {/* ── SECTION 3: Classification & Service Domain ──────────────────────── */}
        <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '24px' }}>
          <div className="form-section-header" style={{ marginBottom: '16px' }}>
            <span className="form-section-number">{(isSuperAdmin || isDeptManager) ? '3' : '2'}</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {t('issues.classificationTitle', 'Request Classification & Service Domain')}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {t('issues.classificationDesc', 'Identify the type of request and select the service catalog domain for automatic departmental routing.')}
              </p>
            </div>
          </div>

          {/* Request Type Selector (Interactive Pills) */}
          <FormField
            label={t('issues.requestType', 'Request Classification')}
            id="RequestTypeCode"
            required
            icon={Tag}
            error={formErrors.RequestTypeCode}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px' }}>
              {[
                { code: 'INCIDENT', label: 'Incident / Defect', icon: Sparkles, desc: 'Break/fix or malfunction' },
                { code: 'SERVICE_REQUEST', label: 'Service Request', icon: FileText, desc: 'New setup, access, or provisioning' },
                { code: 'MAINTENANCE', label: 'Maintenance', icon: Wrench, desc: 'Routine or preventive upkeep' },
                { code: 'DISRUPTION', label: 'Utility Disruption', icon: Flame, desc: 'Power, cooling, or water outage' },
                { code: 'COMPLAINT', label: 'Service Complaint', icon: AlertCircle, desc: 'Quality or facility grievance' }
              ].map(tType => {
                const isSel = form.RequestTypeCode === tType.code;
                const IconComp = tType.icon;
                return (
                  <div
                    key={tType.code}
                    onClick={() => handleInputChange('RequestTypeCode', tType.code)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleInputChange('RequestTypeCode', tType.code)}
                    style={{
                      padding: '12px 14px', borderRadius: '10px', cursor: 'pointer',
                      border: isSel ? '2px solid var(--accent-primary)' : '1px solid var(--glass-border)',
                      background: isSel ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-tertiary)',
                      display: 'flex', flexDirection: 'column', gap: '4px',
                      transition: 'all 0.18s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <IconComp size={16} color={isSel ? 'var(--accent-primary)' : 'var(--text-muted)'} />
                      <span style={{ fontSize: '0.86rem', fontWeight: 700, color: isSel ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                        {tType.label}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                      {tType.desc}
                    </span>
                  </div>
                );
              })}
            </div>
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginTop: '16px' }}>
            {/* Service Category */}
            <div>
              <FormField
                label={t('issues.category', 'Service Category')}
                id="ServiceCategoryID"
                required
                icon={Layers}
                error={formErrors.ServiceCategoryID}
                helpText={t('issues.selectDomainHelp', 'Select functional service domain (e.g. Facilities, IT Support, Electrical).')}
              >
                <select
                  id="ServiceCategoryID"
                  value={form.ServiceCategoryID}
                  onChange={(e) => handleCategorySelect(e.target.value)}
                  className={`enterprise-input ${formErrors.ServiceCategoryID ? 'input-error' : ''}`}
                >
                  <option value="">-- {t('issues.chooseCategory', 'Select Service Category')} --</option>
                  {categoriesList.map(cat => (
                    <option key={cat.ServiceCategoryID} value={cat.ServiceCategoryID}>
                      📂 {cat.CategoryName} ({cat.CategoryCode}){cat.RoutedDepartmentName ? ` → 🏢 ${cat.RoutedDepartmentName}` : ''}
                    </option>
                  ))}
                </select>
              </FormField>

              {/* Responsible Department Banner */}
              {activeCategoryObj && (
                <div style={{
                  marginTop: '10px', padding: '10px 14px', borderRadius: '8px',
                  background: activeCategoryObj.RoutedDepartmentName ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                  border: `1px solid ${activeCategoryObj.RoutedDepartmentName ? 'rgba(59, 130, 246, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
                  fontSize: '0.82rem',
                  color: activeCategoryObj.RoutedDepartmentName ? '#60a5fa' : '#f59e0b',
                  display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                  <Building2 size={16} />
                  <span>
                    {activeCategoryObj.RoutedDepartmentName ? (
                      <>Responsible Park Department: <strong>{activeCategoryObj.RoutedDepartmentName}</strong> (Auto-Routed)</>
                    ) : (
                      <>General Campus Queue: <em>Manual Dispatcher Assignment</em></>
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* Specific Service Item (Optional) */}
            <div>
              <FormField
                label={t('issues.serviceItemOptional', 'Specific Service Catalog Offering (Optional)')}
                id="ServiceID"
                icon={FileText}
                error={formErrors.ServiceID}
                helpText={t('issues.serviceOptionalHelp', 'Optional: Select if requesting a standardized catalog service.')}
              >
                <select
                  id="ServiceID"
                  value={form.ServiceID}
                  onChange={(e) => handleServiceSelect(e.target.value)}
                  className="enterprise-input"
                >
                  <option value="">-- {t('issues.chooseServiceOptional', 'None / Free-form Issue (No Specific Catalog Item)')} --</option>
                  {filteredServices.map(svc => (
                    <option key={svc.ServiceID} value={svc.ServiceID}>
                      ⚙️ {svc.ServiceName} ({svc.ServiceCode || `SVC #${svc.ServiceID}`})
                    </option>
                  ))}
                </select>
              </FormField>

              {selectedService && (
                <div style={{
                  marginTop: '10px', padding: '10px 14px', borderRadius: '8px',
                  background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)',
                  fontSize: '0.8rem', color: 'var(--text-secondary)',
                  display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap'
                }}>
                  <span>⏱️ <strong>SLA Response:</strong> {selectedService.SLATargetHours || 24} Hours</span>
                  <span>💰 <strong>Cost:</strong> {selectedService.EstimatedCost ? `${selectedService.EstimatedCost} ${selectedService.CurrencyCode || 'ETB'}` : 'Complimentary'}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── SECTION 4: Urgency & SLA Priority Level ─────────────────────────── */}
        <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '24px' }}>
          <div className="form-section-header" style={{ marginBottom: '16px' }}>
            <span className="form-section-number">{(isSuperAdmin || isDeptManager) ? '4' : '3'}</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {t('issues.urgencyPriority', 'Urgency & SLA Impact Level')}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {t('issues.urgencySubtitle', 'Select SLA response urgency according to business operational impact.')}
              </p>
            </div>
          </div>

          <FormField
            label=""
            id="PriorityCode"
            required
            error={formErrors.PriorityCode}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '12px' }}>
              {[
                { code: 'LOW', label: t('issues.priorityLow', 'Low Priority'), desc: 'Routine inquiry or maintenance', sla: '48h SLA', color: '#94a3b8', icon: Clock, badge: 'Standard' },
                { code: 'MEDIUM', label: t('issues.priorityMedium', 'Medium Priority'), desc: 'Standard business operational issue', sla: '24h SLA', color: '#38bdf8', icon: Sparkles, badge: 'Normal' },
                { code: 'HIGH', label: t('issues.priorityHigh', 'High Priority'), desc: 'Substantial disruption to operations', sla: '8h SLA', color: '#facc15', icon: AlertCircle, badge: 'Important' },
                { code: 'CRITICAL', label: t('issues.priorityCritical', 'Critical / Urgent'), desc: 'Campus emergency or complete outage', sla: '2h SLA', color: '#f87171', icon: AlertTriangle, badge: 'Emergency' }
              ].map(p => {
                const isSel = form.PriorityCode === p.code;
                const IconComponent = p.icon;
                return (
                  <div
                    key={p.code}
                    onClick={() => handleInputChange('PriorityCode', p.code)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleInputChange('PriorityCode', p.code)}
                    style={{
                      padding: '14px 16px', borderRadius: '12px', cursor: 'pointer',
                      border: isSel ? `2px solid ${p.color}` : '1px solid var(--glass-border)',
                      background: isSel ? `${p.color}18` : 'var(--bg-tertiary)',
                      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                      minHeight: '115px', position: 'relative',
                      boxShadow: isSel ? `0 0 16px ${p.color}25` : 'none',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '8px',
                        background: isSel ? `${p.color}30` : 'rgba(255,255,255,0.05)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: p.color
                      }}>
                        <IconComponent size={18} />
                      </div>
                      <span style={{
                        fontSize: '0.68rem', fontWeight: 800, padding: '2px 8px', borderRadius: '10px',
                        background: isSel ? p.color : 'rgba(255,255,255,0.08)',
                        color: isSel ? '#000' : 'var(--text-muted)'
                      }}>
                        {p.sla}
                      </span>
                    </div>

                    <div style={{ marginTop: '12px' }}>
                      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: isSel ? p.color : 'var(--text-primary)' }}>
                        {p.label}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.3 }}>
                        {p.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </FormField>

          {/* Major Incident Flag (Super Admin & Managers) */}
          {(isSuperAdmin || isDeptManager) && (
            <div style={{
              marginTop: '16px', padding: '12px 18px', borderRadius: '10px',
              background: form.IsMajorIncident ? 'rgba(239, 68, 68, 0.12)' : 'var(--bg-tertiary)',
              border: form.IsMajorIncident ? '1.5px solid #ef4444' : '1px solid var(--glass-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              transition: 'all 0.2s ease'
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', margin: 0 }}>
                <input
                  type="checkbox"
                  checked={form.IsMajorIncident === 1}
                  onChange={(e) => handleInputChange('IsMajorIncident', e.target.checked ? 1 : 0)}
                  style={{ width: '18px', height: '18px', accentColor: '#ef4444', cursor: 'pointer' }}
                />
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: form.IsMajorIncident ? '#ef4444' : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Flame size={15} color="#ef4444" />
                    <span>{t('issues.flagMajorIncident', 'Flag as Major Incident (Critical Campus Outage)')}</span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Automatically triggers priority notification broadcasts and fast-tracks escalation workflow.
                  </div>
                </div>
              </label>
            </div>
          )}
        </div>

        {/* ── SECTION 5: Subject & Detailed Description ───────────────────────── */}
        <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '24px' }}>
          <div className="form-section-header" style={{ marginBottom: '16px' }}>
            <span className="form-section-number">{(isSuperAdmin || isDeptManager) ? '5' : '4'}</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {t('issues.requestDetailsTitle', 'Subject Title & Detailed Description')}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {t('issues.requestDetailsSubtitle', 'Provide a concise problem statement and detailed symptoms for engineering staff.')}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Title */}
            <div>
              <FormField
                label={t('issues.requestTitle', 'Subject / Issue Title')}
                id="Title"
                required
                icon={Sparkles}
                error={formErrors.Title}
                helpText={`${form.Title.length}/255 characters. Be specific and concise.`}
              >
                <input
                  id="Title"
                  type="text"
                  maxLength={255}
                  value={form.Title}
                  onChange={(e) => handleInputChange('Title', e.target.value)}
                  placeholder={t('issues.titlePlaceholder', 'e.g. Primary fiber optic link down in Block B server room')}
                  className={`enterprise-input ${formErrors.Title ? 'input-error' : ''}`}
                />
              </FormField>
            </div>

            {/* Description */}
            <div>
              <FormField
                label={t('issues.descriptionDetails', 'Detailed Problem Description')}
                id="Description"
                required
                icon={FileText}
                error={formErrors.Description}
                helpText={`${form.Description.length}/2000 characters (min 10). Detail symptoms, affected equipment, and when it began.`}
              >
                <textarea
                  id="Description"
                  rows={5}
                  maxLength={2000}
                  value={form.Description}
                  onChange={(e) => handleInputChange('Description', e.target.value)}
                  placeholder={t('issues.descPlaceholder', 'Please describe the problem thoroughly:\n• What happened or stopped working?\n• Which offices or team members are impacted?\n• Any error codes, odd noises, or observable physical symptoms?')}
                  className={`enterprise-input ${formErrors.Description ? 'input-error' : ''}`}
                  style={{ resize: 'vertical' }}
                />
              </FormField>
            </div>
          </div>
        </div>

        {/* ── SECTION 6: Supporting Files & Diagnostic Documents ──────────────── */}
        <div style={{ borderBottom: (isSuperAdmin || isDeptManager) ? '1px solid var(--glass-border)' : 'none', paddingBottom: '24px' }}>
          <div className="form-section-header" style={{ marginBottom: '16px' }}>
            <span className="form-section-number">{(isSuperAdmin || isDeptManager) ? '6' : '5'}</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {t('issues.attachmentsTitle', 'Supporting Photos & Diagnostic Documents')}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {t('issues.attachmentsSubtitle', 'Attach screenshots, diagnostic logs, or photos of damaged equipment (Optional, up to 5 files, 10MB each).')}
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
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileInputRef.current?.click()}
            style={{
              padding: '28px 20px', borderRadius: '12px', border: '2px dashed var(--glass-border)',
              background: 'var(--bg-tertiary)', textAlign: 'center', cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{
              width: '44px', height: '44px', borderRadius: '50%',
              background: 'rgba(99, 102, 241, 0.12)', color: 'var(--accent-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 10px'
            }}>
              <Upload size={22} />
            </div>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {t('issues.dragDropBrowse', 'Click to browse files or drag & drop here')}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              PNG, JPG, PDF, DOCX, XLSX, LOG (Securely stored in Document Repository)
            </div>
          </div>

          {/* Attached Files List */}
          {attachedFiles.length > 0 && (
            <div style={{ marginTop: '14px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
              {attachedFiles.map((file, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '10px 14px', borderRadius: '10px',
                    background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    fontSize: '0.84rem', gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <FileText size={16} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
                    <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }} title={file.name}>
                      {file.name}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                    style={{
                      background: 'rgba(239, 68, 68, 0.12)', border: 'none', borderRadius: '6px',
                      color: '#ef4444', width: '24px', height: '24px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', flexShrink: 0
                    }}
                    title="Remove attachment"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── SECTION 7: Direct Department Assignment (Admin & Manager) ───────── */}
        {(isSuperAdmin || isDeptManager) && (
          <div>
            <div className="form-section-header" style={{ marginBottom: '16px' }}>
              <span className="form-section-number">7</span>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {t('issues.dispatchSectionTitle', 'Administrative Dispatch & Governance')}
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {t('issues.dispatchSectionDesc', 'Override or manually assign the target department and budget estimate.')}
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              {/* Assigned Department Override */}
              <FormField
                label={t('issues.assignedDeptOverride', 'Assigned Fulfillment Department')}
                id="AssignedDepartmentID"
                icon={Building2}
                error={formErrors.AssignedDepartmentID}
                helpText={t('issues.assignedDeptHelp', 'Defaults to category auto-routing; select to manually route.')}
              >
                <select
                  id="AssignedDepartmentID"
                  value={form.AssignedDepartmentID}
                  onChange={(e) => handleInputChange('AssignedDepartmentID', e.target.value)}
                  className="enterprise-input"
                >
                  <option value="">-- {t('issues.chooseDept', 'Default Auto-Routing Queue')} --</option>
                  {departmentsList.map(d => (
                    <option key={d.DepartmentID} value={d.DepartmentID}>
                      🏢 {d.DepartmentName} ({d.DepartmentCode || 'DEPT'})
                    </option>
                  ))}
                </select>
              </FormField>

              {/* Estimated Budget / Cost (ETB) */}
              <FormField
                label={t('issues.estimatedCost', 'Estimated Resolution Cost (ETB)')}
                id="EstimatedCost"
                icon={Sparkles}
                error={formErrors.EstimatedCost}
                helpText={t('issues.estimatedCostHelp', 'Optional preliminary cost estimate in Ethiopian Birr.')}
              >
                <input
                  id="EstimatedCost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.EstimatedCost}
                  onChange={(e) => handleInputChange('EstimatedCost', e.target.value)}
                  placeholder="0.00"
                  className="enterprise-input"
                />
              </FormField>
            </div>
          </div>
        )}

        {/* ── Form Actions / Sticky Submission Bar ────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          gap: '12px', borderTop: '1px solid var(--glass-border)', paddingTop: '24px',
          flexWrap: 'wrap'
        }}>
          <button
            type="button"
            onClick={() => navigate('/issues/my-requests')}
            className="btn btn-secondary touch-target-sm"
            disabled={submitting}
          >
            {t('common.cancel', 'Cancel')}
          </button>

          <button
            type="submit"
            className="btn btn-primary touch-target-sm"
            disabled={submitting}
            style={{
              padding: '12px 28px', fontSize: '0.95rem', fontWeight: 800,
              display: 'inline-flex', alignItems: 'center', gap: '8px'
            }}
          >
            <Plus size={18} />
            {submitting ? t('issues.submitting', 'Submitting Request & Uploading Files...') : t('issues.submitBtn', 'Submit Service Request')}
          </button>
        </div>
      </form>
    </div>
  );
}
