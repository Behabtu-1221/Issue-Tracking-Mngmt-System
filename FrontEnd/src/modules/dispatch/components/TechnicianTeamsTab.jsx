import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Wrench,
  Search,
  UserPlus,
  Trash2,
  Edit2,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  X,
  UserCheck,
  Info,
  FileText
} from 'lucide-react';
import dispatchApi from '../api/dispatchApi';
import api from '../../../api/client';
import ConfirmDialogModal from '../../../components/common/ConfirmDialogModal';
import AlertDialogModal from '../../../components/common/AlertDialogModal';
import { FormField } from '../../../components/common/FormField';
import { dispatchSchemas } from '../../../validation';

export default function TechnicianTeamsTab() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Glass Modal States
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', type: 'danger', confirmText: 'Confirm', onConfirm: () => {} });
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'success' });

  const showAlert = (title, message, type = 'success') => {
    setAlertConfig({ isOpen: true, title, message, type });
  };

  // Team Create / Edit Modal State
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [teamForm, setTeamForm] = useState({
    TeamName: '',
    TeamCode: '',
    Description: '',
    LeaderUserID: '',
    IsActive: 1
  });
  const [teamFieldErrors, setTeamFieldErrors] = useState({});
  const [submittingTeam, setSubmittingTeam] = useState(false);

  // Team Members Drawer State
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [eligibleTechs, setEligibleTechs] = useState([]);
  const [selectedTechToAdd, setSelectedTechToAdd] = useState('');
  const [memberError, setMemberError] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  const clearTeamFieldError = (field) => {
    if (teamFieldErrors[field]) {
      setTeamFieldErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [search]);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const res = await api.get('/teams', { params: { search } });
      setTeams(res.data?.data?.teams || []);
    } catch (err) {
      console.error('Failed to load teams:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEligibleTechnicians = async () => {
    try {
      const res = await api.get('/teams/eligible-technicians');
      setEligibleTechs(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load eligible technicians:', err);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingTeam(null);
    setTeamForm({
      TeamName: '',
      TeamCode: `TEAM-${Date.now().toString().slice(-4)}`,
      Description: '',
      LeaderUserID: '',
      IsActive: 1
    });
    setTeamFieldErrors({});
    fetchEligibleTechnicians();
    setShowTeamModal(true);
  };

  const handleOpenEditModal = (team) => {
    setEditingTeam(team);
    setTeamForm({
      TeamName: team.TeamName || '',
      TeamCode: team.TeamCode || '',
      Description: team.Description || '',
      LeaderUserID: team.LeaderUserID || '',
      IsActive: team.IsActive !== undefined ? team.IsActive : 1
    });
    setTeamFieldErrors({});
    fetchEligibleTechnicians();
    setShowTeamModal(true);
  };

  const handleSaveTeam = async (e) => {
    e.preventDefault();
    const validation = dispatchSchemas.teamForm(teamForm);
    if (!validation.isValid) {
      setTeamFieldErrors(validation.errors);
      return;
    }
    setTeamFieldErrors({});

    try {
      setSubmittingTeam(true);
      const payload = validation.sanitized;

      if (editingTeam) {
        await api.put(`/teams/${editingTeam.TeamID}`, payload);
      } else {
        await api.post('/teams', payload);
      }

      setShowTeamModal(false);
      fetchTeams();
      showAlert('Team Saved', `Technician team "${validation.sanitized.TeamName}" was saved successfully.`, 'success');
    } catch (err) {
      showAlert('Save Failed', err.response?.data?.message || 'Failed to save team', 'error');
    } finally {
      setSubmittingTeam(false);
    }
  };

  const handleDeleteTeam = (team) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Technician Team',
      message: `Are you sure you want to delete team "${team.TeamName}"? Assigned technicians will remain in roster.`,
      type: 'danger',
      confirmText: 'Delete Team',
      onConfirm: async () => {
        try {
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          await api.delete(`/teams/${team.TeamID}`);
          fetchTeams();
          showAlert('Team Deleted', `Team "${team.TeamName}" deleted successfully.`, 'success');
        } catch (err) {
          showAlert('Deletion Failed', err.response?.data?.message || 'Failed to delete team', 'error');
        }
      }
    });
  };

  // Team Members Drawer Handlers
  const handleOpenMembersDrawer = async (team) => {
    setSelectedTeam(team);
    setMemberError('');
    setSelectedTechToAdd('');
    fetchEligibleTechnicians();
    await fetchTeamMembers(team.TeamID);
  };

  const fetchTeamMembers = async (teamId) => {
    try {
      setLoadingMembers(true);
      const res = await api.get(`/teams/${teamId}/members`);
      setMembers(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load team members:', err);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleAddMember = async () => {
    const validation = dispatchSchemas.addTeamMemberForm({ userId: selectedTechToAdd }, members);
    if (!validation.isValid) {
      setMemberError(validation.errors.userId);
      return;
    }
    setMemberError('');

    try {
      setAddingMember(true);
      await api.post(`/teams/${selectedTeam.TeamID}/members`, {
        userId: validation.sanitized.userId,
        roleInTeam: 'MEMBER'
      });
      setSelectedTechToAdd('');
      await fetchTeamMembers(selectedTeam.TeamID);
      fetchTeams();
      showAlert('Member Added', 'Technician successfully added to team roster.', 'success');
    } catch (err) {
      showAlert('Operation Failed', err.response?.data?.message || 'Failed to add technician to team', 'error');
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = (memberUserId, memberName) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Remove Team Member',
      message: `Are you sure you want to remove ${memberName} from team "${selectedTeam?.TeamName}"?`,
      type: 'warning',
      confirmText: 'Remove Member',
      onConfirm: async () => {
        try {
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          await api.delete(`/teams/${selectedTeam.TeamID}/members/${memberUserId}`);
          await fetchTeamMembers(selectedTeam.TeamID);
          fetchTeams();
        } catch (err) {
          showAlert('Operation Failed', err.response?.data?.message || 'Failed to remove member', 'error');
        }
      }
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Controls Bar */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ position: 'relative', minWidth: '280px', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search teams by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: '42px', paddingRight: '14px', paddingTop: '10px', paddingBottom: '10px',
              borderRadius: '12px', border: '1px solid var(--glass-border)',
              background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={fetchTeams} className="btn btn-secondary" style={{ padding: '9px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={15} className={loading ? 'spin' : ''} /> Refresh
          </button>
          <button onClick={handleOpenCreateModal} className="btn btn-primary" style={{ padding: '9px 18px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} /> Create Work Team
          </button>
        </div>
      </div>

      {/* Teams Grid */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div className="spinner" style={{ marginBottom: '12px' }} />
          <div>Loading department technician teams...</div>
        </div>
      ) : teams.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--glass-bg)', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
          <Users size={42} style={{ opacity: 0.4, marginBottom: '12px', color: 'var(--accent-primary)' }} />
          <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '4px' }}>No Technician Teams Created</div>
          <div style={{ fontSize: '0.82rem' }}>Click "Create Work Team" to establish operational technician teams for your department.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
          {teams.map((team) => (
            <div
              key={team.TeamID}
              className="glass-panel"
              style={{
                borderRadius: '18px',
                padding: '20px',
                border: '1px solid var(--glass-border)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '16px'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--accent-primary)', background: 'rgba(99, 102, 241, 0.12)', padding: '2px 8px', borderRadius: '6px' }}>
                      {team.TeamCode}
                    </span>
                    <h3 style={{ margin: '6px 0 0', fontSize: '1.1rem', fontWeight: '900', color: 'var(--text-primary)' }}>
                      {team.TeamName}
                    </h3>
                  </div>
                  <span style={{
                    padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '800',
                    background: team.IsActive === 1 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                    color: team.IsActive === 1 ? '#10b981' : 'var(--text-muted)',
                    border: team.IsActive === 1 ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--glass-border)'
                  }}>
                    {team.IsActive === 1 ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                  Department: <strong>{team.DepartmentName || 'IT Support'}</strong>
                </div>

                {/* Team Workload & Members Metrics */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px',
                  background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)'
                }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700' }}>MEMBERS</div>
                    <div style={{ fontSize: '1rem', fontWeight: '900', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                      <Users size={15} color="var(--accent-primary)" /> {team.MemberCount || 0} Technicians
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700' }}>TEAM LEADER</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-primary)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {team.LeaderFullName || 'Unassigned'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Team Actions Footer */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', borderTop: '1px solid var(--glass-border)', paddingTop: '14px' }}>
                <button
                  onClick={() => handleOpenMembersDrawer(team)}
                  style={{
                    padding: '7px 14px', borderRadius: '10px', border: '1px solid var(--accent-primary)',
                    background: 'rgba(99, 102, 241, 0.12)', color: 'var(--accent-primary)',
                    fontWeight: '800', fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                >
                  <UserPlus size={14} /> Members & Workload
                </button>
                <button
                  onClick={() => handleOpenEditModal(team)}
                  style={{
                    padding: '7px 12px', borderRadius: '10px', border: '1px solid var(--glass-border)',
                    background: 'var(--bg-secondary)', color: 'var(--text-secondary)',
                    fontWeight: '700', fontSize: '0.78rem', cursor: 'pointer'
                  }}
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => handleDeleteTeam(team)}
                  style={{
                    padding: '7px 12px', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.3)',
                    background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
                    fontWeight: '700', fontSize: '0.78rem', cursor: 'pointer'
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT TEAM MODAL */}
      {showTeamModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)',
            borderRadius: '24px', width: '100%', maxWidth: '540px', padding: '24px',
            boxShadow: '0 25px 70px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900', color: 'var(--text-primary)' }}>
                {editingTeam ? 'Edit Technician Team' : 'Create Technician Work Team'}
              </h3>
              <button onClick={() => setShowTeamModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveTeam} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <FormField
                label="Team Name"
                required
                error={teamFieldErrors.TeamName}
                icon={Users}
              >
                <input
                  type="text"
                  placeholder="e.g. Network & Connectivity Support Team"
                  value={teamForm.TeamName}
                  onChange={(e) => {
                    setTeamForm({ ...teamForm, TeamName: e.target.value });
                    clearTeamFieldError('TeamName');
                  }}
                  style={{
                    width: '100%', padding: '12px', borderRadius: '10px',
                    border: `1px solid ${teamFieldErrors.TeamName ? 'rgba(239, 68, 68, 0.5)' : 'var(--glass-border)'}`,
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </FormField>

              <FormField
                label="Team Code"
                required
                error={teamFieldErrors.TeamCode}
                icon={ShieldCheck}
                helpText="2 to 50 alphanumeric characters (dashes and underscores allowed)"
              >
                <input
                  type="text"
                  placeholder="e.g. TEAM-NET-01"
                  value={teamForm.TeamCode}
                  onChange={(e) => {
                    setTeamForm({ ...teamForm, TeamCode: e.target.value });
                    clearTeamFieldError('TeamCode');
                  }}
                  style={{
                    width: '100%', padding: '12px', borderRadius: '10px',
                    border: `1px solid ${teamFieldErrors.TeamCode ? 'rgba(239, 68, 68, 0.5)' : 'var(--glass-border)'}`,
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </FormField>

              <FormField
                label="Team Lead (Optional)"
                error={teamFieldErrors.LeaderUserID}
                icon={UserCheck}
              >
                <select
                  value={teamForm.LeaderUserID}
                  onChange={(e) => {
                    setTeamForm({ ...teamForm, LeaderUserID: e.target.value });
                    clearTeamFieldError('LeaderUserID');
                  }}
                  style={{
                    width: '100%', padding: '12px', borderRadius: '10px',
                    border: `1px solid ${teamFieldErrors.LeaderUserID ? 'rgba(239, 68, 68, 0.5)' : 'var(--glass-border)'}`,
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box'
                  }}
                >
                  <option value="">-- Unassigned Team Lead --</option>
                  {eligibleTechs.map((tech) => (
                    <option key={tech.UserID} value={tech.UserID}>
                      {tech.FirstName} {tech.LastName} ({tech.Email})
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField
                label="Description & Responsibilities (Optional)"
                error={teamFieldErrors.Description}
                icon={FileText}
              >
                <textarea
                  rows={3}
                  placeholder="Operational responsibilities, coverage zones, escalation handling..."
                  value={teamForm.Description}
                  onChange={(e) => {
                    setTeamForm({ ...teamForm, Description: e.target.value });
                    clearTeamFieldError('Description');
                  }}
                  style={{
                    width: '100%', padding: '12px', borderRadius: '10px',
                    border: `1px solid ${teamFieldErrors.Description ? 'rgba(239, 68, 68, 0.5)' : 'var(--glass-border)'}`,
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
              </FormField>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowTeamModal(false);
                    setTeamFieldErrors({});
                  }}
                  className="btn btn-secondary"
                  style={{ padding: '10px 18px' }}
                >
                  Cancel
                </button>
                <button type="submit" disabled={submittingTeam} className="btn btn-primary" style={{ padding: '10px 22px' }}>
                  {submittingTeam ? 'Saving Team...' : editingTeam ? 'Update Team' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TEAM MEMBERSHIP & WORKLOAD DRAWER / MODAL */}
      {selectedTeam && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)',
            borderRadius: '24px', width: '100%', maxWidth: '680px', maxHeight: '90vh', padding: '24px',
            display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 25px 70px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--accent-primary)', background: 'rgba(99, 102, 241, 0.12)', padding: '2px 8px', borderRadius: '6px' }}>
                  {selectedTeam.TeamCode}
                </span>
                <h3 style={{ margin: '4px 0 0', fontSize: '1.2rem', fontWeight: '900', color: 'var(--text-primary)' }}>
                  {selectedTeam.TeamName} — Roster & Workload
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedTeam(null);
                  setMemberError('');
                }}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Add Technician Form */}
            <div style={{
              background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '16px',
              border: '1px solid var(--glass-border)', display: 'flex', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap'
            }}>
              <div style={{ flex: 1, minWidth: '220px' }}>
                <FormField
                  label="Add Eligible Department Technician"
                  required
                  error={memberError}
                  icon={UserPlus}
                >
                  <select
                    value={selectedTechToAdd}
                    onChange={(e) => {
                      setSelectedTechToAdd(e.target.value);
                      if (memberError) setMemberError('');
                    }}
                    style={{
                      width: '100%', padding: '10px', borderRadius: '10px',
                      border: `1px solid ${memberError ? 'rgba(239, 68, 68, 0.5)' : 'var(--glass-border)'}`,
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none'
                    }}
                  >
                    <option value="">-- Select Eligible Technician --</option>
                    {eligibleTechs
                      .filter((t) => !members.some((m) => m.UserID === t.UserID))
                      .map((t) => (
                        <option key={t.UserID} value={t.UserID}>
                          {t.FirstName} {t.LastName} ({t.Email})
                        </option>
                      ))}
                  </select>
                </FormField>
              </div>

              <button
                onClick={handleAddMember}
                disabled={addingMember}
                className="btn btn-primary"
                style={{ padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '22px' }}
              >
                <UserPlus size={15} /> {addingMember ? 'Adding...' : 'Add to Team'}
              </button>
            </div>

            {/* Team Members List */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
                CURRENT TEAM MEMBERS ({members.length})
              </div>

              {loadingMembers ? (
                <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading team members...</div>
              ) : members.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-tertiary)', borderRadius: '12px', border: '1px solid var(--glass-border)', fontSize: '0.85rem' }}>
                  No technicians assigned to this team yet. Use the selector above to assign department technicians.
                </div>
              ) : (
                members.map((member) => (
                  <div
                    key={member.UserID}
                    style={{
                      padding: '14px 18px', borderRadius: '14px',
                      background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '38px', height: '38px', borderRadius: '50%',
                        background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800'
                      }}>
                        {member.FirstName[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: '800', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                          {member.FirstName} {member.LastName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {member.Email}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: '800', color: member.ActiveRequestsCount > 4 ? '#ef4444' : '#10b981' }}>
                          {member.ActiveRequestsCount || 0} active work items
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {member.SLARiskCount > 0 ? `${member.SLARiskCount} SLA Risk` : 'Optimal load'}
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveMember(member.UserID, `${member.FirstName} ${member.LastName}`)}
                        style={{
                          padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)',
                          background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
                          fontWeight: '700', fontSize: '0.75rem', cursor: 'pointer'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
