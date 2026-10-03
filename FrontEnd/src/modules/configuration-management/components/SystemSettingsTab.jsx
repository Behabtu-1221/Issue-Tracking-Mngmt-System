import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit3, Trash2, Sliders, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import configApi from '../api/configApi';
import { DATA_TYPES } from '../constants/configConstants';

export default function SystemSettingsTab() {
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
    if (window.confirm('Are you sure you want to delete this setting?')) {
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
            placeholder="Search settings by key or description..."
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
          <Plus size={16} /> New System Setting
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '8px', overflowX: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <RefreshCw className="animate-spin" size={24} style={{ marginBottom: '12px' }} />
            <p>Loading system settings...</p>
          </div>
        ) : settings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <Sliders size={36} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <p>No system settings found matching filter.</p>
          </div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Setting Key</th>
                <th>Category</th>
                <th>Data Type</th>
                <th>Setting Value</th>
                <th>Description</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
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
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleOpenModal(item)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid var(--glass-border)',
                          borderRadius: '6px',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          cursor: 'pointer',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.SystemSettingID)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          borderRadius: '6px',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          cursor: 'pointer',
                          color: 'var(--color-danger)'
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="glass-panel modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '540px', padding: '28px', background: 'var(--bg-secondary)' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>
              {editingItem ? 'Edit System Setting' : 'Create System Setting'}
            </h3>

            {error && (
              <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', color: 'var(--color-danger)', fontSize: '0.85rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Category Code</label>
                  <input
                    type="text"
                    required
                    value={formData.categoryCode}
                    onChange={(e) => setFormData({ ...formData, categoryCode: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', background: 'var(--color-elevated)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'var(--color-text)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Data Type</label>
                  <select
                    value={formData.dataType}
                    onChange={(e) => setFormData({ ...formData, dataType: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', background: 'var(--color-elevated)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'var(--color-text)' }}
                  >
                    {DATA_TYPES.map((dt) => (
                      <option key={dt} value={dt} style={{ background: 'var(--bg-secondary)' }}>{dt}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Setting Key</label>
                <input
                  type="text"
                  required
                  disabled={!!editingItem}
                  placeholder="e.g. SYSTEM_DEFAULT_TIMEZONE"
                  value={formData.settingKey}
                  onChange={(e) => setFormData({ ...formData, settingKey: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', background: 'var(--color-elevated)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'var(--color-text)', fontFamily: 'monospace' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Setting Value</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Enter setting value..."
                  value={formData.settingValue}
                  onChange={(e) => setFormData({ ...formData, settingValue: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', background: 'var(--color-elevated)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'var(--color-text)', fontFamily: 'monospace' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Help text for administrators..."
                  style={{ width: '100%', padding: '10px 14px', background: 'var(--color-elevated)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'var(--color-text)' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '10px 18px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'var(--color-text)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: '10px 20px', background: 'var(--accent-gradient)', border: 'none', borderRadius: '6px', color: 'white', fontWeight: '600', cursor: 'pointer' }}
                >
                  {submitting ? 'Saving...' : editingItem ? 'Update Setting' : 'Create Setting'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
