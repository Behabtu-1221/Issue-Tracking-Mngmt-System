import React, { useState, useEffect } from 'react';
import { Hash, Plus, Edit3, Trash2, Zap, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import configApi from '../api/configApi';

export default function NumberSequencesTab() {
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
    if (window.confirm('Delete this number sequence generator?')) {
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
          <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>Auto-Numbering Sequences</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Generates unique formatted document & entity tracking numbers (e.g. Ticket IDs, Invoices).</p>
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
          <Plus size={16} /> New Sequence
        </button>
      </div>

      {generatedResult && (
        <div style={{ padding: '14px 18px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--border-radius-sm)', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--color-success)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle size={20} />
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Generated Number: </span>
              <strong style={{ fontFamily: 'monospace', fontSize: '1.1rem', color: 'white' }}>{generatedResult.value}</strong>
            </div>
          </div>
          <button onClick={() => setGeneratedResult(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}>Dismiss</button>
        </div>
      )}

      <div className="glass-panel" style={{ padding: '8px', overflowX: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <RefreshCw className="animate-spin" size={24} style={{ marginBottom: '12px' }} />
            <p>Loading number sequences...</p>
          </div>
        ) : sequences.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <Hash size={36} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <p>No number sequences configured.</p>
          </div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Sequence Code</th>
                <th>Prefix</th>
                <th>Next Number</th>
                <th>Suffix</th>
                <th>Formatted Preview</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
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
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleGenerateNext(item.NumberSequenceID)}
                        style={{
                          background: 'var(--accent-gradient-cyan)',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          color: 'white',
                          fontSize: '0.8rem',
                          fontWeight: '600'
                        }}
                        title="Generate Next ID"
                      >
                        <Zap size={14} /> Next
                      </button>
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
                        onClick={() => handleDelete(item.NumberSequenceID)}
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
          <div className="glass-panel modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '520px', padding: '28px', background: 'var(--bg-secondary)' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>
              {editingItem ? 'Edit Number Sequence' : 'Create Number Sequence'}
            </h3>

            {error && (
              <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', color: 'var(--color-danger)', fontSize: '0.85rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Sequence Code</label>
                <input
                  type="text"
                  required
                  disabled={!!editingItem}
                  placeholder="e.g. SEQ_INCIDENT_NUMBER"
                  value={formData.sequenceCode}
                  onChange={(e) => setFormData({ ...formData, sequenceCode: e.target.value.toUpperCase() })}
                  style={{ width: '100%', padding: '10px 14px', background: 'rgba(10, 12, 22, 0.5)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'white', fontFamily: 'monospace' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Prefix</label>
                  <input
                    type="text"
                    placeholder="e.g. INC-"
                    value={formData.prefix}
                    onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', background: 'rgba(10, 12, 22, 0.5)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'white', fontFamily: 'monospace' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Suffix</label>
                  <input
                    type="text"
                    placeholder="e.g. -2026"
                    value={formData.suffix}
                    onChange={(e) => setFormData({ ...formData, suffix: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', background: 'rgba(10, 12, 22, 0.5)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'white', fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Next Number</label>
                  <input
                    type="number"
                    required
                    value={formData.nextNumber}
                    onChange={(e) => setFormData({ ...formData, nextNumber: parseInt(e.target.value, 10) || 1 })}
                    style={{ width: '100%', padding: '10px 14px', background: 'rgba(10, 12, 22, 0.5)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'white' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Increment</label>
                  <input
                    type="number"
                    required
                    value={formData.incrementValue}
                    onChange={(e) => setFormData({ ...formData, incrementValue: parseInt(e.target.value, 10) || 1 })}
                    style={{ width: '100%', padding: '10px 14px', background: 'rgba(10, 12, 22, 0.5)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'white' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Width</label>
                  <input
                    type="number"
                    required
                    value={formData.numberWidth}
                    onChange={(e) => setFormData({ ...formData, numberWidth: parseInt(e.target.value, 10) || 6 })}
                    style={{ width: '100%', padding: '10px 14px', background: 'rgba(10, 12, 22, 0.5)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'white' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '10px 18px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'white', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: '10px 20px', background: 'var(--accent-gradient)', border: 'none', borderRadius: '6px', color: 'white', fontWeight: '600', cursor: 'pointer' }}
                >
                  {submitting ? 'Saving...' : editingItem ? 'Update Sequence' : 'Create Sequence'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
