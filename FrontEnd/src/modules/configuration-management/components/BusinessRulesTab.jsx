import React, { useState, useEffect } from 'react';
import { Cpu, Plus, Edit3, Trash2, ToggleLeft, ToggleRight, RefreshCw, AlertCircle } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import configApi from '../api/configApi';
import { ActionButton, ActionGroup } from '../../../components/common/ActionButton';
import { ModalCard } from '../../../components/common/ModalCard';
import { FormField } from '../../../components/common/FormField';

export default function BusinessRulesTab() {
  const { t } = useTranslation();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    ruleCode: '',
    ruleName: '',
    ruleExpression: '',
    isActive: true
  });

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await configApi.getBusinessRules();
      if (res.data && res.data.status === 'success') {
        setRules(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load business rules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleToggle = async (ruleId) => {
    try {
      await configApi.toggleBusinessRule(ruleId);
      setRules((prev) =>
        prev.map((item) =>
          item.BusinessRuleID === ruleId ? { ...item, IsActive: !item.IsActive } : item
        )
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle business rule');
    }
  };

  const handleOpenModal = (item = null) => {
    setError(null);
    if (item) {
      setEditingItem(item);
      setFormData({
        ruleCode: item.RuleCode,
        ruleName: item.RuleName,
        ruleExpression: item.RuleExpression || '',
        isActive: !!item.IsActive
      });
    } else {
      setEditingItem(null);
      setFormData({
        ruleCode: '',
        ruleName: '',
        ruleExpression: '',
        isActive: true
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
        await configApi.updateBusinessRule(editingItem.BusinessRuleID, formData);
      } else {
        await configApi.createBusinessRule(formData);
      }
      setIsModalOpen(false);
      fetchRules();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save business rule');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('config.confirmDeleteRule'))) {
      try {
        await configApi.deleteBusinessRule(id);
        fetchRules();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete business rule');
      }
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{t('config.rulesSectionTitle')}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t('config.rulesSectionDesc')}</p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="btn btn-primary"
        >
          <Plus size={16} /> {t('config.newRuleBtn')}
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '8px', overflowX: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <RefreshCw className="animate-spin" size={24} style={{ marginBottom: '12px' }} />
            <p>{t('config.loadingRules')}</p>
          </div>
        ) : rules.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <Cpu size={36} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <p>{t('config.noRulesFound')}</p>
          </div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>{t('config.thRuleCode')}</th>
                <th>{t('config.thRuleName')}</th>
                <th>{t('config.thExpression')}</th>
                <th>{t('common.status')}</th>
                <th style={{ textAlign: 'right' }}>{t('config.thActions')}</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((item) => (
                <tr key={item.BusinessRuleID}>
                  <td style={{ fontFamily: 'monospace', fontWeight: '600', color: 'var(--accent-secondary)' }}>
                    {item.RuleCode}
                  </td>
                  <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{item.RuleName}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.RuleExpression}
                  </td>
                  <td>
                    <button
                      onClick={() => handleToggle(item.BusinessRuleID)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        background: item.IsActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        border: `1px solid ${item.IsActive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                        color: item.IsActive ? 'var(--color-success)' : 'var(--color-danger)',
                        fontWeight: '600',
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      {item.IsActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                      {item.IsActive ? t('common.active') : t('common.inactive')}
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
                        onClick={() => handleDelete(item.BusinessRuleID)}
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
        title={editingItem ? t('config.editRuleTitle') : t('config.createRuleTitle')}
        subtitle={t('config.rulesSectionDesc')}
        icon={Cpu}
        accentStrip="brand"
        maxWidth="540px"
        onSubmit={handleSubmit}
        submitting={submitting}
        submitText={submitting ? t('common.save') : editingItem ? t('config.updateRuleBtn') : t('config.createRuleBtn')}
        cancelText={t('common.cancel')}
        error={error}
      >
        <FormField label={t('config.ruleCodeLabel')} required icon={Cpu}>
          <input
            type="text"
            className="form-control"
            required
            disabled={!!editingItem}
            placeholder="e.g. HIGH_PRIORITY_ESCALATION"
            value={formData.ruleCode}
            onChange={(e) => setFormData({ ...formData, ruleCode: e.target.value.toUpperCase() })}
            style={{ fontFamily: 'monospace' }}
          />
        </FormField>

        <FormField label={t('config.ruleNameLabel')} required>
          <input
            type="text"
            className="form-control"
            required
            placeholder="e.g. High Priority SLA Escalation"
            value={formData.ruleName}
            onChange={(e) => setFormData({ ...formData, ruleName: e.target.value })}
          />
        </FormField>

        <FormField label={t('config.ruleExpressionLabel')} required hint="Boolean expression evaluated during automatic routing">
          <textarea
            rows={4}
            className="form-control"
            required
            placeholder="e.g. priority == 'HIGH' && responseTime > 30"
            value={formData.ruleExpression}
            onChange={(e) => setFormData({ ...formData, ruleExpression: e.target.value })}
            style={{ fontFamily: 'monospace' }}
          />
        </FormField>
      </ModalCard>
    </div>
  );
}
