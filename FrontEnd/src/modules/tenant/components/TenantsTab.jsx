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
  X
} from 'lucide-react';
import tenantApi from '../api/tenantApi';
import parkApi from '../../business-park/api/parkApi';
import TenantDetailModal from './TenantDetailModal';
import ConfirmDialogModal from '../../../components/common/ConfirmDialogModal';
import AlertDialogModal from '../../../components/common/AlertDialogModal';
import { tenantSchemas } from '../../../validation';

export default function TenantsTab({ onRefreshMetrics }) {
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
            <CheckCircle2 size={12} /> Active
          </span>
        );
      case 'ONBOARDING':
        return (
          <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} /> Onboarding
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <AlertCircle size={12} /> Suspended
          </span>
        );
      case 'TERMINATED':
        return (
          <span style={{ padding: '4px 8px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.1)', color: '#888', fontSize: '0.75rem' }}>
            Terminated
          </span>
        );
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div>
      {/* Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '300px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by company, code, registration #..."
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
            <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>All Statuses</option>
            <option value="ONBOARDING" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Onboarding</option>
            <option value="ACTIVE" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Active</option>
            <option value="SUSPENDED" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Suspended</option>
            <option value="TERMINATED" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Terminated</option>
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
          <Plus size={16} /> Onboard New Tenant
        </button>
      </div>

      {/* Tenants Table */}
      <div className="glass-card" style={{ padding: '0', overflow: 'auto' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading tenants...</div>
        ) : tenants.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No tenants found.</div>
        ) : (
          <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', minWidth: '900px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '16px 20px' }}>Company & Code</th>
                <th style={{ padding: '16px 20px' }}>Business Park</th>
                <th style={{ padding: '16px 20px' }}>Registration / Tax ID</th>
                <th style={{ padding: '16px 20px' }}>Status</th>
                <th style={{ padding: '16px 20px' }}>Leases / Offices</th>
                <th style={{ padding: '16px 20px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.TenantID} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', transition: 'background 0.2s ease' }}>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{t.CompanyName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px' }}>{t.TenantCode}</span>
                      {t.Website && (
                        <a href={t.Website.startsWith('http') ? t.Website : `https://${t.Website}`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Globe size={12} /> {t.Website}
                        </a>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Building2 size={14} color="var(--accent-primary)" />
                      {t.BusinessParkName || 'N/A'}
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <div>Reg: {t.RegistrationNumber || '—'}</div>
                    <div>TIN: {t.TaxIdentificationNo || '—'}</div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {getStatusBadge(t.Status)}
                      <button
                        onClick={() => { setStatusModalTenant(t); setNewStatus(''); setErrorMsg(''); }}
                        title="Change Status Lifecycle"
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                      >
                        <Edit2 size={13} />
                      </button>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
                        <FileText size={13} /> {t.LeaseCount} Leases
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: t.ActiveAllocationCount > 0 ? '#4ade80' : 'var(--text-muted)' }}>
                        <Building2 size={13} /> {t.ActiveAllocationCount} Allocated
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => setSelectedTenant(t)}
                        style={{ padding: '6px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', borderRadius: '4px', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.8rem' }}
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleOpenEdit(t)}
                        style={{ padding: '6px 10px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', borderRadius: '4px', color: 'var(--text-muted)', cursor: 'pointer' }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(t.TenantID, t.CompanyName)}
                        style={{ padding: '6px 10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '4px', color: '#f87171', cursor: 'pointer' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Modal: Create/Edit Tenant */}
      {isCreateModalOpen && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(12px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', padding: '28px', background: 'var(--bg-secondary)', borderRadius: '24px', border: '1px solid var(--glass-border-accent)', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)' }}>
                <Users color="var(--accent-primary)" />
                {editingTenant ? 'Edit Tenant Profile' : 'Onboard New Tenant'}
              </h2>
              <button onClick={() => setIsCreateModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {(errorMsg || Object.keys(fieldErrors).length > 0) && (
              <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '0.85rem', marginBottom: '16px' }}>
                {errorMsg || Object.values(fieldErrors)[0]}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>Company Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Innovations PLC"
                  value={formData.CompanyName}
                  onChange={(e) => handleFieldChange('CompanyName', e.target.value)}
                  onBlur={() => handleBlur('CompanyName')}
                  style={{
                    width: '100%', padding: '10px 14px', background: 'var(--bg-tertiary)',
                    border: fieldErrors.CompanyName ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                    borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)'
                  }}
                />
                {fieldErrors.CompanyName && (
                  <span style={{ fontSize: '0.74rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}>
                    ⚠️ {fieldErrors.CompanyName}
                  </span>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>Tenant Code *</label>
                <input
                  type="text"
                  placeholder="e.g. TNT-01"
                  value={formData.TenantCode}
                  onChange={(e) => handleFieldChange('TenantCode', e.target.value.toUpperCase())}
                  onBlur={() => handleBlur('TenantCode')}
                  style={{
                    width: '100%', padding: '10px 14px', background: 'var(--bg-tertiary)',
                    border: fieldErrors.TenantCode ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                    borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)', fontFamily: 'monospace'
                  }}
                />
                {fieldErrors.TenantCode && (
                  <span style={{ fontSize: '0.74rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}>
                    ⚠️ {fieldErrors.TenantCode}
                  </span>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>Business Park</label>
                <div style={{
                  width: '100%', padding: '10px 14px', borderRadius: '8px',
                  background: 'rgba(99, 102, 241, 0.08)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  color: 'var(--text-primary)', fontSize: '0.88rem',
                  fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                  🏢 {parks.length > 0 ? `${parks[0].BusinessParkName} (${parks[0].BusinessParkCode || ''})` : 'Ethiopian IT Park'}
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '3px', display: 'block' }}>
                  Single campus system — auto-assigned
                </span>
                {fieldErrors.BusinessParkID && (
                  <span style={{ fontSize: '0.74rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}>
                    ⚠️ {fieldErrors.BusinessParkID}
                  </span>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>Registration Number</label>
                <input
                  type="text"
                  placeholder="e.g. REG-2024-001"
                  value={formData.RegistrationNumber}
                  onChange={(e) => handleFieldChange('RegistrationNumber', e.target.value)}
                  onBlur={() => handleBlur('RegistrationNumber')}
                  style={{
                    width: '100%', padding: '10px 14px', background: 'var(--bg-tertiary)',
                    border: fieldErrors.RegistrationNumber ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                    borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)'
                  }}
                />
                {fieldErrors.RegistrationNumber && (
                  <span style={{ fontSize: '0.74rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}>
                    ⚠️ {fieldErrors.RegistrationNumber}
                  </span>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>Tax ID (TIN)</label>
                <input
                  type="text"
                  placeholder="e.g. TIN-992381"
                  value={formData.TaxIdentificationNo}
                  onChange={(e) => handleFieldChange('TaxIdentificationNo', e.target.value)}
                  onBlur={() => handleBlur('TaxIdentificationNo')}
                  style={{
                    width: '100%', padding: '10px 14px', background: 'var(--bg-tertiary)',
                    border: fieldErrors.TaxIdentificationNo ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                    borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)'
                  }}
                />
                {fieldErrors.TaxIdentificationNo && (
                  <span style={{ fontSize: '0.74rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}>
                    ⚠️ {fieldErrors.TaxIdentificationNo}
                  </span>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>Website</label>
                <input
                  type="text"
                  placeholder="https://company.com"
                  value={formData.Website}
                  onChange={(e) => handleFieldChange('Website', e.target.value)}
                  onBlur={() => handleBlur('Website')}
                  style={{
                    width: '100%', padding: '10px 14px', background: 'var(--bg-tertiary)',
                    border: fieldErrors.Website ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                    borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)'
                  }}
                />
                {fieldErrors.Website && (
                  <span style={{ fontSize: '0.74rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}>
                    ⚠️ {fieldErrors.Website}
                  </span>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>Account Status</label>
                <select
                  value={formData.Status}
                  onChange={(e) => handleFieldChange('Status', e.target.value)}
                  style={{
                    width: '100%', padding: '10px 14px', background: 'var(--bg-tertiary)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)'
                  }}
                >
                  <option value="ACTIVE" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>ACTIVE (Ready for Leases & Spaces)</option>
                  <option value="ONBOARDING" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>ONBOARDING (Under Setup)</option>
                </select>
              </div>

              <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  style={{ padding: '10px 18px', background: 'transparent', border: '1px solid var(--glass-border)', borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 22px', background: 'var(--accent-gradient)', border: 'none', borderRadius: 'var(--border-radius-sm)', color: '#ffffff', fontWeight: '700', cursor: 'pointer', boxShadow: 'var(--glow-accent)' }}
                >
                  {editingTenant ? 'Save Changes' : 'Onboard Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Status Lifecycle Transition */}
      {statusModalTenant && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(12px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '480px', padding: '28px', background: 'var(--bg-secondary)', borderRadius: '24px', border: '1px solid var(--glass-border-accent)', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)' }}>
                <ShieldAlert color="var(--accent-primary)" />
                Tenant Lifecycle Transition
              </h2>
              <button onClick={() => setStatusModalTenant(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Current Status of <strong style={{ color: 'var(--text-primary)' }}>{statusModalTenant.CompanyName}</strong> is{' '}
              <span className="badge">{statusModalTenant.Status}</span>
            </p>

            {errorMsg && (
              <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '0.85rem', marginBottom: '16px' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleStatusChange}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Select Target Status:</label>
              <select
                required
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                style={{ width: '100%', padding: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)', marginBottom: '20px' }}
              >
                <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>-- Choose New Status --</option>
                {statusModalTenant.Status === 'ONBOARDING' && <option value="ACTIVE" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>ACTIVE (Onboarding Complete)</option>}
                {statusModalTenant.Status === 'ACTIVE' && (
                  <>
                    <option value="SUSPENDED" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>SUSPENDED (Temporary Hold)</option>
                    <option value="TERMINATED" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>TERMINATED (Offboard Tenant)</option>
                  </>
                )}
                {statusModalTenant.Status === 'SUSPENDED' && (
                  <>
                    <option value="ACTIVE" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>ACTIVE (Re-activate Tenant)</option>
                    <option value="TERMINATED" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>TERMINATED (Offboard Tenant)</option>
                  </>
                )}
              </select>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setStatusModalTenant(null)}
                  style={{ padding: '10px 18px', background: 'transparent', border: '1px solid var(--glass-border)', borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newStatus}
                  style={{ padding: '10px 22px', background: 'var(--accent-gradient)', border: 'none', borderRadius: 'var(--border-radius-sm)', color: '#ffffff', fontWeight: '700', cursor: 'pointer', boxShadow: 'var(--glow-accent)', opacity: !newStatus ? 0.5 : 1 }}
                >
                  Update Status
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

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
