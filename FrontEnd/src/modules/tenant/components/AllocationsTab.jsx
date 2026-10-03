import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  History,
  XCircle,
  MapPin,
  FileText,
  UserCheck,
  RotateCcw,
  Layers,
  Building,
  Check,
  X
} from 'lucide-react';
import tenantApi from '../api/tenantApi';
import parkApi from '../../business-park/api/parkApi';
import ConfirmDialogModal from '../../../components/common/ConfirmDialogModal';
import AlertDialogModal from '../../../components/common/AlertDialogModal';
import { tenantSchemas } from '../../../validation';
import { usePermissionContext } from '../../role-permission-management/contexts/PermissionContext';

const glassCard = {
  background: 'var(--glass-bg)',
  border: '1px solid rgba(148, 163, 184, 0.12)',
  borderRadius: '18px',
  backdropFilter: 'blur(16px)',
  padding: '24px'
};

export default function AllocationsTab({ onRefreshMetrics }) {
  const { isParkAdmin } = usePermissionContext();
  const [allocations, setAllocations] = useState([]);
  const [history, setHistory] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [offices, setOffices] = useState([]);
  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [activeSubTab, setActiveSubTab] = useState('allocations');

  // Glass Dialog Modals State
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'error' });

  const showAlert = (title, message, type = 'error') => {
    setAlertConfig({ isOpen: true, title, message, type });
  };

  // Modals
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [releaseModalAlloc, setReleaseModalAlloc] = useState(null);
  const [releaseRemarks, setReleaseRemarks] = useState('');
  const [releaseErrors, setReleaseErrors] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [scope, setScope] = useState('OFFICE'); // 'OFFICE' | 'FLOOR' | 'BUILDING'
  const [selectedBuildingID, setSelectedBuildingID] = useState('');
  const [selectedFloorID, setSelectedFloorID] = useState('');

  const [formData, setFormData] = useState({
    TenantID: '',
    OfficeSpaceID: '',
    LeaseAgreementID: '',
    AllocatedDate: new Date().toISOString().split('T')[0]
  });

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

  const handleBlur = (field) => {
    const stats = getScopePreview();
    const validation = tenantSchemas.allocationForm({
      TenantID: formData.TenantID,
      AllocationScope: scope,
      OfficeSpaceID: scope === 'OFFICE' ? formData.OfficeSpaceID : undefined,
      FloorID: scope === 'FLOOR' ? selectedFloorID : undefined,
      BuildingID: (scope === 'BUILDING' || scope === 'FLOOR') ? selectedBuildingID : undefined,
      AllocatedDate: formData.AllocatedDate,
      LeaseAgreementID: formData.LeaseAgreementID,
      availableCount: (scope === 'BUILDING' && selectedBuildingID) || (scope === 'FLOOR' && selectedFloorID) ? stats.count : undefined
    });
    if (validation.errors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: validation.errors[field] }));
    } else {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  useEffect(() => {
    fetchTenants();
    fetchBuildings();
    fetchVacantOffices();
    fetchAllocations();
    fetchHistory();
  }, [statusFilter]);

  const fetchTenants = async () => {
    try {
      const res = await tenantApi.getTenants({ limit: 200 });
      const raw = res.data?.data;
      const allTenants = Array.isArray(raw?.tenants) ? raw.tenants : Array.isArray(raw) ? raw : [];
      const eligible = allTenants.filter(t => t.Status !== 'TERMINATED' && t.Status !== 'SUSPENDED');
      setTenants(eligible);
    } catch (err) {
      console.error('Failed to fetch tenants', err);
    }
  };

  const fetchBuildings = async () => {
    try {
      const res = await parkApi.getBuildings({ limit: 100 });
      setBuildings(res.data?.data?.buildings || res.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch buildings', err);
    }
  };

  const fetchFloorsForBuilding = async (bId) => {
    if (!bId) {
      setFloors([]);
      return;
    }
    try {
      const res = await parkApi.getFloors({ buildingId: bId, limit: 100 });
      setFloors(res.data?.data?.floors || res.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch floors', err);
    }
  };

  const fetchVacantOffices = async () => {
    try {
      const res = await parkApi.getOffices({ limit: 300 });
      const allOffices = res.data?.data?.offices || res.data?.data || [];
      setOffices(allOffices);
    } catch (err) {
      console.error('Failed to fetch offices', err);
    }
  };

  const fetchTenantLeases = async (tenantId) => {
    if (!tenantId) {
      setLeases([]);
      return;
    }
    try {
      const res = await tenantApi.getLeases({ tenantId, status: 'ACTIVE' });
      setLeases(res.data?.data?.leases || res.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch tenant leases', err);
    }
  };

  const fetchAllocations = async () => {
    try {
      setLoading(true);
      const res = await tenantApi.getAllocations({ status: statusFilter });
      setAllocations(res.data?.data?.allocations || res.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch allocations', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await tenantApi.getAllocationHistory({ limit: 100 });
      setHistory(res.data?.data?.history || res.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch allocation history', err);
    }
  };

  const handleOpenAllocate = () => {
    const firstTenantId = tenants[0]?.TenantID || '';
    setScope('OFFICE');
    setSelectedBuildingID(buildings[0]?.BuildingID || '');
    if (buildings[0]?.BuildingID) {
      fetchFloorsForBuilding(buildings[0].BuildingID);
    }
    setSelectedFloorID('');
    setFormData({
      TenantID: firstTenantId,
      OfficeSpaceID: offices.find((o) => o.AvailabilityStatus === 'VACANT')?.OfficeSpaceID || '',
      LeaseAgreementID: '',
      AllocatedDate: new Date().toISOString().split('T')[0]
    });
    if (firstTenantId) {
      fetchTenantLeases(firstTenantId);
    }
    setFieldErrors({});
    setErrorMsg('');
    setIsAllocateModalOpen(true);
  };

  const handleTenantSelect = (tenantId) => {
    setFormData(prev => ({ ...prev, TenantID: tenantId, LeaseAgreementID: '' }));
    if (fieldErrors.TenantID) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next.TenantID;
        return next;
      });
    }
    fetchTenantLeases(tenantId);
  };

  const handleBuildingSelect = (bId) => {
    setSelectedBuildingID(bId);
    if (fieldErrors.BuildingID) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next.BuildingID;
        return next;
      });
    }
    setSelectedFloorID('');
    fetchFloorsForBuilding(bId);
  };

  // Preview Calculations
  const getScopePreview = () => {
    const vacantOffices = offices.filter(o => o.AvailabilityStatus === 'VACANT');

    if (scope === 'BUILDING') {
      if (!selectedBuildingID) return { count: 0, area: 0 };
      const buildingOffices = vacantOffices.filter(o => {
        const fl = floors.find(f => f.FloorID === o.FloorID);
        return fl && String(fl.BuildingID) === String(selectedBuildingID);
      });
      const area = buildingOffices.reduce((acc, curr) => acc + Number(curr.SquareMeters || 0), 0);
      return { count: buildingOffices.length, area };
    }

    if (scope === 'FLOOR') {
      if (!selectedFloorID) return { count: 0, area: 0 };
      const floorOffices = vacantOffices.filter(o => String(o.FloorID) === String(selectedFloorID));
      const area = floorOffices.reduce((acc, curr) => acc + Number(curr.SquareMeters || 0), 0);
      return { count: floorOffices.length, area };
    }

    // Single Office
    const off = vacantOffices.find(o => String(o.OfficeSpaceID) === String(formData.OfficeSpaceID));
    return { count: off ? 1 : 0, area: Number(off?.SquareMeters || 0) };
  };

  const handleAllocateSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setErrorMsg('');

    const stats = getScopePreview();
    const isSelectionMade = (scope === 'OFFICE' && formData.OfficeSpaceID) ||
      (scope === 'FLOOR' && selectedFloorID) ||
      (scope === 'BUILDING' && selectedBuildingID);

    const validation = tenantSchemas.allocationForm({
      TenantID: formData.TenantID,
      AllocationScope: scope,
      OfficeSpaceID: scope === 'OFFICE' ? formData.OfficeSpaceID : undefined,
      FloorID: scope === 'FLOOR' ? selectedFloorID : undefined,
      BuildingID: (scope === 'BUILDING' || scope === 'FLOOR') ? selectedBuildingID : undefined,
      AllocatedDate: formData.AllocatedDate,
      LeaseAgreementID: formData.LeaseAgreementID,
      availableCount: isSelectionMade ? stats.count : undefined
    });

    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      setErrorMsg('');
      return;
    }

    try {
      const payload = {
        TenantID: validation.sanitized.TenantID,
        LeaseAgreementID: validation.sanitized.LeaseAgreementID,
        AllocatedDate: validation.sanitized.AllocatedDate,
        AllocationScope: validation.sanitized.AllocationScope,
        OfficeSpaceID: validation.sanitized.OfficeSpaceID,
        FloorID: validation.sanitized.FloorID,
        BuildingID: validation.sanitized.BuildingID
      };

      await tenantApi.allocateOffice(payload);
      setIsAllocateModalOpen(false);
      fetchAllocations();
      fetchVacantOffices();
      fetchHistory();
      if (onRefreshMetrics) onRefreshMetrics();
    } catch (err) {
      const msg = err.response?.data?.message || 'Space allocation failed';
      setErrorMsg(msg);
      if (err.response?.data?.details && Array.isArray(err.response.data.details)) {
        const beErrors = {};
        err.response.data.details.forEach(d => {
          if (d.field) beErrors[d.field] = d.message;
        });
        setFieldErrors(beErrors);
      }
    }
  };

  const handleReleaseSubmit = async (e) => {
    e.preventDefault();
    if (!releaseModalAlloc) return;
    setReleaseErrors({});

    const validation = tenantSchemas.releaseAllocationForm({ Remarks: releaseRemarks });
    if (!validation.isValid) {
      setReleaseErrors(validation.errors);
      return;
    }

    try {
      await tenantApi.releaseAllocation(releaseModalAlloc.TenantOfficeAllocationID, validation.sanitized.Remarks);
      setReleaseModalAlloc(null);
      setReleaseRemarks('');
      setReleaseErrors({});
      fetchAllocations();
      fetchVacantOffices();
      fetchHistory();
      if (onRefreshMetrics) onRefreshMetrics();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to release allocation';
      showAlert('Action Failed', msg, 'error');
    }
  };

  const previewStats = getScopePreview();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Action Bar */}
      <div style={{ ...glassCard, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Building2 size={22} color="#f59e0b" />
          <div>
            <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '16.5px', fontWeight: 700 }}>
              Tenant Space Allocations Engine
            </h3>
            <p style={{ margin: '2px 0 0', color: 'var(--text-muted)', fontSize: '12.5px' }}>
              Allocate Individual Office Units, Full Floor Levels, or Entire Buildings to Enterprise Tenants
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Sub-tab switcher */}
          <div style={{ display: 'flex', background: 'var(--bg-tertiary)', padding: '4px', borderRadius: '10px' }}>
            <button
              onClick={() => setActiveSubTab('allocations')}
              style={{
                padding: '6px 14px', borderRadius: '8px', border: 'none',
                background: activeSubTab === 'allocations' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                color: activeSubTab === 'allocations' ? '#818cf8' : 'var(--text-muted)',
                fontWeight: 700, fontSize: '12.5px', cursor: 'pointer'
              }}
            >
              Active Allocations
            </button>
            <button
              onClick={() => setActiveSubTab('history')}
              style={{
                padding: '6px 14px', borderRadius: '8px', border: 'none',
                background: activeSubTab === 'history' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                color: activeSubTab === 'history' ? '#818cf8' : 'var(--text-muted)',
                fontWeight: 700, fontSize: '12.5px', cursor: 'pointer'
              }}
            >
              Allocation History
            </button>
          </div>

          {isParkAdmin && (
            <button
              onClick={handleOpenAllocate}
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                border: 'none', borderRadius: '10px', padding: '9px 18px',
                color: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px',
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)'
              }}
            >
              <Plus size={16} /> Allocate Space (Office / Floor / Building)
            </button>
          )}
        </div>
      </div>

      {/* Main Content View */}
      {activeSubTab === 'allocations' ? (
        <div style={{ ...glassCard, padding: '0', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px' }}>Loading space allocations...</div>
          ) : allocations.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px' }}>No office allocations recorded.</div>
          ) : (
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Allocation ID</th>
                  <th>Tenant Company</th>
                  <th>Space Details</th>
                  <th>Building & Floor</th>
                  <th>Area (sq.m)</th>
                  <th>Allocated Date</th>
                  <th>Status</th>
                  {isParkAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {allocations.map((alloc) => (
                  <tr key={alloc.TenantOfficeAllocationID}>
                    <td style={{ fontWeight: 700, color: '#6366f1' }}>#{alloc.TenantOfficeAllocationID}</td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{alloc.TenantCompanyName}</div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{alloc.TenantCode}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#38bdf8' }}>{alloc.OfficeName} ({alloc.OfficeNumber})</div>
                      {alloc.AgreementNumber && (
                        <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <FileText size={10} /> {alloc.AgreementNumber}
                        </span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={12} color="var(--text-muted)" /> {alloc.BuildingName} &bull; {alloc.FloorName}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: '#f59e0b' }}>{alloc.SquareMeters} m²</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                      {new Date(alloc.AllocatedDate).toLocaleDateString()}
                    </td>
                    <td>
                      <span style={{
                        background: alloc.Status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                        color: alloc.Status === 'ACTIVE' ? '#10b981' : 'var(--text-muted)',
                        padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700
                      }}>
                        {alloc.Status}
                      </span>
                    </td>
                    {isParkAdmin && (
                      <td>
                        {alloc.Status === 'ACTIVE' && (
                          <button
                            onClick={() => setReleaseModalAlloc(alloc)}
                            style={{
                              background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)',
                              borderRadius: '8px', padding: '5px 12px', color: '#ef4444', fontSize: '12px', fontWeight: 600,
                              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                            }}
                          >
                            <RotateCcw size={12} /> Release Space
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        /* History View */
        <div style={{ ...glassCard, padding: '0', overflow: 'hidden' }}>
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px' }}>No allocation history recorded.</div>
          ) : (
            <table className="custom-table">
              <thead>
                <tr>
                  <th>History ID</th>
                  <th>Action</th>
                  <th>Tenant Company</th>
                  <th>Office Space</th>
                  <th>Remarks</th>
                  <th>Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.OfficeAllocationHistoryID || h.HistoryID}>
                    <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>#{h.OfficeAllocationHistoryID || h.HistoryID}</td>
                    <td>
                      <span style={{
                        background: h.ActionType === 'ALLOCATED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: h.ActionType === 'ALLOCATED' ? '#10b981' : '#ef4444',
                        padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700
                      }}>
                        {h.ActionType}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{h.CompanyName || h.TenantCompanyName}</td>
                    <td style={{ color: '#38bdf8' }}>{h.OfficeName || h.OfficeNumber}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{h.Remarks || 'N/A'}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                      {new Date(h.CreatedDate || h.ActionDateTime).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Allocate Modal (Office / Floor / Building) */}
      {isAllocateModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'var(--modal-backdrop, rgba(16, 20, 24, 0.78))', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }} onClick={() => setIsAllocateModalOpen(false)}>
          <div style={{
            ...glassCard, background: 'var(--bg-secondary)', width: '560px', maxWidth: '90vw',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            animation: 'fadeInUp 0.3s ease-out'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '18px', fontWeight: 700 }}>
                🏬 Allocate Real Estate Space
              </h3>
              <button onClick={() => setIsAllocateModalOpen(false)} style={{
                background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer'
              }}><X size={20} /></button>
            </div>

            {(errorMsg || Object.keys(fieldErrors).length > 0) && (
              <div style={{
                padding: '10px 14px', borderRadius: '10px', marginBottom: '14px', fontSize: '12.5px',
                background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444'
              }}>
                {errorMsg || Object.values(fieldErrors)[0]}
              </div>
            )}

            {/* Scope Switcher */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', background: 'var(--bg-tertiary)', padding: '4px', borderRadius: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  setScope('OFFICE');
                  setFieldErrors(prev => {
                    const n = { ...prev };
                    delete n.OfficeSpaceID;
                    delete n.FloorID;
                    delete n.BuildingID;
                    return n;
                  });
                }}
                style={{
                  flex: 1, padding: '8px 4px', borderRadius: '8px', border: 'none',
                  background: scope === 'OFFICE' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'transparent',
                  color: scope === 'OFFICE' ? '#fff' : 'var(--text-muted)', fontWeight: 700, fontSize: '12px', cursor: 'pointer'
                }}
              >
                🚪 Single Office Unit
              </button>
              <button
                type="button"
                onClick={() => {
                  setScope('FLOOR');
                  setFieldErrors(prev => {
                    const n = { ...prev };
                    delete n.OfficeSpaceID;
                    delete n.FloorID;
                    delete n.BuildingID;
                    return n;
                  });
                }}
                style={{
                  flex: 1, padding: '8px 4px', borderRadius: '8px', border: 'none',
                  background: scope === 'FLOOR' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'transparent',
                  color: scope === 'FLOOR' ? '#fff' : 'var(--text-muted)', fontWeight: 700, fontSize: '12px', cursor: 'pointer'
                }}
              >
                🏬 Entire Floor Level
              </button>
              <button
                type="button"
                onClick={() => {
                  setScope('BUILDING');
                  setFieldErrors(prev => {
                    const n = { ...prev };
                    delete n.OfficeSpaceID;
                    delete n.FloorID;
                    delete n.BuildingID;
                    return n;
                  });
                }}
                style={{
                  flex: 1, padding: '8px 4px', borderRadius: '8px', border: 'none',
                  background: scope === 'BUILDING' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'transparent',
                  color: scope === 'BUILDING' ? '#fff' : 'var(--text-muted)', fontWeight: 700, fontSize: '12px', cursor: 'pointer'
                }}
              >
                🏙️ Entire Building
              </button>
            </div>

            <form onSubmit={handleAllocateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Tenant Selection */}
              <div>
                <label style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Target Tenant Company *</label>
                <select
                  value={formData.TenantID}
                  onChange={(e) => handleTenantSelect(e.target.value)}
                  onBlur={() => handleBlur('TenantID')}
                  style={{
                    width: '100%', background: 'var(--bg-tertiary)',
                    border: fieldErrors.TenantID ? '1px solid #ef4444' : '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: '10px', padding: '10px 14px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', boxSizing: 'border-box'
                  }}
                >
                  <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>-- Choose Tenant Company --</option>
                  {(Array.isArray(tenants) ? tenants : []).map(t => (
                    <option key={t.TenantID} value={t.TenantID} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{t.CompanyName} ({t.TenantCode})</option>
                  ))}
                </select>
                {fieldErrors.TenantID && (
                  <span style={{ fontSize: '0.74rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}>
                    ⚠️ {fieldErrors.TenantID}
                  </span>
                )}
              </div>

              {/* Dynamic Scope Inputs */}
              {scope === 'OFFICE' && (
                <div>
                  <label style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Select Vacant Office Unit *</label>
                  <select
                    value={formData.OfficeSpaceID}
                    onChange={(e) => handleFieldChange('OfficeSpaceID', e.target.value)}
                    onBlur={() => handleBlur('OfficeSpaceID')}
                    style={{
                      width: '100%', background: 'var(--bg-tertiary)',
                      border: fieldErrors.OfficeSpaceID ? '1px solid #ef4444' : '1px solid rgba(245, 158, 11, 0.3)',
                      borderRadius: '10px', padding: '10px 14px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', boxSizing: 'border-box'
                    }}
                  >
                    <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>-- Choose Vacant Office Unit --</option>
                    {offices.filter(o => o.AvailabilityStatus === 'VACANT').map(o => (
                      <option key={o.OfficeSpaceID} value={o.OfficeSpaceID} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                        {o.OfficeName} ({o.OfficeNumber}) &bull; {o.SquareMeters} m² &bull; {o.BuildingName || 'Building'} - {o.FloorName || 'Floor'}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.OfficeSpaceID && (
                    <span style={{ fontSize: '0.74rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}>
                      ⚠️ {fieldErrors.OfficeSpaceID}
                    </span>
                  )}
                </div>
              )}

              {scope === 'FLOOR' && (
                <>
                  <div>
                    <label style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Building Block *</label>
                    <select
                      value={selectedBuildingID}
                      onChange={(e) => handleBuildingSelect(e.target.value)}
                      onBlur={() => handleBlur('BuildingID')}
                      style={{
                        width: '100%', background: 'var(--bg-tertiary)',
                        border: fieldErrors.BuildingID ? '1px solid #ef4444' : '1px solid rgba(245, 158, 11, 0.3)',
                        borderRadius: '10px', padding: '10px 14px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', boxSizing: 'border-box'
                      }}
                    >
                      <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>-- Select Building Block --</option>
                      {buildings.map(b => (
                        <option key={b.BuildingID} value={b.BuildingID} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{b.BuildingName} ({b.BuildingCode || b.BuildingID})</option>
                      ))}
                    </select>
                    {fieldErrors.BuildingID && (
                      <span style={{ fontSize: '0.74rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}>
                        ⚠️ {fieldErrors.BuildingID}
                      </span>
                    )}
                  </div>

                  <div>
                    <label style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Floor Level *</label>
                    <select
                      value={selectedFloorID}
                      onChange={(e) => {
                        setSelectedFloorID(e.target.value);
                        if (fieldErrors.FloorID) {
                          setFieldErrors(prev => {
                            const next = { ...prev };
                            delete next.FloorID;
                            return next;
                          });
                        }
                      }}
                      onBlur={() => handleBlur('FloorID')}
                      style={{
                        width: '100%', background: 'var(--bg-tertiary)',
                        border: fieldErrors.FloorID ? '1px solid #ef4444' : '1px solid rgba(245, 158, 11, 0.3)',
                        borderRadius: '10px', padding: '10px 14px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', boxSizing: 'border-box'
                      }}
                    >
                      <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>-- Select Floor Level --</option>
                      {floors.map(f => (
                        <option key={f.FloorID} value={f.FloorID} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{f.FloorName} (Level {f.FloorNumber})</option>
                      ))}
                    </select>
                    {fieldErrors.FloorID && (
                      <span style={{ fontSize: '0.74rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}>
                        ⚠️ {fieldErrors.FloorID}
                      </span>
                    )}
                  </div>
                </>
              )}

              {scope === 'BUILDING' && (
                <div>
                  <label style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Entire Building Block *</label>
                  <select
                    value={selectedBuildingID}
                    onChange={(e) => {
                      setSelectedBuildingID(e.target.value);
                      if (fieldErrors.BuildingID) {
                        setFieldErrors(prev => {
                          const next = { ...prev };
                          delete next.BuildingID;
                          return next;
                        });
                      }
                    }}
                    style={{
                      width: '100%', background: 'var(--bg-tertiary)',
                      border: fieldErrors.BuildingID ? '1px solid #ef4444' : '1px solid rgba(245, 158, 11, 0.3)',
                      borderRadius: '10px', padding: '10px 14px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', boxSizing: 'border-box'
                    }}
                  >
                    <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>-- Select Building Block --</option>
                    {buildings.map(b => (
                      <option key={b.BuildingID} value={b.BuildingID} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{b.BuildingName} ({b.BuildingCode || b.BuildingID})</option>
                    ))}
                  </select>
                  {fieldErrors.BuildingID && (
                    <span style={{ fontSize: '0.74rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}>
                      ⚠️ {fieldErrors.BuildingID}
                    </span>
                  )}
                </div>
              )}

              {/* Scope Summary Preview Box */}
              <div style={{
                background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)',
                borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <div>
                  <span style={{ color: '#f59e0b', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>Scope Capacity Summary</span>
                  <div style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 700, marginTop: '2px' }}>
                    {previewStats.count} Vacant Office Space Units
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Aggregated Area</span>
                  <div style={{ color: '#10b981', fontSize: '15px', fontWeight: 800 }}>
                    {previewStats.area} m² Total
                  </div>
                </div>
              </div>

              {/* Linked Lease Agreement */}
              <div>
                <label style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Link Active Lease Contract (Optional)</label>
                <select
                  value={formData.LeaseAgreementID}
                  onChange={(e) => handleFieldChange('LeaseAgreementID', e.target.value)}
                  style={{
                    width: '100%', background: 'var(--bg-tertiary)',
                    border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '10px',
                    padding: '10px 14px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', boxSizing: 'border-box'
                  }}
                >
                  <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>-- No Lease Contract Link --</option>
                  {leases.map(l => (
                    <option key={l.LeaseAgreementID} value={l.LeaseAgreementID} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                      Contract #{l.AgreementNumber} (ETB {Number(l.MonthlyRentAmount).toLocaleString()}/mo)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Allocation Date *</label>
                <input
                  type="date"
                  value={formData.AllocatedDate}
                  onChange={(e) => handleFieldChange('AllocatedDate', e.target.value)}
                  onBlur={() => handleBlur('AllocatedDate')}
                  style={{
                    width: '100%', background: 'var(--bg-tertiary)',
                    border: fieldErrors.AllocatedDate ? '1px solid #ef4444' : '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: '10px', padding: '10px 14px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', boxSizing: 'border-box'
                  }}
                />
                {fieldErrors.AllocatedDate && (
                  <span style={{ fontSize: '0.74rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}>
                    ⚠️ {fieldErrors.AllocatedDate}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '14px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setIsAllocateModalOpen(false)}
                  style={{
                    background: 'rgba(100, 116, 139, 0.2)', border: '1px solid rgba(148, 163, 184, 0.15)',
                    borderRadius: '10px', padding: '10px 20px', color: 'var(--text-muted)', fontWeight: 600,
                    fontSize: '13px', cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    border: 'none', borderRadius: '10px', padding: '10px 24px',
                    color: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                  }}
                >
                  Execute Space Allocation {previewStats.count > 0 ? `(${previewStats.count} Units)` : ''}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Release Modal */}
      {releaseModalAlloc && (
        <div style={{
          position: 'fixed', inset: 0, background: 'var(--modal-backdrop, rgba(16, 20, 24, 0.78))', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }} onClick={() => setReleaseModalAlloc(null)}>
          <div style={{
            ...glassCard, background: 'var(--bg-secondary)', width: '460px', maxWidth: '90vw',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            animation: 'fadeInUp 0.3s ease-out'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '18px', fontWeight: 700 }}>
                🔄 Release Space Allocation
              </h3>
              <button onClick={() => setReleaseModalAlloc(null)} style={{
                background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer'
              }}><X size={20} /></button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginBottom: '16px' }}>
              Release <strong style={{ color: 'var(--text-primary)' }}>{releaseModalAlloc.OfficeName}</strong> from <strong style={{ color: 'var(--text-primary)' }}>{releaseModalAlloc.TenantCompanyName}</strong>?
            </p>

            <form onSubmit={handleReleaseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Release Reason / Remarks *</label>
                <textarea
                  value={releaseRemarks}
                  onChange={(e) => {
                    setReleaseRemarks(e.target.value);
                    if (releaseErrors.Remarks) setReleaseErrors({});
                  }}
                  placeholder="e.g. Lease expired, tenant relocated to new floor..."
                  rows={3}
                  style={{
                    width: '100%', background: 'var(--bg-tertiary)',
                    border: releaseErrors.Remarks ? '1px solid #ef4444' : '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px',
                    padding: '10px 14px', color: 'var(--text-primary)', fontSize: '13.5px', outline: 'none',
                    resize: 'vertical', boxSizing: 'border-box'
                  }}
                />
                {releaseErrors.Remarks && (
                  <span style={{ fontSize: '0.74rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}>
                    ⚠️ {releaseErrors.Remarks}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setReleaseModalAlloc(null)}
                  style={{
                    background: 'rgba(100, 116, 139, 0.2)', border: '1px solid rgba(148, 163, 184, 0.15)',
                    borderRadius: '10px', padding: '10px 20px', color: 'var(--text-muted)', fontWeight: 600,
                    fontSize: '13px', cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    border: 'none', borderRadius: '10px', padding: '10px 22px',
                    color: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                  }}
                >
                  Confirm Release
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

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
