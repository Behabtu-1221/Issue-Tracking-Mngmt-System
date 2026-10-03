import React from 'react';
import { ChevronRight } from 'lucide-react';
import UsersTab from '../components/UsersTab';

export default function UserDirectoryPage() {
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
{/* Header */}
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Manage user accounts, staff profiles, password resets, status locks, and role assignments
        </p>
      </div>

      <UsersTab />
    </div>
  );
}
