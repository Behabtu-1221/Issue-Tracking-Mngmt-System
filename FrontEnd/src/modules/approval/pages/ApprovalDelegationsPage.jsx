import React from 'react';
import { ChevronRight } from 'lucide-react';
import ApprovalDelegationsTab from '../components/ApprovalDelegationsTab';

export default function ApprovalDelegationsPage() {
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
{/* Header */}
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Delegate approval authority and signature permissions during temporary absences or leave
        </p>
      </div>

      <ApprovalDelegationsTab />
    </div>
  );
}
