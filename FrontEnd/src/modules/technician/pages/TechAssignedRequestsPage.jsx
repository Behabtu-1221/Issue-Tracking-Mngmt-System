import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Wrench, Search, Filter, RefreshCw, ChevronLeft, ChevronRight,
  Clock, AlertTriangle, CheckCircle2, User, Building, Layers,
  ListChecks, Calendar, Eye, ShieldAlert, ArrowUpDown
} from 'lucide-react';
import { usePermissionContext } from '../../role-permission-management/contexts/PermissionContext';
import technicianApi from '../api/technicianApi';

export default function TechAssignedRequestsPage({ defaultStatus = 'ALL' }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialPriority = searchParams.get('priority') || 'ALL';

  const { user } = usePermissionContext();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filters state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(defaultStatus);
  const [priorityFilter, setPriorityFilter] = useState(initialPriority);
  const [page, setPage] = useState(1);
  const limit = 15;

  const currentUserId = user?.UserID || user?.userId;

  useEffect(() => {
    setStatusFilter(defaultStatus);
  }, [defaultStatus]);

  useEffect(() => {
    if (currentUserId) {
      fetchData();
    }
  }, [currentUserId, search, statusFilter, priorityFilter, page]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await technicianApi.getAssignedRequests({
        assignedUserId: currentUserId,
        search,
        statusCode: statusFilter !== 'ALL' ? statusFilter : undefined,
        priorityCode: priorityFilter !== 'ALL' ? priorityFilter : undefined,
        page,
        limit
      });

      const data = res.data?.data;
      const list = data?.assignments || data || [];
      const total = data?.total || (Array.isArray(list) ? list.length : 0);

      setRequests(Array.isArray(list) ? list : []);
      setTotalCount(total);
    } catch (err) {
      console.error('Failed to load technician assigned requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadge = (priorityStr) => {
    const p = (priorityStr || '').toUpperCase();
    switch (p) {
      case 'CRITICAL':
      case 'URGENT':
        return { label: p, bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: 'rgba(239, 68, 68, 0.3)' };
      case 'HIGH':
        return { label: 'High', bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' };
      case 'LOW':
        return { label: 'Low', bg: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', border: 'rgba(148, 163, 184, 0.3)' };
      default:
        return { label: 'Medium', bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' };
    }
  };

  const getStatusBadge = (statusStr) => {
    const s = (statusStr || '').toUpperCase();
    switch (s) {
      case 'ASSIGNED':
      case 'NEW':
        return { label: 'Assigned', bg: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: 'rgba(168, 85, 247, 0.3)' };
      case 'ACCEPTED':
      case 'IN_PROGRESS':
        return { label: 'In Progress', bg: 'rgba(234, 179, 8, 0.15)', color: '#facc15', border: 'rgba(234, 179, 8, 0.3)' };
      case 'PAUSED':
      case 'PENDING':
        return { label: 'Pending', bg: 'rgba(249, 115, 22, 0.15)', color: '#fb923c', border: 'rgba(249, 115, 22, 0.3)' };
      case 'COMPLETED':
      case 'RESOLVED':
        return { label: 'Resolved', bg: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', border: 'rgba(34, 197, 94, 0.3)' };
      default:
        return { label: s || 'Active', bg: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', border: 'rgba(148, 163, 184, 0.3)' };
    }
  };

  const totalPages = Math.ceil(totalCount / limit) || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '32px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Wrench size={26} color="var(--accent-primary)" />
            Technician Work Roster <span className="glow-text">
              {statusFilter !== 'ALL' ? `(${statusFilter})` : ''}
            </span>
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            View and manage service requests assigned directly to your technical workload.
          </p>
        </div>

        <button
          onClick={fetchData}
          style={{
            padding: '8px 16px', borderRadius: 'var(--border-radius-sm)',
            background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
            color: 'var(--text-primary)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px'
          }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh Roster
        </button>
      </div>

      {/* Filters Bar */}
      <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: '14px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search by title, request #, or requester..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{
              width: '100%', padding: '9px 12px 9px 36px', borderRadius: '8px',
              background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
              color: 'var(--text-primary)', fontSize: '0.83rem', outline: 'none', boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Filter size={14} color="var(--text-muted)" />
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            style={{
              padding: '9px 12px', borderRadius: '8px',
              background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
              color: 'var(--text-primary)', fontSize: '0.83rem', outline: 'none', cursor: 'pointer'
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="ASSIGNED">Assigned / New</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="PAUSED">Pending / Paused</option>
            <option value="COMPLETED">Resolved / Completed</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertTriangle size={14} color="var(--text-muted)" />
          <select
            value={priorityFilter}
            onChange={e => { setPriorityFilter(e.target.value); setPage(1); }}
            style={{
              padding: '9px 12px', borderRadius: '8px',
              background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
              color: 'var(--text-primary)', fontSize: '0.83rem', outline: 'none', cursor: 'pointer'
            }}
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="glass-panel" style={{ padding: '0', borderRadius: '16px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Fetching technician assigned requests...
          </div>
        ) : requests.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <ListChecks size={40} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>No Assigned Requests Found</div>
            <div style={{ fontSize: '0.82rem', marginTop: '4px' }}>There are no work orders matching your selected filters.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '14px 16px' }}>Request #</th>
                  <th style={{ padding: '14px 16px' }}>Subject Title</th>
                  <th style={{ padding: '14px 16px' }}>Service Offering</th>
                  <th style={{ padding: '14px 16px' }}>Requester</th>
                  <th style={{ padding: '14px 16px' }}>Department</th>
                  <th style={{ padding: '14px 16px' }}>Priority</th>
                  <th style={{ padding: '14px 16px' }}>Status</th>
                  <th style={{ padding: '14px 16px' }}>Assigned Date</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(req => {
                  const pBadge = getPriorityBadge(req.PriorityCode);
                  const sBadge = getStatusBadge(req.AssignmentStatusCode || req.RequestStatusCode);
                  const assignmentId = req.AssignmentID || req.id;

                  return (
                    <tr key={assignmentId} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.15s ease' }} className="table-row-hover">
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--accent-primary)' }}>
                        {req.RequestNumber || `#${req.RequestID}`}
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-primary)', maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {req.RequestTitle || req.Title}
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>
                        {req.ServiceName || 'General Service'}
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-primary)', fontWeight: 500 }}>
                        👤 {req.RequesterName || 'Tenant Staff'}
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>
                        📂 {req.DepartmentName || 'Unassigned'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '6px', background: pBadge.bg, color: pBadge.color, border: `1px solid ${pBadge.border}`, fontSize: '0.72rem', fontWeight: 700 }}>
                          {pBadge.label}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '6px', background: sBadge.bg, color: sBadge.color, border: `1px solid ${sBadge.border}`, fontSize: '0.72rem', fontWeight: 700 }}>
                          {sBadge.label}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                        {req.CreatedDate ? new Date(req.CreatedDate).toLocaleDateString() : 'Recent'}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => navigate(`/technician/request/${assignmentId}`)}
                          style={{
                            padding: '7px 14px', borderRadius: '6px',
                            background: 'var(--accent-gradient)', border: 'none',
                            color: '#ffffff', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            boxShadow: 'var(--glow-accent)'
                          }}
                        >
                          <Eye size={13} /> Open Detail
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div style={{ padding: '14px 20px', background: 'var(--bg-tertiary)', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Showing {requests.length} of {totalCount} assigned requests
          </span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage(prev => Math.max(prev - 1, 1))}
              style={{
                padding: '6px 12px', borderRadius: '6px', background: 'var(--bg-secondary)',
                border: '1px solid var(--glass-border)', color: 'var(--text-primary)',
                fontSize: '0.78rem', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.5 : 1
              }}
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
              style={{
                padding: '6px 12px', borderRadius: '6px', background: 'var(--bg-secondary)',
                border: '1px solid var(--glass-border)', color: 'var(--text-primary)',
                fontSize: '0.78rem', cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.5 : 1
              }}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
