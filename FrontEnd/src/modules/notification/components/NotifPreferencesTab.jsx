import React, { useState, useEffect } from 'react';
import {
  Sliders, Bell, Mail, MessageSquare, Check, RotateCcw,
  Save, ShieldCheck, Sparkles, AlertCircle, Info, Loader2
} from 'lucide-react';
import notificationApi from '../api/notificationApi';
import { useAuth } from '../../authentication/contexts/AuthContext';

const glassCard = {
  background: 'var(--glass-bg)',
  border: '1px solid var(--glass-border)',
  borderRadius: '20px',
  backdropFilter: 'blur(16px)',
  padding: '24px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
};

export default function NotifPreferencesTab() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState([]);
  const [types, setTypes] = useState([]);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Grouped matrix: map of `${typeId}_${channelId}` => boolean
  const [matrixState, setMatrixState] = useState({});

  const loadPreferences = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await notificationApi.getPreferences();
      const raw = res.data?.data || [];
      const list = Array.isArray(raw) ? raw : [];
      setPreferences(list);

      // Extract unique types and channels
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
        if (!chanMap.has(item.NotificationChannelID)) {
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
      setChannels(Array.from(chanMap.values()));
      setMatrixState(state);
    } catch (err) {
      console.error('Failed to load user notification preferences:', err);
      setErrorMsg('Failed to load notification preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPreferences();
  }, []);

  const handleToggle = (typeId, channelId) => {
    const key = `${typeId}_${channelId}`;
    setMatrixState(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    setSavedSuccess(false);
  };

  const handleBulkToggleChannel = (channelId, enableAll) => {
    setMatrixState(prev => {
      const next = { ...prev };
      types.forEach(t => {
        next[`${t.id}_${channelId}`] = enableAll;
      });
      return next;
    });
    setSavedSuccess(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg(null);
    try {
      // Build preferences array for backend
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
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update preferences:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to save preferences.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setMatrixState(prev => {
      const next = { ...prev };
      types.forEach(t => {
        channels.forEach(c => {
          next[`${t.id}_${c.id}`] = true; // Default all enabled
        });
      });
      return next;
    });
    setSavedSuccess(false);
  };

  const getEventDescription = (code) => {
    switch (code) {
      case 'ISSUE_CREATED':
        return 'Alerts when a new service request or ticket is registered in the system.';
      case 'ISSUE_ASSIGNED':
        return 'Dispatches alert when a technician or team is assigned to your request.';
      case 'SLA_BREACH':
        return 'Urgent alerts when a service request response or resolution SLA is breached.';
      case 'APPROVAL_REQUIRED':
        return 'Governance alert when an operational or financial action requires management sign-off.';
      default:
        return 'System notifications, broadcast announcements, and general platform updates.';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Top Banner Card */}
      <div style={{
        ...glassCard,
        padding: '22px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.15) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)'
          }}>
            <Sliders size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 800 }}>
                Personal Alert & Delivery Preferences
              </h3>
              <span style={{
                fontSize: '0.68rem', fontWeight: 800, padding: '2px 8px', borderRadius: '6px',
                background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)'
              }}>
                USER CONFIG
              </span>
            </div>
            <p style={{ margin: '3px 0 0', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
              Control which system events trigger real-time in-app alerts versus automated SMTP email delivery
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleResetDefaults}
            disabled={saving || loading}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '9px 16px', borderRadius: '10px',
              border: '1px solid var(--glass-border)', background: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.2s'
            }}
            title="Reset all channels to enabled"
          >
            <RotateCcw size={14} />
            <span>Reset All</span>
          </button>

          <button
            onClick={handleSave}
            disabled={saving || loading}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '9px 22px', borderRadius: '10px', border: 'none',
              background: savedSuccess ? '#10b981' : 'var(--accent-gradient)',
              color: '#fff', fontSize: '0.84rem', fontWeight: 700,
              cursor: saving ? 'wait' : 'pointer',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
              transition: 'all 0.2s'
            }}
          >
            {saving ? (
              <>
                <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Saving...</span>
              </>
            ) : savedSuccess ? (
              <>
                <Check size={16} />
                <span>Preferences Saved!</span>
              </>
            ) : (
              <>
                <Save size={15} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div style={{
          padding: '12px 18px', borderRadius: '12px',
          background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#ef4444', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Preferences Matrix Grid */}
      <div style={{ ...glassCard, padding: '0', overflow: 'hidden' }}>
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
                          <span style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>{chan.name || chan.code}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                          <button
                            type="button"
                            onClick={() => handleBulkToggleChannel(chan.id, true)}
                            style={{
                              background: 'transparent', border: 'none', color: '#10b981',
                              fontSize: '0.68rem', cursor: 'pointer', padding: '1px 4px', fontWeight: 700
                            }}
                          >
                            All ON
                          </button>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>&bull;</span>
                          <button
                            type="button"
                            onClick={() => handleBulkToggleChannel(chan.id, false)}
                            style={{
                              background: 'transparent', border: 'none', color: 'var(--text-muted)',
                              fontSize: '0.68rem', cursor: 'pointer', padding: '1px 4px', fontWeight: 600
                            }}
                          >
                            All OFF
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
                      {/* Event Type Column */}
                      <td style={{ padding: '18px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '10px',
                            background: 'rgba(99, 102, 241, 0.12)', color: '#818cf8',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, marginTop: '2px'
                          }}>
                            <Sparkles size={16} />
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                                {type.name}
                              </span>
                              <span style={{
                                fontFamily: 'monospace', fontSize: '0.68rem',
                                color: 'var(--text-muted)', background: 'var(--bg-tertiary)',
                                padding: '1px 6px', borderRadius: '4px'
                              }}>
                                {type.code}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.45 }}>
                              {getEventDescription(type.code)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Channels Toggle Columns */}
                      {channels.map(chan => {
                        const key = `${type.id}_${chan.id}`;
                        const isEnabled = Boolean(matrixState[key]);

                        return (
                          <td key={chan.id} style={{ padding: '18px 20px', textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                              {/* Custom Styled Switch Toggle */}
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
                                  onChange={() => handleToggle(type.id, chan.id)}
                                  style={{ opacity: 0, width: 0, height: 0 }}
                                />
                                <span style={{
                                  position: 'absolute',
                                  inset: 0,
                                  backgroundColor: isEnabled ? (chan.code === 'EMAIL' ? '#10b981' : '#6366f1') : 'rgba(148, 163, 184, 0.25)',
                                  borderRadius: '34px',
                                  transition: 'all 0.3s ease',
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
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                                  }} />
                                </span>
                              </label>

                              <span style={{
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                color: isEnabled ? (chan.code === 'EMAIL' ? '#10b981' : '#818cf8') : 'var(--text-muted)'
                              }}>
                                {isEnabled ? 'Subscribed' : 'Muted'}
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

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
