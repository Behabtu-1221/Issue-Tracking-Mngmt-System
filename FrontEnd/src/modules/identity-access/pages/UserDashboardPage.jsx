import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../../i18n';
import {
  Users, UserCheck, ShieldCheck, Monitor, FileText,
  Activity, ExternalLink, ArrowUpRight
} from 'lucide-react';
import identityApi from '../api/identityApi';

export default function UserDashboardPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
    { key: 'total', label: t('identity.totalRegistered'), value: loading ? '...' : metrics.totalUsers, sub: t('identity.subStaffTenant'), icon: Users, color: 'var(--accent-primary)', bg: 'rgba(138, 75, 255, 0.15)', border: 'var(--accent-primary)', route: '/users/directory' },
    { key: 'active', label: t('identity.activeAccounts'), value: loading ? '...' : metrics.activeUsers, sub: t('identity.subOperational'), icon: UserCheck, color: '#4ade80', bg: 'rgba(74, 222, 128, 0.15)', border: '#4ade80', route: '/users/directory' },
    { key: 'roles', label: t('identity.configuredRoles'), value: loading ? '...' : metrics.rolesCount, sub: t('identity.subRbacProfiles'), icon: ShieldCheck, color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.15)', border: '#0ea5e9', route: '/users/roles' },
    { key: 'sessions', label: t('identity.liveSessions'), value: loading ? '...' : metrics.activeSessions, sub: t('identity.subActiveLogins'), icon: Monitor, color: '#facc15', bg: 'rgba(250, 158, 11, 0.15)', border: '#facc15', route: '/users/sessions' }
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(1.3rem, 3.5vw, 1.8rem)', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {t('identity.dashboardTitle')} <span className="glow-text">{t('identity.dashboardHighlight')}</span>
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            {t('identity.dashboardSubtitle')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '20px', background: 'rgba(138,75,255,0.15)', border: '1px solid rgba(138,75,255,0.3)', color: 'var(--accent-primary)', fontSize: '0.78rem', fontWeight: 700 }}>
            <Activity size={14} /> {t('identity.securityActiveBadge')}
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '14px', marginBottom: '24px' }}>
        {kpiCards.map((card) => {
          const Icon = card.icon;
          const isHovered = hoveredCard === card.key;
          return (
            <div key={card.key} className="glass-panel"
              onClick={() => navigate(card.route)}
              onMouseEnter={() => setHoveredCard(card.key)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                padding: '18px 20px', cursor: 'pointer', position: 'relative', overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                transform: isHovered ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
                boxShadow: isHovered ? `0 12px 28px -6px ${card.border}33` : 'none',
                borderTop: isHovered ? `2px solid ${card.border}` : '2px solid transparent'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 600 }}>{card.label}</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, margin: '6px 0 2px', color: card.color }}>{card.value}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{card.sub}</div>
                </div>
                <div style={{ padding: '10px', borderRadius: '12px', background: card.bg, color: card.color, transition: 'transform 0.3s', transform: isHovered ? 'rotate(-8deg) scale(1.1)' : 'rotate(0) scale(1)', flexShrink: 0 }}>
                  <Icon size={22} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '12px', fontSize: '0.72rem', fontWeight: 600, color: card.color, opacity: isHovered ? 1 : 0.5, transition: 'opacity 0.3s' }}>
                <ExternalLink size={11} /> {t('identity.openSubmodule')}
              </div>
            </div>
          );
        })}
      </div>

      {/* Directory Telemetry Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '16px', marginBottom: '24px' }}>
        {/* User Directory */}
        <div className="glass-panel" style={{ padding: 'clamp(16px, 3vw, 24px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>{t('identity.panelAccountsDirectory')}</h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t('identity.panelAccountsDirectoryDesc')}</p>
            </div>
            <button onClick={() => navigate('/users/directory')} className="touch-target-sm" style={{ background: 'rgba(138,75,255,0.1)', border: '1px solid rgba(138,75,255,0.3)', color: 'var(--accent-primary)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '8px' }}>
              {t('identity.btnViewDirectory')} <ArrowUpRight size={13} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div onClick={() => navigate('/users/directory')} style={{ padding: '14px 16px', borderRadius: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.2s', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(138,75,255,0.15)', color: 'var(--accent-primary)', flexShrink: 0 }}><Users size={20} /></div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{t('identity.panelStaffAccounts')}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{metrics.totalUsers} {t('identity.panelRegisteredInDirectory')}</div>
                </div>
              </div>
              <span className="badge badge-success">{t('identity.statusActive')}</span>
            </div>
          </div>
        </div>

        {/* Roles & Sessions */}
        <div className="glass-panel" style={{ padding: 'clamp(16px, 3vw, 24px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>{t('identity.panelSecurityControls')}</h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t('identity.panelSecurityControlsDesc')}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div onClick={() => navigate('/roles/matrix')} style={{ padding: '14px 16px', borderRadius: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', cursor: 'pointer', transition: 'all 0.2s' }}>
              <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(14,165,233,0.15)', color: '#0ea5e9', width: 'fit-content', marginBottom: '10px' }}><ShieldCheck size={18} /></div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t('identity.labelRbacGovernance')}</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '2px' }}>{t('identity.labelRoleMatrix')}</div>
            </div>
            <div onClick={() => navigate('/users/sessions')} style={{ padding: '14px 16px', borderRadius: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', cursor: 'pointer', transition: 'all 0.2s' }}>
              <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(245,158,11,0.15)', color: '#facc15', width: 'fit-content', marginBottom: '10px' }}><Monitor size={18} /></div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t('identity.labelSecurity')}</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '2px' }}>{t('identity.labelActiveSessions')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Shortcuts Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--border-radius-md)', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{t('identity.shortcutsBarTitle')}</div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {[
            { label: t('identity.shortcutUsers'), icon: Users, route: '/users/directory' },
            { label: t('identity.shortcutRoles'), icon: ShieldCheck, route: '/roles/matrix' },
            { label: t('identity.shortcutSessions'), icon: Monitor, route: '/users/sessions' },
            { label: t('identity.shortcutAudit'), icon: FileText, route: '/users/audit' }
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
