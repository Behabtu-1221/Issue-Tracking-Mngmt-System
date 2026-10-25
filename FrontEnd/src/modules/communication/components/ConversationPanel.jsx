import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  MessageSquare, Send, User, Clock, CheckCheck, Check,
  Paperclip, MoreVertical, ChevronDown, Search, Loader2,
  AlertCircle, Sparkles, ExternalLink, Zap, Shield, CheckCircle2,
  HelpCircle, RefreshCw, Camera, Image as ImageIcon, X, Download,
  Maximize2, FileText, FileSpreadsheet, FileArchive, FileCode, File,
  ZoomIn, ZoomOut, RotateCw, Mic, Music, Trash2, Play, Pause
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import communicationApi from '../api/communicationApi';
import fileDocumentApi from '../../file-document/api/fileDocumentApi';
import { useAuth } from '../../authentication/contexts/AuthContext';
import tokenManager from '../../authentication/utils/tokenManager';
import AudioMessagePlayer from './AudioMessagePlayer';

/**
 * ConversationPanel — Internationally Accepted, Production-Ready Request Messaging Thread
 * Slack/Teams grade chat experience with real-time polling, role badges, canned responses,
 * date dividers, read receipts, file/photo attachments, and keyboard shortcuts.
 */
export default function ConversationPanel({
  issueRequestId,
  conversationId,
  currentUserId,
  compact = false,
  onRequestOpen,
  onAttachmentUploaded
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const effectiveUserId = currentUserId || user?.id || user?.userId || user?.UserID || 1;
  const userRole = (user?.userTypeCode || user?.role || '').toUpperCase();
  const isStaff = userRole.includes('ADMIN') || userRole.includes('TECH') || userRole.includes('MANAGER');

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [error, setError] = useState(null);

  // Staged attachments for composer
  const [stagedFiles, setStagedFiles] = useState([]);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const audioInputRef = useRef(null);

  // Live Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const [recordingError, setRecordingError] = useState(null);

  // Attachment menu popover
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);

  // Fullscreen Lightbox state for attached photos
  const [lightboxDoc, setLightboxDoc] = useState(null);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [lightboxRotate, setLightboxRotate] = useState(0);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const pollRef = useRef(null);

  // Clean up recording tracks and timers on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Authentication token helper
  const getToken = useCallback(() => {
    return tokenManager?.getAccessToken?.() ||
      localStorage.getItem('itms_access_token') ||
      sessionStorage.getItem('itms_access_token') ||
      localStorage.getItem('token') ||
      sessionStorage.getItem('token') || '';
  }, []);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  // Format bytes to human readable string
  const formatFileSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return '0 B';
    const num = Number(bytes);
    if (num < 1024) return `${num} B`;
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
    return `${(num / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Format seconds to mm:ss
  const formatSeconds = (secs) => {
    const s = Math.max(0, Math.floor(secs));
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${rem < 10 ? '0' : ''}${rem}`;
  };

  // Get appropriate icon for document type
  const getDocIcon = (filename = '', mimeType = '') => {
    const fn = (filename || '').toLowerCase();
    const mime = (mimeType || '').toLowerCase();

    if (mime.includes('image') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fn)) {
      return <ImageIcon size={15} color="#38bdf8" />;
    }
    if (mime.includes('audio') || /\.(webm|mp3|wav|ogg|m4a|aac|flac|opus)$/i.test(fn)) {
      return <Music size={15} color="#ec4899" />;
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

  // Check if an attachment is an audio / voice note
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

  // Check if an attachment is an image
  const isImageAttachment = (att) => {
    if (!att) return false;
    if (isAudioAttachment(att)) return false;
    if (att.isImage) return true;
    const fn = (att.name || att.FileName || '').toLowerCase();
    const mime = (att.type || att.MimeType || '').toLowerCase();
    return (mime.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(fn));
  };

  // URL helpers for preview and download
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

  // Parse structured attachment metadata stored in message text
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
    // If clean text contains our fallback label like "📎 Attached: ..." or "🎙️ Voice Note", suppress if attachments exist
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

  const loadConversation = useCallback(async (isSilent = false) => {
    if (!issueRequestId && !conversationId) return;
    try {
      if (!isSilent) setError(null);

      let convId = conversationId;

      if (!convId && issueRequestId) {
        // Get or create conversation for the issue request
        const convRes = await communicationApi.getOrCreateRequestConversation(issueRequestId);
        convId = convRes.data?.data?.conversationId || convRes.data?.data?.ConversationID;
      }

      if (!convId) {
        if (!isSilent) setLoading(false);
        return;
      }

      // Load conversation detail
      let detail = null;
      if (issueRequestId) {
        const detailRes = await communicationApi.getConversationByRequestId(issueRequestId).catch(() => null);
        detail = detailRes?.data?.data;
      }
      if (!detail && convId) {
        const detailRes = await communicationApi.getUserConversations({ limit: 50 }).catch(() => null);
        const list = detailRes?.data?.data?.conversations || detailRes?.data?.data || [];
        detail = list.find(c => Number(c.ConversationID) === Number(convId));
      }

      if (detail) {
        setConversation(detail);
        setParticipants(detail?.participants || []);
      }

      // Load messages
      const msgRes = await communicationApi.getMessages(convId, { limit: 100 });
      const rawM = msgRes.data?.data;
      const mList = Array.isArray(rawM)
        ? rawM
        : Array.isArray(rawM?.messages)
          ? rawM.messages
          : [];

      setMessages(prev => {
        if (prev.length !== mList.length) {
          setTimeout(() => scrollToBottom(true), 100);
        }
        return mList;
      });

      // Mark as read
      await communicationApi.markAsRead(convId).catch(() => {});
    } catch (err) {
      console.error('Failed to load conversation:', err);
      if (!isSilent) setError('Failed to load conversation thread. Please check network connection.');
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [issueRequestId, conversationId, scrollToBottom]);

  useEffect(() => {
    setLoading(true);
    loadConversation(false);

    // Active polling every 12 seconds for responsive live sync
    pollRef.current = setInterval(() => {
      loadConversation(true);
    }, 12000);

    return () => clearInterval(pollRef.current);
  }, [issueRequestId, loadConversation]);

  useEffect(() => {
    scrollToBottom(false);
  }, [messages.length, scrollToBottom]);

  // Handle file selections from user
  const handleFilesSelected = (e, isImageMode = false) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const newStaged = [];
    for (const f of files) {
      // 50MB max limit
      if (f.size > 50 * 1024 * 1024) {
        alert(`File "${f.name}" exceeds the 50MB enterprise size limit.`);
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
    // Reset inputs
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (imageInputRef.current) imageInputRef.current.value = '';
    if (audioInputRef.current) audioInputRef.current.value = '';
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

  // Clipboard paste support (paste screenshot straight from clipboard)
  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          const file = new File([blob], `clipboard-image-${Date.now()}.png`, { type: blob.type });
          setStagedFiles(prev => [
            ...prev,
            {
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
              file,
              name: file.name,
              size: file.size,
              type: file.type,
              isImage: true,
              previewUrl: URL.createObjectURL(file)
            }
          ]);
        }
      }
    }
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if ((!messageText.trim() && stagedFiles.length === 0) || sending) return;

    setSending(true);
    setError(null);

    try {
      const effectiveRequestId = issueRequestId || conversation?.ReferenceIssueRequestID;
      const uploadedAttachments = [];

      // Upload each staged file first
      if (stagedFiles.length > 0) {
        for (let i = 0; i < stagedFiles.length; i++) {
          const item = stagedFiles[i];
          setUploadStatus(`Uploading file ${i + 1} of ${stagedFiles.length}...`);

          const formData = new FormData();
          formData.append('file', item.file);
          formData.append('title', item.name);
          formData.append('entityRefType', 'ISSUE_REQUEST');
          if (effectiveRequestId) {
            formData.append('entityRefId', String(effectiveRequestId));
          }
          formData.append('tags', item.isAudio ? 'discussion_attachment,voice_note' : 'discussion_attachment');

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
      let payloadText = messageText.trim();
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

      const targetConvId = conversation?.ConversationID || conversation?.conversationId || conversationId;
      let sendRes;
      if (targetConvId) {
        sendRes = await communicationApi.sendMessage(targetConvId, payloadText);
      } else if (effectiveRequestId) {
        sendRes = await communicationApi.sendRequestMessage(effectiveRequestId, payloadText);
      }

      const newMsg = sendRes?.data?.data;
      const resolvedConvId = targetConvId || newMsg?.ConversationID;

      const optimisticMsg = {
        MessageID: newMsg?.MessageID || Date.now(),
        ConversationID: resolvedConvId,
        SenderUserID: effectiveUserId,
        SenderName: newMsg?.SenderName || user?.FullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'You',
        SenderRoleCode: userRole,
        MessageText: payloadText,
        SentDateTime: newMsg?.SentDateTime || new Date().toISOString(),
        ReadCount: 0
      };

      setMessages(prev => {
        if (prev.some(m => m.MessageID === optimisticMsg.MessageID)) return prev;
        return [...prev, optimisticMsg];
      });

      // Clean up composer state
      setMessageText('');
      setStagedFiles([]);
      setUploadStatus('');

      // Notify parent to refresh attachments/photos gallery if applicable
      if (onAttachmentUploaded) {
        try { onAttachmentUploaded(); } catch {}
      }

      await loadConversation(true);
      setTimeout(() => {
        scrollToBottom(true);
        inputRef.current?.focus();
      }, 100);
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Could not send message or upload attachments. Please check connection and retry.');
    } finally {
      setSending(false);
      setUploadStatus('');
    }
  };

  // ── Audio Recording Handlers ──
  const startAudioRecording = async () => {
    try {
      setRecordingError(null);
      if (!navigator?.mediaDevices?.getUserMedia) {
        alert('Voice note recording is not supported in this browser.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Select supported audio MIME type
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
      console.error('Failed to access microphone:', err);
      setRecordingError('Microphone permission was denied or device not found.');
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
    setRecordingError(null);
  };

  // Helper: Stop active media recorder and return audio blob with guaranteed data flush
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
        console.error('Error stopping recorder:', err);
        if (audioChunksRef.current && audioChunksRef.current.length > 0) {
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

  // Stage voice note so user can review/preview it in composer exactly like attached files/images
  const finishAndStageVoiceNote = async () => {
    if (!mediaRecorderRef.current && isRecording === false) return;
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    const durationSnapshot = Math.max(1, recordingDuration);

    const result = await stopRecordingAndGetBlob();
    if (!result || !result.blob || result.blob.size < 10) {
      alert('Recording was empty. Please check microphone access and try speaking clearly.');
      return;
    }

    const { blob: audioBlob, mimeType } = result;
    const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : mimeType.includes('wav') ? 'wav' : 'webm';
    const formattedDuration = formatSeconds(durationSnapshot);
    const fileName = `Voice Note (${formattedDuration}).${ext}`;
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

  // Immediate send voice note directly from recording studio
  const finishAndSendVoiceNote = async () => {
    if (!mediaRecorderRef.current && isRecording === false) return;
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    const durationSnapshot = Math.max(1, recordingDuration);

    setSending(true);
    setUploadStatus('Finalizing voice note...');

    const result = await stopRecordingAndGetBlob();
    if (!result || !result.blob || result.blob.size < 10) {
      setSending(false);
      setUploadStatus('');
      alert('Recording was empty or too short. Please speak into your microphone and record again.');
      return;
    }

    const { blob: audioBlob, mimeType } = result;
    const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : mimeType.includes('wav') ? 'wav' : 'webm';
    const formattedDuration = formatSeconds(durationSnapshot);
    const fileName = `Voice Note (${formattedDuration}).${ext}`;
    const audioFile = new File([audioBlob], fileName, { type: mimeType });
    const localUrl = URL.createObjectURL(audioBlob);

    await stageAndSendAudioFile(audioFile, formattedDuration, durationSnapshot, localUrl);
  };

  const stageAndSendAudioFile = async (audioFile, formattedDuration, durationSnapshot, localUrl = null) => {
    try {
      setSending(true);
      setUploadStatus('Uploading voice note...');

      const effectiveRequestId = issueRequestId || conversation?.ReferenceIssueRequestID;
      const targetConvId = conversation?.ConversationID || conversation?.conversationId || conversationId;

      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('title', `Voice Note (${formattedDuration})`);
      formData.append('entityRefType', 'ISSUE_REQUEST');
      if (effectiveRequestId) {
        formData.append('entityRefId', String(effectiveRequestId));
      }
      formData.append('tags', 'discussion_attachment,voice_note');

      const uploadRes = await fileDocumentApi.uploadFile(formData);
      const docData = uploadRes.data?.data || uploadRes.data || {};

      const voiceAttachment = {
        id: docData.DocumentID || docData.id,
        uuid: docData.DocumentUUID || docData.uuid,
        name: docData.FileName || audioFile.name,
        size: docData.FileSize || audioFile.size,
        type: docData.MimeType || audioFile.type || 'audio/webm',
        duration: durationSnapshot,
        isAudio: true,
        previewUrl: localUrl || undefined
      };

      const payloadText = `🎙️ Voice Note (${formattedDuration})\n\n<!--ATTACHMENT:${JSON.stringify(voiceAttachment)}-->`;

      let sendRes;
      if (targetConvId) {
        sendRes = await communicationApi.sendMessage(targetConvId, payloadText);
      } else if (effectiveRequestId) {
        sendRes = await communicationApi.sendRequestMessage(effectiveRequestId, payloadText);
      }

      const newMsg = sendRes?.data?.data;
      const resolvedConvId = targetConvId || newMsg?.ConversationID;

      const optimisticVoiceMsg = {
        MessageID: newMsg?.MessageID || Date.now(),
        ConversationID: resolvedConvId,
        SenderUserID: effectiveUserId,
        SenderName: newMsg?.SenderName || user?.FullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'You',
        SenderRoleCode: userRole,
        MessageText: payloadText,
        SentDateTime: newMsg?.SentDateTime || new Date().toISOString(),
        ReadCount: 0
      };

      setMessages(prev => {
        if (prev.some(m => m.MessageID === optimisticVoiceMsg.MessageID)) return prev;
        return [...prev, optimisticVoiceMsg];
      });

      if (onAttachmentUploaded) {
        try { onAttachmentUploaded(); } catch {}
      }

      await loadConversation(true);
      setTimeout(() => scrollToBottom(true), 100);
    } catch (err) {
      console.error('Failed to upload/send voice note:', err);
      setError('Failed to send voice note. Please try again.');
    } finally {
      setSending(false);
      setUploadStatus('');
    }
  };

  const formatMessageTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getDayDivider = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diffDays = Math.round((today - target) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleBadge = (roleCode) => {
    const code = (roleCode || '').toUpperCase();
    if (code.includes('ADMIN')) return { label: 'Admin', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' };
    if (code.includes('TECH')) return { label: 'Technician', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)' };
    if (code.includes('MANAGER')) return { label: 'Manager', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' };
    if (code.includes('TENANT')) return { label: 'Tenant', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' };
    return { label: 'Requester', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.15)' };
  };

  const getPriorityStyle = (priority) => {
    const p = (priority || '').toUpperCase();
    if (p === 'CRITICAL') return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)' };
    if (p === 'HIGH') return { color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)', border: 'rgba(249, 115, 22, 0.3)' };
    if (p === 'MEDIUM') return { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.3)' };
    return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)' };
  };

  const getStatusStyle = (status) => {
    const s = (status || '').toUpperCase();
    if (s === 'RESOLVED' || s === 'CLOSED') return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' };
    if (s === 'IN_PROGRESS' || s === 'ASSIGNED') return { color: '#6366f1', bg: 'rgba(99, 102, 241, 0.15)' };
    if (s === 'CANCELLED') return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' };
    return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' };
  };

  const handleNavigateToRequest = () => {
    if (onRequestOpen) {
      onRequestOpen(issueRequestId);
    } else {
      navigate(`/issues`);
    }
  };

  const openLightbox = (att) => {
    setLightboxDoc(att);
    setLightboxZoom(1);
    setLightboxRotate(0);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: compact ? '420px' : '620px', background: 'var(--bg-secondary)',
        borderRadius: '16px', border: '1px solid var(--glass-border)', gap: '12px'
      }}>
        <Loader2 size={28} className="spin" color="var(--accent-primary)" />
        <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem', fontWeight: 600 }}>
          Synchronizing secure conversation thread...
        </span>
      </div>
    );
  }

  if (error && messages.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: compact ? '420px' : '620px', background: 'var(--bg-secondary)',
        borderRadius: '16px', border: '1px solid var(--glass-border)', padding: '24px', textAlign: 'center'
      }}>
        <AlertCircle size={36} color="#ef4444" style={{ marginBottom: '12px' }} />
        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>Conversation Unavailable</div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '340px' }}>
          {error}
        </div>
        <button
          onClick={() => loadConversation(false)}
          style={{
            marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px', borderRadius: '8px', background: 'var(--bg-tertiary)',
            border: '1px solid var(--glass-border)', color: 'var(--text-primary)', cursor: 'pointer',
            fontSize: '0.85rem', fontWeight: 600
          }}
        >
          <RefreshCw size={14} /> Retry Connection
        </button>
      </div>
    );
  }

  const pStyle = getPriorityStyle(conversation?.RequestPriority);
  const sStyle = getStatusStyle(conversation?.RequestStatus);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: compact ? '480px' : '640px',
      background: 'var(--bg-secondary)',
      border: '1px solid var(--glass-border-accent)',
      borderRadius: compact ? '12px' : '20px',
      boxShadow: 'var(--shadow-lg)',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* ── Thread Header ── */}
      <div style={{
        padding: '14px 20px',
        background: 'linear-gradient(180deg, var(--bg-tertiary) 0%, rgba(255,255,255,0.01) 100%)',
        borderBottom: '1px solid var(--glass-border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '12px'
      }}>
        {/* Left: Request Context */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <div style={{
            padding: '10px', borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(124,58,237,0.15) 100%)',
            color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <MessageSquare size={18} />
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {conversation?.IssueRequestCode && (
                <button
                  onClick={handleNavigateToRequest}
                  title="Click to view issue request"
                  style={{
                    fontFamily: 'monospace', fontWeight: 800, fontSize: '0.78rem',
                    padding: '3px 8px', borderRadius: '6px',
                    background: 'rgba(99,102,241,0.12)', color: '#818cf8',
                    border: '1px solid rgba(99,102,241,0.25)', cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: '4px'
                  }}
                >
                  {conversation.IssueRequestCode} <ExternalLink size={10} />
                </button>
              )}

              {conversation?.RequestPriority && (
                <span style={{
                  padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem',
                  fontWeight: 700, color: pStyle.color, background: pStyle.bg,
                  border: `1px solid ${pStyle.border}`
                }}>
                  {conversation.RequestPriority}
                </span>
              )}

              {conversation?.RequestStatus && (
                <span style={{
                  padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem',
                  fontWeight: 700, color: sStyle.color, background: sStyle.bg
                }}>
                  {conversation.RequestStatus}
                </span>
              )}
            </div>

            <div style={{
              fontWeight: 800, fontSize: '0.96rem', color: 'var(--text-primary)',
              marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>
              {conversation?.RequestTitle || conversation?.Title || 'Service Request Discussion'}
            </div>
          </div>
        </div>

        {/* Right: Live Sync & Participants */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Pulsing Live indicator */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            fontSize: '0.72rem', fontWeight: 700, color: '#4ade80',
            background: 'rgba(74, 222, 128, 0.1)', border: '1px solid rgba(74, 222, 128, 0.25)',
            padding: '4px 10px', borderRadius: '20px'
          }}>
            <span style={{
              width: '7px', height: '7px', borderRadius: '50%', background: '#4ade80',
              boxShadow: '0 0 8px #4ade80', display: 'inline-block'
            }} />
            Live Sync
          </div>

          {/* Participant Avatars */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {participants.slice(0, 4).map((p, idx) => {
              const b = getRoleBadge(p.RoleCode || p.UserTypeCode);
              return (
                <div
                  key={p.UserID || idx}
                  title={`${p.FullName || p.Username} (${b.label})`}
                  style={{
                    width: '30px', height: '30px', borderRadius: '50%',
                    background: b.bg, border: `2px solid ${b.color}`, color: b.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '0.72rem',
                    marginLeft: idx > 0 ? '-8px' : 0, zIndex: 10 - idx
                  }}
                >
                  {getInitials(p.FullName || p.Username)}
                </div>
              );
            })}
            {participants.length > 4 && (
              <div style={{
                width: '30px', height: '30px', borderRadius: '50%',
                background: 'var(--bg-tertiary)', border: '2px solid var(--glass-border)',
                color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '0.68rem', fontWeight: 800,
                marginLeft: '-8px'
              }}>
                +{participants.length - 4}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Message Stream ── */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '20px',
        display: 'flex', flexDirection: 'column', gap: '8px'
      }}>
        {messages.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', flex: 1, padding: '40px', textAlign: 'center'
          }}>
            <div style={{
              padding: '16px', borderRadius: '50%', background: 'rgba(99,102,241,0.08)',
              color: 'var(--accent-primary)', marginBottom: '14px'
            }}>
              <MessageSquare size={36} />
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
              No messages logged yet
            </div>
            <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '360px', lineHeight: 1.5 }}>
              Begin collaborating with technicians, facility managers, and requesters on this service ticket. You can attach photos and technical documents below.
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isOwn = Number(msg.SenderUserID) === Number(effectiveUserId);
            const prevMsg = index > 0 ? messages[index - 1] : null;
            const isFirstOfSender = !prevMsg || Number(prevMsg.SenderUserID) !== Number(msg.SenderUserID);
            const dayDivider = !prevMsg || getDayDivider(prevMsg.SentDateTime) !== getDayDivider(msg.SentDateTime)
              ? getDayDivider(msg.SentDateTime)
              : null;
            const roleBadge = getRoleBadge(msg.SenderRoleCode);

            // Parse text and attachments
            const { cleanText, attachments } = parseMessageContent(msg.MessageText);
            const audioAtts = attachments.filter(isAudioAttachment);
            const imageAtts = attachments.filter(isImageAttachment);
            const fileAtts = attachments.filter(att => !isImageAttachment(att) && !isAudioAttachment(att));

            return (
              <React.Fragment key={msg.MessageID || index}>
                {/* Date Divider */}
                {dayDivider && (
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '18px 0 10px'
                  }}>
                    <span style={{
                      fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)',
                      padding: '4px 12px', borderRadius: '12px',
                      background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)'
                    }}>
                      {dayDivider}
                    </span>
                  </div>
                )}

                {/* Message Bubble Container */}
                <div style={{
                  display: 'flex',
                  justifyContent: isOwn ? 'flex-end' : 'flex-start',
                  alignItems: 'flex-end',
                  gap: '8px',
                  marginTop: isFirstOfSender ? '10px' : '2px'
                }}>
                  {/* Avatar on left for other participants */}
                  {!isOwn && (
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      background: roleBadge.bg, border: `1.5px solid ${roleBadge.color}`,
                      color: roleBadge.color, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800,
                      flexShrink: 0, opacity: isFirstOfSender ? 1 : 0
                    }}>
                      {getInitials(msg.SenderName)}
                    </div>
                  )}

                  {/* Message Body */}
                  <div style={{ maxWidth: '80%', minWidth: '130px' }}>
                    {/* Header with Sender Name & Role */}
                    {!isOwn && isFirstOfSender && (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        marginBottom: '3px', fontSize: '0.75rem'
                      }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          {msg.SenderName}
                        </span>
                        <span style={{
                          fontSize: '0.65rem', fontWeight: 800, padding: '1px 6px',
                          borderRadius: '6px', background: roleBadge.bg, color: roleBadge.color
                        }}>
                          {roleBadge.label}
                        </span>
                      </div>
                    )}

                    <div style={{
                      padding: '12px 16px',
                      borderRadius: isOwn
                        ? '16px 16px 4px 16px'
                        : '16px 16px 16px 4px',
                      background: isOwn
                        ? 'var(--accent-gradient)'
                        : 'var(--bg-tertiary)',
                      border: isOwn
                        ? 'none'
                        : '1px solid var(--glass-border)',
                      color: isOwn ? '#ffffff' : 'var(--text-primary)',
                      boxShadow: isOwn
                        ? '0 4px 15px rgba(99, 102, 241, 0.25)'
                        : 'none',
                      fontSize: '0.88rem',
                      lineHeight: '1.45',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}>
                      {/* Message Text */}
                      {cleanText && (
                        <div style={{ marginBottom: (audioAtts.length || imageAtts.length || fileAtts.length) ? '10px' : '0' }}>
                          {cleanText}
                        </div>
                      )}

                      {/* Attached Audio / Voice Notes Player */}
                      {audioAtts.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: (imageAtts.length || fileAtts.length) ? '8px' : '2px' }}>
                          {audioAtts.map((att, aIdx) => (
                            <AudioMessagePlayer
                              key={att.id || aIdx}
                              src={getAttachmentPreviewUrl(att)}
                              downloadUrl={getAttachmentDownloadUrl(att)}
                              name={att.name || 'Voice Note'}
                              duration={att.duration || 0}
                              isOwn={isOwn}
                              variant="primary"
                            />
                          ))}
                        </div>
                      )}

                      {/* Attached Images Grid */}
                      {imageAtts.length > 0 && (
                        <div className="message-image-grid" style={{ marginBottom: fileAtts.length ? '8px' : '4px' }}>
                          {imageAtts.map((att, imgIdx) => {
                            const previewUrl = getAttachmentPreviewUrl(att);
                            const downloadUrl = getAttachmentDownloadUrl(att);
                            return (
                              <div
                                key={att.id || imgIdx}
                                className="message-image-thumbnail"
                                onClick={() => openLightbox(att)}
                                title={`Click to view full photo: ${att.name || 'Image'}`}
                              >
                                <img
                                  src={previewUrl}
                                  alt={att.name || 'Attached photo'}
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
                                  <ImageIcon size={20} color="#94a3b8" />
                                  <span style={{ fontSize: '0.65rem', color: '#cbd5e1' }}>Photo</span>
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
                                    title="Download image"
                                  >
                                    <Download size={14} />
                                  </a>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Attached Documents / Logs List */}
                      {fileAtts.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {fileAtts.map((att, fIdx) => {
                            const downloadUrl = getAttachmentDownloadUrl(att);
                            return (
                              <div key={att.id || fIdx} className="message-file-item">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                  <div style={{
                                    width: '30px', height: '30px', borderRadius: '8px',
                                    background: 'rgba(255,255,255,0.08)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                  }}>
                                    {getDocIcon(att.name, att.type)}
                                  </div>
                                  <div style={{ minWidth: 0 }}>
                                    <div style={{
                                      fontWeight: 700, fontSize: '0.8rem',
                                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                      maxWidth: '200px'
                                    }}>
                                      {att.name || 'Document'}
                                    </div>
                                    <div style={{ fontSize: '0.68rem', opacity: 0.75 }}>
                                      {formatFileSize(att.size)}
                                    </div>
                                  </div>
                                </div>

                                <a
                                  href={downloadUrl}
                                  download={att.name || 'document'}
                                  style={{
                                    display: 'flex', alignItems: 'center', gap: '4px',
                                    padding: '4px 8px', borderRadius: '6px',
                                    background: isOwn ? 'rgba(255,255,255,0.2)' : 'rgba(99,102,241,0.12)',
                                    color: isOwn ? '#ffffff' : 'var(--accent-primary)',
                                    fontSize: '0.72rem', fontWeight: 700, textDecoration: 'none',
                                    border: isOwn ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(99,102,241,0.25)',
                                    flexShrink: 0
                                  }}
                                  title="Download attachment"
                                >
                                  <Download size={12} /> Get
                                </a>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Timestamp & Read Status */}
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                        gap: '4px', marginTop: '6px', fontSize: '0.68rem',
                        color: isOwn ? 'rgba(255,255,255,0.75)' : 'var(--text-muted)'
                      }}>
                        <span>{formatMessageTime(msg.SentDateTime)}</span>
                        {isOwn && (
                          (msg.ReadCount > 1 || msg.IsRead) ? (
                            <CheckCheck size={13} color="#4ade80" />
                          ) : (
                            <Check size={13} color="rgba(255,255,255,0.7)" />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Hidden File Inputs ── */}
      <input
        type="file"
        ref={imageInputRef}
        accept="image/*"
        multiple
        onChange={(e) => handleFilesSelected(e, true)}
        style={{ display: 'none' }}
      />
      <input
        type="file"
        ref={audioInputRef}
        accept="audio/*,.mp3,.wav,.ogg,.m4a,.webm,.aac,.flac"
        multiple
        onChange={(e) => handleFilesSelected(e, false)}
        style={{ display: 'none' }}
      />
      <input
        type="file"
        ref={fileInputRef}
        multiple
        onChange={(e) => handleFilesSelected(e, false)}
        style={{ display: 'none' }}
      />

      {/* ── Capsule Input Composer Form (Matching User Reference Image) ── */}
      <form onSubmit={handleSend} className="capsule-composer-wrapper" style={{
        padding: '12px 20px 14px',
        background: 'var(--bg-tertiary)',
        borderTop: '1px solid var(--glass-border)',
        display: 'flex', flexDirection: 'column', gap: '8px'
      }}>
        {/* Pre-Send Staged Attachments Bar */}
        {stagedFiles.length > 0 && (
          <div className="discussion-staging-bar">
            <span style={{
              fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent-primary)',
              display: 'flex', alignItems: 'center', gap: '4px', marginRight: '4px'
            }}>
              <Paperclip size={13} /> {stagedFiles.length} file{stagedFiles.length > 1 ? 's' : ''} ready:
            </span>

            {stagedFiles.map((sf, idx) => (
              <div
                key={sf.id || idx}
                className="discussion-attachment-chip"
                style={sf.isAudio ? { borderColor: 'var(--accent-primary)', background: 'rgba(99, 102, 241, 0.12)' } : undefined}
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
                    background: 'var(--accent-primary)', color: '#ffffff',
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
                      const aud = document.getElementById(`preview-audio-${sf.id}`);
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
                    <audio id={`preview-audio-${sf.id}`} src={sf.previewUrl} preload="auto" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleRemoveStagedFile(idx)}
                  className="discussion-chip-remove"
                  title="Remove attachment"
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
                imageInputRef.current?.click();
              }}
            >
              <Camera size={16} color="var(--accent-primary)" />
              <span>Attach Photos & Images</span>
            </button>
            <button
              type="button"
              className="capsule-popover-item"
              onClick={() => {
                setShowAttachmentMenu(false);
                audioInputRef.current?.click();
              }}
            >
              <Music size={16} color="#ec4899" />
              <span>Attach Music & Audio Tracks</span>
            </button>
            <button
              type="button"
              className="capsule-popover-item"
              onClick={() => {
                setShowAttachmentMenu(false);
                fileInputRef.current?.click();
              }}
            >
              <FileText size={16} color="#38bdf8" />
              <span>Attach Documents & Logs</span>
            </button>
          </div>
        )}

        {/* Capsule Pill Bar (Matching Reference Image) */}
        <div className="capsule-composer-bar">
          {isRecording ? (
            /* Live Recording Studio View */
            <div className="capsule-recording-studio">
              <div className="recording-status-badge">
                <span className="recording-pulse-beacon" />
                <span>REC {formatSeconds(recordingDuration)}</span>
              </div>

              {/* Animated Waveform Visualizer */}
              <div className="recording-wave-visualizer">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="recording-wave-bar" />
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
                    background: 'rgba(99, 102, 241, 0.18)',
                    border: '1px solid var(--accent-primary)',
                    color: 'var(--accent-primary)',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Attach to message composer to review or add text before sending"
                >
                  <Check size={14} /> Review & Attach
                </button>

                <button
                  type="button"
                  onClick={finishAndSendVoiceNote}
                  className="capsule-send-btn"
                  title="Send voice note immediately"
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
                title="Attach photo, audio/music, or document"
                disabled={sending}
              >
                <Paperclip size={19} />
              </button>

              {/* Center: Message Input Field matching screenshot '|Write a message...' */}
              <input
                ref={inputRef}
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onPaste={handlePaste}
                placeholder="Write a message..."
                disabled={sending}
                className="capsule-input-field"
                onFocus={() => {
                  setShowAttachmentMenu(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />

              {/* Right: Microphone Audio Recording Button or Send Button */}
              {(!messageText.trim() && stagedFiles.length === 0) ? (
                <button
                  type="button"
                  onClick={startAudioRecording}
                  className="capsule-btn-icon"
                  style={{ color: 'var(--accent-primary)' }}
                  title="Record voice note"
                  disabled={sending}
                >
                  <Mic size={20} />
                </button>
              ) : (
                /* Dynamic Send Button when text or files are ready */
                <button
                  type="submit"
                  disabled={sending}
                  className="capsule-send-btn"
                  title="Send message"
                >
                  {sending ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
                </button>
              )}
            </>
          )}
        </div>

        {uploadStatus && (
          <div style={{
            fontSize: '0.74rem', color: 'var(--accent-primary)', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: '8px'
          }}>
            <Loader2 size={13} className="spin" /> {uploadStatus}
          </div>
        )}
      </form>

      {/* ── Interactive Fullscreen Image Lightbox Modal ── */}
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
              background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(255,255,255,0.12)',
              color: '#ffffff', zIndex: 10
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <div style={{
                padding: '6px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.2)',
                color: '#818cf8', display: 'flex'
              }}>
                <ImageIcon size={18} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontWeight: 700, fontSize: '0.9rem',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '320px'
                }}>
                  {lightboxDoc.name || 'Discussion Attachment Image'}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                  {formatFileSize(lightboxDoc.size)} &bull; {Math.round(lightboxZoom * 100)}% zoom
                </div>
              </div>
            </div>

            {/* Controls: Zoom, Rotate, Download, Close */}
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
                download={lightboxDoc.name || 'image'}
                style={{
                  padding: '6px 12px', borderRadius: '8px', border: 'none',
                  background: 'var(--accent-gradient)', color: '#fff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem',
                  fontWeight: 700, textDecoration: 'none'
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
                title="Close Lightbox (Esc)"
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
    </div>
  );
}

