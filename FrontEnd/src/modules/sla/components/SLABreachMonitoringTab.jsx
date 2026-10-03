import React, { useState, useEffect } from 'react';
import slaApi from '../api/slaApi';
import { AlertTriangle, ShieldAlert, CheckCircle2, Calendar } from 'lucide-react';
import ConfirmDialogModal from '../../../components/common/ConfirmDialogModal';
import AlertDialogModal from '../../../components/common/AlertDialogModal';

export default function SLABreachMonitoringTab() {
  const [breaches, setBreaches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Glass Dialog Modals State
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'error' });

  const showAlert = (title, message, type = 'error') => {
    setAlertConfig({ isOpen: true, title, message, type });
  };

  useEffect(() => {
    fetchBreaches();
  }, []);

  const fetchBreaches = async () => {
    try {
      setLoading(true);
      const res = await slaApi.getBreaches({});
      const raw = res.data?.data?.breaches || res.data?.data || [];
      setBreaches(Array.isArray(raw) ? raw : []);
    } catch (err) {
      console.error('Failed to fetch SLA breaches', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = (id) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Acknowledge SLA Target Breach',
      message: 'Are you sure you want to mark this SLA breach record as acknowledged by management?',
      type: 'warning',
      confirmText: 'Acknowledge Breach',
      onConfirm: async () => {
        try {
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          await slaApi.acknowledgeBreach(id);
          fetchBreaches();
        } catch (err) {
          showAlert('Action Failed', 'Failed to acknowledge SLA breach.', 'error');
        }
      }
    });
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
      <div style={{ marginBottom: '24px' }}>
<h3 style={{ fontSize: '1.2rem', fontWeight: '900', margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle color="#ef4444" size={22} /> SLA Breach & Violation Log
        </h3>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
          Audit records of all initial response and resolution target breaches with manager acknowledgment
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading breach records...</div>
      ) : breaches.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <CheckCircle2 size={42} style={{ opacity: 0.4, marginBottom: '12px', color: '#10b981' }} />
          <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)' }}>No SLA Breaches Recorded</div>
          <div style={{ fontSize: '0.82rem' }}>All monitored service requests are currently operating within SLA target deadlines.</div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ color: 'var(--text-muted)', fontSize: '0.78rem', letterSpacing: '0.5px' }}>
                <th style={{ padding: '12px 18px', fontWeight: '700' }}>BREACHED REQUEST</th>
                <th style={{ padding: '12px 18px', fontWeight: '700' }}>BREACH TYPE</th>
                <th style={{ padding: '12px 18px', fontWeight: '700' }}>SEVERITY</th>
                <th style={{ padding: '12px 18px', fontWeight: '700' }}>BREACH DATETIME</th>
                <th style={{ padding: '12px 18px', fontWeight: '700' }}>ACKNOWLEDGMENT STATUS</th>
                <th style={{ padding: '12px 18px', fontWeight: '700', textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {breaches.map((b) => (
                <tr key={b.SLABreachID} style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px' }}>
                  <td style={{ padding: '16px 18px', borderRadius: '12px 0 0 12px' }}>
                    <div style={{ fontWeight: '800', fontSize: '0.75rem', color: '#ef4444', background: 'rgba(239, 68, 68, 0.15)', padding: '2px 8px', borderRadius: '6px', display: 'inline-block', marginBottom: '3px' }}>
                      {b.RequestNumber}
                    </div>
                    <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.92rem' }}>
                      {b.RequestTitle}
                    </div>
                  </td>

                  <td style={{ padding: '16px 18px' }}>
                    <span style={{ fontWeight: '800', color: '#ef4444', fontSize: '0.8rem' }}>
                      {b.BreachType === 'RESPONSE' ? 'Initial Response Overdue' : 'Final Resolution Overdue'}
                    </span>
                  </td>

                  <td style={{ padding: '16px 18px' }}>
                    <span className="badge badge-danger">{b.SeverityLevel}</span>
                  </td>

                  <td style={{ padding: '16px 18px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    {new Date(b.ActualBreachDateTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>

                  <td style={{ padding: '16px 18px' }}>
                    {b.IsAcknowledged ? (
                      <span className="badge badge-success">Acknowledged by {b.AcknowledgedByName || 'Manager'}</span>
                    ) : (
                      <span className="badge badge-warning">Pending Review</span>
                    )}
                  </td>

                  <td style={{ padding: '16px 18px', textAlign: 'right', borderRadius: '0 12px 12px 0' }}>
                    {!b.IsAcknowledged && (
                      <button
                        onClick={() => handleAcknowledge(b.SLABreachID)}
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.78rem', fontWeight: '700' }}
                      >
                        Acknowledge
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
