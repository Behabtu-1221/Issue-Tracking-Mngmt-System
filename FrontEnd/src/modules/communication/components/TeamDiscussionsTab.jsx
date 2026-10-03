import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Users, Plus, X, Send, Hash, MessageCircle, Clock, User,
  RefreshCw, Search, Shield, Sparkles, Check, CheckCheck,
  Loader2, AlertCircle, Info, Layers
} from 'lucide-react';
import communicationApi from '../api/communicationApi';
import { usePermissionContext } from '../../role-permission-management/contexts/PermissionContext';
import { useAuth } from '../../authentication/contexts/AuthContext';
import { FormField } from '../../../components/common/FormField';
import AlertDialogModal from '../../../components/common/AlertDialogModal';

export default function TeamDiscussionsTab() {
  const { isParkAdmin, isCompanyAdmin, hasPermission } = usePermissionContext();
  const { user } = useAuth();
  const currentUserId = user?.id || user?.userId || user?.UserID || 1;
  const canCreateChannel = isParkAdmin || isCompanyAdmin || hasPermission('Communication.Manage') || hasPermission('Building.Read');

  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgText, setMsgText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchChannel, setSearchChannel] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({ Title: '', Topic: '', Category: 'OPERATIONS' });
  const [formErrors, setFormErrors] = useState({});

  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'error' });
  const showAlert = (title, message, type = 'error') => {
    setAlertConfig({ isOpen: true, title, message, type });
  };

  const msgScrollRef = useRef(null);
  const pollRef = useRef(null);

  const loadChannels = async (autoSelectId = null, isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await communicationApi.getTeamDiscussions();
      const raw = res.data?.data;
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.channels)
          ? raw.channels
          : [];
      setChannels(list);

      if (autoSelectId) {
        const found = list.find(c => (c.TeamDiscussionID || c.DiscussionGroupID) === autoSelectId);
        if (found) selectChannel(found);
      } else if (list.length > 0 && !selectedChannel) {
        selectChannel(list[0]);
      }
    } catch (e) {
      console.error('Failed to load team channels:', e);
      setChannels([]);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    loadChannels();
  }, []);

  const selectChannel = async (ch, isSilent = false) => {
    setSelectedChannel(ch);
    const channelId = ch.TeamDiscussionID || ch.DiscussionGroupID;
    if (!channelId) return;
    try {
      const res = await communicationApi.getTeamMessages(channelId);
      const raw = res.data?.data;
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.messages)
          ? raw.messages
          : [];
      setMessages(list);
    } catch (e) {
      console.error('Failed to load channel messages:', e);
      if (!isSilent) setMessages([]);
    }
  };

  // Poll active channel for live chat messages
  useEffect(() => {
    if (!selectedChannel) return;
    const channelId = selectedChannel.TeamDiscussionID || selectedChannel.DiscussionGroupID;
    if (!channelId) return;

    pollRef.current = setInterval(() => {
      communicationApi.getTeamMessages(channelId)
        .then(res => {
          const raw = res.data?.data;
          const list = Array.isArray(raw) ? raw : (raw?.messages || []);
          if (list.length !== messages.length) {
            setMessages(list);
          }
        })
        .catch(() => {});
    }, 10000);

    return () => clearInterval(pollRef.current);
  }, [selectedChannel, messages.length]);

  useEffect(() => {
    if (msgScrollRef.current) {
      msgScrollRef.current.scrollTop = msgScrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!msgText.trim() || !selectedChannel || sending) return;

    const channelId = selectedChannel.TeamDiscussionID || selectedChannel.DiscussionGroupID;
    setSending(true);
    try {
      await communicationApi.addTeamMessage(channelId, { MessageText: msgText.trim() });
      setMsgText('');
      const res = await communicationApi.getTeamMessages(channelId);
      const raw = res.data?.data;
      const list = Array.isArray(raw) ? raw : (raw?.messages || []);
      setMessages(list);
      loadChannels(channelId, true);
    } catch (e) {
      console.error('Failed to send team message:', e);
      showAlert('Message Delivery Failed', 'Could not broadcast message to team channel.', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleCreateChannel = async (e) => {
    e?.preventDefault();
    const errors = {};
    if (!form.Title.trim()) errors.Title = 'Channel identifier / name is required';
    if (!form.Topic.trim()) errors.Topic = 'Channel topic or purpose is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const res = await communicationApi.createTeamDiscussion(form);
      const newId = res.data?.data?.TeamDiscussionID || res.data?.data?.DiscussionGroupID;
      setForm({ Title: '', Topic: '', Category: 'OPERATIONS' });
      setFormErrors({});
      setShowCreateModal(false);
      await loadChannels(newId);
    } catch (e) {
      const msg = e.response?.data?.message || 'Failed to create team channel';
      showAlert('Channel Creation Failed', msg, 'error');
    }
  };

  const filteredChannels = useMemo(() => {
    if (!searchChannel.trim()) return channels;
    const q = searchChannel.toLowerCase();
    return channels.filter(c =>
      (c.Title || c.GroupName || '').toLowerCase().includes(q) ||
      (c.Topic || c.Description || '').toLowerCase().includes(q)
    );
  }, [channels, searchChannel]);

  const formatTime = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateHeader = (d) => {
    if (!d) return '';
    const date = new Date(d);
    const now = new Date();
    const diff = Math.round((new Date(now.getFullYear(), now.getMonth(), now.getDate()) - new Date(date.getFullYear(), date.getMonth(), date.getDate())) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleBadge = (roleCode) => {
    const code = (roleCode || '').toUpperCase();
    if (code.includes('ADMIN')) return { label: 'Admin', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' };
    if (code.includes('TECH')) return { label: 'Technician', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)' };
    if (code.includes('MANAGER')) return { label: 'Manager', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' };
    return { label: 'Staff', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' };
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '320px 1fr',
      height: '660px',
      background: 'var(--bg-secondary)',
      border: '1px solid var(--glass-border-accent)',
      borderRadius: '20px',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-lg)'
    }}>
      {/* ── Left Sidebar: Channels List ── */}
      <div style={{
        borderRight: '1px solid var(--glass-border)',
        display: 'flex', flexDirection: 'column',
        background: 'var(--bg-tertiary)'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 18px', borderBottom: '1px solid var(--glass-border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              padding: '8px', borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(14, 165, 233, 0.15) 100%)',
              color: '#38bdf8'
            }}>
              <Users size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.96rem', color: 'var(--text-primary)' }}>
                Team Channels
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                {channels.length} collaboration space{channels.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {canCreateChannel && (
            <button
              onClick={() => setShowCreateModal(true)}
              title="Create New Team Channel"
              style={{
                padding: '6px', borderRadius: '8px',
                background: 'var(--accent-gradient)', color: '#ffffff',
                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center'
              }}
            >
              <Plus size={16} />
            </button>
          )}
        </div>

        {/* Search */}
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--glass-border)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '7px 12px', borderRadius: '8px',
            background: 'var(--bg-primary)', border: '1px solid var(--glass-border)'
          }}>
            <Search size={14} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Filter channels..."
              value={searchChannel}
              onChange={(e) => setSearchChannel(e.target.value)}
              style={{
                flex: 1, border: 'none', background: 'transparent',
                color: 'var(--text-primary)', fontSize: '0.82rem', outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Channels List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {loading && channels.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <Loader2 size={24} className="spin" color="var(--accent-primary)" />
            </div>
          ) : filteredChannels.length === 0 ? (
            <div style={{ padding: '30px 14px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              No channels found.
            </div>
          ) : (
            filteredChannels.map(ch => {
              const isSelected = selectedChannel && (
                (selectedChannel.TeamDiscussionID && selectedChannel.TeamDiscussionID === ch.TeamDiscussionID) ||
                (selectedChannel.DiscussionGroupID && selectedChannel.DiscussionGroupID === ch.DiscussionGroupID)
              );

              return (
                <div
                  key={ch.TeamDiscussionID || ch.DiscussionGroupID}
                  onClick={() => selectChannel(ch)}
                  style={{
                    padding: '10px 12px', borderRadius: '10px',
                    background: isSelected ? 'var(--accent-gradient)' : 'transparent',
                    color: isSelected ? '#ffffff' : 'var(--text-primary)',
                    cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '8px',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <Hash size={16} style={{ marginTop: '2px', opacity: isSelected ? 1 : 0.6 }} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: isSelected ? 800 : 600, fontSize: '0.86rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ch.Title || ch.GroupName || 'channel'}
                    </div>
                    {ch.Topic && (
                      <div style={{
                        fontSize: '0.72rem', color: isSelected ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                      }}>
                        {ch.Topic}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right: Channel Chat Thread ── */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
        {selectedChannel ? (
          <>
            {/* Channel Header */}
            <div style={{
              padding: '14px 22px', borderBottom: '1px solid var(--glass-border)',
              background: 'var(--bg-tertiary)', display: 'flex',
              justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Hash size={18} color="var(--accent-primary)" />
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {selectedChannel.Title || selectedChannel.GroupName}
                  </h3>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {selectedChannel.Topic || selectedChannel.Description || 'Active team collaboration channel'}
                </div>
              </div>

              {/* Live sync pill */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                fontSize: '0.72rem', fontWeight: 700, color: '#4ade80',
                background: 'rgba(74, 222, 128, 0.1)', border: '1px solid rgba(74, 222, 128, 0.25)',
                padding: '4px 10px', borderRadius: '20px'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
                Channel Live
              </div>
            </div>

            {/* Messages Feed */}
            <div
              ref={msgScrollRef}
              style={{
                flex: 1, overflowY: 'auto', padding: '20px 24px',
                display: 'flex', flexDirection: 'column', gap: '14px'
              }}
            >
              {messages.length === 0 ? (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', flex: 1, padding: '40px', textAlign: 'center'
                }}>
                  <div style={{ padding: '16px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', marginBottom: '12px' }}>
                    <Hash size={32} />
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                    Welcome to #{selectedChannel.Title || selectedChannel.GroupName}!
                  </div>
                  <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '340px' }}>
                    This is the start of the #{selectedChannel.Title || selectedChannel.GroupName} channel. Send a message to start communicating.
                  </div>
                </div>
              ) : (
                messages.map((m, idx) => {
                  const isOwn = Number(m.SenderUserID) === Number(currentUserId);
                  const roleBadge = getRoleBadge(m.SenderRoleCode);
                  const prevM = idx > 0 ? messages[idx - 1] : null;
                  const dateDivider = !prevM || formatDateHeader(prevM.SentDateTime) !== formatDateHeader(m.SentDateTime)
                    ? formatDateHeader(m.SentDateTime)
                    : null;

                  return (
                    <React.Fragment key={m.MessageID || idx}>
                      {dateDivider && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '14px 0 6px' }}>
                          <span style={{
                            fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)',
                            padding: '3px 12px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)',
                            border: '1px solid var(--glass-border)'
                          }}>
                            {dateDivider}
                          </span>
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%',
                          background: roleBadge.bg, border: `1.5px solid ${roleBadge.color}`,
                          color: roleBadge.color, display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontWeight: 800, fontSize: '0.78rem',
                          flexShrink: 0
                        }}>
                          {getInitials(m.SenderName || m.AuthorName)}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                            <span style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                              {m.SenderName || m.AuthorName || 'Team Member'}
                            </span>
                            <span style={{
                              fontSize: '0.66rem', fontWeight: 800, padding: '1px 6px',
                              borderRadius: '6px', background: roleBadge.bg, color: roleBadge.color
                            }}>
                              {roleBadge.label}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              {formatTime(m.SentDateTime || m.CreatedDate)}
                            </span>
                          </div>

                          <div style={{
                            fontSize: '0.9rem', color: 'var(--text-secondary)',
                            lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word'
                          }}>
                            {m.MessageText}
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })
              )}
            </div>

            {/* Input Composer */}
            <form onSubmit={handleSendMessage} style={{
              padding: '14px 20px', borderTop: '1px solid var(--glass-border)',
              background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', gap: '10px'
            }}>
              <input
                type="text"
                placeholder={`Message #${selectedChannel.Title || selectedChannel.GroupName}...`}
                value={msgText}
                onChange={(e) => setMsgText(e.target.value)}
                disabled={sending}
                style={{
                  flex: 1, padding: '12px 16px', borderRadius: '12px',
                  background: 'var(--bg-primary)', border: '1px solid var(--glass-border)',
                  color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none'
                }}
              />
              <button
                type="submit"
                disabled={!msgText.trim() || sending}
                style={{
                  height: '44px', padding: '0 18px', borderRadius: '12px',
                  border: 'none', background: msgText.trim() ? 'var(--accent-gradient)' : 'var(--bg-primary)',
                  color: msgText.trim() ? '#ffffff' : 'var(--text-muted)',
                  fontWeight: 700, fontSize: '0.88rem', cursor: msgText.trim() ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  boxShadow: msgText.trim() ? '0 4px 15px rgba(99, 102, 241, 0.35)' : 'none'
                }}
              >
                {sending ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
              </button>
            </form>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
            Select a channel from the left sidebar to view messages.
          </div>
        )}
      </div>

      {/* ── Modal: Create Channel (Staff/Admin) ── */}
      {showCreateModal && canCreateChannel && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            width: '100%', maxWidth: '480px', background: 'var(--bg-secondary)',
            borderRadius: '20px', border: '1px solid var(--glass-border-accent)',
            padding: '24px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Create Team Channel
              </h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateChannel} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <FormField
                label="Channel Name"
                id="Title"
                required
                icon={Hash}
                error={formErrors.Title}
                helpText="e.g. hvac-technicians or building-a-ops (spaces converted to dashes)"
              >
                <input
                  id="Title"
                  type="text"
                  placeholder="e.g. facilities-dispatch"
                  value={form.Title}
                  onChange={(e) => setForm({ ...form, Title: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  style={{
                    width: '100%', padding: '11px 14px', borderRadius: '10px',
                    background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                    color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none'
                  }}
                />
              </FormField>

              <FormField
                label="Topic / Purpose"
                id="Topic"
                required
                icon={Info}
                error={formErrors.Topic}
                helpText="Short summary of channel's purpose"
              >
                <input
                  id="Topic"
                  type="text"
                  placeholder="e.g. Real-time coordination for HVAC & electrical maintenance"
                  value={form.Topic}
                  onChange={(e) => setForm({ ...form, Topic: e.target.value })}
                  style={{
                    width: '100%', padding: '11px 14px', borderRadius: '10px',
                    background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                    color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none'
                  }}
                />
              </FormField>

              <FormField label="Category Focus" id="Category" icon={Layers}>
                <select
                  id="Category"
                  value={form.Category}
                  onChange={(e) => setForm({ ...form, Category: e.target.value })}
                  style={{
                    width: '100%', padding: '11px 14px', borderRadius: '10px',
                    background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                    color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none'
                  }}
                >
                  <option value="OPERATIONS">Operations & Facilities</option>
                  <option value="SECURITY">Safety & Security</option>
                  <option value="IT_SUPPORT">IT & Technical</option>
                  <option value="GENERAL">General Collaboration</option>
                </select>
              </FormField>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '9px 16px', borderRadius: '8px',
                    background: 'transparent', border: '1px solid var(--glass-border)',
                    color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '9px 20px', borderRadius: '8px',
                    background: 'var(--accent-gradient)', border: 'none',
                    color: '#ffffff', fontWeight: 700, cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(99, 102, 241, 0.35)'
                  }}
                >
                  Create Channel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AlertDialogModal
        isOpen={alertConfig.isOpen}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
