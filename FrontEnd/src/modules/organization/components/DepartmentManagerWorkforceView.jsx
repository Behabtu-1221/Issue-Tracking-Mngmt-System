import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  Wrench,
  ShieldCheck,
  Search,
  Plus,
  Mail,
  Phone,
  RefreshCw,
  RotateCw,
  RotateCcw,
  Briefcase,
  Layers,
  User,
  Award,
  CheckCircle2,
  ArrowRight,
  UserCheck,
  Shield,
  Activity,
  Check,
  SlidersHorizontal,
  ChevronRight,
  X,
  Sparkles,
  Zap,
  Star,
  ExternalLink
} from 'lucide-react';
import identityApi from '../../identity-access/api/identityApi';
import api from '../../../api/client';
import { useAuthContext } from '../../authentication/contexts/AuthContext';
import { ModalCard } from '../../../components/common/ModalCard';
import { FormField } from '../../../components/common/FormField';
import ConfirmDialogModal from '../../../components/common/ConfirmDialogModal';
import AlertDialogModal from '../../../components/common/AlertDialogModal';
import { ActionButton, ActionGroup } from '../../../components/common/ActionButton';
import { useTranslation } from '../../../i18n';

export default function DepartmentManagerWorkforceView({ initialTab = 'workforce' }) {
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const navigate = useNavigate();

  const isTeamsSubItem = initialTab === 'teams';
  const isWorkforceSubItem = !isTeamsSubItem;

  const [loading, setLoading] = useState(true);

  // Workforce & Teams Data
  const [staffList, setStaffList] = useState([]);
  const [teamsList, setTeamsList] = useState([]);
  const [departmentInfo, setDepartmentInfo] = useState({
    id: user?.departmentId || user?.DepartmentID || null,
    name: user?.departmentName || user?.DepartmentName || 'Department Operations',
    code: user?.departmentCode || user?.DepartmentCode || 'DEPT'
  });

  // Flip States for KPI Flash Cards (Workforce Page)
  const [flippedKpi, setFlippedKpi] = useState({
    workforce: false,
    technicians: false,
    employees: false,
    teams: false
  });

  const toggleKpi = (key) => {
    setFlippedKpi(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const flipAllCards = () => {
    const anyFlipped = Object.values(flippedKpi).some(Boolean);
    const targetState = !anyFlipped;
    setFlippedKpi({
      workforce: targetState,
      technicians: targetState,
      employees: targetState,
      teams: targetState
    });
  };

  // Filter & Search States
  const [roleFilter, setRoleFilter] = useState('ALL'); // 'ALL' | 'TECHNICIAN' | 'EMPLOYEE'
  const [teamFilter, setTeamFilter] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [teamSearch, setTeamSearch] = useState('');

  // Modals
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedTeamIdForAssign, setSelectedTeamIdForAssign] = useState('');

  // Form States - Work Team
  const [teamForm, setTeamForm] = useState({
    TeamName: '',
    TeamCode: '',
    Description: '',
    LeaderUserID: '',
    IsActive: 1
  });
  const [teamErrors, setTeamErrors] = useState({});
  const [submittingTeam, setSubmittingTeam] = useState(false);

  // Form States - Assign Tech to Team
  const [assignTechId, setAssignTechId] = useState('');
  const [assignRoleInTeam, setAssignRoleInTeam] = useState('MEMBER');
  const [assignError, setAssignError] = useState('');
  const [submittingAssign, setSubmittingAssign] = useState(false);

  // Dialog Modals
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', type: 'danger', confirmText: 'Confirm', onConfirm: () => {} });
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'success' });

  const showAlert = (title, message, type = 'success') => {
    setAlertConfig({ isOpen: true, title, message, type });
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 220);
    return () => clearTimeout(timer);
  }, [search]);

  // Initial Data Load
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchDepartmentDetails(),
        fetchWorkforce(),
        fetchTeams()
      ]);
    } catch (err) {
      console.error('Failed to load department workforce data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartmentDetails = async () => {
    try {
      const res = await api.get('/departments');
      const depts = res.data?.data?.departments || res.data?.data || [];
      if (Array.isArray(depts) && depts.length > 0) {
        setDepartmentInfo({
          id: depts[0].DepartmentID,
          name: depts[0].DepartmentName,
          code: depts[0].DepartmentCode || 'DEPT'
        });
      }
    } catch {
      // Fallback to auth profile
    }
  };

  const fetchWorkforce = async () => {
    try {
      const res = await identityApi.getUsers({ limit: 300 });
      const users = res.data?.data?.users || res.data?.data || [];
      setStaffList(users);

      if (users.length > 0) {
        const matched = users.find(u => u.DepartmentID || u.DepartmentName) || users[0];
        if (matched?.DepartmentID || matched?.DepartmentName) {
          setDepartmentInfo(prev => ({
            id: matched.DepartmentID || prev.id,
            name: matched.DepartmentName || prev.name,
            code: matched.DepartmentCode || prev.code
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching department users:', err);
    }
  };

  const fetchTeams = async () => {
    try {
      const res = await api.get('/teams');
      setTeamsList(res.data?.data?.teams || []);
    } catch (err) {
      console.error('Error fetching department teams:', err);
    }
  };

  // Department Technicians (filtered for assignment)
  const departmentTechnicians = useMemo(() => {
    return staffList.filter(u => {
      const code = (u.UserTypeCode || '').toUpperCase();
      const roleCodes = (u.Roles || u.roles || []).map(r => (r.RoleCode || r.code || '').toUpperCase());
      return code === 'TECHNICIAN' || code === 'PARK_TECHNICIAN' || roleCodes.includes('TECHNICIAN');
    });
  }, [staffList]);

  // Computed Detailed Metrics
  const metrics = useMemo(() => {
    const totalStaff = staffList.length;
    const technicians = departmentTechnicians;
    const employees = staffList.filter(u => !technicians.some(t => t.UserID === u.UserID));
    const activeTeams = teamsList.filter(t => t.IsActive !== 0).length;
    const assignedTechsCount = technicians.filter(t => t.AssignedTeamName || t.AssignedTeamID).length;
    const unassignedTechsCount = Math.max(0, technicians.length - assignedTechsCount);

    const techPct = totalStaff > 0 ? Math.round((technicians.length / totalStaff) * 100) : 0;
    const empPct = totalStaff > 0 ? (100 - techPct) : 0;

    const assignedPct = technicians.length > 0 ? Math.round((assignedTechsCount / technicians.length) * 100) : 0;
    const unassignedPct = technicians.length > 0 ? (100 - assignedPct) : 0;

    const teamsWithLead = teamsList.filter(t => t.LeaderUserID || t.LeaderFullName).length;
    const avgMembersPerTeam = teamsList.length > 0
      ? (assignedTechsCount / teamsList.length).toFixed(1)
      : '0.0';

    return {
      totalStaff,
      techCount: technicians.length,
      empCount: employees.length,
      activeTeams,
      assignedTechsCount,
      unassignedTechsCount,
      techPct,
      empPct,
      assignedPct,
      unassignedPct,
      teamsWithLead,
      avgMembersPerTeam
    };
  }, [staffList, teamsList, departmentTechnicians]);

  // Filtered Workforce List
  const filteredStaff = useMemo(() => {
    return staffList.filter(u => {
      const code = (u.UserTypeCode || '').toUpperCase();
      const roleCodes = (u.Roles || u.roles || []).map(r => (r.RoleCode || r.code || '').toUpperCase());
      const isTech = code === 'TECHNICIAN' || code === 'PARK_TECHNICIAN' || roleCodes.includes('TECHNICIAN');

      if (roleFilter === 'TECHNICIAN' && !isTech) return false;
      if (roleFilter === 'EMPLOYEE' && isTech) return false;

      if (teamFilter === 'UNASSIGNED') {
        if (u.AssignedTeamName || u.AssignedTeamID) return false;
      } else if (teamFilter) {
        if (String(u.AssignedTeamID) !== String(teamFilter)) return false;
      }

      if (debouncedSearch.trim()) {
        const q = debouncedSearch.toLowerCase().trim();
        const fullName = `${u.FirstName || ''} ${u.LastName || ''}`.toLowerCase();
        const email = (u.Email || '').toLowerCase();
        const username = (u.Username || '').toLowerCase();
        const job = (u.JobTitle || '').toLowerCase();
        const phone = (u.PhoneNumber || u.MobileNumber || '').toLowerCase();
        const team = (u.AssignedTeamName || '').toLowerCase();
        return (
          fullName.includes(q) ||
          email.includes(q) ||
          username.includes(q) ||
          job.includes(q) ||
          phone.includes(q) ||
          team.includes(q)
        );
      }

      return true;
    });
  }, [staffList, roleFilter, teamFilter, debouncedSearch]);

  // Filtered Teams List
  const filteredTeams = useMemo(() => {
    if (!teamSearch.trim()) return teamsList;
    const q = teamSearch.toLowerCase().trim();
    return teamsList.filter(t =>
      (t.TeamName || '').toLowerCase().includes(q) ||
      (t.TeamCode || '').toLowerCase().includes(q) ||
      (t.Description || '').toLowerCase().includes(q) ||
      (t.LeaderFullName || '').toLowerCase().includes(q)
    );
  }, [teamsList, teamSearch]);

  // Handler: Open Create Work Team Modal
  const handleOpenCreateTeamModal = () => {
    setEditingTeam(null);
    setTeamForm({
      TeamName: '',
      TeamCode: `TEAM-${Math.floor(100 + Math.random() * 900)}`,
      Description: '',
      LeaderUserID: '',
      IsActive: 1
    });
    setTeamErrors({});
    setIsTeamModalOpen(true);
  };

  // Handler: Open Edit Work Team Modal
  const handleOpenEditTeamModal = (team) => {
    setEditingTeam(team);
    setTeamForm({
      TeamName: team.TeamName || '',
      TeamCode: team.TeamCode || '',
      Description: team.Description || '',
      LeaderUserID: team.LeaderUserID || '',
      IsActive: team.IsActive !== undefined ? team.IsActive : 1
    });
    setTeamErrors({});
    setIsTeamModalOpen(true);
  };

  // Handler: Submit Work Team (Create / Update)
  const handleTeamSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!teamForm.TeamName.trim()) errors.TeamName = 'Team name is required';
    if (!teamForm.TeamCode.trim()) errors.TeamCode = 'Team code is required';

    if (Object.keys(errors).length > 0) {
      setTeamErrors(errors);
      return;
    }
    setTeamErrors({});

    try {
      setSubmittingTeam(true);

      const targetDeptId = departmentInfo.id || user?.departmentId || user?.DepartmentID;

      const payload = {
        DepartmentID: Number(targetDeptId),
        TeamName: teamForm.TeamName.trim(),
        TeamCode: teamForm.TeamCode.trim().toUpperCase(),
        Description: teamForm.Description.trim() || null,
        LeaderUserID: teamForm.LeaderUserID ? Number(teamForm.LeaderUserID) : null,
        IsActive: teamForm.IsActive ? 1 : 0
      };

      if (editingTeam) {
        await api.put(`/teams/${editingTeam.TeamID}`, payload);
        showAlert('Team Updated', `Work team "${payload.TeamName}" was updated successfully.`, 'success');
      } else {
        await api.post('/teams', payload);
        showAlert('Team Created', `Work team "${payload.TeamName}" created for ${departmentInfo.name}.`, 'success');
      }

      setIsTeamModalOpen(false);
      loadAllData();
    } catch (err) {
      console.error('Failed to save team:', err);
      showAlert('Save Failed', err.response?.data?.message || err.message || 'Failed to save work team', 'error');
    } finally {
      setSubmittingTeam(false);
    }
  };

  // Handler: Delete Work Team
  const handleDeleteTeam = (team) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Work Team',
      message: `Are you sure you want to delete work team "${team.TeamName}"? Assigned technicians will be unassigned and remain in your department workforce.`,
      type: 'danger',
      confirmText: 'Delete Team',
      onConfirm: async () => {
        try {
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          await api.delete(`/teams/${team.TeamID}`);
          showAlert('Team Deleted', `Work team "${team.TeamName}" has been deleted.`, 'success');
          loadAllData();
        } catch (err) {
          showAlert('Delete Failed', err.response?.data?.message || 'Failed to delete work team', 'error');
        }
      }
    });
  };

  // Handler: Open Assign Tech Modal
  const handleOpenAssignModal = (teamOrId = null, preselectedTechId = '') => {
    let teamId = '';
    if (typeof teamOrId === 'object' && teamOrId !== null) {
      teamId = String(teamOrId.TeamID);
    } else if (teamOrId) {
      teamId = String(teamOrId);
    } else if (teamsList.length > 0) {
      teamId = String(teamsList[0].TeamID);
    }

    setSelectedTeamIdForAssign(teamId);
    setAssignTechId(preselectedTechId ? String(preselectedTechId) : '');
    setAssignRoleInTeam('MEMBER');
    setAssignError('');
    setIsAssignModalOpen(true);
  };

  // Handler: Submit Assign Tech to Team
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTeamIdForAssign) {
      setAssignError('Please select a target work team');
      return;
    }
    if (!assignTechId) {
      setAssignError('Please select a field technician from your department');
      return;
    }
    setAssignError('');

    try {
      setSubmittingAssign(true);
      const chosenTeam = teamsList.find(t => String(t.TeamID) === String(selectedTeamIdForAssign));
      const teamName = chosenTeam ? chosenTeam.TeamName : 'the work team';

      await api.post(`/teams/${selectedTeamIdForAssign}/members`, {
        userId: Number(assignTechId),
        roleInTeam: assignRoleInTeam
      });

      setIsAssignModalOpen(false);
      showAlert('Technician Assigned', `Technician assigned to "${teamName}" successfully.`, 'success');
      loadAllData();
    } catch (err) {
      setAssignError(err.response?.data?.message || 'Failed to assign technician to team');
    } finally {
      setSubmittingAssign(false);
    }
  };

  // Handler: Remove Technician from Team
  const handleRemoveMember = (teamId, userId, memberName) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Remove from Team',
      message: `Are you sure you want to remove ${memberName || 'this technician'} from the work team?`,
      type: 'warning',
      confirmText: 'Remove Member',
      onConfirm: async () => {
        try {
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          await api.delete(`/teams/${teamId}/members/${userId}`);
          showAlert('Member Removed', `${memberName || 'Technician'} removed from team.`, 'success');
          loadAllData();
        } catch (err) {
          showAlert('Remove Failed', err.response?.data?.message || 'Failed to remove member', 'error');
        }
      }
    });
  };

  const hasActiveFilters = roleFilter !== 'ALL' || teamFilter !== '' || search.trim() !== '';

  const handleResetFilters = () => {
    setRoleFilter('ALL');
    setTeamFilter('');
    setSearch('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', fontFamily: "'Inter', sans-serif" }}>
      {/* ── EXECUTIVE DEPARTMENT HEADER BANNER ── */}
      <div
        className="glass-card"
        style={{
          padding: '24px 28px',
          borderRadius: '16px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--color-border-subtle)',
          borderLeft: '5px solid #2563eb',
          boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 8px 20px rgba(37, 99, 235, 0.28)',
              flexShrink: 0
            }}
          >
            {isTeamsSubItem ? <Briefcase size={26} /> : <Building2 size={26} />}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '3px 10px',
                  borderRadius: '20px',
                  background: 'rgba(37, 99, 235, 0.08)',
                  border: '1px solid rgba(37, 99, 235, 0.22)',
                  color: '#2563eb',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                <ShieldCheck size={13} /> {t('organization.deptManagerPortal', 'Department Operations Portal')}
              </span>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: 'var(--color-elevated)',
                  border: '1px solid var(--color-border-subtle)',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  color: 'var(--color-text-muted)'
                }}
              >
                {departmentInfo.code || 'DEPT'}
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '3px 9px',
                  borderRadius: '20px',
                  background: 'rgba(21, 128, 61, 0.08)',
                  color: '#15803d',
                  fontSize: '0.72rem',
                  fontWeight: 600
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#15803d', boxShadow: '0 0 6px #15803d' }} />
                Live Campus Directory
              </span>
            </div>
            <h1
              style={{
                fontFamily: "'Outfit', 'Inter', sans-serif",
                fontSize: '1.75rem',
                fontWeight: 700,
                color: 'var(--color-text)',
                margin: '6px 0 3px',
                letterSpacing: '-0.02em'
              }}
            >
              {departmentInfo.name}
              {isTeamsSubItem && (
                <span style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-muted)', marginLeft: '10px' }}>
                  • Work Teams & Technicians
                </span>
              )}
            </h1>
            <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--color-text-muted)', lineHeight: 1.45 }}>
              {isTeamsSubItem
                ? 'Operational technical response teams, appointed squad leads, and technician assignments.'
                : 'Workforce directory, technical role classification, and team assignments for your department.'}
            </p>
          </div>
        </div>

        {/* Action Controls & Live Stats Pills */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {isWorkforceSubItem && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--color-elevated)',
                padding: '6px 12px',
                borderRadius: '10px',
                border: '1px solid var(--color-border-subtle)',
                fontSize: '0.78rem',
                color: 'var(--color-text-muted)'
              }}
            >
              <span>Personnel: <strong style={{ color: 'var(--color-text)' }}>{staffList.length}</strong></span>
              <span>•</span>
              <span>Techs: <strong style={{ color: '#15803d' }}>{metrics.techCount}</strong></span>
              <span>•</span>
              <span>Teams: <strong style={{ color: '#4f46e5' }}>{teamsList.length}</strong></span>
            </div>
          )}

          {isTeamsSubItem && (
            <button
              onClick={handleOpenCreateTeamModal}
              className="interactive-hover-card"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '0.84rem',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.28)',
                transition: 'all 0.2s ease'
              }}
            >
              <Plus size={16} />
              <span>{t('organization.createWorkTeamBtn', 'Create Work Team')}</span>
            </button>
          )}

          {isWorkforceSubItem && (
            <button
              onClick={flipAllCards}
              title="Flip all metric cards"
              className="flip-trigger-btn"
              style={{ padding: '8px 12px', fontSize: '0.78rem', borderRadius: '10px' }}
            >
              <RotateCw size={13} />
              <span>Flip All</span>
            </button>
          )}

          <button
            onClick={loadAllData}
            title={t('common.refresh', 'Refresh')}
            className="interactive-hover-card"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--color-border-subtle)',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
              transition: 'all 0.2s ease'
            }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          SUB-ITEM 1: DEPARTMENT WORKFORCE (Modern SaaS 3D Flip Flash Cards)
      ══════════════════════════════════════════════════════════════════ */}
      {isWorkforceSubItem && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* ── 4 MODERN SAAS 3D FLIPPABLE FLASH CARDS (BALANCED RESPONSIVE GRID) ── */}
          <div className="saas-kpi-grid">
            {/* ═══ FLASH CARD 1: Department Workforce ═══ */}
            <div className="flip-card-3d-wrapper interactive-lift" style={{ height: '194px' }}>
              <div className={`flip-card-3d-inner ${flippedKpi.workforce ? 'flipped' : ''}`}>
                {/* FRONT */}
                <div
                  className="flip-card-3d-front glass-card saas-card-mesh-blue"
                  style={{
                    padding: '20px 22px',
                    borderRadius: '16px',
                    border: '1px solid var(--color-border-subtle)',
                    borderTop: '4px solid #2563eb',
                    boxShadow: '0 4px 14px rgba(15, 23, 42, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                  onClick={() => toggleKpi('workforce')}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.14) 0%, rgba(37, 99, 235, 0.05) 100%)',
                        border: '1px solid rgba(37, 99, 235, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#2563eb',
                        boxShadow: '0 2px 8px rgba(37, 99, 235, 0.12)'
                      }}
                    >
                      <Users size={22} />
                    </div>

                    <button
                      type="button"
                      className="flip-trigger-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleKpi('workforce');
                      }}
                      title="Flip card for workforce composition"
                    >
                      <RotateCw size={11} /> Breakdown
                    </button>
                  </div>

                  <div>
                    <div
                      style={{
                        fontFamily: "'Outfit', 'Inter', sans-serif",
                        fontSize: '2.1rem',
                        fontWeight: 800,
                        color: 'var(--color-text)',
                        lineHeight: 1,
                        letterSpacing: '-0.02em'
                      }}
                    >
                      {metrics.totalStaff}
                    </div>
                    <div style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', marginTop: '5px', fontWeight: 600 }}>
                      Department Workforce
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.74rem', fontWeight: 600 }}>
                    <span style={{ padding: '3px 8px', borderRadius: '6px', background: 'rgba(21, 128, 61, 0.1)', color: '#15803d' }}>
                      {metrics.techCount} Techs ({metrics.techPct}%)
                    </span>
                    <span style={{ padding: '3px 8px', borderRadius: '6px', background: 'rgba(37, 99, 235, 0.08)', color: '#2563eb' }}>
                      {metrics.empCount} Staff ({metrics.empPct}%)
                    </span>
                  </div>
                </div>

                {/* BACK */}
                <div
                  className="flip-card-3d-back glass-card"
                  style={{
                    padding: '20px 22px',
                    borderRadius: '16px',
                    background: 'var(--bg-secondary)',
                    border: '1.5px solid rgba(37, 99, 235, 0.4)',
                    borderTop: '4px solid #2563eb',
                    boxShadow: '0 8px 20px rgba(37, 99, 235, 0.12)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Workforce Ratio
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleKpi('workforce')}
                      className="flip-trigger-btn"
                      style={{ border: 'none', background: 'transparent' }}
                    >
                      <RotateCcw size={12} /> Front
                    </button>
                  </div>

                  {/* Dual Segmented Progress Bar */}
                  <div>
                    <div style={{ height: '8px', borderRadius: '4px', background: 'var(--color-elevated)', overflow: 'hidden', display: 'flex', marginBottom: '8px' }}>
                      <div style={{ width: `${metrics.techPct}%`, background: '#15803d' }} title={`Technicians: ${metrics.techPct}%`} />
                      <div style={{ width: `${metrics.empPct}%`, background: '#2563eb' }} title={`Employees: ${metrics.empPct}%`} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--color-text-secondary)' }}>
                      <span>Technicians: <strong>{metrics.techPct}%</strong> ({metrics.techCount})</span>
                      <span>Staff: <strong>{metrics.empPct}%</strong> ({metrics.empCount})</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      handleResetFilters();
                      toggleKpi('workforce');
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 0',
                      borderRadius: '8px',
                      background: 'rgba(37, 99, 235, 0.08)',
                      border: '1px solid rgba(37, 99, 235, 0.22)',
                      color: '#2563eb',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    View Full Directory
                  </button>
                </div>
              </div>
            </div>

            {/* ═══ FLASH CARD 2: Field Technicians ═══ */}
            <div className="flip-card-3d-wrapper interactive-lift" style={{ height: '194px' }}>
              <div className={`flip-card-3d-inner ${flippedKpi.technicians ? 'flipped' : ''}`}>
                {/* FRONT */}
                <div
                  className="flip-card-3d-front glass-card saas-card-mesh-green"
                  style={{
                    padding: '20px 22px',
                    borderRadius: '16px',
                    border: '1px solid var(--color-border-subtle)',
                    borderTop: '4px solid #10b981',
                    boxShadow: '0 4px 14px rgba(15, 23, 42, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                  onClick={() => toggleKpi('technicians')}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.14) 0%, rgba(16, 185, 129, 0.05) 100%)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#059669',
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.12)'
                      }}
                    >
                      <Wrench size={22} />
                    </div>

                    <button
                      type="button"
                      className="flip-trigger-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleKpi('technicians');
                      }}
                      title="Flip card for deployment status"
                    >
                      <RotateCw size={11} /> Deployment
                    </button>
                  </div>

                  <div>
                    <div
                      style={{
                        fontFamily: "'Outfit', 'Inter', sans-serif",
                        fontSize: '2.1rem',
                        fontWeight: 800,
                        color: '#059669',
                        lineHeight: 1,
                        letterSpacing: '-0.02em'
                      }}
                    >
                      {metrics.techCount}
                    </div>
                    <div style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', marginTop: '5px', fontWeight: 600 }}>
                      Field Technicians
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.74rem', fontWeight: 600 }}>
                    <span style={{ padding: '3px 8px', borderRadius: '6px', background: 'rgba(21, 128, 61, 0.1)', color: '#15803d' }}>
                      {metrics.assignedTechsCount} Deployed
                    </span>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: metrics.unassignedTechsCount > 0 ? 'rgba(245, 158, 11, 0.12)' : 'var(--color-elevated)',
                        color: metrics.unassignedTechsCount > 0 ? '#b45309' : 'var(--color-text-muted)'
                      }}
                    >
                      {metrics.unassignedTechsCount} Bench / Free
                    </span>
                  </div>
                </div>

                {/* BACK */}
                <div
                  className="flip-card-3d-back glass-card"
                  style={{
                    padding: '20px 22px',
                    borderRadius: '16px',
                    background: 'var(--bg-secondary)',
                    border: '1.5px solid rgba(16, 185, 129, 0.4)',
                    borderTop: '4px solid #10b981',
                    boxShadow: '0 8px 20px rgba(16, 185, 129, 0.12)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Squad Deployment
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleKpi('technicians')}
                      className="flip-trigger-btn"
                      style={{ border: 'none', background: 'transparent' }}
                    >
                      <RotateCcw size={12} /> Front
                    </button>
                  </div>

                  <div>
                    <div style={{ height: '8px', borderRadius: '4px', background: 'var(--color-elevated)', overflow: 'hidden', display: 'flex', marginBottom: '8px' }}>
                      <div style={{ width: `${metrics.assignedPct}%`, background: '#15803d' }} />
                      <div style={{ width: `${metrics.unassignedPct}%`, background: '#f59e0b' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--color-text-secondary)' }}>
                      <span>In Squads: <strong>{metrics.assignedPct}%</strong></span>
                      <span>Bench / Free: <strong>{metrics.unassignedPct}%</strong></span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setRoleFilter('TECHNICIAN');
                      if (metrics.unassignedTechsCount > 0) {
                        setTeamFilter('UNASSIGNED');
                      } else {
                        setTeamFilter('');
                      }
                      toggleKpi('technicians');
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 0',
                      borderRadius: '8px',
                      background: 'rgba(21, 128, 61, 0.1)',
                      border: '1px solid rgba(21, 128, 61, 0.25)',
                      color: '#15803d',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {metrics.unassignedTechsCount > 0 ? `⚡ Filter ${metrics.unassignedTechsCount} Unassigned` : 'Show All Technicians'}
                  </button>
                </div>
              </div>
            </div>

            {/* ═══ FLASH CARD 3: Department Employees ═══ */}
            <div className="flip-card-3d-wrapper interactive-lift" style={{ height: '194px' }}>
              <div className={`flip-card-3d-inner ${flippedKpi.employees ? 'flipped' : ''}`}>
                {/* FRONT */}
                <div
                  className="flip-card-3d-front glass-card saas-card-mesh-cyan"
                  style={{
                    padding: '20px 22px',
                    borderRadius: '16px',
                    border: '1px solid var(--color-border-subtle)',
                    borderTop: '4px solid #0284c7',
                    boxShadow: '0 4px 14px rgba(15, 23, 42, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                  onClick={() => toggleKpi('employees')}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.14) 0%, rgba(2, 132, 199, 0.05) 100%)',
                        border: '1px solid rgba(2, 132, 199, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#0284c7',
                        boxShadow: '0 2px 8px rgba(2, 132, 199, 0.12)'
                      }}
                    >
                      <UserCheck size={22} />
                    </div>

                    <button
                      type="button"
                      className="flip-trigger-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleKpi('employees');
                      }}
                      title="Flip card for office staff role"
                    >
                      <RotateCw size={11} /> Overview
                    </button>
                  </div>

                  <div>
                    <div
                      style={{
                        fontFamily: "'Outfit', 'Inter', sans-serif",
                        fontSize: '2.1rem',
                        fontWeight: 800,
                        color: 'var(--color-text)',
                        lineHeight: 1,
                        letterSpacing: '-0.02em'
                      }}
                    >
                      {metrics.empCount}
                    </div>
                    <div style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', marginTop: '5px', fontWeight: 600 }}>
                      Department Staff
                    </div>
                  </div>

                  <div style={{ fontSize: '0.74rem', color: '#0284c7', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '6px', background: 'rgba(2, 132, 199, 0.08)' }}>
                      Operations & Administrative Support
                    </span>
                  </div>
                </div>

                {/* BACK */}
                <div
                  className="flip-card-3d-back glass-card"
                  style={{
                    padding: '20px 22px',
                    borderRadius: '16px',
                    background: 'var(--bg-secondary)',
                    border: '1.5px solid rgba(2, 132, 199, 0.4)',
                    borderTop: '4px solid #0284c7',
                    boxShadow: '0 8px 20px rgba(2, 132, 199, 0.12)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Operational Staffing
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleKpi('employees')}
                      className="flip-trigger-btn"
                      style={{ border: 'none', background: 'transparent' }}
                    >
                      <RotateCcw size={12} /> Front
                    </button>
                  </div>

                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-secondary)', lineHeight: 1.45 }}>
                    Members manage operational workflow, log service requests, and confirm ticket resolutions.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setRoleFilter('EMPLOYEE');
                      setTeamFilter('');
                      toggleKpi('employees');
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 0',
                      borderRadius: '8px',
                      background: 'rgba(2, 132, 199, 0.08)',
                      border: '1px solid rgba(2, 132, 199, 0.22)',
                      color: '#0284c7',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Filter Staff Only ({metrics.empCount})
                  </button>
                </div>
              </div>
            </div>

            {/* ═══ FLASH CARD 4: Operational Work Teams ═══ */}
            <div className="flip-card-3d-wrapper interactive-lift" style={{ height: '194px' }}>
              <div className={`flip-card-3d-inner ${flippedKpi.teams ? 'flipped' : ''}`}>
                {/* FRONT */}
                <div
                  className="flip-card-3d-front glass-card saas-card-mesh-indigo"
                  style={{
                    padding: '20px 22px',
                    borderRadius: '16px',
                    border: '1px solid var(--color-border-subtle)',
                    borderTop: '4px solid #6366f1',
                    boxShadow: '0 4px 14px rgba(15, 23, 42, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                  onClick={() => toggleKpi('teams')}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.14) 0%, rgba(99, 102, 241, 0.05) 100%)',
                        border: '1px solid rgba(99, 102, 241, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#4f46e5',
                        boxShadow: '0 2px 8px rgba(99, 102, 241, 0.12)'
                      }}
                    >
                      <Layers size={22} />
                    </div>

                    <button
                      type="button"
                      className="flip-trigger-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleKpi('teams');
                      }}
                      title="Flip card for squad capacity"
                    >
                      <RotateCw size={11} /> Capacity
                    </button>
                  </div>

                  <div>
                    <div
                      style={{
                        fontFamily: "'Outfit', 'Inter', sans-serif",
                        fontSize: '2.1rem',
                        fontWeight: 800,
                        color: 'var(--color-text)',
                        lineHeight: 1,
                        letterSpacing: '-0.02em'
                      }}
                    >
                      {metrics.activeTeams}
                    </div>
                    <div style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', marginTop: '5px', fontWeight: 600 }}>
                      Operational Teams
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.74rem', color: '#4f46e5', fontWeight: 600 }}>
                    <span style={{ padding: '3px 8px', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.08)' }}>
                      {metrics.teamsWithLead} of {teamsList.length} Appointed Leads
                    </span>
                    <span>•</span>
                    <span>~{metrics.avgMembersPerTeam} Techs/Squad</span>
                  </div>
                </div>

                {/* BACK */}
                <div
                  className="flip-card-3d-back glass-card"
                  style={{
                    padding: '20px 22px',
                    borderRadius: '16px',
                    background: 'var(--bg-secondary)',
                    border: '1.5px solid rgba(99, 102, 241, 0.4)',
                    borderTop: '4px solid #6366f1',
                    boxShadow: '0 8px 20px rgba(99, 102, 241, 0.12)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Squad Capacity
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleKpi('teams')}
                      className="flip-trigger-btn"
                      style={{ border: 'none', background: 'transparent' }}
                    >
                      <RotateCcw size={12} /> Front
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '0.76rem', color: 'var(--color-text-secondary)' }}>
                    <div>Leadership Assigned: <strong>{metrics.teamsWithLead} / {teamsList.length} Teams</strong></div>
                    <div>Average Squad Size: <strong>{metrics.avgMembersPerTeam} Technicians</strong></div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      navigate('/organization/teams');
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 0',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(99, 102, 241, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px'
                    }}
                  >
                    <span>Open Work Teams Sub-Item</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── INTERACTIVE SAAS TOOLBAR & FILTERS ── */}
          <div
            className="glass-card"
            style={{
              padding: '16px 20px',
              borderRadius: '14px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--color-border-subtle)',
              boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '14px'
            }}
          >
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Role Filter Pills */}
              <div
                style={{
                  display: 'flex',
                  gap: '4px',
                  background: 'var(--color-elevated)',
                  padding: '4px',
                  borderRadius: '10px',
                  border: '1px solid var(--color-border-subtle)'
                }}
              >
                <button
                  onClick={() => setRoleFilter('ALL')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '7px',
                    border: 'none',
                    background: roleFilter === 'ALL' ? '#ffffff' : 'transparent',
                    color: roleFilter === 'ALL' ? '#2563eb' : 'var(--color-text-muted)',
                    fontWeight: roleFilter === 'ALL' ? 700 : 500,
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    boxShadow: roleFilter === 'ALL' ? '0 1px 4px rgba(0, 0, 0, 0.06)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  All ({staffList.length})
                </button>
                <button
                  onClick={() => setRoleFilter('TECHNICIAN')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '7px',
                    border: 'none',
                    background: roleFilter === 'TECHNICIAN' ? '#ffffff' : 'transparent',
                    color: roleFilter === 'TECHNICIAN' ? '#15803d' : 'var(--color-text-muted)',
                    fontWeight: roleFilter === 'TECHNICIAN' ? 700 : 500,
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: roleFilter === 'TECHNICIAN' ? '0 1px 4px rgba(0, 0, 0, 0.06)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Wrench size={13} /> Technicians ({metrics.techCount})
                </button>
                <button
                  onClick={() => setRoleFilter('EMPLOYEE')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '7px',
                    border: 'none',
                    background: roleFilter === 'EMPLOYEE' ? '#ffffff' : 'transparent',
                    color: roleFilter === 'EMPLOYEE' ? '#0284c7' : 'var(--color-text-muted)',
                    fontWeight: roleFilter === 'EMPLOYEE' ? 700 : 500,
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: roleFilter === 'EMPLOYEE' ? '0 1px 4px rgba(0, 0, 0, 0.06)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <User size={13} /> Staff ({metrics.empCount})
                </button>
              </div>

              {/* Work Team Filter Dropdown */}
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                style={{
                  padding: '7px 12px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: '9px',
                  color: 'var(--color-text)',
                  fontSize: '0.82rem',
                  outline: 'none',
                  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)'
                }}
              >
                <option value="">All Work Teams</option>
                <option value="UNASSIGNED">⚡ Unassigned Only (Bench)</option>
                {teamsList.map(t => (
                  <option key={t.TeamID} value={t.TeamID}>
                    {t.TeamName} ({t.TeamCode})
                  </option>
                ))}
              </select>

              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 10px',
                    borderRadius: '7px',
                    background: 'var(--color-elevated)',
                    border: '1px solid var(--color-border-subtle)',
                    color: 'var(--color-text-muted)',
                    fontSize: '0.76rem',
                    cursor: 'pointer'
                  }}
                >
                  <X size={12} /> Clear Filters
                </button>
              )}
            </div>

            {/* Live Search Input with Instant Clear */}
            <div style={{ position: 'relative', width: '300px' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                type="text"
                placeholder="Search staff by name, email, role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 30px 9px 36px',
                  background: 'var(--color-elevated)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: '9px',
                  color: 'var(--color-text)',
                  fontSize: '0.82rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-text-muted)',
                    cursor: 'pointer',
                    padding: '2px'
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* ── ENTERPRISE DIRECTORY TABLE ── */}
          <div
            className="glass-card"
            style={{
              padding: 0,
              overflow: 'hidden',
              borderRadius: '16px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--color-border-subtle)',
              boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)'
            }}
          >
            {loading ? (
              <div style={{ padding: '52px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                <RefreshCw size={26} className="animate-spin" style={{ margin: '0 auto 12px' }} />
                <div style={{ fontSize: '0.88rem' }}>Loading department personnel directory...</div>
              </div>
            ) : filteredStaff.length === 0 ? (
              <div style={{ padding: '52px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                <Users size={36} style={{ margin: '0 auto 12px', opacity: 0.35 }} />
                <div style={{ fontWeight: 600, fontSize: '0.98rem', color: 'var(--color-text)' }}>
                  No department personnel found matching your filters.
                </div>
                <div style={{ fontSize: '0.82rem', marginTop: '4px' }}>
                  Try adjusting search keywords or selecting "All Personnel".
                </div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--color-elevated)', borderBottom: '1px solid var(--color-border-subtle)', color: 'var(--color-text-muted)' }}>
                      <th style={{ padding: '14px 20px', fontWeight: 600, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Personnel Member</th>
                      <th style={{ padding: '14px 20px', fontWeight: 600, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Role Classification</th>
                      <th style={{ padding: '14px 20px', fontWeight: 600, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Job Title & Profile</th>
                      <th style={{ padding: '14px 20px', fontWeight: 600, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assigned Work Team</th>
                      <th style={{ padding: '14px 20px', fontWeight: 600, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contact Information</th>
                      <th style={{ padding: '14px 20px', fontWeight: 600, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                      <th style={{ padding: '14px 20px', fontWeight: 600, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStaff.map((u) => {
                      const code = (u.UserTypeCode || '').toUpperCase();
                      const roleCodes = (u.Roles || u.roles || []).map(r => (r.RoleCode || r.code || '').toUpperCase());
                      const isTech = code === 'TECHNICIAN' || code === 'PARK_TECHNICIAN' || roleCodes.includes('TECHNICIAN');
                      const initials = `${(u.FirstName || '')[0] || ''}${(u.LastName || '')[0] || ''}`.toUpperCase();

                      // Check if user is appointed team lead
                      const isAppointedLead = teamsList.some(t => String(t.LeaderUserID) === String(u.UserID));

                      return (
                        <tr
                          key={u.UserID}
                          style={{
                            borderBottom: '1px solid var(--color-border-subtle)',
                            transition: 'background 0.15s ease'
                          }}
                        >
                          {/* Member Avatar & Full Name */}
                          <td style={{ padding: '14px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div
                                style={{
                                  width: '38px',
                                  height: '38px',
                                  borderRadius: '50%',
                                  background: isTech
                                    ? 'linear-gradient(135deg, rgba(21, 128, 61, 0.15) 0%, rgba(21, 128, 61, 0.06) 100%)'
                                    : 'linear-gradient(135deg, rgba(37, 99, 235, 0.15) 0%, rgba(37, 99, 235, 0.06) 100%)',
                                  border: `1.5px solid ${isTech ? 'rgba(21, 128, 61, 0.3)' : 'rgba(37, 99, 235, 0.28)'}`,
                                  color: isTech ? '#15803d' : '#2563eb',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 700,
                                  fontSize: '0.82rem',
                                  flexShrink: 0
                                }}
                              >
                                {initials || 'U'}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '0.88rem' }}>
                                  {u.FirstName} {u.LastName}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                  @{u.Username}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Role Classification */}
                          <td style={{ padding: '14px 20px' }}>
                            {isTech ? (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  background: 'rgba(21, 128, 61, 0.1)',
                                  border: '1px solid rgba(21, 128, 61, 0.22)',
                                  color: '#15803d',
                                  fontSize: '0.75rem',
                                  fontWeight: 600
                                }}
                              >
                                <Wrench size={12} /> Field Technician
                              </span>
                            ) : (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  background: 'rgba(37, 99, 235, 0.08)',
                                  border: '1px solid rgba(37, 99, 235, 0.2)',
                                  color: '#2563eb',
                                  fontSize: '0.75rem',
                                  fontWeight: 600
                                }}
                              >
                                <User size={12} /> Department Staff
                              </span>
                            )}
                          </td>

                          {/* Job Title & Profile */}
                          <td style={{ padding: '14px 20px' }}>
                            <div style={{ color: 'var(--color-text)', fontWeight: 500, fontSize: '0.86rem' }}>
                              {u.JobTitle || 'Personnel Member'}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                              {u.Gender ? `${u.Gender}` : ''}{u.Age ? ` • Age ${u.Age}` : ''}
                            </div>
                          </td>

                          {/* Assigned Work Team */}
                          <td style={{ padding: '14px 20px' }}>
                            {u.AssignedTeamName ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    background: 'rgba(99, 102, 241, 0.08)',
                                    border: '1px solid rgba(99, 102, 241, 0.2)',
                                    color: '#4f46e5',
                                    fontSize: '0.75rem',
                                    fontWeight: 600
                                  }}
                                >
                                  <Layers size={12} /> {u.AssignedTeamName}
                                </span>
                                {isAppointedLead && (
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                      padding: '3px 7px',
                                      borderRadius: '5px',
                                      background: 'rgba(217, 119, 6, 0.1)',
                                      border: '1px solid rgba(217, 119, 6, 0.25)',
                                      color: '#b45309',
                                      fontSize: '0.7rem',
                                      fontWeight: 700
                                    }}
                                  >
                                    <Star size={10} fill="#b45309" /> Lead
                                  </span>
                                )}
                              </div>
                            ) : isTech ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    background: 'rgba(245, 158, 11, 0.1)',
                                    border: '1px solid rgba(245, 158, 11, 0.25)',
                                    color: '#b45309',
                                    fontSize: '0.74rem',
                                    fontWeight: 600
                                  }}
                                >
                                  ⚡ Unassigned Bench
                                </span>
                                <button
                                  onClick={() => handleOpenAssignModal(null, u.UserID)}
                                  style={{
                                    padding: '2px 7px',
                                    borderRadius: '5px',
                                    background: 'rgba(37, 99, 235, 0.08)',
                                    border: '1px solid rgba(37, 99, 235, 0.2)',
                                    color: '#2563eb',
                                    fontSize: '0.72rem',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                  }}
                                >
                                  + Assign
                                </button>
                              </div>
                            ) : (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  background: 'var(--color-elevated)',
                                  border: '1px dashed var(--color-border-subtle)',
                                  color: 'var(--color-text-muted)',
                                  fontSize: '0.74rem'
                                }}
                              >
                                Office Staff
                              </span>
                            )}
                          </td>

                          {/* Contact Details */}
                          <td style={{ padding: '14px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text)', fontSize: '0.8rem' }}>
                              <Mail size={12} color="#2563eb" />
                              <span>{u.Email}</span>
                            </div>
                            {u.PhoneNumber && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)', fontSize: '0.76rem', marginTop: '3px' }}>
                                <Phone size={12} />
                                <span>{u.PhoneNumber}</span>
                              </div>
                            )}
                          </td>

                          {/* Status */}
                          <td style={{ padding: '14px 20px' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                fontSize: '0.76rem',
                                fontWeight: 600,
                                color: (u.Status === 'ACTIVE' || u.IsActive === 1) ? '#15803d' : '#b91c1c'
                              }}
                            >
                              <span
                                style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  background: (u.Status === 'ACTIVE' || u.IsActive === 1) ? '#15803d' : '#b91c1c'
                                }}
                              />
                              {(u.Status === 'ACTIVE' || u.IsActive === 1) ? 'Active' : 'Suspended'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                            {isTech && teamsList.length > 0 && (
                              <button
                                onClick={() => {
                                  const defaultTeam = u.AssignedTeamID || (teamsList[0]?.TeamID);
                                  handleOpenAssignModal(defaultTeam, u.UserID);
                                }}
                                className="interactive-hover-card"
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '8px',
                                  background: 'rgba(37, 99, 235, 0.08)',
                                  border: '1px solid rgba(37, 99, 235, 0.22)',
                                  color: '#2563eb',
                                  cursor: 'pointer',
                                  fontSize: '0.76rem',
                                  fontWeight: 600,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px'
                                }}
                              >
                                <Layers size={12} /> {u.AssignedTeamName ? 'Move Team' : 'Assign Team'}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Table Footer Stats Bar */}
            <div
              style={{
                padding: '14px 22px',
                background: 'var(--color-elevated)',
                borderTop: '1px solid var(--color-border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.78rem',
                color: 'var(--color-text-muted)'
              }}
            >
              <div>
                Showing <strong>{filteredStaff.length}</strong> of <strong>{staffList.length}</strong> registered personnel members
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <span>Technicians: <strong style={{ color: '#15803d' }}>{metrics.techCount}</strong></span>
                <span>Staff: <strong style={{ color: '#0284c7' }}>{metrics.empCount}</strong></span>
                <span>Teams: <strong style={{ color: '#4f46e5' }}>{teamsList.length}</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          SUB-ITEM 2: WORK TEAMS & TECHNICIANS (Clean, Direct, Production-Ready)
      ══════════════════════════════════════════════════════════════════ */}
      {isTeamsSubItem && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header Controls Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ position: 'relative', width: '320px' }}>
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                  type="text"
                  placeholder={t('organization.searchWorkTeams', 'Search teams by name or code...')}
                  value={teamSearch}
                  onChange={(e) => setTeamSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 36px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--color-border-subtle)',
                    borderRadius: '10px',
                    color: 'var(--color-text)',
                    fontSize: '0.82rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)'
                  }}
                />
              </div>

              <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                {filteredTeams.length} Operational Work Team{filteredTeams.length === 1 ? '' : 's'}
              </span>
            </div>

            <button
              onClick={handleOpenCreateTeamModal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '0.84rem',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.28)'
              }}
            >
              <Plus size={15} />
              <span>{t('organization.createWorkTeamBtn', 'Create Work Team')}</span>
            </button>
          </div>

          {/* Teams Grid - Clean, Direct, Production Standard Cards */}
          {loading ? (
            <div style={{ padding: '52px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <RefreshCw size={26} className="animate-spin" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontSize: '0.88rem' }}>Loading department work teams...</div>
            </div>
          ) : filteredTeams.length === 0 ? (
            <div
              className="glass-card"
              style={{
                padding: '52px',
                textAlign: 'center',
                color: 'var(--color-text-muted)',
                borderRadius: '16px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--color-border-subtle)'
              }}
            >
              <Briefcase size={38} style={{ margin: '0 auto 12px', opacity: 0.35, color: '#2563eb' }} />
              <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: '1.08rem', color: 'var(--color-text)' }}>
                No Work Teams Created Yet
              </div>
              <div style={{ fontSize: '0.84rem', marginTop: '4px', maxWidth: '440px', margin: '4px auto 18px', lineHeight: 1.5 }}>
                Form your department's specialized technical response teams and assign technicians to handle service requests.
              </div>
              <button
                onClick={handleOpenCreateTeamModal}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 18px',
                  borderRadius: '9px',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <Plus size={15} /> Create First Work Team
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
              {filteredTeams.map((team) => {
                const teamTechnicians = staffList.filter(u => String(u.AssignedTeamID) === String(team.TeamID));

                return (
                  <div
                    key={team.TeamID}
                    className="glass-card interactive-hover-card"
                    style={{
                      padding: '22px',
                      borderRadius: '16px',
                      border: '1px solid var(--color-border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                      background: 'var(--bg-secondary)',
                      boxShadow: '0 3px 12px rgba(15, 23, 42, 0.04)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {/* Team Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '6px',
                              background: 'rgba(37, 99, 235, 0.08)',
                              color: '#2563eb',
                              fontSize: '0.74rem',
                              fontWeight: 700
                            }}
                          >
                            {team.TeamCode}
                          </span>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.74rem',
                              fontWeight: 600,
                              color: team.IsActive ? '#15803d' : '#b91c1c'
                            }}
                          >
                            <span
                              style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: team.IsActive ? '#15803d' : '#b91c1c'
                              }}
                            />
                            {team.IsActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <h3
                          style={{
                            fontFamily: "'Outfit', 'Inter', sans-serif",
                            fontSize: '1.18rem',
                            fontWeight: 700,
                            color: 'var(--color-text)',
                            margin: '6px 0 2px',
                            letterSpacing: '-0.01em'
                          }}
                        >
                          {team.TeamName}
                        </h3>
                        {team.Description && (
                          <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: 1.45 }}>
                            {team.Description}
                          </p>
                        )}
                      </div>

                      {/* Team Edit/Delete */}
                      <ActionGroup>
                        <ActionButton
                          variant="edit"
                          onClick={() => handleOpenEditTeamModal(team)}
                          title="Edit Team"
                        />
                        <ActionButton
                          variant="delete"
                          onClick={() => handleDeleteTeam(team)}
                          title="Delete Team"
                        />
                      </ActionGroup>
                    </div>

                    {/* Appointed Team Leader Banner */}
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: 'var(--color-elevated)',
                        border: '1px solid var(--color-border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Award size={16} color="#d97706" />
                        <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Lead:</span>
                        <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--color-text)' }}>
                          {team.LeaderFullName || 'Unassigned'}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.76rem', color: '#2563eb', fontWeight: 600 }}>
                        {teamTechnicians.length} Member{teamTechnicians.length === 1 ? '' : 's'}
                      </span>
                    </div>

                    {/* Assigned Members Section */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Assigned Technicians ({teamTechnicians.length})
                        </span>
                        <button
                          onClick={() => handleOpenAssignModal(team)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            background: 'rgba(21, 128, 61, 0.1)',
                            border: '1px solid rgba(21, 128, 61, 0.25)',
                            color: '#15803d',
                            fontSize: '0.74rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <Plus size={12} /> Assign Tech
                        </button>
                      </div>

                      {teamTechnicians.length === 0 ? (
                        <div
                          style={{
                            padding: '16px',
                            textAlign: 'center',
                            background: 'var(--color-elevated)',
                            borderRadius: '10px',
                            fontSize: '0.8rem',
                            color: 'var(--color-text-muted)',
                            border: '1px dashed var(--color-border-subtle)'
                          }}
                        >
                          No technicians assigned yet. Click "+ Assign Tech" to add members.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                          {teamTechnicians.map(member => (
                            <div
                              key={member.UserID}
                              style={{
                                padding: '8px 12px',
                                borderRadius: '8px',
                                background: 'var(--color-elevated)',
                                border: '1px solid var(--color-border-subtle)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                                <div
                                  style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '50%',
                                    background: 'rgba(21, 128, 61, 0.12)',
                                    color: '#15803d',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.72rem',
                                    fontWeight: 700
                                  }}
                                >
                                  {(member.FirstName || '')[0]}{(member.LastName || '')[0]}
                                </div>
                                <div>
                                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text)' }}>
                                    {member.FirstName} {member.LastName}
                                  </div>
                                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                                    {member.JobTitle || 'Technician'}
                                  </div>
                                </div>
                              </div>

                              <button
                                onClick={() => handleRemoveMember(team.TeamID, member.UserID, `${member.FirstName} ${member.LastName}`)}
                                title="Remove technician from team"
                                style={{
                                  padding: '4px 9px',
                                  borderRadius: '6px',
                                  background: 'rgba(185, 28, 28, 0.08)',
                                  border: '1px solid rgba(185, 28, 28, 0.22)',
                                  color: '#b91c1c',
                                  cursor: 'pointer',
                                  fontSize: '0.72rem',
                                  fontWeight: 500
                                }}
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL 1: CREATE / EDIT WORK TEAM (Department Locked)
      ══════════════════════════════════════════════════════════════════ */}
      {isTeamModalOpen && (
        <ModalCard
          isOpen={isTeamModalOpen}
          onClose={() => setIsTeamModalOpen(false)}
          title={editingTeam ? 'Edit Operational Work Team' : 'Create Operational Work Team'}
          subtitle={`Organize technical personnel in ${departmentInfo.name}`}
          icon={Briefcase}
          accentStrip="blue"
          maxWidth="540px"
          onSubmit={handleTeamSubmit}
          submitting={submittingTeam}
          submitText={editingTeam ? 'Update Team' : 'Create Team'}
          cancelText="Cancel"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Department Lock Indicator */}
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '9px',
                background: 'rgba(37, 99, 235, 0.08)',
                border: '1px solid rgba(37, 99, 235, 0.22)',
                display: 'flex',
                alignItems: 'center',
                gap: '9px'
              }}
            >
              <Building2 size={16} color="#2563eb" />
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Department:</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)' }}>{departmentInfo.name}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
              <FormField label="Team Code" required error={teamErrors.TeamCode}>
                <input
                  type="text"
                  placeholder="e.g. NET-OPS"
                  value={teamForm.TeamCode}
                  onChange={(e) => setTeamForm({ ...teamForm, TeamCode: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--color-border-subtle)',
                    borderRadius: '8px',
                    color: 'var(--color-text)',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box'
                  }}
                />
              </FormField>

              <FormField label="Team Name" required error={teamErrors.TeamName}>
                <input
                  type="text"
                  placeholder="e.g. Rapid Network Response"
                  value={teamForm.TeamName}
                  onChange={(e) => setTeamForm({ ...teamForm, TeamName: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--color-border-subtle)',
                    borderRadius: '8px',
                    color: 'var(--color-text)',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box'
                  }}
                />
              </FormField>
            </div>

            <FormField label="Description">
              <textarea
                placeholder="Team operational responsibilities and coverage..."
                value={teamForm.Description}
                onChange={(e) => setTeamForm({ ...teamForm, Description: e.target.value })}
                rows={3}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: '8px',
                  color: 'var(--color-text)',
                  fontSize: '0.85rem',
                  boxSizing: 'border-box',
                  resize: 'vertical'
                }}
              />
            </FormField>

            <FormField label="Team Leader (Optional)" icon={Award}>
              <select
                value={teamForm.LeaderUserID}
                onChange={(e) => setTeamForm({ ...teamForm, LeaderUserID: e.target.value })}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: '8px',
                  color: 'var(--color-text)',
                  fontSize: '0.85rem',
                  boxSizing: 'border-box'
                }}
              >
                <option value="">-- No Team Leader Assigned --</option>
                {staffList.map(u => (
                  <option key={u.UserID} value={u.UserID}>
                    {u.FirstName} {u.LastName} ({u.JobTitle || u.UserTypeCode})
                  </option>
                ))}
              </select>
            </FormField>
          </div>
        </ModalCard>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL 2: ASSIGN TECHNICIAN TO TEAM (Department Scoped)
      ══════════════════════════════════════════════════════════════════ */}
      {isAssignModalOpen && (
        <ModalCard
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          title="Assign Technician to Work Team"
          subtitle={`Assign a technician from ${departmentInfo.name} to an operational team`}
          icon={Wrench}
          accentStrip="blue"
          maxWidth="500px"
          error={assignError}
          onSubmit={handleAssignSubmit}
          submitting={submittingAssign}
          submitText="Assign to Team"
          cancelText="Cancel"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Target Work Team Selector */}
            <FormField label="Select Target Work Team" required icon={Layers}>
              <select
                value={selectedTeamIdForAssign}
                onChange={(e) => {
                  setSelectedTeamIdForAssign(e.target.value);
                  if (assignError) setAssignError('');
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: '8px',
                  color: 'var(--color-text)',
                  fontSize: '0.85rem',
                  boxSizing: 'border-box'
                }}
              >
                <option value="">-- Select Work Team --</option>
                {teamsList.map(t => (
                  <option key={t.TeamID} value={t.TeamID}>
                    {t.TeamName} ({t.TeamCode})
                  </option>
                ))}
              </select>
            </FormField>

            {/* Field Technician Selector */}
            <FormField label="Select Department Field Technician" required icon={Wrench}>
              <select
                value={assignTechId}
                onChange={(e) => {
                  setAssignTechId(e.target.value);
                  if (assignError) setAssignError('');
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: '8px',
                  color: 'var(--color-text)',
                  fontSize: '0.85rem',
                  boxSizing: 'border-box'
                }}
              >
                <option value="">-- Select Technician --</option>
                {departmentTechnicians.map(tech => (
                  <option key={tech.UserID} value={tech.UserID}>
                    {tech.FirstName} {tech.LastName} ({tech.JobTitle || 'Technician'}) {tech.AssignedTeamName ? `• Currently: ${tech.AssignedTeamName}` : '• (Unassigned)'}
                  </option>
                ))}
              </select>
            </FormField>

            {/* Role in Team */}
            <FormField label="Role Inside Work Team" icon={Award}>
              <select
                value={assignRoleInTeam}
                onChange={(e) => setAssignRoleInTeam(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: '8px',
                  color: 'var(--color-text)',
                  fontSize: '0.85rem',
                  boxSizing: 'border-box'
                }}
              >
                <option value="MEMBER">Team Member</option>
                <option value="LEAD">Team Lead / Primary Contact</option>
                <option value="SPECIALIST">Technical Specialist</option>
              </select>
            </FormField>
          </div>
        </ModalCard>
      )}

      {/* Confirmation & Alert Dialog Modals */}
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
