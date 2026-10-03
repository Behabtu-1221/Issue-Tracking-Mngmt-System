import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Building2,
  Clock,
  CheckCircle2,
  Plus,
  Trash2,
  Sliders,
  Users
} from 'lucide-react';
import serviceCatalogApi from '../api/serviceCatalogApi';
import orgApi from '../../organization/api/orgApi';
import ConfirmDialogModal from '../../../components/common/ConfirmDialogModal';
import AlertDialogModal from '../../../components/common/AlertDialogModal';
import { serviceSchemas } from '../../../validation';
import { FormField } from '../../../components/common/FormField';

export default function ServiceGovernanceTab({ services = [] }) {
  const [internalServices, setInternalServices] = useState([]);
  const effectiveServices = services.length > 0 ? services : internalServices;
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [departments, setDepartments] = useState([]);
  const [serviceDepts, setServiceDepts] = useState([]);
  const [slaPolicy, setSlaPolicy] = useState(null);
  const [approvalRules, setApprovalRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Custom Glass Modal States
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'error' });

  const showAlert = (title, message, type = 'error') => {
    setAlertConfig({ isOpen: true, title, message, type });
  };

  // Department Modal
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [deptErrors, setDeptErrors] = useState({});

  // Approval Rule Modal
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [ruleFormData, setRuleFormData] = useState({
    ApprovalRuleName: '',
    RequiredStagesCount: 1,
    AutoApproveLimit: 0
  });
  const [ruleErrors, setRuleErrors] = useState({});

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (services.length === 0) {
      serviceCatalogApi.getServices({ limit: 100 })
        .then(res => {
          setInternalServices(res.data?.data?.services || res.data?.data || []);
        })
        .catch(err => console.error('Failed to fetch services fallback in ServiceGovernanceTab:', err));
    }
  }, [services]);

  useEffect(() => {
    if (effectiveServices.length > 0 && !selectedServiceId) {
      setSelectedServiceId(effectiveServices[0].ServiceID);
    }
    fetchDepartmentsList();
  }, [effectiveServices]);

  useEffect(() => {
    if (selectedServiceId) {
      fetchGovernance(selectedServiceId);
    }
  }, [selectedServiceId]);

  const fetchDepartmentsList = async () => {
    try {
      const res = await orgApi.getDepartments();
      setDepartments(res.data?.data?.departments || []);
    } catch (err) {
      console.error('Failed to load departments dropdown', err);
    }
  };

  const fetchGovernance = async (serviceId) => {
    try {
      setLoading(true);
      setError(null);
      const [deptRes, slaRes, ruleRes] = await Promise.all([
        serviceCatalogApi.getDepartmentsByServiceId(serviceId),
        serviceCatalogApi.getSLAByServiceId(serviceId),
        serviceCatalogApi.getApprovalRulesByServiceId(serviceId)
      ]);
      setServiceDepts(deptRes.data?.data || []);
      setSlaPolicy(slaRes.data?.data || null);
      setApprovalRules(ruleRes.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch service governance');
    } finally {
      setLoading(false);
    }
  };

  const handleDeptChange = (val) => {
    setSelectedDeptId(val);
    if (deptErrors.DepartmentID) {
      setDeptErrors((prev) => ({ ...prev, DepartmentID: undefined }));
    }
  };

  const handleRuleChange = (field, val) => {
    setRuleFormData((prev) => ({ ...prev, [field]: val }));
    if (ruleErrors[field]) {
      setRuleErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleAssignDepartment = async (e) => {
    e.preventDefault();
    if (!selectedServiceId) return;

    // Validate using serviceDepartmentAssignForm schema
    const validation = serviceSchemas.serviceDepartmentAssignForm(
      { DepartmentID: selectedDeptId },
      serviceDepts
    );

    if (!validation.isValid) {
      setDeptErrors(validation.errors);
      return;
    }

    try {
      setSubmitting(true);
      setDeptErrors({});
      setError(null);

      await serviceCatalogApi.createServiceDepartment({
        ServiceID: Number(selectedServiceId),
        DepartmentID: validation.sanitized.DepartmentID,
        IsPrimary: serviceDepts.length === 0 ? 1 : 0
      });

      setSuccess('Department assigned to service successfully.');
      setDeptModalOpen(false);
      fetchGovernance(selectedServiceId);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign department');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveDepartment = (id) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Unassign Department',
      message: 'Are you sure you want to remove this department assignment?',
      type: 'danger',
      confirmText: 'Unassign Department',
      onConfirm: async () => {
        try {
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          await serviceCatalogApi.deleteServiceDepartment(id);
          setSuccess('Department unassigned successfully.');
          fetchGovernance(selectedServiceId);
          setTimeout(() => setSuccess(null), 4000);
        } catch (err) {
          const msg = err.response?.data?.message || 'Failed to unassign department';
          setError(msg);
          showAlert('Action Failed', msg, 'error');
        }
      }
    });
  };

  const handleAddApprovalRule = async (e) => {
    e.preventDefault();
    if (!selectedServiceId) return;

    // Validate using serviceApprovalRuleForm schema
    const validation = serviceSchemas.serviceApprovalRuleForm(ruleFormData);
    if (!validation.isValid) {
      setRuleErrors(validation.errors);
      return;
    }

    try {
      setSubmitting(true);
      setRuleErrors({});
      setError(null);

      await serviceCatalogApi.createApprovalRule({
        ServiceID: Number(selectedServiceId),
        ...validation.sanitized
      });

      setSuccess(`Approval rule '${validation.sanitized.ApprovalRuleName}' created successfully.`);
      setRuleModalOpen(false);
      fetchGovernance(selectedServiceId);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add approval rule');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteApprovalRule = (id) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Approval Rule',
      message: 'Are you sure you want to delete this approval rule?',
      type: 'danger',
      confirmText: 'Delete Rule',
      onConfirm: async () => {
        try {
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          await serviceCatalogApi.deleteApprovalRule(id);
          setSuccess('Approval rule deleted.');
          fetchGovernance(selectedServiceId);
          setTimeout(() => setSuccess(null), 4000);
        } catch (err) {
          const msg = err.response?.data?.message || 'Failed to delete approval rule';
          setError(msg);
          showAlert('Action Failed', msg, 'error');
        }
      }
    });
  };

  const selectedServiceObj = effectiveServices.find((s) => Number(s.ServiceID) === Number(selectedServiceId));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Selector */}
      <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--border-radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>Service Governance, Department Routing & Approval Rules</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Configure primary department fulfillment routing, approval workflows, and SLA response targets.
          </p>
        </div>

        <div style={{ minWidth: '280px' }}>
          <select
            value={selectedServiceId}
            onChange={(e) => setSelectedServiceId(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--glass-border-accent)',
              borderRadius: 'var(--border-radius-sm)',
              color: 'var(--text-primary)',
              fontWeight: '600'
            }}
          >
            <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Select Service Offering</option>
            {effectiveServices.map((s) => (
              <option key={s.ServiceID} value={s.ServiceID} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                {s.ServiceName} ({s.ServiceCode})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div style={{ padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', fontSize: '0.9rem' }}>
          {success}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading governance rules...</div>
      ) : !selectedServiceObj ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Please select a service offering to manage governance policies.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Department Routing */}
          <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--border-radius-md)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={20} style={{ color: 'var(--accent-primary)' }} />
                <h4 style={{ fontSize: '1rem', fontWeight: '700', margin: 0 }}>Department Fulfillment Routing</h4>
              </div>
              <button
                onClick={() => setDeptModalOpen(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'var(--accent-gradient)', border: 'none', borderRadius: 'var(--border-radius-sm)', color: '#fff', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}
              >
                <Plus size={14} /> Assign Dept
              </button>
            </div>

            {serviceDepts.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No departments currently assigned to handle requests for this service.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {serviceDepts.map((d) => (
                  <div key={d.ServiceDepartmentID} style={{ padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.9rem' }}>{d.DepartmentName}</div>
                      <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--accent-secondary)' }}>{d.DepartmentCode}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {d.IsPrimary ? (
                        <span style={{ padding: '2px 8px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontSize: '0.75rem', fontWeight: '600' }}>
                          Primary
                        </span>
                      ) : null}
                      <button onClick={() => handleRemoveDepartment(d.ServiceDepartmentID)} style={{ padding: '6px', border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Approval Rules & SLA Policy */}
          <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--border-radius-md)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* SLA Info Card */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Clock size={20} style={{ color: '#10b981' }} />
                <h4 style={{ fontSize: '1rem', fontWeight: '700', margin: 0 }}>Service Level Agreement (SLA) Target</h4>
              </div>

              <div style={{ padding: '14px', borderRadius: 'var(--border-radius-sm)', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--glass-border)', fontSize: '0.85rem' }}>
                {slaPolicy ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>{slaPolicy.PolicyName}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Response Target: {slaPolicy.TargetResponseTimeMinutes || 60} mins | Resolution Target: {slaPolicy.TargetResolutionTimeMinutes || 240} mins
                      </div>
                    </div>
                    <span style={{ color: '#10b981', fontWeight: '600', fontSize: '0.75rem', padding: '4px 8px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)' }}>Linked</span>
                  </div>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>Standard default SLA (Response: 4 hrs, Resolution: 24 hrs)</span>
                )}
              </div>
            </div>

            {/* Approval Stage Rules */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={20} style={{ color: 'var(--accent-secondary)' }} />
                  <h4 style={{ fontSize: '1rem', fontWeight: '700', margin: 0 }}>Approval Workflow Rules</h4>
                </div>
                <button
                  onClick={() => {
                    setRuleFormData({ ApprovalRuleName: '', RequiredStagesCount: 1, AutoApproveLimit: 0 });
                    setRuleErrors({});
                    setRuleModalOpen(true);
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: 'var(--accent-gradient-cyan)', border: 'none', borderRadius: 'var(--border-radius-sm)', color: '#fff', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' }}
                >
                  <Plus size={12} /> Add Rule
                </button>
              </div>

              {approvalRules.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No multi-stage approval rules required. Requests auto-route directly.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {approvalRules.map((r) => (
                    <div key={r.ServiceApprovalRuleID} style={{ padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.9rem' }}>{r.ApprovalRuleName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Stages Required: <strong>{r.RequiredStagesCount}</strong> | Auto Approve Limit: <strong>{r.AutoApproveLimit ? `${r.AutoApproveLimit} ETB` : 'None'}</strong>
                        </div>
                      </div>

                      <button onClick={() => handleDeleteApprovalRule(r.ServiceApprovalRuleID)} style={{ padding: '6px', border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Assign Department Modal */}
      {deptModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '24px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--glass-border-accent)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '16px' }}>Assign Fulfillment Department</h3>
            <form onSubmit={handleAssignDepartment} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <FormField
                label="Fulfillment Department"
                id="DepartmentID"
                required
                icon={Building2}
                error={deptErrors.DepartmentID}
                helpText="Assigned department will receive and dispatch requests for this service."
              >
                <select
                  id="DepartmentID"
                  value={selectedDeptId}
                  onChange={(e) => handleDeptChange(e.target.value)}
                  style={{
                    width: '100%', padding: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: deptErrors.DepartmentID ? '1px solid var(--color-danger, #ef4444)' : '1px solid var(--glass-border)',
                    borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)'
                  }}
                >
                  <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.DepartmentID} value={dept.DepartmentID} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                      {dept.DepartmentName} ({dept.DepartmentCode})
                    </option>
                  ))}
                </select>
              </FormField>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setDeptModalOpen(false)} style={{ padding: '8px 16px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-secondary)' }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ padding: '8px 16px', borderRadius: 'var(--border-radius-sm)', border: 'none', background: 'var(--accent-gradient)', color: '#fff', fontWeight: '600' }}>Assign Department</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Approval Rule Modal */}
      {ruleModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '24px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--glass-border-accent)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '16px' }}>Add Approval Rule</h3>
            <form onSubmit={handleAddApprovalRule} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <FormField
                label="Rule Name"
                id="ApprovalRuleName"
                required
                error={ruleErrors.ApprovalRuleName}
              >
                <input
                  id="ApprovalRuleName"
                  type="text"
                  placeholder="e.g., Manager Approval required for > 500 ETB"
                  value={ruleFormData.ApprovalRuleName}
                  onChange={(e) => handleRuleChange('ApprovalRuleName', e.target.value)}
                  style={{
                    width: '100%', padding: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: ruleErrors.ApprovalRuleName ? '1px solid var(--color-danger, #ef4444)' : '1px solid var(--glass-border)',
                    borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)'
                  }}
                />
              </FormField>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <FormField
                  label="Required Stages"
                  id="RequiredStagesCount"
                  required
                  error={ruleErrors.RequiredStagesCount}
                >
                  <input
                    id="RequiredStagesCount"
                    type="number"
                    min="1"
                    max="10"
                    value={ruleFormData.RequiredStagesCount}
                    onChange={(e) => handleRuleChange('RequiredStagesCount', e.target.value)}
                    style={{
                      width: '100%', padding: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: ruleErrors.RequiredStagesCount ? '1px solid var(--color-danger, #ef4444)' : '1px solid var(--glass-border)',
                      borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)'
                    }}
                  />
                </FormField>

                <FormField
                  label="Auto Approve Limit (ETB)"
                  id="AutoApproveLimit"
                  error={ruleErrors.AutoApproveLimit}
                  helpText="Optional: Limit for zero approval"
                >
                  <input
                    id="AutoApproveLimit"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={ruleFormData.AutoApproveLimit}
                    onChange={(e) => handleRuleChange('AutoApproveLimit', e.target.value)}
                    style={{
                      width: '100%', padding: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: ruleErrors.AutoApproveLimit ? '1px solid var(--color-danger, #ef4444)' : '1px solid var(--glass-border)',
                      borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)'
                    }}
                  />
                </FormField>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setRuleModalOpen(false)} style={{ padding: '8px 16px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-secondary)' }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ padding: '8px 16px', borderRadius: 'var(--border-radius-sm)', border: 'none', background: 'var(--accent-gradient-cyan)', color: '#fff', fontWeight: '600' }}>Save Rule</button>
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
