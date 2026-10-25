import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Image as ImageIcon,
  Download,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  File,
  Film,
  Music,
  Code,
  Paperclip,
  Plus,
  X,
  Printer,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Info,
  Check,
  Copy,
  Eye,
  FileSpreadsheet,
  FileCode,
  HelpCircle,
  FileArchive,
  AlertCircle
} from 'lucide-react';
import { STORAGE_KEYS } from '../../../modules/authentication/constants/authConstants';
import { useTranslation } from '../../../i18n/LanguageContext';
import { getServerBaseUrl } from '../../../api/client';

const API_BASE_URL = getServerBaseUrl();

export default function DocumentMediaReader({
  documents = [],
  canUpload = false,
  onUpload = null,
  initialDocId = null,
  compact = false
}) {
  const { t } = useTranslation();
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'PDF' | 'IMAGE' | 'DOC'
  
  // Blob loading state
  const [blobUrl, setBlobUrl] = useState(null);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [docError, setDocError] = useState(null);
  const [textContent, setTextContent] = useState('');
  const [textCopied, setTextCopied] = useState(false);

  const iframeRef = useRef(null);

  // Securely retrieve active JWT token from sessionStorage or localStorage
  const getToken = () => {
    return (
      sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) ||
      localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) ||
      sessionStorage.getItem('token') ||
      localStorage.getItem('token') ||
      ''
    );
  };

  // Helper to determine document format
  const getDocType = (doc) => {
    if (!doc) return 'generic';
    const mime = (doc.MimeType || '').toLowerCase();
    const ext = (doc.FileExtension || '').toLowerCase();

    if (mime === 'application/pdf' || ext === 'pdf') {
      return 'pdf';
    }
    if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp'].includes(ext)) {
      return 'image';
    }
    if (['doc', 'docx', 'odt', 'rtf'].includes(ext) || mime.includes('word') || mime.includes('document')) {
      return 'word';
    }
    if (['xls', 'xlsx', 'csv', 'ods'].includes(ext) || mime.includes('excel') || mime.includes('spreadsheet') || mime === 'text/csv') {
      return ext === 'csv' ? 'csv' : 'excel';
    }
    if (['ppt', 'pptx', 'odp'].includes(ext) || mime.includes('presentation') || mime.includes('powerpoint')) {
      return 'powerpoint';
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext) || mime.includes('zip') || mime.includes('compressed')) {
      return 'archive';
    }
    if (mime.startsWith('video/') || ['mp4', 'webm', 'mov', 'mkv', 'avi'].includes(ext)) {
      return 'video';
    }
    if (mime.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) {
      return 'audio';
    }
    if (mime.startsWith('text/') || ['txt', 'log', 'json', 'xml', 'md', 'yml', 'yaml', 'sql', 'js', 'html', 'css'].includes(ext)) {
      return 'text';
    }
    return 'generic';
  };

  // Select initial document or first document
  useEffect(() => {
    if (documents && documents.length > 0) {
      if (initialDocId) {
        const found = documents.find(d => (d.DocumentID || d.DocumentUUID) === initialDocId);
        if (found) {
          setSelectedDoc(found);
          return;
        }
      }
      if (!selectedDoc || !documents.some(d => (d.DocumentID || d.DocumentUUID) === (selectedDoc.DocumentID || selectedDoc.DocumentUUID))) {
        setSelectedDoc(documents[0]);
      }
    } else {
      setSelectedDoc(null);
    }
  }, [documents, initialDocId]);

  // Fetch document binary blob from backend server when selectedDoc changes
  useEffect(() => {
    let active = true;
    let createdUrl = null;

    setZoom(1);
    setRotation(0);
    setTextContent('');

    const fetchDocumentData = async () => {
      if (!selectedDoc) {
        setBlobUrl(null);
        setDocError(null);
        return;
      }

      setLoadingDoc(true);
      setDocError(null);

      try {
        const id = selectedDoc.DocumentID || selectedDoc.DocumentUUID;
        const currentToken = getToken();
        const requestUrl = `${API_BASE_URL}/api/documents/${id}/preview?token=${encodeURIComponent(currentToken)}`;

        const headers = {};
        if (currentToken) {
          headers['Authorization'] = `Bearer ${currentToken}`;
        }

        const res = await fetch(requestUrl, { headers });
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.message || `Failed to fetch file stream (${res.status} ${res.statusText})`);
        }

        const mime = (selectedDoc.MimeType || '').toLowerCase();
        const ext = (selectedDoc.FileExtension || '').toLowerCase();
        const isPdf = mime === 'application/pdf' || ext === 'pdf';
        const isImage = mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp'].includes(ext);
        const isText = mime.startsWith('text/') || ['txt', 'csv', 'log', 'json', 'xml', 'md'].includes(ext);

        const rawBlob = await res.blob();

        if (!active) return;

        if (isPdf) {
          const pdfBlob = new Blob([rawBlob], { type: 'application/pdf' });
          createdUrl = URL.createObjectURL(pdfBlob);
          setBlobUrl(createdUrl);
        } else if (isImage) {
          createdUrl = URL.createObjectURL(rawBlob);
          setBlobUrl(createdUrl);
        } else {
          createdUrl = URL.createObjectURL(rawBlob);
          setBlobUrl(createdUrl);
          if (isText) {
            const txt = await rawBlob.text();
            if (active) setTextContent(txt);
          }
        }
      } catch (err) {
        if (active) {
          console.error('Document preview error:', err);
          setDocError(err.message || 'Unable to render document preview.');
        }
      } finally {
        if (active) setLoadingDoc(false);
      }
    };

    fetchDocumentData();

    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [selectedDoc?.DocumentID, selectedDoc?.DocumentUUID]);

  // Handle ESC key for fullscreen reader
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const getDocIcon = (type, size = 18) => {
    switch (type) {
      case 'pdf': return <FileText size={size} color="#ef4444" />;
      case 'image': return <ImageIcon size={size} color="#10b981" />;
      case 'word': return <FileText size={size} color="#3b82f6" />;
      case 'excel': return <FileSpreadsheet size={size} color="#10b981" />;
      case 'csv': return <FileCode size={size} color="#059669" />;
      case 'powerpoint': return <FileText size={size} color="#f97316" />;
      case 'video': return <Film size={size} color="#8b5cf6" />;
      case 'audio': return <Music size={size} color="#ec4899" />;
      case 'text': return <Code size={size} color="#06b6d4" />;
      case 'archive': return <FileArchive size={size} color="#eab308" />;
      default: return <File size={size} color="var(--accent-primary)" />;
    }
  };

  const getDocBadgeColor = (type) => {
    switch (type) {
      case 'pdf': return { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' };
      case 'image': return { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)' };
      case 'word': return { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' };
      case 'excel':
      case 'csv': return { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)' };
      case 'powerpoint': return { bg: 'rgba(249, 115, 22, 0.15)', text: '#f97316', border: 'rgba(249, 115, 22, 0.3)' };
      default: return { bg: 'rgba(99, 102, 241, 0.15)', text: 'var(--accent-primary)', border: 'rgba(99, 102, 241, 0.3)' };
    }
  };

  const handlePrint = () => {
    if (blobUrl) {
      const printWindow = window.open(blobUrl, '_blank');
      if (printWindow) {
        printWindow.focus();
      }
    }
  };

  const handleCopyText = () => {
    if (textContent) {
      navigator.clipboard.writeText(textContent);
      setTextCopied(true);
      setTimeout(() => setTextCopied(false), 2000);
    }
  };

  // Filter documents
  const filteredDocs = (documents || []).filter(d => {
    if (activeFilter === 'ALL') return true;
    const type = getDocType(d);
    if (activeFilter === 'PDF') return type === 'pdf';
    if (activeFilter === 'IMAGE') return type === 'image';
    if (activeFilter === 'DOC') return ['word', 'excel', 'powerpoint', 'text', 'csv', 'generic'].includes(type);
    return true;
  });

  const activeType = getDocType(selectedDoc);
  const badgeStyle = getDocBadgeColor(activeType);

  const selectedIndex = documents.findIndex(
    d => (d.DocumentID || d.DocumentUUID) === (selectedDoc?.DocumentID || selectedDoc?.DocumentUUID)
  );

  const handleNextDoc = () => {
    if (selectedIndex < documents.length - 1) {
      setSelectedDoc(documents[selectedIndex + 1]);
    }
  };

  const handlePrevDoc = () => {
    if (selectedIndex > 0) {
      setSelectedDoc(documents[selectedIndex - 1]);
    }
  };

  if (!documents || documents.length === 0) {
    return (
      <div style={{
        padding: compact ? '28px 16px' : '48px 24px',
        textAlign: 'center',
        background: 'var(--bg-tertiary)',
        borderRadius: '16px',
        border: '1px dashed var(--glass-border)',
        color: 'var(--text-muted)'
      }}>
        <File size={38} style={{ opacity: 0.35, marginBottom: '12px', color: 'var(--accent-primary)' }} />
        <div style={{ fontWeight: '700', fontSize: '0.98rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
          {t('documents.noAttachedFiles', 'No Attached Documents or PDF Files')}
        </div>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '380px', margin: '0 auto 16px' }}>
          {t('documents.noAttachedDesc', 'No supporting files, evidence photos, or PDF documents were submitted with this service request.')}
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
            <Plus size={16} /> {t('documents.attachFile', 'Attach Document / Photo')}
          </button>
        )}
      </div>
    );
  }

  // Reader Canvas Component
  const renderReaderCanvas = (isTheater = false) => {
    if (!selectedDoc) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
          {t('documents.selectToPreview', 'Select a document from the list to preview.')}
        </div>
      );
    }

    const canvasHeight = isTheater ? 'calc(100vh - 120px)' : (compact ? '480px' : 'clamp(360px, 55vh, 620px)');

    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        gap: '12px',
        width: '100%'
      }}>
        {/* Document Header & Reader Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 p-2.5 sm:p-3.5 rounded-xl border border-[var(--glass-border)] bg-[var(--bg-secondary)]">
          {/* Doc Title & Meta Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1, width: '100%' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: badgeStyle.bg,
              border: `1px solid ${badgeStyle.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {getDocIcon(activeType, 20)}
            </div>

            <div style={{ overflow: 'hidden', minWidth: 0, flex: 1 }}>
              <div style={{
                fontWeight: 800,
                fontSize: '0.92rem',
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {selectedDoc.Title || selectedDoc.FileName}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{
                  padding: '1px 6px',
                  borderRadius: '4px',
                  background: badgeStyle.bg,
                  color: badgeStyle.text,
                  fontWeight: 800,
                  fontSize: '0.68rem',
                  textTransform: 'uppercase'
                }}>
                  {selectedDoc.FileExtension || activeType}
                </span>
                <span>•</span>
                <span>{selectedDoc.FileSize ? (selectedDoc.FileSize / 1024).toFixed(1) + ' KB' : 'Size N/A'}</span>
                <span>•</span>
                <span style={{ color: 'var(--text-muted)' }}>
                  {documents.length > 1 ? `${selectedIndex + 1} of ${documents.length}` : 'Attachment'}
                </span>
              </div>
            </div>
          </div>

          {/* Controls: Zoom, Rotate, Print, Download, Fullscreen */}
          <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto justify-end pt-1 sm:pt-0 border-t sm:border-t-0 border-[var(--glass-border)]">
            {/* Quick Document Switcher */}
            {documents.length > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: 'var(--bg-tertiary)', borderRadius: '8px', padding: '2px', border: '1px solid var(--glass-border)', marginRight: '6px' }}>
                <button
                  type="button"
                  disabled={selectedIndex <= 0}
                  onClick={handlePrevDoc}
                  title="Previous Document"
                  style={{
                    padding: '6px',
                    borderRadius: '6px',
                    background: 'transparent',
                    border: 'none',
                    color: selectedIndex <= 0 ? 'var(--text-muted)' : 'var(--text-primary)',
                    cursor: selectedIndex <= 0 ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: selectedIndex <= 0 ? 0.4 : 1
                  }}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  disabled={selectedIndex >= documents.length - 1}
                  onClick={handleNextDoc}
                  title="Next Document"
                  style={{
                    padding: '6px',
                    borderRadius: '6px',
                    background: 'transparent',
                    border: 'none',
                    color: selectedIndex >= documents.length - 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                    cursor: selectedIndex >= documents.length - 1 ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: selectedIndex >= documents.length - 1 ? 0.4 : 1
                  }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            {/* Image / Zoomable Controls */}
            {(activeType === 'image' || activeType === 'pdf') && (
              <>
                <button
                  type="button"
                  onClick={() => setZoom(z => Math.max(0.5, Number((z - 0.25).toFixed(2))))}
                  title="Zoom Out"
                  style={{
                    padding: '6px 8px',
                    borderRadius: '7px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  <ZoomOut size={15} />
                </button>

                <div
                  title="Click to reset zoom"
                  onClick={() => setZoom(1)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--glass-border)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    minWidth: '42px',
                    textAlign: 'center'
                  }}
                >
                  {Math.round(zoom * 100)}%
                </div>

                <button
                  type="button"
                  onClick={() => setZoom(z => Math.min(3, Number((z + 0.25).toFixed(2))))}
                  title="Zoom In"
                  style={{
                    padding: '6px 8px',
                    borderRadius: '7px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  <ZoomIn size={15} />
                </button>

                <button
                  type="button"
                  onClick={() => setRotation(r => (r + 90) % 360)}
                  title="Rotate Clockwise (90°)"
                  style={{
                    padding: '6px 8px',
                    borderRadius: '7px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  <RotateCw size={15} />
                </button>
              </>
            )}

            {/* Print Action for PDF or Image */}
            {blobUrl && (activeType === 'pdf' || activeType === 'image') && (
              <button
                type="button"
                onClick={handlePrint}
                title="Print Document"
                style={{
                  padding: '6px 10px',
                  borderRadius: '7px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-primary)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '4px'
                }}
              >
                <Printer size={15} />
              </button>
            )}

            {/* Fullscreen / Theater Mode Button */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Reader Mode'}
              style={{
                padding: '6px 10px',
                borderRadius: '7px',
                background: isFullscreen ? 'var(--accent-gradient)' : 'var(--bg-tertiary)',
                border: '1px solid var(--glass-border)',
                color: isFullscreen ? '#ffffff' : 'var(--text-primary)',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '4px',
                boxShadow: isFullscreen ? 'var(--glow-accent)' : 'none'
              }}
            >
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              <span style={{ display: 'none', md: 'inline' }}>{isFullscreen ? 'Exit' : 'Reader Mode'}</span>
            </button>

            {/* Detached Tab */}
            {blobUrl && (
              <a
                href={blobUrl}
                target="_blank"
                rel="noreferrer"
                title="Open in Dedicated Tab"
                style={{
                  padding: '6px 10px',
                  borderRadius: '7px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-primary)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'flex', alignItems: 'center', gap: '4px'
                }}
              >
                <ExternalLink size={14} /> Open
              </a>
            )}

            {/* Direct Download Button */}
            {blobUrl && (
              <a
                href={blobUrl}
                download={selectedDoc.FileName}
                title="Download Secure File"
                style={{
                  padding: '6px 12px',
                  borderRadius: '7px',
                  background: 'var(--accent-gradient)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'flex', alignItems: 'center', gap: '5px',
                  boxShadow: 'var(--glow-accent)'
                }}
              >
                <Download size={14} /> Download
              </a>
            )}
          </div>
        </div>

        {/* Viewport Canvas Pane */}
        <div style={{
          height: canvasHeight,
          background: 'var(--bg-secondary)',
          borderRadius: '14px',
          border: '1px solid var(--glass-border)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}>
          {loadingDoc ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', color: 'var(--text-muted)' }}>
              <div className="spinner" style={{ width: '38px', height: '38px', borderTopColor: 'var(--accent-primary)' }} />
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Loading {selectedDoc.FileName}...
              </div>
            </div>
          ) : docError ? (
            <div style={{ padding: '32px', textAlign: 'center', maxWidth: '440px', margin: 'auto' }}>
              <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '14px' }} />
              <h4 style={{ margin: '0 0 8px', color: 'var(--text-primary)', fontWeight: 800 }}>Document Preview Error</h4>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '18px', lineHeight: 1.5 }}>
                {docError}
              </p>
              <button
                type="button"
                onClick={() => setSelectedDoc({ ...selectedDoc })}
                style={{
                  padding: '9px 18px',
                  borderRadius: '10px',
                  background: 'var(--accent-gradient)',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <RefreshCw size={14} /> Retry Loading
              </button>
            </div>
          ) : (
            <>
              {/* 1. PDF DOCUMENT READER */}
              {activeType === 'pdf' && blobUrl && (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                  <iframe
                    ref={iframeRef}
                    key={blobUrl}
                    src={`${blobUrl}#toolbar=1&navpanes=1&zoom=${Math.round(zoom * 100)}&view=FitH`}
                    title={selectedDoc.FileName}
                    width="100%"
                    height="100%"
                    style={{
                      border: 'none',
                      borderRadius: '12px',
                      width: '100%',
                      height: '100%',
                      transform: rotation ? `rotate(${rotation}deg)` : 'none',
                      transition: 'transform 0.2s ease-in-out'
                    }}
                  />
                </div>
              )}

              {/* 2. PHOTO & IMAGE READER */}
              {activeType === 'image' && blobUrl && (
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'auto',
                  padding: '16px',
                  cursor: zoom > 1 ? 'grab' : 'default'
                }}>
                  <img
                    src={blobUrl}
                    alt={selectedDoc.FileName}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      transform: `scale(${zoom}) rotate(${rotation}deg)`,
                      transition: 'transform 0.2s ease-in-out',
                      borderRadius: '8px',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.35)'
                    }}
                  />
                </div>
              )}

              {/* 3. TEXT & CSV & CODE VIEWER */}
              {(activeType === 'text' || activeType === 'csv') && (
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  background: '#0a0f1d',
                  borderRadius: '12px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 16px',
                    background: '#0d1527',
                    borderBottom: '1px solid rgba(255,255,255,0.08)'
                  }}>
                    <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 600 }}>
                      Source Preview: {selectedDoc.FileName}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyText}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: 'rgba(255,255,255,0.08)',
                        border: 'none',
                        color: '#e2e8f0',
                        fontSize: '0.72rem',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '4px'
                      }}
                    >
                      {textCopied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                      {textCopied ? 'Copied' : 'Copy'}
                    </button>
                  </div>

                  <div style={{ flex: 1, padding: '16px', overflow: 'auto' }}>
                    <pre style={{
                      margin: 0,
                      fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                      fontSize: '0.82rem',
                      color: '#38bdf8',
                      whiteSpace: 'pre-wrap',
                      lineHeight: '1.6'
                    }}>
                      {textContent || 'Empty document content.'}
                    </pre>
                  </div>
                </div>
              )}

              {/* 4. OFFICE DOCUMENTS (WORD, EXCEL, POWERPOINT) & GENERIC */}
              {['word', 'excel', 'powerpoint', 'archive', 'generic'].includes(activeType) && (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 24px',
                  maxWidth: '460px',
                  margin: 'auto'
                }}>
                  <div style={{
                    width: '74px',
                    height: '74px',
                    borderRadius: '20px',
                    background: badgeStyle.bg,
                    border: `1.5px solid ${badgeStyle.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    boxShadow: 'var(--glow-accent)'
                  }}>
                    {getDocIcon(activeType, 36)}
                  </div>

                  <h4 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {selectedDoc.Title || selectedDoc.FileName}
                  </h4>

                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
                    Format: <strong>{(selectedDoc.FileExtension || 'Document').toUpperCase()}</strong> • Size: <strong>{selectedDoc.FileSize ? (selectedDoc.FileSize / 1024).toFixed(1) + ' KB' : 'N/A'}</strong>
                  </div>

                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '22px' }}>
                    This file format is designed for native desktop software. Download it to inspect or edit in your local office suite.
                  </p>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    {blobUrl && (
                      <a
                        href={blobUrl}
                        download={selectedDoc.FileName}
                        style={{
                          padding: '10px 20px',
                          borderRadius: '10px',
                          background: 'var(--accent-gradient)',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '0.86rem',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          boxShadow: 'var(--glow-accent)'
                        }}
                      >
                        <Download size={16} /> Download {selectedDoc.FileExtension ? selectedDoc.FileExtension.toUpperCase() : 'File'}
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* 5. VIDEO & AUDIO MEDIA PLAYER */}
              {activeType === 'video' && blobUrl && (
                <video
                  src={blobUrl}
                  controls
                  autoPlay={false}
                  style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '10px' }}
                >
                  Your browser does not support HTML5 video playback.
                </video>
              )}

              {activeType === 'audio' && blobUrl && (
                <div style={{ width: '100%', maxWidth: '420px', textAlign: 'center', padding: '24px' }}>
                  <Music size={52} color="var(--accent-primary)" style={{ marginBottom: '16px' }} />
                  <h4 style={{ margin: '0 0 16px', color: 'var(--text-primary)' }}>{selectedDoc.FileName}</h4>
                  <audio
                    src={blobUrl}
                    controls
                    style={{ width: '100%' }}
                  >
                    Your browser does not support HTML5 audio playback.
                  </audio>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
      {/* Studio Header Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        background: 'var(--bg-tertiary)',
        padding: '12px 18px',
        borderRadius: '14px',
        border: '1px solid var(--glass-border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'var(--accent-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: 'var(--glow-accent)'
          }}>
            <Paperclip size={17} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.94rem', color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              {t('documents.readerTitle', 'ATTACHED DOCUMENTS & PDF READER')}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              {documents.length} {documents.length === 1 ? 'file available for verification' : 'files available for verification'}
            </div>
          </div>
        </div>

        {/* Filter Chips & Upload Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {documents.length > 2 && (
            <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-secondary)', padding: '3px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
              {['ALL', 'PDF', 'IMAGE', 'DOC'].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setActiveFilter(f)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    background: activeFilter === f ? 'var(--accent-gradient)' : 'transparent',
                    color: activeFilter === f ? '#ffffff' : 'var(--text-muted)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          )}

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
                gap: '6px',
                boxShadow: 'var(--glow-accent)'
              }}
            >
              <Plus size={14} /> {t('documents.attachFile', 'Attach File')}
            </button>
          )}
        </div>
      </div>

      {/* Main Dual-Pane Studio Layout */}
      <div 
        className={`grid gap-4 ${compact ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-[280px_1fr]'}`}
        style={{ minHeight: compact ? 'auto' : '520px' }}
      >
        {/* Left Document Sidebar List */}
        <div 
          className={`p-3 rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-tertiary)] flex gap-2 overflow-x-auto ${compact ? 'flex-row max-h-none' : 'lg:flex-col lg:overflow-y-auto lg:overflow-x-visible max-h-[140px] lg:max-h-[640px]'}`}
          style={{ scrollbarWidth: 'none' }}
        >
          {filteredDocs.map((doc) => {
            const isSelected = (selectedDoc?.DocumentID || selectedDoc?.DocumentUUID) === (doc.DocumentID || doc.DocumentUUID);
            const docType = getDocType(doc);
            const itemBadge = getDocBadgeColor(docType);

            return (
              <div
                key={doc.DocumentID || doc.DocumentUUID}
                onClick={() => setSelectedDoc(doc)}
                className={`shrink-0 ${compact ? '' : 'lg:shrink lg:w-auto w-[240px]'}`}
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: isSelected ? '1.5px solid var(--accent-primary)' : '1px solid var(--glass-border)',
                  background: isSelected ? 'rgba(99, 102, 241, 0.16)' : 'var(--bg-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: isSelected ? '0 0 14px rgba(99, 102, 241, 0.22)' : 'none',
                  minWidth: compact ? '220px' : 'auto'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: itemBadge.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {getDocIcon(docType, 16)}
                  </div>

                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{
                      fontWeight: isSelected ? 800 : 600,
                      fontSize: '0.82rem',
                      color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {doc.Title || doc.FileName}
                    </div>
                    <div style={{
                      fontSize: '0.70rem',
                      color: 'var(--text-muted)',
                      marginTop: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      <span style={{
                        padding: '1px 5px',
                        borderRadius: '3px',
                        background: itemBadge.bg,
                        color: itemBadge.text,
                        fontWeight: 700,
                        fontSize: '0.64rem'
                      }}>
                        {(doc.FileExtension || 'FILE').toUpperCase()}
                      </span>
                      <span>{doc.FileSize ? (doc.FileSize / 1024).toFixed(1) + ' KB' : ''}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Active Document Canvas Pane */}
        <div style={{
          background: 'var(--bg-tertiary)',
          borderRadius: '14px',
          border: '1px solid var(--glass-border)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {renderReaderCanvas(false)}
        </div>
      </div>

      {/* Immersive Theater / Fullscreen Modal */}
      {isFullscreen && selectedDoc && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(9, 12, 18, 0.96)',
          backdropFilter: 'blur(16px)',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          padding: '16px 24px',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          {/* Top Bar with Exit */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            paddingBottom: '10px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: badgeStyle.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {getDocIcon(activeType, 18)}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>
                  {selectedDoc.Title || selectedDoc.FileName}
                </h3>
                <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                  Full Theater Reader • Press <kbd style={{ background: 'rgba(255,255,255,0.15)', padding: '1px 5px', borderRadius: '3px' }}>ESC</kbd> to exit
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: 'none',
                borderRadius: '50%',
                width: '38px',
                height: '38px',
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s'
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Fullscreen Canvas */}
          <div style={{ flex: 1, width: '100%', overflow: 'hidden' }}>
            {renderReaderCanvas(true)}
          </div>
        </div>
      )}
    </div>
  );
}
