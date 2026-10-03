import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, RefreshCw, AlertCircle, Clock } from 'lucide-react';
import configApi from '../api/configApi';

export default function CalendarsTab() {
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
    if (window.confirm('Delete this holiday from calendar?')) {
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
          <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>Working Calendars</h4>
          <button
            onClick={() => {
              setCalendarForm({ calendarCode: '', calendarName: '', timeZone: 'UTC', workStartTime: '08:00', workEndTime: '17:00' });
              setError(null);
              setIsCalendarModalOpen(true);
            }}
            style={{
              background: 'var(--accent-gradient)',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              padding: '6px 10px',
              fontSize: '0.8rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Plus size={14} /> New Calendar
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
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Configured holiday schedules for SLA calculations.</p>
              </div>

              <button
                onClick={() => {
                  setHolidayForm({ holidayName: '', holidayDate: new Date().toISOString().split('T')[0], isRecurring: false });
                  setError(null);
                  setIsHolidayModalOpen(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  borderRadius: 'var(--border-radius-sm)',
                  background: 'var(--accent-gradient)',
                  color: 'white',
                  border: 'none',
                  fontWeight: '600',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  boxShadow: 'var(--glow-accent)'
                }}
              >
                <Plus size={16} /> Add Holiday
              </button>
            </div>

            <div className="glass-panel" style={{ padding: '8px' }}>
              {loadingHolidays ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  <RefreshCw className="animate-spin" size={24} style={{ marginBottom: '12px' }} />
                  <p>Loading holidays...</p>
                </div>
              ) : holidays.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  <Calendar size={36} style={{ marginBottom: '12px', opacity: 0.5 }} />
                  <p>No holidays configured for this calendar.</p>
                </div>
              ) : (
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Holiday Name</th>
                      <th>Date</th>
                      <th>Recurring</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
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
                            {h.IsRecurring ? 'RECURRING' : 'SINGLE'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            onClick={() => handleDeleteHoliday(h.CalendarHolidayID)}
                            style={{
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.2)',
                              borderRadius: '6px',
                              width: '32px',
                              height: '32px',
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              cursor: 'pointer',
                              color: 'var(--color-danger)'
                            }}
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
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Clock size={40} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <p>Select a working calendar to view and manage holidays.</p>
          </div>
        )}
      </div>

      {/* Modal: Create Calendar */}
      {isCalendarModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCalendarModalOpen(false)}>
          <div className="glass-panel modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '480px', padding: '24px', background: 'var(--bg-secondary)' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Create Working Calendar</h3>
            {error && <div style={{ color: 'var(--color-danger)', fontSize: '0.85rem', marginBottom: '12px' }}>{error}</div>}
            <form onSubmit={handleCreateCalendar}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Calendar Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CAL_BUSINESS_PARK_DEFAULT"
                  value={calendarForm.calendarCode}
                  onChange={(e) => setCalendarForm({ ...calendarForm, calendarCode: e.target.value.toUpperCase() })}
                  style={{ width: '100%', padding: '10px', background: 'var(--color-elevated)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'var(--color-text)', fontFamily: 'monospace' }}
                />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Calendar Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Standard 8-5 Business Calendar"
                  value={calendarForm.calendarName}
                  onChange={(e) => setCalendarForm({ ...calendarForm, calendarName: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: 'var(--color-elevated)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'var(--color-text)' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Work Start Time</label>
                  <input
                    type="time"
                    value={calendarForm.workStartTime}
                    onChange={(e) => setCalendarForm({ ...calendarForm, workStartTime: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: 'var(--color-elevated)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'var(--color-text)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Work End Time</label>
                  <input
                    type="time"
                    value={calendarForm.workEndTime}
                    onChange={(e) => setCalendarForm({ ...calendarForm, workEndTime: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: 'var(--color-elevated)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'var(--color-text)' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setIsCalendarModalOpen(false)} style={{ padding: '8px 16px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'var(--color-text)', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ padding: '8px 18px', background: 'var(--accent-gradient)', border: 'none', borderRadius: '6px', color: 'white', fontWeight: '600', cursor: 'pointer' }}>{submitting ? 'Saving...' : 'Save Calendar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Holiday */}
      {isHolidayModalOpen && (
        <div className="modal-overlay" onClick={() => setIsHolidayModalOpen(false)}>
          <div className="glass-panel modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '450px', padding: '24px', background: 'var(--bg-secondary)' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Add Holiday to Calendar</h3>
            {error && <div style={{ color: 'var(--color-danger)', fontSize: '0.85rem', marginBottom: '12px' }}>{error}</div>}
            <form onSubmit={handleSaveHoliday}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Holiday Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. New Year's Day"
                  value={holidayForm.holidayName}
                  onChange={(e) => setHolidayForm({ ...holidayForm, holidayName: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: 'var(--color-elevated)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'var(--color-text)' }}
                />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Date</label>
                <input
                  type="date"
                  required
                  value={holidayForm.holidayDate}
                  onChange={(e) => setHolidayForm({ ...holidayForm, holidayDate: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: 'var(--color-elevated)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'var(--color-text)' }}
                />
              </div>
              <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="isRecurring"
                  checked={holidayForm.isRecurring}
                  onChange={(e) => setHolidayForm({ ...holidayForm, isRecurring: e.target.checked })}
                />
                <label htmlFor="isRecurring" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Recurring Annual Holiday</label>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setIsHolidayModalOpen(false)} style={{ padding: '8px 16px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'var(--color-text)', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ padding: '8px 18px', background: 'var(--accent-gradient)', border: 'none', borderRadius: '6px', color: 'white', fontWeight: '600', cursor: 'pointer' }}>{submitting ? 'Saving...' : 'Add Holiday'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
