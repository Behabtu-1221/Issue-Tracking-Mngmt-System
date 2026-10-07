import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Edit3,
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Tag,
  FileText,
  MoveHorizontal
} from 'lucide-react';
import issueManagementApi from '../api/issueManagementApi';
import ConfirmDialogModal from '../../../components/common/ConfirmDialogModal';
import AlertDialogModal from '../../../components/common/AlertDialogModal';
import { requestSchemas } from '../../../validation';
import { FormField } from '../../../components/common/FormField';
import { useTranslation } from '../../../i18n';

export const KnownIssuesTab = () => {
  const { t } = useTranslation();
  const [knownIssues, setKnownIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    Title: '',
    Symptoms: '',
    Workaround: '',
    PermanentSolution: '',
    CategoryCode: '',
    SearchKeywords: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState(null);

  // Glass Dialog Modals State
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'error' });

  const showAlert = (title, message, type = 'error') => {
    setAlertConfig({ isOpen: true, title, message, type });
  };

  useEffect(() => {
    fetchKnownIssues();
  }, []);

  const fetchKnownIssues = async (query = '') => {
    try {
      setLoading(true);
      const res = await issueManagementApi.getKnownIssues({ search: query || undefined });
      const issues = res.data?.data?.knownIssues || res.data?.data || [];
      setKnownIssues(Array.isArray(issues) ? issues : []);
    } catch (err) {
      console.error('Failed to fetch known issues:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchKnownIssues(search);
  };

  const handleFieldChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: null }));
    }
    if (serverError) {
      setServerError(null);
    }
  };

  const openCreateForm = () => {
    setEditingId(null);
    setForm({
      Title: '',
      Symptoms: '',
      Workaround: '',
      PermanentSolution: '',
      CategoryCode: '',
      SearchKeywords: ''
    });
    setFieldErrors({});
    setServerError(null);
    setShowForm(true);
  };

  const openEditForm = (ki) => {
    setEditingId(ki.KnownIssueID);
    setForm({
      Title: ki.Title || '',
      Symptoms: ki.Symptoms || '',
      Workaround: ki.Workaround || '',
      PermanentSolution: ki.PermanentSolution || '',
      CategoryCode: ki.CategoryCode || '',
      SearchKeywords: ki.SearchKeywords || ''
    });
    setFieldErrors({});
    setServerError(null);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

    const validation = requestSchemas.knownIssueForm(form);

    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await issueManagementApi.updateKnownIssue(editingId, validation.sanitized);
      } else {
        await issueManagementApi.createKnownIssue(validation.sanitized);
      }
      setShowForm(false);
      setEditingId(null);
      fetchKnownIssues(search);
    } catch (err) {
      setServerError(err.response?.data?.message || 'Failed to save known issue');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (ki) => {
    setConfirmConfig({
      isOpen: true,
      title: t('knownIssues.deleteTitle', 'Remove Knowledge Article'),
      message: t('knownIssues.deleteConfirm', { title: ki.Title }, `Are you sure you want to delete knowledge base article "${ki.Title}"? This action cannot be undone.`),
      type: 'danger',
      confirmText: t('knownIssues.deleteButton', 'Delete Article'),
      onConfirm: async () => {
        try {
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          await issueManagementApi.deleteKnownIssue(ki.KnownIssueID);
          fetchKnownIssues(search);
        } catch (err) {
          const msg = err.response?.data?.message || 'Failed to delete known issue';
          showAlert(t('knownIssues.actionRestricted', 'Action Restricted'), msg, 'error');
        }
      }
    });
  };

  const baseInputStyle = (hasError) => ({
    width: '100%',
    padding: '10px 14px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: hasError ? '1px solid var(--color-danger, #ef4444)' : '1px solid var(--glass-border)',
    borderRadius: '8px',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box'
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Search Bar & Add Button */}
      <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: 'var(--border-radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', flex: '1', minWidth: '240px' }}>
          <div style={{ position: 'relative', flex: '1' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder={t('knownIssues.searchPlaceholder', 'Search knowledge base by title, symptoms, keywords...')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ ...baseInputStyle(false), paddingLeft: '38px' }}
            />
          </div>
          <button type="submit" className="btn-secondary" style={{ padding: '9px 16px' }}>{t('common.search', 'Search')}</button>
        </form>
        <button className="btn-primary" onClick={openCreateForm} style={{ padding: '9px 18px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={16} /> {t('knownIssues.addArticle', 'Add Knowledge Article')}
        </button>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--border-radius-md)', border: '1px solid rgba(138, 75, 255, 0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Lightbulb size={18} style={{ color: '#f59e0b' }} />
              {editingId ? t('knownIssues.editArticle', 'Edit Knowledge Article') : t('knownIssues.newArticle', 'New Knowledge Article')}
            </h3>
            <button onClick={() => setShowForm(false)} style={{ padding: '6px', borderRadius: '6px', border: '1px solid var(--glass-border)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          </div>

          {serverError && (
            <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#f87171', fontSize: '0.85rem' }}>
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* Title */}
              <div style={{ gridColumn: '1 / -1' }}>
                <FormField
                  label={t('knownIssues.articleTitle', 'Article Title')}
                  id="Title"
                  required
                  icon={BookOpen}
                  error={fieldErrors.Title}
                  helpText={t('knownIssues.articleTitleHelp', 'Clear, descriptive title for quick recognition (3-250 characters).')}
                >
                  <input
                    id="Title"
                    type="text"
                    value={form.Title}
                    onChange={(e) => handleFieldChange('Title', e.target.value)}
                    placeholder={t('knownIssues.articleTitlePlaceholder', 'e.g. VPN Disconnection on Windows 11 after Sleep')}
                    style={baseInputStyle(Boolean(fieldErrors.Title))}
                  />
                </FormField>
              </div>

              {/* Symptoms */}
              <div>
                <FormField
                  label={t('knownIssues.symptoms', 'Observable Symptoms')}
                  id="Symptoms"
                  required
                  icon={AlertCircle}
                  error={fieldErrors.Symptoms}
                  helpText={t('knownIssues.symptomsHelp', 'Describe the errors, logs, or behavioral symptoms (min 5 characters).')}
                >
                  <textarea
                    id="Symptoms"
                    rows={3}
                    value={form.Symptoms}
                    onChange={(e) => handleFieldChange('Symptoms', e.target.value)}
                    placeholder={t('knownIssues.symptomsPlaceholder', 'Observable symptoms of this known issue...')}
                    style={{ ...baseInputStyle(Boolean(fieldErrors.Symptoms)), resize: 'vertical' }}
                  />
                </FormField>
              </div>

              {/* Workaround */}
              <div>
                <FormField
                  label={t('knownIssues.workaround', 'Temporary Workaround')}
                  id="Workaround"
                  icon={CheckCircle2}
                  error={fieldErrors.Workaround}
                  helpText={t('knownIssues.workaroundHelp', 'Immediate mitigation steps for users before permanent fix.')}
                >
                  <textarea
                    id="Workaround"
                    rows={3}
                    value={form.Workaround}
                    onChange={(e) => handleFieldChange('Workaround', e.target.value)}
                    placeholder={t('knownIssues.workaroundPlaceholder', 'Temporary workaround instructions...')}
                    style={{ ...baseInputStyle(Boolean(fieldErrors.Workaround)), resize: 'vertical' }}
                  />
                </FormField>
              </div>

              {/* Permanent Solution */}
              <div style={{ gridColumn: '1 / -1' }}>
                <FormField
                  label={t('knownIssues.permanentSolution', 'Permanent Solution / Fix Procedure')}
                  id="PermanentSolution"
                  icon={ShieldCheck}
                  error={fieldErrors.PermanentSolution}
                  helpText={t('knownIssues.permanentSolutionHelp', 'Final engineering resolution or root cause patch steps.')}
                >
                  <textarea
                    id="PermanentSolution"
                    rows={3}
                    value={form.PermanentSolution}
                    onChange={(e) => handleFieldChange('PermanentSolution', e.target.value)}
                    placeholder={t('knownIssues.permanentSolutionPlaceholder', 'Permanent fix procedure...')}
                    style={{ ...baseInputStyle(Boolean(fieldErrors.PermanentSolution)), resize: 'vertical' }}
                  />
                </FormField>
              </div>

              {/* Category Code */}
              <div>
                <FormField
                  label={t('knownIssues.categoryCode', 'Category Code')}
                  id="CategoryCode"
                  icon={Tag}
                  error={fieldErrors.CategoryCode}
                  helpText={t('knownIssues.categoryCodeHelp', 'Functional domain (e.g. IT, FACILITIES, NETWORK).')}
                >
                  <input
                    id="CategoryCode"
                    type="text"
                    value={form.CategoryCode}
                    onChange={(e) => handleFieldChange('CategoryCode', e.target.value.toUpperCase())}
                    placeholder="e.g. FACILITIES, IT, NETWORK"
                    style={baseInputStyle(Boolean(fieldErrors.CategoryCode))}
                  />
                </FormField>
              </div>

              {/* Search Keywords */}
              <div>
                <FormField
                  label={t('knownIssues.searchKeywords', 'Search Keywords')}
                  id="SearchKeywords"
                  icon={Search}
                  error={fieldErrors.SearchKeywords}
                  helpText={t('knownIssues.searchKeywordsHelp', 'Comma-separated keywords for user searches.')}
                >
                  <input
                    id="SearchKeywords"
                    type="text"
                    value={form.SearchKeywords}
                    onChange={(e) => handleFieldChange('SearchKeywords', e.target.value)}
                    placeholder={t('knownIssues.searchKeywordsPlaceholder', 'e.g. vpn, sleep, wifi, driver, adapter')}
                    style={baseInputStyle(Boolean(fieldErrors.SearchKeywords))}
                  />
                </FormField>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '10px' }}>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1px solid var(--glass-border)',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={submitting}
                style={{ padding: '10px 24px' }}
              >
                {submitting ? t('knownIssues.saving', 'Saving...') : editingId ? t('knownIssues.updateArticle', 'Update Article') : t('knownIssues.createArticle', 'Create Article')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Known Issues List */}
      <div className="glass-panel" style={{ borderRadius: 'var(--border-radius-md)', overflow: 'hidden' }}>
        {/* Table Subheader with Count & Horizontal Scroll Indicator */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 20px',
          borderBottom: '1px solid var(--glass-border)',
          background: 'rgba(255, 255, 255, 0.02)',
          fontSize: '0.82rem',
          color: 'var(--text-muted)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{t('knownIssues.title', 'Knowledge Base Articles')}</span>
            <span style={{
              background: 'rgba(99, 102, 241, 0.12)',
              color: 'var(--accent-primary)',
              padding: '2px 8px',
              borderRadius: '10px',
              fontSize: '0.75rem',
              fontWeight: 700
            }}>
              {knownIssues.length} {knownIssues.length === 1 ? t('knownIssues.article', 'article') : t('knownIssues.articles', 'articles')}
            </span>
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            background: 'var(--bg-tertiary)',
            padding: '4px 10px',
            borderRadius: '6px',
            border: '1px solid var(--glass-border)'
          }}>
            <MoveHorizontal size={13} color="var(--accent-primary)" />
            <span>{t('knownIssues.scrollEnabled', 'Horizontal Scroll Enabled')}</span>
          </div>
        </div>

        {/* Scrollable Container with Horizontal Scrollbar */}
        <div className="table-scroll-container" tabIndex={0} role="region" aria-label="Knowledge Base Articles List">
          <div style={{ minWidth: '760px' }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>{t('knownIssues.loading', 'Loading knowledge base articles...')}</div>
            ) : knownIssues.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>{t('knownIssues.empty', 'No knowledge base articles found.')}</div>
            ) : (
              knownIssues.map((ki) => {
                const isExpanded = expandedId === ki.KnownIssueID;
                return (
                  <div key={ki.KnownIssueID} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <div
                      onClick={() => setExpandedId(isExpanded ? null : ki.KnownIssueID)}
                      style={{
                        padding: '16px 20px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'background 0.2s ease'
                      }}
                      className="table-row-hover"
                    >
                      <div style={{ flex: 1, minWidth: 0, paddingRight: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                          <BookOpen size={16} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                          <span style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.95rem' }}>{ki.Title}</span>
                          {ki.CategoryCode && (
                            <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '600', backgroundColor: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>
                              {ki.CategoryCode}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginLeft: '26px' }}>
                          {ki.Symptoms?.substring(0, 140)}{ki.Symptoms?.length > 140 ? '...' : ''}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        <button onClick={(e) => { e.stopPropagation(); openEditForm(ki); }} style={{ padding: '6px', borderRadius: '6px', border: '1px solid var(--glass-border)', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', cursor: 'pointer' }}>
                          <Edit3 size={14} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(ki); }} style={{ padding: '6px', borderRadius: '6px', border: '1px solid var(--glass-border)', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#f87171', cursor: 'pointer' }}>
                          <Trash2 size={14} />
                        </button>
                        {isExpanded ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div style={{ padding: '0 20px 20px 46px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                          {ki.Workaround && (
                            <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
                              <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#f59e0b', marginBottom: '6px', textTransform: 'uppercase' }}>{t('knownIssues.workaround', 'Workaround')}</div>
                              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>{ki.Workaround}</p>
                            </div>
                          )}
                          {ki.PermanentSolution && (
                            <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: 'rgba(34, 197, 94, 0.06)', border: '1px solid rgba(34, 197, 94, 0.15)' }}>
                              <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#4ade80', marginBottom: '6px', textTransform: 'uppercase' }}>{t('knownIssues.permanentSolution', 'Permanent Solution')}</div>
                              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>{ki.PermanentSolution}</p>
                            </div>
                          )}
                        </div>
                        {ki.SearchKeywords && (
                          <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {ki.SearchKeywords.split(',').map((kw, i) => (
                              <span key={i} style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '600', backgroundColor: 'rgba(138, 75, 255, 0.1)', color: 'var(--accent-primary)', border: '1px solid rgba(138, 75, 255, 0.2)' }}>
                                {kw.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Shared Glass Modals */}
      <ConfirmDialogModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        confirmText={confirmConfig.confirmText}
        onConfirm={confirmConfig.onConfirm}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />

      <AlertDialogModal
        isOpen={alertConfig.isOpen}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default KnownIssuesTab;
