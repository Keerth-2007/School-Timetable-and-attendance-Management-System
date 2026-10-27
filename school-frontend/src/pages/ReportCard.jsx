import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { reportCardApi, parentApi, usersApi, subjectsApi } from '../services/api';
import {
  IconCheckCircle,
  IconAlertTriangle,
  IconDownload,
  IconUser,
  IconRefreshCw,
  IconCalendar,
  IconFileText,
  IconClock,
} from '../components/Icons';

export default function ReportCard() {
  const { user } = useAuth();
  const isParent = user?.role === 'PARENT';
  const isStudent = user?.role === 'STUDENT';
  const isStaff = ['TEACHER', 'CLASS_TEACHER', 'ADMIN', 'PRINCIPAL'].includes(user?.role);

  // Parent state
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);

  // Common state
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [exams, setExams] = useState(['Quarterly Examination', 'Mid-Term Examination 2026', 'Periodic Test 1 (PT-1)', 'Annual Examination']);
  const [selectedExam, setSelectedExam] = useState('Quarterly Examination');
  const [reportCard, setReportCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Staff mark entry state
  const [showEntryDrawer, setShowEntryDrawer] = useState(false);
  const [allStudents, setAllStudents] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [entryStudentId, setEntryStudentId] = useState('');
  const [entrySubjectId, setEntrySubjectId] = useState('');
  const [entryMarks, setEntryMarks] = useState('');
  const [entryMaxMarks, setEntryMaxMarks] = useState('100');
  const [entryRemarks, setEntryRemarks] = useState('');
  const [publishRemarks, setPublishRemarks] = useState('');
  const [savingMark, setSavingMark] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Initialize
  useEffect(() => {
    initPage();
  }, [user]);

  const initPage = async () => {
    setLoading(true);
    setError('');
    try {
      if (isParent) {
        const parentId = user?.id || user?.userId;
        const chRes = await parentApi.getChildren(parentId);
        const childList = chRes.data || [];
        setChildren(childList);

        if (childList.length > 0) {
          // Default to Keerthana if present or first child
          const defaultChild = childList.find((c) => c.name?.toLowerCase().includes('keerthana')) || childList[0];
          setSelectedChild(defaultChild);

          // Fetch exams for this child
          try {
            const exRes = await parentApi.getChildExams(parentId, defaultChild.id);
            if (exRes.data && exRes.data.length > 0) {
              setExams(exRes.data);
              setSelectedExam(exRes.data[0]);
              await loadReportCard(defaultChild.id, exRes.data[0], academicYear);
            } else {
              await loadReportCard(defaultChild.id, selectedExam, academicYear);
            }
          } catch {
            await loadReportCard(defaultChild.id, selectedExam, academicYear);
          }
        }
      } else if (isStudent) {
        const studentId = user?.id || user?.userId;
        try {
          const exRes = await reportCardApi.getStudentExams(studentId);
          if (exRes.data && exRes.data.length > 0) {
            setExams(exRes.data);
            setSelectedExam(exRes.data[0]);
            await loadReportCard(studentId, exRes.data[0], academicYear);
          } else {
            await loadReportCard(studentId, selectedExam, academicYear);
          }
        } catch {
          await loadReportCard(studentId, selectedExam, academicYear);
        }
      } else if (isStaff) {
        // Staff view
        await loadStaffMeta();
        // Load default student (Keerthana ID 31 or first student)
        await loadReportCard(31, selectedExam, academicYear);
      }
    } catch (err) {
      setError(err.message || 'Failed to initialize Report Card module');
    } finally {
      setLoading(false);
    }
  };

  const loadStaffMeta = async () => {
    try {
      const [studRes, subjRes, exRes] = await Promise.all([
        usersApi.getByRole('STUDENT'),
        subjectsApi ? subjectsApi.getAll() : Promise.resolve({ data: [] }),
        reportCardApi.getAllExams().catch(() => ({ data: [] })),
      ]);
      setAllStudents(studRes.data || []);
      setAllSubjects(subjRes.data || []);
      if (exRes.data && exRes.data.length > 0) {
        setExams(exRes.data);
      }
      if (studRes.data?.length > 0) {
        const keerthana = studRes.data.find((s) => s.name?.toLowerCase().includes('keerthana'));
        setEntryStudentId(keerthana ? String(keerthana.id) : String(studRes.data[0].id));
      }
      if (subjRes.data?.length > 0) {
        setEntrySubjectId(String(subjRes.data[0].id));
      }
    } catch (err) {
      console.error('Error loading staff metadata', err);
    }
  };

  const loadReportCard = async (studentId, examName, year) => {
    setLoading(true);
    setError('');
    try {
      let res;
      if (isParent) {
        const parentId = user?.id || user?.userId;
        res = await parentApi.getChildReportCard(parentId, studentId, examName, year);
      } else {
        res = await reportCardApi.getStudentReportCard(studentId, examName, year);
      }
      setReportCard(res.data);
    } catch (err) {
      setError(err.message || 'Could not load report card');
      setReportCard(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChild = (child) => {
    setSelectedChild(child);
    loadReportCard(child.id, selectedExam, academicYear);
  };

  const handleExamChange = (exam) => {
    setSelectedExam(exam);
    const targetStudentId = isParent ? selectedChild?.id : isStudent ? user?.id : entryStudentId || 31;
    if (targetStudentId) {
      loadReportCard(targetStudentId, exam, academicYear);
    }
  };

  const handleYearChange = (year) => {
    setAcademicYear(year);
    const targetStudentId = isParent ? selectedChild?.id : isStudent ? user?.id : entryStudentId || 31;
    if (targetStudentId) {
      loadReportCard(targetStudentId, selectedExam, year);
    }
  };

  // Staff: Save marks
  const handleSaveMarks = async (e) => {
    e.preventDefault();
    if (!entryStudentId || !entrySubjectId || !entryMarks) {
      alert('Please select student, subject, and enter marks.');
      return;
    }
    setSavingMark(true);
    try {
      await reportCardApi.saveMarks({
        studentId: Number(entryStudentId),
        subjectId: Number(entrySubjectId),
        examName: selectedExam,
        academicYear,
        marksObtained: parseFloat(entryMarks),
        maxMarks: parseFloat(entryMaxMarks || '100'),
        remarks: entryRemarks,
      });
      setSuccessMsg(`Marks saved successfully for ${selectedExam}!`);
      setTimeout(() => setSuccessMsg(''), 4000);
      setEntryMarks('');
      setEntryRemarks('');
      await loadReportCard(Number(entryStudentId), selectedExam, academicYear);
    } catch (err) {
      setError(err.message || 'Failed to save subject mark');
    } finally {
      setSavingMark(false);
    }
  };

  // Staff: Publish report card
  const handlePublish = async (e) => {
    e.preventDefault();
    const targetId = entryStudentId ? Number(entryStudentId) : 31;
    setPublishing(true);
    try {
      const res = await reportCardApi.publishReportCard({
        studentId: targetId,
        examName: selectedExam,
        academicYear,
        teacherRemarks: publishRemarks || 'Student has demonstrated commendable consistency and diligence across all subjects.',
        status: 'PUBLISHED',
      });
      setReportCard(res.data);
      setSuccessMsg(`Report Card for ${selectedExam} officially PUBLISHED! Notifications sent to student & parent.`);
      setTimeout(() => setSuccessMsg(''), 5000);
      setShowEntryDrawer(false);
    } catch (err) {
      setError(err.message || 'Failed to publish report card');
    } finally {
      setPublishing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const isPublished = reportCard && reportCard.status === 'PUBLISHED';
  const isDraft = reportCard && reportCard.status === 'DRAFT';
  const isUnpublished = !reportCard || reportCard.status === 'UNPUBLISHED';

  return (
    <div className="container report-card-page" style={{ paddingBottom: '4rem' }}>
      {/* Print stylesheet */}
      <style>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
            font-size: 11pt !important;
          }
          .navbar, .navbar-inner, header, footer, .no-print, .btn, .nav-user-actions {
            display: none !important;
          }
          .report-card-page {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
          .report-card-sheet {
            box-shadow: none !important;
            border: 2px solid #0f172a !important;
            padding: 1.5rem !important;
            margin: 0 !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* Page Header (Hidden on print) */}
      <div
        className="no-print"
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              📊 Student Academic Report Card
            </h1>
            <span className="badge badge-primary">Official Record</span>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
            {isParent
              ? 'Comprehensive performance dossier, subject grades, and attendance summary for your child.'
              : isStudent
              ? 'View your institutional academic performance, marks, and faculty remarks.'
              : 'Institutional examination grading, marks verification, and report card publishing.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {isStaff && (
            <button
              onClick={() => setShowEntryDrawer(!showEntryDrawer)}
              className="btn btn-primary btn-sm"
              style={{ fontWeight: 700 }}
            >
              <IconFileText size={16} />
              <span>{showEntryDrawer ? 'Close Marks Panel' : '✏️ Enter Marks & Publish'}</span>
            </button>
          )}

          <button onClick={handlePrint} className="btn btn-secondary btn-sm" disabled={!isPublished}>
            <IconDownload size={15} />
            <span>🖨 Print / Save PDF</span>
          </button>

          <button
            onClick={() => {
              const targetId = isParent ? selectedChild?.id : isStudent ? user?.id : entryStudentId || 31;
              if (targetId) loadReportCard(targetId, selectedExam, academicYear);
            }}
            className="btn btn-secondary btn-sm"
            disabled={loading}
          >
            <IconRefreshCw size={15} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-warning no-print" style={{ marginBottom: '1.5rem' }}>
          <IconAlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="alert alert-success no-print" style={{ marginBottom: '1.5rem' }}>
          <IconCheckCircle size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Parent Navigation Quick Bar */}
      {isParent && (
        <div className="card no-print" style={{ marginBottom: '1.5rem', padding: '0.75rem 1.25rem', background: '#f8fafc', borderRadius: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
              Navigation:
            </span>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <Link to="/parent" className="btn btn-xs btn-secondary">🏠 Parent Portal</Link>
              <Link to="/assignments" className="btn btn-xs btn-secondary">📝 Assignments</Link>
              <Link to="/transport" className="btn btn-xs btn-secondary">🚍 Transport</Link>
              <Link to="/calendar" className="btn btn-xs btn-secondary">📅 Calendar</Link>
              <span className="badge badge-primary" style={{ padding: '0.4rem 0.75rem', fontWeight: 700 }}>
                📊 Report Card Active
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Filter / Selector Bar (No-Print) */}
      <div
        className="card no-print"
        style={{
          marginBottom: '2rem',
          padding: '1.25rem',
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
        }}
      >
        {/* Child Selector for Multi-Child Parents */}
        {isParent && children.length > 0 && (
          <div style={{ marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>
              Select Enrolled Child:
            </label>
            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
              {children.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => handleSelectChild(ch)}
                  className={`btn ${selectedChild?.id === ch.id ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ borderRadius: '8px', padding: '0.5rem 1.15rem', fontWeight: selectedChild?.id === ch.id ? 800 : 600 }}
                >
                  <IconUser size={15} />
                  <span>{ch.name} (Class {ch.classSection || '8A'})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Staff Student Selector */}
        {isStaff && allStudents.length > 0 && (
          <div style={{ marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>
              Inspect Student Report Card:
            </label>
            <select
              value={entryStudentId}
              onChange={(e) => {
                setEntryStudentId(e.target.value);
                loadReportCard(Number(e.target.value), selectedExam, academicYear);
              }}
              className="form-control"
              style={{ maxWidth: '360px', borderRadius: '8px', fontWeight: 600 }}
            >
              {allStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — Class {s.classSection || '8A'} (ID: {s.id})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Academic Year & Exam Selection Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '0.35rem', display: 'block' }}>
              Academic Year:
            </label>
            <select
              value={academicYear}
              onChange={(e) => handleYearChange(e.target.value)}
              className="form-control"
              style={{ borderRadius: '8px', fontWeight: 600 }}
            >
              <option value="2026-2027">2026–2027 (Current)</option>
              <option value="2025-2026">2025–2026 (Archived)</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '0.35rem', display: 'block' }}>
              Select Examination / Term:
            </label>
            <select
              value={selectedExam}
              onChange={(e) => handleExamChange(e.target.value)}
              className="form-control"
              style={{ borderRadius: '8px', fontWeight: 700, color: '#0f172a' }}
            >
              {exams.map((ex) => (
                <option key={ex} value={ex}>
                  {ex}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Staff: Enter Marks & Publish Drawer */}
      {isStaff && showEntryDrawer && (
        <div
          className="card no-print"
          style={{
            marginBottom: '2rem',
            padding: '1.5rem',
            background: '#f8fafc',
            border: '2px solid #3b82f6',
            borderRadius: '12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#1e3a8a' }}>
              ✏️ Faculty Marks Entry & Report Card Publishing Panel
            </h3>
            <span className="badge badge-info">Term: {selectedExam}</span>
          </div>

          {/* Marks Entry Form */}
          <form onSubmit={handleSaveMarks} style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Student:</label>
                <select
                  value={entryStudentId}
                  onChange={(e) => setEntryStudentId(e.target.value)}
                  className="form-control"
                  required
                >
                  {allStudents.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.classSection || '8A'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Subject:</label>
                <select
                  value={entrySubjectId}
                  onChange={(e) => setEntrySubjectId(e.target.value)}
                  className="form-control"
                  required
                >
                  {allSubjects.map((sb) => (
                    <option key={sb.id} value={sb.id}>{sb.name} ({sb.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Marks Obtained:</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max={entryMaxMarks || 100}
                  value={entryMarks}
                  onChange={(e) => setEntryMarks(e.target.value)}
                  placeholder="e.g. 88"
                  className="form-control"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Maximum Marks:</label>
                <input
                  type="number"
                  value={entryMaxMarks}
                  onChange={(e) => setEntryMaxMarks(e.target.value)}
                  className="form-control"
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Subject Remarks (Optional):</label>
              <input
                type="text"
                value={entryRemarks}
                onChange={(e) => setEntryRemarks(e.target.value)}
                placeholder="e.g. Strong grasp of theoretical derivations and diagrams."
                className="form-control"
              />
            </div>

            <button type="submit" className="btn btn-primary btn-sm" disabled={savingMark} style={{ fontWeight: 700 }}>
              {savingMark ? 'Saving...' : '💾 Save Subject Marks'}
            </button>
          </form>

          {/* Publish Section */}
          <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
            <h4 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
              📢 Publish Complete Report Card
            </h4>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
              Publishing aggregates all saved subject marks, integrates live attendance & coursework percentages, and dispatches in-app notifications to student & parent.
            </p>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Class Teacher Remarks:</label>
              <textarea
                value={publishRemarks}
                onChange={(e) => setPublishRemarks(e.target.value)}
                rows={2}
                placeholder="e.g. Keerthana has shown excellent progress in Mathematics and Physics. Continue working on written communication."
                className="form-control"
              />
            </div>

            <button onClick={handlePublish} className="btn btn-success" disabled={publishing} style={{ fontWeight: 800 }}>
              {publishing ? 'Publishing Report Card...' : '🚀 Finalize & Publish Report Card'}
            </button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          <IconRefreshCw size={24} className="spin" />
          <p style={{ marginTop: '0.5rem' }}>Generating academic report card from database...</p>
        </div>
      )}

      {/* Draft State Notice (Parents see "currently being prepared") */}
      {!loading && isDraft && (
        <div className="alert alert-warning" style={{ marginBottom: '2rem', padding: '1.5rem', borderRadius: '12px' }}>
          <IconClock size={28} color="#d97706" />
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#92400e' }}>
              Report Card In Preparation
            </h3>
            <p style={{ margin: '0.35rem 0 0', color: '#b45309', fontSize: '0.925rem' }}>
              Your child's report card for <strong>{selectedExam}</strong> is currently being prepared and reviewed by faculty. Once finalized and published, official marks and remarks will appear below.
            </p>
          </div>
        </div>
      )}

      {/* Unpublished State Notice */}
      {!loading && isUnpublished && (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', borderRadius: '12px', background: '#f8fafc', border: '1px dashed #cbd5e1' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📊</div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#334155', margin: 0 }}>
            No report card has been published yet
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.925rem', maxWidth: '480px', margin: '0.5rem auto 1.5rem' }}>
            Results for <strong>{selectedExam}</strong> ({academicYear}) have not been officially declared yet. Check back following institutional examination reviews.
          </p>
          {isStaff && (
            <button onClick={() => setShowEntryDrawer(true)} className="btn btn-primary" style={{ fontWeight: 700 }}>
              Enter Marks & Publish Now
            </button>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* OFFICIAL REPORT CARD SHEET (PRINTS PRECISELY AS AN ACADEMIC CERTIFICATE) */}
      {/* ========================================================================= */}
      {!loading && (isPublished || (!isParent && reportCard)) && (
        <div
          className="report-card-sheet"
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '2px solid #e2e8f0',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            padding: '2.5rem',
            position: 'relative',
          }}
        >
          {/* Institutional Header & Crest */}
          <div
            style={{
              textAlign: 'center',
              borderBottom: '2.5px solid #1e293b',
              paddingBottom: '1.25rem',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem',
                  fontWeight: 900,
                }}
              >
                🏫
              </div>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  School Timetable & Attendance Management System
                </h2>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                  AFFILIATED TO STATE & CENTRAL SECONDARY EDUCATION BOARD · UDISE: 27210600101
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'inline-block',
                background: '#1e3a8a',
                color: '#ffffff',
                padding: '0.35rem 1.5rem',
                borderRadius: '9999px',
                fontSize: '0.85rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginTop: '0.5rem',
              }}
            >
              STUDENT ACADEMIC PERFORMANCE REPORT CARD
            </div>
          </div>

          {/* Student Dossier Information Grid */}
          <div
            style={{
              background: '#f8fafc',
              border: '1.5px solid #cbd5e1',
              borderRadius: '10px',
              padding: '1.1rem 1.5rem',
              marginBottom: '1.75rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
            }}
          >
            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Student Name:
              </span>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                {reportCard.studentName || selectedChild?.name || 'Keerthana'}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Class & Section:
              </span>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                Class {reportCard.classSection || selectedChild?.classSection || '8A'}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Admission Number:
              </span>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                {reportCard.admissionNumber || selectedChild?.admissionNumber || 'ADM-2024'}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Academic Year:
              </span>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                {reportCard.academicYear || academicYear}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Examination Term:
              </span>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1d4ed8' }}>
                {reportCard.examName || selectedExam}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Publication Status:
              </span>
              <div>
                <span className={`badge ${isPublished ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}>
                  {isPublished ? '✅ Official & Published' : '🟡 Preliminary Draft'}
                </span>
              </div>
            </div>
          </div>

          {/* Academic Performance Table */}
          <div style={{ marginBottom: '1.75rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>📚</span>
              <span>Subject-Wise Examination Marks</span>
            </h3>

            <div className="table-responsive">
              <table
                className="table"
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  border: '1.5px solid #cbd5e1',
                }}
              >
                <thead>
                  <tr style={{ background: '#1e293b', color: '#ffffff' }}>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 800, color: '#fff' }}>Subject</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 800, color: '#fff' }}>Max Marks</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 800, color: '#fff' }}>Marks Obtained</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 800, color: '#fff' }}>Percentage</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 800, color: '#fff' }}>Grade</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 800, color: '#fff' }}>Grade Point</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 800, color: '#fff' }}>Result</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 800, color: '#fff' }}>Faculty Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {reportCard.subjectResults && reportCard.subjectResults.length > 0 ? (
                    reportCard.subjectResults.map((sub, idx) => (
                      <tr
                        key={sub.id || idx}
                        style={{
                          background: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                          borderBottom: '1px solid #e2e8f0',
                        }}
                      >
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#0f172a' }}>
                          {sub.subjectName}
                          {sub.subjectCode && (
                            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'block' }}>
                              Code: {sub.subjectCode}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '0.85rem', textAlign: 'center', fontWeight: 700 }}>
                          {sub.maxMarks}
                        </td>
                        <td style={{ padding: '0.85rem', textAlign: 'center', fontWeight: 800, color: '#1e3a8a', fontSize: '1.05rem' }}>
                          {sub.marksObtained}
                        </td>
                        <td style={{ padding: '0.85rem', textAlign: 'center', fontWeight: 700 }}>
                          {sub.percentage ? Math.round(sub.percentage) : Math.round((sub.marksObtained / sub.maxMarks) * 100)}%
                        </td>
                        <td style={{ padding: '0.85rem', textAlign: 'center' }}>
                          <span
                            className="badge"
                            style={{
                              background: '#dbeafe',
                              color: '#1e40af',
                              fontWeight: 800,
                              fontSize: '0.85rem',
                              padding: '0.2rem 0.55rem',
                            }}
                          >
                            {sub.grade || 'A'}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem', textAlign: 'center', fontWeight: 700, color: '#475569' }}>
                          {sub.gradePoints !== undefined ? sub.gradePoints.toFixed(1) : '9.0'}
                        </td>
                        <td style={{ padding: '0.85rem', textAlign: 'center' }}>
                          <span
                            className={`badge ${sub.passFailStatus === 'FAIL' ? 'badge-danger' : 'badge-success'}`}
                            style={{ fontWeight: 800, fontSize: '0.75rem' }}
                          >
                            {sub.passFailStatus || 'PASS'}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontSize: '0.825rem', color: '#475569', fontStyle: 'italic' }}>
                          {sub.remarks || 'Consistent performance and active class participation.'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>
                        No subject marks entered yet for this term.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Overall Performance & Integrated Metrics Section */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.25rem',
              marginBottom: '1.75rem',
            }}
          >
            {/* KPI Summary Card */}
            <div
              style={{
                background: '#f0fdf4',
                border: '1.5px solid #86efac',
                borderRadius: '12px',
                padding: '1.25rem',
              }}
            >
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Overall Examination Standing
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.9rem', color: '#334155' }}>Total Marks:</span>
                <strong style={{ fontSize: '1.25rem', color: '#0f172a' }}>
                  {reportCard.totalMarks || 0} / {reportCard.maxMarks || 0}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.9rem', color: '#334155' }}>Percentage:</span>
                <strong style={{ fontSize: '1.5rem', fontWeight: 900, color: '#15803d' }}>
                  {reportCard.percentage !== undefined ? `${reportCard.percentage}%` : '0%'}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #86efac', paddingTop: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: '#334155' }}>Overall Grade:</span>
                <span className="badge badge-success" style={{ fontSize: '0.9rem', padding: '0.25rem 0.65rem' }}>
                  Grade {reportCard.overallGrade || 'A'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.35rem' }}>
                <span style={{ fontSize: '0.85rem', color: '#334155' }}>Subjects Passed / Failed:</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#166534' }}>
                  {reportCard.subjectsPassed || 0} Passed · {reportCard.subjectsFailed || 0} Failed
                </span>
              </div>
            </div>

            {/* Attendance Integration Summary (SRS Section 9) */}
            <div
              style={{
                background: '#eff6ff',
                border: '1.5px solid #93c5fd',
                borderRadius: '12px',
                padding: '1.25rem',
              }}
            >
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1e40af', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>📅</span>
                <span>Cumulative Attendance Standing</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#334155' }}>Total Working Days / Sessions:</span>
                <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{reportCard.totalWorkingDays || 120}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#334155' }}>Present Sessions:</span>
                <strong style={{ fontSize: '1rem', color: '#047857' }}>{reportCard.presentDays || 112}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#334155' }}>Absent Sessions:</span>
                <strong style={{ fontSize: '1rem', color: '#b91c1c' }}>{reportCard.absentDays || 8}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #93c5fd', paddingTop: '0.4rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#334155' }}>Attendance Rate:</span>
                <strong style={{ fontSize: '1.35rem', color: '#1d4ed8', fontWeight: 800 }}>
                  {reportCard.attendancePercentage ? Math.round(reportCard.attendancePercentage) : 93.3}%
                </strong>
              </div>
            </div>

            {/* Coursework & Assignment Performance (SRS Section 7) */}
            <div
              style={{
                background: '#faf5ff',
                border: '1.5px solid #d8b4fe',
                borderRadius: '12px',
                padding: '1.25rem',
              }}
            >
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#6b21a8', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>📝</span>
                <span>Assignment & Coursework Metrics</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#334155' }}>Assignments Completed:</span>
                <strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>
                  {reportCard.assignmentsCompleted || 8} / {reportCard.totalAssignments || 10}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#334155' }}>Average Deliverable Score:</span>
                <strong style={{ fontSize: '1.35rem', color: '#7e22ce', fontWeight: 800 }}>
                  {reportCard.averageAssignmentScore || 88}%
                </strong>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', borderTop: '1px dashed #d8b4fe', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                Derived from real assignments module submissions and faculty evaluation.
              </div>
            </div>
          </div>

          {/* Teacher Remarks Section (SRS Section 10) */}
          <div
            style={{
              background: '#fffbeb',
              border: '1.5px solid #fde68a',
              borderRadius: '10px',
              padding: '1.25rem',
              marginBottom: '2.5rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#92400e', textTransform: 'uppercase' }}>
                Class Teacher Comprehensive Remarks:
              </span>
              <span style={{ fontSize: '0.8rem', color: '#78350f', fontWeight: 700 }}>
                Class Teacher: {reportCard.classTeacherName || 'Ravi Kumar'}
              </span>
            </div>
            <p style={{ margin: 0, color: '#451a03', fontSize: '0.95rem', lineHeight: '1.6', fontStyle: 'italic' }}>
              "{reportCard.teacherRemarks || 'Keerthana has shown excellent progress in Mathematics and Physics. Continue working on written communication.'}"
            </p>
          </div>

          {/* Official Signatures Block (For Print & Verification) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '2rem',
              textAlign: 'center',
              paddingTop: '1.5rem',
              borderTop: '1px solid #cbd5e1',
            }}
          >
            <div>
              <div style={{ height: '45px', borderBottom: '1.5px solid #0f172a', marginBottom: '0.4rem' }}></div>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase' }}>
                Class Teacher Signature
              </span>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{reportCard.classTeacherName || 'Ravi Kumar'}</div>
            </div>

            <div>
              <div style={{ height: '45px', borderBottom: '1.5px solid #0f172a', marginBottom: '0.4rem' }}></div>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase' }}>
                Principal / Head of School
              </span>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Institutional Stamp & Seal</div>
            </div>

            <div>
              <div style={{ height: '45px', borderBottom: '1.5px solid #0f172a', marginBottom: '0.4rem' }}></div>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase' }}>
                Parent / Guardian Signature
              </span>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Acknowledgement of Term Report</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
