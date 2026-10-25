import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Building, 
  Layers, 
  Grid, 
  MapPin, 
  Compass, 
  PieChart, 
  Home, 
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Activity,
  Maximize2,
  ExternalLink
} from 'lucide-react';
import parkApi from '../api/parkApi';
import { useTranslation } from '../../../i18n';

/* Reusable interactive card style helper */
const interactiveCard = (extra = {}) => ({
  padding: '22px',
  position: 'relative',
  overflow: 'hidden',
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  ...extra
});

export default function ParkDashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({
    parks: { totalParks: 0, totalParkArea: 0 },
    buildings: { totalBuildings: 0, totalFloors: 0, totalBuildingArea: 0 },
    offices: { totalOffices: 0, vacantOffices: 0, occupiedOffices: 0, totalOfficeArea: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await parkApi.getParkMetrics();
      if (res.data && res.data.status === 'success') {
        setMetrics(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load park overview metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalOffices = metrics.offices.totalOffices || 1;
  const vacantOffices = metrics.offices.vacantOffices || 0;
  const occupiedOffices = metrics.offices.occupiedOffices || 0;
  
  const occupancyRate = totalOffices > 0 ? Math.round((occupiedOffices / totalOffices) * 100) : 0;
  const vacancyRate = totalOffices > 0 ? Math.round((vacantOffices / totalOffices) * 100) : 0;

  /* KPI card data */
  const kpiCards = [
    {
      key: 'campus',
      label: t('businessPark.campusKpi'),
      value: `${metrics.parks.totalParks || 1} Campus`,
      sub: t('businessPark.campusSiteArea'),
      subColor: 'var(--text-muted)',
      icon: Building2,
      iconBg: 'rgba(99, 102, 241, 0.15)',
      iconColor: 'var(--accent-primary)',
      borderAccent: 'var(--accent-primary)',
      route: '/parks/campus'
    },
    {
      key: 'buildings',
      label: t('businessPark.buildingsBlocks'),
      value: `${metrics.buildings.totalBuildings || 0} ${t('businessPark.buildingsBlocks')}`,
      sub: `${metrics.buildings.totalFloors || 0} ${t('businessPark.totalLevelsCount')}`,
      subColor: 'var(--color-info)',
      icon: Building,
      iconBg: 'rgba(14, 165, 233, 0.15)',
      iconColor: 'var(--color-info)',
      borderAccent: 'var(--color-info)',
      route: '/parks/buildings'
    },
    {
      key: 'offices',
      label: t('businessPark.officesKpi'),
      value: `${metrics.offices.totalOffices || 0} ${t('businessPark.officeUnits')}`,
      sub: `${vacantOffices} ${t('businessPark.officesAvailableCount')}`,
      subColor: 'var(--color-success)',
      icon: Grid,
      iconBg: 'rgba(16, 185, 129, 0.15)',
      iconColor: 'var(--color-success)',
      borderAccent: 'var(--color-success)',
      route: '/parks/offices'
    },
    {
      key: 'occupancy',
      label: t('businessPark.occupancyRateKpi'),
      value: `${occupancyRate}%`,
      sub: `${occupiedOffices} ${t('businessPark.leasedUnitsCount')}`,
      subColor: 'var(--color-warning)',
      icon: PieChart,
      iconBg: 'rgba(245, 158, 11, 0.15)',
      iconColor: 'var(--color-warning)',
      borderAccent: 'var(--color-warning)',
      route: '/parks/offices'
    }
  ];

  /* Facility zone cards */
  const facilityCards = [
    { key: 'green', label: t('businessPark.facilityZones'), value: `2 ${t('common.active')}`, icon: MapPin, iconBg: 'rgba(16, 185, 129, 0.15)', iconColor: 'var(--color-success)' },
    { key: 'parking', label: t('businessPark.parkingCapacity'), value: '250 Parking Lots', icon: MapPin, iconBg: 'rgba(14, 165, 233, 0.15)', iconColor: 'var(--color-info)' },
    { key: 'utility', label: t('businessPark.utilityRooms'), value: '8 Tech Rooms', icon: Building, iconBg: 'rgba(99, 102, 241, 0.15)', iconColor: 'var(--accent-primary)' },
    { key: 'security', label: t('businessPark.securityPosts'), value: '3 Main Gates', icon: ShieldCheck, iconBg: 'rgba(245, 158, 11, 0.15)', iconColor: 'var(--color-warning)' }
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.3rem, 3.5vw, 1.8rem)', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="glow-text">{t('businessPark.parkDashboardTitle')}</span>
            </h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              {t('businessPark.parkDashboardSubtitle')}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '20px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: 'var(--color-success)',
              fontSize: '0.78rem',
              fontWeight: 700
            }}>
              <Activity size={14} /> 100% {t('common.active')}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid — Each card navigates on click */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
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
                padding: 'clamp(16px, 2.5vw, 24px)',
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
              {/* Navigation hint */}
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
                <ExternalLink size={11} /> {t('businessPark.exploreModule')}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Analytics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '20px', marginBottom: '28px' }}>
        {/* Space Utilization & Occupancy Breakdown */}
        <div className="glass-panel" style={{ padding: 'clamp(16px, 2.5vw, 24px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {t('businessPark.officesSubtitle')}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {t('businessPark.officesDesc')}
              </p>
            </div>
            <button
              onClick={() => navigate('/parks/offices')}
              style={{
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                color: 'var(--accent-primary)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 12px',
                minHeight: '38px',
                borderRadius: '8px',
                transition: 'all 0.2s'
              }}
            >
              {t('businessPark.officeUnits')} <ArrowUpRight size={13} />
            </button>
          </div>

          {/* Progress Bar Visual */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px', fontWeight: 600, flexWrap: 'wrap', gap: '4px' }}>
              <span>{t('businessPark.capacity')} ({totalOffices} {t('businessPark.officeUnits')})</span>
              <span style={{ color: 'var(--accent-primary)' }}>{occupancyRate}% {t('businessPark.occupied')}</span>
            </div>
            <div style={{ height: '14px', borderRadius: '7px', background: 'var(--bg-tertiary)', overflow: 'hidden', display: 'flex' }}>
              <div style={{ width: `${occupancyRate}%`, background: 'var(--accent-gradient)', transition: 'width 0.8s ease-out', borderRadius: '7px 0 0 7px' }} title={`${t('businessPark.occupied')}: ${occupiedOffices}`} />
              <div style={{ width: `${vacancyRate}%`, background: 'var(--color-info)', transition: 'width 0.8s ease-out' }} title={`${t('businessPark.vacant')}: ${vacantOffices}`} />
            </div>
          </div>

          {/* Legend Badges */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '12px' }}>
            <div
              onClick={() => navigate('/parks/offices')}
              style={{ padding: '14px 16px', borderRadius: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-info)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: 'var(--color-info)' }} />
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{t('businessPark.vacantUnits')}</span>
              </div>
              <span style={{ fontWeight: 700, fontSize: '1rem' }}>{vacantOffices}</span>
            </div>

            <div
              onClick={() => navigate('/parks/offices')}
              style={{ padding: '14px 16px', borderRadius: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: 'var(--accent-primary)' }} />
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{t('businessPark.occupiedUnits')}</span>
              </div>
              <span style={{ fontWeight: 700, fontSize: '1rem' }}>{occupiedOffices}</span>
            </div>
          </div>
        </div>

        {/* Building & Tower Infrastructure Status */}
        <div className="glass-panel" style={{ padding: 'clamp(16px, 2.5vw, 24px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {t('businessPark.buildingsSubtitle')}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {t('businessPark.buildingsDesc')}
              </p>
            </div>
            <button
              onClick={() => navigate('/parks/buildings')}
              style={{
                background: 'rgba(14, 165, 233, 0.1)',
                border: '1px solid rgba(14, 165, 233, 0.3)',
                color: 'var(--color-info)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 12px',
                minHeight: '38px',
                borderRadius: '8px',
                transition: 'all 0.2s'
              }}
            >
              {t('businessPark.buildingsBlocks')} <ArrowUpRight size={13} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div
              onClick={() => navigate('/parks/buildings')}
              style={{ padding: 'clamp(12px, 2vw, 16px)', borderRadius: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.25s', flexWrap: 'wrap', gap: '10px' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0, flex: 1 }}>
                <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)', flexShrink: 0 }}>
                  <Building size={20} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', wordBreak: 'break-word' }}>Block A — Innovation Hub</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>4 {t('businessPark.totalLevelsCount')} • 12,000 m² {t('businessPark.totalArea')}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: 'var(--color-success)',
                  fontSize: '0.72rem',
                  fontWeight: 700
                }}>{t('businessPark.operational')}</span>
                <ArrowUpRight size={14} style={{ color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div
              onClick={() => navigate('/parks/buildings')}
              style={{ padding: 'clamp(12px, 2vw, 16px)', borderRadius: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.25s', flexWrap: 'wrap', gap: '10px' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.borderColor = 'var(--color-info)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0, flex: 1 }}>
                <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(14, 165, 233, 0.15)', color: 'var(--color-info)', flexShrink: 0 }}>
                  <Building size={20} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', wordBreak: 'break-word' }}>Block B — Tech Innovation Center</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>4 {t('businessPark.totalLevelsCount')} • 20,000 m² {t('businessPark.totalArea')}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: 'var(--color-success)',
                  fontSize: '0.72rem',
                  fontWeight: 700
                }}>{t('businessPark.operational')}</span>
                <ArrowUpRight size={14} style={{ color: 'var(--text-muted)' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Facility & Security Zones Summary */}
      <div className="glass-panel" style={{ padding: 'clamp(16px, 2.5vw, 24px)', marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {t('businessPark.facilityZones')}
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {t('businessPark.zonesSubtitle')}
            </p>
          </div>
          <button
            onClick={() => navigate('/parks/zones')}
            style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: 'var(--color-success)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '8px 12px',
              minHeight: '38px',
              borderRadius: '8px',
              transition: 'all 0.2s'
            }}
          >
            {t('common.details')} <ArrowUpRight size={13} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '14px' }}>
          {facilityCards.map((fc) => {
            const FcIcon = fc.icon;
            return (
              <div
                key={fc.key}
                onClick={() => navigate('/parks/zones')}
                style={{
                  padding: '16px',
                  borderRadius: '14px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--glass-border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.25s'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = fc.iconColor; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
              >
                <div style={{ padding: '10px', borderRadius: '12px', background: fc.iconBg, color: fc.iconColor, flexShrink: 0 }}>
                  <FcIcon size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>{fc.label}</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '2px' }}>{fc.value}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Action Navigation Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'clamp(14px, 2vw, 18px) clamp(14px, 2vw, 22px)',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--glass-border)',
        borderRadius: 'var(--border-radius-md)',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          {t('businessPark.quickTopologyActions')}
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', width: '100%', maxWidth: '100%' }}>
          {[
            { label: t('businessPark.buildingsBlocks'), icon: Building, route: '/parks/buildings' },
            { label: t('businessPark.floorsLevels'), icon: Layers, route: '/parks/floors' },
            { label: t('businessPark.officeUnits'), icon: Grid, route: '/parks/offices' },
            { label: t('businessPark.facilityZones'), icon: MapPin, route: '/parks/zones' },
            { label: t('businessPark.campusLandmarks'), icon: Compass, route: '/parks/landmarks' }
          ].map((shortcut) => {
            const ShortIcon = shortcut.icon;
            return (
              <button
                key={shortcut.route}
                onClick={() => navigate(shortcut.route)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.8rem',
                  padding: '8px 14px',
                  minHeight: '40px',
                  borderRadius: '8px',
                  border: '1px solid var(--glass-border)',
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  flex: '1 1 auto',
                  justifyContent: 'center'
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
