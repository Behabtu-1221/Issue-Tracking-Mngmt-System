import React from 'react';
import { ChevronRight } from 'lucide-react';
import SLAPoliciesTab from '../components/SLAPoliciesTab';

export default function SLAPoliciesPage() {
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
{/* Header */}
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Configure response & resolution time targets, escalation chains, and compliance thresholds
        </p>
      </div>

      <SLAPoliciesTab />
    </div>
  );
}
