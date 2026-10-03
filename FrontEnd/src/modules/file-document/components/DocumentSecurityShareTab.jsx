import React, { useState, useEffect } from 'react';
import { Shield, Lock, Share2, Key, UserCheck, Eye, Download, CheckCircle, AlertTriangle, Link, Search } from 'lucide-react';
import fileDocumentApi from '../api/fileDocumentApi';

export default function DocumentSecurityShareTab() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shareTokenInput, setShareTokenInput] = useState('');
  const [shareResult, setShareResult] = useState(null);
  const [shareError, setShareError] = useState('');

  useEffect(() => {
    fetchSensitiveDocs();
  }, []);

  const fetchSensitiveDocs = async () => {
    try {
      setLoading(true);
      const res = await fileDocumentApi.getDocuments({ limit: 50 });
      setDocuments(res.data?.data?.documents || []);
    } catch (err) {
      console.error('Failed to fetch security docs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLookupShare = async (e) => {
    e.preventDefault();
    if (!shareTokenInput.trim()) return;
    setShareResult(null);
    setShareError('');
    try {
      const token = shareTokenInput.trim().split('/').pop();
      const res = await fileDocumentApi.getShareByToken(token);
      setShareResult(res.data?.data || null);
    } catch (err) {
      setShareError(err.response?.data?.message || 'Share link invalid or expired');
    }
  };

  const sensitiveDocs = documents.filter((d) => d.IsSensitive === 1);

  return (
    <div>
      {/* Overview Banner */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Document Security & Share Token Management</h3>
        <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Manage confidential document permissions, token-based share access, and validate secure document links
        </p>
      </div>

      {/* Share Link Token Validator */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <h4 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Key size={18} color="var(--accent-primary)" /> Share Link Token Validator
        </h4>
        <p style={{ margin: '0 0 16px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Enter a share token or full link URL to test permissions and verify access status
        </p>

        <form onSubmit={handleLookupShare} style={{ display: 'flex', gap: '12px', maxWidth: '600px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Link size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Paste share UUID token or full link..."
              value={shareTokenInput}
              onChange={(e) => setShareTokenInput(e.target.value)}
              style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
            />
          </div>
          <button type="submit" style={{ padding: '10px 20px', borderRadius: '10px', background: 'var(--accent-gradient)', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
            Verify Token
          </button>
        </form>

        {shareError && (
          <div style={{ marginTop: '16px', padding: '12px 16px', borderRadius: '10px', background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444', color: '#ef4444', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} /> {shareError}
          </div>
        )}

        {shareResult && (
          <div style={{ marginTop: '16px', padding: '16px', borderRadius: '12px', background: 'rgba(34,197,94,0.1)', border: '1px solid #22c55e', color: 'var(--text-primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#22c55e', fontWeight: 700, marginBottom: '8px' }}>
              <CheckCircle size={18} /> Valid Active Share Link
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{shareResult.Title} ({shareResult.FileName})</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Access Level: <strong>{shareResult.AccessLevel}</strong> | Expiration: {shareResult.ExpiresAt ? new Date(shareResult.ExpiresAt).toLocaleString() : 'Never'}
            </div>
          </div>
        )}
      </div>

      {/* Sensitive Documents Security Audit Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h4 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Lock size={18} color="#ef4444" /> Sensitive & Confidential Document Registry ({sensitiveDocs.length})
        </h4>

        {sensitiveDocs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            No sensitive documents marked in registry.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px' }}>Title & File</th>
                  <th style={{ padding: '12px' }}>Category</th>
                  <th style={{ padding: '12px' }}>Security Level</th>
                  <th style={{ padding: '12px' }}>Downloads</th>
                  <th style={{ padding: '12px' }}>Date Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {sensitiveDocs.map((doc) => (
                  <tr key={doc.DocumentID} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{doc.Title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{doc.FileName}</div>
                    </td>
                    <td style={{ padding: '12px' }}>{doc.CategoryName || 'General'}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '6px', background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontWeight: 700, fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Lock size={11} /> Sensitive
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>{doc.DownloadCount || 0}</td>
                    <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{new Date(doc.CreatedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
