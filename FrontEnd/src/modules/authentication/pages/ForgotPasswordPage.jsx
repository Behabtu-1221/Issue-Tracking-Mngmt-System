import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, CheckCircle2, AlertCircle, User, ShieldCheck } from 'lucide-react';
import authApi from '../api/authApi';
import { useTranslation, LanguageSelector } from '../../../i18n';

export default function ForgotPasswordPage() {
  const { t, isRTL } = useTranslation();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isCardHovered, setIsCardHovered] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) { setError('Please enter your username or account email'); return; }
    setError('');
    setLoading(true);
    try {
      await authApi.forgotPassword(username.trim());
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

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

      {/* Subtle Brand Glow Orb */}
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
            {t('auth.forgotPasswordTitle', 'Account Security & Password Recovery')}
          </p>
        </div>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '10px 0', animation: 'fadeIn 0.4s ease' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(5, 150, 105, 0.12)',
              border: '1px solid rgba(5, 150, 105, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', color: '#059669', boxShadow: '0 8px 24px rgba(5, 150, 105, 0.2)'
            }}>
              <CheckCircle2 size={36} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px', fontFamily: "'Outfit', sans-serif" }}>
              {t('auth.tempCredentialsDispatched', 'Temporary Access Credentials Dispatched')}
            </h3>
            <p style={{ color: '#475569', fontSize: '0.86rem', lineHeight: '1.6', marginBottom: '18px' }}>
              {t('auth.tempCredentialsSentDesc', 'If an account exists for {username}, a secure temporary password and complete login instructions have been sent to the registered email address.', { username })}
            </p>

            {/* Instruction Checklist Box */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '16px',
              textAlign: isRTL ? 'right' : 'left',
              marginBottom: '22px',
              fontSize: '0.8rem',
              color: '#334155',
              lineHeight: 1.6
            }}>
              <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={16} color="#0284c7" /> {t('auth.whatToDoNext', 'What to do next:')}
              </div>
              <ul style={{ [isRTL ? 'paddingRight' : 'paddingLeft']: '18px', margin: 0 }}>
                <li>{t('auth.nextStepInbox', 'Check your inbox (and Spam/Junk folder) for the email.')}</li>
                <li>{t('auth.nextStepCopy', 'Copy the temporary password provided in the message.')}</li>
                <li>{t('auth.nextStepSignIn', 'Sign in using your username and temporary password.')}</li>
                <li>{t('auth.nextStepPrompt', 'You will be prompted to set your new permanent password.')}</li>
              </ul>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link
                to={`/?username=${encodeURIComponent(username.trim())}`}
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '13px 22px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0284c7 100%)', color: '#ffffff', fontWeight: 700,
                  fontSize: '0.9rem', textDecoration: 'none', boxShadow: '0 10px 25px rgba(2, 132, 199, 0.3)'
                }}
              >
                {t('auth.proceedToSignIn', 'Proceed to Sign In ➔')}
              </Link>
              <button
                type="button"
                onClick={() => { setSubmitted(false); setUsername(''); setError(''); }}
                style={{
                  background: 'transparent', border: 'none', color: '#64748b', fontSize: '0.82rem',
                  fontWeight: 600, cursor: 'pointer', padding: '6px', textDecoration: 'underline'
                }}
              >
                {t('auth.tryAgainWrongUser', 'Entered wrong username? Try again')}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b', fontFamily: "'Outfit', sans-serif" }}>
                {t('auth.forgotPasswordSubhead', 'Forgot Password Recovery')}
              </span>
              <span style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '3px', display: 'block', lineHeight: 1.5 }}>
                {t('auth.forgotPasswordInstructions', 'Enter your username or registered email address. We will reset your account with a secure temporary password and dispatch full instructions to your email.')}
              </span>
            </div>

            {error && (
              <div style={{ background: 'rgba(220, 38, 38, 0.08)', border: '1px solid rgba(220, 38, 38, 0.25)', borderRadius: '12px', padding: '12px 14px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.84rem', color: '#b91c1c', fontWeight: 600 }}>
                <AlertCircle size={17} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '22px' }}>
                <label htmlFor="forgot-username" style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '7px', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                  {t('auth.usernameOrRegisteredEmail', 'Username or Registered Email')}
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', [isRTL ? 'right' : 'left']: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input
                    id="forgot-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={t('auth.enterUsernameOrEmailPlaceholder', 'Enter your username or email (e.g. employee, user@company.com)')}
                    autoFocus
                    style={{ width: '100%', padding: isRTL ? '13px 44px 13px 14px' : '13px 14px 13px 44px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', color: '#0f172a', fontSize: '0.92rem', outline: 'none', transition: 'all 0.25s ease', boxSizing: 'border-box' }}
                    onFocus={(e) => { e.target.style.borderColor = '#0284c7'; e.target.style.boxShadow = '0 0 0 4px rgba(2, 132, 199, 0.18)'; e.target.style.background = '#ffffff'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; e.target.style.background = '#f8fafc'; }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '14px',
                  background: loading ? '#94a3b8' : 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0284c7 100%)',
                  border: 'none', borderRadius: '12px', color: '#ffffff', fontSize: '0.95rem', fontWeight: 800,
                  cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  boxShadow: '0 10px 28px rgba(2, 132, 199, 0.35)', marginBottom: '18px'
                }}
              >
                {loading ? (
                  <><Loader2 size={19} style={{ animation: 'spin 1s linear infinite' }} /> {t('auth.processingResetRequest', 'Processing Reset Request...')}</>
                ) : (
                  <><Mail size={18} /> {t('auth.resetAndSendBtn', 'Reset & Send Instructions')}</>
                )}
              </button>

              <div style={{ textAlign: 'center' }}>
                <Link to="/" style={{ color: '#0284c7', fontSize: '0.84rem', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <ArrowLeft size={15} style={{ transform: isRTL ? 'scaleX(-1)' : 'none' }} /> {t('auth.backToSignIn', 'Back to Sign In')}
                </Link>
              </div>
            </form>
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{ marginTop: '20px', textAlign: 'center', color: '#ffffff', fontSize: '0.8rem', fontWeight: '600', textShadow: '0 2px 6px rgba(0,0,0,0.6)', zIndex: 10 }}>
        {t('app.copyright', 'Enterprise Issue Tracking System • Copyright © {year} All Rights Reserved', { year: new Date().getFullYear() })}
      </div>

      <style>{`
        @keyframes slideUpCard { from { opacity: 0; transform: translateY(30px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
