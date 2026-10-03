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
import { tenantSchemas } from '../../../validation';
import { usePermissionContext } from '../../role-permission-management/contexts/PermissionContext';

export default function LeasesTab({ onRefreshMetrics }) {
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
            <CheckCircle2 size={12} /> Active
          </span>
        );
      case 'DRAFT':
        return (
          <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} /> Draft
          </span>
        );
      case 'EXPIRED':
        return (
          <span style={{ padding: '4px 8px', borderRadius: '4px', background: 'rgba(234, 179, 8, 0.15)', color: '#eab308', fontSize: '0.75rem' }}>
            Expired
          </span>
        );
      case 'TERMINATED':
        return (
          <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <XCircle size={12} /> Terminated
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
                {expiringLeases.length} Lease Contract(s) Expiring Within 30 Days
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
              placeholder="Search by agreement # or tenant company..."
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
            <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>All Lease Statuses</option>
            <option value="DRAFT" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Draft</option>
            <option value="ACTIVE" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Active</option>
            <option value="EXPIRED" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Expired</option>
            <option value="TERMINATED" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Terminated</option>
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
            <Plus size={16} /> Draft New Lease
          </button>
        )}
      </div>

      {/* Leases Table */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading lease agreements...</div>
        ) : leases.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No lease contracts found.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '16px 20px' }}>Agreement # & Tenant</th>
                <th style={{ padding: '16px 20px' }}>Lease Period</th>
                <th style={{ padding: '16px 20px' }}>Monthly Rent</th>
                <th style={{ padding: '16px 20px' }}>Security Deposit</th>
                <th style={{ padding: '16px 20px' }}>Status</th>
                <th style={{ padding: '16px 20px', textAlign: 'right' }}>Actions</th>
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
                        <button
                          onClick={() => { setStatusModalLease(l); setTargetStatus(''); setTerminationReason(''); setErrorMsg(''); }}
                          title="Transition Contract Status"
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                        >
                          <Edit2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      {isParkAdmin && l.Status === 'DRAFT' && (
                        <button
                          onClick={() => handleOpenEdit(l)}
                          style={{ padding: '6px 10px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', borderRadius: '4px', color: 'var(--text-primary)', cursor: 'pointer' }}
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                      {isParkAdmin && l.Status === 'DRAFT' && (
                        <button
                          onClick={() => handleDelete(l.LeaseAgreementID, l.AgreementNumber)}
                          style={{ padding: '6px 10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '4px', color: '#f87171', cursor: 'pointer' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal: Create/Edit Lease */}
      {isModalOpen && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(12px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', padding: '28px', background: 'var(--bg-secondary)', borderRadius: '24px', border: '1px solid var(--glass-border-accent)', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)' }}>
                <FileCheck color="var(--accent-primary)" />
                {editingLease ? 'Edit Draft Lease Contract' : 'Draft New Lease Contract'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {(errorMsg || Object.keys(fieldErrors).length > 0) && (
              <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '0.85rem', marginBottom: '16px' }}>
                {errorMsg || Object.values(fieldErrors)[0]}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>Tenant *</label>
                <select
                  value={formData.TenantID}
                  onChange={(e) => handleFieldChange('TenantID', e.target.value)}
                  onBlur={() => handleBlur('TenantID')}
                  style={{
                    width: '100%', padding: '10px 14px', background: 'var(--bg-tertiary)',
                    border: fieldErrors.TenantID ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                    borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)'
                  }}
                >
                  <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Select Tenant</option>
                  {tenants.map((t) => (
                    <option key={t.TenantID} value={t.TenantID} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                      {t.CompanyName} ({t.TenantCode})
                    </option>
                  ))}
                </select>
                {fieldErrors.TenantID && (
                  <span style={{ fontSize: '0.74rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}>
                    ⚠️ {fieldErrors.TenantID}
                  </span>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>Agreement # *</label>
                <input
                  type="text"
                  placeholder="e.g. LEA-10023"
                  value={formData.AgreementNumber}
                  onChange={(e) => handleFieldChange('AgreementNumber', e.target.value)}
                  onBlur={() => handleBlur('AgreementNumber')}
                  style={{
                    width: '100%', padding: '10px 14px', background: 'var(--bg-tertiary)',
                    border: fieldErrors.AgreementNumber ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                    borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)', fontFamily: 'monospace'
                  }}
                />
                {fieldErrors.AgreementNumber && (
                  <span style={{ fontSize: '0.74rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}>
                    ⚠️ {fieldErrors.AgreementNumber}
                  </span>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>Start Date *</label>
                <input
                  type="date"
                  value={formData.StartDate}
                  onChange={(e) => handleFieldChange('StartDate', e.target.value)}
                  onBlur={() => handleBlur('StartDate')}
                  style={{
                    width: '100%', padding: '10px 14px', background: 'var(--bg-tertiary)',
                    border: fieldErrors.StartDate ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                    borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)'
                  }}
                />
                {fieldErrors.StartDate && (
                  <span style={{ fontSize: '0.74rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}>
                    ⚠️ {fieldErrors.StartDate}
                  </span>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>End Date *</label>
                <input
                  type="date"
                  value={formData.EndDate}
                  onChange={(e) => handleFieldChange('EndDate', e.target.value)}
                  onBlur={() => handleBlur('EndDate')}
                  style={{
                    width: '100%', padding: '10px 14px', background: 'var(--bg-tertiary)',
                    border: fieldErrors.EndDate ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                    borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)'
                  }}
                />
                {fieldErrors.EndDate && (
                  <span style={{ fontSize: '0.74rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}>
                    ⚠️ {fieldErrors.EndDate}
                  </span>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>Execution Date *</label>
                <input
                  type="date"
                  value={formData.ExecutionDate}
                  onChange={(e) => handleFieldChange('ExecutionDate', e.target.value)}
                  onBlur={() => handleBlur('ExecutionDate')}
                  style={{
                    width: '100%', padding: '10px 14px', background: 'var(--bg-tertiary)',
                    border: fieldErrors.ExecutionDate ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                    borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)'
                  }}
                />
                {fieldErrors.ExecutionDate && (
                  <span style={{ fontSize: '0.74rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}>
                    ⚠️ {fieldErrors.ExecutionDate}
                  </span>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>Grace Period (Days)</label>
                <input
                  type="number"
                  min="0"
                  max="365"
                  value={formData.GracePeriodDays}
                  onChange={(e) => handleFieldChange('GracePeriodDays', e.target.value)}
                  onBlur={() => handleBlur('GracePeriodDays')}
                  style={{
                    width: '100%', padding: '10px 14px', background: 'var(--bg-tertiary)',
                    border: fieldErrors.GracePeriodDays ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                    borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)'
                  }}
                />
                {fieldErrors.GracePeriodDays && (
                  <span style={{ fontSize: '0.74rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}>
                    ⚠️ {fieldErrors.GracePeriodDays}
                  </span>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>Monthly Rent Amount *</label>
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
                    border: fieldErrors.MonthlyRentAmount ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                    borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)'
                  }}
                />
                {fieldErrors.MonthlyRentAmount && (
                  <span style={{ fontSize: '0.74rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}>
                    ⚠️ {fieldErrors.MonthlyRentAmount}
                  </span>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>Security Deposit Amount</label>
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
                    border: fieldErrors.SecurityDepositAmount ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                    borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)'
                  }}
                />
                {fieldErrors.SecurityDepositAmount && (
                  <span style={{ fontSize: '0.74rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}>
                    ⚠️ {fieldErrors.SecurityDepositAmount}
                  </span>
                )}
              </div>

              <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '10px 18px', background: 'transparent', border: '1px solid var(--glass-border)', borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 22px', background: 'var(--accent-gradient)', border: 'none', borderRadius: 'var(--border-radius-sm)', color: '#ffffff', fontWeight: '700', cursor: 'pointer', boxShadow: 'var(--glow-accent)' }}
                >
                  {editingLease ? 'Save Lease' : 'Create Draft Lease'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Lease Status Transition */}
      {statusModalLease && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(12px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '480px', padding: '28px', background: 'var(--bg-secondary)', borderRadius: '24px', border: '1px solid var(--glass-border-accent)', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)' }}>
                <FileCheck color="var(--accent-primary)" />
                Update Lease Contract Status
              </h2>
              <button onClick={() => setStatusModalLease(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Contract <strong style={{ color: 'var(--text-primary)' }}>{statusModalLease.AgreementNumber}</strong> is currently{' '}
              <span className="badge">{statusModalLease.Status}</span>
            </p>

            {errorMsg && (
              <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '0.85rem', marginBottom: '16px' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleStatusChange}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Select Target Lease Status:</label>
              <select
                required
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value)}
                style={{ width: '100%', padding: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)', marginBottom: '16px' }}
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

              {targetStatus === 'TERMINATED' && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>Termination Reason *</label>
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
                      border: statusErrors.terminationReason ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                      borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)'
                    }}
                  />
                  {statusErrors.terminationReason && (
                    <span style={{ fontSize: '0.74rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}>
                      ⚠️ {statusErrors.terminationReason}
                    </span>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setStatusModalLease(null)}
                  style={{ padding: '10px 18px', background: 'transparent', border: '1px solid var(--glass-border)', borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!targetStatus}
                  style={{ padding: '10px 22px', background: 'var(--accent-gradient)', border: 'none', borderRadius: 'var(--border-radius-sm)', color: '#ffffff', fontWeight: '700', cursor: 'pointer', boxShadow: 'var(--glow-accent)', opacity: !targetStatus ? 0.5 : 1 }}
                >
                  Update Status
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
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
