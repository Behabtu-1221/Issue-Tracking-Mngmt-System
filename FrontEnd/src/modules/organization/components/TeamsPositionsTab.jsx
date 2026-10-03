import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Briefcase,
  Layers,
  Building2,
  Edit2,
  Trash2,
  UserCheck,
  Award
} from 'lucide-react';
import orgApi from '../api/orgApi';
import identityApi from '../../identity-access/api/identityApi';
import ConfirmDialogModal from '../../../components/common/ConfirmDialogModal';
import AlertDialogModal from '../../../components/common/AlertDialogModal';
import { FormField } from '../../../components/common/FormField';
import { orgSchemas } from '../../../validation';

export default function TeamsPositionsTab({ onRefreshMetrics }) {
  const [subSection, setSubSection] = useState('teams'); // 'teams' | 'positions'
  const [teams, setTeams] = useState([]);
  const [positions, setPositions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterId, setFilterId] = useState('');

  // Modals
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isPositionModalOpen, setIsPositionModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [editingPosition, setEditingPosition] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [teamErrors, setTeamErrors] = useState({});
  const [positionErrors, setPositionErrors] = useState({});

  const clearTeamError = (field) => {
    if (teamErrors[field]) {
      setTeamErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const clearPositionError = (field) => {
    if (positionErrors[field]) {
      setPositionErrors(prev => {
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
  const [teamForm, setTeamForm] = useState({
    DepartmentID: '',
    TeamCode: '',
    TeamName: '',
    LeaderUserID: '',
    IsActive: 1
  });

  const [positionForm, setPositionForm] = useState({
    PositionCode: '',
    PositionTitle: '',
    Description: '',
    IsActive: 1
  });

  useEffect(() => {
    fetchDepartments();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (subSection === 'teams') fetchTeams();
    else fetchPositions();
  }, [subSection, search, filterId]);

  const fetchDepartments = async () => {
    try {
      const res = await orgApi.getDepartments({ limit: 200 });
      setDepartments(res.data?.data?.departments || res.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch departments', err);
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

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const res = await orgApi.getTeams({ search, departmentId: filterId });
      setTeams(res.data?.data?.teams || res.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch teams', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPositions = async () => {
    try {
      setLoading(true);
      const res = await orgApi.getPositions({ search, orgUnitId: filterId });
      setPositions(res.data?.data?.positions || res.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch positions', err);
    } finally {
      setLoading(false);
    }
  };

  // Team Handlers
  const handleOpenTeamCreate = () => {
    setEditingTeam(null);
    setTeamForm({
      DepartmentID: departments[0]?.DepartmentID || '',
      TeamCode: `TM-${Math.floor(100 + Math.random() * 900)}`,
      TeamName: '',
      LeaderUserID: '',
      IsActive: 1
    });
    setErrorMsg('');
    setTeamErrors({});
    setIsTeamModalOpen(true);
  };

  const handleOpenTeamEdit = (t) => {
    setEditingTeam(t);
    setTeamForm({
      DepartmentID: t.DepartmentID,
      TeamCode: t.TeamCode,
      TeamName: t.TeamName,
      LeaderUserID: t.LeaderUserID || '',
      IsActive: t.IsActive !== undefined ? t.IsActive : 1
    });
    setErrorMsg('');
    setTeamErrors({});
    setIsTeamModalOpen(true);
  };

  const handleTeamSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const validation = orgSchemas.teamForm(teamForm);
    if (!validation.isValid) {
      setTeamErrors(validation.errors);
      return;
    }
    setTeamErrors({});

    try {
      if (editingTeam) {
        await orgApi.updateTeam(editingTeam.TeamID, validation.sanitized);
      } else {
        await orgApi.createTeam(validation.sanitized);
      }
      setIsTeamModalOpen(false);
      fetchTeams();
      if (onRefreshMetrics) onRefreshMetrics();
      showAlert(
        editingTeam ? 'Team Updated' : 'Team Created',
        `Team "${validation.sanitized.TeamName}" saved successfully.`,
        'success'
      );
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleTeamDelete = (id, teamName) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Team',
      message: `Are you sure you want to delete team "${teamName}"? All member assignments will be affected.`,
      type: 'danger',
      confirmText: 'Delete Team',
      onConfirm: async () => {
        try {
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          await orgApi.deleteTeam(id);
          fetchTeams();
          if (onRefreshMetrics) onRefreshMetrics();
        } catch (err) {
          showAlert('Action Restricted', err.response?.data?.message || 'Failed to delete team', 'error');
        }
      }
    });
  };

  // Position Handlers
  const handleOpenPositionCreate = () => {
    setEditingPosition(null);
    setPositionForm({
      PositionCode: `POS-${Math.floor(100 + Math.random() * 900)}`,
      PositionTitle: '',
      Description: '',
      IsActive: 1
    });
    setErrorMsg('');
    setPositionErrors({});
    setIsPositionModalOpen(true);
  };

  const handleOpenPositionEdit = (p) => {
    setEditingPosition(p);
    setPositionForm({
      PositionCode: p.PositionCode,
      PositionTitle: p.PositionTitle,
      Description: p.Description || '',
      IsActive: p.IsActive !== undefined ? p.IsActive : 1
    });
    setErrorMsg('');
    setPositionErrors({});
    setIsPositionModalOpen(true);
  };

  const handlePositionSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const validation = orgSchemas.positionForm(positionForm);
    if (!validation.isValid) {
      setPositionErrors(validation.errors);
      return;
    }
    setPositionErrors({});

    try {
      if (editingPosition) {
        await orgApi.updatePosition(editingPosition.PositionID, validation.sanitized);
      } else {
        await orgApi.createPosition(validation.sanitized);
      }
      setIsPositionModalOpen(false);
      fetchPositions();
      showAlert(
        editingPosition ? 'Position Updated' : 'Position Created',
        `Position "${validation.sanitized.PositionTitle}" saved successfully.`,
        'success'
      );
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Operation failed');
    }
  };

  const handlePositionDelete = (id, title) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Position',
      message: `Are you sure you want to delete position "${title}"? This action cannot be undone.`,
      type: 'danger',
      confirmText: 'Delete Position',
      onConfirm: async () => {
        try {
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          await orgApi.deletePosition(id);
          fetchPositions();
        } catch (err) {
          showAlert('Action Restricted', err.response?.data?.message || 'Failed to delete position', 'error');
        }
      }
    });
  };

  return (
    <div>
      {/* Sub-section Navigation & Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-secondary)', padding: '4px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--glass-border)' }}>
            <button
              onClick={() => { setSubSection('teams'); setFilterId(''); }}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--border-radius-sm)',
                border: 'none',
                background: subSection === 'teams' ? 'var(--accent-gradient)' : 'transparent',
                color: subSection === 'teams' ? 'white' : 'var(--text-muted)',
                fontWeight: subSection === 'teams' ? '600' : '500',
                cursor: 'pointer',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Users size={14} /> Operational Teams
            </button>
            <button
              onClick={() => { setSubSection('positions'); setFilterId(''); }}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--border-radius-sm)',
                border: 'none',
                background: subSection === 'positions' ? 'var(--accent-gradient)' : 'transparent',
                color: subSection === 'positions' ? 'white' : 'var(--text-muted)',
                fontWeight: subSection === 'positions' ? '600' : '500',
                cursor: 'pointer',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Award size={14} /> Job Positions
            </button>
          </div>

          <div style={{ position: 'relative', width: '240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search..."
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

          {subSection === 'teams' ? (
            <select
              value={filterId}
              onChange={(e) => setFilterId(e.target.value)}
              style={{
                padding: '10px 14px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--border-radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                minWidth: '180px'
              }}
            >
              <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>All Departments</option>
              {departments.map((d) => (
                <option key={d.DepartmentID} value={d.DepartmentID} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                  {d.DepartmentName}
                </option>
              ))}
            </select>
          ) : (
            <select
              value={filterId}
              onChange={(e) => setFilterId(e.target.value)}
              style={{
                padding: '10px 14px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--border-radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                minWidth: '180px'
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
          onClick={subSection === 'teams' ? handleOpenTeamCreate : handleOpenPositionCreate}
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
          <Plus size={16} /> {subSection === 'teams' ? 'Add Operational Team' : 'Add Job Position'}
        </button>
      </div>

      {/* Directory Table */}
      {subSection === 'teams' ? (
        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading operational teams...</div>
          ) : teams.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No teams found matching criteria.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '16px 20px' }}>Team Name & Code</th>
                  <th style={{ padding: '16px 20px' }}>Department</th>
                  <th style={{ padding: '16px 20px' }}>Team Leader</th>
                  <th style={{ padding: '16px 20px' }}>Assigned Members</th>
                  <th style={{ padding: '16px 20px' }}>Status</th>
                  <th style={{ padding: '16px 20px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((t) => (
                  <tr key={t.TeamID} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{t.TeamName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.TeamCode}</div>
                    </td>
                    <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Building2 size={14} color="var(--accent-primary)" />
                        {t.DepartmentName}
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      {t.LeaderFullName ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4ade80' }}>
                          <UserCheck size={14} /> {t.LeaderFullName}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Unassigned</span>
                      )}
                    </td>
                    <td style={{ padding: '16px 20px', fontWeight: '600', color: '#60a5fa' }}>
                      {t.MemberCount} Members
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      {t.IsActive ? <span className="badge badge-success">Active</span> : <span className="badge badge-danger">Inactive</span>}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleOpenTeamEdit(t)}
                          style={{ padding: '6px 10px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', borderRadius: '4px', color: 'var(--text-primary)', cursor: 'pointer' }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleTeamDelete(t.TeamID, t.TeamName)}
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
        /* Positions Table */
        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading positions...</div>
          ) : positions.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No positions found.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '16px 20px' }}>Position Title & Code</th>
                  <th style={{ padding: '16px 20px' }}>Organization Unit</th>
                  <th style={{ padding: '16px 20px' }}>Assigned Staff</th>
                  <th style={{ padding: '16px 20px' }}>Status</th>
                  <th style={{ padding: '16px 20px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((p) => (
                  <tr key={p.PositionID} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{p.PositionTitle}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.PositionCode}</div>
                    </td>
                    <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Layers size={14} color="var(--accent-primary)" />
                        {p.OrganizationUnitName}
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', fontWeight: '600', color: '#4ade80' }}>
                      {p.AssignedCount} Staff
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      {p.IsActive ? <span className="badge badge-success">Active</span> : <span className="badge badge-danger">Inactive</span>}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleOpenPositionEdit(p)}
                          style={{ padding: '6px 10px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', borderRadius: '4px', color: 'var(--text-primary)', cursor: 'pointer' }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handlePositionDelete(p.PositionID, p.PositionTitle)}
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
      )}

      {/* Modal: Create/Edit Team */}
      {isTeamModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '520px', padding: '28px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)' }}>
              <Users color="var(--accent-primary)" />
              {editingTeam ? 'Edit Operational Team' : 'Add Operational Team'}
            </h2>

            {errorMsg && (
              <div style={{ padding: '10px 14px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '0.85rem', marginBottom: '16px' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleTeamSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <FormField
                label="Department"
                required
                error={teamErrors.DepartmentID}
                icon={Building2}
              >
                <select
                  value={teamForm.DepartmentID}
                  onChange={(e) => {
                    setTeamForm({ ...teamForm, DepartmentID: e.target.value });
                    clearTeamError('DepartmentID');
                  }}
                  style={{
                    width: '100%', padding: '10px 12px', background: 'var(--bg-tertiary)',
                    border: `1px solid ${teamErrors.DepartmentID ? 'rgba(239, 68, 68, 0.5)' : 'var(--glass-border)'}`,
                    borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box'
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                <FormField
                  label="Team Code"
                  required
                  error={teamErrors.TeamCode}
                  icon={Users}
                  hint="Format: TM-01"
                >
                  <input
                    type="text"
                    placeholder="e.g. TM-OPS"
                    value={teamForm.TeamCode}
                    onChange={(e) => {
                      setTeamForm({ ...teamForm, TeamCode: e.target.value });
                      clearTeamError('TeamCode');
                    }}
                    style={{
                      width: '100%', padding: '10px 12px', background: 'var(--bg-tertiary)',
                      border: `1px solid ${teamErrors.TeamCode ? 'rgba(239, 68, 68, 0.5)' : 'var(--glass-border)'}`,
                      borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </FormField>

                <FormField
                  label="Team Name"
                  required
                  error={teamErrors.TeamName}
                  icon={Users}
                >
                  <input
                    type="text"
                    placeholder="e.g. Core Operations Squad"
                    value={teamForm.TeamName}
                    onChange={(e) => {
                      setTeamForm({ ...teamForm, TeamName: e.target.value });
                      clearTeamError('TeamName');
                    }}
                    style={{
                      width: '100%', padding: '10px 12px', background: 'var(--bg-tertiary)',
                      border: `1px solid ${teamErrors.TeamName ? 'rgba(239, 68, 68, 0.5)' : 'var(--glass-border)'}`,
                      borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </FormField>
              </div>

              <FormField
                label="Team Leader (Optional)"
                error={teamErrors.LeaderUserID}
                icon={UserCheck}
              >
                <select
                  value={teamForm.LeaderUserID}
                  onChange={(e) => {
                    setTeamForm({ ...teamForm, LeaderUserID: e.target.value });
                    clearTeamError('LeaderUserID');
                  }}
                  style={{
                    width: '100%', padding: '10px 12px', background: 'var(--bg-tertiary)',
                    border: '1px solid var(--glass-border)', borderRadius: '8px',
                    color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box'
                  }}
                >
                  <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>-- No Leader Assigned --</option>
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
                  onClick={() => setIsTeamModalOpen(false)}
                  style={{ padding: '10px 18px', background: 'transparent', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 20px', background: 'var(--accent-gradient)', border: 'none', borderRadius: '8px', color: '#ffffff', fontWeight: '600', cursor: 'pointer' }}
                >
                  Save Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create/Edit Position */}
      {isPositionModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '520px', padding: '28px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)' }}>
              <Award color="var(--accent-primary)" />
              {editingPosition ? 'Edit Job Position' : 'Add Job Position'}
            </h2>

            {errorMsg && (
              <div style={{ padding: '10px 14px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '0.85rem', marginBottom: '16px' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handlePositionSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                <FormField
                  label="Position Code"
                  required
                  error={positionErrors.PositionCode}
                  icon={Award}
                  hint="Format: POS-01"
                >
                  <input
                    type="text"
                    placeholder="e.g. POS-ENG"
                    value={positionForm.PositionCode}
                    onChange={(e) => {
                      setPositionForm({ ...positionForm, PositionCode: e.target.value });
                      clearPositionError('PositionCode');
                    }}
                    style={{
                      width: '100%', padding: '10px 12px', background: 'var(--bg-tertiary)',
                      border: `1px solid ${positionErrors.PositionCode ? 'rgba(239, 68, 68, 0.5)' : 'var(--glass-border)'}`,
                      borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </FormField>

                <FormField
                  label="Position Title"
                  required
                  error={positionErrors.PositionTitle}
                  icon={Award}
                >
                  <input
                    type="text"
                    placeholder="e.g. Senior Network Specialist"
                    value={positionForm.PositionTitle}
                    onChange={(e) => {
                      setPositionForm({ ...positionForm, PositionTitle: e.target.value });
                      clearPositionError('PositionTitle');
                    }}
                    style={{
                      width: '100%', padding: '10px 12px', background: 'var(--bg-tertiary)',
                      border: `1px solid ${positionErrors.PositionTitle ? 'rgba(239, 68, 68, 0.5)' : 'var(--glass-border)'}`,
                      borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </FormField>
              </div>

              <FormField
                label="Description"
                error={positionErrors.Description}
                icon={Briefcase}
              >
                <textarea
                  rows="3"
                  placeholder="Responsibilities & skill requirements (optional)..."
                  value={positionForm.Description}
                  onChange={(e) => {
                    setPositionForm({ ...positionForm, Description: e.target.value });
                    clearPositionError('Description');
                  }}
                  style={{
                    width: '100%', padding: '10px 12px', background: 'var(--bg-tertiary)',
                    border: `1px solid ${positionErrors.Description ? 'rgba(239, 68, 68, 0.5)' : 'var(--glass-border)'}`,
                    borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box', resize: 'vertical'
                  }}
                />
              </FormField>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsPositionModalOpen(false)}
                  style={{ padding: '10px 18px', background: 'transparent', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 20px', background: 'var(--accent-gradient)', border: 'none', borderRadius: '8px', color: '#ffffff', fontWeight: '600', cursor: 'pointer' }}
                >
                  Save Position
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
