import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LifeBuoy, AlertCircle, CheckCircle2, Clock, Plus, BookOpen,
  Search, MessageSquare, FileText, ArrowRight, Activity, ShieldCheck,
  Building, User, HelpCircle, Bell, RefreshCw, XCircle, ChevronRight, Eye
} from 'lucide-react';
import issueManagementApi from '../api/issueManagementApi';
import { usePermissionContext } from '../../role-permission-management/contexts/PermissionContext';
import { CreateIssueModal } from '../components/CreateIssueModal';
import { IssueDetailView } from '../components/IssueDetailView';

export default function EmployeeDashboardPage() {
  const navigate = useNavigate();
  const { user } = usePermissionContext();
  
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);

  // Sample announcements for employee view
  const announcements = [
    { id: 1, title: 'Annual HVAC & Filter Maintenance', date: 'Today', tag: 'Facility Alert', desc: 'Air conditioning systems in Block B will undergo scheduled maintenance between 14:00 and 16:00.' },
    { id: 2, title: 'New Smart Badge Access System', date: '2 days ago', tag: 'Security', desc: 'All tenant employees can now tap NFC mobile passes at turnstiles.' }
  ];

  // Sample KB Articles
  const kbArticles = [
    { id: 1, title: 'How to request visitor parking passes', category: 'Facilities', readTime: '2 min' },
    { id: 2, title: 'Wi-Fi guest network credential generator', category: 'IT & Network', readTime: '1 min' },
    { id: 3, title: 'Reporting urgent plumbing or electrical issues', category: 'Maintenance', readTime: '3 min' }
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
      return titleMatch || codeMatch || descMatch;
    }
    return true;
  });

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
      {/* Welcome Banner Header */}
      <div className="glass-panel" style={{
        padding: '24px 28px',
        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.12) 0%, rgba(124, 58, 237, 0.08) 100%)',
        borderRadius: '16px',
        border: '1px solid rgba(37, 99, 235, 0.2)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ padding: '3px 10px', borderRadius: '12px', background: 'rgba(37,99,235,0.2)', color: '#60a5fa', fontSize: '0.75rem', fontWeight: 700 }}>
              Employee Self-Service Desk
            </span>
            {user?.TenantName && (
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Building size={13} /> {user.TenantName}
              </span>
            )}
          </div>
          <h1 style={{ fontSize: '1.7rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            Welcome back, <span className="glow-text">{user?.FirstName || user?.Username || 'Employee'}</span>
          </h1>
          <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Submit new service requests, track active tickets, and communicate directly with park technicians.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setIsCreateModalOpen(true)}
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
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <Plus size={18} /> New Request
          </button>
          
          <button
            onClick={() => navigate('/services/directory')}
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--glass-border)',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <BookOpen size={16} /> Service Catalog
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {[
          { key: 'ALL', label: 'My Total Requests', value: loading ? '...' : totalCount, sub: 'Lifetime submitted', icon: FileText, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
          { key: 'OPEN', label: 'My Open Requests', value: loading ? '...' : openCount, sub: 'Active in resolution pipeline', icon: Clock, color: '#facc15', bg: 'rgba(250, 204, 21, 0.15)' },
          { key: 'PENDING', label: 'Action Needed', value: loading ? '...' : pendingCount, sub: 'Awaiting your response', icon: AlertCircle, color: '#fb923c', bg: 'rgba(251, 146, 60, 0.15)' },
          { key: 'RESOLVED', label: 'Recently Resolved', value: loading ? '...' : resolvedCount, sub: 'Completed & closed', icon: CheckCircle2, color: '#4ade80', bg: 'rgba(74, 222, 128, 0.15)' },
        ].map(card => {
          const Icon = card.icon;
          const isSelected = filterStatus === card.key;
          return (
            <div
              key={card.key}
              className="glass-panel"
              onClick={() => setFilterStatus(card.key)}
              style={{
                padding: '20px',
                cursor: 'pointer',
                borderTop: isSelected ? `3px solid ${card.color}` : '3px solid transparent',
                transform: isSelected ? 'translateY(-2px)' : 'none',
                transition: 'all 0.2s ease',
                background: isSelected ? 'var(--bg-secondary)' : 'var(--bg-primary)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                    {card.label}
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, margin: '6px 0 2px', color: card.color }}>
                    {card.value}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {card.sub}
                  </div>
                </div>
                <div style={{ padding: '10px', borderRadius: '12px', background: card.bg, color: card.color }}>
                  <Icon size={22} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid: 2 Columns (Requests list on left, Announcements & Self-Help on right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', flexWrap: 'wrap' }}>
        
        {/* Left Column: My Requests Feed */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Header & Search */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <LifeBuoy size={18} style={{ color: 'var(--accent-primary)' }} /> My Service Requests
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Track live status updates and technician communications
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search my requests..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    padding: '7px 12px 7px 32px',
                    borderRadius: '8px',
                    border: '1px solid var(--glass-border)',
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.82rem',
                    width: '180px'
                  }}
                />
              </div>

              <button
                onClick={fetchMyRequests}
                style={{
                  padding: '7px',
                  borderRadius: '8px',
                  border: '1px solid var(--glass-border)',
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
                title="Refresh requests"
              >
                <RefreshCw size={15} />
              </button>
            </div>
          </div>

          {/* Filter Chips */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: 'All Requests' },
              { id: 'OPEN', label: 'Active Open' },
              { id: 'PENDING', label: 'Action Needed' },
              { id: 'RESOLVED', label: 'Resolved / Closed' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '16px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  background: filterStatus === tab.id ? 'var(--accent-gradient)' : 'var(--bg-tertiary)',
                  color: filterStatus === tab.id ? '#ffffff' : 'var(--text-secondary)',
                  transition: 'all 0.2s'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Requests List */}
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading your requests...
            </div>
          ) : filteredIssues.length === 0 ? (
            <div style={{
              padding: '48px 24px',
              textAlign: 'center',
              background: 'var(--bg-tertiary)',
              borderRadius: '12px',
              border: '1px stroke var(--glass-border)'
            }}>
              <CheckCircle2 size={40} style={{ color: '#4ade80', marginBottom: '12px' }} />
              <h4 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 700 }}>No requests found</h4>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {filterStatus !== 'ALL' ? 'No issues match the selected filter.' : 'You have not submitted any service requests yet.'}
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                style={{
                  marginTop: '16px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: 'var(--accent-gradient)',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Plus size={15} /> Submit First Request
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredIssues.map(issue => {
                const badge = getStatusBadge(issue.StatusCode || issue.StatusName);
                return (
                  <div
                    key={issue.IssueRequestID || issue.id}
                    onClick={() => setSelectedIssue(issue)}
                    style={{
                      padding: '16px',
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                          {issue.IssueRequestCode || `#${issue.IssueRequestID}`}
                        </span>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`
                        }}>
                          {badge.label}
                        </span>
                        {issue.CategoryName && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: '4px' }}>
                            {issue.CategoryName}
                          </span>
                        )}
                      </div>

                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {issue.Title}
                      </h4>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <span>Submitted: {new Date(issue.CreatedAt || issue.RequestDate || Date.now()).toLocaleDateString()}</span>
                        {issue.AssignedTechnicianName && (
                          <span style={{ color: '#c084fc', fontWeight: 600 }}>
                            Technician: {issue.AssignedTechnicianName}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        color: '#60a5fa',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        View Details <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Announcements & Self-Service KB */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Announcements Card */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bell size={16} style={{ color: '#fb923c' }} /> Park Announcements
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {announcements.map(item => (
                <div key={item.id} style={{
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--glass-border)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(251,146,60,0.15)', color: '#fb923c', fontWeight: 700 }}>
                      {item.tag}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.date}</span>
                  </div>
                  <h5 style={{ margin: '4px 0 2px', fontSize: '0.85rem', fontWeight: 700 }}>{item.title}</h5>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Knowledge Base */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HelpCircle size={16} style={{ color: '#38bdf8' }} /> Popular Self-Help
              </h3>
              <button
                onClick={() => navigate('/issues/known')}
                style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
              >
                View KB
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {kbArticles.map(article => (
                <div
                  key={article.id}
                  onClick={() => navigate('/issues/known')}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--glass-border)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#38bdf8'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
                >
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {article.title}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    <span>{article.category}</span>
                    <span>{article.readTime} read</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Submit New Issue Modal */}
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
