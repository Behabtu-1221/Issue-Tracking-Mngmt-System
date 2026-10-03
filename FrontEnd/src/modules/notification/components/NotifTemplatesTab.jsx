import React, { useState, useEffect } from 'react';
import {
  BookOpen, Plus, Edit2, X, Code, Mail, MessageSquare,
  PhoneCall, Search, Eye, Sparkles, Check, Copy, CheckCheck,
  RefreshCw, Loader2
} from 'lucide-react';
import notificationApi from '../api/notificationApi';

const glassCard = {
  background: 'var(--glass-bg)',
  border: '1px solid var(--glass-border)',
  borderRadius: '20px',
  backdropFilter: 'blur(16px)',
  padding: '24px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
};

export default function NotifTemplatesTab() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [form, setForm] = useState({ TemplateSubject: '', TemplateBody: '' });
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState('ALL');
  const [copiedKey, setCopiedKey] = useState(null);

  const samplePlaceholders = {
    '{{title}}': 'Power Outage in South Wing Lab',
    '{{requestNumber}}': 'REQ-2026-0088',
    '{{message}}': 'Technician assigned for on-site diagnostic of circuit breakers.',
    '{{userName}}': 'Alex Johnson',
    '{{priority}}': 'CRITICAL',
    '{{status}}': 'IN_PROGRESS',
    '{{link}}': 'https://facility.innovations-park.com/requests/88'
  };

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const res = await notificationApi.getTemplates();
      const raw = res.data?.data || [];
      setTemplates(Array.isArray(raw) ? raw : []);
    } catch (e) {
      console.error('Failed to load templates:', e);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const openEdit = (tpl) => {
    setEditingTemplate(tpl);
    setForm({
      TemplateSubject: tpl.TemplateSubject || '',
      TemplateBody: tpl.TemplateBody || ''
    });
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!editingTemplate || saving) return;
    setSaving(true);
    try {
      await notificationApi.updateTemplate(editingTemplate.NotificationTemplateID, form);
      setEditingTemplate(null);
      await loadTemplates();
    } catch (e) {
      console.error('Failed to update template:', e);
    } finally {
      setSaving(false);
    }
  };

  const insertPlaceholder = (tag) => {
    setForm(prev => ({
      ...prev,
      TemplateBody: prev.TemplateBody ? `${prev.TemplateBody} ${tag}` : tag
    }));
  };

  const renderSimulatedText = (text = '') => {
    let result = text;
    Object.entries(samplePlaceholders).forEach(([key, val]) => {
      result = result.replaceAll(key, val);
    });
    return result;
  };

  const getChannelBadge = (code) => {
    switch (code) {
      case 'EMAIL':
        return (
          <span style={{
            background: 'rgba(16, 185, 129, 0.15)', color: '#10b981',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '2px 8px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 800,
            display: 'inline-flex', alignItems: 'center', gap: '4px'
          }}>
            <Mail size={11} /> EMAIL
          </span>
        );
      case 'IN_APP':
        return (
          <span style={{
            background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            padding: '2px 8px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 800,
            display: 'inline-flex', alignItems: 'center', gap: '4px'
          }}>
            <MessageSquare size={11} /> IN_APP
          </span>
        );
      default:
        return (
          <span style={{
            background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            padding: '2px 8px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 800,
            display: 'inline-flex', alignItems: 'center', gap: '4px'
          }}>
            <PhoneCall size={11} /> {code}
          </span>
        );
    }
  };

  const filteredTemplates = templates.filter(tpl => {
    if (channelFilter !== 'ALL' && tpl.ChannelCode !== channelFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCode = (tpl.TemplateCode || '').toLowerCase().includes(q);
      const matchName = (tpl.TypeName || '').toLowerCase().includes(q);
      const matchSub = (tpl.TemplateSubject || '').toLowerCase().includes(q);
      const matchBody = (tpl.TemplateBody || '').toLowerCase().includes(q);
      return matchCode || matchName || matchSub || matchBody;
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Bar */}
      <div style={{
        ...glassCard,
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 320px' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)'
          }}>
            <BookOpen size={20} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 800 }}>
                Notification Layouts & Dynamic Templates
              </h3>
              <span style={{
                background: 'rgba(16, 185, 129, 0.15)', color: '#10b981',
                padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 800,
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}>
                {templates.length} Templates
              </span>
            </div>
            <p style={{ margin: '2px 0 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              Standardized email layouts, Mustache placeholders, and in-app alert formats across all operational triggers
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', width: '200px' }}>
            <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '8px 12px 8px 34px',
                borderRadius: '10px', background: 'var(--bg-tertiary)',
                border: '1px solid var(--glass-border)', color: 'var(--text-primary)',
                fontSize: '0.82rem', outline: 'none'
              }}
            />
          </div>

          {/* Channel Filters */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {['ALL', 'EMAIL', 'IN_APP'].map(ch => (
              <button
                key={ch}
                onClick={() => setChannelFilter(ch)}
                style={{
                  padding: '7px 12px', borderRadius: '8px',
                  background: channelFilter === ch ? 'var(--accent-gradient)' : 'var(--bg-tertiary)',
                  border: channelFilter === ch ? '1px solid transparent' : '1px solid var(--glass-border)',
                  color: channelFilter === ch ? '#fff' : 'var(--text-secondary)',
                  fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                {ch === 'ALL' ? 'All Channels' : ch}
              </button>
            ))}
          </div>

          <button
            onClick={loadTemplates}
            disabled={loading}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px', borderRadius: '10px',
              border: '1px solid var(--glass-border)', background: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px 0' }}>
          <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px', color: '#10b981' }} />
          <span style={{ fontSize: '0.86rem' }}>Loading notification templates...</span>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div style={{ ...glassCard, textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <BookOpen size={42} color="rgba(148, 163, 184, 0.3)" style={{ marginBottom: '12px' }} />
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
            No templates match your search
          </div>
          <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>
            Try clearing the search query or channel filter.
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '18px' }}>
          {filteredTemplates.map((tpl, i) => (
            <div
              key={tpl.NotificationTemplateID || i}
              style={{
                ...glassCard,
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '22px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                animation: `fadeInUp 0.25s ease-out ${Math.min(i * 0.05, 0.4)}s both`
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.4)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'var(--glass-border)';
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <span style={{
                      color: '#818cf8', fontFamily: 'monospace', fontSize: '0.72rem', fontWeight: 800,
                      background: 'rgba(99, 102, 241, 0.12)', padding: '2px 8px', borderRadius: '6px',
                      border: '1px solid rgba(99, 102, 241, 0.25)'
                    }}>
                      {tpl.TemplateCode}
                    </span>
                    <h4 style={{ margin: '8px 0 0', color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 800 }}>
                      {tpl.TypeName || tpl.TemplateCode}
                    </h4>
                  </div>
                  {getChannelBadge(tpl.ChannelCode)}
                </div>

                {tpl.TemplateSubject && (
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Subject Line:
                    </span>
                    <p style={{ margin: '2px 0 0', color: 'var(--text-primary)', fontSize: '0.86rem', fontWeight: 600 }}>
                      {tpl.TemplateSubject}
                    </p>
                  </div>
                )}

                {/* Monospace Body Preview */}
                <div style={{
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  fontFamily: 'Consolas, Monaco, monospace',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.55,
                  maxHeight: '120px',
                  overflowY: 'auto',
                  marginBottom: '14px',
                  whiteSpace: 'pre-wrap'
                }}>
                  {tpl.TemplateBody}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                paddingTop: '12px', borderTop: '1px solid var(--glass-border)'
              }}>
                <button
                  type="button"
                  onClick={() => setPreviewTemplate(tpl)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    padding: '6px 12px', borderRadius: '8px',
                    background: 'rgba(16, 185, 129, 0.1)', color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <Eye size={13} />
                  <span>Preview Render</span>
                </button>

                <button
                  type="button"
                  onClick={() => openEdit(tpl)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    padding: '6px 14px', borderRadius: '8px',
                    background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <Edit2 size={13} />
                  <span>Edit Layout</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Live Preview Modal */}
      {previewTemplate && (
        <div style={{
          position: 'fixed', inset: 0, background: 'var(--modal-backdrop, rgba(16, 20, 24, 0.78))',
          backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 10000, padding: '20px'
        }} onClick={() => setPreviewTemplate(null)}>
          <div style={{
            ...glassCard, width: '560px', maxWidth: '100%',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
            animation: 'fadeInUp 0.25s ease-out'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.15)', color: '#10b981',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Eye size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 800 }}>
                    Simulated Render Preview
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Sample placeholder data substituted into template
                  </span>
                </div>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {previewTemplate.TemplateSubject && (
                <div style={{
                  padding: '12px 16px', borderRadius: '10px',
                  background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)'
                }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Subject:</span>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {renderSimulatedText(previewTemplate.TemplateSubject)}
                  </div>
                </div>
              )}

              <div style={{
                padding: '16px 20px', borderRadius: '12px',
                background: 'var(--bg-primary)', border: '1px solid var(--glass-border)',
                minHeight: '140px'
              }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Body Content:</span>
                <p style={{
                  margin: '8px 0 0', color: 'var(--text-secondary)',
                  fontSize: '0.88rem', lineHeight: 1.6, whiteSpace: 'pre-wrap'
                }}>
                  {renderSimulatedText(previewTemplate.TemplateBody)}
                </p>
              </div>

              <div style={{
                padding: '10px 14px', borderRadius: '10px',
                background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)',
                display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#818cf8'
              }}>
                <Sparkles size={14} />
                <span>Simulated using live sample request and recipient data</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setPreviewTemplate(null)}
                  style={{
                    padding: '8px 20px', borderRadius: '8px',
                    background: 'var(--accent-gradient)', border: 'none',
                    color: '#fff', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingTemplate && (
        <div style={{
          position: 'fixed', inset: 0, background: 'var(--modal-backdrop, rgba(16, 20, 24, 0.78))',
          backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 10000, padding: '20px'
        }} onClick={() => setEditingTemplate(null)}>
          <div style={{
            ...glassCard, width: '580px', maxWidth: '100%',
            border: '1px solid rgba(99, 102, 241, 0.35)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
            animation: 'fadeInUp 0.25s ease-out'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Edit2 size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 800 }}>
                    Edit Notification Layout
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {editingTemplate.TemplateCode} &bull; {editingTemplate.ChannelCode}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setEditingTemplate(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px' }}>
                  Template Subject Line
                </label>
                <input
                  type="text"
                  value={form.TemplateSubject}
                  onChange={(e) => setForm({ ...form, TemplateSubject: e.target.value })}
                  placeholder="Subject line with {{placeholders}}..."
                  style={{
                    width: '100%', background: 'var(--bg-tertiary)',
                    border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '10px',
                    padding: '10px 14px', color: 'var(--text-primary)', fontSize: '0.86rem', outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px' }}>
                  Template Body Layout
                </label>
                <textarea
                  value={form.TemplateBody}
                  onChange={(e) => setForm({ ...form, TemplateBody: e.target.value })}
                  placeholder="Body content with {{placeholders}}..."
                  rows={6}
                  style={{
                    width: '100%', background: 'var(--bg-tertiary)',
                    border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '10px',
                    padding: '12px 14px', color: 'var(--text-primary)', fontSize: '0.84rem',
                    fontFamily: 'Consolas, Monaco, monospace', outline: 'none',
                    resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.55
                  }}
                />
              </div>

              {/* Clickable Placeholders Toolbar */}
              <div style={{
                background: 'rgba(99, 102, 241, 0.08)',
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1px solid rgba(99, 102, 241, 0.2)'
              }}>
                <span style={{ color: '#818cf8', fontSize: '0.72rem', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                  Click to insert placeholder tag:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {Object.keys(samplePlaceholders).map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => insertPlaceholder(tag)}
                      style={{
                        padding: '3px 8px', borderRadius: '6px',
                        background: 'var(--bg-tertiary)', border: '1px solid rgba(99, 102, 241, 0.3)',
                        color: 'var(--text-secondary)', fontSize: '0.7rem',
                        fontFamily: 'monospace', cursor: 'pointer', transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.color = '#818cf8';
                        e.currentTarget.style.borderColor = '#818cf8';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.color = 'var(--text-secondary)';
                        e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                      }}
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingTemplate(null)}
                  style={{
                    background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                    borderRadius: '10px', padding: '10px 18px', color: 'var(--text-secondary)',
                    fontWeight: 600, fontSize: '0.84rem', cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    background: 'var(--accent-gradient)', border: 'none',
                    borderRadius: '10px', padding: '10px 24px',
                    color: '#fff', fontWeight: 700, fontSize: '0.84rem', cursor: saving ? 'wait' : 'pointer',
                    boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)', display: 'inline-flex', alignItems: 'center', gap: '6px'
                  }}
                >
                  {saving ? (
                    <>
                      <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Save Template</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
