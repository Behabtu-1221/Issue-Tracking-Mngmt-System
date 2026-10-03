import React, { useState, useEffect } from 'react';
import { Globe, Plus, Trash2, RefreshCw, AlertCircle, Languages } from 'lucide-react';
import configApi from '../api/configApi';

export default function LocalizationTab() {
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
          <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>Locales</h4>
          <button
            onClick={() => {
              setLocaleForm({ languageCode: 'en', countryCode: 'US', localeName: 'English (United States)' });
              setError(null);
              setIsLocaleModalOpen(true);
            }}
            style={{
              background: 'var(--accent-gradient)',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              padding: '6px 10px',
              fontSize: '0.8rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Plus size={14} /> Add Locale
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
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Language resource translations.</p>
              </div>

              <button
                onClick={() => {
                  setResourceForm({ resourceKey: '', resourceValue: '' });
                  setError(null);
                  setIsResourceModalOpen(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  borderRadius: 'var(--border-radius-sm)',
                  background: 'var(--accent-gradient)',
                  color: 'white',
                  border: 'none',
                  fontWeight: '600',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  boxShadow: 'var(--glow-accent)'
                }}
              >
                <Plus size={16} /> Add Translation Key
              </button>
            </div>

            <div className="glass-panel" style={{ padding: '8px' }}>
              {loadingResources ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  <RefreshCw className="animate-spin" size={24} style={{ marginBottom: '12px' }} />
                  <p>Loading translations...</p>
                </div>
              ) : resources.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  <Globe size={36} style={{ marginBottom: '12px', opacity: 0.5 }} />
                  <p>No translation resources configured for this locale.</p>
                </div>
              ) : (
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Resource Key</th>
                      <th>Resource Value</th>
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
            <p>Select a locale on the left panel to manage language translations.</p>
          </div>
        )}
      </div>

      {/* Modal: Create Locale */}
      {isLocaleModalOpen && (
        <div className="modal-overlay" onClick={() => setIsLocaleModalOpen(false)}>
          <div className="glass-panel modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '450px', padding: '24px', background: 'var(--bg-secondary)' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Add New Locale</h3>
            {error && <div style={{ color: 'var(--color-danger)', fontSize: '0.85rem', marginBottom: '12px' }}>{error}</div>}
            <form onSubmit={handleCreateLocale}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Language Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. en"
                    value={localeForm.languageCode}
                    onChange={(e) => setLocaleForm({ ...localeForm, languageCode: e.target.value.toLowerCase() })}
                    style={{ width: '100%', padding: '10px', background: 'var(--color-elevated)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'var(--color-text)', fontFamily: 'monospace' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Country Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. US"
                    value={localeForm.countryCode}
                    onChange={(e) => setLocaleForm({ ...localeForm, countryCode: e.target.value.toUpperCase() })}
                    style={{ width: '100%', padding: '10px', background: 'var(--color-elevated)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'var(--color-text)', fontFamily: 'monospace' }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Locale Display Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. English (United States)"
                  value={localeForm.localeName}
                  onChange={(e) => setLocaleForm({ ...localeForm, localeName: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: 'var(--color-elevated)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'var(--color-text)' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setIsLocaleModalOpen(false)} style={{ padding: '8px 16px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'var(--color-text)', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ padding: '8px 18px', background: 'var(--accent-gradient)', border: 'none', borderRadius: '6px', color: 'white', fontWeight: '600', cursor: 'pointer' }}>{submitting ? 'Saving...' : 'Save Locale'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Translation Resource */}
      {isResourceModalOpen && (
        <div className="modal-overlay" onClick={() => setIsResourceModalOpen(false)}>
          <div className="glass-panel modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '480px', padding: '24px', background: 'var(--bg-secondary)' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Add Translation ({selectedLocale?.LanguageCode}-{selectedLocale?.CountryCode})</h3>
            {error && <div style={{ color: 'var(--color-danger)', fontSize: '0.85rem', marginBottom: '12px' }}>{error}</div>}
            <form onSubmit={handleSaveResource}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Resource Key</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. button.submit"
                  value={resourceForm.resourceKey}
                  onChange={(e) => setResourceForm({ ...resourceForm, resourceKey: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: 'var(--color-elevated)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'var(--color-text)', fontFamily: 'monospace' }}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Resource Value</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Submit Request"
                  value={resourceForm.resourceValue}
                  onChange={(e) => setResourceForm({ ...resourceForm, resourceValue: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: 'var(--color-elevated)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'var(--color-text)' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setIsResourceModalOpen(false)} style={{ padding: '8px 16px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'var(--color-text)', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ padding: '8px 18px', background: 'var(--accent-gradient)', border: 'none', borderRadius: '6px', color: 'white', fontWeight: '600', cursor: 'pointer' }}>{submitting ? 'Saving...' : 'Save Translation'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
