import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit3, Trash2, Sliders, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import configApi from '../api/configApi';
import { DATA_TYPES } from '../constants/configConstants';
import { ActionButton, ActionGroup } from '../../../components/common/ActionButton';
import { ModalCard } from '../../../components/common/ModalCard';
import { FormField } from '../../../components/common/FormField';

export default function SystemSettingsTab() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    categoryCode: 'GENERAL',
    settingKey: '',
    settingValue: '',
    dataType: 'STRING',
    description: '',
    isEncrypted: false
  });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await configApi.getSystemSettings({ search });
      if (res.data && res.data.status === 'success') {
        setSettings(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [search]);

  const handleOpenModal = (item = null) => {
    setError(null);
    if (item) {
      setEditingItem(item);
      setFormData({
        categoryCode: item.CategoryCode || 'GENERAL',
        settingKey: item.SettingKey,
        settingValue: item.SettingValue,
        dataType: item.DataType || 'STRING',
        description: item.Description || '',
        isEncrypted: !!item.IsEncrypted
      });
    } else {
      setEditingItem(null);
      setFormData({
        categoryCode: 'GENERAL',
        settingKey: '',
        settingValue: '',
        dataType: 'STRING',
        description: '',
        isEncrypted: false
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
        await configApi.updateSystemSetting(editingItem.SystemSettingID, formData);
      } else {
        await configApi.createSystemSetting(formData);
      }
      setIsModalOpen(false);
      fetchSettings();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save system setting');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('config.confirmDeleteSetting'))) {
      try {
        await configApi.deleteSystemSetting(id);
        fetchSettings();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete setting');
      }
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ position: 'relative', flexGrow: 1, maxWidth: '400px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder={t('config.searchSettingsPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--color-elevated)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--border-radius-sm)',
              padding: '10px 14px 10px 40px',
              color: 'var(--text-primary)',
              fontSize: '0.9rem'
            }}
          />
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="btn btn-primary"
        >
          <Plus size={16} /> {t('config.newSettingBtn')}
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '8px', overflowX: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <RefreshCw className="animate-spin" size={24} style={{ marginBottom: '12px' }} />
            <p>{t('config.loadingSettings')}</p>
          </div>
        ) : settings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <Sliders size={36} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <p>{t('config.noSettingsFound')}</p>
          </div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>{t('config.thSettingKey')}</th>
                <th>{t('config.thCategory')}</th>
                <th>{t('config.thDataType')}</th>
                <th>{t('config.thSettingValue')}</th>
                <th>{t('config.thDescription')}</th>
                <th style={{ textAlign: 'right' }}>{t('config.thActions')}</th>
              </tr>
            </thead>
            <tbody>
              {settings.map((item) => (
                <tr key={item.SystemSettingID}>
                  <td style={{ fontFamily: 'monospace', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {item.SettingKey}
                  </td>
                  <td>{item.CategoryCode || 'GENERAL'}</td>
                  <td>
                    <span className={`badge badge-${(item.DataType || 'STRING').toLowerCase()}`}>
                      {item.DataType || 'STRING'}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--accent-secondary)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.IsEncrypted ? '••••••••' : item.SettingValue}
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{item.Description || '—'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <ActionGroup align="right">
                      <ActionButton
                        variant="edit"
                        onClick={() => handleOpenModal(item)}
                        title={t('common.edit')}
                      />
                      <ActionButton
                        variant="delete"
                        onClick={() => handleDelete(item.SystemSettingID)}
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
        title={editingItem ? t('config.editSettingTitle') : t('config.createSettingTitle')}
        subtitle="Manage dynamic global parameters, secrets, and environment behaviors"
        icon={Sliders}
        accentStrip="brand"
        maxWidth="540px"
        onSubmit={handleSubmit}
        submitting={submitting}
        submitText={submitting ? t('common.save') : editingItem ? t('config.updateSettingBtn') : t('config.createSettingBtn')}
        cancelText={t('common.cancel')}
        error={error}
      >
        <div className="form-grid-2">
          <FormField label={t('config.categoryCodeLabel')} required>
            <input
              type="text"
              className="form-control"
              required
              value={formData.categoryCode}
              onChange={(e) => setFormData({ ...formData, categoryCode: e.target.value })}
            />
          </FormField>

          <FormField label={t('config.dataTypeLabel')} required>
            <select
              className="form-control"
              value={formData.dataType}
              onChange={(e) => setFormData({ ...formData, dataType: e.target.value })}
            >
              {DATA_TYPES.map((dt) => (
                <option key={dt} value={dt}>{dt}</option>
              ))}
            </select>
          </FormField>
        </div>

        <FormField label={t('config.settingKeyLabel')} required icon={Sliders}>
          <input
            type="text"
            className="form-control"
            required
            disabled={!!editingItem}
            placeholder="e.g. SYSTEM_DEFAULT_TIMEZONE"
            value={formData.settingKey}
            onChange={(e) => setFormData({ ...formData, settingKey: e.target.value })}
            style={{ fontFamily: 'monospace' }}
          />
        </FormField>

        <FormField label={t('config.settingValueLabel')} required>
          <textarea
            rows={3}
            className="form-control"
            required
            placeholder="Enter setting value..."
            value={formData.settingValue}
            onChange={(e) => setFormData({ ...formData, settingValue: e.target.value })}
            style={{ fontFamily: 'monospace' }}
          />
        </FormField>

        <FormField label={t('config.descriptionLabel')} hint={t('config.descriptionPlaceholder')}>
          <input
            type="text"
            className="form-control"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder={t('config.descriptionPlaceholder')}
          />
        </FormField>
      </ModalCard>
    </div>
  );
}
