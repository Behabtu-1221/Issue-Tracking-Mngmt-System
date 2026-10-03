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

const NAV_ITEMS = [
  { path: '/parks/campus', tabId: 'parks', label: 'Park Profile', icon: Building2, description: 'Central Business Park profile & parameters' },
  { path: '/parks/buildings', tabId: 'buildings', label: 'Buildings & Blocks', icon: Building, description: 'Commercial buildings, towers, and structural blocks' },
  { path: '/parks/floors', tabId: 'floors', label: 'Floor Levels', icon: Layers, description: 'Building floors, Office capacity, and layouts' },
  { path: '/parks/offices', tabId: 'offices', label: 'Office Units', icon: Grid, description: 'Office inventory, floor area, and availability' },
  { path: '/parks/zones', tabId: 'zones', label: 'Facility Zones', icon: MapPin, description: 'Parks, parking bays, utility rooms & security posts' },
  { path: '/parks/landmarks', tabId: 'landmarks', label: 'Campus Landmarks', icon: Compass, description: 'Campus navigation landmarks and location hierarchy' }
];

export default function BusinessParkNavHeader({ activeTabId }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [metrics, setMetrics] = useState({
    parks: { totalParks: 0, totalParkArea: 0 },
    buildings: { totalBuildings: 0, totalFloors: 0 },
    offices: { totalOffices: 0, vacantOffices: 0, occupiedOffices: 0 }
  });

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

  const activeItem = NAV_ITEMS.find(item => item.tabId === activeTabId || location.pathname.includes(item.tabId)) || NAV_ITEMS[0];
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
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Business Park</div>
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
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Site Area</div>
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
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Operational Status</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--color-success)' }}>
                  100% Active
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--color-warning)' }}>
                <PieChart size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Administration</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  Central Managed
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
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Buildings</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {metrics.buildings.totalBuildings || 0} Buildings
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)' }}>
                <Layers size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Floor Capacity</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {metrics.buildings.totalFloors || 0} Floor Levels
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-success)' }}>
                <Building2 size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Blocks</div>
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
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Built-Up Area</div>
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
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Floor Levels</div>
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
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Avg Units / Floor</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  4 Office Units
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(14, 165, 233, 0.15)', color: 'var(--color-info)' }}>
                <Building size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Floor Blueprint</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--color-info)' }}>
                  100% Mapped
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--color-warning)' }}>
                <PieChart size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Floor Area</div>
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
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Office Units</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {metrics.offices.totalOffices || 0} Units
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(14, 165, 233, 0.15)', color: 'var(--color-info)' }}>
                <Grid size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Vacant Units</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--color-info)' }}>
                  {metrics.offices.vacantOffices || 0} Available
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)' }}>
                <Building2 size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Occupied Units</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {metrics.offices.occupiedOffices || 0} Leased
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--color-warning)' }}>
                <PieChart size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Occupancy Rate</div>
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
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Facility Zones</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  4 Active Zones
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(14, 165, 233, 0.15)', color: 'var(--color-info)' }}>
                <MapPin size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Parking Capacity</div>
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
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Utility Rooms</div>
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
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Security Posts</div>
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
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Waypoints & Markers</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  6 Landmarks
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)' }}>
                <Building2 size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Key Landmark</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  Main Campus Plaza
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-success)' }}>
                <MapPin size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>GPS Sync</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--color-success)' }}>
                  100% Active
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(14, 165, 233, 0.15)', color: 'var(--color-info)' }}>
                <Building size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Mapped Blocks</div>
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
