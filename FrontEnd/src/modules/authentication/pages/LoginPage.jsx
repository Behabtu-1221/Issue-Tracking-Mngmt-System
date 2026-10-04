import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Eye, EyeOff, ShieldCheck, Loader2, AlertCircle, Lock, User,
  Sparkles, Check, ArrowRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import sessionManager from '../utils/sessionManager';
import { useTranslation, LanguageSelector } from '../../../i18n';

import { authSchemas } from '../../../validation';

const DEMO_ROLES = [
  { label: 'IT Park Admin', user: 'superadmin', pass: 'Password123!', icon: '🛡️', roleDesc: 'IT Park Administrator' },
  { label: 'Tenant Rep', user: 'tenantadmin', pass: 'Password123!', icon: '🏢', roleDesc: 'Tenant Representative' },
  { label: 'Manager', user: 'dispatcher', pass: 'Password123!', icon: '👔', roleDesc: 'Operations Manager' },
  { label: 'Technician', user: 'technician', pass: 'Password123!', icon: '🔧', roleDesc: 'Field Technician' },
  { label: 'Employee', user: 'employee', pass: 'Password123!', icon: '👤', roleDesc: 'Regular Employee' }
];

export default function LoginPage() {
  const { t, isRTL } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, mustChangePassword, getDefaultDashboard, loading: authLoading } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionExpired, setSessionExpired] = useState(false);
  const [isCardHovered, setIsCardHovered] = useState(false);
  const [activeRolePill, setActiveRolePill] = useState('');
  const usernameRef = useRef(null);

  useEffect(() => {
    const remembered = sessionManager.getRememberedUsername();
    if (remembered) {
      setUsername(remembered);
      setRememberMe(true);
    }
    const params = new URLSearchParams(location.search);
    if (params.get('session_expired') === 'true') {
      setSessionExpired(true);
    }
    const urlUser = params.get('username') || params.get('u');
    if (urlUser) {
      setUsername(urlUser.trim());
    }
  }, [location.search]);

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      if (mustChangePassword) {
        navigate('/first-login-password-change', { replace: true });
      } else {
        const dest = location.state?.from || `/${getDefaultDashboard()}`;
        navigate(dest, { replace: true });
      }
    }
  }, [isAuthenticated, authLoading, mustChangePassword, navigate, location.state, getDefaultDashboard]);

  const handleSelectDemoRole = (role) => {
    setActiveRolePill(role.label);
    setUsername(role.user);
    setPassword(role.pass);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setSessionExpired(false);

    const validation = authSchemas.login({ username, password, rememberMe });
    if (!validation.isValid) {
      const firstErr = Object.values(validation.errors)[0];
      setError(firstErr);
      return;
    }

    setLoading(true);
    try {
      const result = await login(validation.sanitized.username, validation.sanitized.password, validation.sanitized.rememberMe);
      if (result.mustChangePassword) {
        navigate('/first-login-password-change', { replace: true });
      } else {
        const dest = location.state?.from || `/${getDefaultDashboard()}`;
        navigate(dest, { replace: true });
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Authentication failed';
      if (msg.toLowerCase().includes('locked')) {
        setError(msg);
      } else if (msg.includes('suspended') || msg.includes('inactive')) {
        setError('Account suspended. Please contact your system administrator.');
      } else if (msg.includes('Invalid')) {
        setError('Invalid username or password credentials. Please verify and try again.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#0f172a' }}>
        <Loader2 size={42} style={{ animation: 'spin 1s linear infinite', color: '#0284c7' }} />
        <span style={{ marginTop: '16px', color: '#cbd5e1', fontSize: '0.9rem', fontWeight: 600 }}>Loading Security Shell...</span>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
      backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.55) 0%, rgba(30, 41, 59, 0.45) 50%, rgba(15, 23, 42, 0.6) 100%), url('/auth_background.jpg')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      fontFamily: "'Inter', 'Outfit', system-ui, sans-serif",
      padding: '24px 16px',
      boxSizing: 'border-box',
      overflowY: 'auto'
    }}>
      {/* Top Language Bar */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: isRTL ? 'auto' : '24px',
        left: isRTL ? '24px' : 'auto',
        zIndex: 50
      }}>
        <LanguageSelector variant="auth" />
      </div>

      {/* Subtle Brand Cyan Glow Orbs */}
      <div style={{
        position: 'absolute', top: '10%', left: '15%', width: '400px', height: '400px',
        background: 'radial-gradient(circle, rgba(2, 132, 199, 0.15) 0%, transparent 70%)',
        filter: 'blur(60px)', pointerEvents: 'none'
      }} />

      {/* Main Center Floating Card */}
      <div
        onMouseEnter={() => setIsCardHovered(true)}
        onMouseLeave={() => setIsCardHovered(false)}
        style={{
          width: '100%',
          maxWidth: '460px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRadius: '24px',
          boxShadow: isCardHovered
            ? '0 30px 70px rgba(15, 23, 42, 0.38), 0 0 35px rgba(2, 132, 199, 0.22)'
            : '0 20px 50px rgba(15, 23, 42, 0.3), 0 4px 16px rgba(0, 0, 0, 0.08)',
          transform: isCardHovered ? 'translateY(-4px)' : 'translateY(0)',
          transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          padding: 'clamp(28px, 4vw, 40px) clamp(20px, 4vw, 36px)',
          position: 'relative',
          overflow: 'hidden',
          border: isCardHovered ? '1px solid rgba(2, 132, 199, 0.45)' : '1px solid rgba(226, 232, 240, 0.9)',
          animation: 'slideUpCard 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
          zIndex: 10
        }}
      >
        {/* Top Multi-Tone Brand Line Accent */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
          background: 'linear-gradient(90deg, #1e3a8a 0%, #0284c7 40%, #059669 75%, #7c3aed 100%)'
        }} />

        {/* Brand Header Inside Card */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '24px', paddingTop: '4px' }}>
          <div style={{
            width: '68px', height: '68px', borderRadius: '20px',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0284c7 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '14px', boxShadow: '0 10px 25px rgba(2, 132, 199, 0.3)'
          }}>
            <img
              src="/logoitms.png"
              alt="ITMS Logo"
              style={{
                width: '44px', height: '44px', objectFit: 'contain',
                filter: 'brightness(0) invert(1)'
              }}
            />
          </div>

          <h1 style={{
            fontFamily: "'Outfit', sans-serif", fontWeight: '800', fontSize: '1.65rem',
            letterSpacing: '-0.02em', color: '#0f172a', margin: '0 0 4px'
          }}>
            ITMS
          </h1>
          <p style={{ margin: 0, color: '#475569', fontSize: '0.85rem', fontWeight: 500 }}>
            {t('app.subtitle', 'Issue Tracking & Facility Operations Platform')}
          </p>
        </div>

        {/* Card Subhead */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#1e293b', fontFamily: "'Outfit', sans-serif" }}>
            {t('auth.loginTitle', 'Account Authentication')}
          </span>
          <div style={{ padding: '4px 11px', borderRadius: '20px', background: 'rgba(2, 132, 199, 0.08)', border: '1px solid rgba(2, 132, 199, 0.25)', color: '#0284c7', fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
            <ShieldCheck size={13} color="#0284c7" /> SECURE GATEWAY
          </div>
        </div>

        {/* Session Expired Alert */}
        {sessionExpired && (
          <div style={{ background: 'rgba(217, 119, 6, 0.08)', border: '1px solid rgba(217, 119, 6, 0.25)', borderRadius: '12px', padding: '12px 14px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.84rem', color: '#b45309', fontWeight: 600 }}>
            <AlertCircle size={17} style={{ flexShrink: 0 }} /> Your session has expired. Please sign in again to continue.
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div style={{ background: 'rgba(220, 38, 38, 0.08)', border: '1px solid rgba(220, 38, 38, 0.25)', borderRadius: '12px', padding: '12px 14px', marginBottom: '18px', display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.84rem', color: '#b91c1c', fontWeight: 600 }}>
            <AlertCircle size={17} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} autoComplete="off">
          <div style={{ marginBottom: '18px' }}>
            <label htmlFor="login-username" style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '7px', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
              {t('auth.usernameOrEmail', 'Username or Account Email')}
            </label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', [isRTL ? 'right' : 'left']: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                ref={usernameRef}
                id="login-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t('auth.usernamePlaceholder', 'Enter your username')}
                autoComplete="username"
                autoFocus={!username}
                style={{ width: '100%', padding: isRTL ? '13px 44px 13px 14px' : '13px 14px 13px 44px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', color: '#0f172a', fontSize: '0.92rem', outline: 'none', transition: 'all 0.25s ease', boxSizing: 'border-box' }}
                onFocus={(e) => { e.target.style.borderColor = '#0284c7'; e.target.style.boxShadow = '0 0 0 4px rgba(2, 132, 199, 0.18)'; e.target.style.background = '#ffffff'; }}
                onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; e.target.style.background = '#f8fafc'; }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
              <label htmlFor="login-password" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                {t('auth.password', 'Password')}
              </label>
              <Link to="/forgot-password" style={{ color: '#0284c7', fontSize: '0.8rem', textDecoration: 'none', fontWeight: 600 }}>
                {t('auth.forgotPassword', 'Forgot password?')}
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', [isRTL ? 'right' : 'left']: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.passwordPlaceholder', 'Enter your password')}
                autoComplete="current-password"
                style={{ width: '100%', padding: isRTL ? '13px 44px 13px 48px' : '13px 48px 13px 44px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', color: '#0f172a', fontSize: '0.92rem', outline: 'none', transition: 'all 0.25s ease', boxSizing: 'border-box' }}
                onFocus={(e) => { e.target.style.borderColor = '#0284c7'; e.target.style.boxShadow = '0 0 0 4px rgba(2, 132, 199, 0.18)'; e.target.style.background = '#ffffff'; }}
                onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; e.target.style.background = '#f8fafc'; }}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', [isRTL ? 'left' : 'right']: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#475569', fontSize: '0.84rem', cursor: 'pointer', userSelect: 'none', fontWeight: '500' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: '#0284c7', width: '16px', height: '16px', cursor: 'pointer' }}
              />
              {t('auth.rememberMe', 'Remember login session on this browser')}
            </label>
          </div>

          <button
            id="login-submit"
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '14px',
              background: loading ? '#94a3b8' : 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0284c7 100%)',
              border: 'none', borderRadius: '12px', color: '#ffffff', fontSize: '0.96rem', fontWeight: '800', letterSpacing: '0.3px',
              cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              transition: 'all 0.25s ease', boxShadow: loading ? 'none' : '0 10px 28px rgba(2, 132, 199, 0.35)'
            }}
          >
            {loading ? (
              <><Loader2 size={19} style={{ animation: 'spin 1s linear infinite' }} /> {t('auth.loggingIn', 'Authenticating...')}</>
            ) : (
              <><ArrowRight size={18} style={{ transform: isRTL ? 'scaleX(-1)' : 'none' }} /> {t('auth.signIn', 'Sign In')}</>
            )}
          </button>
        </form>
      </div>

      {/* Footer */}
      <div style={{ marginTop: '20px', textAlign: 'center', color: '#ffffff', fontSize: '0.8rem', fontWeight: '600', textShadow: '0 2px 6px rgba(0,0,0,0.6)', zIndex: 10 }}>
        Enterprise Issue Tracking System • Copyright © {new Date().getFullYear()} All Rights Reserved
      </div>

      <style>{`
        @keyframes slideUpCard { from { opacity: 0; transform: translateY(30px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
