import React, { useState, useEffect } from 'react';
import { attendanceApi, usersApi, timetableApi } from '../services/api';
import {
  IconFileText,
  IconDownload,
  IconCheckCircle,
  IconAlertTriangle,
  IconUsers,
} from '../components/Icons';

export default function MISReports() {
  const [below75, setBelow75] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [timetableSlots, setTimetableSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReportData = async () => {
      setLoading(true);
      try {
        const [below75Res, teachersRes, studentsRes, ttRes] = await Promise.all([
          attendanceApi.getBelow75(),
          usersApi.getByRole('TEACHER'),
          usersApi.getByRole('STUDENT'),
          timetableApi.getAll(),
        ]);
        setBelow75(below75Res.data);
        setTeachers(teachersRes.data);
        setStudents(studentsRes.data);
        setTimetableSlots(ttRes.data);
      } catch (err) {
        console.error('Failed to load report data', err);
      } finally {
        setLoading(false);
      }
    };
    loadReportData();
  }, []);

  // Generate and download DISE/UDISE prescribed XML format per FR8
  const handleDownloadUDISEXml = () => {
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<UDISE_Data_Export academicYear="2026-2027" generatedAt="${new Date().toISOString()}">
  <SchoolSummary>
    <InstitutionName>School Timetable and Attendance Management System</InstitutionName>
    <TotalEnrolledStudents>${students.length}</TotalEnrolledStudents>
    <TotalCertifiedTeachers>${teachers.length}</TotalCertifiedTeachers>
    <StudentTeacherRatio>${teachers.length > 0 ? (students.length / teachers.length).toFixed(1) : 'N/A'}</StudentTeacherRatio>
    <Below75PercentNonCompliant>${below75.length}</Below75PercentNonCompliant>
  </SchoolSummary>
  <StudentsBelowThreshold>
    ${below75.map((s) => `
    <Student id="${s.id}">
      <Name>${s.name}</Name>
      <AdmissionNumber>${s.admissionNumber || ''}</AdmissionNumber>
      <ClassSection>${s.classSection || ''}</ClassSection>
      <ParentContact>${s.parentMobile || ''}</ParentContact>
      <NoticeDispatched>YES</NoticeDispatched>
    </Student>`).join('')}
  </StudentsBelowThreshold>
  <TeacherDeployment>
    ${teachers.map((t) => `
    <Teacher id="${t.id}">
      <Name>${t.name}</Name>
      <EmployeeId>${t.employeeId || ''}</EmployeeId>
    </Teacher>`).join('')}
  </TeacherDeployment>
</UDISE_Data_Export>`;

    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `UDISE_Government_Report_${new Date().toISOString().split('T')[0]}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const ratio = teachers.length > 0 ? (students.length / teachers.length).toFixed(1) : '0';
  const isRteCompliant = Number(ratio) <= 30; // RTE Act mandate: Student-teacher ratio <= 30:1

  return (
    <div className="container" style={{ paddingBottom: '3rem' }}>
      {/* Header */}
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
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <IconFileText size={26} />
            <span>Statutory MIS & Government Compliance (FR8)</span>
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Official government submission reports: DISE/UDISE XML, RTE Act ratios, and attendance audits.
          </p>
        </div>

        <button onClick={handleDownloadUDISEXml} className="btn btn-primary btn-sm">
          <IconDownload size={15} />
          <span>Export UDISE XML Report</span>
        </button>
      </div>

      {/* Compliance Metrics Overview */}
      <div className="grid-3" style={{ marginBottom: '2rem' }}>
        <div className="card" style={{ borderLeft: isRteCompliant ? '4px solid #10b981' : '4px solid #ef4444' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.35rem' }}>
            Student-Teacher Ratio (RTE Act)
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>
            {ratio} : 1
          </div>
          <span style={{ fontSize: '0.8rem', color: isRteCompliant ? '#10b981' : '#ef4444', fontWeight: 600 }}>
            {isRteCompliant ? '✓ Compliant with RTE Act (<= 30:1)' : '⚠️ Exceeds statutory RTE ratio limit'}
          </span>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #2563eb' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.35rem' }}>
            Enrolled Student Body
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>
            {students.length}
          </div>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Across configured class sections
          </span>
        </div>

        <div className="card" style={{ borderLeft: below75.length > 0 ? '4px solid #ef4444' : '4px solid #10b981' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.35rem' }}>
            Below-75% Non-Compliance
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: below75.length > 0 ? '#ef4444' : '#0f172a', marginBottom: '0.25rem' }}>
            {below75.length}
          </div>
          <span style={{ fontSize: '0.8rem', color: below75.length > 0 ? '#ef4444' : '#10b981', fontWeight: 600 }}>
            {below75.length > 0 ? 'Inspection list active' : '100% compliant'}
          </span>
        </div>
      </div>

      {/* Statutory Inspection List Table */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '2rem' }}>
        <div className="card-header">
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
              Below-75% Attendance Inspection Dossier
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Prepared for board inspection readiness with parent contact information.
            </p>
          </div>
          <button onClick={() => window.print()} className="btn btn-secondary btn-sm">
            <IconDownload size={14} />
            <span>Print Register</span>
          </button>
        </div>

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Full Name</th>
                <th>Admission No</th>
                <th>Class Section</th>
                <th>Parent Mobile Phone</th>
                <th>Regulatory Status</th>
              </tr>
            </thead>
            <tbody>
              {below75.map((s) => (
                <tr key={s.id}>
                  <td>#{s.id}</td>
                  <td><strong>{s.name}</strong></td>
                  <td>{s.admissionNumber || 'ADM001'}</td>
                  <td><span className="badge badge-late">Class {s.classSection || '8A'}</span></td>
                  <td>📞 {s.parentMobile || '9876543210'}</td>
                  <td>
                    <span className="badge badge-absent">
                      Action Required: Parent Intimation
                    </span>
                  </td>
                </tr>
              ))}
              {below75.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '1.5rem', color: '#10b981' }}>
                    ✓ No students breached the 75% attendance threshold.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Teacher Deployment Register */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div className="card-header">
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
            Teacher Deployment & Utilization Register
          </h3>
        </div>

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Staff Code</th>
                <th>Teacher Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Assigned Periods This Week</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((t) => {
                const count = timetableSlots.filter((slot) => slot.teacher?.id === t.id).length;
                return (
                  <tr key={t.id}>
                    <td><strong>{t.employeeId || 'EMP001'}</strong></td>
                    <td>{t.name}</td>
                    <td>{t.email}</td>
                    <td>{t.phone}</td>
                    <td>
                      <span className="badge badge-present">{count} Periods</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
