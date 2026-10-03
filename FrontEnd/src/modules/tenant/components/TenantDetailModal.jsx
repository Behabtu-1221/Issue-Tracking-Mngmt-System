import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Building2,
  Globe,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Edit2,
  Users,
  MapPin,
  Phone,
  Mail,
  ShieldAlert,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
  Briefcase,
  DollarSign,
  UserCheck
} from 'lucide-react';
import tenantApi from '../api/tenantApi';
import identityApi from '../../identity-access/api/identityApi';

export default function TenantDetailModal({ tenantId, onClose, onEdit, onChangeStatus }) {
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview | leases | allocations | representatives

  const [leases, setLeases] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [representatives, setRepresentatives] = useState([]);
  const [loadingSubData, setLoadingSubData] = useState(false);

  useEffect(() => {
    if (tenantId) {
      fetchTenantDetails();
    }
  }, [tenantId]);

  const fetchTenantDetails = async () => {
    try {
      setLoading(true);
      const res = await tenantApi.getTenantById(tenantId);
      const data = res.data?.data || res.data || null;
      setTenant(data);

      // Fetch deep sub-module records concurrently
      setLoadingSubData(true);
      const [leasesRes, allocRes, usersRes] = await Promise.allSettled([
        tenantApi.getLeases({ tenantId }),
        tenantApi.getAllocations({ tenantId }),
        identityApi.getUsers({ tenantId })
      ]);

      if (leasesRes.status === 'fulfilled') {
        const lList = leasesRes.value.data?.data?.leases || leasesRes.value.data?.data || [];
        setLeases(Array.isArray(lList) ? lList : []);
      }
      if (allocRes.status === 'fulfilled') {
        const aList = allocRes.value.data?.data?.allocations || allocRes.value.data?.data || [];
        setAllocations(Array.isArray(aList) ? aList : []);
      }
      if (usersRes.status === 'fulfilled') {
        const usersData = usersRes.value.data?.data;
        const uList = Array.isArray(usersData) ? usersData : usersData?.users || usersData?.items || [];
        setRepresentatives(Array.isArray(uList) ? uList : []);
      }
    } catch (err) {
      console.error('Failed to load tenant detailed profile', err);
    } finally {
      setLoading(false);
      setLoadingSubData(false);
    }
  };

  if (!tenantId) return null;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 12px', fontSize: '0.8rem' }}>
            <CheckCircle2 size={13} /> Active Tenant
          </span>
        );
      case 'ONBOARDING':
        return (
          <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 12px', fontSize: '0.8rem' }}>
            <Clock size={13} /> Onboarding Stage
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 12px', fontSize: '0.8rem' }}>
            <AlertCircle size={13} /> Suspended
          </span>
        );
      case 'TERMINATED':
        return (
          <span style={{ padding: '5px 12px', borderRadius: '9999px', background: 'rgba(148, 163, 184, 0.2)', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
            Offboarded / Terminated
          </span>
        );
      default:
        return <span className="badge" style={{ padding: '5px 12px', fontSize: '0.8rem' }}>{status}</span>;
    }
  };

  return createPortal(
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'var(--modal-backdrop, rgba(16, 20, 24, 0.78))', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '20px'
    }}>
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--glass-border-accent)',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '880px',
        maxHeight: '90vh',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'fadeIn 0.25s ease-out'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 28px',
          borderBottom: '1px solid var(--glass-border)',
          background: 'var(--bg-tertiary)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '14px',
              background: 'var(--accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--glow-accent)',
              color: 'white'
            }}>
              <Building2 size={26} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {loading ? 'Loading Corporate Profile...' : tenant?.CompanyName}
                </h2>
                {tenant && getStatusBadge(tenant.Status)}
              </div>
              <div style={{ fontSize: '0.83rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span>Code: <strong style={{ color: 'var(--accent-primary)', fontFamily: 'monospace' }}>{tenant?.TenantCode || '—'}</strong></span>
                <span>•</span>
                <span>Business Park: <strong style={{ color: 'var(--text-primary)' }}>{tenant?.BusinessParkName || 'Main Campus'}</strong></span>
                {tenant?.Website && (
                  <>
                    <span>•</span>
                    <a
                      href={tenant.Website.startsWith('http') ? tenant.Website : `https://${tenant.Website}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: 'var(--accent-primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
                    >
                      <Globe size={13} /> {tenant.Website} <ExternalLink size={11} />
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {tenant && onEdit && (
              <button
                onClick={() => { onClose(); onEdit(tenant); }}
                title="Edit Corporate Record"
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 14px', borderRadius: 'var(--border-radius-sm)',
                  background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                  color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600
                }}
              >
                <Edit2 size={14} /> Edit Profile
              </button>
            )}
            {tenant && onChangeStatus && (
              <button
                onClick={() => { onClose(); onChangeStatus(tenant); }}
                title="Transition Account Status Lifecycle"
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 14px', borderRadius: 'var(--border-radius-sm)',
                  background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)',
                  color: 'var(--color-warning)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600
                }}
              >
                <ShieldAlert size={14} /> Status Action
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                background: 'transparent', border: 'none',
                color: 'var(--text-muted)', cursor: 'pointer', padding: '6px',
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Modal Tab Controls */}
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '12px 28px',
          background: 'var(--bg-tertiary)',
          borderBottom: '1px solid var(--glass-border)',
          flexShrink: 0,
          overflowX: 'auto'
        }}>
          {[
            { id: 'overview', label: 'Corporate Overview', icon: Building2 },
            { id: 'leases', label: `Lease Contracts (${leases.length})`, icon: FileText },
            { id: 'allocations', label: `Office Spaces (${allocations.length})`, icon: Layers },
            { id: 'representatives', label: `Representatives & Users (${representatives.length})`, icon: Users }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: 'var(--border-radius-sm)',
                  border: 'none',
                  background: isActive ? 'var(--accent-gradient)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-muted)',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: isActive ? 'var(--glow-accent)' : 'none'
                }}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div style={{ padding: '28px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              <Clock className="spin" size={32} style={{ marginBottom: '16px' }} />
              <p>Retrieving enterprise tenant records...</p>
            </div>
          ) : !tenant ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              <AlertCircle size={40} style={{ opacity: 0.4, marginBottom: '12px' }} />
              <p>Tenant record unavailable or removed.</p>
            </div>
          ) : activeTab === 'overview' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Architecture Summary Statistics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                <div style={{
                  padding: '18px', borderRadius: '16px',
                  background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                  display: 'flex', alignItems: 'center', gap: '14px'
                }}>
                  <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
                    <FileText size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Lease Contracts</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{tenant.LeaseCount || leases.length || 0}</div>
                  </div>
                </div>

                <div style={{
                  padding: '18px', borderRadius: '16px',
                  background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                  display: 'flex', alignItems: 'center', gap: '14px'
                }}>
                  <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-success)' }}>
                    <Layers size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Allocated Spaces</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{tenant.ActiveAllocationCount || allocations.length || 0}</div>
                  </div>
                </div>

                <div style={{
                  padding: '18px', borderRadius: '16px',
                  background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                  display: 'flex', alignItems: 'center', gap: '14px'
                }}>
                  <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(14, 165, 233, 0.15)', color: 'var(--color-info)' }}>
                    <UserCheck size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Representatives</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{tenant.ContactCount || representatives.length || 0}</div>
                  </div>
                </div>

                <div style={{
                  padding: '18px', borderRadius: '16px',
                  background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                  display: 'flex', alignItems: 'center', gap: '14px'
                }}>
                  <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--color-warning)' }}>
                    <Users size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Sub-Tenants</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{tenant.SubTenantCount || 0}</div>
                  </div>
                </div>
              </div>

              {/* Legal & Organizational Profile Grid */}
              <div style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--glass-border)',
                borderRadius: '18px',
                padding: '24px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '20px'
              }}>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
                    Registration Number
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                    {tenant.RegistrationNumber || 'Not Registered'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
                    Tax Identification (TIN)
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                    {tenant.TaxIdentificationNo || 'Not Provided'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
                    Industry Sector
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {tenant.IndustryName || 'General Enterprise'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
                    Tenant Entity Type
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {tenant.TenantTypeName || 'Commercial Tenant'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
                    Onboarded Date
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} color="var(--accent-primary)" />
                    {tenant.OnboardedDate ? new Date(tenant.OnboardedDate).toLocaleDateString() : 'Pending'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
                    Offboarded Date
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {tenant.OffboardedDate ? new Date(tenant.OffboardedDate).toLocaleDateString() : 'Active Member'}
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'leases' ? (
            <div>
              {leases.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  <FileText size={36} style={{ opacity: 0.4, marginBottom: '12px' }} />
                  <p>No active or historical lease contracts linked to this tenant.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {leases.map(lease => (
                    <div
                      key={lease.LeaseAgreementID || lease.id}
                      style={{
                        padding: '18px 20px',
                        borderRadius: '16px',
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--glass-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '16px'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                            {lease.LeaseCode || `LEASE-#${lease.LeaseAgreementID}`}
                          </span>
                          <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>
                            {lease.LeaseTypeCode || 'Commercial'}
                          </span>
                          <span className={`badge ${lease.Status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`}>
                            {lease.Status || 'ACTIVE'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px', display: 'flex', gap: '14px' }}>
                          <span>Start: <strong>{lease.StartDate ? new Date(lease.StartDate).toLocaleDateString() : 'N/A'}</strong></span>
                          <span>End: <strong>{lease.EndDate ? new Date(lease.EndDate).toLocaleDateString() : 'N/A'}</strong></span>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                          <DollarSign size={16} />
                          {Number(lease.MonthlyRentAmount || lease.AgreedAmount || 0).toLocaleString()} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ mo</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          SLA Tier: {lease.SLAComplexityLevel || 'Standard'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'allocations' ? (
            <div>
              {allocations.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  <Layers size={36} style={{ opacity: 0.4, marginBottom: '12px' }} />
                  <p>No office spaces currently allocated for this tenant.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                  {allocations.map(alloc => (
                    <div
                      key={alloc.OfficeAllocationID || alloc.id}
                      style={{
                        padding: '18px',
                        borderRadius: '16px',
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--glass-border)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                          🏢 {alloc.SpaceName || alloc.OfficeName || `Office #${alloc.OfficeSpaceID}`}
                        </div>
                        <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>Allocated</span>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div>Building: <strong style={{ color: 'var(--text-primary)' }}>{alloc.BuildingName || 'Main Building'}</strong></div>
                        <div>Floor: <strong style={{ color: 'var(--accent-primary)' }}>Floor {alloc.FloorNumber || 1}</strong></div>
                        <div>Area: <strong style={{ color: 'var(--text-primary)' }}>{alloc.AllocatedAreaSqM || alloc.UsableAreaSqM || 0} sq.m</strong></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'representatives' ? (
            <div>
              {representatives.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  <Users size={36} style={{ opacity: 0.4, marginBottom: '12px' }} />
                  <p>No registered tenant users or representatives found for this organization.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                  {representatives.map(rep => {
                    const isPrimary = rep.UserTypeCode === 'TENANT_REPRESENTATIVE' || rep.UserTypeCode === 'COMPANY_ADMIN' || rep.UserTypeCode === 'TENANT_ADMIN' || rep.IsPrimary;
                    return (
                      <div
                        key={rep.UserID || rep.TenantRepresentativeID || rep.id}
                        style={{
                          padding: '18px',
                          borderRadius: '16px',
                          background: 'var(--bg-tertiary)',
                          border: '1px solid var(--glass-border)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                            {rep.FirstName ? `${rep.FirstName} ${rep.LastName || ''}`.trim() : rep.RepresentativeName || rep.Username || 'Tenant User'}
                          </div>
                          {isPrimary ? (
                            <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>Tenant Rep</span>
                          ) : (
                            <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>{rep.UserTypeCode || 'Staff'}</span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{rep.JobTitle || rep.Designation || rep.UserTypeCode || 'Authorized Liaison'}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                          {rep.Email && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Mail size={13} color="var(--accent-primary)" /> {rep.Email}
                            </div>
                          )}
                          {(rep.PhoneNumber || rep.MobileNumber) && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Phone size={13} color="var(--color-success)" /> {rep.PhoneNumber || rep.MobileNumber}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  );
}
