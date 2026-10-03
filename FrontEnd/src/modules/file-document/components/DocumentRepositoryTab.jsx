import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Filter, Plus, Upload, Download, Eye, Share2, Trash2, RefreshCw,
  FileText, Image as ImageIcon, Film, FileArchive, HardDrive, Shield, Lock, Globe,
  History, Tag, Calendar, User, CheckCircle, AlertTriangle, X, Link, Copy, Check,
  Layers, Folder, ExternalLink, ChevronRight, File
} from 'lucide-react';
import fileDocumentApi from '../api/fileDocumentApi';

export default function DocumentRepositoryTab() {
  const [documents, setDocuments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sensitiveFilter, setSensitiveFilter] = useState('');
  const [archivedFilter, setArchivedFilter] = useState('0');

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedDocForPreview, setSelectedDocForPreview] = useState(null);

  const [showVersionModal, setShowVersionModal] = useState(false);
  const [selectedDocForVersion, setSelectedDocForVersion] = useState(null);
  const [versionHistory, setVersionHistory] = useState([]);

  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedDocForShare, setSelectedDocForShare] = useState(null);
  const [generatedShare, setGeneratedShare] = useState(null);
  const [copiedShare, setCopiedShare] = useState(false);

  // Forms
  const fileInputRef = useRef(null);
  const versionFileInputRef = useRef(null);

  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    categoryId: '',
    entityRefType: '',
    entityRefId: '',
    isSensitive: false,
    isPublic: false,
    tags: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [versionForm, setVersionForm] = useState({ changeNotes: '' });
  const [selectedVersionFile, setSelectedVersionFile] = useState(null);
  const [uploadingVersion, setUploadingVersion] = useState(false);

  const [shareForm, setShareForm] = useState({
    accessLevel: 'VIEW',
    expiresAt: ''
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [search, categoryFilter, sensitiveFilter, archivedFilter]);

  const fetchCategories = async () => {
    try {
      const res = await fileDocumentApi.getCategories();
      setCategories(res.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const params = {
        search,
        categoryId: categoryFilter,
        isArchived: archivedFilter,
        isSensitive: sensitiveFilter !== '' ? sensitiveFilter === 'true' : undefined
      };
      const res = await fileDocumentApi.getDocuments(params);
      const data = res.data?.data || {};
      setDocuments(data.documents || []);
      setTotalCount(data.total || 0);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Upload Handler ──
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Please select a file to upload');
      return;
    }
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', uploadForm.title || selectedFile.name);
      formData.append('description', uploadForm.description);
      formData.append('categoryId', uploadForm.categoryId);
      formData.append('entityRefType', uploadForm.entityRefType);
      formData.append('entityRefId', uploadForm.entityRefId);
      formData.append('isSensitive', uploadForm.isSensitive);
      formData.append('isPublic', uploadForm.isPublic);
      formData.append('tags', uploadForm.tags);

      await fileDocumentApi.uploadFile(formData);
      setShowUploadModal(false);
      setSelectedFile(null);
      setUploadForm({ title: '', description: '', categoryId: '', entityRefType: '', entityRefId: '', isSensitive: false, isPublic: false, tags: '' });
      fetchDocuments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  // ── Preview Modal Handler ──
  const handleOpenPreview = (doc) => {
    setSelectedDocForPreview(doc);
    setShowPreviewModal(true);
  };

  // ── Versions Handler ──
  const handleOpenVersions = async (doc) => {
    setSelectedDocForVersion(doc);
    setShowVersionModal(true);
    try {
      const res = await fileDocumentApi.getDocumentById(doc.DocumentID);
      const detail = res.data?.data || {};
      setVersionHistory(detail.versions || []);
    } catch (err) {
      console.error('Failed to fetch version history:', err);
    }
  };

  const handleVersionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVersionFile) {
      alert('Please select a file for the new version');
      return;
    }
    try {
      setUploadingVersion(true);
      const formData = new FormData();
      formData.append('file', selectedVersionFile);
      formData.append('changeNotes', versionForm.changeNotes);

      await fileDocumentApi.addVersion(selectedDocForVersion.DocumentID, formData);
      setSelectedVersionFile(null);
      setVersionForm({ changeNotes: '' });
      handleOpenVersions(selectedDocForVersion);
      fetchDocuments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add version');
    } finally {
      setUploadingVersion(false);
    }
  };

  // ── Share Link Handler ──
  const handleOpenShare = (doc) => {
    setSelectedDocForShare(doc);
    setGeneratedShare(null);
    setCopiedShare(false);
    setShowShareModal(true);
  };

  const handleCreateShare = async (e) => {
    e.preventDefault();
    try {
      const res = await fileDocumentApi.createShare(selectedDocForShare.DocumentID, shareForm);
      const shareData = res.data?.data || {};
      const fullUrl = `${window.location.origin}/api/documents/share/${shareData.ShareUUID}`;
      setGeneratedShare(fullUrl);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate share link');
    }
  };

  const handleCopyShare = () => {
    if (generatedShare) {
      navigator.clipboard.writeText(generatedShare);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  // ── Archive / Restore / Delete ──
  const handleArchive = async (id) => {
    if (!window.confirm('Are you sure you want to archive this document?')) return;
    try {
      await fileDocumentApi.archiveDocument(id);
      fetchDocuments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to archive document');
    }
  };

  const handleRestore = async (id) => {
    try {
      await fileDocumentApi.restoreDocument(id);
      fetchDocuments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to restore document');
    }
  };

  const handleDeletePermanent = async (id) => {
    if (!window.confirm('PERMANENT ACTION: Permanently delete this document and clean disk storage?')) return;
    try {
      await fileDocumentApi.deletePermanent(id);
      fetchDocuments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to permanently delete');
    }
  };

  // File Icon Helper
  const getFileIcon = (mimeType, ext) => {
    if (mimeType?.startsWith('image/')) return <ImageIcon size={20} color="#38bdf8" />;
    if (mimeType?.includes('pdf')) return <FileText size={20} color="#f87171" />;
    if (mimeType?.includes('word') || mimeType?.includes('document')) return <FileText size={20} color="#60a5fa" />;
    if (mimeType?.includes('excel') || mimeType?.includes('sheet') || ext === 'csv') return <FileText size={20} color="#4ade80" />;
    if (mimeType?.includes('zip')) return <FileArchive size={20} color="#facc15" />;
    return <File size={20} color="#a78bfa" />;
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div>
      {/* Top Controls & Search Bar */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '280px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search by title, filename, or tags..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', padding: '9px 12px 9px 38px', borderRadius: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ padding: '9px 14px', borderRadius: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.CategoryID} value={c.CategoryID}>{c.CategoryName}</option>
              ))}
            </select>

            <select
              value={sensitiveFilter}
              onChange={(e) => setSensitiveFilter(e.target.value)}
              style={{ padding: '9px 14px', borderRadius: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
            >
              <option value="">All Security Types</option>
              <option value="false">Standard Documents</option>
              <option value="true">Confidential & Sensitive</option>
            </select>

            <select
              value={archivedFilter}
              onChange={(e) => setArchivedFilter(e.target.value)}
              style={{ padding: '9px 14px', borderRadius: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
            >
              <option value="0">Active Documents</option>
              <option value="1">Archived Documents</option>
            </select>
          </div>

          <button
            onClick={() => setShowUploadModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', background: 'var(--accent-gradient)', border: 'none', color: '#fff', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}
          >
            <Upload size={18} /> Upload Document
          </button>
        </div>
      </div>

      {/* Document Grid / Table View */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <RefreshCw size={24} className="spin" style={{ marginBottom: '12px' }} />
          <div>Loading Document Repository...</div>
        </div>
      ) : documents.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <HardDrive size={40} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <h3 style={{ margin: '0 0 8px', color: 'var(--text-primary)' }}>No Documents Found</h3>
          <p style={{ margin: 0, fontSize: '0.88rem' }}>Upload a file or adjust search filters to view files.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
          {documents.map((doc) => (
            <div
              key={doc.DocumentID}
              className="glass-panel"
              style={{
                padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                position: 'relative', borderTop: doc.IsSensitive ? '3px solid #ef4444' : '3px solid var(--accent-primary)'
              }}
            >
              <div>
                {/* Header Row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ padding: '10px', borderRadius: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)' }}>
                      {getFileIcon(doc.MimeType, doc.FileExtension)}
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                        {doc.Title}
                      </h4>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {doc.FileName}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    {doc.IsSensitive === 1 && (
                      <span title="Sensitive / Confidential" style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontSize: '0.7rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Lock size={11} /> Sensitive
                      </span>
                    )}
                  </div>
                </div>

                {/* Description & Metadata */}
                {doc.Description && (
                  <p style={{ margin: '0 0 12px', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {doc.Description}
                  </p>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px', fontSize: '0.75rem' }}>
                  <span style={{ padding: '3px 9px', borderRadius: '6px', background: 'var(--bg-tertiary)', color: 'var(--text-muted)', border: '1px solid var(--glass-border)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <Folder size={12} /> {doc.CategoryName || 'General'}
                  </span>
                  <span style={{ padding: '3px 9px', borderRadius: '6px', background: 'rgba(99,102,241,0.15)', color: '#818cf8', fontWeight: 600, border: '1px solid rgba(99,102,241,0.3)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <History size={12} /> v{doc.CurrentVersion || 1}
                  </span>
                  <span style={{ padding: '3px 9px', borderRadius: '6px', background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
                    {formatBytes(doc.FileSize)}
                  </span>
                  {doc.DownloadCount > 0 && (
                    <span style={{ padding: '3px 9px', borderRadius: '6px', background: 'rgba(34,197,94,0.15)', color: '#4ade80' }}>
                      {doc.DownloadCount} downloads
                    </span>
                  )}
                </div>

                {doc.Tags && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
                    <Tag size={12} color="var(--text-muted)" />
                    {doc.Tags.split(',').map((t, i) => (
                      <span key={i} style={{ fontSize: '0.7rem', padding: '2px 7px', borderRadius: '4px', background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
                        #{t.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons Footer */}
              <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '14px', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  By {doc.UploaderName || 'System'}
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => handleOpenPreview(doc)}
                    title="Preview File"
                    style={{ padding: '6px 9px', borderRadius: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', cursor: 'pointer' }}
                  >
                    <Eye size={15} />
                  </button>

                  <a
                    href={fileDocumentApi.getDownloadUrl(doc.DocumentID)}
                    download
                    title="Download File"
                    style={{ padding: '6px 9px', borderRadius: '8px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                  >
                    <Download size={15} />
                  </a>

                  <button
                    onClick={() => handleOpenVersions(doc)}
                    title="Version History"
                    style={{ padding: '6px 9px', borderRadius: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', cursor: 'pointer' }}
                  >
                    <History size={15} />
                  </button>

                  <button
                    onClick={() => handleOpenShare(doc)}
                    title="Share Document"
                    style={{ padding: '6px 9px', borderRadius: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', cursor: 'pointer' }}
                  >
                    <Share2 size={15} />
                  </button>

                  {archivedFilter === '0' ? (
                    <button
                      onClick={() => handleArchive(doc.DocumentID)}
                      title="Archive Document"
                      style={{ padding: '6px 9px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', cursor: 'pointer' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleRestore(doc.DocumentID)}
                        title="Restore Document"
                        style={{ padding: '6px 9px', borderRadius: '8px', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80', cursor: 'pointer' }}
                      >
                        <RefreshCw size={15} />
                      </button>
                      <button
                        onClick={() => handleDeletePermanent(doc.DocumentID)}
                        title="Permanent Delete"
                        style={{ padding: '6px 9px', borderRadius: '8px', background: 'rgba(239,68,68,0.2)', border: '1px solid #ef4444', color: '#ef4444', cursor: 'pointer' }}
                      >
                        <X size={15} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── UPLOAD MODAL ── */}
      {showUploadModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '580px', padding: '28px', borderRadius: '20px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Upload size={22} color="var(--accent-primary)" /> Upload Document to Repository
              </h3>
              <button onClick={() => setShowUploadModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* File Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed var(--glass-border)', borderRadius: '14px', padding: '24px', textAlign: 'center', cursor: 'pointer',
                  background: selectedFile ? 'rgba(99,102,241,0.08)' : 'var(--bg-tertiary)', transition: 'all 0.2s'
                }}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  style={{ display: 'none' }}
                />
                {selectedFile ? (
                  <div>
                    <CheckCircle size={32} color="#4ade80" style={{ marginBottom: '8px' }} />
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{selectedFile.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{formatBytes(selectedFile.size)}</div>
                  </div>
                ) : (
                  <div>
                    <Upload size={32} color="var(--accent-primary)" style={{ marginBottom: '8px' }} />
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Click or drag file to select</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>PDF, Images, Word, Excel, CSV, ZIP (Max 50MB)</div>
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Document Title</label>
                <input
                  type="text"
                  placeholder="e.g. Q3 Commercial Lease Agreement"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Category</label>
                  <select
                    value={uploadForm.categoryId}
                    onChange={(e) => setUploadForm({ ...uploadForm, categoryId: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                  >
                    <option value="">Select Category...</option>
                    {categories.map((c) => (
                      <option key={c.CategoryID} value={c.CategoryID}>{c.CategoryName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Tags (comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. lease, legal, block-A"
                    value={uploadForm.tags}
                    onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Description / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Optional brief description of the document..."
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '20px', padding: '10px 0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                  <input
                    type="checkbox"
                    checked={uploadForm.isSensitive}
                    onChange={(e) => setUploadForm({ ...uploadForm, isSensitive: e.target.checked })}
                  />
                  <Lock size={15} color="#ef4444" /> Mark as Confidential / Sensitive
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  style={{ padding: '10px 18px', borderRadius: '10px', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  style={{ padding: '10px 22px', borderRadius: '10px', background: 'var(--accent-gradient)', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                >
                  {uploading ? 'Uploading...' : 'Confirm Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── PREVIEW MODAL ── */}
      {showPreviewModal && selectedDocForPreview && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', flexDirection: 'column', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', color: '#fff' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{selectedDocForPreview.Title}</h3>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>{selectedDocForPreview.FileName} ({formatBytes(selectedDocForPreview.FileSize)})</div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <a
                href={fileDocumentApi.getDownloadUrl(selectedDocForPreview.DocumentID)}
                download
                style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--accent-gradient)', color: '#fff', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Download size={16} /> Download
              </a>
              <button onClick={() => setShowPreviewModal(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={24} /></button>
            </div>
          </div>

          <div style={{ flex: 1, background: 'var(--bg-tertiary)', borderRadius: '16px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {selectedDocForPreview.MimeType?.startsWith('image/') ? (
              <img
                src={fileDocumentApi.getPreviewUrl(selectedDocForPreview.DocumentID)}
                alt="Preview"
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              />
            ) : selectedDocForPreview.MimeType?.includes('pdf') ? (
              <iframe
                src={fileDocumentApi.getPreviewUrl(selectedDocForPreview.DocumentID)}
                title="PDF Preview"
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            ) : (
              <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                <FileText size={48} style={{ marginBottom: '12px' }} />
                <div>Preview not directly embeddable for this file type.</div>
                <a
                  href={fileDocumentApi.getDownloadUrl(selectedDocForPreview.DocumentID)}
                  download
                  style={{ color: '#818cf8', display: 'inline-block', marginTop: '12px', textDecoration: 'underline' }}
                >
                  Download File to View
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── VERSIONS MODAL ── */}
      {showVersionModal && selectedDocForVersion && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '640px', padding: '28px', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Version History & Control</h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>{selectedDocForVersion.Title}</div>
              </div>
              <button onClick={() => setShowVersionModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {/* Upload New Version Form */}
            <form onSubmit={handleVersionSubmit} style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', marginBottom: '20px' }}>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '10px' }}>Upload New Document Revision</div>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '10px' }}>
                <input
                  type="file"
                  ref={versionFileInputRef}
                  onChange={(e) => setSelectedVersionFile(e.target.files[0])}
                  style={{ flex: 1, padding: '8px', borderRadius: '8px', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                />
              </div>
              <input
                type="text"
                placeholder="Change notes (e.g. Updated Section 4 SLA targets)"
                value={versionForm.changeNotes}
                onChange={(e) => setVersionForm({ changeNotes: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontSize: '0.82rem', marginBottom: '12px' }}
              />
              <button
                type="submit"
                disabled={uploadingVersion}
                style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--accent-gradient)', border: 'none', color: '#fff', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
              >
                {uploadingVersion ? 'Uploading...' : 'Add Version'}
              </button>
            </form>

            {/* History List */}
            <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
              {versionHistory.map((ver) => (
                <div key={ver.VersionID} style={{ padding: '12px 16px', borderRadius: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '6px', background: 'rgba(99,102,241,0.15)', color: '#818cf8', fontWeight: 700, fontSize: '0.78rem' }}>
                        Version {ver.VersionNumber}
                      </span>
                      <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{ver.FileName}</span>
                    </div>
                    {ver.ChangeNotes && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>{ver.ChangeNotes}</div>}
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Uploaded by {ver.UploaderName || 'System'} on {new Date(ver.CreatedAt).toLocaleDateString()}
                    </div>
                  </div>

                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{formatBytes(ver.FileSize)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── SHARE MODAL ── */}
      {showShareModal && selectedDocForShare && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', padding: '28px', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Share2 size={20} color="var(--accent-primary)" /> Document Share Link
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>{selectedDocForShare.Title}</div>
              </div>
              <button onClick={() => setShowShareModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {!generatedShare ? (
              <form onSubmit={handleCreateShare} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Access Level</label>
                  <select
                    value={shareForm.accessLevel}
                    onChange={(e) => setShareForm({ ...shareForm, accessLevel: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                  >
                    <option value="VIEW">View Only</option>
                    <option value="DOWNLOAD">Download Allowed</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                  <button type="submit" style={{ padding: '10px 22px', borderRadius: '10px', background: 'var(--accent-gradient)', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                    Generate Secure Link
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <Link size={18} color="var(--accent-primary)" />
                  <input
                    type="text"
                    readOnly
                    value={generatedShare}
                    style={{ flex: 1, background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '0.82rem' }}
                  />
                  <button
                    onClick={handleCopyShare}
                    style={{ padding: '6px 12px', borderRadius: '6px', background: copiedShare ? '#22c55e' : 'var(--accent-gradient)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    {copiedShare ? <Check size={14} /> : <Copy size={14} />} {copiedShare ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle size={14} /> Share link generated and ready to distribute.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
