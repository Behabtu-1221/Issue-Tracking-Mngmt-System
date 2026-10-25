import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Building2,
  Edit2,
  Trash2
} from 'lucide-react';
import tenantApi from '../api/tenantApi';
import ConfirmDialogModal from '../../../components/common/ConfirmDialogModal';
import AlertDialogModal from '../../../components/common/AlertDialogModal';
import { ActionButton, ActionGroup } from '../../../components/common/ActionButton';
import { ModalCard } from '../../../components/common/ModalCard';
import { FormField } from '../../../components/common/FormField';
import { tenantSchemas } from '../../../validation';
import { useTranslation } from '../../../i18n';

export default function SubTenantsTab() {
  const { t } = useTranslation();
  const [subTenants, setSubTenants] = useState([]);
  const [parentTenants, setParentTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [parentFilter, setParentFilter] = useState('');

  // Glass Dialog Modals State
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'error' });

  const showAlert = (title, message, type = 'error') => {
    setAlertConfig({ isOpen: true, title, message, type });
  };

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubTenant, setEditingSubTenant] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    ParentTenantID: '',
    CompanyName: '',
    RegistrationNumber: '',
    RelationshipType: 'SUBSIDIARY',
    Status: 'ACTIVE',
    Description: ''
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
    const validation = tenantSchemas.subTenantForm(formData);
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
    fetchParentTenants();
    fetchSubTenants();
  }, [search, parentFilter]);

  const fetchParentTenants = async () => {
    try {
      const res = await tenantApi.getTenants({ status: 'ACTIVE', limit: 200 });
      const raw = res.data?.data?.tenants || res.data?.data || [];
      setParentTenants(Array.isArray(raw) ? raw : []);
    } catch (err) {
      console.error('Failed to fetch parent tenants', err);
    }
  };

  const fetchSubTenants = async () => {
    try {
      setLoading(true);
      const res = await tenantApi.getSubTenants({
        search,
        parentTenantId: parentFilter
      });
      const raw = res.data?.data?.subTenants || res.data?.data || [];
      setSubTenants(Array.isArray(raw) ? raw : []);
    } catch (err) {
      console.error('Failed to fetch sub-tenants', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingSubTenant(null);
    setFormData({
      ParentTenantID: parentTenants[0]?.TenantID || '',
      CompanyName: '',
      RegistrationNumber: '',
      RelationshipType: 'SUBSIDIARY',
      Status: 'ACTIVE',
      Description: ''
    });
    setFieldErrors({});
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (st) => {
    setEditingSubTenant(st);
    setFormData({
      ParentTenantID: st.ParentTenantID,
      CompanyName: st.CompanyName,
      RegistrationNumber: st.RegistrationNumber || '',
      RelationshipType: st.RelationshipType || 'SUBSIDIARY',
      Status: st.Status || 'ACTIVE',
      Description: st.Description || ''
    });
    setFieldErrors({});
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setErrorMsg('');

    const validation = tenantSchemas.subTenantForm(formData);

    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      setErrorMsg('');
      return;
    }

    try {
      const payload = {
        ...formData,
        CompanyName: validation.sanitized.CompanyName,
        RegistrationNumber: validation.sanitized.RegistrationNumber,
        ParentTenantID: validation.sanitized.ParentTenantID,
        RelationshipType: validation.sanitized.RelationshipType,
        Description: validation.sanitized.Description
      };

      if (editingSubTenant) {
        await tenantApi.updateSubTenant(editingSubTenant.SubTenantID, payload);
      } else {
        await tenantApi.createSubTenant(payload);
      }
      setIsModalOpen(false);
      fetchSubTenants();
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

  const handleDelete = (id, companyName) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Decommission Sub-Tenant Record',
      message: `Are you sure you want to delete sub-tenant account "${companyName}"?`,
      type: 'danger',
      confirmText: 'Delete Sub-Tenant',
      onConfirm: async () => {
        try {
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          await tenantApi.deleteSubTenant(id);
          fetchSubTenants();
        } catch (err) {
          const msg = err.response?.data?.message || 'Failed to delete sub-tenant';
          showAlert('Action Failed', msg, 'error');
        }
      }
    });
  };

  return (
    <div>
      {/* Filter and Action Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '300px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder={t('tenant.searchSubTenants')}
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
            value={parentFilter}
            onChange={(e) => setParentFilter(e.target.value)}
            style={{
              padding: '10px 14px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--border-radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem'
            }}
          >
            <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{t('tenant.allParentTenants')}</option>
            {parentTenants.map((pt) => (
              <option key={pt.TenantID} value={pt.TenantID} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                {pt.CompanyName}
              </option>
            ))}
          </select>
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
          <Plus size={16} /> {t('tenant.addSubTenant')}
        </button>
      </div>

      {/* Sub-Tenants Table */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>{t('tenant.loadingSubTenants')}</div>
        ) : subTenants.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>{t('tenant.noSubTenantsFound')}</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '16px 20px' }}>{t('tenant.subTenantCompany')}</th>
                <th style={{ padding: '16px 20px' }}>{t('tenant.parentTenant')}</th>
                <th style={{ padding: '16px 20px' }}>{t('tenant.relationshipType')}</th>
                <th style={{ padding: '16px 20px' }}>{t('tenant.registrationNo')}</th>
                <th style={{ padding: '16px 20px' }}>{t('tenant.status')}</th>
                <th style={{ padding: '16px 20px', textAlign: 'right' }}>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {subTenants.map((st) => (
                <tr key={st.SubTenantID} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{st.CompanyName}</div>
                    {st.Description && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{st.Description}</div>
                    )}
                  </td>
                  <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Building2 size={14} color="var(--accent-primary)" />
                      {st.ParentCompanyName}
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{ padding: '4px 8px', borderRadius: '4px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {st.RelationshipType}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    {st.RegistrationNumber || '—'}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    {st.Status === 'ACTIVE' ? (
                      <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={12} /> {t('tenant.active')}
                      </span>
                    ) : (
                      <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <XCircle size={12} /> {t('common.inactive')}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <ActionGroup align="right">
                      <ActionButton
                        variant="edit"
                        onClick={() => handleOpenEdit(st)}
                        title={t('common.edit')}
                      />
                      <ActionButton
                        variant="delete"
                        onClick={() => handleDelete(st.SubTenantID, st.CompanyName)}
                        title={t('common.delete')}
                      />
                    </ActionGroup>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal: Create/Edit Sub-Tenant */}
      <ModalCard
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSubTenant ? 'Edit Sub-Tenant Entity' : 'Add New Sub-Tenant Entity'}
        subtitle={editingSubTenant ? 'Sub-entity under parent account' : 'Register a subsidiary, affiliate, joint venture or sub-lease tenant entity'}
        category="Tenant Entity Governance"
        icon={Users}
        accentStrip="brand"
        maxWidth="540px"
        onSubmit={handleSubmit}
        submitText={editingSubTenant ? 'Save Changes' : 'Create Sub-Tenant'}
        cancelText="Cancel"
        error={errorMsg && Object.keys(fieldErrors).length === 0 ? errorMsg : ''}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <FormField label="Parent Tenant *" error={fieldErrors.ParentTenantID} icon={Building2}>
            <select
              disabled={!!editingSubTenant}
              value={formData.ParentTenantID}
              onChange={(e) => handleFieldChange('ParentTenantID', e.target.value)}
              onBlur={() => handleBlur('ParentTenantID')}
              style={{
                width: '100%', padding: '10px 14px', background: 'var(--bg-tertiary)',
                border: `1px solid ${fieldErrors.ParentTenantID ? 'var(--color-error, #ef4444)' : 'var(--glass-border)'}`,
                borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)', fontSize: '0.88rem'
              }}
            >
              <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Select Active Parent Tenant</option>
              {parentTenants.map((pt) => (
                <option key={pt.TenantID} value={pt.TenantID} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                  {pt.CompanyName} ({pt.TenantCode})
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Sub-Tenant Company Name *" error={fieldErrors.CompanyName} icon={Users}>
            <input
              type="text"
              placeholder="e.g. Acme Logistics Division"
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            <FormField label="Relationship Type *" icon={Building2}>
              <select
                value={formData.RelationshipType}
                onChange={(e) => handleFieldChange('RelationshipType', e.target.value)}
                onBlur={() => handleBlur('RelationshipType')}
                style={{
                  width: '100%', padding: '10px 14px', background: 'var(--bg-tertiary)',
                  border: '1px solid var(--glass-border)', borderRadius: 'var(--border-radius-sm)',
                  color: 'var(--text-primary)', fontSize: '0.88rem'
                }}
              >
                <option value="SUBSIDIARY" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>SUBSIDIARY</option>
                <option value="AFFILIATE" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>AFFILIATE</option>
                <option value="JOINT_VENTURE" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>JOINT VENTURE</option>
                <option value="SUBLEASE" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>SUBLEASE TENANT</option>
              </select>
            </FormField>

            <FormField label="Registration Number" error={fieldErrors.RegistrationNumber} icon={Users}>
              <input
                type="text"
                placeholder="e.g. SUB-REG-991"
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
          </div>

          <FormField label="Description / Notes" icon={Users}>
            <textarea
              rows="3"
              placeholder="Optional notes regarding this subsidiary relationship..."
              value={formData.Description}
              onChange={(e) => handleFieldChange('Description', e.target.value)}
              style={{
                width: '100%', padding: '10px 14px', background: 'var(--bg-tertiary)',
                border: '1px solid var(--glass-border)', borderRadius: 'var(--border-radius-sm)',
                color: 'var(--text-primary)', fontSize: '0.88rem', resize: 'vertical'
              }}
            />
          </FormField>
        </div>
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
