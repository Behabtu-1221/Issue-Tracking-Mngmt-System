import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  Plus,
  Search,
  Building2,
  Users,
  Award,
  Edit2,
  Trash2,
  GitFork,
  Star,
  Calendar,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import orgApi from '../api/orgApi';
import identityApi from '../../identity-access/api/identityApi';
import ConfirmDialogModal from '../../../components/common/ConfirmDialogModal';
import AlertDialogModal from '../../../components/common/AlertDialogModal';
import { ModalCard } from '../../../components/common/ModalCard';
import { ActionButton, ActionGroup } from '../../../components/common/ActionButton';
import { FormField } from '../../../components/common/FormField';
import { orgSchemas } from '../../../validation';
import { useTranslation } from '../../../i18n/LanguageContext';

export default function EmployeeAssignmentsTab({ onRefreshMetrics }) {
  const { t } = useTranslation();
  const [subSection, setSubSection] = useState('assignments'); // 'assignments' | 'hierarchies'
  const [assignments, setAssignments] = useState([]);
  const [hierarchies, setHierarchies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [positions, setPositions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState('');

  // Modals
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isHierarchyModalOpen, setIsHierarchyModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [editingHierarchy, setEditingHierarchy] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [assignErrors, setAssignErrors] = useState({});
  const [hierarchyErrors, setHierarchyErrors] = useState({});

  const clearAssignError = (field) => {
    if (assignErrors[field]) {
      setAssignErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const clearHierarchyError = (field) => {
    if (hierarchyErrors[field]) {
      setHierarchyErrors(prev => {
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
  const [assignForm, setAssignForm] = useState({
    UserID: '',
    DepartmentID: '',
    TeamID: '',
    PositionID: '',
    IsPrimary: 1,
    JoinedDate: new Date().toISOString().split('T')[0],
    IsActive: 1
  });

  const [hierarchyForm, setHierarchyForm] = useState({
    EmployeeUserID: '',
    SupervisorUserID: '',
    ReportingTypeCode: 'DIRECT',
    IsActive: 1
  });

  useEffect(() => {
    fetchDepartments();
    fetchTeams();
    fetchPositions();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (subSection === 'assignments') fetchAssignments();
    else fetchHierarchies();
  }, [subSection, deptFilter]);

  const fetchDepartments = async () => {
    try {
      const res = await orgApi.getDepartments({ limit: 200 });
      setDepartments(res.data?.data?.departments || res.data?.data || []);
    } catch (err) { console.error('Failed to fetch departments', err); }
  };

  const fetchTeams = async () => {
    try {
      const res = await orgApi.getTeams({ limit: 200 });
      setTeams(res.data?.data?.teams || res.data?.data || []);
    } catch (err) { console.error('Failed to fetch teams', err); }
  };

  const fetchPositions = async () => {
    try {
      const res = await orgApi.getPositions({ limit: 200 });
      setPositions(res.data?.data?.positions || res.data?.data || []);
    } catch (err) { console.error('Failed to fetch positions', err); }
  };

  const fetchUsers = async () => {
    try {
      const res = await identityApi.getUsers({ limit: 100 });
      setUsers(res.data?.data?.users || res.data?.data || []);
    } catch (err) { console.error('Failed to fetch users', err); }
  };

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await orgApi.getAssignments({ departmentId: deptFilter });
      setAssignments(res.data?.data?.assignments || res.data?.data || []);
    } catch (err) { console.error('Failed to fetch assignments', err); }
    finally { setLoading(false); }
  };

  const fetchHierarchies = async () => {
    try {
      setLoading(true);
      const res = await orgApi.getHierarchies({});
      setHierarchies(res.data?.data?.hierarchies || res.data?.data || []);
    } catch (err) { console.error('Failed to fetch hierarchies', err); }
    finally { setLoading(false); }
  };

  // ── Assignment Handlers ──
  const handleOpenAssignCreate = () => {
    setEditingAssignment(null);
    setAssignForm({
      UserID: '',
      DepartmentID: departments[0]?.DepartmentID || '',
      TeamID: '',
      PositionID: '',
      IsPrimary: 1,
      JoinedDate: new Date().toISOString().split('T')[0],
      IsActive: 1
    });
    setErrorMsg('');
    setAssignErrors({});
    setIsAssignModalOpen(true);
  };

  const handleOpenAssignEdit = (a) => {
    setEditingAssignment(a);
    setAssignForm({
      UserID: a.UserID,
      DepartmentID: a.DepartmentID,
      TeamID: a.TeamID || '',
      PositionID: a.PositionID || '',
      IsPrimary: a.IsPrimary,
      JoinedDate: a.JoinedDate ? a.JoinedDate.split('T')[0] : '',
      IsActive: a.IsActive !== undefined ? a.IsActive : 1
    });
    setErrorMsg('');
    setAssignErrors({});
    setIsAssignModalOpen(true);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const validation = orgSchemas.assignmentForm(assignForm, !!editingAssignment);
    if (!validation.isValid) {
      setAssignErrors(validation.errors);
      return;
    }
    setAssignErrors({});

    try {
      if (editingAssignment) {
        await orgApi.updateAssignment(editingAssignment.EmployeeAssignmentID, validation.sanitized);
      } else {
        await orgApi.createAssignment(validation.sanitized);
      }
      setIsAssignModalOpen(false);
      fetchAssignments();
      if (onRefreshMetrics) onRefreshMetrics();
      showAlert(
        editingAssignment ? 'Assignment Updated' : 'Assignment Created',
        'Employee assignment saved successfully.',
        'success'
      );
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleAssignDelete = (id) => {
    setConfirmConfig({
      isOpen: true,
      title: t('organization.assignmentsTab.removeAssignmentTitle', 'Remove Assignment'),
      message: t('organization.assignmentsTab.removeAssignmentConfirm', 'Are you sure you want to remove this employee assignment? This action cannot be undone.'),
      type: 'danger',
      confirmText: t('organization.assignmentsTab.removeAssignmentTitle', 'Remove Assignment'),
      onConfirm: async () => {
        try {
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          await orgApi.deleteAssignment(id);
          fetchAssignments();
          if (onRefreshMetrics) onRefreshMetrics();
        } catch (err) {
          showAlert('Action Restricted', err.response?.data?.message || 'Failed to delete assignment', 'error');
        }
      }
    });
  };

  // ── Hierarchy Handlers ──
  const handleOpenHierarchyCreate = () => {
    setEditingHierarchy(null);
    setHierarchyForm({
      EmployeeUserID: '',
      SupervisorUserID: '',
      ReportingTypeCode: 'DIRECT',
      IsActive: 1
    });
    setErrorMsg('');
    setHierarchyErrors({});
    setIsHierarchyModalOpen(true);
  };

  const handleOpenHierarchyEdit = (h) => {
    setEditingHierarchy(h);
    setHierarchyForm({
      EmployeeUserID: h.EmployeeUserID,
      SupervisorUserID: h.SupervisorUserID,
      ReportingTypeCode: h.ReportingTypeCode || 'DIRECT',
      IsActive: h.IsActive !== undefined ? h.IsActive : 1
    });
    setErrorMsg('');
    setHierarchyErrors({});
    setIsHierarchyModalOpen(true);
  };

  const handleHierarchySubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const validation = orgSchemas.hierarchyForm(hierarchyForm);
    if (!validation.isValid) {
      setHierarchyErrors(validation.errors);
      return;
    }
    setHierarchyErrors({});

    try {
      if (editingHierarchy) {
        await orgApi.updateHierarchy(editingHierarchy.ReportingHierarchyID, validation.sanitized);
      } else {
        await orgApi.createHierarchy(validation.sanitized);
      }
      setIsHierarchyModalOpen(false);
      fetchHierarchies();
      showAlert(
        editingHierarchy ? 'Reporting Link Updated' : 'Reporting Link Created',
        'Reporting hierarchy link established successfully.',
        'success'
      );
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleHierarchyDelete = (id) => {
    setConfirmConfig({
      isOpen: true,
      title: t('organization.assignmentsTab.removeLinkTitle', 'Remove Reporting Link'),
      message: t('organization.assignmentsTab.removeLinkConfirm', 'Are you sure you want to remove this reporting hierarchy link? This will affect organizational structure visibility.'),
      type: 'danger',
      confirmText: t('organization.assignmentsTab.removeLinkTitle', 'Remove Link'),
      onConfirm: async () => {
        try {
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          await orgApi.deleteHierarchy(id);
          fetchHierarchies();
        } catch (err) {
          showAlert('Action Restricted', err.response?.data?.message || 'Failed to delete reporting link', 'error');
        }
      }
    });
  };

  // Filter teams by selected department in form
  const filteredTeams = assignForm.DepartmentID
    ? teams.filter((t) => String(t.DepartmentID) === String(assignForm.DepartmentID))
    : teams;

  const reportingTypes = [
    { value: 'DIRECT', label: t('organization.assignmentsTab.directReport', 'Direct Report') },
    { value: 'DOTTED', label: t('organization.assignmentsTab.dottedLine', 'Dotted Line') },
    { value: 'MATRIX', label: t('organization.assignmentsTab.matrix', 'Matrix') },
    { value: 'FUNCTIONAL', label: t('organization.assignmentsTab.functional', 'Functional') }
  ];

  return (
    <div>
      {/* Sub-section Navigation & Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-secondary)', padding: '4px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--glass-border)' }}>
            <button
              onClick={() => setSubSection('assignments')}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--border-radius-sm)',
                border: 'none',
                background: subSection === 'assignments' ? 'var(--accent-gradient)' : 'transparent',
                color: subSection === 'assignments' ? '#ffffff' : 'var(--text-muted)',
                fontWeight: subSection === 'assignments' ? '600' : '500',
                cursor: 'pointer',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <UserPlus size={14} /> {t('organization.assignmentsTab.assignmentsTabBtn', 'Employee Assignments')}
            </button>
            <button
              onClick={() => setSubSection('hierarchies')}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--border-radius-sm)',
                border: 'none',
                background: subSection === 'hierarchies' ? 'var(--accent-gradient)' : 'transparent',
                color: subSection === 'hierarchies' ? '#ffffff' : 'var(--text-muted)',
                fontWeight: subSection === 'hierarchies' ? '600' : '500',
                cursor: 'pointer',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <GitFork size={14} /> {t('organization.assignmentsTab.hierarchiesTabBtn', 'Reporting Hierarchies')}
            </button>
          </div>

          {subSection === 'assignments' && (
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
              <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{t('organization.assignmentsTab.allDepartments', 'All Departments')}</option>
              {departments.map((d) => (
                <option key={d.DepartmentID} value={d.DepartmentID} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                  {d.DepartmentName}
                </option>
              ))}
            </select>
          )}
        </div>

        <button
          onClick={subSection === 'assignments' ? handleOpenAssignCreate : handleOpenHierarchyCreate}
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
          <Plus size={16} /> {subSection === 'assignments' ? t('organization.assignmentsTab.assignStaffBtn', 'Assign Employee') : t('organization.assignmentsTab.addReportingLinkBtn', 'Add Reporting Link')}
        </button>
      </div>

      {/* Directory Table */}
      {subSection === 'assignments' ? (
        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>{t('organization.assignmentsTab.loadingAssignments', 'Loading employee assignments...')}</div>
          ) : assignments.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>{t('organization.assignmentsTab.emptyAssignments', 'No assignments found. Assign employees to departments to get started.')}</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '16px 20px' }}>{t('organization.assignmentsTab.thEmployee', 'Employee')}</th>
                  <th style={{ padding: '16px 20px' }}>{t('organization.assignmentsTab.thDepartment', 'Department')}</th>
                  <th style={{ padding: '16px 20px' }}>{t('organization.assignmentsTab.thTeam', 'Team')}</th>
                  <th style={{ padding: '16px 20px' }}>{t('organization.assignmentsTab.thPosition', 'Position')}</th>
                  <th style={{ padding: '16px 20px' }}>{t('organization.assignmentsTab.thEffectiveDate', 'Joined')}</th>
                  <th style={{ padding: '16px 20px' }}>{t('organization.assignmentsTab.thPrimary', 'Primary')}</th>
                  <th style={{ padding: '16px 20px', textAlign: 'right' }}>{t('organization.assignmentsTab.thActions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => (
                  <tr key={a.EmployeeAssignmentID} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{a.EmployeeFullName?.trim() || a.Username}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.Email}</div>
                    </td>
                    <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Building2 size={14} color="var(--accent-primary)" />
                        {a.DepartmentName}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{a.OrganizationUnitName}</div>
                    </td>
                    <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>
                      {a.TeamName ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Users size={14} color="#60a5fa" />
                          {a.TeamName}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>
                      {a.PositionTitle ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Award size={14} color="#a78bfa" />
                          {a.PositionTitle}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                      {a.JoinedDate ? new Date(a.JoinedDate).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      {a.IsPrimary ? (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          padding: '3px 10px', borderRadius: '12px',
                          background: 'rgba(250, 204, 21, 0.15)', border: '1px solid rgba(250, 204, 21, 0.3)',
                          color: '#fbbf24', fontSize: '0.75rem', fontWeight: '600'
                        }}>
                          <Star size={10} /> {t('organization.assignmentsTab.primaryBadge', 'Primary')}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{t('organization.assignmentsTab.secondaryBadge', 'Secondary')}</span>
                      )}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <ActionGroup align="right">
                        <ActionButton
                          variant="edit"
                          onClick={() => handleOpenAssignEdit(a)}
                          title={t('common.edit')}
                        />
                        <ActionButton
                          variant="delete"
                          onClick={() => handleAssignDelete(a.EmployeeAssignmentID)}
                          title={t('common.delete')}
                        />
                      </ActionGroup>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        /* Reporting Hierarchies Table */
        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>{t('organization.assignmentsTab.loadingHierarchies', 'Loading reporting hierarchies...')}</div>
          ) : hierarchies.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>{t('organization.assignmentsTab.emptyHierarchies', 'No reporting links defined. Create reporting hierarchies to define management chains.')}</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '16px 20px' }}>{t('organization.assignmentsTab.thEmployee', 'Employee')}</th>
                  <th style={{ padding: '16px 20px' }}>{t('organization.assignmentsTab.thReportingRel', 'Reporting Relationship')}</th>
                  <th style={{ padding: '16px 20px' }}>{t('organization.assignmentsTab.thSupervisor', 'Supervisor')}</th>
                  <th style={{ padding: '16px 20px' }}>{t('organization.assignmentsTab.thType', 'Type')}</th>
                  <th style={{ padding: '16px 20px' }}>{t('organization.assignmentsTab.thStatus', 'Status')}</th>
                  <th style={{ padding: '16px 20px', textAlign: 'right' }}>{t('organization.assignmentsTab.thActions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {hierarchies.map((h) => (
                  <tr key={h.ReportingHierarchyID} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{h.EmployeeFullName?.trim() || h.EmployeeUsername}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{h.EmployeeUsername}</div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                        <ArrowRight size={16} color="#818cf8" />
                        <span style={{ fontSize: '0.78rem' }}>{t('organization.assignmentsTab.reportsTo', 'reports to')}</span>
                        <ArrowRight size={16} color="#818cf8" />
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: '600', color: '#4ade80' }}>{h.SupervisorFullName?.trim() || h.SupervisorUsername}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{h.SupervisorUsername}</div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600',
                        background: h.ReportingTypeCode === 'DIRECT' ? 'rgba(99, 102, 241, 0.15)' :
                                    h.ReportingTypeCode === 'DOTTED' ? 'rgba(245, 158, 11, 0.15)' :
                                    h.ReportingTypeCode === 'MATRIX' ? 'rgba(236, 72, 153, 0.15)' :
                                    'rgba(34, 197, 94, 0.15)',
                        border: `1px solid ${h.ReportingTypeCode === 'DIRECT' ? 'rgba(99, 102, 241, 0.3)' :
                                             h.ReportingTypeCode === 'DOTTED' ? 'rgba(245, 158, 11, 0.3)' :
                                             h.ReportingTypeCode === 'MATRIX' ? 'rgba(236, 72, 153, 0.3)' :
                                             'rgba(34, 197, 94, 0.3)'}`,
                        color: h.ReportingTypeCode === 'DIRECT' ? '#818cf8' :
                               h.ReportingTypeCode === 'DOTTED' ? '#f59e0b' :
                               h.ReportingTypeCode === 'MATRIX' ? '#f472b6' :
                               '#4ade80'
                      }}>
                        {reportingTypes.find(t => t.value === h.ReportingTypeCode)?.label || h.ReportingTypeCode}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      {h.IsActive ? <span className="badge badge-success">{t('organization.assignmentsTab.activeBadge', 'Active')}</span> : <span className="badge badge-danger">{t('organization.assignmentsTab.inactiveBadge', 'Inactive')}</span>}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <ActionGroup align="right">
                        <ActionButton
                          variant="edit"
                          onClick={() => handleOpenHierarchyEdit(h)}
                          title={t('common.edit')}
                        />
                        <ActionButton
                          variant="delete"
                          onClick={() => handleHierarchyDelete(h.ReportingHierarchyID)}
                          title={t('common.delete')}
                        />
                      </ActionGroup>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modal: Create/Edit Employee Assignment */}
      {isAssignModalOpen && (
        <ModalCard
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          title={editingAssignment ? t('organization.assignmentsTab.editModalTitle', 'Edit Employee Assignment') : t('organization.assignmentsTab.createAssignmentTitle', 'Assign Employee to Department')}
          subtitle="Assign personnel to departmental unit, operational team, and job role"
          icon={UserPlus}
          accentStrip="brand"
          maxWidth="560px"
          error={errorMsg}
          onSubmit={handleAssignSubmit}
          submitText={editingAssignment ? t('organization.assignmentsTab.saveChangesBtn', 'Save Changes') : t('organization.assignmentsTab.assignStaffBtn', 'Assign Employee')}
          cancelText={t('organization.assignmentsTab.cancelBtn', 'Cancel')}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {!editingAssignment && (
              <FormField
                label={t('organization.assignmentsTab.selectUserLabel', 'Employee')}
                required
                icon={UserPlus}
                error={assignErrors.UserID}
                id="assign-user-id"
              >
                <select
                  id="assign-user-id"
                  value={assignForm.UserID}
                  onChange={(e) => {
                    setAssignForm({ ...assignForm, UserID: e.target.value });
                    clearAssignError('UserID');
                  }}
                  className={`enterprise-input ${assignErrors.UserID ? 'input-error' : ''}`}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'var(--bg-tertiary)',
                    border: assignErrors.UserID ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)'
                  }}
                >
                  <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{t('organization.assignmentsTab.selectEmployee', 'Select Employee')}</option>
                  {users.map((u) => (
                    <option key={u.UserID} value={u.UserID} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                      {u.FirstName ? `${u.FirstName} ${u.LastName}` : u.Username} ({u.Email})
                    </option>
                  ))}
                </select>
              </FormField>
            )}

            <FormField
              label={t('organization.assignmentsTab.selectDeptLabel', 'Department')}
              required
              icon={Building2}
              error={assignErrors.DepartmentID}
              id="assign-department-id"
            >
              <select
                id="assign-department-id"
                value={assignForm.DepartmentID}
                onChange={(e) => {
                  setAssignForm({ ...assignForm, DepartmentID: e.target.value, TeamID: '' });
                  clearAssignError('DepartmentID');
                }}
                className={`enterprise-input ${assignErrors.DepartmentID ? 'input-error' : ''}`}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'var(--bg-tertiary)',
                  border: assignErrors.DepartmentID ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{t('organization.assignmentsTab.selectDepartment', 'Select Department')}</option>
                {departments.map((d) => (
                  <option key={d.DepartmentID} value={d.DepartmentID} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                    {d.DepartmentName} ({d.DepartmentCode})
                  </option>
                ))}
              </select>
            </FormField>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <FormField
                label={t('organization.assignmentsTab.teamOptional', 'Team (Optional)')}
                icon={Users}
                error={assignErrors.TeamID}
                id="assign-team-id"
              >
                <select
                  id="assign-team-id"
                  value={assignForm.TeamID}
                  onChange={(e) => {
                    setAssignForm({ ...assignForm, TeamID: e.target.value });
                    clearAssignError('TeamID');
                  }}
                  className={`enterprise-input ${assignErrors.TeamID ? 'input-error' : ''}`}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'var(--bg-tertiary)',
                    border: assignErrors.TeamID ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)'
                  }}
                >
                  <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{t('organization.assignmentsTab.noTeam', '-- No Team --')}</option>
                  {filteredTeams.map((team) => (
                    <option key={team.TeamID} value={team.TeamID} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                      {team.TeamName} ({team.TeamCode})
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField
                label={t('organization.assignmentsTab.positionOptional', 'Position (Optional)')}
                icon={Award}
                error={assignErrors.PositionID}
                id="assign-position-id"
              >
                <select
                  id="assign-position-id"
                  value={assignForm.PositionID}
                  onChange={(e) => {
                    setAssignForm({ ...assignForm, PositionID: e.target.value });
                    clearAssignError('PositionID');
                  }}
                  className={`enterprise-input ${assignErrors.PositionID ? 'input-error' : ''}`}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'var(--bg-tertiary)',
                    border: assignErrors.PositionID ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)'
                  }}
                >
                  <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{t('organization.assignmentsTab.noPosition', '-- No Position --')}</option>
                  {positions.map((p) => (
                    <option key={p.PositionID} value={p.PositionID} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                      {p.PositionTitle} ({p.PositionCode})
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <FormField
                label={t('organization.assignmentsTab.joinedDate', 'Joined Date')}
                required
                icon={Calendar}
                error={assignErrors.JoinedDate}
                id="assign-joined-date"
              >
                <input
                  id="assign-joined-date"
                  type="date"
                  value={assignForm.JoinedDate}
                  onChange={(e) => {
                    setAssignForm({ ...assignForm, JoinedDate: e.target.value });
                    clearAssignError('JoinedDate');
                  }}
                  className={`enterprise-input ${assignErrors.JoinedDate ? 'input-error' : ''}`}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'var(--bg-tertiary)',
                    border: assignErrors.JoinedDate ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)'
                  }}
                />
              </FormField>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>{t('organization.assignmentsTab.primaryAssignmentLabel', 'Primary Assignment?')}</label>
                <div style={{ display: 'flex', gap: '12px', paddingTop: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    <input type="radio" name="isPrimary" checked={assignForm.IsPrimary === 1} onChange={() => setAssignForm({ ...assignForm, IsPrimary: 1 })} />
                    {t('organization.assignmentsTab.yesPrimary', 'Yes (Primary)')}
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    <input type="radio" name="isPrimary" checked={assignForm.IsPrimary === 0} onChange={() => setAssignForm({ ...assignForm, IsPrimary: 0 })} />
                    {t('organization.assignmentsTab.noSecondary', 'No')}
                  </label>
                </div>
              </div>
            </div>
          </div>
        </ModalCard>
      )}

      {/* Modal: Create/Edit Reporting Hierarchy */}
      {isHierarchyModalOpen && (
        <ModalCard
          isOpen={isHierarchyModalOpen}
          onClose={() => setIsHierarchyModalOpen(false)}
          title={editingHierarchy ? t('organization.assignmentsTab.editHierarchyTitle', 'Edit Reporting Link') : t('organization.assignmentsTab.createHierarchyTitle', 'Create Reporting Link')}
          subtitle="Configure managerial supervisory chain and reporting relationship"
          icon={GitFork}
          accentStrip="purple"
          maxWidth="540px"
          error={errorMsg}
          onSubmit={handleHierarchySubmit}
          submitText={editingHierarchy ? t('organization.assignmentsTab.saveChangesBtn', 'Save Changes') : t('organization.assignmentsTab.createLinkBtn', 'Create Link')}
          cancelText={t('organization.assignmentsTab.cancelBtn', 'Cancel')}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <FormField
              label={t('organization.assignmentsTab.employeeReportsToLabel', 'Employee (Reports To)')}
              required
              icon={UserPlus}
              error={hierarchyErrors.EmployeeUserID}
              id="hierarchy-employee-user-id"
            >
              <select
                id="hierarchy-employee-user-id"
                value={hierarchyForm.EmployeeUserID}
                onChange={(e) => {
                  setHierarchyForm({ ...hierarchyForm, EmployeeUserID: e.target.value });
                  clearHierarchyError('EmployeeUserID');
                  if (hierarchyErrors.SupervisorUserID) clearHierarchyError('SupervisorUserID');
                }}
                disabled={!!editingHierarchy}
                className={`enterprise-input ${hierarchyErrors.EmployeeUserID ? 'input-error' : ''}`}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'var(--bg-tertiary)',
                  border: hierarchyErrors.EmployeeUserID ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  opacity: editingHierarchy ? 0.6 : 1
                }}
              >
                <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{t('organization.assignmentsTab.selectEmployee', 'Select Employee')}</option>
                {users.map((u) => (
                  <option key={u.UserID} value={u.UserID} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                    {u.FirstName ? `${u.FirstName} ${u.LastName}` : u.Username} ({u.Email})
                  </option>
                ))}
              </select>
            </FormField>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              <div style={{ flex: 1, borderBottom: '1px dashed var(--glass-border)' }}></div>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><ArrowRight size={14} color="#818cf8" /> {t('organization.assignmentsTab.reportsTo', 'reports to')} <ArrowRight size={14} color="#818cf8" /></span>
              <div style={{ flex: 1, borderBottom: '1px dashed var(--glass-border)' }}></div>
            </div>

            <FormField
              label={t('organization.assignmentsTab.supervisorLabel', 'Supervisor')}
              required
              icon={UserCheck}
              error={hierarchyErrors.SupervisorUserID}
              id="hierarchy-supervisor-user-id"
            >
              <select
                id="hierarchy-supervisor-user-id"
                value={hierarchyForm.SupervisorUserID}
                onChange={(e) => {
                  setHierarchyForm({ ...hierarchyForm, SupervisorUserID: e.target.value });
                  clearHierarchyError('SupervisorUserID');
                }}
                disabled={!!editingHierarchy}
                className={`enterprise-input ${hierarchyErrors.SupervisorUserID ? 'input-error' : ''}`}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'var(--bg-tertiary)',
                  border: hierarchyErrors.SupervisorUserID ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  opacity: editingHierarchy ? 0.6 : 1
                }}
              >
                <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{t('organization.assignmentsTab.selectSupervisor', 'Select Supervisor')}</option>
                {users.map((u) => (
                  <option key={u.UserID} value={u.UserID} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                    {u.FirstName ? `${u.FirstName} ${u.LastName}` : u.Username} ({u.Email})
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              label={t('organization.assignmentsTab.reportingTypeLabel', 'Reporting Type')}
              required
              icon={GitFork}
              error={hierarchyErrors.ReportingTypeCode}
              id="hierarchy-reporting-type"
            >
              <select
                id="hierarchy-reporting-type"
                value={hierarchyForm.ReportingTypeCode}
                onChange={(e) => {
                  setHierarchyForm({ ...hierarchyForm, ReportingTypeCode: e.target.value });
                  clearHierarchyError('ReportingTypeCode');
                }}
                className={`enterprise-input ${hierarchyErrors.ReportingTypeCode ? 'input-error' : ''}`}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'var(--bg-tertiary)',
                  border: hierarchyErrors.ReportingTypeCode ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)'
                }}
              >
                {reportingTypes.map((rt) => (
                  <option key={rt.value} value={rt.value} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{rt.label}</option>
                ))}
              </select>
            </FormField>
          </div>
        </ModalCard>
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
