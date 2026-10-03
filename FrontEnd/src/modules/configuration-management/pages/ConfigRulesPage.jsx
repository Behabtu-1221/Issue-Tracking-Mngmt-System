import React from 'react';
import BusinessRulesTab from '../components/BusinessRulesTab';

export default function ConfigRulesPage() {
  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
<h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>Business Rules & <span className="glow-text">Automation</span></h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Rule engine criteria, dynamic assignment logic, validation hooks, and condition-based triggers
</p>
      </div>
      <BusinessRulesTab />
    </div>
  );
}
