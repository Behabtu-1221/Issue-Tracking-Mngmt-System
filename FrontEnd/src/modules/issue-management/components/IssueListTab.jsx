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
  MoveHorizontal,
  Calendar
} from 'lucide-react';
import issueManagementApi from '../api/issueManagementApi';
import PermissionGuard from '../../../components/common/PermissionGuard';
import ConfirmDialogModal from '../../../components/common/ConfirmDialogModal';
import AlertDialogModal from '../../../components/common/AlertDialogModal';

export const IssueListTab = ({
  onSelectIssue,
  onOpenCreateModal,
  onOpenAssignModal,
  onOpenStatusModal,
  refreshKey
}) => {
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
    fetchIssues(search);
  };

  const handleCancelIssue = async (issue) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Cancel Issue Request',
      message: `Are you sure you want to cancel issue request '${issue.RequestNumber}'?`,
      type: 'warning',
      confirmText: 'Confirm Cancellation',
      onConfirm: async () => {
        try {
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          await issueManagementApi.cancelIssue(issue.IssueRequestID, { cancellationReason: 'Cancelled by user' });
          fetchIssues();
        } catch (err) {
          const msg = err.response?.data?.message || 'Failed to cancel issue request';
          showAlert('Action Restricted', msg, 'error');
        }
      }
    });
  };

  const handleReopenIssue = async (issue) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Reopen Issue Request',
      message: `Are you sure you want to reopen issue request '${issue.RequestNumber}'?`,
      type: 'info',
      confirmText: 'Reopen Request',
      onConfirm: async () => {
        try {
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          await issueManagementApi.reopenIssue(issue.IssueRequestID, { remarks: 'Reopened by user' });
          fetchIssues();
        } catch (err) {
          const msg = err.response?.data?.message || 'Failed to reopen issue request';
          showAlert('Action Restricted', msg, 'error');
        }
      }
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      NEW: { bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' },
      ASSIGNED: { bg: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: 'rgba(168, 85, 247, 0.3)' },
      IN_PROGRESS: { bg: 'rgba(234, 179, 8, 0.15)', color: '#facc15', border: 'rgba(234, 179, 8, 0.3)' },
      PENDING: { bg: 'rgba(249, 115, 22, 0.15)', color: '#fb923c', border: 'rgba(249, 115, 22, 0.3)' },
      RESOLVED: { bg: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', border: 'rgba(34, 197, 94, 0.3)' },
      CLOSED: { bg: 'rgba(100, 116, 139, 0.15)', color: '#94a3b8', border: 'rgba(100, 116, 139, 0.3)' },
      CANCELLED: { bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: 'rgba(239, 68, 68, 0.3)' }
    };
    const style = styles[status] || styles.NEW;
    return (
      <span style={{
        padding: '4px 10px',
        borderRadius: '20px',
        fontSize: '0.75rem',
        fontWeight: '700',
        letterSpacing: '0.5px',
        backgroundColor: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`
      }}>
        {status?.replace('_', ' ')}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      CRITICAL: { bg: '#ef4444', color: '#fff' },
      HIGH: { bg: '#f97316', color: '#fff' },
      MEDIUM: { bg: '#3b82f6', color: '#fff' },
      LOW: { bg: '#64748b', color: '#fff' }
    };
    const style = styles[priority] || styles.MEDIUM;
    return (
      <span style={{
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '0.7rem',
        fontWeight: '800',
        backgroundColor: style.bg,
        color: style.color
      }}>
        {priority}
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Search & Filter Toolbar */}
      <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: 'var(--border-radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', flex: '1', minWidth: '280px' }}>
          <div style={{ position: 'relative', flex: '1' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder="Search by Request #, title, description, or requester name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 38px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--border-radius-sm)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            />
          </div>
          <button type="submit" className="btn-secondary" style={{ padding: '9px 16px' }}>Search</button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '9px 12px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--border-radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem'
            }}
          >
            <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>All Statuses</option>
            <option value="NEW" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>New</option>
            <option value="ASSIGNED" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Assigned</option>
            <option value="IN_PROGRESS" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>In Progress</option>
            <option value="PENDING" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Pending</option>
            <option value="RESOLVED" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Resolved</option>
            <option value="CLOSED" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Closed</option>
            <option value="CANCELLED" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Cancelled</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            style={{
              padding: '9px 12px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--border-radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem'
            }}
          >
            <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>All Priorities</option>
            <option value="CRITICAL" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Critical</option>
            <option value="HIGH" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>High</option>
            <option value="MEDIUM" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Medium</option>
            <option value="LOW" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Low</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{
              padding: '9px 12px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--border-radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem'
            }}
          >
            <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>All Types</option>
            <option value="INCIDENT" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Incident</option>
            <option value="MAINTENANCE" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Maintenance</option>
            <option value="COMPLAINT" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Complaint</option>
            <option value="DISRUPTION" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Disruption</option>
          </select>

          <PermissionGuard anyPermission={['Issue.Create', 'Request.Create', 'issue:create']}>
            <button className="btn-primary" onClick={onOpenCreateModal} style={{ padding: '9px 18px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={16} /> Submit New Request
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
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Issue Requests</span>
            <span style={{
              background: 'rgba(99, 102, 241, 0.12)',
              color: 'var(--accent-primary)',
              padding: '2px 8px',
              borderRadius: '10px',
              fontSize: '0.75rem',
              fontWeight: 700
            }}>
              {issues.length} {issues.length === 1 ? 'record' : 'records'}
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

        {/* Scrollable Table Area */}
        <div className="table-scroll-container" tabIndex={0} role="region" aria-label="Issue Requests Table">
          <table className="custom-table" style={{ width: '100%', minWidth: '1250px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--glass-border)' }}>
                <th style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontWeight: '600', minWidth: '220px' }}>Request # & Title</th>
                <th style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontWeight: '600', minWidth: '180px' }}>Service & Category</th>
                <th style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontWeight: '600', minWidth: '170px' }}>Requester & Tenant</th>
                <th style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontWeight: '600', minWidth: '120px' }}>Priority</th>
                <th style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontWeight: '600', minWidth: '130px' }}>Status</th>
                <th style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontWeight: '600', minWidth: '160px' }}>Assigned Dept</th>
                <th style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontWeight: '600', minWidth: '130px' }}>Created Date</th>
                <th style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontWeight: '600', minWidth: '180px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Loading issue requests...
                  </td>
                </tr>
              ) : issues.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No issue requests found matching the current criteria.
                  </td>
                </tr>
              ) : (
                issues.map((issue) => (
                  <tr
                    key={issue.IssueRequestID}
                    style={{ borderBottom: '1px solid var(--glass-border)', cursor: 'pointer', transition: 'background-color 0.15s ease' }}
                    className="table-row-hover"
                  >
                    <td style={{ padding: '14px 18px' }} onClick={() => onSelectIssue?.(issue)}>
                      <div style={{ fontWeight: '700', color: 'var(--accent-primary)' }}>{issue.RequestNumber}</div>
                      <div style={{
                        fontWeight: '600',
                        color: 'var(--text-primary)',
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
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{issue.ServiceName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{issue.CategoryName}</div>
                    </td>

                    <td style={{ padding: '14px 18px' }} onClick={() => onSelectIssue?.(issue)}>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{issue.RequesterName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{issue.TenantName || 'Business Park'}</div>
                    </td>

                    <td style={{ padding: '14px 18px' }} onClick={() => onSelectIssue?.(issue)}>
                      {getPriorityBadge(issue.PriorityCode)}
                    </td>

                    <td style={{ padding: '14px 18px' }} onClick={() => onSelectIssue?.(issue)}>
                      {getStatusBadge(issue.StatusCode)}
                    </td>

                    <td style={{ padding: '14px 18px' }} onClick={() => onSelectIssue?.(issue)}>
                      <span style={{ color: issue.AssignedDepartmentName ? 'var(--text-primary)' : 'var(--text-secondary)', fontStyle: issue.AssignedDepartmentName ? 'normal' : 'italic' }}>
                        {issue.AssignedDepartmentName || 'Unassigned'}
                      </span>
                    </td>

                    <td style={{ padding: '14px 18px' }} onClick={() => onSelectIssue?.(issue)}>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                        {issue.CreatedAt ? new Date(issue.CreatedAt).toLocaleDateString() : (issue.RequestDate ? new Date(issue.RequestDate).toLocaleDateString() : '—')}
                      </div>
                    </td>

                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          title="View Details & Timeline"
                          onClick={(e) => { e.stopPropagation(); onSelectIssue?.(issue); }}
                          style={{ padding: '6px', borderRadius: '6px', border: '1px solid var(--glass-border)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', cursor: 'pointer' }}
                        >
                          <Eye size={15} />
                        </button>

                        {issue.StatusCode !== 'CLOSED' && issue.StatusCode !== 'CANCELLED' && (
                          <>
                            <PermissionGuard anyPermission={['Issue.Assign', 'Request.Assign', 'issue:update']}>
                              <button
                                title="Assign Department"
                                onClick={(e) => { e.stopPropagation(); onOpenAssignModal?.(issue); }}
                                style={{ padding: '6px', borderRadius: '6px', border: '1px solid var(--glass-border)', backgroundColor: 'rgba(168, 85, 247, 0.1)', color: '#c084fc', cursor: 'pointer' }}
                              >
                                <UserCheck size={15} />
                              </button>
                            </PermissionGuard>

                            <PermissionGuard anyPermission={['Issue.Resolve', 'Issue.Update', 'Request.Resolve', 'issue:update']}>
                              <button
                                title="Update Status"
                                onClick={(e) => { e.stopPropagation(); onOpenStatusModal?.(issue); }}
                                style={{ padding: '6px', borderRadius: '6px', border: '1px solid var(--glass-border)', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', cursor: 'pointer' }}
                              >
                                <Clock size={15} />
                              </button>
                            </PermissionGuard>

                            <PermissionGuard anyPermission={['Issue.Cancel', 'Issue.Delete', 'Request.Close', 'issue:delete']}>
                              <button
                                title="Cancel Request"
                                onClick={(e) => { e.stopPropagation(); handleCancelIssue(issue); }}
                                style={{ padding: '6px', borderRadius: '6px', border: '1px solid var(--glass-border)', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#f87171', cursor: 'pointer' }}
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
                              style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--glass-border)', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#4ade80', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
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
