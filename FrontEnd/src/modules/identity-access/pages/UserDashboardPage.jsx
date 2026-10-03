import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, UserCheck, ShieldCheck, Monitor, FileText,
  Home, ChevronRight, Activity, ExternalLink, ArrowUpRight,
  BarChart2, Lock
} from 'lucide-react';
import identityApi from '../api/identityApi';

export default function UserDashboardPage() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    activeUsers: 0,
    rolesCount: 0,
    activeSessions: 0
  });
  const [loading, setLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const kpiCards = [
    { key: 'total', label: 'Total Registered', value: loading ? '...' : metrics.totalUsers, sub: 'Staff & tenant user accounts', icon: Users, color: 'var(--accent-primary)', bg: 'rgba(138, 75, 255, 0.15)', border: 'var(--accent-primary)', route: '/users/directory' },
    { key: 'active', label: 'Active Accounts', value: loading ? '...' : metrics.activeUsers, sub: 'Operational user status', icon: UserCheck, color: '#4ade80', bg: 'rgba(74, 222, 128, 0.15)', border: '#4ade80', route: '/users/directory' },
    { key: 'roles', label: 'Configured Roles', value: loading ? '...' : metrics.rolesCount, sub: 'RBAC permission profiles', icon: ShieldCheck, color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.15)', border: '#0ea5e9', route: '/users/roles' },
    { key: 'sessions', label: 'Live Sessions', value: loading ? '...' : metrics.activeSessions, sub: 'Current active logins', icon: Monitor, color: '#facc15', bg: 'rgba(250, 158, 11, 0.15)', border: '#facc15', route: '/users/sessions' }
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
{/* Header */}
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
              User Directory & <span className="glow-text">Identity Governance</span>
            </h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Enterprise authentication, RBAC permission roles, staff user directory, and active sessions
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '20px', background: 'rgba(138,75,255,0.15)', border: '1px solid rgba(138,75,255,0.3)', color: 'var(--accent-primary)', fontSize: '0.78rem', fontWeight: 700 }}>
              <Activity size={14} /> Identity Security Active
            </span>
          </div>
        <div style={{ marginBottom: '24px' }}>
</div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {kpiCards.map((card) => {
          const Icon = card.icon;
          const isHovered = hoveredCard === card.key;
          return (
            <div key={card.key} className="glass-panel"
              onClick={() => navigate(card.route)}
              onMouseEnter={() => setHoveredCard(card.key)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                padding: '22px', cursor: 'pointer', position: 'relative', overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                transform: isHovered ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
                boxShadow: isHovered ? `0 12px 28px -6px ${card.border}33` : 'none',
                borderTop: isHovered ? `2px solid ${card.border}` : '2px solid transparent'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 600 }}>{card.label}</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, margin: '8px 0 4px', color: card.color }}>{card.value}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{card.sub}</div>
                </div>
                <div style={{ padding: '12px', borderRadius: '14px', background: card.bg, color: card.color, transition: 'transform 0.3s', transform: isHovered ? 'rotate(-8deg) scale(1.1)' : 'rotate(0) scale(1)' }}>
                  <Icon size={24} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '14px', fontSize: '0.72rem', fontWeight: 600, color: card.color, opacity: isHovered ? 1 : 0.5, transition: 'opacity 0.3s' }}>
                <ExternalLink size={11} /> Open sub-module view
              </div>
            </div>
          );
        })}
      </div>

      {/* Directory Telemetry Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {/* User Directory */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>User Accounts Directory</h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>Registered staff and tenant users</p>
            </div>
            <button onClick={() => navigate('/users/directory')} style={{ background: 'rgba(138,75,255,0.1)', border: '1px solid rgba(138,75,255,0.3)', color: 'var(--accent-primary)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '8px' }}>
              View Directory <ArrowUpRight size={13} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div onClick={() => navigate('/users/directory')} style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(138,75,255,0.15)', color: 'var(--accent-primary)' }}><Users size={20} /></div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>Staff & User Accounts</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{metrics.totalUsers} registered users in directory</div>
                </div>
              </div>
              <span className="badge badge-success">Active</span>
            </div>
          </div>
        </div>

        {/* Roles & Sessions */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Security & RBAC Controls</h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>Role configurations & active session monitoring</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div onClick={() => navigate('/roles/matrix')} style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', cursor: 'pointer', transition: 'all 0.2s' }}>
              <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(14,165,233,0.15)', color: '#0ea5e9', width: 'fit-content', marginBottom: '10px' }}><ShieldCheck size={18} /></div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>RBAC Governance</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: '2px' }}>Role Matrix</div>
            </div>
            <div onClick={() => navigate('/users/sessions')} style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', cursor: 'pointer', transition: 'all 0.2s' }}>
              <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(245,158,11,0.15)', color: '#facc15', width: 'fit-content', marginBottom: '10px' }}><Monitor size={18} /></div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Security</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: '2px' }}>Active Sessions</div>
            </div>
          </div>
        </div>
      </div>

      {/* Shortcuts Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--border-radius-md)', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>User Directory Shortcuts</div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {[
            { label: 'Users & Staff Directory', icon: Users, route: '/users/directory' },
            { label: 'Role & RBAC Governance', icon: ShieldCheck, route: '/roles/matrix' },
            { label: 'Active Sessions & Security', icon: Monitor, route: '/users/sessions' },
            { label: 'Security Audit Logs', icon: FileText, route: '/users/audit' }
          ].map((s) => {
            const ShortIcon = s.icon;
            return (
              <button key={s.label} onClick={() => navigate(s.route)} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '7px 14px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-gradient)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'transparent'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
              >
                <ShortIcon size={14} /> {s.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
