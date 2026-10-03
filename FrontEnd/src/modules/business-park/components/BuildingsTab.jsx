import React, { useState, useEffect } from 'react';
import { Building, Search, Plus, RefreshCw, Edit, Trash2, X, Layers, MapPin, ArrowLeftRight } from 'lucide-react';
import parkApi from '../api/parkApi';
import ConfirmDialogModal from '../../../components/common/ConfirmDialogModal';
import AlertDialogModal from '../../../components/common/AlertDialogModal';
import { parkSchemas } from '../../../validation';

export default function BuildingsTab() {
  const [buildings, setBuildings] = useState([]);
  const [parks, setParks] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [parkFilter, setParkFilter] = useState('');
  const [zoneFilter, setZoneFilter] = useState('');

  // Glass Dialog Modals State
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'error' });

  const showAlert = (title, message, type = 'error') => {
    setAlertConfig({ isOpen: true, title, message, type });
  };

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    BusinessParkID: '',
    FacilityZoneID: '',
    BuildingCode: '',
    BuildingName: '',
    ShortName: '',
    Description: '',
    TotalFloors: 1,
    TotalAreaSquareMeter: ''
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

  const fetchBuildingsAndMeta = async () => {
    try {
      setLoading(true);
      const [bRes, pRes, zRes] = await Promise.all([
        parkApi.getBuildings({ search: searchTerm, parkId: parkFilter, zoneId: zoneFilter }),
        parkApi.getParks(),
        parkApi.getFacilityZones({ parkId: parkFilter })
      ]);
      const rawBuildings = bRes.data?.data?.buildings || bRes.data?.data || [];
      setBuildings(Array.isArray(rawBuildings) ? rawBuildings : []);

      const rawParks = pRes.data?.data?.parks || pRes.data?.data || [];
      setParks(Array.isArray(rawParks) ? rawParks : []);

      const rawZones = zRes.data?.data?.facilityZones || zRes.data?.data?.zones || zRes.data?.data || [];
      setZones(Array.isArray(rawZones) ? rawZones : []);
    } catch (err) {
      console.error('Failed to load buildings or metadata:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuildingsAndMeta();
  }, [searchTerm, parkFilter, zoneFilter]);

  // When parkFilter changes, reset zoneFilter if not valid
  useEffect(() => {
    if (parkFilter) {
      const parkZones = zones.filter(z => String(z.BusinessParkID) === String(parkFilter));
      if (zoneFilter && !parkZones.some(z => String(z.FacilityZoneID) === String(zoneFilter))) {
        setZoneFilter('');
      }
    }
  }, [parkFilter]);

  const availableZonesForForm = zones.filter(
    z => !formData.BusinessParkID || String(z.BusinessParkID) === String(formData.BusinessParkID)
  );

  const handleSaveBuilding = async (e) => {
    e.preventDefault();
    if (formSubmitting) return;

    setFormError('');
    setFieldErrors({});

    const validation = parkSchemas.buildingForm({
      BuildingName: formData.BuildingName,
      BuildingCode: formData.BuildingCode,
      ParkID: formData.BusinessParkID,
      FacilityZoneID: formData.FacilityZoneID,
      FloorsCount: formData.TotalFloors,
      TotalAreaSquareMeter: formData.TotalAreaSquareMeter,
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
        ...formData,
        BuildingName: validation.sanitized.BuildingName,
        BuildingCode: validation.sanitized.BuildingCode,
        BusinessParkID: validation.sanitized.ParkID,
        FacilityZoneID: validation.sanitized.FacilityZoneID,
        TotalFloors: validation.sanitized.FloorsCount,
        TotalAreaSquareMeter: validation.sanitized.TotalAreaSquareMeter,
        Description: validation.sanitized.Description
      };

      if (selectedBuilding) {
        await parkApi.updateBuilding(selectedBuilding.BuildingID, payload);
      } else {
        await parkApi.createBuilding(payload);
      }
      setShowCreateModal(false);
      setSelectedBuilding(null);
      resetForm();
      fetchBuildingsAndMeta();
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to save building block.';
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

  const promptDeleteBuilding = (b) => {
    setSelectedBuilding(b);
    setConfirmConfig({
      isOpen: true,
      title: 'Decommission Building Block',
      message: `Are you sure you want to delete building "${b.BuildingName}"? Buildings with active floors or office spaces cannot be deleted.`,
      type: 'danger',
      confirmText: 'Delete Building',
      onConfirm: async () => {
        try {
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          await parkApi.deleteBuilding(b.BuildingID);
          setSelectedBuilding(null);
          fetchBuildingsAndMeta();
        } catch (err) {
          const msg = err.response?.data?.message || 'Failed to delete building.';
          showAlert('Action Restricted', msg, 'error');
        }
      }
    });
  };

  const openEditModal = (b) => {
    setSelectedBuilding(b);
    setFormError('');
    setFieldErrors({});
    setFormData({
      BusinessParkID: b.BusinessParkID,
      FacilityZoneID: b.FacilityZoneID || '',
      BuildingCode: b.BuildingCode,
      BuildingName: b.BuildingName,
      ShortName: b.ShortName || '',
      Description: b.Description || '',
      TotalFloors: b.TotalFloors || 1,
      TotalAreaSquareMeter: b.TotalAreaSquareMeter || ''
    });
    setShowCreateModal(true);
  };

  const resetForm = () => {
    setFormError('');
    setFieldErrors({});
    const defaultPark = parks[0]?.BusinessParkID || '';
    const defaultZone = zones.find(z => String(z.BusinessParkID) === String(defaultPark))?.FacilityZoneID || '';
    setFormData({
      BusinessParkID: defaultPark,
      FacilityZoneID: defaultZone,
      BuildingCode: '',
      BuildingName: '',
      ShortName: '',
      Description: '',
      TotalFloors: 1,
      TotalAreaSquareMeter: ''
    });
  };

  return (
    <div>
      {/* Header Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '280px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 200px' }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search buildings by name or code..."
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

          {/* Park filter hidden — single campus system */}
          <div style={{
            padding: '10px 16px',
            borderRadius: 'var(--border-radius-sm)',
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            color: 'var(--text-primary)',
            fontSize: '0.85rem',
            fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: '6px',
            whiteSpace: 'nowrap'
          }}>
            <Building size={14} color="var(--accent-primary)" />
            {parks[0]?.BusinessParkName || 'Ethiopian IT Park'}
          </div>

          <select
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
            style={{
              padding: '10px 16px',
              borderRadius: 'var(--border-radius-sm)',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-primary)',
              fontSize: '0.88rem'
            }}
          >
            <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>All Facility Zones</option>
            {(parkFilter ? zones.filter(z => String(z.BusinessParkID) === String(parkFilter)) : zones).map(z => (
              <option key={z.FacilityZoneID} value={z.FacilityZoneID} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{z.FacilityZoneName}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={fetchBuildingsAndMeta}
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
              setSelectedBuilding(null);
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
            <Plus size={16} /> Add Building
          </button>
        </div>
      </div>

      {/* Buildings Table */}
      <div className="glass-panel" style={{ overflow: 'hidden', padding: 0 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <RefreshCw className="animate-spin" size={32} style={{ marginBottom: '16px' }} />
            <p>Loading physical buildings...</p>
          </div>
        ) : buildings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <Building size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <p>No building structures found matching filter.</p>
          </div>
        ) : (
          <>
            <div className="table-scroll-container">
              <table className="custom-table" style={{ minWidth: '1050px' }}>
                <thead>
                  <tr>
                    <th>Building Name</th>
                    <th>Building Code</th>
                    <th>Facility Zone</th>
                    <th>Business Park</th>
                    <th>Configured Floors</th>
                    <th>Total Area (SqM)</th>
                    <th>Offices</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {buildings.map((b) => (
                    <tr key={b.BuildingID}>
                      <td>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{b.BuildingName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.ShortName || '—'}</div>
                      </td>
                      <td style={{ fontFamily: 'monospace', color: 'var(--accent-primary)' }}>{b.BuildingCode}</td>
                      <td>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: 'rgba(14, 165, 233, 0.12)',
                          border: '1px solid rgba(14, 165, 233, 0.25)',
                          color: 'var(--color-info)',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}>
                          <MapPin size={12} /> {b.FacilityZoneName || 'Unassigned'}
                        </span>
                      </td>
                      <td>{b.BusinessParkName}</td>
                      <td style={{ fontWeight: '600' }}>
                        {b.FloorCount || 0} / {b.TotalFloors} Floors
                      </td>
                      <td>{b.TotalAreaSquareMeter ? `${Number(b.TotalAreaSquareMeter).toLocaleString()} m²` : '—'}</td>
                      <td>
                        <span className="badge badge-info">{b.OfficeCount || 0} Offices</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            onClick={() => openEditModal(b)}
                            title="Edit Building Details"
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
                            onClick={() => promptDeleteBuilding(b)}
                            title="Delete Building"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              padding: '6px 12px', borderRadius: '8px',
                              background: 'rgba(239, 68, 68, 0.12)',
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
              <span>Showing <strong>{buildings.length}</strong> building records</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <ArrowLeftRight size={13} style={{ color: 'var(--accent-primary)' }} />
                Use horizontal scroll bar to view full infrastructure specifications
              </span>
            </div>
          </>
        )}
      </div>

      {/* Register / Edit Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'var(--modal-backdrop, rgba(16, 20, 24, 0.78))',
          backdropFilter: 'blur(8px)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '640px', overflow: 'hidden', maxHeight: '90vh', overflowY: 'auto' }}>
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ padding: '10px', borderRadius: '12px', background: 'var(--accent-gradient)', color: '#fff' }}>
                    <Building size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {selectedBuilding ? 'Edit Building Block' : 'Register Building Block'}
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {selectedBuilding ? `Modifying structure ID: ${selectedBuilding.BuildingCode}` : 'Define physical building details within campus and facility zone'}
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

              <form onSubmit={handleSaveBuilding} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }} noValidate>
                {/* Parent Hierarchy Selection */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                      1. Business Park
                    </label>
                    <div style={{
                      width: '100%', padding: '10px 14px', borderRadius: '8px',
                      background: 'rgba(99, 102, 241, 0.08)',
                      border: '1px solid rgba(99, 102, 241, 0.25)',
                      color: 'var(--text-primary)', fontSize: '0.88rem',
                      fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px'
                    }}>
                      <Building size={16} color="var(--accent-primary)" />
                      {parks.length > 0 ? `${parks[0].BusinessParkName} (${parks[0].BusinessParkCode})` : 'Ethiopian IT Park'}
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '3px', display: 'block' }}>
                      Single campus system — auto-assigned
                    </span>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                      2. Facility Zone *
                    </label>
                    <select
                      value={formData.FacilityZoneID}
                      onChange={(e) => handleFieldChange('FacilityZoneID', e.target.value)}
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: '8px',
                        background: 'var(--bg-tertiary)',
                        border: fieldErrors.FacilityZoneID ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                        color: 'var(--text-primary)', fontSize: '0.88rem'
                      }}
                    >
                      <option value="">Select Facility Zone</option>
                      {availableZonesForForm.map(z => (
                        <option key={z.FacilityZoneID} value={z.FacilityZoneID}>
                          {z.FacilityZoneName} ({z.FacilityZoneCode})
                        </option>
                      ))}
                    </select>
                    {fieldErrors.FacilityZoneID ? (
                      <span style={{ fontSize: '0.74rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}>
                        ⚠️ {fieldErrors.FacilityZoneID}
                      </span>
                    ) : availableZonesForForm.length === 0 && formData.BusinessParkID ? (
                      <span style={{ fontSize: '0.72rem', color: '#f87171', display: 'block', marginTop: '4px' }}>
                        No facility zones found in selected park. Create a zone first.
                      </span>
                    ) : null}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>Building Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Block A - Innovation Hub"
                      value={formData.BuildingName}
                      onChange={(e) => handleFieldChange('BuildingName', e.target.value)}
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: '8px',
                        background: 'var(--bg-tertiary)',
                        border: fieldErrors.BuildingName ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                        color: 'var(--text-primary)', fontSize: '0.88rem'
                      }}
                    />
                    {fieldErrors.BuildingName && (
                      <span style={{ fontSize: '0.74rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}>
                        ⚠️ {fieldErrors.BuildingName}
                      </span>
                    )}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>Building Code *</label>
                    <input
                      type="text"
                      placeholder="e.g. BLK-A"
                      value={formData.BuildingCode}
                      onChange={(e) => handleFieldChange('BuildingCode', e.target.value)}
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: '8px',
                        background: 'var(--bg-tertiary)',
                        border: fieldErrors.BuildingCode ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                        color: 'var(--text-primary)', fontSize: '0.88rem'
                      }}
                    />
                    {fieldErrors.BuildingCode && (
                      <span style={{ fontSize: '0.74rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}>
                        ⚠️ {fieldErrors.BuildingCode}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                      Configured Number of Floors *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="200"
                      value={formData.TotalFloors}
                      onChange={(e) => handleFieldChange('TotalFloors', e.target.value)}
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: '8px',
                        background: 'var(--bg-tertiary)',
                        border: (fieldErrors.TotalFloors || fieldErrors.FloorsCount) ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                        color: 'var(--text-primary)', fontSize: '0.88rem'
                      }}
                    />
                    {(fieldErrors.TotalFloors || fieldErrors.FloorsCount) ? (
                      <span style={{ fontSize: '0.74rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}>
                        ⚠️ {fieldErrors.TotalFloors || fieldErrors.FloorsCount}
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Determines maximum floor levels allowed (Floor 1 to {formData.TotalFloors || 1})
                      </span>
                    )}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>Total Area (m²)</label>
                    <input
                      type="number"
                      placeholder="e.g. 4500"
                      value={formData.TotalAreaSquareMeter}
                      onChange={(e) => handleFieldChange('TotalAreaSquareMeter', e.target.value)}
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: '8px',
                        background: 'var(--bg-tertiary)',
                        border: fieldErrors.TotalAreaSquareMeter ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                        color: 'var(--text-primary)', fontSize: '0.88rem'
                      }}
                    />
                    {fieldErrors.TotalAreaSquareMeter && (
                      <span style={{ fontSize: '0.74rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}>
                        ⚠️ {fieldErrors.TotalAreaSquareMeter}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>Description</label>
                  <textarea
                    rows={3}
                    placeholder="Provide details about facilities, wings or architectural specifications..."
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
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--glass-border)' }}>
                  <button type="button" onClick={() => setShowCreateModal(false)} style={{ padding: '10px 22px', borderRadius: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem' }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={formSubmitting} style={{ padding: '10px 24px', borderRadius: '10px', background: 'var(--accent-gradient)', border: 'none', color: '#fff', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', opacity: formSubmitting ? 0.7 : 1 }}>
                    {formSubmitting ? '⏳ Saving...' : selectedBuilding ? '✓ Update Building' : '✓ Add Building'}
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
