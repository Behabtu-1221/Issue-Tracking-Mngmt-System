import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Edit2,
  Trash2,
  UserCheck
} from 'lucide-react';
import orgApi from '../api/orgApi';
import parkApi from '../../business-park/api/parkApi';
import identityApi from '../../identity-access/api/identityApi';
import ConfirmDialogModal from '../../../components/common/ConfirmDialogModal';
import AlertDialogModal from '../../../components/common/AlertDialogModal';
import { FormField } from '../../../components/common/FormField';
import { orgSchemas } from '../../../validation';

export default function DepartmentsUnitsTab({ onRefreshMetrics }) {
  const [departments, setDepartments] = useState([]);
  const [parks, setParks] = useState([]);
  const [users, setUsers] = useState([]);
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals & Location Mapping States
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [locationModalDept, setLocationModalDept] = useState(null);
  const [deptLocations, setDeptLocations] = useState([]);
  const [selectedOfficeId, setSelectedOfficeId] = useState('');
  const [editingDept, setEditingDept] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [deptErrors, setDeptErrors] = useState({});
  const [locationError, setLocationError] = useState('');

  const clearDeptError = (field) => {
    if (deptErrors[field]) {
      setDeptErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Glass modal states
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', type: 'danger', confirmText: 'Confirm', onConfirm: () => {} });
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'success' });

  const showAlert = (title, message, type = 'success') => {
    setAlertConfig({ isOpen: true, title, message, type });
  };

  // Forms
  const [deptForm, setDeptForm] = useState({
    BusinessParkID: '',
    DepartmentCode: '',
    DepartmentName: '',
    ManagerUserID: '',
    IsActive: 1
  });

  useEffect(() => {
    fetchParks();
    fetchUsers();
    fetchOffices();
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [search]);

  const fetchParks = async () => {
    try {
      const res = await parkApi.getParks({ limit: 100 });
      setParks(res.data?.data?.parks || res.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch business parks', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await identityApi.getUsers({ limit: 300 });
      setUsers(res.data?.data?.users || res.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch users', err);
    }
  };

  const fetchOffices = async () => {
    try {
      const res = await parkApi.getOffices({ limit: 300 });
      setOffices(res.data?.data?.offices || res.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch office spaces', err);
    }
  };

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await orgApi.getDepartments({ search });
      setDepartments(res.data?.data?.departments || res.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch departments', err);
    } finally {
      setLoading(false);
    }
  };

  // Department Handlers
  const handleOpenDeptCreate = () => {
    setEditingDept(null);
    setDeptForm({
      BusinessParkID: parks[0]?.BusinessParkID || '',
      DepartmentCode: `DEPT-${Math.floor(100 + Math.random() * 900)}`,
      DepartmentName: '',
      ManagerUserID: '',
      IsActive: 1
    });
    setErrorMsg('');
    setDeptErrors({});
    setIsDeptModalOpen(true);
  };

  const handleOpenDeptEdit = (d) => {
    setEditingDept(d);
    setDeptForm({
      BusinessParkID: d.BusinessParkID || parks[0]?.BusinessParkID || '',
      DepartmentCode: d.DepartmentCode,
      DepartmentName: d.DepartmentName,
      ManagerUserID: d.ManagerUserID || '',
      IsActive: d.IsActive !== undefined ? d.IsActive : 1
    });
    setErrorMsg('');
    setDeptErrors({});
    setIsDeptModalOpen(true);
  };

  const handleDeptSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const validation = orgSchemas.departmentForm(deptForm);
    if (!validation.isValid) {
      setDeptErrors(validation.errors);
      return;
    }
    setDeptErrors({});

    try {
      if (editingDept) {
        await orgApi.updateDepartment(editingDept.DepartmentID, {
          ...deptForm,
          DepartmentName: validation.sanitized.DepartmentName,
          DepartmentCode: validation.sanitized.DepartmentCode
        });
      } else {
        await orgApi.createDepartment({
          ...deptForm,
          DepartmentName: validation.sanitized.DepartmentName,
          DepartmentCode: validation.sanitized.DepartmentCode
        });
      }
      setIsDeptModalOpen(false);
      fetchDepartments();
      if (onRefreshMetrics) onRefreshMetrics();
      showAlert(
        editingDept ? 'Department Updated' : 'Department Created',
        `Department "${validation.sanitized.DepartmentName}" saved successfully.`,
        'success'
      );
    } catch (err) {
      const msg = err.response?.data?.message || 'Operation failed';
      setErrorMsg(msg);
    }
  };

  const handleDeptDelete = (id, deptName) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Department',
      message: `Are you sure you want to delete department "${deptName}"?`,
      type: 'danger',
      confirmText: 'Delete Department',
      onConfirm: async () => {
        try {
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          await orgApi.deleteDepartment(id);
          fetchDepartments();
          if (onRefreshMetrics) onRefreshMetrics();
        } catch (err) {
          const msg = err.response?.data?.message || 'Failed to delete department';
          showAlert('Action Restricted', msg, 'error');
        }
      }
    });
  };


  // Department Location Mapping Handlers
  const handleOpenLocations = async (dept) => {
    setLocationModalDept(dept);
    setSelectedOfficeId('');
    setLocationError('');
    try {
      const res = await orgApi.getDepartmentLocations(dept.DepartmentID);
      setDeptLocations(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load dept locations', err);
    }
  };

  const handleAddLocation = async (e) => {
    e.preventDefault();
    setLocationError('');
    const validation = orgSchemas.departmentLocationForm({ OfficeSpaceID: selectedOfficeId });
    if (!validation.isValid) {
      setLocationError(validation.errors.OfficeSpaceID);
      return;
    }

    try {
      await orgApi.addDepartmentLocation(locationModalDept.DepartmentID, validation.sanitized.OfficeSpaceID);
      setSelectedOfficeId('');
      setLocationError('');
      const res = await orgApi.getDepartmentLocations(locationModalDept.DepartmentID);
      setDeptLocations(res.data?.data || []);
      fetchDepartments();
      showAlert('Office Mapped', 'Office space mapped to department successfully.', 'success');
    } catch (err) {
      setLocationError(err.response?.data?.message || 'Failed to map location');
    }
  };

  const handleRemoveLocation = async (locId) => {
    try {
      await orgApi.removeDepartmentLocation(locId);
      const res = await orgApi.getDepartmentLocations(locationModalDept.DepartmentID);
      setDeptLocations(res.data?.data || []);
      fetchDepartments();
    } catch (err) {
      showAlert('Remove Location Failed', err.response?.data?.message || 'Failed to remove location', 'error');
    }
  };

  return (
    <div>
      {/* Action Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by department name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px 10px 36px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--border-radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem'
              }}
            />
          </div>
        </div>

        <button
          onClick={handleOpenDeptCreate}
          style={{
            padding: '10px 18px',
            background: 'var(--accent-gradient)',
            border: 'none',
            borderRadius: 'var(--border-radius-sm)',
            color: '#ffffff',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: 'var(--glow-accent)'
          }}
        >
          <Plus size={16} /> Add Department
        </button>
      </div>

      {/* Directory Table */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading departments...</div>
        ) : departments.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No departments found matching criteria.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '16px 20px' }}>Department Name & Code</th>
                <th style={{ padding: '16px 20px' }}>Business Park</th>
                <th style={{ padding: '16px 20px' }}>Department Manager</th>
                <th style={{ padding: '16px 20px' }}>Teams / Staff</th>
                <th style={{ padding: '16px 20px' }}>Locations</th>
                <th style={{ padding: '16px 20px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((d) => (
                <tr key={d.DepartmentID} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{d.DepartmentName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{d.DepartmentCode}</div>
                  </td>
                  <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      <Building2 size={14} color="var(--accent-primary)" />
                      {d.BusinessParkName || 'Main Park Campus'}
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    {d.ManagerFullName ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4ade80' }}>
                        <UserCheck size={14} /> {d.ManagerFullName}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Unassigned</span>
                    )}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', gap: '10px', fontSize: '0.8rem' }}>
                      <span>{d.TeamCount} Teams</span>
                      <span style={{ color: '#60a5fa' }}>{d.ActiveEmployeeCount} Staff</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <button
                      onClick={() => handleOpenLocations(d)}
                      style={{
                        padding: '4px 10px',
                        background: 'rgba(99, 102, 241, 0.15)',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        borderRadius: '4px',
                        color: '#818cf8',
                        cursor: 'pointer',
                        fontSize: '0.78rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <MapPin size={12} /> {d.LocationCount || 0} Offices
                    </button>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleOpenDeptEdit(d)}
                        style={{ padding: '6px 10px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', borderRadius: '4px', color: 'var(--text-primary)', cursor: 'pointer' }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeptDelete(d.DepartmentID, d.DepartmentName)}
                        style={{ padding: '6px 10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '4px', color: '#f87171', cursor: 'pointer' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal: Create/Edit Department */}
      {isDeptModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--modal-backdrop, rgba(16, 20, 24, 0.78))', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '520px', padding: '28px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)' }}>
              <Building2 color="var(--accent-primary)" />
              {editingDept ? 'Edit Department' : 'Add Department'}
            </h2>

            {errorMsg && (
              <div style={{ padding: '10px 14px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '0.85rem', marginBottom: '16px' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleDeptSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Business Park Name</label>
                <div style={{ width: '100%', padding: '10px 14px', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.88rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building2 size={16} color="var(--accent-primary)" />
                  {parks.length > 0
                    ? `${parks[0].BusinessParkName} (${parks[0].BusinessParkCode})`
                    : 'Loading...'}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                <FormField
                  label="Code"
                  required
                  error={deptErrors.DepartmentCode}
                  icon={Building2}
                  hint="Format: DEPT-01"
                >
                  <input
                    type="text"
                    placeholder="e.g. DEPT-IT"
                    value={deptForm.DepartmentCode}
                    onChange={(e) => {
                      setDeptForm({ ...deptForm, DepartmentCode: e.target.value });
                      clearDeptError('DepartmentCode');
                    }}
                    style={{
                      width: '100%', padding: '10px 12px', background: 'var(--bg-tertiary)',
                      border: `1px solid ${deptErrors.DepartmentCode ? 'rgba(239, 68, 68, 0.5)' : 'var(--glass-border)'}`,
                      borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </FormField>

                <FormField
                  label="Department Name"
                  required
                  error={deptErrors.DepartmentName}
                  icon={Building2}
                >
                  <input
                    type="text"
                    placeholder="e.g. Information Technology"
                    value={deptForm.DepartmentName}
                    onChange={(e) => {
                      setDeptForm({ ...deptForm, DepartmentName: e.target.value });
                      clearDeptError('DepartmentName');
                    }}
                    style={{
                      width: '100%', padding: '10px 12px', background: 'var(--bg-tertiary)',
                      border: `1px solid ${deptErrors.DepartmentName ? 'rgba(239, 68, 68, 0.5)' : 'var(--glass-border)'}`,
                      borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </FormField>
              </div>

              <FormField
                label="Department Manager (Optional)"
                error={deptErrors.ManagerUserID}
                icon={UserCheck}
              >
                <select
                  value={deptForm.ManagerUserID}
                  onChange={(e) => {
                    setDeptForm({ ...deptForm, ManagerUserID: e.target.value });
                    clearDeptError('ManagerUserID');
                  }}
                  style={{
                    width: '100%', padding: '10px 12px', background: 'var(--bg-tertiary)',
                    border: '1px solid var(--glass-border)', borderRadius: '8px',
                    color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box'
                  }}
                >
                  <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>-- No Manager Assigned --</option>
                  {users.map((u) => (
                    <option key={u.UserID} value={u.UserID} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                      {u.FirstName ? `${u.FirstName} ${u.LastName}` : u.Username} ({u.Email})
                    </option>
                  ))}
                </select>
              </FormField>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsDeptModalOpen(false)}
                  style={{ padding: '10px 18px', background: 'transparent', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 20px', background: 'var(--accent-gradient)', border: 'none', borderRadius: '8px', color: '#ffffff', fontWeight: '600', cursor: 'pointer' }}
                >
                  Save Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Department Office Space Location Mappings */}
      {locationModalDept && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--modal-backdrop, rgba(16, 20, 24, 0.78))', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '560px', padding: '28px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                <MapPin color="var(--accent-primary)" />
                Office Spaces for {locationModalDept.DepartmentName}
              </h2>
              <button
                onClick={() => setLocationModalDept(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            {/* Map new office space form */}
            <form onSubmit={handleAddLocation} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <FormField
                label="Select Office Space"
                required
                error={locationError}
                icon={MapPin}
              >
                <div style={{ display: 'flex', gap: '10px' }}>
                  <select
                    value={selectedOfficeId}
                    onChange={(e) => {
                      setSelectedOfficeId(e.target.value);
                      if (locationError) setLocationError('');
                    }}
                    style={{
                      flex: 1, padding: '10px 12px', background: 'var(--bg-tertiary)',
                      border: `1px solid ${locationError ? 'rgba(239, 68, 68, 0.5)' : 'var(--glass-border)'}`,
                      borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none'
                    }}
                  >
                    <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Select Office Space to Map</option>
                    {offices.map((o) => (
                      <option key={o.OfficeSpaceID} value={o.OfficeSpaceID} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                        Office {o.OfficeNumber} - {o.OfficeName} ({o.SquareMeters} m²)
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    style={{ padding: '10px 18px', background: 'var(--accent-gradient)', border: 'none', borderRadius: '8px', color: '#ffffff', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    Map Office
                  </button>
                </div>
              </FormField>
            </form>

            {/* Current Office mappings list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
              {deptLocations.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No office spaces currently mapped to this department.
                </div>
              ) : (
                deptLocations.map((loc) => (
                  <div key={loc.DepartmentLocationID} className="glass-card" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                        Office {loc.OfficeNumber} ({loc.OfficeName})
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {loc.BuildingName} • {loc.FloorName} ({loc.SquareMeters} m²)
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveLocation(loc.DepartmentLocationID)}
                      style={{ padding: '6px 10px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '4px', color: '#f87171', cursor: 'pointer', fontSize: '0.78rem' }}
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
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
