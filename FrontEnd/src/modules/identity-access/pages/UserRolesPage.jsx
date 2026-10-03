import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Sliders, FileText, CheckCircle2 } from 'lucide-react';

export default function UserRolesPage() {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', paddingTop: '20px' }}>
      {/* Centralized RBAC Notice Banner */}
      <div className="glass-panel" style={{
        padding: '36px', borderRadius: '24px',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 41, 59, 0.85) 100%)',
        border: '1px solid rgba(138, 75, 255, 0.35)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
        textAlign: 'center'
      }}>
        <div style={{
          width: '72px', height: '72px', borderRadius: '22px',
          background: 'linear-gradient(135deg, rgba(138, 75, 255, 0.25) 0%, rgba(99, 102, 241, 0.25) 100%)',
          border: '1px solid rgba(138, 75, 255, 0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px', color: '#a855f7',
          boxShadow: '0 8px 24px rgba(138, 75, 255, 0.3)'
        }}>
          <ShieldCheck size={38} />
        </div>

        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', marginBottom: '12px' }}>
          Role Definitions & RBAC Matrix Centralized
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.96rem', maxWidth: '640px', margin: '0 auto 28px', lineHeight: '1.6' }}>
          System role definitions, custom role creation, granular permission matrix grid, and RBAC governance policies have been consolidated into the dedicated <strong style={{ color: '#cbd5e1' }}>Role & RBAC Management Module</strong>.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '32px', textAlign: 'left' }}>
          <div style={{ padding: '16px 20px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#818cf8', fontWeight: 700, fontSize: '0.9rem', marginBottom: '6px' }}>
              <Sliders size={18} /> Permission Matrix
            </div>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.82rem' }}>
              Module-by-module permission matrix grid with group expanders and search filtering.
            </p>
          </div>

          <div style={{ padding: '16px 20px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 700, fontSize: '0.9rem', marginBottom: '6px' }}>
              <CheckCircle2 size={18} /> Data Scope Enforcement
            </div>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.82rem' }}>
              Role scope definitions: OWN, DEPARTMENT, COMPANY, and SYSTEM_ALL scopes.
            </p>
          </div>

          <div style={{ padding: '16px 20px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontWeight: 700, fontSize: '0.9rem', marginBottom: '6px' }}>
              <FileText size={18} /> RBAC Audit Logs
            </div>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.82rem' }}>
              Real-time security audit trails tracking permission modifications and role assignments.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/roles/matrix')}
            style={{
              padding: '13px 28px', borderRadius: '14px',
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              border: 'none', color: '#ffffff', fontWeight: 800, fontSize: '0.95rem',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.35)', transition: 'all 0.25s ease'
            }}
          >
            Launch Permission Matrix <ArrowRight size={18} />
          </button>

          <button
            onClick={() => navigate('/roles/dashboard')}
            style={{
              padding: '13px 24px', borderRadius: '14px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.18)', color: '#e2e8f0', fontWeight: 700, fontSize: '0.92rem',
              cursor: 'pointer', transition: 'all 0.25s ease'
            }}
          >
            View RBAC Governance Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
