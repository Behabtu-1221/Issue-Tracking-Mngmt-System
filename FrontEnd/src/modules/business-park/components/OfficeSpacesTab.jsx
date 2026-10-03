import React, { useState, useEffect } from 'react';
import {
  Grid,
  Search,
  Plus,
  RefreshCw,
  Edit,
  Trash2,
  X,
  Check,
  DollarSign,
  Users as UsersIcon,
  Maximize2,
  ShieldAlert,
  ArrowLeftRight
} from 'lucide-react';
import parkApi from '../api/parkApi';
import { OFFICE_AVAILABILITY_STATUSES } from '../constants/parkConstants';
import ConfirmDialogModal from '../../../components/common/ConfirmDialogModal';
import AlertDialogModal from '../../../components/common/AlertDialogModal';
import { parkSchemas, BUSINESS_PARK_MESSAGES } from '../../../validation';

export default function OfficeSpacesTab() {
  const [offices, setOffices] = useState([]);
  const [floors, setFloors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [floorFilter, setFloorFilter] = useState('');

  // Glass Dialog Modals State
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'error' });

  const showAlert = (title, message, type = 'error') => {
    setAlertConfig({ isOpen: true, title, message, type });
  };

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOffice, setSelectedOffice] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    FloorID: '',
    OfficeTypeID: 1,
    OfficeNumber: '',
    OfficeName: '',
    SquareMeters: '',
    MaxOccupancy: 10,
    MonthlyRentAmount: '',
    AvailabilityStatus: 'VACANT',
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

  const fetchOfficesAndFloors = async () => {
    try {
      setLoading(true);
      const [oRes, fRes] = await Promise.all([
        parkApi.getOffices({ search: searchTerm, status: statusFilter, floorId: floorFilter }),
        parkApi.getFloors()
      ]);
      const rawOffices = oRes.data?.data?.offices || oRes.data?.data || [];
      setOffices(Array.isArray(rawOffices) ? rawOffices : []);

      const rawFloors = fRes.data?.data?.floors || fRes.data?.data || [];
      setFloors(Array.isArray(rawFloors) ? rawFloors : []);
    } catch (err) {
      console.error('Failed to load office spaces:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOfficesAndFloors();
  }, [searchTerm, statusFilter, floorFilter]);

  const handleSaveOffice = async (e) => {
    e.preventDefault();
    if (formSubmitting) return;

    setFormError('');
    setFieldErrors({});

    const targetFloor = floors.find(f => String(f.FloorID) === String(formData.FloorID));
    if (!selectedOffice && targetFloor && targetFloor.TotalOfficeSpaces > 0 && (targetFloor.OfficeSpaceCount || 0) >= targetFloor.TotalOfficeSpaces) {
      const capMsg = BUSINESS_PARK_MESSAGES.office.capacityReached(targetFloor.FloorName, targetFloor.TotalOfficeSpaces);
      setFieldErrors({ FloorID: capMsg });
      setFormError('');
      return;
    }

    const validation = parkSchemas.officeSpaceForm(formData);
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      setFormError('');
      return;
    }

    setFormSubmitting(true);

    try {
      const payload = {
        ...formData,
        OfficeNumber: validation.sanitized.OfficeNumber,
        OfficeName: validation.sanitized.OfficeName,
        FloorID: validation.sanitized.FloorID,
        OfficeTypeID: formData.OfficeTypeID || 1,
        SquareMeters: validation.sanitized.SquareMeters,
        MaxOccupancy: formData.MaxOccupancy ? Number(formData.MaxOccupancy) : null,
        MonthlyRentAmount: formData.MonthlyRentAmount ? Number(formData.MonthlyRentAmount) : null,
        AvailabilityStatus: formData.AvailabilityStatus || 'VACANT',
        Description: formData.Description || ''
      };

      if (selectedOffice) {
        await parkApi.updateOffice(selectedOffice.OfficeSpaceID, payload);
      } else {
        await parkApi.createOffice(payload);
      }
      setShowCreateModal(false);
      setSelectedOffice(null);
      resetForm();
      fetchOfficesAndFloors();
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to save office space.';
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

  const handleStatusChange = async (newStatus) => {
    if (!selectedOffice) return;
    try {
      await parkApi.updateOfficeStatus(selectedOffice.OfficeSpaceID, newStatus);
      setShowStatusModal(false);
      fetchOfficesAndFloors();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update office status.';
      showAlert('Action Failed', msg, 'error');
    }
  };

  const promptDeleteOffice = (o) => {
    setSelectedOffice(o);
    setConfirmConfig({
      isOpen: true,
      title: 'Decommission Office Unit',
      message: `Are you sure you want to delete office suite "${o.OfficeNumber} - ${o.OfficeName || 'Suite'}"?`,
      type: 'danger',
      confirmText: 'Delete Office Unit',
      onConfirm: async () => {
        try {
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          await parkApi.deleteOffice(o.OfficeSpaceID);
          setSelectedOffice(null);
          fetchOfficesAndFloors();
        } catch (err) {
          const msg = err.response?.data?.message || 'Failed to delete office space.';
          showAlert('Action Restricted', msg, 'error');
        }
      }
    });
  };

  const openEditModal = (o) => {
    setSelectedOffice(o);
    setFormError('');
    setFieldErrors({});
    setFormData({
      FloorID: o.FloorID,
      OfficeTypeID: o.OfficeTypeID || 1,
      OfficeNumber: o.OfficeNumber,
      OfficeName: o.OfficeName,
      Description: o.Description || '',
      SquareMeters: o.SquareMeters,
      MaxOccupancy: o.MaxOccupancy || 10,
      MonthlyRentAmount: o.MonthlyRentAmount || '',
      AvailabilityStatus: o.AvailabilityStatus
    });
    setShowCreateModal(true);
  };

  const resetForm = () => {
    setFormError('');
    setFieldErrors({});
    setFormData({
      FloorID: floors[0]?.FloorID || '',
      OfficeTypeID: 1,
      OfficeNumber: '',
      OfficeName: '',
      Description: '',
      SquareMeters: '',
      MaxOccupancy: 10,
      MonthlyRentAmount: '',
      AvailabilityStatus: 'VACANT'
    });
  };

  const getStatusBadge = (status) => {
    const matched = OFFICE_AVAILABILITY_STATUSES.find(s => s.value === status);
    return (
      <span className={`badge ${matched ? matched.badgeClass : 'badge-secondary'}`}>
        {status}
      </span>
    );
  };

  return (
    <div>
      {/* Header Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search offices by number or name"
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '10px 16px',
              borderRadius: 'var(--border-radius-sm)',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-primary)',
              fontSize: '0.88rem'
            }}
          >
            <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>All Availability Statuses</option>
            {OFFICE_AVAILABILITY_STATUSES.map(st => (
              <option key={st.value} value={st.value} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{st.label}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={fetchOfficesAndFloors}
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
              setSelectedOffice(null);
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
            <Plus size={16} /> Add Office Space
          </button>
        </div>
      </div>

      {/* Offices Table */}
      <div className="glass-panel" style={{ overflow: 'hidden', padding: 0 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <RefreshCw className="animate-spin" size={32} style={{ marginBottom: '16px' }} />
            <p>Loading office inventory</p>
          </div>
        ) : offices.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <Grid size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <p>No office spaces found matching criteria.</p>
          </div>
        ) : (
          <>
            <div className="table-scroll-container">
              <table className="custom-table" style={{ minWidth: '1150px' }}>
                <thead>
                  <tr>
                    <th>Office</th>
                    <th>Office Name</th>
                    <th>Building & Floor</th>
                    <th>Area (SqM)</th>
                    <th>Capacity</th>
                    <th>Monthly Rent</th>
                    <th>Availability Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {offices.map((o) => (
                    <tr key={o.OfficeSpaceID}>
                      <td style={{ fontFamily: 'monospace', fontWeight: '700', color: 'var(--accent-primary)' }}>{o.OfficeNumber}</td>
                      <td>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{o.OfficeName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{o.OfficeTypeName || 'Commercial Unit'}</div>
                      </td>
                      <td>
                        <div>{o.BuildingName || 'Building'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{o.FloorName}</div>
                      </td>
                      <td>{Number(o.SquareMeters).toLocaleString()} m²</td>
                      <td>{o.MaxOccupancy ? `${o.MaxOccupancy} Persons` : '—'}</td>
                      <td style={{ fontWeight: '600' }}>
                        {o.MonthlyRentAmount ? `${Number(o.MonthlyRentAmount).toLocaleString()} ETB` : '—'}
                      </td>
                      <td>{getStatusBadge(o.AvailabilityStatus)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            onClick={() => { setSelectedOffice(o); setShowStatusModal(true); }}
                            title="Change Availability Status"
                            style={{
                              padding: '6px 10px',
                              borderRadius: 'var(--border-radius-sm)',
                              background: 'rgba(234, 179, 8, 0.15)',
                              border: '1px solid rgba(234, 179, 8, 0.3)',
                              color: 'var(--color-warning)',
                              cursor: 'pointer'
                            }}
                          >
                            <ShieldAlert size={14} />
                          </button>
                          <button
                            onClick={() => openEditModal(o)}
                            title="Edit Office Details"
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
                            onClick={() => promptDeleteOffice(o)}
                            title="Delete Office Unit"
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
              <span>Showing <strong>{offices.length}</strong> office suite records</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <ArrowLeftRight size={13} style={{ color: 'var(--accent-primary)' }} />
                Use horizontal scroll bar to inspect full unit telemetry & pricing
              </span>
            </div>
          </>
        )}
      </div>

      {/* CREATE / EDIT OFFICE MODAL — Premium Enterprise Form */}
      {showCreateModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--modal-backdrop, rgba(16, 20, 24, 0.78))',
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            width: '680px', maxWidth: '95vw', maxHeight: '88vh', overflowY: 'auto',
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
              background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(99,102,241,0.05))'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ padding: '10px', borderRadius: '12px', background: 'linear-gradient(135deg, #10b981, #6366f1)', color: '#fff' }}>
                    <Grid size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                      {selectedOffice ? 'Edit Office Space' : 'Add New Office Space'}
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {selectedOffice ? 'Update unit dimensions and leasing status' : 'Register a new office space for tenant leasing'}
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowCreateModal(false)} style={{
                  background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                  borderRadius: '8px', padding: '6px', cursor: 'pointer', color: 'var(--text-muted)', transition: 'all 0.2s'
                }}>
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px 28px' }}>
              {formError && (
                <div style={{
                  padding: '12px 16px', borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: 'var(--color-danger)', fontSize: '0.84rem', marginBottom: '20px',
                  display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                  ⚠ {formError}
                </div>
              )}

              <form onSubmit={handleSaveOffice} noValidate>
                {/* Floor Selector */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Floor Level Location <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                    {formData.FloorID && (() => {
                      const selF = floors.find(f => String(f.FloorID) === String(formData.FloorID));
                      if (!selF) return null;
                      const currentCount = selF.OfficeSpaceCount || 0;
                      const maxLimit = selF.TotalOfficeSpaces || 0;
                      const isFull = maxLimit > 0 && currentCount >= maxLimit;
                      return (
                        <span style={{
                          fontSize: '0.75rem', fontWeight: 800,
                          color: isFull ? 'var(--color-danger)' : 'var(--color-success)',
                          background: isFull ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                          padding: '2px 8px', borderRadius: '6px',
                          border: isFull ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)'
                        }}>
                          🏢 Offices Configured: {currentCount} {maxLimit > 0 ? `/ ${maxLimit} Max` : ''} {isFull ? '(FULL)' : ''}
                        </span>
                      );
                    })()}
                  </div>
                  <select
                    value={formData.FloorID}
                    onChange={(e) => handleFieldChange('FloorID', e.target.value)}
                    style={{
                      width: '100%', padding: '11px 14px', borderRadius: '10px',
                      background: 'var(--bg-tertiary)',
                      border: fieldErrors.FloorID ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                      color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none',
                      transition: 'border-color 0.2s, box-shadow 0.2s'
                    }}
                  >
                    <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Select Floor</option>
                    {floors.map(f => (
                      <option key={f.FloorID} value={f.FloorID} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                        {f.BuildingName} - {f.FloorName} ({f.FloorCode}) {f.TotalOfficeSpaces ? `[${f.OfficeSpaceCount || 0}/${f.TotalOfficeSpaces}]` : ''}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.FloorID && (
                    <span style={{ fontSize: '0.74rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}>
                      ⚠️ {fieldErrors.FloorID}
                    </span>
                  )}
                </div>

                {/* Office Unit Identity */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>Office Number <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                      <input
                        type="text"
                        placeholder="e.g. STE-402 or OF-101"
                        value={formData.OfficeNumber}
                        onChange={(e) => handleFieldChange('OfficeNumber', e.target.value.toUpperCase())}
                        style={{
                          width: '100%', padding: '11px 14px', borderRadius: '10px',
                          background: 'var(--bg-tertiary)',
                          border: fieldErrors.OfficeNumber ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                          color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '0.88rem', outline: 'none',
                          transition: 'border-color 0.2s, box-shadow 0.2s'
                        }}
                      />
                      {fieldErrors.OfficeNumber && (
                        <span style={{ fontSize: '0.74rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}>
                          ⚠️ {fieldErrors.OfficeNumber}
                        </span>
                      )}
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>Office Display Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Executive Boardroom Alpha"
                        value={formData.OfficeName}
                        onChange={(e) => handleFieldChange('OfficeName', e.target.value)}
                        style={{
                          width: '100%', padding: '11px 14px', borderRadius: '10px',
                          background: 'var(--bg-tertiary)',
                          border: fieldErrors.OfficeName ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                          color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none',
                          transition: 'border-color 0.2s, box-shadow 0.2s'
                        }}
                      />
                      {fieldErrors.OfficeName && (
                        <span style={{ fontSize: '0.74rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}>
                          ⚠️ {fieldErrors.OfficeName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Specs, Pricing & Availability Status */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>Area (m²) <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                      <input
                        type="number" min="1" placeholder="e.g. 120"
                        value={formData.SquareMeters}
                        onChange={(e) => handleFieldChange('SquareMeters', e.target.value)}
                        style={{
                          width: '100%', padding: '11px 14px', borderRadius: '10px',
                          background: 'var(--bg-tertiary)',
                          border: fieldErrors.SquareMeters ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                          color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none'
                        }}
                      />
                      {fieldErrors.SquareMeters && (
                        <span style={{ fontSize: '0.74rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}>
                          ⚠️ {fieldErrors.SquareMeters}
                        </span>
                      )}
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>Max Persons</label>
                      <input
                        type="number" min="1" placeholder="e.g. 10"
                        value={formData.MaxOccupancy}
                        onChange={(e) => handleFieldChange('MaxOccupancy', e.target.value)}
                        style={{
                          width: '100%', padding: '11px 14px', borderRadius: '10px',
                          background: 'var(--bg-tertiary)',
                          border: fieldErrors.MaxOccupancy ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                          color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none'
                        }}
                      />
                      {fieldErrors.MaxOccupancy && (
                        <span style={{ fontSize: '0.74rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}>
                          ⚠️ {fieldErrors.MaxOccupancy}
                        </span>
                      )}
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>Monthly Rent (ETB)</label>
                      <input
                        type="number" min="0" placeholder="e.g. 25000"
                        value={formData.MonthlyRentAmount}
                        onChange={(e) => handleFieldChange('MonthlyRentAmount', e.target.value)}
                        style={{
                          width: '100%', padding: '11px 14px', borderRadius: '10px',
                          background: 'var(--bg-tertiary)',
                          border: (fieldErrors.MonthlyRentAmount || fieldErrors.RentalRatePerSqM) ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                          color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none'
                        }}
                      />
                      {(fieldErrors.MonthlyRentAmount || fieldErrors.RentalRatePerSqM) && (
                        <span style={{ fontSize: '0.74rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}>
                          ⚠️ {fieldErrors.MonthlyRentAmount || fieldErrors.RentalRatePerSqM}
                        </span>
                      )}
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 700 }}>Availability Status </label>
                      <select
                        value={formData.AvailabilityStatus}
                        onChange={(e) => handleFieldChange('AvailabilityStatus', e.target.value)}
                        style={{
                          width: '100%', padding: '11px 14px', borderRadius: '10px',
                          background: 'var(--bg-tertiary)',
                          border: (fieldErrors.AvailabilityStatus || fieldErrors.OccupancyStatus) ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                          color: 'var(--text-primary)', fontSize: '0.88rem', fontWeight: 700, outline: 'none'
                        }}
                      >
                        {OFFICE_AVAILABILITY_STATUSES.map(s => (
                          <option key={s.value} value={s.value} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                      {(fieldErrors.AvailabilityStatus || fieldErrors.OccupancyStatus) && (
                        <span style={{ fontSize: '0.74rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}>
                          ⚠️ {fieldErrors.AvailabilityStatus || fieldErrors.OccupancyStatus}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>Description & Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Office suite specifications, corner window view, electrical outlets..."
                    value={formData.Description}
                    onChange={(e) => handleFieldChange('Description', e.target.value)}
                    style={{
                      width: '100%', padding: '11px 14px', borderRadius: '10px',
                      background: 'var(--bg-tertiary)',
                      border: fieldErrors.Description ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                      color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none', resize: 'vertical'
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
                    {formSubmitting ? '⏳ Saving...' : selectedOffice ? '✓ Update Office' : '✓ Add Office'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* UPDATE AVAILABILITY STATUS MODAL */}
      {showStatusModal && selectedOffice && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--modal-backdrop, rgba(16, 20, 24, 0.78))',
          backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          animation: 'fadeIn 0.2s ease-out', padding: '20px'
        }}>
          <div style={{
            width: '480px', maxWidth: '95vw',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--glass-border-accent)',
            borderRadius: '20px',
            boxShadow: 'var(--shadow-lg)',
            overflow: 'hidden', color: 'var(--text-primary)',
            animation: 'slideUp 0.25s ease-out'
          }}>
            {/* Header */}
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid var(--glass-border)',
              background: 'var(--bg-tertiary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '12px',
                  background: 'rgba(234, 179, 8, 0.15)', border: '1px solid rgba(234, 179, 8, 0.3)',
                  color: 'var(--color-warning)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Update Availability Status</h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {selectedOffice.OfficeNumber} — {selectedOffice.OfficeName}
                  </div>
                </div>
              </div>
              <button onClick={() => setShowStatusModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
                <X size={18} />
              </button>
            </div>

            {/* Modal Body Options */}
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ margin: '0 0 8px', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                Select new operational availability state for this office unit:
              </p>

              {OFFICE_AVAILABILITY_STATUSES.map(st => {
                const isCurrent = selectedOffice.AvailabilityStatus === st.value;
                return (
                  <button
                    key={st.value}
                    onClick={() => handleStatusChange(st.value)}
                    style={{
                      padding: '14px 18px', borderRadius: '12px',
                      background: isCurrent ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-tertiary)',
                      border: isCurrent ? '2px solid var(--accent-primary)' : '1px solid var(--glass-border)',
                      color: 'var(--text-primary)', cursor: 'pointer',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      fontWeight: 700, fontSize: '0.9rem', transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className={`badge ${st.badgeClass}`} style={{ fontSize: '0.82rem', padding: '5px 12px' }}>
                        {st.label}
                      </span>
                    </div>
                    {isCurrent && <Check size={18} color="var(--accent-primary)" />}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--glass-border)', background: 'var(--bg-tertiary)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowStatusModal(false)}
                style={{
                  padding: '8px 20px', borderRadius: '10px',
                  background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)',
                  color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer'
                }}
              >
                Cancel
              </button>
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
