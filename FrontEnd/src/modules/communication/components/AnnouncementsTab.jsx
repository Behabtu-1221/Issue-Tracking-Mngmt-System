import React, { useState, useEffect, useMemo } from 'react';
import {
  Megaphone, Plus, X, Clock, User, Send, Zap, Trash2,
  Search, Building, Eye, RefreshCw, AlertCircle, Calendar,
  ShieldAlert, Globe, CheckCircle2, AlertTriangle, Layers,
  ChevronRight, Building2, Flame
} from 'lucide-react';
import communicationApi from '../api/communicationApi';
import { tenantApi } from '../../tenant/api/tenantApi';
import { usePermissionContext } from '../../role-permission-management/contexts/PermissionContext';
import ConfirmDialogModal from '../../../components/common/ConfirmDialogModal';
import AlertDialogModal from '../../../components/common/AlertDialogModal';
import { FormField } from '../../../components/common/FormField';

export default function AnnouncementsTab() {
  const { user, isParkAdmin, isCompanyAdmin, hasPermission } = usePermissionContext();
  const canPublish = isParkAdmin || isCompanyAdmin || hasPermission('Communication.Manage') || hasPermission('Building.Read');

  const [announcements, setAnnouncements] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [form, setForm] = useState({
    Title: '',
    Message: '',
    Priority: 'NORMAL',
    Category: 'GENERAL',
    TargetTenantID: ''
  });
  const [formErrors, setFormErrors] = useState({});

  // Glass Modal States
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false, title: '', message: '', type: 'danger', confirmText: 'Delete', onConfirm: null
  });
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false, title: '', message: '', type: 'error'
  });

  const showAlert = (title, message, type = 'error') => {
    setAlertConfig({ isOpen: true, title, message, type });
  };

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await communicationApi.getAnnouncements();
      const raw = res.data?.data;
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.announcements)
          ? raw.announcements
          : [];
      setAnnouncements(list);
    } catch (e) {
      console.error('Failed to load announcements:', e);
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTenants = async () => {
    if (!canPublish) return;
    try {
      const res = await tenantApi.getTenants({ limit: 100 });
      const list = res.data?.data?.tenants || res.data?.data || [];
      setTenants(Array.isArray(list) ? list : []);
    } catch (e) {
      console.warn('Could not load tenants for announcement targeting:', e);
    }
  };

  useEffect(() => {
    loadAnnouncements();
    loadTenants();
  }, [canPublish]);

  const handleCreate = async (e) => {
    e?.preventDefault();
    const errors = {};
    if (!form.Title.trim()) errors.Title = 'Announcement headline is required';
    if (!form.Message.trim()) errors.Message = 'Announcement body content is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    setFormErrors({});
    try {
      await communicationApi.createAnnouncement({
        Title: form.Title.trim(),
        Message: form.Message.trim(),
        Priority: form.Priority,
        Category: form.Category,
        TargetTenantID: form.TargetTenantID ? parseInt(form.TargetTenantID) : null
      });

      setForm({ Title: '', Message: '', Priority: 'NORMAL', Category: 'GENERAL', TargetTenantID: '' });
      setShowModal(false);
      await loadAnnouncements();
    } catch (e) {
      const msg = e.response?.data?.message || 'Failed to publish broadcast announcement';
      showAlert('Publish Failed', msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id, title, e) => {
    e?.stopPropagation();
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Broadcast Announcement',
      message: `Are you sure you want to permanently remove announcement "${title}"? This cannot be undone.`,
      type: 'danger',
      confirmText: 'Delete Announcement',
      onConfirm: async () => {
        try {
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          await communicationApi.deleteAnnouncement(id);
          if (selectedAnnouncement?.AnnouncementID === id) {
            setSelectedAnnouncement(null);
          }
          await loadAnnouncements();
        } catch (e) {
          const msg = e.response?.data?.message || 'Failed to delete announcement';
          showAlert('Action Failed', msg, 'error');
        }
      }
    });
  };

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const safeList = Array.isArray(announcements) ? announcements : [];

  const criticalAnnouncements = useMemo(() => {
    return safeList.filter(a => {
      const p = (a.Priority || '').toUpperCase();
      const t = (a.Title || '').toUpperCase();
      return p === 'CRITICAL' || p === 'EMERGENCY' || t.includes('EMERGENCY') || t.includes('CRITICAL');
    });
  }, [safeList]);

  const filteredAnnouncements = useMemo(() => {
    return safeList.filter((a) => {
      if (selectedCategory !== 'ALL') {
        const cat = (a.Category || '').toUpperCase();
        const p = (a.Priority || '').toUpperCase();
        if (selectedCategory === 'URGENT' && p !== 'CRITICAL' && p !== 'HIGH') return false;
        if (selectedCategory === 'MAINTENANCE' && !cat.includes('MAINT') && !a.Title.toUpperCase().includes('MAINT')) return false;
        if (selectedCategory === 'POLICY' && !cat.includes('POLICY')) return false;
      }

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (a.Title || '').toLowerCase().includes(q) ||
        (a.Message || '').toLowerCase().includes(q) ||
        (a.AuthorName || '').toLowerCase().includes(q) ||
        (a.TargetTenantName || '').toLowerCase().includes(q)
      );
    });
  }, [safeList, selectedCategory, searchQuery]);

  const getPriorityBadge = (p, title = '') => {
    const priority = (p || '').toUpperCase();
    const t = (title || '').toUpperCase();
    if (priority === 'CRITICAL' || t.includes('EMERGENCY') || t.includes('CRITICAL')) {
      return { label: 'CRITICAL', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)' };
    }
    if (priority === 'HIGH' || t.includes('URGENT')) {
      return { label: 'IMPORTANT', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)' };
    }
    if (priority === 'INFO' || t.includes('NOTICE')) {
      return { label: 'INFO', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.3)' };
    }
    return { label: 'GENERAL', color: '#818cf8', bg: 'rgba(99, 102, 241, 0.15)', border: 'rgba(99, 102, 241, 0.3)' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ── Emergency Broadcast Alert (if critical announcement exists) ── */}
      {criticalAnnouncements.length > 0 && (
        <div style={{
          padding: '16px 20px', borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(239,68,68,0.2) 0%, rgba(220,38,38,0.1) 100%)',
          border: '1.5px solid rgba(239,68,68,0.4)',
          boxShadow: '0 0 25px rgba(239,68,68,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              padding: '10px', borderRadius: '12px', background: 'rgba(239,68,68,0.25)',
              color: '#f87171', display: 'flex', alignItems: 'center'
            }}>
              <Flame size={22} />
            </div>
            <div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                fontSize: '0.75rem', fontWeight: 800, color: '#fca5a5', textTransform: 'uppercase'
              }}>
                <span style={{
                  width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444',
                  boxShadow: '0 0 10px #ef4444', display: 'inline-block'
                }} />
                Urgent Priority Notice Active
              </div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#ffffff', marginTop: '2px' }}>
                {criticalAnnouncements[0].Title}
              </div>
            </div>
          </div>

          <button
            onClick={() => setSelectedAnnouncement(criticalAnnouncements[0])}
            style={{
              padding: '8px 16px', borderRadius: '10px',
              background: '#ef4444', color: '#ffffff', border: 'none',
              fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(239,68,68,0.4)'
            }}
          >
            Review Emergency Alert
          </button>
        </div>
      )}

      {/* ── Action & Filter Bar ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '16px'
      }}>
        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '10px 16px', borderRadius: '12px',
          background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)',
          width: '100%', maxWidth: '380px'
        }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search announcements, author, content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1, border: 'none', background: 'transparent',
              color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Actions (Create + Refresh) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={loadAnnouncements}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '10px 16px', borderRadius: '12px',
              background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)',
              color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer'
            }}
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} /> Refresh
          </button>

          {canPublish && (
            <button
              onClick={() => setShowModal(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '10px 20px', borderRadius: '12px',
                background: 'var(--accent-gradient)', color: '#ffffff',
                border: 'none', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(99, 102, 241, 0.35)'
              }}
            >
              <Plus size={18} /> Publish Announcement
            </button>
          )}
        </div>
      </div>

      {/* ── Category Filter Pills ── */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {[
          { id: 'ALL', label: 'All Notices' },
          { id: 'URGENT', label: 'Urgent & Critical' },
          { id: 'MAINTENANCE', label: 'Campus Maintenance' },
          { id: 'POLICY', label: 'Policy & Safety' }
        ].map(cat => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: '6px 14px', borderRadius: '16px', border: '1px solid',
                fontSize: '0.8rem', fontWeight: isSelected ? 700 : 500,
                cursor: 'pointer', transition: 'all 0.15s ease',
                background: isSelected ? 'var(--accent-gradient)' : 'var(--bg-secondary)',
                borderColor: isSelected ? 'transparent' : 'var(--glass-border)',
                color: isSelected ? '#ffffff' : 'var(--text-secondary)'
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* ── Announcements Grid ── */}
      {loading && safeList.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading broadcast announcements...
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="glass-panel" style={{
          padding: '60px 20px', textAlign: 'center', borderRadius: '20px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            padding: '18px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)',
            color: '#f59e0b', marginBottom: '14px'
          }}>
            <Megaphone size={36} />
          </div>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
            {searchQuery ? 'No matching announcements' : 'No announcements published'}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '6px', maxWidth: '360px' }}>
            {canPublish
              ? 'Publish a park-wide or tenant-specific announcement to broadcast critical updates.'
              : 'There are currently no active broadcast notices for your campus.'}
          </div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: '20px'
        }}>
          {filteredAnnouncements.map((a) => {
            const badge = getPriorityBadge(a.Priority, a.Title);
            const isParkWide = !a.TargetTenantID;

            return (
              <div
                key={a.AnnouncementID}
                onClick={() => setSelectedAnnouncement(a)}
                className="glass-panel"
                style={{
                  padding: '22px', borderRadius: '18px',
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  border: '1px solid var(--glass-border)', background: 'var(--glass-bg)',
                  cursor: 'pointer', transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.25)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--glass-border)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div>
                  {/* Top Tags: Priority + Target Scope */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        padding: '3px 8px', borderRadius: '6px', fontSize: '0.7rem',
                        fontWeight: 800, color: badge.color, background: badge.bg,
                        border: `1px solid ${badge.border}`
                      }}>
                        {badge.label}
                      </span>

                      <span style={{
                        padding: '3px 8px', borderRadius: '6px', fontSize: '0.7rem',
                        fontWeight: 600, color: isParkWide ? '#38bdf8' : '#a78bfa',
                        background: isParkWide ? 'rgba(56, 189, 248, 0.12)' : 'rgba(167, 139, 250, 0.12)',
                        display: 'inline-flex', alignItems: 'center', gap: '4px'
                      }}>
                        {isParkWide ? <Globe size={11} /> : <Building2 size={11} />}
                        {isParkWide ? 'Park-Wide' : (a.TargetTenantName || 'Tenant Target')}
                      </span>
                    </div>

                    {canPublish && (
                      <button
                        onClick={(e) => handleDelete(a.AnnouncementID, a.Title, e)}
                        title="Delete Announcement"
                        style={{
                          padding: '6px', borderRadius: '6px',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                          background: 'rgba(239, 68, 68, 0.1)', color: '#f87171',
                          cursor: 'pointer', display: 'flex', alignItems: 'center'
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  {/* Title */}
                  <h3 style={{
                    margin: '0 0 10px 0', fontSize: '1.08rem', fontWeight: 800,
                    color: 'var(--text-primary)', lineHeight: 1.4
                  }}>
                    {a.Title}
                  </h3>

                  {/* Body Preview */}
                  <p style={{
                    margin: '0 0 18px 0', fontSize: '0.86rem', color: 'var(--text-secondary)',
                    lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden'
                  }}>
                    {a.Message}
                  </p>
                </div>

                {/* Footer: Author & Date */}
                <div style={{
                  paddingTop: '14px', borderTop: '1px solid var(--glass-border)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  fontSize: '0.75rem', color: 'var(--text-muted)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{
                      width: '22px', height: '22px', borderRadius: '50%',
                      background: 'rgba(99,102,241,0.2)', color: 'var(--accent-primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: '0.65rem'
                    }}>
                      {(a.AuthorName || 'A')[0]}
                    </div>
                    <span>{a.AuthorName || 'Park Operations'}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} />
                    <span>{formatDate(a.CreatedDate)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal 1: Read Full Announcement Modal ── */}
      {selectedAnnouncement && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'var(--modal-backdrop, rgba(16, 20, 24, 0.78))', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            width: '100%', maxWidth: '640px', background: 'var(--bg-secondary)',
            borderRadius: '20px', border: '1px solid var(--glass-border-accent)',
            padding: '28px', boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
            maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  padding: '4px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800,
                  ...getPriorityBadge(selectedAnnouncement.Priority, selectedAnnouncement.Title)
                }}>
                  {selectedAnnouncement.Priority || 'GENERAL'}
                </span>
                <span style={{
                  padding: '4px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600,
                  background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8'
                }}>
                  {selectedAnnouncement.TargetTenantName ? `🏢 ${selectedAnnouncement.TargetTenantName}` : '🌐 Park-Wide Broadcast'}
                </span>
              </div>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                style={{
                  background: 'none', border: 'none', color: 'var(--text-muted)',
                  cursor: 'pointer', fontSize: '1.2rem', padding: '4px'
                }}
              >
                ✕
              </button>
            </div>

            <h2 style={{ margin: '0 0 12px 0', fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {selectedAnnouncement.Title}
            </h2>

            <div style={{
              display: 'flex', alignItems: 'center', gap: '16px',
              fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '20px',
              paddingBottom: '14px', borderBottom: '1px solid var(--glass-border)'
            }}>
              <span>👤 Published by <strong>{selectedAnnouncement.AuthorName || 'Park Operations'}</strong></span>
              <span>📅 {formatDate(selectedAnnouncement.CreatedDate)}</span>
            </div>

            <div style={{
              fontSize: '0.94rem', color: 'var(--text-primary)', lineHeight: 1.7,
              whiteSpace: 'pre-wrap', marginBottom: '24px'
            }}>
              {selectedAnnouncement.Message}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                style={{
                  padding: '10px 20px', borderRadius: '10px',
                  background: 'var(--accent-gradient)', border: 'none',
                  color: '#ffffff', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer'
                }}
              >
                Close Notice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal 2: Publish Broadcast Announcement Modal (Admin/Manager) ── */}
      {showModal && canPublish && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'var(--modal-backdrop, rgba(16, 20, 24, 0.78))', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            width: '100%', maxWidth: '580px', background: 'var(--bg-secondary)',
            borderRadius: '20px', border: '1px solid var(--glass-border-accent)',
            padding: '28px', boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Publish Broadcast Notice
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Broadcast an announcement to park-wide campuses or target a specific tenant company.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'none', border: 'none', color: 'var(--text-muted)',
                  cursor: 'pointer', fontSize: '1.2rem'
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Title */}
              <FormField
                label="Announcement Headline"
                id="Title"
                required
                icon={Megaphone}
                error={formErrors.Title}
                helpText="Short and clear headline (e.g., Scheduled Power Maintenance on Block B)"
              >
                <input
                  id="Title"
                  type="text"
                  placeholder="e.g. Campus Water Line Repair Scheduled"
                  value={form.Title}
                  onChange={(e) => setForm({ ...form, Title: e.target.value })}
                  style={{
                    width: '100%', padding: '11px 14px', borderRadius: '10px',
                    background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                    color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none'
                  }}
                />
              </FormField>

              {/* Priority & Category Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <FormField label="Priority Level" id="Priority" icon={Flame}>
                  <select
                    id="Priority"
                    value={form.Priority}
                    onChange={(e) => setForm({ ...form, Priority: e.target.value })}
                    style={{
                      width: '100%', padding: '11px 14px', borderRadius: '10px',
                      background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                      color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none'
                    }}
                  >
                    <option value="NORMAL">Normal / General</option>
                    <option value="HIGH">High / Important</option>
                    <option value="CRITICAL">Critical / Emergency</option>
                    <option value="INFO">Informational Only</option>
                  </select>
                </FormField>

                <FormField label="Category Type" id="Category" icon={Layers}>
                  <select
                    id="Category"
                    value={form.Category}
                    onChange={(e) => setForm({ ...form, Category: e.target.value })}
                    style={{
                      width: '100%', padding: '11px 14px', borderRadius: '10px',
                      background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                      color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none'
                    }}
                  >
                    <option value="GENERAL">General Operations</option>
                    <option value="MAINTENANCE">Facilities Maintenance</option>
                    <option value="SAFETY">Safety & Security</option>
                    <option value="POLICY">Policy & Administrative</option>
                  </select>
                </FormField>
              </div>

              {/* Target Scope */}
              <FormField
                label="Target Audience Scope"
                id="TargetTenantID"
                icon={Globe}
                helpText="Broadcast to all campus occupants or restrict notice to a specific tenant."
              >
                <select
                  id="TargetTenantID"
                  value={form.TargetTenantID}
                  onChange={(e) => setForm({ ...form, TargetTenantID: e.target.value })}
                  style={{
                    width: '100%', padding: '11px 14px', borderRadius: '10px',
                    background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                    color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none'
                  }}
                >
                  <option value="">🌐 Global (Park-Wide to All Campuses & Tenants)</option>
                  {tenants.map(t => (
                    <option key={t.TenantID} value={t.TenantID}>
                      🏢 Specific Tenant: {t.CompanyName} ({t.TenantCode || 'TNT'})
                    </option>
                  ))}
                </select>
              </FormField>

              {/* Message Content */}
              <FormField
                label="Announcement Content"
                id="Message"
                required
                icon={Send}
                error={formErrors.Message}
                helpText="Detail instructions, affected services, impact timelines, and emergency contacts."
              >
                <textarea
                  id="Message"
                  rows={5}
                  placeholder="Write complete notice details, timeline, and action items..."
                  value={form.Message}
                  onChange={(e) => setForm({ ...form, Message: e.target.value })}
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: '10px',
                    background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                    color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none',
                    resize: 'vertical', minHeight: '110px'
                  }}
                />
              </FormField>

              {/* Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '10px 18px', borderRadius: '10px',
                    background: 'transparent', border: '1px solid var(--glass-border)',
                    color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '10px 22px', borderRadius: '10px',
                    background: 'var(--accent-gradient)', border: 'none',
                    color: '#ffffff', fontWeight: 700, cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(99, 102, 241, 0.35)'
                  }}
                >
                  {submitting ? 'Broadcasting...' : 'Publish Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Glass Modals ── */}
      <ConfirmDialogModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        confirmText={confirmConfig.confirmText}
        cancelText="Cancel"
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
}
