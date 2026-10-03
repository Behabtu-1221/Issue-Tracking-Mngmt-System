import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Search,
  Tag,
  DollarSign,
  FileText,
  Clock,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Filter,
  Eye,
  X,
  Sparkles,
  Globe,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';
import serviceCatalogApi from '../api/serviceCatalogApi';
import ConfirmDialogModal from '../../../components/common/ConfirmDialogModal';
import AlertDialogModal from '../../../components/common/AlertDialogModal';
import { serviceSchemas } from '../../../validation';
import { FormField } from '../../../components/common/FormField';

export default function ServicesTab({ categories = [], onServiceUpdated }) {
  const [internalCategories, setInternalCategories] = useState([]);
  const effectiveCategories = categories.length > 0 ? categories : internalCategories;
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Glass Modal States
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', type: 'danger', confirmText: 'Confirm', onConfirm: null });
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'error' });

  const showAlert = (title, message, type = 'error') => {
    setAlertConfig({ isOpen: true, title, message, type });
  };

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [editingService, setEditingService] = useState(null);

  const [formData, setFormData] = useState({
    ServiceCategoryID: '',
    ServiceTypeID: 1,
    ServiceLevelID: 1,
    ServiceCode: '',
    ServiceName: '',
    Description: '',
    EstimatedCost: 0,
    CurrencyCode: 'ETB',
    IsActive: 1
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (categories.length === 0) {
      serviceCatalogApi.getCategories({ limit: 100 })
        .then(res => {
          setInternalCategories(res.data?.data?.categories || res.data?.data || []);
        })
        .catch(err => console.error('Failed to fetch categories fallback in ServicesTab:', err));
    }
  }, [categories]);

  useEffect(() => {
    fetchServices();
  }, [selectedCategory]);

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const fetchServices = async (searchTerm = search) => {
    try {
      setLoading(true);
      setError(null);
      const res = await serviceCatalogApi.getServices({
        search: searchTerm,
        categoryId: selectedCategory || undefined
      });
      setServices(res.data?.data?.services || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch services catalog');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    fetchServices(val);
  };

  const handleOpenModal = (service = null) => {
    setFieldErrors({});
    setError(null);
    if (service) {
      setEditingService(service);
      setFormData({
        ServiceCategoryID: service.ServiceCategoryID || '',
        ServiceTypeID: service.ServiceTypeID || 1,
        ServiceLevelID: service.ServiceLevelID || 1,
        ServiceCode: service.ServiceCode || '',
        ServiceName: service.ServiceName || '',
        Description: service.Description || '',
        EstimatedCost: service.EstimatedCost || 0,
        CurrencyCode: service.CurrencyCode || 'ETB',
        IsActive: service.IsActive !== undefined ? service.IsActive : 1
      });
    } else {
      setEditingService(null);
      setFormData({
        ServiceCategoryID: effectiveCategories[0]?.ServiceCategoryID || '',
        ServiceTypeID: 1,
        ServiceLevelID: 1,
        ServiceCode: '',
        ServiceName: '',
        Description: '',
        EstimatedCost: 0,
        CurrencyCode: 'ETB',
        IsActive: 1
      });
    }
    setModalOpen(true);
  };

  const handleOpenDetail = (service) => {
    setSelectedService(service);
    setDetailModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate using production-ready Service Offering Schema
    const validation = serviceSchemas.serviceOfferingForm(formData, Boolean(editingService));
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      setError('Please review and correct the highlighted form fields below.');
      return;
    }

    try {
      setSubmitting(true);
      setFieldErrors({});

      const payload = validation.sanitized;

      if (editingService) {
        await serviceCatalogApi.updateService(editingService.ServiceID, payload);
        setSuccess(`Service '${payload.ServiceName}' updated successfully.`);
      } else {
        await serviceCatalogApi.createService(payload);
        setSuccess(`Service '${payload.ServiceName}' created successfully.`);
      }

      setModalOpen(false);
      fetchServices();
      if (onServiceUpdated) onServiceUpdated();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save service offering');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id, name) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Decommission Service Offering',
      message: `Are you sure you want to delete service offering '${name}'? Existing issue requests will retain their service records.`,
      type: 'danger',
      confirmText: 'Delete Service',
      onConfirm: async () => {
        try {
          setError(null);
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          await serviceCatalogApi.deleteService(id);
          setSuccess(`Service offering '${name}' deleted successfully.`);
          fetchServices();
          if (onServiceUpdated) onServiceUpdated();
          setTimeout(() => setSuccess(null), 4000);
        } catch (err) {
          const msg = err.response?.data?.message || 'Failed to delete service';
          setError(msg);
          showAlert('Action Restricted', msg, 'error');
        }
      }
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Controls & Filter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '300px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search services by name, code, description..."
              value={search}
              onChange={handleSearchChange}
              style={{
                width: '100%',
                padding: '10px 14px 10px 42px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--border-radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem'
              }}
            />
          </div>

          <div style={{ minWidth: '200px' }}>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--border-radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem'
              }}
            >
              <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>All Categories</option>
              {effectiveCategories.map((c) => (
                <option key={c.ServiceCategoryID} value={c.ServiceCategoryID} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                  {c.CategoryName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={() => handleOpenModal()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            background: 'var(--accent-gradient)',
            border: 'none',
            borderRadius: 'var(--border-radius-sm)',
            color: '#fff',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-lg)'
          }}
        >
          <Plus size={18} />
          Create Service Offering
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div style={{ padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', fontSize: '0.9rem' }}>
          {success}
        </div>
      )}

      {/* Table / List View */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading services catalog...</div>
      ) : services.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No service offerings found matching criteria. Click "Create Service Offering" to add one.
        </div>
      ) : (
        <div className="glass-panel" style={{ overflowX: 'auto' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Service Offering</th>
                <th>Category</th>
                <th>Service Type / Level</th>
                <th>Est. Cost</th>
                <th>Billing Model</th>
                <th>Requirements</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.map((svc) => (
                <tr key={svc.ServiceID}>
                  <td>
                    <div>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.95rem' }}>{svc.ServiceName}</div>
                      <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--accent-secondary)' }}>
                        {svc.ServiceCode}
                      </span>
                    </div>
                  </td>

                  <td>
                    <span style={{ padding: '4px 8px', borderRadius: '6px', backgroundColor: 'rgba(138, 75, 255, 0.15)', color: 'var(--accent-primary)', fontSize: '0.8rem', fontWeight: '500' }}>
                      {svc.CategoryName}
                    </span>
                  </td>

                  <td>
                    <div style={{ fontSize: '0.85rem' }}>
                      <div>{svc.ServiceTypeName || 'Standard Service'}</div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{svc.ServiceLevelName || 'Default SLA'}</span>
                    </div>
                  </td>

                  <td>
                    <div style={{ fontWeight: '600', color: '#10b981', fontSize: '0.9rem' }}>
                      {Number(svc.EstimatedCost) > 0 ? `${svc.EstimatedCost} ${svc.CurrencyCode}` : 'Free / Included'}
                    </div>
                  </td>

                  <td>
                    <span
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        backgroundColor: svc.BillingType === 'BILLABLE' ? 'rgba(14, 165, 233, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                        color: svc.BillingType === 'BILLABLE' ? '#0ea5e9' : 'var(--text-secondary)'
                      }}
                    >
                      {svc.PricingModel || 'FLAT_RATE'} ({svc.BillingType || 'NON_BILLABLE'})
                    </span>
                  </td>

                  <td>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <div>Form Fields: <strong>{svc.RequirementCount || 0}</strong></div>
                      <div>Attachments: <strong>{svc.AttachmentRequirementCount || 0}</strong></div>
                    </div>
                  </td>

                  <td>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        backgroundColor: svc.IsActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: svc.IsActive ? '#10b981' : '#ef4444'
                      }}
                    >
                      {svc.IsActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      {svc.IsActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <button
                        onClick={() => handleOpenDetail(svc)}
                        title="View Details"
                        style={{
                          padding: '6px',
                          borderRadius: 'var(--border-radius-sm)',
                          border: '1px solid var(--glass-border)',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer'
                        }}
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => handleOpenModal(svc)}
                        title="Edit Service"
                        style={{
                          padding: '6px',
                          borderRadius: 'var(--border-radius-sm)',
                          border: '1px solid var(--glass-border)',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer'
                        }}
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(svc.ServiceID, svc.ServiceName)}
                        title="Delete Service"
                        style={{
                          padding: '6px',
                          borderRadius: 'var(--border-radius-sm)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          color: '#ef4444',
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal Drawer */}
      {detailModalOpen && selectedService && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'var(--modal-backdrop, rgba(16, 20, 24, 0.78))',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '600px',
              padding: '28px',
              borderRadius: 'var(--border-radius-lg)',
              border: '1px solid var(--glass-border-accent)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--accent-secondary)', fontFamily: 'monospace' }}>{selectedService.ServiceCode}</span>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '700', margin: '4px 0 0 0' }}>{selectedService.ServiceName}</h2>
              </div>
              <button onClick={() => setDetailModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.9rem' }}>
              <div style={{ padding: '14px', borderRadius: 'var(--border-radius-sm)', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--glass-border)' }}>
                <strong style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '4px' }}>Description</strong>
                <p style={{ margin: 0, color: 'var(--text-primary)' }}>{selectedService.Description || 'No description provided.'}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ padding: '12px', borderRadius: 'var(--border-radius-sm)', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--glass-border)' }}>
                  <strong style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '4px' }}>Category</strong>
                  <span style={{ color: 'var(--text-primary)' }}>{selectedService.CategoryName}</span>
                </div>
                <div style={{ padding: '12px', borderRadius: 'var(--border-radius-sm)', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--glass-border)' }}>
                  <strong style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '4px' }}>Estimated Cost</strong>
                  <span style={{ color: '#10b981', fontWeight: '600' }}>{Number(selectedService.EstimatedCost) > 0 ? `${selectedService.EstimatedCost} ${selectedService.CurrencyCode}` : 'Free / Included'}</span>
                </div>
                <div style={{ padding: '12px', borderRadius: 'var(--border-radius-sm)', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--glass-border)' }}>
                  <strong style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '4px' }}>Service Type</strong>
                  <span style={{ color: 'var(--text-primary)' }}>{selectedService.ServiceTypeName || 'Standard'}</span>
                </div>
                <div style={{ padding: '12px', borderRadius: 'var(--border-radius-sm)', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--glass-border)' }}>
                  <strong style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '4px' }}>Service Level</strong>
                  <span style={{ color: 'var(--text-primary)' }}>{selectedService.ServiceLevelName || 'Default SLA'}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button
                onClick={() => setDetailModalOpen(false)}
                style={{ padding: '10px 20px', borderRadius: 'var(--border-radius-sm)', border: 'none', background: 'var(--accent-gradient)', color: '#fff', fontWeight: '600', cursor: 'pointer' }}
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Create/Edit */}
      {modalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'var(--modal-backdrop, rgba(16, 20, 24, 0.78))',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '580px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              padding: '0',
              borderRadius: 'var(--border-radius-lg)',
              border: '1px solid var(--glass-border-accent)',
              overflow: 'hidden',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              background: 'var(--bg-secondary)',
              animation: 'fadeIn 0.25s ease-out'
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--glass-border)',
              background: 'var(--bg-tertiary)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  padding: '8px',
                  borderRadius: '10px',
                  background: 'rgba(138, 75, 255, 0.15)',
                  color: 'var(--accent-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Sparkles size={18} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                    {editingService ? 'Edit Service Offering' : 'Create Service Offering'}
                  </h2>
                  <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Define catalog service specifications, classification, and pricing
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{
                  background: 'none', border: 'none', color: 'var(--text-muted)',
                  cursor: 'pointer', padding: '6px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', flex: 1 }}>
              {/* Category & Service Code */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <FormField
                  label="Category"
                  id="ServiceCategoryID"
                  required
                  icon={Layers}
                  error={fieldErrors.ServiceCategoryID}
                >
                  <select
                    id="ServiceCategoryID"
                    value={formData.ServiceCategoryID}
                    onChange={(e) => handleFieldChange('ServiceCategoryID', e.target.value)}
                    style={{
                      width: '100%', padding: '11px 14px',
                      background: 'var(--bg-tertiary)',
                      border: fieldErrors.ServiceCategoryID ? '1px solid var(--color-danger, #ef4444)' : '1px solid var(--glass-border)',
                      borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)',
                      fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box'
                    }}
                  >
                    <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Select Category</option>
                    {effectiveCategories.map((c) => (
                      <option key={c.ServiceCategoryID} value={c.ServiceCategoryID} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                        📂 {c.CategoryName}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField
                  label="Service Code"
                  id="ServiceCode"
                  required
                  icon={Tag}
                  error={fieldErrors.ServiceCode}
                  helpText={editingService ? 'Service codes are immutable once created.' : 'Uppercase code e.g. SVC-HVAC-01'}
                >
                  <input
                    id="ServiceCode"
                    type="text"
                    disabled={!!editingService}
                    placeholder="e.g. HVAC-REPAIR"
                    value={formData.ServiceCode}
                    onChange={(e) => handleFieldChange('ServiceCode', e.target.value.toUpperCase())}
                    style={{
                      width: '100%', padding: '11px 14px',
                      background: 'var(--bg-tertiary)',
                      border: fieldErrors.ServiceCode ? '1px solid var(--color-danger, #ef4444)' : '1px solid var(--glass-border)',
                      borderRadius: 'var(--border-radius-sm)',
                      color: 'var(--text-primary)', fontFamily: 'monospace', fontWeight: 600,
                      fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box',
                      opacity: editingService ? 0.7 : 1
                    }}
                  />
                </FormField>
              </div>

              {/* Service Name */}
              <FormField
                label="Service Title / Name"
                id="ServiceName"
                required
                icon={Sparkles}
                error={fieldErrors.ServiceName}
              >
                <input
                  id="ServiceName"
                  type="text"
                  placeholder="e.g. HVAC Repair & Climate Maintenance"
                  value={formData.ServiceName}
                  onChange={(e) => handleFieldChange('ServiceName', e.target.value)}
                  style={{
                    width: '100%', padding: '11px 14px',
                    background: 'var(--bg-tertiary)',
                    border: fieldErrors.ServiceName ? '1px solid var(--color-danger, #ef4444)' : '1px solid var(--glass-border)',
                    borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)',
                    fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </FormField>

              {/* Estimated Cost & Currency */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                <FormField
                  label="Estimated Unit Cost"
                  id="EstimatedCost"
                  icon={DollarSign}
                  error={fieldErrors.EstimatedCost}
                >
                  <input
                    id="EstimatedCost"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.EstimatedCost}
                    onChange={(e) => handleFieldChange('EstimatedCost', e.target.value)}
                    style={{
                      width: '100%', padding: '11px 14px',
                      background: 'var(--bg-tertiary)',
                      border: fieldErrors.EstimatedCost ? '1px solid var(--color-danger, #ef4444)' : '1px solid var(--glass-border)',
                      borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)',
                      fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </FormField>

                <FormField
                  label="Currency"
                  id="CurrencyCode"
                  icon={Globe}
                  error={fieldErrors.CurrencyCode}
                >
                  <select
                    id="CurrencyCode"
                    value={formData.CurrencyCode}
                    onChange={(e) => handleFieldChange('CurrencyCode', e.target.value)}
                    style={{
                      width: '100%', padding: '11px 14px',
                      background: 'var(--bg-tertiary)',
                      border: fieldErrors.CurrencyCode ? '1px solid var(--color-danger, #ef4444)' : '1px solid var(--glass-border)',
                      borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)',
                      fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box'
                    }}
                  >
                    <option value="ETB" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>ETB (Birr)</option>
                    <option value="USD" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>USD ($)</option>
                    <option value="EUR" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>EUR (€)</option>
                  </select>
                </FormField>
              </div>

              {/* Description */}
              <FormField
                label="Detailed Service Scope & Description"
                id="Description"
                icon={FileText}
                error={fieldErrors.Description}
                helpText="Explain what is covered in this service (up to 1000 characters)."
              >
                <textarea
                  id="Description"
                  rows={3}
                  placeholder="Provide comprehensive details about what is included in this service offering..."
                  value={formData.Description}
                  onChange={(e) => handleFieldChange('Description', e.target.value)}
                  style={{
                    width: '100%', padding: '11px 14px',
                    background: 'var(--bg-tertiary)',
                    border: fieldErrors.Description ? '1px solid var(--color-danger, #ef4444)' : '1px solid var(--glass-border)',
                    borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)',
                    fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', resize: 'vertical'
                  }}
                />
              </FormField>

              {/* Status Selector Card */}
              <div>
                <label style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px'
                }}>
                  <ShieldCheck size={14} color="var(--accent-primary)" /> Availability Status
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div
                    onClick={() => setFormData({ ...formData, IsActive: 1 })}
                    style={{
                      padding: '12px 14px', borderRadius: 'var(--border-radius-sm)', cursor: 'pointer',
                      border: Number(formData.IsActive) === 1 ? '1px solid var(--accent-primary)' : '1px solid var(--glass-border)',
                      background: Number(formData.IsActive) === 1 ? 'rgba(138, 75, 255, 0.08)' : 'var(--bg-tertiary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={16} color={Number(formData.IsActive) === 1 ? 'var(--accent-primary)' : 'var(--text-muted)'} />
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Published & Active</span>
                    </div>
                  </div>

                  <div
                    onClick={() => setFormData({ ...formData, IsActive: 0 })}
                    style={{
                      padding: '12px 14px', borderRadius: 'var(--border-radius-sm)', cursor: 'pointer',
                      border: Number(formData.IsActive) === 0 ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid var(--glass-border)',
                      background: Number(formData.IsActive) === 0 ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-tertiary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <XCircle size={16} color={Number(formData.IsActive) === 0 ? '#fbbf24' : 'var(--text-muted)'} />
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Draft / Inactive</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex', justifyContent: 'flex-end', gap: '12px',
                marginTop: '8px', paddingTop: '16px', borderTop: '1px solid var(--glass-border)'
              }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{
                    padding: '10px 18px', borderRadius: 'var(--border-radius-sm)',
                    border: '1px solid var(--glass-border)', background: 'transparent',
                    color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '10px 22px', borderRadius: 'var(--border-radius-sm)', border: 'none',
                    background: 'var(--accent-gradient)', color: '#ffffff', fontWeight: '700',
                    fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                    boxShadow: 'var(--glow-accent)'
                  }}
                >
                  {submitting && <RefreshCw size={14} className="spin" />}
                  {submitting ? 'Saving Service...' : editingService ? 'Update Service' : 'Create Service Offering'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Glass Modals */}
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
