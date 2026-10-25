import React, { useState, useEffect } from 'react';
import { Globe, Plus, Trash2, RefreshCw, AlertCircle, Languages } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import configApi from '../api/configApi';
import { ModalCard } from '../../../components/common/ModalCard';
import { FormField } from '../../../components/common/FormField';

export default function LocalizationTab() {
  const { t } = useTranslation();
  const [localizations, setLocalizations] = useState([]);
  const [selectedLocale, setSelectedLocale] = useState(null);
  const [resources, setResources] = useState([]);
  const [loadingLocales, setLoadingLocales] = useState(true);
  const [loadingResources, setLoadingResources] = useState(false);

  const [isLocaleModalOpen, setIsLocaleModalOpen] = useState(false);
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [localeForm, setLocaleForm] = useState({ languageCode: 'en', countryCode: 'US', localeName: 'English (United States)' });
  const [resourceForm, setResourceForm] = useState({ resourceKey: '', resourceValue: '' });

  const fetchLocalizations = async () => {
    setLoadingLocales(true);
    try {
      const res = await configApi.getLocalizations();
      if (res.data && res.data.status === 'success') {
        const list = res.data.data || [];
        setLocalizations(list);
        if (list.length > 0 && !selectedLocale) {
          setSelectedLocale(list[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load localizations:', err);
    } finally {
      setLoadingLocales(false);
    }
  };

  const fetchResources = async (localeId) => {
    if (!localeId) return;
    setLoadingResources(true);
    try {
      const res = await configApi.getLanguageResources(localeId);
      if (res.data && res.data.status === 'success') {
        setResources(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load resources:', err);
    } finally {
      setLoadingResources(false);
    }
  };

  useEffect(() => {
    fetchLocalizations();
  }, []);

  useEffect(() => {
    if (selectedLocale) {
      fetchResources(selectedLocale.LocalizationID);
    }
  }, [selectedLocale]);

  const handleCreateLocale = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await configApi.createLocalization(localeForm);
      setIsLocaleModalOpen(false);
      await fetchLocalizations();
      if (res.data?.data) setSelectedLocale(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create locale');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveResource = async (e) => {
    e.preventDefault();
    if (!selectedLocale) return;
    setSubmitting(true);
    setError(null);
    try {
      await configApi.saveLanguageResource(selectedLocale.LocalizationID, resourceForm);
      setIsResourceModalOpen(false);
      setResourceForm({ resourceKey: '', resourceValue: '' });
      fetchResources(selectedLocale.LocalizationID);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save translation resource');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px' }}>
      {/* Left Column: Localizations */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: 0 }}>{t('config.localesTitle')}</h4>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              setLocaleForm({ languageCode: 'en', countryCode: 'US', localeName: 'English (United States)' });
              setError(null);
              setIsLocaleModalOpen(true);
            }}
          >
            <Plus size={14} /> {t('config.newLocaleBtn')}
          </button>
        </div>

        {loadingLocales ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
            <RefreshCw className="animate-spin" size={18} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '500px', overflowY: 'auto' }}>
            {localizations.map((loc) => (
              <button
                key={loc.LocalizationID}
                onClick={() => setSelectedLocale(loc)}
                style={{
                  textAlign: 'left',
                  padding: '12px 14px',
                  borderRadius: 'var(--border-radius-sm)',
                  background: selectedLocale?.LocalizationID === loc.LocalizationID ? 'var(--accent-gradient)' : 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${selectedLocale?.LocalizationID === loc.LocalizationID ? 'var(--accent-primary)' : 'var(--glass-border)'}`,
                  color: selectedLocale?.LocalizationID === loc.LocalizationID ? 'white' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <div style={{ fontWeight: '600', fontSize: '0.88rem' }}>{loc.LocaleName}</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.8, fontFamily: 'monospace' }}>{loc.LanguageCode}-{loc.CountryCode}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right Column: Resources for selected locale */}
      <div>
        {selectedLocale ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>
                  {selectedLocale.LocaleName} <span style={{ fontSize: '0.85rem', fontFamily: 'monospace', color: 'var(--accent-secondary)' }}>({selectedLocale.LanguageCode}-{selectedLocale.CountryCode})</span>
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t('config.languageResourcesDesc')}</p>
              </div>

              <button
                onClick={() => {
                  setResourceForm({ resourceKey: '', resourceValue: '' });
                  setError(null);
                  setIsResourceModalOpen(true);
                }}
                className="btn btn-primary"
              >
                <Plus size={16} /> {t('config.addKeyBtn')}
              </button>
            </div>

            <div className="glass-panel" style={{ padding: '8px' }}>
              {loadingResources ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  <RefreshCw className="animate-spin" size={24} style={{ marginBottom: '12px' }} />
                  <p>{t('config.loadingTranslations')}</p>
                </div>
              ) : resources.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  <Globe size={36} style={{ marginBottom: '12px', opacity: 0.5 }} />
                  <p>{t('config.noTranslations')}</p>
                </div>
              ) : (
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>{t('config.thResourceKey')}</th>
                      <th>{t('config.thResourceValue')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resources.map((res) => (
                      <tr key={res.LanguageResourceID}>
                        <td style={{ fontFamily: 'monospace', fontWeight: '600', color: 'var(--accent-secondary)' }}>
                          {res.ResourceKey}
                        </td>
                        <td style={{ color: 'var(--text-primary)' }}>{res.ResourceValue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Languages size={40} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <p>{t('config.selectLocalePrompt')}</p>
          </div>
        )}
      </div>

      {/* Modal: Create Locale */}
      <ModalCard
        isOpen={isLocaleModalOpen}
        onClose={() => setIsLocaleModalOpen(false)}
        title={t('config.newLocaleBtn')}
        subtitle="Register language locale and country identification"
        icon={Globe}
        accentStrip="brand"
        maxWidth="460px"
        onSubmit={handleCreateLocale}
        submitting={submitting}
        submitText={t('common.save')}
        cancelText={t('common.cancel')}
        error={error}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-grid-2">
            <FormField
              label={t('config.thLangCode')}
              required
              hint="e.g. en, fr, de"
            >
              <input
                type="text"
                required
                className="form-control"
                placeholder="e.g. en"
                value={localeForm.languageCode}
                onChange={(e) => setLocaleForm({ ...localeForm, languageCode: e.target.value.toLowerCase() })}
                style={{ fontFamily: 'monospace' }}
              />
            </FormField>

            <FormField
              label={t('config.countryCodeLabel')}
              required
              hint="e.g. US, FR, DE"
            >
              <input
                type="text"
                required
                className="form-control"
                placeholder="e.g. US"
                value={localeForm.countryCode}
                onChange={(e) => setLocaleForm({ ...localeForm, countryCode: e.target.value.toUpperCase() })}
                style={{ fontFamily: 'monospace' }}
              />
            </FormField>
          </div>

          <FormField
            label={t('config.thLocaleName')}
            required
          >
            <input
              type="text"
              required
              className="form-control"
              placeholder="e.g. English (United States)"
              value={localeForm.localeName}
              onChange={(e) => setLocaleForm({ ...localeForm, localeName: e.target.value })}
            />
          </FormField>
        </div>
      </ModalCard>

      {/* Modal: Add Translation Resource */}
      <ModalCard
        isOpen={isResourceModalOpen}
        onClose={() => setIsResourceModalOpen(false)}
        title={`${t('config.addKeyBtn')} (${selectedLocale?.LanguageCode}-${selectedLocale?.CountryCode})`}
        subtitle={selectedLocale ? `Register localized string for ${selectedLocale.LocaleName}` : ''}
        icon={Languages}
        accentStrip="purple"
        maxWidth="480px"
        onSubmit={handleSaveResource}
        submitting={submitting}
        submitText={t('common.save')}
        cancelText={t('common.cancel')}
        error={error}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <FormField
            label={t('config.thResourceKey')}
            required
            hint="Dotted translation key path, e.g. button.submit"
          >
            <input
              type="text"
              required
              className="form-control"
              placeholder="e.g. button.submit"
              value={resourceForm.resourceKey}
              onChange={(e) => setResourceForm({ ...resourceForm, resourceKey: e.target.value })}
              style={{ fontFamily: 'monospace' }}
            />
          </FormField>

          <FormField
            label={t('config.thResourceValue')}
            required
          >
            <textarea
              rows={3}
              required
              className="form-control"
              placeholder="e.g. Submit Request"
              value={resourceForm.resourceValue}
              onChange={(e) => setResourceForm({ ...resourceForm, resourceValue: e.target.value })}
            />
          </FormField>
        </div>
      </ModalCard>
    </div>
  );
}
