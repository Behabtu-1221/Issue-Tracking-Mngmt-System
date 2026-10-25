import React, { useState, useEffect } from 'react';
import { List, Plus, Edit3, Trash2, RefreshCw, AlertCircle, Layers } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import configApi from '../api/configApi';
import { ActionButton, ActionGroup } from '../../../components/common/ActionButton';
import { ModalCard } from '../../../components/common/ModalCard';
import { FormField } from '../../../components/common/FormField';

export default function LookupsTab() {
  const { t } = useTranslation();
  const [types, setTypes] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [values, setValues] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [loadingValues, setLoadingValues] = useState(false);

  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [isValueModalOpen, setIsValueModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [typeForm, setTypeForm] = useState({ lookupTypeCode: '', lookupTypeName: '' });
  const [valueForm, setValueForm] = useState({ lookupValueCode: '', lookupValueName: '', displayOrder: 0 });

  const fetchTypes = async () => {
    setLoadingTypes(true);
    try {
      const res = await configApi.getLookupTypes();
      if (res.data && res.data.status === 'success') {
        const typeList = res.data.data || [];
        setTypes(typeList);
        if (typeList.length > 0 && !selectedType) {
          setSelectedType(typeList[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load lookup types:', err);
    } finally {
      setLoadingTypes(false);
    }
  };

  const fetchValues = async (typeId) => {
    if (!typeId) return;
    setLoadingValues(true);
    try {
      const res = await configApi.getLookupValues(typeId);
      if (res.data && res.data.status === 'success') {
        setValues(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load lookup values:', err);
    } finally {
      setLoadingValues(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  useEffect(() => {
    if (selectedType) {
      fetchValues(selectedType.LookupTypeID);
    }
  }, [selectedType]);

  const handleCreateType = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await configApi.createLookupType(typeForm);
      setIsTypeModalOpen(false);
      await fetchTypes();
      if (res.data?.data) setSelectedType(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create lookup type');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateValue = async (e) => {
    e.preventDefault();
    if (!selectedType) return;
    setSubmitting(true);
    setError(null);
    try {
      await configApi.createLookupValue(selectedType.LookupTypeID, valueForm);
      setIsValueModalOpen(false);
      setValueForm({ lookupValueCode: '', lookupValueName: '', displayOrder: 0 });
      fetchValues(selectedType.LookupTypeID);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add lookup value');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteValue = async (valueId) => {
    if (window.confirm(t('config.confirmDeleteValue'))) {
      try {
        await configApi.deleteLookupValue(selectedType.LookupTypeID, valueId);
        fetchValues(selectedType.LookupTypeID);
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete lookup value');
      }
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px' }}>
      {/* Left Column: Lookup Types */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{t('config.lookupTypesTitle')}</h4>
          <button
            onClick={() => {
              setTypeForm({ lookupTypeCode: '', lookupTypeName: '' });
              setError(null);
              setIsTypeModalOpen(true);
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
            <Plus size={14} /> {t('config.newTypeBtn')}
          </button>
        </div>

        {loadingTypes ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
            <RefreshCw className="animate-spin" size={18} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '500px', overflowY: 'auto' }}>
            {types.map((t) => (
              <button
                key={t.LookupTypeID}
                onClick={() => setSelectedType(t)}
                style={{
                  textAlign: 'left',
                  padding: '12px 14px',
                  borderRadius: 'var(--border-radius-sm)',
                  background: selectedType?.LookupTypeID === t.LookupTypeID ? 'var(--accent-gradient)' : 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${selectedType?.LookupTypeID === t.LookupTypeID ? 'var(--accent-primary)' : 'var(--glass-border)'}`,
                  color: selectedType?.LookupTypeID === t.LookupTypeID ? 'white' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <div style={{ fontWeight: '600', fontSize: '0.88rem' }}>{t.LookupTypeName}</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.8, fontFamily: 'monospace' }}>{t.LookupTypeCode}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right Column: Values for selected type */}
      <div>
        {selectedType ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>
                  {selectedType.LookupTypeName} <span style={{ fontSize: '0.85rem', fontFamily: 'monospace', color: 'var(--accent-secondary)' }}>({selectedType.LookupTypeCode})</span>
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Configured values for this lookup category.</p>
              </div>

              <button
                onClick={() => {
                  setValueForm({ lookupValueCode: '', lookupValueName: '', displayOrder: (values.length + 1) * 10 });
                  setError(null);
                  setIsValueModalOpen(true);
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
                <Plus size={16} /> {t('config.newLookupValueBtn')}
              </button>
            </div>

            <div className="glass-panel" style={{ padding: '8px' }}>
              {loadingValues ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  <RefreshCw className="animate-spin" size={24} style={{ marginBottom: '12px' }} />
                  <p>{t('config.loadingValues')}</p>
                </div>
              ) : values.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  <List size={36} style={{ marginBottom: '12px', opacity: 0.5 }} />
                  <p>{t('config.noValues')}</p>
                </div>
              ) : (
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>{t('config.thValueCode')}</th>
                      <th>{t('config.thValueName')}</th>
                      <th>{t('config.thDisplayOrder')}</th>
                      <th>{t('common.status')}</th>
                      <th style={{ textAlign: 'right' }}>{t('config.thActions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {values.map((val) => (
                      <tr key={val.LookupValueID}>
                        <td style={{ fontFamily: 'monospace', fontWeight: '600', color: 'var(--accent-secondary)' }}>
                          {val.LookupValueCode}
                        </td>
                        <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{val.LookupValueName}</td>
                        <td style={{ fontFamily: 'monospace' }}>{val.DisplayOrder ?? 0}</td>
                        <td>
                          <span className={`badge badge-${val.IsActive ? 'active' : 'inactive'}`}>
                            {val.IsActive ? t('common.active') : t('common.inactive')}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <ActionGroup align="right">
                            <ActionButton
                              variant="delete"
                              onClick={() => handleDeleteValue(val.LookupValueID)}
                              title={t('common.delete')}
                            />
                          </ActionGroup>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Layers size={40} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <p>{t('config.selectTypePrompt')}</p>
          </div>
        )}
      </div>

      {/* Modal: Create Lookup Type */}
      <ModalCard
        isOpen={isTypeModalOpen}
        onClose={() => setIsTypeModalOpen(false)}
        title={t('config.createLookupTypeTitle')}
        subtitle="Define a distinct lookup category code and descriptive label"
        icon={Layers}
        accentStrip="brand"
        maxWidth="460px"
        onSubmit={handleCreateType}
        submitting={submitting}
        submitText={t('common.save')}
        cancelText={t('common.cancel')}
        error={error}
      >
        <FormField label={t('config.typeCodeLabel')} required icon={Layers}>
          <input
            type="text"
            className="form-control"
            required
            placeholder="e.g. SEVERITY_LEVEL"
            value={typeForm.lookupTypeCode}
            onChange={(e) => setTypeForm({ ...typeForm, lookupTypeCode: e.target.value.toUpperCase() })}
            style={{ fontFamily: 'monospace' }}
          />
        </FormField>
        <FormField label={t('config.typeNameLabel')} required>
          <input
            type="text"
            className="form-control"
            required
            placeholder="e.g. Severity Level"
            value={typeForm.lookupTypeName}
            onChange={(e) => setTypeForm({ ...typeForm, lookupTypeName: e.target.value })}
          />
        </FormField>
      </ModalCard>

      {/* Modal: Create Lookup Value */}
      <ModalCard
        isOpen={isValueModalOpen}
        onClose={() => setIsValueModalOpen(false)}
        title={`${t('config.createLookupValueTitle')} (${selectedType?.LookupTypeCode || ''})`}
        subtitle="Add a selectable value option to this lookup dictionary"
        icon={List}
        accentStrip="brand"
        maxWidth="480px"
        onSubmit={handleCreateValue}
        submitting={submitting}
        submitText={t('config.newLookupValueBtn')}
        cancelText={t('common.cancel')}
        error={error}
      >
        <FormField label={t('config.thValueCode')} required icon={List}>
          <input
            type="text"
            className="form-control"
            required
            placeholder="e.g. HIGH"
            value={valueForm.lookupValueCode}
            onChange={(e) => setValueForm({ ...valueForm, lookupValueCode: e.target.value.toUpperCase() })}
            style={{ fontFamily: 'monospace' }}
          />
        </FormField>
        <FormField label={t('config.thValueName')} required>
          <input
            type="text"
            className="form-control"
            required
            placeholder="e.g. High Priority"
            value={valueForm.lookupValueName}
            onChange={(e) => setValueForm({ ...valueForm, lookupValueName: e.target.value })}
          />
        </FormField>
        <FormField label={t('config.thDisplayOrder')} hint="Numeric sorting index">
          <input
            type="number"
            className="form-control"
            value={valueForm.displayOrder}
            onChange={(e) => setValueForm({ ...valueForm, displayOrder: parseInt(e.target.value, 10) || 0 })}
          />
        </FormField>
      </ModalCard>
    </div>
  );
}
