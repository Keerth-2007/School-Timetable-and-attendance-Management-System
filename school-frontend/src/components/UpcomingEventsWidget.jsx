import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { calendarApi } from '../services/api';
import { IconCalendar, IconArrowRight, IconClock } from './Icons';

export const EVENT_CONFIG = {
  HOLIDAY: {
    label: 'Holiday',
    icon: '🏖️',
    color: '#dc2626',
    bg: '#fef2f2',
    border: '#fecaca',
  },
  CELEBRATION: {
    label: 'Celebration',
    icon: '🎉',
    color: '#8b5cf6',
    bg: '#f5f3ff',
    border: '#ddd6fe',
  },
  SPECIAL_CLASS: {
    label: 'Special Class',
    icon: '🏫',
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a',
  },
  EXAM: {
    label: 'Exam / Test',
    icon: '📝',
    color: '#2563eb',
    bg: '#eff6ff',
    border: '#bfdbfe',
  },
  SCHOOL_EVENT: {
    label: 'School Event',
    icon: '📅',
    color: '#059669',
    bg: '#ecfdf5',
    border: '#a7f3d0',
  },
  MEETING: {
    label: 'Meeting / PTM',
    icon: '👥',
    color: '#0891b2',
    bg: '#ecfeff',
    border: '#a5f3fc',
  },
  STUDENT_LEAVE: {
    label: 'Student Leave',
    icon: '🟠',
    color: '#ea580c',
    bg: '#fff7ed',
    border: '#fed7aa',
  },
  STAFF_LEAVE: {
    label: 'Faculty Leave',
    icon: '👤',
    color: '#4f46e5',
    bg: '#eef2ff',
    border: '#c7d2fe',
  },
  TIMETABLE_CHANGE: {
    label: 'Timetable Change',
    icon: '🔄',
    color: '#7c3aed',
    bg: '#faf5ff',
    border: '#e9d5ff',
  },
  FEE_DUE: {
    label: 'Fee Due Date',
    icon: '💰',
    color: '#b45309',
    bg: '#fef3c7',
    border: '#fde68a',
  },
  WORKING_DAY: {
    label: 'Working Day',
    icon: '💼',
    color: '#475569',
    bg: '#f8fafc',
    border: '#e2e8f0',
  },
};

export default function UpcomingEventsWidget({ title = 'Upcoming Academic Events', limit = 4, className = '' }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    calendarApi.getUpcoming(limit)
      .then((res) => {
        if (isMounted) setEvents(res.data || []);
      })
      .catch((err) => {
        console.warn('Could not load upcoming calendar events', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, [limit]);

  const formatDateLabel = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    const eventDate = new Date(parts[0], parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    
    // Check if matching current month demo date
    const today = new Date();
    if (eventDate.getFullYear() === today.getFullYear() &&
        eventDate.getMonth() === today.getMonth() &&
        eventDate.getDate() === today.getDate()) {
      return 'Today';
    }
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    if (eventDate.getFullYear() === tomorrow.getFullYear() &&
        eventDate.getMonth() === tomorrow.getMonth() &&
        eventDate.getDate() === tomorrow.getDate()) {
      return 'Tomorrow';
    }

    return eventDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  return (
    <div className={`card ${className}`} style={{ border: '1px solid #e2e8f0', borderRadius: '12px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
        borderBottom: '1px solid #f1f5f9',
        paddingBottom: '0.75rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.25rem' }}>📅</span>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            {title}
          </h3>
        </div>
        <Link
          to="/calendar"
          style={{
            fontSize: '0.8rem',
            color: '#2563eb',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            textDecoration: 'none',
          }}
        >
          <span>View Full Calendar</span>
          <IconArrowRight size={14} />
        </Link>
      </div>

      {loading ? (
        <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
          Loading scheduled academic events...
        </div>
      ) : events.length === 0 ? (
        <div style={{
          padding: '1.5rem',
          textAlign: 'center',
          color: '#64748b',
          fontSize: '0.875rem',
          background: '#f8fafc',
          borderRadius: '8px',
        }}>
          No academic events scheduled.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {events.map((evt) => {
            const config = EVENT_CONFIG[evt.eventType] || EVENT_CONFIG.SCHOOL_EVENT;
            const dateLabel = formatDateLabel(evt.startDate);

            return (
              <div
                key={evt.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 0.9rem',
                  borderRadius: '8px',
                  background: config.bg,
                  border: `1px solid ${config.border}`,
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flex: 1 }}>
                  <div style={{
                    minWidth: '60px',
                    textAlign: 'center',
                    padding: '0.25rem 0.4rem',
                    background: '#ffffff',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    color: '#1e293b',
                  }}>
                    {dateLabel}
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.95rem' }}>{config.icon}</span>
                      <strong style={{
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        color: '#0f172a',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {evt.title}
                      </strong>
                    </div>

                    <div style={{
                      fontSize: '0.775rem',
                      color: '#475569',
                      marginTop: '0.2rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      flexWrap: 'wrap',
                    }}>
                      {evt.classSection && (
                        <span style={{ fontWeight: 600, color: '#334155' }}>
                          Class {evt.classSection}
                        </span>
                      )}
                      {evt.subjectName && (
                        <span>• {evt.subjectName}</span>
                      )}
                      {evt.startTime && (
                        <span style={{ color: '#64748b' }}>
                          • {evt.startTime} {evt.endTime ? `– ${evt.endTime}` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <Link
                  to="/calendar"
                  className="btn btn-ghost btn-sm"
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: config.color, flexShrink: 0 }}
                  title="Inspect on Academic Calendar"
                >
                  <IconArrowRight size={14} />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
