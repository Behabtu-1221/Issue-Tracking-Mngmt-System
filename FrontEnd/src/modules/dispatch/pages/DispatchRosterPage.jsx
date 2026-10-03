import React from 'react';
import { ChevronRight } from 'lucide-react';
import TechnicianRosterTab from '../components/TechnicianRosterTab';

export default function DispatchRosterPage() {
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
{/* Header */}
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Field technician active workload capacity, skill profiles, and shift status
        </p>
      </div>

      <TechnicianRosterTab />
    </div>
  );
}
