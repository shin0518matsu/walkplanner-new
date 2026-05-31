import React, { useState } from 'react';
import './ActivityCalendar.css';

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

export default function ActivityCalendar({ activities }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const monthName = new Date(viewYear, viewMonth).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' });

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button onClick={prevMonth} className="cal-nav">‹</button>
        <span className="cal-month">{monthName}</span>
        <button onClick={nextMonth} className="cal-nav">›</button>
      </div>
      <div className="cal-weekdays">
        {['日','月','火','水','木','金','土'].map(d => <span key={d}>{d}</span>)}
      </div>
      <div className="cal-grid">
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} className="cal-cell cal-empty" />;
          const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const activity = activities[dateStr];
          const isToday = dateStr === today.toISOString().split('T')[0];
          return (
            <div key={dateStr} className={`cal-cell ${activity ? 'cal-active' : ''} ${isToday ? 'cal-today' : ''}`}>
              <span className="cal-day">{day}</span>
              {activity && <span className="cal-dist">{activity.distance.toFixed(1)}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
