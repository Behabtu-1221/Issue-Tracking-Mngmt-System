import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../../i18n';
import { ShieldCheck, ArrowRight, Sliders, FileText, CheckCircle2 } from 'lucide-react';

export default function UserRolesPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', paddingTop: '20px' }}>
      {/* Centralized RBAC Notice Banner */}
      <div className="form-card accent-strip-purple" style={{
        padding: 'clamp(20px, 4vw, 36px)', borderRadius: 'var(--border-radius-lg, 18px)',
        textAlign: 'center'
      }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(138, 75, 255, 0.25) 0%, rgba(99, 102, 241, 0.25) 100%)',
          border: '1px solid rgba(138, 75, 255, 0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 18px', color: '#a855f7',
          boxShadow: '0 8px 24px rgba(138, 75, 255, 0.3)'
        }}>
          <ShieldCheck size={32} />
        </div>

        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(1.3rem, 3.5vw, 1.8rem)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>
          {t('identity.rolesCentralizedTitle')}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 'clamp(0.85rem, 2vw, 0.96rem)', maxWidth: '640px', margin: '0 auto 24px', lineHeight: '1.6' }}>
          {t('identity.rolesCentralizedDesc')}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '14px', marginBottom: '28px', textAlign: 'left' }}>
          <div style={{ padding: '16px 18px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#818cf8', fontWeight: 700, fontSize: '0.9rem', marginBottom: '6px' }}>
              <Sliders size={18} /> {t('identity.cardPermissionMatrix')}
            </div>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              {t('identity.cardPermissionMatrixDesc')}
            </p>
          </div>

          <div style={{ padding: '16px 18px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 700, fontSize: '0.9rem', marginBottom: '6px' }}>
              <CheckCircle2 size={18} /> {t('identity.cardDataScope')}
            </div>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              {t('identity.cardDataScopeDesc')}
            </p>
          </div>

          <div style={{ padding: '16px 18px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontWeight: 700, fontSize: '0.9rem', marginBottom: '6px' }}>
              <FileText size={18} /> {t('identity.cardRbacAudit')}
            </div>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              {t('identity.cardRbacAuditDesc')}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => navigate('/roles/matrix')}
            className="btn btn-primary w-full sm:w-auto touch-target-sm justify-center"
            style={{
              padding: '12px 26px',
              fontSize: '0.92rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {t('identity.launchMatrixBtn')} <ArrowRight size={18} />
          </button>

          <button
            onClick={() => navigate('/roles/dashboard')}
            className="btn btn-secondary w-full sm:w-auto touch-target-sm justify-center"
            style={{
              padding: '12px 22px',
              fontSize: '0.9rem'
            }}
          >
            {t('identity.viewGovernanceDashboardBtn')}
          </button>
        </div>
      </div>
    </div>
  );
}
