import React, { useState, useEffect } from 'react';
import { Flag, Plus, Edit3, Trash2, ToggleLeft, ToggleRight, RefreshCw, AlertCircle } from 'lucide-react';
import configApi from '../api/configApi';

export default function FeatureFlagsTab() {
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
    if (window.confirm('Are you sure you want to delete this feature flag?')) {
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
          <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>Runtime Feature Toggles</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Enable or disable system features dynamically without restarting services.</p>
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
          <Plus size={16} /> New Feature Flag
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '8px', overflowX: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <RefreshCw className="animate-spin" size={24} style={{ marginBottom: '12px' }} />
            <p>Loading feature flags...</p>
          </div>
        ) : flags.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <Flag size={36} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <p>No feature flags configured.</p>
          </div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Flag Code</th>
                <th>Feature Name</th>
                <th>Description</th>
                <th>State</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
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
                      {item.IsEnabled ? 'ENABLED' : 'DISABLED'}
                    </button>
                  </td>
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
                        onClick={() => handleDelete(item.FeatureFlagID)}
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
          <div className="glass-panel modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '500px', padding: '28px', background: 'var(--bg-secondary)' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>
              {editingItem ? 'Edit Feature Flag' : 'Create Feature Flag'}
            </h3>

            {error && (
              <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', color: 'var(--color-danger)', fontSize: '0.85rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Flag Code</label>
                <input
                  type="text"
                  required
                  disabled={!!editingItem}
                  placeholder="e.g. ENABLE_NEW_APPROVAL_WORKFLOW"
                  value={formData.flagCode}
                  onChange={(e) => setFormData({ ...formData, flagCode: e.target.value.toUpperCase() })}
                  style={{ width: '100%', padding: '10px 14px', background: 'var(--color-elevated)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'var(--color-text)', fontFamily: 'monospace' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Feature Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. New Approval Workflow Engine"
                  value={formData.flagName}
                  onChange={(e) => setFormData({ ...formData, flagName: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', background: 'var(--color-elevated)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'var(--color-text)' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Explains what this feature toggle controls..."
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
                  {submitting ? 'Saving...' : editingItem ? 'Update Flag' : 'Create Flag'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
