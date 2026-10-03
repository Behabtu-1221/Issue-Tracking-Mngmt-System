import React from 'react';
import { ChevronRight } from 'lucide-react';
import ActiveSessionsTab from '../components/ActiveSessionsTab';

export default function UserSessionsPage() {
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
{/* Header */}
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Monitor live user sessions, device fingerprints, IP addresses, and force-terminate suspicious logins
        </p>
      </div>

      <ActiveSessionsTab />
    </div>
  );
}
