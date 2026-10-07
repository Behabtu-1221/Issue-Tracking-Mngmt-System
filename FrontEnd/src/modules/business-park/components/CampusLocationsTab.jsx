import React, { useState, useEffect } from 'react';
import { Compass, Search, Plus, RefreshCw, Edit, Trash2, X } from 'lucide-react';
import parkApi from '../api/parkApi';
import { LOCATION_TYPES } from '../constants/parkConstants';
import ConfirmDialogModal from '../../../components/common/ConfirmDialogModal';
import AlertDialogModal from '../../../components/common/AlertDialogModal';
import { parkSchemas } from '../../../validation';
import { useTranslation } from '../../../i18n';

export default function CampusLocationsTab() {
  const { t } = useTranslation();
  const [locations, setLocations] = useState([]);
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
  const [selectedLoc, setSelectedLoc] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    BusinessParkID: '',
    ParentLocationID: '',
    LocationCode: '',
    LocationName: '',
    LocationType: 'BLOCK',
    Description: ''
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

  const fetchLocationsAndParks = async () => {
    try {
      setLoading(true);
      const [lRes, pRes] = await Promise.all([
        parkApi.getLocations({ search: searchTerm }),
        parkApi.getParks()
      ]);
      const rawLocs = lRes.data?.data?.locations || lRes.data?.data || [];
      setLocations(Array.isArray(rawLocs) ? rawLocs : []);

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
      console.error('Failed to load campus locations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocationsAndParks();
  }, [searchTerm]);

  const handleSaveLocation = async (e) => {
    e.preventDefault();
    if (formSubmitting) return;

    setFormError('');
    setFieldErrors({});

    const validation = parkSchemas.locationForm({
      LocationName: formData.LocationName,
      LocationCode: formData.LocationCode,
      ParkID: formData.BusinessParkID,
      ParentLocationID: formData.ParentLocationID,
      LocationType: formData.LocationType,
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
        LocationName: validation.sanitized.LocationName,
        LocationCode: validation.sanitized.LocationCode,
        BusinessParkID: validation.sanitized.ParkID,
        ParentLocationID: validation.sanitized.ParentLocationID,
        LocationType: validation.sanitized.LocationType,
        Description: validation.sanitized.Description
      };

      if (selectedLoc) {
        await parkApi.updateLocation(selectedLoc.LocationID, payload);
      } else {
        await parkApi.createLocation(payload);
      }
      setShowCreateModal(false);
      setSelectedLoc(null);
      resetForm();
      fetchLocationsAndParks();
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to save location.';
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

  const promptDeleteLocation = (loc) => {
    setSelectedLoc(loc);
    setConfirmConfig({
      isOpen: true,
      title: t('common.delete'),
      message: `Are you sure you want to delete campus location "${loc.LocationName}"?`,
      type: 'danger',
      confirmText: t('common.delete'),
      onConfirm: async () => {
        try {
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          await parkApi.deleteLocation(loc.LocationID);
          setSelectedLoc(null);
          fetchLocationsAndParks();
        } catch (err) {
          const msg = err.response?.data?.message || 'Failed to delete location.';
          showAlert(t('common.error'), msg, 'error');
        }
      }
    });
  };

  const openEditModal = (loc) => {
    setSelectedLoc(loc);
    setFormError('');
    setFieldErrors({});
    setFormData({
      BusinessParkID: loc.BusinessParkID,
      ParentLocationID: loc.ParentLocationID || '',
      LocationCode: loc.LocationCode,
      LocationName: loc.LocationName,
      LocationType: loc.LocationType,
      Description: loc.Description || ''
    });
    setShowCreateModal(true);
  };

  const resetForm = () => {
    setFormError('');
    setFieldErrors({});
    setFormData({
      BusinessParkID: parks[0]?.BusinessParkID || '',
      ParentLocationID: '',
      LocationCode: '',
      LocationName: '',
      LocationType: 'BLOCK',
      Description: ''
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
            placeholder={t('businessPark.searchLandmarks')}
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
            onClick={fetchLocationsAndParks}
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
              setSelectedLoc(null);
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
            <Plus size={16} /> {t('businessPark.addLandmark')}
          </button>
        </div>
      </div>

      {/* Locations Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <RefreshCw className="animate-spin" size={32} style={{ marginBottom: '16px' }} />
            <p>{t('businessPark.loadingLandmarks')}</p>
          </div>
        ) : locations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <Compass size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <p>{t('businessPark.noLandmarksFound')}</p>
          </div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>{t('businessPark.locationName')}</th>
                <th>{t('businessPark.locationCode')}</th>
                <th>{t('businessPark.locationType')}</th>
                <th>{t('businessPark.parentLocation')}</th>
                <th>{t('businessPark.businessPark')}</th>
                <th style={{ textAlign: 'right' }}>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((loc) => (
                <tr key={loc.LocationID}>
                  <td>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{loc.LocationName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{loc.Description || '—'}</div>
                  </td>
                  <td style={{ fontFamily: 'monospace', color: 'var(--accent-primary)' }}>{loc.LocationCode}</td>
                  <td>
                    <span className="badge badge-info">{loc.LocationType}</span>
                  </td>
                  <td>{loc.ParentLocationName || t('businessPark.noneRootLocation')}</td>
                  <td>{loc.BusinessParkName}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button
                        onClick={() => openEditModal(loc)}
                        title={t('businessPark.editLocation')}
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
                        <Edit size={14} /> {t('common.edit')}
                      </button>
                      <button
                        onClick={() => promptDeleteLocation(loc)}
                        title={t('common.delete')}
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
                        <Trash2 size={14} /> {t('common.delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* CREATE / EDIT LOCATION MODAL — Premium Enterprise Form */}
      {showCreateModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--modal-backdrop, rgba(16, 20, 24, 0.78))',
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
              background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(14,165,233,0.05))'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ padding: '10px', borderRadius: '12px', background: 'var(--accent-gradient)', color: '#fff' }}>
                    <Compass size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {selectedLoc ? t('businessPark.editLocation') : t('businessPark.registerLocation')}
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {selectedLoc ? `${t('businessPark.modifyingStructure')}: ${selectedLoc.LocationCode}` : t('businessPark.landmarksSubtitle')}
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

              <form onSubmit={handleSaveLocation} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} noValidate>
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>{t('businessPark.locationName')} *</label>
                    <input
                      type="text"
                      placeholder={t('businessPark.enterLocationName')}
                      value={formData.LocationName}
                      onChange={(e) => handleFieldChange('LocationName', e.target.value)}
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: '8px',
                        background: 'var(--bg-tertiary)',
                        border: fieldErrors.LocationName ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                        color: 'var(--text-primary)', fontSize: '0.88rem'
                      }}
                    />
                    {fieldErrors.LocationName && (
                      <span style={{ fontSize: '0.74rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}>
                        ⚠️ {fieldErrors.LocationName}
                      </span>
                    )}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>{t('businessPark.locationCode')}</label>
                    <input
                      type="text"
                      placeholder={t('businessPark.enterLocationCode')}
                      value={formData.LocationCode}
                      onChange={(e) => handleFieldChange('LocationCode', e.target.value.toUpperCase())}
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: '8px',
                        background: 'var(--bg-tertiary)',
                        border: fieldErrors.LocationCode ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                        color: 'var(--text-primary)', fontSize: '0.88rem'
                      }}
                    />
                    {fieldErrors.LocationCode && (
                      <span style={{ fontSize: '0.74rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}>
                        ⚠️ {fieldErrors.LocationCode}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>{t('businessPark.locationType')} *</label>
                    <select
                      value={formData.LocationType}
                      onChange={(e) => handleFieldChange('LocationType', e.target.value)}
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: '8px',
                        background: 'var(--bg-tertiary)',
                        border: fieldErrors.LocationType ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                        color: 'var(--text-primary)', fontSize: '0.88rem'
                      }}
                    >
                      {LOCATION_TYPES.map(lt => (
                        <option key={lt.value} value={lt.value}>{lt.label}</option>
                      ))}
                    </select>
                    {fieldErrors.LocationType && (
                      <span style={{ fontSize: '0.74rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}>
                        ⚠️ {fieldErrors.LocationType}
                      </span>
                    )}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>{t('businessPark.parentLocation')}</label>
                    <select
                      value={formData.ParentLocationID}
                      onChange={(e) => handleFieldChange('ParentLocationID', e.target.value)}
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: '8px',
                        background: 'var(--bg-tertiary)',
                        border: fieldErrors.ParentLocationID ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                        color: 'var(--text-primary)', fontSize: '0.88rem'
                      }}
                    >
                      <option value="">{t('businessPark.noneRootLocation')}</option>
                      {locations
                        .filter(l => !selectedLoc || l.LocationID !== selectedLoc.LocationID)
                        .map(l => (
                          <option key={l.LocationID} value={l.LocationID}>{l.LocationName} ({l.LocationCode})</option>
                        ))}
                    </select>
                    {fieldErrors.ParentLocationID && (
                      <span style={{ fontSize: '0.74rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}>
                        ⚠️ {fieldErrors.ParentLocationID}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>{t('common.description')}</label>
                  <textarea
                    rows={3}
                    placeholder="Directions, landmark features or navigational cues..."
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
                    {t('common.cancel')}
                  </button>
                  <button type="submit" disabled={formSubmitting} style={{ padding: '10px 24px', borderRadius: '10px', background: 'var(--accent-gradient)', border: 'none', color: '#fff', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', opacity: formSubmitting ? 0.7 : 1 }}>
                    {formSubmitting ? `⏳ ${t('common.loading')}` : selectedLoc ? `✓ ${t('businessPark.updateLocation')}` : `✓ ${t('businessPark.addLandmark')}`}
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
