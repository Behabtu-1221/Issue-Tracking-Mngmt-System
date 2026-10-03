import React from 'react';
import { ChevronRight } from 'lucide-react';
import TechnicianWorkbenchTab from '../components/TechnicianWorkbenchTab';

export default function DispatchWorkbenchPage() {
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
{/* Header */}
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Active technician assignments, task execution timer, status updates, and fulfillment proof
        </p>
      </div>

      <TechnicianWorkbenchTab />
    </div>
  );
}
