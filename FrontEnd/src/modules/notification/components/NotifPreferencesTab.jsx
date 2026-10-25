import React, { useState, useEffect, useRef } from 'react';
import {
  Sliders, Bell, Mail, Check, RotateCcw,
  Save, ShieldCheck, Sparkles, AlertCircle, Loader2,
  Volume2, VolumeX, Volume1, Moon, CheckCircle2,
  Radio, Laptop, Zap, FileText, UserCheck, AlertTriangle,
  Play, Music
} from 'lucide-react';
import notificationApi from '../api/notificationApi';
import { useAuth } from '../../authentication/contexts/AuthContext';
import { useTranslation } from '../../../i18n';
import soundEngine, { SOUND_PROFILES } from '../utils/soundEngine';

const glassCard = {
  background: 'var(--glass-bg)',
  border: '1px solid var(--glass-border)',
  borderRadius: '20px',
  backdropFilter: 'blur(16px)',
  padding: '24px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
};

// Exported chime player for app-wide backwards compatibility and real-time alerts
export const playSoundChime = (profile = 'aurora', volume = 0.8) => {
  soundEngine.play(profile, volume);
};

const DEFAULT_CLIENT_PREFS = {
  soundAlerts: true,
  soundProfile: 'aurora',
  soundVolume: 0.8,
  toastPopups: true,
  maintenanceAlerts: true,
  quietHours: false,
  emailDigest: 'instant' // 'instant' | 'daily' | 'weekly'
};

export default function NotifPreferencesTab() {
  const { t, currentLanguage } = useTranslation();
  const { user } = useAuth();
  const isAmharic = currentLanguage === 'am';

  // Matrix state from Database
  const [types, setTypes] = useState([]);
  const [channels, setChannels] = useState([]);
  const [matrixState, setMatrixState] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Client-side alert experience settings (Sound, Ringtone, Volume, Toasts, Digest, Quiet Hours)
  const [clientSettings, setClientSettings] = useState(() => {
    try {
      const stored = localStorage.getItem('itms_notification_preferences');
      if (stored) {
        return { ...DEFAULT_CLIENT_PREFS, ...JSON.parse(stored) };
      }
    } catch (e) {
      // fallback
    }
    return DEFAULT_CLIENT_PREFS;
  });

  const [playingProfileId, setPlayingProfileId] = useState(null);

  const loadPreferences = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await notificationApi.getPreferences();
      const raw = res.data?.data || [];
      const list = Array.isArray(raw) ? raw : [];

      const typeMap = new Map();
      const chanMap = new Map();
      const state = {};

      list.forEach(item => {
        if (!typeMap.has(item.NotificationTypeID)) {
          typeMap.set(item.NotificationTypeID, {
            id: item.NotificationTypeID,
            code: item.TypeCode,
            name: item.TypeName
          });
        }
        // SMS is excluded per enterprise policy
        if (item.ChannelCode !== 'SMS' && !chanMap.has(item.NotificationChannelID)) {
          chanMap.set(item.NotificationChannelID, {
            id: item.NotificationChannelID,
            code: item.ChannelCode,
            name: item.ChannelName
          });
        }
        const key = `${item.NotificationTypeID}_${item.NotificationChannelID}`;
        state[key] = Boolean(item.IsEnabled);
      });

      setTypes(Array.from(typeMap.values()));
      setChannels(Array.from(chanMap.values()).filter(c => c.code !== 'SMS'));
      setMatrixState(state);
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error('Failed to load user notification preferences:', err);
      setErrorMsg(t('notifications.preferencesTab.loadError', 'Failed to load notification preferences. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPreferences();
  }, []);

  // Matrix toggle
  const handleToggleMatrix = (typeId, channelId) => {
    const key = `${typeId}_${channelId}`;
    setMatrixState(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    setSavedSuccess(false);
    setHasUnsavedChanges(true);
  };

  // Bulk column toggles
  const handleBulkToggleChannel = (channelId, enableAll) => {
    setMatrixState(prev => {
      const next = { ...prev };
      types.forEach(t => {
        next[`${t.id}_${channelId}`] = enableAll;
      });
      return next;
    });
    setSavedSuccess(false);
    setHasUnsavedChanges(true);
  };

  // Client settings toggles
  const handleClientSettingChange = (field, value) => {
    setClientSettings(prev => ({
      ...prev,
      [field]: value
    }));
    setSavedSuccess(false);
    setHasUnsavedChanges(true);
  };

  // Play specific sound profile preview
  const handlePreviewSoundProfile = (profileId, volumeOverride) => {
    const vol = volumeOverride ?? clientSettings.soundVolume ?? 0.8;
    setPlayingProfileId(profileId);
    soundEngine.play(profileId, vol);
    setTimeout(() => {
      setPlayingProfileId(null);
    }, 750);
  };

  // Save all preferences (Database matrix + Client settings)
  const handleSave = async () => {
    setSaving(true);
    setErrorMsg(null);
    try {
      // 1. Build database matrix payload
      const payload = [];
      types.forEach(t => {
        channels.forEach(c => {
          const key = `${t.id}_${c.id}`;
          payload.push({
            notificationTypeId: t.id,
            channelId: c.id,
            isEnabled: matrixState[key] ? 1 : 0
          });
        });
      });

      await notificationApi.updatePreferences(payload);

      // 2. Save client settings to localStorage
      localStorage.setItem('itms_notification_preferences', JSON.stringify(clientSettings));

      // 3. Dispatch cross-component event for immediate app-wide sync
      window.dispatchEvent(new CustomEvent('itms-preferences-updated', { detail: clientSettings }));

      // 4. Play audio ringtone confirmation if sound is enabled
      if (clientSettings.soundAlerts) {
        soundEngine.play(clientSettings.soundProfile || 'aurora', clientSettings.soundVolume || 0.8);
      }

      setSavedSuccess(true);
      setHasUnsavedChanges(false);
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to update preferences:', err);
      setErrorMsg(err.response?.data?.message || t('notifications.preferencesTab.saveError', 'Failed to save preferences.'));
    } finally {
      setSaving(false);
    }
  };

  // Reset to enterprise defaults
  const handleResetDefaults = () => {
    setMatrixState(prev => {
      const next = { ...prev };
      types.forEach(t => {
        channels.forEach(c => {
          next[`${t.id}_${c.id}`] = true;
        });
      });
      return next;
    });

    setClientSettings(DEFAULT_CLIENT_PREFS);
    setSavedSuccess(false);
    setHasUnsavedChanges(true);
    // Play default chime on reset
    soundEngine.play('aurora', 0.8);
  };

  const getEventIcon = (code) => {
    switch (code) {
      case 'ISSUE_CREATED':
        return <FileText size={16} color="#6366f1" />;
      case 'ISSUE_ASSIGNED':
        return <UserCheck size={16} color="#8b5cf6" />;
      case 'SLA_BREACH':
        return <AlertTriangle size={16} color="#f59e0b" />;
      case 'APPROVAL_REQUIRED':
        return <ShieldCheck size={16} color="#10b981" />;
      default:
        return <Sparkles size={16} color="#6366f1" />;
    }
  };

  const getEventDescription = (code) => {
    switch (code) {
      case 'ISSUE_CREATED':
        return t('profile.emailTicketUpdatesDesc', 'Alerts when a new service request or ticket is registered in the system.');
      case 'ISSUE_ASSIGNED':
        return t('profile.emailTicketUpdatesDesc', 'Dispatches notification when a technician or team is assigned or reassigned.');
      case 'SLA_BREACH':
        return t('profile.emailSlaWarningsDesc', 'Critical escalation alerts when request response or resolution SLA is breached.');
      case 'APPROVAL_REQUIRED':
        return t('profile.governanceApprovalDesc', 'Governance alert when an operational or financial action requires management sign-off.');
      default:
        return t('profile.generalAnnouncementDesc', 'System notifications, broadcast announcements, and general platform updates.');
    }
  };

  const recipientEmail = user?.email || user?.Email || 'user@organization.corp';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
      {/* SECTION 1: Top Unified Header Banner & Action Bar */}
      <div style={{
        ...glassCard,
        padding: '24px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '18px',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.04) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '46px', height: '46px', borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(139, 92, 246, 0.15) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.35)',
            boxShadow: '0 4px 16px rgba(99, 102, 241, 0.2)'
          }}>
            <Sliders size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.3px' }}>
                {t('profile.notifChannelsTitle', 'Notification Preferences & Delivery Channels')}
              </h2>
              <span style={{
                fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: '6px',
                background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)',
                letterSpacing: '0.4px'
              }}>
                ENTERPRISE MATRIX
              </span>
              {hasUnsavedChanges && (
                <span style={{
                  fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px',
                  background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)',
                  display: 'flex', alignItems: 'center', gap: '5px'
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                  {t('profile.unsavedChanges', 'Unsaved changes')}
                </span>
              )}
            </div>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.86rem', maxWidth: '820px', lineHeight: 1.5 }}>
              {t('profile.notifChannelsDesc', 'Customize your multichannel alert routing, acoustic notification ringtones, digest frequencies, and granular event subscriptions.')}
            </p>
          </div>
        </div>

        {/* Global Save & Reset Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={handleResetDefaults}
            disabled={saving || loading}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '7px',
              padding: '10px 18px', borderRadius: '10px',
              border: '1px solid var(--glass-border)', background: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)', fontSize: '0.84rem', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
            }}
            title={t('profile.resetDefaults', 'Reset to Defaults')}
          >
            <RotateCcw size={15} />
            <span>{t('profile.resetDefaults', 'Reset All')}</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '10px 24px', borderRadius: '10px', border: 'none',
              background: savedSuccess ? '#10b981' : 'var(--accent-gradient)',
              color: '#ffffff', fontSize: '0.86rem', fontWeight: 700,
              cursor: saving ? 'wait' : 'pointer',
              boxShadow: savedSuccess ? '0 4px 18px rgba(16, 185, 129, 0.4)' : '0 4px 18px rgba(99, 102, 241, 0.4)',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            {saving ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                <span>{t('profile.savingPrefs', 'Saving Preferences...')}</span>
              </>
            ) : savedSuccess ? (
              <>
                <Check size={17} />
                <span>{t('profile.changesSaved', 'Preferences Saved!')}</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>{t('profile.savePrefs', 'Save Notification Settings')}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error & Feedback Alerts */}
      {errorMsg && (
        <div style={{
          padding: '14px 20px', borderRadius: '14px',
          background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#ef4444', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '12px'
        }}>
          <AlertCircle size={20} />
          <span>{errorMsg}</span>
        </div>
      )}

      {savedSuccess && (
        <div style={{
          padding: '14px 20px', borderRadius: '14px',
          background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#10b981', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '12px',
          boxShadow: '0 4px 14px rgba(16, 185, 129, 0.15)'
        }}>
          <CheckCircle2 size={20} />
          <span>{t('profile.prefsSavedSuccess', 'All notification preferences and channel settings saved successfully!')}</span>
        </div>
      )}

      {/* SECTION 2: Active Delivery Gateways Status Cards */}
      <div>
        <h3 style={{
          fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)',
          marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <Radio size={16} color="var(--accent-primary)" />
          <span>{t('profile.activeChannels', 'Active Delivery Gateways')}</span>
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '16px'
        }}>
          {/* Card A: In-App Live Feed */}
          <div style={{
            ...glassCard,
            padding: '20px 22px',
            background: 'var(--bg-secondary)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '12px',
                  background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Bell size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                    {t('profile.inAppFeedTitle', 'In-App Notification Feed')}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    WebSocket & Polling Engine
                  </div>
                </div>
              </div>

              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '3px 10px', borderRadius: '20px',
                background: 'rgba(16, 185, 129, 0.15)', color: '#10b981',
                fontSize: '0.72rem', fontWeight: 700, border: '1px solid rgba(16, 185, 129, 0.3)'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                Connected
              </span>
            </div>

            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              {t('profile.inAppFeedDesc', 'Real-time activity counter, top navigation bell dropdown, and live ticket alerts.')}
            </p>
          </div>

          {/* Card B: Corporate Email Gateway */}
          <div style={{
            ...glassCard,
            padding: '20px 22px',
            background: 'var(--bg-secondary)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.15)', color: '#10b981',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Mail size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                    {t('profile.emailGatewayTitle', 'Corporate Email Gateway')}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'monospace' }}>
                    {recipientEmail}
                  </div>
                </div>
              </div>

              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '3px 10px', borderRadius: '20px',
                background: 'rgba(16, 185, 129, 0.15)', color: '#10b981',
                fontSize: '0.72rem', fontWeight: 700, border: '1px solid rgba(16, 185, 129, 0.3)'
              }}>
                <Check size={12} />
                Verified
              </span>
            </div>

            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              {t('profile.emailGatewayDesc', 'Official notifications routed to your verified corporate mailbox.')}
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 3: Client Experience, Sound Ringtones & Audio Controls */}
      <div style={{
        ...glassCard,
        background: 'var(--bg-secondary)',
        padding: '26px'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{
            fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)',
            margin: 0, display: 'flex', alignItems: 'center', gap: '10px'
          }}>
            <Volume2 size={18} color="#f59e0b" />
            <span>{t('profile.soundAlerts', 'In-App & Desktop Sound Alerts')}</span>
          </h3>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
            Customize your audible notification ringtone, acoustic profiles, visual toast notifications, and focus hours
          </p>
        </div>

        {/* Feature 1: Master Audible Chime & Ringtone Suite */}
        <div style={{
          padding: '20px',
          background: 'var(--bg-tertiary)',
          borderRadius: '16px',
          border: '1px solid var(--glass-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '12px',
                background: clientSettings.soundAlerts ? 'rgba(245, 158, 11, 0.15)' : 'rgba(148, 163, 184, 0.1)',
                color: clientSettings.soundAlerts ? '#f59e0b' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px'
              }}>
                {clientSettings.soundAlerts ? <Volume2 size={20} /> : <VolumeX size={20} />}
              </div>
              <div>
                <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.94rem' }}>
                  {t('profile.soundOnNew', 'Audible Sound Alert on New Request')}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '2px', lineHeight: 1.45 }}>
                  {t('profile.soundOnNewDesc', 'Play notification tone when a ticket requires immediate attention.')}
                </div>
              </div>
            </div>

            {/* Master Sound Switch */}
            <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '26px', cursor: 'pointer', flexShrink: 0 }}>
              <input
                type="checkbox"
                checked={clientSettings.soundAlerts}
                onChange={e => handleClientSettingChange('soundAlerts', e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute', inset: 0,
                backgroundColor: clientSettings.soundAlerts ? '#f59e0b' : 'rgba(148, 163, 184, 0.25)',
                borderRadius: '34px', transition: 'all 0.3s ease',
                boxShadow: clientSettings.soundAlerts ? '0 0 10px rgba(245, 158, 11, 0.4)' : 'none'
              }}>
                <span style={{
                  position: 'absolute', height: '20px', width: '20px',
                  left: clientSettings.soundAlerts ? '24px' : '3px', bottom: '3px',
                  backgroundColor: '#ffffff', borderRadius: '50%',
                  transition: 'all 0.3s ease', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                }} />
              </span>
            </label>
          </div>

          {/* Sub-Panel: Ringtone Sound Profiles & Volume Slider (Visible when sound is enabled) */}
          {clientSettings.soundAlerts && (
            <div style={{
              paddingTop: '16px',
              borderTop: '1px solid var(--glass-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {/* Ringtone Selection Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <Music size={15} color="#f59e0b" />
                    <span>{t('profile.ringtoneProfile', 'Notification Ringtone Sound')}</span>
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {t('profile.ringtoneDesc', 'Select from curated, professionally tuned acoustic notification ringtones.')}
                  </div>
                </div>

                {/* Volume Slider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-secondary)', padding: '6px 14px', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                  <Volume1 size={15} color="var(--text-muted)" />
                  <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {t('profile.ringtoneVolume', 'Volume')}: {Math.round((clientSettings.soundVolume ?? 0.8) * 100)}%
                  </span>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={clientSettings.soundVolume ?? 0.8}
                    onChange={e => handleClientSettingChange('soundVolume', parseFloat(e.target.value))}
                    onMouseUp={e => handlePreviewSoundProfile(clientSettings.soundProfile || 'aurora', parseFloat(e.target.value))}
                    style={{ width: '90px', cursor: 'pointer', accentColor: '#f59e0b' }}
                  />
                </div>
              </div>

              {/* Ringtone Options Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '12px'
              }}>
                {SOUND_PROFILES.map(profile => {
                  const isSelected = (clientSettings.soundProfile || 'aurora') === profile.id;
                  const isPlaying = playingProfileId === profile.id;

                  return (
                    <div
                      key={profile.id}
                      onClick={() => {
                        handleClientSettingChange('soundProfile', profile.id);
                        handlePreviewSoundProfile(profile.id);
                      }}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '12px',
                        background: isSelected ? 'rgba(245, 158, 11, 0.12)' : 'var(--bg-secondary)',
                        border: isSelected ? '1.5px solid #f59e0b' : '1px solid var(--glass-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: isSelected ? '0 0 14px rgba(245, 158, 11, 0.2)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '16px', height: '16px', borderRadius: '50%',
                          border: isSelected ? '5px solid #f59e0b' : '2px solid var(--text-muted)',
                          background: '#ffffff', flexShrink: 0
                        }} />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: isSelected ? 'var(--text-primary)' : 'inherit' }}>
                              {isAmharic ? profile.nameAm : profile.name}
                            </span>
                            <span style={{
                              fontSize: '0.62rem', fontWeight: 800, padding: '1px 5px', borderRadius: '4px',
                              background: isSelected ? 'rgba(245, 158, 11, 0.25)' : 'var(--bg-tertiary)',
                              color: isSelected ? '#d97706' : 'var(--text-muted)'
                            }}>
                              {profile.tag}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.35 }}>
                            {isAmharic ? profile.descAm : profile.desc}
                          </div>
                        </div>
                      </div>

                      {/* Play Preview Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreviewSoundProfile(profile.id);
                        }}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '5px',
                          padding: '6px 10px', borderRadius: '8px',
                          background: isPlaying ? 'rgba(245, 158, 11, 0.35)' : 'rgba(245, 158, 11, 0.15)',
                          border: '1px solid rgba(245, 158, 11, 0.35)',
                          color: '#f59e0b', fontSize: '0.72rem', fontWeight: 700,
                          cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
                          transform: isPlaying ? 'scale(0.96)' : 'scale(1)'
                        }}
                        title={t('profile.playRingtone', 'Play Ringtone')}
                      >
                        <Play size={11} fill={isPlaying ? '#f59e0b' : 'none'} />
                        <span>{isPlaying ? t('profile.playing', 'Playing...') : t('profile.playRingtone', 'Play')}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Feature 2, 3, 4: Real-time Toasts, Campus Alerts, Quiet Hours */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
          {/* Feature 2: Real-time Toast Banners */}
          <div style={{
            padding: '16px 20px',
            background: 'var(--bg-tertiary)',
            borderRadius: '14px',
            border: '1px solid var(--glass-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '10px',
                background: clientSettings.toastPopups ? 'rgba(99, 102, 241, 0.15)' : 'rgba(148, 163, 184, 0.1)',
                color: clientSettings.toastPopups ? '#6366f1' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px'
              }}>
                <Laptop size={18} />
              </div>
              <div>
                <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.9rem' }}>
                  {t('profile.toastBanners', 'Real-time Toast Banners')}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '2px', lineHeight: 1.4 }}>
                  {t('profile.toastBannersDesc', 'Display pop-up banners in the top-right corner of the application.')}
                </div>
              </div>
            </div>

            {/* Switch */}
            <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '26px', cursor: 'pointer', flexShrink: 0 }}>
              <input
                type="checkbox"
                checked={clientSettings.toastPopups}
                onChange={e => handleClientSettingChange('toastPopups', e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute', inset: 0,
                backgroundColor: clientSettings.toastPopups ? '#6366f1' : 'rgba(148, 163, 184, 0.25)',
                borderRadius: '34px', transition: 'all 0.3s ease',
                boxShadow: clientSettings.toastPopups ? '0 0 10px rgba(99, 102, 241, 0.4)' : 'none'
              }}>
                <span style={{
                  position: 'absolute', height: '20px', width: '20px',
                  left: clientSettings.toastPopups ? '24px' : '3px', bottom: '3px',
                  backgroundColor: '#ffffff', borderRadius: '50%',
                  transition: 'all 0.3s ease', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                }} />
              </span>
            </label>
          </div>

          {/* Feature 3: Campus & Infrastructure Maintenance Alerts */}
          <div style={{
            padding: '16px 20px',
            background: 'var(--bg-tertiary)',
            borderRadius: '14px',
            border: '1px solid var(--glass-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '10px',
                background: clientSettings.maintenanceAlerts ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.1)',
                color: clientSettings.maintenanceAlerts ? '#10b981' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px'
              }}>
                <Zap size={18} />
              </div>
              <div>
                <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.9rem' }}>
                  {t('profile.emailMaintenance', 'Campus & Infrastructure Maintenance Alerts')}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '2px', lineHeight: 1.4 }}>
                  {t('profile.emailMaintenanceDesc', 'Broadcasts regarding power, HVAC, or facility upgrades.')}
                </div>
              </div>
            </div>

            {/* Switch */}
            <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '26px', cursor: 'pointer', flexShrink: 0 }}>
              <input
                type="checkbox"
                checked={clientSettings.maintenanceAlerts}
                onChange={e => handleClientSettingChange('maintenanceAlerts', e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute', inset: 0,
                backgroundColor: clientSettings.maintenanceAlerts ? '#10b981' : 'rgba(148, 163, 184, 0.25)',
                borderRadius: '34px', transition: 'all 0.3s ease',
                boxShadow: clientSettings.maintenanceAlerts ? '0 0 10px rgba(16, 185, 129, 0.4)' : 'none'
              }}>
                <span style={{
                  position: 'absolute', height: '20px', width: '20px',
                  left: clientSettings.maintenanceAlerts ? '24px' : '3px', bottom: '3px',
                  backgroundColor: '#ffffff', borderRadius: '50%',
                  transition: 'all 0.3s ease', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                }} />
              </span>
            </label>
          </div>

          {/* Feature 4: Quiet Hours / Focus Mode */}
          <div style={{
            padding: '16px 20px',
            background: 'var(--bg-tertiary)',
            borderRadius: '14px',
            border: '1px solid var(--glass-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '10px',
                background: clientSettings.quietHours ? 'rgba(139, 92, 246, 0.15)' : 'rgba(148, 163, 184, 0.1)',
                color: clientSettings.quietHours ? '#8b5cf6' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px'
              }}>
                <Moon size={18} />
              </div>
              <div>
                <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.9rem' }}>
                  {t('profile.quietHours', 'Do Not Disturb / Quiet Hours')}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '2px', lineHeight: 1.4 }}>
                  {t('profile.quietHoursDesc', 'Silence audible chimes and toast notifications outside normal working hours (10:00 PM – 07:00 AM).')}
                </div>
              </div>
            </div>

            {/* Switch */}
            <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '26px', cursor: 'pointer', flexShrink: 0 }}>
              <input
                type="checkbox"
                checked={clientSettings.quietHours}
                onChange={e => handleClientSettingChange('quietHours', e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute', inset: 0,
                backgroundColor: clientSettings.quietHours ? '#8b5cf6' : 'rgba(148, 163, 184, 0.25)',
                borderRadius: '34px', transition: 'all 0.3s ease',
                boxShadow: clientSettings.quietHours ? '0 0 10px rgba(139, 92, 246, 0.4)' : 'none'
              }}>
                <span style={{
                  position: 'absolute', height: '20px', width: '20px',
                  left: clientSettings.quietHours ? '24px' : '3px', bottom: '3px',
                  backgroundColor: '#ffffff', borderRadius: '50%',
                  transition: 'all 0.3s ease', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                }} />
              </span>
            </label>
          </div>
        </div>

        {/* Feature 5: Email Digest Cadence Selector */}
        <div style={{
          marginTop: '20px',
          padding: '18px 20px',
          background: 'var(--bg-tertiary)',
          borderRadius: '14px',
          border: '1px solid var(--glass-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div>
            <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mail size={16} color="var(--accent-secondary)" />
              <span>{t('profile.emailDigestCadence', 'Email Digest & Delivery Cadence')}</span>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '2px' }}>
              {t('profile.emailDigestCadenceDesc', 'Choose how frequently ticket summary notifications are dispatched to your inbox.')}
            </div>
          </div>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            {[
              { id: 'instant', label: t('profile.digestInstant', 'Instant (Per Event)'), desc: 'Real-time alert per ticket lifecycle event' },
              { id: 'daily', label: t('profile.digestDaily', 'Daily Digest (8:00 AM)'), desc: 'Aggregated morning briefing of open items' },
              { id: 'weekly', label: t('profile.digestWeekly', 'Weekly Summary (Mon 9:00 AM)'), desc: 'Consolidated performance overview' }
            ].map(opt => {
              const isSelected = clientSettings.emailDigest === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleClientSettingChange('emailDigest', opt.id)}
                  style={{
                    flex: '1 1 200px',
                    padding: '10px 16px',
                    borderRadius: '10px',
                    background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-secondary)',
                    border: isSelected ? '1.5px solid #6366f1' : '1px solid var(--glass-border)',
                    color: isSelected ? '#818cf8' : 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'left'
                  }}
                >
                  <div style={{
                    width: '16px', height: '16px', borderRadius: '50%',
                    border: isSelected ? '5px solid #6366f1' : '2px solid var(--text-muted)',
                    background: '#ffffff', flexShrink: 0
                  }} />
                  <div>
                    <div style={{ fontSize: '0.84rem', fontWeight: 700, color: isSelected ? 'var(--text-primary)' : 'inherit' }}>
                      {opt.label}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {opt.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION 4: Database-Backed Granular Subscription Matrix */}
      <div>
        <div style={{ marginBottom: '14px' }}>
          <h3 style={{
            fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)',
            margin: 0, display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <Sparkles size={18} color="var(--accent-primary)" />
            <span>{t('profile.eventMatrixTitle', 'Granular Event Subscription Matrix')}</span>
          </h3>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
            {t('profile.eventMatrixDesc', 'Selectively enable or silence in-app and email delivery for each distinct system trigger.')}
          </p>
        </div>

        <div style={{ ...glassCard, padding: '0', overflow: 'hidden', background: 'var(--bg-secondary)' }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px 0' }}>
              <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px', color: '#6366f1' }} />
              <span style={{ fontSize: '0.88rem' }}>Loading subscription preferences...</span>
            </div>
          ) : types.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <Sliders size={36} color="rgba(148, 163, 184, 0.3)" style={{ marginBottom: '12px' }} />
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                No notification types configured
              </div>
              <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                System administrators have not defined any notification trigger types yet.
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderBottom: '1px solid var(--glass-border)'
                  }}>
                    <th style={{ padding: '16px 24px', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', width: '50%' }}>
                      Notification Event & Description
                    </th>
                    {channels.map(chan => (
                      <th key={chan.id} style={{
                        padding: '16px 20px', fontSize: '0.78rem', fontWeight: 800,
                        color: 'var(--text-primary)', textAlign: 'center', width: '25%'
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {chan.code === 'EMAIL' ? <Mail size={15} color="#10b981" /> : <Bell size={15} color="#6366f1" />}
                            <span style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              {chan.code === 'EMAIL' ? t('profile.channelEmail', 'Corporate Email') : t('profile.channelInApp', 'In-App Feed')}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                            <button
                              type="button"
                              onClick={() => handleBulkToggleChannel(chan.id, true)}
                              style={{
                                background: 'transparent', border: 'none',
                                color: chan.code === 'EMAIL' ? '#10b981' : '#818cf8',
                                fontSize: '0.7rem', cursor: 'pointer', padding: '1px 6px', fontWeight: 800,
                                borderRadius: '4px'
                              }}
                              title={`Enable all for ${chan.code}`}
                            >
                              {t('profile.allOn', 'All ON')}
                            </button>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>&bull;</span>
                            <button
                              type="button"
                              onClick={() => handleBulkToggleChannel(chan.id, false)}
                              style={{
                                background: 'transparent', border: 'none', color: 'var(--text-muted)',
                                fontSize: '0.7rem', cursor: 'pointer', padding: '1px 6px', fontWeight: 600,
                                borderRadius: '4px'
                              }}
                              title={`Disable all for ${chan.code}`}
                            >
                              {t('profile.allOff', 'All OFF')}
                            </button>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {types.map((type, index) => {
                    return (
                      <tr
                        key={type.id}
                        style={{
                          borderBottom: index < types.length - 1 ? '1px solid var(--glass-border)' : 'none',
                          background: index % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                        onMouseLeave={e => e.currentTarget.style.background = index % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)'}
                      >
                        {/* Event Details */}
                        <td style={{ padding: '18px 24px' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                            <div style={{
                              width: '36px', height: '36px', borderRadius: '10px',
                              background: 'var(--bg-tertiary)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              flexShrink: 0, marginTop: '2px',
                              border: '1px solid var(--glass-border)'
                            }}>
                              {getEventIcon(type.code)}
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontWeight: 700, fontSize: '0.94rem', color: 'var(--text-primary)' }}>
                                  {type.name}
                                </span>
                                <span style={{
                                  fontFamily: 'monospace', fontSize: '0.68rem',
                                  color: 'var(--text-muted)', background: 'var(--bg-tertiary)',
                                  padding: '1px 6px', borderRadius: '4px', border: '1px solid var(--glass-border)'
                                }}>
                                  {type.code}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.81rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.45 }}>
                                {getEventDescription(type.code)}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Channel Toggles */}
                        {channels.map(chan => {
                          const key = `${type.id}_${chan.id}`;
                          const isEnabled = Boolean(matrixState[key]);

                          return (
                            <td key={chan.id} style={{ padding: '18px 20px', textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                                <label style={{
                                  position: 'relative',
                                  display: 'inline-block',
                                  width: '48px',
                                  height: '26px',
                                  cursor: 'pointer'
                                }}>
                                  <input
                                    type="checkbox"
                                    checked={isEnabled}
                                    onChange={() => handleToggleMatrix(type.id, chan.id)}
                                    style={{ opacity: 0, width: 0, height: 0 }}
                                  />
                                  <span style={{
                                    position: 'absolute',
                                    inset: 0,
                                    backgroundColor: isEnabled ? (chan.code === 'EMAIL' ? '#10b981' : '#6366f1') : 'rgba(148, 163, 184, 0.25)',
                                    borderRadius: '34px',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: isEnabled ? `0 0 10px ${chan.code === 'EMAIL' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(99, 102, 241, 0.4)'}` : 'none'
                                  }}>
                                    <span style={{
                                      position: 'absolute',
                                      height: '20px',
                                      width: '20px',
                                      left: isEnabled ? '24px' : '3px',
                                      bottom: '3px',
                                      backgroundColor: '#ffffff',
                                      borderRadius: '50%',
                                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                                    }} />
                                  </span>
                                </label>

                                <span style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  color: isEnabled ? (chan.code === 'EMAIL' ? '#10b981' : '#818cf8') : 'var(--text-muted)'
                                }}>
                                  {isEnabled ? t('profile.subscribed', 'Subscribed') : t('profile.muted', 'Muted')}
                                </span>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
