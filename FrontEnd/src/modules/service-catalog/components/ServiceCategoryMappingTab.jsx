import React, { useState, useEffect } from 'react';
import {
  Layers, Building2, Search, Filter, Plus, Edit2, Trash2, CheckCircle2,
  XCircle, AlertCircle, RefreshCw, ArrowRight, ShieldCheck, Info, HelpCircle,
  AlertTriangle, ShieldAlert
} from 'lucide-react';
import serviceCatalogApi from '../api/serviceCatalogApi';
import orgApi from '../../organization/api/orgApi';
import ConfirmDialogModal from '../../../components/common/ConfirmDialogModal';
import AlertDialogModal from '../../../components/common/AlertDialogModal';

import { serviceSchemas } from '../../../validation';
import { FormField } from '../../../components/common/FormField';

export default function ServiceCategoryMappingTab() {
  const [mappings, setMappings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState(null);
  const [formData, setFormData] = useState({
    ServiceCategoryID: '',
    DepartmentID: '',
    IsActive: 1
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Custom Glassmorphic Confirmation Modal State
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'danger',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    onConfirm: null
  });

  // Custom Glassmorphic Alert Modal State
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'error'
  });

  // Compute category mapping status maps
  const mappedCategoriesMap = React.useMemo(() => {
    const map = new Map();
    mappings.forEach(m => {
      map.set(Number(m.ServiceCategoryID), m);
    });
    return map;
  }, [mappings]);

  const unmappedCategories = React.useMemo(() => {
    return categories.filter(c => !mappedCategoriesMap.has(Number(c.ServiceCategoryID)));
  }, [categories, mappedCategoriesMap]);

  useEffect(() => {
    fetchMetadata();
    fetchMappings();
  }, [search, statusFilter]);

  const fetchMetadata = async () => {
    try {
      const [catRes, deptRes] = await Promise.all([
        serviceCatalogApi.getCategories(),
        orgApi.getDepartments({ limit: 200 }).catch(() => ({ data: { data: { departments: [] } } }))
      ]);
      setCategories(catRes.data?.data?.categories || catRes.data?.data || []);
      setDepartments(deptRes.data?.data?.departments || deptRes.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch mapping metadata:', err);
    }
  };

  const fetchMappings = async () => {
    try {
      setLoading(true);
      const res = await serviceCatalogApi.getCategoryMappings({
        search,
        isActive: statusFilter
      });
      setMappings(res.data?.data?.mappings || []);
    } catch (err) {
      console.error('Failed to fetch category department mappings:', err);
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (title, message, type = 'error') => {
    setAlertConfig({
      isOpen: true,
      title,
      message,
      type
    });
  };

  const closeAlert = () => {
    setAlertConfig(prev => ({ ...prev, isOpen: false }));
  };

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

  const handleOpenCreate = () => {
    setEditingMapping(null);
    setFormData({
      ServiceCategoryID: unmappedCategories[0]?.ServiceCategoryID || '',
      DepartmentID: departments[0]?.DepartmentID || '',
      IsActive: 1
    });
    setFieldErrors({});
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (m) => {
    setEditingMapping(m);
    setFormData({
      ServiceCategoryID: m.ServiceCategoryID,
      DepartmentID: m.DepartmentID,
      IsActive: m.IsActive
    });
    setFieldErrors({});
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    setErrorMsg('');

    // Validate using categoryMappingForm schema with duplicate prevention
    const validation = serviceSchemas.categoryMappingForm(formData, mappings, editingMapping?.MappingID);
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      setErrorMsg(Object.values(validation.errors)[0] || 'Please resolve the mapping validation issues below.');
      return;
    }

    try {
      setSaving(true);
      setFieldErrors({});
      if (editingMapping) {
        await serviceCatalogApi.updateCategoryMapping(editingMapping.MappingID, {
          DepartmentID: validation.sanitized.DepartmentID,
          IsActive: validation.sanitized.IsActive
        });
        setSuccessMsg('Category department mapping updated successfully');
      } else {
        await serviceCatalogApi.createCategoryMapping({
          ServiceCategoryID: validation.sanitized.ServiceCategoryID,
          DepartmentID: validation.sanitized.DepartmentID,
          IsActive: validation.sanitized.IsActive
        });
        setSuccessMsg('New category department mapping established successfully');
      }

      setIsModalOpen(false);
      fetchMappings();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save mapping';
      setErrorMsg(msg);
      showAlert('Action Failed', msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (m) => {
    const nextStatus = m.IsActive ? 0 : 1;
    const actionLabel = m.IsActive ? 'Deactivate' : 'Activate';

    setConfirmConfig({
      isOpen: true,
      title: `${actionLabel} Category Mapping`,
      message: `Are you sure you want to ${actionLabel.toLowerCase()} automatic ticket routing for "${m.CategoryName}" -> "${m.DepartmentName}"?`,
      type: m.IsActive ? 'warning' : 'info',
      confirmText: `${actionLabel} Mapping`,
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          await serviceCatalogApi.updateCategoryMappingStatus(m.MappingID, { IsActive: nextStatus });
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          fetchMappings();
          setSuccessMsg(`Mapping for "${m.CategoryName}" ${m.IsActive ? 'deactivated' : 'activated'} successfully`);
          setTimeout(() => setSuccessMsg(''), 4000);
        } catch (err) {
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          const errMsg = err.response?.data?.message || 'Failed to update mapping status';
          showAlert('Permission & Action Notice', errMsg, 'error');
        }
      }
    });
  };

  const handleDelete = async (m) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Remove Category Mapping',
      message: `Are you sure you want to remove the ticket routing mapping for category "${m.CategoryName}" -> "${m.DepartmentName}"? Existing tickets will retain their snapshotted department.`,
      type: 'danger',
      confirmText: 'Remove Mapping',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          await serviceCatalogApi.deleteCategoryMapping(m.MappingID);
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          fetchMappings();
          setSuccessMsg(`Category mapping for "${m.CategoryName}" removed successfully`);
          setTimeout(() => setSuccessMsg(''), 4000);
        } catch (err) {
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          const errMsg = err.response?.data?.message || 'Failed to delete category mapping';
          showAlert('Permission & Action Notice', errMsg, 'error');
        }
      }
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header Info */}
      <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(124,58,237,0.05) 100%)', border: '1px solid var(--glass-border-accent)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={20} color="var(--accent-primary)" /> Service Category to Department Routing Mappings
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Configure automatic ticket routing: When an employee submits a request by Service Category, backend resolves and snapshot-assigns the mapped Responsible Department.
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          style={{
            padding: '10px 18px',
            background: 'var(--accent-gradient)',
            border: 'none',
            borderRadius: '8px',
            color: '#ffffff',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: 'var(--glow-accent)',
            whiteSpace: 'nowrap'
          }}
        >
          <Plus size={16} /> Add Category Mapping
        </button>
      </div>

      {/* KPI Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
            <Layers size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>{categories.length}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Categories</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            <Building2 size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>{mappings.length}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Routed Categories</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '10px', borderRadius: '10px', background: unmappedCategories.length > 0 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)', color: unmappedCategories.length > 0 ? '#f59e0b' : '#10b981' }}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: unmappedCategories.length > 0 ? '#f59e0b' : 'var(--text-primary)' }}>
              {unmappedCategories.length}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {unmappedCategories.length > 0 ? 'Unmapped (Need Routing)' : 'All Routed 100%'}
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#60a5fa' }}>
              {mappings.filter(m => m.IsActive).length}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Active Dispatch Rules</div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div style={{ padding: '14px 18px', borderRadius: '10px', background: 'rgba(74, 222, 128, 0.15)', border: '1px solid rgba(74, 222, 128, 0.3)', color: '#4ade80', fontSize: '0.88rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={18} /> {successMsg}
        </div>
      )}

      {/* Toolbar & Filters */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by category or department name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontSize: '0.88rem' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={15} color="var(--text-muted)" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: '9px 14px', borderRadius: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontSize: '0.88rem' }}
          >
            <option value="">All Statuses</option>
            <option value="1">Active Only</option>
            <option value="0">Inactive Only</option>
          </select>
        </div>

        <button
          onClick={fetchMappings}
          style={{ padding: '9px 14px', borderRadius: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Mappings Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'auto' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading mappings...</div>
        ) : mappings.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No category department mappings found. Click "Add Category Mapping" to configure ticket routing.
          </div>
        ) : (
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table style={{ width: '100%', minWidth: '850px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '14px 20px' }}>Service Category</th>
                  <th style={{ padding: '14px 20px' }}>Routing Direction</th>
                  <th style={{ padding: '14px 20px' }}>Responsible Department</th>
                  <th style={{ padding: '14px 20px' }}>Status</th>
                  <th style={{ padding: '14px 20px' }}>Configured Date</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {mappings.map(m => (
                  <tr key={m.MappingID} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{m.CategoryName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600 }}>Code: {m.CategoryCode}</div>
                    </td>

                    <td style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>
                      <ArrowRight size={16} color="var(--accent-primary)" />
                    </td>

                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Building2 size={15} color="#60a5fa" /> {m.DepartmentName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Code: {m.DepartmentCode || 'DEPT'}</div>
                    </td>

                    <td style={{ padding: '14px 20px' }}>
                      {m.IsActive ? (
                        <span style={{ padding: '4px 10px', borderRadius: '20px', background: 'rgba(74, 222, 128, 0.15)', color: '#4ade80', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={12} /> Active
                        </span>
                      ) : (
                        <span style={{ padding: '4px 10px', borderRadius: '20px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <XCircle size={12} /> Inactive
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '14px 20px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {m.CreatedDate ? new Date(m.CreatedDate).toLocaleDateString() : 'N/A'}
                    </td>

                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleToggleStatus(m)}
                          title={m.IsActive ? 'Deactivate Mapping' : 'Activate Mapping'}
                          style={{ padding: '6px 12px', borderRadius: '6px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: m.IsActive ? '#f87171' : '#4ade80', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                        >
                          {m.IsActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleOpenEdit(m)}
                          style={{ padding: '6px 10px', borderRadius: '6px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'var(--text-muted)', cursor: 'pointer' }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(m)}
                          style={{ padding: '6px 10px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', cursor: 'pointer' }}
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

      {/* Modal 1: Create/Edit Mapping Form */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--modal-backdrop, rgba(16, 20, 24, 0.78))', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '520px', background: 'var(--bg-secondary)', borderRadius: '20px', border: '1px solid var(--glass-border-accent)', padding: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {editingMapping ? 'Edit Category Mapping' : 'Map Service Category to Department'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            {errorMsg && (
              <div style={{ marginBottom: '16px', padding: '12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '0.85rem' }}>
                <AlertCircle size={15} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                {errorMsg}
              </div>
            )}

            {!editingMapping && unmappedCategories.length === 0 && (
              <div style={{ marginBottom: '16px', padding: '12px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#93c5fd', fontSize: '0.85rem' }}>
                <CheckCircle2 size={15} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                All active service categories are already mapped to a responsible department. To modify an assignment, edit the respective row in the table below.
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <FormField
                label="Service Category"
                id="ServiceCategoryID"
                required
                icon={Layers}
                error={fieldErrors.ServiceCategoryID}
                helpText={editingMapping ? 'Category cannot be modified once mapped.' : 'Select an unmapped category to route'}
              >
                <select
                  id="ServiceCategoryID"
                  disabled={Boolean(editingMapping) || (!editingMapping && unmappedCategories.length === 0)}
                  value={formData.ServiceCategoryID}
                  onChange={e => handleFieldChange('ServiceCategoryID', e.target.value)}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '8px',
                    background: 'var(--bg-tertiary)',
                    border: fieldErrors.ServiceCategoryID ? '1px solid var(--color-danger, #ef4444)' : '1px solid var(--glass-border)',
                    color: 'var(--text-primary)',
                    opacity: (editingMapping || (!editingMapping && unmappedCategories.length === 0)) ? 0.7 : 1
                  }}
                >
                  <option value="">Select Category</option>
                  {unmappedCategories.length > 0 && (
                    <optgroup label="Available Unmapped Categories">
                      {unmappedCategories.map(c => (
                        <option key={c.ServiceCategoryID} value={c.ServiceCategoryID}>
                          {c.CategoryName} ({c.CategoryCode})
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {categories.filter(c => mappedCategoriesMap.has(Number(c.ServiceCategoryID))).length > 0 && (
                    <optgroup label="Already Mapped (Edit row to reassign)">
                      {categories.filter(c => mappedCategoriesMap.has(Number(c.ServiceCategoryID))).map(c => (
                        <option key={c.ServiceCategoryID} value={c.ServiceCategoryID} disabled={!editingMapping}>
                          {c.CategoryName} ({c.CategoryCode}) — Routed to {mappedCategoriesMap.get(Number(c.ServiceCategoryID))?.DepartmentName}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </FormField>

              <FormField
                label="Responsible Department"
                id="DepartmentID"
                required
                icon={Building2}
                error={fieldErrors.DepartmentID}
                helpText="Issues filed under this category will route to this department."
              >
                <select
                  id="DepartmentID"
                  value={formData.DepartmentID}
                  onChange={e => handleFieldChange('DepartmentID', e.target.value)}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '8px',
                    background: 'var(--bg-tertiary)',
                    border: fieldErrors.DepartmentID ? '1px solid var(--color-danger, #ef4444)' : '1px solid var(--glass-border)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <option value="">Select Responsible Department</option>
                  {departments.map(d => (
                    <option key={d.DepartmentID} value={d.DepartmentID}>
                      {d.DepartmentName} ({d.DepartmentCode || 'DEPT'})
                    </option>
                  ))}
                </select>
              </FormField>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Status
                </label>
                <select
                  value={formData.IsActive}
                  onChange={e => setFormData({ ...formData, IsActive: Number(e.target.value) })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                >
                  <option value={1}>Active</option>
                  <option value={0}>Inactive</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '9px 16px', background: 'transparent', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || (!editingMapping && unmappedCategories.length === 0)}
                  style={{
                    padding: '9px 20px',
                    background: (!editingMapping && unmappedCategories.length === 0) ? 'var(--bg-tertiary)' : 'var(--accent-gradient)',
                    border: 'none',
                    borderRadius: '8px',
                    color: (!editingMapping && unmappedCategories.length === 0) ? 'var(--text-muted)' : '#ffffff',
                    fontWeight: 700,
                    cursor: (!editingMapping && unmappedCategories.length === 0) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {saving ? 'Saving...' : (!editingMapping && unmappedCategories.length === 0) ? 'All Categories Routed' : (editingMapping ? 'Save Changes' : 'Create Mapping')}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Shared Glass Modals */}
      <ConfirmDialogModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        confirmText={confirmConfig.confirmText}
        cancelText={confirmConfig.cancelText}
        onConfirm={confirmConfig.onConfirm}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />

      <AlertDialogModal
        isOpen={alertConfig.isOpen}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={closeAlert}
      />

    </div>
  );
}
