import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { attendanceApi, timetableApi, usersApi } from '../services/api';
import {
  IconCheckCircle,
  IconXCircle,
  IconAlertTriangle,
  IconClock,
  IconUser,
  IconUsers,
  IconRefreshCw,
  IconCalendar,
  IconFileText,
} from '../components/Icons';

export default function AttendanceDashboard() {
  const { user } = useAuth();
  const isStudent = user?.role === 'STUDENT';

  // Active Tab
  const [activeTab, setActiveTab] = useState(isStudent ? 'student_month' : 'session_mark');

  // Teacher Marking State
  const [selectedClass, setSelectedClass] = useState(user?.classSection || '8A');
  const [selectedDate, setSelectedDate] = useState('2026-09-09');
  const [timetableSlots, setTimetableSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [sessionStudents, setSessionStudents] = useState([]); // [{ student, status, remarks }]
  const [sessionLoading, setSessionLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // Teacher Monthly View State
  const [teacherMonthYear, setTeacherMonthYear] = useState({ year: 2026, month: 9 });
  const [monthlySummaries, setMonthlySummaries] = useState([]);
  const [summaryFilterClass, setSummaryFilterClass] = useState('8A');
  const [summarySearch, setSummarySearch] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Student Monthly Attendance State
  const [studentMonthYear, setStudentMonthYear] = useState({ year: 2026, month: 9 });
  const [studentReport, setStudentReport] = useState(null);
  const [studentLoading, setStudentLoading] = useState(false);
  const [auditFilter, setAuditFilter] = useState('ALL'); // 'ALL', 'PRESENT', 'ABSENT', 'LATE', 'EXCUSED'
  const [auditSearch, setAuditSearch] = useState('');

  // Below 75% Risk List
  const [below75List, setBelow75List] = useState([]);
  const [below75Loading, setBelow75Loading] = useState(false);

  // Feedback notifications
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Target student ID for student monthly view
  const targetStudentId = isStudent ? (user?.id || user?.userId || 31) : 31; // Default to Keerthana (ID 31) when teacher inspects

  // Month names helper
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // ----------------------------------------------------
  // TEACHER FLOW: Load Timetable slots for Class & Date
  // ----------------------------------------------------
  useEffect(() => {
    if (activeTab === 'session_mark') {
      loadTimetableSlots();
    }
  }, [selectedClass, selectedDate, activeTab]);

  const loadTimetableSlots = async () => {
    try {
      const res = await timetableApi.getByClassAndDate(selectedClass, selectedDate);
      const slots = res.data || [];
      setTimetableSlots(slots);
      if (slots.length > 0) {
        // Retain current slot if valid, else pick slot 1
        const exists = slots.find((s) => s.id === Number(selectedSlotId));
        if (!exists) {
          setSelectedSlotId(String(slots[0].id));
        }
      } else {
        setSelectedSlotId('');
      }
    } catch (err) {
      console.error('Failed to load timetable for date', err);
      setTimetableSlots([]);
      setSelectedSlotId('');
    }
  };

  // ----------------------------------------------------
  // TEACHER FLOW: Load Class Students & Session Attendance
  // ----------------------------------------------------
  useEffect(() => {
    if (activeTab === 'session_mark' && selectedSlotId) {
      loadSessionRoster();
    }
  }, [selectedSlotId, selectedClass, selectedDate, activeTab]);

  const loadSessionRoster = async () => {
    setSessionLoading(true);
    setErrorMsg('');
    try {
      const slot = timetableSlots.find((s) => s.id === Number(selectedSlotId));
      const period = slot ? slot.period : 1;

      // Load all students for class
      const usersRes = await usersApi.getByRole('STUDENT');
      const classStudents = (usersRes.data || []).filter(
        (s) => !s.classSection || s.classSection === selectedClass
      );

      // Load existing attendance for this session
      const attRes = await attendanceApi.getSession(selectedClass, selectedDate, period);
      const existingRecords = attRes.data || [];

      // Merge into roster state
      const roster = classStudents.map((st) => {
        const existing = existingRecords.find((r) => r.student?.id === st.id);
        return {
          student: st,
          status: existing ? existing.status : 'PRESENT',
          remarks: existing ? (existing.modificationReason || '') : '',
          existingId: existing ? existing.id : null,
          capturedBy: existing ? existing.capturedBy : 'MANUAL',
        };
      });

      setSessionStudents(roster);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load session students');
    } finally {
      setSessionLoading(false);
    }
  };

  // ----------------------------------------------------
  // TEACHER FLOW: Mark All Present / Absent
  // ----------------------------------------------------
  const handleMarkAll = (status) => {
    setSessionStudents((prev) =>
      prev.map((row) => ({ ...row, status }))
    );
  };

  // Update individual student status
  const handleStudentStatusChange = (studentId, status) => {
    setSessionStudents((prev) =>
      prev.map((row) =>
        row.student.id === studentId ? { ...row, status } : row
      )
    );
  };

  // Update individual student remarks
  const handleStudentRemarksChange = (studentId, remarks) => {
    setSessionStudents((prev) =>
      prev.map((row) =>
        row.student.id === studentId ? { ...row, remarks } : row
      )
    );
  };

  // ----------------------------------------------------
  // TEACHER FLOW: Save Session Attendance
  // ----------------------------------------------------
  const handleSaveSessionAttendance = async () => {
    const slot = timetableSlots.find((s) => s.id === Number(selectedSlotId));
    if (!slot) {
      setErrorMsg('Please select a timetable session to mark.');
      return;
    }

    setSaveLoading(true);
    setErrorMsg('');
    try {
      const payload = {
        classSection: selectedClass,
        date: selectedDate,
        period: slot.period,
        subjectId: slot.subject?.id,
        timetableId: slot.id,
        teacherId: user?.id,
        attendances: sessionStudents.map((row) => ({
          studentId: row.student.id,
          status: row.status,
          remarks: row.remarks,
          capturedBy: 'MANUAL',
        })),
      };

      await attendanceApi.saveSession(payload);
      setSuccessMsg(
        `✓ Attendance saved successfully for Class ${selectedClass}, Period ${slot.period} (${slot.subject?.name}) on ${selectedDate}!`
      );
      setTimeout(() => setSuccessMsg(''), 4000);
      loadSessionRoster();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save attendance');
    } finally {
      setSaveLoading(false);
    }
  };

  // ----------------------------------------------------
  // TEACHER MONTHLY SUMMARY VIEW
  // ----------------------------------------------------
  useEffect(() => {
    if (activeTab === 'monthly_summary') {
      loadMonthlySummaries();
    }
  }, [summaryFilterClass, teacherMonthYear, activeTab]);

  const loadMonthlySummaries = async () => {
    setSummaryLoading(true);
    setErrorMsg('');
    try {
      const res = await attendanceApi.getTeacherMonthlySummary(
        summaryFilterClass,
        teacherMonthYear.year,
        teacherMonthYear.month
      );
      setMonthlySummaries(res.data || []);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load monthly summary');
    } finally {
      setSummaryLoading(false);
    }
  };

  // Switch to session register to edit a specific session
  const handleEditSession = (summaryItem) => {
    setSelectedClass(summaryItem.classSection);
    setSelectedDate(summaryItem.date);
    setActiveTab('session_mark');
  };

  // ----------------------------------------------------
  // STUDENT FLOW: Load Student Monthly Report & Timeline
  // ----------------------------------------------------
  useEffect(() => {
    if (activeTab === 'student_month' || isStudent) {
      loadStudentMonthlyReport();
    }
  }, [targetStudentId, studentMonthYear, activeTab, user]);

  const loadStudentMonthlyReport = async () => {
    const sId = targetStudentId || user?.id || user?.userId || 31;
    setStudentLoading(true);
    setErrorMsg('');
    try {
      const res = await attendanceApi.getStudentMonth(
        sId,
        studentMonthYear.year,
        studentMonthYear.month
      );
      setStudentReport(res.data);
    } catch (err) {
      console.error('Failed to load student attendance', err);
      setErrorMsg(err.message || 'Failed to load student attendance records');
      setStudentReport(null);
    } finally {
      setStudentLoading(false);
    }
  };

  // Month navigation handlers
  const handlePrevStudentMonth = () => {
    setStudentMonthYear((prev) => {
      if (prev.month === 1) return { year: prev.year - 1, month: 12 };
      return { year: prev.year, month: prev.month - 1 };
    });
  };

  const handleNextStudentMonth = () => {
    setStudentMonthYear((prev) => {
      if (prev.month === 12) return { year: prev.year + 1, month: 1 };
      return { year: prev.year, month: prev.month + 1 };
    });
  };

  const handleCurrentStudentMonth = () => {
    const now = new Date();
    // Default to September 2026 per demo scenario or current date
    setStudentMonthYear({ year: 2026, month: 9 });
  };

  // Below 75% Risk List
  useEffect(() => {
    if (activeTab === 'below75') {
      loadBelow75();
    }
  }, [activeTab]);

  const loadBelow75 = async () => {
    setBelow75Loading(true);
    try {
      const res = await attendanceApi.getBelow75();
      setBelow75List(res.data || []);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load below 75% list');
    } finally {
      setBelow75Loading(false);
    }
  };

  // Group student sessions by date for the 1-Month Daily Session Timeline
  const groupedSessionsByDate = React.useMemo(() => {
    if (!studentReport?.sessions) return {};
    const groups = {};
    studentReport.sessions.forEach((s) => {
      if (!groups[s.date]) groups[s.date] = [];
      groups[s.date].push(s);
    });
    // Sort sessions in each date by period
    Object.keys(groups).forEach((date) => {
      groups[date].sort((a, b) => a.period - b.period);
    });
    return groups;
  }, [studentReport]);

  // Filtered audit register records
  const filteredAuditSessions = React.useMemo(() => {
    if (!studentReport?.sessions) return [];
    return studentReport.sessions.filter((s) => {
      const matchesFilter =
        auditFilter === 'ALL' || s.status === auditFilter;
      const matchesSearch =
        !auditSearch ||
        s.subjectName?.toLowerCase().includes(auditSearch.toLowerCase()) ||
        s.date?.includes(auditSearch) ||
        s.remarks?.toLowerCase().includes(auditSearch.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [studentReport, auditFilter, auditSearch]);

  const currentSlot = timetableSlots.find((s) => s.id === Number(selectedSlotId));

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
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              margin: 0,
            }}
          >
            <IconCheckCircle size={28} />
            <span>Attendance Management System</span>
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0.35rem 0 0' }}>
            {isStudent
              ? `Student Portal: Dynamic 1-Month Attendance & Audit Breakdown for ${user?.name || 'Keerthana'}`
              : 'Timetable-integrated class session marking, monthly register audits, and statutory tracking.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            onClick={() => {
              if (activeTab === 'session_mark') loadSessionRoster();
              else if (activeTab === 'student_month') loadStudentMonthlyReport();
              else if (activeTab === 'monthly_summary') loadMonthlySummaries();
              else if (activeTab === 'below75') loadBelow75();
            }}
            className="btn btn-secondary btn-sm"
            disabled={sessionLoading || studentLoading || summaryLoading}
          >
            <IconRefreshCw size={14} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="alert alert-success" style={{ marginBottom: '1.25rem', fontWeight: 600 }}>
          <IconCheckCircle size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Error Notification */}
      {errorMsg && (
        <div className="alert alert-danger" style={{ marginBottom: '1.25rem', fontWeight: 600 }}>
          <IconAlertTriangle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '0.5rem',
          overflowX: 'auto',
        }}
      >
        {!isStudent && (
          <>
            <button
              onClick={() => setActiveTab('session_mark')}
              className={`btn btn-sm ${activeTab === 'session_mark' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontWeight: 600 }}
            >
              ✍️ Class Session Register
            </button>
            <button
              onClick={() => setActiveTab('monthly_summary')}
              className={`btn btn-sm ${activeTab === 'monthly_summary' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontWeight: 600 }}
            >
              📅 Teacher Monthly View
            </button>
          </>
        )}

        <button
          onClick={() => setActiveTab('student_month')}
          className={`btn btn-sm ${activeTab === 'student_month' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ fontWeight: 600 }}
        >
          🎓 {isStudent ? 'My 1-Month Attendance' : 'Student Monthly View (Keerthana)'}
        </button>

        {!isStudent && (
          <>
            <button
              onClick={() => setActiveTab('below75')}
              className={`btn btn-sm ${activeTab === 'below75' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontWeight: 600 }}
            >
              ⚠️ Below 75% Risk List
            </button>
            <button
              onClick={() => setActiveTab('heatmap')}
              className={`btn btn-sm ${activeTab === 'heatmap' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontWeight: 600 }}
            >
              📊 Absence Pattern Heatmap
            </button>
          </>
        )}
      </div>

      {/* ==================================================== */}
      {/* TAB 1: TEACHER CLASS SESSION REGISTER                */}
      {/* ==================================================== */}
      {activeTab === 'session_mark' && (
        <div>
          {/* Controls Bar: Class, Date, Timetable Session */}
          <div
            className="card"
            style={{
              padding: '1.25rem',
              marginBottom: '1.5rem',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              background: '#f8fafc',
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', alignItems: 'center' }}>
              {/* Class Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>
                  CLASS SECTION
                </label>
                <select
                  className="form-control"
                  style={{ width: 'auto', minWidth: '120px', padding: '0.45rem 0.75rem', fontWeight: 600 }}
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                >
                  <option value="8A">Class 8A</option>
                  <option value="8B">Class 8B</option>
                  <option value="9A">Class 9A</option>
                  <option value="10A">Class 10A</option>
                </select>
              </div>

              {/* Date Picker */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>
                  ATTENDANCE DATE
                </label>
                <input
                  type="date"
                  className="form-control"
                  style={{ width: 'auto', padding: '0.45rem 0.75rem', fontWeight: 600 }}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>

              {/* Timetable Session Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>
                  TIMETABLE SESSION / SUBJECT
                </label>
                <select
                  className="form-control"
                  style={{ width: 'auto', minWidth: '240px', padding: '0.45rem 0.75rem', fontWeight: 600 }}
                  value={selectedSlotId}
                  onChange={(e) => setSelectedSlotId(e.target.value)}
                  disabled={timetableSlots.length === 0}
                >
                  {timetableSlots.length > 0 ? (
                    timetableSlots.map((slot) => (
                      <option key={slot.id} value={slot.id}>
                        Period {slot.period}: {slot.subject?.name || 'Subject'} ({slot.teacher?.name || 'Staff'})
                      </option>
                    ))
                  ) : (
                    <option value="">No timetable sessions scheduled</option>
                  )}
                </select>
              </div>
            </div>

            {/* Quick Summary Badge */}
            {currentSlot && (
              <div
                style={{
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: 8,
                  padding: '0.5rem 0.85rem',
                  fontSize: '0.85rem',
                  color: '#1e40af',
                }}
              >
                <strong>{selectedClass}</strong> · <strong>Period {currentSlot.period}</strong> ·{' '}
                <strong>{currentSlot.subject?.name}</strong> · {currentSlot.teacher?.name}
              </div>
            )}
          </div>

          {/* Student Attendance Marking Roster */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                marginBottom: '1.25rem',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '0.85rem',
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  Class Attendance Roster: Class {selectedClass}
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  Date: <strong>{selectedDate}</strong> · Session: <strong>Period {currentSlot?.period || 1}</strong> (
                  {currentSlot?.subject?.name || 'Selected Subject'})
                </p>
              </div>

              {/* Roster Action Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handleMarkAll('PRESENT')}
                  className="btn btn-sm"
                  style={{ background: '#10b981', color: 'white', fontWeight: 600 }}
                  disabled={sessionStudents.length === 0}
                >
                  ✓ Mark All Present
                </button>
                <button
                  type="button"
                  onClick={() => handleMarkAll('ABSENT')}
                  className="btn btn-sm"
                  style={{ background: '#ef4444', color: 'white', fontWeight: 600 }}
                  disabled={sessionStudents.length === 0}
                >
                  ✗ Mark All Absent
                </button>
                <button
                  type="button"
                  onClick={handleSaveSessionAttendance}
                  className="btn btn-primary btn-sm"
                  style={{ fontWeight: 700, padding: '0.45rem 1.15rem' }}
                  disabled={saveLoading || sessionStudents.length === 0}
                >
                  {saveLoading ? 'Saving...' : '💾 Save Attendance'}
                </button>
              </div>
            </div>

            {sessionLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                <IconRefreshCw size={24} className="spin" style={{ marginBottom: '0.5rem' }} />
                <div>Loading class roster and existing attendance...</div>
              </div>
            ) : sessionStudents.length > 0 ? (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: '80px' }}>Roll / Adm</th>
                      <th>Student Name</th>
                      <th style={{ width: '320px', textAlign: 'center' }}>Attendance Status</th>
                      <th>Remarks / Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessionStudents.map((row, idx) => {
                      const st = row.student;
                      return (
                        <tr key={st.id}>
                          <td style={{ fontWeight: 700, color: '#475569' }}>
                            {st.admissionNumber || `ADM-0${idx + 1}`}
                          </td>
                          <td>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                              {st.name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{st.email}</div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div
                              style={{
                                display: 'inline-flex',
                                background: '#f1f5f9',
                                padding: '3px',
                                borderRadius: '6px',
                                gap: '3px',
                              }}
                            >
                              <button
                                type="button"
                                onClick={() => handleStudentStatusChange(st.id, 'PRESENT')}
                                style={{
                                  padding: '0.35rem 0.75rem',
                                  fontSize: '0.8rem',
                                  fontWeight: 700,
                                  borderRadius: 4,
                                  border: 'none',
                                  cursor: 'pointer',
                                  background: row.status === 'PRESENT' ? '#10b981' : 'transparent',
                                  color: row.status === 'PRESENT' ? '#ffffff' : '#475569',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                Present
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStudentStatusChange(st.id, 'ABSENT')}
                                style={{
                                  padding: '0.35rem 0.75rem',
                                  fontSize: '0.8rem',
                                  fontWeight: 700,
                                  borderRadius: 4,
                                  border: 'none',
                                  cursor: 'pointer',
                                  background: row.status === 'ABSENT' ? '#ef4444' : 'transparent',
                                  color: row.status === 'ABSENT' ? '#ffffff' : '#475569',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                Absent
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStudentStatusChange(st.id, 'LATE')}
                                style={{
                                  padding: '0.35rem 0.75rem',
                                  fontSize: '0.8rem',
                                  fontWeight: 700,
                                  borderRadius: 4,
                                  border: 'none',
                                  cursor: 'pointer',
                                  background: row.status === 'LATE' ? '#f59e0b' : 'transparent',
                                  color: row.status === 'LATE' ? '#ffffff' : '#475569',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                Late
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStudentStatusChange(st.id, 'EXCUSED')}
                                style={{
                                  padding: '0.35rem 0.75rem',
                                  fontSize: '0.8rem',
                                  fontWeight: 700,
                                  borderRadius: 4,
                                  border: 'none',
                                  cursor: 'pointer',
                                  background: row.status === 'EXCUSED' ? '#ea580c' : 'transparent',
                                  color: row.status === 'EXCUSED' ? '#ffffff' : '#475569',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                {row.status === 'EXCUSED' ? 'Excused / Leave' : 'Excused'}
                              </button>
                            </div>
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="e.g. Medical leave, bus breakdown..."
                              style={{ fontSize: '0.85rem', padding: '0.35rem 0.65rem' }}
                              value={row.remarks || ''}
                              onChange={(e) => handleStudentRemarksChange(st.id, e.target.value)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                No students found for Class {selectedClass}.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 2: TEACHER MONTHLY VIEW                          */}
      {/* ==================================================== */}
      {activeTab === 'monthly_summary' && (
        <div>
          {/* Filter Bar */}
          <div
            className="card"
            style={{
              padding: '1.25rem',
              marginBottom: '1.5rem',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
              background: '#f8fafc',
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>
                  CLASS
                </label>
                <select
                  className="form-control"
                  style={{ width: 'auto', padding: '0.45rem 0.75rem', fontWeight: 600 }}
                  value={summaryFilterClass}
                  onChange={(e) => setSummaryFilterClass(e.target.value)}
                >
                  <option value="8A">Class 8A</option>
                  <option value="8B">Class 8B</option>
                  <option value="9A">Class 9A</option>
                  <option value="10A">Class 10A</option>
                </select>
              </div>

              {/* Month Navigation */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>
                  MONTH & YEAR
                </label>
                <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                  <button
                    onClick={() =>
                      setTeacherMonthYear((prev) =>
                        prev.month === 1
                          ? { year: prev.year - 1, month: 12 }
                          : { year: prev.year, month: prev.month - 1 }
                      )
                    }
                    className="btn btn-secondary btn-sm"
                  >
                    ◀ Prev
                  </button>
                  <span
                    style={{
                      fontWeight: 700,
                      padding: '0.35rem 0.85rem',
                      background: 'white',
                      border: '1px solid #cbd5e1',
                      borderRadius: 4,
                      minWidth: 140,
                      textAlign: 'center',
                    }}
                  >
                    {monthNames[teacherMonthYear.month - 1]} {teacherMonthYear.year}
                  </span>
                  <button
                    onClick={() =>
                      setTeacherMonthYear((prev) =>
                        prev.month === 12
                          ? { year: prev.year + 1, month: 1 }
                          : { year: prev.year, month: prev.month + 1 }
                      )
                    }
                    className="btn btn-secondary btn-sm"
                  >
                    Next ▶
                  </button>
                </div>
              </div>
            </div>

            {/* Search Input */}
            <div style={{ minWidth: '220px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>
                SEARCH SESSIONS
              </label>
              <input
                type="text"
                placeholder="Search subject or date..."
                className="form-control"
                value={summarySearch}
                onChange={(e) => setSummarySearch(e.target.value)}
                style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          {/* Monthly Table */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div className="card-header" style={{ marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  Teacher 1-Month Attendance Summary: Class {summaryFilterClass}
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  {monthNames[teacherMonthYear.month - 1]} {teacherMonthYear.year} · Complete session audit logs
                </p>
              </div>
            </div>

            {summaryLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                <IconRefreshCw size={24} className="spin" style={{ marginBottom: '0.5rem' }} />
                <div>Loading monthly summaries...</div>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Class</th>
                      <th>Subject</th>
                      <th>Session</th>
                      <th style={{ color: '#047857' }}>Present</th>
                      <th style={{ color: '#b91c1c' }}>Absent</th>
                      <th style={{ color: '#b45309' }}>Late</th>
                      <th style={{ color: '#4338ca' }}>Excused</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlySummaries.filter((s) =>
                      !summarySearch ||
                      s.subjectName?.toLowerCase().includes(summarySearch.toLowerCase()) ||
                      s.date?.includes(summarySearch)
                    ).length > 0 ? (
                      monthlySummaries
                        .filter((s) =>
                          !summarySearch ||
                          s.subjectName?.toLowerCase().includes(summarySearch.toLowerCase()) ||
                          s.date?.includes(summarySearch)
                        )
                        .map((item, idx) => (
                          <tr key={idx}>
                            <td><strong>{item.date}</strong></td>
                            <td><span className="badge badge-primary">{item.classSection}</span></td>
                            <td><strong>{item.subjectName}</strong></td>
                            <td>Period {item.period}</td>
                            <td style={{ color: '#047857', fontWeight: 700 }}>{item.presentCount}</td>
                            <td style={{ color: '#dc2626', fontWeight: 700 }}>{item.absentCount}</td>
                            <td style={{ color: '#d97706', fontWeight: 700 }}>{item.lateCount}</td>
                            <td style={{ color: '#4f46e5', fontWeight: 700 }}>{item.excusedCount}</td>
                            <td>{item.totalStudents}</td>
                            <td>
                              <span className="badge badge-present">✓ {item.status}</span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                onClick={() => handleEditSession(item)}
                                className="btn btn-secondary btn-sm"
                                style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                              >
                                Edit Session
                              </button>
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan={11} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                          No attendance records found for this month.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 3: STUDENT 1-MONTH ATTENDANCE & AUDIT BREAKDOWN  */}
      {/* ==================================================== */}
      {activeTab === 'student_month' && (
        <div>
          {/* Month Selector Bar */}
          <div
            className="card"
            style={{
              padding: '1rem 1.25rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              background: '#f8fafc',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#334155' }}>
                SELECT ATTENDANCE MONTH:
              </span>
              <button
                type="button"
                onClick={handlePrevStudentMonth}
                className="btn btn-secondary btn-sm"
              >
                ◀ Previous Month
              </button>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <select
                  className="form-control"
                  style={{ padding: '0.35rem 0.75rem', fontWeight: 700, width: 'auto' }}
                  value={studentMonthYear.month}
                  onChange={(e) =>
                    setStudentMonthYear((prev) => ({ ...prev, month: Number(e.target.value) }))
                  }
                >
                  {monthNames.map((name, idx) => (
                    <option key={idx} value={idx + 1}>
                      {name}
                    </option>
                  ))}
                </select>
                <select
                  className="form-control"
                  style={{ padding: '0.35rem 0.75rem', fontWeight: 700, width: 'auto' }}
                  value={studentMonthYear.year}
                  onChange={(e) =>
                    setStudentMonthYear((prev) => ({ ...prev, year: Number(e.target.value) }))
                  }
                >
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleNextStudentMonth}
                className="btn btn-secondary btn-sm"
              >
                Next Month ▶
              </button>

              <button
                type="button"
                onClick={handleCurrentStudentMonth}
                className="btn btn-ghost btn-sm"
                style={{ textDecoration: 'underline', color: '#2563eb' }}
              >
                Current Month (Sep 2026)
              </button>
            </div>

            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Student: <strong>{studentReport?.studentName || 'Keerthana'}</strong> · Class:{' '}
              <strong>{studentReport?.classSection || '8A'}</strong>
            </div>
          </div>

          {studentLoading ? (
            <div className="card" style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
              <IconRefreshCw size={28} className="spin" style={{ marginBottom: '0.75rem' }} />
              <div style={{ fontWeight: 600, fontSize: '1rem' }}>Loading attendance records from database...</div>
            </div>
          ) : studentReport ? (
            <>
              {/* Monthly KPI Overview Card */}
              <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1.5rem',
                    marginBottom: '1.5rem',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>
                      MONTHLY ATTENDANCE SCORE
                    </span>
                    <div
                      style={{
                        fontSize: '2.75rem',
                        fontWeight: 900,
                        color: !studentReport.thresholdBreached ? '#065f46' : '#991b1b',
                        lineHeight: 1.1,
                        margin: '0.2rem 0',
                      }}
                    >
                      {studentReport.attendancePercentage}%
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#475569' }}>
                      Month: <strong>{studentReport.monthName}</strong> · Enrolled: <strong>{studentReport.studentName}</strong>
                    </div>
                  </div>

                  {/* Progress Bar & Threshold Info */}
                  <div style={{ textAlign: 'right', minWidth: '240px', flex: '1', maxWidth: '380px' }}>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.35rem' }}>
                      Statutory Minimum Threshold: <strong>75.0%</strong>
                    </div>
                    <div style={{ width: '100%', height: 12, background: '#e2e8f0', borderRadius: 6, overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${Math.min(100, Math.max(0, studentReport.attendancePercentage))}%`,
                          height: '100%',
                          background: !studentReport.thresholdBreached ? '#10b981' : '#ef4444',
                          borderRadius: 6,
                          transition: 'width 0.6s ease',
                        }}
                      />
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.35rem' }}>
                      Tracking {studentReport.totalSessions} scheduled class sessions
                    </div>
                  </div>
                </div>

                {/* 75% Threshold Alert Banner */}
                {studentReport.totalSessions > 0 && (
                  <div
                    className={`alert ${studentReport.thresholdBreached ? 'alert-danger' : 'alert-success'}`}
                    style={{ marginBottom: '1.5rem', fontWeight: 600, fontSize: '0.9rem' }}
                  >
                    {studentReport.thresholdBreached ? (
                      <>
                        <IconAlertTriangle size={20} />
                        <span>
                          Attendance has breached the 75% threshold ({studentReport.attendancePercentage}%). Please submit a medical certificate or parent leave letter.
                        </span>
                      </>
                    ) : (
                      <>
                        <IconCheckCircle size={20} />
                        <span>
                          Congratulations! Attendance satisfies the 75% statutory mandate under institutional regulations ({studentReport.attendancePercentage}% achieved).
                        </span>
                      </>
                    )}
                  </div>
                )}

                {/* 4 Metric Sub-Cards */}
                <div className="grid-4" style={{ gap: '0.75rem' }}>
                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 8, border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>Total Sessions</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>{studentReport.totalSessions}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>1-Month Timetable Log</div>
                  </div>
                  <div style={{ background: '#ecfdf5', padding: '1rem', borderRadius: 8, border: '1px solid #a7f3d0', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#065f46', fontWeight: 700 }}>Days Present</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#047857' }}>{studentReport.daysPresent}</div>
                    <div style={{ fontSize: '0.75rem', color: '#059669' }}>
                      {studentReport.totalSessions > 0
                        ? ((studentReport.daysPresent / studentReport.totalSessions) * 100).toFixed(0)
                        : 0}% of sessions
                    </div>
                  </div>
                  <div style={{ background: '#fef2f2', padding: '1rem', borderRadius: 8, border: '1px solid #fecaca', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#991b1b', fontWeight: 700 }}>Days Absent</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#dc2626' }}>{studentReport.daysAbsent}</div>
                    <div style={{ fontSize: '0.75rem', color: '#ef4444' }}>Missed class sessions</div>
                  </div>
                  <div style={{ background: '#fffbeb', padding: '1rem', borderRadius: 8, border: '1px solid #fde68a', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#92400e', fontWeight: 700 }}>Late / Excused</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#d97706' }}>
                      {studentReport.lateCount + studentReport.excusedCount}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#b45309' }}>
                      {studentReport.lateCount} Late · {studentReport.excusedCount} Excused
                    </div>
                  </div>
                </div>
              </div>

              {/* 1-Month Daily Session Timeline */}
              <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                      📅 1-Month Daily Session Timeline ({studentReport.studentName})
                    </h3>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                      Every daily scheduled timetable class session is displayed with subject & status.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', fontWeight: 600 }}>
                    <span style={{ color: '#047857' }}>● Green = Present</span>
                    <span style={{ color: '#dc2626' }}>● Red = Absent</span>
                    <span style={{ color: '#d97706' }}>● Amber = Late</span>
                    <span style={{ color: '#ea580c' }}>● Orange = Excused / Leave</span>
                  </div>
                </div>

                {Object.keys(groupedSessionsByDate).length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {Object.entries(groupedSessionsByDate).map(([date, sessions]) => {
                      const dateObj = new Date(date + 'T00:00:00Z');
                      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                      const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                      return (
                        <div
                          key={date}
                          style={{
                            padding: '0.85rem 1rem',
                            borderRadius: 8,
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '0.75rem',
                          }}
                        >
                          <div style={{ minWidth: '120px' }}>
                            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>
                              {formattedDate} ({dayName})
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              {sessions.length} sessions scheduled
                            </div>
                          </div>

                          {/* Sessions in that day */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', flex: 1 }}>
                            {sessions.map((session) => {
                              const isPres = session.status === 'PRESENT';
                              const isAbs = session.status === 'ABSENT';
                              const isLate = session.status === 'LATE';
                              const isExc = session.status === 'EXCUSED';

                              const bg = isPres ? '#ecfdf5' : isAbs ? '#fef2f2' : isLate ? '#fffbeb' : '#fff7ed';
                              const border = isPres ? '#a7f3d0' : isAbs ? '#fecaca' : isLate ? '#fde68a' : '#fdba74';
                              const color = isPres ? '#065f46' : isAbs ? '#991b1b' : isLate ? '#92400e' : '#c2410c';

                              return (
                                <div
                                  key={session.id}
                                  style={{
                                    padding: '0.4rem 0.65rem',
                                    borderRadius: 6,
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    background: bg,
                                    border: `1px solid ${border}`,
                                    color: color,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                  }}
                                  title={`Period ${session.period}: ${session.subjectName} - ${isExc ? 'Excused / Leave' : session.status} (${session.remarks || 'Approved Leave'})`}
                                >
                                  <span>{isPres ? '✓' : isAbs ? '✗' : isLate ? '⏰' : '🟠'}</span>
                                  <span>P{session.period}: {session.subjectName}</span>
                                  <span style={{ opacity: 0.95, fontSize: '0.7rem' }}>
                                    ({isExc ? 'Excused / Leave' : session.status})
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    No sessions recorded for {studentReport.monthName}.
                  </div>
                )}
              </div>

              {/* Audit Register & Class Attendance Breakdown */}
              <div className="card" style={{ padding: '1.5rem' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.25rem',
                    flexWrap: 'wrap',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                      Audit Register & Class Attendance Breakdown
                    </h3>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                      Filter and audit individual attendance logs with capture device and recorded remarks.
                    </p>
                  </div>

                  {/* Filter Buttons with Dynamic Counts */}
                  <div
                    style={{
                      display: 'inline-flex',
                      background: '#f1f5f9',
                      padding: 3,
                      borderRadius: 8,
                      gap: 3,
                      flexWrap: 'wrap',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setAuditFilter('ALL')}
                      className={`btn btn-sm ${auditFilter === 'ALL' ? 'btn-primary' : 'btn-ghost'}`}
                    >
                      All Classes ({studentReport.totalSessions})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuditFilter('PRESENT')}
                      className={`btn btn-sm ${auditFilter === 'PRESENT' ? 'btn-success' : 'btn-ghost'}`}
                      style={
                        auditFilter === 'PRESENT'
                          ? { background: '#10b981', color: 'white', borderColor: '#10b981' }
                          : { color: '#047857' }
                      }
                    >
                      ✓ Present ({studentReport.daysPresent})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuditFilter('ABSENT')}
                      className={`btn btn-sm ${auditFilter === 'ABSENT' ? 'btn-danger' : 'btn-ghost'}`}
                      style={
                        auditFilter === 'ABSENT'
                          ? { background: '#ef4444', color: 'white', borderColor: '#ef4444' }
                          : { color: '#b91c1c' }
                      }
                    >
                      ✗ Absent ({studentReport.daysAbsent})
                    </button>
                    {studentReport.lateCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setAuditFilter('LATE')}
                        className={`btn btn-sm ${auditFilter === 'LATE' ? 'btn-secondary' : 'btn-ghost'}`}
                        style={
                          auditFilter === 'LATE'
                            ? { background: '#f59e0b', color: 'white', borderColor: '#f59e0b' }
                            : { color: '#b45309' }
                        }
                      >
                        ⏰ Late ({studentReport.lateCount})
                      </button>
                    )}
                    {studentReport.excusedCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setAuditFilter('EXCUSED')}
                        className={`btn btn-sm ${auditFilter === 'EXCUSED' ? 'btn-secondary' : 'btn-ghost'}`}
                        style={
                          auditFilter === 'EXCUSED'
                            ? { background: '#ea580c', color: 'white', borderColor: '#ea580c' }
                            : { color: '#c2410c' }
                        }
                      >
                        🟠 Excused / Leave ({studentReport.excusedCount})
                      </button>
                    )}
                  </div>
                </div>

                {/* Filter Context Alerts */}
                {auditFilter === 'ABSENT' && (
                  <div className="alert alert-warning" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
                    <strong>⚠️ Missed Classes Review:</strong> Recorded absent on{' '}
                    <strong>{studentReport.daysAbsent} occasions</strong> during {studentReport.monthName}. Please submit leave documentation for authorized exemption.
                  </div>
                )}
                {auditFilter === 'PRESENT' && (
                  <div className="alert alert-success" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
                    <strong>✓ Attended Sessions:</strong> Verified attendance across{' '}
                    <strong>{studentReport.daysPresent} class sessions</strong> via RFID, Biometric Scanner, and Teacher manual register.
                  </div>
                )}

                {/* Audit Table */}
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Class</th>
                        <th>Subject</th>
                        <th>Session/Period</th>
                        <th>Attendance Status</th>
                        <th>Capture Device / Verification</th>
                        <th>Audited Reason / Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAuditSessions.length > 0 ? (
                        filteredAuditSessions.map((rec) => (
                          <tr key={rec.id}>
                            <td><strong>{rec.date}</strong></td>
                            <td><span className="badge badge-primary">{studentReport.classSection || '8A'}</span></td>
                            <td><strong>{rec.subjectName}</strong></td>
                            <td>Period {rec.period}</td>
                            <td>
                              <span
                                className={`badge ${
                                  rec.status === 'PRESENT'
                                    ? 'badge-present'
                                    : rec.status === 'ABSENT'
                                    ? 'badge-absent'
                                    : rec.status === 'LATE'
                                    ? 'badge-late'
                                    : 'badge-excused'
                                }`}
                                style={
                                  rec.status === 'EXCUSED'
                                    ? { background: '#ffedd5', color: '#c2410c', border: '1px solid #fdba74', fontWeight: 700 }
                                    : {}
                                }
                              >
                                {rec.status === 'PRESENT'
                                  ? '✓ PRESENT'
                                  : rec.status === 'ABSENT'
                                  ? '✗ ABSENT'
                                  : rec.status === 'LATE'
                                  ? '⏰ LATE'
                                  : '🟠 Excused / Leave'}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontSize: '0.85rem', color: '#475569' }}>
                                {rec.capturedBy === 'RFID'
                                  ? '🏷️ RFID Smart Card'
                                  : rec.capturedBy === 'BIOMETRIC'
                                  ? '🖐️ Optical Biometric'
                                  : '✍️ Teacher Marked'}
                              </span>
                            </td>
                            <td>
                              {rec.remarks ? (
                                <span style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 600 }}>
                                  {rec.remarks}
                                </span>
                              ) : (
                                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>—</span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                            No records match the selected filter for {studentReport.monthName}.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="card" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
              No attendance records found for this month.
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 4: BELOW 75% RISK LIST                           */}
      {/* ==================================================== */}
      {activeTab === 'below75' && (
        <div className="card" style={{ padding: '1.25rem' }}>
          <div className="card-header" style={{ marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#b91c1c', margin: 0 }}>
                ⚠️ Below 75% Attendance Compliance Registry (FR8)
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
                Statutory inspection list prepared for regulatory compliance and parent notification intimation.
              </p>
            </div>
          </div>

          {below75Loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              <IconRefreshCw size={24} className="spin" style={{ marginBottom: '0.5rem' }} />
              <div>Loading below 75% students...</div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Admission Number</th>
                    <th>Class Section</th>
                    <th>Parent Contact Number</th>
                    <th>Statutory Warning Status</th>
                  </tr>
                </thead>
                <tbody>
                  {below75List.length > 0 ? (
                    below75List.map((st) => (
                      <tr key={st.id}>
                        <td>
                          <strong>{st.name}</strong>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{st.email}</div>
                        </td>
                        <td>{st.admissionNumber || `ADM-${st.id}`}</td>
                        <td><span className="badge badge-late">Class {st.classSection || '8A'}</span></td>
                        <td>📞 {st.parentMobile || '9876543210'}</td>
                        <td>
                          <span className="badge badge-absent">
                            ⚠️ Below 75% Threshold Breach
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#10b981', fontWeight: 600 }}>
                        ✓ All enrolled students currently satisfy the 75% minimum institutional attendance mandate.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 5: ABSENCE PATTERN HEATMAP (FR5)                 */}
      {/* ==================================================== */}
      {activeTab === 'heatmap' && (
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Class-Wise Absence Heatmap by Day of Week (FR5)
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
              Identifies persistent clusters of absenteeism across sections and academic weekdays.
            </p>
          </div>

          <div className="table-responsive">
            <table className="table" style={{ textAlign: 'center' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Class Section</th>
                  <th>Monday</th>
                  <th>Tuesday</th>
                  <th>Wednesday</th>
                  <th>Thursday</th>
                  <th>Friday</th>
                  <th>Saturday</th>
                  <th>Weekly Risk Level</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { section: 'Class 8A', mon: 4, tue: 2, wed: 3, thu: 1, fri: 6, sat: 8, risk: 'Moderate' },
                  { section: 'Class 8B', mon: 2, tue: 1, wed: 2, thu: 2, fri: 4, sat: 5, risk: 'Low' },
                  { section: 'Class 9A', mon: 7, tue: 5, wed: 6, thu: 4, fri: 9, sat: 12, risk: 'High' },
                  { section: 'Class 10A', mon: 1, tue: 1, wed: 0, thu: 2, fri: 3, sat: 4, risk: 'Very Low' },
                ].map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ textAlign: 'left', fontWeight: 700 }}>{row.section}</td>
                    {[row.mon, row.tue, row.wed, row.thu, row.fri, row.sat].map((val, dIdx) => {
                      const bg = val <= 2 ? '#ecfdf5' : val <= 5 ? '#fef3c7' : '#fee2e2';
                      const color = val <= 2 ? '#047857' : val <= 5 ? '#b45309' : '#b91c1c';
                      return (
                        <td key={dIdx}>
                          <span
                            style={{
                              display: 'inline-block',
                              minWidth: 44,
                              padding: '0.35rem 0.5rem',
                              borderRadius: 6,
                              background: bg,
                              color: color,
                              fontWeight: 700,
                              fontSize: '0.85rem',
                            }}
                          >
                            {val} abs
                          </span>
                        </td>
                      );
                    })}
                    <td>
                      <span
                        className={`badge ${
                          row.risk === 'High'
                            ? 'badge-danger'
                            : row.risk === 'Moderate'
                            ? 'badge-warning'
                            : 'badge-success'
                        }`}
                      >
                        {row.risk}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
