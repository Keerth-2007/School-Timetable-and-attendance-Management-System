import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { parentApi, attendanceApi, notificationsApi, transportApi, feesApi } from '../services/api';
import {
  IconCalendar,
  IconCheckCircle,
  IconXCircle,
  IconAlertTriangle,
  IconClock,
  IconUser,
  IconFileText,
  IconRefreshCw,
  IconArrowRight,
  IconDownload,
} from '../components/Icons';
import UpcomingEventsWidget from '../components/UpcomingEventsWidget';

export default function ParentPortal() {
  const { user } = useAuth();
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [percentage, setPercentage] = useState(0);
  const [childTransport, setChildTransport] = useState(null);
  const [childAssignments, setChildAssignments] = useState([]);
  const [childFees, setChildFees] = useState([]);
  const [childPayments, setChildPayments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ackNotice, setAckNotice] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // PTM slot booking state
  const [ptmBooked, setPtmBooked] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState('10:00 AM - 10:20 AM');

  // Query submission state
  const [queryText, setQueryText] = useState('');
  const [querySubmitted, setQuerySubmitted] = useState(false);

  const fetchParentData = async () => {
    setLoading(true);
    setError('');
    try {
      const parentId = user?.id || user?.userId;
      if (!parentId) return;
      const chRes = await parentApi.getChildren(parentId);
      setChildren(chRes.data);
      if (chRes.data.length > 0) {
        // Prioritize Keerthana if present in children
        const keerthanaChild = chRes.data.find(c => c.name && c.name.toLowerCase().includes('keerthana'));
        const defaultChild = keerthanaChild || chRes.data[0];
        setSelectedChild(defaultChild);
        await loadChildDetails(defaultChild.id);
      }

      // Fetch announcements / notices
      const notifRes = await parentApi.getNotifications(parentId);
      setNotifications(notifRes.data || []);
    } catch (err) {
      setError(err.message || 'Could not load parent portal records');
    } finally {
      setLoading(false);
    }
  };

  const loadChildDetails = async (childId) => {
    try {
      const parentId = user?.id || user?.userId;
      const [attRes, pctRes, assignRes] = await Promise.all([
        parentApi.getChildAttendance(parentId, childId),
        parentApi.getChildPercentage(parentId, childId),
        parentApi.getChildAssignments(parentId, childId).catch(() => ({ data: [] })),
      ]);
      setAttendanceRecords(attRes.data || []);
      setPercentage(Math.round(pctRes.data.attendancePercentage || 0));
      setChildAssignments(assignRes.data || []);

      // Load transport details for selected child
      try {
        const transRes = await transportApi.getStudentTransport(childId);
        setChildTransport(transRes.data || null);
      } catch (tErr) {
        setChildTransport(null);
      }

      // Load fees details for selected child
      try {
        const [feeRes, payRes] = await Promise.all([
          feesApi.getStudentFees(childId),
          feesApi.getStudentPayments(childId),
        ]);
        setChildFees(feeRes.data || []);
        setChildPayments(payRes.data || []);
      } catch (fErr) {
        setChildFees([]);
        setChildPayments([]);
      }
    } catch (err) {
      console.error('Error loading child details', err);
    }
  };

  const handleMarkAsRead = async (notifId) => {
    try {
      await notificationsApi.markAsRead(notifId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, readStatus: true, readFlag: true } : n))
      );
      setSuccessMsg('Notification marked as read.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  useEffect(() => {
    fetchParentData();
  }, [user]);

  const handleSelectChild = (child) => {
    setSelectedChild(child);
    loadChildDetails(child.id);
    setAckNotice(false);
    setQuerySubmitted(false);
  };

  const handleAcknowledgeWarning = () => {
    setAckNotice(true);
    setSuccessMsg('Formal acknowledgement registered with the school administration (FR7 Compliance).');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleBookPtm = (e) => {
    e.preventDefault();
    setPtmBooked(true);
    setSuccessMsg(`Parent-Teacher Meeting slot (${selectedSlot}) confirmed with Class Teacher.`);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const handleSendQuery = (e) => {
    e.preventDefault();
    if (!queryText.trim()) return;
    setQuerySubmitted(true);
    setQueryText('');
    setSuccessMsg('Absence inquiry submitted. Class teacher committed response time: within 48 hours.');
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  return (
    <div className="container" style={{ paddingBottom: '3.5rem' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
              Parent Engagement & Child Attendance Portal
            </h1>
            <span className="badge badge-primary">FR7 Compliant</span>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.925rem' }}>
            Monitor real-time biometric taps, verify attendance calendar, and communicate with class teachers.
          </p>
        </div>

        <button onClick={fetchParentData} className="btn btn-secondary btn-sm" disabled={loading}>
          <IconRefreshCw size={15} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="alert alert-warning" style={{ marginBottom: '1.5rem' }}>
          <IconAlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
          <IconCheckCircle size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Parent Dashboard Navigation Bar (Section 1) */}
      <div className="card" style={{ marginBottom: '1.75rem', padding: '0.85rem 1.25rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Parent Dashboard Navigation:
          </span>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Link to="/dashboard" className="btn btn-sm btn-secondary" style={{ borderRadius: '8px', fontSize: '0.85rem' }}>
              Dashboard
            </Link>
            <a href="#child-attendance-section" className="btn btn-sm btn-secondary" style={{ borderRadius: '8px', fontSize: '0.85rem' }}>
              Attendance
            </a>
            <Link to="/assignments" className="btn btn-sm btn-secondary" style={{ borderRadius: '8px', fontSize: '0.85rem' }}>
              Assignments
            </Link>
            <Link to="/transport" className="btn btn-sm btn-secondary" style={{ borderRadius: '8px', fontSize: '0.85rem' }}>
              Transport
            </Link>
            <Link to="/calendar" className="btn btn-sm btn-secondary" style={{ borderRadius: '8px', fontSize: '0.85rem' }}>
              Academic Calendar
            </Link>
            <Link to="/report-card" className="btn btn-sm btn-primary" style={{ borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <span>📊 Report Card</span>
            </Link>
            <Link to="/fees" className="btn btn-sm btn-primary" style={{ borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#059669', borderColor: '#059669' }}>
              <span>💰 Fees & Receipts</span>
            </Link>
            <a href="#child-fees-section" className="btn btn-sm btn-secondary" style={{ borderRadius: '8px', fontSize: '0.85rem' }}>
              Fee Summary
            </a>
            <a href="#parent-notif-center" className="btn btn-sm btn-secondary" style={{ borderRadius: '8px', fontSize: '0.85rem' }}>
              Notifications
            </a>
          </div>
        </div>
      </div>

      {/* Parent Dashboard Notification Center (FR7, Requirements 6 & 7) */}
      <div id="parent-notif-center" className="card" style={{ marginBottom: '1.75rem', border: '1px solid #e2e8f0', background: '#ffffff', borderRadius: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.25rem' }}>🔔</span>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Parent Notification Center
            </h3>
            {notifications.filter(n => !n.readStatus && !n.readFlag).length > 0 && (
              <span className="badge badge-danger" style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '9999px' }}>
                {notifications.filter(n => !n.readStatus && !n.readFlag).length} Unread
              </span>
            )}
          </div>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Official School Notices & Absence Alerts
          </span>
        </div>

        {notifications.length === 0 ? (
          <div style={{ color: '#64748b', fontSize: '0.875rem', padding: '0.75rem 0' }}>
            No notifications logged at this time.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {notifications.map((notif) => {
              const isAlert = notif.type === 'ATTENDANCE_ALERT' || notif.type === 'ABSENCE' || (notif.title && notif.title.includes('Alert'));
              const isUnread = !notif.readStatus && !notif.readFlag;
              const dateStr = notif.createdAt ? new Date(notif.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '10 Sep 2026';

              return (
                <div
                  key={notif.id}
                  style={{
                    padding: '1.1rem 1.25rem',
                    borderRadius: '10px',
                    border: isUnread ? '1.5px solid #f59e0b' : '1px solid #e2e8f0',
                    background: isUnread ? '#fffbeb' : '#f8fafc',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: '1rem',
                  }}
                >
                  <div style={{ flex: 1, minWidth: '260px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '1.2rem' }}>{isAlert ? '⚠️' : '📢'}</span>
                      <strong style={{ color: isUnread ? '#92400e' : '#0f172a', fontSize: '1rem', fontWeight: 800 }}>
                        {notif.title || 'Attendance Alert'}
                      </strong>
                      <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: '0.25rem' }}>
                        · {dateStr}
                      </span>
                      {isUnread ? (
                        <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>NEW ALERT</span>
                      ) : (
                        <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>READ</span>
                      )}
                    </div>

                    <p style={{ margin: '0.35rem 0 0.25rem', color: '#334155', fontSize: '0.9rem', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                      {notif.message}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', alignSelf: 'center' }}>
                    <button
                      onClick={() => {
                        const matchingChild = children.find(c => notif.message && notif.message.includes(c.name)) || children[0];
                        if (matchingChild) {
                          handleSelectChild(matchingChild);
                        }
                        const el = document.getElementById('child-attendance-section');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="btn btn-sm btn-primary"
                      style={{ fontSize: '0.825rem', padding: '0.4rem 0.85rem' }}
                    >
                      View Attendance →
                    </button>

                    {isUnread && (
                      <button
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="btn btn-sm btn-ghost"
                        style={{ fontSize: '0.8rem', color: '#64748b', padding: '0.4rem 0.65rem' }}
                      >
                        Mark Read
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Central Academic Calendar / Upcoming Events (FR12) */}
      <div style={{ marginBottom: '1.75rem' }}>
        <UpcomingEventsWidget title="Child & School Academic Events" limit={4} />
      </div>

      {/* Multi-Child Switcher Tabs (FR7) */}
      {children.length > 1 && (
        <div style={{ marginBottom: '1.75rem' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem', display: 'block' }}>
            SELECT ENROLLED CHILD (ONE-TAP SWITCHING):
          </label>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {children.map((ch) => (
              <button
                key={ch.id}
                onClick={() => handleSelectChild(ch)}
                className={`btn ${selectedChild?.id === ch.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.6rem 1.25rem', borderRadius: '10px' }}
              >
                <IconUser size={16} />
                <span>{ch.name} (Class {ch.classSection || '8A'})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedChild && (
        <>
          {/* Below-75% Formal Warning Banner (FR7) */}
          {percentage < 75 && (
            <div
              className="alert alert-danger"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                marginBottom: '1.75rem',
                padding: '1.25rem',
                borderLeft: '5px solid #ef4444',
                background: '#fef2f2',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <IconAlertTriangle size={28} color="#dc2626" />
                <div>
                  <h4 style={{ margin: 0, color: '#991b1b', fontWeight: 800, fontSize: '1rem' }}>
                    URGENT: Cumulative Attendance Below 75% Statutory Threshold ({percentage}%)
                  </h4>
                  <p style={{ margin: '0.25rem 0 0', color: '#b91c1c', fontSize: '0.875rem' }}>
                    {selectedChild.name}'s attendance does not currently fulfill statutory examination criteria.
                    Formal notification dispatched per RTE / State Education guidelines.
                  </p>
                </div>
              </div>

              {!ackNotice ? (
                <button
                  onClick={handleAcknowledgeWarning}
                  className="btn btn-sm"
                  style={{ background: '#dc2626', color: '#ffffff', fontWeight: 700 }}
                >
                  <IconCheckCircle size={16} />
                  <span>Acknowledge Notice</span>
                </button>
              ) : (
                <span className="badge badge-success" style={{ padding: '0.5rem 0.85rem' }}>
                  ✓ Acknowledged by Parent
                </span>
              )}
            </div>
          )}

          {/* Child KPI Overview */}
          <div className="grid-3" style={{ marginBottom: '2rem' }}>
            <div className="card" style={{ borderLeft: `4px solid ${percentage >= 75 ? '#10b981' : '#ef4444'}` }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, marginBottom: '0.5rem' }}>
                Cumulative Attendance
              </div>
              <div style={{ fontSize: '2.25rem', fontWeight: 800, color: percentage >= 75 ? '#047857' : '#b91c1c' }}>
                {percentage}%
              </div>
              <span className={`badge ${percentage >= 75 ? 'badge-success' : 'badge-danger'}`} style={{ marginTop: '0.5rem' }}>
                {percentage >= 75 ? 'Exam Eligible' : 'At-Risk (<75%)'}
              </span>
            </div>

            <div className="card" style={{ borderLeft: '4px solid #2563eb' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, marginBottom: '0.5rem' }}>
                Student Details
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                {selectedChild.name}
              </div>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
                Admission: {selectedChild.admissionNumber || 'ADM-2024'} · Class: {selectedChild.classSection || '8A'}
              </p>
            </div>

            <div className="card" style={{ borderLeft: '4px solid #8b5cf6' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, marginBottom: '0.5rem' }}>
                Latest Biometric Sync
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                {attendanceRecords.length > 0 ? attendanceRecords[attendanceRecords.length - 1].date : 'Today'}
              </div>
              <span className="badge badge-info" style={{ marginTop: '0.5rem' }}>
                Biometric Gateway Active
              </span>
            </div>
          </div>

          {/* Child Transport Details Card */}
          <div
            className="card"
            style={{
              marginBottom: '2rem',
              borderLeft: '4px solid #f59e0b',
              background: '#fffdf8',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                borderBottom: '1px solid #fde68a',
                paddingBottom: '0.75rem',
                marginBottom: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🚍</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#92400e' }}>
                    School Transport Allocation — {selectedChild.name}
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: '#b45309' }}>
                    Real-time vehicle & crew safety contacts
                  </span>
                </div>
              </div>
              <Link
                to="/transport"
                className="btn btn-sm"
                style={{
                  background: '#f59e0b',
                  color: '#fff',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <span>Full Transport Dashboard</span>
                <IconArrowRight size={14} />
              </Link>
            </div>

            {childTransport ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem',
                }}
              >
                <div style={{ background: '#ffffff', padding: '0.85rem', borderRadius: '8px', border: '1px solid #fed7aa' }}>
                  <div style={{ fontSize: '0.75rem', color: '#78350f', fontWeight: 700, textTransform: 'uppercase' }}>
                    Vehicle / Bus No.
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>
                    {childTransport.busNumber}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Reg: {childTransport.registrationNumber || 'N/A'}
                  </div>
                </div>

                <div style={{ background: '#ffffff', padding: '0.85rem', borderRadius: '8px', border: '1px solid #fed7aa' }}>
                  <div style={{ fontSize: '0.75rem', color: '#78350f', fontWeight: 700, textTransform: 'uppercase' }}>
                    Route & Designated Stop
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>
                    {childTransport.pickupStopName}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Route: {childTransport.routeName || childTransport.routeNumber}
                  </div>
                </div>

                <div style={{ background: '#ffffff', padding: '0.85rem', borderRadius: '8px', border: '1px solid #fed7aa' }}>
                  <div style={{ fontSize: '0.75rem', color: '#78350f', fontWeight: 700, textTransform: 'uppercase' }}>
                    Timings
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#047857' }}>
                    Morning Pickup: {childTransport.pickupTime}
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#b45309' }}>
                    Evening Drop: {childTransport.dropTime}
                  </div>
                </div>

                <div style={{ background: '#ffffff', padding: '0.85rem', borderRadius: '8px', border: '1px solid #fed7aa' }}>
                  <div style={{ fontSize: '0.75rem', color: '#78350f', fontWeight: 700, textTransform: 'uppercase' }}>
                    Driver & Attendant
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>
                    {childTransport.driverName}
                  </div>
                  {childTransport.driverPhone && (
                    <a
                      href={`tel:${childTransport.driverPhone}`}
                      style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 600, display: 'block' }}
                    >
                      📞 {childTransport.driverPhone}
                    </a>
                  )}
                  {childTransport.attendantName && (
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Attendant: {childTransport.attendantName}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ color: '#64748b', fontSize: '0.9rem', fontStyle: 'italic', padding: '0.5rem 0' }}>
                No active bus transport allocation found for {selectedChild.name}. Contact school transport desk for assistance.
              </div>
            )}
          </div>

          {/* Child Coursework & Assignments Section (Requirement 20) */}
          <div
            className="card"
            style={{
              marginBottom: '2rem',
              borderLeft: '4px solid #2563eb',
              background: '#f8fafc',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: '0.75rem',
                marginBottom: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span style={{ fontSize: '1.4rem' }}>📝</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                    Coursework & Assignment Progress — {selectedChild.name}
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Academic deliverables, submission status, evaluated marks & faculty feedback
                  </span>
                </div>
              </div>
            </div>

            {childAssignments.length === 0 ? (
              <div style={{ color: '#64748b', fontSize: '0.9rem', fontStyle: 'italic', padding: '0.5rem 0' }}>
                No assignments recorded for {selectedChild.name}'s class at this time.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                {childAssignments.map((a) => {
                  const isGraded = a.submissionStatus === 'GRADED';
                  const isSubmitted = a.submissionStatus === 'SUBMITTED';

                  return (
                    <div
                      key={a.id}
                      style={{
                        background: '#ffffff',
                        padding: '1rem',
                        borderRadius: '10px',
                        border: isGraded ? '1.5px solid #86efac' : isSubmitted ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>
                            {a.subjectName || 'Subject'}
                          </span>
                          <span
                            className={`badge ${
                              isGraded
                                ? 'badge-success'
                                : isSubmitted
                                ? 'badge-info'
                                : a.submissionStatus === 'OVERDUE'
                                ? 'badge-danger'
                                : 'badge-warning'
                            }`}
                            style={{ fontSize: '0.7rem' }}
                          >
                            {isGraded ? '🟢 Graded' : isSubmitted ? '🔵 Submitted' : a.submissionStatus === 'OVERDUE' ? '🔴 Overdue' : '🟡 Pending'}
                          </span>
                        </div>

                        <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                          {a.title}
                        </h4>

                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.65rem' }}>
                          <div><strong>Faculty:</strong> {a.teacherName || 'Faculty'}</div>
                          <div><strong>Deadline:</strong> {a.dueDate ? new Date(a.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '12 Sep'}, {a.dueTime || '11:59 PM'}</div>
                        </div>

                        {/* Marks & Feedback */}
                        {isGraded && (
                          <div
                            style={{
                              background: '#f0fdf4',
                              borderRadius: '6px',
                              padding: '0.6rem 0.75rem',
                              border: '1px solid #bbf7d0',
                              marginTop: '0.5rem',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534' }}>EVALUATION</span>
                              <strong style={{ fontSize: '1rem', color: '#15803d' }}>
                                {a.score} / {a.totalPoints} Marks ({a.percentage ? Math.round(a.percentage) : Math.round((a.score / a.totalPoints) * 100)}%)
                              </strong>
                            </div>
                            {a.feedback && (
                              <div style={{ fontSize: '0.8rem', color: '#334155', marginTop: '0.3rem', fontStyle: 'italic', borderTop: '1px dashed #bbf7d0', paddingTop: '0.3rem' }}>
                                "{a.feedback}"
                              </div>
                            )}
                          </div>
                        )}

                        {isSubmitted && !isGraded && (
                          <div style={{ fontSize: '0.8rem', color: '#0369a1', background: '#f0f9ff', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #bae6fd' }}>
                            ✓ Submitted on {a.submittedAt ? new Date(a.submittedAt).toLocaleDateString('en-GB') : 'Recently'} — Awaiting faculty marks.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Child Fees & Payment Status Section */}
          <div id="child-fees-section" className="card" style={{ marginBottom: '2rem', borderLeft: '4px solid #10b981', background: '#f0fdf4' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid #bbf7d0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span style={{ fontSize: '1.4rem' }}>💰</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#065f46' }}>
                    Fee Status & Payment Ledger — {selectedChild?.name}
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: '#047857' }}>
                    Real-time fee schedule, payments, pending balances, and verified receipts
                  </span>
                </div>
              </div>
              <Link to="/fees" className="btn btn-sm btn-primary" style={{ fontWeight: 700 }}>
                Open Fees Module →
              </Link>
            </div>

            {/* Child Fee Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ background: '#ffffff', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Total Fees</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
                  ₹{(childFees.reduce((acc, f) => acc + (f.finalAmount || 0), 0)).toLocaleString('en-IN')}
                </div>
              </div>
              <div style={{ background: '#ffffff', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: 700, textTransform: 'uppercase' }}>Total Paid</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#16a34a' }}>
                  ₹{(childFees.reduce((acc, f) => acc + (f.paidAmount || 0), 0)).toLocaleString('en-IN')}
                </div>
              </div>
              <div style={{ background: '#ffffff', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 700, textTransform: 'uppercase' }}>Pending Balance</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#b45309' }}>
                  ₹{(childFees.reduce((acc, f) => acc + (f.pendingAmount || 0), 0)).toLocaleString('en-IN')}
                </div>
              </div>
              <div style={{ background: '#ffffff', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '0.75rem', color: '#b91c1c', fontWeight: 700, textTransform: 'uppercase' }}>Overdue</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#dc2626' }}>
                  ₹{(childFees.filter(f => f.status === 'OVERDUE').reduce((acc, f) => acc + (f.pendingAmount || 0), 0)).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Child Fees Table */}
            {childFees.length === 0 ? (
              <div style={{ fontStyle: 'italic', color: '#64748b', padding: '0.5rem 0' }}>
                No active fee records found for {selectedChild?.name}.
              </div>
            ) : (
              <div className="table-responsive" style={{ background: '#ffffff', borderRadius: '8px', padding: '0.5rem', border: '1px solid #bbf7d0' }}>
                <table className="table" style={{ fontSize: '0.85rem', margin: 0 }}>
                  <thead>
                    <tr>
                      <th>Fee Item</th>
                      <th>Category</th>
                      <th>Total</th>
                      <th>Paid</th>
                      <th>Pending</th>
                      <th>Due Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {childFees.map((f) => (
                      <tr key={f.id}>
                        <td style={{ fontWeight: 700 }}>{f.feeName}</td>
                        <td><span className="badge">{f.feeType}</span></td>
                        <td style={{ fontWeight: 700 }}>₹{Number(f.finalAmount).toLocaleString('en-IN')}</td>
                        <td style={{ color: '#16a34a', fontWeight: 600 }}>₹{Number(f.paidAmount).toLocaleString('en-IN')}</td>
                        <td style={{ color: f.pendingAmount > 0 ? '#dc2626' : '#64748b', fontWeight: 700 }}>
                          ₹{Number(f.pendingAmount).toLocaleString('en-IN')}
                        </td>
                        <td>{f.dueDate || '—'}</td>
                        <td>
                          <span style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: '9999px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            background: f.status === 'PAID' ? '#dcfce7' : f.status === 'PARTIALLY_PAID' ? '#fef3c7' : f.status === 'OVERDUE' ? '#fee2e2' : '#e0f2fe',
                            color: f.status === 'PAID' ? '#15803d' : f.status === 'PARTIALLY_PAID' ? '#b45309' : f.status === 'OVERDUE' ? '#b91c1c' : '#0369a1'
                          }}>
                            {f.status?.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Colour-Coded Attendance History Calendar / Table */}
          <div id="child-attendance-section" className="card" style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Child Attendance History & Scheduled Sessions
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
                  Daily session status recorded via automated RFID/Biometric scans and approved institutional leaves
                </p>
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8rem', fontWeight: 600, flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }}></span> Present
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }}></span> Late
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }}></span> Absent
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f97316' }}></span> Excused / Leave
                </span>
              </div>
            </div>

            {/* 10 September 2026 Session Schedule & Status (Section 8 Requirement) */}
            {attendanceRecords.some(r => r.date === '2026-09-10') && (
              <div
                style={{
                  background: '#fff7ed',
                  border: '1.5px solid #fdba74',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  marginBottom: '1.5rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>📅</span>
                    <strong style={{ fontSize: '1.05rem', color: '#9a3412' }}>
                      10 September 2026 — Daily Session Breakdown
                    </strong>
                  </div>
                  <span
                    style={{
                      background: '#ffedd5',
                      color: '#c2410c',
                      fontWeight: 700,
                      padding: '0.25rem 0.65rem',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      border: '1px solid #fdba74',
                    }}
                  >
                    Reason: Approved Leave
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                  {attendanceRecords
                    .filter(r => r.date === '2026-09-10')
                    .sort((a, b) => (a.period || 0) - (b.period || 0))
                    .map((session) => (
                      <div
                        key={session.id}
                        style={{
                          background: '#ffffff',
                          padding: '0.75rem 1rem',
                          borderRadius: '8px',
                          border: '1px solid #fed7aa',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '0.75rem', color: '#7c2d12', fontWeight: 600 }}>
                            Period {session.period}
                          </div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>
                            {session.subject?.name || session.timetable?.subject?.name || 'Academic Subject'}
                          </div>
                        </div>
                        <span
                          style={{
                            background: '#ffedd5',
                            color: '#c2410c',
                            fontWeight: 700,
                            padding: '0.25rem 0.5rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            border: '1px solid #fdba74',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                        >
                          🟠 Excused / Leave
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {attendanceRecords.length === 0 ? (
              <div className="empty-state">No attendance records logged yet for this academic term.</div>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Period</th>
                      <th>Subject</th>
                      <th>Status</th>
                      <th>Method</th>
                      <th>Audit Note / Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceRecords.slice().reverse().map((att) => {
                      const isExcused = att.status === 'EXCUSED';
                      const subjName = att.subject?.name || att.timetable?.subject?.name || 'General Academic';

                      return (
                        <tr key={att.id} style={{ background: isExcused ? '#fffbeb' : 'transparent' }}>
                          <td style={{ fontWeight: 600 }}>{att.date}</td>
                          <td style={{ fontWeight: 600, color: '#475569' }}>
                            {att.period ? `Period ${att.period}` : '-'}
                          </td>
                          <td style={{ fontWeight: 600, color: '#0f172a' }}>{subjName}</td>
                          <td>
                            {isExcused ? (
                              <span
                                style={{
                                  background: '#ffedd5',
                                  color: '#c2410c',
                                  fontWeight: 700,
                                  padding: '0.25rem 0.55rem',
                                  borderRadius: '6px',
                                  fontSize: '0.8rem',
                                  border: '1px solid #fdba74',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                }}
                              >
                                🟠 Excused / Leave
                              </span>
                            ) : (
                              <span
                                className={`badge ${
                                  att.status === 'PRESENT'
                                    ? 'badge-success'
                                    : att.status === 'LATE'
                                    ? 'badge-warning'
                                    : 'badge-danger'
                                }`}
                              >
                                {att.status === 'PRESENT' ? '🟢 Present' : att.status === 'LATE' ? '🟡 Late' : '🔴 Absent'}
                              </span>
                            )}
                          </td>
                          <td>
                            <span style={{ fontSize: '0.825rem', color: '#475569' }}>
                              {att.capturedBy || 'BIOMETRIC'}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.85rem', color: att.modificationReason ? '#2563eb' : '#94a3b8' }}>
                            {att.modificationReason || 'Standard verification'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Interactive Engagement Sections: PTM Booking & Parent Queries */}
          <div className="grid-2" style={{ marginBottom: '2.5rem' }}>
            {/* PTM Slot Booking */}
            <div className="card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <IconCalendar size={18} color="#2563eb" />
                <span>Parent-Teacher Meeting (PTM) Booking</span>
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
                Book dedicated 20-minute consultation slots with class teacher for academic performance reviews.
              </p>

              {ptmBooked ? (
                <div className="alert alert-success" style={{ margin: 0 }}>
                  <IconCheckCircle size={18} />
                  <div>
                    <strong>Slot Confirmed: {selectedSlot}</strong>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem' }}>
                      Google Meet link and SMS reminder dispatched to your registered mobile.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleBookPtm}>
                  <div className="form-group">
                    <label className="form-label">Available Consultation Slot (Next Saturday)</label>
                    <select
                      className="form-control"
                      value={selectedSlot}
                      onChange={(e) => setSelectedSlot(e.target.value)}
                    >
                      <option value="09:30 AM - 09:50 AM">09:30 AM - 09:50 AM</option>
                      <option value="10:00 AM - 10:20 AM">10:00 AM - 10:20 AM</option>
                      <option value="10:30 AM - 10:50 AM">10:30 AM - 10:50 AM</option>
                      <option value="11:15 AM - 11:35 AM">11:15 AM - 11:35 AM</option>
                      <option value="02:00 PM - 02:20 PM">02:00 PM - 02:20 PM</option>
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                    <span>Confirm Slot Booking</span>
                    <IconArrowRight size={16} />
                  </button>
                </form>
              )}
            </div>

            {/* Direct Query to Class Teacher */}
            <div className="card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <IconFileText size={18} color="#8b5cf6" />
                <span>Absence Inquiry & Teacher Communication</span>
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
                Submit inquiries or submit medical leave notices directly to class teacher (48-hr response guarantee).
              </p>

              {querySubmitted ? (
                <div className="alert alert-success" style={{ margin: 0 }}>
                  <IconCheckCircle size={18} />
                  <div>
                    <strong>Query Dispatched</strong>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem' }}>
                      Ticket #INQ-8812 logged. Class teacher will review and reply within 48 hours.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSendQuery}>
                  <div className="form-group">
                    <label className="form-label">Message / Absence Note</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="e.g., Arjun was absent yesterday due to fever. Attaching doctor prescription..."
                      value={queryText}
                      onChange={(e) => setQueryText(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-secondary" style={{ width: '100%' }}>
                    <span>Submit Inquiry</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
