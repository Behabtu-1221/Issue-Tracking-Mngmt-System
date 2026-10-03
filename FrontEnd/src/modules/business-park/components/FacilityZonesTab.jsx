import React, { useState, useEffect } from 'react';
import { MapPin, Search, Plus, RefreshCw, Edit, Trash2, X, ArrowLeftRight } from 'lucide-react';
import parkApi from '../api/parkApi';
import { ZONE_TYPES } from '../constants/parkConstants';
import ConfirmDialogModal from '../../../components/common/ConfirmDialogModal';
import AlertDialogModal from '../../../components/common/AlertDialogModal';
import { parkSchemas } from '../../../validation';

export default function FacilityZonesTab() {
  const [zones, setZones] = useState([]);
  const [parks, setParks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Glass Dialog Modals State
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'error' });

  const showAlert = (title, message, type = 'error') => {
    setAlertConfig({ isOpen: true, title, message, type });
  };

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    BusinessParkID: '',
    FacilityZoneCode: '',
    FacilityZoneName: '',
    ZoneType: 'GREEN_ZONE',
    Description: '',
    CapacityLimit: ''
  });
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [formSubmitting, setFormSubmitting] = useState(false);

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

  const fetchZonesAndParks = async () => {
    try {
      setLoading(true);
      const [zRes, pRes] = await Promise.all([
        parkApi.getFacilityZones({ search: searchTerm }),
        parkApi.getParks()
      ]);
      const rawZones = zRes.data?.data?.facilityZones || zRes.data?.data?.zones || zRes.data?.data || [];
      setZones(Array.isArray(rawZones) ? rawZones : []);

      const rawParks = pRes.data?.data?.parks || pRes.data?.data || [];
      const parkList = Array.isArray(rawParks) ? rawParks : [];
      setParks(parkList);
      if (parkList.length > 0) {
        setFormData(prev => ({
          ...prev,
          BusinessParkID: prev.BusinessParkID || parkList[0]?.BusinessParkID || ''
        }));
      }
    } catch (err) {
      console.error('Failed to load facility zones:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZonesAndParks();
  }, [searchTerm]);

  const handleSaveZone = async (e) => {
    e.preventDefault();
    if (formSubmitting) return;

    setFormError('');
    setFieldErrors({});

    const validation = parkSchemas.facilityZoneForm({
      FacilityZoneName: formData.FacilityZoneName,
      FacilityZoneCode: formData.FacilityZoneCode,
      BusinessParkID: formData.BusinessParkID,
      ZoneType: formData.ZoneType,
      CapacityLimit: formData.CapacityLimit,
      Description: formData.Description
    });

    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      setFormError('');
      return;
    }

    setFormSubmitting(true);

    try {
      const payload = {
        BusinessParkID: validation.sanitized.ParkID,
        FacilityZoneName: validation.sanitized.ZoneName,
        FacilityZoneCode: validation.sanitized.ZoneCode,
        ZoneType: formData.ZoneType || 'OPERATIONAL',
        Description: validation.sanitized.Description || '',
        CapacityLimit: validation.sanitized.CapacityLimit
      };

      if (selectedZone) {
        await parkApi.updateFacilityZone(selectedZone.FacilityZoneID, payload);
      } else {
        await parkApi.createFacilityZone(payload);
      }
      setShowCreateModal(false);
      setSelectedZone(null);
      resetForm();
      fetchZonesAndParks();
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to save facility zone.';
      setFormError(errMsg);
      if (err.response?.data?.details && Array.isArray(err.response.data.details)) {
        const backendFieldErrors = {};
        err.response.data.details.forEach(d => {
          backendFieldErrors[d.field] = d.message;
        });
        setFieldErrors(backendFieldErrors);
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  const promptDeleteZone = (z) => {
    setSelectedZone(z);
    setConfirmConfig({
      isOpen: true,
      title: 'Remove Facility Zone',
      message: `Are you sure you want to delete zone "${z.FacilityZoneName}"?`,
      type: 'danger',
      confirmText: 'Delete Facility Zone',
      onConfirm: async () => {
        try {
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          await parkApi.deleteFacilityZone(z.FacilityZoneID);
          setSelectedZone(null);
          fetchZonesAndParks();
        } catch (err) {
          const msg = err.response?.data?.message || 'Failed to delete facility zone.';
          showAlert('Action Restricted', msg, 'error');
        }
      }
    });
  };

  const openEditModal = (z) => {
    setSelectedZone(z);
    setFormError('');
    setFieldErrors({});
    setFormData({
      BusinessParkID: z.BusinessParkID,
      FacilityZoneCode: z.FacilityZoneCode,
      FacilityZoneName: z.FacilityZoneName,
      ZoneType: z.ZoneType,
      Description: z.Description || '',
      CapacityLimit: z.CapacityLimit || ''
    });
    setShowCreateModal(true);
  };

  const resetForm = () => {
    setFormError('');
    setFieldErrors({});
    setFormData({
      BusinessParkID: parks[0]?.BusinessParkID || '',
      FacilityZoneCode: '',
      FacilityZoneName: '',
      ZoneType: 'GREEN_ZONE',
      Description: '',
      CapacityLimit: ''
    });
  };

  return (
    <div>
      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search facility zones by name or code"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 16px 10px 42px',
              borderRadius: 'var(--border-radius-sm)',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-primary)',
              fontSize: '0.88rem'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={fetchZonesAndParks}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: 'var(--border-radius-sm)',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--glass-border)',
              cursor: 'pointer',
              fontSize: '0.88rem'
            }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>

          <button
            onClick={() => {
              setSelectedZone(null);
              resetForm();
              setShowCreateModal(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: 'var(--border-radius-sm)',
              background: 'var(--accent-gradient)',
              color: '#ffffff',
              border: 'none',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: 'var(--glow-accent)',
              fontSize: '0.88rem'
            }}
          >
            <Plus size={16} /> Add Facility Zone
          </button>
        </div>
      </div>

      {/* Facility Zones Table */}
      <div className="glass-panel" style={{ overflow: 'hidden', padding: 0 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <RefreshCw className="animate-spin" size={32} style={{ marginBottom: '16px' }} />
            <p>Loading facility zones...</p>
          </div>
        ) : zones.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <MapPin size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <p>No facility zones registered.</p>
          </div>
        ) : (
          <>
            <div className="table-scroll-container">
              <table className="custom-table" style={{ minWidth: '1000px' }}>
                <thead>
                  <tr>
                    <th>Zone Name</th>
                    <th>Zone Code</th>
                    <th>Zone Type</th>
                    <th>Business Park</th>
                    <th>Buildings</th>
                    <th>Capacity Limit</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {zones.map((z) => (
                    <tr key={z.FacilityZoneID}>
                      <td>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{z.FacilityZoneName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{z.Description || '—'}</div>
                      </td>
                      <td style={{ fontFamily: 'monospace', color: 'var(--accent-primary)' }}>{z.FacilityZoneCode}</td>
                      <td>
                        <span className="badge badge-info">{z.ZoneType}</span>
                      </td>
                      <td>{z.BusinessParkName}</td>
                      <td>
                        <span className="badge badge-info">{z.BuildingCount || 0} Buildings</span>
                      </td>
                      <td style={{ fontWeight: '600' }}>{z.CapacityLimit ? `${z.CapacityLimit} Vehicles/Persons` : 'Unlimited'}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            onClick={() => openEditModal(z)}
                            title="Edit Facility Zone"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              padding: '6px 12px', borderRadius: '8px',
                              background: 'rgba(99, 102, 241, 0.15)',
                              border: '1px solid rgba(99, 102, 241, 0.35)',
                              color: 'var(--accent-primary)',
                              fontWeight: 700, fontSize: '0.8rem',
                              cursor: 'pointer', transition: 'all 0.2s'
                            }}
                          >
                            <Edit size={14} /> Edit
                          </button>
                          <button
                            onClick={() => promptDeleteZone(z)}
                            title="Delete Facility Zone"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              padding: '6px 12px', borderRadius: '8px',
                              background: 'rgba(239, 68, 68, 0.15)',
                              border: '1px solid rgba(239, 68, 68, 0.35)',
                              color: 'var(--color-danger)',
                              fontWeight: 700, fontSize: '0.8rem',
                              cursor: 'pointer', transition: 'all 0.2s'
                            }}
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table Footer with Record Count & Horizontal Scroll Indicator */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 20px',
              borderTop: '1px solid var(--glass-border)',
              background: 'var(--bg-tertiary)',
              fontSize: '0.78rem',
              color: 'var(--text-muted)'
            }}>
              <span>Showing <strong>{zones.length}</strong> facility zone records</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <ArrowLeftRight size={13} style={{ color: 'var(--accent-primary)' }} />
                Use horizontal scroll bar to inspect all zone boundaries & allocations
              </span>
            </div>
          </>
        )}
      </div>

      {/* CREATE / EDIT ZONE MODAL — Premium Enterprise Form */}
      {showCreateModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            width: '620px', maxWidth: '95vw', maxHeight: '88vh', overflowY: 'auto',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--glass-border)',
            borderRadius: '16px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
            animation: 'slideUp 0.3s ease-out'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '24px 28px 20px',
              borderBottom: '1px solid var(--glass-border)',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(168,85,247,0.05))'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ padding: '10px', borderRadius: '12px', background: 'var(--accent-gradient)', color: '#fff' }}>
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {selectedZone ? 'Edit Facility Zone' : 'Register Facility Zone'}
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {selectedZone ? `Modifying zone ID: ${selectedZone.FacilityZoneCode}` : 'Define operational, parking, or security zone'}
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowCreateModal(false)} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}>
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Form Content */}
            <div style={{ padding: '24px 28px' }}>
              {formError && (
                <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: '0.84rem', marginBottom: '20px', fontWeight: 600 }}>
                  ⚠️ {formError}
                </div>
              )}

              <form onSubmit={handleSaveZone} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} noValidate>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>Business Park</label>
                  <div style={{
                    width: '100%', padding: '10px 14px', borderRadius: '8px',
                    background: 'rgba(99, 102, 241, 0.08)',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                    color: 'var(--text-primary)', fontSize: '0.88rem',
                    fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px'
                  }}>
                    🏢 {parks.length > 0 ? `${parks[0].BusinessParkName} (${parks[0].BusinessParkCode})` : 'Ethiopian IT Park'}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '3px', display: 'block' }}>
                    Single campus system — auto-assigned
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>Zone Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. North Perimeter Security"
                      value={formData.FacilityZoneName}
                      onChange={(e) => handleFieldChange('FacilityZoneName', e.target.value)}
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: '8px',
                        background: 'var(--bg-tertiary)',
                        border: (fieldErrors.FacilityZoneName || fieldErrors.ZoneName) ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                        color: 'var(--text-primary)', fontSize: '0.88rem'
                      }}
                    />
                    {(fieldErrors.FacilityZoneName || fieldErrors.ZoneName) && (
                      <span style={{ fontSize: '0.74rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}>
                        ⚠️ {fieldErrors.FacilityZoneName || fieldErrors.ZoneName}
                      </span>
                    )}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>Zone Code *</label>
                    <input
                      type="text"
                      placeholder="e.g. ZN-N01"
                      value={formData.FacilityZoneCode}
                      onChange={(e) => handleFieldChange('FacilityZoneCode', e.target.value.toUpperCase())}
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: '8px',
                        background: 'var(--bg-tertiary)',
                        border: (fieldErrors.FacilityZoneCode || fieldErrors.ZoneCode) ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                        color: 'var(--text-primary)', fontSize: '0.88rem'
                      }}
                    />
                    {(fieldErrors.FacilityZoneCode || fieldErrors.ZoneCode) && (
                      <span style={{ fontSize: '0.74rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}>
                        ⚠️ {fieldErrors.FacilityZoneCode || fieldErrors.ZoneCode}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>Zone Type *</label>
                    <select
                      value={formData.ZoneType}
                      onChange={(e) => handleFieldChange('ZoneType', e.target.value)}
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: '8px',
                        background: 'var(--bg-tertiary)',
                        border: (fieldErrors.ZoneType || fieldErrors.ZoneTypeCode) ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                        color: 'var(--text-primary)', fontSize: '0.88rem'
                      }}
                    >
                      {ZONE_TYPES.map(zt => (
                        <option key={zt.value} value={zt.value}>{zt.label}</option>
                      ))}
                    </select>
                    {(fieldErrors.ZoneType || fieldErrors.ZoneTypeCode) && (
                      <span style={{ fontSize: '0.74rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}>
                        ⚠️ {fieldErrors.ZoneType || fieldErrors.ZoneTypeCode}
                      </span>
                    )}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>Capacity Limit (Optional)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 50 (Persons / Vehicles)"
                      value={formData.CapacityLimit}
                      onChange={(e) => handleFieldChange('CapacityLimit', e.target.value)}
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: '8px',
                        background: 'var(--bg-tertiary)',
                        border: fieldErrors.CapacityLimit ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                        color: 'var(--text-primary)', fontSize: '0.88rem'
                      }}
                    />
                    {fieldErrors.CapacityLimit && (
                      <span style={{ fontSize: '0.74rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}>
                        ⚠️ {fieldErrors.CapacityLimit}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>Description</label>
                  <textarea
                    rows={3}
                    placeholder="Zone boundaries, access policies, or operational instructions..."
                    value={formData.Description}
                    onChange={(e) => handleFieldChange('Description', e.target.value)}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '8px',
                      background: 'var(--bg-tertiary)',
                      border: fieldErrors.Description ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                      color: 'var(--text-primary)', fontSize: '0.88rem', resize: 'vertical'
                    }}
                  />
                  {fieldErrors.Description && (
                    <span style={{ fontSize: '0.74rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}>
                      ⚠️ {fieldErrors.Description}
                    </span>
                  )}
                </div>

                {/* Footer Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '20px', borderTop: '1px solid var(--glass-border)' }}>
                  <button type="button" onClick={() => setShowCreateModal(false)} style={{ padding: '10px 22px', borderRadius: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem' }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={formSubmitting} style={{ padding: '10px 24px', borderRadius: '10px', background: 'var(--accent-gradient)', border: 'none', color: '#fff', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', opacity: formSubmitting ? 0.7 : 1 }}>
                    {formSubmitting ? '⏳ Saving...' : selectedZone ? '✓ Update Zone' : '✓ Add Zone'}
                  </button>
                </div>
              </form>
            </div>
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
