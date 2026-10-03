import React from 'react';
import { ChevronRight } from 'lucide-react';
import EmployeeAssignmentsTab from '../components/EmployeeAssignmentsTab';

export default function OrgAssignmentsPage() {
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
{/* Header */}
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Staff member position placements, primary/secondary department roles, and manager reporting lines
        </p>
      </div>

      <EmployeeAssignmentsTab />
    </div>
  );
}
