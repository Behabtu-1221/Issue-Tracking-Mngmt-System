import React, { useState, useEffect } from 'react';
import approvalApi from '../api/approvalApi';
import { ShieldCheck, Users, Plus, DollarSign, Layers, Trash2, CheckCircle2, Sliders, X, Tag, FileText, Sparkles, Globe } from 'lucide-react';
import { FormField } from '../../../components/common/FormField';
import { approvalSchemas } from '../../../validation';

export default function ApprovalRulesGroupsTab() {
  const [subSection, setSubSection] = useState('rules'); // 'rules' | 'groups'
  const [rules, setRules] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);

  const [ruleErrors, setRuleErrors] = useState({});
  const [groupErrors, setGroupErrors] = useState({});

  // Forms
  const [ruleForm, setRuleForm] = useState({
    RuleName: '',
    Description: '',
    MinCost: 0,
    MaxCost: 10000,
    CurrencyCode: 'USD'
  });

  const [groupForm, setGroupForm] = useState({
    GroupName: '',
    Description: ''
  });

  useEffect(() => {
    if (subSection === 'rules') fetchRules();
    else fetchGroups();
  }, [subSection]);

  const clearRuleError = (field) => {
    if (ruleErrors[field]) {
      setRuleErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const clearGroupError = (field) => {
    if (groupErrors[field]) {
      setGroupErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleOpenRuleModal = () => {
    setRuleErrors({});
    setShowRuleModal(true);
  };

  const handleCloseRuleModal = () => {
    setRuleErrors({});
    setShowRuleModal(false);
  };

  const handleOpenGroupModal = () => {
    setGroupErrors({});
    setShowGroupModal(true);
  };

  const handleCloseGroupModal = () => {
    setGroupErrors({});
    setShowGroupModal(false);
  };

  const fetchRules = async () => {
    try {
      setLoading(true);
      const res = await approvalApi.getRules({});
      setRules(res.data.data.rules || []);
    } catch (err) {
      console.error('Failed to fetch approval rules', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await approvalApi.getGroups({});
      setGroups(res.data.data.groups || []);
    } catch (err) {
      console.error('Failed to fetch approval groups', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async (e) => {
    e.preventDefault();
    const validation = approvalSchemas.approvalRuleForm(ruleForm);
    if (!validation.isValid) {
      setRuleErrors(validation.errors);
      return;
    }

    setRuleErrors({});
    try {
      await approvalApi.createRule(validation.sanitized);
      setShowRuleModal(false);
      setRuleForm({ RuleName: '', Description: '', MinCost: 0, MaxCost: 10000, CurrencyCode: 'USD' });
      fetchRules();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create rule');
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    const validation = approvalSchemas.approvalGroupForm(groupForm);
    if (!validation.isValid) {
      setGroupErrors(validation.errors);
      return;
    }

    setGroupErrors({});
    try {
      await approvalApi.createGroup(validation.sanitized);
      setShowGroupModal(false);
      setGroupForm({ GroupName: '', Description: '' });
      fetchGroups();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create group');
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
      {/* Sub-tab pills */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-tertiary)', padding: '5px', borderRadius: '14px', border: '1px solid var(--glass-border)' }}>
          <button
            onClick={() => setSubSection('rules')}
            style={{
              padding: '9px 18px', borderRadius: '10px', border: 'none',
              background: subSection === 'rules' ? 'var(--accent-gradient)' : 'transparent',
              color: subSection === 'rules' ? 'white' : 'var(--text-muted)',
              fontWeight: '800', cursor: 'pointer', fontSize: '0.85rem',
              transition: 'all 0.2s'
            }}
          >
            <ShieldCheck size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Governance Rules & Thresholds
          </button>
          <button
            onClick={() => setSubSection('groups')}
            style={{
              padding: '9px 18px', borderRadius: '10px', border: 'none',
              background: subSection === 'groups' ? 'var(--accent-gradient)' : 'transparent',
              color: subSection === 'groups' ? 'white' : 'var(--text-muted)',
              fontWeight: '800', cursor: 'pointer', fontSize: '0.85rem',
              transition: 'all 0.2s'
            }}
          >
            <Users size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Approver Groups
          </button>
        </div>

        {subSection === 'rules' ? (
          <button onClick={handleOpenRuleModal} className="btn btn-primary" style={{ padding: '10px 18px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}>
            <Plus size={18} /> New Governance Rule
          </button>
        ) : (
          <button onClick={handleOpenGroupModal} className="btn btn-primary" style={{ padding: '10px 18px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}>
            <Plus size={18} /> New Approver Group
          </button>
        )}
      </div>

      {/* Rules view */}
      {subSection === 'rules' && (
        loading ? <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading governance rules...</div> :
          rules.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <ShieldCheck size={42} style={{ opacity: 0.4, marginBottom: '12px', color: 'var(--accent-primary)' }} />
              <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)' }}>No Governance Rules Configured</div>
              <div style={{ fontSize: '0.82rem' }}>Define financial threshold policies to trigger automated multi-stage sign-offs.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '18px' }}>
              {rules.map((r) => (
                <div key={r.ApprovalRuleID} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '20px', position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--text-primary)' }}>{r.RuleName}</div>
                    <span className="badge badge-success">Active Policy</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.4' }}>{r.Description || 'No detailed description provided'}</div>

                  {/* Cost Threshold Badge */}
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', padding: '10px 14px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700' }}>COST THRESHOLD</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--accent-primary)' }}>
                      ${r.MinCost} - {r.MaxCost ? `$${r.MaxCost}` : 'Unlimited'} {r.CurrencyCode}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )
      )}

      {/* Groups view */}
      {subSection === 'groups' && (
        loading ? <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading approver groups...</div> :
          groups.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Users size={42} style={{ opacity: 0.4, marginBottom: '12px', color: 'var(--accent-primary)' }} />
              <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)' }}>No Approver Groups Configured</div>
              <div style={{ fontSize: '0.82rem' }}>Create approver groups (e.g. Executive IT, Finance VPs) for collective stage sign-offs.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '18px' }}>
              {groups.map((g) => (
                <div key={g.ApprovalGroupID} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--text-primary)' }}>{g.GroupName}</div>
                    <span className="badge badge-info">{g.MemberCount || 0} Members</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: '1.4' }}>{g.Description || 'No description provided'}</div>
                </div>
              ))}
            </div>
          )
      )}

      {/* Rule Modal */}
      {showRuleModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--modal-backdrop, rgba(16, 20, 24, 0.78))', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--glass-border-accent)',
            borderRadius: '24px', width: '100%', maxWidth: '520px', maxHeight: '90vh',
            display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid var(--glass-border)', background: 'var(--bg-tertiary)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(138, 75, 255, 0.15)', color: 'var(--accent-primary)' }}>
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-primary)' }}>Create Governance Rule</h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>Define monetary threshold triggers for multi-level sign-off</p>
                </div>
              </div>
              <button onClick={handleCloseRuleModal} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}><X size={18} /></button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleCreateRule} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', overflowY: 'auto', flex: 1 }}>
              <FormField label="Rule Name" required error={ruleErrors.RuleName} icon={Tag}>
                <input
                  type="text"
                  value={ruleForm.RuleName}
                  onChange={(e) => {
                    setRuleForm({ ...ruleForm, RuleName: e.target.value });
                    clearRuleError('RuleName');
                  }}
                  placeholder=""
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    background: 'var(--bg-tertiary)',
                    border: ruleErrors.RuleName ? '1.5px solid var(--color-danger, #ef4444)' : '1px solid var(--glass-border)',
                    borderRadius: 'var(--border-radius-sm)',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </FormField>

              <FormField label="Policy Description" error={ruleErrors.Description} icon={FileText} helpText="Scope details and threshold governance policy (max 1000 characters)">
                <textarea
                  rows={3}
                  value={ruleForm.Description}
                  onChange={(e) => {
                    setRuleForm({ ...ruleForm, Description: e.target.value });
                    clearRuleError('Description');
                  }}
                  placeholder="Scope details and threshold governance policy..."
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    background: 'var(--bg-tertiary)',
                    border: ruleErrors.Description ? '1.5px solid var(--color-danger, #ef4444)' : '1px solid var(--glass-border)',
                    borderRadius: 'var(--border-radius-sm)',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
              </FormField>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px', gap: '12px' }}>
                <FormField label="Min Cost" error={ruleErrors.MinCost} icon={DollarSign}>
                  <input
                    type="number"
                    value={ruleForm.MinCost}
                    onChange={(e) => {
                      setRuleForm({ ...ruleForm, MinCost: e.target.value });
                      clearRuleError('MinCost');
                    }}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      background: 'var(--bg-tertiary)',
                      border: ruleErrors.MinCost ? '1.5px solid var(--color-danger, #ef4444)' : '1px solid var(--glass-border)',
                      borderRadius: 'var(--border-radius-sm)',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </FormField>

                <FormField label="Max Cost" error={ruleErrors.MaxCost} icon={DollarSign}>
                  <input
                    type="number"
                    value={ruleForm.MaxCost}
                    onChange={(e) => {
                      setRuleForm({ ...ruleForm, MaxCost: e.target.value });
                      clearRuleError('MaxCost');
                    }}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      background: 'var(--bg-tertiary)',
                      border: ruleErrors.MaxCost ? '1.5px solid var(--color-danger, #ef4444)' : '1px solid var(--glass-border)',
                      borderRadius: 'var(--border-radius-sm)',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </FormField>

                <FormField label="Curr." icon={Globe}>
                  <select
                    value={ruleForm.CurrencyCode}
                    onChange={(e) => setRuleForm({ ...ruleForm, CurrencyCode: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 'var(--border-radius-sm)',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="USD" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>USD</option>
                    <option value="ETB" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>ETB</option>
                    <option value="EUR" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>EUR</option>
                  </select>
                </FormField>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px', paddingTop: '16px', borderTop: '1px solid var(--glass-border)', flexShrink: 0 }}>
                <button type="button" onClick={handleCloseRuleModal} style={{ padding: '10px 18px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 22px', borderRadius: 'var(--border-radius-sm)', border: 'none', background: 'var(--accent-gradient)', color: '#ffffff', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', boxShadow: 'var(--glow-accent)' }}>Create Governance Rule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Group Modal */}
      {showGroupModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--modal-backdrop, rgba(16, 20, 24, 0.78))', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--glass-border-accent)',
            borderRadius: '24px', width: '100%', maxWidth: '500px', maxHeight: '90vh',
            display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)'
          }}>
            {/* Header */}
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid var(--glass-border)', background: 'var(--bg-tertiary)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(138, 75, 255, 0.15)', color: 'var(--accent-primary)' }}>
                  <Users size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-primary)' }}>Create Approver Group</h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>Form an approver committee or multi-user signing group</p>
                </div>
              </div>
              <button onClick={handleCloseGroupModal} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}><X size={18} /></button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleCreateGroup} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', overflowY: 'auto', flex: 1 }}>
              <FormField label="Group Name" required error={groupErrors.GroupName} icon={Users}>
                <input
                  type="text"
                  value={groupForm.GroupName}
                  onChange={(e) => {
                    setGroupForm({ ...groupForm, GroupName: e.target.value });
                    clearGroupError('GroupName');
                  }}
                  placeholder=""
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    background: 'var(--bg-tertiary)',
                    border: groupErrors.GroupName ? '1.5px solid var(--color-danger, #ef4444)' : '1px solid var(--glass-border)',
                    borderRadius: 'var(--border-radius-sm)',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </FormField>

              <FormField label="Group Description" error={groupErrors.Description} icon={FileText} helpText="Roles and responsibilities of this approver group (max 500 characters)">
                <textarea
                  rows={3}
                  value={groupForm.Description}
                  onChange={(e) => {
                    setGroupForm({ ...groupForm, Description: e.target.value });
                    clearGroupError('Description');
                  }}
                  placeholder="Roles and responsibilities of this approver group..."
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    background: 'var(--bg-tertiary)',
                    border: groupErrors.Description ? '1.5px solid var(--color-danger, #ef4444)' : '1px solid var(--glass-border)',
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
                <button type="button" onClick={handleCloseGroupModal} style={{ padding: '10px 18px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 22px', borderRadius: 'var(--border-radius-sm)', border: 'none', background: 'var(--accent-gradient)', color: '#ffffff', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', boxShadow: 'var(--glow-accent)' }}>Create Group</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
