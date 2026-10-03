import React from 'react';
import { ChevronRight } from 'lucide-react';
import DepartmentsUnitsTab from '../components/DepartmentsUnitsTab';

export default function OrgDepartmentsPage() {
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
{/* Header */}
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Department divisions, head of department assignments, business unit codes, and functional areas
        </p>
      </div>

      <DepartmentsUnitsTab />
    </div>
  );
}
