import React from 'react';
import { useTranslation } from '../../../i18n';
import { Send, Zap, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';
import DispatcherDashboardTab from '../components/DispatcherDashboardTab';

export default function DispatchQueuePage() {
  const { t } = useTranslation();

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
      {/* Multi-Tone Brand Vector Banner Header */}
      <div style={{
        marginBottom: '24px', padding: '24px 28px', borderRadius: '20px',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 41, 59, 0.85) 50%, rgba(15, 23, 42, 0.9) 100%), url("/auth_background.jpg")',
        backgroundSize: 'cover', backgroundPosition: 'center',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        boxShadow: '0 12px 36px rgba(15, 23, 42, 0.35)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px',
        position: 'relative', overflow: 'hidden'
      }}>
        {/* Top Multi-Tone Brand Accent Line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
          background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 40%, #0284c7 75%, #10b981 100%)'
        }} />

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)'
            }}>
              <Send size={20} />
            </div>
            <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.85rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
              {t('dispatch.queuePageTitle')}
            </h1>
          </div>
          <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.92rem', maxWidth: '750px' }}>
            {t('dispatch.queuePageSubtitle')}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '14px', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '10px'
          }}>
            <Zap size={20} color="#818cf8" />
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                {t('dispatch.smartRoutingEngine')}
              </div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#34d399' }}>
                {t('dispatch.smartRoutingActive')}
              </div>
            </div>
          </div>
        </div>
      </div>

      <DispatcherDashboardTab />
    </div>
  );
}
