import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Building2, 
  Building, 
  Layers, 
  Grid, 
  MapPin, 
  Compass, 
  PieChart, 
  CheckCircle2, 
  Maximize2 
} from 'lucide-react';
import { PARK_TABS } from '../constants/parkConstants';
import ParksTab from '../components/ParksTab';
import BuildingsTab from '../components/BuildingsTab';
import FloorsTab from '../components/FloorsTab';
import OfficeSpacesTab from '../components/OfficeSpacesTab';
import FacilityZonesTab from '../components/FacilityZonesTab';
import CampusLocationsTab from '../components/CampusLocationsTab';
import parkApi from '../api/parkApi';
import { useTranslation } from '../../../i18n';

const ICON_MAP = {
  Building2: Building2,
  Building: Building,
  Layers: Layers,
  Grid: Grid,
  MapPin: MapPin,
  Compass: Compass
};

const TAB_COMPONENTS = {
  parks: ParksTab,
  buildings: BuildingsTab,
  floors: FloorsTab,
  offices: OfficeSpacesTab,
  zones: FacilityZonesTab,
  locations: CampusLocationsTab
};

export default function BusinessParkPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl && TAB_COMPONENTS[tabFromUrl] ? tabFromUrl : 'parks');

  useEffect(() => {
    if (tabFromUrl && TAB_COMPONENTS[tabFromUrl]) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };
  const [metrics, setMetrics] = useState({
    parks: { totalParks: 0, totalParkArea: 0 },
    buildings: { totalBuildings: 0, totalFloors: 0, totalBuildingArea: 0 },
    offices: { totalOffices: 0, vacantOffices: 0, occupiedOffices: 0, totalOfficeArea: 0 }
  });

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

  useEffect(() => {
    fetchMetrics();
  }, []);

  const ActiveComponent = TAB_COMPONENTS[activeTab];

  const occupancyRate = metrics.offices.totalOffices > 0 
    ? Math.round((metrics.offices.occupiedOffices / metrics.offices.totalOffices) * 100) 
    : 0;

  const getTabLabel = (id) => {
    switch (id) {
      case 'parks': return t('businessPark.parkProfile');
      case 'buildings': return t('businessPark.buildingsBlocks');
      case 'floors': return t('businessPark.floorsLevels');
      case 'offices': return t('businessPark.officeUnits');
      case 'zones': return t('businessPark.facilityZones');
      case 'locations': return t('businessPark.campusLandmarks');
      default: return id;
    }
  };

  const getTabDesc = (id) => {
    switch (id) {
      case 'parks': return t('businessPark.parkProfileDesc');
      case 'buildings': return t('businessPark.buildingsDesc');
      case 'floors': return t('businessPark.floorsDesc');
      case 'offices': return t('businessPark.officesDesc');
      case 'zones': return t('businessPark.zonesDesc');
      case 'locations': return t('businessPark.landmarksDesc');
      default: return '';
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(1.4rem, 4vw, 2.2rem)', fontWeight: 800, marginBottom: '6px' }}>
          {t('businessPark.campusMasterTitle')}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 'clamp(0.85rem, 2vw, 0.95rem)' }}>
          {t('businessPark.campusMasterDesc')}
        </p>
      </div>

      {/* Top Overview Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '14px', marginBottom: '24px' }}>
        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(138, 75, 255, 0.15)', color: 'var(--accent-primary)', flexShrink: 0 }}>
            <Building2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('businessPark.campusKpi')}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              {metrics.parks.totalParks || 1} Campus
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {metrics.parks.totalParkArea ? `${Number(metrics.parks.totalParkArea).toLocaleString()} m² Total Area` : t('businessPark.primarySiteArea')}
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(14, 165, 233, 0.15)', color: 'var(--color-info)', flexShrink: 0 }}>
            <Building size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('businessPark.buildingsFloorsKpi')}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              {metrics.buildings.totalBuildings || 0}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {metrics.buildings.totalFloors || 0} {t('businessPark.totalLevelsCount')}
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-success)', flexShrink: 0 }}>
            <Grid size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('businessPark.officesKpi')}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              {metrics.offices.totalOffices || 0}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-success)' }}>
              {metrics.offices.vacantOffices || 0} {t('businessPark.officesAvailableCount')}
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--color-warning)', flexShrink: 0 }}>
            <PieChart size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('businessPark.occupancyRateKpi')}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              {occupancyRate}%
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {metrics.offices.occupiedOffices || 0} {t('businessPark.leasedUnitsCount')}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div 
        className="flex gap-1.5 p-1.5 overflow-x-auto max-w-full mb-6"
        style={{
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--border-radius-md)',
          scrollbarWidth: 'none'
        }}
      >
        {PARK_TABS.map((tab) => {
          const Icon = ICON_MAP[tab.icon];
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              title={getTabDesc(tab.id)}
              className="touch-target-sm shrink-0"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: 'var(--border-radius-sm)',
                border: 'none',
                background: isActive ? 'var(--accent-gradient)' : 'transparent',
                color: isActive ? 'white' : 'var(--text-muted)',
                fontWeight: isActive ? '600' : '500',
                fontSize: '0.85rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all var(--transition-fast)',
                boxShadow: isActive ? 'var(--glow-accent)' : 'none'
              }}
            >
              {Icon && <Icon size={16} />}
              {getTabLabel(tab.id)}
            </button>
          );
        })}
      </div>

      {/* Active Tab Component */}
      <div>
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  );
}
