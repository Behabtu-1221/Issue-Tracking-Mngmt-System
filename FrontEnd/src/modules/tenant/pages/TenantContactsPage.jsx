import React from 'react';
import ContactsAddressesTab from '../components/ContactsAddressesTab';

export default function TenantContactsPage() {
  return (
    <div>
{/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
<h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
          Tenant Contacts & Addresses
        </h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Corporate mailing addresses, emergency contacts, and communication channels
</p>
      </div>

      <ContactsAddressesTab />
    </div>
  );
}
