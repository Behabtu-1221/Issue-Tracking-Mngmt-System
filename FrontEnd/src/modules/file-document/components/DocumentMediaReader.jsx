import React, { useState, useEffect } from 'react';
import {
  FileText,
  Image as ImageIcon,
  Download,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  File,
  Film,
  Music,
  Code,
  Paperclip,
  Plus,
  X
} from 'lucide-react';

export default function DocumentMediaReader({ documents = [], canUpload = false, onUpload = null }) {
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const token = localStorage.getItem('token') || '';

  // Auto select first document
  useEffect(() => {
    if (documents && documents.length > 0) {
      if (!selectedDoc || !documents.some(d => (d.DocumentID || d.DocumentUUID) === (selectedDoc.DocumentID || selectedDoc.DocumentUUID))) {
        setSelectedDoc(documents[0]);
      }
    } else {
      setSelectedDoc(null);
    }
  }, [documents]);

  // Reset zoom & rotation when active document changes
  useEffect(() => {
    setZoom(1);
    setRotation(0);
  }, [selectedDoc?.DocumentID, selectedDoc?.DocumentUUID]);

  if (!documents || documents.length === 0) {
    return (
      <div style={{
        padding: '48px 24px',
        textAlign: 'center',
        background: 'var(--bg-tertiary)',
        borderRadius: '16px',
        border: '1px dashed var(--glass-border)',
        color: 'var(--text-muted)'
      }}>
        <File size={42} style={{ opacity: 0.35, marginBottom: '12px', color: 'var(--accent-primary)' }} />
        <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
          No Attached Documents or Media
        </div>
        <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', maxWidth: '380px', margin: '0 auto 16px' }}>
          No uploaded files, evidence photos, or documents were attached to this request.
        </div>
        {canUpload && onUpload && (
          <button
            onClick={onUpload}
            style={{
              padding: '9px 18px',
              borderRadius: '10px',
              background: 'var(--accent-gradient)',
              border: 'none',
              color: '#ffffff',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Plus size={16} /> Attach Document / Photo
          </button>
        )}
      </div>
    );
  }

  const getDocType = (doc) => {
    if (!doc) return 'file';
    const mime = (doc.MimeType || '').toLowerCase();
    const ext = (doc.FileExtension || '').toLowerCase();

    if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp'].includes(ext)) {
      return 'image';
    }
    if (mime === 'application/pdf' || ext === 'pdf') {
      return 'pdf';
    }
    if (mime.startsWith('video/') || ['mp4', 'webm', 'mov', 'mkv', 'avi'].includes(ext)) {
      return 'video';
    }
    if (mime.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) {
      return 'audio';
    }
    if (mime.startsWith('text/') || ['txt', 'log', 'json', 'csv', 'xml', 'md'].includes(ext)) {
      return 'text';
    }
    return 'generic';
  };

  const getDocIcon = (type) => {
    switch (type) {
      case 'image': return <ImageIcon size={18} color="#10b981" />;
      case 'pdf': return <FileText size={18} color="#ef4444" />;
      case 'video': return <Film size={18} color="#8b5cf6" />;
      case 'audio': return <Music size={18} color="#ec4899" />;
      case 'text': return <Code size={18} color="#3b82f6" />;
      default: return <File size={18} color="var(--accent-primary)" />;
    }
  };

  const activeType = getDocType(selectedDoc);

  const getPreviewUrl = (doc) => {
    if (!doc) return '';
    const id = doc.DocumentID || doc.DocumentUUID;
    return `/api/documents/${id}/preview${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  };

  const getDownloadUrl = (doc) => {
    if (!doc) return '';
    const id = doc.DocumentID || doc.DocumentUUID;
    return `/api/documents/${id}/download${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Reader Controls Header Bar */}
      <div style={{
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        background: 'var(--bg-tertiary)',
        padding: '12px 18px',
        borderRadius: '14px',
        border: '1px solid var(--glass-border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Paperclip size={18} color="var(--accent-primary)" />
          <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
            ATTACHED DOCUMENTS & MEDIA READER ({documents.length})
          </span>
        </div>

        {canUpload && onUpload && (
          <button
            onClick={onUpload}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              background: 'var(--accent-gradient)',
              border: 'none',
              color: '#ffffff',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Plus size={14} /> Attach File
          </button>
        )}
      </div>

      {/* Main Split Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '16px', minHeight: '440px' }}>
        {/* Left Sidebar Document List */}
        <div style={{
          background: 'var(--bg-tertiary)',
          borderRadius: '14px',
          border: '1px solid var(--glass-border)',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          maxHeight: '520px',
          overflowY: 'auto'
        }}>
          {documents.map((doc) => {
            const isSelected = (selectedDoc?.DocumentID || selectedDoc?.DocumentUUID) === (doc.DocumentID || doc.DocumentUUID);
            const docType = getDocType(doc);
            return (
              <div
                key={doc.DocumentID || doc.DocumentUUID}
                onClick={() => setSelectedDoc(doc)}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--glass-border)',
                  background: isSelected ? 'rgba(99, 102, 241, 0.16)' : 'var(--bg-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {getDocIcon(docType)}
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{
                      fontWeight: 700,
                      fontSize: '0.84rem',
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {doc.Title || doc.FileName}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {doc.FileName}
                    </div>
                    <div style={{ fontSize: '0.70rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', gap: '6px' }}>
                      <span>{doc.FileSize ? (doc.FileSize / 1024).toFixed(1) : '0'} KB</span>
                      <span>•</span>
                      <span style={{ textTransform: 'uppercase', fontWeight: 600 }}>{doc.FileExtension || 'FILE'}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Active Document / Image Viewer Pane */}
        <div style={{
          background: 'var(--bg-tertiary)',
          borderRadius: '14px',
          border: '1px solid var(--glass-border)',
          padding: '18px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {selectedDoc ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '14px' }}>
              {/* Header Bar for Selected Document */}
              <div style={{
                display: 'flex',
                justify: 'space-between',
                alignItems: 'center',
                paddingBottom: '12px',
                borderBottom: '1px solid var(--glass-border)'
              }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {selectedDoc.Title || selectedDoc.FileName}
                  </h4>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {selectedDoc.FileName} • {selectedDoc.FileSize ? (selectedDoc.FileSize / 1024).toFixed(1) : '0'} KB
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {activeType === 'image' && (
                    <>
                      <button
                        onClick={() => setZoom(z => Math.min(z + 0.25, 3))}
                        title="Zoom In"
                        style={{ padding: '6px', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', cursor: 'pointer' }}
                      >
                        <ZoomIn size={15} />
                      </button>
                      <button
                        onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))}
                        title="Zoom Out"
                        style={{ padding: '6px', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', cursor: 'pointer' }}
                      >
                        <ZoomOut size={15} />
                      </button>
                      <button
                        onClick={() => setRotation(r => (r + 90) % 360)}
                        title="Rotate 90°"
                        style={{ padding: '6px', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', cursor: 'pointer' }}
                      >
                        <RotateCw size={15} />
                      </button>
                      <button
                        onClick={() => setIsFullscreen(true)}
                        title="Fullscreen Preview"
                        style={{ padding: '6px', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', cursor: 'pointer' }}
                      >
                        <Maximize2 size={15} />
                      </button>
                    </>
                  )}

                  <a
                    href={getPreviewUrl(selectedDoc)}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--text-primary)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <ExternalLink size={14} /> Open Tab
                  </a>

                  <a
                    href={getDownloadUrl(selectedDoc)}
                    download
                    style={{
                      padding: '6px 14px',
                      borderRadius: '6px',
                      background: 'var(--accent-gradient)',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Download size={14} /> Download
                  </a>
                </div>
              </div>

              {/* Viewport Area */}
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justify: 'center',
                overflow: 'hidden',
                background: 'var(--bg-secondary)',
                borderRadius: '10px',
                padding: '12px',
                minHeight: '340px'
              }}>
                {activeType === 'image' && (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'center',
                    overflow: 'auto',
                    cursor: 'grab'
                  }}>
                    <img
                      src={getPreviewUrl(selectedDoc)}
                      alt={selectedDoc.FileName}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '380px',
                        objectFit: 'contain',
                        transform: `scale(${zoom}) rotate(${rotation}deg)`,
                        transition: 'transform 0.2s ease-in-out',
                        borderRadius: '8px'
                      }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/600x400?text=Photo+Preview+Unavailable';
                      }}
                    />
                  </div>
                )}

                {activeType === 'pdf' && (
                  <iframe
                    src={getPreviewUrl(selectedDoc)}
                    title={selectedDoc.FileName}
                    width="100%"
                    height="420px"
                    style={{ border: 'none', borderRadius: '8px' }}
                  />
                )}

                {activeType === 'video' && (
                  <video
                    src={getPreviewUrl(selectedDoc)}
                    controls
                    autoPlay={false}
                    style={{ maxWidth: '100%', maxHeight: '380px', borderRadius: '8px' }}
                  >
                    Your browser does not support HTML5 video playback.
                  </video>
                )}

                {activeType === 'audio' && (
                  <div style={{ width: '100%', maxWidth: '400px', textAlign: 'center', padding: '20px' }}>
                    <Music size={48} color="var(--accent-primary)" style={{ marginBottom: '16px' }} />
                    <audio
                      src={getPreviewUrl(selectedDoc)}
                      controls
                      style={{ width: '100%' }}
                    >
                      Your browser does not support HTML5 audio playback.
                    </audio>
                  </div>
                )}

                {activeType === 'text' && (
                  <iframe
                    src={getPreviewUrl(selectedDoc)}
                    title={selectedDoc.FileName}
                    width="100%"
                    height="380px"
                    style={{
                      border: 'none',
                      borderRadius: '8px',
                      background: '#090d16',
                      color: '#38bdf8'
                    }}
                  />
                )}

                {activeType === 'generic' && (
                  <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    <FileText size={56} color="var(--accent-primary)" style={{ marginBottom: '14px', opacity: 0.8 }} />
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {selectedDoc.FileName}
                    </div>
                    <div style={{ fontSize: '0.82rem', marginBottom: '16px' }}>
                      File Format: <strong>{(selectedDoc.FileExtension || 'Document').toUpperCase()}</strong> • Size: <strong>{selectedDoc.FileSize ? (selectedDoc.FileSize / 1024).toFixed(1) : '0'} KB</strong>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                      <a
                        href={getDownloadUrl(selectedDoc)}
                        download
                        style={{
                          padding: '8px 18px',
                          borderRadius: '8px',
                          background: 'var(--accent-gradient)',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Download size={16} /> Download File
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Select a document from the list to preview.
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Photo Modal */}
      {isFullscreen && selectedDoc && activeType === 'image' && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.92)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justify: 'center',
          padding: '24px'
        }}>
          <button
            onClick={() => setIsFullscreen(false)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justify: 'center'
            }}
          >
            <X size={24} />
          </button>
          <img
            src={getPreviewUrl(selectedDoc)}
            alt={selectedDoc.FileName}
            style={{
              maxWidth: '90vw',
              maxHeight: '85vh',
              objectFit: 'contain',
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transition: 'transform 0.2s ease-in-out'
            }}
          />
        </div>
      )}
    </div>
  );
}
