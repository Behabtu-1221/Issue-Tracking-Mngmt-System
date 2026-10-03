import React from 'react';
import { ChevronRight } from 'lucide-react';
import TeamsPositionsTab from '../components/TeamsPositionsTab';

export default function OrgTeamsPage() {
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
{/* Header */}
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Functional operational teams, team leaders, job position titles, grade levels, and responsibilities
        </p>
      </div>

      <TeamsPositionsTab />
    </div>
  );
}
