import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LifeBuoy, AlertCircle, CheckCircle2, Clock, Plus, BookOpen,
  Search, MessageSquare, FileText, ArrowRight, Activity, ShieldCheck,
  Building, User, HelpCircle, Bell, RefreshCw, XCircle, ChevronRight, Eye,
  Wrench, History, Calendar, Sparkles, PhoneCall, ArrowUpRight, Tag,
  AlertTriangle, Layers, X, RotateCw, TrendingUp
} from 'lucide-react';
import issueManagementApi from '../api/issueManagementApi';
import { usePermissionContext } from '../../role-permission-management/contexts/PermissionContext';
import { CreateIssueModal } from '../components/CreateIssueModal';
import { IssueDetailView } from '../components/IssueDetailView';
import { useTranslation } from '../../../i18n';

export default function EmployeeDashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = usePermissionContext();

  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);

  // 3D Flipping Flash Cards state
  const [cardModes, setCardModes] = useState({
    total: 'overview',
    pipeline: 'overview',
    pending: 'overview',
    resolved: 'overview'
  });

  const toggleCardMode = (cardKey, e) => {
    if (e) e.stopPropagation();
    setCardModes(prev => ({
      ...prev,
      [cardKey]: prev[cardKey] === 'overview' ? 'breakdown' : 'overview'
    }));
  };

  // Time-of-day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.goodMorning', 'Good morning');
    if (hour < 17) return t('dashboard.goodAfternoon', 'Good afternoon');
    return t('dashboard.goodEvening', 'Good evening');
  };

  const employeeName = user?.FirstName
    ? `${user.FirstName} ${user.LastName || ''}`.trim()
    : (user?.name || user?.Username || 'Employee');

  // Localized announcements for employee view
  const announcements = [
    {
      id: 1,
      title: t('dashboard.announcement1Title', 'Annual HVAC & Filter Maintenance'),
      date: t('dashboard.today', 'Today'),
      tag: t('dashboard.facilityAlert', 'Facility Alert'),
      tagColor: '#f59e0b',
      tagBg: 'rgba(245, 158, 11, 0.12)',
      desc: t('dashboard.announcement1Desc', 'Air conditioning systems in Block B will undergo scheduled maintenance between 14:00 and 16:00.')
    },
    {
      id: 2,
      title: t('dashboard.announcement2Title', 'New Smart Badge Access System'),
      date: t('dashboard.twoDaysAgo', '2 days ago'),
      tag: t('dashboard.securityTag', 'Security & Access'),
      tagColor: '#0ea5e9',
      tagBg: 'rgba(14, 165, 233, 0.12)',
      desc: t('dashboard.announcement2Desc', 'All tenant employees can now tap NFC mobile passes at campus entry turnstiles.')
    }
  ];

  const currentUserId = user?.UserID || user?.userId;

  useEffect(() => {
    if (currentUserId) {
      fetchMyRequests();
    }
  }, [currentUserId]);

  const fetchMyRequests = async () => {
    try {
      setLoading(true);
      const res = await issueManagementApi.getIssues({ requesterUserId: currentUserId, limit: 100 });
      const data = res.data?.data?.issues || res.data?.data || [];
      setIssues(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load employee requests:', err);
    } finally {
      setLoading(false);
    }
  };

  // Metrics computation
  const totalCount = issues.length;
  const openCount = issues.filter(i => ['NEW', 'APPROVED', 'ASSIGNED', 'IN_PROGRESS'].includes((i.StatusCode || i.StatusName || '').toUpperCase())).length;
  const pendingCount = issues.filter(i => (i.StatusCode || i.StatusName || '').toUpperCase() === 'PENDING').length;
  const resolvedCount = issues.filter(i => ['RESOLVED', 'CLOSED'].includes((i.StatusCode || i.StatusName || '').toUpperCase())).length;

  // Breakdown statistics for flash cards
  const urgentPriorityCount = issues.filter(i => ['CRITICAL', 'HIGH'].includes((i.PriorityCode || '').toUpperCase())).length;
  const routinePriorityCount = issues.filter(i => ['LOW', 'MEDIUM'].includes((i.PriorityCode || '').toUpperCase())).length;
  const newRequestsCount = issues.filter(i => (i.StatusCode || '').toUpperCase() === 'NEW').length;
  const inProgressCount = issues.filter(i => (i.StatusCode || '').toUpperCase() === 'IN_PROGRESS').length;
  const assignedCount = issues.filter(i => (i.StatusCode || '').toUpperCase() === 'ASSIGNED').length;
  const underReviewCount = issues.filter(i => (i.StatusCode || '').toUpperCase() === 'APPROVED').length;
  const closedTicketsCount = issues.filter(i => (i.StatusCode || '').toUpperCase() === 'CLOSED').length;
  const resolvedOnlyCount = issues.filter(i => (i.StatusCode || '').toUpperCase() === 'RESOLVED').length;

  // Filtering
  const filteredIssues = issues.filter(issue => {
    const status = (issue.StatusCode || issue.StatusName || '').toUpperCase();
    if (filterStatus === 'OPEN' && !['NEW', 'APPROVED', 'ASSIGNED', 'IN_PROGRESS'].includes(status)) return false;
    if (filterStatus === 'PENDING' && status !== 'PENDING') return false;
    if (filterStatus === 'RESOLVED' && !['RESOLVED', 'CLOSED'].includes(status)) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = (issue.Title || '').toLowerCase().includes(q);
      const codeMatch = (issue.IssueRequestCode || '').toLowerCase().includes(q);
      const descMatch = (issue.Description || '').toLowerCase().includes(q);
      const serviceMatch = (issue.ServiceName || '').toLowerCase().includes(q);
      return titleMatch || codeMatch || descMatch || serviceMatch;
    }
    return true;
  });

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

  if (selectedIssue) {
    return (
      <IssueDetailView
        issue={selectedIssue}
        onBack={() => {
          setSelectedIssue(null);
          fetchMyRequests();
        }}
        onRefresh={fetchMyRequests}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ── 1. Enterprise Welcome Operational Banner ── */}
      <div className="enterprise-welcome-banner">
        <div style={{ maxWidth: '680px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <span style={{
              padding: '3px 10px',
              borderRadius: '12px',
              background: 'rgba(37, 99, 235, 0.18)',
              color: 'var(--color-primary)',
              fontSize: '0.75rem',
              fontWeight: 800,
              letterSpacing: '0.3px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}>
              <Sparkles size={13} /> {t('dashboard.employeeDesk', 'Employee Self-Service Desk')}
            </span>

            {user?.TenantName && (
              <span style={{
                fontSize: '0.78rem',
                color: 'var(--color-text-secondary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '2px 8px',
                borderRadius: '6px',
                background: 'var(--color-elevated)',
                border: '1px solid var(--color-border)'
              }}>
                <Building size={12} color="var(--color-primary)" /> {user.TenantName}
              </span>
            )}

            {user?.DepartmentName && (
              <span style={{
                fontSize: '0.78rem',
                color: 'var(--color-text-secondary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '2px 8px',
                borderRadius: '6px',
                background: 'var(--color-elevated)',
                border: '1px solid var(--color-border)'
              }}>
                <Layers size={12} color="#10b981" /> {user.DepartmentName}
              </span>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold" style={{ margin: 0, color: 'var(--color-text-main)', letterSpacing: '-0.3px' }}>
            {getGreeting()}, <span style={{ color: 'var(--color-primary)' }}>{employeeName}</span>
          </h1>
          <p style={{ margin: '8px 0 0', color: 'var(--color-text-secondary)', fontSize: '0.92rem', lineHeight: 1.5 }}>
            {t('dashboard.employeeSubtitle', 'Submit new service requests, track active tickets in real time, and communicate directly with Business Park technicians.')}
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-2.5 sm:gap-3 items-stretch sm:items-center">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn btn-primary w-full sm:w-auto touch-target-sm justify-center"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', fontSize: '0.92rem', fontWeight: 800, borderRadius: '12px', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)' }}
          >
            <Plus size={18} /> {t('dashboard.newRequest', 'Submit Service Request')}
          </button>
          
          <button
            onClick={() => navigate('/services/directory')}
            className="btn btn-secondary w-full sm:w-auto touch-target-sm justify-center"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 20px', fontSize: '0.9rem', fontWeight: 700, borderRadius: '12px' }}
          >
            <BookOpen size={16} /> {t('dashboard.catalogButton', 'Service Catalog')}
          </button>

          <button
            onClick={() => navigate('/issues/history')}
            className="btn btn-secondary w-full sm:w-auto touch-target-sm justify-center"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 20px', fontSize: '0.9rem', fontWeight: 700, borderRadius: '12px' }}
            title={t('nav.requestHistory', 'Request History')}
          >
            <History size={16} /> {t('nav.historyShort', 'History')}
          </button>
        </div>
      </div>

      {/* ── 2. Action Required Operational Notice (Conditional Banner) ── */}
      {pendingCount > 0 && (
        <div style={{
          padding: '16px 20px',
          borderRadius: '12px',
          background: 'rgba(242, 176, 30, 0.12)',
          border: '1px solid rgba(242, 176, 30, 0.35)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          animation: 'fadeInUp 0.3s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(242, 176, 30, 0.2)',
              color: 'var(--color-warning)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
                {t('dashboard.actionRequiredTitle', `Action Required: ${pendingCount} request${pendingCount > 1 ? 's' : ''} awaiting your input`)}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                {t('dashboard.actionRequiredDesc', 'Technicians or department managers have asked for clarification, approval, or completion verification on your ticket.')}
              </div>
            </div>
          </div>

          <button
            onClick={() => setFilterStatus('PENDING')}
            className="btn btn-sm"
            style={{
              background: 'var(--color-warning)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              padding: '8px 16px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <Eye size={14} /> {t('dashboard.filterActionNeeded', 'Review Pending Items')}
          </button>
        </div>
      )}

      {/* ── 3. Executive KPI Metric Cards (Spacious, Clear & Attractive) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full">
        {/* Card 1: Total Service Requests */}
        <div
          tabIndex={0}
          role="button"
          aria-label={t('dashboard.myTotalRequests', 'My Total Requests')}
          className={`enterprise-kpi-card ${filterStatus === 'ALL' ? 'kpi-active-blue' : ''}`}
          onClick={() => setFilterStatus('ALL')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setFilterStatus('ALL');
            }
          }}
        >
          {/* Card Top: Icon, Label, and Mode Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <div className="kpi-icon-squircle" style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', border: '1px solid rgba(37, 99, 235, 0.2)' }}>
                <FileText size={20} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t('dashboard.myTotalRequests', 'Total Requests')}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                  Lifetime Records
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => toggleCardMode('total', e)}
              className="kpi-mode-toggle"
              title="Toggle summary or breakdown distribution"
            >
              <RotateCw size={11} />
              {cardModes.total === 'breakdown' ? 'Summary' : 'Breakdown'}
            </button>
          </div>

          {/* Card Center: Dynamic Overview vs Breakdown */}
          {cardModes.total === 'breakdown' ? (
            <div style={{ margin: '14px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ padding: '8px 10px', borderRadius: '8px', background: 'var(--color-elevated)', border: '1px solid var(--color-border-subtle)' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Urgent / High</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#d97706' }}>{urgentPriorityCount} tickets</div>
              </div>
              <div style={{ padding: '8px 10px', borderRadius: '8px', background: 'var(--color-elevated)', border: '1px solid var(--color-border-subtle)' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Routine / Low</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--color-text-main)' }}>{routinePriorityCount} tickets</div>
              </div>
              <div style={{ padding: '8px 10px', borderRadius: '8px', background: 'var(--color-elevated)', border: '1px solid var(--color-border-subtle)' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>In Pipeline</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0284c7' }}>{openCount} active</div>
              </div>
              <div style={{ padding: '8px 10px', borderRadius: '8px', background: 'var(--color-elevated)', border: '1px solid var(--color-border-subtle)' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Fulfilled</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#10b981' }}>{resolvedCount} closed</div>
              </div>
            </div>
          ) : (
            <div style={{ margin: '12px 0' }}>
              <div className="kpi-metric-number">
                {loading ? '...' : totalCount}
              </div>
              <div className="kpi-metric-desc">
                Lifetime submitted service tickets
              </div>
            </div>
          )}

          {/* Card Footer: Metadata & Filter Status Indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '12px',
            borderTop: '1px solid var(--color-border-subtle)',
            fontSize: '0.74rem'
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 700, color: '#2563eb' }}>
              <TrendingUp size={13} /> 100% Tracked
            </span>
            <span style={{ fontWeight: 700, color: filterStatus === 'ALL' ? '#2563eb' : 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              {filterStatus === 'ALL' ? 'Showing Feed ✓' : 'Filter Feed →'}
            </span>
          </div>
        </div>

        {/* Card 2: Active In Pipeline */}
        <div
          tabIndex={0}
          role="button"
          aria-label={t('dashboard.myOpenRequests', 'Active In Pipeline')}
          className={`enterprise-kpi-card ${filterStatus === 'OPEN' ? 'kpi-active-cyan' : ''}`}
          onClick={() => setFilterStatus('OPEN')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setFilterStatus('OPEN');
            }
          }}
        >
          {/* Card Top */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <div className="kpi-icon-squircle" style={{ background: 'rgba(2, 132, 199, 0.1)', color: '#0284c7', border: '1px solid rgba(2, 132, 199, 0.2)' }}>
                <Clock size={20} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t('dashboard.myOpenRequests', 'Active In Pipeline')}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                  Active Workflows
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => toggleCardMode('pipeline', e)}
              className="kpi-mode-toggle"
              title="Toggle summary or stage breakdown"
            >
              <RotateCw size={11} />
              {cardModes.pipeline === 'breakdown' ? 'Summary' : 'Stages'}
            </button>
          </div>

          {/* Card Center */}
          {cardModes.pipeline === 'breakdown' ? (
            <div style={{ margin: '14px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ padding: '8px 10px', borderRadius: '8px', background: 'var(--color-elevated)', border: '1px solid var(--color-border-subtle)' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>New Intake</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--color-text-main)' }}>{newRequestsCount} new</div>
              </div>
              <div style={{ padding: '8px 10px', borderRadius: '8px', background: 'var(--color-elevated)', border: '1px solid var(--color-border-subtle)' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Awaiting Dispatch</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--color-text-main)' }}>{underReviewCount} ready</div>
              </div>
              <div style={{ padding: '8px 10px', borderRadius: '8px', background: 'var(--color-elevated)', border: '1px solid var(--color-border-subtle)' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Assigned Tech</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#9333ea' }}>{assignedCount} tech</div>
              </div>
              <div style={{ padding: '8px 10px', borderRadius: '8px', background: 'var(--color-elevated)', border: '1px solid var(--color-border-subtle)' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Field Work</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0284c7' }}>{inProgressCount} active</div>
              </div>
            </div>
          ) : (
            <div style={{ margin: '12px 0' }}>
              <div className="kpi-metric-number" style={{ color: openCount > 0 ? '#0284c7' : 'var(--color-text-main)' }}>
                {loading ? '...' : openCount}
              </div>
              <div className="kpi-metric-desc">
                Under dispatch, diagnosis & technician resolution
              </div>
            </div>
          )}

          {/* Card Footer */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '12px',
            borderTop: '1px solid var(--color-border-subtle)',
            fontSize: '0.74rem'
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 700, color: '#0284c7' }}>
              <Activity size={13} /> Active SLA Clocks
            </span>
            <span style={{ fontWeight: 700, color: filterStatus === 'OPEN' ? '#0284c7' : 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              {filterStatus === 'OPEN' ? 'Showing Feed ✓' : 'Filter Feed →'}
            </span>
          </div>
        </div>

        {/* Card 3: Action Needed */}
        <div
          tabIndex={0}
          role="button"
          aria-label={t('dashboard.actionNeeded', 'Action Needed')}
          className={`enterprise-kpi-card ${filterStatus === 'PENDING' ? 'kpi-active-amber' : ''}`}
          onClick={() => setFilterStatus('PENDING')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setFilterStatus('PENDING');
            }
          }}
        >
          {/* Card Top */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <div className="kpi-icon-squircle" style={{ background: 'rgba(217, 119, 6, 0.12)', color: '#d97706', border: '1px solid rgba(217, 119, 6, 0.25)' }}>
                <AlertCircle size={20} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t('dashboard.actionNeeded', 'Action Needed')}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                  Requester Feedback
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => toggleCardMode('pending', e)}
              className="kpi-mode-toggle"
              title="Toggle summary or pending details"
            >
              <RotateCw size={11} />
              {cardModes.pending === 'breakdown' ? 'Summary' : 'Details'}
            </button>
          </div>

          {/* Card Center */}
          {cardModes.pending === 'breakdown' ? (
            <div style={{ margin: '14px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ padding: '8px 10px', borderRadius: '8px', background: 'var(--color-elevated)', border: '1px solid var(--color-border-subtle)' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Clarification</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#d97706' }}>{pendingCount} items</div>
              </div>
              <div style={{ padding: '8px 10px', borderRadius: '8px', background: 'var(--color-elevated)', border: '1px solid var(--color-border-subtle)' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>High Priority</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#ef4444' }}>
                  {issues.filter(i => (i.StatusCode || '').toUpperCase() === 'PENDING' && ['HIGH', 'CRITICAL'].includes((i.PriorityCode || '').toUpperCase())).length} urgent
                </div>
              </div>
              <div style={{ padding: '8px 10px', borderRadius: '8px', background: 'var(--color-elevated)', border: '1px solid var(--color-border-subtle)' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Standard</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
                  {issues.filter(i => (i.StatusCode || '').toUpperCase() === 'PENDING' && !['HIGH', 'CRITICAL'].includes((i.PriorityCode || '').toUpperCase())).length} routine
                </div>
              </div>
              <div style={{ padding: '8px 10px', borderRadius: '8px', background: 'var(--color-elevated)', border: '1px solid var(--color-border-subtle)' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Queue State</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#10b981' }}>Priority</div>
              </div>
            </div>
          ) : (
            <div style={{ margin: '12px 0' }}>
              <div className="kpi-metric-number" style={{ color: pendingCount > 0 ? '#d97706' : 'var(--color-text-main)' }}>
                {loading ? '...' : pendingCount}
              </div>
              <div className="kpi-metric-desc">
                {pendingCount > 0 ? 'Awaiting employee response or resolution sign-off' : 'All service requests up to date with zero blocks'}
              </div>
            </div>
          )}

          {/* Card Footer */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '12px',
            borderTop: '1px solid var(--color-border-subtle)',
            fontSize: '0.74rem'
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 700, color: pendingCount > 0 ? '#d97706' : '#10b981' }}>
              <AlertTriangle size={13} /> {pendingCount > 0 ? 'Requires Input' : 'All Clear'}
            </span>
            <span style={{ fontWeight: 700, color: filterStatus === 'PENDING' ? '#d97706' : 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              {filterStatus === 'PENDING' ? 'Showing Feed ✓' : 'Filter Feed →'}
            </span>
          </div>
        </div>

        {/* Card 4: Resolved & Closed */}
        <div
          tabIndex={0}
          role="button"
          aria-label={t('dashboard.recentlyResolved', 'Resolved & Closed')}
          className={`enterprise-kpi-card ${filterStatus === 'RESOLVED' ? 'kpi-active-emerald' : ''}`}
          onClick={() => setFilterStatus('RESOLVED')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setFilterStatus('RESOLVED');
            }
          }}
        >
          {/* Card Top */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <div className="kpi-icon-squircle" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                <CheckCircle2 size={20} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t('dashboard.recentlyResolved', 'Resolved & Closed')}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                  Service Quality
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => toggleCardMode('resolved', e)}
              className="kpi-mode-toggle"
              title="Toggle summary or quality breakdown"
            >
              <RotateCw size={11} />
              {cardModes.resolved === 'breakdown' ? 'Summary' : 'Quality'}
            </button>
          </div>

          {/* Card Center */}
          {cardModes.resolved === 'breakdown' ? (
            <div style={{ margin: '14px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ padding: '8px 10px', borderRadius: '8px', background: 'var(--color-elevated)', border: '1px solid var(--color-border-subtle)' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Work Completed</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#10b981' }}>{resolvedOnlyCount} resolved</div>
              </div>
              <div style={{ padding: '8px 10px', borderRadius: '8px', background: 'var(--color-elevated)', border: '1px solid var(--color-border-subtle)' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Verified Closed</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--color-text-main)' }}>{closedTicketsCount} closed</div>
              </div>
              <div style={{ padding: '8px 10px', borderRadius: '8px', background: 'var(--color-elevated)', border: '1px solid var(--color-border-subtle)' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Avg Turnaround</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--color-text-main)' }}>&lt; 24h</div>
              </div>
              <div style={{ padding: '8px 10px', borderRadius: '8px', background: 'var(--color-elevated)', border: '1px solid var(--color-border-subtle)' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Satisfaction</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#d97706' }}>5.0 ★ Stars</div>
              </div>
            </div>
          ) : (
            <div style={{ margin: '12px 0' }}>
              <div className="kpi-metric-number" style={{ color: resolvedCount > 0 ? '#10b981' : 'var(--color-text-main)' }}>
                {loading ? '...' : resolvedCount}
              </div>
              <div className="kpi-metric-desc">
                Successfully executed, verified and closed tickets
              </div>
            </div>
          )}

          {/* Card Footer */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '12px',
            borderTop: '1px solid var(--color-border-subtle)',
            fontSize: '0.74rem'
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 700, color: '#10b981' }}>
              <ShieldCheck size={13} /> Verified Work
            </span>
            <span style={{ fontWeight: 700, color: filterStatus === 'RESOLVED' ? '#10b981' : 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              {filterStatus === 'RESOLVED' ? 'Showing Feed ✓' : 'Filter Feed →'}
            </span>
          </div>
        </div>
      </div>

      {/* ── 4. Main Two-Column Operational Layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '24px' }}>
        
        {/* Left Column: My Requests Activity Feed */}
        <div className="enterprise-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Header & Search */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-main)' }}>
                <LifeBuoy size={20} style={{ color: 'var(--color-primary)' }} /> {t('dashboard.recentRequests', 'My Service Requests')}
                <span style={{
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '10px',
                  background: 'rgba(47, 129, 247, 0.12)',
                  color: 'var(--color-primary)'
                }}>
                  {filteredIssues.length} {filteredIssues.length === 1 ? 'ticket' : 'tickets'}
                </span>
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                {t('dashboard.recentRequestsDesc', 'Live status, technician assignment updates, and messaging')}
              </p>
            </div>

            <div className="w-full sm:w-auto flex items-center gap-2.5">
              <div className="relative flex-1 sm:flex-initial">
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)', zIndex: 1, pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder={t('dashboard.searchRequests', 'Search requests...')}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="search-input enterprise-input w-full sm:w-[220px]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', padding: '2px', zIndex: 1 }}
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              <button
                onClick={fetchMyRequests}
                className="btn-icon touch-target-sm"
                style={{ padding: '8px', borderRadius: '8px' }}
                title={t('common.refresh', 'Refresh requests')}
              >
                <RefreshCw size={15} className={loading ? 'spin' : ''} />
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: t('dashboard.allRequests', 'All Requests'), count: totalCount },
              { id: 'OPEN', label: t('dashboard.openFilter', 'Active Open'), count: openCount },
              { id: 'PENDING', label: t('dashboard.pendingFilter', 'Action Needed'), count: pendingCount },
              { id: 'RESOLVED', label: t('dashboard.resolvedFilter', 'Resolved / Closed'), count: resolvedCount }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '16px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  border: '1px solid ' + (filterStatus === tab.id ? 'var(--color-primary)' : 'var(--color-border)'),
                  cursor: 'pointer',
                  background: filterStatus === tab.id ? 'var(--color-primary)' : 'var(--color-elevated)',
                  color: filterStatus === tab.id ? '#ffffff' : 'var(--color-text-secondary)',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label} <span style={{ opacity: 0.8, fontSize: '0.72rem' }}>({tab.count})</span>
              </button>
            ))}
          </div>

          {/* Requests List */}
          {loading ? (
            /* 4-Row Skeleton Shimmer Loader */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[1, 2, 3, 4].map(idx => (
                <div key={idx} className="enterprise-card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '70%' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <div className="skeleton-box" style={{ width: '80px', height: '18px', borderRadius: '4px' }} />
                      <div className="skeleton-box" style={{ width: '90px', height: '18px', borderRadius: '12px' }} />
                    </div>
                    <div className="skeleton-line" style={{ width: '60%', height: '16px' }} />
                    <div className="skeleton-line" style={{ width: '40%', height: '12px' }} />
                  </div>
                  <div className="skeleton-box" style={{ width: '100px', height: '32px', borderRadius: '8px' }} />
                </div>
              ))}
            </div>
          ) : filteredIssues.length === 0 ? (
            <div className="empty-state-box" style={{ padding: '48px 24px' }}>
              <CheckCircle2 size={42} style={{ color: 'var(--color-success)', marginBottom: '12px' }} />
              <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
                {t('dashboard.noRequestsFound', 'No requests found')}
              </h4>
              <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--color-text-secondary)', maxWidth: '380px' }}>
                {filterStatus !== 'ALL'
                  ? t('dashboard.noFilterMatches', 'No issues match the selected filter. Try clearing filters or search query.')
                  : t('dashboard.noRequestsYet', 'You have not submitted any service requests yet. Use the button below to submit your first request.')}
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="btn btn-primary"
                style={{ marginTop: '16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={16} /> {t('dashboard.submitFirst', 'Submit New Request')}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredIssues.map(issue => {
                const sBadge = getStatusBadge(issue.StatusCode || issue.StatusName);
                const pBadge = getPriorityBadge(issue.PriorityCode);

                return (
                  <div
                    key={issue.IssueRequestID || issue.id}
                    onClick={() => setSelectedIssue(issue)}
                    className="enterprise-interactive-card"
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'monospace' }}>
                          {issue.IssueRequestCode || `#${issue.IssueRequestID}`}
                        </span>

                        <span className={sBadge.className}>
                          {sBadge.label}
                        </span>

                        <span className={pBadge.className}>
                          {pBadge.label}
                        </span>

                        {issue.ServiceName && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', background: 'var(--color-elevated)', border: '1px solid var(--color-border)', padding: '2px 8px', borderRadius: '4px' }}>
                            {issue.ServiceName}
                          </span>
                        )}
                      </div>

                      <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: 'var(--color-text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {issue.Title}
                      </h4>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.76rem', color: 'var(--color-text-secondary)', flexWrap: 'wrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={13} style={{ color: 'var(--color-text-secondary)' }} />
                          {t('issues.submittedOn', 'Submitted')}: {new Date(issue.CreatedAt || issue.RequestDate || Date.now()).toLocaleDateString()}
                        </span>

                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Wrench size={13} style={{ color: issue.AssignedTechnicianName ? '#c084fc' : 'var(--color-text-secondary)' }} />
                          {issue.AssignedTechnicianName ? (
                            <strong style={{ color: '#c084fc' }}>{issue.AssignedTechnicianName}</strong>
                          ) : (
                            <span>{t('issues.awaitingDispatch', 'Awaiting dispatch')}</span>
                          )}
                        </span>
                      </div>
                    </div>

                    <div style={{ flexShrink: 0 }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedIssue(issue);
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Eye size={14} /> {t('issues.detailsAndChat', 'Details & Chat')} <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Table View CTA Footer */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '16px',
            borderTop: '1px solid var(--color-border)',
            fontSize: '0.82rem',
            color: 'var(--color-text-secondary)'
          }}>
            <span>
              {t('common.showing', 'Showing')} {filteredIssues.length} {t('common.of', 'of')} {totalCount} {t('issues.requestsTotal', 'total requests')}
            </span>

            <button
              onClick={() => navigate('/issues/my-requests')}
              className="btn btn-outline btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              {t('dashboard.viewAllRequestsTable', 'View In Full Table View')} <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* Right Column: Park Announcements, Self-Help KB & Hotline Support */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Card 1: Park Facility Announcements */}
          <div className="enterprise-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-main)' }}>
                <Bell size={16} style={{ color: 'var(--color-warning)' }} /> {t('dashboard.parkAnnouncements', 'Park Announcements')}
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {announcements.map(item => (
                <div
                  key={item.id}
                  className="enterprise-interactive-card"
                  style={{
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    gap: '4px',
                    cursor: 'default'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '4px', background: item.tagBg, color: item.tagColor, fontWeight: 700 }}>
                      {item.tag}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>{item.date}</span>
                  </div>
                  <h5 style={{ margin: '4px 0 2px', fontSize: '0.86rem', fontWeight: 700, color: 'var(--color-text-main)' }}>{item.title}</h5>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Facilities Help Desk Contact */}
          <div className="enterprise-card" style={{ padding: '20px', background: 'var(--color-surface)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(37, 99, 235, 0.1)', color: 'var(--color-primary)' }}>
                <PhoneCall size={18} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
                  {t('dashboard.helpDeskHotline', 'Facilities & IT Support Desk')}
                </h4>
                <div style={{ fontSize: '0.74rem', color: 'var(--color-text-secondary)' }}>
                  {t('dashboard.campusHelpDesk', 'Central Business Park Concierge')}
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Operating Hours:</span>
                <strong style={{ color: 'var(--color-text-main)' }}>08:00 - 18:00 EAT</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Desk Extension:</span>
                <strong style={{ color: 'var(--color-primary)' }}>Ext. 4001</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Emergency Facilities:</span>
                <strong style={{ color: 'var(--color-error)' }}>+251 11 000 0000</strong>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ── Submit New Issue Modal ── */}
      <CreateIssueModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={() => {
          setIsCreateModalOpen(false);
          fetchMyRequests();
        }}
      />
    </div>
  );
}
