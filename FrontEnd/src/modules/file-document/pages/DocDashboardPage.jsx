import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HardDrive, Folder, History, Shield, Upload, Download, Eye,
  Home, ChevronRight, Activity, ExternalLink, ArrowUpRight,
  BarChart2, Lock, FileText, CheckCircle2
} from 'lucide-react';
import fileDocumentApi from '../api/fileDocumentApi';

export default function DocDashboardPage() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await fileDocumentApi.getOverviewMetrics();
      setMetrics(res.data?.data || null);
    } catch (err) {
      console.error('Failed to fetch document metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 MB';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const m = metrics?.summary || {};
  const categories = metrics?.categories || [];
  const recentUploads = metrics?.recentUploads || [];

  const kpiCards = [
    { key: 'total', label: 'Total Managed Documents', value: loading ? '...' : (m.totalFiles || 0), sub: 'Active files stored', icon: HardDrive, color: '#818cf8', bg: 'rgba(99, 102, 241, 0.15)', border: '#818cf8', route: '/documents/repository' },
    { key: 'storage', label: 'Total Storage Consumed', value: loading ? '...' : formatBytes(m.totalStorageBytes), sub: 'Disk capacity used', icon: Folder, color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)', border: '#38bdf8', route: '/documents/repository' },
    { key: 'sensitive', label: 'Confidential Files', value: loading ? '...' : (m.sensitiveFiles || 0), sub: 'Permission-restricted', icon: Lock, color: '#f87171', bg: 'rgba(239, 68, 68, 0.15)', border: '#f87171', route: '/documents/security' },
    { key: 'downloads', label: 'Document Downloads', value: loading ? '...' : (m.totalDownloads || 0), sub: 'Platform downloads', icon: Download, color: '#4ade80', bg: 'rgba(74, 222, 128, 0.15)', border: '#4ade80', route: '/documents/repository' }
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
{/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
              File & Document <span className="glow-text">Central Storage</span>
            </h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Centralized document repository, attachment management, version history, and storage analytics
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '20px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', fontSize: '0.78rem', fontWeight: 700 }}>
              <Activity size={14} /> Storage Engine Active
            </span>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {kpiCards.map((card) => {
          const Icon = card.icon;
          const isHovered = hoveredCard === card.key;
          return (
            <div
              key={card.key}
              className="glass-panel"
              onClick={() => navigate(card.route)}
              onMouseEnter={() => setHoveredCard(card.key)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                padding: '20px', cursor: 'pointer', position: 'relative', overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                transform: isHovered ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
                boxShadow: isHovered ? `0 12px 28px -6px ${card.border}33` : 'none',
                borderTop: isHovered ? `2px solid ${card.border}` : '2px solid transparent'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 600 }}>{card.label}</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, margin: '8px 0 4px', color: card.color }}>{card.value}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{card.sub}</div>
                </div>
                <div style={{ padding: '12px', borderRadius: '14px', background: card.bg, color: card.color }}>
                  <Icon size={22} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics & Distribution Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {/* Category Storage Distribution Panel */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Category Distribution</h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>File breakdown per document category</p>
            </div>
            <button onClick={() => navigate('/documents/categories')} style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '8px' }}>
              Taxonomy <ArrowUpRight size={13} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {categories.map((c) => (
              <div key={c.CategoryCode} style={{ padding: '12px', borderRadius: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', fontWeight: 600, marginBottom: '6px' }}>
                  <span>{c.CategoryName}</span>
                  <span style={{ color: 'var(--accent-primary)' }}>{c.fileCount} files ({formatBytes(c.storageBytes)})</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Uploads Stream */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Recent Upload Activity</h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>Latest document additions to repository</p>
            </div>
            <button onClick={() => navigate('/documents/repository')} style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '8px' }}>
              View All <ArrowUpRight size={13} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentUploads.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No recent uploads.</div>
            ) : recentUploads.map((doc) => (
              <div key={doc.DocumentID} style={{ padding: '12px 14px', borderRadius: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{doc.Title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {doc.CategoryName || 'General'} | By {doc.UploaderName || 'System'}
                  </div>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatBytes(doc.FileSize)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Shortcuts Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--border-radius-md)', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>Document Management Navigation</div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {[
            { label: 'Document Repository', icon: HardDrive, route: '/documents/repository' },
            { label: 'Document Categories', icon: Folder, route: '/documents/categories' },
            { label: 'Version Control', icon: History, route: '/documents/versions' },
            { label: 'Security & Sharing', icon: Shield, route: '/documents/security' }
          ].map((s) => {
            const ShortIcon = s.icon;
            return (
              <button
                key={s.label}
                onClick={() => navigate(s.route)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '7px 14px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}
              >
                <ShortIcon size={14} /> {s.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
