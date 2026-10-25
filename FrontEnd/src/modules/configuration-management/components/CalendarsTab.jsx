import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, RefreshCw, AlertCircle, Clock } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import configApi from '../api/configApi';
import { ActionButton, ActionGroup } from '../../../components/common/ActionButton';
import { ModalCard } from '../../../components/common/ModalCard';
import { FormField } from '../../../components/common/FormField';

export default function CalendarsTab() {
  const { t } = useTranslation();
  const [calendars, setCalendars] = useState([]);
  const [selectedCalendar, setSelectedCalendar] = useState(null);
  const [holidays, setHolidays] = useState([]);
  const [loadingCalendars, setLoadingCalendars] = useState(true);
  const [loadingHolidays, setLoadingHolidays] = useState(false);

  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [calendarForm, setCalendarForm] = useState({
    calendarCode: '',
    calendarName: '',
    timeZone: 'UTC',
    workStartTime: '08:00',
    workEndTime: '17:00'
  });

  const [holidayForm, setHolidayForm] = useState({
    holidayName: '',
    holidayDate: new Date().toISOString().split('T')[0],
    isRecurring: false
  });

  const fetchCalendars = async () => {
    setLoadingCalendars(true);
    try {
      const res = await configApi.getCalendars();
      if (res.data && res.data.status === 'success') {
        const list = res.data.data || [];
        setCalendars(list);
        if (list.length > 0 && !selectedCalendar) {
          setSelectedCalendar(list[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load calendars:', err);
    } finally {
      setLoadingCalendars(false);
    }
  };

  const fetchHolidays = async (calendarId) => {
    if (!calendarId) return;
    setLoadingHolidays(true);
    try {
      const res = await configApi.getCalendarHolidays(calendarId);
      if (res.data && res.data.status === 'success') {
        setHolidays(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load holidays:', err);
    } finally {
      setLoadingHolidays(false);
    }
  };

  useEffect(() => {
    fetchCalendars();
  }, []);

  useEffect(() => {
    if (selectedCalendar) {
      fetchHolidays(selectedCalendar.WorkingCalendarID);
    }
  }, [selectedCalendar]);

  const handleCreateCalendar = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await configApi.createCalendar(calendarForm);
      setIsCalendarModalOpen(false);
      await fetchCalendars();
      if (res.data?.data) setSelectedCalendar(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create calendar');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveHoliday = async (e) => {
    e.preventDefault();
    if (!selectedCalendar) return;
    setSubmitting(true);
    setError(null);
    try {
      await configApi.saveCalendarHoliday(selectedCalendar.WorkingCalendarID, holidayForm);
      setIsHolidayModalOpen(false);
      setHolidayForm({ holidayName: '', holidayDate: new Date().toISOString().split('T')[0], isRecurring: false });
      fetchHolidays(selectedCalendar.WorkingCalendarID);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add holiday');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteHoliday = async (holidayId) => {
    if (window.confirm(t('config.confirmDeleteHoliday'))) {
      try {
        await configApi.deleteCalendarHoliday(selectedCalendar.WorkingCalendarID, holidayId);
        fetchHolidays(selectedCalendar.WorkingCalendarID);
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete holiday');
      }
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px' }}>
      {/* Left Column: Calendars */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: 0 }}>{t('config.calendarsTitle')}</h4>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              setCalendarForm({ calendarCode: '', calendarName: '', timeZone: 'UTC', workStartTime: '08:00', workEndTime: '17:00' });
              setError(null);
              setIsCalendarModalOpen(true);
            }}
          >
            <Plus size={14} /> {t('config.newCalendarBtn')}
          </button>
        </div>

        {loadingCalendars ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
            <RefreshCw className="animate-spin" size={18} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '500px', overflowY: 'auto' }}>
            {calendars.map((c) => (
              <button
                key={c.WorkingCalendarID}
                onClick={() => setSelectedCalendar(c)}
                style={{
                  textAlign: 'left',
                  padding: '12px 14px',
                  borderRadius: 'var(--border-radius-sm)',
                  background: selectedCalendar?.WorkingCalendarID === c.WorkingCalendarID ? 'var(--accent-gradient)' : 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${selectedCalendar?.WorkingCalendarID === c.WorkingCalendarID ? 'var(--accent-primary)' : 'var(--glass-border)'}`,
                  color: selectedCalendar?.WorkingCalendarID === c.WorkingCalendarID ? 'white' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <div style={{ fontWeight: '600', fontSize: '0.88rem' }}>{c.CalendarName}</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.8, display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <span style={{ fontFamily: 'monospace' }}>{c.CalendarCode}</span>
                  <span>•</span>
                  <span>{c.WorkStartTime || '08:00'} - {c.WorkEndTime || '17:00'}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right Column: Holidays */}
      <div>
        {selectedCalendar ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>
                  {selectedCalendar.CalendarName} <span style={{ fontSize: '0.85rem', fontFamily: 'monospace', color: 'var(--accent-secondary)' }}>({selectedCalendar.TimeZone || 'UTC'})</span>
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t('config.calendarHolidaysDesc')}</p>
              </div>

              <button
                onClick={() => {
                  setHolidayForm({ holidayName: '', holidayDate: new Date().toISOString().split('T')[0], isRecurring: false });
                  setError(null);
                  setIsHolidayModalOpen(true);
                }}
                className="btn btn-primary"
              >
                <Plus size={16} /> {t('config.addHolidayBtn')}
              </button>
            </div>

            <div className="glass-panel" style={{ padding: '8px' }}>
              {loadingHolidays ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  <RefreshCw className="animate-spin" size={24} style={{ marginBottom: '12px' }} />
                  <p>{t('config.loadingHolidays')}</p>
                </div>
              ) : holidays.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  <Calendar size={36} style={{ marginBottom: '12px', opacity: 0.5 }} />
                  <p>{t('config.noHolidays')}</p>
                </div>
              ) : (
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>{t('config.thHolidayName')}</th>
                      <th>{t('config.thHolidayDate')}</th>
                      <th>{t('config.thRecurring')}</th>
                      <th style={{ textAlign: 'right' }}>{t('config.thActions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holidays.map((h) => (
                      <tr key={h.CalendarHolidayID}>
                        <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{h.HolidayName}</td>
                        <td style={{ fontFamily: 'monospace', color: 'var(--accent-secondary)' }}>
                          {h.HolidayDate ? new Date(h.HolidayDate).toLocaleDateString() : '—'}
                        </td>
                        <td>
                          <span className={`badge badge-${h.IsRecurring ? 'boolean' : 'string'}`}>
                            {h.IsRecurring ? t('config.badgeRecurring') : t('config.badgeSingle')}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <ActionGroup align="right">
                            <ActionButton
                              variant="delete"
                              onClick={() => handleDeleteHoliday(h.CalendarHolidayID)}
                              title={t('common.delete')}
                            />
                          </ActionGroup>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Clock size={40} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <p>{t('config.selectCalendarPrompt')}</p>
          </div>
        )}
      </div>

      {/* Modal: Create Calendar */}
      <ModalCard
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        title={t('config.newCalendarBtn')}
        subtitle="Configure schedule name, unique code identifier, and daily working hours"
        icon={Calendar}
        accentStrip="brand"
        maxWidth="500px"
        onSubmit={handleCreateCalendar}
        submitting={submitting}
        submitText={t('common.save')}
        cancelText={t('common.cancel')}
        error={error}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <FormField
            label={t('config.calendarCodeLabel')}
            required
            hint="Unique code identifier, e.g. CAL_STANDARD"
          >
            <input
              type="text"
              required
              className="form-control"
              placeholder="e.g. CAL_STANDARD"
              value={calendarForm.calendarCode}
              onChange={(e) => setCalendarForm({ ...calendarForm, calendarCode: e.target.value.toUpperCase() })}
              style={{ fontFamily: 'monospace' }}
            />
          </FormField>

          <FormField
            label={t('config.calendarNameLabel')}
            required
          >
            <input
              type="text"
              required
              className="form-control"
              placeholder="e.g. Standard 8-5 Business Calendar"
              value={calendarForm.calendarName}
              onChange={(e) => setCalendarForm({ ...calendarForm, calendarName: e.target.value })}
            />
          </FormField>

          <div className="form-grid-2">
            <FormField
              label={t('config.workStartTimeLabel')}
              icon={Clock}
            >
              <input
                type="time"
                className="form-control"
                value={calendarForm.workStartTime}
                onChange={(e) => setCalendarForm({ ...calendarForm, workStartTime: e.target.value })}
              />
            </FormField>

            <FormField
              label={t('config.workEndTimeLabel')}
              icon={Clock}
            >
              <input
                type="time"
                className="form-control"
                value={calendarForm.workEndTime}
                onChange={(e) => setCalendarForm({ ...calendarForm, workEndTime: e.target.value })}
              />
            </FormField>
          </div>
        </div>
      </ModalCard>

      {/* Modal: Add Holiday */}
      <ModalCard
        isOpen={isHolidayModalOpen}
        onClose={() => setIsHolidayModalOpen(false)}
        title={t('config.addHolidayBtn')}
        subtitle={selectedCalendar ? `Add public or observed holiday for ${selectedCalendar.CalendarName}` : ''}
        icon={Calendar}
        accentStrip="amber"
        maxWidth="460px"
        onSubmit={handleSaveHoliday}
        submitting={submitting}
        submitText={t('common.save')}
        cancelText={t('common.cancel')}
        error={error}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <FormField
            label={t('config.thHolidayName')}
            required
          >
            <input
              type="text"
              required
              className="form-control"
              placeholder="e.g. New Year's Day"
              value={holidayForm.holidayName}
              onChange={(e) => setHolidayForm({ ...holidayForm, holidayName: e.target.value })}
            />
          </FormField>

          <FormField
            label={t('config.thHolidayDate')}
            required
          >
            <input
              type="date"
              required
              className="form-control"
              value={holidayForm.holidayDate}
              onChange={(e) => setHolidayForm({ ...holidayForm, holidayDate: e.target.value })}
            />
          </FormField>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '4px' }}>
            <input
              type="checkbox"
              id="isRecurring"
              checked={holidayForm.isRecurring}
              onChange={(e) => setHolidayForm({ ...holidayForm, isRecurring: e.target.checked })}
              style={{ width: '16px', height: '16px', accentColor: 'var(--brand-primary, #2563eb)', cursor: 'pointer' }}
            />
            <label htmlFor="isRecurring" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              {t('config.recurringAnnualLabel')}
            </label>
          </div>
        </div>
      </ModalCard>
    </div>
  );
}
