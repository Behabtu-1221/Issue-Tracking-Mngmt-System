import React, { useState, useEffect } from 'react';
import { Flag, Plus, Edit3, Trash2, ToggleLeft, ToggleRight, RefreshCw, AlertCircle } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import configApi from '../api/configApi';
import { ActionButton, ActionGroup } from '../../../components/common/ActionButton';
import { ModalCard } from '../../../components/common/ModalCard';
import { FormField } from '../../../components/common/FormField';

export default function FeatureFlagsTab() {
  const { t } = useTranslation();
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    flagCode: '',
    flagName: '',
    description: '',
    isEnabled: true
  });

  const fetchFlags = async () => {
    setLoading(true);
    try {
      const res = await configApi.getFeatureFlags();
      if (res.data && res.data.status === 'success') {
        setFlags(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load feature flags:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  const handleToggle = async (flagId) => {
    try {
      await configApi.toggleFeatureFlag(flagId);
      setFlags((prev) =>
        prev.map((item) =>
          item.FeatureFlagID === flagId ? { ...item, IsEnabled: !item.IsEnabled } : item
        )
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle feature flag');
    }
  };

  const handleOpenModal = (item = null) => {
    setError(null);
    if (item) {
      setEditingItem(item);
      setFormData({
        flagCode: item.FlagCode,
        flagName: item.FlagName,
        description: item.Description || '',
        isEnabled: !!item.IsEnabled
      });
    } else {
      setEditingItem(null);
      setFormData({
        flagCode: '',
        flagName: '',
        description: '',
        isEnabled: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (editingItem) {
        await configApi.updateFeatureFlag(editingItem.FeatureFlagID, formData);
      } else {
        await configApi.createFeatureFlag(formData);
      }
      setIsModalOpen(false);
      fetchFlags();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save feature flag');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('config.confirmDeleteFlag'))) {
      try {
        await configApi.deleteFeatureFlag(id);
        fetchFlags();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete feature flag');
      }
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{t('config.flagsSectionTitle')}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t('config.flagsSectionDesc')}</p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="btn btn-primary"
        >
          <Plus size={16} /> {t('config.newFlagBtn')}
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '8px', overflowX: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <RefreshCw className="animate-spin" size={24} style={{ marginBottom: '12px' }} />
            <p>{t('config.loadingFlags')}</p>
          </div>
        ) : flags.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <Flag size={36} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <p>{t('config.noFlagsFound')}</p>
          </div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>{t('config.thFlagCode')}</th>
                <th>{t('config.thFeatureName')}</th>
                <th>{t('config.thDescription')}</th>
                <th>{t('config.thState')}</th>
                <th style={{ textAlign: 'right' }}>{t('config.thActions')}</th>
              </tr>
            </thead>
            <tbody>
              {flags.map((item) => (
                <tr key={item.FeatureFlagID}>
                  <td style={{ fontFamily: 'monospace', fontWeight: '600', color: 'var(--accent-secondary)' }}>
                    {item.FlagCode}
                  </td>
                  <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{item.FlagName}</td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{item.Description || '—'}</td>
                  <td>
                    <button
                      onClick={() => handleToggle(item.FeatureFlagID)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        background: item.IsEnabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        border: `1px solid ${item.IsEnabled ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                        color: item.IsEnabled ? 'var(--color-success)' : 'var(--color-danger)',
                        fontWeight: '600',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)'
                      }}
                    >
                      {item.IsEnabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                      {item.IsEnabled ? t('config.stateEnabled') : t('config.stateDisabled')}
                    </button>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <ActionGroup align="right">
                      <ActionButton
                        variant="edit"
                        onClick={() => handleOpenModal(item)}
                        title={t('common.edit')}
                      />
                      <ActionButton
                        variant="delete"
                        onClick={() => handleDelete(item.FeatureFlagID)}
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

      <ModalCard
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? t('config.editFlagTitle') : t('config.createFlagTitle')}
        subtitle={t('config.flagsSectionDesc')}
        icon={Flag}
        accentStrip="brand"
        maxWidth="520px"
        onSubmit={handleSubmit}
        submitting={submitting}
        submitText={submitting ? t('common.save') : editingItem ? t('config.updateFlagBtn') : t('config.createFlagBtn')}
        cancelText={t('common.cancel')}
        error={error}
      >
        <FormField label={t('config.flagCodeLabel')} required icon={Flag}>
          <input
            type="text"
            className="form-control"
            required
            disabled={!!editingItem}
            placeholder="e.g. ENABLE_NEW_APPROVAL_WORKFLOW"
            value={formData.flagCode}
            onChange={(e) => setFormData({ ...formData, flagCode: e.target.value.toUpperCase() })}
            style={{ fontFamily: 'monospace' }}
          />
        </FormField>

        <FormField label={t('config.featureNameLabel')} required>
          <input
            type="text"
            className="form-control"
            required
            placeholder="e.g. New Approval Workflow Engine"
            value={formData.flagName}
            onChange={(e) => setFormData({ ...formData, flagName: e.target.value })}
          />
        </FormField>

        <FormField label={t('config.descriptionLabel')} hint={t('config.flagDescPlaceholder')}>
          <input
            type="text"
            className="form-control"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder={t('config.flagDescPlaceholder')}
          />
        </FormField>
      </ModalCard>
    </div>
  );
}
