import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  Plus,
  Search,
  Layers,
  Edit2,
  Trash2,
  Info,
  CheckCircle2,
  XCircle,
  Building2,
  X,
  Tag,
  Sparkles,
  FileText,
  ShieldCheck,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import serviceCatalogApi from '../api/serviceCatalogApi';
import { parkApi } from '../../business-park/api/parkApi';
import orgApi from '../../organization/api/orgApi';
import ConfirmDialogModal from '../../../components/common/ConfirmDialogModal';
import AlertDialogModal from '../../../components/common/AlertDialogModal';
import { serviceSchemas } from '../../../validation';
import { FormField } from '../../../components/common/FormField';

export default function ServiceCategoriesTab({ onCategoryUpdated }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [parks, setParks] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Glass Modal States
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', type: 'danger', confirmText: 'Confirm', onConfirm: null });
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'error' });

  const showAlert = (title, message, type = 'error') => {
    setAlertConfig({ isOpen: true, title, message, type });
  };

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    TenantID: '',
    CategoryCode: '',
    CategoryName: '',
    Description: '',
    DepartmentID: '',
    IsActive: 1
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchParks();
    fetchDepartments();
  }, []);

  const fetchParks = async () => {
    try {
      const res = await parkApi.getParks({ limit: 500 });
      const parkList = res.data?.data?.parks || res.data?.data || [];
      setParks(Array.isArray(parkList) ? parkList : []);
    } catch (err) {
      console.error('Failed to fetch business parks:', err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await orgApi.getDepartments({ limit: 200 });
      const deptList = res.data?.data?.departments || res.data?.data || [];
      setDepartments(Array.isArray(deptList) ? deptList : []);
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    }
  };

  const fetchCategories = async (searchTerm = search) => {
    try {
      setLoading(true);
      setError(null);
      const res = await serviceCatalogApi.getCategories({ search: searchTerm });
      setCategories(res.data?.data?.categories || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch service categories');
    } finally {
      setLoading(false);
    }
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

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    fetchCategories(val);
  };

  const handleOpenModal = (category = null) => {
    setFieldErrors({});
    setError(null);
    if (category) {
      setEditingCategory(category);
      setFormData({
        TenantID: category.TenantID || '',
        CategoryCode: category.CategoryCode || '',
        CategoryName: category.CategoryName || '',
        Description: category.Description || '',
        DepartmentID: category.RoutedDepartmentID || '',
        IsActive: category.IsActive !== undefined ? category.IsActive : 1
      });
    } else {
      setEditingCategory(null);
      setFormData({
        TenantID: '',
        CategoryCode: '',
        CategoryName: '',
        Description: '',
        DepartmentID: '',
        IsActive: 1
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate using categoryForm schema
    const validation = serviceSchemas.categoryForm(formData, Boolean(editingCategory));
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      setError('Please review and correct the invalid category fields below.');
      return;
    }

    try {
      setSubmitting(true);
      setFieldErrors({});
      const sanitized = validation.sanitized;

      if (editingCategory) {
        await serviceCatalogApi.updateCategory(editingCategory.ServiceCategoryID, {
          TenantID: sanitized.TenantID,
          CategoryName: sanitized.CategoryName,
          Description: sanitized.Description,
          DepartmentID: sanitized.DepartmentID,
          IsActive: sanitized.IsActive
        });
        setSuccess(`Category '${sanitized.CategoryName}' updated successfully.`);
      } else {
        await serviceCatalogApi.createCategory(sanitized);
        setSuccess(`Category '${sanitized.CategoryName}' created successfully.`);
      }

      setModalOpen(false);
      fetchCategories();
      if (onCategoryUpdated) onCategoryUpdated();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save service category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name, serviceCount) => {
    if (serviceCount > 0) {
      showAlert(
        'Category Cannot Be Deleted',
        `Category '${name}' cannot be deleted because it currently has ${serviceCount} active services associated with it. Reassign or delete those services first.`,
        'warning'
      );
      return;
    }
    
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Service Category',
      message: `Are you sure you want to delete category '${name}'?`,
      type: 'danger',
      confirmText: 'Delete Category',
      onConfirm: async () => {
        try {
          setError(null);
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          await serviceCatalogApi.deleteCategory(id);
          setSuccess(`Category '${name}' deleted successfully.`);
          fetchCategories();
          if (onCategoryUpdated) onCategoryUpdated();
          setTimeout(() => setSuccess(null), 4000);
        } catch (err) {
          const msg = err.response?.data?.message || 'Failed to delete category';
          setError(msg);
          showAlert('Action Restricted', msg, 'error');
        }
      }
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <ConfirmDialogModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        type={confirmConfig.type}
        confirmText={confirmConfig.confirmText}
      />
      <AlertDialogModal
        isOpen={alertConfig.isOpen}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
        type={alertConfig.type}
      />

      {/* Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ position: 'relative', minWidth: '300px', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search categories by name, code, description..."
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
          Create Category
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

      {/* Categories Grid */}
      {loading ? (
        <div style={{ padding: '40px', textStyle: 'center', color: 'var(--text-muted)' }}>Loading categories...</div>
      ) : categories.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No service categories found. Click "Create Category" to get started.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {categories.map((cat) => (
            <div
              key={cat.ServiceCategoryID}
              className="glass-panel"
              style={{
                padding: '20px',
                borderRadius: 'var(--border-radius-md)',
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between',
                transition: 'all 0.2s ease',
                border: '1px solid var(--glass-border)',
                background: 'var(--glass-bg)'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(138, 75, 255, 0.15)', color: 'var(--accent-primary)' }}>
                      <FolderKanban size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>{cat.CategoryName}</h3>
                      <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--accent-secondary)' }}>
                        {cat.CategoryCode}
                      </span>
                    </div>
                  </div>

                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      backgroundColor: cat.IsActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: cat.IsActive ? '#10b981' : '#ef4444'
                    }}
                  >
                    {cat.IsActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                    {cat.IsActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                  {(cat.BusinessParkName || cat.TenantName) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--accent-secondary)' }}>
                      <Building2 size={13} />
                      <span>🏞️ {cat.BusinessParkName || cat.TenantName}</span>
                    </div>
                  )}

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.78rem',
                    background: 'rgba(255, 255, 255, 0.03)',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--glass-border)'
                  }}>
                    <ArrowRight size={12} color="var(--accent-primary)" />
                    <span style={{ color: 'var(--text-muted)' }}>Ticket Routing:</span>
                    {cat.RoutedDepartmentName ? (
                      <span style={{ color: '#60a5fa', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Building2 size={12} /> {cat.RoutedDepartmentName}
                      </span>
                    ) : (
                      <span style={{ color: '#f59e0b', fontStyle: 'italic' }}>Unmapped (No auto-dispatch)</span>
                    )}
                  </div>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.4' }}>
                  {cat.Description || 'No description provided.'}
                </p>
              </div>

              <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '12px', marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <Layers size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                  <strong>{cat.ServiceCount || 0}</strong> Services Offered
                </span>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleOpenModal(cat)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 'var(--border-radius-sm)',
                      border: '1px solid var(--glass-border)',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Edit2 size={14} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(cat.ServiceCategoryID, cat.CategoryName, cat.ServiceCount)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 'var(--border-radius-sm)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      color: '#ef4444',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT CATEGORY MODAL */}
      {modalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--modal-backdrop, rgba(16, 20, 24, 0.78))',
          backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            width: '600px', maxWidth: '95vw', maxHeight: '90vh',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--border-radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden', animation: 'slideUp 0.3s ease-out'
          }}>
            {/* Header */}
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
                  <FolderKanban size={18} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                    {editingCategory ? 'Edit Service Category' : 'Create Service Category'}
                  </h2>
                  <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Define catalog service classification and organization grouping
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{
                  background: 'none', border: 'none', color: 'var(--text-muted)',
                  cursor: 'pointer', padding: '6px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', overflowY: 'auto', flex: 1 }}>
              <FormField
                label="Target Business Park Campus"
                id="TenantID"
                icon={Building2}
                error={fieldErrors.TenantID}
                helpText="Optional: Leave blank to make this category globally accessible park-wide."
              >
                <select
                  id="TenantID"
                  value={formData.TenantID}
                  onChange={(e) => handleFieldChange('TenantID', e.target.value)}
                  style={{
                    width: '100%', padding: '11px 14px',
                    background: 'var(--bg-tertiary)',
                    border: fieldErrors.TenantID ? '1px solid var(--color-danger, #ef4444)' : '1px solid var(--glass-border)',
                    borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)',
                    fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box'
                  }}
                >
                  <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Global (All Business Park Campuses)</option>
                  {parks.map((p) => (
                    <option key={p.BusinessParkID} value={p.BusinessParkID} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                      🏞️ {p.BusinessParkName} ({p.BusinessParkCode})
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField
                label="Responsible Department (Ticket Auto-Routing)"
                id="DepartmentID"
                icon={Building2}
                error={fieldErrors.DepartmentID}
                helpText="Issues and tickets filed under this category will automatically route to this department."
              >
                <select
                  id="DepartmentID"
                  value={formData.DepartmentID}
                  onChange={(e) => handleFieldChange('DepartmentID', e.target.value)}
                  style={{
                    width: '100%', padding: '11px 14px',
                    background: 'var(--bg-tertiary)',
                    border: fieldErrors.DepartmentID ? '1px solid var(--color-danger, #ef4444)' : '1px solid var(--glass-border)',
                    borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)',
                    fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box'
                  }}
                >
                  <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>-- No Routing Department (Manual Dispatch) --</option>
                  {departments.map((d) => (
                    <option key={d.DepartmentID} value={d.DepartmentID} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                      🏢 {d.DepartmentName} ({d.DepartmentCode || 'DEPT'})
                    </option>
                  ))}
                </select>
              </FormField>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '16px' }}>
                <FormField
                  label="Category Code"
                  id="CategoryCode"
                  required
                  icon={Tag}
                  error={fieldErrors.CategoryCode}
                  helpText={editingCategory ? 'Category codes are immutable.' : 'e.g. IT-NET'}
                >
                  <input
                    id="CategoryCode"
                    type="text"
                    disabled={!!editingCategory}
                    placeholder="e.g. IT-NET"
                    value={formData.CategoryCode}
                    onChange={(e) => handleFieldChange('CategoryCode', e.target.value.toUpperCase())}
                    style={{
                      width: '100%', padding: '11px 14px',
                      background: 'var(--bg-tertiary)',
                      border: fieldErrors.CategoryCode ? '1px solid var(--color-danger, #ef4444)' : '1px solid var(--glass-border)',
                      borderRadius: 'var(--border-radius-sm)',
                      color: 'var(--text-primary)', fontFamily: 'monospace', fontWeight: 600,
                      fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box',
                      opacity: editingCategory ? 0.7 : 1
                    }}
                  />
                </FormField>

                <FormField
                  label="Category Name"
                  id="CategoryName"
                  required
                  icon={Sparkles}
                  error={fieldErrors.CategoryName}
                >
                  <input
                    id="CategoryName"
                    type="text"
                    placeholder="e.g. IT & Network Infrastructure"
                    value={formData.CategoryName}
                    onChange={(e) => handleFieldChange('CategoryName', e.target.value)}
                    style={{
                      width: '100%', padding: '11px 14px',
                      background: 'var(--bg-tertiary)',
                      border: fieldErrors.CategoryName ? '1px solid var(--color-danger, #ef4444)' : '1px solid var(--glass-border)',
                      borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)',
                      fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </FormField>
              </div>

              <FormField
                label="Category Description"
                id="Description"
                icon={FileText}
                error={fieldErrors.Description}
                helpText="Overview of services included in this category classification."
              >
                <textarea
                  id="Description"
                  rows={3}
                  placeholder="Overview of services included in this category classification..."
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
                  <ShieldCheck size={14} color="var(--accent-primary)" /> Status
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
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Active Category</span>
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
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Inactive</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
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
                  {submitting ? 'Saving Category...' : editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
