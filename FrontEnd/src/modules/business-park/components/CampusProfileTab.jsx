import React, { useState, useEffect } from 'react';
import {
  Building2, MapPin, Globe, Mail, Phone, ShieldCheck, Edit, Plus, RefreshCw,
  Zap, FileText, CheckCircle2, Compass, Clock, DollarSign, ExternalLink,
  Layers, AlertCircle, Sparkles, Building, ChevronRight, Activity
} from 'lucide-react';
import parkApi from '../api/parkApi';
import BusinessParkFormModal from './BusinessParkFormModal';

export default function CampusProfileTab() {
  const [park, setPark] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchPrimaryPark = async () => {
    setLoading(true);
    try {
      const res = await parkApi.getParks({ limit: 1 });
      if (res.data && res.data.status === 'success') {
        const parksList = res.data.data?.parks || res.data.data || [];
        if (Array.isArray(parksList) && parksList.length > 0) {
          setPark(parksList[0]);
        } else {
          setPark(null);
        }
      }
    } catch (err) {
      console.error('Failed to load primary business park:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrimaryPark();
  }, []);

  if (loading) {
    return (
      <div style={{
        padding: '60px', textAlign: 'center', background: 'var(--bg-secondary)',
        borderRadius: '20px', border: '1px solid var(--glass-border)', color: 'var(--text-muted)'
      }}>
        <RefreshCw size={28} className="animate-spin" style={{ color: 'var(--accent-primary)', marginBottom: '12px' }} />
        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Loading Central Business Park Profile...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {!park ? (
        /* FIRST TIME REGISTRATION SETUP HERO CARD */
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: '24px', border: '1px solid var(--glass-border-accent)',
          padding: '48px 36px', textAlign: 'center', boxShadow: 'var(--shadow-lg)',
          backdropFilter: 'blur(16px)'
        }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '24px', margin: '0 auto 20px',
            background: 'var(--accent-gradient)', color: '#ffffff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--glow-accent)'
          }}>
            <Building2 size={36} />
          </div>

          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 10px', color: 'var(--text-primary)', fontFamily: "'Outfit', sans-serif" }}>
            No Primary Business Park Registered
          </h2>
          <p style={{ maxWidth: '600px', margin: '0 auto 28px', color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6' }}>
            Register your central Business Park profile parameters (Identity, Legal TIN, Geo Address, TimeZone & Currency defaults) to initialize tenant leasing, building topology, and service operations platform-wide.
          </p>

          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: '14px 32px', borderRadius: '14px', border: 'none',
              background: 'var(--accent-gradient)', color: '#ffffff', fontWeight: 800,
              fontSize: '0.95rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '10px',
              boxShadow: 'var(--glow-accent)', transition: 'all 0.2s'
            }}
          >
            <Sparkles size={18} /> Register Primary Park Profile Now
          </button>
        </div>
      ) : (
        /* REGISTERED EXECUTIVE PARK OVERVIEW DASHBOARD */
        <>
          {/* Top Hero Banner */}
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: '24px', border: '1px solid var(--glass-border-accent)',
            padding: '28px 32px', boxShadow: 'var(--shadow-lg)',
            position: 'relative', overflow: 'hidden', backdropFilter: 'blur(16px)'
          }}>
            {/* Top Multi-Tone Brand Line Accent */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
              background: 'linear-gradient(90deg, #2563eb 0%, #7c3aed 40%, #0284c7 75%, #10b981 100%)'
            }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{
                  width: '76px', height: '76px', borderRadius: '20px', overflow: 'hidden',
                  background: 'var(--bg-tertiary)', border: '2px solid var(--glass-border-accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  {park.LogoPath ? (
                    <img src={park.LogoPath} alt={park.BusinessParkName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
                  ) : (
                    <Building2 size={38} color="var(--accent-primary)" />
                  )}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800,
                      background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.4)',
                      color: 'var(--accent-primary)', fontFamily: 'monospace'
                    }}>
                      CODE: {park.BusinessParkCode}
                    </span>

                    <span style={{
                      padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800,
                      background: park.IsOperational ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      border: park.IsOperational ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
                      color: park.IsOperational ? 'var(--color-success)' : 'var(--color-danger)',
                      display: 'inline-flex', alignItems: 'center', gap: '6px'
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: park.IsOperational ? 'var(--color-success)' : 'var(--color-danger)' }} />
                      {park.IsOperational ? 'Operational Park' : 'Maintenance / Offline'}
                    </span>
                  </div>

                  <h2 style={{ fontSize: '1.65rem', fontWeight: 800, margin: '0 0 4px', color: 'var(--text-primary)', fontFamily: "'Outfit', sans-serif" }}>
                    {park.BusinessParkName}
                  </h2>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={14} color="var(--accent-primary)" />
                    {park.AddressLine1 || park.City}, {park.City}, {park.Country}
                    {park.ShortName ? ` • (${park.ShortName})` : ''}
                  </p>
                </div>
              </div>

              {/* ACTION BUTTON: EDIT CAMPUS PARAMETERS */}
              <button
                onClick={() => setShowModal(true)}
                style={{
                  padding: '12px 24px', borderRadius: '12px', border: 'none',
                  background: 'var(--accent-gradient)', color: '#ffffff', fontWeight: 800,
                  fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                  boxShadow: 'var(--glow-accent)', transition: 'all 0.2s'
                }}
              >
                <Edit size={16} /> Edit Park Parameters
              </button>
            </div>
          </div>

          {/* 4 Structured Information Glass Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>

            {/* CARD 1: IDENTITY & LEGAL */}
            <div style={{
              background: 'var(--bg-secondary)', borderRadius: '20px',
              border: '1px solid var(--glass-border)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-primary)', fontWeight: 800, fontSize: '0.9rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
                <Building2 size={18} /> Identity & Legal Registration
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Unique Code</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{park.BusinessParkCode || '—'}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Short Name</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{park.ShortName || '—'}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Reg. Number</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>{park.RegistrationNumber || '—'}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Tax ID (TIN)</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>{park.TaxIdentificationNo || '—'}</div>
                </div>
              </div>

              {park.TotalAreaSquareMeter && (
                <div style={{ background: 'var(--bg-tertiary)', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Gross Footprint Area:</span>
                  <strong style={{ fontSize: '0.88rem', color: 'var(--accent-primary)' }}>{Number(park.TotalAreaSquareMeter).toLocaleString()} m²</strong>
                </div>
              )}

              {park.Description && (
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>Overview</div>
                  <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{park.Description}</div>
                </div>
              )}
            </div>

            {/* CARD 2: CONTACT & COMMUNICATIONS */}
            <div style={{
              background: 'var(--bg-secondary)', borderRadius: '20px',
              border: '1px solid var(--glass-border)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-info)', fontWeight: 800, fontSize: '0.9rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
                <Mail size={18} /> Contact & Digital Channels
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(14, 165, 233, 0.12)', color: 'var(--color-info)' }}>
                    <Mail size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Contact Email</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>{park.Email || '—'}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(14, 165, 233, 0.12)', color: 'var(--color-info)' }}>
                    <Phone size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Landline Phone</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>{park.PhoneNumber || '—'}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(14, 165, 233, 0.12)', color: 'var(--color-info)' }}>
                    <Phone size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Mobile Hotline</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>{park.MobileNumber || '—'}</div>
                  </div>
                </div>

                {park.Website && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(14, 165, 233, 0.12)', color: 'var(--color-info)' }}>
                      <Globe size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Website Portal</div>
                      <a href={park.Website.startsWith('http') ? park.Website : `https://${park.Website}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-info)', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                        {park.Website} <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* CARD 3: LOCATION & BOUNDARY */}
            <div style={{
              background: 'var(--bg-secondary)', borderRadius: '20px',
              border: '1px solid var(--glass-border)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-success)', fontWeight: 800, fontSize: '0.9rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
                <MapPin size={18} /> Location & Boundary Address
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Country</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>{park.Country || 'Ethiopia'}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>City</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>{park.City || 'Addis Ababa'}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>SubCity</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>{park.SubCity || '—'}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Woreda</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>{park.Woreda || '—'}</div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Street Address</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {park.AddressLine1 || 'Main Campus Gate'} {park.AddressLine2 ? `• ${park.AddressLine2}` : ''}
                </div>
              </div>

              {(park.Latitude || park.Longitude) && (
                <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.25)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Compass size={16} color="var(--color-success)" />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>GPS:</span>
                  <strong style={{ fontSize: '0.83rem', color: 'var(--color-success)', fontFamily: 'monospace' }}>
                    {park.Latitude || '0.000'}, {park.Longitude || '0.000'}
                  </strong>
                </div>
              )}
            </div>

            {/* CARD 4: SYSTEM REGIONAL & DEFAULTS */}
            <div style={{
              background: 'var(--bg-secondary)', borderRadius: '20px',
              border: '1px solid var(--glass-border)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-secondary)', fontWeight: 800, fontSize: '0.9rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
                <Globe size={18} /> System & Regional Defaults
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>TimeZone</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>{park.TimeZone || 'Africa/Addis_Ababa'}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Currency</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>{park.CurrencyCode || 'ETB'}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Language</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>{park.LanguageCode || 'en'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                <div style={{
                  flex: 1, padding: '10px 14px', borderRadius: '12px',
                  background: park.IsOperational ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: park.IsOperational ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                  color: park.IsOperational ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 800, fontSize: '0.82rem', textAlign: 'center'
                }}>
                  {park.IsOperational ? 'Operational' : 'Offline'}
                </div>

                <div style={{
                  flex: 1, padding: '10px 14px', borderRadius: '12px',
                  background: park.IsActive ? 'rgba(99, 102, 241, 0.1)' : 'rgba(148, 163, 184, 0.1)',
                  border: park.IsActive ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid rgba(148, 163, 184, 0.3)',
                  color: park.IsActive ? 'var(--accent-primary)' : 'var(--text-muted)', fontWeight: 800, fontSize: '0.82rem', textAlign: 'center'
                }}>
                  {park.IsActive ? 'Active Record' : 'Deactivated'}
                </div>
              </div>
            </div>

          </div>
        </>
      )}

      {/* BUSINESS PARK REGISTRATION & EDITING MODAL */}
      <BusinessParkFormModal
        isOpen={showModal}
        initialData={park}
        onClose={() => setShowModal(false)}
        onSuccess={() => {
          setShowModal(false);
          fetchPrimaryPark();
        }}
      />
    </div>
  );
}
