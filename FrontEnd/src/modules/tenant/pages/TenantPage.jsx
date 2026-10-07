import React, { useState, useEffect } from 'react';
import {
  Users,
  Building2,
  FileText,
  DollarSign,
  UserCheck,
  Building,
  TrendingUp,
  Layers
} from 'lucide-react';
import tenantApi from '../api/tenantApi';
import TenantsTab from '../components/TenantsTab';
import LeasesTab from '../components/LeasesTab';
import AllocationsTab from '../components/AllocationsTab';
import SubTenantsTab from '../components/SubTenantsTab';
import ContactsAddressesTab from '../components/ContactsAddressesTab';
import { useTranslation } from '../../../i18n';

export default function TenantPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('tenants');
  const [metrics, setMetrics] = useState(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoadingMetrics(true);
      const res = await tenantApi.getTenantMetrics();
      setMetrics(res.data.data);
    } catch (err) {
      console.error('Failed to load tenant metrics', err);
    } finally {
      setLoadingMetrics(false);
    }
  };

  const tenantStats = metrics?.tenants || {};
  const leaseStats = metrics?.leases || {};
  const allocStats = metrics?.allocations || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '700', letterSpacing: '-0.5px' }}>
            {t('tenant.hubTitlePrefix', 'Tenant Management &')}{' '}
            <span className="glow-text">{t('tenant.leasingHub', 'Leasing Hub')}</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            {t('tenant.hubSubtitle', 'Enterprise Tenant Directory, Contract Lifecycle, Sub-tenant Hierarchy, and Office Space Allocations.')}
          </p>
        </div>
      </div>

      {/* Overview Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(138, 75, 255, 0.15)', color: 'var(--accent-primary)' }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: '700' }}>{tenantStats.totalTenants || 0}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t('tenant.registeredCompanies', 'Registered Companies')}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-success)' }}>
            <UserCheck size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: '700' }}>{tenantStats.activeTenants || 0}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t('tenant.activeTenantsMetric', 'Active Tenants')}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
            <FileText size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: '700' }}>{leaseStats.activeLeases || 0}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t('tenant.activeLeasesMetric', 'Active Leases')}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--color-warning)' }}>
            <Building2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: '700' }}>{allocStats.activeAllocations || 0}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t('tenant.occupiedOfficeSpaces', 'Occupied Office Spaces')}</div>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div style={{ borderBottom: '1px solid var(--glass-border)', display: 'flex', gap: '8px' }}>
        {[
          { id: 'tenants', label: t('tenant.tenantsOnboardingTab', 'Tenants & Onboarding'), icon: Users },
          { id: 'leases', label: t('tenant.leaseContractsTab', 'Lease Contracts'), icon: FileText },
          { id: 'allocations', label: t('tenant.spaceAllocationsTab', 'Space Allocations'), icon: Building2 },
          { id: 'sub-tenants', label: t('tenant.subTenantsHierarchyTab', 'Sub-Tenants Hierarchy'), icon: Layers },
          { id: 'contacts', label: t('tenant.contactsAddressesTab', 'Contacts & Addresses'), icon: Building }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                border: 'none',
                background: 'transparent',
                color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                fontWeight: isActive ? '600' : '500',
                borderBottom: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '0.9rem',
                transition: 'all 0.2s ease'
              }}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content rendering */}
      <div>
        {activeTab === 'tenants' && <TenantsTab onRefreshMetrics={fetchMetrics} />}
        {activeTab === 'leases' && <LeasesTab onRefreshMetrics={fetchMetrics} />}
        {activeTab === 'allocations' && <AllocationsTab onRefreshMetrics={fetchMetrics} />}
        {activeTab === 'sub-tenants' && <SubTenantsTab />}
        {activeTab === 'contacts' && <ContactsAddressesTab />}
      </div>
    </div>
  );
}
