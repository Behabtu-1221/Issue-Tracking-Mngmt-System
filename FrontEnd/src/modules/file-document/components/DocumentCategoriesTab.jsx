import React, { useState, useEffect } from 'react';
import {
  Folder, Plus, FileText, LifeBuoy, Building2, ShieldCheck, BarChart2,
  HardDrive, RefreshCw, X, CheckCircle, Tag
} from 'lucide-react';
import fileDocumentApi from '../api/fileDocumentApi';

export default function DocumentCategoriesTab() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    categoryCode: '',
    categoryName: '',
    description: '',
    icon: 'Folder'
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fileDocumentApi.getCategories();
      setCategories(res.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.categoryCode || !form.categoryName) {
      alert('Category Code and Name are required');
      return;
    }
    try {
      setSubmitting(true);
      await fileDocumentApi.createCategory({
        CategoryCode: form.categoryCode.toUpperCase().replace(/\s+/g, '_'),
        CategoryName: form.categoryName,
        Description: form.description,
        Icon: form.icon
      });
      setShowModal(false);
      setForm({ categoryCode: '', categoryName: '', description: '', icon: 'Folder' });
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create category');
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryIcon = (iconName) => {
    switch (iconName) {
      case 'FileText': return <FileText size={22} color="#818cf8" />;
      case 'LifeBuoy': return <LifeBuoy size={22} color="#f87171" />;
      case 'Building2': return <Building2 size={22} color="#60a5fa" />;
      case 'ShieldCheck': return <ShieldCheck size={22} color="#4ade80" />;
      case 'BarChart2': return <BarChart2 size={22} color="#a78bfa" />;
      default: return <Folder size={22} color="#facc15" />;
    }
  };

  return (
    <div>
      {/* Top Header & Create Button */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Document Categories & Taxonomy</h3>
          <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Classify contracts, issue attachments, asset manuals, policies, and analytical reports
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '10px', background: 'var(--accent-gradient)', border: 'none', color: '#fff', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
        >
          <Plus size={18} /> Add New Category
        </button>
      </div>

      {/* Grid List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <RefreshCw size={24} className="spin" style={{ marginBottom: '12px' }} />
          <div>Loading Categories...</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '18px' }}>
          {categories.map((cat) => (
            <div key={cat.CategoryID} className="glass-panel" style={{ padding: '22px', borderLeft: '4px solid var(--accent-primary)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div style={{ padding: '12px', borderRadius: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)' }}>
                    {getCategoryIcon(cat.Icon)}
                  </div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: 'var(--bg-tertiary)', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
                    {cat.CategoryCode}
                  </span>
                </div>

                <h4 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 700 }}>{cat.CategoryName}</h4>
                <p style={{ margin: '0 0 16px', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  {cat.Description || 'System document classification category.'}
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '12px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <span>Status: <strong style={{ color: '#4ade80' }}>Active</strong></span>
                <span style={{ color: 'var(--text-muted)' }}>ID: #{cat.CategoryID}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE CATEGORY MODAL */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '28px', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Create Category</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Category Name</label>
                <input
                  type="text"
                  placeholder="e.g. Environmental Audits"
                  value={form.categoryName}
                  onChange={(e) => setForm({ ...form, categoryName: e.target.value, categoryCode: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Category Code</label>
                <input
                  type="text"
                  placeholder="ENV_AUDITS"
                  value={form.categoryCode}
                  onChange={(e) => setForm({ ...form, categoryCode: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Display Icon</label>
                <select
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                >
                  <option value="Folder">Folder (Default)</option>
                  <option value="FileText">FileText (Contracts/Docs)</option>
                  <option value="LifeBuoy">LifeBuoy (Issue Attachments)</option>
                  <option value="Building2">Building2 (Asset Specs)</option>
                  <option value="ShieldCheck">ShieldCheck (Policies)</option>
                  <option value="BarChart2">BarChart2 (Reports)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Description</label>
                <textarea
                  rows={3}
                  placeholder="Purpose and scope of this category..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 18px', borderRadius: '10px', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting} style={{ padding: '10px 22px', borderRadius: '10px', background: 'var(--accent-gradient)', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                  {submitting ? 'Creating...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
