import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Layers, Search, Filter, BookOpen, Clock, ArrowRight, ShieldCheck,
  Building, DollarSign, FileText, CheckCircle2, Plus, Sparkles, RefreshCw
} from 'lucide-react';
import { useTranslation } from '../../../i18n/LanguageContext';
import serviceCatalogApi from '../api/serviceCatalogApi';
import ServicesTab from '../components/ServicesTab';
import { usePermissionContext } from '../../role-permission-management/contexts/PermissionContext';

export default function ServiceDirectoryPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');
  const { user, isParkAdmin, isCompanyAdmin, hasPermission } = usePermissionContext();

  const roleCode = (user?.userTypeCode || user?.UserTypeCode || (user?.roles && user?.roles[0]?.RoleCode) || '').toUpperCase();
  const isEmployeeRole = roleCode === 'EMPLOYEE' || (!isParkAdmin && !isCompanyAdmin && !hasPermission('Service.Create'));

  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categoryParam || 'ALL');

  useEffect(() => {
    fetchCatalog();
  }, []);

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      const [catRes, svcRes] = await Promise.all([
        serviceCatalogApi.getCategories(),
        serviceCatalogApi.getServices()
      ]);

      const catList = catRes.data?.data?.categories || catRes.data?.data || [];
      const svcList = svcRes.data?.data?.services || svcRes.data?.data || [];

      setCategories(Array.isArray(catList) ? catList : []);
      setServices(Array.isArray(svcList) ? svcList : []);
    } catch (err) {
      console.error('Failed to load service catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtering for Employee View
  const filteredServices = services.filter(svc => {
    if (selectedCategory !== 'ALL' && String(svc.ServiceCategoryID) !== String(selectedCategory)) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const nameMatch = (svc.ServiceName || '').toLowerCase().includes(q);
      const codeMatch = (svc.ServiceCode || '').toLowerCase().includes(q);
      const descMatch = (svc.Description || '').toLowerCase().includes(q);
      return nameMatch || codeMatch || descMatch;
    }
    return true;
  });

  // Admin View fallback if user has management permissions
  if (!isEmployeeRole) {
    return (
      <div>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>
            {t('catalog.title', 'Service Directory & Offerings')}
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            {t('catalog.directorySubtitle', 'Registered service definitions, SLA tiers, fulfillment workflows, and publication status')}
          </p>
        </div>
        <ServicesTab categories={categories} />
      </div>
    );
  }

  // Employee Browse Services Portal
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <div className="glass-panel" style={{
        padding: '24px 28px',
        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.12) 0%, rgba(124, 58, 237, 0.08) 100%)',
        borderRadius: '16px',
        border: '1px solid rgba(37, 99, 235, 0.2)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ padding: '3px 10px', borderRadius: '12px', background: 'rgba(37,99,235,0.2)', color: '#60a5fa', fontSize: '0.75rem', fontWeight: 700 }}>
              {t('catalog.serviceOffering', 'Business Park Service Catalog')}
            </span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            {t('catalog.browseServices', 'Browse Available Services')}
          </h1>
          <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            {t('catalog.browseServicesSubtitle', 'Explore tenant facilities, IT infrastructure, maintenance, and administrative service offerings.')}
          </p>
        </div>

        <button
          onClick={() => navigate('/issues/create')}
          style={{
            padding: '10px 20px',
            borderRadius: '10px',
            background: 'var(--accent-gradient)',
            color: '#ffffff',
            border: 'none',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)'
          }}
        >
          <Plus size={18} /> {t('catalog.generalRequest', 'General Request')}
        </button>
      </div>

      {/* Filter & Search Controls */}
      <div className="glass-panel" style={{ padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        
        {/* Category Filter Chips */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setSelectedCategory('ALL')}
            style={{
              padding: '6px 14px',
              borderRadius: '16px',
              fontSize: '0.8rem',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              background: selectedCategory === 'ALL' ? 'var(--accent-gradient)' : 'var(--bg-tertiary)',
              color: selectedCategory === 'ALL' ? '#ffffff' : 'var(--text-secondary)',
              transition: 'all 0.2s'
            }}
          >
            {t('catalog.allServices', 'All Services')} ({services.length})
          </button>

          {categories.map(c => (
            <button
              key={c.ServiceCategoryID}
              onClick={() => setSelectedCategory(String(c.ServiceCategoryID))}
              style={{
                padding: '6px 14px',
                borderRadius: '16px',
                fontSize: '0.8rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: String(selectedCategory) === String(c.ServiceCategoryID) ? 'var(--accent-gradient)' : 'var(--bg-tertiary)',
                color: String(selectedCategory) === String(c.ServiceCategoryID) ? '#ffffff' : 'var(--text-secondary)',
                transition: 'all 0.2s'
              }}
            >
              {c.CategoryName}
            </button>
          ))}
        </div>

        {/* Search & Refresh */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder={t('catalog.searchCatalog', 'Search catalog services...')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                padding: '8px 14px 8px 36px',
                borderRadius: '8px',
                border: '1px solid var(--glass-border)',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                width: '240px'
              }}
            />
          </div>

          <button
            onClick={fetchCatalog}
            style={{
              padding: '8px',
              borderRadius: '8px',
              border: '1px solid var(--glass-border)',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}
            title={t('catalog.refreshBtn', 'Refresh Catalog')}
          >
            <RefreshCw size={16} />
          </button>
        </div>

      </div>

      {/* Services Grid Cards */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          {t('catalog.loadingCatalog', 'Loading service catalog offerings...')}
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Layers size={40} style={{ color: 'var(--accent-primary)', marginBottom: '12px' }} />
          <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {t('catalog.noServicesFound', 'No services found')}
          </h4>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>
            {t('catalog.noServicesMatching', 'No catalog service matching your selected category or search keyword.')}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {filteredServices.map(svc => (
            <div
              key={svc.ServiceID}
              className="glass-panel"
              style={{
                padding: '22px',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '16px',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--accent-primary)';
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 24px -6px rgba(37,99,235,0.2)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--glass-border)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <span style={{
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    background: 'rgba(37,99,235,0.15)',
                    color: '#60a5fa',
                    border: '1px solid rgba(37,99,235,0.25)'
                  }}>
                    {svc.CategoryName || t('catalog.directory.generalService', 'General Service')}
                  </span>
                  <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                    {svc.ServiceCode}
                  </span>
                </div>

                <h3 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {svc.ServiceName}
                </h3>

                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {svc.Description || t('catalog.directory.defaultDesc', 'Standard tenant service offering across campus facilities.')}
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px solid var(--glass-border)', paddingTop: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={14} color="#facc15" /> {t('catalog.directory.slaTarget', 'SLA Target:')}
                  </span>
                  <span style={{ fontWeight: 700, color: '#facc15' }}>
                    {t('catalog.directory.slaHours', `${svc.SLATargetHours || 24} hours`, { hours: svc.SLATargetHours || 24 })}
                  </span>
                </div>

                <button
                  onClick={() => navigate(`/issues/create?serviceId=${svc.ServiceID}`)}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    borderRadius: '10px',
                    background: 'var(--accent-gradient)',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
                    transition: 'opacity 0.2s'
                  }}
                >
                  {t('catalog.requestThisService', 'Request This Service')} <ArrowRight size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
