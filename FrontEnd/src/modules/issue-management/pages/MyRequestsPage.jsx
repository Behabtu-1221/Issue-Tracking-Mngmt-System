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
import { useTranslation } from '../../../i18n';

export default function MyRequestsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = usePermissionContext();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const urlParamStatus = new URLSearchParams(location.search).get('status');
  const [statusFilter, setStatusFilter] = useState(urlParamStatus || 'ALL');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [viewMode, setViewMode] = useState(() => (typeof window !== 'undefined' && window.innerWidth < 768 ? 'cards' : 'table'));

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
        return { label: t('issues.statusNew', 'New Request'), className: 'status-badge status-new' };
      case 'APPROVED':
        return { label: t('issues.statusApproved', 'Approved'), className: 'status-badge status-assigned' };
      case 'ASSIGNED':
        return { label: t('issues.statusAssigned', 'Assigned'), className: 'status-badge status-assigned' };
      case 'IN_PROGRESS':
        return { label: t('issues.statusInProgress', 'In Progress'), className: 'status-badge status-in-progress' };
      case 'PENDING':
        return { label: t('issues.statusPending', 'Action Needed'), className: 'status-badge status-pending' };
      case 'RESOLVED':
        return { label: t('issues.statusResolved', 'Resolved'), className: 'status-badge status-resolved' };
      case 'CLOSED':
        return { label: t('issues.statusClosed', 'Closed'), className: 'status-badge status-closed' };
      default:
        return { label: statusStr || t('issues.statusSubmitted', 'Submitted'), className: 'status-badge status-closed' };
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3.5 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <LifeBuoy size={26} style={{ color: 'var(--accent-primary)' }} /> {t('issues.myRequests', 'My Service Requests')}
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            {t('issues.myRequestsSubtitle', 'View and track all service requests submitted by you across the Business Park.')}
          </p>
        </div>

        <button onClick={() => navigate('/issues/create')} className="btn btn-primary w-full sm:w-auto touch-target-sm justify-center" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> {t('issues.createIssue', 'Create Request')}
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="enterprise-card" style={{ padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        
        {/* Status Chips */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: t('dashboard.allRequests', 'All My Requests') },
            { id: 'OPEN', label: t('issues.activeOpen', 'Active Open') },
            { id: 'PENDING', label: t('dashboard.actionNeeded', 'Action Needed') },
            { id: 'RESOLVED', label: t('issues.resolvedClosed', 'Resolved & Closed') }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              style={{
                padding: '6px 14px',
                borderRadius: '16px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: statusFilter === tab.id ? 'var(--color-primary)' : 'var(--color-elevated)',
                color: statusFilter === tab.id ? '#ffffff' : 'var(--color-text-secondary)',
                border: '1px solid ' + (statusFilter === tab.id ? 'var(--color-primary)' : 'var(--color-border)'),
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input, View Mode & Refresh */}
        <div className="w-full sm:w-auto flex items-center gap-2.5 flex-wrap">
          <div className="relative flex-1 sm:flex-initial">
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 1, pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder={t('issues.searchMyRequests', 'Search by request code or title...')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="search-input enterprise-input w-full sm:w-[250px]"
            />
          </div>

          {/* View Mode Toggle */}
          <div style={{
            display: 'flex',
            background: 'var(--color-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            padding: '3px',
            gap: '2px'
          }}>
            <button
              onClick={() => setViewMode('table')}
              title={t('issues.tableView', 'Table View')}
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                border: 'none',
                background: viewMode === 'table' ? 'var(--color-primary)' : 'transparent',
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
              <List size={14} /> {t('issues.tableView', 'Table')}
            </button>
            <button
              onClick={() => setViewMode('cards')}
              title={t('issues.cardView', 'Card Grid View')}
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                border: 'none',
                background: viewMode === 'cards' ? 'var(--color-primary)' : 'transparent',
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
              <LayoutGrid size={14} /> {t('issues.cardView', 'Cards')}
            </button>
          </div>

          <button onClick={fetchMyRequests} className="btn-icon" style={{ padding: '8px', borderRadius: '8px' }} title={t('common.refresh', 'Refresh list')}>
            <RefreshCw size={16} />
          </button>
        </div>

      </div>

      {/* Requests Container */}
      {viewMode === 'table' ? (
        <div className="enterprise-card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Table Subheader Bar with Live Count & Horizontal Scroll Cue */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 20px',
            borderBottom: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            fontSize: '0.82rem',
            color: 'var(--color-text-secondary)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{t('issues.myRequests', 'My Requests')}</span>
              <span style={{
                background: 'rgba(99, 102, 241, 0.12)',
                color: 'var(--accent-primary)',
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '0.75rem',
                fontWeight: 700
              }}>
                {filteredRequests.length} {filteredRequests.length === 1 ? t('issues.requestSingle', 'request') : t('issues.requestPlural', 'requests')}
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

          {/* Table with Horizontal Scrollbar */}
          <div className="table-scroll-container" tabIndex={0} role="region" aria-label="My Requests Table">
            <table className="custom-table" style={{ width: '100%', minWidth: '1200px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontWeight: '600', minWidth: '220px' }}>{t('issues.requestNumberAndTitle', 'Request # & Title')}</th>
                  <th style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontWeight: '600', minWidth: '180px' }}>{t('issues.serviceAndCategory', 'Service & Category')}</th>
                  <th style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontWeight: '600', minWidth: '120px' }}>{t('issues.priority', 'Priority')}</th>
                  <th style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontWeight: '600', minWidth: '130px' }}>{t('issues.status', 'Status')}</th>
                  <th style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontWeight: '600', minWidth: '160px' }}>{t('issues.assignedTechnician', 'Assigned Tech')}</th>
                  <th style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontWeight: '600', minWidth: '130px' }}>{t('issues.submittedDate', 'Submitted Date')}</th>
                  <th style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontWeight: '600', minWidth: '130px' }}>{t('issues.lastUpdated', 'Last Updated')}</th>
                  <th style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontWeight: '600', minWidth: '160px', textAlign: 'right' }}>{t('common.actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '14px 18px' }}>
                        <div className="skeleton-box" style={{ width: '80px', height: '16px', marginBottom: '6px' }} />
                        <div className="skeleton-line" style={{ width: '180px', height: '14px' }} />
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div className="skeleton-line" style={{ width: '120px', height: '14px' }} />
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div className="skeleton-box" style={{ width: '70px', height: '22px', borderRadius: '12px' }} />
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div className="skeleton-box" style={{ width: '90px', height: '22px', borderRadius: '12px' }} />
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div className="skeleton-line" style={{ width: '110px', height: '14px' }} />
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div className="skeleton-line" style={{ width: '80px', height: '14px' }} />
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div className="skeleton-line" style={{ width: '60px', height: '14px' }} />
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div className="skeleton-box" style={{ width: '100px', height: '30px', borderRadius: '6px', marginLeft: 'auto' }} />
                      </td>
                    </tr>
                  ))
                ) : filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <CheckCircle2 size={36} style={{ color: '#4ade80', marginBottom: '10px' }} />
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>{t('issues.noRequestsFound', 'No requests found')}</div>
                      <div style={{ fontSize: '0.85rem' }}>
                        {statusFilter !== 'ALL' ? t('issues.noMatchingFilter', 'No issues match the selected filter.') : t('issues.noSubmittedRequests', 'You have not submitted any service requests yet.')}
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
                          <span className={priorityBadge.className}>
                            {priorityBadge.label}
                          </span>
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span className={statusBadge.className}>
                              {statusBadge.label}
                            </span>
                            {(() => {
                              let custom = {};
                              try {
                                custom = req.CustomFieldsDataJson ? (typeof req.CustomFieldsDataJson === 'string' ? JSON.parse(req.CustomFieldsDataJson) : req.CustomFieldsDataJson) : {};
                              } catch (e) {}
                              if (custom.progressPercentage !== undefined && ['IN_PROGRESS', 'PENDING'].includes(req.StatusCode)) {
                                return (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: 'var(--accent-primary)', fontWeight: 800 }}>
                                    <div style={{ width: '40px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                                      <div style={{ width: `${custom.progressPercentage}%`, height: '100%', background: 'var(--accent-primary)' }} />
                                    </div>
                                    <span>{custom.progressPercentage}%</span>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          <span style={{ color: req.AssignedTechnicianName ? '#c084fc' : 'var(--text-muted)', fontWeight: req.AssignedTechnicianName ? 600 : 400 }}>
                            {req.AssignedTechnicianName || t('issues.unassigned', 'Unassigned')}
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
                            className="btn btn-secondary btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          >
                            <Eye size={14} /> {t('issues.detailsAndChat', 'Details & Chat')}
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
        <div className="enterprise-card" style={{ padding: '24px' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[1, 2, 3, 4].map(idx => (
                <div key={idx} className="enterprise-card" style={{ padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '70%' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <div className="skeleton-box" style={{ width: '80px', height: '18px', borderRadius: '4px' }} />
                      <div className="skeleton-box" style={{ width: '90px', height: '18px', borderRadius: '12px' }} />
                    </div>
                    <div className="skeleton-line" style={{ width: '60%', height: '16px' }} />
                    <div className="skeleton-line" style={{ width: '40%', height: '12px' }} />
                  </div>
                  <div className="skeleton-box" style={{ width: '120px', height: '32px', borderRadius: '8px' }} />
                </div>
              ))}
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="empty-state-box" style={{ padding: '48px 24px' }}>
              <CheckCircle2 size={42} style={{ color: 'var(--color-success)', marginBottom: '12px' }} />
              <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-text-main)' }}>{t('issues.noRequestsFound', 'No requests found')}</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)', maxWidth: '380px' }}>
                {statusFilter !== 'ALL' ? t('issues.noMatchingFilter', 'No issues match the selected filter.') : t('issues.noSubmittedRequests', 'You have not submitted any service requests yet.')}
              </p>
              <button
                onClick={() => navigate('/issues/create')}
                className="btn btn-primary"
                style={{ marginTop: '16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={16} /> {t('issues.submitServiceRequest', 'Submit Service Request')}
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
                    className="enterprise-interactive-card"
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--accent-primary)', fontFamily: 'monospace' }}>
                          {req.IssueRequestCode || `#${req.IssueRequestID}`}
                        </span>

                        <span className={statusBadge.className}>
                          {statusBadge.label}
                        </span>

                        <span className={priorityBadge.className}>
                          {t('issues.priority', 'Priority')}: {priorityBadge.label}
                        </span>

                        {req.ServiceName && (
                          <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: '4px' }}>
                            {t('issues.service', 'Service')}: {req.ServiceName}
                          </span>
                        )}
                      </div>

                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {req.Title}
                      </h4>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        <span>{t('issues.submitted', 'Submitted')}: {new Date(req.CreatedAt || req.RequestDate || Date.now()).toLocaleDateString()}</span>
                        <span>{t('issues.assignedTech', 'Assigned Tech')}: <strong style={{ color: req.AssignedTechnicianName ? '#c084fc' : 'var(--text-muted)' }}>{req.AssignedTechnicianName || t('issues.unassigned', 'Unassigned')}</strong></span>
                        <span>{t('issues.lastUpdated', 'Last Updated')}: {new Date(req.UpdatedAt || req.CreatedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    <div>
                      <button className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {t('issues.viewDetailsAndChat', 'View Details & Chat')} <ChevronRight size={15} />
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
