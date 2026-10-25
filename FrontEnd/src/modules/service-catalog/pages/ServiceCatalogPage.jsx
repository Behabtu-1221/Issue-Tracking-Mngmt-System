import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  FolderKanban,
  Layers,
  RefreshCw,
  Tag,
  DollarSign
} from 'lucide-react';
import serviceCatalogApi from '../api/serviceCatalogApi';
import { useTranslation } from '../../../i18n/LanguageContext';
import { usePermissionContext } from '../../role-permission-management/contexts/PermissionContext';
import ServiceCategoriesTab from '../components/ServiceCategoriesTab';
import ServicesTab from '../components/ServicesTab';
import ServiceCategoryMappingTab from '../components/ServiceCategoryMappingTab';

export default function ServiceCatalogPage() {
  const { t } = useTranslation();
  const { user, isParkAdmin, isCompanyAdmin, hasPermission } = usePermissionContext();
  const roleCode = (user?.userTypeCode || user?.UserTypeCode || (user?.roles && user?.roles[0]?.RoleCode) || '').toUpperCase();
  const isEmployee = roleCode === 'EMPLOYEE' || (!isParkAdmin && !isCompanyAdmin && !hasPermission('Service.Create'));

  const [activeTab, setActiveTab] = useState('services');
  const [metrics, setMetrics] = useState(null);
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  useEffect(() => {
    fetchMetrics();
    fetchCategories();
    fetchServices();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoadingMetrics(true);
      const res = await serviceCatalogApi.getOverviewMetrics();
      setMetrics(res.data?.data || null);
    } catch (err) {
      console.error('Failed to fetch catalog metrics:', err);
    } finally {
      setLoadingMetrics(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await serviceCatalogApi.getCategories();
      setCategories(res.data?.data?.categories || []);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchServices = async () => {
    try {
      const res = await serviceCatalogApi.getServices();
      setServices(res.data?.data?.services || []);
    } catch (err) {
      console.error('Failed to fetch services:', err);
    }
  };

  const handleRefreshAll = () => {
    fetchMetrics();
    fetchCategories();
    fetchServices();
  };

  const m = metrics || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '700', letterSpacing: '-0.5px' }}>
            {t('catalog.hubTitle', 'Service Catalog & Fulfillment Hub')}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '4px' }}>
            {t('catalog.hubSubtitle', 'Manage core service offerings, request categories, pricing models, form requirements, and governance rules.')}
          </p>
        </div>

        <button
          onClick={handleRefreshAll}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            borderRadius: 'var(--border-radius-sm)',
            border: '1px solid var(--glass-border)',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            color: 'var(--text-secondary)',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={16} />
          {t('catalog.refreshBtn', 'Refresh Hub')}
        </button>
      </div>

      {/* KPI Overview Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '20px' }}>
        {/* Total Categories */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--border-radius-md)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(138, 75, 255, 0.15)', color: 'var(--accent-primary)' }}>
            <FolderKanban size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-primary)' }}>
              {loadingMetrics ? '...' : (m.totalCategories || 0)}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {t('catalog.metrics.serviceCategories', 'Service Categories')}
            </div>
          </div>
        </div>

        {/* Total Services */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--border-radius-md)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(14, 165, 233, 0.15)', color: 'var(--accent-secondary)' }}>
            <Layers size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-primary)' }}>
              {loadingMetrics ? '...' : (m.totalServices || 0)}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {t('catalog.metrics.totalServicesOffered', 'Total Services Offered')}
            </div>
          </div>
        </div>

        {/* Active Services */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--border-radius-md)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            <Tag size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-primary)' }}>
              {loadingMetrics ? '...' : (m.activeServices || 0)}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {t('catalog.metrics.activePublishedServices', 'Active Published Services')}
            </div>
          </div>
        </div>

        {/* Billable Services */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--border-radius-md)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-primary)' }}>
              {loadingMetrics ? '...' : (m.billableServices || 0)}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {t('catalog.metrics.billableServiceOfferings', 'Billable Service Offerings')}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ borderBottom: '1px solid var(--glass-border)', display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
        {[
          { id: 'services', label: t('catalog.tabs.services', 'Services Offered'), icon: Layers },
          { id: 'categories', label: t('catalog.tabs.categories', 'Service Categories'), icon: FolderKanban },
          ...(!isEmployee ? [
            { id: 'category-mappings', label: t('catalog.tabs.categoryMappings', 'Category Routing Mappings'), icon: Tag }
          ] : [])
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                backgroundColor: isActive ? 'rgba(138, 75, 255, 0.15)' : 'transparent',
                border: 'none',
                borderBottom: isActive ? '3px solid var(--accent-primary)' : '3px solid transparent',
                borderRadius: '8px 8px 0 0',
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: isActive ? '700' : '500',
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={18} style={{ color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)' }} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'services' && (
          <ServicesTab categories={categories} onServiceUpdated={handleRefreshAll} />
        )}
        {activeTab === 'categories' && (
          <ServiceCategoriesTab onCategoryUpdated={handleRefreshAll} />
        )}
        {activeTab === 'category-mappings' && (
          <ServiceCategoryMappingTab />
        )}
      </div>
    </div>
  );
}
