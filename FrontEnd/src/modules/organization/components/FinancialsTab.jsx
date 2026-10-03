import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Plus,
  Search,
  Building2,
  Edit2,
  Trash2,
  PieChart,
  TrendingUp,
  Wallet,
  Calendar,
  Target,
  Tag,
  FileText
} from 'lucide-react';
import orgApi from '../api/orgApi';
import tenantApi from '../../tenant/api/tenantApi';
import ConfirmDialogModal from '../../../components/common/ConfirmDialogModal';
import AlertDialogModal from '../../../components/common/AlertDialogModal';
import { FormField } from '../../../components/common/FormField';
import { orgSchemas } from '../../../validation';

export default function FinancialsTab({ onRefreshMetrics }) {
  const [subSection, setSubSection] = useState('cost-centers'); // 'cost-centers' | 'budgets'
  const [costCenters, setCostCenters] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  // Modals
  const [isCCModalOpen, setIsCCModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [editingCC, setEditingCC] = useState(null);
  const [editingBudget, setEditingBudget] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [ccErrors, setCcErrors] = useState({});
  const [budgetErrors, setBudgetErrors] = useState({});

  const clearCCError = (field) => {
    if (ccErrors[field]) {
      setCcErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const clearBudgetError = (field) => {
    if (budgetErrors[field]) {
      setBudgetErrors(prev => {
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
  const [ccForm, setCcForm] = useState({
    TenantID: '',
    CostCenterCode: '',
    CostCenterName: '',
    Description: '',
    IsActive: 1
  });

  const [budgetForm, setBudgetForm] = useState({
    DepartmentID: '',
    CostCenterID: '',
    FiscalYear: new Date().getFullYear(),
    AllocatedAmount: '',
    RemainingAmount: '',
    CurrencyCode: 'ETB',
    IsActive: 1
  });

  useEffect(() => {
    fetchDepartments();
    fetchTenants();
  }, []);

  useEffect(() => {
    if (subSection === 'cost-centers') fetchCostCenters();
    else fetchBudgets();
  }, [subSection, search, deptFilter]);

  const fetchDepartments = async () => {
    try {
      const res = await orgApi.getDepartments({ limit: 200 });
      setDepartments(res.data?.data?.departments || res.data?.data || []);
    } catch (err) { console.error('Failed to fetch departments', err); }
  };

  const fetchTenants = async () => {
    try {
      const res = await tenantApi.getTenants({ limit: 200 });
      setTenants(res.data?.data?.tenants || res.data?.data || []);
    } catch (err) { console.error('Failed to fetch tenants', err); }
  };

  const fetchCostCenters = async () => {
    try {
      setLoading(true);
      const res = await orgApi.getCostCenters({ search });
      setCostCenters(res.data?.data?.costCenters || res.data?.data || []);
    } catch (err) { console.error('Failed to fetch cost centers', err); }
    finally { setLoading(false); }
  };

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const res = await orgApi.getBudgets({ departmentId: deptFilter });
      setBudgets(res.data?.data?.budgets || res.data?.data || []);
    } catch (err) { console.error('Failed to fetch budgets', err); }
    finally { setLoading(false); }
  };

  // ── Cost Center Handlers ──
  const handleOpenCCCreate = () => {
    setEditingCC(null);
    setCcForm({
      TenantID: '',
      CostCenterCode: `CC-${Math.floor(100 + Math.random() * 900)}`,
      CostCenterName: '',
      Description: '',
      IsActive: 1
    });
    setErrorMsg('');
    setCcErrors({});
    setIsCCModalOpen(true);
  };

  const handleOpenCCEdit = (cc) => {
    setEditingCC(cc);
    setCcForm({
      TenantID: cc.TenantID || '',
      CostCenterCode: cc.CostCenterCode,
      CostCenterName: cc.CostCenterName,
      Description: cc.Description || '',
      IsActive: cc.IsActive !== undefined ? cc.IsActive : 1
    });
    setErrorMsg('');
    setCcErrors({});
    setIsCCModalOpen(true);
  };

  const handleCCSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const validation = orgSchemas.costCenterForm(ccForm);
    if (!validation.isValid) {
      setCcErrors(validation.errors);
      return;
    }
    setCcErrors({});

    try {
      if (editingCC) {
        await orgApi.updateCostCenter(editingCC.CostCenterID, validation.sanitized);
      } else {
        await orgApi.createCostCenter(validation.sanitized);
      }
      setIsCCModalOpen(false);
      fetchCostCenters();
      if (onRefreshMetrics) onRefreshMetrics();
      showAlert(
        editingCC ? 'Cost Center Updated' : 'Cost Center Created',
        'Cost center details saved successfully.',
        'success'
      );
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleCCDelete = (id, name) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Cost Center',
      message: `Are you sure you want to delete cost center "${name}"? Associated budgets may be affected.`,
      type: 'danger',
      confirmText: 'Delete Cost Center',
      onConfirm: async () => {
        try {
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          await orgApi.deleteCostCenter(id);
          fetchCostCenters();
          if (onRefreshMetrics) onRefreshMetrics();
        } catch (err) {
          showAlert('Action Restricted', err.response?.data?.message || 'Failed to delete cost center', 'error');
        }
      }
    });
  };

  // ── Budget Handlers ──
  const handleOpenBudgetCreate = () => {
    setEditingBudget(null);
    setBudgetForm({
      DepartmentID: departments[0]?.DepartmentID || '',
      CostCenterID: '',
      FiscalYear: new Date().getFullYear(),
      AllocatedAmount: '',
      RemainingAmount: '',
      CurrencyCode: 'ETB',
      IsActive: 1
    });
    setErrorMsg('');
    setBudgetErrors({});
    setIsBudgetModalOpen(true);
  };

  const handleOpenBudgetEdit = (b) => {
    setEditingBudget(b);
    setBudgetForm({
      DepartmentID: b.DepartmentID,
      CostCenterID: b.CostCenterID || '',
      FiscalYear: b.FiscalYear,
      AllocatedAmount: b.AllocatedAmount,
      RemainingAmount: b.RemainingAmount,
      CurrencyCode: b.CurrencyCode || 'ETB',
      IsActive: b.IsActive !== undefined ? b.IsActive : 1
    });
    setErrorMsg('');
    setBudgetErrors({});
    setIsBudgetModalOpen(true);
  };

  const handleBudgetSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const validation = orgSchemas.budgetForm(budgetForm, !!editingBudget);
    if (!validation.isValid) {
      setBudgetErrors(validation.errors);
      return;
    }
    setBudgetErrors({});

    try {
      if (editingBudget) {
        await orgApi.updateBudget(editingBudget.DepartmentBudgetID, validation.sanitized);
      } else {
        await orgApi.createBudget(validation.sanitized);
      }
      setIsBudgetModalOpen(false);
      fetchBudgets();
      if (onRefreshMetrics) onRefreshMetrics();
      showAlert(
        editingBudget ? 'Budget Updated' : 'Budget Allocated',
        'Department budget saved successfully.',
        'success'
      );
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleBudgetDelete = (id) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Budget Allocation',
      message: 'Are you sure you want to delete this budget allocation? This action cannot be undone.',
      type: 'danger',
      confirmText: 'Delete Budget',
      onConfirm: async () => {
        try {
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          await orgApi.deleteBudget(id);
          fetchBudgets();
          if (onRefreshMetrics) onRefreshMetrics();
        } catch (err) {
          showAlert('Action Restricted', err.response?.data?.message || 'Failed to delete budget', 'error');
        }
      }
    });
  };

  const calcBudgetUsage = (b) => {
    if (!b.AllocatedAmount || b.AllocatedAmount <= 0) return 0;
    const spent = b.AllocatedAmount - (b.RemainingAmount || 0);
    return Math.min(Math.round((spent / b.AllocatedAmount) * 100), 100);
  };

  const getUsageColor = (pct) => {
    if (pct < 50) return '#4ade80';
    if (pct < 80) return '#fbbf24';
    return '#f87171';
  };

  return (
    <div>
      {/* Sub-section Navigation & Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-secondary)', padding: '4px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--glass-border)' }}>
            <button
              onClick={() => { setSubSection('cost-centers'); setDeptFilter(''); }}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--border-radius-sm)',
                border: 'none',
                background: subSection === 'cost-centers' ? 'var(--accent-gradient)' : 'transparent',
                color: subSection === 'cost-centers' ? 'white' : 'var(--text-muted)',
                fontWeight: subSection === 'cost-centers' ? '600' : '500',
                cursor: 'pointer',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <PieChart size={14} /> Cost Centers
            </button>
            <button
              onClick={() => { setSubSection('budgets'); setSearch(''); }}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--border-radius-sm)',
                border: 'none',
                background: subSection === 'budgets' ? 'var(--accent-gradient)' : 'transparent',
                color: subSection === 'budgets' ? 'white' : 'var(--text-muted)',
                fontWeight: subSection === 'budgets' ? '600' : '500',
                cursor: 'pointer',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Wallet size={14} /> Department Budgets
            </button>
          </div>

          {subSection === 'cost-centers' ? (
            <div style={{ position: 'relative', width: '240px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search cost centers..."
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
          ) : (
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              style={{
                padding: '10px 14px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--border-radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                minWidth: '200px'
              }}
            >
              <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>All Departments</option>
              {departments.map((d) => (
                <option key={d.DepartmentID} value={d.DepartmentID} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                  {d.DepartmentName}
                </option>
              ))}
            </select>
          )}
        </div>

        <button
          onClick={subSection === 'cost-centers' ? handleOpenCCCreate : handleOpenBudgetCreate}
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
          <Plus size={16} /> {subSection === 'cost-centers' ? 'Add Cost Center' : 'Add Department Budget'}
        </button>
      </div>

      {/* Directory Table */}
      {subSection === 'cost-centers' ? (
        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading cost centers...</div>
          ) : costCenters.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No cost centers found. Create cost centers to organize financial tracking.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '16px 20px' }}>Cost Center & Code</th>
                  <th style={{ padding: '16px 20px' }}>Tenant Scope</th>
                  <th style={{ padding: '16px 20px' }}>Description</th>
                  <th style={{ padding: '16px 20px' }}>Linked Budgets</th>
                  <th style={{ padding: '16px 20px' }}>Status</th>
                  <th style={{ padding: '16px 20px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {costCenters.map((cc) => (
                  <tr key={cc.CostCenterID} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                          <PieChart size={16} color="#4ade80" />
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{cc.CostCenterName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cc.CostCenterCode}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>
                      {cc.TenantName ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Building2 size={14} color="#60a5fa" />
                          {cc.TenantName}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Global</span>
                      )}
                    </td>
                    <td style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontSize: '0.82rem', maxWidth: '220px' }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {cc.Description || '—'}
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ fontWeight: '600', color: '#60a5fa' }}>{cc.BudgetCount || 0}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}> budgets</span>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      {cc.IsActive ? <span className="badge badge-success">Active</span> : <span className="badge badge-danger">Inactive</span>}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleOpenCCEdit(cc)}
                          style={{ padding: '6px 10px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', borderRadius: '4px', color: 'var(--text-primary)', cursor: 'pointer' }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleCCDelete(cc.CostCenterID, cc.CostCenterName)}
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
      ) : (
        /* Department Budgets Grid */
        <div>
          {loading ? (
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading department budgets...</div>
          ) : budgets.length === 0 ? (
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No budgets found. Allocate department budgets for fiscal planning.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
              {budgets.map((b) => {
                const usage = calcBudgetUsage(b);
                const usageColor = getUsageColor(usage);
                const spent = b.AllocatedAmount - (b.RemainingAmount || 0);
                return (
                  <div key={b.DepartmentBudgetID} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '1rem' }}>{b.DepartmentName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                          <Calendar size={12} /> FY {b.FiscalYear}
                          {b.CostCenterName && (
                            <span style={{ marginLeft: '6px' }}>• {b.CostCenterName}</span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => handleOpenBudgetEdit(b)}
                          style={{ padding: '5px 8px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', borderRadius: '4px', color: 'var(--text-primary)', cursor: 'pointer' }}
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => handleBudgetDelete(b.DepartmentBudgetID)}
                          style={{ padding: '5px 8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '4px', color: '#f87171', cursor: 'pointer' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Budget Amounts */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Allocated</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#60a5fa' }}>
                          {b.CurrencyCode} {Number(b.AllocatedAmount || 0).toLocaleString()}
                        </div>
                      </div>
                      <div style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Remaining</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: '700', color: usageColor }}>
                          {b.CurrencyCode} {Number(b.RemainingAmount || 0).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Usage Progress Bar */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.78rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Budget Utilization</span>
                        <span style={{ color: usageColor, fontWeight: '600' }}>{usage}% used</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', borderRadius: '3px', background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
                        <div style={{
                          width: `${usage}%`,
                          height: '100%',
                          borderRadius: '3px',
                          background: usageColor,
                          transition: 'width 0.5s ease'
                        }}></div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        <span>Spent: {b.CurrencyCode} {Number(spent).toLocaleString()}</span>
                        <span>of {b.CurrencyCode} {Number(b.AllocatedAmount || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal: Create/Edit Cost Center */}
      {isCCModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '520px', padding: '28px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)' }}>
              <PieChart color="var(--accent-primary)" />
              {editingCC ? 'Edit Cost Center' : 'Create Cost Center'}
            </h2>

            {errorMsg && (
              <div style={{ padding: '10px 14px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '0.85rem', marginBottom: '16px' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCCSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <FormField
                label="Tenant Scope (Optional)"
                icon={Building2}
                error={ccErrors.TenantID}
                id="cc-tenant-id"
              >
                <select
                  id="cc-tenant-id"
                  value={ccForm.TenantID}
                  onChange={(e) => {
                    setCcForm({ ...ccForm, TenantID: e.target.value });
                    clearCCError('TenantID');
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'var(--bg-tertiary)',
                    border: ccErrors.TenantID ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                    borderRadius: '4px',
                    color: 'var(--text-primary)'
                  }}
                >
                  <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>-- Global / System Scope --</option>
                  {tenants.map((t) => (
                    <option key={t.TenantID} value={t.TenantID} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                      {t.CompanyName} ({t.TenantCode})
                    </option>
                  ))}
                </select>
              </FormField>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                <FormField
                  label="Code"
                  required
                  icon={Tag}
                  error={ccErrors.CostCenterCode}
                  id="cc-code"
                >
                  <input
                    id="cc-code"
                    type="text"
                    value={ccForm.CostCenterCode}
                    onChange={(e) => {
                      setCcForm({ ...ccForm, CostCenterCode: e.target.value });
                      clearCCError('CostCenterCode');
                    }}
                    placeholder="e.g., CC-IT-01"
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'var(--bg-tertiary)',
                      border: ccErrors.CostCenterCode ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                      borderRadius: '4px',
                      color: 'var(--text-primary)'
                    }}
                  />
                </FormField>

                <FormField
                  label="Cost Center Name"
                  required
                  icon={PieChart}
                  error={ccErrors.CostCenterName}
                  id="cc-name"
                >
                  <input
                    id="cc-name"
                    type="text"
                    value={ccForm.CostCenterName}
                    onChange={(e) => {
                      setCcForm({ ...ccForm, CostCenterName: e.target.value });
                      clearCCError('CostCenterName');
                    }}
                    placeholder="e.g., IT Operations"
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'var(--bg-tertiary)',
                      border: ccErrors.CostCenterName ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                      borderRadius: '4px',
                      color: 'var(--text-primary)'
                    }}
                  />
                </FormField>
              </div>

              <FormField
                label="Description (Optional)"
                icon={FileText}
                error={ccErrors.Description}
                id="cc-description"
              >
                <textarea
                  id="cc-description"
                  rows="3"
                  value={ccForm.Description}
                  onChange={(e) => {
                    setCcForm({ ...ccForm, Description: e.target.value });
                    clearCCError('Description');
                  }}
                  placeholder="Describe the purpose of this cost center..."
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'var(--bg-tertiary)',
                    border: ccErrors.Description ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                    borderRadius: '4px',
                    color: 'var(--text-primary)'
                  }}
                />
              </FormField>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsCCModalOpen(false)}
                  style={{ padding: '10px 18px', background: 'transparent', border: '1px solid var(--glass-border)', borderRadius: '4px', color: 'var(--text-primary)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 20px', background: 'var(--accent-gradient)', border: 'none', borderRadius: '4px', color: '#ffffff', fontWeight: '600', cursor: 'pointer' }}
                >
                  {editingCC ? 'Save Changes' : 'Create Cost Center'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create/Edit Department Budget */}
      {isBudgetModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '560px', padding: '28px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)' }}>
              <Wallet color="var(--accent-primary)" />
              {editingBudget ? 'Edit Department Budget' : 'Allocate Department Budget'}
            </h2>

            {errorMsg && (
              <div style={{ padding: '10px 14px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '0.85rem', marginBottom: '16px' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleBudgetSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <FormField
                label="Department"
                required
                icon={Building2}
                error={budgetErrors.DepartmentID}
                id="budget-department-id"
              >
                <select
                  id="budget-department-id"
                  value={budgetForm.DepartmentID}
                  onChange={(e) => {
                    setBudgetForm({ ...budgetForm, DepartmentID: e.target.value });
                    clearBudgetError('DepartmentID');
                  }}
                  disabled={!!editingBudget}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'var(--bg-tertiary)',
                    border: budgetErrors.DepartmentID ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                    borderRadius: '4px',
                    color: 'var(--text-primary)',
                    opacity: editingBudget ? 0.6 : 1
                  }}
                >
                  <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Select Department</option>
                  {departments.map((d) => (
                    <option key={d.DepartmentID} value={d.DepartmentID} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                      {d.DepartmentName} ({d.DepartmentCode})
                    </option>
                  ))}
                </select>
              </FormField>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <FormField
                  label="Fiscal Year"
                  required
                  icon={Calendar}
                  error={budgetErrors.FiscalYear}
                  id="budget-fiscal-year"
                >
                  <input
                    id="budget-fiscal-year"
                    type="number"
                    min="2000"
                    max="2100"
                    value={budgetForm.FiscalYear}
                    onChange={(e) => {
                      setBudgetForm({ ...budgetForm, FiscalYear: Number(e.target.value) });
                      clearBudgetError('FiscalYear');
                    }}
                    disabled={!!editingBudget}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'var(--bg-tertiary)',
                      border: budgetErrors.FiscalYear ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                      borderRadius: '4px',
                      color: 'var(--text-primary)',
                      opacity: editingBudget ? 0.6 : 1
                    }}
                  />
                </FormField>

                <FormField
                  label="Cost Center (Optional)"
                  icon={PieChart}
                  error={budgetErrors.CostCenterID}
                  id="budget-cost-center-id"
                >
                  <select
                    id="budget-cost-center-id"
                    value={budgetForm.CostCenterID}
                    onChange={(e) => {
                      setBudgetForm({ ...budgetForm, CostCenterID: e.target.value });
                      clearBudgetError('CostCenterID');
                    }}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'var(--bg-tertiary)',
                      border: budgetErrors.CostCenterID ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                      borderRadius: '4px',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>-- None --</option>
                    {costCenters.map((cc) => (
                      <option key={cc.CostCenterID} value={cc.CostCenterID} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                        {cc.CostCenterName} ({cc.CostCenterCode})
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 0.6fr', gap: '12px' }}>
                <FormField
                  label="Allocated Amount"
                  required
                  icon={DollarSign}
                  error={budgetErrors.AllocatedAmount}
                  id="budget-allocated-amount"
                >
                  <input
                    id="budget-allocated-amount"
                    type="number"
                    min="1"
                    step="0.01"
                    value={budgetForm.AllocatedAmount}
                    onChange={(e) => {
                      setBudgetForm({ ...budgetForm, AllocatedAmount: e.target.value });
                      clearBudgetError('AllocatedAmount');
                      if (budgetErrors.RemainingAmount) clearBudgetError('RemainingAmount');
                    }}
                    placeholder="e.g. 50000"
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'var(--bg-tertiary)',
                      border: budgetErrors.AllocatedAmount ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                      borderRadius: '4px',
                      color: 'var(--text-primary)'
                    }}
                  />
                </FormField>

                <FormField
                  label="Remaining Amount"
                  icon={Wallet}
                  error={budgetErrors.RemainingAmount}
                  id="budget-remaining-amount"
                >
                  <input
                    id="budget-remaining-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={budgetForm.RemainingAmount}
                    onChange={(e) => {
                      setBudgetForm({ ...budgetForm, RemainingAmount: e.target.value });
                      clearBudgetError('RemainingAmount');
                    }}
                    placeholder="Auto = Allocated"
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'var(--bg-tertiary)',
                      border: budgetErrors.RemainingAmount ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                      borderRadius: '4px',
                      color: 'var(--text-primary)'
                    }}
                  />
                </FormField>

                <FormField
                  label="Currency"
                  required
                  icon={TrendingUp}
                  error={budgetErrors.CurrencyCode}
                  id="budget-currency-code"
                >
                  <select
                    id="budget-currency-code"
                    value={budgetForm.CurrencyCode}
                    onChange={(e) => {
                      setBudgetForm({ ...budgetForm, CurrencyCode: e.target.value });
                      clearBudgetError('CurrencyCode');
                    }}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'var(--bg-tertiary)',
                      border: budgetErrors.CurrencyCode ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                      borderRadius: '4px',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <option value="ETB" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>ETB</option>
                    <option value="USD" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>USD</option>
                    <option value="EUR" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>EUR</option>
                    <option value="GBP" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>GBP</option>
                  </select>
                </FormField>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsBudgetModalOpen(false)}
                  style={{ padding: '10px 18px', background: 'transparent', border: '1px solid var(--glass-border)', borderRadius: '4px', color: 'var(--text-primary)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 20px', background: 'var(--accent-gradient)', border: 'none', borderRadius: '4px', color: '#ffffff', fontWeight: '600', cursor: 'pointer' }}
                >
                  {editingBudget ? 'Save Changes' : 'Allocate Budget'}
                </button>
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
