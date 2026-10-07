import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserCheck,
  FileText,
  Building2,
  Home,
  ChevronRight,
  TrendingUp,
  Activity,
  Layers,
  Building,
  Plus,
  ArrowUpRight,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Briefcase,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import tenantApi from '../api/tenantApi';

const interactiveCard = (extra = {}) => ({
  padding: '22px',
  position: 'relative',
  overflow: 'hidden',
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  ...extra
});

import { useTranslation } from '../../../i18n';

export default function TenantDashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await tenantApi.getTenantMetrics();
      if (res.data && res.data.data) {
        setMetrics(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load tenant metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const tenantStats = metrics?.tenants || {};
  const leaseStats = metrics?.leases || {};
  const allocStats = metrics?.allocations || {};

  const totalTenants = tenantStats.totalTenants || 0;
  const activeTenants = tenantStats.activeTenants || 0;
  const activeLeases = leaseStats.activeLeases || 0;
  const activeAllocations = allocStats.activeAllocations || 0;

  const kpiCards = [
    {
      key: 'directory',
      label: 'Registered Companies',
      value: `${totalTenants} Tenants`,
      sub: `${activeTenants} Active & Verified`,
      subColor: 'var(--color-success)',
      icon: Users,
      iconBg: 'rgba(138, 75, 255, 0.15)',
      iconColor: 'var(--accent-primary)',
      borderAccent: 'var(--accent-primary)',
      route: '/tenants/directory'
    },
    {
      key: 'contacts',
      label: 'Contacts & Addresses',
      value: `${totalTenants} Organizations`,
      sub: 'Company Points of Contact',
      subColor: 'var(--color-info)',
      icon: Building,
      iconBg: 'rgba(16, 185, 129, 0.15)',
      iconColor: 'var(--color-success)',
      borderAccent: 'var(--color-success)',
      route: '/tenants/contacts'
    },
    {
      key: 'leases',
      label: 'Lease Contracts',
      value: `${activeLeases} Active Leases`,
      sub: 'Binding Commercial Agreements',
      subColor: 'var(--color-info)',
      icon: FileText,
      iconBg: 'rgba(59, 130, 246, 0.15)',
      iconColor: '#3b82f6',
      borderAccent: '#3b82f6',
      route: '/tenants/leases'
    },
    {
      key: 'allocations',
      label: 'Space Allocations',
      value: `${activeAllocations} Leased Spaces`,
      sub: 'Occupied Office Units',
      subColor: 'var(--color-warning)',
      icon: Building2,
      iconBg: 'rgba(245, 158, 11, 0.15)',
      iconColor: 'var(--color-warning)',
      borderAccent: 'var(--color-warning)',
      route: '/tenants/allocations'
    }
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              {t('nav.tenantOverview')}
            </h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              {t('tenant.overviewSubtitle')}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '20px',
              background: 'rgba(138, 75, 255, 0.15)',
              border: '1px solid rgba(138, 75, 255, 0.3)',
              color: 'var(--accent-primary)',
              fontSize: '0.78rem',
              fontWeight: 700
            }}>
              <Activity size={14} /> Tenant Telemetry Active
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '28px'
      }}>
        {kpiCards.map((card) => {
          const Icon = card.icon;
          const isHovered = hoveredCard === card.key;
          return (
            <div
              key={card.key}
              className="glass-panel"
              onClick={() => navigate(card.route)}
              onMouseEnter={() => setHoveredCard(card.key)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                ...interactiveCard(),
                transform: isHovered ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
                boxShadow: isHovered ? `0 12px 28px -6px ${card.borderAccent}33` : 'none',
                borderTop: isHovered ? `2px solid ${card.borderAccent}` : '2px solid transparent'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 600 }}>{card.label}</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-primary)', margin: '8px 0 4px', lineHeight: 1.1 }}>
                    {card.value}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: card.subColor, fontWeight: 500 }}>
                    {card.sub}
                  </div>
                </div>
                <div style={{
                  padding: '12px',
                  borderRadius: '14px',
                  background: card.iconBg,
                  color: card.iconColor,
                  transition: 'transform 0.3s',
                  transform: isHovered ? 'rotate(-8deg) scale(1.1)' : 'rotate(0) scale(1)'
                }}>
                  <Icon size={24} />
                </div>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                marginTop: '14px',
                fontSize: '0.72rem',
                fontWeight: 600,
                color: card.iconColor,
                opacity: isHovered ? 1 : 0.5,
                transition: 'opacity 0.3s'
              }}>
                <ExternalLink size={11} /> Click to view details
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Analytics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {/* Lease Portfolio Telemetry */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Lease Contract Portfolio
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Active commercial contracts & lease renewal telemetry
              </p>
            </div>
            <button
              onClick={() => navigate('/tenants/leases')}
              style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                color: '#3b82f6',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                borderRadius: '8px',
                transition: 'all 0.2s'
              }}
            >
              View Leases <ArrowUpRight size={13} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              onClick={() => navigate('/tenants/leases')}
              style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.25s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.borderColor = '#3b82f6'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
                  <FileText size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>Active Commercial Leases</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{activeLeases} Verified Contracts Active</div>
                </div>
              </div>
              <span className="badge badge-success">Active</span>
            </div>

            <div
              onClick={() => navigate('/tenants/allocations')}
              style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.25s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.borderColor = 'var(--color-warning)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--color-warning)' }}>
                  <Building2 size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>Office Space Allocations</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{activeAllocations} Occupied Office Spaces</div>
                </div>
              </div>
              <span className="badge badge-warning">Allocated</span>
            </div>
          </div>
        </div>

        {/* Tenant Structure & Representatives */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Tenant Organization Hierarchy
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Company representatives, sub-tenant branches, and contact nodes
              </p>
            </div>
            <button
              onClick={() => navigate('/tenants/directory')}
              style={{
                background: 'rgba(138, 75, 255, 0.1)',
                border: '1px solid rgba(138, 75, 255, 0.3)',
                color: 'var(--accent-primary)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                borderRadius: '8px',
                transition: 'all 0.2s'
              }}
            >
              View Directory <ArrowUpRight size={13} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div
              onClick={() => navigate('/tenants/contacts')}
              style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', cursor: 'pointer', transition: 'all 0.25s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'var(--color-success)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
            >
              <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-success)', width: 'fit-content', marginBottom: '10px' }}>
                <Building size={18} />
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Tenant Contacts</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '2px' }}>Points of Contact</div>
            </div>

            <div
              onClick={() => navigate('/tenants/sub-tenants')}
              style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', cursor: 'pointer', transition: 'all 0.25s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
            >
              <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(138, 75, 255, 0.15)', color: 'var(--accent-primary)', width: 'fit-content', marginBottom: '10px' }}>
                <Layers size={18} />
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Sub-Tenants</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '2px' }}>Sub-Lease Tree</div>
            </div>
          </div>
        </div>
      </div>

      {/* Shortcuts Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '18px 22px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--glass-border)',
        borderRadius: 'var(--border-radius-md)',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          Tenant Management Shortcuts
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {[
            { label: 'Tenants Directory', icon: Users, route: '/tenants/directory' },
            { label: 'Lease Contracts', icon: FileText, route: '/tenants/leases' },
            { label: 'Space Allocations', icon: Building2, route: '/tenants/allocations' },
            { label: 'Sub-Tenants Tree', icon: Layers, route: '/tenants/sub-tenants' },
            { label: 'Contacts & Addresses', icon: Building, route: '/tenants/contacts' }
          ].map((shortcut) => {
            const ShortIcon = shortcut.icon;
            return (
              <button
                key={shortcut.label}
                onClick={() => navigate(shortcut.route)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.8rem',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--glass-border)',
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-gradient)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'transparent'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
              >
                <ShortIcon size={14} /> {shortcut.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
