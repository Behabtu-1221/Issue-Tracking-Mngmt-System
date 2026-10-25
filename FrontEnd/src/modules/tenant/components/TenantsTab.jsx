import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Users,
  Plus,
  Search,
  Filter,
  Building2,
  Briefcase,
  Globe,
  FileText,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  MoreVertical,
  ChevronRight,
  MapPin,
  Phone,
  Mail,
  Edit2,
  Trash2,
  ShieldAlert,
  Tag,
  X
} from 'lucide-react';
import tenantApi from '../api/tenantApi';
import parkApi from '../../business-park/api/parkApi';
import TenantDetailModal from './TenantDetailModal';
import ConfirmDialogModal from '../../../components/common/ConfirmDialogModal';
import AlertDialogModal from '../../../components/common/AlertDialogModal';
import { ActionButton, ActionGroup } from '../../../components/common/ActionButton';
import { ModalCard } from '../../../components/common/ModalCard';
import { FormField } from '../../../components/common/FormField';
import { tenantSchemas } from '../../../validation';
import { useTranslation } from '../../../i18n';

export default function TenantsTab({ onRefreshMetrics }) {
  const { t } = useTranslation();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [parkFilter, setParkFilter] = useState('');
  const [parks, setParks] = useState([]);

  // Glass Dialog Modals State
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'error' });

  const showAlert = (title, message, type = 'error') => {
    setAlertConfig({ isOpen: true, title, message, type });
  };

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [statusModalTenant, setStatusModalTenant] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [errorMsg, setErrorMsg] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    BusinessParkID: '',
    TenantTypeID: 1,
    IndustryID: '',
    TenantCode: '',
    CompanyName: '',
    RegistrationNumber: '',
    TaxIdentificationNo: '',
    Website: '',
    Status: 'ONBOARDING'
  });

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleBlur = (field) => {
    const validation = tenantSchemas.tenantForm(formData);
    if (validation.errors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: validation.errors[field] }));
    } else {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  useEffect(() => {
    fetchParks();
    fetchTenants();
  }, [search, statusFilter, parkFilter]);

  const fetchParks = async () => {
    try {
      const res = await parkApi.getParks({ limit: 100 });
      const rawParks = res.data?.data?.parks || res.data?.data || [];
      setParks(Array.isArray(rawParks) ? rawParks : []);
    } catch (err) {
      console.error('Failed to fetch parks', err);
    }
  };

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const res = await tenantApi.getTenants({
        search,
        status: statusFilter,
        businessParkId: parkFilter
      });
      const rawTenants = res.data?.data?.tenants || res.data?.data || [];
      setTenants(Array.isArray(rawTenants) ? rawTenants : []);
    } catch (err) {
      console.error('Failed to fetch tenants', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingTenant(null);
    setFormData({
      BusinessParkID: parks[0]?.BusinessParkID || 1,
      TenantTypeID: 1,
      IndustryID: '',
      TenantCode: `TNT-${Math.floor(1000 + Math.random() * 9000)}`,
      CompanyName: '',
      RegistrationNumber: '',
      TaxIdentificationNo: '',
      Website: '',
      Status: 'ACTIVE'
    });
    setFieldErrors({});
    setErrorMsg('');
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (t) => {
    setEditingTenant(t);
    setFormData({
      BusinessParkID: t.BusinessParkID,
      TenantTypeID: t.TenantTypeID || 1,
      IndustryID: t.IndustryID || '',
      TenantCode: t.TenantCode,
      CompanyName: t.CompanyName,
      RegistrationNumber: t.RegistrationNumber || '',
      TaxIdentificationNo: t.TaxIdentificationNo || '',
      Website: t.Website || '',
      Status: t.Status
    });
    setFieldErrors({});
    setErrorMsg('');
    setIsCreateModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setErrorMsg('');

    const validation = tenantSchemas.tenantForm(formData);
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      setErrorMsg('');
      return;
    }

    try {
      const parkId = formData.BusinessParkID ? Number(formData.BusinessParkID) : (parks[0]?.BusinessParkID || 1);
      const payload = {
        ...formData,
        CompanyName: validation.sanitized.CompanyName,
        TenantCode: validation.sanitized.TenantCode,
        RegistrationNumber: validation.sanitized.RegistrationNumber,
        TaxIdentificationNo: validation.sanitized.TaxIdentificationNo,
        Website: validation.sanitized.Website,
        Status: formData.Status || 'ACTIVE',
        BusinessParkID: parkId,
        TenantTypeID: formData.TenantTypeID ? Number(formData.TenantTypeID) : 1,
        IndustryID: formData.IndustryID ? Number(formData.IndustryID) : undefined
      };
      if (editingTenant) {
        await tenantApi.updateTenant(editingTenant.TenantID, payload);
      } else {
        await tenantApi.createTenant(payload);
      }
      setIsCreateModalOpen(false);
      fetchTenants();
      if (onRefreshMetrics) onRefreshMetrics();
    } catch (err) {
      const msg = err.response?.data?.message || 'Operation failed';
      setErrorMsg(msg);
      if (err.response?.data?.details && Array.isArray(err.response.data.details)) {
        const beErrors = {};
        err.response.data.details.forEach(d => {
          if (d.field) beErrors[d.field] = d.message;
        });
        setFieldErrors(beErrors);
      }
    }
  };

  const handleStatusChange = async (e) => {
    e.preventDefault();
    if (!statusModalTenant || !newStatus) return;
    try {
      setErrorMsg('');
      await tenantApi.updateTenantStatus(statusModalTenant.TenantID, newStatus);
      setStatusModalTenant(null);
      fetchTenants();
      if (onRefreshMetrics) onRefreshMetrics();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Status transition failed');
    }
  };

  const handleDelete = (id, companyName) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Decommission Tenant Record',
      message: `Are you sure you want to delete corporate tenant account "${companyName}"? Active leases, leases history, and employee assignments will be affected.`,
      type: 'danger',
      confirmText: 'Delete Tenant',
      onConfirm: async () => {
        try {
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          await tenantApi.deleteTenant(id);
          fetchTenants();
          if (onRefreshMetrics) onRefreshMetrics();
        } catch (err) {
          const msg = err.response?.data?.message || 'Failed to delete tenant';
          showAlert('Action Restricted', msg, 'error');
        }
      }
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={12} /> {t('tenant.active')}
          </span>
        );
      case 'ONBOARDING':
        return (
          <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} /> {t('tenant.onboarding')}
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <AlertCircle size={12} /> {t('tenant.suspended')}
          </span>
        );
      case 'TERMINATED':
        return (
          <span style={{ padding: '4px 8px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.1)', color: '#888', fontSize: '0.75rem' }}>
            {t('tenant.terminated')}
          </span>
        );
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div>
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mb-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 min-w-0">
          <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder={t('tenant.searchTenants')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px 10px 36px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--border-radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem'
              }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto"
            style={{
              padding: '10px 14px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--border-radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem'
            }}
          >
            <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{t('tenant.allStatuses')}</option>
            <option value="ONBOARDING" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{t('tenant.onboarding')}</option>
            <option value="ACTIVE" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{t('tenant.active')}</option>
            <option value="SUSPENDED" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{t('tenant.suspended')}</option>
            <option value="TERMINATED" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{t('tenant.terminated')}</option>
          </select>
          {/* Park filter — single campus system */}
          <div style={{
            padding: '10px 14px',
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: 'var(--border-radius-sm)',
            color: 'var(--text-primary)',
            fontSize: '0.85rem',
            fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: '6px',
            whiteSpace: 'nowrap'
          }}>
            🏢 {parks[0]?.BusinessParkName || 'Ethiopian IT Park'}
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="touch-target-sm w-full sm:w-auto flex items-center justify-center gap-2"
          style={{
            padding: '10px 18px',
            background: 'var(--accent-gradient)',
            border: 'none',
            borderRadius: 'var(--border-radius-sm)',
            color: '#ffffff',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: 'var(--glow-accent)'
          }}
        >
          <Plus size={16} /> {t('tenant.onboardTenant')}
        </button>
      </div>

      {/* Tenants Table */}
      <div className="glass-card" style={{ padding: '0', overflow: 'auto' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>{t('tenant.loadingTenants')}</div>
        ) : tenants.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>{t('tenant.noTenantsFound')}</div>
        ) : (
          <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', minWidth: '900px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '16px 20px' }}>{t('tenant.companyAndCode')}</th>
                <th style={{ padding: '16px 20px' }}>{t('tenant.businessPark')}</th>
                <th style={{ padding: '16px 20px' }}>{t('tenant.regTaxId')}</th>
                <th style={{ padding: '16px 20px' }}>{t('tenant.status')}</th>
                <th style={{ padding: '16px 20px' }}>{t('tenant.leasesOffices')}</th>
                <th style={{ padding: '16px 20px', textAlign: 'right' }}>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tn) => (
                <tr key={tn.TenantID} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', transition: 'background 0.2s ease' }}>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{tn.CompanyName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px' }}>{tn.TenantCode}</span>
                      {tn.Website && (
                        <a href={tn.Website.startsWith('http') ? tn.Website : `https://${tn.Website}`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Globe size={12} /> {tn.Website}
                        </a>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Building2 size={14} color="var(--accent-primary)" />
                      {tn.BusinessParkName || 'N/A'}
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <div>Reg: {tn.RegistrationNumber || '—'}</div>
                    <div>TIN: {tn.TaxIdentificationNo || '—'}</div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {getStatusBadge(tn.Status)}
                      <ActionButton
                        variant="warning"
                        size="sm"
                        title="Change Status Lifecycle"
                        onClick={() => { setStatusModalTenant(tn); setNewStatus(''); setErrorMsg(''); }}
                        icon={<Edit2 size={12} />}
                      />
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
                        <FileText size={13} /> {tn.LeaseCount} {t('tenant.leases')}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: tn.ActiveAllocationCount > 0 ? '#4ade80' : 'var(--text-muted)' }}>
                        <Building2 size={13} /> {tn.ActiveAllocationCount} {t('businessPark.occupied')}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <ActionGroup align="right">
                      <ActionButton
                        variant="neutral"
                        label={t('common.viewDetails')}
                        onClick={() => setSelectedTenant(tn)}
                        title={t('common.viewDetails')}
                      />
                      <ActionButton
                        variant="edit"
                        onClick={() => handleOpenEdit(tn)}
                        title={t('common.edit')}
                      />
                      <ActionButton
                        variant="delete"
                        onClick={() => handleDelete(tn.TenantID, tn.CompanyName)}
                        title={t('common.delete')}
                      />
                    </ActionGroup>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Modal: Create/Edit Tenant */}
      <ModalCard
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={editingTenant ? t('tenant.editTenantProfile', 'Edit Tenant Profile') : t('tenant.onboardTenant', 'Onboard New Tenant')}
        subtitle={t('tenant.onboardSubtitle', 'Enter enterprise tenant registration details, tax identifiers, and initial account status')}
        category={t('tenant.moduleName', 'Tenant Management')}
        icon={Building2}
        accentStrip="brand"
        maxWidth="680px"
        onSubmit={handleSubmit}
        submitText={editingTenant ? t('common.saveChanges', 'Save Changes') : t('tenant.onboardTenant', 'Onboard New Tenant')}
        cancelText={t('common.cancel', 'Cancel')}
        error={errorMsg || (Object.keys(fieldErrors).length > 0 ? Object.values(fieldErrors)[0] : null)}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Section 1: Legal Entity & Organization */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-primary, #2563eb)' }}>
              1. Corporate & Legal Identity
            </div>

            <FormField
              label={t('tenant.companyName', 'Company Name')}
              required
              error={fieldErrors.CompanyName}
              icon={Building2}
            >
              <input
                type="text"
                placeholder="e.g. Acme Innovations PLC"
                value={formData.CompanyName}
                onChange={(e) => handleFieldChange('CompanyName', e.target.value)}
                onBlur={() => handleBlur('CompanyName')}
                style={{
                  width: '100%', padding: '10px 14px', background: 'var(--bg-tertiary)',
                  border: `1px solid ${fieldErrors.CompanyName ? 'var(--color-error, #ef4444)' : 'var(--glass-border)'}`,
                  borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)', fontSize: '0.88rem'
                }}
              />
            </FormField>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
              <FormField
                label={t('tenant.tenantCode', 'Tenant Code')}
                required
                error={fieldErrors.TenantCode}
                icon={Tag}
                hint="Format: TNT-01"
              >
                <input
                  type="text"
                  placeholder="e.g. TNT-01"
                  value={formData.TenantCode}
                  onChange={(e) => handleFieldChange('TenantCode', e.target.value.toUpperCase())}
                  onBlur={() => handleBlur('TenantCode')}
                  style={{
                    width: '100%', padding: '10px 14px', background: 'var(--bg-tertiary)',
                    border: `1px solid ${fieldErrors.TenantCode ? 'var(--color-error, #ef4444)' : 'var(--glass-border)'}`,
                    borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '0.88rem'
                  }}
                />
              </FormField>

              <FormField
                label={t('tenant.businessPark', 'Business Park / Campus')}
                icon={Building2}
                hint="Single campus system — auto-assigned"
              >
                <div style={{
                  width: '100%', padding: '10px 14px', borderRadius: 'var(--border-radius-sm)',
                  background: 'rgba(37, 99, 235, 0.08)',
                  border: '1px solid rgba(37, 99, 235, 0.25)',
                  color: 'var(--text-primary)', fontSize: '0.88rem',
                  fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                  <Building2 size={15} style={{ color: 'var(--color-primary, #2563eb)' }} />
                  <span>{parks.length > 0 ? `${parks[0].BusinessParkName} (${parks[0].BusinessParkCode || ''})` : 'Ethiopian IT Park'}</span>
                </div>
              </FormField>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
              <FormField
                label={t('tenant.regNumber', 'Registration Number')}
                error={fieldErrors.RegistrationNumber}
                icon={Briefcase}
              >
                <input
                  type="text"
                  placeholder="e.g. REG-2024-001"
                  value={formData.RegistrationNumber}
                  onChange={(e) => handleFieldChange('RegistrationNumber', e.target.value)}
                  onBlur={() => handleBlur('RegistrationNumber')}
                  style={{
                    width: '100%', padding: '10px 14px', background: 'var(--bg-tertiary)',
                    border: `1px solid ${fieldErrors.RegistrationNumber ? 'var(--color-error, #ef4444)' : 'var(--glass-border)'}`,
                    borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)', fontSize: '0.88rem'
                  }}
                />
              </FormField>

              <FormField
                label={t('tenant.tin', 'Tax Identification (TIN)')}
                error={fieldErrors.TaxIdentificationNo}
                icon={FileText}
              >
                <input
                  type="text"
                  placeholder="e.g. TIN-992381"
                  value={formData.TaxIdentificationNo}
                  onChange={(e) => handleFieldChange('TaxIdentificationNo', e.target.value)}
                  onBlur={() => handleBlur('TaxIdentificationNo')}
                  style={{
                    width: '100%', padding: '10px 14px', background: 'var(--bg-tertiary)',
                    border: `1px solid ${fieldErrors.TaxIdentificationNo ? 'var(--color-error, #ef4444)' : 'var(--glass-border)'}`,
                    borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)', fontSize: '0.88rem'
                  }}
                />
              </FormField>
            </div>
          </div>

          {/* Section 2: Online Presence & Account Status */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--color-border-subtle, var(--glass-border))', paddingTop: '16px' }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-primary, #2563eb)' }}>
              2. Web Presence & Operational Status
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
              <FormField
                label={t('tenant.website', 'Corporate Website')}
                error={fieldErrors.Website}
                icon={Globe}
              >
                <input
                  type="text"
                  placeholder="https://company.com"
                  value={formData.Website}
                  onChange={(e) => handleFieldChange('Website', e.target.value)}
                  onBlur={() => handleBlur('Website')}
                  style={{
                    width: '100%', padding: '10px 14px', background: 'var(--bg-tertiary)',
                    border: `1px solid ${fieldErrors.Website ? 'var(--color-error, #ef4444)' : 'var(--glass-border)'}`,
                    borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)', fontSize: '0.88rem'
                  }}
                />
              </FormField>

              <FormField
                label={t('tenant.accountStatus', 'Initial Account Status')}
                icon={ShieldAlert}
              >
                <select
                  value={formData.Status}
                  onChange={(e) => handleFieldChange('Status', e.target.value)}
                  style={{
                    width: '100%', padding: '10px 14px', background: 'var(--bg-tertiary)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)', fontSize: '0.88rem'
                  }}
                >
                  <option value="ACTIVE">ACTIVE (Ready for Leases & Spaces)</option>
                  <option value="ONBOARDING">ONBOARDING (Under Setup)</option>
                </select>
              </FormField>
            </div>
          </div>
        </div>
      </ModalCard>

      {/* Modal: Status Lifecycle Transition */}
      <ModalCard
        isOpen={Boolean(statusModalTenant)}
        onClose={() => setStatusModalTenant(null)}
        title={t('tenant.statusTransition', 'Tenant Lifecycle Transition')}
        subtitle={statusModalTenant ? `Update operational lifecycle for ${statusModalTenant.CompanyName}` : ''}
        category={t('tenant.statusGovernance', 'Status Governance')}
        icon={ShieldAlert}
        accentStrip="amber"
        maxWidth="480px"
        onSubmit={handleStatusChange}
        submitText={t('common.confirm', 'Confirm Transition')}
        cancelText={t('common.cancel', 'Cancel')}
        error={errorMsg}
      >
        {statusModalTenant && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--glass-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Current Status:</span>
              <span className="badge badge-info">{statusModalTenant.Status}</span>
            </div>

            <FormField
              label="Select Target Status:"
              required
              icon={ShieldAlert}
            >
              <select
                required
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px', background: 'var(--bg-tertiary)',
                  border: '1px solid var(--glass-border)', borderRadius: 'var(--border-radius-sm)',
                  color: 'var(--text-primary)', fontSize: '0.88rem'
                }}
              >
                <option value="">-- Choose New Status --</option>
                {statusModalTenant.Status === 'ONBOARDING' && <option value="ACTIVE">ACTIVE (Onboarding Complete)</option>}
                {statusModalTenant.Status === 'ACTIVE' && (
                  <>
                    <option value="SUSPENDED">SUSPENDED (Temporary Hold)</option>
                    <option value="TERMINATED">TERMINATED (Offboard Tenant)</option>
                  </>
                )}
                {statusModalTenant.Status === 'SUSPENDED' && (
                  <>
                    <option value="ACTIVE">ACTIVE (Re-activate Tenant)</option>
                    <option value="TERMINATED">TERMINATED (Offboard Tenant)</option>
                  </>
                )}
              </select>
            </FormField>
          </div>
        )}
      </ModalCard>

      {/* Professional Tenant Full Details Modal */}
      {selectedTenant && (
        <TenantDetailModal
          tenantId={selectedTenant.TenantID}
          onClose={() => setSelectedTenant(null)}
          onEdit={(t) => handleOpenEdit(t)}
          onChangeStatus={(t) => { setStatusModalTenant(t); setNewStatus(''); setErrorMsg(''); }}
        />
      )}

      {/* Shared Glass Modals */}
      <ConfirmDialogModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        confirmText={confirmConfig.confirmText}
        onConfirm={confirmConfig.onConfirm}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />

      <AlertDialogModal
        isOpen={alertConfig.isOpen}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
