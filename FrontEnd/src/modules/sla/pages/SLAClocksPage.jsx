import React from 'react';
import { ChevronRight } from 'lucide-react';
import SLADashboardTab from '../components/SLADashboardTab';

export default function SLAClocksPage() {
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
{/* Header */}
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Real-time response & resolution SLA timers, countdown clocks, and performance compliance tracking
        </p>
      </div>

      <SLADashboardTab />
    </div>
  );
}
