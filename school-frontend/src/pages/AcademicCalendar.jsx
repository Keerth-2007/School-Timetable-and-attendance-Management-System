import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { calendarApi, metadataApi, usersApi } from '../services/api';
import { EVENT_CONFIG } from '../components/UpcomingEventsWidget';
import {
  IconCalendar,
  IconClock,
  IconPlus,
  IconRefreshCw,
  IconCheckCircle,
  IconAlertTriangle,
  IconXCircle,
  IconArrowRight,
} from '../components/Icons';

export default function AcademicCalendar() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'PRINCIPAL';

  // Navigation state (Default to September 2026)
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(9); // 1-12 (Sep = 9)
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [viewMode, setViewMode] = useState('month'); // 'month', 'agenda'

  // Filter and Search states
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('2026-09-10'); // Default selected day

  // Data states
  const [events, setEvents] = useState([]);
  const [workingDaysData, setWorkingDaysData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Dropdown options for form
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [rooms, setRooms] = useState([]);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const initialForm = {
    title: '',
    description: '',
    eventType: 'SPECIAL_CLASS',
    startDate: '2026-09-18',
    endDate: '2026-09-18',
    startTime: '15:30',
    endTime: '17:00',
    location: 'Lab 2',
    academicYear: '2026-2027',
    classSection: '8A',
    subjectId: '',
    teacherId: '',
    targetAudience: 'CLASS',
    status: 'PUBLISHED',
  };
  const [formData, setFormData] = useState(initialForm);

  // Load calendar events & working days
  const fetchCalendarData = async () => {
    setLoading(true);
    setError('');
    try {
      const [evRes, wdRes] = await Promise.all([
        calendarApi.getEvents({
          academicYear,
          year: currentYear,
          month: currentMonth,
          type: selectedCategory !== 'ALL' ? selectedCategory : undefined,
          classSection: selectedClass !== 'ALL' ? selectedClass : undefined,
          search: searchQuery.trim() || undefined,
        }),
        calendarApi.getWorkingDays(academicYear, currentYear, currentMonth),
      ]);
      setEvents(evRes.data || []);
      setWorkingDaysData(wdRes.data || null);
    } catch (err) {
      setError(err.message || 'Failed to load academic calendar data');
    } finally {
      setLoading(false);
    }
  };

  // Load metadata for form creation
  const fetchMetadata = async () => {
    try {
      const [subRes, teaRes, rmRes] = await Promise.all([
        metadataApi.getSubjects(),
        usersApi.getByRole('TEACHER'),
        metadataApi.getRooms(),
      ]);
      setSubjects(subRes.data || []);
      setTeachers(teaRes.data || []);
      setRooms(rmRes.data || []);
    } catch (err) {
      console.warn('Metadata loading warning:', err);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, [currentYear, currentMonth, academicYear, selectedCategory, selectedClass, searchQuery]);

  useEffect(() => {
    if (isAdmin) {
      fetchMetadata();
    }
  }, [isAdmin]);

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleToday = () => {
    setCurrentYear(2026);
    setCurrentMonth(9);
    setSelectedDate('2026-09-09');
  };

  // Month Grid Calculation
  const monthInfo = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth - 1, 1).getDay(); // 0 is Sun, 1 is Mon
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    // Indian / ISO standard: Monday as first day of week (0=Mon, 6=Sun)
    const adjustedStartDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    const days = [];
    // Pad previous month days
    const prevMonthDays = new Date(currentYear, currentMonth - 1, 0).getDate();
    for (let i = adjustedStartDay - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        dateStr: `${currentYear}-${String(currentMonth - 1 === 0 ? 12 : currentMonth - 1).padStart(2, '0')}-${String(prevMonthDays - i).padStart(2, '0')}`,
      });
    }
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
        dateStr: `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
      });
    }
    // Pad next month days to complete 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        dateStr: `${currentYear}-${String(currentMonth + 1 === 13 ? 1 : currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
      });
    }

    return days;
  }, [currentYear, currentMonth]);

  const monthName = new Date(currentYear, currentMonth - 1, 1).toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });

  // Filter events by date string
  const getEventsForDate = (dateStr) => {
    return events.filter((e) => {
      if (!e.startDate) return false;
      if (e.endDate) {
        return dateStr >= e.startDate && dateStr <= e.endDate;
      }
      return e.startDate === dateStr;
    });
  };

  // Open event details
  const handleEventClick = (event, e) => {
    if (e) e.stopPropagation();
    setSelectedEvent(event);
    setShowDetailsModal(true);
  };

  // Open create event modal
  const handleOpenCreateModal = (presetDate = null) => {
    setIsEditing(false);
    setFormData({
      ...initialForm,
      academicYear,
      startDate: presetDate || `${currentYear}-${String(currentMonth).padStart(2, '0')}-15`,
      endDate: presetDate || `${currentYear}-${String(currentMonth).padStart(2, '0')}-15`,
    });
    setShowCreateModal(true);
  };

  // Open edit modal
  const handleOpenEditModal = (event) => {
    setIsEditing(true);
    setSelectedEvent(event);
    setFormData({
      title: event.title || '',
      description: event.description || '',
      eventType: event.eventType || 'SPECIAL_CLASS',
      startDate: event.startDate || '',
      endDate: event.endDate || event.startDate || '',
      startTime: event.startTime || '',
      endTime: event.endTime || '',
      location: event.location || '',
      academicYear: event.academicYear || academicYear,
      classSection: event.classSection || '',
      subjectId: event.subjectId || '',
      teacherId: event.teacherId || '',
      targetAudience: event.targetAudience || 'ALL',
      status: event.status || 'PUBLISHED',
    });
    setShowDetailsModal(false);
    setShowCreateModal(true);
  };

  // Submit create or edit form
  const handleSaveEvent = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        subjectId: formData.subjectId ? Number(formData.subjectId) : null,
        teacherId: formData.teacherId ? Number(formData.teacherId) : null,
      };

      if (isEditing && selectedEvent) {
        await calendarApi.updateEvent(selectedEvent.id, payload);
        setSuccessMsg(`Event "${formData.title}" updated successfully.`);
      } else {
        await calendarApi.createEvent(payload);
        setSuccessMsg(`Event "${formData.title}" scheduled and published to calendar.`);
      }
      setShowCreateModal(false);
      fetchCalendarData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert('Error saving event: ' + err.message);
    }
  };

  // Cancel event
  const handleCancelEvent = async (id) => {
    if (!window.confirm('Are you sure you want to mark this event as CANCELLED?')) return;
    try {
      await calendarApi.cancelEvent(id);
      setSuccessMsg('Event cancelled.');
      setShowDetailsModal(false);
      fetchCalendarData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  // Delete event
  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this event?')) return;
    try {
      await calendarApi.deleteEvent(id);
      setSuccessMsg('Event permanently removed.');
      setShowDetailsModal(false);
      fetchCalendarData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  // Events for selected date in side drawer / agenda
  const selectedDateEvents = useMemo(() => {
    return getEventsForDate(selectedDate);
  }, [selectedDate, events]);

  return (
    <div className="container" style={{ paddingBottom: '3.5rem' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.25rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span>📅</span>
            <span>Central Academic Calendar</span>
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
            Unified schedule for school working days, holidays, celebrations, exams, special classes, and leaves.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Academic Year Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>AY:</span>
            <select
              className="form-control"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              style={{ padding: '0.4rem 0.75rem', fontWeight: 700, borderRadius: '8px', minWidth: '130px' }}
            >
              <option value="2025-2026">2025–2026</option>
              <option value="2026-2027">2026–2027</option>
              <option value="2027-2028">2027–2028</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div style={{ display: 'flex', background: '#e2e8f0', borderRadius: '8px', padding: '0.2rem' }}>
            <button
              onClick={() => setViewMode('month')}
              style={{
                border: 'none',
                background: viewMode === 'month' ? '#ffffff' : 'transparent',
                color: viewMode === 'month' ? '#1e293b' : '#64748b',
                fontWeight: 700,
                fontSize: '0.8rem',
                padding: '0.35rem 0.8rem',
                borderRadius: '6px',
                cursor: 'pointer',
                boxShadow: viewMode === 'month' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              Month View
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              style={{
                border: 'none',
                background: viewMode === 'agenda' ? '#ffffff' : 'transparent',
                color: viewMode === 'agenda' ? '#1e293b' : '#64748b',
                fontWeight: 700,
                fontSize: '0.8rem',
                padding: '0.35rem 0.8rem',
                borderRadius: '6px',
                cursor: 'pointer',
                boxShadow: viewMode === 'agenda' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              Agenda / List
            </button>
          </div>

          {/* Admin Add Event Button */}
          {isAdmin && (
            <button
              onClick={() => handleOpenCreateModal()}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
            >
              <IconPlus size={16} />
              <span>Schedule Event</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications / Alerts */}
      {successMsg && (
        <div className="alert alert-success" style={{ marginBottom: '1.25rem' }}>
          <IconCheckCircle size={18} />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="alert alert-warning" style={{ marginBottom: '1.25rem' }}>
          <IconAlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Calendar Metric Ribbons (Working Days vs Holidays) */}
      {workingDaysData && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '0.75rem',
            marginBottom: '1.25rem',
          }}
        >
          <div className="card" style={{ padding: '0.75rem 1rem', borderLeft: '4px solid #2563eb' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>TOTAL DAYS</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>{workingDaysData.totalDays}</div>
          </div>
          <div className="card" style={{ padding: '0.75rem 1rem', borderLeft: '4px solid #10b981' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#047857' }}>WORKING DAYS</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#047857' }}>{workingDaysData.workingDays}</div>
          </div>
          <div className="card" style={{ padding: '0.75rem 1rem', borderLeft: '4px solid #dc2626' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b91c1c' }}>HOLIDAYS</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#b91c1c' }}>{workingDaysData.holidays}</div>
          </div>
          <div className="card" style={{ padding: '0.75rem 1rem', borderLeft: '4px solid #8b5cf6' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6d28d9' }}>SUNDAYS</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#6d28d9' }}>{workingDaysData.sundays}</div>
          </div>
          <div className="card" style={{ padding: '0.75rem 1rem', borderLeft: '4px solid #f59e0b' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b45309' }}>TOTAL EVENTS</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#b45309' }}>{events.length}</div>
          </div>
        </div>
      )}

      {/* Filter Toolbar & Search */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem', background: '#ffffff', borderRadius: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Category Filter Pills */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginRight: '0.25rem' }}>Categories:</span>
            {[
              { id: 'ALL', label: 'All Events', icon: '🗓️' },
              { id: 'HOLIDAY', label: 'Holidays', icon: '🏖️' },
              { id: 'CELEBRATION', label: 'Celebrations', icon: '🎉' },
              { id: 'SPECIAL_CLASS', label: 'Special Classes', icon: '🏫' },
              { id: 'EXAM', label: 'Exams', icon: '📝' },
              { id: 'FEE_DUE', label: 'Fee Due Dates', icon: '💰' },
              { id: 'MEETING', label: 'Meetings / PTM', icon: '👥' },
              { id: 'STUDENT_LEAVE', label: 'Student Leave', icon: '🟠' },
              { id: 'STAFF_LEAVE', label: 'Faculty Leave', icon: '👤' },
              { id: 'SCHOOL_EVENT', label: 'School Events', icon: '📅' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  border: selectedCategory === cat.id ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                  background: selectedCategory === cat.id ? '#eff6ff' : '#f8fafc',
                  color: selectedCategory === cat.id ? '#1d4ed8' : '#475569',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '9999px',
                  fontSize: '0.775rem',
                  fontWeight: selectedCategory === cat.id ? 800 : 500,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Sub-filters & Search Bar */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
              <div style={{ minWidth: '180px', flex: 1 }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search events (e.g., Physics, Holiday, Special Class, 8A)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              <select
                className="form-control"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                style={{ width: 'auto', minWidth: '130px', fontSize: '0.85rem' }}
              >
                <option value="ALL">All Classes / Grades</option>
                <option value="8A">Class 8A</option>
                <option value="12A">Class 12A</option>
                <option value="7B">Class 7B</option>
              </select>

              {(selectedCategory !== 'ALL' || selectedClass !== 'ALL' || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedCategory('ALL');
                    setSelectedClass('ALL');
                    setSearchQuery('');
                  }}
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '0.8rem', color: '#dc2626' }}
                >
                  Clear Filters
                </button>
              )}
            </div>

            <button
              onClick={fetchCalendarData}
              className="btn btn-secondary btn-sm"
              title="Refresh calendar feed"
            >
              <IconRefreshCw size={14} />
              <span>Sync</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Calendar Section */}
      {viewMode === 'month' ? (
        <div className="card" style={{ padding: '1.25rem', background: '#ffffff', borderRadius: '12px' }}>
          {/* Month Header & Controls */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.25rem',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {monthName}
              </h2>
              <button
                onClick={handleToday}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '0.8rem', border: '1px solid #cbd5e1', padding: '0.2rem 0.6rem' }}
              >
                Today
              </button>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={handlePrevMonth} className="btn btn-secondary btn-sm">
                ‹ Previous
              </button>
              <button onClick={handleNextMonth} className="btn btn-secondary btn-sm">
                Next ›
              </button>
            </div>
          </div>

          {/* Month Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              borderTop: '1px solid #e2e8f0',
              borderLeft: '1px solid #e2e8f0',
            }}
          >
            {/* Day of week headers (Mon - Sun) */}
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dayName, idx) => (
              <div
                key={dayName}
                style={{
                  padding: '0.75rem 0.5rem',
                  textAlign: 'center',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  color: idx === 6 ? '#dc2626' : '#475569',
                  background: '#f8fafc',
                  borderRight: '1px solid #e2e8f0',
                  borderBottom: '1px solid #e2e8f0',
                }}
              >
                {dayName}
              </div>
            ))}

            {/* Day Cells */}
            {monthInfo.map((cell, idx) => {
              const dayEvents = getEventsForDate(cell.dateStr);
              const isSelected = selectedDate === cell.dateStr;
              const isSunday = idx % 7 === 6;

              return (
                <div
                  key={cell.dateStr + '_' + idx}
                  onClick={() => setSelectedDate(cell.dateStr)}
                  style={{
                    minHeight: '105px',
                    padding: '0.4rem',
                    background: !cell.isCurrentMonth
                      ? '#f8fafc'
                      : isSelected
                      ? '#f0fdf4'
                      : isSunday
                      ? '#fffbfb'
                      : '#ffffff',
                    borderRight: '1px solid #e2e8f0',
                    borderBottom: '1px solid #e2e8f0',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem',
                    transition: 'background 0.15s ease',
                    opacity: cell.isCurrentMonth ? 1 : 0.45,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: isSelected ? 800 : 600,
                        color: isSelected ? '#166534' : isSunday ? '#dc2626' : '#1e293b',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isSelected ? '#bbf7d0' : 'transparent',
                      }}
                    >
                      {cell.day}
                    </span>

                    {isAdmin && cell.isCurrentMonth && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenCreateModal(cell.dateStr);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          padding: '0.1rem',
                          borderRadius: '4px',
                        }}
                        title={`Add event on ${cell.dateStr}`}
                      >
                        <IconPlus size={13} />
                      </button>
                    )}
                  </div>

                  {/* Event Badges on Cell */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', overflow: 'hidden' }}>
                    {dayEvents.slice(0, 3).map((evt) => {
                      const cfg = EVENT_CONFIG[evt.eventType] || EVENT_CONFIG.SCHOOL_EVENT;
                      return (
                        <div
                          key={evt.id}
                          onClick={(e) => handleEventClick(evt, e)}
                          title={`${evt.title} (${cfg.label})`}
                          style={{
                            padding: '0.2rem 0.35rem',
                            borderRadius: '4px',
                            background: cfg.bg,
                            border: `1px solid ${cfg.border}`,
                            color: '#0f172a',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <span style={{ fontSize: '0.75rem', flexShrink: 0 }}>{cfg.icon}</span>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {evt.title}
                          </span>
                        </div>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <span style={{ fontSize: '0.65rem', color: '#2563eb', fontWeight: 800, paddingLeft: '0.2rem' }}>
                        +{dayEvents.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Date Drawer Below Grid */}
          <div
            style={{
              marginTop: '1.5rem',
              padding: '1rem',
              background: '#f8fafc',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.1rem' }}>📌</span>
                <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>
                  Events for {selectedDate} ({new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })})
                </strong>
              </div>

              {isAdmin && (
                <button
                  onClick={() => handleOpenCreateModal(selectedDate)}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.8rem' }}
                >
                  <IconPlus size={14} />
                  <span>Add for This Date</span>
                </button>
              )}
            </div>

            {selectedDateEvents.length === 0 ? (
              <div style={{ color: '#64748b', fontSize: '0.85rem' }}>
                No events scheduled for this date.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
                {selectedDateEvents.map((evt) => {
                  const cfg = EVENT_CONFIG[evt.eventType] || EVENT_CONFIG.SCHOOL_EVENT;
                  return (
                    <div
                      key={evt.id}
                      onClick={() => handleEventClick(evt)}
                      style={{
                        padding: '0.85rem',
                        background: '#ffffff',
                        borderRadius: '8px',
                        border: `1px solid ${cfg.border}`,
                        borderLeft: `4px solid ${cfg.color}`,
                        cursor: 'pointer',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <strong style={{ color: '#0f172a', fontSize: '0.9rem' }}>
                          {cfg.icon} {evt.title}
                        </strong>
                        <span
                          style={{
                            fontSize: '0.675rem',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '9999px',
                            background: cfg.bg,
                            color: cfg.color,
                            fontWeight: 800,
                          }}
                        >
                          {cfg.label}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        {evt.classSection && <div><strong>Class:</strong> {evt.classSection}</div>}
                        {evt.subjectName && <div><strong>Subject:</strong> {evt.subjectName}</div>}
                        {evt.teacherName && <div><strong>Faculty:</strong> {evt.teacherName}</div>}
                        {evt.startTime && <div><strong>Time:</strong> {evt.startTime} {evt.endTime ? `– ${evt.endTime}` : ''}</div>}
                        {evt.location && <div><strong>Location:</strong> {evt.location}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Agenda / List View */
        <div className="card" style={{ padding: '1.25rem', background: '#ffffff', borderRadius: '12px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>
            Academic Agenda & Schedule
          </h2>

          {events.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
              No events match the selected filters.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {events.map((evt) => {
                const cfg = EVENT_CONFIG[evt.eventType] || EVENT_CONFIG.SCHOOL_EVENT;
                return (
                  <div
                    key={evt.id}
                    onClick={() => handleEventClick(evt)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1rem',
                      background: cfg.bg,
                      borderRadius: '8px',
                      border: `1px solid ${cfg.border}`,
                      borderLeft: `5px solid ${cfg.color}`,
                      cursor: 'pointer',
                      flexWrap: 'wrap',
                      gap: '1rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '240px' }}>
                      <div
                        style={{
                          textAlign: 'center',
                          minWidth: '70px',
                          background: '#ffffff',
                          padding: '0.4rem',
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                          {evt.startDate ? evt.startDate.split('-')[2] : ''}
                        </div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>
                          {evt.startDate
                            ? new Date(evt.startDate + 'T00:00:00').toLocaleDateString('en-GB', { month: 'short' }).toUpperCase()
                            : ''}
                        </div>
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                          <span style={{ fontSize: '1.1rem' }}>{cfg.icon}</span>
                          <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{evt.title}</strong>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '9999px',
                              background: '#ffffff',
                              color: cfg.color,
                              fontWeight: 800,
                              border: `1px solid ${cfg.border}`,
                            }}
                          >
                            {cfg.label}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.825rem', color: '#475569', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                          {evt.classSection && <span>Class {evt.classSection}</span>}
                          {evt.subjectName && <span>• {evt.subjectName}</span>}
                          {evt.teacherName && <span>• {evt.teacherName}</span>}
                          {evt.startTime && <span>• {evt.startTime} {evt.endTime ? `– ${evt.endTime}` : ''}</span>}
                          {evt.location && <span>• {evt.location}</span>}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button className="btn btn-sm btn-secondary" style={{ fontSize: '0.8rem' }}>
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* EVENT DETAILS MODAL */}
      {showDetailsModal && selectedEvent && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '560px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: '#ffffff',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.5rem' }}>
                  {EVENT_CONFIG[selectedEvent.eventType]?.icon || '📅'}
                </span>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    {selectedEvent.title}
                  </h3>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: EVENT_CONFIG[selectedEvent.eventType]?.color || '#2563eb',
                    }}
                  >
                    {EVENT_CONFIG[selectedEvent.eventType]?.label || selectedEvent.eventType}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowDetailsModal(false)}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '1.25rem', padding: '0.2rem 0.5rem' }}
              >
                ✕
              </button>
            </div>

            {/* Event Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
              <div>
                <strong style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>DATE</strong>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>
                  {selectedEvent.startDate}
                  {selectedEvent.endDate && selectedEvent.endDate !== selectedEvent.startDate ? ` to ${selectedEvent.endDate}` : ''}
                </span>
              </div>

              <div>
                <strong style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>TIMING</strong>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>
                  {selectedEvent.startTime ? `${selectedEvent.startTime} – ${selectedEvent.endTime || 'End'}` : 'All Day Event'}
                </span>
              </div>

              <div>
                <strong style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>LOCATION / VENUE</strong>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>
                  {selectedEvent.location || 'School Campus'}
                </span>
              </div>

              <div>
                <strong style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>TARGET AUDIENCE</strong>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>
                  {selectedEvent.targetAudience || 'ALL'}
                </span>
              </div>

              {selectedEvent.classSection && (
                <div>
                  <strong style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>CLASS / SECTION</strong>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>
                    Class {selectedEvent.classSection}
                  </span>
                </div>
              )}

              {selectedEvent.subjectName && (
                <div>
                  <strong style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>SUBJECT</strong>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>
                    {selectedEvent.subjectName} ({selectedEvent.subjectCode || 'N/A'})
                  </span>
                </div>
              )}

              {selectedEvent.teacherName && (
                <div>
                  <strong style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>FACULTY IN-CHARGE</strong>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>
                    {selectedEvent.teacherName}
                  </span>
                </div>
              )}

              <div>
                <strong style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>STATUS</strong>
                <span
                  className={`badge ${
                    selectedEvent.status === 'PUBLISHED' ? 'badge-success' : selectedEvent.status === 'CANCELLED' ? 'badge-danger' : 'badge-warning'
                  }`}
                  style={{ fontSize: '0.75rem' }}
                >
                  {selectedEvent.status || 'PUBLISHED'}
                </span>
              </div>
            </div>

            {/* Description */}
            {selectedEvent.description && (
              <div style={{ marginBottom: '1.5rem', background: '#f8fafc', padding: '0.85rem', borderRadius: '8px' }}>
                <strong style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                  DESCRIPTION / NOTES
                </strong>
                <p style={{ margin: 0, color: '#334155', fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>
                  {selectedEvent.description}
                </p>
              </div>
            )}

            {/* Action Buttons for Admin */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setShowDetailsModal(false)}
                className="btn btn-secondary"
              >
                Close
              </button>

              {isAdmin && selectedEvent.status !== 'CANCELLED' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(selectedEvent)}
                    className="btn btn-primary"
                  >
                    Edit Event
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCancelEvent(selectedEvent.id)}
                    className="btn btn-warning"
                  >
                    Cancel Event
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteEvent(selectedEvent.id)}
                    className="btn btn-danger"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT EVENT MODAL */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '620px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: '#ffffff',
              borderRadius: '12px',
              padding: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {isEditing ? 'Edit Academic Event' : 'Schedule New Academic Event'}
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '1.25rem' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEvent}>
              <div className="form-group">
                <label className="form-label">Event Title *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., Special Mathematics Class, Physics Unit Test, School Foundation Day"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Event Category *</label>
                  <select
                    className="form-control"
                    value={formData.eventType}
                    onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                    required
                  >
                    <option value="SPECIAL_CLASS">🏫 Special Class / Extra Class</option>
                    <option value="EXAM">📝 Exam / Unit Test / Assessment</option>
                    <option value="FEE_DUE">💰 Fee Due Date Reminder</option>
                    <option value="HOLIDAY">🏖️ School Holiday / Public Holiday</option>
                    <option value="CELEBRATION">🎉 Celebration / Cultural Festival</option>
                    <option value="MEETING">👥 Parent-Teacher Meeting (PTM)</option>
                    <option value="SCHOOL_EVENT">📅 School Event / Sports Day</option>
                    <option value="TIMETABLE_CHANGE">🔄 Timetable Change / Substitute</option>
                    <option value="WORKING_DAY">💼 Working Day Declaration</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Academic Year *</label>
                  <select
                    className="form-control"
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    required
                  >
                    <option value="2025-2026">2025–2026</option>
                    <option value="2026-2027">2026–2027</option>
                    <option value="2027-2028">2027–2028</option>
                  </select>
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Start Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value, endDate: formData.endDate < e.target.value ? e.target.value : formData.endDate })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">End Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input
                    type="time"
                    className="form-control"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <input
                    type="time"
                    className="form-control"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Class / Section (optional)</label>
                  <select
                    className="form-control"
                    value={formData.classSection}
                    onChange={(e) => setFormData({ ...formData, classSection: e.target.value })}
                  >
                    <option value="">School-wide (All Classes)</option>
                    <option value="8A">Class 8A</option>
                    <option value="12A">Class 12A</option>
                    <option value="7B">Class 7B</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Target Audience</label>
                  <select
                    className="form-control"
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                  >
                    <option value="ALL">Everyone (All Roles)</option>
                    <option value="CLASS">Class Specific</option>
                    <option value="STUDENTS">Students Only</option>
                    <option value="TEACHERS">Faculty / Teachers Only</option>
                    <option value="PARENTS">Parents Only</option>
                  </select>
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <select
                    className="form-control"
                    value={formData.subjectId}
                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                  >
                    <option value="">None / General</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Faculty / Teacher</label>
                  <select
                    className="form-control"
                    value={formData.teacherId}
                    onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  >
                    <option value="">None Assigned</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Location / Room</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., Lab 2, Room 101, Main Auditorium"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description / Remarks</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Additional syllabus coverage details, instructions, or meeting agenda..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {isEditing ? 'Save Changes' : 'Publish to Calendar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
