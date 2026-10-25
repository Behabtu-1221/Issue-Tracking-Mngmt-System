import React, { useState, useEffect } from 'react';
import { Layers, Search, Plus, RefreshCw, Edit, Trash2, X, FileText, CheckCircle2, ArrowLeftRight } from 'lucide-react';
import parkApi from '../api/parkApi';
import ConfirmDialogModal from '../../../components/common/ConfirmDialogModal';
import AlertDialogModal from '../../../components/common/AlertDialogModal';
import { ActionButton, ActionGroup } from '../../../components/common/ActionButton';
import { parkSchemas } from '../../../validation';
import { useTranslation } from '../../../i18n';

export default function FloorsTab() {
  const { t } = useTranslation();
  const [floors, setFloors] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [buildingFilter, setBuildingFilter] = useState('');

  // Glass Dialog Modals State
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'error' });

  const showAlert = (title, message, type = 'error') => {
    setAlertConfig({ isOpen: true, title, message, type });
  };

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    BuildingID: '',
    FloorNumber: 1,
    FloorCode: '',
    FloorName: '',
    Description: '',
    TotalOfficeSpaces: 0
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

  const fetchFloorsAndBuildings = async () => {
    try {
      setLoading(true);
      const [fRes, bRes] = await Promise.all([
        parkApi.getFloors({ search: searchTerm, buildingId: buildingFilter }),
        parkApi.getBuildings()
      ]);
      const rawFloors = fRes.data?.data?.floors || fRes.data?.data || [];
      setFloors(Array.isArray(rawFloors) ? rawFloors : []);

      const rawBuildings = bRes.data?.data?.buildings || bRes.data?.data || [];
      setBuildings(Array.isArray(rawBuildings) ? rawBuildings : []);
    } catch (err) {
      console.error('Failed to load floors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFloorsAndBuildings();
  }, [searchTerm, buildingFilter]);

  const handleSaveFloor = async (e) => {
    e.preventDefault();
    if (formSubmitting) return;

    setFormError('');
    setFieldErrors({});

    const targetBldg = buildings.find(b => String(b.BuildingID) === String(formData.BuildingID));

    const validation = parkSchemas.floorForm({
      FloorName: formData.FloorName,
      FloorCode: formData.FloorCode,
      BuildingID: formData.BuildingID,
      FloorNumber: formData.FloorNumber,
      BuildingTotalFloors: targetBldg?.TotalFloors,
      BuildingName: targetBldg?.BuildingName,
      TotalOfficeSpaces: formData.TotalOfficeSpaces,
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
        FloorName: validation.sanitized.FloorName,
        FloorCode: validation.sanitized.FloorCode,
        BuildingID: validation.sanitized.BuildingID,
        FloorNumber: validation.sanitized.FloorNumber,
        TotalOfficeSpaces: validation.sanitized.TotalOfficeSpaces,
        Description: validation.sanitized.Description
      };

      if (selectedFloor) {
        await parkApi.updateFloor(selectedFloor.FloorID, payload);
      } else {
        await parkApi.createFloor(payload);
      }
      setShowCreateModal(false);
      setSelectedFloor(null);
      resetForm();
      fetchFloorsAndBuildings();
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to save floor level.';
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

  const promptDeleteFloor = (f) => {
    setSelectedFloor(f);
    setConfirmConfig({
      isOpen: true,
      title: t('common.delete'),
      message: `Are you sure you want to delete floor level "${f.FloorName}"? Associated office suites will be affected.`,
      type: 'danger',
      confirmText: t('common.delete'),
      onConfirm: async () => {
        try {
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          await parkApi.deleteFloor(f.FloorID);
          setSelectedFloor(null);
          fetchFloorsAndBuildings();
        } catch (err) {
          const msg = err.response?.data?.message || 'Failed to delete floor.';
          showAlert(t('common.error'), msg, 'error');
        }
      }
    });
  };

  const openEditModal = (f) => {
    setSelectedFloor(f);
    setFormError('');
    setFieldErrors({});
    setFormData({
      BuildingID: f.BuildingID,
      FloorNumber: f.FloorNumber,
      FloorCode: f.FloorCode,
      FloorName: f.FloorName,
      Description: f.Description || '',
      TotalOfficeSpaces: f.TotalOfficeSpaces || 0
    });
    setShowCreateModal(true);
  };

  const resetForm = () => {
    setFormError('');
    setFieldErrors({});
    setFormData({
      BuildingID: buildings[0]?.BuildingID || '',
      FloorNumber: 1,
      FloorCode: 'FLR-1',
      FloorName: '',
      Description: '',
      TotalOfficeSpaces: 0
    });
  };

  return (
    <div>
      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder={t('businessPark.searchFloors')}
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

          <select
            value={buildingFilter}
            onChange={(e) => setBuildingFilter(e.target.value)}
            style={{
              padding: '10px 16px',
              borderRadius: 'var(--border-radius-sm)',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-primary)',
              fontSize: '0.88rem'
            }}
          >
            <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{t('businessPark.allBuildings')}</option>
            {buildings.map(b => (
              <option key={b.BuildingID} value={b.BuildingID} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{b.BuildingName}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={fetchFloorsAndBuildings}
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
              setSelectedFloor(null);
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
            <Plus size={16} /> {t('businessPark.addFloor')}
          </button>
        </div>
      </div>

      {/* Floors Table */}
      <div className="glass-panel" style={{ overflow: 'hidden', padding: 0 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <RefreshCw className="animate-spin" size={32} style={{ marginBottom: '16px' }} />
            <p>{t('businessPark.loadingFloors')}</p>
          </div>
        ) : floors.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <Layers size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <p>{t('businessPark.noFloorsFound')}</p>
          </div>
        ) : (
          <>
            <div className="table-scroll-container">
              <table className="custom-table" style={{ minWidth: '1000px' }}>
                <thead>
                  <tr>
                    <th>{t('businessPark.floorName')}</th>
                    <th>{t('businessPark.floorCode')}</th>
                    <th>{t('businessPark.floorNumber')}</th>
                    <th>{t('businessPark.building')}</th>
                    <th>{t('businessPark.officesConfigured')}</th>
                    <th>{t('businessPark.floorBlueprint')}</th>
                    <th style={{ textAlign: 'right' }}>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {floors.map((f) => (
                    <tr key={f.FloorID}>
                      <td>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{f.FloorName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{f.Description || '—'}</div>
                      </td>
                      <td style={{ fontFamily: 'monospace', color: 'var(--accent-primary)' }}>{f.FloorCode}</td>
                      <td style={{ fontWeight: '700' }}>{t('businessPark.floorNumber')} {f.FloorNumber}</td>
                      <td>{f.BuildingName}</td>
                      <td>
                        <span className="badge badge-info" style={{ fontWeight: 600 }}>
                          {f.OfficeSpaceCount || 0} / {f.TotalOfficeSpaces > 0 ? f.TotalOfficeSpaces : '∞'} {t('businessPark.offices')}
                        </span>
                      </td>
                      <td>
                        {f.HasFloorPlan ? (
                          <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                            <CheckCircle2 size={12} style={{ marginRight: '4px' }} /> {t('businessPark.mapped')}
                          </span>
                        ) : (
                          <span className="badge badge-secondary" style={{ fontSize: '0.72rem' }}>—</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <ActionGroup align="right">
                          <ActionButton
                            variant="edit"
                            label={t('common.edit')}
                            onClick={() => openEditModal(f)}
                            title={t('businessPark.editFloorLevel')}
                          />
                          <ActionButton
                            variant="delete"
                            label={t('common.delete')}
                            onClick={() => promptDeleteFloor(f)}
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
              <span>{t('common.showing')} <strong>{floors.length}</strong> {t('businessPark.showingFloorRecords')}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <ArrowLeftRight size={13} style={{ color: 'var(--accent-primary)' }} />
                {t('businessPark.useHorizontalScroll')}
              </span>
            </div>
          </>
        )}
      </div>

      {/* CREATE / EDIT FLOOR MODAL — Premium Enterprise Form */}
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
            aria-labelledby="floor-modal-title"
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
                  <Layers size={20} />
                </div>
                <div>
                  <h3 id="floor-modal-title" style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {selectedFloor ? t('businessPark.editFloorLevel') : t('businessPark.registerFloor')}
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {selectedFloor ? `${t('businessPark.modifyingStructure')}: ${selectedFloor.FloorCode}` : t('businessPark.defineFloorDetails')}
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
            <form onSubmit={handleSaveFloor} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1, margin: 0 }} noValidate>
              <div style={{ padding: 'clamp(16px, 3vw, 24px)', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {formError && (
                  <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: '0.84rem', fontWeight: 600 }}>
                    ⚠️ {formError}
                  </div>
                )}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '4px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{t('businessPark.building')} *</label>
                    {formData.BuildingID && (
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-primary)', background: 'rgba(99, 102, 241, 0.12)', padding: '2px 8px', borderRadius: '6px', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                        🏢 {t('businessPark.targetBuildingFloors')}: {buildings.find(b => String(b.BuildingID) === String(formData.BuildingID))?.TotalFloors || 1} {t('businessPark.floorsLevels')}
                      </span>
                    )}
                  </div>
                  <select
                    value={formData.BuildingID}
                    onChange={(e) => handleFieldChange('BuildingID', e.target.value)}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '8px',
                      background: 'var(--bg-tertiary)',
                      border: fieldErrors.BuildingID ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                      color: 'var(--text-primary)', fontSize: '0.88rem'
                    }}
                  >
                    <option value="">{t('businessPark.selectBuilding')}</option>
                    {buildings.map(b => (
                      <option key={b.BuildingID} value={b.BuildingID}>{b.BuildingName} ({b.BuildingCode}) — Max {b.TotalFloors} Floors</option>
                    ))}
                  </select>
                  {fieldErrors.BuildingID && (
                    <span style={{ fontSize: '0.74rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}>
                      ⚠️ {fieldErrors.BuildingID}
                    </span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>{t('businessPark.floorName')} *</label>
                    <input
                      type="text"
                      placeholder={t('businessPark.enterFloorName')}
                      value={formData.FloorName}
                      onChange={(e) => handleFieldChange('FloorName', e.target.value)}
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: '8px',
                        background: 'var(--bg-tertiary)',
                        border: fieldErrors.FloorName ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                        color: 'var(--text-primary)', fontSize: '0.88rem'
                      }}
                    />
                    {fieldErrors.FloorName && (
                      <span style={{ fontSize: '0.74rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}>
                        ⚠️ {fieldErrors.FloorName}
                      </span>
                    )}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>{t('businessPark.floorNumber')} *</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={formData.FloorNumber}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleFieldChange('FloorNumber', val);
                        if (!formData.FloorCode || formData.FloorCode.startsWith('FLR-')) {
                          handleFieldChange('FloorCode', `FLR-${val}`);
                        }
                      }}
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-tertiary)',
                        border: fieldErrors.FloorNumber ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                        color: 'var(--text-primary)', fontSize: '0.88rem'
                      }}
                    />
                    {fieldErrors.FloorNumber && (
                      <span style={{ fontSize: '0.74rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}>
                        ⚠️ {fieldErrors.FloorNumber}
                      </span>
                    )}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>{t('businessPark.floorCode')} *</label>
                    <input
                      type="text"
                      placeholder={t('businessPark.enterFloorCode')}
                      value={formData.FloorCode}
                      onChange={(e) => handleFieldChange('FloorCode', e.target.value.toUpperCase())}
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: '8px',
                        background: 'var(--bg-tertiary)',
                        border: fieldErrors.FloorCode ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                        color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '0.88rem'
                      }}
                    />
                    {fieldErrors.FloorCode && (
                      <span style={{ fontSize: '0.74rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}>
                        ⚠️ {fieldErrors.FloorCode}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>{t('businessPark.totalOfficeSpaces')}</label>
                    <input
                      type="number" min="0"
                      placeholder="e.g. 10 (0 for unlimited)"
                      value={formData.TotalOfficeSpaces}
                      onChange={(e) => handleFieldChange('TotalOfficeSpaces', e.target.value)}
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: '8px',
                        background: 'var(--bg-tertiary)',
                        border: fieldErrors.TotalOfficeSpaces ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                        color: 'var(--text-primary)', fontSize: '0.88rem'
                      }}
                    />
                    {fieldErrors.TotalOfficeSpaces && (
                      <span style={{ fontSize: '0.74rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}>
                        ⚠️ {fieldErrors.TotalOfficeSpaces}
                      </span>
                    )}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>{t('common.description')}</label>
                    <input
                      type="text"
                      placeholder={t('businessPark.floorDescription')}
                      value={formData.Description}
                      onChange={(e) => handleFieldChange('Description', e.target.value)}
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: '8px',
                        background: 'var(--bg-tertiary)',
                        border: fieldErrors.Description ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                        color: 'var(--text-primary)', fontSize: '0.88rem'
                      }}
                    />
                    {fieldErrors.Description && (
                      <span style={{ fontSize: '0.74rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}>
                        ⚠️ {fieldErrors.Description}
                      </span>
                    )}
                  </div>
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
                  {formSubmitting ? `⏳ ${t('common.loading')}` : selectedFloor ? `✓ ${t('businessPark.updateFloor')}` : `✓ ${t('businessPark.addFloor')}`}
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
