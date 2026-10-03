import React, { useState, useEffect } from 'react';
import approvalApi from '../api/approvalApi';
import { UserCheck, Plus, Calendar, Clock, Trash2, ShieldCheck, Search, Sparkles, User, CheckCircle2, X, FileText } from 'lucide-react';
import { FormField } from '../../../components/common/FormField';
import { approvalSchemas } from '../../../validation';

export default function ApprovalDelegationsTab() {
  const [delegations, setDelegations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const [form, setForm] = useState({
    DelegatorUserID: 1,
    DelegateeUserID: 2,
    StartDateTime: new Date().toISOString().slice(0, 16),
    EndDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    Reason: ''
  });

  useEffect(() => {
    fetchDelegations();
  }, [search]);

  const clearFieldError = (fieldName) => {
    if (fieldErrors[fieldName]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    }
  };

  const handleOpenModal = () => {
    setFieldErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setFieldErrors({});
    setShowModal(false);
  };

  const fetchDelegations = async () => {
    try {
      setLoading(true);
      const res = await approvalApi.getDelegations({ search });
      setDelegations(res.data.data.delegations || []);
    } catch (err) {
      console.error('Failed to fetch delegations', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const validation = approvalSchemas.delegationForm(form);
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      return;
    }

    setFieldErrors({});
    try {
      await approvalApi.createDelegation(validation.sanitized);
      setShowModal(false);
      setForm({
        DelegatorUserID: 1,
        DelegateeUserID: 2,
        StartDateTime: new Date().toISOString().slice(0, 16),
        EndDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        Reason: ''
      });
      fetchDelegations();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create delegation');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to revoke this approval delegation?')) return;
    try {
      await approvalApi.deleteDelegation(id);
      fetchDelegations();
    } catch (err) {
      alert('Failed to revoke delegation');
    }
  };

  return (
    <div style={{
      background: 'var(--glass-bg)',
      border: '1px solid var(--glass-border)',
      borderRadius: '20px',
      padding: '24px',
      backdropFilter: 'blur(16px)',
      boxShadow: 'var(--shadow-lg)'
    }}>
      {/* Header Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '900', margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserCheck color="var(--accent-primary)" size={22} /> Approval Delegation Management
          </h3>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Authorize temporary delegatees to action approvals on your behalf during manager absence
          </div>
        </div>

        <button
          onClick={handleOpenModal}
          className="btn btn-primary"
          style={{ padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', borderRadius: '12px' }}
        >
          <Plus size={18} /> New Delegation Window
        </button>
      </div>

      {/* Delegations Grid Cards */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading delegations...</div>
      ) : delegations.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <UserCheck size={42} style={{ opacity: 0.4, marginBottom: '12px', color: 'var(--accent-primary)' }} />
          <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)' }}>No Approval Delegations Configured</div>
          <div style={{ fontSize: '0.82rem' }}>Authorize a team member or delegatee to handle approval queues during leave.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
          {delegations.map((d) => {
            const now = new Date();
            const start = new Date(d.StartDateTime);
            const end = new Date(d.EndDateTime);
            const isActive = d.IsActive === 1 && now >= start && now <= end;

            return (
              <div
                key={d.ApprovalDelegationID}
                style={{
                  background: 'var(--bg-tertiary)',
                  border: isActive ? '1.5px solid #10b981' : '1px solid var(--glass-border)',
                  borderRadius: '16px',
                  padding: '20px',
                  position: 'relative',
                  boxShadow: isActive ? '0 0 20px rgba(16, 185, 129, 0.15)' : 'none',
                  transition: 'all 0.3s'
                }}
              >
                {/* Header Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  {isActive ? (
                    <span style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#10b981', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} /> Active Now
                    </span>
                  ) : now < start ? (
                    <span className="badge badge-info">Scheduled</span>
                  ) : (
                    <span className="badge badge-secondary">Expired</span>
                  )}

                  <button
                    onClick={() => handleDelete(d.ApprovalDelegationID)}
                    style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', cursor: 'pointer', padding: '6px 10px', borderRadius: '8px', fontSize: '0.78rem' }}
                    title="Revoke Delegation"
                  >
                    Revoke
                  </button>
                </div>

                {/* Delegator -> Delegatee Flow */}
                <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '12px', marginBottom: '14px', border: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700' }}>DELEGATOR</div>
                      <div style={{ fontWeight: '800', fontSize: '0.9rem', color: 'var(--text-primary)' }}>{d.DelegatorName || `User #${d.DelegatorUserID}`}</div>
                    </div>
                    <div style={{ fontSize: '1.2rem', color: 'var(--accent-primary)', fontWeight: '900' }}>➔</div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700' }}>DELEGATEE</div>
                      <div style={{ fontWeight: '800', fontSize: '0.9rem', color: 'var(--accent-primary)' }}>{d.DelegateeName || `User #${d.DelegateeUserID}`}</div>
                    </div>
                  </div>
                </div>

                {/* Period & Reason */}
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={14} color="var(--accent-primary)" /> {start.toLocaleDateString()} - {end.toLocaleDateString()}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  "{d.Reason || 'Standard approval delegation'}"
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delegation Setup Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--modal-backdrop, rgba(16, 20, 24, 0.78))', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--glass-border-accent)',
            borderRadius: '24px', width: '100%', maxWidth: '540px', maxHeight: '90vh',
            display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid var(--glass-border)', background: 'var(--bg-tertiary)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(138, 75, 255, 0.15)', color: 'var(--accent-primary)' }}>
                  <UserCheck size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)' }}>Authorize Approval Delegation</h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>Grant temporary approval signing authority during executive leave</p>
                </div>
              </div>
              <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}><X size={18} /></button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleCreate} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <FormField label="Delegator User ID" required error={fieldErrors.DelegatorUserID} icon={User}>
                  <input
                    type="number"
                    value={form.DelegatorUserID}
                    onChange={(e) => {
                      setForm({ ...form, DelegatorUserID: e.target.value });
                      clearFieldError('DelegatorUserID');
                    }}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      background: 'var(--bg-tertiary)',
                      border: fieldErrors.DelegatorUserID ? '1.5px solid var(--color-danger, #ef4444)' : '1px solid var(--glass-border)',
                      borderRadius: 'var(--border-radius-sm)',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </FormField>

                <FormField label="Delegatee User ID" required error={fieldErrors.DelegateeUserID} icon={UserCheck}>
                  <input
                    type="number"
                    value={form.DelegateeUserID}
                    onChange={(e) => {
                      setForm({ ...form, DelegateeUserID: e.target.value });
                      clearFieldError('DelegateeUserID');
                    }}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      background: 'var(--bg-tertiary)',
                      border: fieldErrors.DelegateeUserID ? '1.5px solid var(--color-danger, #ef4444)' : '1px solid var(--glass-border)',
                      borderRadius: 'var(--border-radius-sm)',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </FormField>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <FormField label="Start Date & Time" required error={fieldErrors.StartDateTime} icon={Calendar}>
                  <input
                    type="datetime-local"
                    value={form.StartDateTime}
                    onChange={(e) => {
                      setForm({ ...form, StartDateTime: e.target.value });
                      clearFieldError('StartDateTime');
                    }}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      background: 'var(--bg-tertiary)',
                      border: fieldErrors.StartDateTime ? '1.5px solid var(--color-danger, #ef4444)' : '1px solid var(--glass-border)',
                      borderRadius: 'var(--border-radius-sm)',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </FormField>

                <FormField label="End Date & Time" required error={fieldErrors.EndDateTime} icon={Clock}>
                  <input
                    type="datetime-local"
                    value={form.EndDateTime}
                    onChange={(e) => {
                      setForm({ ...form, EndDateTime: e.target.value });
                      clearFieldError('EndDateTime');
                    }}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      background: 'var(--bg-tertiary)',
                      border: fieldErrors.EndDateTime ? '1.5px solid var(--color-danger, #ef4444)' : '1px solid var(--glass-border)',
                      borderRadius: 'var(--border-radius-sm)',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </FormField>
              </div>

              <FormField label="Delegation Reason & Scope" error={fieldErrors.Reason} icon={FileText} helpText="Provide business justification or operational scope (max 500 characters)">
                <textarea
                  rows={3}
                  value={form.Reason}
                  onChange={(e) => {
                    setForm({ ...form, Reason: e.target.value });
                    clearFieldError('Reason');
                  }}
                  placeholder="Provide justification or scope context..."
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    background: 'var(--bg-tertiary)',
                    border: fieldErrors.Reason ? '1.5px solid var(--color-danger, #ef4444)' : '1px solid var(--glass-border)',
                    borderRadius: 'var(--border-radius-sm)',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
              </FormField>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px', paddingTop: '16px', borderTop: '1px solid var(--glass-border)', flexShrink: 0 }}>
                <button type="button" onClick={handleCloseModal} style={{ padding: '10px 18px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 22px', borderRadius: 'var(--border-radius-sm)', border: 'none', background: 'var(--accent-gradient)', color: '#ffffff', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', boxShadow: 'var(--glow-accent)' }}>Authorize Delegation</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
