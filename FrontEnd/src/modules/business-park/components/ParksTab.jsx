import React, { useState, useEffect } from 'react';
import {
  Building2,
  Search,
  Plus,
  RefreshCw,
  Edit,
  Trash2,
  MapPin,
  Globe,
  Mail,
  Phone,
  X,
  Check,
  Grid,
  List,
  Zap,
  ShieldCheck
} from 'lucide-react';
import parkApi from '../api/parkApi';
import ConfirmDialogModal from '../../../components/common/ConfirmDialogModal';
import AlertDialogModal from '../../../components/common/AlertDialogModal';
import BusinessParkFormModal from './BusinessParkFormModal';
import { ActionButton, ActionGroup } from '../../../components/common/ActionButton';
import { parkSchemas } from '../../../validation';
import { useTranslation } from '../../../i18n';

export default function ParksTab() {
  const { t } = useTranslation();
  const [parks, setParks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // grid | table

  // Glass Dialog Modals State
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'error' });

  const showAlert = (title, message, type = 'error') => {
    setAlertConfig({ isOpen: true, title, message, type });
  };

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPark, setSelectedPark] = useState(null);

  const fetchParks = async () => {
    setLoading(true);
    try {
      const res = await parkApi.getParks({ search: searchTerm });
      if (res.data && res.data.status === 'success') {
        const rawParks = res.data?.data?.parks || res.data?.data || [];
        setParks(Array.isArray(rawParks) ? rawParks : []);
      }
    } catch (err) {
      console.error('Failed to load business parks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParks();
  }, [searchTerm]);

  const promptDeletePark = (park) => {
    if (
      park.BusinessParkName?.toLowerCase().includes('ethiopian it park') ||
      park.BusinessParkID === 1 ||
      parks.length <= 1
    ) {
      showAlert(
        'Action Prohibited',
        'Ethiopian IT Park is the designated sole campus of this system and cannot be decommissioned or deleted.',
        'warning'
      );
      return;
    }

    setSelectedPark(park);
    setConfirmConfig({
      isOpen: true,
      title: t('common.delete'),
      message: `Are you sure you want to delete campus "${park.BusinessParkName}"? Associated buildings and tenant locations will be affected.`,
      type: 'danger',
      confirmText: t('common.delete'),
      onConfirm: async () => {
        try {
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          await parkApi.deletePark(park.BusinessParkID);
          setSelectedPark(null);
          fetchParks();
        } catch (err) {
          const msg = err.response?.data?.message || 'Failed to delete business park.';
          showAlert(t('common.error'), msg, 'error');
        }
      }
    });
  };

  const openEditModal = (park) => {
    setSelectedPark(park);
    setShowCreateModal(true);
  };

  return (
    <div>
      {/* Single Campus Architecture Notice Banner */}
      <div style={{
        padding: '14px 20px',
        borderRadius: '12px',
        background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.12) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.28)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '14px',
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'rgba(99, 102, 241, 0.25)', color: 'var(--accent-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {t('businessPark.campusMasterTitle')}
              <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', fontWeight: 600 }}>
                {t('businessPark.centralManaged')}
              </span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {t('businessPark.campusMasterDesc')}
            </div>
          </div>
        </div>
        {parks.length > 0 && (
          <ActionButton
            variant="edit"
            label={t('businessPark.editParkParameters')}
            onClick={() => openEditModal(parks[0])}
            title={t('businessPark.editParkParameters')}
          />
        )}
      </div>

      {/* Header Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder={t('businessPark.searchBuildings')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 16px 10px 42px',
              borderRadius: 'var(--border-radius-sm)',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-primary)',
              fontSize: '0.88rem'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--border-radius-sm)', padding: '2px' }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: '6px 12px',
                border: 'none',
                background: viewMode === 'grid' ? 'var(--accent-gradient)' : 'transparent',
                color: viewMode === 'grid' ? 'white' : 'var(--text-muted)',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                padding: '6px 12px',
                border: 'none',
                background: viewMode === 'table' ? 'var(--accent-gradient)' : 'transparent',
                color: viewMode === 'table' ? 'white' : 'var(--text-muted)',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              <List size={16} />
            </button>
          </div>

          <button
            onClick={fetchParks}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: 'var(--border-radius-sm)',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--glass-border)',
              cursor: 'pointer',
              fontSize: '0.88rem'
            }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> {t('common.refresh')}
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <RefreshCw className="animate-spin" size={32} style={{ marginBottom: '16px' }} />
          <p>{t('common.loading')}</p>
        </div>
      ) : parks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <Building2 size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
          <p>{t('businessPark.noParkRegistered')}</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {parks.map((park) => (
            <div key={park.BusinessParkID} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <h4 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '4px' }}>{park.BusinessParkName}</h4>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--accent-primary)', background: 'rgba(138, 75, 255, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                      {park.BusinessParkCode}
                    </span>
                  </div>

                  {park.IsOperational ? (
                    <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>{t('businessPark.operational')}</span>
                  ) : (
                    <span className="badge badge-secondary" style={{ fontSize: '0.72rem' }}>{t('businessPark.maintenanceOffline')}</span>
                  )}
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px', minHeight: '38px' }}>
                  {park.Description || 'Commercial ICT & Industrial Technology Park Campus.'}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={14} color="var(--accent-primary)" />
                    <span>{park.City}, {park.Country}</span>
                  </div>
                  {park.Email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Mail size={14} />
                      <span>{park.Email}</span>
                    </div>
                  )}
                  {park.PhoneNumber && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Phone size={14} />
                      <span>{park.PhoneNumber}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div style={{
                  padding: '12px',
                  borderRadius: 'var(--border-radius-sm)',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--glass-border)',
                  marginBottom: '16px',
                  display: 'flex',
                  justifyContent: 'space-around',
                  textAlign: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('businessPark.buildingsBlocks')}</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {park.BuildingCount || 0}
                    </div>
                  </div>
                  <div style={{ borderLeft: '1px solid var(--glass-border)' }} />
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('businessPark.grossArea')}</div>
                    <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--accent-primary)' }}>
                      {park.TotalAreaSquareMeter ? `${Number(park.TotalAreaSquareMeter).toLocaleString()} m²` : '—'}
                    </div>
                  </div>
                </div>

                <ActionGroup style={{ width: '100%' }}>
                  <ActionButton
                    variant="edit"
                    label={t('businessPark.editParkParameters')}
                    onClick={() => openEditModal(park)}
                    title={t('businessPark.editParkParameters')}
                    style={{ flex: 1, justifyContent: 'center' }}
                  />
                  <ActionButton
                    variant="delete"
                    onClick={() => promptDeletePark(park)}
                    title={t('common.delete')}
                  />
                </ActionGroup>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>{t('businessPark.businessPark')}</th>
                <th>{t('common.code')}</th>
                <th>{t('common.details')}</th>
                <th>{t('businessPark.buildingsBlocks')}</th>
                <th>{t('businessPark.totalArea')}</th>
                <th>{t('common.status')}</th>
                <th style={{ textAlign: 'right' }}>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {parks.map((park) => (
                <tr key={park.BusinessParkID}>
                  <td>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{park.BusinessParkName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{park.ShortName || '—'}</div>
                  </td>
                  <td style={{ fontFamily: 'monospace', color: 'var(--accent-primary)' }}>{park.BusinessParkCode}</td>
                  <td>{park.City}, {park.Country}</td>
                  <td>
                    <span className="badge badge-info">{park.BuildingCount || 0} {t('businessPark.buildingsBlocks')}</span>
                  </td>
                  <td>{park.TotalAreaSquareMeter ? `${Number(park.TotalAreaSquareMeter).toLocaleString()} m²` : '—'}</td>
                  <td>
                    {park.IsOperational ? (
                      <span className="badge badge-success">{t('businessPark.operational')}</span>
                    ) : (
                      <span className="badge badge-danger">{t('businessPark.maintenanceOffline')}</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <ActionGroup align="right">
                      <ActionButton
                        variant="edit"
                        label={t('common.edit')}
                        onClick={() => openEditModal(park)}
                        title={t('businessPark.editParkParameters')}
                      />
                      <ActionButton
                        variant="delete"
                        label={t('common.delete')}
                        onClick={() => promptDeletePark(park)}
                        title={t('common.delete')}
                      />
                    </ActionGroup>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE / EDIT PARK MODAL — 26 Field Enterprise Form */}
      <BusinessParkFormModal
        isOpen={showCreateModal}
        initialData={selectedPark}
        onClose={() => {
          setShowCreateModal(false);
          setSelectedPark(null);
        }}
        onSuccess={() => {
          setShowCreateModal(false);
          setSelectedPark(null);
          fetchParks();
        }}
      />

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
