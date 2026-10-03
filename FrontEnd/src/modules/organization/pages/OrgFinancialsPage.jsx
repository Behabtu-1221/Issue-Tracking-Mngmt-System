import React from 'react';
import { ChevronRight } from 'lucide-react';
import FinancialsTab from '../components/FinancialsTab';

export default function OrgFinancialsPage() {
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
{/* Header */}
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Financial cost centers, department budget codes, GL accounts, and operational expenditure tracking
        </p>
      </div>

      <FinancialsTab />
    </div>
  );
}
