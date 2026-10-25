import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  FileText,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  DollarSign,
  Calendar,
  Building,
  Edit2,
  Trash2,
  FileCheck,
  X
} from 'lucide-react';
import tenantApi from '../api/tenantApi';
import ConfirmDialogModal from '../../../components/common/ConfirmDialogModal';
import AlertDialogModal from '../../../components/common/AlertDialogModal';
import { ActionButton, ActionGroup } from '../../../components/common/ActionButton';
import { ModalCard } from '../../../components/common/ModalCard';
import { FormField } from '../../../components/common/FormField';
import { tenantSchemas } from '../../../validation';
import { usePermissionContext } from '../../role-permission-management/contexts/PermissionContext';
import { useTranslation } from '../../../i18n';

export default function LeasesTab({ onRefreshMetrics }) {
  const { t } = useTranslation();
  const { isParkAdmin } = usePermissionContext();
  const [leases, setLeases] = useState([]);
  const [expiringLeases, setExpiringLeases] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Glass Dialog Modals State
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'error' });

  const showAlert = (title, message, type = 'error') => {
    setAlertConfig({ isOpen: true, title, message, type });
  };

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLease, setEditingLease] = useState(null);
  const [statusModalLease, setStatusModalLease] = useState(null);
  const [targetStatus, setTargetStatus] = useState('');
  const [terminationReason, setTerminationReason] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [statusErrors, setStatusErrors] = useState({});
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    TenantID: '',
    AgreementNumber: '',
    StartDate: '',
    EndDate: '',
    ExecutionDate: '',
    MonthlyRentAmount: '',
    SecurityDepositAmount: '',
    CurrencyCode: 'ETB',
    GracePeriodDays: 0,
    Status: 'DRAFT'
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
    const validation = tenantSchemas.leaseForm(formData);
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
    fetchTenants();
    fetchExpiringLeases();
    fetchLeases();
  }, [search, statusFilter]);

  const fetchTenants = async () => {
    try {
      const res = await tenantApi.getTenants({ limit: 200 });
      const rawTenants = res.data?.data?.tenants || res.data?.data || [];
      setTenants(Array.isArray(rawTenants) ? rawTenants : []);
    } catch (err) {
      console.error('Failed to fetch tenants', err);
    }
  };

  const fetchExpiringLeases = async () => {
    try {
      const res = await tenantApi.getExpiringSoonLeases({ days: 30 });
      const rawExpiring = res.data?.data || [];
      setExpiringLeases(Array.isArray(rawExpiring) ? rawExpiring : []);
    } catch (err) {
      console.error('Failed to fetch expiring leases', err);
    }
  };

  const fetchLeases = async () => {
    try {
      setLoading(true);
      const res = await tenantApi.getLeases({ search, status: statusFilter });
      const rawLeases = res.data?.data?.leases || res.data?.data || [];
      setLeases(Array.isArray(rawLeases) ? rawLeases : []);
    } catch (err) {
      console.error('Failed to fetch leases', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingLease(null);
    const today = new Date().toISOString().split('T')[0];
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const endStr = nextYear.toISOString().split('T')[0];

    setFormData({
      TenantID: tenants[0]?.TenantID || '',
      AgreementNumber: `LEA-${Math.floor(10000 + Math.random() * 90000)}`,
      StartDate: today,
      EndDate: endStr,
      ExecutionDate: today,
      MonthlyRentAmount: '',
      SecurityDepositAmount: '',
      CurrencyCode: 'ETB',
      GracePeriodDays: 0,
      Status: 'DRAFT'
    });
    setFieldErrors({});
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (l) => {
    setEditingLease(l);
    setFormData({
      TenantID: l.TenantID,
      AgreementNumber: l.AgreementNumber,
      StartDate: l.StartDate ? l.StartDate.split('T')[0] : '',
      EndDate: l.EndDate ? l.EndDate.split('T')[0] : '',
      ExecutionDate: l.ExecutionDate ? l.ExecutionDate.split('T')[0] : '',
      MonthlyRentAmount: l.MonthlyRentAmount,
      SecurityDepositAmount: l.SecurityDepositAmount,
      CurrencyCode: l.CurrencyCode || 'ETB',
      GracePeriodDays: l.GracePeriodDays || 0,
      Status: l.Status
    });
    setFieldErrors({});
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setErrorMsg('');

    const validation = tenantSchemas.leaseForm({
      TenantID: formData.TenantID,
      AgreementNumber: formData.AgreementNumber,
      StartDate: formData.StartDate,
      EndDate: formData.EndDate,
      ExecutionDate: formData.ExecutionDate,
      MonthlyRentAmount: formData.MonthlyRentAmount,
      SecurityDepositAmount: formData.SecurityDepositAmount,
      GracePeriodDays: formData.GracePeriodDays,
      CurrencyCode: formData.CurrencyCode
    });

    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      setErrorMsg('');
      return;
    }

    try {
      const payload = {
        ...formData,
        TenantID: validation.sanitized.TenantID,
        AgreementNumber: validation.sanitized.AgreementNumber,
        StartDate: validation.sanitized.StartDate,
        EndDate: validation.sanitized.EndDate,
        ExecutionDate: validation.sanitized.ExecutionDate,
        MonthlyRentAmount: validation.sanitized.MonthlyRentAmount,
        SecurityDepositAmount: validation.sanitized.SecurityDepositAmount,
        GracePeriodDays: validation.sanitized.GracePeriodDays,
        CurrencyCode: validation.sanitized.CurrencyCode
      };

      if (editingLease) {
        await tenantApi.updateLease(editingLease.LeaseAgreementID, payload);
      } else {
        await tenantApi.createLease(payload);
      }
      setIsModalOpen(false);
      fetchLeases();
      fetchExpiringLeases();
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
    if (!statusModalLease || !targetStatus) return;
    setStatusErrors({});

    const statusValidation = tenantSchemas.leaseStatusForm({
      Status: targetStatus,
      TerminationReason: terminationReason
    });

    if (!statusValidation.isValid) {
      const errMap = {};
      if (statusValidation.errors.TerminationReason) errMap.terminationReason = statusValidation.errors.TerminationReason;
      if (statusValidation.errors.Status) setErrorMsg(statusValidation.errors.Status);
      setStatusErrors(errMap);
      return;
    }

    try {
      setErrorMsg('');
      await tenantApi.updateLeaseStatus(statusModalLease.LeaseAgreementID, targetStatus, terminationReason);
      setStatusModalLease(null);
      setTargetStatus('');
      setTerminationReason('');
      fetchLeases();
      fetchExpiringLeases();
      if (onRefreshMetrics) onRefreshMetrics();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Lease status transition failed');
    }
  };

  const handleDelete = (id, agreementNumber) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Terminate Lease Contract',
      message: `Are you sure you want to delete draft lease contract "${agreementNumber}"? This action cannot be undone.`,
      type: 'danger',
      confirmText: 'Delete Contract',
      onConfirm: async () => {
        try {
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          await tenantApi.deleteLease(id);
          fetchLeases();
          if (onRefreshMetrics) onRefreshMetrics();
        } catch (err) {
          const msg = err.response?.data?.message || 'Failed to delete lease';
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
      case 'DRAFT':
        return (
          <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} /> {t('tenant.draft')}
          </span>
        );
      case 'EXPIRED':
        return (
          <span style={{ padding: '4px 8px', borderRadius: '4px', background: 'rgba(234, 179, 8, 0.15)', color: '#eab308', fontSize: '0.75rem' }}>
            {t('tenant.expired')}
          </span>
        );
      case 'TERMINATED':
        return (
          <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <XCircle size={12} /> {t('tenant.terminated')}
          </span>
        );
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div>
      {/* Expiring Soon Alert Banner */}
      {expiringLeases.length > 0 && (
        <div
          className="glass-card"
          style={{
            padding: '16px 20px',
            marginBottom: '24px',
            background: 'rgba(234, 179, 8, 0.08)',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle color="#eab308" size={22} />
            <div>
              <div style={{ fontWeight: '600', color: '#fef08a' }}>
                {t('tenant.expiringAlert').replace('{count}', expiringLeases.length)}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Renewal action recommended for: {expiringLeases.map((l) => l.TenantCompanyName).join(', ')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Action Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '300px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder={t('tenant.searchLeases')}
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
            style={{
              padding: '10px 14px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--border-radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem'
            }}
          >
            <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{t('tenant.allLeaseStatuses')}</option>
            <option value="DRAFT" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{t('tenant.draft')}</option>
            <option value="ACTIVE" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{t('tenant.active')}</option>
            <option value="EXPIRED" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{t('tenant.expired')}</option>
            <option value="TERMINATED" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{t('tenant.terminated')}</option>
          </select>
        </div>

        {isParkAdmin && (
          <button
            onClick={handleOpenCreate}
            style={{
              padding: '10px 18px',
              background: 'var(--accent-gradient)',
              border: 'none',
              borderRadius: 'var(--border-radius-sm)',
              color: '#ffffff',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: 'var(--glow-accent)'
            }}
          >
            <Plus size={16} /> {t('tenant.draftNewLease')}
          </button>
        )}
      </div>

      {/* Leases Table */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>{t('tenant.loadingLeases')}</div>
        ) : leases.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>{t('tenant.noLeasesFound')}</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '16px 20px' }}>{t('tenant.agreementAndTenant')}</th>
                <th style={{ padding: '16px 20px' }}>{t('tenant.leasePeriod')}</th>
                <th style={{ padding: '16px 20px' }}>{t('tenant.monthlyRent')}</th>
                <th style={{ padding: '16px 20px' }}>{t('tenant.securityDeposit')}</th>
                <th style={{ padding: '16px 20px' }}>{t('tenant.status')}</th>
                <th style={{ padding: '16px 20px', textAlign: 'right' }}>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {leases.map((l) => (
                <tr key={l.LeaseAgreementID} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={15} color="var(--accent-primary)" />
                      {l.AgreementNumber}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{l.TenantCompanyName}</div>
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    <div>From: {l.StartDate ? l.StartDate.split('T')[0] : 'N/A'}</div>
                    <div>To: {l.EndDate ? l.EndDate.split('T')[0] : 'N/A'}</div>
                  </td>
                  <td style={{ padding: '16px 20px', fontWeight: '600', color: '#4ade80' }}>
                    {l.CurrencyCode || 'ETB'} {Number(l.MonthlyRentAmount).toLocaleString()}
                  </td>
                  <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>
                    {l.CurrencyCode || 'ETB'} {Number(l.SecurityDepositAmount).toLocaleString()}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {getStatusBadge(l.Status)}
                      {isParkAdmin && (
                        <ActionButton
                          variant="warning"
                          size="sm"
                          title="Transition Contract Status"
                          onClick={() => { setStatusModalLease(l); setTargetStatus(''); setTerminationReason(''); setErrorMsg(''); }}
                          icon={<Edit2 size={12} />}
                        />
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <ActionGroup align="right">
                      {isParkAdmin && l.Status === 'DRAFT' && (
                        <ActionButton
                          variant="edit"
                          onClick={() => handleOpenEdit(l)}
                          title={t('common.edit')}
                        />
                      )}
                      {isParkAdmin && l.Status === 'DRAFT' && (
                        <ActionButton
                          variant="delete"
                          onClick={() => handleDelete(l.LeaseAgreementID, l.AgreementNumber)}
                          title={t('common.delete')}
                        />
                      )}
                    </ActionGroup>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal: Create/Edit Lease */}
      <ModalCard
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingLease ? t('tenant.editLease', 'Edit Draft Lease Contract') : t('tenant.draftNewLease', 'Draft New Lease Contract')}
        subtitle={editingLease ? `Agreement #${editingLease.AgreementNumber}` : 'Register a new tenant lease agreement, term schedule, and financial terms'}
        category={t('tenant.leaseGovernance', 'Lease Governance')}
        icon={FileCheck}
        accentStrip="primary"
        maxWidth="680px"
        onSubmit={handleSubmit}
        submitText={editingLease ? t('common.saveChanges', 'Save Changes') : t('tenant.draftNewLease', 'Draft New Lease')}
        cancelText={t('common.cancel', 'Cancel')}
        error={errorMsg || (Object.keys(fieldErrors).length > 0 ? Object.values(fieldErrors)[0] : '')}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Section 1: Agreement & Tenant Identification */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-primary, #2563eb)' }}>
              1. Agreement & Tenant Identification
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
              <FormField
                label="Tenant *"
                error={fieldErrors.TenantID}
                icon={Building}
              >
                <select
                  value={formData.TenantID}
                  onChange={(e) => handleFieldChange('TenantID', e.target.value)}
                  onBlur={() => handleBlur('TenantID')}
                  style={{
                    width: '100%', padding: '10px 14px', background: 'var(--bg-tertiary)',
                    border: `1px solid ${fieldErrors.TenantID ? 'var(--color-error, #ef4444)' : 'var(--glass-border)'}`,
                    borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)', fontSize: '0.88rem'
                  }}
                >
                  <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Select Tenant</option>
                  {tenants.map((t) => (
                    <option key={t.TenantID} value={t.TenantID} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                      {t.CompanyName} ({t.TenantCode})
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField
                label="Agreement Number *"
                error={fieldErrors.AgreementNumber}
                icon={FileText}
              >
                <input
                  type="text"
                  placeholder="e.g. LEA-10023"
                  value={formData.AgreementNumber}
                  onChange={(e) => handleFieldChange('AgreementNumber', e.target.value)}
                  onBlur={() => handleBlur('AgreementNumber')}
                  style={{
                    width: '100%', padding: '10px 14px', background: 'var(--bg-tertiary)',
                    border: `1px solid ${fieldErrors.AgreementNumber ? 'var(--color-error, #ef4444)' : 'var(--glass-border)'}`,
                    borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '0.88rem'
                  }}
                />
              </FormField>
            </div>
          </div>

          {/* Section 2: Term Schedule & Grace Period */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--color-border-subtle, var(--glass-border))', paddingTop: '16px' }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-primary, #2563eb)' }}>
              2. Contract Term Schedule
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
              <FormField
                label="Start Date *"
                error={fieldErrors.StartDate}
                icon={Calendar}
              >
                <input
                  type="date"
                  value={formData.StartDate}
                  onChange={(e) => handleFieldChange('StartDate', e.target.value)}
                  onBlur={() => handleBlur('StartDate')}
                  style={{
                    width: '100%', padding: '10px 14px', background: 'var(--bg-tertiary)',
                    border: `1px solid ${fieldErrors.StartDate ? 'var(--color-error, #ef4444)' : 'var(--glass-border)'}`,
                    borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)', fontSize: '0.88rem'
                  }}
                />
              </FormField>

              <FormField
                label="End Date *"
                error={fieldErrors.EndDate}
                icon={Calendar}
              >
                <input
                  type="date"
                  value={formData.EndDate}
                  onChange={(e) => handleFieldChange('EndDate', e.target.value)}
                  onBlur={() => handleBlur('EndDate')}
                  style={{
                    width: '100%', padding: '10px 14px', background: 'var(--bg-tertiary)',
                    border: `1px solid ${fieldErrors.EndDate ? 'var(--color-error, #ef4444)' : 'var(--glass-border)'}`,
                    borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)', fontSize: '0.88rem'
                  }}
                />
              </FormField>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
              <FormField
                label="Execution Date *"
                error={fieldErrors.ExecutionDate}
                icon={Calendar}
              >
                <input
                  type="date"
                  value={formData.ExecutionDate}
                  onChange={(e) => handleFieldChange('ExecutionDate', e.target.value)}
                  onBlur={() => handleBlur('ExecutionDate')}
                  style={{
                    width: '100%', padding: '10px 14px', background: 'var(--bg-tertiary)',
                    border: `1px solid ${fieldErrors.ExecutionDate ? 'var(--color-error, #ef4444)' : 'var(--glass-border)'}`,
                    borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)', fontSize: '0.88rem'
                  }}
                />
              </FormField>

              <FormField
                label="Grace Period (Days)"
                error={fieldErrors.GracePeriodDays}
                icon={Clock}
              >
                <input
                  type="number"
                  min="0"
                  max="365"
                  value={formData.GracePeriodDays}
                  onChange={(e) => handleFieldChange('GracePeriodDays', e.target.value)}
                  onBlur={() => handleBlur('GracePeriodDays')}
                  style={{
                    width: '100%', padding: '10px 14px', background: 'var(--bg-tertiary)',
                    border: `1px solid ${fieldErrors.GracePeriodDays ? 'var(--color-error, #ef4444)' : 'var(--glass-border)'}`,
                    borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)', fontSize: '0.88rem'
                  }}
                />
              </FormField>
            </div>
          </div>

          {/* Section 3: Financial Terms */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--color-border-subtle, var(--glass-border))', paddingTop: '16px' }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-primary, #2563eb)' }}>
              3. Financial Terms & Security Deposit
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
              <FormField
                label="Monthly Rent Amount (ETB) *"
                error={fieldErrors.MonthlyRentAmount}
                icon={DollarSign}
              >
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="e.g. 25000.00"
                  value={formData.MonthlyRentAmount}
                  onChange={(e) => handleFieldChange('MonthlyRentAmount', e.target.value)}
                  onBlur={() => handleBlur('MonthlyRentAmount')}
                  style={{
                    width: '100%', padding: '10px 14px', background: 'var(--bg-tertiary)',
                    border: `1px solid ${fieldErrors.MonthlyRentAmount ? 'var(--color-error, #ef4444)' : 'var(--glass-border)'}`,
                    borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)', fontSize: '0.88rem'
                  }}
                />
              </FormField>

              <FormField
                label="Security Deposit Amount (ETB)"
                error={fieldErrors.SecurityDepositAmount}
                icon={DollarSign}
              >
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 50000.00"
                  value={formData.SecurityDepositAmount}
                  onChange={(e) => handleFieldChange('SecurityDepositAmount', e.target.value)}
                  onBlur={() => handleBlur('SecurityDepositAmount')}
                  style={{
                    width: '100%', padding: '10px 14px', background: 'var(--bg-tertiary)',
                    border: `1px solid ${fieldErrors.SecurityDepositAmount ? 'var(--color-error, #ef4444)' : 'var(--glass-border)'}`,
                    borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)', fontSize: '0.88rem'
                  }}
                />
              </FormField>
            </div>
          </div>
        </div>
      </ModalCard>

      {/* Modal: Lease Status Transition */}
      <ModalCard
        isOpen={Boolean(statusModalLease)}
        onClose={() => setStatusModalLease(null)}
        title="Update Lease Contract Status"
        subtitle={statusModalLease ? `Agreement #${statusModalLease.AgreementNumber}` : ''}
        category="Contract Lifecycle"
        icon={FileCheck}
        accentStrip="amber"
        maxWidth="500px"
        onSubmit={handleStatusChange}
        submitText={t('common.confirm', 'Confirm Transition')}
        cancelText={t('common.cancel', 'Cancel')}
        submitDisabled={!targetStatus}
        error={errorMsg}
      >
        {statusModalLease && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--border-radius-sm)',
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.85rem'
              }}
            >
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Contract Agreement</span>
                <strong style={{ color: 'var(--text-primary)', fontSize: '0.92rem' }}>{statusModalLease.AgreementNumber}</strong>
              </div>
              <span className="badge">{statusModalLease.Status}</span>
            </div>

            <FormField label="Target Lease Status *" icon={FileCheck}>
              <select
                required
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px', background: 'var(--bg-tertiary)',
                  border: '1px solid var(--glass-border)', borderRadius: 'var(--border-radius-sm)',
                  color: 'var(--text-primary)', fontSize: '0.88rem'
                }}
              >
                <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>-- Choose New Status --</option>
                {statusModalLease.Status === 'DRAFT' && <option value="ACTIVE" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>ACTIVE (Activate Contract)</option>}
                {statusModalLease.Status === 'ACTIVE' && (
                  <>
                    <option value="EXPIRED" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>EXPIRED (Contract End Reached)</option>
                    <option value="TERMINATED" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>TERMINATED (Early Termination)</option>
                  </>
                )}
              </select>
            </FormField>

            {targetStatus === 'TERMINATED' && (
              <FormField
                label="Termination Reason *"
                error={statusErrors.terminationReason}
                icon={AlertTriangle}
              >
                <textarea
                  rows="3"
                  value={terminationReason}
                  onChange={(e) => {
                    setTerminationReason(e.target.value);
                    if (statusErrors.terminationReason) setStatusErrors({});
                  }}
                  placeholder="Provide detailed reason for contract termination..."
                  style={{
                    width: '100%', padding: '10px 14px', background: 'var(--bg-tertiary)',
                    border: `1px solid ${statusErrors.terminationReason ? 'var(--color-error, #ef4444)' : 'var(--glass-border)'}`,
                    borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)', fontSize: '0.88rem'
                  }}
                />
              </FormField>
            )}
          </div>
        )}
      </ModalCard>

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
