import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../../../i18n';
import {
  X, ShieldCheck, Building2, User as UserIcon, Mail, Phone,
  Briefcase, Lock, AlertCircle, CheckCircle2, Search, ChevronDown,
  Loader2, Sparkles, Send, RefreshCw, UserPlus, Check, Key,
  Layers, Shield, Landmark
} from 'lucide-react';
import identityApi from '../api/identityApi';
import orgApi from '../../organization/api/orgApi';
import tenantApi from '../../tenant/api/tenantApi';
import parkApi from '../../business-park/api/parkApi';

const glassModalStyle = {
  background: 'var(--bg-secondary)',
  border: '1px solid var(--glass-border-accent, var(--glass-border))',
  borderRadius: 'var(--border-radius-lg, 18px)',
  backdropFilter: 'blur(24px)',
  boxShadow: 'var(--shadow-lg)',
  animation: 'fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
};

const IT_PARK_ROLES = [
  {
    code: 'EMPLOYEE',
    roleCode: 'EMPLOYEE',
    label: 'Employee',
    desc: 'Standard requester & service catalog consumer',
    icon: UserIcon,
    color: '#2563eb',
    bg: 'rgba(37, 99, 235, 0.12)',
    border: 'rgba(37, 99, 235, 0.3)'
  },
  {
    code: 'TECHNICIAN',
    roleCode: 'TECHNICIAN',
    label: 'Technician',
    desc: 'Field maintenance worker executing assigned work orders',
    icon: Briefcase,
    color: '#059669',
    bg: 'rgba(5, 150, 105, 0.12)',
    border: 'rgba(5, 150, 105, 0.3)'
  },
  {
    code: 'MANAGER',
    roleCode: 'DEPARTMENT_MANAGER',
    label: 'Department Manager',
    desc: 'Department manager approving, dispatching & managing operations',
    icon: ShieldCheck,
    color: '#7c3aed',
    bg: 'rgba(124, 58, 237, 0.12)',
    border: 'rgba(124, 58, 237, 0.3)'
  }
];

/* ── Material Design Outlined Floating Label Input ── */
function FloatingInput({ id, type = 'text', value, onChange, label, required, optional, error, placeholder }) {
  const [focused, setFocused] = useState(false);
  const hasVal = value !== undefined && value !== null && String(value).trim() !== '';
  const isUp = focused || hasVal;
  const labelTxt = `${label}${required ? ' *' : ''}${optional ? ' (optional)' : ''}`;
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div
        style={{
          position: 'relative',
          borderRadius: '10px',
          border: error
            ? '1.5px solid var(--color-danger, #ef4444)'
            : focused
              ? '2px solid var(--accent-primary, #6366f1)'
              : '1px solid var(--glass-border, rgba(255,255,255,0.18))',
          background: 'var(--bg-tertiary)',
          boxShadow: focused ? '0 0 0 3.5px rgba(99,102,241,0.15)' : 'none',
          transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)'
        }}
      >
        <label
          htmlFor={id}
          style={{
            position: 'absolute', left: '13px',
            top: isUp ? '0px' : '50%',
            transform: 'translateY(-50%)',
            fontSize: isUp ? '0.73rem' : '0.88rem',
            fontWeight: isUp ? 700 : 400,
            color: error ? 'var(--color-danger, #ef4444)' : focused ? 'var(--accent-primary, #6366f1)' : 'var(--text-muted, #94a3b8)',
            background: isUp ? 'var(--bg-secondary, #0f172a)' : 'transparent',
            padding: isUp ? '0 6px' : '0',
            borderRadius: '4px',
            pointerEvents: 'none',
            transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)',
            zIndex: 2, letterSpacing: isUp ? '0.3px' : 'normal'
          }}
        >
          {labelTxt}
        </label>
        <input
          id={id} type={type} value={value} onChange={onChange}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          placeholder={isUp ? (placeholder || '') : ''}
          style={{
            width: '100%', padding: '14px 14px', background: 'transparent',
            border: 'none', borderRadius: '10px', color: 'var(--text-primary)',
            fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box'
          }}
        />
      </div>
      {error && <span style={{ fontSize: '0.73rem', color: 'var(--color-danger, #ef4444)', marginTop: '4px', display: 'block', paddingLeft: '4px' }}>{error}</span>}
    </div>
  );
}

/* ── Material Design Outlined Floating Label Select ── */
function FloatingSelect({ id, value, onChange, label, required, error, children }) {
  const [focused, setFocused] = useState(false);
  const hasVal = value !== undefined && value !== null && String(value).trim() !== '';
  // Label floats notched on top border line when focused or when a value is selected!
  const isUp = focused || hasVal;
  const labelTxt = `${label}${required ? ' *' : ''}`;
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div
        style={{
          position: 'relative',
          borderRadius: '10px',
          border: error
            ? '1.5px solid var(--color-danger, #ef4444)'
            : focused
              ? '2px solid var(--accent-primary, #6366f1)'
              : '1px solid var(--glass-border, rgba(255,255,255,0.18))',
          background: 'var(--bg-tertiary)',
          boxShadow: focused ? '0 0 0 3.5px rgba(99,102,241,0.15)' : 'none',
          transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <label
          htmlFor={id}
          style={{
            position: 'absolute',
            left: '13px',
            top: isUp ? '0px' : '50%',
            transform: 'translateY(-50%)',
            fontSize: isUp ? '0.73rem' : '0.88rem',
            fontWeight: isUp ? 700 : 400,
            color: error
              ? 'var(--color-danger, #ef4444)'
              : focused
                ? 'var(--accent-primary, #6366f1)'
                : isUp
                  ? 'var(--accent-primary, #6366f1)'
                  : 'var(--text-muted, #94a3b8)',
            background: isUp ? 'var(--bg-secondary, #0f172a)' : 'transparent',
            padding: isUp ? '0 6px' : '0',
            borderRadius: '4px',
            pointerEvents: 'none',
            transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)',
            zIndex: 2,
            letterSpacing: isUp ? '0.3px' : 'normal'
          }}
        >
          {labelTxt}
        </label>
        <select
          id={id}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%',
            padding: '14px 40px 14px 14px',
            background: 'transparent',
            border: 'none',
            borderRadius: '10px',
            color: isUp ? 'var(--text-primary)' : 'transparent',
            fontSize: '0.9rem',
            outline: 'none',
            cursor: 'pointer',
            boxSizing: 'border-box',
            WebkitAppearance: 'none',
            MozAppearance: 'none',
            appearance: 'none'
          }}
        >
          {children}
        </select>

        {/* Custom Styled Material Dropdown Chevron Arrow */}
        <div
          style={{
            position: 'absolute',
            right: '14px',
            top: '50%',
            transform: focused ? 'translateY(-50%) rotate(180deg)' : 'translateY(-50%)',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: focused ? 'var(--accent-primary, #6366f1)' : 'var(--text-muted, #94a3b8)',
            transition: 'transform 0.2s ease, color 0.2s ease'
          }}
        >
          <ChevronDown size={18} strokeWidth={2.5} />
        </div>
      </div>
      {error && (
        <span style={{ fontSize: '0.73rem', color: 'var(--color-danger, #ef4444)', marginTop: '4px', display: 'block', paddingLeft: '4px' }}>
          {error}
        </span>
      )}
    </div>
  );
}

export default function UserRegistrationModal({
  isOpen,
  onClose,
  onSuccess,
  tenants = [],
  roles = [],
  isParkAdmin = true,
  user
}) {
  const { t } = useTranslation();
  // Mode: 'IT_PARK_USER' | 'TENANT_REP'
  const [userType, setUserType] = useState('IT_PARK_USER');

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [jobTitle, setJobTitle] = useState('');

  // Organization & Access Fields
  const [departmentId, setDepartmentId] = useState('');
  const [itParkRoleCode, setItParkRoleCode] = useState('EMPLOYEE');

  // Tenant Representative Combobox State
  const [tenantId, setTenantId] = useState('');
  const [tenantSearchQuery, setTenantSearchQuery] = useState('');
  const [isTenantDropdownOpen, setIsTenantDropdownOpen] = useState(false);
  const tenantComboboxRef = useRef(null);

  // Account Settings
  const [accountStatus, setAccountStatus] = useState('ACTIVE');
  const [sendInvitation, setSendInvitation] = useState(true);

  // Lists & Async States
  const [departments, setDepartments] = useState([]);
  const [tenantList, setTenantList] = useState(tenants || []);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [businessParkName, setBusinessParkName] = useState('');
  const [businessParkCode, setBusinessParkCode] = useState('');

  // Form State
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [createdSuccessData, setCreatedSuccessData] = useState(null);

  // Load Tenants & Departments
  useEffect(() => {
    if (!isOpen) return;

    // Reset Form to initial clean state
    setUserType('IT_PARK_USER');
    setFirstName('');
    setLastName('');
    setMiddleName('');
    setEmail('');
    setPhoneNumber('');
    setJobTitle('');
    setDepartmentId('');
    setItParkRoleCode('EMPLOYEE');
    setTenantId('');
    setTenantSearchQuery('');
    setIsTenantDropdownOpen(false);
    setSendInvitation(true);
    setFieldErrors({});
    setServerError('');
    setCreatedSuccessData(null);

    // Fetch IT Park Departments
    setLoadingDepartments(true);
    orgApi.getDepartments({ limit: 200 })
      .then(res => {
        const raw = res.data?.data?.departments || res.data?.data || [];
        setDepartments(Array.isArray(raw) ? raw : []);
      })
      .catch(err => console.error('Failed to load departments:', err))
      .finally(() => setLoadingDepartments(false));

    // Fetch Business Park name from database
    parkApi.getParks({ limit: 1 })
      .then(res => {
        const parks = res.data?.data?.parks || res.data?.data || [];
        if (Array.isArray(parks) && parks.length > 0) {
          setBusinessParkName(parks[0].ParkName || parks[0].BusinessParkName || 'Ethiopian IT Park');
          setBusinessParkCode(parks[0].ParkCode || parks[0].BusinessParkCode || '');
        }
      })
      .catch(err => console.error('Failed to load business park:', err));

    // Fetch Tenants if not passed
    if (tenants && tenants.length > 0) {
      setTenantList(tenants);
    } else {
      tenantApi.getTenants({ limit: 300 })
        .then(res => {
          const raw = res.data?.data?.tenants || res.data?.data || [];
          setTenantList(Array.isArray(raw) ? raw : []);
        })
        .catch(err => console.error('Failed to load tenants:', err));
    }
  }, [isOpen, tenants]);

  // Click outside to close tenant combobox
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (tenantComboboxRef.current && !tenantComboboxRef.current.contains(e.target)) {
        setIsTenantDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Tenant Filter for Combobox
  const filteredTenants = tenantList.filter(t => {
    const name = (t.CompanyName || t.TenantName || '').toLowerCase();
    const code = (t.TenantCode || '').toLowerCase();
    const q = tenantSearchQuery.toLowerCase();
    return name.includes(q) || code.includes(q);
  });

  const selectedTenantObj = tenantList.find(t => String(t.TenantID) === String(tenantId));
  const selectedDeptObj = departments.find(d => String(d.DepartmentID) === String(departmentId));

  // Client-Side Form Validation
  const validateForm = () => {
    const errors = {};

    if (!firstName.trim()) {
      errors.firstName = 'First name is required.';
    }

    if (!lastName.trim()) {
      errors.lastName = 'Last name is required.';
    }

    if (!email.trim()) {
      errors.email = 'Business email address is required.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        errors.email = 'Enter a valid business email address.';
      }
    }

    if (userType === 'IT_PARK_USER') {
      if (!departmentId) {
        errors.departmentId = 'Select a department.';
      }
    } else if (userType === 'TENANT_REP') {
      if (!tenantId) {
        errors.tenantId = 'Select a tenant organization.';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validateForm()) return;

    setSubmitting(true);

    try {
      let targetUserTypeCode = 'STAFF';
      let targetRoleId = null;

      if (userType === 'TENANT_REP') {
        targetUserTypeCode = 'TENANT_REPRESENTATIVE';
        const repRole = roles.find(r => (r.RoleCode || r.roleCode || '').toUpperCase() === 'TENANT_REPRESENTATIVE');
        if (repRole) targetRoleId = repRole.RoleID || repRole.id;
      } else {
        if (itParkRoleCode === 'TECHNICIAN') {
          targetUserTypeCode = 'TECHNICIAN';
        } else if (itParkRoleCode === 'MANAGER') {
          targetUserTypeCode = 'MANAGER';
        } else {
          targetUserTypeCode = 'STAFF';
        }

        const roleMatch = IT_PARK_ROLES.find(r => r.code === itParkRoleCode);
        if (roleMatch && roles && roles.length > 0) {
          const found = roles.find(r => (r.RoleCode || r.roleCode || '').toUpperCase() === roleMatch.roleCode);
          if (found) targetRoleId = found.RoleID || found.id;
        }
      }

      const emailPrefix = email.split('@')[0].replace(/[^a-zA-Z0-9._-]/g, '');
      const autoUsername = emailPrefix || `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
      const fullJobTitle = jobTitle.trim() || (userType === 'TENANT_REP' ? 'Tenant Representative' : 'IT Park Staff');

      const payload = {
        tenantId: (userType === 'TENANT_REP' && tenantId) ? Number(tenantId) : undefined,
        departmentId: (userType === 'IT_PARK_USER' && departmentId) ? Number(departmentId) : undefined,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        username: autoUsername,
        phoneNumber: phoneNumber.trim() || undefined,
        jobTitle: fullJobTitle,
        userTypeCode: targetUserTypeCode,
        accountStatusCode: 'MUST_CHANGE_PASSWORD',
        roleIds: targetRoleId ? [Number(targetRoleId)] : undefined
      };

      const res = await identityApi.createUser(payload);

      if (res.data && (res.data.status === 'success' || res.data.status === 'created')) {
        const createdData = {
          fullName: middleName.trim()
            ? `${firstName.trim()} ${middleName.trim()} ${lastName.trim()}`
            : `${firstName.trim()} ${lastName.trim()}`,
          email: email.trim(),
          userType: userType === 'TENANT_REP' ? 'Tenant Representative' : 'IT Park User',
          roleLabel: userType === 'TENANT_REP'
            ? 'Tenant Representative'
            : (IT_PARK_ROLES.find(r => r.code === itParkRoleCode)?.label || 'Employee'),
          organizationName: userType === 'TENANT_REP'
            ? (selectedTenantObj?.CompanyName || 'Tenant Organization')
            : (selectedDeptObj?.DepartmentName || 'IT Park Department'),
          sendInvitation
        };

        setCreatedSuccessData(createdData);
        if (onSuccess) {
          onSuccess(res.data.data);
        }
      }
    } catch (err) {
      console.error('Failed to create user account:', err);
      setServerError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to create user account. Please check user details and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: 'clamp(8px, 2.5vw, 20px)'
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-user-modal-title"
    >
      <div
        className="modal-card accent-strip-brand enterprise-card"
        style={{
          width: '840px',
          maxWidth: '96vw',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 'var(--border-radius-lg, 18px)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── MODAL HEADER ── */}
        <div
          className="p-3.5 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[var(--color-border-subtle,var(--glass-border))] bg-[var(--bg-tertiary)] shrink-0"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', width: '100%' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--accent-gradient)',
                boxShadow: 'var(--glow-accent)',
                flexShrink: 0
              }}
            >
              <UserPlus size={20} color="#ffffff" />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h3
                  id="create-user-modal-title"
                  style={{
                    margin: 0,
                    color: 'var(--text-primary)',
                    fontSize: 'clamp(1.1rem, 2.5vw, 1.25rem)',
                    fontWeight: 800,
                    letterSpacing: '-0.3px',
                    wordBreak: 'break-word'
                  }}
                >
                  {t('identity.registerModalTitle')}
                </h3>
                <span
                  style={{
                    background: 'rgba(37, 99, 235, 0.12)',
                    border: '1px solid var(--glass-border-accent)',
                    color: 'var(--accent-primary)',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  ADMIN PROVISIONING
                </span>
              </div>
              <p style={{ margin: '3px 0 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                {t('identity.registerModalSubtitle')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            className="btn-icon touch-target-sm sm:self-center self-end"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--glass-border)',
              borderRadius: '8px',
              padding: '8px',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* ── SUCCESS CONFIRMATION PANEL ── */}
        {createdSuccessData ? (
          <div
            style={{
              padding: '40px 32px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '20px',
              overflowY: 'auto'
            }}
          >
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '2px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-success, #10b981)'
              }}
            >
              <CheckCircle2 size={42} />
            </div>

            <div>
              <h3 style={{ margin: '0 0 8px', fontSize: '1.4rem', color: 'var(--text-primary)', fontWeight: 800 }}>
                {t('identity.userCreatedSuccess')}
              </h3>
              <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-secondary)', maxWidth: '500px', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--text-primary)' }}>{createdSuccessData.fullName}</strong> has been added as a{' '}
                <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>{createdSuccessData.roleLabel}</span> for{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{createdSuccessData.organizationName}</strong>.
              </p>
            </div>

            {createdSuccessData.sendInvitation && (
              <div
                style={{
                  padding: '12px 20px',
                  borderRadius: '12px',
                  background: 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  color: 'var(--accent-primary)',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <Send size={16} />
                <span>{t('identity.accountInvitationQueued')} {createdSuccessData.email}</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '14px', marginTop: '12px' }}>
              <button
                type="button"
                onClick={() => setCreatedSuccessData(null)}
                style={{
                  padding: '11px 22px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '10px',
                  color: 'var(--text-primary)',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <RefreshCw size={15} />
                {t('identity.btnAddAnotherUser')}
              </button>

              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '11px 26px',
                  background: 'var(--accent-gradient)',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: 'var(--glow-accent)'
                }}
              >
                {t('identity.btnDone')}
              </button>
            </div>
          </div>
        ) : (
          /* ── SINGLE-PAGE SCROLLABLE FORM BODY ── */
          <form
            onSubmit={handleSubmit}
            className="custom-scrollbar"
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: 'clamp(14px, 3vw, 24px)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              minHeight: 0
            }}
          >
            {/* SERVER ERROR ALERT */}
            {serverError && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: 'var(--color-danger, #ef4444)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <AlertCircle size={18} flexShrink={0} />
                <span>{serverError}</span>
              </div>
            )}

            {/* 1. USER TYPE SELECTOR SECTION (COMBO DROPDOWN) */}
            <div>
              <FloatingSelect
                id="select-user-type"
                label={t('identity.userTypeLabel')}
                required
                value={userType}
                onChange={(e) => {
                  setUserType(e.target.value);
                  setFieldErrors(prev => ({ ...prev, tenantId: undefined, departmentId: undefined }));
                }}
              >
                <option value="IT_PARK_USER" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                  {t('identity.userTypeItPark')}
                </option>
                <option value="TENANT_REP" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                  {t('identity.userTypeTenant')}
                </option>
              </FloatingSelect>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: 0 }} />

            {/* 2. PERSONAL INFORMATION SECTION */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  marginBottom: '14px'
                }}
              >
                {t('identity.sectionPersonalInfo')}
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* First Name & Last Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <FloatingInput
                    id="input-first-name"
                    label={t('identity.firstName')}
                    required
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      if (fieldErrors.firstName) setFieldErrors(prev => ({ ...prev, firstName: undefined }));
                    }}
                    error={fieldErrors.firstName}
                    placeholder=""
                  />
                  <FloatingInput
                    id="input-last-name"
                    label={t('identity.lastName')}
                    required
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      if (fieldErrors.lastName) setFieldErrors(prev => ({ ...prev, lastName: undefined }));
                    }}
                    error={fieldErrors.lastName}
                    placeholder=""
                  />
                </div>

                {/* Middle Name & Business Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <FloatingInput
                    id="input-middle-name"
                    label={t('identity.middleName')}
                    optional
                    value={middleName}
                    onChange={(e) => setMiddleName(e.target.value)}
                    placeholder=""
                  />
                  <FloatingInput
                    id="input-email"
                    type="email"
                    label={t('identity.businessEmail')}
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: undefined }));
                    }}
                    error={fieldErrors.email}
                    placeholder=""
                  />
                </div>

                {/* Phone Number & Job Title */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <FloatingInput
                    id="input-phone"
                    type="tel"
                    label={t('identity.phoneNumber')}
                    optional
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder=""
                  />
                  <FloatingInput
                    id="input-job-title"
                    label={t('identity.jobTitle')}
                    optional
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder=""
                  />
                </div>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: 0 }} />

            {/* 3. ORGANIZATION & ACCESS SECTION (DYNAMIC BY MODE) */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  marginBottom: '14px'
                }}
              >
                {userType === 'TENANT_REP' ? t('identity.sectionTenantAccess') : t('identity.sectionOrgAccess')}
              </label>

              {/* ── Business Park (Read-Only, fetched from DB) ── */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  {t('identity.businessPark')}
                </label>
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'rgba(99, 102, 241, 0.06)',
                    border: '1px solid rgba(99, 102, 241, 0.18)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Landmark size={18} color="var(--accent-primary)" />
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {businessParkName || 'Loading...'}
                    </span>
                    {businessParkCode && (
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: 'rgba(99, 102, 241, 0.12)',
                          color: 'var(--accent-primary)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.3px'
                        }}
                      >
                        {businessParkCode}
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: 'rgba(16, 185, 129, 0.12)',
                      color: 'var(--color-success, #10b981)',
                      textTransform: 'uppercase'
                    }}
                  >
                    {t('identity.autoFilled')}
                  </span>
                </div>
              </div>

              {userType === 'IT_PARK_USER' ? (
                /* ── IT PARK USER MODE ── */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Department */}
                  <FloatingSelect
                    id="select-department"
                    label={t('identity.department')}
                    required
                    value={departmentId}
                    onChange={(e) => {
                      setDepartmentId(e.target.value);
                      if (fieldErrors.departmentId) setFieldErrors(prev => ({ ...prev, departmentId: undefined }));
                    }}
                    error={fieldErrors.departmentId}
                  >
                    <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                      {t('identity.selectDepartment')}
                    </option>
                    {departments.map((d) => (
                      <option key={d.DepartmentID} value={d.DepartmentID} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                        {d.DepartmentName} ({d.DepartmentCode})
                      </option>
                    ))}
                  </FloatingSelect>

                  {/* Role Selector Combobox Dropdown */}
                  <FloatingSelect
                    id="select-it-park-role"
                    label={t('identity.role')}
                    required
                    value={itParkRoleCode}
                    onChange={(e) => setItParkRoleCode(e.target.value)}
                  >
                    {IT_PARK_ROLES.map(role => {
                      const roleText = role.code === 'EMPLOYEE'
                        ? `${t('identity.roleEmployeeLabel')} — ${t('identity.roleEmployeeDesc')}`
                        : role.code === 'TECHNICIAN'
                          ? `${t('identity.roleTechnicianLabel')} — ${t('identity.roleTechnicianDesc')}`
                          : `${t('identity.roleManagerLabel')} — ${t('identity.roleManagerDesc')}`;
                      return (
                        <option key={role.code} value={role.code} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                          {roleText}
                        </option>
                      );
                    })}
                  </FloatingSelect>
                </div>
              ) : (
                /* ── TENANT REPRESENTATIVE MODE ── */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Tenant Searchable Combobox with Floating Label */}
                  <div>
                    <div ref={tenantComboboxRef} style={{ position: 'relative' }}>
                      <div
                        style={{
                          position: 'relative',
                          borderRadius: '10px',
                          border: fieldErrors.tenantId
                            ? '1.5px solid var(--color-danger, #ef4444)'
                            : isTenantDropdownOpen
                              ? '2px solid var(--accent-primary, #6366f1)'
                              : '1px solid var(--glass-border, rgba(255,255,255,0.18))',
                          background: 'var(--bg-tertiary)',
                          boxShadow: isTenantDropdownOpen ? '0 0 0 3.5px rgba(99,102,241,0.15)' : 'none',
                          transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                          cursor: 'pointer'
                        }}
                        onClick={() => setIsTenantDropdownOpen(!isTenantDropdownOpen)}
                      >
                        <label
                          style={{
                            position: 'absolute', left: '13px',
                            top: (isTenantDropdownOpen || selectedTenantObj) ? '0px' : '50%',
                            transform: 'translateY(-50%)',
                            fontSize: (isTenantDropdownOpen || selectedTenantObj) ? '0.73rem' : '0.88rem',
                            fontWeight: (isTenantDropdownOpen || selectedTenantObj) ? 700 : 400,
                            color: fieldErrors.tenantId
                              ? 'var(--color-danger, #ef4444)'
                              : isTenantDropdownOpen
                                ? 'var(--accent-primary, #6366f1)'
                                : 'var(--text-muted, #94a3b8)',
                            background: (isTenantDropdownOpen || selectedTenantObj) ? 'var(--bg-secondary, #0f172a)' : 'transparent',
                            padding: (isTenantDropdownOpen || selectedTenantObj) ? '0 6px' : '0',
                            borderRadius: '4px',
                            pointerEvents: 'none',
                            transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)',
                            zIndex: 2
                          }}
                        >
                          {t('identity.tenantOrganization')} *
                        </label>
                        <div style={{ padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '48px' }}>
                          {selectedTenantObj ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Building2 size={16} color="var(--accent-primary)" />
                              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{selectedTenantObj.CompanyName || selectedTenantObj.TenantName}</span>
                              {selectedTenantObj.TenantCode && (
                                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>({selectedTenantObj.TenantCode})</span>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: 'transparent', fontSize: '0.9rem' }}>Select...</span>
                          )}
                          <ChevronDown size={16} color="var(--text-muted)" style={{ transition: 'transform 0.2s', transform: isTenantDropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
                        </div>
                      </div>

                      {/* Dropdown Box with Live Search Input */}
                      {isTenantDropdownOpen && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            marginTop: '6px',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--glass-border-accent, var(--glass-border))',
                            borderRadius: '12px',
                            boxShadow: 'var(--shadow-lg)',
                            zIndex: 1200,
                            padding: '8px',
                            maxHeight: '260px',
                            display: 'flex',
                            flexDirection: 'column'
                          }}
                        >
                          {/* Search Filter Input */}
                          <div style={{ position: 'relative', marginBottom: '8px' }}>
                            <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                            <input
                              type="text"
                              value={tenantSearchQuery}
                              onChange={(e) => setTenantSearchQuery(e.target.value)}
                              placeholder={t('identity.searchTenantPlaceholder')}
                              autoFocus
                              style={{
                                width: '100%',
                                padding: '8px 10px 8px 30px',
                                background: 'var(--bg-tertiary)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '6px',
                                color: 'var(--text-primary)',
                                fontSize: '0.82rem',
                                outline: 'none'
                              }}
                            />
                          </div>

                          {/* Options List */}
                          <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
                            {filteredTenants.length === 0 ? (
                              <div style={{ padding: '12px', fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                                {t('identity.noTenantFound')}
                              </div>
                            ) : (
                              filteredTenants.map(t => {
                                const isSelected = String(t.TenantID) === String(tenantId);
                                return (
                                  <div
                                    key={t.TenantID}
                                    onClick={() => {
                                      setTenantId(String(t.TenantID));
                                      setIsTenantDropdownOpen(false);
                                      if (fieldErrors.tenantId) setFieldErrors(prev => ({ ...prev, tenantId: undefined }));
                                    }}
                                    style={{
                                      padding: '8px 12px',
                                      borderRadius: '6px',
                                      cursor: 'pointer',
                                      background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                                      color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)',
                                      fontSize: '0.85rem',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      transition: 'all 0.15s ease'
                                    }}
                                  >
                                    <div>
                                      <span style={{ fontWeight: isSelected ? 700 : 500 }}>{t.CompanyName || t.TenantName}</span>
                                      {t.TenantCode && (
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '6px' }}>({t.TenantCode})</span>
                                      )}
                                    </div>
                                    {isSelected && <Check size={14} color="var(--accent-primary)" />}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {fieldErrors.tenantId && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-danger, #ef4444)', marginTop: '4px', display: 'block' }}>
                        {fieldErrors.tenantId}
                      </span>
                    )}
                  </div>

                  {/* Read-Only Role Badge */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                      {t('identity.role')}
                    </label>
                    <div
                      style={{
                        padding: '14px 18px',
                        borderRadius: '12px',
                        background: 'rgba(217, 119, 6, 0.08)',
                        border: '1px solid rgba(217, 119, 6, 0.25)',
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Building2 size={20} color="#d97706" />
                        <div>
                          <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {t('identity.tenantRepRoleTitle')}
                          </span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>
                            {t('identity.tenantRepRoleDesc')}
                          </span>
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: 'rgba(217, 119, 6, 0.15)',
                          color: '#d97706',
                          textTransform: 'uppercase'
                        }}
                      >
                        {t('identity.systemDetermined')}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: 0 }} />

            {/* 4. ACCOUNT SETTINGS SECTION */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  marginBottom: '14px'
                }}
              >
                {t('identity.sectionAccountSettings')}
              </label>

              <div>
                {/* Invitation Checkbox */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    userSelect: 'none'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={sendInvitation}
                    onChange={(e) => setSendInvitation(e.target.checked)}
                    style={{
                      width: '18px',
                      height: '18px',
                      accentColor: 'var(--accent-primary)',
                      cursor: 'pointer'
                    }}
                  />
                  <span>{t('identity.sendActivationEmail')}</span>
                </label>
              </div>
            </div>

            {/* ── MODAL ACTION BUTTONS ── */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-[var(--glass-border)] mt-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="btn btn-secondary w-full sm:w-auto touch-target-sm"
              >
                {t('common.cancel')}
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary w-full sm:w-auto touch-target-sm"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    <span>{t('identity.creatingUser')}</span>
                  </>
                ) : (
                  <span>{t('identity.btnCreateUser')}</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
