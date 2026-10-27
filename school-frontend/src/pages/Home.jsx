import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  IconCalendar,
  IconClock,
  IconCpu,
  IconShield,
  IconUsers,
  IconFileText,
  IconCheckCircle,
  IconArrowRight,
} from '../components/Icons';

export default function Home() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem', paddingBottom: '3rem' }}>
      {/* Hero Section */}
      <section
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #3b82f6 100%)',
          color: 'white',
          padding: '4.5rem 1.5rem',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ maxWidth: 880, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 1rem',
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(8px)',
              borderRadius: '9999px',
              fontSize: '0.85rem',
              fontWeight: '600',
              marginBottom: '1.5rem',
              border: '1px solid rgba(255, 255, 255, 0.25)',
            }}
          >
            <IconCheckCircle size={16} />
            <span>K-12 School Management & Compliance Engine</span>
          </div>
          <h1
            style={{
              fontSize: 'clamp(2rem, 5vw, 3.25rem)',
              fontWeight: 800,
              lineHeight: 1.15,
              marginBottom: '1.25rem',
              letterSpacing: '-0.02em',
            }}
          >
            School Timetable & Biometric Attendance Management
          </h1>
          <p
            style={{
              fontSize: '1.15rem',
              color: '#dbeafe',
              maxWidth: 720,
              margin: '0 auto 2rem',
              lineHeight: 1.6,
            }}
          >
            Automate conflict-free timetable generation with teacher clash detection, capture real-time
            biometric/RFID attendance, manage staff leave with auto-substitution suggestions, and ensure
            UDISE & RTE Act regulatory compliance.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn btn-lg" style={{ background: '#ffffff', color: '#1e3a8a', fontWeight: 700 }}>
                <span>Open Dashboard ({user?.role?.replace('_', ' ')})</span>
                <IconArrowRight size={18} />
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-lg" style={{ background: '#ffffff', color: '#1e3a8a', fontWeight: 700 }}>
                  <span>Sign In to Portal</span>
                  <IconArrowRight size={18} />
                </Link>
                <Link
                  to="/register"
                  className="btn btn-lg"
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.4)',
                  }}
                >
                  <span>Register Account</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Quick Overview Metrics */}
      <section className="container">
        <div className="grid-4">
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '12px',
                background: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconCalendar size={26} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Timetable Engine</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Zero Double-Booking</div>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '12px',
                background: '#ecfdf5',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconCpu size={26} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Attendance Capture</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Biometric & RFID Sync</div>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '12px',
                background: '#fffbeb',
                color: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconUsers size={26} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Staff Substitution</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Auto-Free Slot Match</div>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '12px',
                background: '#fef2f2',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconFileText size={26} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Government Reports</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>UDISE & RTE Compliant</div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Feature Pillars from SRS */}
      <section className="container">
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
            Built According to Rigorous SRS Specifications
          </h2>
          <p style={{ color: '#64748b', maxWidth: 640, margin: '0 auto' }}>
            Complete full-stack integration connecting React 18 on port 8081 directly to Spring Boot REST APIs
            on port 8080 with JPA & MySQL persistence.
          </p>
        </div>

        <div className="grid-3">
          <div className="card">
            <div style={{ color: '#2563eb', marginBottom: '0.85rem' }}>
              <IconCalendar size={32} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Conflict-Free Timetable (FR4)
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.5, marginBottom: '1rem' }}>
              Enforces hard constraints preventing teachers from being double-booked in overlapping slots.
              Real-time clash detection alerts in the editor and classroom PDF wall-display generator.
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.825rem', color: '#475569' }}>
              <li>✓ 8 Daily periods (Periods 1 to 8)</li>
              <li>✓ Monday to Saturday scheduling</li>
              <li>✓ Teacher conflict clash validation</li>
            </ul>
          </div>

          <div className="card">
            <div style={{ color: '#10b981', marginBottom: '0.85rem' }}>
              <IconCheckCircle size={32} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Biometric Attendance & Overrides (FR5)
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.5, marginBottom: '1rem' }}>
              Captures biometric and RFID tap events, calculates live attendance percentages, and restricts manual
              attendance overrides by mandating an audited written explanation.
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.825rem', color: '#475569' }}>
              <li>✓ Mandatory override reason validation (FR10)</li>
              <li>✓ Below-75% attendance early warning list</li>
              <li>✓ Student percentage tracking per term</li>
            </ul>
          </div>

          <div className="card">
            <div style={{ color: '#f59e0b', marginBottom: '0.85rem' }}>
              <IconUsers size={32} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Leave & Substitution Workflow (FR6)
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.5, marginBottom: '1rem' }}>
              Staff leave applications (CL/SL/PL/OD) with approval workflow. Intelligent engine queries all teachers
              free across the absent teacher's periods to suggest seamless substitute coverage.
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.825rem', color: '#475569' }}>
              <li>✓ Auto-substitution algorithm</li>
              <li>✓ One-click approval & substitute assignment</li>
              <li>✓ Teacher leave balance ledger</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Role-Based Access Callout (SRS Appendix A) */}
      <section className="container">
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%)',
            border: '1px solid #cbd5e1',
          }}
        >
          <div className="card-header">
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Role-Based Access Control Matrix (Appendix A)</h3>
              <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
                Tailored views and security permissions configured for 6 user classes.
              </p>
            </div>
            <Link to="/login" className="btn btn-primary btn-sm">
              <span>Try Any Role</span>
              <IconArrowRight size={14} />
            </Link>
          </div>

          <div className="table-responsive">
            <table className="table" style={{ background: 'white' }}>
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Timetable Access</th>
                  <th>Attendance Rights</th>
                  <th>Leave Actions</th>
                  <th>Administrative Oversight</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>ADMIN</strong></td>
                  <td>Generate, Edit, Full Grid</td>
                  <td>Override with reason, View Below-75%</td>
                  <td>Approve / Reject Leave</td>
                  <td>User, Room & Device Management</td>
                </tr>
                <tr>
                  <td><strong>PRINCIPAL</strong></td>
                  <td>Full School Timetable</td>
                  <td>School-wide Attendance & Analytics</td>
                  <td>Approve Leave & Confirm Substitutes</td>
                  <td>UDISE / RTE Statutory MIS Reports</td>
                </tr>
                <tr>
                  <td><strong>CLASS TEACHER</strong></td>
                  <td>Class & Personal Timetable</td>
                  <td>Mark Daily Class & Override with Reason</td>
                  <td>Apply for Leave</td>
                  <td>Class At-Risk Student Monitoring</td>
                </tr>
                <tr>
                  <td><strong>TEACHER</strong></td>
                  <td>Personal Teaching Timetable</td>
                  <td>Mark Class Attendance</td>
                  <td>Apply for Leave, View Balance</td>
                  <td>Accept Substitute Duties</td>
                </tr>
                <tr>
                  <td><strong>STUDENT</strong></td>
                  <td>Own Class Schedule</td>
                  <td>Personal Attendance History & %</td>
                  <td>Read-only</td>
                  <td>None</td>
                </tr>
                <tr>
                  <td><strong>PARENT</strong></td>
                  <td>Child Schedule</td>
                  <td>Child Attendance Calendar & Alerts</td>
                  <td>Read-only</td>
                  <td>Absence SMS / Notification Log</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
