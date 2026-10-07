import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../../../i18n';
import {
  User,
  Bell,
  Lock,
  Shield,
  Check,
  AlertCircle,
  Save,
  KeyRound,
  Laptop,
  Smartphone,
  Mail,
  Volume2,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Camera,
  Upload
} from 'lucide-react';
import { useAuth } from '../../authentication/contexts/AuthContext';
import authApi from '../../authentication/api/authApi';
import { validatePasswordComplexity } from '../../authentication/utils/passwordValidation';
import ConfirmDialogModal from '../../../components/common/ConfirmDialogModal';
import AlertDialogModal from '../../../components/common/AlertDialogModal';

export default function ProfileManagementPage() {
  const { t } = useTranslation();
  const { user, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const avatarInputRef = useRef(null);

  // Glass Dialog Modals State
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'error' });

  const showAlert = (title, message, type = 'error') => {
    setAlertConfig({ isOpen: true, title, message, type });
  };

  // Avatar state
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || user?.AvatarUrl || null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Personal Info Form State
  const [formData, setFormData] = useState({
    firstName: user?.firstName || user?.FirstName || '',
    lastName: user?.lastName || user?.LastName || '',
    email: user?.email || user?.Email || '',
    phoneNumber: user?.phoneNumber || user?.PhoneNumber || '',
    mobileNumber: user?.mobileNumber || user?.MobileNumber || '',
    jobTitle: user?.jobTitle || user?.JobTitle || '',
    preferredLanguage: user?.preferredLanguage || user?.PreferredLanguage || 'en'
  });

  // Sync state if user context updates
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || user.FirstName || '',
        lastName: user.lastName || user.LastName || '',
        email: user.email || user.Email || '',
        phoneNumber: user.phoneNumber || user.PhoneNumber || '',
        mobileNumber: user.mobileNumber || user.MobileNumber || '',
        jobTitle: user.jobTitle || user.JobTitle || '',
        preferredLanguage: user.preferredLanguage || user.PreferredLanguage || 'en'
      });
      setAvatarPreview(user.avatarUrl || user.AvatarUrl || null);
    }
  }, [user]);

  // Handle avatar file selection & upload as base64 data URI
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size (max 2MB)
    if (!file.type.startsWith('image/')) {
      showAlert('Invalid Format', 'Please select a valid image file (JPEG, PNG, GIF, or WebP).', 'warning');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showAlert('File Too Large', 'Profile image must be under 2 MB.', 'warning');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      // Convert to base64 data URI for storage
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const dataUri = ev.target.result;
        setAvatarPreview(dataUri);

        // Save to backend profile
        try {
          await authApi.updateProfile({ avatarUrl: dataUri });
          if (refreshProfile) await refreshProfile();
        } catch (err) {
          console.warn('Avatar save failed:', err.message);
        }
        setIsUploadingAvatar(false);
      };
      reader.onerror = () => {
        showAlert('Upload Failed', 'Failed to read image file.', 'error');
        setIsUploadingAvatar(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      showAlert('Processing Error', 'Failed to process avatar image.', 'error');
      setIsUploadingAvatar(false);
    }
  };

  // Notification Preferences State (Interactive Toggles)
  const [notifPrefs, setNotifPrefs] = useState({
    emailTicketUpdates: true,
    emailSlaWarnings: true,
    emailWeeklyDigest: false,
    emailMaintenance: true,
    smsCriticalSla: true,
    smsDispatchAlerts: false,
    inAppSoundAlerts: true,
    inAppPopups: true,
    inAppSystemAnnouncements: true
  });

  // Password Change State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordValidation, setPasswordValidation] = useState(null);
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Profile Save State
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });

  // Notification Save State
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [notifMsg, setNotifMsg] = useState({ type: '', text: '' });

  // Active Sessions State
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Load user sessions when security tab is opened
  useEffect(() => {
    if (activeTab === 'security') {
      loadSessions();
    }
  }, [activeTab]);

  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await authApi.getSessions();
      if (res.data?.status === 'success') {
        setSessions(res.data.data || []);
      }
    } catch (err) {
      console.warn('Could not load active sessions:', err.message);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    setConfirmConfig({
      isOpen: true,
      title: t('identity.revokeSessionTitle'),
      message: t('identity.revokeSessionConfirm'),
      confirmText: t('identity.revokeSessionBtn'),
      type: 'warning',
      onConfirm: async () => {
        try {
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          await authApi.revokeSession(sessionId);
          setSessions(prev => prev.filter(s => s.UserSessionID !== sessionId));
        } catch (err) {
          showAlert(t('identity.revokeSessionFailed'), t('identity.revokeSessionFailedMsg'), 'error');
        }
      }
    });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileMsg({ type: '', text: '' });

    try {
      await authApi.updateProfile(formData);
      if (refreshProfile) await refreshProfile();
      setProfileMsg({ type: 'success', text: t('profile.personalSaved') });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.response?.data?.message || err.message || 'Failed to update profile' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleNotifToggle = (key) => {
    setNotifPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleNotifSubmit = async (e) => {
    e.preventDefault();
    setIsSavingPrefs(true);
    setNotifMsg({ type: '', text: '' });

    try {
      await authApi.updateNotificationPreferences(notifPrefs);
      setNotifMsg({ type: 'success', text: t('profile.prefsSaved') });
    } catch (err) {
      setNotifMsg({ type: 'error', text: err.response?.data?.message || err.message || 'Failed to save preferences' });
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const handleNewPasswordChange = (val) => {
    setPasswordForm(prev => ({ ...prev, newPassword: val }));
    if (val) {
      setPasswordValidation(validatePasswordComplexity(val));
    } else {
      setPasswordValidation(null);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMsg({ type: '', text: '' });

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMsg({ type: 'error', text: t('profile.passwordMatchError') });
      return;
    }

    if (passwordValidation && !passwordValidation.isValid) {
      setPasswordMsg({ type: 'error', text: t('profile.passwordComplexityError') });
      return;
    }

    setIsChangingPassword(true);
    try {
      await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordValidation(null);
      setPasswordMsg({ type: 'success', text: t('profile.passwordChangedSuccess') });
    } catch (err) {
      setPasswordMsg({ type: 'error', text: err.response?.data?.message || err.message || 'Failed to change password' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const userInitials = `${formData.firstName.charAt(0) || 'U'}${formData.lastName.charAt(0) || ''}`.toUpperCase();

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div style={{
        background: 'var(--accent-gradient)',
        borderRadius: 'var(--border-radius-lg)',
        padding: '32px',
        marginBottom: '28px',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* Clickable Avatar with Upload Overlay */}
          <div
            onClick={() => avatarInputRef.current?.click()}
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              position: 'relative',
              cursor: 'pointer',
              overflow: 'hidden',
              border: '3px solid rgba(255, 255, 255, 0.5)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
              flexShrink: 0
            }}
            title={t('profile.photoClickChange')}
          >
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Profile"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{
                width: '100%',
                height: '100%',
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.8rem',
                fontWeight: 800,
                letterSpacing: '1px',
                color: '#ffffff'
              }}>
                {userInitials}
              </div>
            )}
            {/* Camera overlay on hover */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isUploadingAvatar ? 1 : 0,
              transition: 'opacity 0.25s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
            onMouseLeave={(e) => { if (!isUploadingAvatar) e.currentTarget.style.opacity = '0'; }}
            >
              {isUploadingAvatar ? (
                <RefreshCw size={22} color="#ffffff" style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Camera size={22} color="#ffffff" />
              )}
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
            />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>
              {formData.firstName || 'User'} {formData.lastName || 'Profile'}
            </h1>
            <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
              {formData.jobTitle || user?.userTypeCode || 'Employee'} • {formData.email}
            </p>
          </div>
        </div>

        <div style={{
          background: 'rgba(0, 0, 0, 0.2)',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '0.8rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backdropFilter: 'blur(5px)'
        }}>
          <Shield size={14} color="#10b981" />
          <span>{t('profile.roleScope')} {user?.userTypeCode || 'STAFF'}</span>
        </div>
      </div>

      {/* Profile Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '1px solid var(--glass-border)',
        marginBottom: '28px',
        overflowX: 'auto',
        paddingBottom: '4px'
      }}>
        {[
          { id: 'personal', label: t('profile.personalDetailsTab'), icon: User },
          { id: 'notifications', label: t('profile.notifSettingsTab'), icon: Bell },
          { id: 'security', label: t('profile.securityPasswordTab'), icon: Lock }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 20px',
                borderRadius: '10px 10px 0 0',
                background: isActive ? 'var(--bg-secondary)' : 'transparent',
                border: 'none',
                borderBottom: isActive ? '3px solid var(--accent-primary)' : '3px solid transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <Icon size={16} color={isActive ? 'var(--accent-primary)' : 'currentColor'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Personal Details */}
      {activeTab === 'personal' && (
        <form onSubmit={handleProfileSubmit} style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--border-radius-md)',
          padding: '32px',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '20px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <User size={20} color="var(--accent-primary)" />
            <span>{t('profile.managePersonal')}</span>
          </h2>

          {profileMsg.text && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '20px',
              background: profileMsg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: profileMsg.type === 'success' ? '#10b981' : '#ef4444',
              border: `1px solid ${profileMsg.type === 'success' ? '#10b981' : '#ef4444'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '0.88rem'
            }}>
              {profileMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{profileMsg.text}</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>{t('profile.firstName')}</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--border-radius-sm)',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>{t('profile.lastName')}</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--border-radius-sm)',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>{t('profile.workEmail')}</label>
              <input
                type="email"
                value={formData.email}
                disabled
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--border-radius-sm)',
                  background: 'rgba(0, 0, 0, 0.2)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-muted)',
                  fontSize: '0.9rem',
                  cursor: 'not-allowed'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>{t('profile.jobTitle')}</label>
              <input
                type="text"
                value={formData.jobTitle}
                onChange={e => setFormData({ ...formData, jobTitle: e.target.value })}
                placeholder={t('profile.jobTitlePlaceholder')}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--border-radius-sm)',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>{t('profile.officePhone')}</label>
              <input
                type="text"
                value={formData.phoneNumber}
                onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="+251 ..."
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--border-radius-sm)',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>{t('profile.mobilePhone')}</label>
              <input
                type="text"
                value={formData.mobileNumber}
                onChange={e => setFormData({ ...formData, mobileNumber: e.target.value })}
                placeholder="+251 9..."
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--border-radius-sm)',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={isSavingProfile}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                borderRadius: 'var(--border-radius-sm)',
                background: 'var(--accent-gradient)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                cursor: isSavingProfile ? 'not-allowed' : 'pointer',
                boxShadow: 'var(--glow-accent)',
                opacity: isSavingProfile ? 0.7 : 1
              }}
            >
              <Save size={16} />
              <span>{isSavingProfile ? t('profile.savingProfile') : t('profile.saveProfile')}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: Notification Settings & Interactive Toggles */}
      {activeTab === 'notifications' && (
        <form onSubmit={handleNotifSubmit} style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--border-radius-md)',
          padding: '32px',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '8px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bell size={20} color="var(--accent-primary)" />
            <span>{t('profile.notifChannelsTitle')}</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '24px' }}>
            {t('profile.notifChannelsDesc')}
          </p>

          {notifMsg.text && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '20px',
              background: notifMsg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: notifMsg.type === 'success' ? '#10b981' : '#ef4444',
              border: `1px solid ${notifMsg.type === 'success' ? '#10b981' : '#ef4444'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '0.88rem'
            }}>
              {notifMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{notifMsg.text}</span>
            </div>
          )}

          {/* Email Notifications Section */}
          <div style={{ marginBottom: '28px' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mail size={16} color="var(--accent-secondary)" />
              <span>{t('profile.emailNotifs')}</span>
            </h3>

            <div style={{ display: 'grid', gap: '12px' }}>
              {[
                { key: 'emailTicketUpdates', label: t('profile.emailTicketUpdates'), desc: t('profile.emailTicketUpdatesDesc') },
                { key: 'emailSlaWarnings', label: t('profile.emailSlaWarnings'), desc: t('profile.emailSlaWarningsDesc') },
                { key: 'emailWeeklyDigest', label: t('profile.emailWeeklyDigest'), desc: t('profile.emailWeeklyDigestDesc') },
                { key: 'emailMaintenance', label: t('profile.emailMaintenance'), desc: t('profile.emailMaintenanceDesc') }
              ].map(item => (
                <div key={item.key} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  background: 'var(--bg-tertiary)',
                  borderRadius: '10px',
                  border: '1px solid var(--glass-border)'
                }}>
                  <div>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.88rem' }}>{item.label}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '2px' }}>{item.desc}</div>
                  </div>
                  {/* Interactive Toggle Switch */}
                  <div
                    onClick={() => handleNotifToggle(item.key)}
                    style={{
                      width: '46px',
                      height: '24px',
                      borderRadius: '12px',
                      background: notifPrefs[item.key] ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.1)',
                      padding: '2px',
                      cursor: 'pointer',
                      transition: 'background 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      display: 'flex',
                      alignItems: 'center',
                      boxShadow: notifPrefs[item.key] ? 'var(--glow-accent)' : 'none'
                    }}
                  >
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      transform: notifPrefs[item.key] ? 'translateX(22px)' : 'translateX(0)',
                      transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SMS Notifications Section */}
          <div style={{ marginBottom: '28px' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Smartphone size={16} color="#10b981" />
              <span>{t('profile.smsNotifs')}</span>
            </h3>

            <div style={{ display: 'grid', gap: '12px' }}>
              {[
                { key: 'smsCriticalSla', label: t('profile.smsCriticalSla'), desc: t('profile.smsCriticalSlaDesc') },
                { key: 'smsDispatchAlerts', label: t('profile.smsDispatchAlerts'), desc: t('profile.smsDispatchAlertsDesc') }
              ].map(item => (
                <div key={item.key} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  background: 'var(--bg-tertiary)',
                  borderRadius: '10px',
                  border: '1px solid var(--glass-border)'
                }}>
                  <div>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.88rem' }}>{item.label}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '2px' }}>{item.desc}</div>
                  </div>
                  <div
                    onClick={() => handleNotifToggle(item.key)}
                    style={{
                      width: '46px',
                      height: '24px',
                      borderRadius: '12px',
                      background: notifPrefs[item.key] ? '#10b981' : 'rgba(255, 255, 255, 0.1)',
                      padding: '2px',
                      cursor: 'pointer',
                      transition: 'background 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      transform: notifPrefs[item.key] ? 'translateX(22px)' : 'translateX(0)',
                      transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* In-App Desktop Alerts Section */}
          <div style={{ marginBottom: '28px' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Volume2 size={16} color="#f59e0b" />
              <span>{t('profile.soundAlerts')}</span>
            </h3>

            <div style={{ display: 'grid', gap: '12px' }}>
              {[
                { key: 'inAppSoundAlerts', label: t('profile.soundOnNew'), desc: t('profile.soundOnNewDesc') },
                { key: 'inAppPopups', label: t('profile.toastBanners'), desc: t('profile.toastBannersDesc') }
              ].map(item => (
                <div key={item.key} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  background: 'var(--bg-tertiary)',
                  borderRadius: '10px',
                  border: '1px solid var(--glass-border)'
                }}>
                  <div>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.88rem' }}>{item.label}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '2px' }}>{item.desc}</div>
                  </div>
                  <div
                    onClick={() => handleNotifToggle(item.key)}
                    style={{
                      width: '46px',
                      height: '24px',
                      borderRadius: '12px',
                      background: notifPrefs[item.key] ? '#f59e0b' : 'rgba(255, 255, 255, 0.1)',
                      padding: '2px',
                      cursor: 'pointer',
                      transition: 'background 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      transform: notifPrefs[item.key] ? 'translateX(22px)' : 'translateX(0)',
                      transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={isSavingPrefs}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                borderRadius: 'var(--border-radius-sm)',
                background: 'var(--accent-gradient)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                cursor: isSavingPrefs ? 'not-allowed' : 'pointer',
                boxShadow: 'var(--glow-accent)',
                opacity: isSavingPrefs ? 0.7 : 1
              }}
            >
              <Save size={16} />
              <span>{isSavingPrefs ? t('profile.savingPrefs') : t('profile.savePrefs')}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: Security & Credentials */}
      {activeTab === 'security' && (
        <div style={{ display: 'grid', gap: '28px' }}>
          {/* Password Change Form */}
          <form onSubmit={handlePasswordSubmit} style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--border-radius-md)',
            padding: '32px',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '8px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <KeyRound size={20} color="var(--accent-primary)" />
              <span>{t('profile.changePasswordTitle')}</span>
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '24px' }}>
              {t('profile.changePasswordDesc')}
            </p>

            {passwordMsg.text && (
              <div style={{
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '20px',
                background: passwordMsg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: passwordMsg.type === 'success' ? '#10b981' : '#ef4444',
                border: `1px solid ${passwordMsg.type === 'success' ? '#10b981' : '#ef4444'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '0.88rem'
              }}>
                {passwordMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{passwordMsg.text}</span>
              </div>
            )}

            <div style={{ display: 'grid', gap: '18px', maxWidth: '500px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>{t('profile.currentPassword')}</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--border-radius-sm)',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>{t('profile.newPassword')}</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={e => handleNewPasswordChange(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--border-radius-sm)',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Password Strength Meter */}
              {passwordValidation && (
                <div style={{ padding: '12px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{t('profile.passwordStrength')}</span>
                    <span style={{ fontWeight: 700, color: passwordValidation.score > 70 ? '#10b981' : passwordValidation.score > 40 ? '#f59e0b' : '#ef4444' }}>
                      {passwordValidation.strengthLabel}
                    </span>
                  </div>
                  <div style={{ height: '6px', width: '100%', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${passwordValidation.score}%`,
                      background: passwordValidation.score > 70 ? '#10b981' : passwordValidation.score > 40 ? '#f59e0b' : '#ef4444',
                      transition: 'width 0.3s'
                    }} />
                  </div>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>{t('profile.confirmNewPassword')}</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--border-radius-sm)',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isChangingPassword}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                borderRadius: 'var(--border-radius-sm)',
                background: 'var(--accent-gradient)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                cursor: isChangingPassword ? 'not-allowed' : 'pointer',
                boxShadow: 'var(--glow-accent)'
              }}
            >
              <KeyRound size={16} />
              <span>{isChangingPassword ? t('profile.updatingPasswordBtn') : t('profile.updatePasswordBtn')}</span>
            </button>
          </form>

          {/* Active Sessions Management */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--border-radius-md)',
            padding: '32px',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Laptop size={20} color="var(--accent-secondary)" />
                  <span>{t('profile.activeSessionsTitle')}</span>
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '4px 0 0' }}>
                  {t('profile.activeSessionsDesc')}
                </p>
              </div>
              <button
                onClick={loadSessions}
                disabled={loadingSessions}
                style={{
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-primary)',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <RefreshCw size={14} className={loadingSessions ? 'spin' : ''} />
                <span>{t('identity.refreshSessions')}</span>
              </button>
            </div>

            {sessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                {t('profile.noOtherSessions')}
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {sessions.map(s => (
                  <div key={s.UserSessionID} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    background: 'var(--bg-tertiary)',
                    borderRadius: '10px',
                    border: '1px solid var(--glass-border)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <Laptop size={20} color="var(--accent-primary)" />
                      <div>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.88rem' }}>
                          {s.UserAgent || 'Web Browser Session'}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                          {t('identity.thIpAddress')}: {s.IpAddress || 'Current Client'} • {t('identity.thLoginTimestamp')}: {s.LastSeenDateTime ? new Date(s.LastSeenDateTime).toLocaleString() : t('common.active')}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRevokeSession(s.UserSessionID)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Trash2 size={13} />
                      <span>{t('profile.revokeSessionBtn')}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}


      {/* Shared Glass Modals */}
      <ConfirmDialogModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        confirmText={confirmConfig.confirmText}
        onConfirm={confirmConfig.onConfirm}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />

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
