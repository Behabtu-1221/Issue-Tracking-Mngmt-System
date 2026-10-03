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
import { tenantSchemas } from '../../../validation';
import { usePermissionContext } from '../../role-permission-management/contexts/PermissionContext';

export default function ContactsAddressesTab() {
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
              <Phone size={14} /> Contact Channels
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
              <MapPin size={14} /> Registered Addresses
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
              <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>All Tenants</option>
              {tenants.map((t) => (
                <option key={t.TenantID} value={t.TenantID} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                  {t.CompanyName}
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
          <Plus size={16} /> {activeSection === 'contacts' ? 'Add Contact Point' : 'Add Registered Address'}
        </button>
      </div>

      {/* Content Area */}
      {activeSection === 'contacts' ? (
        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading tenant contacts...</div>
          ) : contacts.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No contacts found for target criteria.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '16px 20px' }}>Tenant Company</th>
                  <th style={{ padding: '16px 20px' }}>Type & Label</th>
                  <th style={{ padding: '16px 20px' }}>Contact Value</th>
                  <th style={{ padding: '16px 20px' }}>Primary Flag</th>
                  <th style={{ padding: '16px 20px', textAlign: 'right' }}>Actions</th>
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
                          <Star size={12} fill="#4ade80" /> Primary Channel
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Secondary</span>
                      )}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleContactDelete(c.TenantContactID)}
                        style={{ padding: '6px 10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '4px', color: '#f87171', cursor: 'pointer' }}
                      >
                        <Trash2 size={14} />
                      </button>
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
            <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading addresses...</div>
          ) : addresses.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No addresses found.</div>
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
                  <button
                    onClick={() => handleAddressDelete(a.TenantAddressID)}
                    style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '4px' }}
                  >
                    <Trash2 size={15} />
                  </button>
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

      {/* Modal: Create Contact */}
      {isContactModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--modal-backdrop, rgba(16, 20, 24, 0.78))', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '480px', padding: '28px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)' }}>
              <Phone color="var(--accent-primary)" /> Add Contact Channel
            </h2>

            {errorMsg && Object.keys(contactErrors).length === 0 && (
              <div style={{ padding: '10px 14px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '0.85rem', marginBottom: '16px' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {isParkAdmin && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Tenant *</label>
                  <select
                    value={contactForm.TenantID}
                    onChange={(e) => handleContactFieldChange('TenantID', e.target.value)}
                    onBlur={() => handleContactBlur('TenantID')}
                    style={{
                      width: '100%', padding: '10px', background: 'var(--bg-tertiary)',
                      border: contactErrors.TenantID ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                      borderRadius: '4px', color: 'var(--text-primary)'
                    }}
                  >
                    <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Select Tenant</option>
                    {tenants.map((t) => (
                      <option key={t.TenantID} value={t.TenantID} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                        {t.CompanyName}
                      </option>
                    ))}
                  </select>
                  {contactErrors.TenantID && (
                    <span style={{ fontSize: '0.74rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}>
                      ⚠️ {contactErrors.TenantID}
                    </span>
                  )}
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Contact Type *</label>
                <select
                  value={contactForm.ContactType}
                  onChange={(e) => handleContactFieldChange('ContactType', e.target.value)}
                  onBlur={() => handleContactBlur('ContactType')}
                  style={{
                    width: '100%', padding: '10px', background: 'var(--bg-tertiary)',
                    border: contactErrors.ContactType ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                    borderRadius: '4px', color: 'var(--text-primary)'
                  }}
                >
                  <option value="EMAIL" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>EMAIL</option>
                  <option value="PHONE" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>PHONE</option>
                  <option value="MOBILE" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>MOBILE</option>
                  <option value="FAX" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>FAX</option>
                  <option value="CHAT" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>CHAT / MESSAGING</option>
                </select>
                {contactErrors.ContactType && (
                  <span style={{ fontSize: '0.74rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}>
                    ⚠️ {contactErrors.ContactType}
                  </span>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Label / Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Primary Email, Reception"
                  value={contactForm.Label}
                  onChange={(e) => handleContactFieldChange('Label', e.target.value)}
                  onBlur={() => handleContactBlur('Label')}
                  style={{
                    width: '100%', padding: '10px', background: 'var(--bg-tertiary)',
                    border: contactErrors.Label ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                    borderRadius: '4px', color: 'var(--text-primary)'
                  }}
                />
                {contactErrors.Label && (
                  <span style={{ fontSize: '0.74rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}>
                    ⚠️ {contactErrors.Label}
                  </span>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Contact Value (Email / Number) *</label>
                <input
                  type="text"
                  placeholder={contactForm.ContactType === 'EMAIL' ? 'user@company.com' : '+251 91 123 4567'}
                  value={contactForm.ContactValue}
                  onChange={(e) => handleContactFieldChange('ContactValue', e.target.value)}
                  onBlur={() => handleContactBlur('ContactValue')}
                  style={{
                    width: '100%', padding: '10px', background: 'var(--bg-tertiary)',
                    border: contactErrors.ContactValue ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                    borderRadius: '4px', color: 'var(--text-primary)'
                  }}
                />
                {contactErrors.ContactValue && (
                  <span style={{ fontSize: '0.74rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}>
                    ⚠️ {contactErrors.ContactValue}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="primaryContact"
                  checked={!!contactForm.IsPrimary}
                  onChange={(e) => setContactForm({ ...contactForm, IsPrimary: e.target.checked ? 1 : 0 })}
                />
                <label htmlFor="primaryContact" style={{ fontSize: '0.85rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                  Set as Primary Contact for this Type
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsContactModalOpen(false)}
                  style={{ padding: '10px 18px', background: 'transparent', border: '1px solid var(--glass-border)', borderRadius: '4px', color: 'var(--text-primary)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 20px', background: 'var(--accent-gradient)', border: 'none', borderRadius: '4px', color: '#ffffff', fontWeight: '600', cursor: 'pointer' }}
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Address */}
      {isAddressModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--modal-backdrop, rgba(16, 20, 24, 0.78))', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '540px', padding: '28px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)' }}>
              <MapPin color="var(--accent-primary)" /> Add Registered Address
            </h2>

            {errorMsg && Object.keys(addressErrors).length === 0 && (
              <div style={{ padding: '10px 14px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '0.85rem', marginBottom: '16px' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAddressSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {isParkAdmin && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Tenant *</label>
                  <select
                    value={addressForm.TenantID}
                    onChange={(e) => handleAddressFieldChange('TenantID', e.target.value)}
                    onBlur={() => handleAddressBlur('TenantID')}
                    style={{
                      width: '100%', padding: '10px', background: 'var(--bg-tertiary)',
                      border: addressErrors.TenantID ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                      borderRadius: '4px', color: 'var(--text-primary)'
                    }}
                  >
                    <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Select Tenant</option>
                    {tenants.map((t) => (
                      <option key={t.TenantID} value={t.TenantID} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                        {t.CompanyName}
                      </option>
                    ))}
                  </select>
                  {addressErrors.TenantID && (
                    <span style={{ fontSize: '0.74rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}>
                      ⚠️ {addressErrors.TenantID}
                    </span>
                  )}
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Address Type *</label>
                <select
                  value={addressForm.AddressType}
                  onChange={(e) => handleAddressFieldChange('AddressType', e.target.value)}
                  onBlur={() => handleAddressBlur('AddressType')}
                  style={{
                    width: '100%', padding: '10px', background: 'var(--bg-tertiary)',
                    border: addressErrors.AddressType ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                    borderRadius: '4px', color: 'var(--text-primary)'
                  }}
                >
                  <option value="LEGAL" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>LEGAL</option>
                  <option value="BILLING" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>BILLING</option>
                  <option value="MAILING" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>MAILING</option>
                  <option value="PHYSICAL" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>PHYSICAL</option>
                </select>
                {addressErrors.AddressType && (
                  <span style={{ fontSize: '0.74rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}>
                    ⚠️ {addressErrors.AddressType}
                  </span>
                )}
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Address Line 1 *</label>
                <input
                  type="text"
                  placeholder="e.g. Bole Subcity, Street 45, Bldg 2"
                  value={addressForm.AddressLine1}
                  onChange={(e) => handleAddressFieldChange('AddressLine1', e.target.value)}
                  onBlur={() => handleAddressBlur('AddressLine1')}
                  style={{
                    width: '100%', padding: '10px', background: 'var(--bg-tertiary)',
                    border: addressErrors.AddressLine1 ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                    borderRadius: '4px', color: 'var(--text-primary)'
                  }}
                />
                {addressErrors.AddressLine1 && (
                  <span style={{ fontSize: '0.74rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}>
                    ⚠️ {addressErrors.AddressLine1}
                  </span>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>City *</label>
                <input
                  type="text"
                  placeholder="e.g. Addis Ababa"
                  value={addressForm.City}
                  onChange={(e) => handleAddressFieldChange('City', e.target.value)}
                  onBlur={() => handleAddressBlur('City')}
                  style={{
                    width: '100%', padding: '10px', background: 'var(--bg-tertiary)',
                    border: addressErrors.City ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                    borderRadius: '4px', color: 'var(--text-primary)'
                  }}
                />
                {addressErrors.City && (
                  <span style={{ fontSize: '0.74rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}>
                    ⚠️ {addressErrors.City}
                  </span>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Sub-City</label>
                <input
                  type="text"
                  placeholder="e.g. Bole"
                  value={addressForm.SubCity}
                  onChange={(e) => handleAddressFieldChange('SubCity', e.target.value)}
                  onBlur={() => handleAddressBlur('SubCity')}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', borderRadius: '4px', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Country *</label>
                <input
                  type="text"
                  placeholder="e.g. Ethiopia"
                  value={addressForm.Country}
                  onChange={(e) => handleAddressFieldChange('Country', e.target.value)}
                  onBlur={() => handleAddressBlur('Country')}
                  style={{
                    width: '100%', padding: '10px', background: 'var(--bg-tertiary)',
                    border: addressErrors.Country ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                    borderRadius: '4px', color: 'var(--text-primary)'
                  }}
                />
                {addressErrors.Country && (
                  <span style={{ fontSize: '0.74rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 600 }}>
                    ⚠️ {addressErrors.Country}
                  </span>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Postal Code</label>
                <input
                  type="text"
                  placeholder="e.g. 1000"
                  value={addressForm.PostalCode}
                  onChange={(e) => handleAddressFieldChange('PostalCode', e.target.value)}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', borderRadius: '4px', color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  style={{ padding: '10px 18px', background: 'transparent', border: '1px solid var(--glass-border)', borderRadius: '4px', color: 'var(--text-primary)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 20px', background: 'var(--accent-gradient)', border: 'none', borderRadius: '4px', color: '#ffffff', fontWeight: '600', cursor: 'pointer' }}
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
