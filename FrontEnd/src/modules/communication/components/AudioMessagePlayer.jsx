import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, Download } from 'lucide-react';

export default function AudioMessagePlayer({
  src,
  downloadUrl,
  name = 'Voice Note',
  duration = 0,
  isOwn = false,
  variant = 'primary'
}) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setTotalDuration(Math.round(audio.duration));
      }
    };

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
    };
  }, [src]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn('Audio playback error:', err.message);
      });
    }
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio || !totalDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const targetTime = Math.max(0, Math.min(pos * totalDuration, totalDuration));
    audio.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  const isAmber = variant === 'amber';
  const bgStyle = isOwn
    ? 'rgba(59, 130, 246, 0.15)'
    : isAmber
    ? 'rgba(245, 158, 11, 0.12)'
    : 'rgba(255, 255, 255, 0.08)';

  const accentColor = isOwn
    ? '#3b82f6'
    : isAmber
    ? '#f59e0b'
    : '#10b981';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px 12px',
        borderRadius: '12px',
        backgroundColor: bgStyle,
        border: `1px solid ${isAmber ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255, 255, 255, 0.1)'}`,
        minWidth: '220px',
        maxWidth: '340px'
      }}
    >
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Play / Pause Toggle Button */}
      <button
        type="button"
        onClick={togglePlay}
        aria-label={isPlaying ? 'Pause voice message' : 'Play voice message'}
        style={{
          width: '34px',
          height: '34px',
          borderRadius: '50%',
          backgroundColor: accentColor,
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none',
          cursor: 'pointer',
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          transition: 'transform 0.15s ease'
        }}
      >
        {isPlaying ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: '2px' }} />}
      </button>

      {/* Progress & Metadata */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'inherit', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {name}
          </span>
          <span style={{ fontSize: '10px', opacity: 0.75, fontFamily: 'monospace' }}>
            {formatTime(currentTime)} / {formatTime(totalDuration)}
          </span>
        </div>

        {/* Scrubber Bar */}
        <div
          onClick={handleSeek}
          style={{
            height: '6px',
            backgroundColor: 'rgba(150, 150, 150, 0.25)',
            borderRadius: '3px',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progressPercent}%`,
              backgroundColor: accentColor,
              borderRadius: '3px',
              transition: isPlaying ? 'width 0.1s linear' : 'none'
            }}
          />
        </div>
      </div>

      {/* Optional Download */}
      {downloadUrl && (
        <a
          href={downloadUrl}
          download={name}
          title="Download Audio"
          style={{
            color: 'inherit',
            opacity: 0.65,
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Download size={14} />
        </a>
      )}
    </div>
  );
}
