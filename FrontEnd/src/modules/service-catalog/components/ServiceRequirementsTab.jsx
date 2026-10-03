import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  FormInput,
  Edit2
} from 'lucide-react';
import serviceCatalogApi from '../api/serviceCatalogApi';
import ConfirmDialogModal from '../../../components/common/ConfirmDialogModal';
import AlertDialogModal from '../../../components/common/AlertDialogModal';
import { serviceSchemas } from '../../../validation';
import { FormField } from '../../../components/common/FormField';

export default function ServiceRequirementsTab({ services = [] }) {
  const [internalServices, setInternalServices] = useState([]);
  const effectiveServices = services.length > 0 ? services : internalServices;
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [fields, setFields] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Glass Modal States
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', type: 'danger', confirmText: 'Confirm', onConfirm: null });
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'error' });

  const showAlert = (title, message, type = 'error') => {
    setAlertConfig({ isOpen: true, title, message, type });
  };

  // Field Modal
  const [fieldModalOpen, setFieldModalOpen] = useState(false);
  const [fieldFormData, setFieldFormData] = useState({
    FieldName: '',
    FieldLabel: '',
    FieldType: 'TEXT',
    IsRequired: 1,
    ValidationRegex: '',
    DisplayOrder: 0
  });
  const [fieldErrors, setFieldErrors] = useState({});

  // Attachment Modal
  const [attachModalOpen, setAttachModalOpen] = useState(false);
  const [attachFormData, setAttachFormData] = useState({
    AttachmentName: '',
    Description: '',
    IsRequired: 1,
    AllowedExtensions: 'pdf,jpg,png,docx',
    MaxFileSizeMB: 10
  });
  const [attachErrors, setAttachErrors] = useState({});

  useEffect(() => {
    if (services.length === 0) {
      serviceCatalogApi.getServices({ limit: 100 })
        .then(res => {
          setInternalServices(res.data?.data?.services || res.data?.data || []);
        })
        .catch(err => console.error('Failed to fetch services fallback in ServiceRequirementsTab:', err));
    }
  }, [services]);

  useEffect(() => {
    if (effectiveServices.length > 0 && !selectedServiceId) {
      setSelectedServiceId(effectiveServices[0].ServiceID);
    }
  }, [effectiveServices]);

  useEffect(() => {
    if (selectedServiceId) {
      fetchRequirements(selectedServiceId);
    }
  }, [selectedServiceId]);

  const handleFieldFormChange = (field, value) => {
    setFieldFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleAttachFormChange = (field, value) => {
    setAttachFormData((prev) => ({ ...prev, [field]: value }));
    if (attachErrors[field]) {
      setAttachErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const fetchRequirements = async (serviceId) => {
    try {
      setLoading(true);
      setError(null);
      const [fRes, aRes] = await Promise.all([
        serviceCatalogApi.getRequirementsByServiceId(serviceId),
        serviceCatalogApi.getAttachmentsByServiceId(serviceId)
      ]);
      setFields(fRes.data?.data || []);
      setAttachments(aRes.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch service requirements');
    } finally {
      setLoading(false);
    }
  };

  const handleAddField = async (e) => {
    e.preventDefault();
    if (!selectedServiceId) return;

    // Validate using serviceRequirementFieldForm schema
    const validation = serviceSchemas.serviceRequirementFieldForm(fieldFormData);
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      return;
    }

    try {
      setSubmitting(true);
      setFieldErrors({});
      setError(null);

      await serviceCatalogApi.createRequirement({
        ServiceID: Number(selectedServiceId),
        ...validation.sanitized
      });

      setSuccess(`Form field '${validation.sanitized.FieldLabel}' added successfully.`);
      setFieldModalOpen(false);
      fetchRequirements(selectedServiceId);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add form field');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteField = async (id, name) => {
    if (!window.confirm(`Delete field '${name}'?`)) return;
    try {
      await serviceCatalogApi.deleteRequirement(id);
      setSuccess(`Field '${name}' deleted.`);
      fetchRequirements(selectedServiceId);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete field');
    }
  };

  const handleAddAttachment = async (e) => {
    e.preventDefault();
    if (!selectedServiceId) return;

    // Validate using serviceRequirementAttachmentForm schema
    const validation = serviceSchemas.serviceRequirementAttachmentForm(attachFormData);
    if (!validation.isValid) {
      setAttachErrors(validation.errors);
      return;
    }

    try {
      setSubmitting(true);
      setAttachErrors({});
      setError(null);

      await serviceCatalogApi.createAttachment({
        ServiceID: Number(selectedServiceId),
        ...validation.sanitized
      });

      setSuccess(`Attachment requirement '${validation.sanitized.AttachmentName}' added successfully.`);
      setAttachModalOpen(false);
      fetchRequirements(selectedServiceId);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add attachment requirement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAttachment = (id, name) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Attachment Requirement',
      message: `Are you sure you want to delete attachment requirement '${name}'?`,
      type: 'danger',
      confirmText: 'Delete Requirement',
      onConfirm: async () => {
        try {
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          await serviceCatalogApi.deleteAttachment(id);
          setSuccess(`Attachment requirement '${name}' deleted.`);
          fetchRequirements(selectedServiceId);
          setTimeout(() => setSuccess(null), 4000);
        } catch (err) {
          const msg = err.response?.data?.message || 'Failed to delete attachment requirement';
          setError(msg);
          showAlert('Action Failed', msg, 'error');
        }
      }
    });
  };

  const selectedServiceObj = effectiveServices.find((s) => Number(s.ServiceID) === Number(selectedServiceId));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Selector */}
      <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--border-radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>Request Form & File Attachment Builder</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Configure dynamic input fields and required document uploads for service request creation.
          </p>
        </div>

        <div style={{ minWidth: '280px' }}>
          <select
            value={selectedServiceId}
            onChange={(e) => setSelectedServiceId(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--glass-border-accent)',
              borderRadius: 'var(--border-radius-sm)',
              color: 'var(--text-primary)',
              fontWeight: '600'
            }}
          >
            <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Select Service Offering</option>
            {effectiveServices.map((s) => (
              <option key={s.ServiceID} value={s.ServiceID} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                {s.ServiceName} ({s.ServiceCode})
              </option>
            ))}
          </select>
        </div>
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

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading requirements...</div>
      ) : !selectedServiceObj ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Please select a service offering to manage request requirements.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Form Fields Section */}
          <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--border-radius-md)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FormInput size={20} style={{ color: 'var(--accent-primary)' }} />
                <h4 style={{ fontSize: '1rem', fontWeight: '700', margin: 0 }}>Custom Request Form Fields ({fields.length})</h4>
              </div>
              <button
                onClick={() => {
                  setFieldFormData({ FieldName: '', FieldLabel: '', FieldType: 'TEXT', IsRequired: 1, ValidationRegex: '', DisplayOrder: fields.length + 1 });
                  setFieldErrors({});
                  setFieldModalOpen(true);
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'var(--accent-gradient)', border: 'none', borderRadius: 'var(--border-radius-sm)', color: '#fff', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}
              >
                <Plus size={14} /> Add Field
              </button>
            </div>

            {fields.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No custom form fields defined for this service.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {fields.map((f) => (
                  <div key={f.ServiceRequirementID} style={{ padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.9rem' }}>{f.FieldLabel}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '10px', marginTop: '2px' }}>
                        <span>Code: <code style={{ color: 'var(--accent-secondary)' }}>{f.FieldName}</code></span>
                        <span>Type: <strong>{f.FieldType}</strong></span>
                        <span>{f.IsRequired ? <span style={{ color: '#ef4444' }}>* Required</span> : 'Optional'}</span>
                      </div>
                    </div>

                    <button onClick={() => handleDeleteField(f.ServiceRequirementID, f.FieldLabel)} style={{ padding: '6px', border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Attachment Requirements Section */}
          <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--border-radius-md)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Paperclip size={20} style={{ color: 'var(--accent-secondary)' }} />
                <h4 style={{ fontSize: '1rem', fontWeight: '700', margin: 0 }}>Required Document Uploads ({attachments.length})</h4>
              </div>
              <button
                onClick={() => {
                  setAttachFormData({ AttachmentName: '', Description: '', IsRequired: 1, AllowedExtensions: 'pdf,jpg,png,docx', MaxFileSizeMB: 10 });
                  setAttachErrors({});
                  setAttachModalOpen(true);
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'var(--accent-gradient-cyan)', border: 'none', borderRadius: 'var(--border-radius-sm)', color: '#fff', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}
              >
                <Plus size={14} /> Add Document Rule
              </button>
            </div>

            {attachments.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No file attachment requirements configured.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {attachments.map((a) => (
                  <div key={a.ServiceAttachmentRequirementID} style={{ padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.9rem' }}>{a.AttachmentName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '10px', marginTop: '2px' }}>
                        <span>Ext: <strong style={{ color: 'var(--text-secondary)' }}>{a.AllowedExtensions}</strong></span>
                        <span>Max: <strong>{a.MaxFileSizeMB} MB</strong></span>
                        <span>{a.IsRequired ? <span style={{ color: '#ef4444' }}>* Mandatory</span> : 'Optional'}</span>
                      </div>
                    </div>

                    <button onClick={() => handleDeleteAttachment(a.ServiceAttachmentRequirementID, a.AttachmentName)} style={{ padding: '6px', border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Field Modal */}
      {fieldModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '24px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--glass-border-accent)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '16px' }}>Add Custom Form Field</h3>
            <form onSubmit={handleAddField} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <FormField
                label="Field Identifier Code"
                id="FieldName"
                required
                error={fieldErrors.FieldName}
                helpText="Alphanumeric identifier (e.g., serial_number, urgency_level)."
              >
                <input
                  id="FieldName"
                  type="text"
                  placeholder="e.g., urgency_reason"
                  value={fieldFormData.FieldName}
                  onChange={(e) => handleFieldFormChange('FieldName', e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                  style={{
                    width: '100%', padding: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: fieldErrors.FieldName ? '1px solid var(--color-danger, #ef4444)' : '1px solid var(--glass-border)',
                    borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)', fontFamily: 'monospace'
                  }}
                />
              </FormField>

              <FormField
                label="Field Label (User Facing)"
                id="FieldLabel"
                required
                error={fieldErrors.FieldLabel}
              >
                <input
                  id="FieldLabel"
                  type="text"
                  placeholder="e.g., Reason for Urgency"
                  value={fieldFormData.FieldLabel}
                  onChange={(e) => handleFieldFormChange('FieldLabel', e.target.value)}
                  style={{
                    width: '100%', padding: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: fieldErrors.FieldLabel ? '1px solid var(--color-danger, #ef4444)' : '1px solid var(--glass-border)',
                    borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)'
                  }}
                />
              </FormField>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <FormField
                  label="Field Type"
                  id="FieldType"
                  required
                  error={fieldErrors.FieldType}
                >
                  <select
                    id="FieldType"
                    value={fieldFormData.FieldType}
                    onChange={(e) => handleFieldFormChange('FieldType', e.target.value)}
                    style={{
                      width: '100%', padding: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: fieldErrors.FieldType ? '1px solid var(--color-danger, #ef4444)' : '1px solid var(--glass-border)',
                      borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)'
                    }}
                  >
                    <option value="TEXT" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Text Input</option>
                    <option value="NUMBER" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Number Input</option>
                    <option value="DATE" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Date Picker</option>
                    <option value="SELECT" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Dropdown Select</option>
                    <option value="CHECKBOX" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Checkbox</option>
                  </select>
                </FormField>

                <FormField
                  label="Requirement"
                  id="IsRequired"
                >
                  <select
                    id="IsRequired"
                    value={fieldFormData.IsRequired}
                    onChange={(e) => handleFieldFormChange('IsRequired', Number(e.target.value))}
                    style={{
                      width: '100%', padding: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)'
                    }}
                  >
                    <option value={1} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Required *</option>
                    <option value={0} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Optional</option>
                  </select>
                </FormField>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setFieldModalOpen(false)} style={{ padding: '8px 16px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-secondary)' }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ padding: '8px 16px', borderRadius: 'var(--border-radius-sm)', border: 'none', background: 'var(--accent-gradient)', color: '#fff', fontWeight: '600' }}>Save Field</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attachment Modal */}
      {attachModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '24px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--glass-border-accent)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '16px' }}>Add Attachment Requirement</h3>
            <form onSubmit={handleAddAttachment} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <FormField
                label="Document Name"
                id="AttachmentName"
                required
                error={attachErrors.AttachmentName}
              >
                <input
                  id="AttachmentName"
                  type="text"
                  placeholder="e.g., Lease Agreement Copy, ID Proof"
                  value={attachFormData.AttachmentName}
                  onChange={(e) => handleAttachFormChange('AttachmentName', e.target.value)}
                  style={{
                    width: '100%', padding: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: attachErrors.AttachmentName ? '1px solid var(--color-danger, #ef4444)' : '1px solid var(--glass-border)',
                    borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)'
                  }}
                />
              </FormField>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <FormField
                  label="Allowed Extensions"
                  id="AllowedExtensions"
                  required
                  error={attachErrors.AllowedExtensions}
                  helpText="Comma-separated (e.g. pdf, jpg, docx)"
                >
                  <input
                    id="AllowedExtensions"
                    type="text"
                    placeholder="pdf,jpg,png,docx"
                    value={attachFormData.AllowedExtensions}
                    onChange={(e) => handleAttachFormChange('AllowedExtensions', e.target.value)}
                    style={{
                      width: '100%', padding: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: attachErrors.AllowedExtensions ? '1px solid var(--color-danger, #ef4444)' : '1px solid var(--glass-border)',
                      borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)'
                    }}
                  />
                </FormField>

                <FormField
                  label="Max Size (MB)"
                  id="MaxFileSizeMB"
                  required
                  error={attachErrors.MaxFileSizeMB}
                >
                  <input
                    id="MaxFileSizeMB"
                    type="number"
                    min="1"
                    max="100"
                    value={attachFormData.MaxFileSizeMB}
                    onChange={(e) => handleAttachFormChange('MaxFileSizeMB', e.target.value)}
                    style={{
                      width: '100%', padding: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: attachErrors.MaxFileSizeMB ? '1px solid var(--color-danger, #ef4444)' : '1px solid var(--glass-border)',
                      borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)'
                    }}
                  />
                </FormField>
              </div>

              <FormField
                label="Requirement"
                id="AttachIsRequired"
              >
                <select
                  id="AttachIsRequired"
                  value={attachFormData.IsRequired}
                  onChange={(e) => handleAttachFormChange('IsRequired', Number(e.target.value))}
                  style={{
                    width: '100%', padding: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)'
                  }}
                >
                  <option value={1} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Mandatory Upload *</option>
                  <option value={0} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Optional Attachment</option>
                </select>
              </FormField>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setAttachModalOpen(false)} style={{ padding: '8px 16px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-secondary)' }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ padding: '8px 16px', borderRadius: 'var(--border-radius-sm)', border: 'none', background: 'var(--accent-gradient-cyan)', color: '#fff', fontWeight: '600' }}>Save Requirement</button>
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
