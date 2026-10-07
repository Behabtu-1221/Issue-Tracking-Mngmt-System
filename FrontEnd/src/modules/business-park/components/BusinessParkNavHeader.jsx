import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Building2, 
  Building, 
  Layers, 
  Grid, 
  MapPin, 
  Compass, 
  PieChart, 
  ChevronRight,
  Home
} from 'lucide-react';
import parkApi from '../api/parkApi';
import { useTranslation } from '../../../i18n';

export default function BusinessParkNavHeader({ activeTabId }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [metrics, setMetrics] = useState({
    parks: { totalParks: 0, totalParkArea: 0 },
    buildings: { totalBuildings: 0, totalFloors: 0 },
    offices: { totalOffices: 0, vacantOffices: 0, occupiedOffices: 0 }
  });

  const navItems = [
    { path: '/parks/campus', tabId: 'parks', label: t('businessPark.parkProfile'), icon: Building2, description: t('businessPark.parkProfileDesc') },
    { path: '/parks/buildings', tabId: 'buildings', label: t('businessPark.buildingsBlocks'), icon: Building, description: t('businessPark.buildingsDesc') },
    { path: '/parks/floors', tabId: 'floors', label: t('businessPark.floorsLevels'), icon: Layers, description: t('businessPark.floorsDesc') },
    { path: '/parks/offices', tabId: 'offices', label: t('businessPark.officeUnits'), icon: Grid, description: t('businessPark.officesDesc') },
    { path: '/parks/zones', tabId: 'zones', label: t('businessPark.facilityZones'), icon: MapPin, description: t('businessPark.zonesDesc') },
    { path: '/parks/landmarks', tabId: 'landmarks', label: t('businessPark.campusLandmarks'), icon: Compass, description: t('businessPark.landmarksDesc') }
  ];

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const res = await parkApi.getParkMetrics();
      if (res.data && res.data.status === 'success') {
        setMetrics(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load park overview metrics:', err);
    }
  };

  const activeItem = navItems.find(item => item.tabId === activeTabId || location.pathname.includes(item.tabId)) || navItems[0];
  const occupancyRate = metrics.offices.totalOffices > 0 
    ? Math.round((metrics.offices.occupiedOffices / metrics.offices.totalOffices) * 100) 
    : 0;

  return (
    <div style={{ marginBottom: '28px' }}>

      {/* Page Title Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '20px',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="glow-text">{activeItem.label}</span>
          </h1>
          <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {activeItem.description}
          </p>
        </div>
      </div>

      {/* Live Sub-Module Specific Metric Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {activeItem.tabId === 'parks' && (
          <>
            <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)' }}>
                <Building2 size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('businessPark.businessPark')}</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {metrics.parks.totalParks || 1} Campus
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(14, 165, 233, 0.15)', color: 'var(--color-info)' }}>
                <Building size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('businessPark.totalSiteArea')}</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  50,000 m²
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-success)' }}>
                <Grid size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('businessPark.operationalStatus')}</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--color-success)' }}>
                  100% {t('common.active')}
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--color-warning)' }}>
                <PieChart size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('businessPark.administration')}</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {t('businessPark.centralManaged')}
                </div>
              </div>
            </div>
          </>
        )}

        {activeItem.tabId === 'buildings' && (
          <>
            <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(14, 165, 233, 0.15)', color: 'var(--color-info)' }}>
                <Building size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('businessPark.buildingsBlocks')}</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {metrics.buildings.totalBuildings || 0}
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)' }}>
                <Layers size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('businessPark.configuredFloors')}</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {metrics.buildings.totalFloors || 0} {t('businessPark.totalLevelsCount')}
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-success)' }}>
                <Building2 size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('businessPark.activeBlocks')}</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  Block A & B
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--color-warning)' }}>
                <PieChart size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('businessPark.builtUpArea')}</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  32,000 m²
                </div>
              </div>
            </div>
          </>
        )}

        {activeItem.tabId === 'floors' && (
          <>
            <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)' }}>
                <Layers size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('businessPark.totalFloorLevels')}</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {metrics.buildings.totalFloors || 0} Levels
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-success)' }}>
                <Grid size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('businessPark.avgUnitsFloor')}</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  4 {t('businessPark.officeUnits')}
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(14, 165, 233, 0.15)', color: 'var(--color-info)' }}>
                <Building size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('businessPark.floorBlueprint')}</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--color-info)' }}>
                  100% {t('businessPark.mapped')}
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--color-warning)' }}>
                <PieChart size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('businessPark.totalFloorArea')}</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  18,500 m²
                </div>
              </div>
            </div>
          </>
        )}

        {activeItem.tabId === 'offices' && (
          <>
            <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-success)' }}>
                <Grid size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('businessPark.totalOfficeUnits')}</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {metrics.offices.totalOffices || 0}
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(14, 165, 233, 0.15)', color: 'var(--color-info)' }}>
                <Grid size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('businessPark.vacantUnits')}</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--color-info)' }}>
                  {metrics.offices.vacantOffices || 0} {t('businessPark.vacant')}
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)' }}>
                <Building2 size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('businessPark.occupiedUnits')}</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {metrics.offices.occupiedOffices || 0} {t('businessPark.occupied')}
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--color-warning)' }}>
                <PieChart size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('businessPark.occupancyRate')}</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {occupancyRate}%
                </div>
              </div>
            </div>
          </>
        )}

        {activeItem.tabId === 'zones' && (
          <>
            <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-success)' }}>
                <MapPin size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('businessPark.facilityZones')}</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  4 {t('common.active')} Zones
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(14, 165, 233, 0.15)', color: 'var(--color-info)' }}>
                <MapPin size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('businessPark.parkingCapacity')}</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  250 Parking Lots
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)' }}>
                <Building size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('businessPark.utilityRooms')}</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  8 Tech Rooms
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--color-warning)' }}>
                <PieChart size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('businessPark.securityPosts')}</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  3 Main Gates
                </div>
              </div>
            </div>
          </>
        )}

        {activeItem.tabId === 'landmarks' && (
          <>
            <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--color-warning)' }}>
                <Compass size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('businessPark.waypointsMarkers')}</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  6 {t('businessPark.campusLandmarks')}
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)' }}>
                <Building2 size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('businessPark.keyLandmark')}</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {t('businessPark.campusPlaza')}
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-success)' }}>
                <MapPin size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('businessPark.gpsSync')}</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--color-success)' }}>
                  100% {t('common.active')}
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(14, 165, 233, 0.15)', color: 'var(--color-info)' }}>
                <Building size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('businessPark.mappedBlocks')}</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  Block A, B & C
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
