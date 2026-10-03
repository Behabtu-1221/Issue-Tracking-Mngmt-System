import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LifeBuoy, Plus, Search, Filter, RefreshCw, ChevronRight, CheckCircle2,
  Clock, AlertCircle, FileText, User, Calendar, XCircle, ArrowUpRight,
  LayoutGrid, List, MoveHorizontal, Eye
} from 'lucide-react';
import issueManagementApi from '../api/issueManagementApi';
import { usePermissionContext } from '../../role-permission-management/contexts/PermissionContext';
import { IssueDetailView } from '../components/IssueDetailView';

export default function MyRequestsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = usePermissionContext();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [viewMode, setViewMode] = useState('table');

  const currentUserId = user?.UserID || user?.userId;

  useEffect(() => {
    if (currentUserId) {
      fetchMyRequests();
    }
  }, [currentUserId]);

  // Handle URL param ?id=... or ?requestId=... to auto-open specific request
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const targetId = params.get('id') || params.get('requestId');
    if (!targetId) return;

    if (requests.length > 0) {
      const found = requests.find(r =>
        String(r.IssueRequestID || r.RequestID || r.id) === String(targetId) ||
        r.IssueRequestCode === targetId ||
        r.RequestNumber === targetId
      );
      if (found) {
        setSelectedRequest(found);
        return;
      }
    }

    // Direct fetch by ID if not in current list
    issueManagementApi.getIssueById(targetId)
      .then(res => {
        const issueData = res.data?.data;
        if (issueData) {
          setSelectedRequest(issueData);
        }
      })
      .catch(err => {
        console.warn('Could not auto-load request from URL query param:', err);
      });
  }, [location.search, requests]);

  const fetchMyRequests = async () => {
    try {
      setLoading(true);
      const res = await issueManagementApi.getIssues({ requesterUserId: currentUserId, limit: 100 });
      const data = res.data?.data?.issues || res.data?.data || [];
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load my requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (statusStr) => {
    const status = (statusStr || '').toUpperCase();
    switch (status) {
      case 'NEW':
        return { label: 'New Request', bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' };
      case 'APPROVED':
        return { label: 'Approved', bg: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: 'rgba(56, 189, 248, 0.3)' };
      case 'ASSIGNED':
        return { label: 'Assigned', bg: 'rgba(192, 132, 252, 0.15)', color: '#c084fc', border: 'rgba(192, 132, 252, 0.3)' };
      case 'IN_PROGRESS':
        return { label: 'In Progress', bg: 'rgba(250, 204, 21, 0.15)', color: '#facc15', border: 'rgba(250, 204, 21, 0.3)' };
      case 'PENDING':
        return { label: 'Action Needed', bg: 'rgba(251, 146, 60, 0.15)', color: '#fb923c', border: 'rgba(251, 146, 60, 0.3)' };
      case 'RESOLVED':
        return { label: 'Resolved', bg: 'rgba(74, 222, 128, 0.15)', color: '#4ade80', border: 'rgba(74, 222, 128, 0.3)' };
      case 'CLOSED':
        return { label: 'Closed', bg: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', border: 'rgba(148, 163, 184, 0.3)' };
      default:
        return { label: statusStr || 'Submitted', bg: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', border: 'rgba(148, 163, 184, 0.3)' };
    }
  };

  const getPriorityBadge = (priorityStr) => {
    const p = (priorityStr || '').toUpperCase();
    switch (p) {
      case 'URGENT': return { label: 'Urgent', color: '#f87171' };
      case 'HIGH': return { label: 'High', color: '#facc15' };
      case 'LOW': return { label: 'Low', color: '#94a3b8' };
      default: return { label: 'Medium', color: '#60a5fa' };
    }
  };

  // Filter logic
  const filteredRequests = requests.filter(req => {
    const status = (req.StatusCode || req.StatusName || '').toUpperCase();
    if (statusFilter === 'OPEN' && !['NEW', 'APPROVED', 'ASSIGNED', 'IN_PROGRESS'].includes(status)) return false;
    if (statusFilter === 'PENDING' && status !== 'PENDING') return false;
    if (statusFilter === 'RESOLVED' && !['RESOLVED', 'CLOSED'].includes(status)) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = (req.Title || '').toLowerCase().includes(q);
      const codeMatch = (req.IssueRequestCode || '').toLowerCase().includes(q);
      const serviceMatch = (req.ServiceName || '').toLowerCase().includes(q);
      return titleMatch || codeMatch || serviceMatch;
    }
    return true;
  });

  if (selectedRequest) {
    return (
      <IssueDetailView
        issue={selectedRequest}
        onBack={() => {
          setSelectedRequest(null);
          navigate(location.pathname, { replace: true });
          fetchMyRequests();
        }}
        onRefresh={fetchMyRequests}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <LifeBuoy size={26} style={{ color: 'var(--accent-primary)' }} /> My Service <span className="glow-text">Requests</span>
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            View and track all service requests submitted by you across the Business Park.
          </p>
        </div>

        <button
          onClick={() => navigate('/issues/create')}
          style={{
            padding: '10px 20px',
            borderRadius: '10px',
            background: 'var(--accent-gradient)',
            color: '#ffffff',
            border: 'none',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)'
          }}
        >
          <Plus size={18} /> Create Request
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel" style={{ padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        
        {/* Status Chips */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: 'All My Requests' },
            { id: 'OPEN', label: 'Active Open' },
            { id: 'PENDING', label: 'Action Needed' },
            { id: 'RESOLVED', label: 'Resolved & Closed' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              style={{
                padding: '6px 14px',
                borderRadius: '16px',
                fontSize: '0.8rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: statusFilter === tab.id ? 'var(--accent-gradient)' : 'var(--bg-tertiary)',
                color: statusFilter === tab.id ? '#ffffff' : 'var(--text-secondary)',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input, View Mode & Refresh */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by request code or title..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                padding: '8px 14px 8px 36px',
                borderRadius: '8px',
                border: '1px solid var(--glass-border)',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                width: '230px'
              }}
            />
          </div>

          {/* View Mode Toggle */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--glass-border)',
            borderRadius: '8px',
            padding: '3px',
            gap: '2px'
          }}>
            <button
              onClick={() => setViewMode('table')}
              title="Table View (with horizontal scroll)"
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                border: 'none',
                background: viewMode === 'table' ? 'var(--accent-gradient)' : 'transparent',
                color: viewMode === 'table' ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.78rem',
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
            >
              <List size={14} /> Table
            </button>
            <button
              onClick={() => setViewMode('cards')}
              title="Card Grid View"
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                border: 'none',
                background: viewMode === 'cards' ? 'var(--accent-gradient)' : 'transparent',
                color: viewMode === 'cards' ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.78rem',
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
            >
              <LayoutGrid size={14} /> Cards
            </button>
          </div>

          <button
            onClick={fetchMyRequests}
            style={{
              padding: '8px',
              borderRadius: '8px',
              border: '1px solid var(--glass-border)',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}
            title="Refresh list"
          >
            <RefreshCw size={16} />
          </button>
        </div>

      </div>

      {/* Requests Container */}
      {viewMode === 'table' ? (
        <div className="glass-panel" style={{ borderRadius: 'var(--border-radius-md)', padding: 0, overflow: 'hidden' }}>
          {/* Table Subheader Bar with Live Count & Horizontal Scroll Cue */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 20px',
            borderBottom: '1px solid var(--glass-border)',
            background: 'rgba(255, 255, 255, 0.02)',
            fontSize: '0.82rem',
            color: 'var(--text-muted)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>My Requests</span>
              <span style={{
                background: 'rgba(99, 102, 241, 0.12)',
                color: 'var(--accent-primary)',
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '0.75rem',
                fontWeight: 700
              }}>
                {filteredRequests.length} {filteredRequests.length === 1 ? 'request' : 'requests'}
              </span>
            </div>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              background: 'var(--bg-tertiary)',
              padding: '4px 10px',
              borderRadius: '6px',
              border: '1px solid var(--glass-border)'
            }}>
              <MoveHorizontal size={13} color="var(--accent-primary)" />
              <span>Horizontal Scroll Enabled</span>
            </div>
          </div>

          {/* Table with Horizontal Scrollbar */}
          <div className="table-scroll-container" tabIndex={0} role="region" aria-label="My Requests Table">
            <table className="custom-table" style={{ width: '100%', minWidth: '1200px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--glass-border)' }}>
                  <th style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontWeight: '600', minWidth: '220px' }}>Request # & Title</th>
                  <th style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontWeight: '600', minWidth: '180px' }}>Service & Category</th>
                  <th style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontWeight: '600', minWidth: '120px' }}>Priority</th>
                  <th style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontWeight: '600', minWidth: '130px' }}>Status</th>
                  <th style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontWeight: '600', minWidth: '160px' }}>Assigned Tech</th>
                  <th style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontWeight: '600', minWidth: '130px' }}>Submitted Date</th>
                  <th style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontWeight: '600', minWidth: '130px' }}>Last Updated</th>
                  <th style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontWeight: '600', minWidth: '160px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Loading your service requests...
                    </td>
                  </tr>
                ) : filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <CheckCircle2 size={36} style={{ color: '#4ade80', marginBottom: '10px' }} />
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>No requests found</div>
                      <div style={{ fontSize: '0.85rem' }}>
                        {statusFilter !== 'ALL' ? 'No issues match the selected filter.' : 'You have not submitted any service requests yet.'}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map(req => {
                    const statusBadge = getStatusBadge(req.StatusCode || req.StatusName);
                    const priorityBadge = getPriorityBadge(req.PriorityCode);

                    return (
                      <tr
                        key={req.IssueRequestID || req.id}
                        onClick={() => setSelectedRequest(req)}
                        style={{ borderBottom: '1px solid var(--glass-border)', cursor: 'pointer', transition: 'background-color 0.15s ease' }}
                        className="table-row-hover"
                      >
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontWeight: '800', color: 'var(--accent-primary)', fontFamily: 'monospace' }}>
                            {req.IssueRequestCode || `#${req.IssueRequestID}`}
                          </div>
                          <div style={{
                            fontWeight: '600',
                            color: 'var(--text-primary)',
                            marginTop: '2px',
                            maxWidth: '260px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }} title={req.Title}>
                            {req.Title}
                          </div>
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{req.ServiceName || 'General Service'}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{req.CategoryName || 'Standard'}</div>
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: priorityBadge.color }}>
                            {priorityBadge.label}
                          </span>
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          <span style={{
                            padding: '3px 10px',
                            borderRadius: '12px',
                            fontSize: '0.73rem',
                            fontWeight: 700,
                            background: statusBadge.bg,
                            color: statusBadge.color,
                            border: `1px solid ${statusBadge.border}`
                          }}>
                            {statusBadge.label}
                          </span>
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          <span style={{ color: req.AssignedTechnicianName ? '#c084fc' : 'var(--text-muted)', fontWeight: req.AssignedTechnicianName ? 600 : 400 }}>
                            {req.AssignedTechnicianName || 'Unassigned'}
                          </span>
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                            {new Date(req.CreatedAt || req.RequestDate || Date.now()).toLocaleDateString()}
                          </div>
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Clock size={13} />
                            {new Date(req.UpdatedAt || req.CreatedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>

                        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedRequest(req); }}
                            style={{
                              padding: '7px 12px',
                              borderRadius: '8px',
                              background: 'rgba(37,99,235,0.12)',
                              border: '1px solid rgba(37,99,235,0.3)',
                              color: '#60a5fa',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <Eye size={14} /> Details & Chat
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cards View */
        <div className="glass-panel" style={{ padding: '24px' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading your service requests...
            </div>
          ) : filteredRequests.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <CheckCircle2 size={40} style={{ color: '#4ade80', marginBottom: '12px' }} />
              <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>No requests found</h4>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>
                {statusFilter !== 'ALL' ? 'No issues match the selected filter.' : 'You have not submitted any service requests yet.'}
              </p>
              <button
                onClick={() => navigate('/issues/create')}
                style={{
                  marginTop: '16px',
                  padding: '8px 18px',
                  borderRadius: '8px',
                  background: 'var(--accent-gradient)',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Plus size={16} /> Submit Service Request
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredRequests.map(req => {
                const statusBadge = getStatusBadge(req.StatusCode || req.StatusName);
                const priorityBadge = getPriorityBadge(req.PriorityCode);

                return (
                  <div
                    key={req.IssueRequestID || req.id}
                    onClick={() => setSelectedRequest(req)}
                    style={{
                      padding: '18px 20px',
                      borderRadius: '12px',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--glass-border)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '16px'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'var(--accent-primary)';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--glass-border)';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--accent-primary)', fontFamily: 'monospace' }}>
                          {req.IssueRequestCode || `#${req.IssueRequestID}`}
                        </span>

                        <span style={{
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontSize: '0.73rem',
                          fontWeight: 700,
                          background: statusBadge.bg,
                          color: statusBadge.color,
                          border: `1px solid ${statusBadge.border}`
                        }}>
                          {statusBadge.label}
                        </span>

                        <span style={{ fontSize: '0.73rem', fontWeight: 700, color: priorityBadge.color }}>
                          Priority: {priorityBadge.label}
                        </span>

                        {req.ServiceName && (
                          <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: '4px' }}>
                            Service: {req.ServiceName}
                          </span>
                        )}
                      </div>

                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {req.Title}
                      </h4>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        <span>Submitted: {new Date(req.CreatedAt || req.RequestDate || Date.now()).toLocaleDateString()}</span>
                        <span>Assigned Tech: <strong style={{ color: req.AssignedTechnicianName ? '#c084fc' : 'var(--text-muted)' }}>{req.AssignedTechnicianName || 'Unassigned'}</strong></span>
                        <span>Last Updated: {new Date(req.UpdatedAt || req.CreatedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    <div>
                      <button style={{
                        padding: '8px 14px',
                        borderRadius: '8px',
                        background: 'rgba(37,99,235,0.12)',
                        border: '1px solid rgba(37,99,235,0.3)',
                        color: '#60a5fa',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        View Details & Chat <ChevronRight size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
