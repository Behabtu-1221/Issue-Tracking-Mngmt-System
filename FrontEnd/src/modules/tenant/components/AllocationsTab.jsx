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
import { ModalCard } from '../../../components/common/ModalCard';
import { FormField } from '../../../components/common/FormField';
import { tenantSchemas } from '../../../validation';
import { usePermissionContext } from '../../role-permission-management/contexts/PermissionContext';
import { useTranslation } from '../../../i18n';

const glassCard = {
  background: 'var(--glass-bg)',
  border: '1px solid rgba(148, 163, 184, 0.12)',
  borderRadius: '18px',
  backdropFilter: 'blur(16px)',
  padding: '24px'
};

export default function AllocationsTab({ onRefreshMetrics }) {
  const { t } = useTranslation();
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
              {t('tenant.allocationsEngine')}
            </h3>
            <p style={{ margin: '2px 0 0', color: 'var(--text-muted)', fontSize: '12.5px' }}>
              {t('tenant.allocationsDesc')}
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
              {t('tenant.activeAllocations')}
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
              {t('tenant.allocationHistory')}
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
              <Plus size={16} /> {t('tenant.allocateSpace')}
            </button>
          )}
        </div>
      </div>

      {/* Main Content View */}
      {activeSubTab === 'allocations' ? (
        <div style={{ ...glassCard, padding: '0', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px' }}>{t('tenant.loadingAllocations')}</div>
          ) : allocations.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px' }}>{t('tenant.noAllocationsFound')}</div>
          ) : (
            <table className="custom-table">
              <thead>
                <tr>
                  <th>{t('tenant.allocationId')}</th>
                  <th>{t('tenant.tenantCompany')}</th>
                  <th>{t('tenant.spaceDetails')}</th>
                  <th>{t('tenant.buildingAndFloor')}</th>
                  <th>{t('tenant.occupiedArea')}</th>
                  <th>{t('tenant.allocatedDate')}</th>
                  <th>{t('tenant.status')}</th>
                  {isParkAdmin && <th>{t('common.actions')}</th>}
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
      <ModalCard
        isOpen={isAllocateModalOpen}
        onClose={() => setIsAllocateModalOpen(false)}
        title="Allocate Real Estate Space"
        subtitle="Assign office units, floors, or entire building capacity to tenant companies"
        category="Premises Allocation"
        icon={Building2}
        accentStrip="amber"
        maxWidth="620px"
        onSubmit={handleAllocateSubmit}
        submitText={`${t('tenant.allocateSpace')} ${previewStats.count > 0 ? `(${previewStats.count} Units)` : ''}`}
        cancelText={t('common.cancel')}
        error={errorMsg || (Object.keys(fieldErrors).length > 0 ? Object.values(fieldErrors)[0] : '')}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Scope Switcher */}
          <div>
            <label style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
              Allocation Scope
            </label>
            <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-tertiary)', padding: '4px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--glass-border)' }}>
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
                  flex: 1, padding: '9px 6px', borderRadius: '8px', border: 'none',
                  background: scope === 'OFFICE' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'transparent',
                  color: scope === 'OFFICE' ? '#fff' : 'var(--text-muted)', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
                  boxShadow: scope === 'OFFICE' ? '0 2px 8px rgba(245, 158, 11, 0.35)' : 'none'
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
                  flex: 1, padding: '9px 6px', borderRadius: '8px', border: 'none',
                  background: scope === 'FLOOR' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'transparent',
                  color: scope === 'FLOOR' ? '#fff' : 'var(--text-muted)', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
                  boxShadow: scope === 'FLOOR' ? '0 2px 8px rgba(245, 158, 11, 0.35)' : 'none'
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
                  flex: 1, padding: '9px 6px', borderRadius: '8px', border: 'none',
                  background: scope === 'BUILDING' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'transparent',
                  color: scope === 'BUILDING' ? '#fff' : 'var(--text-muted)', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
                  boxShadow: scope === 'BUILDING' ? '0 2px 8px rgba(245, 158, 11, 0.35)' : 'none'
                }}
              >
                🏙️ Entire Building
              </button>
            </div>
          </div>

          {/* Tenant Selection */}
          <FormField label="Target Tenant Company *" error={fieldErrors.TenantID} icon={Building2}>
            <select
              value={formData.TenantID}
              onChange={(e) => handleTenantSelect(e.target.value)}
              onBlur={() => handleBlur('TenantID')}
              style={{
                width: '100%', background: 'var(--bg-tertiary)',
                border: `1px solid ${fieldErrors.TenantID ? 'var(--color-error, #ef4444)' : 'var(--glass-border)'}`,
                borderRadius: 'var(--border-radius-sm)', padding: '10px 14px', color: 'var(--text-primary)', fontSize: '0.88rem'
              }}
            >
              <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>-- Choose Tenant Company --</option>
              {(Array.isArray(tenants) ? tenants : []).map(t => (
                <option key={t.TenantID} value={t.TenantID} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                  {t.CompanyName} ({t.TenantCode})
                </option>
              ))}
            </select>
          </FormField>

          {/* Dynamic Scope Inputs */}
          {scope === 'OFFICE' && (
            <FormField label="Select Vacant Office Unit *" error={fieldErrors.OfficeSpaceID} icon={Building}>
              <select
                value={formData.OfficeSpaceID}
                onChange={(e) => handleFieldChange('OfficeSpaceID', e.target.value)}
                onBlur={() => handleBlur('OfficeSpaceID')}
                style={{
                  width: '100%', background: 'var(--bg-tertiary)',
                  border: `1px solid ${fieldErrors.OfficeSpaceID ? 'var(--color-error, #ef4444)' : 'var(--glass-border)'}`,
                  borderRadius: 'var(--border-radius-sm)', padding: '10px 14px', color: 'var(--text-primary)', fontSize: '0.88rem'
                }}
              >
                <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>-- Choose Vacant Office Unit --</option>
                {offices.filter(o => o.AvailabilityStatus === 'VACANT').map(o => (
                  <option key={o.OfficeSpaceID} value={o.OfficeSpaceID} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                    {o.OfficeName} ({o.OfficeNumber}) &bull; {o.SquareMeters} m² &bull; {o.BuildingName || 'Building'} - {o.FloorName || 'Floor'}
                  </option>
                ))}
              </select>
            </FormField>
          )}

          {scope === 'FLOOR' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              <FormField label="Building Block *" error={fieldErrors.BuildingID} icon={Building2}>
                <select
                  value={selectedBuildingID}
                  onChange={(e) => handleBuildingSelect(e.target.value)}
                  onBlur={() => handleBlur('BuildingID')}
                  style={{
                    width: '100%', background: 'var(--bg-tertiary)',
                    border: `1px solid ${fieldErrors.BuildingID ? 'var(--color-error, #ef4444)' : 'var(--glass-border)'}`,
                    borderRadius: 'var(--border-radius-sm)', padding: '10px 14px', color: 'var(--text-primary)', fontSize: '0.88rem'
                  }}
                >
                  <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>-- Select Building Block --</option>
                  {buildings.map(b => (
                    <option key={b.BuildingID} value={b.BuildingID} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                      {b.BuildingName} ({b.BuildingCode || b.BuildingID})
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Floor Level *" error={fieldErrors.FloorID} icon={Layers}>
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
                    border: `1px solid ${fieldErrors.FloorID ? 'var(--color-error, #ef4444)' : 'var(--glass-border)'}`,
                    borderRadius: 'var(--border-radius-sm)', padding: '10px 14px', color: 'var(--text-primary)', fontSize: '0.88rem'
                  }}
                >
                  <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>-- Select Floor Level --</option>
                  {floors.map(f => (
                    <option key={f.FloorID} value={f.FloorID} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                      {f.FloorName} (Level {f.FloorNumber})
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
          )}

          {scope === 'BUILDING' && (
            <FormField label="Entire Building Block *" error={fieldErrors.BuildingID} icon={Building2}>
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
                  border: `1px solid ${fieldErrors.BuildingID ? 'var(--color-error, #ef4444)' : 'var(--glass-border)'}`,
                  borderRadius: 'var(--border-radius-sm)', padding: '10px 14px', color: 'var(--text-primary)', fontSize: '0.88rem'
                }}
              >
                <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>-- Select Building Block --</option>
                {buildings.map(b => (
                  <option key={b.BuildingID} value={b.BuildingID} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                    {b.BuildingName} ({b.BuildingCode || b.BuildingID})
                  </option>
                ))}
              </select>
            </FormField>
          )}

          {/* Scope Summary Preview Box */}
          <div style={{
            background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: 'var(--border-radius-sm)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div>
              <span style={{ color: '#f59e0b', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Capacity Summary</span>
              <div style={{ color: 'var(--text-primary)', fontSize: '0.92rem', fontWeight: 800, marginTop: '2px' }}>
                {previewStats.count} Vacant Units
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Aggregated Area</span>
              <div style={{ color: '#10b981', fontSize: '0.95rem', fontWeight: 800 }}>
                {previewStats.area} m² Total
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            <FormField label="Link Active Lease (Optional)" icon={FileText}>
              <select
                value={formData.LeaseAgreementID}
                onChange={(e) => handleFieldChange('LeaseAgreementID', e.target.value)}
                style={{
                  width: '100%', background: 'var(--bg-tertiary)',
                  border: '1px solid var(--glass-border)', borderRadius: 'var(--border-radius-sm)',
                  padding: '10px 14px', color: 'var(--text-primary)', fontSize: '0.88rem'
                }}
              >
                <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>-- No Lease Link --</option>
                {leases.map(l => (
                  <option key={l.LeaseAgreementID} value={l.LeaseAgreementID} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                    Contract #{l.AgreementNumber} (ETB {Number(l.MonthlyRentAmount).toLocaleString()}/mo)
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Allocation Date *" error={fieldErrors.AllocatedDate} icon={Clock}>
              <input
                type="date"
                value={formData.AllocatedDate}
                onChange={(e) => handleFieldChange('AllocatedDate', e.target.value)}
                onBlur={() => handleBlur('AllocatedDate')}
                style={{
                  width: '100%', background: 'var(--bg-tertiary)',
                  border: `1px solid ${fieldErrors.AllocatedDate ? 'var(--color-error, #ef4444)' : 'var(--glass-border)'}`,
                  borderRadius: 'var(--border-radius-sm)', padding: '10px 14px', color: 'var(--text-primary)', fontSize: '0.88rem'
                }}
              />
            </FormField>
          </div>
        </div>
      </ModalCard>

      {/* Release Modal */}
      <ModalCard
        isOpen={Boolean(releaseModalAlloc)}
        onClose={() => setReleaseModalAlloc(null)}
        title="Release Space Allocation"
        subtitle={releaseModalAlloc ? `Release ${releaseModalAlloc.OfficeName} from ${releaseModalAlloc.TenantCompanyName}` : ''}
        category="Premises De-allocation"
        icon={RotateCcw}
        accentStrip="rose"
        maxWidth="480px"
        onSubmit={handleReleaseSubmit}
        submitText={t('common.confirm', 'Confirm Release')}
        cancelText={t('common.cancel', 'Cancel')}
        submitDisabled={!releaseRemarks.trim()}
        error={releaseErrors.Remarks || ''}
      >
        {releaseModalAlloc && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--border-radius-sm)',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.85rem'
              }}
            >
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Target Office Unit</span>
                <strong style={{ color: 'var(--text-primary)', fontSize: '0.92rem' }}>{releaseModalAlloc.OfficeName}</strong>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Tenant</span>
                <strong style={{ color: 'var(--text-primary)', fontSize: '0.92rem' }}>{releaseModalAlloc.TenantCompanyName}</strong>
              </div>
            </div>

            <FormField label="Release Reason / Remarks *" error={releaseErrors.Remarks} icon={FileText}>
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
                  border: `1px solid ${releaseErrors.Remarks ? 'var(--color-error, #ef4444)' : 'var(--glass-border)'}`,
                  borderRadius: 'var(--border-radius-sm)', padding: '10px 14px', color: 'var(--text-primary)',
                  fontSize: '0.88rem', resize: 'vertical'
                }}
              />
            </FormField>
          </div>
        )}
      </ModalCard>

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
