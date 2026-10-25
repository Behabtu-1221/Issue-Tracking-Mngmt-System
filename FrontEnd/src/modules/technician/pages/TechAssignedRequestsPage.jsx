import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Wrench, Search, Filter, RefreshCw, ChevronLeft, ChevronRight,
  Clock, AlertTriangle, CheckCircle2, User, Building, Layers,
  ListChecks, Calendar, Eye, ShieldAlert, ArrowUpDown
} from 'lucide-react';
import { usePermissionContext } from '../../role-permission-management/contexts/PermissionContext';
import technicianApi from '../api/technicianApi';
import { useTranslation } from '../../../i18n';

export default function TechAssignedRequestsPage({ defaultStatus = 'ALL', customTitle = null }) {
  const { t } = useTranslation();
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
        return { label: t('issues.priorityUrgent', 'Urgent'), className: 'priority-chip priority-critical' };
      case 'HIGH':
        return { label: t('issues.priorityHigh', 'High'), className: 'priority-chip priority-high' };
      case 'LOW':
        return { label: t('issues.priorityLow', 'Low'), className: 'priority-chip priority-low' };
      default:
        return { label: t('issues.priorityMedium', 'Medium'), className: 'priority-chip priority-medium' };
    }
  };

  const getStatusBadge = (statusStr) => {
    const s = (statusStr || '').toUpperCase();
    switch (s) {
      case 'ASSIGNED':
      case 'NEW':
        return { label: t('issues.statusAssigned', 'Assigned'), className: 'status-badge status-assigned' };
      case 'ACCEPTED':
      case 'IN_PROGRESS':
        return { label: t('issues.statusInProgress', 'In Progress'), className: 'status-badge status-in-progress' };
      case 'PAUSED':
      case 'PENDING':
        return { label: t('issues.statusPending', 'Pending'), className: 'status-badge status-pending' };
      case 'COMPLETED':
      case 'RESOLVED':
        return { label: t('issues.statusResolved', 'Resolved'), className: 'status-badge status-resolved' };
      default:
        return { label: s || t('issues.statusSubmitted', 'Active'), className: 'status-badge status-closed' };
    }
  };

  const totalPages = Math.ceil(totalCount / limit) || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '32px' }}>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] flex items-center gap-2.5">
            <Wrench size={24} color="var(--accent-primary)" />
            {customTitle || t('techAssigned.title', 'Technician Work Roster')} <span className="glow-text text-sm">
              {statusFilter !== 'ALL' ? `(${statusFilter})` : ''}
            </span>
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[var(--text-muted)]">
            {t('techAssigned.subtitle', 'View and manage service requests assigned directly to your technical workload.')}
          </p>
        </div>

        <button onClick={fetchData} className="btn btn-secondary touch-target-sm w-full sm:w-auto flex items-center justify-center gap-2">
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> {t('techAssigned.refreshRoster', 'Refresh Roster')}
        </button>
      </div>

      {/* Filters Bar */}
      <div className="enterprise-card p-3 sm:p-4 flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder={t('techAssigned.searchPlaceholder', 'Search by title, request #, or requester...')}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full"
            style={{
              padding: '9px 12px 9px 36px', borderRadius: '8px',
              background: 'var(--color-surface)', border: '1px solid var(--color-border)',
              color: 'var(--color-text-main)', fontSize: '0.83rem', outline: 'none', boxSizing: 'border-box'
            }}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
            <Filter size={14} color="var(--text-muted)" />
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full sm:w-auto"
              style={{
                padding: '9px 12px', borderRadius: '8px',
                background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                color: 'var(--color-text-main)', fontSize: '0.83rem', outline: 'none', cursor: 'pointer'
              }}
            >
              <option value="ALL">{t('techAssigned.allStatuses', 'All Statuses')}</option>
              <option value="ASSIGNED">{t('techAssigned.assignedNew', 'Assigned / New')}</option>
              <option value="IN_PROGRESS">{t('techAssigned.inProgress', 'In Progress')}</option>
              <option value="PAUSED">{t('techAssigned.pendingPaused', 'Pending / Paused')}</option>
              <option value="COMPLETED">{t('techAssigned.resolvedCompleted', 'Resolved / Completed')}</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
            <AlertTriangle size={14} color="var(--text-muted)" />
            <select
              value={priorityFilter}
              onChange={e => { setPriorityFilter(e.target.value); setPage(1); }}
              className="w-full sm:w-auto"
              style={{
                padding: '9px 12px', borderRadius: '8px',
                background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                color: 'var(--color-text-main)', fontSize: '0.83rem', outline: 'none', cursor: 'pointer'
              }}
            >
              <option value="ALL">{t('techAssigned.allPriorities', 'All Priorities')}</option>
              <option value="CRITICAL">{t('issues.priorityCritical', 'Critical')}</option>
              <option value="HIGH">{t('issues.priorityHigh', 'High')}</option>
              <option value="MEDIUM">{t('issues.priorityMedium', 'Medium')}</option>
              <option value="LOW">{t('issues.priorityLow', 'Low')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="enterprise-card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            {t('techAssigned.loading', 'Fetching technician assigned requests...')}
          </div>
        ) : requests.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <ListChecks size={40} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{t('techAssigned.emptyTitle', 'No Assigned Requests Found')}</div>
            <div style={{ fontSize: '0.82rem', marginTop: '4px' }}>{t('techAssigned.emptyDesc', 'There are no active assigned requests matching your filter criteria.')}</div>
          </div>
        ) : (
          <>
            {/* Mobile Card Roster (Visible on screens < md) */}
            <div className="block md:hidden p-3 space-y-3">
              {requests.map(req => {
                const pBadge = getPriorityBadge(req.PriorityCode);
                const sBadge = getStatusBadge(req.AssignmentStatusCode || req.RequestStatusCode);
                const assignmentId = req.AssignmentID || req.id;

                return (
                  <div
                    key={assignmentId}
                    onClick={() => navigate(`/technician/request/${assignmentId}`)}
                    className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] active:scale-[0.99] transition-transform"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-extrabold text-xs text-[var(--accent-primary)] bg-[rgba(99,102,241,0.1)] px-2 py-0.5 rounded">
                        {req.RequestNumber || `#${req.RequestID}`}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className={pBadge.className}>{pBadge.label}</span>
                        <span className={sBadge.className}>{sBadge.label}</span>
                      </div>
                    </div>

                    <h4 className="font-bold text-sm text-[var(--text-primary)] mb-1.5 line-clamp-2">
                      {req.RequestTitle || req.Title}
                    </h4>

                    <div className="text-xs text-[var(--text-muted)] space-y-1 mb-3">
                      <div className="flex items-center justify-between">
                        <span>Service: <strong className="text-[var(--text-primary)]">{req.ServiceName || 'General Service'}</strong></span>
                        <span>{req.CreatedDate ? new Date(req.CreatedDate).toLocaleDateString() : 'Recent'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Requester: <strong className="text-[var(--text-primary)]">{req.RequesterName || 'Tenant Staff'}</strong></span>
                        <span>Dept: {req.DepartmentName || 'Unassigned'}</span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/technician/request/${assignmentId}`);
                      }}
                      className="btn btn-primary touch-target w-full flex items-center justify-center gap-2 text-xs font-bold"
                    >
                      <Eye size={15} /> {t('techAssigned.openWorkspace', 'Open Workspace')}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table (Visible on screens >= md) */}
            <div className="hidden md:block table-scroll-container">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    <th style={{ padding: '14px 16px' }}>{t('techAssigned.requestNumber', 'Request #')}</th>
                    <th style={{ padding: '14px 16px' }}>{t('techAssigned.subject', 'Subject')}</th>
                    <th style={{ padding: '14px 16px' }}>{t('issues.service', 'Service')}</th>
                    <th style={{ padding: '14px 16px' }}>{t('techAssigned.requester', 'Requester')}</th>
                    <th style={{ padding: '14px 16px' }}>{t('profile.department', 'Department')}</th>
                    <th style={{ padding: '14px 16px' }}>{t('techAssigned.priority', 'Priority')}</th>
                    <th style={{ padding: '14px 16px' }}>{t('techAssigned.status', 'Status')}</th>
                    <th style={{ padding: '14px 16px' }}>{t('techAssigned.assignedDate', 'Assigned Date')}</th>
                    <th style={{ padding: '14px 16px', textAlign: 'right' }}>{t('techAssigned.action', 'Action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(req => {
                    const pBadge = getPriorityBadge(req.PriorityCode);
                    const sBadge = getStatusBadge(req.AssignmentStatusCode || req.RequestStatusCode);
                    const assignmentId = req.AssignmentID || req.id;

                    return (
                      <tr key={assignmentId} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.15s ease' }} className="table-row-hover">
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
                          <span className={pBadge.className}>
                            {pBadge.label}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span className={sBadge.className}>
                            {sBadge.label}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                          {req.CreatedDate ? new Date(req.CreatedDate).toLocaleDateString() : 'Recent'}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <button onClick={() => navigate(`/technician/request/${assignmentId}`)} className="btn btn-primary btn-sm touch-target-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <Eye size={13} /> {t('techAssigned.openWorkspace', 'Open Workspace')}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination Footer */}
        <div className="pagination-bar">
          <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
            {t('common.showing', 'Showing')} {requests.length} {t('common.of', 'of')} {totalCount} {t('techAssigned.recordsCount', { count: totalCount }, 'assigned requests')}
          </span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button disabled={page <= 1} onClick={() => setPage(prev => Math.max(prev - 1, 1))} className="pagination-btn">
              <ChevronLeft size={14} /> {t('common.prev', 'Prev')}
            </button>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {t('common.page', 'Page')} {page} {t('common.of', 'of')} {totalPages}
            </span>
            <button disabled={page >= totalPages} onClick={() => setPage(prev => Math.min(prev + 1, totalPages))} className="pagination-btn">
              {t('common.next', 'Next')} <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
