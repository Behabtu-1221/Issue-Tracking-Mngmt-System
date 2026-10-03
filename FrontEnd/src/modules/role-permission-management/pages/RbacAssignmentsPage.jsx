import React, { useState, useEffect } from 'react';
import { UserCheck, Search, ShieldCheck, Users, RefreshCw } from 'lucide-react';
import rbacApi from '../api/rbacApi';
import UserRoleAssignModal from '../components/UserRoleAssignModal';

const glassCard = {
  background: 'var(--glass-bg)',
  border: '1px solid rgba(148, 163, 184, 0.12)',
  borderRadius: '18px',
  backdropFilter: 'blur(16px)',
  padding: '24px'
};

export default function RbacAssignmentsPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [userToAssign, setUserToAssign] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await rbacApi.getUsersWithRoles({ search });
      setUsers(res.data?.data?.users || res.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch users list for role assignment:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const handleOpenAssign = (u) => {
    setUserToAssign(u);
    setShowAssignModal(true);
  };

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
{/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
              Role Assignments & <span className="glow-text">User Access</span>
            </h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Manage user-to-role mappings, tenant administration scope access, and park admin grants
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={fetchUsers}
              disabled={loading}
              style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid rgba(148, 163, 184, 0.15)',
                borderRadius: '12px',
                padding: '10px 18px',
                color: '#e2e8f0',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
                backdropFilter: 'blur(12px)'
              }}
            >
              <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              Refresh List
            </button>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div style={{ ...glassCard, padding: '16px 20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Search size={18} color="#94a3b8" />
          <input
            type="text"
            placeholder="Filter users by name, email, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: '#f8fafc',
              fontSize: '14px',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* User Table */}
      <div style={{ ...glassCard, overflow: 'hidden', padding: 0 }}>
        <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid rgba(148, 163, 184, 0.12)' }}>
              <th style={{ padding: '16px 20px', textAlign: 'left', color: '#94a3b8', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700 }}>User / Account</th>
              <th style={{ padding: '16px 20px', textAlign: 'left', color: '#94a3b8', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700 }}>Assigned Role</th>
              <th style={{ padding: '16px 20px', textAlign: 'left', color: '#94a3b8', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700 }}>Admin Scope</th>
              <th style={{ padding: '16px 20px', textAlign: 'right', color: '#94a3b8', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                  Loading user role assignments...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                  No users found matching current filter.
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const roleName = u.roles && u.roles.length > 0 ? (u.roles[0].RoleName || u.roles[0].name) : (u.role || 'Standard User');
                return (
                  <tr key={u.UserID || u.id} style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.08)' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.9rem' }}>
                        {`${u.firstName || ''} ${u.lastName || u.username || 'User'}`.trim()}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{u.email}</div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: 'rgba(99, 102, 241, 0.15)',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        color: '#818cf8',
                        fontSize: '0.8rem',
                        fontWeight: 700
                      }}>
                        <ShieldCheck size={14} />
                        {roleName}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', color: '#cbd5e1', fontSize: '0.84rem' }}>
                      {u.scope || u.userTypeCode || 'TENANT_COMPANY'}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleOpenAssign(u)}
                        style={{
                          background: 'rgba(99, 102, 241, 0.15)',
                          border: '1px solid rgba(99, 102, 241, 0.3)',
                          borderRadius: '8px',
                          padding: '6px 14px',
                          color: '#818cf8',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s'
                        }}
                      >
                        <UserCheck size={14} /> Assign Role
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Role Assignment Modal */}
      {showAssignModal && (
        <UserRoleAssignModal
          userToAssign={userToAssign}
          onClose={() => setShowAssignModal(false)}
          onSuccess={fetchUsers}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
