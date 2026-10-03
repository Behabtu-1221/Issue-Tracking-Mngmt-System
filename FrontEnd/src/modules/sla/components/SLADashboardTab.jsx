import React, { useState, useEffect } from 'react';
import slaApi from '../api/slaApi';
import { Search, Filter, Clock, Pause, Play, AlertTriangle, AlertCircle, ShieldCheck, Zap, X, RefreshCw } from 'lucide-react';
import ConfirmDialogModal from '../../../components/common/ConfirmDialogModal';
import AlertDialogModal from '../../../components/common/AlertDialogModal';
import { FormField } from '../../../components/common/FormField';
import { slaSchemas } from '../../../validation';

export default function SLADashboardTab() {
  const [clocks, setClocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Glass Dialog Modals State
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'error' });

  // Validated Pause Clock Modal State
  const [pauseModal, setPauseModal] = useState({
    isOpen: false,
    clock: null,
    pauseReason: '',
    error: '',
    submitting: false
  });

  const showAlert = (title, message, type = 'error') => {
    setAlertConfig({ isOpen: true, title, message, type });
  };

  const openPauseModal = (clock) => {
    setPauseModal({
      isOpen: true,
      clock,
      pauseReason: '',
      error: '',
      submitting: false
    });
  };

  const closePauseModal = () => {
    setPauseModal({
      isOpen: false,
      clock: null,
      pauseReason: '',
      error: '',
      submitting: false
    });
  };

  const handlePauseSubmit = async (e) => {
    e.preventDefault();
    const validation = slaSchemas.pauseClockForm({ pauseReason: pauseModal.pauseReason });
    if (!validation.isValid) {
      setPauseModal(prev => ({ ...prev, error: validation.errors.pauseReason }));
      return;
    }

    try {
      setPauseModal(prev => ({ ...prev, submitting: true, error: '' }));
      await slaApi.pauseClock(pauseModal.clock.SLAClockID, validation.sanitized);
      const reqNum = pauseModal.clock.RequestNumber || `#${pauseModal.clock.SLAClockID}`;
      closePauseModal();
      fetchClocks();
      showAlert('Timer Paused', `SLA countdown timer for ${reqNum} has been paused.`, 'warning');
    } catch (err) {
      showAlert('Action Failed', err.response?.data?.message || 'Failed to pause SLA clock.', 'error');
    } finally {
      setPauseModal(prev => ({ ...prev, submitting: false }));
    }
  };

  useEffect(() => {
    fetchClocks();
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [search, statusFilter]);

  const fetchClocks = async () => {
    try {
      setLoading(true);
      const res = await slaApi.getClocks({ search, clockStatus: statusFilter });
      const raw = res.data?.data?.clocks || res.data?.data || [];
      setClocks(Array.isArray(raw) ? raw : []);
    } catch (err) {
      console.error('Failed to fetch SLA clocks', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePause = (clockId) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Pause SLA Resolution Clock',
      message: 'Are you sure you want to pause the SLA countdown timer for this issue? (e.g. Awaiting customer details / vendor parts)',
      type: 'warning',
      confirmText: 'Pause Clock',
      onConfirm: async () => {
        try {
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          await slaApi.pauseClock(clockId, { pauseReason: 'Awaiting customer response / vendor dependencies' });
          fetchClocks();
        } catch (err) {
          showAlert('Action Failed', 'Failed to pause SLA clock.', 'error');
        }
      }
    });
  };

  const handleResume = (clockId) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Resume SLA Resolution Clock',
      message: 'Are you sure you want to resume the active SLA countdown timer for this request?',
      type: 'info',
      confirmText: 'Resume Clock',
      onConfirm: async () => {
        try {
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          await slaApi.resumeClock(clockId);
          fetchClocks();
        } catch (err) {
          showAlert('Action Failed', 'Failed to resume SLA clock.', 'error');
        }
      }
    });
  };

  const formatRemainingTime = (deadlineStr) => {
    if (!deadlineStr) return '--:--:--';
    const deadlineMs = new Date(deadlineStr).getTime();
    const diffSecs = Math.floor((deadlineMs - currentTime) / 1000);

    if (diffSecs <= 0) {
      const overSecs = Math.abs(diffSecs);
      const m = Math.floor(overSecs / 60);
      const s = overSecs % 60;
      return `OVERDUE (-${m}m ${s}s)`;
    }

    const hours = Math.floor(diffSecs / 3600);
    const minutes = Math.floor((diffSecs % 3600) / 60);
    const seconds = diffSecs % 60;
    return `${hours > 0 ? `${hours}h ` : ''}${minutes}m ${seconds}s`;
  };

  const getStatusBadge = (c) => {
    if (c.IsResolutionBreached || c.IsResponseBreached) {
      return (
        <span style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#ef4444', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <AlertTriangle size={13} /> SLA Breached
        </span>
      );
    }
    if (c.ClockStatus === 'PAUSED') {
      return (
        <span style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.4)', color: '#f59e0b', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Pause size={13} /> Timer Paused
        </span>
      );
    }
    return (
      <span style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#10b981', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        <Clock size={13} /> Timer Running
      </span>
    );
  };

  return (
    <div style={{
      background: 'var(--glass-bg)',
      border: '1px solid var(--glass-border)',
      borderRadius: '20px',
      padding: '24px',
      backdropFilter: 'blur(16px)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)'
    }}>
      {/* Search & Filter Header */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ position: 'relative', minWidth: '300px', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search SLA clocks by title, request number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: '42px', paddingRight: '14px', paddingTop: '11px', paddingBottom: '11px',
              borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'var(--bg-tertiary)', padding: '4px', borderRadius: '14px', border: '1px solid var(--glass-border)' }}>
          {['ALL', 'RUNNING', 'PAUSED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '7px 14px', borderRadius: '10px', border: 'none',
                background: statusFilter === st ? 'var(--accent-gradient)' : 'transparent',
                color: statusFilter === st ? 'white' : 'var(--text-muted)',
                fontWeight: '700', fontSize: '0.78rem', cursor: 'pointer'
              }}
            >
              {st === 'ALL' ? 'All Clocks' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Clocks Table */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading active SLA clocks...</div>
      ) : (!clocks || clocks.length === 0) ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Clock size={42} style={{ opacity: 0.4, marginBottom: '12px', color: 'var(--accent-primary)' }} />
          <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)' }}>No SLA Clocks Monitored</div>
          <div style={{ fontSize: '0.82rem' }}>SLA timers start automatically when service requests are submitted.</div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ color: 'var(--text-muted)', fontSize: '0.78rem', letterSpacing: '0.5px' }}>
                <th style={{ padding: '12px 18px', fontWeight: '700' }}>SERVICE REQUEST</th>
                <th style={{ padding: '12px 18px', fontWeight: '700' }}>PRIORITY</th>
                <th style={{ padding: '12px 18px', fontWeight: '700' }}>RESPONSE DEADLINE</th>
                <th style={{ padding: '12px 18px', fontWeight: '700' }}>RESOLUTION COUNTDOWN</th>
                <th style={{ padding: '12px 18px', fontWeight: '700' }}>STATUS</th>
                <th style={{ padding: '12px 18px', fontWeight: '700', textAlign: 'right' }}>TIMER CONTROL</th>
              </tr>
            </thead>
            <tbody>
              {clocks.map((c) => {
                const isOverdue = new Date(c.ResolutionDeadline).getTime() < currentTime;

                return (
                  <tr
                    key={c.SLAClockID}
                    style={{
                      background: 'var(--bg-tertiary)',
                      border: isOverdue ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--glass-border)',
                      borderRadius: '12px'
                    }}
                  >
                    <td style={{ padding: '16px 18px', borderRadius: '12px 0 0 12px' }}>
                      <div style={{ fontWeight: '800', fontSize: '0.75rem', color: 'var(--accent-primary)', background: 'rgba(99, 102, 241, 0.1)', padding: '2px 8px', borderRadius: '6px', display: 'inline-block', marginBottom: '3px' }}>
                        {c.RequestNumber}
                      </div>
                      <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.92rem' }}>
                        {c.RequestTitle}
                      </div>
                    </td>

                    <td style={{ padding: '16px 18px' }}>
                      <span className={`badge ${c.PriorityCode === 'CRITICAL' ? 'badge-danger' : c.PriorityCode === 'HIGH' ? 'badge-warning' : 'badge-info'}`}>
                        {c.PriorityCode}
                      </span>
                    </td>

                    <td style={{ padding: '16px 18px', color: 'var(--text-secondary)' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: '600' }}>
                        {new Date(c.ResponseDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: c.IsResponseBreached ? '#ef4444' : 'var(--text-muted)' }}>
                        {c.IsResponseBreached ? 'Breached' : `Target: ${c.TargetResponseMinutes}m`}
                      </div>
                    </td>

                    {/* Live Countdown */}
                    <td style={{ padding: '16px 18px' }}>
                      <div style={{
                        fontSize: '0.95rem',
                        fontWeight: '900',
                        fontFamily: 'monospace',
                        color: isOverdue ? '#ef4444' : '#10b981',
                        letterSpacing: '0.5px'
                      }}>
                        {c.ClockStatus === 'PAUSED' ? 'PAUSED' : formatRemainingTime(c.ResolutionDeadline)}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Target Resolution: {c.TargetResolutionMinutes}m
                      </div>
                    </td>

                    <td style={{ padding: '16px 18px' }}>
                      {getStatusBadge(c)}
                    </td>

                    {/* Controls */}
                    <td style={{ padding: '16px 18px', textAlign: 'right', borderRadius: '0 12px 12px 0' }}>
                      {c.ClockStatus === 'RUNNING' ? (
                        <button
                          onClick={() => openPauseModal(c)}
                          style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.4)', color: '#f59e0b', padding: '6px 12px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Pause size={14} /> Pause
                        </button>
                      ) : (
                        <button
                          onClick={() => handleResume(c.SLAClockID)}
                          style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#10b981', padding: '6px 12px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Play size={14} /> Resume
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

      {/* Validated Pause SLA Clock Modal */}
      {pauseModal.isOpen && pauseModal.clock && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.82)', backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '24px'
        }}>
          <div style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)',
            borderRadius: '24px', width: '100%', maxWidth: '540px',
            boxShadow: '0 25px 70px rgba(0, 0, 0, 0.5)', display: 'flex', flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '20px 24px', borderBottom: '1px solid var(--glass-border)',
              background: 'rgba(255, 255, 255, 0.02)'
            }}>
              <div>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  SLA CLOCK CONTROLS • {pauseModal.clock.RequestNumber || `#${pauseModal.clock.SLAClockID}`}
                </span>
                <h3 style={{ margin: '4px 0 0', fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Outfit', sans-serif" }}>
                  Pause SLA Countdown Timer
                </h3>
              </div>
              <button
                onClick={closePauseModal}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)', border: '1px solid var(--glass-border)',
                  color: 'var(--text-muted)', cursor: 'pointer', padding: '8px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePauseSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Target Request: </span>
                <strong style={{ color: 'var(--text-primary)' }}>{pauseModal.clock.RequestTitle}</strong>
              </div>

              <FormField
                label="Reason for Pausing SLA Countdown"
                required
                error={pauseModal.error}
                icon={Pause}
                helpText="Explain operational blocker (e.g. Awaiting client confirmation, spare parts shipment)."
              >
                <textarea
                  rows={4}
                  value={pauseModal.pauseReason}
                  onChange={(e) => setPauseModal(prev => ({ ...prev, pauseReason: e.target.value, error: '' }))}
                  placeholder="e.g. Awaiting replacement parts delivery from manufacturer or pending customer approval on quote..."
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: '12px',
                    background: 'var(--bg-tertiary)',
                    border: `1px solid ${pauseModal.error ? 'rgba(239, 68, 68, 0.5)' : 'var(--glass-border)'}`,
                    color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
              </FormField>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--glass-border)' }}>
                <button
                  type="button"
                  onClick={closePauseModal}
                  className="btn btn-secondary"
                  style={{ padding: '10px 18px', borderRadius: '10px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pauseModal.submitting}
                  style={{
                    padding: '10px 22px', borderRadius: '10px', border: 'none',
                    fontWeight: 800, fontSize: '0.88rem', cursor: pauseModal.submitting ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)'
                  }}
                >
                  {pauseModal.submitting ? <RefreshCw size={16} className="animate-spin" /> : <Pause size={16} />}
                  {pauseModal.submitting ? 'Pausing Timer...' : 'Confirm Pause Timer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
