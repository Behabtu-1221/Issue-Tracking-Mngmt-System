import React, { useState, useEffect } from 'react';
import { Zap, RefreshCw, Layers, Database, ShieldCheck } from 'lucide-react';
import configApi from '../api/configApi';

export default function BootstrapTab() {
  const [bootstrapData, setBootstrapData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchBootstrap = async () => {
    setLoading(true);
    try {
      const res = await configApi.getBootstrap();
      if (res.data && res.data.status === 'success') {
        setBootstrapData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load bootstrap data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBootstrap();
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>System Bootstrap Configuration</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Initial system runtime configuration loaded by clients during startup.</p>
        </div>

        <button
          onClick={fetchBootstrap}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: 'var(--border-radius-sm)',
            background: 'var(--bg-tertiary)',
            color: 'var(--color-text)',
            border: '1px solid var(--glass-border)',
            fontWeight: '600',
            fontSize: '0.88rem',
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Reload Bootstrap Payload
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <RefreshCw className="animate-spin" size={32} style={{ marginBottom: '16px' }} />
          <p>Querying backend bootstrap service...</p>
        </div>
      ) : (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(138, 75, 255, 0.15)', color: 'var(--accent-primary)' }}>
                <Layers size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Settings Loaded</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {bootstrapData?.settings ? Object.keys(bootstrapData.settings).length : 0}
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(14, 165, 233, 0.15)', color: 'var(--color-info)' }}>
                <Database size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Feature Flags</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {bootstrapData?.flags ? Object.keys(bootstrapData.flags).length : 0}
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-success)' }}>
                <ShieldCheck size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Bootstrap State</div>
                <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--color-success)' }}>READY</div>
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '1rem', marginBottom: '14px', color: 'var(--text-secondary)' }}>Bootstrap JSON Payload</h4>
            <pre style={{
              background: 'var(--color-elevated)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--border-radius-sm)',
              padding: '18px',
              color: '#38bdf8',
              fontFamily: 'Fira Code, monospace',
              fontSize: '0.85rem',
              overflowX: 'auto',
              maxHeight: '400px'
            }}>
              {JSON.stringify(bootstrapData, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
