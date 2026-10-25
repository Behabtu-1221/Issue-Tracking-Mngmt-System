import React, { useState, useEffect } from 'react';
import { MapPin, Search, Plus, RefreshCw, Edit, Trash2, X, ArrowLeftRight } from 'lucide-react';
import parkApi from '../api/parkApi';
import { ZONE_TYPES } from '../constants/parkConstants';
import ConfirmDialogModal from '../../../components/common/ConfirmDialogModal';
import AlertDialogModal from '../../../components/common/AlertDialogModal';
import { ActionButton, ActionGroup } from '../../../components/common/ActionButton';
import { parkSchemas } from '../../../validation';
import { useTranslation } from '../../../i18n';

export default function FacilityZonesTab() {
  const { t } = useTranslation();
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

    const validation = parkSchemas.zoneForm({
      FacilityZoneName: formData.FacilityZoneName,
      FacilityZoneCode: formData.FacilityZoneCode,
      ParkID: formData.BusinessParkID,
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
        ...formData,
        FacilityZoneName: validation.sanitized.FacilityZoneName,
        FacilityZoneCode: validation.sanitized.FacilityZoneCode,
        BusinessParkID: validation.sanitized.ParkID,
        ZoneType: validation.sanitized.ZoneType,
        CapacityLimit: validation.sanitized.CapacityLimit,
        Description: validation.sanitized.Description
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
      title: t('common.delete'),
      message: `Are you sure you want to delete zone "${z.FacilityZoneName}"?`,
      type: 'danger',
      confirmText: t('common.delete'),
      onConfirm: async () => {
        try {
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          await parkApi.deleteFacilityZone(z.FacilityZoneID);
          setSelectedZone(null);
          fetchZonesAndParks();
        } catch (err) {
          const msg = err.response?.data?.message || 'Failed to delete facility zone.';
          showAlert(t('common.error'), msg, 'error');
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
            placeholder={t('businessPark.searchZones')}
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
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> {t('common.refresh')}
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
            <Plus size={16} /> {t('businessPark.addZone')}
          </button>
        </div>
      </div>

      {/* Facility Zones Table */}
      <div className="glass-panel" style={{ overflow: 'hidden', padding: 0 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <RefreshCw className="animate-spin" size={32} style={{ marginBottom: '16px' }} />
            <p>{t('businessPark.loadingZones')}</p>
          </div>
        ) : zones.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <MapPin size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <p>{t('businessPark.noZonesFound')}</p>
          </div>
        ) : (
          <>
            <div className="table-scroll-container">
              <table className="custom-table" style={{ minWidth: '1000px' }}>
                <thead>
                  <tr>
                    <th>{t('businessPark.zoneName')}</th>
                    <th>{t('businessPark.zoneCode')}</th>
                    <th>{t('businessPark.zoneType')}</th>
                    <th>{t('businessPark.businessPark')}</th>
                    <th>{t('businessPark.buildingsBlocks')}</th>
                    <th>{t('businessPark.capacityLimit')}</th>
                    <th style={{ textAlign: 'right' }}>{t('common.actions')}</th>
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
                        <span className="badge badge-info">{z.BuildingCount || 0} {t('businessPark.buildingsBlocks')}</span>
                      </td>
                      <td style={{ fontWeight: '600' }}>{z.CapacityLimit ? `${z.CapacityLimit} Persons` : t('common.none')}</td>
                      <td style={{ textAlign: 'right' }}>
                        <ActionGroup align="right">
                          <ActionButton
                            variant="edit"
                            label={t('common.edit')}
                            onClick={() => openEditModal(z)}
                            title={t('businessPark.editZone')}
                          />
                          <ActionButton
                            variant="delete"
                            label={t('common.delete')}
                            onClick={() => promptDeleteZone(z)}
                            title={t('common.delete')}
                          />
                        </ActionGroup>
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
              <span>{t('common.showing')} <strong>{zones.length}</strong> {t('businessPark.showingZoneRecords')}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <ArrowLeftRight size={13} style={{ color: 'var(--accent-primary)' }} />
                {t('businessPark.useHorizontalScroll')}
              </span>
            </div>
          </>
        )}
      </div>

      {/* CREATE / EDIT ZONE MODAL — Premium Enterprise Form */}
      {showCreateModal && (
        <div 
          onClick={() => setShowCreateModal(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--modal-backdrop, rgba(16, 20, 24, 0.78))',
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            animation: 'fadeIn 0.2s ease-out', padding: '20px'
          }}
        >
          <div 
            role="dialog"
            aria-modal="true"
            aria-labelledby="zone-modal-title"
            className="modal-card accent-strip-brand enterprise-card"
            style={{
              width: '620px', maxWidth: '100%', maxHeight: '90vh',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--glass-border-accent)',
              borderRadius: 'var(--border-radius-lg, 18px)',
              boxShadow: 'var(--modal-shadow, 0 24px 64px rgba(0,0,0,0.5))',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--glass-border)',
              background: 'var(--bg-tertiary)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  width: '38px', height: '38px', borderRadius: '10px', 
                  background: 'var(--accent-gradient)', color: '#fff', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: 'var(--glow-accent)', flexShrink: 0 
                }}>
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 id="zone-modal-title" style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {selectedZone ? t('businessPark.editFacilityZone') : t('businessPark.registerZone')}
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {selectedZone ? `${t('businessPark.modifyingStructure')}: ${selectedZone.FacilityZoneCode}` : t('businessPark.defineZoneDetails')}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)} 
                className="btn-icon touch-target-sm"
                aria-label="Close dialog"
                style={{ 
                  background: 'transparent', border: 'none', 
                  borderRadius: '8px', color: 'var(--text-muted)', cursor: 'pointer', 
                  padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' 
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSaveZone} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1, margin: 0 }} noValidate>
              <div style={{ padding: 'clamp(16px, 3vw, 24px)', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {formError && (
                  <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: '0.84rem', fontWeight: 600 }}>
                    ⚠️ {formError}
                  </div>
                )}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>{t('businessPark.businessPark')}</label>
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
                    {t('businessPark.singleCampusAssigned')}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>{t('businessPark.zoneName')} *</label>
                    <input
                      type="text"
                      placeholder={t('businessPark.enterZoneName')}
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
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>{t('businessPark.zoneCode')} *</label>
                    <input
                      type="text"
                      placeholder={t('businessPark.enterZoneCode')}
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

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>{t('businessPark.zoneType')} *</label>
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
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>{t('businessPark.capacityLimit')} ({t('businessPark.optional')})</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 50"
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
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>{t('common.description')}</label>
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
              </div>

              {/* Footer Actions */}
              <div style={{ 
                padding: '14px 20px', 
                borderTop: '1px solid var(--glass-border)', 
                background: 'var(--bg-tertiary)', 
                display: 'flex', gap: '12px', justifyContent: 'flex-end', 
                flexShrink: 0 
              }}>
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)} 
                  className="btn btn-secondary touch-target-sm"
                  style={{ padding: '9px 18px', borderRadius: 'var(--border-radius-sm)' }}
                >
                  {t('common.cancel')}
                </button>
                <button 
                  type="submit" 
                  disabled={formSubmitting} 
                  className="btn btn-primary touch-target-sm"
                  style={{ padding: '9px 22px', borderRadius: 'var(--border-radius-sm)' }}
                >
                  {formSubmitting ? `⏳ ${t('common.loading')}` : selectedZone ? `✓ ${t('businessPark.updateZone')}` : `✓ ${t('businessPark.addZone')}`}
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
