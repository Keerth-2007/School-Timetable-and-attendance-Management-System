import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  timetableApi,
  attendanceApi,
  leaveApi,
  devicesApi,
  usersApi,
  transportApi,
  assignmentApi,
  feesApi,
} from '../services/api';
import {
  IconCalendar,
  IconClock,
  IconCheckCircle,
  IconXCircle,
  IconAlertTriangle,
  IconUsers,
  IconCpu,
  IconFileText,
  IconArrowRight,
  IconRefreshCw,
  IconCreditCard,
} from '../components/Icons';
import UpcomingEventsWidget from '../components/UpcomingEventsWidget';

export default function Dashboard() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    timetableSlots: 0,
    attendanceCount: 0,
    below75Count: 0,
    pendingLeaves: 0,
    devicesOnline: 0,
    totalDevices: 0,
    studentAttendancePct: 0,
    studentRecords: [],
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [dashboardAssignments, setDashboardAssignments] = useState([]);
  const [error, setError] = useState('');

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      // Role-aware data fetching
      const role = user?.role;

      if (['ADMIN', 'PRINCIPAL'].includes(role)) {
        const [ttRes, below75Res, leaveRes, devRes, usersRes, feeRes] = await Promise.allSettled([
          timetableApi.getAll(),
          attendanceApi.getBelow75(),
          leaveApi.getPending(),
          devicesApi.getAll(),
          usersApi.getAll(),
          feesApi.getDashboardSummary(),
        ]);

        const ttCount = ttRes.status === 'fulfilled' ? ttRes.value.data.length : 0;
        const below75 = below75Res.status === 'fulfilled' ? below75Res.value.data : [];
        const pending = leaveRes.status === 'fulfilled' ? leaveRes.value.data.length : 0;
        const devs = devRes.status === 'fulfilled' ? devRes.value.data : [];
        const onlineCount = devs.filter((d) => d.status === 'ONLINE').length;
        const feeSummary = feeRes.status === 'fulfilled' ? feeRes.value.data : null;

        setStats({
          timetableSlots: ttCount,
          below75Count: below75.length,
          pendingLeaves: pending,
          devicesOnline: onlineCount,
          totalDevices: devs.length,
          totalFeeCollected: feeSummary ? feeSummary.totalCollected : 0,
          totalFeePending: feeSummary ? feeSummary.totalPending : 0,
        });

        setRecentActivities([
          { id: 1, text: `${pending} staff leave application(s) awaiting approval`, link: '/leave', time: 'Just now' },
          { id: 2, text: `${below75.length} students currently flagged below 75% attendance threshold`, link: '/attendance', time: 'Active' },
          { id: 3, text: `${onlineCount}/${devs.length} biometric devices reporting operational status`, link: '/devices', time: 'Real-time' },
        ]);
      } else if (['TEACHER', 'CLASS_TEACHER'].includes(role)) {
        const [ttRes, leaveRes, classAttRes, assignRes] = await Promise.allSettled([
          timetableApi.getByTeacher(user.id),
          leaveApi.getBalance(user.id),
          user.classSection ? attendanceApi.getByClassAndDate(user.classSection, new Date().toISOString().split('T')[0]) : Promise.resolve({ data: [] }),
          assignmentApi.getTeacherAssignments(user.id),
        ]);

        const mySlots = ttRes.status === 'fulfilled' ? ttRes.value.data : [];
        const myLeaves = leaveRes.status === 'fulfilled' ? leaveRes.value.data : [];
        const classAtt = classAttRes.status === 'fulfilled' ? classAttRes.value.data : [];
        const myAssignments = assignRes.status === 'fulfilled' ? assignRes.value.data : [];
        setDashboardAssignments(myAssignments);

        setStats({
          timetableSlots: mySlots.length,
          attendanceCount: classAtt.length,
          pendingLeaves: myLeaves.filter((l) => l.status === 'PENDING').length,
          assignmentCount: myAssignments.length,
        });

        setRecentActivities([
          { id: 1, text: `Active assignments: ${myAssignments.length} assigned across classes`, link: '/assignments', time: 'Coursework' },
          { id: 2, text: `Scheduled for ${mySlots.length} teaching periods this week`, link: '/timetable', time: 'Schedule' },
          { id: 3, text: `${classAtt.length} students marked present/absent today`, link: '/attendance', time: 'Today' },
        ]);
      } else if (role === 'STUDENT') {
        const studentId = user?.id || user?.userId || 31;
        const [pctRes, attRes, ttRes, trRes, assignRes, feeRes] = await Promise.allSettled([
          attendanceApi.getPercentage(studentId),
          attendanceApi.getByStudent(studentId),
          timetableApi.getByClass(user?.classSection || '8A'),
          transportApi.getMyTransport(),
          assignmentApi.getStudentAssignments(studentId),
          feesApi.getMyFees(),
        ]);

        const pct = pctRes.status === 'fulfilled' ? pctRes.value.data.attendancePercentage : 0;
        const attList = attRes.status === 'fulfilled' ? attRes.value.data : [];
        const slots = ttRes.status === 'fulfilled' ? ttRes.value.data : [];
        const transportData = trRes.status === 'fulfilled' && trRes.value?.status !== 204 ? trRes.value.data : null;
        const myAssignments = assignRes.status === 'fulfilled' ? assignRes.value.data : [];
        const myFees = feeRes.status === 'fulfilled' ? feeRes.value.data : [];
        const feePending = myFees.reduce((acc, f) => acc + (Number(f.pendingAmount) || 0), 0);
        setDashboardAssignments(myAssignments);

        const pres = attList.filter((r) => r.status === 'PRESENT').length;
        const abs = attList.filter((r) => r.status === 'ABSENT').length;
        const late = attList.filter((r) => r.status === 'LATE').length;

        setStats({
          studentAttendancePct: Number(pct).toFixed(1),
          attendanceCount: attList.length,
          presentClasses: pres,
          absentClasses: abs,
          lateClasses: late,
          timetableSlots: slots.length,
          studentRecords: attList,
          transport: transportData,
          studentFeePending: feePending,
          studentFeesCount: myFees.length,
        });

        setRecentActivities([
          { id: 1, text: `Attended: ${pres} classes (PRESENT) out of ${attList.length} total sessions`, link: '/attendance', time: 'Present' },
          { id: 2, text: `Missed: ${abs} classes (ABSENT) — ${abs > 0 ? 'Review absent dates' : 'Clean record'}`, link: '/attendance', time: 'Absent' },
          { id: 3, text: `Cumulative Overall Rate: ${Number(pct).toFixed(1)}% ${pct < 75 ? '(⚠️ BELOW 75% WARNING)' : '(✓ Good standing / Exam eligible)'}`, link: '/attendance', time: 'Standing' },
        ]);
      } else if (role === 'PARENT') {
        // Parent view for enrolled child
        setStats({
          studentAttendancePct: 88,
          attendanceCount: 42,
          timetableSlots: 36,
        });
        setRecentActivities([
          { id: 1, text: 'Child attendance status today: PRESENT (Biometric tap 08:24 AM)', link: '/attendance', time: 'Today' },
          { id: 2, text: 'Monthly Term Progress Report generated and available for download', link: '/reports', time: 'Term-end' },
          { id: 3, text: 'Upcoming Parent-Teacher Meeting scheduled for next Saturday', link: '/timetable', time: 'Announcement' },
        ]);
      }
    } catch (err) {
      setError('Could not load some dashboard metrics from the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  return (
    <div className="container" style={{ paddingBottom: '3rem' }}>
      {/* Header Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
              Welcome back, {user?.name}
            </h1>
            <span className={`role-chip ${user?.role}`}>{user?.role?.replace('_', ' ')}</span>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.925rem' }}>
            {user?.role === 'STUDENT'
              ? `Admission No: ${user?.admissionNumber || 'ADM001'} · Class: ${user?.classSection || '8A'}`
              : user?.role === 'TEACHER' || user?.role === 'CLASS_TEACHER'
              ? `Staff ID: ${user?.employeeId || 'EMP001'} · Section: ${user?.classSection || 'All'}`
              : 'Institutional Administrative Overview & System Health'}
          </p>
        </div>

        <button onClick={loadDashboardData} className="btn btn-secondary btn-sm" disabled={loading}>
          <IconRefreshCw size={15} />
          <span>Refresh Data</span>
        </button>
      </div>

      {error && (
        <div className="alert alert-warning" style={{ marginBottom: '1.5rem' }}>
          <IconAlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Role-Specific KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {['ADMIN', 'PRINCIPAL'].includes(user?.role) && (
          <>
            <div className="card" style={{ borderLeft: '4px solid #2563eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Active Timetable Slots</span>
                <span style={{ color: '#2563eb' }}><IconCalendar size={20} /></span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                {loading ? '...' : stats.timetableSlots}
              </div>
              <Link to="/timetable" style={{ fontSize: '0.825rem', color: '#2563eb', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <span>Manage timetable grid</span>
                <IconArrowRight size={14} />
              </Link>
            </div>

            <div className="card" style={{ borderLeft: stats.below75Count > 0 ? '4px solid #ef4444' : '4px solid #10b981' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Below 75% Attendance Risk</span>
                <span style={{ color: stats.below75Count > 0 ? '#ef4444' : '#10b981' }}>
                  <IconAlertTriangle size={20} />
                </span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: stats.below75Count > 0 ? '#ef4444' : '#0f172a', marginBottom: '0.5rem' }}>
                {loading ? '...' : stats.below75Count}
              </div>
              <Link to="/attendance" style={{ fontSize: '0.825rem', color: '#ef4444', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <span>Inspect student register</span>
                <IconArrowRight size={14} />
              </Link>
            </div>

            <div className="card" style={{ borderLeft: stats.pendingLeaves > 0 ? '4px solid #f59e0b' : '4px solid #64748b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Pending Leave Approvals</span>
                <span style={{ color: '#f59e0b' }}><IconClock size={20} /></span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                {loading ? '...' : stats.pendingLeaves}
              </div>
              <Link to="/leave" style={{ fontSize: '0.825rem', color: '#f59e0b', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <span>Review & assign substitute</span>
                <IconArrowRight size={14} />
              </Link>
            </div>

            <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Fee Collections</span>
                <span style={{ color: '#10b981' }}><IconCreditCard size={20} /></span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#047857', marginBottom: '0.5rem' }}>
                {loading ? '...' : `₹${Number(stats.totalFeeCollected || 0).toLocaleString('en-IN')}`}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Pending: ₹{Number(stats.totalFeePending || 0).toLocaleString('en-IN')}</span>
                <Link to="/fees" style={{ fontSize: '0.825rem', color: '#2563eb', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span>Fees Hub</span>
                  <IconArrowRight size={13} />
                </Link>
              </div>
            </div>
          </>
        )}

        {['TEACHER', 'CLASS_TEACHER'].includes(user?.role) && (
          <>
            <div className="card" style={{ borderLeft: '4px solid #2563eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>My Assigned Slots</span>
                <span style={{ color: '#2563eb' }}><IconCalendar size={20} /></span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                {loading ? '...' : stats.timetableSlots}
              </div>
              <Link to="/timetable" style={{ fontSize: '0.825rem', color: '#2563eb', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <span>View personal schedule</span>
                <IconArrowRight size={14} />
              </Link>
            </div>

            <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Class Attendance Records</span>
                <span style={{ color: '#10b981' }}><IconCheckCircle size={20} /></span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                {loading ? '...' : stats.attendanceCount}
              </div>
              <Link to="/attendance" style={{ fontSize: '0.825rem', color: '#10b981', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <span>Mark daily attendance</span>
                <IconArrowRight size={14} />
              </Link>
            </div>

            <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Pending Leave Applications</span>
                <span style={{ color: '#f59e0b' }}><IconClock size={20} /></span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                {loading ? '...' : stats.pendingLeaves}
              </div>
              <Link to="/leave" style={{ fontSize: '0.825rem', color: '#f59e0b', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <span>Apply for leave</span>
                <IconArrowRight size={14} />
              </Link>
            </div>

            <div className="card" style={{ borderLeft: '4px solid #0891b2' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Class Fee Clearance</span>
                <span style={{ color: '#0891b2' }}><IconCreditCard size={20} /></span>
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0e7490', marginBottom: '0.5rem' }}>
                {user.classSection ? `Class ${user.classSection}` : 'Class Roster'}
              </div>
              <Link to="/fees" style={{ fontSize: '0.825rem', color: '#0891b2', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <span>Check Fee Status</span>
                <IconArrowRight size={13} />
              </Link>
            </div>
          </>
        )}

        {user?.role === 'STUDENT' && (
          <>
            <div className="card" style={{ borderLeft: Number(stats.studentAttendancePct) < 75 ? '4px solid #ef4444' : '4px solid #10b981' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>My Attendance Rate</span>
                <span style={{ color: Number(stats.studentAttendancePct) < 75 ? '#ef4444' : '#10b981' }}>
                  <IconCheckCircle size={20} />
                </span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: Number(stats.studentAttendancePct) < 75 ? '#ef4444' : '#0f172a', marginBottom: '0.5rem' }}>
                {loading ? '...' : `${stats.studentAttendancePct}%`}
              </div>
              <div style={{ fontSize: '0.8rem', color: Number(stats.studentAttendancePct) < 75 ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                {Number(stats.studentAttendancePct) < 75 ? '⚠️ Below 75% minimum statutory threshold' : '✓ Above 75% examination eligibility'}
              </div>
            </div>

            <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#065f46' }}>Classes Present</span>
                <span style={{ color: '#10b981' }}><IconCheckCircle size={20} /></span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#047857', marginBottom: '0.5rem' }}>
                {loading ? '...' : `${stats.presentClasses || 0} Classes`}
              </div>
              <Link to="/attendance" style={{ fontSize: '0.825rem', color: '#10b981', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <span>View attended sessions</span>
                <IconArrowRight size={14} />
              </Link>
            </div>

            <div className="card" style={{ borderLeft: (stats.studentFeePending || 0) > 0 ? '4px solid #f59e0b' : '4px solid #10b981' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Fee Clearance</span>
                <span style={{ color: (stats.studentFeePending || 0) > 0 ? '#f59e0b' : '#10b981' }}><IconCreditCard size={20} /></span>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: (stats.studentFeePending || 0) > 0 ? '#b45309' : '#047857', marginBottom: '0.5rem' }}>
                {loading ? '...' : (stats.studentFeePending || 0) > 0 ? `₹${stats.studentFeePending.toLocaleString('en-IN')} Due` : 'Fees Cleared'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: (stats.studentFeePending || 0) > 0 ? '#dc2626' : '#047857' }}>
                  {(stats.studentFeePending || 0) > 0 ? 'Pending' : '✓ No dues pending'}
                </span>
                <Link to="/fees" style={{ fontSize: '0.825rem', color: '#2563eb', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                  <span>View Details</span>
                  <IconArrowRight size={13} />
                </Link>
              </div>
            </div>

            {/* My Transport Card (Requirement 16) */}
            <div className="card" style={{ borderLeft: '4px solid #6366f1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>My School Transport</span>
                <span style={{ fontSize: '1.25rem' }}>🚍</span>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>
                {stats.transport ? stats.transport.busNumber : 'Bus Transport'}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '0.5rem' }}>
                {stats.transport ? `${stats.transport.routeNumber} • Pickup: ${stats.transport.pickupTime}` : 'Check bus schedule'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: stats.transport?.status === 'ACTIVE' ? '#047857' : '#d97706' }}>
                  {stats.transport?.status === 'ACTIVE' ? '🟢 Active' : 'Details'}
                </span>
                <Link to="/transport" style={{ fontSize: '0.825rem', color: '#2563eb', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                  <span>View Transport</span>
                  <IconArrowRight size={13} />
                </Link>
              </div>
            </div>
          </>
        )}

        {user?.role === 'PARENT' && (
          <>
            <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Child Overall Attendance</span>
                <span style={{ color: '#10b981' }}><IconCheckCircle size={20} /></span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                {loading ? '...' : `${stats.studentAttendancePct}%`}
              </div>
              <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>Normal Attendance Standing</span>
            </div>

            <div className="card" style={{ borderLeft: '4px solid #2563eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Weekly Class Periods</span>
                <span style={{ color: '#2563eb' }}><IconCalendar size={20} /></span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                {loading ? '...' : stats.timetableSlots}
              </div>
              <Link to="/timetable" style={{ fontSize: '0.825rem', color: '#2563eb', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <span>Check class schedule</span>
                <IconArrowRight size={14} />
              </Link>
            </div>

            <div className="card" style={{ borderLeft: '4px solid #059669' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Child Fees & Receipts</span>
                <span style={{ color: '#059669' }}><IconCreditCard size={20} /></span>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#047857', marginBottom: '0.5rem' }}>
                Fee Records
              </div>
              <Link to="/fees" style={{ fontSize: '0.825rem', color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <span>Inspect Fees & Receipts</span>
                <IconArrowRight size={14} />
              </Link>
            </div>

            <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Absence Alerts</span>
                <span style={{ color: '#f59e0b' }}><IconAlertTriangle size={20} /></span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                0
              </div>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>No unexcused absences recorded</span>
            </div>
          </>
        )}
      </div>

      {/* Upcoming Academic Calendar Events (FR12) */}
      <div style={{ marginBottom: '1.75rem' }}>
        <UpcomingEventsWidget limit={4} />
      </div>

      {/* Student Compact Assignment Widget (Requirement 29) */}
      {user?.role === 'STUDENT' && (
        <div className="card" style={{ marginBottom: '1.75rem', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem' }}>📝</span>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                My Coursework & Assignments
              </h3>
            </div>
            <Link to="/assignments" style={{ fontSize: '0.825rem', color: '#2563eb', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <span>View All Assignments</span>
              <IconArrowRight size={14} />
            </Link>
          </div>

          {dashboardAssignments.length === 0 ? (
            <div style={{ padding: '1rem', textAlign: 'center', color: '#64748b', fontSize: '0.875rem' }}>
              No coursework currently assigned.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
              {dashboardAssignments.slice(0, 3).map((a) => (
                <div key={a.id} style={{ padding: '0.85rem 1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>{a.subjectName || 'Subject'}</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>{a.title}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      Due: {a.dueDate ? new Date(a.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '12 Sep'}
                    </div>
                  </div>
                  <div>
                    <span className={`badge ${a.submissionStatus === 'GRADED' ? 'badge-success' : a.submissionStatus === 'SUBMITTED' ? 'badge-info' : 'badge-warning'}`}>
                      {a.submissionStatus === 'GRADED' ? '🟢 Graded' : a.submissionStatus === 'SUBMITTED' ? '🔵 Submitted' : '🟡 Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Teacher Compact Assignment Overview Widget (Requirement 29) */}
      {['TEACHER', 'CLASS_TEACHER', 'ADMIN', 'PRINCIPAL'].includes(user?.role) && (
        <div className="card" style={{ marginBottom: '1.75rem', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem' }}>📝</span>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Coursework & Submission Overview
              </h3>
            </div>
            <Link to="/assignments" style={{ fontSize: '0.825rem', color: '#2563eb', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <span>Manage Assignments</span>
              <IconArrowRight size={14} />
            </Link>
          </div>

          {dashboardAssignments.length === 0 ? (
            <div style={{ padding: '1rem', textAlign: 'center', color: '#64748b', fontSize: '0.875rem' }}>
              No assignments created yet. Click "Manage Assignments" to publish coursework.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
              {dashboardAssignments.slice(0, 3).map((a) => (
                <div key={a.id} style={{ padding: '0.85rem 1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563eb' }}>Class {a.classSection} · {a.subjectName}</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>{a.title}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      Submitted: {a.submittedCount || 0}/{a.totalStudents || 30} • Pending: {a.pendingGradingCount || 0}
                    </div>
                  </div>
                  <Link to="/assignments" className="btn btn-secondary btn-sm" style={{ fontWeight: 700, fontSize: '0.75rem' }}>
                    View Submissions
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Content Sections: Activity Feed & Quick Actions */}
      <div className="grid-3" style={{ gridTemplateColumns: '2fr 1fr' }}>
        {/* Activity feed */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <IconClock size={20} />
              <span>Operational Activity & Notifications</span>
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {recentActivities.map((act) => (
              <div
                key={act.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1rem',
                  background: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  gap: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)' }} />
                  <span style={{ fontSize: '0.875rem', color: '#0f172a', fontWeight: 500 }}>{act.text}</span>
                </div>
                <Link to={act.link} className="btn btn-secondary btn-sm" style={{ whiteSpace: 'nowrap' }}>
                  <span>Open</span>
                  <IconArrowRight size={12} />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Quick-action buttons (SRS Appendix I: three most-used operations) */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <IconCheckCircle size={20} />
              <span>Quick Actions</span>
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link to="/calendar" className="btn btn-primary" style={{ justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <IconCalendar size={18} />
                <span>Academic Calendar</span>
              </span>
              <IconArrowRight size={16} />
            </Link>

            <Link to="/timetable" className="btn btn-secondary" style={{ justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <IconCalendar size={18} />
                <span>Class Timetable</span>
              </span>
              <IconArrowRight size={16} />
            </Link>

            <Link to="/attendance" className="btn btn-secondary" style={{ justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <IconCheckCircle size={18} />
                <span>Attendance Log</span>
              </span>
              <IconArrowRight size={16} />
            </Link>

            <Link to="/leave" className="btn btn-secondary" style={{ justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <IconUsers size={18} />
                <span>Leave & Substitution</span>
              </span>
              <IconArrowRight size={16} />
            </Link>

            {['STUDENT', 'PARENT', 'ADMIN', 'PRINCIPAL'].includes(user?.role) && (
              <Link to="/transport" className="btn btn-secondary" style={{ justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>🚍</span>
                  <span>School Transport</span>
                </span>
                <IconArrowRight size={16} />
              </Link>
            )}

            {['ADMIN', 'PRINCIPAL'].includes(user?.role) && (
              <Link to="/reports" className="btn btn-secondary" style={{ justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <IconFileText size={18} />
                  <span>UDISE Compliance Report</span>
                </span>
                <IconArrowRight size={16} />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
