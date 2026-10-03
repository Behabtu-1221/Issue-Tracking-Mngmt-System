import React, { useState, useEffect } from 'react';
import dispatchApi from '../api/dispatchApi';
import ManualAssignModal from './ManualAssignModal';
import { Search, Filter, Inbox, Zap, AlertTriangle, UserCheck, ArrowRight } from 'lucide-react';

export default function DispatcherDashboardTab() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    fetchUnassignedQueue();
  }, [search, priorityFilter]);

  const fetchUnassignedQueue = async () => {
    try {
      setLoading(true);
      const res = await dispatchApi.getUnassignedQueue({ search, priorityCode: priorityFilter });
      setRequests(res.data.data.requests || []);
    } catch (err) {
      console.error('Failed to fetch unassigned queue', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignedSuccess = () => {
    setSelectedRequest(null);
    fetchUnassignedQueue();
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
            placeholder="Search unassigned queue by request title, number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: '42px',
              paddingRight: '14px',
              paddingTop: '11px',
              paddingBottom: '11px',
              borderRadius: '12px',
              border: '1px solid var(--glass-border)',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              fontSize: '0.88rem',
              outline: 'none'
            }}
          />
        </div>

        {/* Priority Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'var(--bg-tertiary)', padding: '4px', borderRadius: '14px', border: '1px solid var(--glass-border)' }}>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((pr) => (
            <button
              key={pr}
              onClick={() => setPriorityFilter(pr)}
              style={{
                padding: '7px 14px',
                borderRadius: '10px',
                border: 'none',
                background: priorityFilter === pr ? (pr === 'CRITICAL' ? '#ef4444' : 'var(--accent-gradient)') : 'transparent',
                color: priorityFilter === pr ? 'white' : 'var(--text-muted)',
                fontWeight: '700',
                fontSize: '0.78rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {pr === 'ALL' ? 'All Priorities' : pr}
            </button>
          ))}
        </div>
      </div>

      {/* Queue Table */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading dispatch queue...</div>
      ) : (!requests || requests.length === 0) ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Inbox size={42} style={{ opacity: 0.4, marginBottom: '12px', color: 'var(--accent-primary)' }} />
          <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)' }}>Unassigned Queue Empty</div>
          <div style={{ fontSize: '0.82rem' }}>All active service requests have been dispatched to technicians.</div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ color: 'var(--text-muted)', fontSize: '0.78rem', letterSpacing: '0.5px' }}>
                <th style={{ padding: '12px 18px', fontWeight: '700' }}>SERVICE REQUEST</th>
                <th style={{ padding: '12px 18px', fontWeight: '700' }}>REQUESTER</th>
                <th style={{ padding: '12px 18px', fontWeight: '700' }}>PRIORITY</th>
                <th style={{ padding: '12px 18px', fontWeight: '700' }}>DEPARTMENT</th>
                <th style={{ padding: '12px 18px', fontWeight: '700' }}>SERVICE</th>
                <th style={{ padding: '12px 18px', fontWeight: '700' }}>APPROVED DATE</th>
                <th style={{ padding: '12px 18px', fontWeight: '700', textAlign: 'right' }}>DISPATCH ACTION</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => {
                const isCritical = r.PriorityCode === 'CRITICAL';

                return (
                  <tr
                    key={r.IssueRequestID}
                    style={{
                      background: isCritical ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-tertiary)',
                      border: isCritical ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--glass-border)',
                      borderRadius: '12px',
                      transition: 'all 0.2s'
                    }}
                  >
                    {/* Request info */}
                    <td style={{ padding: '16px 18px', borderRadius: '12px 0 0 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                        <span style={{ fontWeight: '800', fontSize: '0.75rem', color: 'var(--accent-primary)', background: 'rgba(99, 102, 241, 0.1)', padding: '2px 8px', borderRadius: '6px' }}>
                          {r.RequestNumber}
                        </span>
                        {isCritical && (
                          <span style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', fontSize: '0.7rem', fontWeight: '800', padding: '2px 6px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <AlertTriangle size={12} /> Emergency
                          </span>
                        )}
                      </div>
                      <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.92rem' }}>
                        {r.Title}
                      </div>
                    </td>

                    <td style={{ padding: '16px 18px', color: 'var(--text-secondary)' }}>
                      {r.RequesterName || 'System Requester'}
                    </td>

                    <td style={{ padding: '16px 18px' }}>
                      <span className={`badge ${r.PriorityCode === 'CRITICAL' ? 'badge-danger' : r.PriorityCode === 'HIGH' ? 'badge-warning' : 'badge-info'}`}>
                        {r.PriorityCode}
                      </span>
                    </td>

                    <td style={{ padding: '16px 18px', color: 'var(--text-secondary)' }}>
                      <span style={{ padding: '3px 9px', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.12)', color: 'var(--accent-primary)', fontSize: '0.78rem', fontWeight: 700 }}>
                        {r.AssignedDepartmentName || 'Responsible Dept'}
                      </span>
                    </td>

                    <td style={{ padding: '16px 18px', color: 'var(--text-muted)' }}>
                      {r.ServiceName}
                    </td>

                    <td style={{ padding: '16px 18px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      {new Date(r.ModifiedDate || r.CreatedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>

                    <td style={{ padding: '16px 18px', textAlign: 'right', borderRadius: '0 12px 12px 0' }}>
                      <button
                        onClick={() => setSelectedRequest(r)}
                        className="btn btn-primary"
                        style={{ padding: '8px 16px', fontSize: '0.8rem', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <UserCheck size={15} /> Dispatch <ArrowRight size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Manual Assign Modal */}
      {selectedRequest && (
        <ManualAssignModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onAssigned={handleAssignedSuccess}
        />
      )}
    </div>
  );
}
