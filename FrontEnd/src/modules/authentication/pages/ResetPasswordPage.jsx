import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2, CheckCircle2, XCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import authApi from '../api/authApi';
import { validatePasswordComplexity } from '../utils/passwordValidation';
import { useTranslation, LanguageSelector } from '../../../i18n';
import NeuronLogo from '../../../components/common/NeuronLogo';

export default function ResetPasswordPage() {
  const { t, isRTL } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [invalidToken, setInvalidToken] = useState(false);
  const [isCardHovered, setIsCardHovered] = useState(false);

  const complexity = validatePasswordComplexity(newPassword);
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;
  const canSubmit = complexity.isValid && passwordsMatch;

  useEffect(() => {
    if (!token) setInvalidToken(true);
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError('');
    setLoading(true);
    try {
      await authApi.resetPassword(token, newPassword);
      setSuccess(true);
      setTimeout(() => navigate('/', { replace: true }), 3000);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Password reset failed';
      if (msg.includes('expired') || msg.includes('Invalid')) {
        setInvalidToken(true);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = (score) => {
    if (score >= 100) return '#059669';
    if (score >= 60) return '#d97706';
    return '#dc2626';
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
          maxWidth: '480px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRadius: 'var(--border-radius-lg, 18px)',
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
          <div style={{ marginBottom: '14px' }}>
            <NeuronLogo size={68} iconSize={44} showText={false} />
          </div>

          <h1 style={{
            fontFamily: "'Outfit', sans-serif", fontWeight: '800', fontSize: '1.65rem',
            letterSpacing: '-0.02em', color: '#0f172a', margin: '0 0 4px'
          }}>
            ITMS
          </h1>
          <p style={{ margin: 0, color: '#475569', fontSize: '0.85rem', fontWeight: 500 }}>
            {t('auth.resetAccountCredentials', 'Reset Account Credentials')}
          </p>
        </div>

        {invalidToken ? (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', color: '#dc2626' }}>
              <XCircle size={34} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px', fontFamily: "'Outfit', sans-serif" }}>
              {t('auth.invalidOrExpiredToken', 'Invalid or Expired Token')}
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '24px', lineHeight: '1.5' }}>
              {t('auth.invalidTokenDesc', 'The password reset token is invalid, used, or expired. Please request a new link.')}
            </p>
            <Link to="/forgot-password" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 22px', borderRadius: '12px', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0284c7 100%)', color: '#ffffff', fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none', boxShadow: '0 10px 25px rgba(2, 132, 199, 0.3)' }}>
              {t('auth.requestNewResetLink', 'Request New Password Reset Link')}
            </Link>
          </div>
        ) : success ? (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(5, 150, 105, 0.12)', border: '1px solid rgba(5, 150, 105, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', color: '#059669' }}>
              <CheckCircle2 size={34} />
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px', fontFamily: "'Outfit', sans-serif" }}>
              {t('auth.passwordUpdatedSuccess', 'Password Reset Successfully')}
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '24px' }}>
              {t('auth.passwordUpdatedSuccessDesc', 'Your security password has been updated. Redirecting to sign in page...')}
            </p>
            <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: '#0284c7' }} />
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#1e293b', fontFamily: "'Outfit', sans-serif" }}>
                {t('auth.setNewAccountPassword', 'Set New Account Password')}
              </span>
              <span style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px', display: 'block' }}>
                {t('auth.chooseComplexPassword', 'Choose a complex password complying with security rules')}
              </span>
            </div>

            {error && (
              <div style={{ background: 'rgba(220, 38, 38, 0.08)', border: '1px solid rgba(220, 38, 38, 0.25)', borderRadius: '12px', padding: '12px 14px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.84rem', color: '#b91c1c', fontWeight: 600 }}>
                <AlertCircle size={17} style={{ flexShrink: 0 }} /> <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  {t('auth.newPasswordLabel', 'New Password')}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t('auth.enterNewPassword', 'Enter new password')}
                    style={{ width: '100%', padding: isRTL ? '13px 44px 13px 14px' : '13px 14px 13px 44px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', color: '#0f172a', fontSize: '0.92rem', outline: 'none', transition: 'all 0.25s ease', boxSizing: 'border-box' }}
                    onFocus={(e) => { e.target.style.borderColor = '#0284c7'; e.target.style.boxShadow = '0 0 0 4px rgba(2, 132, 199, 0.18)'; e.target.style.background = '#ffffff'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; e.target.style.background = '#f8fafc'; }}
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)} style={{ position: 'absolute', [isRTL ? 'left' : 'right']: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer' }}>
                    {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {newPassword && (
                <div style={{ marginBottom: '16px', background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: '#64748b', fontWeight: 700, marginBottom: '6px' }}>
                    <span>{t('auth.passwordStrength', 'PASSWORD STRENGTH')}</span>
                    <span style={{ color: getStrengthColor(complexity.score) }}>
                      {complexity.score >= 100 ? t('auth.strengthStrong', 'STRONG') : complexity.score >= 60 ? t('auth.strengthMedium', 'MEDIUM') : t('auth.strengthWeak', 'WEAK')}
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${complexity.score}%`, height: '100%', background: getStrengthColor(complexity.score), transition: 'all 0.3s ease' }} />
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  {t('auth.confirmNewPasswordLabel', 'Confirm New Password')}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('auth.confirmNewPasswordPlaceholder', 'Confirm new password')}
                    style={{ width: '100%', padding: isRTL ? '13px 44px 13px 14px' : '13px 14px 13px 44px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', color: '#0f172a', fontSize: '0.92rem', outline: 'none', transition: 'all 0.25s ease', boxSizing: 'border-box' }}
                    onFocus={(e) => { e.target.style.borderColor = '#0284c7'; e.target.style.boxShadow = '0 0 0 4px rgba(2, 132, 199, 0.18)'; e.target.style.background = '#ffffff'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; e.target.style.background = '#f8fafc'; }}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', [isRTL ? 'left' : 'right']: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer' }}>
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {confirmPassword && (
                  <span style={{ fontSize: '0.78rem', color: passwordsMatch ? '#059669' : '#dc2626', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
                    {passwordsMatch ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                    {passwordsMatch ? t('auth.passwordsMatch', 'Passwords match') : t('auth.passwordsDoNotMatch', 'Passwords do not match')}
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={!canSubmit || loading}
                style={{
                  width: '100%', padding: '14px',
                  background: (!canSubmit || loading) ? '#cbd5e1' : 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0284c7 100%)',
                  border: 'none', borderRadius: '12px', color: '#ffffff', fontSize: '0.95rem', fontWeight: 800,
                  cursor: (!canSubmit || loading) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '10px', boxShadow: canSubmit ? '0 10px 28px rgba(2, 132, 199, 0.35)' : 'none',
                  marginBottom: '18px'
                }}
              >
                {loading ? <><Loader2 size={19} style={{ animation: 'spin 1s linear infinite' }} /> {t('auth.updatingPassword', 'Updating Security Password...')}</> : t('auth.resetPasswordAndSignIn', 'Reset Password & Sign In')}
              </button>

              <div style={{ textAlign: 'center' }}>
                <Link to="/" style={{ color: '#0284c7', fontSize: '0.84rem', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <ArrowLeft size={15} style={{ transform: isRTL ? 'scaleX(-1)' : 'none' }} /> {t('auth.returnToSignIn', 'Return to Sign In')}
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
