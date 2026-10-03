import React from 'react';
import { ChevronRight } from 'lucide-react';
import KnownIssuesTab from '../components/KnownIssuesTab';

export default function IssueKnownPage() {
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
{/* Header */}
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Recurring problems, standard workarounds, and verified resolution articles
        </p>
      </div>

      <KnownIssuesTab />
    </div>
  );
}
