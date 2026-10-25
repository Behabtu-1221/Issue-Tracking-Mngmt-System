import React, { useState, useEffect } from 'react';
import { Hash, Plus, Edit3, Trash2, Zap, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import configApi from '../api/configApi';
import { ActionButton, ActionGroup } from '../../../components/common/ActionButton';
import { ModalCard } from '../../../components/common/ModalCard';
import { FormField } from '../../../components/common/FormField';

export default function NumberSequencesTab() {
  const { t } = useTranslation();
  const [sequences, setSequences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatedResult, setGeneratedResult] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    sequenceCode: '',
    prefix: '',
    suffix: '',
    nextNumber: 1,
    incrementValue: 1,
    numberWidth: 6
  });

  const fetchSequences = async () => {
    setLoading(true);
    try {
      const res = await configApi.getNumberSequences();
      if (res.data && res.data.status === 'success') {
        setSequences(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load number sequences:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSequences();
  }, []);

  const handleGenerateNext = async (id) => {
    try {
      const res = await configApi.generateNextNumber(id);
      if (res.data && res.data.status === 'success') {
        const nextVal = res.data.data.nextNumber || res.data.data;
        setGeneratedResult({ id, value: nextVal });
        fetchSequences();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate next number');
    }
  };

  const handleOpenModal = (item = null) => {
    setError(null);
    if (item) {
      setEditingItem(item);
      setFormData({
        sequenceCode: item.SequenceCode,
        prefix: item.Prefix || '',
        suffix: item.Suffix || '',
        nextNumber: item.NextNumber || 1,
        incrementValue: item.IncrementValue || 1,
        numberWidth: item.NumberWidth || 6
      });
    } else {
      setEditingItem(null);
      setFormData({
        sequenceCode: '',
        prefix: '',
        suffix: '',
        nextNumber: 1,
        incrementValue: 1,
        numberWidth: 6
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
        await configApi.updateNumberSequence(editingItem.NumberSequenceID, formData);
      } else {
        await configApi.createNumberSequence(formData);
      }
      setIsModalOpen(false);
      fetchSequences();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save number sequence');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('config.confirmDeleteSequence'))) {
      try {
        await configApi.deleteNumberSequence(id);
        fetchSequences();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete number sequence');
      }
    }
  };

  const formatPreview = (item) => {
    const num = (item.NextNumber || 1).toString().padStart(item.NumberWidth || 6, '0');
    return `${item.Prefix || ''}${num}${item.Suffix || ''}`;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{t('config.sequencesSectionTitle')}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t('config.sequencesSectionDesc')}</p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="btn btn-primary"
        >
          <Plus size={16} /> {t('config.newSequenceBtn')}
        </button>
      </div>

      {generatedResult && (
        <div style={{ padding: '14px 18px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--border-radius-sm)', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--color-success)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle size={20} />
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t('config.generatedNumberLabel')}: </span>
              <strong style={{ fontFamily: 'monospace', fontSize: '1.1rem', color: 'white' }}>{generatedResult.value}</strong>
            </div>
          </div>
          <button onClick={() => setGeneratedResult(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}>{t('config.dismissBtn')}</button>
        </div>
      )}

      <div className="glass-panel" style={{ padding: '8px', overflowX: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <RefreshCw className="animate-spin" size={24} style={{ marginBottom: '12px' }} />
            <p>{t('config.loadingSequences')}</p>
          </div>
        ) : sequences.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <Hash size={36} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <p>{t('config.noSequencesFound')}</p>
          </div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>{t('config.thSequenceCode')}</th>
                <th>{t('config.thPrefix')}</th>
                <th>{t('config.thNextNumber')}</th>
                <th>{t('config.thSuffix')}</th>
                <th>{t('config.thPreview')}</th>
                <th style={{ textAlign: 'right' }}>{t('config.thActions')}</th>
              </tr>
            </thead>
            <tbody>
              {sequences.map((item) => (
                <tr key={item.NumberSequenceID}>
                  <td style={{ fontFamily: 'monospace', fontWeight: '600', color: 'var(--accent-secondary)' }}>
                    {item.SequenceCode}
                  </td>
                  <td style={{ fontFamily: 'monospace' }}>{item.Prefix || '—'}</td>
                  <td style={{ fontFamily: 'monospace', fontWeight: '600' }}>{item.NextNumber}</td>
                  <td style={{ fontFamily: 'monospace' }}>{item.Suffix || '—'}</td>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: '700', padding: '4px 10px', background: 'rgba(138, 75, 255, 0.15)', border: '1px solid rgba(138, 75, 255, 0.3)', borderRadius: '6px', color: 'var(--text-primary)' }}>
                      {formatPreview(item)}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <ActionGroup align="right">
                      <ActionButton
                        variant="indigo"
                        icon={<Zap size={14} />}
                        label={t('config.generateNextBtn')}
                        onClick={() => handleGenerateNext(item.NumberSequenceID)}
                        title={t('config.generateNextBtn')}
                      />
                      <ActionButton
                        variant="edit"
                        onClick={() => handleOpenModal(item)}
                        title={t('common.edit')}
                      />
                      <ActionButton
                        variant="delete"
                        onClick={() => handleDelete(item.NumberSequenceID)}
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
        title={editingItem ? t('config.editSequenceTitle') : t('config.createSequenceTitle')}
        subtitle={t('config.sequencesSectionDesc')}
        icon={Hash}
        accentStrip="brand"
        maxWidth="540px"
        onSubmit={handleSubmit}
        submitting={submitting}
        submitText={submitting ? t('common.save') : editingItem ? t('config.updateSequenceBtn') : t('config.createSequenceBtn')}
        cancelText={t('common.cancel')}
        error={error}
      >
        <FormField label={t('config.sequenceCodeLabel')} required icon={Hash}>
          <input
            type="text"
            className="form-control"
            required
            disabled={!!editingItem}
            placeholder="e.g. SEQ_INCIDENT_NUMBER"
            value={formData.sequenceCode}
            onChange={(e) => setFormData({ ...formData, sequenceCode: e.target.value.toUpperCase() })}
            style={{ fontFamily: 'monospace' }}
          />
        </FormField>

        <div className="form-grid-2">
          <FormField label={t('config.prefixLabel')} hint="Prepended text prefix">
            <input
              type="text"
              className="form-control"
              placeholder="e.g. INC-"
              value={formData.prefix}
              onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
              style={{ fontFamily: 'monospace' }}
            />
          </FormField>
          <FormField label={t('config.suffixLabel')} hint="Appended text suffix">
            <input
              type="text"
              className="form-control"
              placeholder="e.g. -2026"
              value={formData.suffix}
              onChange={(e) => setFormData({ ...formData, suffix: e.target.value })}
              style={{ fontFamily: 'monospace' }}
            />
          </FormField>
        </div>

        <div className="form-grid-3">
          <FormField label={t('config.nextNumberLabel')} required>
            <input
              type="number"
              className="form-control"
              required
              value={formData.nextNumber}
              onChange={(e) => setFormData({ ...formData, nextNumber: parseInt(e.target.value, 10) || 1 })}
            />
          </FormField>
          <FormField label={t('config.incrementLabel')} required>
            <input
              type="number"
              className="form-control"
              required
              value={formData.incrementValue}
              onChange={(e) => setFormData({ ...formData, incrementValue: parseInt(e.target.value, 10) || 1 })}
            />
          </FormField>
          <FormField label={t('config.widthLabel')} required hint="Padding digits">
            <input
              type="number"
              className="form-control"
              required
              value={formData.numberWidth}
              onChange={(e) => setFormData({ ...formData, numberWidth: parseInt(e.target.value, 10) || 6 })}
            />
          </FormField>
        </div>
      </ModalCard>
    </div>
  );
}
