import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * RequireAuth — Protects any route that requires authentication.
 * Unauthenticated users → redirected to login.
 * Users who must change password → redirected to first-login page.
 */
export function RequireAuth({ children }) {
  const { isAuthenticated, loading, mustChangePassword } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-primary)' }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location.pathname }} replace />;
  }

  if (mustChangePassword && location.pathname !== '/first-login-password-change') {
    return <Navigate to="/first-login-password-change" replace />;
  }

  return children;
}

/**
 * GuestOnly — Pages only accessible when NOT logged in (login, forgot-password, reset).
 */
export function GuestOnly({ children }) {
  const { isAuthenticated, loading, mustChangePassword, getDefaultDashboard } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-primary)' }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (isAuthenticated && !mustChangePassword) {
    return <Navigate to={`/${getDefaultDashboard()}`} replace />;
  }

  return children;
}
