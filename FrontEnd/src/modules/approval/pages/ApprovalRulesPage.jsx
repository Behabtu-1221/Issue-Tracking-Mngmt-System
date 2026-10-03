import React from 'react';
import { ChevronRight } from 'lucide-react';
import ApprovalRulesGroupsTab from '../components/ApprovalRulesGroupsTab';

export default function ApprovalRulesPage() {
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
{/* Header */}
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Configure multi-level approval chains, group memberships, and financial threshold triggers
        </p>
      </div>

      <ApprovalRulesGroupsTab />
    </div>
  );
}
