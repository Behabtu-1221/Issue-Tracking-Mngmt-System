import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Shield, Send, Trash2, Clock, User, Loader2, AlertTriangle, Lock,
  Copy, Check, Sparkles, Filter, ChevronDown, MessageSquare,
  Camera, Image as ImageIcon, Paperclip, X, Download, Maximize2,
  FileText, FileSpreadsheet, FileArchive, FileCode, File,
  ZoomIn, ZoomOut, RotateCw, Mic, Music, Play, Pause
} from 'lucide-react';
import communicationApi from '../api/communicationApi';
import fileDocumentApi from '../../file-document/api/fileDocumentApi';
import { useAuth } from '../../../modules/authentication/contexts/AuthContext';
import tokenManager from '../../../modules/authentication/utils/tokenManager';
import ConfirmDialogModal from '../../../components/common/ConfirmDialogModal';
import AudioMessagePlayer from './AudioMessagePlayer';
import { ActionButton, ActionGroup } from '../../../components/common/ActionButton';

/**
 * InternalNotesPanel — Staff-Only Internal Notes
 * Enterprise Grade: Visible only to Admins, Managers, and Technicians.
 * Strictly isolates internal staff annotations, diagnostic photos, and log files from tenant requesters.
 */
export default function InternalNotesPanel({ requestId, currentUserId, onAttachmentUploaded }) {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Staged attachments for note composer
  const [stagedFiles, setStagedFiles] = useState([]);
  const noteFileInputRef = useRef(null);
  const noteImageInputRef = useRef(null);
  const noteAudioInputRef = useRef(null);

  // Live Staff Voice Note Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  // Popover state
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);

  // Fullscreen Lightbox state for attached diagnostic photos
  const [lightboxDoc, setLightboxDoc] = useState(null);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [lightboxRotate, setLightboxRotate] = useState(0);

  // Confirm delete dialog state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [targetNoteId, setTargetNoteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Determine user role and staff authorization
  const userRole = (user?.role || user?.RoleName || user?.roleName || '').toUpperCase();
  const isStaff = [
    'SUPER_ADMIN', 'PARK_ADMIN', 'DEPARTMENT_MANAGER',
    'TECHNICIAN', 'STAFF', 'ADMIN', 'SYS_ADMIN'
  ].some(r => userRole.includes(r)) || !userRole;

  // Clean up recording tracks and timers on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Auth token helper
  const getToken = useCallback(() => {
    return tokenManager?.getAccessToken?.() ||
      localStorage.getItem('itms_access_token') ||
      sessionStorage.getItem('itms_access_token') ||
      localStorage.getItem('token') ||
      sessionStorage.getItem('token') || '';
  }, []);

  const formatFileSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return '0 B';
    const num = Number(bytes);
    if (num < 1024) return `${num} B`;
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
    return `${(num / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatSeconds = (secs) => {
    const s = Math.max(0, Math.floor(secs));
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${rem < 10 ? '0' : ''}${rem}`;
  };

  const getDocIcon = (filename = '', mimeType = '') => {
    const fn = (filename || '').toLowerCase();
    const mime = (mimeType || '').toLowerCase();

    if (mime.includes('image') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fn)) {
      return <ImageIcon size={15} color="#f59e0b" />;
    }
    if (mime.includes('audio') || /\.(webm|mp3|wav|ogg|m4a|aac|flac|opus)$/i.test(fn)) {
      return <Music size={15} color="#f59e0b" />;
    }
    if (mime.includes('pdf') || fn.endsWith('.pdf')) {
      return <FileText size={15} color="#f87171" />;
    }
    if (mime.includes('sheet') || mime.includes('excel') || mime.includes('csv') || /\.(xls|xlsx|csv)$/i.test(fn)) {
      return <FileSpreadsheet size={15} color="#4ade80" />;
    }
    if (mime.includes('zip') || mime.includes('compressed') || /\.(zip|rar|7z|tar|gz)$/i.test(fn)) {
      return <FileArchive size={15} color="#fbbf24" />;
    }
    if (mime.includes('text') || mime.includes('json') || mime.includes('log') || /\.(txt|json|log|js|md)$/i.test(fn)) {
      return <FileCode size={15} color="#c084fc" />;
    }
    return <File size={15} color="#94a3b8" />;
  };

  const isAudioAttachment = (att) => {
    if (!att) return false;
    if (att.isAudio) return true;
    const fn = (att.name || att.FileName || '').toLowerCase();
    const mime = (att.type || att.MimeType || '').toLowerCase();
    const tags = (att.tags || att.Tags || '').toLowerCase();
    return (
      mime.startsWith('audio/') ||
      mime.includes('audio') ||
      tags.includes('voice_note') ||
      fn.includes('voice note') ||
      fn.includes('audio') ||
      /\.(webm|mp3|wav|ogg|m4a|aac|opus|flac|mp4|weba)$/i.test(fn)
    );
  };

  const isImageAttachment = (att) => {
    if (!att) return false;
    if (isAudioAttachment(att)) return false;
    if (att.isImage) return true;
    const fn = (att.name || att.FileName || '').toLowerCase();
    const mime = (att.type || att.MimeType || '').toLowerCase();
    return (mime.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(fn));
  };

  const getAttachmentPreviewUrl = (att) => {
    if (att?.previewUrl) return att.previewUrl;
    const docId = att.id || att.DocumentID;
    if (!docId) return '';
    const token = getToken();
    return `/api/documents/${docId}/preview?token=${encodeURIComponent(token)}`;
  };

  const getAttachmentDownloadUrl = (att) => {
    const docId = att.id || att.DocumentID;
    if (!docId) return '#';
    const token = getToken();
    return `/api/documents/${docId}/download?token=${encodeURIComponent(token)}`;
  };

  const parseMessageContent = (rawText) => {
    if (!rawText) return { cleanText: '', attachments: [] };

    const attachments = [];
    const attachmentRegex = /(?:<!--|&lt;!--)ATTACHMENT:(\{.*?\})(?:-->|--&gt;)/gs;
    let match;

    while ((match = attachmentRegex.exec(rawText)) !== null) {
      try {
        const parsed = JSON.parse(match[1]);
        if (parsed && (parsed.id || parsed.DocumentID || parsed.uuid)) {
          attachments.push(parsed);
        }
      } catch {
        // ignore malformed metadata
      }
    }

    let cleanText = rawText.replace(attachmentRegex, '').trim();
    if (attachments.length > 0 && (/^📎\s*Attached:/i.test(cleanText) || /^🎙️\s*Voice Note/i.test(cleanText))) {
      const remainingLines = cleanText
        .split('\n')
        .filter(line => !line.trim().startsWith('🎙️ Voice Note') && !line.trim().startsWith('📎 Attached:'))
        .join('\n')
        .trim();
      cleanText = remainingLines;
    }

    return { cleanText, attachments };
  };

  const loadNotes = async () => {
    if (!requestId) return;
    try {
      setLoading(true);
      const res = await communicationApi.getInternalNotes(requestId);
      const raw = res.data?.data;
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.notes)
          ? raw.notes
          : [];
      setNotes(list);
    } catch (err) {
      console.error('Failed to load internal notes:', err);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [requestId]);

  const handleFilesSelected = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const newStaged = [];
    for (const f of files) {
      if (f.size > 50 * 1024 * 1024) {
        alert(`File "${f.name}" exceeds the 50MB diagnostic upload limit.`);
        continue;
      }

      const isImg = f.type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(f.name);
      const isAud = f.type.startsWith('audio/') || /\.(webm|mp3|wav|ogg|m4a|aac|flac|opus)$/i.test(f.name);
      newStaged.push({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        file: f,
        name: f.name,
        size: f.size,
        type: f.type || (isAud ? 'audio/mpeg' : ''),
        isImage: isImg,
        isAudio: isAud,
        previewUrl: isImg ? URL.createObjectURL(f) : null
      });
    }

    setStagedFiles(prev => [...prev, ...newStaged]);
    if (noteFileInputRef.current) noteFileInputRef.current.value = '';
    if (noteImageInputRef.current) noteImageInputRef.current.value = '';
    if (noteAudioInputRef.current) noteAudioInputRef.current.value = '';
  };

  const handleRemoveStagedFile = (idxToRemove) => {
    setStagedFiles(prev => {
      const target = prev[idxToRemove];
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((_, idx) => idx !== idxToRemove);
    });
  };

  const handleAdd = async (e) => {
    e?.preventDefault();
    if ((!noteText.trim() && stagedFiles.length === 0) || sending) return;

    setSending(true);
    setUploadStatus('');

    try {
      const uploadedAttachments = [];

      // Upload each staged file with diagnostic / internal tags
      if (stagedFiles.length > 0) {
        for (let i = 0; i < stagedFiles.length; i++) {
          const item = stagedFiles[i];
          setUploadStatus(`Uploading diagnostic file ${i + 1} of ${stagedFiles.length}...`);

          const formData = new FormData();
          formData.append('file', item.file);
          formData.append('title', item.name);
          formData.append('entityRefType', 'ISSUE_REQUEST');
          formData.append('entityRefId', requestId);
          formData.append('tags', item.isAudio ? 'internal_note_attachment,diagnostic,voice_note' : 'internal_note_attachment,diagnostic');
          formData.append('isSensitive', 'true');

          const uploadRes = await fileDocumentApi.uploadFile(formData);
          const docData = uploadRes.data?.data || uploadRes.data || {};
          uploadedAttachments.push({
            id: docData.DocumentID || docData.id,
            uuid: docData.DocumentUUID || docData.uuid,
            name: docData.FileName || item.name,
            size: docData.FileSize || item.size,
            type: docData.MimeType || item.type || (item.isAudio ? 'audio/webm' : ''),
            duration: item.duration || 0,
            isAudio: !!item.isAudio,
            previewUrl: item.previewUrl
          });
        }
      }

      // Build payload text with structured attachment blocks
      let payloadText = noteText.trim();
      if (uploadedAttachments.length > 0) {
        const attachmentTags = uploadedAttachments
          .map(att => `<!--ATTACHMENT:${JSON.stringify(att)}-->`)
          .join('\n');

        if (payloadText) {
          payloadText = `${payloadText}\n\n${attachmentTags}`;
        } else {
          const hasAudio = uploadedAttachments.some(a => isAudioAttachment(a));
          if (hasAudio) {
            const firstAudio = uploadedAttachments.find(a => isAudioAttachment(a));
            const durationLabel = firstAudio.duration ? ` (${formatSeconds(firstAudio.duration)})` : '';
            payloadText = `🎙️ Voice Note${durationLabel}\n\n${attachmentTags}`;
          } else {
            const names = uploadedAttachments.map(a => a.name).join(', ');
            payloadText = `📎 Attached: ${names}\n\n${attachmentTags}`;
          }
        }
      }

      const noteRes = await communicationApi.addInternalNote(requestId, payloadText);
      const newNote = noteRes.data?.data;
      if (newNote) {
        setNotes(prev => {
          if (prev.some(n => n.InternalNoteID === newNote.InternalNoteID)) return prev;
          return [...prev, newNote];
        });
      }

      setNoteText('');
      setStagedFiles([]);
      setUploadStatus('');

      if (onAttachmentUploaded) {
        try { onAttachmentUploaded(); } catch {}
      }

      await loadNotes();
    } catch (err) {
      console.error('Failed to add note or upload attachments:', err);
    } finally {
      setSending(false);
      setUploadStatus('');
    }
  };

  // ── Staff Audio Recording Handlers ──
  const startAudioRecording = async () => {
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        alert('Voice note recording is not supported in this browser.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      let mimeType = 'audio/webm;codecs=opus';
      if (typeof MediaRecorder !== 'undefined') {
        if (!MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          if (MediaRecorder.isTypeSupported('audio/webm')) mimeType = 'audio/webm';
          else if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
          else if (MediaRecorder.isTypeSupported('audio/ogg')) mimeType = 'audio/ogg';
          else mimeType = '';
        }
      }

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.start(250);
      setIsRecording(true);
      setRecordingDuration(0);

      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(d => d + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to access microphone for internal note:', err);
      alert('Microphone access is required to record voice notes. Please allow microphone permissions in your browser.');
    }
  };

  const cancelAudioRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch {}
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordingDuration(0);
  };

  const stopRecordingAndGetBlob = () => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        if (audioChunksRef.current && audioChunksRef.current.length > 0) {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          resolve({ blob, mimeType: 'audio/webm' });
        } else {
          resolve(null);
        }
        return;
      }

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        if (mediaStreamRef.current) {
          try {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
          } catch {}
          mediaStreamRef.current = null;
        }

        const mimeType = recorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        audioChunksRef.current = [];
        setIsRecording(false);
        setRecordingDuration(0);
        resolve({ blob, mimeType });
      };

      try {
        recorder.stop();
      } catch (err) {
        console.error('Error stopping internal note recorder:', err);
        if (audioChunksRef.current.length > 0) {
          const mimeType = recorder.mimeType || 'audio/webm';
          const blob = new Blob(audioChunksRef.current, { type: mimeType });
          setIsRecording(false);
          setRecordingDuration(0);
          resolve({ blob, mimeType });
        } else {
          setIsRecording(false);
          setRecordingDuration(0);
          resolve(null);
        }
      }
    });
  };

  const finishAndStageVoiceNote = async () => {
    if (!mediaRecorderRef.current && isRecording === false) return;
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    const durationSnapshot = Math.max(1, recordingDuration);

    const result = await stopRecordingAndGetBlob();
    if (!result || !result.blob || result.blob.size < 10) {
      alert('Diagnostic recording was empty. Please check microphone access and speak clearly.');
      return;
    }

    const { blob: audioBlob, mimeType } = result;
    const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : mimeType.includes('wav') ? 'wav' : 'webm';
    const formattedDuration = formatSeconds(durationSnapshot);
    const fileName = `Diagnostic Voice Note (${formattedDuration}).${ext}`;
    const audioFile = new File([audioBlob], fileName, { type: mimeType });
    const localUrl = URL.createObjectURL(audioBlob);

    setStagedFiles(prev => [
      ...prev,
      {
        id: `recorded-${Date.now()}`,
        file: audioFile,
        name: fileName,
        size: audioBlob.size,
        type: mimeType,
        isAudio: true,
        duration: durationSnapshot,
        previewUrl: localUrl
      }
    ]);
  };

  const finishAndSendVoiceNote = async () => {
    if (!mediaRecorderRef.current && isRecording === false) return;
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    const durationSnapshot = Math.max(1, recordingDuration);

    setSending(true);
    setUploadStatus('Finalizing diagnostic voice note...');

    const result = await stopRecordingAndGetBlob();
    if (!result || !result.blob || result.blob.size < 10) {
      setSending(false);
      setUploadStatus('');
      alert('Diagnostic voice note recording was empty or too short. Please speak into your microphone and record again.');
      return;
    }

    const { blob: audioBlob, mimeType } = result;
    const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : mimeType.includes('wav') ? 'wav' : 'webm';
    const formattedDuration = formatSeconds(durationSnapshot);
    const fileName = `Diagnostic Voice Note (${formattedDuration}).${ext}`;
    const audioFile = new File([audioBlob], fileName, { type: mimeType });
    const localUrl = URL.createObjectURL(audioBlob);

    try {
      setUploadStatus('Uploading diagnostic voice note...');

      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('title', `Diagnostic Voice Note (${formattedDuration})`);
      formData.append('entityRefType', 'ISSUE_REQUEST');
      formData.append('entityRefId', requestId);
      formData.append('tags', 'internal_note_attachment,diagnostic,voice_note');
      formData.append('isSensitive', 'true');

      const uploadRes = await fileDocumentApi.uploadFile(formData);
      const docData = uploadRes.data?.data || uploadRes.data || {};

      const voiceAttachment = {
        id: docData.DocumentID || docData.id,
        uuid: docData.DocumentUUID || docData.uuid,
        name: docData.FileName || fileName,
        size: docData.FileSize || audioBlob.size,
        type: docData.MimeType || mimeType,
        duration: durationSnapshot,
        isAudio: true,
        previewUrl: localUrl
      };

      const payloadText = `🎙️ Voice Note (${formattedDuration})\n\n<!--ATTACHMENT:${JSON.stringify(voiceAttachment)}-->`;
      const noteRes = await communicationApi.addInternalNote(requestId, payloadText);
      const newNote = noteRes.data?.data;
      if (newNote) {
        setNotes(prev => {
          if (prev.some(n => n.InternalNoteID === newNote.InternalNoteID)) return prev;
          return [...prev, newNote];
        });
      }

      if (onAttachmentUploaded) {
        try { onAttachmentUploaded(); } catch {}
      }

      await loadNotes();
    } catch (err) {
      console.error('Failed to upload/send diagnostic voice note:', err);
    } finally {
      setSending(false);
      setUploadStatus('');
    }
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  const promptDelete = (noteId) => {
    setTargetNoteId(noteId);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!targetNoteId) return;
    setDeleting(true);
    try {
      await communicationApi.deleteInternalNote(targetNoteId);
      setDeleteModalOpen(false);
      setTargetNoteId(null);
      await loadNotes();
    } catch (err) {
      console.error('Failed to delete note:', err);
    } finally {
      setDeleting(false);
    }
  };

  const copyToClipboard = (id, text) => {
    const { cleanText } = parseMessageContent(text);
    navigator.clipboard?.writeText(cleanText || text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const openLightbox = (att) => {
    setLightboxDoc(att);
    setLightboxZoom(1);
    setLightboxRotate(0);
  };

  const filteredNotes = notes.filter(n => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (n.NoteText && n.NoteText.toLowerCase().includes(term)) ||
      (n.AuthorName && n.AuthorName.toLowerCase().includes(term)) ||
      (n.AuthorRole && n.AuthorRole.toLowerCase().includes(term))
    );
  });

  const getRoleBadgeStyle = (role = '') => {
    const r = role.toUpperCase();
    if (r.includes('ADMIN')) {
      return { bg: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: 'rgba(99, 102, 241, 0.3)' };
    }
    if (r.includes('TECH')) {
      return { bg: 'rgba(52, 211, 153, 0.15)', color: '#34d399', border: 'rgba(52, 211, 153, 0.3)' };
    }
    if (r.includes('MANAGER')) {
      return { bg: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', border: 'rgba(251, 191, 36, 0.3)' };
    }
    return { bg: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', border: 'rgba(148, 163, 184, 0.3)' };
  };

  if (!isStaff) {
    return (
      <div style={{
        padding: '20px', borderRadius: '16px',
        background: 'var(--bg-secondary)', border: '1px solid rgba(148, 163, 184, 0.15)',
        display: 'flex', alignItems: 'center', gap: '14px'
      }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '12px',
          background: 'rgba(245, 158, 11, 0.12)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', color: '#f59e0b'
        }}>
          <Lock size={20} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
            Staff Diagnostic Channel
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            This channel is reserved for internal park staff & technician worknotes.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      background: 'var(--glass-bg)',
      border: '1px solid rgba(245, 158, 11, 0.25)',
      borderRadius: '20px',
      overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(245, 158, 11, 0.04)',
      backdropFilter: 'blur(16px)'
    }}>
      {/* Amber Header & Confidentiality Shield */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 22px', borderBottom: '1px solid rgba(245, 158, 11, 0.18)',
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.04) 100%)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)'
          }}>
            <Shield size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 800, fontSize: '0.96rem', color: '#f59e0b', letterSpacing: '-0.01em' }}>
                Internal Staff Notes & Diagnostics
              </span>
              <span style={{
                fontSize: '0.66rem', fontWeight: 800, padding: '2px 8px', borderRadius: '20px',
                background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24',
                border: '1px solid rgba(245, 158, 11, 0.35)', letterSpacing: '0.5px'
              }}>
                STAFF ONLY
              </span>
            </div>
            <div style={{
              fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px',
              display: 'flex', alignItems: 'center', gap: '5px'
            }}>
              <Lock size={11} color="#f59e0b" />
              <span>Isolated from tenant requesters — visible exclusively to park staff and assigned technicians</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {notes.length > 3 && (
            <input
              type="text"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '6px 12px', borderRadius: '8px', fontSize: '0.78rem',
                background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)', outline: 'none', width: '140px'
              }}
            />
          )}
          <span style={{
            padding: '4px 12px', borderRadius: '14px', fontSize: '0.75rem',
            fontWeight: 800, background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b',
            border: '1px solid rgba(245, 158, 11, 0.3)'
          }}>
            {notes.length} note{notes.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Notes Stream */}
      <div style={{
        flex: 1, maxHeight: '380px', overflowY: 'auto', padding: '16px 20px',
        display: 'flex', flexDirection: 'column', gap: '12px'
      }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: '10px' }}>
            <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: '#f59e0b' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Retrieving internal staff records...</span>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '36px 20px', textAlign: 'center',
            background: 'rgba(245, 158, 11, 0.02)', borderRadius: '14px',
            border: '1px dashed rgba(245, 158, 11, 0.2)'
          }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '50%',
              background: 'rgba(245, 158, 11, 0.1)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: '#f59e0b',
              marginBottom: '10px'
            }}>
              <Shield size={22} />
            </div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              {searchTerm ? 'No matching internal notes found' : 'No internal staff notes recorded yet'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: '360px', marginTop: '4px', lineHeight: 1.5 }}>
              Use internal notes for technician diagnostics, vendor purchase orders, internal blockers, and operational handover notes with attached diagnostic photos and specs.
            </div>
          </div>
        ) : (
          filteredNotes.map((note) => {
            const roleStyle = getRoleBadgeStyle(note.AuthorRole);
            const initials = (note.AuthorName || '?')
              .split(' ')
              .map(n => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            const { cleanText, attachments } = parseMessageContent(note.NoteText);
            const audioAtts = attachments.filter(isAudioAttachment);
            const imageAtts = attachments.filter(isImageAttachment);
            const fileAtts = attachments.filter(att => !isImageAttachment(att) && !isAudioAttachment(att));

            return (
              <div
                key={note.InternalNoteID}
                style={{
                  padding: '14px 16px', borderRadius: '14px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid rgba(245, 158, 11, 0.18)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  position: 'relative',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Note Author & Meta Header */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  marginBottom: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '10px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: '0.72rem',
                      background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.15) 100%)',
                      color: '#f59e0b', border: '1.5px solid rgba(245, 158, 11, 0.4)'
                    }}>
                      {initials}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                          {note.AuthorName || 'Park Staff'}
                        </span>
                        {note.AuthorRole && (
                          <span style={{
                            padding: '1px 7px', borderRadius: '6px', fontSize: '0.65rem',
                            fontWeight: 700, background: roleStyle.bg, color: roleStyle.color,
                            border: `1px solid ${roleStyle.border}`, letterSpacing: '0.3px'
                          }}>
                            {note.AuthorRole}
                          </span>
                        )}
                      </div>
                      <div style={{
                        fontSize: '0.7rem', color: 'var(--text-muted)',
                        display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px'
                      }}>
                        <Clock size={11} /> {formatDate(note.CreatedDate)}
                      </div>
                    </div>
                  </div>

                  {/* Actions: Copy & Delete */}
                  <ActionGroup align="right">
                    <ActionButton
                      variant="neutral"
                      size="sm"
                      icon={copiedId === note.InternalNoteID ? <Check size={13} color="#34d399" /> : <Copy size={13} />}
                      onClick={() => copyToClipboard(note.InternalNoteID, note.NoteText)}
                      title="Copy note text"
                    />
                    <ActionButton
                      variant="delete"
                      size="sm"
                      onClick={() => promptDelete(note.InternalNoteID)}
                      title="Delete internal note"
                    />
                  </ActionGroup>
                </div>

                {/* Note Body Text */}
                {cleanText && (
                  <div style={{
                    fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--text-secondary)',
                    whiteSpace: 'pre-wrap', paddingLeft: '42px', wordBreak: 'break-word',
                    marginBottom: (audioAtts.length || imageAtts.length || fileAtts.length) ? '10px' : '0'
                  }}>
                    {cleanText}
                  </div>
                )}

                {/* Attached Diagnostic Audio / Voice Notes */}
                {audioAtts.length > 0 && (
                  <div style={{ paddingLeft: '42px', marginBottom: (imageAtts.length || fileAtts.length) ? '8px' : '2px' }}>
                    {audioAtts.map((att, aIdx) => (
                      <AudioMessagePlayer
                        key={att.id || aIdx}
                        src={getAttachmentPreviewUrl(att)}
                        downloadUrl={getAttachmentDownloadUrl(att)}
                        name={att.name || 'Diagnostic Voice Note'}
                        duration={att.duration || 0}
                        isOwn={false}
                        variant="amber"
                      />
                    ))}
                  </div>
                )}

                {/* Attached Diagnostic Photos Grid */}
                {imageAtts.length > 0 && (
                  <div style={{ paddingLeft: '42px', marginBottom: fileAtts.length ? '8px' : '0' }}>
                    <div className="message-image-grid">
                      {imageAtts.map((att, imgIdx) => {
                        const previewUrl = getAttachmentPreviewUrl(att);
                        const downloadUrl = getAttachmentDownloadUrl(att);
                        return (
                          <div
                            key={att.id || imgIdx}
                            className="message-image-thumbnail"
                            onClick={() => openLightbox(att)}
                            title={`Diagnostic Photo: ${att.name || 'Photo'}`}
                            style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}
                          >
                            <img
                              src={previewUrl}
                              alt={att.name || 'Diagnostic photo'}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextSibling.style.display = 'flex';
                              }}
                            />
                            <div style={{
                              display: 'none', width: '100%', height: '100%',
                              alignItems: 'center', justifyContent: 'center',
                              background: 'rgba(0,0,0,0.4)', flexDirection: 'column', gap: '4px'
                            }}>
                              <ImageIcon size={20} color="#f59e0b" />
                              <span style={{ fontSize: '0.65rem', color: '#fbbf24' }}>Diagnostic Photo</span>
                            </div>
                            <div className="message-image-overlay">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); openLightbox(att); }}
                                style={{
                                  width: '30px', height: '30px', borderRadius: '50%',
                                  background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.3)',
                                  color: '#ffffff', display: 'flex', alignItems: 'center',
                                  justifyContent: 'center', cursor: 'pointer'
                                }}
                                title="Maximize"
                              >
                                <Maximize2 size={14} />
                              </button>
                              <a
                                href={downloadUrl}
                                download={att.name || 'image'}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  width: '30px', height: '30px', borderRadius: '50%',
                                  background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.3)',
                                  color: '#ffffff', display: 'flex', alignItems: 'center',
                                  justifyContent: 'center', cursor: 'pointer'
                                }}
                                title="Download diagnostic photo"
                              >
                                <Download size={14} />
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Attached Technical Logs / Specs */}
                {fileAtts.length > 0 && (
                  <div style={{ paddingLeft: '42px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {fileAtts.map((att, fIdx) => {
                      const downloadUrl = getAttachmentDownloadUrl(att);
                      return (
                        <div
                          key={att.id || fIdx}
                          className="message-file-item"
                          style={{ borderColor: 'rgba(245, 158, 11, 0.25)', maxWidth: '420px' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                            <div style={{
                              width: '30px', height: '30px', borderRadius: '8px',
                              background: 'rgba(245, 158, 11, 0.12)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                            }}>
                              {getDocIcon(att.name, att.type)}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{
                                fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                maxWidth: '240px'
                              }}>
                                {att.name || 'Diagnostic Document'}
                              </div>
                              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                {formatFileSize(att.size)} &bull; Staff Confidential
                              </div>
                            </div>
                          </div>

                          <a
                            href={downloadUrl}
                            download={att.name || 'document'}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '4px',
                              padding: '4px 8px', borderRadius: '6px',
                              background: 'rgba(245, 158, 11, 0.15)',
                              color: '#f59e0b', fontSize: '0.72rem', fontWeight: 700,
                              textDecoration: 'none', border: '1px solid rgba(245, 158, 11, 0.3)',
                              flexShrink: 0
                            }}
                            title="Download diagnostic file"
                          >
                            <Download size={12} /> Get
                          </a>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Hidden File Inputs for Staff Attachments */}
      <input
        type="file"
        ref={noteImageInputRef}
        accept="image/*"
        multiple
        onChange={handleFilesSelected}
        style={{ display: 'none' }}
      />
      <input
        type="file"
        ref={noteAudioInputRef}
        accept="audio/*,.mp3,.wav,.ogg,.m4a,.webm,.aac,.flac"
        multiple
        onChange={handleFilesSelected}
        style={{ display: 'none' }}
      />
      <input
        type="file"
        ref={noteFileInputRef}
        multiple
        onChange={handleFilesSelected}
        style={{ display: 'none' }}
      />

      {/* ── Capsule Input Composer Form (Staff Amber Mode) ── */}
      <form onSubmit={handleAdd} className="capsule-composer-wrapper" style={{
        padding: '12px 20px 14px',
        borderTop: '1px solid rgba(245, 158, 11, 0.15)',
        background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.02) 0%, rgba(245, 158, 11, 0.06) 100%)',
        display: 'flex', flexDirection: 'column', gap: '8px'
      }}>
        {/* Pre-Send Staged Attachments Strip */}
        {stagedFiles.length > 0 && (
          <div
            className="discussion-staging-bar"
            style={{ borderColor: 'rgba(245, 158, 11, 0.35)', background: 'rgba(245, 158, 11, 0.06)' }}
          >
            <span style={{
              fontSize: '0.72rem', fontWeight: 800, color: '#f59e0b',
              display: 'flex', alignItems: 'center', gap: '4px', marginRight: '4px'
            }}>
              <Paperclip size={13} /> {stagedFiles.length} file{stagedFiles.length > 1 ? 's' : ''} ready for staff record:
            </span>

            {stagedFiles.map((sf, idx) => (
              <div
                key={sf.id || idx}
                className="discussion-attachment-chip"
                style={{ borderColor: sf.isAudio ? '#f59e0b' : 'rgba(245, 158, 11, 0.25)', background: sf.isAudio ? 'rgba(245, 158, 11, 0.12)' : undefined }}
              >
                {sf.isImage && sf.previewUrl ? (
                  <img
                    src={sf.previewUrl}
                    alt={sf.name}
                    style={{ width: '22px', height: '22px', borderRadius: '4px', objectFit: 'cover' }}
                  />
                ) : sf.isAudio ? (
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '50%',
                    background: '#f59e0b', color: '#ffffff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Mic size={12} />
                  </div>
                ) : (
                  getDocIcon(sf.name, sf.type)
                )}

                <span style={{
                  fontWeight: sf.isAudio ? 700 : 600,
                  color: sf.isAudio ? 'var(--text-primary)' : 'inherit',
                  overflow: 'hidden', textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap', maxWidth: '140px'
                }}>
                  {sf.isAudio && sf.duration ? `🎙️ Voice Note (${formatSeconds(sf.duration)})` : sf.name}
                </span>

                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  ({formatFileSize(sf.size)})
                </span>

                {/* Staged Audio Audition Playback */}
                {sf.isAudio && sf.previewUrl && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const aud = document.getElementById(`preview-note-audio-${sf.id}`);
                      if (aud) {
                        if (aud.paused) { aud.play(); } else { aud.pause(); }
                      }
                    }}
                    style={{
                      background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%',
                      width: '20px', height: '20px', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', cursor: 'pointer', color: 'var(--text-primary)',
                      marginLeft: '2px'
                    }}
                    title="Audition recorded voice note"
                  >
                    <Play size={10} fill="currentColor" />
                    <audio id={`preview-note-audio-${sf.id}`} src={sf.previewUrl} preload="auto" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleRemoveStagedFile(idx)}
                  className="discussion-chip-remove"
                  title="Remove diagnostic attachment"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Attachment Options Popover */}
        {showAttachmentMenu && (
          <div className="capsule-attachment-popover" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="capsule-popover-item"
              onClick={() => {
                setShowAttachmentMenu(false);
                noteImageInputRef.current?.click();
              }}
            >
              <Camera size={16} color="#f59e0b" />
              <span>Attach Diagnostic Photo</span>
            </button>
            <button
              type="button"
              className="capsule-popover-item"
              onClick={() => {
                setShowAttachmentMenu(false);
                noteAudioInputRef.current?.click();
              }}
            >
              <Music size={16} color="#f59e0b" />
              <span>Attach Diagnostic Audio & Music Track</span>
            </button>
            <button
              type="button"
              className="capsule-popover-item"
              onClick={() => {
                setShowAttachmentMenu(false);
                noteFileInputRef.current?.click();
              }}
            >
              <FileText size={16} color="#fbbf24" />
              <span>Attach Diagnostic Log / Spec</span>
            </button>
          </div>
        )}

        {/* Capsule Pill Bar (Staff Amber Mode) */}
        <div className="capsule-composer-bar staff-mode">
          {isRecording ? (
            /* Live Staff Recording View */
            <div className="capsule-recording-studio">
              <div className="recording-status-badge">
                <span className="recording-pulse-beacon" />
                <span>REC {formatSeconds(recordingDuration)}</span>
              </div>

              {/* Animated Waveform Visualizer */}
              <div className="recording-wave-visualizer">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="recording-wave-bar staff-amber" />
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={cancelAudioRecording}
                  className="recording-cancel-btn"
                  title="Discard recording"
                >
                  <Trash2 size={13} /> Cancel
                </button>

                <button
                  type="button"
                  onClick={finishAndStageVoiceNote}
                  className="recording-cancel-btn"
                  style={{
                    background: 'rgba(245, 158, 11, 0.18)',
                    border: '1px solid #f59e0b',
                    color: '#f59e0b',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Attach to internal note to review before saving"
                >
                  <Check size={14} /> Review & Attach
                </button>

                <button
                  type="button"
                  onClick={finishAndSendVoiceNote}
                  className="capsule-send-btn staff-amber"
                  title="Save voice note immediately"
                  disabled={sending}
                >
                  {sending ? <Loader2 size={15} className="spin" /> : <Send size={15} />}
                </button>
              </div>
            </div>
          ) : (
            /* Standard Capsule Composer View matching User Screenshot: [📎] |Write a message... [🎙️] */
            <>
              {/* Left: Attachment Paperclip Icon Button */}
              <button
                type="button"
                onClick={() => setShowAttachmentMenu(prev => !prev)}
                className={`capsule-btn-icon ${showAttachmentMenu ? 'active' : ''}`}
                title="Attach diagnostic photo, audio, or log file"
                disabled={sending}
              >
                <Paperclip size={19} />
              </button>

              {/* Center: Message Input Field matching screenshot '|Write a message...' */}
              <input
                type="text"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Write a message..."
                disabled={sending}
                className="capsule-input-field"
                onFocus={() => {
                  setShowAttachmentMenu(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAdd();
                  }
                }}
              />

              {/* Right: Microphone Audio Recording Button or Send Button */}
              {(!noteText.trim() && stagedFiles.length === 0) ? (
                <button
                  type="button"
                  onClick={startAudioRecording}
                  className="capsule-btn-icon"
                  style={{ color: '#f59e0b' }}
                  title="Record diagnostic voice note"
                  disabled={sending}
                >
                  <Mic size={20} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={sending}
                  className="capsule-send-btn staff-amber"
                  title="Save internal note"
                >
                  {sending ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
                </button>
              )}
            </>
          )}
        </div>

        {uploadStatus && (
          <div style={{
            fontSize: '0.74rem', color: '#f59e0b', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: '8px'
          }}>
            <Loader2 size={13} className="spin" /> {uploadStatus}
          </div>
        )}
      </form>

      {/* Delete Confirmation Modal */}
      <ConfirmDialogModal
        isOpen={deleteModalOpen}
        title="Delete Internal Note?"
        message="Are you sure you want to permanently delete this internal note? This diagnostic entry will be removed from the staff activity stream."
        confirmText="Delete Note"
        cancelText="Keep Note"
        type="danger"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteModalOpen(false)}
      />

      {/* ── Lightbox Modal for Diagnostic Photos ── */}
      {lightboxDoc && (
        <div
          onClick={() => setLightboxDoc(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(5, 8, 16, 0.88)', backdropFilter: 'blur(10px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '20px', animation: 'fadeIn 0.2s ease-out'
          }}
        >
          {/* Lightbox Top Control Bar */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute', top: '16px', left: '20px', right: '20px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 18px', borderRadius: '12px',
              background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(245, 158, 11, 0.35)',
              color: '#ffffff', zIndex: 10
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <div style={{
                padding: '6px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.2)',
                color: '#f59e0b', display: 'flex'
              }}>
                <Shield size={18} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontWeight: 700, fontSize: '0.9rem',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '320px'
                }}>
                  {lightboxDoc.name || 'Diagnostic Attachment'}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#fbbf24' }}>
                  STAFF CONFIDENTIAL &bull; {formatFileSize(lightboxDoc.size)} &bull; {Math.round(lightboxZoom * 100)}%
                </div>
              </div>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setLightboxZoom(z => Math.max(0.5, z - 0.25))}
                style={{
                  padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.06)', color: '#fff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem'
                }}
                title="Zoom Out"
              >
                <ZoomOut size={14} />
              </button>

              <button
                type="button"
                onClick={() => { setLightboxZoom(1); setLightboxRotate(0); }}
                style={{
                  padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.06)', color: '#fff', cursor: 'pointer',
                  fontSize: '0.75rem', fontWeight: 700
                }}
                title="Reset View"
              >
                1:1
              </button>

              <button
                type="button"
                onClick={() => setLightboxZoom(z => Math.min(3, z + 0.25))}
                style={{
                  padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.06)', color: '#fff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem'
                }}
                title="Zoom In"
              >
                <ZoomIn size={14} />
              </button>

              <button
                type="button"
                onClick={() => setLightboxRotate(r => (r + 90) % 360)}
                style={{
                  padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.06)', color: '#fff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem'
                }}
                title="Rotate 90 degrees"
              >
                <RotateCw size={14} />
              </button>

              <a
                href={getAttachmentDownloadUrl(lightboxDoc)}
                download={lightboxDoc.name || 'diagnostic-image'}
                style={{
                  padding: '6px 12px', borderRadius: '8px', border: 'none',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center',
                  gap: '6px', fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none'
                }}
                title="Download original file"
              >
                <Download size={14} /> Download
              </a>

              <button
                type="button"
                onClick={() => setLightboxDoc(null)}
                style={{
                  padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.4)',
                  background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
                title="Close (Esc)"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Lightbox Center Image Viewport */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '85vw', maxHeight: '80vh', display: 'flex',
              alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
            }}
          >
            <img
              src={getAttachmentPreviewUrl(lightboxDoc)}
              alt={lightboxDoc.name || 'Preview'}
              style={{
                maxWidth: '100%', maxHeight: '78vh', objectFit: 'contain',
                borderRadius: '8px', boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
                transform: `scale(${lightboxZoom}) rotate(${lightboxRotate}deg)`,
                transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            />
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

