import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Tag,
  CheckCircle2,
  AlertCircle,
  Save,
  RefreshCw
} from 'lucide-react';
import serviceCatalogApi from '../api/serviceCatalogApi';
import { serviceSchemas } from '../../../validation';
import { FormField } from '../../../components/common/FormField';

export default function ServicePricingTab({ services = [], onPricingUpdated }) {
  const [internalServices, setInternalServices] = useState([]);
  const effectiveServices = services.length > 0 ? services : internalServices;
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState({
    PricingModel: 'FLAT_RATE',
    UnitPrice: 0,
    CurrencyCode: 'ETB',
    BillingType: 'BILLABLE',
    IsActive: 1
  });
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (services.length === 0) {
      serviceCatalogApi.getServices({ limit: 100 })
        .then(res => {
          setInternalServices(res.data?.data?.services || res.data?.data || []);
        })
        .catch(err => console.error('Failed to fetch services fallback in ServicePricingTab:', err));
    }
  }, [services]);

  useEffect(() => {
    if (effectiveServices.length > 0 && !selectedServiceId) {
      setSelectedServiceId(effectiveServices[0].ServiceID);
    }
  }, [effectiveServices]);

  useEffect(() => {
    if (selectedServiceId) {
      fetchPricing(selectedServiceId);
    }
  }, [selectedServiceId]);

  const fetchPricing = async (serviceId) => {
    try {
      setLoading(true);
      setError(null);
      const res = await serviceCatalogApi.getPricingByServiceId(serviceId);
      const p = res.data?.data;
      setPricing(p);
      setFieldErrors({});
      setFormData({
        PricingModel: p?.PricingModel || 'FLAT_RATE',
        UnitPrice: p?.UnitPrice || 0,
        CurrencyCode: p?.CurrencyCode || 'ETB',
        BillingType: p?.BillingType || 'BILLABLE',
        IsActive: p?.IsActive !== undefined ? p?.IsActive : 1
      });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch pricing information');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedServiceId) {
      setError('Please select a service offering to configure pricing.');
      return;
    }

    setError(null);

    // Validate using servicePricingForm schema
    const validation = serviceSchemas.servicePricingForm({
      ...formData,
      ServiceID: selectedServiceId
    });

    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      setError('Please review and correct the invalid pricing configuration fields.');
      return;
    }

    try {
      setSaving(true);
      setFieldErrors({});

      await serviceCatalogApi.upsertPricing(validation.sanitized);

      setSuccess('Service pricing configuration saved successfully.');
      fetchPricing(selectedServiceId);
      if (onPricingUpdated) onPricingUpdated();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save pricing configuration');
    } finally {
      setSaving(false);
    }
  };

  const selectedServiceObj = effectiveServices.find((s) => Number(s.ServiceID) === Number(selectedServiceId));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Service Selector Header */}
      <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--border-radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>Service Pricing & Billing Configuration</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Select a service offering to manage its pricing matrix, rate structures, and billing classification.
          </p>
        </div>

        <div style={{ minWidth: '280px' }}>
          <select
            value={selectedServiceId}
            onChange={(e) => setSelectedServiceId(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--glass-border-accent)',
              borderRadius: 'var(--border-radius-sm)',
              color: 'var(--text-primary)',
              fontWeight: '600'
            }}
          >
            <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Select Service Offering</option>
            {effectiveServices.map((s) => (
              <option key={s.ServiceID} value={s.ServiceID} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                {s.ServiceName} ({s.ServiceCode})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div style={{ padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', fontSize: '0.9rem' }}>
          {success}
        </div>
      )}

      {/* Main Pricing Form & Card */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading pricing details...</div>
      ) : !selectedServiceObj ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Please select a service offering to view or update its pricing configuration.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          {/* Configuration Form */}
          <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--border-radius-md)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
              Pricing Matrix for <span className="glow-text">{selectedServiceObj.ServiceName}</span>
            </h4>

            <FormField
              label="Pricing Model"
              required
              icon={Tag}
              error={fieldErrors.PricingModel}
              helpText="Select how billing is computed for this service."
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                {[
                  { id: 'FREE', label: 'Free / Included', desc: 'No charge to tenant' },
                  { id: 'FLAT_RATE', label: 'Flat Rate', desc: 'Fixed cost per request' },
                  { id: 'LABOR_HOURS', label: 'Labor Hours', desc: 'Billed per hour worked' },
                  { id: 'UNIT_PRICE', label: 'Unit Price', desc: 'Billed per quantity unit' }
                ].map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleFieldChange('PricingModel', item.id)}
                    style={{
                      padding: '14px',
                      borderRadius: 'var(--border-radius-sm)',
                      border: formData.PricingModel === item.id ? '2px solid var(--accent-primary)' : '1px solid var(--glass-border)',
                      backgroundColor: formData.PricingModel === item.id ? 'rgba(138, 75, 255, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary)' }}>{item.label}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </FormField>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
              <FormField
                label="Unit / Rate Price"
                id="UnitPrice"
                required={formData.PricingModel !== 'FREE' && formData.BillingType === 'BILLABLE'}
                icon={DollarSign}
                error={fieldErrors.UnitPrice}
                helpText={formData.PricingModel === 'FREE' ? 'Free service model automatically forces 0.00 unit price.' : 'Rate charged per unit / hour / flat fee.'}
              >
                <input
                  id="UnitPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  disabled={formData.PricingModel === 'FREE'}
                  value={formData.PricingModel === 'FREE' ? 0 : formData.UnitPrice}
                  onChange={(e) => handleFieldChange('UnitPrice', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    backgroundColor: formData.PricingModel === 'FREE' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.05)',
                    border: fieldErrors.UnitPrice ? '1px solid var(--color-danger, #ef4444)' : '1px solid var(--glass-border)',
                    borderRadius: 'var(--border-radius-sm)',
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                    fontWeight: '600'
                  }}
                />
              </FormField>

              <FormField
                label="Currency"
                id="CurrencyCode"
                required
                error={fieldErrors.CurrencyCode}
              >
                <select
                  id="CurrencyCode"
                  value={formData.CurrencyCode}
                  onChange={(e) => handleFieldChange('CurrencyCode', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: fieldErrors.CurrencyCode ? '1px solid var(--color-danger, #ef4444)' : '1px solid var(--glass-border)',
                    borderRadius: 'var(--border-radius-sm)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="ETB" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>ETB (Birr)</option>
                  <option value="USD" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>USD ($)</option>
                  <option value="EUR" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>EUR (€)</option>
                </select>
              </FormField>
            </div>

            <FormField
              label="Billing Classification"
              required
              error={fieldErrors.BillingType}
              helpText="Specify financial charging structure."
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                {[
                  { id: 'BILLABLE', label: 'Tenant Billable', desc: 'Invoiced directly to tenant' },
                  { id: 'NON_BILLABLE', label: 'Non-Billable', desc: 'Covered under property lease' },
                  { id: 'INTERNAL_CHARGE', label: 'Internal Chargeback', desc: 'Charged to internal cost center' }
                ].map((b) => (
                  <div
                    key={b.id}
                    onClick={() => handleFieldChange('BillingType', b.id)}
                    style={{
                      padding: '12px',
                      borderRadius: 'var(--border-radius-sm)',
                      border: formData.BillingType === b.id ? '2px solid var(--accent-secondary)' : '1px solid var(--glass-border)',
                      backgroundColor: formData.BillingType === b.id ? 'rgba(14, 165, 233, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--text-primary)' }}>{b.label}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{b.desc}</div>
                  </div>
                ))}
              </div>
            </FormField>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  background: 'var(--accent-gradient)',
                  border: 'none',
                  borderRadius: 'var(--border-radius-sm)',
                  color: '#fff',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                <Save size={18} />
                {saving ? 'Saving Pricing...' : 'Save Pricing Configuration'}
              </button>
            </div>
          </form>

          {/* Pricing Summary Card */}
          <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--border-radius-md)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid var(--glass-border-accent)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                  <DollarSign size={24} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: '700', margin: 0 }}>Pricing Preview</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Real-time invoice calculation</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.9rem' }}>
                <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Model:</span>
                  <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginTop: '2px' }}>{formData.PricingModel}</div>
                </div>

                <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Rate / Unit Price:</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#10b981', marginTop: '2px' }}>
                    {formData.PricingModel === 'FREE' ? '0.00 ETB (Free)' : `${formData.UnitPrice} ${formData.CurrencyCode}`}
                  </div>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Classification:</span>
                  <div style={{ fontWeight: '600', color: 'var(--accent-secondary)', marginTop: '2px' }}>{formData.BillingType}</div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '24px', padding: '12px', borderRadius: 'var(--border-radius-sm)', background: 'rgba(255, 255, 255, 0.03)', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <AlertCircle size={16} style={{ color: 'var(--accent-secondary)', flexShrink: 0, marginTop: '2px' }} />
              <span>Pricing model changes take effect immediately on new service requests created by tenants.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
