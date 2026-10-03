import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ShieldCheck, Monitor, FileText, UserCheck, ArrowRight } from 'lucide-react';
import { IDENTITY_TABS } from '../constants/identityConstants';
import UsersTab from '../components/UsersTab';
import ActiveSessionsTab from '../components/ActiveSessionsTab';
import AuditLogsTab from '../components/AuditLogsTab';
import identityApi from '../api/identityApi';

const ICON_MAP = {
  Users: Users,
  Monitor: Monitor,
  FileText: FileText
};

const TAB_COMPONENTS = {
  users: UsersTab,
  sessions: ActiveSessionsTab,
  audit: AuditLogsTab
};

export default function IdentityAccessPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    activeUsers: 0,
    rolesCount: 0,
    activeSessions: 0
  });

  const fetchMetrics = async () => {
    try {
      const [usersRes, rolesRes, sessRes] = await Promise.allSettled([
        identityApi.getUsers(),
        identityApi.getRoles(),
        identityApi.getMySessions()
      ]);

      let totalU = 0;
      let activeU = 0;
      if (usersRes.status === 'fulfilled' && usersRes.value.data?.data) {
        const uList = usersRes.value.data.data.users || usersRes.value.data.data || [];
        totalU = uList.length;
        activeU = uList.filter(u => u.Status === 'ACTIVE').length;
      }

      let rCount = 0;
      if (rolesRes.status === 'fulfilled' && rolesRes.value.data?.data) {
        const rList = rolesRes.value.data.data.roles || rolesRes.value.data.data || [];
        rCount = rList.length;
      }

      let sCount = 0;
      if (sessRes.status === 'fulfilled' && sessRes.value.data?.data) {
        const sList = sessRes.value.data.data.sessions || sessRes.value.data.data || [];
        sCount = sList.length;
      }

      setMetrics({
        totalUsers: totalU,
        activeUsers: activeU,
        rolesCount: rCount,
        activeSessions: sCount
      });
    } catch (err) {
      console.error('Failed to load identity metrics:', err);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const ActiveComponent = TAB_COMPONENTS[activeTab];

  return (
    <div>
      {/* Page Title Header */}
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '2.2rem', marginBottom: '8px' }}>
            User & Identity <span className="glow-text">Management</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Enterprise user accounts directory, active session monitoring, and identity security audit log.
          </p>
        </div>

        {/* Shortcut Button to RBAC Governance Module */}
        <button
          onClick={() => navigate('/roles/matrix')}
          style={{
            padding: '10px 20px', borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.18) 0%, rgba(138, 75, 255, 0.18) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.35)',
            color: '#a855f7', fontWeight: 700, fontSize: '0.88rem',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
            transition: 'all 0.25s ease', boxShadow: '0 4px 16px rgba(138, 75, 255, 0.15)'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(138, 75, 255, 0.25)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(138, 75, 255, 0.15)'; }}
        >
          <ShieldCheck size={18} /> Role & RBAC Governance Matrix <ArrowRight size={16} />
        </button>
      </div>

      {/* Overview Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(138, 75, 255, 0.15)', color: 'var(--accent-primary)' }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Registered</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--text-primary)' }}>{metrics.totalUsers}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-success)' }}>
            <UserCheck size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Accounts</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--text-primary)' }}>{metrics.activeUsers}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(14, 165, 233, 0.15)', color: 'var(--color-info)' }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Configured Roles</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--text-primary)' }}>{metrics.rolesCount}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--color-warning)' }}>
            <Monitor size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Live Sessions</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--text-primary)' }}>{metrics.activeSessions}</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '6px',
        padding: '6px',
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: 'var(--border-radius-md)',
        marginBottom: '28px',
        overflowX: 'auto'
      }}>
        {IDENTITY_TABS.map((tab) => {
          const Icon = ICON_MAP[tab.icon];
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              title={tab.description}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: 'var(--border-radius-sm)',
                border: 'none',
                background: isActive ? 'var(--accent-gradient)' : 'transparent',
                color: isActive ? 'white' : 'var(--text-muted)',
                fontWeight: isActive ? '600' : '500',
                fontSize: '0.88rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all var(--transition-fast)',
                boxShadow: isActive ? 'var(--glow-accent)' : 'none'
              }}
            >
              {Icon && <Icon size={16} />}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Active Tab View */}
      <div>
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  );
}
