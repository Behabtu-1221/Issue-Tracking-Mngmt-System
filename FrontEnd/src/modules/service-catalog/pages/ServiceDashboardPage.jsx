import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, FolderKanban, Layers,
  Home, ChevronRight, Activity, ExternalLink, ArrowUpRight,
  Tag, Zap, TrendingUp, CheckCircle2, Settings, Clock, BarChart3,
  Send, Users, ShieldAlert, ArrowRight, Plus, RefreshCw,
  CheckSquare, FileSpreadsheet, Sparkles, Filter, ChevronDown, CheckCircle
} from 'lucide-react';
import { useTranslation } from '../../../i18n/LanguageContext';
import serviceCatalogApi from '../api/serviceCatalogApi';
import { usePermissionContext } from '../../role-permission-management/contexts/PermissionContext';

export default function ServiceDashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isParkAdmin, isCompanyAdmin, hasPermission } = usePermissionContext();
  const roleCode = (user?.userTypeCode || user?.UserTypeCode || (user?.roles && user?.roles[0]?.RoleCode) || '').toUpperCase();
  const isEmployee = roleCode === 'EMPLOYEE' || (!isParkAdmin && !isCompanyAdmin && !hasPermission('Service.Create'));

  const [metrics, setMetrics] = useState(null);
  const [ecoMetrics, setEcoMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setRefreshing(true);
      const [resOverview, resEco] = await Promise.all([
        serviceCatalogApi.getOverviewMetrics().catch(() => ({ data: { data: {} } })),
        serviceCatalogApi.getEcosystemAnalytics().catch(() => ({ data: { data: {} } }))
      ]);
      setMetrics(resOverview.data?.data || null);
      setEcoMetrics(resEco.data?.data || null);
    } catch (err) {
      console.error('Failed to load catalog metrics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const m = metrics || {};
  const eco = ecoMetrics || {};
  const ecoSummary = eco.summary || {};
  const categoryBreakdown = eco.categoryBreakdown || [];

  const kpiCards = [
    {
      key: 'categories',
      label: t('catalog.metrics.serviceCategories', 'Service Categories'),
      value: loading ? '...' : `${m.totalCategories || ecoSummary.TotalCategories || 0}`,
      sub: isEmployee ? t('catalog.browseServices', 'Browse available categories') : t('catalog.pages.categoriesDesc', 'Organized service taxonomy'),
      subColor: 'var(--accent-primary)',
      icon: FolderKanban,
      iconBg: 'rgba(138, 75, 255, 0.15)',
      iconColor: 'var(--accent-primary)',
      borderAccent: 'var(--accent-primary)',
      route: '/services/categories'
    },
    {
      key: 'services',
      label: t('catalog.tabs.services', 'Services Offered'),
      value: loading ? '...' : `${m.totalServices || ecoSummary.TotalActiveServices || 0}`,
      sub: `${m.activeServices || ecoSummary.TotalActiveServices || 0} ${t('catalog.servicesTab.active', 'Active')}`,
      subColor: 'var(--color-success)',
      icon: Layers,
      iconBg: 'rgba(14, 165, 233, 0.15)',
      iconColor: '#0ea5e9',
      borderAccent: '#0ea5e9',
      route: '/services/directory'
    },
    {
      key: 'active',
      label: t('catalog.requestService', 'Service Requests'),
      value: loading ? '...' : `${ecoSummary.TotalServiceRequests || 0}`,
      sub: isEmployee ? t('dashboard.myRecentRequests', 'Track my service requests') : t('catalog.hubTitle', 'Linked to Service Catalog'),
      subColor: 'var(--color-info)',
      icon: Tag,
      iconBg: 'rgba(16, 185, 129, 0.15)',
      iconColor: 'var(--color-success)',
      borderAccent: 'var(--color-success)',
      route: isEmployee ? '/issues/my-requests' : '/issues/tracker'
    },
    {
      key: 'mappings',
      label: t('catalog.tabs.categoryMappings', 'Category Mappings'),
      value: loading ? '...' : `${m.totalCategories || ecoSummary.TotalCategories || 0} Routes`,
      sub: t('catalog.dashboard.categoryMappingsSubtitle', 'Automated department routing'),
      subColor: '#a855f7',
      icon: Tag,
      iconBg: 'rgba(168, 85, 247, 0.15)',
      iconColor: '#a855f7',
      borderAccent: '#a855f7',
      route: isEmployee ? '/services/directory' : '/services/category-mappings'
    }
  ];

  return (
    <div style={{ paddingBottom: '32px' }}>
      {/* Breadcrumb Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
        <span
          onClick={() => navigate('/services/dashboard')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', transition: 'color 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <BookOpen size={14} /> {t('nav.services', 'Service Catalog')}
        </span>
        <ChevronRight size={14} />
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
          {t('nav.servicesOverview', 'Catalog Overview')}
        </span>
      </div>

      {/* Hero Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(138, 75, 255, 0.12) 0%, rgba(14, 165, 233, 0.08) 50%, rgba(16, 185, 129, 0.05) 100%)',
        border: '1px solid var(--glass-border)',
        borderRadius: '16px',
        padding: '28px 32px',
        marginBottom: '28px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
      }}>
        <div style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '200px',
          height: '200px',
          background: 'radial-gradient(circle, rgba(138, 75, 255, 0.2) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: '720px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '20px',
                background: 'rgba(138, 75, 255, 0.18)',
                border: '1px solid rgba(138, 75, 255, 0.4)',
                color: 'var(--accent-primary)',
                fontSize: '0.74rem',
                fontWeight: 700,
                letterSpacing: '0.5px',
                textTransform: 'uppercase'
              }}>
                <Sparkles size={12} /> {t('catalog.hubBadge', 'Enterprise Service Management')}
              </span>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '20px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: 'var(--color-success)',
                fontSize: '0.74rem',
                fontWeight: 700
              }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--color-success)', display: 'inline-block', boxShadow: '0 0 8px var(--color-success)' }} />
                {t('catalog.dashboard.liveSync', 'Live Sync Active')}
              </span>
            </div>

            <h1 style={{ fontSize: '1.9rem', fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
              {t('catalog.hubTitle', 'Service Catalog Overview & Telemetry')}
            </h1>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: '1.5' }}>
              {t('catalog.hubSubtitle', 'Comprehensive service portfolio directory, automated category-to-department routing, and end-to-end operational telemetry.')}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={fetchMetrics}
              disabled={refreshing}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '10px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)',
                fontSize: '0.84rem',
                fontWeight: 600,
                cursor: refreshing ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={e => { if (!refreshing) e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
              onMouseLeave={e => { if (!refreshing) e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
            >
              <RefreshCw size={15} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
              {refreshing ? t('common.refreshing', 'Syncing...') : t('catalog.dashboard.syncTelemetry', 'Sync Telemetry')}
            </button>

            {isEmployee ? (
              <button
                onClick={() => navigate('/issues/create')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  background: 'var(--accent-gradient)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(138, 75, 255, 0.35)',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <Plus size={16} /> {t('dashboard.newRequest', 'Submit Service Request')}
              </button>
            ) : (
              <button
                onClick={() => navigate('/services/directory')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  background: 'var(--accent-gradient)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(138, 75, 255, 0.35)',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <Layers size={16} /> {t('catalog.dashboard.exploreDirectory', 'Explore Directory')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px', marginBottom: '28px' }}>
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
                padding: '24px',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '14px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                boxShadow: isHovered ? `0 14px 30px -8px ${card.borderAccent}33` : '0 4px 16px rgba(0,0,0,0.06)',
                borderTop: isHovered ? `3px solid ${card.borderAccent}` : '3px solid transparent'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 700 }}>
                    {card.label}
                  </div>
                  <div style={{ fontSize: '1.9rem', fontWeight: 800, margin: '10px 0 6px', lineHeight: 1.1 }}>
                    {card.value}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: card.subColor, fontWeight: 600 }}>
                    {card.sub}
                  </div>
                </div>
                <div style={{
                  padding: '13px',
                  borderRadius: '14px',
                  background: card.iconBg,
                  color: card.iconColor,
                  transition: 'transform 0.3s',
                  transform: isHovered ? 'scale(1.1) rotate(-6deg)' : 'scale(1)'
                }}>
                  <Icon size={24} />
                </div>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                marginTop: '16px',
                fontSize: '0.74rem',
                fontWeight: 600,
                color: card.iconColor,
                opacity: isHovered ? 1 : 0.6,
                transition: 'opacity 0.2s'
              }}>
                <ExternalLink size={12} /> {t('catalog.dashboard.clickDetails', 'Click to view details')}
              </div>
            </div>
          );
        })}
      </div>

      {/* Integrated Ecosystem Pipeline Telemetry (5 Modules) */}
      <div className="glass-panel" style={{
        padding: '28px',
        marginBottom: '28px',
        borderRadius: '16px',
        borderLeft: '4px solid var(--accent-primary)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.18rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Zap size={20} color="var(--accent-primary)" />
              {t('catalog.dashboard.pipelineTitle', 'Service Catalog Multi-Module Ecosystem Pipeline')}
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {t('catalog.dashboard.pipelineSubtitle', 'Real-time synchronization across Issue Requests, Approvals, Dispatch, SLA Clocks, and BI Analytics')}
            </p>
          </div>
          <span style={{
            fontSize: '0.74rem',
            padding: '5px 12px',
            borderRadius: '20px',
            background: 'rgba(138, 75, 255, 0.12)',
            color: 'var(--accent-primary)',
            fontWeight: 700
          }}>
            5 Connected Ecosystem Engines
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          {/* Module 1: Issue Requests */}
          <div
            onClick={() => navigate(isEmployee ? '/issues/my-requests' : '/issues/tracker')}
            style={{
              padding: '18px',
              borderRadius: '12px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--glass-border)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-primary)', marginBottom: '8px' }}>
              <Tag size={15} /> 1. {t('catalog.dashboard.issueRequests', 'ISSUE REQUESTS')}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{ecoSummary.TotalServiceRequests || 0}</div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {t('catalog.dashboard.requestsLogged', 'Requests channeled via Catalog')}
            </div>
          </div>

          {/* Module 2: Approvals */}
          <div
            onClick={() => navigate('/approvals')}
            style={{
              padding: '18px',
              borderRadius: '12px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--glass-border)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 800, color: '#3b82f6', marginBottom: '8px' }}>
              <CheckCircle2 size={15} /> 2. {t('catalog.dashboard.approvalRules', 'APPROVAL RULES')}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{ecoSummary.TotalApprovedRequests || 0}</div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {t('catalog.dashboard.approvalsFinalized', 'Workflows approved & authorized')}
            </div>
          </div>

          {/* Module 3: Dispatch & Roster */}
          <div
            onClick={() => navigate('/issues/tracker')}
            style={{
              padding: '18px',
              borderRadius: '12px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--glass-border)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#0ea5e9'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 800, color: '#0ea5e9', marginBottom: '8px' }}>
              <Users size={15} /> 3. {t('catalog.dashboard.dispatchRoster', 'DISPATCH & ROSTER')}
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800 }}>{t('catalog.dashboard.autoRouted', 'Auto-Routed')}</div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {t('catalog.dashboard.deptQueued', 'Department & Skill Queued')}
            </div>
          </div>

          {/* Module 4: SLA Targets */}
          <div
            onClick={() => navigate('/sla')}
            style={{
              padding: '18px',
              borderRadius: '12px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--glass-border)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-success)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-success)', marginBottom: '8px' }}>
              <Clock size={15} /> 4. {t('catalog.dashboard.slaTargets', 'SLA TARGETS')}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{ecoSummary.ActiveSLAClocks || 0}</div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {t('catalog.dashboard.activeTimers', 'Active SLA Clocks Monitored')}
            </div>
          </div>

          {/* Module 5: BI Analytics */}
          <div
            onClick={() => navigate('/services/categories')}
            style={{
              padding: '18px',
              borderRadius: '12px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--glass-border)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-warning)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-warning)', marginBottom: '8px' }}>
              <BarChart3 size={15} /> 5. {t('catalog.dashboard.biAnalytics', 'BI ANALYTICS')}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>
              {m.totalCategories || ecoSummary.TotalCategories || 0} {t('catalog.tabs.categories', 'Categories')}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {t('catalog.pages.categoriesDesc', 'Taxonomy & Service Portfolio Depth')}
            </div>
          </div>
        </div>
      </div>

      {/* Main Operational Hub: 2 High-Value Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '22px', marginBottom: '28px' }}>
        {/* Panel 1: Service Directory & Self-Service Offerings */}
        <div className="glass-panel" style={{ padding: '26px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
                {isEmployee ? t('catalog.dashboard.selfServiceHub', 'Employee Service Hub') : t('catalog.dashboard.deliveryPipeline', 'Service Delivery Pipeline')}
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {isEmployee ? t('catalog.dashboard.selfServiceSubtitle', 'Browse park service offerings, SLAs, and submit new requests') : t('catalog.dashboard.deliverySubtitle', 'Core service offerings and fulfillment configurations')}
              </p>
            </div>
            <button
              onClick={() => navigate('/services/directory')}
              style={{
                background: 'rgba(14, 165, 233, 0.1)',
                border: '1px solid rgba(14, 165, 233, 0.3)',
                color: '#0ea5e9',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 14px',
                borderRadius: '8px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(14, 165, 233, 0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(14, 165, 233, 0.1)'}
            >
              {t('catalog.dashboard.viewServices', 'View Services')} <ArrowUpRight size={13} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              onClick={() => navigate('/services/directory')}
              style={{
                padding: '16px 18px',
                borderRadius: '12px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--glass-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.25s'
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.borderColor = '#0ea5e9'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(14, 165, 233, 0.15)', color: '#0ea5e9' }}>
                  <Layers size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.94rem' }}>{t('catalog.dashboard.serviceDirectory', 'Service Directory')}</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {m.totalServices || ecoSummary.TotalActiveServices || 0} {t('catalog.servicesTab.thOffering', 'registered service offerings')}
                  </div>
                </div>
              </div>
              <span className="badge badge-info">{t('catalog.servicesTab.active', 'Active')}</span>
            </div>

            <div
              onClick={() => navigate('/services/categories')}
              style={{
                padding: '16px 18px',
                borderRadius: '12px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--glass-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.25s'
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(138, 75, 255, 0.15)', color: 'var(--accent-primary)' }}>
                  <FolderKanban size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.94rem' }}>{t('catalog.tabs.categories', 'Service Categories')}</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {m.totalCategories || ecoSummary.TotalCategories || 0} {t('catalog.pages.categoriesDesc', 'organized category taxonomy')}
                  </div>
                </div>
              </div>
              <span className="badge badge-primary">{t('catalog.servicesTab.active', 'Active')}</span>
            </div>
          </div>
        </div>

        {/* Panel 2: Category Routing & Department Dispatch Mappings */}
        <div className="glass-panel" style={{ padding: '26px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
                {isEmployee ? t('dashboard.myRecentRequests', 'My Active Workflows & History') : t('catalog.tabs.categoryMappings', 'Category Routing & Mappings')}
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {isEmployee ? t('dashboard.employeeSubtitle', 'Track live status, milestones, and responses from assigned technician') : t('catalog.dashboard.categoryMappingsSubtitle', 'Direct department assignment and auto-dispatch rules')}
              </p>
            </div>
            {isEmployee ? (
              <button
                onClick={() => navigate('/issues/my-requests')}
                style={{
                  background: 'rgba(37, 99, 235, 0.1)',
                  border: '1px solid rgba(37, 99, 235, 0.3)',
                  color: 'var(--color-primary)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  transition: 'all 0.2s'
                }}
              >
                {t('dashboard.viewAllRequests', 'My Requests')} <ArrowUpRight size={13} />
              </button>
            ) : (
              <button
                onClick={() => navigate('/services/category-mappings')}
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
                  padding: '6px 14px',
                  borderRadius: '8px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(138, 75, 255, 0.2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(138, 75, 255, 0.1)'}
              >
                {t('catalog.dashboard.viewMappings', 'View Mappings')} <ArrowUpRight size={13} />
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {isEmployee ? (
              <>
                <div
                  onClick={() => navigate('/issues/my-requests')}
                  style={{
                    padding: '18px',
                    borderRadius: '12px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--glass-border)',
                    cursor: 'pointer',
                    transition: 'all 0.25s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = '#0ea5e9'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
                >
                  <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(14, 165, 233, 0.15)', color: '#0ea5e9', width: 'fit-content', marginBottom: '10px' }}>
                    <Clock size={18} />
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{t('dashboard.openTickets', 'Live Workflows')}</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '2px' }}>{t('dashboard.myOpenRequests', 'Active In Pipeline')}</div>
                </div>

                <div
                  onClick={() => navigate('/issues/history')}
                  style={{
                    padding: '18px',
                    borderRadius: '12px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--glass-border)',
                    cursor: 'pointer',
                    transition: 'all 0.25s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = '#10b981'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
                >
                  <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', width: 'fit-content', marginBottom: '10px' }}>
                    <CheckCircle2 size={18} />
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{t('dashboard.pastFulfillment', 'Past Fulfillment')}</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '2px' }}>{t('dashboard.recentlyResolved', 'Request History')}</div>
                </div>
              </>
            ) : (
              <>
                <div
                  onClick={() => navigate('/services/category-mappings')}
                  style={{
                    padding: '18px',
                    borderRadius: '12px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--glass-border)',
                    cursor: 'pointer',
                    transition: 'all 0.25s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = '#3b82f6'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
                >
                  <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', width: 'fit-content', marginBottom: '10px' }}>
                    <Tag size={18} />
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{t('catalog.tabs.categoryMappings', 'Category Routing Mappings')}</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '2px' }}>{t('nav.serviceCategoryMapping', 'Department Mappings')}</div>
                </div>

                <div
                  onClick={() => navigate('/services/categories')}
                  style={{
                    padding: '18px',
                    borderRadius: '12px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--glass-border)',
                    cursor: 'pointer',
                    transition: 'all 0.25s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
                >
                  <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(138, 75, 255, 0.15)', color: 'var(--accent-primary)', width: 'fit-content', marginBottom: '10px' }}>
                    <FolderKanban size={18} />
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{t('catalog.tabs.categories', 'Service Categories')}</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '2px' }}>{t('catalog.pages.categoriesDesc', 'Taxonomy Setup')}</div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Category Performance Breakdown (Telemetry Table) */}
      {categoryBreakdown.length > 0 && (
        <div className="glass-panel" style={{ padding: '26px', borderRadius: '16px', marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={18} color="var(--accent-primary)" />
                {t('catalog.dashboard.categoryDistribution', 'Category Service & Request Distribution')}
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {t('catalog.dashboard.categoryDistributionSub', 'Aggregated volume, service depth, and ticket fulfillment across categories')}
              </p>
            </div>
            <button
              onClick={() => navigate('/services/categories')}
              style={{
                fontSize: '0.78rem',
                padding: '6px 14px',
                borderRadius: '8px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {t('catalog.dashboard.manageCategories', 'Manage Categories')}
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '12px 14px' }}>{t('catalog.categoriesTab.name', 'Category Name')}</th>
                  <th style={{ padding: '12px 14px' }}>{t('catalog.categoriesTab.code', 'Code')}</th>
                  <th style={{ padding: '12px 14px' }}>{t('catalog.dashboard.servicesCount', 'Services Count')}</th>
                  <th style={{ padding: '12px 14px' }}>{t('catalog.dashboard.requestsLogged', 'Requests Channeled')}</th>
                  <th style={{ padding: '12px 14px' }}>{t('catalog.dashboard.resolutionRate', 'Fulfillment Rate')}</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>{t('common.actions', 'Action')}</th>
                </tr>
              </thead>
              <tbody>
                {categoryBreakdown.map((cat, idx) => {
                  const resolutionPct = cat.TotalRequests > 0 ? Math.round(((cat.ResolvedRequests || 0) / cat.TotalRequests) * 100) : 100;
                  return (
                    <tr
                      key={idx}
                      style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-primary)' }} />
                          {cat.CategoryName}
                        </div>
                      </td>
                      <td style={{ padding: '14px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {cat.CategoryCode}
                      </td>
                      <td style={{ padding: '14px', fontWeight: 700 }}>
                        <span style={{ padding: '3px 10px', borderRadius: '12px', background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', fontSize: '0.78rem' }}>
                          {cat.ServiceCount || 0} {t('catalog.tabs.services', 'services')}
                        </span>
                      </td>
                      <td style={{ padding: '14px', fontWeight: 700 }}>
                        {cat.TotalRequests || 0}
                      </td>
                      <td style={{ padding: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '90px', height: '6px', borderRadius: '3px', background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
                            <div style={{ width: `${resolutionPct}%`, height: '100%', background: resolutionPct >= 80 ? 'var(--color-success)' : 'var(--color-warning)', borderRadius: '3px' }} />
                          </div>
                          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: resolutionPct >= 80 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                            {resolutionPct}%
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '14px', textAlign: 'right' }}>
                        <button
                          onClick={() => navigate('/services/directory')}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--accent-primary)',
                            cursor: 'pointer',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          {t('common.view', 'View')} <ArrowRight size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Shortcuts Command Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 24px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--glass-border)',
        borderRadius: '16px',
        flexWrap: 'wrap',
        gap: '14px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
      }}>
        <div style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={16} color="var(--accent-primary)" />
          {isEmployee ? t('dashboard.employeeShortcuts', 'Employee Self-Service Shortcuts') : t('catalog.dashboard.shortcutsTitle', 'Service Catalog Shortcuts')}
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {(isEmployee ? [
            { label: t('catalog.dashboard.serviceDirectory', 'Service Directory'), icon: Layers, route: '/services/directory' },
            { label: t('dashboard.newRequest', 'Submit Service Request'), icon: Plus, route: '/issues/create' },
            { label: t('dashboard.myRecentRequests', 'My Requests'), icon: Clock, route: '/issues/my-requests' },
            { label: t('nav.requestHistory', 'Request History'), icon: CheckCircle2, route: '/issues/history' }
          ] : [
            { label: t('catalog.dashboard.serviceDirectory', 'Service Directory'), icon: Layers, route: '/services/directory' },
            { label: t('catalog.dashboard.categories', 'Categories'), icon: FolderKanban, route: '/services/categories' },
            { label: t('catalog.tabs.categoryMappings', 'Category Mappings'), icon: Tag, route: '/services/category-mappings' }
          ]).map((s) => {
            const ShortIcon = s.icon;
            return (
              <button
                key={s.route}
                onClick={() => navigate(s.route)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.82rem',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: '1px solid var(--glass-border)',
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'all 0.25s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'var(--accent-gradient)';
                  e.currentTarget.style.color = '#fff';
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'var(--bg-tertiary)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.borderColor = 'var(--glass-border)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
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
