import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History, Search, Filter, RefreshCw, Calendar, CheckCircle2,
  XCircle, Clock, ChevronRight, FileText, ArrowLeft,
  LayoutGrid, List, MoveHorizontal, Eye
} from 'lucide-react';
import issueManagementApi from '../api/issueManagementApi';
import { usePermissionContext } from '../../role-permission-management/contexts/PermissionContext';
import { IssueDetailView } from '../components/IssueDetailView';
import { useTranslation } from '../../../i18n';

export default function RequestHistoryPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = usePermissionContext();

  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL_HISTORY');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [viewMode, setViewMode] = useState('table');

  const currentUserId = user?.UserID || user?.userId;

  useEffect(() => {
    if (currentUserId) {
      fetchHistory();
    }
  }, [currentUserId]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await issueManagementApi.getIssues({ requesterUserId: currentUserId, limit: 200 });
      const data = res.data?.data?.issues || res.data?.data || [];
      setHistoryItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load request history:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (statusStr) => {
    const status = (statusStr || '').toUpperCase();
    switch (status) {
      case 'RESOLVED':
        return { label: t('issues.statusResolved', 'Resolved'), className: 'status-badge status-resolved' };
      case 'CLOSED':
        return { label: t('issues.statusClosed', 'Closed'), className: 'status-badge status-closed' };
      case 'CANCELLED':
        return { label: t('issues.statusCancelled', 'Cancelled'), className: 'status-badge status-closed' };
      default:
        return { label: statusStr || t('issues.statusOpen', 'Active'), className: 'status-badge status-in-progress' };
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

  const filteredItems = historyItems.filter(item => {
    const status = (item.StatusCode || item.StatusName || '').toUpperCase();

    if (statusFilter === 'CLOSED' && status !== 'CLOSED') return false;
    if (statusFilter === 'RESOLVED' && status !== 'RESOLVED') return false;
    if (statusFilter === 'CANCELLED' && status !== 'CANCELLED') return false;

    if (priorityFilter !== 'ALL' && (item.PriorityCode || '').toUpperCase() !== priorityFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = (item.Title || '').toLowerCase().includes(q);
      const codeMatch = (item.IssueRequestCode || '').toLowerCase().includes(q);
      const serviceMatch = (item.ServiceName || '').toLowerCase().includes(q);
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
          fetchHistory();
        }}
        onRefresh={fetchHistory}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <History size={26} style={{ color: 'var(--accent-primary)' }} /> {t('nav.requestHistory', 'Request History')} & <span className="glow-text">{t('issues.auditHistory', 'Audit Log')}</span>
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            {t('issues.historySubtitle', 'Search and filter your historical service requests, resolved tickets, and closed interactions.')}
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="enterprise-card" style={{ padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        
        {/* Status Filters */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL_HISTORY', label: t('dashboard.allHistory', 'All History') },
            { id: 'RESOLVED', label: t('dashboard.resolvedTickets', 'Resolved Tickets') },
            { id: 'CLOSED', label: t('dashboard.closedTickets', 'Closed Tickets') },
            { id: 'CANCELLED', label: t('dashboard.cancelledRequests', 'Cancelled Requests') }
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

        {/* Priority Filter & Search */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="enterprise-input"
            style={{ width: 'auto', padding: '8px 12px' }}
          >
            <option value="ALL">{t('common.all', 'All')} {t('common.priority', 'Priorities')}</option>
            <option value="LOW">{t('issues.priorityLow', 'Low')}</option>
            <option value="MEDIUM">{t('issues.priorityMedium', 'Medium')}</option>
            <option value="HIGH">{t('issues.priorityHigh', 'High')}</option>
            <option value="URGENT">{t('issues.priorityUrgent', 'Urgent')}</option>
          </select>

          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 1, pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder={t('dashboard.searchRequests', 'Search historical tickets...')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="search-input enterprise-input"
              style={{ width: '250px' }}
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
              title={t('issues.tableView', 'Table')}
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
              title={t('issues.cardView', 'Cards')}
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

          <button onClick={fetchHistory} className="btn-icon" style={{ padding: '8px', borderRadius: '8px' }} title={t('common.refresh', 'Refresh history')}>
            <RefreshCw size={16} />
          </button>
        </div>

      </div>

      {/* History Container */}
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
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{t('nav.requestHistory', 'Request History & Archive')}</span>
              <span style={{
                background: 'rgba(99, 102, 241, 0.12)',
                color: 'var(--accent-primary)',
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '0.75rem',
                fontWeight: 700
              }}>
                {filteredItems.length} {filteredItems.length === 1 ? t('issues.requestSingle', 'record') : t('issues.requestPlural', 'records')}
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
          <div className="table-scroll-container" tabIndex={0} role="region" aria-label="Request History Table">
            <table className="custom-table" style={{ width: '100%', minWidth: '1200px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontWeight: '600', minWidth: '220px' }}>{t('issues.requestNumberAndTitle', 'Request # & Title')}</th>
                  <th style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontWeight: '600', minWidth: '180px' }}>{t('issues.serviceAndCategory', 'Service & Category')}</th>
                  <th style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontWeight: '600', minWidth: '130px' }}>{t('common.status', 'Status')}</th>
                  <th style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontWeight: '600', minWidth: '110px' }}>{t('common.priority', 'Priority')}</th>
                  <th style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontWeight: '600', minWidth: '160px' }}>{t('issues.assignedTech', 'Assigned Tech')}</th>
                  <th style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontWeight: '600', minWidth: '130px' }}>{t('issues.submittedDate', 'Submitted Date')}</th>
                  <th style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontWeight: '600', minWidth: '150px' }}>{t('issues.statusResolved', 'Resolved')} / {t('issues.statusClosed', 'Closed')}</th>
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
                        <div className="skeleton-box" style={{ width: '80px', height: '22px', borderRadius: '12px' }} />
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div className="skeleton-box" style={{ width: '70px', height: '22px', borderRadius: '12px' }} />
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
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <History size={36} style={{ color: 'var(--accent-primary)', marginBottom: '10px' }} />
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>{t('issues.noRequestsTitle', 'No historical requests found')}</div>
                      <div style={{ fontSize: '0.85rem' }}>
                        {t('issues.noRequestsSubtitle', 'No past records match your selected filters.')}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredItems.map(item => {
                    const badge = getStatusBadge(item.StatusCode || item.StatusName);

                    return (
                      <tr
                        key={item.IssueRequestID || item.id}
                        onClick={() => setSelectedRequest(item)}
                        style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer', transition: 'background-color 0.15s ease' }}
                        className="table-row-hover"
                      >
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontWeight: '800', color: 'var(--accent-primary)', fontFamily: 'monospace' }}>
                            {item.IssueRequestCode || `#${item.IssueRequestID}`}
                          </div>
                          <div style={{
                            fontWeight: '600',
                            color: 'var(--text-primary)',
                            marginTop: '2px',
                            maxWidth: '260px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }} title={item.Title}>
                            {item.Title}
                          </div>
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{item.ServiceName || 'General Service'}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.CategoryName || 'Standard'}</div>
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          <span className={badge.className}>
                            {badge.label}
                          </span>
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          <span className={getPriorityBadge(item.PriorityCode).className}>
                            {getPriorityBadge(item.PriorityCode).label}
                          </span>
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          <span style={{ color: item.AssignedTechnicianName ? '#c084fc' : 'var(--text-muted)', fontWeight: item.AssignedTechnicianName ? 600 : 400 }}>
                            {item.AssignedTechnicianName || 'N/A'}
                          </span>
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                            {new Date(item.CreatedAt || item.RequestDate || Date.now()).toLocaleDateString()}
                          </div>
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Clock size={13} />
                            {item.ResolvedDateTime ? new Date(item.ResolvedDateTime).toLocaleDateString() : (item.StatusCode === 'CLOSED' ? t('issues.statusClosed', 'Closed') : t('common.yes', 'Yes'))}
                          </div>
                        </td>

                        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedRequest(item); }}
                            className="btn btn-secondary btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          >
                            <Eye size={14} /> {t('common.viewArchive', 'View Archive')}
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
          ) : filteredItems.length === 0 ? (
            <div className="empty-state-box" style={{ padding: '48px 24px' }}>
              <History size={42} style={{ color: 'var(--color-primary)', marginBottom: '12px' }} />
              <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-text-main)' }}>{t('issues.noRequestsTitle', 'No historical requests found')}</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)', maxWidth: '380px' }}>
                {t('issues.noRequestsSubtitle', 'No past records match your selected filters. Try clearing filter options.')}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredItems.map(item => {
                const badge = getStatusBadge(item.StatusCode || item.StatusName);

                return (
                  <div
                    key={item.IssueRequestID || item.id}
                    onClick={() => setSelectedRequest(item)}
                    className="enterprise-interactive-card"
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--accent-primary)', fontFamily: 'monospace' }}>
                          {item.IssueRequestCode || `#${item.IssueRequestID}`}
                        </span>

                        <span className={badge.className}>
                          {badge.label}
                        </span>

                        {item.ServiceName && (
                          <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: '4px' }}>
                            {item.ServiceName}
                          </span>
                        )}
                      </div>

                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {item.Title}
                      </h4>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        <span>{t('issues.submittedOn', 'Submitted')}: {new Date(item.CreatedAt || item.RequestDate || Date.now()).toLocaleDateString()}</span>
                        <span>{t('issues.assignedTech', 'Assigned Tech')}: <strong style={{ color: item.AssignedTechnicianName ? '#c084fc' : 'var(--text-muted)' }}>{item.AssignedTechnicianName || 'N/A'}</strong></span>
                        <span>{t('issues.statusResolved', 'Resolved')} / {t('issues.statusClosed', 'Closed')}: {item.ResolvedDateTime ? new Date(item.ResolvedDateTime).toLocaleDateString() : t('common.yes', 'Yes')}</span>
                      </div>
                    </div>

                    <div>
                      <button className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        {t('common.viewArchive', 'View Archive')} <ChevronRight size={14} />
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
