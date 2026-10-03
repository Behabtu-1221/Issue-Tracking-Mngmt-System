import React from 'react';
import CalendarsTab from '../components/CalendarsTab';

export default function ConfigCalendarsPage() {
  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
<h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>Business Hours & <span className="glow-text">Calendars</span></h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Working shift schedules, tenant holiday profiles, and SLA business time windows
</p>
      </div>
      <CalendarsTab />
    </div>
  );
}
