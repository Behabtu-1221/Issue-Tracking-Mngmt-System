import React, { useState, useEffect } from 'react';
import {
  X, Building2, MapPin, Globe, Mail, Phone, ShieldCheck, Zap, FileText,
  CreditCard, Compass, Clock, DollarSign, Image, Check, ArrowLeft, ArrowRight,
  Sparkles, RefreshCw, AlertCircle, CheckCircle2, Lock, Info
} from 'lucide-react';
import parkApi from '../api/parkApi';
import { parkSchemas } from '../../../validation';
import AlertDialogModal from '../../../components/common/AlertDialogModal';
import { useTranslation } from '../../../i18n';

const TIMEZONE_OPTIONS = [
  { code: 'Africa/Addis_Ababa', label: 'Africa/Addis_Ababa (EAT, UTC+3)' },
  { code: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { code: 'Europe/London', label: 'Europe/London (GMT/BST)' },
  { code: 'America/New_York', label: 'America/New_York (EST/EDT)' },
  { code: 'Asia/Dubai', label: 'Asia/Dubai (GST, UTC+4)' }
];

const CURRENCY_OPTIONS = [
  { code: 'ETB', label: 'ETB — Ethiopian Birr (Br)' },
  { code: 'USD', label: 'USD — United States Dollar ($)' },
  { code: 'EUR', label: 'EUR — Euro (€)' },
  { code: 'GBP', label: 'GBP — British Pound (£)' }
];

const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English (en-US)' },
  { code: 'am', label: 'Amharic (am-ET)' },
  { code: 'fr', label: 'French (fr-FR)' }
];

export default function BusinessParkFormModal({ isOpen, onClose, onSuccess, initialData = null }) {
  const { t } = useTranslation();
  const [activeStep, setActiveStep] = useState('identity'); // 'identity' | 'contact' | 'location' | 'regional'
  const [formData, setFormData] = useState({
    BusinessParkCode: '',
    BusinessParkName: '',
    ShortName: '',
    Description: '',
    RegistrationNumber: '',
    TaxIdentificationNo: '',
    Email: '',
    PhoneNumber: '',
    MobileNumber: '',
    Website: '',
    Country: 'Ethiopia',
    Region: 'Addis Ababa',
    City: 'Addis Ababa',
    SubCity: 'Bole',
    Woreda: 'Woreda 03',
    PostalCode: '1000',
    AddressLine1: '',
    AddressLine2: '',
    Latitude: '',
    Longitude: '',
    TimeZone: 'Africa/Addis_Ababa',
    CurrencyCode: 'ETB',
    LanguageCode: 'en',
    LogoPath: '',
    TotalAreaSquareMeter: '',
    IsOperational: 1,
    IsActive: 1
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'error' });

  const showAlert = (title, message, type = 'error') => {
    setAlertConfig({ isOpen: true, title, message, type });
  };

  useEffect(() => {
    if (initialData) {
      setFormData({
        BusinessParkCode: initialData.BusinessParkCode || '',
        BusinessParkName: initialData.BusinessParkName || '',
        ShortName: initialData.ShortName || '',
        Description: initialData.Description || '',
        RegistrationNumber: initialData.RegistrationNumber || '',
        TaxIdentificationNo: initialData.TaxIdentificationNo || '',
        Email: initialData.Email || '',
        PhoneNumber: initialData.PhoneNumber || '',
        MobileNumber: initialData.MobileNumber || '',
        Website: initialData.Website || '',
        Country: initialData.Country || 'Ethiopia',
        Region: initialData.Region || 'Addis Ababa',
        City: initialData.City || 'Addis Ababa',
        SubCity: initialData.SubCity || 'Bole',
        Woreda: initialData.Woreda || '',
        PostalCode: initialData.PostalCode || '',
        AddressLine1: initialData.AddressLine1 || '',
        AddressLine2: initialData.AddressLine2 || '',
        Latitude: initialData.Latitude !== null && initialData.Latitude !== undefined ? initialData.Latitude : '',
        Longitude: initialData.Longitude !== null && initialData.Longitude !== undefined ? initialData.Longitude : '',
        TimeZone: initialData.TimeZone || 'Africa/Addis_Ababa',
        CurrencyCode: initialData.CurrencyCode || 'ETB',
        LanguageCode: initialData.LanguageCode || 'en',
        LogoPath: initialData.LogoPath || '',
        TotalAreaSquareMeter: initialData.TotalAreaSquareMeter !== null && initialData.TotalAreaSquareMeter !== undefined ? initialData.TotalAreaSquareMeter : '',
        IsOperational: initialData.IsOperational !== undefined ? initialData.IsOperational : 1,
        IsActive: initialData.IsActive !== undefined ? initialData.IsActive : 1
      });
    } else {
      setFormData({
        BusinessParkCode: '',
        BusinessParkName: '',
        ShortName: '',
        Description: '',
        RegistrationNumber: '',
        TaxIdentificationNo: '',
        Email: '',
        PhoneNumber: '',
        MobileNumber: '',
        Website: '',
        Country: 'Ethiopia',
        Region: 'Addis Ababa',
        City: 'Addis Ababa',
        SubCity: 'Bole',
        Woreda: '',
        PostalCode: '',
        AddressLine1: '',
        AddressLine2: '',
        Latitude: '',
        Longitude: '',
        TimeZone: 'Africa/Addis_Ababa',
        CurrencyCode: 'ETB',
        LanguageCode: 'en',
        LogoPath: '',
        TotalAreaSquareMeter: '',
        IsOperational: 1,
        IsActive: 1
      });
    }
    setFieldErrors({});
    setFormError('');
    setActiveStep('identity');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  // Real-time Sanitizer & Field Error Validator
  const handleInputChange = (field, value) => {
    let sanitizedVal = value;
    if (field === 'BusinessParkCode') {
      sanitizedVal = value.toUpperCase().replace(/[^A-Z0-9_]/g, '');
    }

    const updated = { ...formData, [field]: sanitizedVal };
    setFormData(updated);

    // Validate updated form
    const validation = parkSchemas.parkForm(updated);
    setFieldErrors(validation.errors || {});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formSubmitting) return;

    setFormError('');
    const validation = parkSchemas.parkForm(formData);

    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      setFormError('');
      return;
    }

    try {
      setFormSubmitting(true);
      const payload = validation.sanitized;

      if (initialData && initialData.BusinessParkID) {
        await parkApi.updatePark(initialData.BusinessParkID, payload);
        showAlert(t('common.success', 'Success'), t('businessPark.parkUpdatedSuccess', { name: payload.BusinessParkName }, `Business Park "${payload.BusinessParkName}" updated successfully.`), 'success');
      } else {
        await parkApi.createPark(payload);
        showAlert(t('common.success', 'Success'), t('businessPark.parkRegisteredSuccess', { name: payload.BusinessParkName }, `Business Park "${payload.BusinessParkName}" registered successfully.`), 'success');
      }

      onSuccess();
    } catch (err) {
      const msg = err.response?.data?.message || t('businessPark.failedSavePark', 'Failed to save Business Park data.');
      setFormError(msg);
      showAlert(t('common.operationFailed', 'Operation Failed'), msg, 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  const steps = [
    { id: 'identity', label: t('businessPark.stepIdentity', '1. Identity & Legal'), icon: Building2 },
    { id: 'contact', label: t('businessPark.stepContact', '2. Contact & Digital'), icon: Mail },
    { id: 'location', label: t('businessPark.stepLocation', '3. Location & Area'), icon: MapPin },
    { id: 'regional', label: t('businessPark.stepRegional', '4. System & Defaults'), icon: Globe }
  ];

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'var(--modal-backdrop, rgba(16, 20, 24, 0.78))', backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '24px'
    }}>
      <div
        style={{
          width: '100%',
          maxWidth: '920px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '24px',
          border: '1px solid var(--glass-border-accent)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-lg)',
          background: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          animation: 'fadeIn 0.25s ease-out',
          position: 'relative'
        }}
      >
        {/* Multi-Tone Brand Line Accent */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
          background: 'linear-gradient(90deg, #2563eb 0%, #7c3aed 40%, #0284c7 75%, #10b981 100%)',
          zIndex: 10
        }} />

        {/* Modal Header */}
        <div style={{
          padding: '20px 28px',
          borderBottom: '1px solid var(--glass-border)',
          background: 'var(--bg-tertiary)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '14px',
              background: 'var(--accent-gradient)',
              color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--glow-accent)'
            }}>
              <Building2 size={22} />
            </div>
            <div>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--accent-primary)', letterSpacing: '0.5px' }}>
                {t('businessPark.topologyConfiguration', 'BUSINESS PARK TOPOLOGY CONFIGURATION')}
              </span>
              <h3 style={{ margin: '2px 0 0', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Outfit', sans-serif" }}>
                {initialData ? t('businessPark.editCampusTitle', { name: formData.BusinessParkName || 'Business Park' }, `Edit Campus • ${formData.BusinessParkName || 'Business Park'}`) : t('businessPark.registerNewCampusTitle', 'Register New Business Park Campus')}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)',
              color: 'var(--text-muted)', cursor: 'pointer', padding: '8px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Step Navigation Bar */}
        <div style={{
          display: 'flex', gap: '4px', padding: '8px 16px', background: 'var(--bg-tertiary)',
          borderBottom: '1px solid var(--glass-border)', overflowX: 'auto', flexShrink: 0
        }}>
          {steps.map((st) => {
            const IconComp = st.icon;
            const isActive = activeStep === st.id;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => setActiveStep(st.id)}
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: '12px', border: 'none',
                  background: isActive ? 'var(--accent-gradient)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-muted)',
                  fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  whiteSpace: 'nowrap', transition: 'all 0.2s ease',
                  boxShadow: isActive ? 'var(--glow-accent)' : 'none'
                }}
              >
                <IconComp size={16} /> {st.label}
              </button>
            );
          })}
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
          <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>

            {formError && (
              <div style={{
                padding: '12px 16px', borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)',
                color: 'var(--color-danger)', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <AlertCircle size={18} /> {formError}
              </div>
            )}

            {/* TAB 1: IDENTITY & LEGAL */}
            {activeStep === 'identity' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', animation: 'fadeIn 0.2s ease-out' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 800, marginBottom: '6px', textTransform: 'uppercase' }}>
                      {t('businessPark.parkCode', 'Business Park Code')}
                    </label>
                    <input
                      type="text" required placeholder="e.g. BP_BOLE_01"
                      value={formData.BusinessParkCode}
                      onChange={(e) => handleInputChange('BusinessParkCode', e.target.value)}
                      style={{
                        width: '100%', padding: '12px 14px', borderRadius: '12px',
                        background: 'var(--bg-tertiary)', border: fieldErrors.BusinessParkCode ? '1px solid var(--color-danger)' : '1px solid var(--glass-border)',
                        color: 'var(--accent-primary)', fontFamily: 'monospace', fontSize: '0.9rem', fontWeight: 800, outline: 'none'
                      }}
                    />
                    {fieldErrors.BusinessParkCode && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-danger)', fontWeight: 600, marginTop: '4px', display: 'block' }}>{fieldErrors.BusinessParkCode}</span>
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 800, marginBottom: '6px', textTransform: 'uppercase' }}>
                      {t('businessPark.parkName', 'Business Park Name')}
                    </label>
                    <input
                      type="text" required placeholder="e.g. Bole Lemi Industrial & Technology Park"
                      value={formData.BusinessParkName}
                      onChange={(e) => handleInputChange('BusinessParkName', e.target.value)}
                      style={{
                        width: '100%', padding: '12px 14px', borderRadius: '12px',
                        background: 'var(--bg-tertiary)', border: fieldErrors.BusinessParkName ? '1px solid var(--color-danger)' : '1px solid var(--glass-border)',
                        color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 700, outline: 'none'
                      }}
                    />
                    {fieldErrors.BusinessParkName && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-danger)', fontWeight: 600, marginTop: '4px', display: 'block' }}>{fieldErrors.BusinessParkName}</span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase' }}>
                      {t('businessPark.shortNameAlias', 'Short Name / Alias')}
                    </label>
                    <input
                      type="text" placeholder="e.g. Bole Lemi Tech Park"
                      value={formData.ShortName}
                      onChange={(e) => handleInputChange('ShortName', e.target.value)}
                      style={{
                        width: '100%', padding: '11px 14px', borderRadius: '12px',
                        background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                        color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase' }}>
                      {t('businessPark.registrationNumber', 'Registration Number')}
                    </label>
                    <input
                      type="text" placeholder="e.g. REG-ETH-2024-8841"
                      value={formData.RegistrationNumber}
                      onChange={(e) => handleInputChange('RegistrationNumber', e.target.value)}
                      style={{
                        width: '100%', padding: '11px 14px', borderRadius: '12px',
                        background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                        color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase' }}>
                      {t('businessPark.tinNumberLabel', 'Tax Identification No (TIN)')}
                    </label>
                    <input
                      type="text" placeholder="e.g. TIN-0098412491"
                      value={formData.TaxIdentificationNo}
                      onChange={(e) => handleInputChange('TaxIdentificationNo', e.target.value)}
                      style={{
                        width: '100%', padding: '11px 14px', borderRadius: '12px',
                        background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                        color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase' }}>
                    {t('businessPark.campusDescriptionOverview', 'Campus Description & Scope Overview')}
                  </label>
                  <textarea
                    rows={3} placeholder="Central business park campus scope, building layout, and facilities infrastructure description..."
                    value={formData.Description}
                    onChange={(e) => handleInputChange('Description', e.target.value)}
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: '12px',
                      background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                      color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none', resize: 'vertical'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase' }}>
                    {t('businessPark.logoUrlAssetPath', 'Logo Image URL / Asset Path')}
                  </label>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <input
                      type="text" placeholder="e.g. /auth_background.png or https://domain.com/logo.png"
                      value={formData.LogoPath}
                      onChange={(e) => handleInputChange('LogoPath', e.target.value)}
                      style={{
                        flex: 1, padding: '11px 14px', borderRadius: '12px',
                        background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                        color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none'
                      }}
                    />
                    {formData.LogoPath && (
                      <div style={{
                        width: '42px', height: '42px', borderRadius: '10px', overflow: 'hidden',
                        border: '1px solid var(--glass-border)', background: 'var(--bg-tertiary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <img src={formData.LogoPath} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: CONTACT & DIGITAL CHANNELS */}
            {activeStep === 'contact' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', animation: 'fadeIn 0.2s ease-out' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase' }}>
                      {t('businessPark.officialContactEmail', 'Official Contact Email')}
                    </label>
                    <input
                      type="email" placeholder="e.g. info@bolelemi.park.et"
                      value={formData.Email}
                      onChange={(e) => handleInputChange('Email', e.target.value)}
                      style={{
                        width: '100%', padding: '12px 14px', borderRadius: '12px',
                        background: 'var(--bg-tertiary)', border: fieldErrors.Email ? '1px solid var(--color-danger)' : '1px solid var(--glass-border)',
                        color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none'
                      }}
                    />
                    {fieldErrors.Email && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-danger)', fontWeight: 600, marginTop: '4px', display: 'block' }}>{fieldErrors.Email}</span>
                    )}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase' }}>
                      {t('businessPark.websiteUrl', 'Website URL')}
                    </label>
                    <input
                      type="text" placeholder="e.g. https://bolelemitp.ethiopia.gov.et"
                      value={formData.Website}
                      onChange={(e) => handleInputChange('Website', e.target.value)}
                      style={{
                        width: '100%', padding: '12px 14px', borderRadius: '12px',
                        background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                        color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase' }}>
                      {t('businessPark.landlinePhoneNumber', 'Landline Phone Number')}
                    </label>
                    <input
                      type="text" placeholder="e.g. +251 11 662 1000"
                      value={formData.PhoneNumber}
                      onChange={(e) => handleInputChange('PhoneNumber', e.target.value)}
                      style={{
                        width: '100%', padding: '12px 14px', borderRadius: '12px',
                        background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                        color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase' }}>
                      {t('businessPark.mobileHotlineNumber', 'Mobile / Emergency Hotline Number')}
                    </label>
                    <input
                      type="text" placeholder="e.g. +251 91 100 2233"
                      value={formData.MobileNumber}
                      onChange={(e) => handleInputChange('MobileNumber', e.target.value)}
                      style={{
                        width: '100%', padding: '12px 14px', borderRadius: '12px',
                        background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                        color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none'
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: LOCATION & BOUNDARY */}
            {activeStep === 'location' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', animation: 'fadeIn 0.2s ease-out' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 800, marginBottom: '6px', textTransform: 'uppercase' }}>
                      {t('businessPark.country', 'Country')}
                    </label>
                    <input
                      type="text" required placeholder="e.g. Ethiopia"
                      value={formData.Country}
                      onChange={(e) => handleInputChange('Country', e.target.value)}
                      style={{
                        width: '100%', padding: '11px 14px', borderRadius: '12px',
                        background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                        color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase' }}>
                      {t('businessPark.regionState', 'Region / State')}
                    </label>
                    <input
                      type="text" placeholder="e.g. Addis Ababa"
                      value={formData.Region}
                      onChange={(e) => handleInputChange('Region', e.target.value)}
                      style={{
                        width: '100%', padding: '11px 14px', borderRadius: '12px',
                        background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                        color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 800, marginBottom: '6px', textTransform: 'uppercase' }}>
                      {t('businessPark.city', 'City')}
                    </label>
                    <input
                      type="text" required placeholder="e.g. Addis Ababa"
                      value={formData.City}
                      onChange={(e) => handleInputChange('City', e.target.value)}
                      style={{
                        width: '100%', padding: '11px 14px', borderRadius: '12px',
                        background: 'var(--bg-tertiary)', border: fieldErrors.City ? '1px solid var(--color-danger)' : '1px solid var(--glass-border)',
                        color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none'
                      }}
                    />
                    {fieldErrors.City && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-danger)', fontWeight: 600, marginTop: '4px', display: 'block' }}>{fieldErrors.City}</span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase' }}>
                      {t('businessPark.subCity', 'SubCity')}
                    </label>
                    <input
                      type="text" placeholder="e.g. Bole"
                      value={formData.SubCity}
                      onChange={(e) => handleInputChange('SubCity', e.target.value)}
                      style={{
                        width: '100%', padding: '11px 14px', borderRadius: '12px',
                        background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                        color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase' }}>
                      {t('businessPark.woreda', 'Woreda')}
                    </label>
                    <input
                      type="text" placeholder="e.g. Woreda 03"
                      value={formData.Woreda}
                      onChange={(e) => handleInputChange('Woreda', e.target.value)}
                      style={{
                        width: '100%', padding: '11px 14px', borderRadius: '12px',
                        background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                        color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase' }}>
                      {t('businessPark.postalCode', 'Postal Code')}
                    </label>
                    <input
                      type="text" placeholder="e.g. 1000"
                      value={formData.PostalCode}
                      onChange={(e) => handleInputChange('PostalCode', e.target.value)}
                      style={{
                        width: '100%', padding: '11px 14px', borderRadius: '12px',
                        background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                        color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase' }}>
                      {t('businessPark.addressLine1', 'Address Line 1 (Street / Main Gate)')}
                    </label>
                    <input
                      type="text" placeholder="e.g. Ring Road, Near Bole Lemi Substation"
                      value={formData.AddressLine1}
                      onChange={(e) => handleInputChange('AddressLine1', e.target.value)}
                      style={{
                        width: '100%', padding: '11px 14px', borderRadius: '12px',
                        background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                        color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase' }}>
                      {t('businessPark.addressLine2', 'Address Line 2 (Secondary Building / Landmark)')}
                    </label>
                    <input
                      type="text" placeholder="e.g. Block A2 Administration HQ"
                      value={formData.AddressLine2}
                      onChange={(e) => handleInputChange('AddressLine2', e.target.value)}
                      style={{
                        width: '100%', padding: '11px 14px', borderRadius: '12px',
                        background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                        color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase' }}>
                      {t('businessPark.gpsLatitude', 'GPS Latitude')}
                    </label>
                    <input
                      type="number" step="any" placeholder="e.g. 8.98060300"
                      value={formData.Latitude}
                      onChange={(e) => handleInputChange('Latitude', e.target.value)}
                      style={{
                        width: '100%', padding: '11px 14px', borderRadius: '12px',
                        background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                        color: 'var(--text-primary)', fontSize: '0.88rem', fontFamily: 'monospace', outline: 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase' }}>
                      {t('businessPark.gpsLongitude', 'GPS Longitude')}
                    </label>
                    <input
                      type="number" step="any" placeholder="e.g. 38.75776000"
                      value={formData.Longitude}
                      onChange={(e) => handleInputChange('Longitude', e.target.value)}
                      style={{
                        width: '100%', padding: '11px 14px', borderRadius: '12px',
                        background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                        color: 'var(--text-primary)', fontSize: '0.88rem', fontFamily: 'monospace', outline: 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase' }}>
                      {t('businessPark.totalAreaSqM', 'Total Area (m²)')}
                    </label>
                    <input
                      type="number" min="0" placeholder="e.g. 150000.00"
                      value={formData.TotalAreaSquareMeter}
                      onChange={(e) => handleInputChange('TotalAreaSquareMeter', e.target.value)}
                      style={{
                        width: '100%', padding: '11px 14px', borderRadius: '12px',
                        background: 'var(--bg-tertiary)', border: fieldErrors.TotalAreaSquareMeter ? '1px solid var(--color-danger)' : '1px solid var(--glass-border)',
                        color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none'
                      }}
                    />
                    {fieldErrors.TotalAreaSquareMeter && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-danger)', fontWeight: 600, marginTop: '4px', display: 'block' }}>{fieldErrors.TotalAreaSquareMeter}</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: REGIONAL DEFAULTS & OPERATIONAL */}
            {activeStep === 'regional' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', animation: 'fadeIn 0.2s ease-out' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 800, marginBottom: '6px', textTransform: 'uppercase' }}>
                      {t('businessPark.systemTimeZone', 'System TimeZone')}
                    </label>
                    <select
                      value={formData.TimeZone}
                      onChange={(e) => handleInputChange('TimeZone', e.target.value)}
                      style={{
                        width: '100%', padding: '12px 14px', borderRadius: '12px',
                        background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                        color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none'
                      }}
                    >
                      {TIMEZONE_OPTIONS.map(tz => (
                        <option key={tz.code} value={tz.code} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                          {tz.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 800, marginBottom: '6px', textTransform: 'uppercase' }}>
                      {t('businessPark.defaultCurrencyCode', 'Default Currency Code')}
                    </label>
                    <select
                      value={formData.CurrencyCode}
                      onChange={(e) => handleInputChange('CurrencyCode', e.target.value)}
                      style={{
                        width: '100%', padding: '12px 14px', borderRadius: '12px',
                        background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                        color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none'
                      }}
                    >
                      {CURRENCY_OPTIONS.map(c => (
                        <option key={c.code} value={c.code} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 800, marginBottom: '6px', textTransform: 'uppercase' }}>
                      {t('businessPark.defaultLanguage', 'Default Language')}
                    </label>
                    <select
                      value={formData.LanguageCode}
                      onChange={(e) => handleInputChange('LanguageCode', e.target.value)}
                      style={{
                        width: '100%', padding: '12px 14px', borderRadius: '12px',
                        background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                        color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none'
                      }}
                    >
                      {LANGUAGE_OPTIONS.map(l => (
                        <option key={l.code} value={l.code} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                          {l.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Status Controls */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 800, marginBottom: '10px', textTransform: 'uppercase' }}>
                    {t('businessPark.operationalStatusFlags', 'Campus Operational Status Flags')}
                  </label>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <button
                      type="button"
                      onClick={() => handleInputChange('IsOperational', formData.IsOperational ? 0 : 1)}
                      style={{
                        padding: '12px 20px', borderRadius: '12px', cursor: 'pointer', fontWeight: 800, fontSize: '0.86rem',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        background: formData.IsOperational ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-tertiary)',
                        border: formData.IsOperational ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--glass-border)',
                        color: formData.IsOperational ? 'var(--color-success)' : 'var(--text-muted)', transition: 'all 0.2s'
                      }}
                    >
                      {formData.IsOperational ? <CheckCircle2 size={18} /> : null}
                      {formData.IsOperational ? t('businessPark.campusOperational', 'Campus Operational') : t('businessPark.underConstructionOffline', 'Under Construction / Offline')}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleInputChange('IsActive', formData.IsActive ? 0 : 1)}
                      style={{
                        padding: '12px 20px', borderRadius: '12px', cursor: 'pointer', fontWeight: 800, fontSize: '0.86rem',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        background: formData.IsActive ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-tertiary)',
                        border: formData.IsActive ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid var(--glass-border)',
                        color: formData.IsActive ? 'var(--accent-primary)' : 'var(--text-muted)', transition: 'all 0.2s'
                      }}
                    >
                      {formData.IsActive ? <CheckCircle2 size={18} /> : null}
                      {formData.IsActive ? t('businessPark.recordActive', 'Record Active') : t('businessPark.recordDeactivated', 'Record Deactivated')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '16px 28px', borderTop: '1px solid var(--glass-border)', background: 'var(--bg-tertiary)', flexShrink: 0
          }}>
            <div>
              {activeStep !== 'identity' && (
                <button
                  type="button"
                  onClick={() => {
                    const idx = steps.findIndex(s => s.id === activeStep);
                    if (idx > 0) setActiveStep(steps[idx - 1].id);
                  }}
                  style={{
                    padding: '10px 18px', borderRadius: '12px',
                    border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)', fontSize: '0.86rem', fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                >
                  <ArrowLeft size={16} /> {t('common.back', 'Back')}
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '10px 18px', borderRadius: '12px',
                  border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)', fontSize: '0.86rem', fontWeight: 700, cursor: 'pointer'
                }}
              >
                {t('common.cancel', 'Cancel')}
              </button>

              {activeStep !== 'regional' ? (
                <button
                  type="button"
                  onClick={() => {
                    const idx = steps.findIndex(s => s.id === activeStep);
                    if (idx < steps.length - 1) setActiveStep(steps[idx + 1].id);
                  }}
                  style={{
                    padding: '10px 20px', borderRadius: '12px', border: 'none',
                    background: 'var(--accent-gradient)', color: '#ffffff', fontWeight: 800,
                    fontSize: '0.86rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                    boxShadow: 'var(--glow-accent)'
                  }}
                >
                  {t('common.nextStep', 'Next Step')} <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={formSubmitting}
                  style={{
                    padding: '10px 24px', borderRadius: '12px', border: 'none',
                    background: 'var(--accent-gradient)', color: '#ffffff', fontWeight: 800,
                    fontSize: '0.86rem', cursor: formSubmitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                    boxShadow: 'var(--glow-accent)'
                  }}
                >
                  {formSubmitting ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  {formSubmitting ? t('businessPark.savingPark', 'Saving Business Park...') : initialData ? t('businessPark.updateParkBtn', '✓ Update Business Park') : t('businessPark.registerParkBtn', '✓ Register Business Park')}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      <AlertDialogModal
        isOpen={alertConfig.isOpen}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
