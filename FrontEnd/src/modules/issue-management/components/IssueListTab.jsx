import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  AlertTriangle,
  UserCheck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Eye,
  Plus,
  Clock,
  Building,
  Tag,
  ChevronRight,
  ChevronLeft,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoveHorizontal,
  Calendar,
  X
} from 'lucide-react';
import issueManagementApi from '../api/issueManagementApi';
import PermissionGuard from '../../../components/common/PermissionGuard';
import ConfirmDialogModal from '../../../components/common/ConfirmDialogModal';
import AlertDialogModal from '../../../components/common/AlertDialogModal';
import { useTranslation } from '../../../i18n';

export const IssueListTab = ({
  onSelectIssue,
  onOpenCreateModal,
  onOpenAssignModal,
  onOpenStatusModal,
  refreshKey
}) => {
  const { t, isRTL } = useTranslation();
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || '';
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [priorityFilter, setPriorityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Sorting & Pagination State
  const [sortField, setSortField] = useState('CreatedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Glass Dialog Modals State
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'error' });

  const showAlert = (title, message, type = 'error') => {
    setAlertConfig({ isOpen: true, title, message, type });
  };

  useEffect(() => {
    const qStatus = searchParams.get('status') || '';
    if (qStatus !== statusFilter) {
      setStatusFilter(qStatus);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchIssues();
    setCurrentPage(1);
  }, [statusFilter, priorityFilter, typeFilter, refreshKey]);

  const fetchIssues = async (searchTerm = search) => {
    try {
      setLoading(true);
      setError(null);
      const res = await issueManagementApi.getIssues({
        search: searchTerm,
        statusCode: statusFilter || undefined,
        priorityCode: priorityFilter || undefined,
        requestTypeCode: typeFilter || undefined
      });
      // Axios envelope: res.data.data.issues
      setIssues(res.data?.data?.issues || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch issue requests');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchIssues(search);
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPriorityFilter('');
    setTypeFilter('');
    setCurrentPage(1);
    fetchIssues('');
  };

  const hasActiveFilters = Boolean(statusFilter || priorityFilter || typeFilter || search.trim());

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const sortedIssues = [...issues].sort((a, b) => {
    let valA = a[sortField] || '';
    let valB = b[sortField] || '';
    if (sortField === 'CreatedAt' || sortField === 'RequestDate') {
      valA = new Date(valA || 0).getTime();
      valB = new Date(valB || 0).getTime();
    } else if (typeof valA === 'string') {
      valA = valA.toLowerCase();
      valB = (valB || '').toLowerCase();
    }
    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedIssues.length / pageSize) || 1;
  const paginatedIssues = sortedIssues.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleCancelIssue = async (issue) => {
    setConfirmConfig({
      isOpen: true,
      title: t('issues.cancelRequest', 'Cancel Issue Request'),
      message: t('issues.confirmCancelMsg', { num: issue.RequestNumber }) || `Are you sure you want to cancel issue request '${issue.RequestNumber}'?`,
      type: 'warning',
      confirmText: t('issues.confirmCancel', 'Confirm Cancellation'),
      onConfirm: async () => {
        try {
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          await issueManagementApi.cancelIssue(issue.IssueRequestID, { cancellationReason: 'Cancelled by user' });
          fetchIssues();
        } catch (err) {
          const msg = err.response?.data?.message || 'Failed to cancel issue request';
          showAlert(t('issues.actionRestricted', 'Action Restricted'), msg, 'error');
        }
      }
    });
  };

  const handleReopenIssue = async (issue) => {
    setConfirmConfig({
      isOpen: true,
      title: t('issues.reopenRequest', 'Reopen Issue Request'),
      message: t('issues.confirmReopenMsg', { num: issue.RequestNumber }) || `Are you sure you want to reopen issue request '${issue.RequestNumber}'?`,
      type: 'info',
      confirmText: t('issues.confirmReopen', 'Reopen Request'),
      onConfirm: async () => {
        try {
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          await issueManagementApi.reopenIssue(issue.IssueRequestID, { remarks: 'Reopened by user' });
          fetchIssues();
        } catch (err) {
          const msg = err.response?.data?.message || 'Failed to reopen issue request';
          showAlert(t('issues.actionRestricted', 'Action Restricted'), msg, 'error');
        }
      }
    });
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toUpperCase();
    const labelMap = {
      NEW: t('issues.statusNew', 'New'),
      ASSIGNED: t('issues.statusAssigned', 'Assigned'),
      IN_PROGRESS: t('issues.statusInProgress', 'In Progress'),
      PENDING: t('issues.statusPending', 'Pending'),
      RESOLVED: t('issues.statusResolved', 'Resolved'),
      CLOSED: t('issues.statusClosed', 'Closed'),
      CANCELLED: t('issues.statusCancelled', 'Cancelled')
    };
    const clsMap = {
      NEW: 'status-new',
      ASSIGNED: 'status-assigned',
      IN_PROGRESS: 'status-in-progress',
      PENDING: 'status-pending',
      RESOLVED: 'status-resolved',
      CLOSED: 'status-closed',
      CANCELLED: 'status-cancelled'
    };
    return (
      <span className={`status-badge ${clsMap[s] || 'status-new'}`}>
        {labelMap[s] || status?.replace('_', ' ')}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const p = (priority || '').toUpperCase();
    const labelMap = {
      CRITICAL: t('issues.priorityCritical', 'Critical'),
      HIGH: t('issues.priorityHigh', 'High'),
      MEDIUM: t('issues.priorityMedium', 'Medium'),
      LOW: t('issues.priorityLow', 'Low')
    };
    const clsMap = {
      CRITICAL: 'priority-critical',
      HIGH: 'priority-high',
      MEDIUM: 'priority-medium',
      LOW: 'priority-low'
    };
    return (
      <span className={`priority-chip ${clsMap[p] || 'priority-medium'}`}>
        {labelMap[p] || priority}
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Search & Filter Toolbar */}
      <div className="enterprise-card p-3 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 min-w-0">
          <div style={{ position: 'relative', flex: '1', minWidth: 0 }}>
            <Search size={16} style={{ position: 'absolute', [isRTL ? 'right' : 'left']: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              placeholder={t('common.searchPlaceholder', 'Search by Request #, title, description, or requester name...')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control"
              style={{
                width: '100%',
                padding: isRTL ? '8px 36px 8px 12px' : '8px 12px 8px 36px',
                fontSize: '0.86rem'
              }}
            />
          </div>
          <button type="submit" className="btn btn-secondary touch-target-sm shrink-0">
            {t('common.search', 'Search')}
          </button>
        </form>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-select flex-1 sm:flex-initial"
            style={{ padding: '8px 12px', fontSize: '0.84rem' }}
          >
            <option value="">{t('common.all', 'All')} {t('issues.status', 'Statuses')}</option>
            <option value="NEW">{t('issues.statusNew', 'New')}</option>
            <option value="ASSIGNED">{t('issues.statusAssigned', 'Assigned')}</option>
            <option value="IN_PROGRESS">{t('issues.statusInProgress', 'In Progress')}</option>
            <option value="PENDING">{t('issues.statusPending', 'Pending')}</option>
            <option value="RESOLVED">{t('issues.statusResolved', 'Resolved')}</option>
            <option value="CLOSED">{t('issues.statusClosed', 'Closed')}</option>
            <option value="CANCELLED">{t('issues.statusCancelled', 'Cancelled')}</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="form-select flex-1 sm:flex-initial"
            style={{ padding: '8px 12px', fontSize: '0.84rem' }}
          >
            <option value="">{t('common.all', 'All')} {t('issues.priority', 'Priorities')}</option>
            <option value="CRITICAL">{t('issues.priorityCritical', 'Critical')}</option>
            <option value="HIGH">{t('issues.priorityHigh', 'High')}</option>
            <option value="MEDIUM">{t('issues.priorityMedium', 'Medium')}</option>
            <option value="LOW">{t('issues.priorityLow', 'Low')}</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="form-select flex-1 sm:flex-initial"
            style={{ padding: '8px 12px', fontSize: '0.84rem' }}
          >
            <option value="">{t('common.all', 'All')} {t('issues.requestType', 'Types')}</option>
            <option value="INCIDENT">{t('issues.incident', 'Incident')}</option>
            <option value="MAINTENANCE">{t('issues.maintenance', 'Maintenance')}</option>
            <option value="COMPLAINT">{t('issues.complaint', 'Complaint')}</option>
            <option value="DISRUPTION">{t('issues.disruption', 'Disruption')}</option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="btn btn-outline touch-target-sm"
              title={t('common.clearFilters', 'Reset all active filters')}
              style={{ padding: '7px 11px', fontSize: '0.82rem' }}
            >
              <RotateCcw size={13} /> {t('common.reset', 'Reset')}
            </button>
          )}

          <PermissionGuard anyPermission={['Issue.Create', 'Request.Create', 'issue:create']}>
            <button className="btn btn-primary touch-target w-full sm:w-auto" onClick={onOpenCreateModal} style={{ padding: '8px 16px' }}>
              <Plus size={16} /> {t('issues.createIssue', 'Submit New Request')}
            </button>
          </PermissionGuard>
        </div>
      </div>

      {error && (
        <div style={{ padding: '14px 18px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      {/* Issues Table with Professional Horizontal Scroll Container */}
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
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{t('nav.issues', 'Issue Requests')}</span>
            <span style={{
              background: 'rgba(99, 102, 241, 0.12)',
              color: 'var(--accent-primary)',
              padding: '2px 8px',
              borderRadius: '10px',
              fontSize: '0.75rem',
              fontWeight: 700
            }}>
              {issues.length} {issues.length === 1 ? t('common.record', 'record') : t('common.records', 'records')}
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
            <span>{t('issues.scrollEnabled', 'Horizontal Scroll Enabled')}</span>
          </div>
        </div>

        {/* Scrollable Table Area */}
        <div className="table-scroll-container" tabIndex={0} role="region" aria-label="Issue Requests Table">
          <table className="custom-table" style={{ width: '100%', minWidth: '1250px', borderCollapse: 'collapse', textAlign: isRTL ? 'right' : 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
                <th
                  onClick={() => handleSort('RequestNumber')}
                  style={{ padding: '14px 18px', color: 'var(--color-text-secondary)', fontWeight: '600', minWidth: '220px', textAlign: isRTL ? 'right' : 'left', cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span>{t('issues.requestNumberAndTitle', 'Request # & Title')}</span>
                    {sortField === 'RequestNumber' ? (sortOrder === 'asc' ? <ArrowUp size={13} color="var(--color-primary)" /> : <ArrowDown size={13} color="var(--color-primary)" />) : <ArrowUpDown size={13} style={{ opacity: 0.35 }} />}
                  </div>
                </th>
                <th style={{ padding: '14px 18px', color: 'var(--color-text-secondary)', fontWeight: '600', minWidth: '180px', textAlign: isRTL ? 'right' : 'left' }}>
                  {t('issues.serviceAndCategory', 'Service & Category')}
                </th>
                <th style={{ padding: '14px 18px', color: 'var(--color-text-secondary)', fontWeight: '600', minWidth: '170px', textAlign: isRTL ? 'right' : 'left' }}>
                  {t('issues.requesterAndTenant', 'Requester & Tenant')}
                </th>
                <th
                  onClick={() => handleSort('PriorityCode')}
                  style={{ padding: '14px 18px', color: 'var(--color-text-secondary)', fontWeight: '600', minWidth: '120px', textAlign: isRTL ? 'right' : 'left', cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span>{t('issues.priority', 'Priority')}</span>
                    {sortField === 'PriorityCode' ? (sortOrder === 'asc' ? <ArrowUp size={13} color="var(--color-primary)" /> : <ArrowDown size={13} color="var(--color-primary)" />) : <ArrowUpDown size={13} style={{ opacity: 0.35 }} />}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('StatusCode')}
                  style={{ padding: '14px 18px', color: 'var(--color-text-secondary)', fontWeight: '600', minWidth: '130px', textAlign: isRTL ? 'right' : 'left', cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span>{t('issues.status', 'Status')}</span>
                    {sortField === 'StatusCode' ? (sortOrder === 'asc' ? <ArrowUp size={13} color="var(--color-primary)" /> : <ArrowDown size={13} color="var(--color-primary)" />) : <ArrowUpDown size={13} style={{ opacity: 0.35 }} />}
                  </div>
                </th>
                <th style={{ padding: '14px 18px', color: 'var(--color-text-secondary)', fontWeight: '600', minWidth: '160px', textAlign: isRTL ? 'right' : 'left' }}>
                  {t('issues.assignedDept', 'Assigned Dept')}
                </th>
                <th
                  onClick={() => handleSort('CreatedAt')}
                  style={{ padding: '14px 18px', color: 'var(--color-text-secondary)', fontWeight: '600', minWidth: '130px', textAlign: isRTL ? 'right' : 'left', cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span>{t('common.date', 'Created Date')}</span>
                    {sortField === 'CreatedAt' ? (sortOrder === 'asc' ? <ArrowUp size={13} color="var(--color-primary)" /> : <ArrowDown size={13} color="var(--color-primary)" />) : <ArrowUpDown size={13} style={{ opacity: 0.35 }} />}
                  </div>
                </th>
                <th style={{ padding: '14px 18px', color: 'var(--color-text-secondary)', fontWeight: '600', minWidth: '180px', textAlign: isRTL ? 'left' : 'right' }}>
                  {t('common.actions', 'Actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '14px 18px' }}>
                      <div className="skeleton-line" style={{ width: '100px', marginBottom: '6px' }} />
                      <div className="skeleton-line" style={{ width: '160px' }} />
                    </td>
                    <td style={{ padding: '14px 18px' }}><div className="skeleton-line" style={{ width: '110px' }} /></td>
                    <td style={{ padding: '14px 18px' }}><div className="skeleton-line" style={{ width: '100px' }} /></td>
                    <td style={{ padding: '14px 18px' }}><div className="skeleton-line" style={{ width: '65px' }} /></td>
                    <td style={{ padding: '14px 18px' }}><div className="skeleton-line" style={{ width: '75px' }} /></td>
                    <td style={{ padding: '14px 18px' }}><div className="skeleton-line" style={{ width: '90px' }} /></td>
                    <td style={{ padding: '14px 18px' }}><div className="skeleton-line" style={{ width: '80px' }} /></td>
                    <td style={{ padding: '14px 18px' }}><div className="skeleton-line" style={{ width: '70px' }} /></td>
                  </tr>
                ))
              ) : paginatedIssues.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '32px 20px', textAlign: 'center' }}>
                    <div className="empty-state-box" style={{ maxWidth: '460px', margin: '0 auto', background: 'transparent', border: 'none' }}>
                      <div className="empty-state-icon">
                        <Search size={22} />
                      </div>
                      <div className="empty-state-title">
                        {hasActiveFilters ? t('common.noMatchingResults', 'No matching requests found') : t('common.noData', 'No issue requests logged yet')}
                      </div>
                      <div className="empty-state-desc">
                        {hasActiveFilters ? t('common.tryAdjustingFilters', 'Try adjusting your search criteria or resetting filters.') : t('issues.startByCreating', 'Create your first service request to begin tracking operational workflows.')}
                      </div>
                      {hasActiveFilters ? (
                        <button type="button" className="btn btn-secondary" onClick={handleClearFilters}>
                          <RotateCcw size={14} /> {t('common.clearFilters', 'Reset Filters')}
                        </button>
                      ) : (
                        <PermissionGuard anyPermission={['Issue.Create', 'Request.Create', 'issue:create']}>
                          <button type="button" className="btn btn-primary" onClick={onOpenCreateModal}>
                            <Plus size={15} /> {t('issues.createIssue', 'Submit New Request')}
                          </button>
                        </PermissionGuard>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedIssues.map((issue) => (
                  <tr
                    key={issue.IssueRequestID}
                    style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer', transition: 'background-color 0.15s ease' }}
                    className="table-row-hover"
                  >
                    <td style={{ padding: '14px 18px' }} onClick={() => onSelectIssue?.(issue)}>
                      <div style={{ fontWeight: '700', color: 'var(--color-primary)' }}>{issue.RequestNumber}</div>
                      <div style={{
                        fontWeight: '600',
                        color: 'var(--color-text)',
                        marginTop: '2px',
                        maxWidth: '260px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }} title={issue.Title}>
                        {issue.Title}
                      </div>
                    </td>

                    <td style={{ padding: '14px 18px' }} onClick={() => onSelectIssue?.(issue)}>
                      <div style={{ fontWeight: '600', color: 'var(--color-text)' }}>{issue.ServiceName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{issue.CategoryName}</div>
                    </td>

                    <td style={{ padding: '14px 18px' }} onClick={() => onSelectIssue?.(issue)}>
                      <div style={{ fontWeight: '600', color: 'var(--color-text)' }}>{issue.RequesterName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{issue.TenantName || 'Business Park'}</div>
                    </td>

                    <td style={{ padding: '14px 18px' }} onClick={() => onSelectIssue?.(issue)}>
                      {getPriorityBadge(issue.PriorityCode)}
                    </td>

                    <td style={{ padding: '14px 18px' }} onClick={() => onSelectIssue?.(issue)}>
                      {getStatusBadge(issue.StatusCode)}
                    </td>

                    <td style={{ padding: '14px 18px' }} onClick={() => onSelectIssue?.(issue)}>
                      <span style={{ color: issue.AssignedDepartmentName ? 'var(--color-text)' : 'var(--color-text-muted)', fontStyle: issue.AssignedDepartmentName ? 'normal' : 'italic' }}>
                        {issue.AssignedDepartmentName || t('issues.unassigned', 'Unassigned')}
                      </span>
                    </td>

                    <td style={{ padding: '14px 18px' }} onClick={() => onSelectIssue?.(issue)}>
                      <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Calendar size={13} style={{ color: 'var(--color-text-muted)' }} />
                        {issue.CreatedAt ? new Date(issue.CreatedAt).toLocaleDateString() : (issue.RequestDate ? new Date(issue.RequestDate).toLocaleDateString() : '—')}
                      </div>
                    </td>

                    <td style={{ padding: '14px 18px', textAlign: isRTL ? 'left' : 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          title={t('issues.viewDetailsAndChat', 'View Details & Timeline')}
                          onClick={(e) => { e.stopPropagation(); onSelectIssue?.(issue); }}
                          className="btn btn-secondary btn-icon"
                        >
                          <Eye size={15} />
                        </button>

                        {issue.StatusCode !== 'CLOSED' && issue.StatusCode !== 'CANCELLED' && (
                          <>
                            <PermissionGuard anyPermission={['Issue.Assign', 'Request.Assign', 'issue:update']}>
                              <button
                                title={t('issues.assignIssue', 'Assign Department')}
                                onClick={(e) => { e.stopPropagation(); onOpenAssignModal?.(issue); }}
                                className="btn btn-outline btn-icon"
                                style={{ color: '#c084fc', borderColor: 'rgba(168, 85, 247, 0.3)' }}
                              >
                                <UserCheck size={15} />
                              </button>
                            </PermissionGuard>

                            <PermissionGuard anyPermission={['Issue.Resolve', 'Issue.Update', 'Request.Resolve', 'issue:update']}>
                              <button
                                title={t('issues.updateStatus', 'Update Status')}
                                onClick={(e) => { e.stopPropagation(); onOpenStatusModal?.(issue); }}
                                className="btn btn-outline btn-icon"
                                style={{ color: 'var(--color-primary)', borderColor: 'var(--color-primary-border)' }}
                              >
                                <Clock size={15} />
                              </button>
                            </PermissionGuard>

                            <PermissionGuard anyPermission={['Issue.Cancel', 'Issue.Delete', 'Request.Close', 'issue:delete']}>
                              <button
                                title={t('issues.cancelTicket', 'Cancel Request')}
                                onClick={(e) => { e.stopPropagation(); handleCancelIssue(issue); }}
                                className="btn btn-danger btn-icon"
                              >
                                <XCircle size={15} />
                              </button>
                            </PermissionGuard>
                          </>
                        )}

                        {issue.StatusCode === 'CLOSED' && (
                          <PermissionGuard anyPermission={['Issue.Update', 'Request.Update', 'issue:update']}>
                            <button
                              title="Reopen Issue"
                              onClick={(e) => { e.stopPropagation(); handleReopenIssue(issue); }}
                              className="btn btn-success btn-sm"
                            >
                              <RotateCcw size={13} /> Reopen
                            </button>
                          </PermissionGuard>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {!loading && sortedIssues.length > 0 && (
          <div className="pagination-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span>
                {t('common.showingRecords', {
                  start: (currentPage - 1) * pageSize + 1,
                  end: Math.min(currentPage * pageSize, sortedIssues.length),
                  total: sortedIssues.length
                }) || `Showing ${(currentPage - 1) * pageSize + 1} to ${Math.min(currentPage * pageSize, sortedIssues.length)} of ${sortedIssues.length} records`}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{t('common.perPage', 'Per page')}:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="form-select"
                  style={{ width: 'auto', padding: '3px 8px', fontSize: '0.78rem' }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="pagination-controls">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="pagination-btn"
                title={t('common.previous', 'Previous Page')}
              >
                <ChevronLeft size={14} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                .map((page, idx, arr) => (
                  <React.Fragment key={page}>
                    {idx > 0 && arr[idx - 1] !== page - 1 && <span style={{ padding: '0 4px', color: 'var(--color-text-muted)' }}>...</span>}
                    <button
                      onClick={() => setCurrentPage(page)}
                      className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                ))}

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="pagination-btn"
                title={t('common.next', 'Next Page')}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

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
};

export default IssueListTab;
