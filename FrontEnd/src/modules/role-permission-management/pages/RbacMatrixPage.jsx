import React, { useState } from 'react';
import { Plus, ShieldCheck } from 'lucide-react';
import RolePermissionMatrix from '../components/RolePermissionMatrix';
import CompanyRoleModal from '../components/CompanyRoleModal';
import { useTranslation } from '../../../i18n';

export default function RbacMatrixPage() {
  const { t } = useTranslation();
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleToEdit, setRoleToEdit] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleOpenCreateRole = () => {
    setRoleToEdit(null);
    setShowRoleModal(true);
  };

  const handleOpenEditRole = (role) => {
    setRoleToEdit(role);
    setShowRoleModal(true);
  };

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div style={{
        marginBottom: '24px', padding: '24px 28px', borderRadius: '20px',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 41, 59, 0.85) 50%, rgba(15, 23, 42, 0.9) 100%), url("/auth_background.jpg")',
        backgroundSize: 'cover', backgroundPosition: 'center',
        border: '1px solid rgba(2, 132, 199, 0.3)',
        boxShadow: '0 12px 36px rgba(15, 23, 42, 0.35)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px',
        position: 'relative', overflow: 'hidden'
      }}>
        {/* Top Multi-Tone Brand Accent */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
          background: 'linear-gradient(90deg, #0284c7 0%, #6366f1 40%, #a855f7 75%, #10b981 100%)'
        }} />

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
            }}>
              <ShieldCheck size={20} />
            </div>
            <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.85rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
              {t('rbac.tabPermissionMatrix', 'Permission Assignment Matrix')}
            </h1>
          </div>
          <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.92rem', maxWidth: '750px' }}>
            {t('rbac.governanceSubtitle', 'Assign, map, and toggle granular CRUD resource permissions to created security roles across system modules.')}
          </p>
        </div>

        <button
          onClick={handleOpenCreateRole}
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            border: 'none', borderRadius: '14px', padding: '12px 24px',
            color: '#ffffff', fontWeight: 800, fontSize: '0.92rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '9px',
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.35)', transition: 'all 0.25s ease'
          }}
        >
          <Plus size={18} /> {t('rbac.createCustomRole', 'Create New Role')}
        </button>
      </div>

      {/* Permission Matrix */}
      <RolePermissionMatrix
        key={refreshKey}
        onOpenCreateRole={handleOpenCreateRole}
        onOpenEditRole={handleOpenEditRole}
      />

      {/* Role Create / Edit Modal */}
      {showRoleModal && (
        <CompanyRoleModal
          roleToEdit={roleToEdit}
          onClose={() => setShowRoleModal(false)}
          onSuccess={() => setRefreshKey(prev => prev + 1)}
        />
      )}
    </div>
  );
}
