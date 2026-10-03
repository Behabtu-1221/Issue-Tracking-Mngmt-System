import React, { useState, useEffect } from 'react';
import dispatchApi from '../api/dispatchApi';
import { Users, Search, UserCheck, ShieldCheck, Activity } from 'lucide-react';
import AlertDialogModal from '../../../components/common/AlertDialogModal';

export default function TechnicianRosterTab() {
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Glass Alert Modal State
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'error' });

  const showAlert = (title, message, type = 'error') => {
    setAlertConfig({ isOpen: true, title, message, type });
  };

  useEffect(() => {
    fetchTechnicians();
  }, [search, statusFilter]);

  const fetchTechnicians = async () => {
    try {
      setLoading(true);
      const res = await dispatchApi.getTechnicians({ search, availabilityStatus: statusFilter });
      setTechnicians(res.data.data.technicians || []);
    } catch (err) {
      console.error('Failed to fetch technicians roster', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (userId, newStatus) => {
    try {
      await dispatchApi.updateAvailability({ userId, statusCode: newStatus });
      fetchTechnicians();
    } catch (err) {
      showAlert('Update Failed', err.response?.data?.message || 'Failed to update technician availability status.', 'error');
    }
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
      {/* Header Controls */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ position: 'relative', minWidth: '300px', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search technicians by name or email..."
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
          {['ALL', 'AVAILABLE', 'BUSY', 'ON_LEAVE', 'OFFLINE'].map((st) => (
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
              {st === 'ALL' ? 'All Statuses' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Roster */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading technician roster...</div>
      ) : technicians.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>No technicians found matching criteria.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '18px' }}>
          {technicians.map((tech) => {
            const isAvail = tech.AvailabilityStatusCode === 'AVAILABLE';

            return (
              <div
                key={tech.UserID}
                style={{
                  background: 'var(--bg-tertiary)',
                  border: isAvail ? '1.5px solid #10b981' : '1px solid var(--glass-border)',
                  borderRadius: '16px',
                  padding: '20px',
                  boxShadow: isAvail ? '0 0 16px rgba(16, 185, 129, 0.15)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '50%',
                    background: isAvail ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'var(--accent-gradient)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: '800', fontSize: '1.1rem'
                  }}>
                    {tech.FullName[0]}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--text-primary)' }}>{tech.FullName}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{tech.Email}</div>
                  </div>
                </div>

                {/* Status & Workload */}
                <div style={{ background: 'var(--bg-tertiary)', padding: '12px 14px', borderRadius: '12px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--glass-border)' }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700' }}>ACTIVE JOBS</div>
                    <div style={{ fontWeight: '800', fontSize: '0.95rem', color: 'var(--accent-primary)' }}>{tech.ActiveWorkloadCount || 0} Assigned</div>
                  </div>

                  <select
                    value={tech.AvailabilityStatusCode}
                    onChange={(e) => handleStatusToggle(tech.UserID, e.target.value)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '8px',
                      border: '1px solid var(--glass-border)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.78rem',
                      fontWeight: '700',
                      outline: 'none'
                    }}
                  >
                    <option value="AVAILABLE" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>AVAILABLE</option>
                    <option value="BUSY" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>BUSY</option>
                    <option value="ON_LEAVE" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>ON_LEAVE</option>
                    <option value="OFFLINE" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>OFFLINE</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
