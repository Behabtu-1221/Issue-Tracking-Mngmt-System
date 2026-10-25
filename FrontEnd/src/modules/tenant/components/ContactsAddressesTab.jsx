import React, { useState, useEffect } from 'react';
import {
  Phone,
  Mail,
  MapPin,
  Plus,
  Search,
  Star,
  Building2,
  Edit2,
  Trash2,
  Globe,
  FileText
} from 'lucide-react';
import tenantApi from '../api/tenantApi';
import ConfirmDialogModal from '../../../components/common/ConfirmDialogModal';
import AlertDialogModal from '../../../components/common/AlertDialogModal';
import { ActionButton, ActionGroup } from '../../../components/common/ActionButton';
import { ModalCard } from '../../../components/common/ModalCard';
import { FormField } from '../../../components/common/FormField';
import { tenantSchemas } from '../../../validation';
import { usePermissionContext } from '../../role-permission-management/contexts/PermissionContext';
import { useTranslation } from '../../../i18n';

export default function ContactsAddressesTab() {
  const { t } = useTranslation();
  const { isParkAdmin, user } = usePermissionContext();
  const [activeSection, setActiveSection] = useState('contacts'); // 'contacts' | 'addresses'
  const [contacts, setContacts] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tenantFilter, setTenantFilter] = useState('');

  // Glass Dialog Modals State
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'error' });

  const showAlert = (title, message, type = 'error') => {
    setAlertConfig({ isOpen: true, title, message, type });
  };

  // Modals
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [contactErrors, setContactErrors] = useState({});
  const [addressErrors, setAddressErrors] = useState({});
  const [errorMsg, setErrorMsg] = useState('');

  // Contact Form
  const [contactForm, setContactForm] = useState({
    TenantID: '',
    ContactType: 'EMAIL',
    Label: 'Main Office Email',
    ContactValue: '',
    IsPrimary: 0
  });

  // Address Form
  const [addressForm, setAddressForm] = useState({
    TenantID: '',
    AddressType: 'LEGAL',
    Country: 'Ethiopia',
    Region: 'Addis Ababa',
    City: 'Addis Ababa',
    SubCity: '',
    Woreda: '',
    PostalCode: '',
    AddressLine1: '',
    AddressLine2: ''
  });

  const handleContactFieldChange = (field, value) => {
    setContactForm(prev => ({ ...prev, [field]: value }));
    if (contactErrors[field]) {
      setContactErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleContactBlur = (field) => {
    const validation = tenantSchemas.contactForm(contactForm);
    if (validation.errors[field]) {
      setContactErrors(prev => ({ ...prev, [field]: validation.errors[field] }));
    } else {
      setContactErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleAddressFieldChange = (field, value) => {
    setAddressForm(prev => ({ ...prev, [field]: value }));
    if (addressErrors[field]) {
      setAddressErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleAddressBlur = (field) => {
    const validation = tenantSchemas.addressForm(addressForm);
    if (validation.errors[field]) {
      setAddressErrors(prev => ({ ...prev, [field]: validation.errors[field] }));
    } else {
      setAddressErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  useEffect(() => {
    if (!isParkAdmin && (user?.TenantID || user?.tenantId)) {
      setTenantFilter(String(user.TenantID || user.tenantId));
    }
  }, [isParkAdmin, user]);

  useEffect(() => {
    if (activeSection === 'contacts') fetchContacts();
    else fetchAddresses();
  }, [activeSection, tenantFilter]);

  const fetchTenants = async () => {
    try {
      const res = await tenantApi.getTenants({ limit: 200 });
      const raw = res.data?.data?.tenants || res.data?.data || [];
      setTenants(Array.isArray(raw) ? raw : []);
    } catch (err) {
      console.error('Failed to fetch tenants', err);
    }
  };

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const res = await tenantApi.getContacts({ tenantId: tenantFilter });
      const raw = res.data?.data?.contacts || res.data?.data || [];
      setContacts(Array.isArray(raw) ? raw : []);
    } catch (err) {
      console.error('Failed to fetch contacts', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const res = await tenantApi.getAddresses({ tenantId: tenantFilter });
      const raw = res.data?.data?.addresses || res.data?.data || [];
      setAddresses(Array.isArray(raw) ? raw : []);
    } catch (err) {
      console.error('Failed to fetch addresses', err);
    } finally {
      setLoading(false);
    }
  };

  // Contact Handlers
  const handleOpenContactCreate = () => {
    setEditingItem(null);
    const defaultTenantId = (!isParkAdmin && (user?.TenantID || user?.tenantId))
      ? String(user.TenantID || user.tenantId)
      : (tenants[0]?.TenantID ? String(tenants[0].TenantID) : '');
    setContactForm({
      TenantID: defaultTenantId,
      ContactType: 'EMAIL',
      Label: 'Primary Contact',
      ContactValue: '',
      IsPrimary: 0
    });
    setContactErrors({});
    setErrorMsg('');
    setIsContactModalOpen(true);
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactErrors({});
    setErrorMsg('');

    const validation = tenantSchemas.contactForm(contactForm);
    if (!validation.isValid) {
      setContactErrors(validation.errors);
      setErrorMsg('');
      return;
    }

    try {
      if (editingItem) {
        await tenantApi.updateContact(editingItem.TenantContactID, validation.sanitized);
      } else {
        await tenantApi.createContact(validation.sanitized);
      }
      setIsContactModalOpen(false);
      fetchContacts();
    } catch (err) {
      const msg = err.response?.data?.message || 'Operation failed';
      setErrorMsg(msg);
      if (err.response?.data?.details && Array.isArray(err.response.data.details)) {
        const beErrors = {};
        err.response.data.details.forEach(d => {
          if (d.field) beErrors[d.field] = d.message;
        });
        setContactErrors(beErrors);
      }
    }
  };

  const handleContactDelete = (id) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Remove Contact Channel',
      message: 'Are you sure you want to delete this communication contact channel?',
      type: 'danger',
      confirmText: 'Delete Contact',
      onConfirm: async () => {
        try {
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          await tenantApi.deleteContact(id);
          fetchContacts();
        } catch (err) {
          const msg = err.response?.data?.message || 'Failed to delete contact';
          showAlert('Action Failed', msg, 'error');
        }
      }
    });
  };

  // Address Handlers
  const handleOpenAddressCreate = () => {
    setEditingItem(null);
    const defaultTenantId = (!isParkAdmin && (user?.TenantID || user?.tenantId))
      ? String(user.TenantID || user.tenantId)
      : (tenants[0]?.TenantID ? String(tenants[0].TenantID) : '');
    setAddressForm({
      TenantID: defaultTenantId,
      AddressType: 'LEGAL',
      Country: 'Ethiopia',
      Region: 'Addis Ababa',
      City: 'Addis Ababa',
      SubCity: 'Bole',
      Woreda: '03',
      PostalCode: '1000',
      AddressLine1: '',
      AddressLine2: ''
    });
    setAddressErrors({});
    setErrorMsg('');
    setIsAddressModalOpen(true);
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    setAddressErrors({});
    setErrorMsg('');

    const validation = tenantSchemas.addressForm(addressForm);
    if (!validation.isValid) {
      setAddressErrors(validation.errors);
      setErrorMsg('');
      return;
    }

    try {
      if (editingItem) {
        await tenantApi.updateAddress(editingItem.TenantAddressID, validation.sanitized);
      } else {
        await tenantApi.createAddress(validation.sanitized);
      }
      setIsAddressModalOpen(false);
      fetchAddresses();
    } catch (err) {
      const msg = err.response?.data?.message || 'Operation failed';
      setErrorMsg(msg);
      if (err.response?.data?.details && Array.isArray(err.response.data.details)) {
        const beErrors = {};
        err.response.data.details.forEach(d => {
          if (d.field) beErrors[d.field] = d.message;
        });
        setAddressErrors(beErrors);
      }
    }
  };

  const handleAddressDelete = (id) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Remove Address Record',
      message: 'Are you sure you want to delete this physical location address record?',
      type: 'danger',
      confirmText: 'Delete Address',
      onConfirm: async () => {
        try {
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          await tenantApi.deleteAddress(id);
          fetchAddresses();
        } catch (err) {
          const msg = err.response?.data?.message || 'Failed to delete address';
          showAlert('Action Failed', msg, 'error');
        }
      }
    });
  };

  return (
    <div>
      {/* Top Toggle & Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-secondary)', padding: '4px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--glass-border)' }}>
            <button
              onClick={() => setActiveSection('contacts')}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--border-radius-sm)',
                border: 'none',
                background: activeSection === 'contacts' ? 'var(--accent-gradient)' : 'transparent',
                color: activeSection === 'contacts' ? 'white' : 'var(--text-muted)',
                fontWeight: activeSection === 'contacts' ? '600' : '500',
                cursor: 'pointer',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Phone size={14} /> {t('tenant.contactChannels')}
            </button>
            <button
              onClick={() => setActiveSection('addresses')}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--border-radius-sm)',
                border: 'none',
                background: activeSection === 'addresses' ? 'var(--accent-gradient)' : 'transparent',
                color: activeSection === 'addresses' ? 'white' : 'var(--text-muted)',
                fontWeight: activeSection === 'addresses' ? '600' : '500',
                cursor: 'pointer',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <MapPin size={14} /> {t('tenant.registeredAddresses')}
            </button>
          </div>

          {isParkAdmin && (
            <select
              value={tenantFilter}
              onChange={(e) => setTenantFilter(e.target.value)}
              style={{
                padding: '10px 14px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--border-radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                minWidth: '220px'
              }}
            >
              <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{t('tenant.allTenants')}</option>
              {tenants.map((tn) => (
                <option key={tn.TenantID} value={tn.TenantID} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                  {tn.CompanyName}
                </option>
              ))}
            </select>
          )}
        </div>

        <button
          onClick={activeSection === 'contacts' ? handleOpenContactCreate : handleOpenAddressCreate}
          style={{
            padding: '10px 18px',
            background: 'var(--accent-gradient)',
            border: 'none',
            borderRadius: 'var(--border-radius-sm)',
            color: '#ffffff',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: 'var(--glow-accent)'
          }}
        >
          <Plus size={16} /> {activeSection === 'contacts' ? t('tenant.addContactPoint') : t('tenant.addRegisteredAddress')}
        </button>
      </div>

      {/* Content Area */}
      {activeSection === 'contacts' ? (
        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>{t('tenant.loadingContacts')}</div>
          ) : contacts.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>{t('tenant.noContactsFound')}</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '16px 20px' }}>{t('tenant.tenantCompany')}</th>
                  <th style={{ padding: '16px 20px' }}>{t('tenant.typeAndLabel')}</th>
                  <th style={{ padding: '16px 20px' }}>{t('tenant.contactValue')}</th>
                  <th style={{ padding: '16px 20px' }}>{t('tenant.primaryFlag')}</th>
                  <th style={{ padding: '16px 20px', textAlign: 'right' }}>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((c) => (
                  <tr key={c.TenantContactID} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{c.TenantCompanyName}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{c.TenantCode}</div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: '600', color: 'var(--accent-primary)' }}>{c.Label}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.ContactType}</div>
                    </td>
                    <td style={{ padding: '16px 20px', fontWeight: '500', color: 'var(--text-primary)' }}>
                      {c.ContactValue}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      {c.IsPrimary ? (
                        <span style={{ padding: '4px 8px', borderRadius: '4px', background: 'rgba(74, 222, 128, 0.15)', color: '#4ade80', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Star size={12} fill="#4ade80" /> {t('tenant.primaryChannel')}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{t('tenant.secondaryChannel')}</span>
                      )}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <ActionButton
                        variant="delete"
                        onClick={() => handleContactDelete(c.TenantContactID)}
                        title={t('common.delete')}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        /* Address Section Cards */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {loading ? (
            <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>{t('tenant.loadingAddresses')}</div>
          ) : addresses.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>{t('tenant.noAddressesFound')}</div>
          ) : (
            addresses.map((a) => (
              <div className="glass-card" key={a.TenantAddressID} style={{ padding: '20px', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <span style={{ padding: '4px 8px', borderRadius: '4px', background: 'var(--accent-gradient)', fontSize: '0.72rem', fontWeight: '700', color: '#ffffff' }}>
                      {a.AddressType} ADDRESS
                    </span>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: '600', marginTop: '8px', color: 'var(--text-primary)' }}>{a.TenantCompanyName}</h4>
                  </div>
                  <ActionButton
                    variant="delete"
                    size="sm"
                    onClick={() => handleAddressDelete(a.TenantAddressID)}
                    title={t('common.delete')}
                  />
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div><strong style={{ color: 'var(--text-primary)' }}>Line 1:</strong> {a.AddressLine1}</div>
                  {a.AddressLine2 && <div><strong style={{ color: 'var(--text-primary)' }}>Line 2:</strong> {a.AddressLine2}</div>}
                  <div>{a.SubCity ? `${a.SubCity}, ` : ''}{a.City}, {a.Region}</div>
                  <div>{a.Country} {a.PostalCode ? `(${a.PostalCode})` : ''}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal: Create Contact Channel */}
      <ModalCard
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        title="Add Contact Channel"
        subtitle="Register telephone, email, messaging or mobile channels for tenant communication"
        category="Tenant Directory"
        icon={Phone}
        accentStrip="primary"
        maxWidth="500px"
        onSubmit={handleContactSubmit}
        submitText="Save Contact"
        cancelText="Cancel"
        error={errorMsg && Object.keys(contactErrors).length === 0 ? errorMsg : ''}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {isParkAdmin && (
            <FormField label="Tenant *" error={contactErrors.TenantID} icon={Building2}>
              <select
                value={contactForm.TenantID}
                onChange={(e) => handleContactFieldChange('TenantID', e.target.value)}
                onBlur={() => handleContactBlur('TenantID')}
                style={{
                  width: '100%', padding: '10px 14px', background: 'var(--bg-tertiary)',
                  border: `1px solid ${contactErrors.TenantID ? 'var(--color-error, #ef4444)' : 'var(--glass-border)'}`,
                  borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)', fontSize: '0.88rem'
                }}
              >
                <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Select Tenant</option>
                {tenants.map((t) => (
                  <option key={t.TenantID} value={t.TenantID} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                    {t.CompanyName}
                  </option>
                ))}
              </select>
            </FormField>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <FormField label="Contact Type *" error={contactErrors.ContactType} icon={Mail}>
              <select
                value={contactForm.ContactType}
                onChange={(e) => handleContactFieldChange('ContactType', e.target.value)}
                onBlur={() => handleContactBlur('ContactType')}
                style={{
                  width: '100%', padding: '10px 14px', background: 'var(--bg-tertiary)',
                  border: `1px solid ${contactErrors.ContactType ? 'var(--color-error, #ef4444)' : 'var(--glass-border)'}`,
                  borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)', fontSize: '0.88rem'
                }}
              >
                <option value="EMAIL" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>EMAIL</option>
                <option value="PHONE" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>PHONE</option>
                <option value="MOBILE" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>MOBILE</option>
                <option value="FAX" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>FAX</option>
                <option value="CHAT" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>CHAT / MESSAGING</option>
              </select>
            </FormField>

            <FormField label="Label / Title *" error={contactErrors.Label} icon={FileText}>
              <input
                type="text"
                placeholder="e.g. Primary Email, Reception"
                value={contactForm.Label}
                onChange={(e) => handleContactFieldChange('Label', e.target.value)}
                onBlur={() => handleContactBlur('Label')}
                style={{
                  width: '100%', padding: '10px 14px', background: 'var(--bg-tertiary)',
                  border: `1px solid ${contactErrors.Label ? 'var(--color-error, #ef4444)' : 'var(--glass-border)'}`,
                  borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)', fontSize: '0.88rem'
                }}
              />
            </FormField>
          </div>

          <FormField label="Contact Value (Email / Number) *" error={contactErrors.ContactValue} icon={Globe}>
            <input
              type="text"
              placeholder={contactForm.ContactType === 'EMAIL' ? 'user@company.com' : '+251 91 123 4567'}
              value={contactForm.ContactValue}
              onChange={(e) => handleContactFieldChange('ContactValue', e.target.value)}
              onBlur={() => handleContactBlur('ContactValue')}
              style={{
                width: '100%', padding: '10px 14px', background: 'var(--bg-tertiary)',
                border: `1px solid ${contactErrors.ContactValue ? 'var(--color-error, #ef4444)' : 'var(--glass-border)'}`,
                borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)', fontSize: '0.88rem'
              }}
            />
          </FormField>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '10px 12px', borderRadius: 'var(--border-radius-sm)', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)' }}>
            <input
              type="checkbox"
              id="primaryContact"
              checked={!!contactForm.IsPrimary}
              onChange={(e) => setContactForm({ ...contactForm, IsPrimary: e.target.checked ? 1 : 0 })}
              style={{ accentColor: 'var(--color-primary, #2563eb)', width: '16px', height: '16px' }}
            />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>
              Set as Primary Contact for this Type
            </span>
          </label>
        </div>
      </ModalCard>

      {/* Modal: Create Address */}
      <ModalCard
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        title="Add Registered Address"
        subtitle="Configure physical, legal, billing or mailing premises address"
        category="Tenant Premises"
        icon={MapPin}
        accentStrip="primary"
        maxWidth="600px"
        onSubmit={handleAddressSubmit}
        submitText="Save Address"
        cancelText="Cancel"
        error={errorMsg && Object.keys(addressErrors).length === 0 ? errorMsg : ''}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
            {isParkAdmin && (
              <FormField label="Tenant *" error={addressErrors.TenantID} icon={Building2}>
                <select
                  value={addressForm.TenantID}
                  onChange={(e) => handleAddressFieldChange('TenantID', e.target.value)}
                  onBlur={() => handleAddressBlur('TenantID')}
                  style={{
                    width: '100%', padding: '10px 14px', background: 'var(--bg-tertiary)',
                    border: `1px solid ${addressErrors.TenantID ? 'var(--color-error, #ef4444)' : 'var(--glass-border)'}`,
                    borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)', fontSize: '0.88rem'
                  }}
                >
                  <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Select Tenant</option>
                  {tenants.map((t) => (
                    <option key={t.TenantID} value={t.TenantID} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                      {t.CompanyName}
                    </option>
                  ))}
                </select>
              </FormField>
            )}

            <FormField label="Address Type *" error={addressErrors.AddressType} icon={FileText}>
              <select
                value={addressForm.AddressType}
                onChange={(e) => handleAddressFieldChange('AddressType', e.target.value)}
                onBlur={() => handleAddressBlur('AddressType')}
                style={{
                  width: '100%', padding: '10px 14px', background: 'var(--bg-tertiary)',
                  border: `1px solid ${addressErrors.AddressType ? 'var(--color-error, #ef4444)' : 'var(--glass-border)'}`,
                  borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)', fontSize: '0.88rem'
                }}
              >
                <option value="LEGAL" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>LEGAL</option>
                <option value="BILLING" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>BILLING</option>
                <option value="MAILING" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>MAILING</option>
                <option value="PHYSICAL" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>PHYSICAL</option>
              </select>
            </FormField>
          </div>

          <FormField label="Address Line 1 *" error={addressErrors.AddressLine1} icon={MapPin}>
            <input
              type="text"
              placeholder="e.g. Bole Subcity, Street 45, Bldg 2"
              value={addressForm.AddressLine1}
              onChange={(e) => handleAddressFieldChange('AddressLine1', e.target.value)}
              onBlur={() => handleAddressBlur('AddressLine1')}
              style={{
                width: '100%', padding: '10px 14px', background: 'var(--bg-tertiary)',
                border: `1px solid ${addressErrors.AddressLine1 ? 'var(--color-error, #ef4444)' : 'var(--glass-border)'}`,
                borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)', fontSize: '0.88rem'
              }}
            />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            <FormField label="City *" error={addressErrors.City} icon={MapPin}>
              <input
                type="text"
                placeholder="e.g. Addis Ababa"
                value={addressForm.City}
                onChange={(e) => handleAddressFieldChange('City', e.target.value)}
                onBlur={() => handleAddressBlur('City')}
                style={{
                  width: '100%', padding: '10px 14px', background: 'var(--bg-tertiary)',
                  border: `1px solid ${addressErrors.City ? 'var(--color-error, #ef4444)' : 'var(--glass-border)'}`,
                  borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)', fontSize: '0.88rem'
                }}
              />
            </FormField>

            <FormField label="Sub-City" icon={MapPin}>
              <input
                type="text"
                placeholder="e.g. Bole"
                value={addressForm.SubCity}
                onChange={(e) => handleAddressFieldChange('SubCity', e.target.value)}
                onBlur={() => handleAddressBlur('SubCity')}
                style={{
                  width: '100%', padding: '10px 14px', background: 'var(--bg-tertiary)',
                  border: '1px solid var(--glass-border)', borderRadius: 'var(--border-radius-sm)',
                  color: 'var(--text-primary)', fontSize: '0.88rem'
                }}
              />
            </FormField>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            <FormField label="Country *" error={addressErrors.Country} icon={Globe}>
              <input
                type="text"
                placeholder="e.g. Ethiopia"
                value={addressForm.Country}
                onChange={(e) => handleAddressFieldChange('Country', e.target.value)}
                onBlur={() => handleAddressBlur('Country')}
                style={{
                  width: '100%', padding: '10px 14px', background: 'var(--bg-tertiary)',
                  border: `1px solid ${addressErrors.Country ? 'var(--color-error, #ef4444)' : 'var(--glass-border)'}`,
                  borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)', fontSize: '0.88rem'
                }}
              />
            </FormField>

            <FormField label="Postal Code" icon={FileText}>
              <input
                type="text"
                placeholder="e.g. 1000"
                value={addressForm.PostalCode}
                onChange={(e) => handleAddressFieldChange('PostalCode', e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px', background: 'var(--bg-tertiary)',
                  border: '1px solid var(--glass-border)', borderRadius: 'var(--border-radius-sm)',
                  color: 'var(--text-primary)', fontSize: '0.88rem'
                }}
              />
            </FormField>
          </div>
        </div>
      </ModalCard>

      {/* Shared Glass Modals */}
      <ConfirmDialogModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        confirmText={confirmConfig.confirmText}
        onConfirm={confirmConfig.onConfirm}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />

      <AlertDialogModal
        isOpen={alertConfig.isOpen}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
