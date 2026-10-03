import React, { useState, useEffect } from 'react';
import { History, FileText, Download, User, Calendar, Layers, RefreshCw, ArrowRight } from 'lucide-react';
import fileDocumentApi from '../api/fileDocumentApi';

export default function DocumentVersionsTab() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [docDetail, setDocDetail] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await fileDocumentApi.getDocuments({ limit: 50 });
      const docs = res.data?.data?.documents || [];
      setDocuments(docs);
      if (docs.length > 0) {
        loadDocDetail(docs[0].DocumentID);
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDocDetail = async (id) => {
    setSelectedDocId(id);
    try {
      const res = await fileDocumentApi.getDocumentById(id);
      setDocDetail(res.data?.data || null);
    } catch (err) {
      console.error('Failed to load version detail:', err);
    }
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
      {/* Overview Banner */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Document Versioning & Audit History</h3>
        <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Track revisions, audit author changes, inspect historical iterations, and restore previous file versions
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 360px) 1fr', gap: '20px' }}>
        {/* Left Column: Document Select List */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>Select Document</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '520px', overflowY: 'auto' }}>
            {documents.map((d) => {
              const isSelected = d.DocumentID === selectedDocId;
              return (
                <div
                  key={d.DocumentID}
                  onClick={() => loadDocDetail(d.DocumentID)}
                  style={{
                    padding: '12px 14px', borderRadius: '10px', cursor: 'pointer',
                    background: isSelected ? 'var(--accent-gradient)' : 'var(--bg-tertiary)',
                    color: isSelected ? '#fff' : 'var(--text-primary)',
                    border: '1px solid var(--glass-border)', transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{d.Title}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '4px', opacity: isSelected ? 0.9 : 0.6 }}>
                    <span>{d.FileName}</span>
                    <span style={{ fontWeight: 700 }}>v{d.CurrentVersion || 1}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Version Timeline */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          {!docDetail ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Select a document to inspect version timeline</div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>{docDetail.Title}</h3>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Active File: <strong>{docDetail.FileName}</strong> ({formatBytes(docDetail.FileSize)})
                  </div>
                </div>
                <span style={{ padding: '4px 12px', borderRadius: '20px', background: 'rgba(99,102,241,0.15)', color: '#818cf8', fontWeight: 800, fontSize: '0.82rem', border: '1px solid rgba(99,102,241,0.3)' }}>
                  Current Version: v{docDetail.CurrentVersion || 1}
                </span>
              </div>

              <h4 style={{ margin: '0 0 16px', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <History size={18} color="var(--accent-primary)" /> Revision History Timeline
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative' }}>
                {(docDetail.versions || []).map((ver, idx) => (
                  <div
                    key={ver.VersionID}
                    style={{
                      padding: '16px', borderRadius: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                      borderLeft: idx === 0 ? '4px solid #4ade80' : '4px solid #818cf8', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: '6px', background: idx === 0 ? 'rgba(74,222,128,0.15)' : 'rgba(99,102,241,0.15)', color: idx === 0 ? '#4ade80' : '#818cf8', fontWeight: 800, fontSize: '0.8rem' }}>
                          Version {ver.VersionNumber} {idx === 0 && '(Active Latest)'}
                        </span>
                        <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>{ver.FileName}</span>
                      </div>

                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                        {ver.ChangeNotes || 'No change notes documented.'}
                      </div>

                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '6px', display: 'flex', gap: '14px' }}>
                        <span>Uploaded by: <strong>{ver.UploaderName || 'System'}</strong></span>
                        <span>Date: {new Date(ver.CreatedAt).toLocaleString()}</span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>{formatBytes(ver.FileSize)}</div>
                      <a
                        href={fileDocumentApi.getDownloadUrl(docDetail.DocumentID)}
                        download
                        style={{ padding: '6px 14px', borderRadius: '8px', background: 'var(--accent-gradient)', color: '#fff', fontSize: '0.78rem', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Download size={14} /> Download
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
