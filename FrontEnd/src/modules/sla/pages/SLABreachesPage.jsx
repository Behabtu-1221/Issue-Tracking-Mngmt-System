import React from 'react';
import { ChevronRight } from 'lucide-react';
import SLABreachMonitoringTab from '../components/SLABreachMonitoringTab';

export default function SLABreachesPage() {
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
{/* Header */}
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          SLA breach history, response & resolution violations, escalation chain audit trails
        </p>
      </div>

      <SLABreachMonitoringTab />
    </div>
  );
}
