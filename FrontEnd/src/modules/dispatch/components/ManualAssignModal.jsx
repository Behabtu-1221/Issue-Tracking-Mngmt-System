import React, { useState, useEffect } from 'react';
import { X, UserCheck, Users, Zap, ShieldAlert, FileText, CheckCircle2, Clock, Wrench, Sparkles, RefreshCw, AlertTriangle, ArrowRight, User } from 'lucide-react';
import dispatchApi from '../api/dispatchApi';
import AlertDialogModal from '../../../components/common/AlertDialogModal';
import { FormField } from '../../../components/common/FormField';
import { dispatchSchemas } from '../../../validation';

export default function ManualAssignModal({ request, onClose, onAssigned }) {
  const [assignMode, setAssignMode] = useState('INDIVIDUAL'); // 'INDIVIDUAL' | 'TEAM'
  const [technicians, setTechnicians] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedTechId, setSelectedTechId] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Glass Alert Modal State
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'error' });

  const showAlert = (title, message, type = 'error') => {
    setAlertConfig({ isOpen: true, title, message, type });
  };

  const clearFieldError = (fieldName) => {
    if (fieldErrors[fieldName]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    }
  };

  const handleClose = () => {
    setFieldErrors({});
    onClose();
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const [techRes, teamRes] = await Promise.allSettled([
        dispatchApi.getTechnicians(request?.AssignedDepartmentID ? { departmentId: request.AssignedDepartmentID } : {}),
        dispatchApi.getTeamsWorkloadSummary()
      ]);

      const list = techRes.status === 'fulfilled' ? (techRes.value.data?.data?.technicians || techRes.value.data?.data || []) : [];
      const teamList = teamRes.status === 'fulfilled' ? (teamRes.value.data?.data || []) : [];

      setTechnicians(Array.isArray(list) ? list : []);
      setTeams(Array.isArray(teamList) ? teamList : []);

      if (list.length > 0) setSelectedTechId(list[0].UserID);
      if (teamList.length > 0) setSelectedTeamId(teamList[0].TeamID);
    } catch (err) {
      console.error('Failed to fetch assignment options', err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    const validation = dispatchSchemas.manualAssignForm({
      RequestID: request.IssueRequestID || request.id,
      assignMode,
      AssignedUserID: assignMode === 'INDIVIDUAL' ? selectedTechId : undefined,
      AssignedTeamID: assignMode === 'TEAM' ? selectedTeamId : undefined,
      Remarks: remarks
    });

    if (request?.StatusCode && request.StatusCode !== 'APPROVED') {
      const msg = `Cannot assign: Request is currently in '${request.StatusCode}' status. It must complete all required approvals and be in 'APPROVED' status before technician assignment.`;
      setErrorMsg(msg);
      showAlert('Approval Required', msg, 'warning');
      return;
    }

    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      return;
    }

    setFieldErrors({});
    try {
      setSubmitting(true);
      setErrorMsg('');
      if (assignMode === 'TEAM') {
        const teamObj = teams.find((t) => t.TeamID == selectedTeamId);
        await dispatchApi.manualAssign({
          RequestID: validation.sanitized.RequestID,
          AssignedTeamID: validation.sanitized.AssignedTeamID,
          AssignedUserID: teamObj?.LeaderUserID ? Number(teamObj.LeaderUserID) : undefined,
          Remarks: validation.sanitized.Remarks || `Assigned to ${teamObj?.TeamName || 'Technician Work Team'}`
        });
      } else {
        await dispatchApi.manualAssign({
          RequestID: validation.sanitized.RequestID,
          AssignedUserID: validation.sanitized.AssignedUserID,
          Remarks: validation.sanitized.Remarks || `Manually dispatched to technician ID #${selectedTechId}`
        });
      }
      onAssigned();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to assign request';
      setErrorMsg(msg);
      showAlert('Dispatch Error', msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutoRouteSubmit = async () => {
    try {
      setSubmitting(true);
      setErrorMsg('');
      await dispatchApi.autoAssign({ RequestID: request.IssueRequestID || request.id });
      onAssigned();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to auto-route request';
      setErrorMsg(msg);
      showAlert('Auto-Route Failed', msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!request) return null;

  const getPriorityBadge = (priorityStr) => {
    const p = (priorityStr || '').toUpperCase();
    switch (p) {
      case 'CRITICAL':
      case 'URGENT':
        return { label: p, bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: 'rgba(239, 68, 68, 0.3)' };
      case 'HIGH':
        return { label: 'HIGH', bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' };
      default:
        return { label: p || 'MEDIUM', bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' };
    }
  };

  const pBadge = getPriorityBadge(request.PriorityCode);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '24px'
    }}>
      <div
        style={{
          width: '100%',
          maxWidth: '980px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '0',
          borderRadius: '24px',
          border: '1px solid rgba(138, 75, 255, 0.35)',
          overflow: 'hidden',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.6), 0 0 40px rgba(138, 75, 255, 0.2)',
          background: 'var(--bg-secondary)',
          animation: 'fadeIn 0.25s ease-out',
          position: 'relative'
        }}
      >
        {/* Top Multi-Tone Brand Line Accent */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
          background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 40%, #0284c7 75%, #10b981 100%)',
          zIndex: 10
        }} />

        {/* Modal Header */}
        <div style={{
          padding: '20px 28px',
          borderBottom: '1px solid var(--glass-border)',
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '14px',
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              color: '#ffffff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 6px 18px rgba(99, 102, 241, 0.35)'
            }}>
              <Wrench size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--accent-primary)', letterSpacing: '0.5px' }}>
                  DISPATCH GATEWAY • {request.RequestNumber || `#${request.IssueRequestID}`}
                </span>
                <span style={{ padding: '2px 8px', borderRadius: '6px', background: pBadge.bg, color: pBadge.color, border: `1px solid ${pBadge.border}`, fontSize: '0.72rem', fontWeight: 800 }}>
                  {pBadge.label} PRIORITY
                </span>
              </div>
              <h3 style={{ margin: '2px 0 0', fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)', fontFamily: "'Outfit', sans-serif" }}>
                Service Dispatch & Intelligent Routing
              </h3>
            </div>
          </div>

          <button
            onClick={handleClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)', border: '1px solid var(--glass-border)',
              color: 'var(--text-muted)', cursor: 'pointer', padding: '8px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; e.currentTarget.style.color = '#ef4444'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form Body - 2 Column Split-Pane */}
        <form onSubmit={handleManualSubmit} style={{ display: 'flex', flex: 1, overflowY: 'auto' }}>
          {/* Left Column: Request Context & Smart Auto-Routing */}
          <div style={{
            width: '380px', minWidth: '340px', padding: '24px',
            borderRight: '1px solid var(--glass-border)',
            background: 'rgba(15, 23, 42, 0.4)',
            display: 'flex', flexDirection: 'column', gap: '18px'
          }}>
            {/* Request Summary Card */}
            <div style={{
              background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
              borderRadius: '16px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px'
            }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
                Service Request Details
              </div>
              <div style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                {request.Title}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--glass-border)', fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Service Category:</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{request.ServiceName || 'General Support'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Requester:</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{request.RequesterName || 'Tenant Staff'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Submitted On:</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {new Date(request.CreatedDate || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Smart Auto-Routing Command Card */}
            <div style={{
              borderRadius: '18px', padding: '18px',
              border: '1px solid rgba(138, 75, 255, 0.4)',
              background: 'linear-gradient(135deg, rgba(138, 75, 255, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)',
              boxShadow: '0 8px 24px rgba(138, 75, 255, 0.12)',
              display: 'flex', flexDirection: 'column', gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  padding: '9px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                  color: '#ffffff', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                }}>
                  <Zap size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Smart Auto-Dispatch Engine
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
                    Lowest active workload & availability algorithm
                  </div>
                </div>
              </div>

              <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.5 }}>
                Evaluates technician skills, active workload queues, and current availability to instantly route to the optimal handler.
              </p>

              <button
                type="button"
                onClick={handleAutoRouteSubmit}
                disabled={submitting}
                style={{
                  width: '100%', padding: '11px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                  border: 'none', color: '#ffffff', fontSize: '0.86rem', fontWeight: 800,
                  cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '8px', boxShadow: '0 6px 18px rgba(99, 102, 241, 0.35)',
                  transition: 'all 0.2s ease'
                }}
              >
                {submitting ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {submitting ? 'Auto-Routing Request...' : 'Trigger Smart Auto-Route'}
              </button>
            </div>
          </div>

          {/* Right Column: Manual Dispatch Form */}
          <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
            {/* Mode Switcher Pills */}
            <div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '8px' }}>
                Dispatch Target Mode
              </div>
              <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-tertiary)', padding: '5px', borderRadius: '14px', border: '1px solid var(--glass-border)' }}>
                <button
                  type="button"
                  onClick={() => {
                    setAssignMode('INDIVIDUAL');
                    clearFieldError('AssignedUserID');
                    clearFieldError('AssignedTeamID');
                  }}
                  style={{
                    flex: 1, padding: '10px 14px', borderRadius: '10px', border: 'none',
                    background: assignMode === 'INDIVIDUAL' ? 'var(--accent-gradient)' : 'transparent',
                    color: assignMode === 'INDIVIDUAL' ? '#ffffff' : 'var(--text-muted)',
                    fontWeight: 800, fontSize: '0.84rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    transition: 'all 0.2s ease', boxShadow: assignMode === 'INDIVIDUAL' ? 'var(--glow-accent)' : 'none'
                  }}
                >
                  <User size={16} /> Individual Technician
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAssignMode('TEAM');
                    clearFieldError('AssignedUserID');
                    clearFieldError('AssignedTeamID');
                  }}
                  style={{
                    flex: 1, padding: '10px 14px', borderRadius: '10px', border: 'none',
                    background: assignMode === 'TEAM' ? 'var(--accent-gradient)' : 'transparent',
                    color: assignMode === 'TEAM' ? '#ffffff' : 'var(--text-muted)',
                    fontWeight: 800, fontSize: '0.84rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    transition: 'all 0.2s ease', boxShadow: assignMode === 'TEAM' ? 'var(--glow-accent)' : 'none'
                  }}
                >
                  <Users size={16} /> Technician Work Team
                </button>
              </div>
            </div>

            {/* Target Selection Container */}
            <FormField
              label={`Select ${assignMode === 'TEAM' ? 'Technician Work Team' : 'Field Technician'}`}
              required
              error={assignMode === 'TEAM' ? fieldErrors.AssignedTeamID : fieldErrors.AssignedUserID}
              icon={Users}
            >
              {loading ? (
                <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', padding: '40px', textAlign: 'center', background: 'var(--bg-tertiary)', borderRadius: '14px' }}>
                  <RefreshCw className="animate-spin" size={24} style={{ marginBottom: '8px' }} />
                  <div>Loading active technicians and teams roster...</div>
                </div>
              ) : assignMode === 'TEAM' ? (
                teams.length === 0 ? (
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', padding: '30px', textAlign: 'center', background: 'var(--bg-tertiary)', borderRadius: '14px', border: '1px solid var(--glass-border)' }}>
                    No technician work teams configured in department.
                  </div>
                ) : (
                  <div style={{
                    display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '240px', overflowY: 'auto', paddingRight: '4px',
                    borderRadius: '14px', border: fieldErrors.AssignedTeamID ? '1px solid rgba(239, 68, 68, 0.4)' : 'none', padding: fieldErrors.AssignedTeamID ? '4px' : '0'
                  }}>
                    {teams.map((tm) => {
                      const isSelected = selectedTeamId == tm.TeamID;
                      return (
                        <label
                          key={tm.TeamID}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '12px 16px', borderRadius: '14px',
                            border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--glass-border)',
                            background: isSelected ? 'rgba(138, 75, 255, 0.12)' : 'var(--bg-tertiary)',
                            boxShadow: isSelected ? '0 4px 14px rgba(138, 75, 255, 0.15)' : 'none',
                            cursor: 'pointer', transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <input
                              type="radio"
                              name="workTeam"
                              value={tm.TeamID}
                              checked={isSelected}
                              onChange={() => {
                                setSelectedTeamId(tm.TeamID);
                                clearFieldError('AssignedTeamID');
                              }}
                              style={{ accentColor: 'var(--accent-primary)', width: '17px', height: '17px', cursor: 'pointer' }}
                            />
                            <div>
                              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                                {tm.TeamName} ({tm.TeamCode})
                              </div>
                              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                Leader: {tm.LeaderName || 'Unassigned'} • {tm.MemberCount || 0} Team Members
                              </div>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <span style={{ padding: '3px 10px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 800, background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                              {tm.ActiveRequestsCount || 0} active jobs
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )
              ) : technicians.length === 0 ? (
                <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', padding: '30px', textAlign: 'center', background: 'var(--bg-tertiary)', borderRadius: '14px', border: '1px solid var(--glass-border)' }}>
                  No active technicians found in department roster.
                </div>
              ) : (
                <div style={{
                  display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '240px', overflowY: 'auto', paddingRight: '4px',
                  borderRadius: '14px', border: fieldErrors.AssignedUserID ? '1px solid rgba(239, 68, 68, 0.4)' : 'none', padding: fieldErrors.AssignedUserID ? '4px' : '0'
                }}>
                  {technicians.map((tech) => {
                    const isSelected = selectedTechId == tech.UserID;
                    const isAvailable = (tech.AvailabilityStatusCode || 'AVAILABLE').toUpperCase() === 'AVAILABLE';

                    return (
                      <label
                        key={tech.UserID}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '12px 16px', borderRadius: '14px',
                          border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--glass-border)',
                          background: isSelected ? 'rgba(138, 75, 255, 0.12)' : 'var(--bg-tertiary)',
                          boxShadow: isSelected ? '0 4px 14px rgba(138, 75, 255, 0.15)' : 'none',
                          cursor: 'pointer', transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <input
                            type="radio"
                            name="technician"
                            value={tech.UserID}
                            checked={isSelected}
                            onChange={() => {
                              setSelectedTechId(tech.UserID);
                              clearFieldError('AssignedUserID');
                            }}
                            style={{ accentColor: 'var(--accent-primary)', width: '17px', height: '17px', cursor: 'pointer' }}
                          />
                          <div style={{
                            width: '36px', height: '36px', borderRadius: '10px',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#ffffff', fontWeight: 800, fontSize: '0.85rem'
                          }}>
                            {(tech.FirstName || 'T')[0]}{(tech.LastName || 'E')[0]}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                              {tech.FullName || `${tech.FirstName} ${tech.LastName}`}
                            </div>
                            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {tech.Email}
                            </div>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <span style={{
                            padding: '3px 10px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 800,
                            background: isAvailable ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: isAvailable ? '#34d399' : '#fbbf24',
                            border: isAvailable ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)'
                          }}>
                            {isAvailable ? 'Available' : 'Busy'}
                          </span>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '3px', fontWeight: 700 }}>
                            {tech.ActiveWorkloadCount || 0} active jobs
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </FormField>

            {/* Dispatch Remarks */}
            <FormField
              label="Dispatch Remarks & Instructions"
              error={fieldErrors.Remarks}
              icon={FileText}
            >
              <textarea
                rows={3}
                value={remarks}
                onChange={(e) => {
                  setRemarks(e.target.value);
                  clearFieldError('Remarks');
                }}
                placeholder="e.g. Priority dispatch - check valve seals in server room B2..."
                style={{
                  width: '100%', padding: '12px 14px',
                  background: 'var(--bg-tertiary)',
                  border: `1px solid ${fieldErrors.Remarks ? 'rgba(239, 68, 68, 0.5)' : 'var(--glass-border)'}`,
                  borderRadius: '12px', color: 'var(--text-primary)',
                  fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', resize: 'vertical'
                }}
              />
            </FormField>

            {/* Action Footer Buttons */}
            <div style={{
              display: 'flex', justifyContent: 'flex-end', gap: '12px',
              paddingTop: '16px', borderTop: '1px solid var(--glass-border)', flexShrink: 0
            }}>
              <button
                type="button"
                onClick={handleClose}
                style={{
                  padding: '11px 20px', borderRadius: '12px',
                  border: '1px solid var(--glass-border)', background: 'transparent',
                  color: 'var(--text-primary)', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: '11px 24px', borderRadius: '12px', border: 'none',
                  background: 'var(--accent-gradient)', color: '#ffffff', fontWeight: 800,
                  fontSize: '0.88rem', cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                  boxShadow: 'var(--glow-accent)', transition: 'all 0.2s'
                }}
              >
                {submitting ? <RefreshCw size={16} className="animate-spin" /> : <UserCheck size={16} />}
                {submitting ? 'Dispatching...' : 'Assign & Dispatch Request'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Glass Alert Modal */}
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

