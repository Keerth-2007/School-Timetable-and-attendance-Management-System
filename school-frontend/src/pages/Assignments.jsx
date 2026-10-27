import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { assignmentApi, metadataApi, usersApi } from '../services/api';
import {
  IconCalendar,
  IconClock,
  IconCheckCircle,
  IconAlertTriangle,
  IconXCircle,
  IconPlus,
  IconRefreshCw,
  IconArrowRight,
  IconFileText,
  IconDownload,
  IconUser,
  IconShield,
} from '../components/Icons';

export default function Assignments() {
  const { user } = useAuth();
  const isStudent = user?.role === 'STUDENT';
  const isTeacher = ['TEACHER', 'CLASS_TEACHER', 'ADMIN', 'PRINCIPAL'].includes(user?.role);
  const isParent = user?.role === 'PARENT';

  // Data states
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Dropdowns for teacher creation
  const [subjects, setSubjects] = useState([]);
  const [classOptions] = useState(['8A', '12A', '7B', '7C', '9B', '10A']);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, PENDING, SUBMITTED, GRADED, OVERDUE
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('ALL');
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionsList, setSubmissionsList] = useState([]);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);

  // Student submission form
  const [submissionFile, setSubmissionFile] = useState(null);
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);

  // Teacher Create Form
  const initialCreateForm = {
    title: '',
    description: '',
    instructions: '',
    classSection: user?.classSection || '8A',
    subjectId: '',
    assignedDate: '2026-09-05',
    dueDate: '2026-09-12',
    dueTime: '23:59',
    totalPoints: 20,
    attachment: null,
  };
  const [createForm, setCreateForm] = useState(initialCreateForm);

  // Teacher Grading state for each submission in list: { [subId]: { marks: '', feedback: '', saving: false, saved: false } }
  const [gradingState, setGradingState] = useState({});

  // Fetch assignments data based on role
  const fetchAssignments = async () => {
    setLoading(true);
    setError('');
    try {
      if (isStudent) {
        const studentId = user?.id || user?.userId;
        const res = await assignmentApi.getStudentAssignments(studentId);
        setAssignments(res.data || []);
      } else if (isTeacher) {
        const teacherId = user?.id || user?.userId;
        const res = await assignmentApi.getTeacherAssignments(teacherId);
        setAssignments(res.data || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  // Fetch metadata for teacher
  const fetchTeacherMetadata = async () => {
    try {
      const subRes = await metadataApi.getSubjects();
      setSubjects(subRes.data || []);
      if (subRes.data && subRes.data.length > 0 && !createForm.subjectId) {
        // Default to Physics (id 3) if available
        const phys = subRes.data.find(s => s.name.toLowerCase().includes('physics'));
        setCreateForm(prev => ({ ...prev, subjectId: phys ? phys.id : subRes.data[0].id }));
      }
    } catch (err) {
      console.warn('Could not load subjects metadata', err);
    }
  };

  useEffect(() => {
    fetchAssignments();
    if (isTeacher) {
      fetchTeacherMetadata();
    }
  }, [user]);

  // Deadline countdown helper
  const getDeadlineBadge = (deadlineStr, dueDateStr) => {
    if (!deadlineStr && !dueDateStr) return null;
    const targetDate = new Date(deadlineStr || (dueDateStr + 'T23:59:00'));
    const now = new Date(); // Simulates client/server time
    const diffMs = targetDate - now;

    if (diffMs <= 0) {
      return {
        label: '🔴 Deadline passed',
        isPassed: true,
        color: '#dc2626',
        bg: '#fef2f2',
        border: '#fecaca',
      };
    }

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    let label = '';
    if (diffDays > 1) {
      label = `⏳ ${diffDays} days remaining`;
    } else if (diffDays === 1) {
      label = '⏳ 1 day remaining';
    } else if (diffHours > 0) {
      label = `⏳ ${diffHours} hours remaining`;
    } else {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      label = `⏳ ${diffMins} mins remaining`;
    }

    return {
      label,
      isPassed: false,
      color: diffDays <= 2 ? '#d97706' : '#2563eb',
      bg: diffDays <= 2 ? '#fffbeb' : '#eff6ff',
      border: diffDays <= 2 ? '#fde68a' : '#bfdbfe',
    };
  };

  // Filtered assignments
  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      // Status filter
      if (statusFilter !== 'ALL') {
        const status = (a.submissionStatus || a.status || '').toUpperCase();
        if (statusFilter === 'PENDING' && status !== 'PENDING') return false;
        if (statusFilter === 'SUBMITTED' && status !== 'SUBMITTED') return false;
        if (statusFilter === 'GRADED' && status !== 'GRADED') return false;
        if (statusFilter === 'OVERDUE' && status !== 'OVERDUE') return false;
      }
      // Subject filter
      if (selectedSubjectFilter !== 'ALL') {
        if (String(a.subjectId) !== String(selectedSubjectFilter)) return false;
      }
      // Class filter
      if (selectedClassFilter !== 'ALL') {
        if (a.classSection !== selectedClassFilter) return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (a.title || '').toLowerCase().includes(q);
        const subjMatch = (a.subjectName || '').toLowerCase().includes(q);
        const teachMatch = (a.teacherName || '').toLowerCase().includes(q);
        const descMatch = (a.description || '').toLowerCase().includes(q);
        if (!titleMatch && !subjMatch && !teachMatch && !descMatch) return false;
      }
      return true;
    });
  }, [assignments, statusFilter, selectedSubjectFilter, selectedClassFilter, searchQuery]);

  // Open Student Detail & Submission Modal
  const handleOpenDetailModal = (assignment) => {
    setSelectedAssignment(assignment);
    setSubmissionFile(null);
    setSubmissionNotes('');
    setIsReplacing(false);
    setShowDetailModal(true);
  };

  // Student Submits File
  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    if (!submissionFile) {
      alert('Please choose a file to submit.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', submissionFile);
      if (submissionNotes) {
        formData.append('submissionText', submissionNotes);
      }

      await assignmentApi.submitAssignment(selectedAssignment.id, formData);
      setSuccessMsg(`Assignment "${selectedAssignment.title}" submitted successfully!`);
      setShowDetailModal(false);
      fetchAssignments();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert('Submission failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Teacher Opens Submissions View
  const handleOpenSubmissions = async (assignment) => {
    setSelectedAssignment(assignment);
    setShowSubmissionsModal(true);
    setSubmissionsLoading(true);
    try {
      const res = await assignmentApi.getSubmissions(assignment.id);
      const data = res.data || [];
      setSubmissionsList(data);

      // Initialize grading state for each student
      const initState = {};
      data.forEach((sub) => {
        initState[sub.id || sub.studentId] = {
          marks: sub.score !== null && sub.score !== undefined ? sub.score : '',
          feedback: sub.feedback || '',
          saving: false,
          saved: false,
        };
      });
      setGradingState(initState);
    } catch (err) {
      alert('Failed to load student submissions: ' + err.message);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  // Teacher Saves Grade
  const handleSaveGrade = async (sub) => {
    const stateKey = sub.id || sub.studentId;
    const currentState = gradingState[stateKey] || {};
    const marksVal = parseFloat(currentState.marks);

    if (isNaN(marksVal)) {
      alert('Please enter a valid numeric mark.');
      return;
    }

    if (marksVal < 0 || marksVal > selectedAssignment.totalPoints) {
      alert(`Marks must be between 0 and ${selectedAssignment.totalPoints}`);
      return;
    }

    setGradingState((prev) => ({
      ...prev,
      [stateKey]: { ...prev[stateKey], saving: true },
    }));

    try {
      await assignmentApi.gradeSubmission(sub.id, {
        marks: marksVal,
        feedback: currentState.feedback || 'Good work.',
      });

      // Update local item
      setSubmissionsList((prev) =>
        prev.map((item) =>
          item.id === sub.id
            ? {
                ...item,
                status: 'GRADED',
                score: marksVal,
                feedback: currentState.feedback,
                percentage: (marksVal / selectedAssignment.totalPoints) * 100,
              }
            : item
        )
      );

      setGradingState((prev) => ({
        ...prev,
        [stateKey]: { ...prev[stateKey], saving: false, saved: true },
      }));

      setSuccessMsg(`Grade saved for ${sub.studentName} (${marksVal}/${selectedAssignment.totalPoints})`);
      fetchAssignments();
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err) {
      alert('Grading failed: ' + err.message);
      setGradingState((prev) => ({
        ...prev,
        [stateKey]: { ...prev[stateKey], saving: false },
      }));
    }
  };

  // Teacher Creates Assignment
  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!createForm.title.trim()) {
      alert('Please enter assignment title.');
      return;
    }
    if (!createForm.subjectId) {
      alert('Please select a subject.');
      return;
    }
    if (!createForm.dueDate) {
      alert('Please choose a deadline date.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', createForm.title);
      formData.append('description', createForm.description || '');
      formData.append('instructions', createForm.instructions || '');
      formData.append('classSection', createForm.classSection);
      formData.append('subjectId', createForm.subjectId);
      formData.append('assignedDate', createForm.assignedDate);
      formData.append('dueDate', createForm.dueDate);
      formData.append('dueTime', createForm.dueTime || '23:59');
      formData.append('totalPoints', createForm.totalPoints);
      if (createForm.attachment) {
        formData.append('attachment', createForm.attachment);
      }

      await assignmentApi.create(formData);
      setSuccessMsg(`Assignment "${createForm.title}" created & dispatched to Class ${createForm.classSection}.`);
      setShowCreateModal(false);
      setCreateForm(initialCreateForm);
      fetchAssignments();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert('Error creating assignment: ' + err.message);
    }
  };

  // Secure File Download Handler
  const handleDownloadFile = async (submissionId, originalName) => {
    try {
      const res = await assignmentApi.downloadSubmissionBlob(submissionId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', originalName || 'submission.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('File download error: ' + err.message);
    }
  };

  const handleDownloadAttachment = async (assignmentId, originalName) => {
    try {
      const res = await assignmentApi.downloadAttachmentBlob(assignmentId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', originalName || 'assignment_question.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Attachment download error: ' + err.message);
    }
  };

  // Status Badge Helper
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'GRADED':
        return (
          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <span>🟢</span>
            <span>Graded</span>
          </span>
        );
      case 'SUBMITTED':
        return (
          <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <span>🔵</span>
            <span>Submitted</span>
          </span>
        );
      case 'OVERDUE':
        return (
          <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <span>🔴</span>
            <span>Overdue</span>
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <span>🟡</span>
            <span>Pending</span>
          </span>
        );
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '3.5rem' }}>
      {/* Header Banner */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '1.75rem' }}>📝</span>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              {isStudent ? 'My Assignments' : 'Assignment Management'}
            </h1>
            <span className={`role-chip ${user?.role}`}>{user?.role?.replace('_', ' ')}</span>
            {isStudent && user?.classSection && (
              <span className="badge badge-primary">Class {user.classSection}</span>
            )}
          </div>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
            {isStudent
              ? 'View class coursework, upload deliverables, inspect grades and instructor feedback.'
              : 'Create class coursework, monitor student submissions, verify files, and assign graded marks.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {isTeacher && (
            <button
              onClick={() => {
                fetchTeacherMetadata();
                setShowCreateModal(true);
              }}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
            >
              <IconPlus size={16} />
              <span>Create Assignment</span>
            </button>
          )}

          <button onClick={fetchAssignments} className="btn btn-secondary btn-sm" disabled={loading}>
            <IconRefreshCw size={15} />
            <span>Refresh</span>
          </button>
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

      {/* Filters & Search Toolbar */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem', background: '#ffffff', borderRadius: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Status Filter Pills */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginRight: '0.25rem' }}>Status:</span>
            {[
              { id: 'ALL', label: 'All Assignments' },
              { id: 'PENDING', label: '🟡 Pending' },
              { id: 'SUBMITTED', label: '🔵 Submitted' },
              { id: 'GRADED', label: '🟢 Graded' },
              { id: 'OVERDUE', label: '🔴 Overdue' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                style={{
                  border: statusFilter === st.id ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                  background: statusFilter === st.id ? '#eff6ff' : '#f8fafc',
                  color: statusFilter === st.id ? '#1d4ed8' : '#475569',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '9999px',
                  fontSize: '0.775rem',
                  fontWeight: statusFilter === st.id ? 800 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Sub-filters & Search Bar */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
              <div style={{ minWidth: '220px', flex: 1 }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search assignments (e.g. Physics, Newton, Mathematics)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              {isTeacher && (
                <select
                  className="form-control"
                  value={selectedClassFilter}
                  onChange={(e) => setSelectedClassFilter(e.target.value)}
                  style={{ width: 'auto', minWidth: '130px', fontSize: '0.85rem' }}
                >
                  <option value="ALL">All Classes</option>
                  {classOptions.map((c) => (
                    <option key={c} value={c}>Class {c}</option>
                  ))}
                </select>
              )}

              {subjects.length > 0 && (
                <select
                  className="form-control"
                  value={selectedSubjectFilter}
                  onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                  style={{ width: 'auto', minWidth: '140px', fontSize: '0.85rem' }}
                >
                  <option value="ALL">All Subjects</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              )}

              {(statusFilter !== 'ALL' || selectedSubjectFilter !== 'ALL' || selectedClassFilter !== 'ALL' || searchQuery) && (
                <button
                  onClick={() => {
                    setStatusFilter('ALL');
                    setSelectedSubjectFilter('ALL');
                    setSelectedClassFilter('ALL');
                    setSearchQuery('');
                  }}
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '0.8rem', color: '#dc2626' }}
                >
                  Clear Filters
                </button>
              )}
            </div>

            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>
              Showing {filteredAssignments.length} assignment(s)
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
          Loading assignments and submission records...
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', background: '#f8fafc', borderRadius: '12px' }}>
          <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.75rem' }}>📭</span>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>
            {isStudent ? 'No assignments have been assigned yet.' : 'No assignments created yet.'}
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>
            {isStudent
              ? 'Check back later or verify with your class instructor for upcoming coursework.'
              : 'Click "Create Assignment" to assign coursework to your classes.'}
          </p>
        </div>
      ) : isStudent ? (
        /* ==================== STUDENT VIEW ==================== */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {filteredAssignments.map((a) => {
            const deadlineInfo = getDeadlineBadge(a.deadline, a.dueDate);
            const status = a.submissionStatus || 'PENDING';
            const isGraded = status === 'GRADED';
            const isSubmitted = status === 'SUBMITTED';

            return (
              <div
                key={a.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '1.25rem',
                  borderRadius: '12px',
                  border: isGraded ? '1px solid #bbf7d0' : isSubmitted ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
              >
                <div>
                  {/* Top Header: Subject & Status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px',
                        background: '#eff6ff',
                        color: '#1d4ed8',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {a.subjectName || 'Subject'}
                    </span>
                    {renderStatusBadge(status)}
                  </div>

                  {/* Title & Teacher */}
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.35rem 0', lineHeight: 1.3 }}>
                    {a.title}
                  </h3>

                  <div style={{ fontSize: '0.825rem', color: '#64748b', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span>Instructor:</span>
                    <strong style={{ color: '#334155' }}>{a.teacherName || 'Faculty'}</strong>
                  </div>

                  {/* Description snippet */}
                  {a.description && (
                    <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.4, margin: '0 0 1rem 0' }}>
                      {a.description.length > 130 ? a.description.substring(0, 130) + '...' : a.description}
                    </p>
                  )}

                  {/* Key Metadata Grid */}
                  <div
                    style={{
                      background: '#f8fafc',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      marginBottom: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem',
                      fontSize: '0.8rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Assigned Date:</span>
                      <strong style={{ color: '#1e293b' }}>
                        {a.assignedDate ? new Date(a.assignedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '05 Sep 2026'}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Deadline:</span>
                      <strong style={{ color: '#1e293b' }}>
                        {a.dueDate ? new Date(a.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '12 Sep 2026'}, {a.dueTime || '11:59 PM'}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Maximum Marks:</span>
                      <strong style={{ color: '#1e293b' }}>{a.totalPoints} Marks</strong>
                    </div>
                  </div>

                  {/* Countdown ribbon */}
                  {deadlineInfo && (
                    <div
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '0.35rem 0.6rem',
                        borderRadius: '6px',
                        background: deadlineInfo.bg,
                        color: deadlineInfo.color,
                        border: `1px solid ${deadlineInfo.border}`,
                        marginBottom: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <span>{deadlineInfo.label}</span>
                    </div>
                  )}

                  {/* Graded Results Banner */}
                  {isGraded && (
                    <div
                      style={{
                        background: '#f0fdf4',
                        border: '1px solid #86efac',
                        borderRadius: '8px',
                        padding: '0.75rem',
                        marginBottom: '1rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>
                          Awarded Marks
                        </span>
                        <strong style={{ fontSize: '1.15rem', color: '#15803d' }}>
                          {a.score} / {a.totalPoints}
                        </strong>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 600 }}>
                        Performance: {a.percentage ? Math.round(a.percentage) : Math.round((a.score / a.totalPoints) * 100)}%
                      </div>
                      {a.feedback && (
                        <div style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: '#334155', fontStyle: 'italic', borderTop: '1px dashed #bbf7d0', paddingTop: '0.35rem' }}>
                          "{a.feedback}"
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Action Button */}
                <button
                  onClick={() => handleOpenDetailModal(a)}
                  className={`btn ${isGraded ? 'btn-secondary' : 'btn-primary'}`}
                  style={{ width: '100%', justifyContent: 'center', fontWeight: 700, fontSize: '0.875rem' }}
                >
                  <span>{isGraded ? 'View Grade & Feedback' : isSubmitted ? 'View Submission / Resubmit' : 'View Assignment & Submit'}</span>
                  <IconArrowRight size={14} />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        /* ==================== TEACHER VIEW ==================== */
        <div className="card" style={{ padding: '1.25rem', background: '#ffffff', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Coursework & Submissions Registry
            </h2>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Real-time student progress tracking & instant grading
            </span>
          </div>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Assignment Title</th>
                  <th>Class</th>
                  <th>Subject</th>
                  <th>Assigned Date</th>
                  <th>Deadline</th>
                  <th>Submissions</th>
                  <th>Graded</th>
                  <th>Pending Grading</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssignments.map((a) => {
                  const deadlineInfo = getDeadlineBadge(a.deadline, a.dueDate);

                  return (
                    <tr key={a.id}>
                      <td>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.925rem' }}>
                          {a.title}
                        </div>
                        {a.attachmentName && (
                          <span style={{ fontSize: '0.75rem', color: '#2563eb', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.15rem' }}>
                            📎 {a.attachmentName}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="badge badge-primary">Class {a.classSection}</span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: '#334155' }}>{a.subjectName || 'Subject'}</span>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: '#64748b' }}>
                        {a.assignedDate ? new Date(a.assignedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '05 Sep'}
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
                          {a.dueDate ? new Date(a.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '12 Sep'}, {a.dueTime || '23:59'}
                        </div>
                        {deadlineInfo && (
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: deadlineInfo.color }}>
                            {deadlineInfo.label}
                          </span>
                        )}
                      </td>
                      <td>
                        <strong style={{ color: '#0f172a' }}>
                          {a.submittedCount !== undefined ? a.submittedCount : 0}
                        </strong>
                        <span style={{ color: '#64748b', fontSize: '0.8rem' }}>
                          /{a.totalStudents || 30}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: '#047857', fontWeight: 700 }}>
                          {a.gradedCount !== undefined ? a.gradedCount : 0}
                        </span>
                        <span style={{ color: '#64748b', fontSize: '0.8rem' }}>
                          /{a.submittedCount || 0}
                        </span>
                      </td>
                      <td>
                        {a.pendingGradingCount > 0 ? (
                          <span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>
                            {a.pendingGradingCount} Pending
                          </span>
                        ) : (
                          <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                            ✓ All Graded
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => handleOpenSubmissions(a)}
                          className="btn btn-primary btn-sm"
                          style={{ fontWeight: 700, fontSize: '0.8rem' }}
                        >
                          <span>View Submissions</span>
                          <IconArrowRight size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 1: STUDENT VIEW ASSIGNMENT & SUBMISSION MODAL */}
      {/* ==================================================== */}
      {showDetailModal && selectedAssignment && (
        <div className="modal-backdrop" onClick={() => setShowDetailModal(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '16px' }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '6px',
                    background: '#eff6ff',
                    color: '#1d4ed8',
                    display: 'inline-block',
                    marginBottom: '0.35rem',
                  }}
                >
                  {selectedAssignment.subjectName || 'Subject'} · Class {selectedAssignment.classSection}
                </span>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  {selectedAssignment.title}
                </h2>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '1.2rem', padding: '0.2rem 0.5rem' }}
              >
                ✕
              </button>
            </div>

            {/* Assignment Details Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '0.75rem',
                background: '#f8fafc',
                padding: '0.85rem 1rem',
                borderRadius: '10px',
                marginBottom: '1.25rem',
                border: '1px solid #e2e8f0',
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Instructor</div>
                <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{selectedAssignment.teacherName || 'Faculty'}</strong>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Assigned Date</div>
                <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>
                  {selectedAssignment.assignedDate ? new Date(selectedAssignment.assignedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '05 Sep 2026'}
                </strong>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Deadline</div>
                <strong style={{ fontSize: '0.9rem', color: '#b91c1c' }}>
                  {selectedAssignment.dueDate ? new Date(selectedAssignment.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '12 Sep 2026'}, {selectedAssignment.dueTime || '11:59 PM'}
                </strong>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Maximum Marks</div>
                <strong style={{ fontSize: '0.9rem', color: '#047857' }}>{selectedAssignment.totalPoints} Marks</strong>
              </div>
            </div>

            {/* Description & Instructions */}
            <div style={{ marginBottom: '1.25rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>
                Instructions:
              </h4>
              <div
                style={{
                  padding: '1rem',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  lineHeight: '1.5',
                  color: '#334155',
                  whiteSpace: 'pre-line',
                }}
              >
                {selectedAssignment.instructions || selectedAssignment.description || 'Complete all questions thoroughly and upload your solved assignment before the deadline.'}
              </div>
            </div>

            {/* Teacher Attachment (if any) */}
            {selectedAssignment.attachmentName && (
              <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Attachments:</span>
                <button
                  type="button"
                  onClick={() => handleDownloadAttachment(selectedAssignment.id, selectedAssignment.attachmentName)}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#2563eb' }}
                >
                  <IconDownload size={14} />
                  <span>📎 {selectedAssignment.attachmentName}</span>
                </button>
              </div>
            )}

            {/* Graded Evaluation Results (if graded) */}
            {selectedAssignment.submissionStatus === 'GRADED' && (
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1.5px solid #86efac',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  marginBottom: '1.5rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>🎉</span>
                    <strong style={{ fontSize: '1.05rem', color: '#166534' }}>Graded Evaluation Result</strong>
                  </div>
                  <span className="badge badge-success" style={{ fontSize: '0.8rem' }}>🟢 Graded</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', margin: '0.75rem 0' }}>
                  <div style={{ background: '#ffffff', padding: '0.75rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 600 }}>MARKS AWARDED</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#15803d' }}>
                      {selectedAssignment.score} / {selectedAssignment.totalPoints}
                    </div>
                  </div>
                  <div style={{ background: '#ffffff', padding: '0.75rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 600 }}>PERCENTAGE</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#15803d' }}>
                      {selectedAssignment.percentage ? Math.round(selectedAssignment.percentage) : Math.round((selectedAssignment.score / selectedAssignment.totalPoints) * 100)}%
                    </div>
                  </div>
                </div>

                {selectedAssignment.feedback && (
                  <div style={{ background: '#ffffff', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #bbf7d0', marginTop: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, marginBottom: '0.2rem' }}>
                      TEACHER FEEDBACK:
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#1e293b', fontStyle: 'italic' }}>
                      "{selectedAssignment.feedback}"
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Submission Section */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>
                Your Deliverable & Submission
              </h3>

              {selectedAssignment.isOverdue && selectedAssignment.submissionStatus !== 'SUBMITTED' && selectedAssignment.submissionStatus !== 'GRADED' ? (
                /* Deadline Passed without submission */
                <div
                  className="alert alert-danger"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', borderRadius: '10px' }}
                >
                  <IconAlertTriangle size={24} color="#dc2626" />
                  <div>
                    <strong style={{ fontSize: '0.95rem' }}>🔴 Submission deadline has passed.</strong>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem' }}>
                      Submission closed. The deadline for this assignment was{' '}
                      {selectedAssignment.dueDate ? new Date(selectedAssignment.dueDate).toLocaleDateString('en-GB') : ''}{' '}
                      at {selectedAssignment.dueTime || '11:59 PM'}. Late submissions are not permitted.
                    </p>
                  </div>
                </div>
              ) : selectedAssignment.submissionStatus === 'SUBMITTED' && !isReplacing ? (
                /* Already Submitted & can replace */
                <div
                  style={{
                    background: '#eff6ff',
                    border: '1.5px solid #bfdbfe',
                    borderRadius: '10px',
                    padding: '1.25rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e40af' }}>
                      🟢 Assignment Successfully Submitted
                    </span>
                    <span className="badge badge-info">🔵 Submitted</span>
                  </div>

                  <div style={{ fontSize: '0.85rem', color: '#334155', marginBottom: '0.75rem' }}>
                    <div><strong>Submitted Date:</strong> {selectedAssignment.submittedAt ? new Date(selectedAssignment.submittedAt).toLocaleString('en-GB') : 'Just now'}</div>
                    <div><strong>File:</strong> 📎 {selectedAssignment.submittedFileName || 'Solution.pdf'}</div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {selectedAssignment.submissionId && (
                      <button
                        type="button"
                        onClick={() => handleDownloadFile(selectedAssignment.submissionId, selectedAssignment.submittedFileName)}
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <IconDownload size={14} />
                        <span>Download My Submitted File</span>
                      </button>
                    )}

                    {!selectedAssignment.isOverdue && (
                      <button
                        type="button"
                        onClick={() => setIsReplacing(true)}
                        className="btn btn-primary btn-sm"
                      >
                        <span>Replace Submission</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* Upload Submission Form */
                <form onSubmit={handleStudentSubmit}>
                  {isReplacing && (
                    <div className="alert alert-warning" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
                      <span>You are replacing your previous submission. Your new file will be recorded with the latest timestamp.</span>
                      <button
                        type="button"
                        onClick={() => setIsReplacing(false)}
                        className="btn btn-ghost btn-sm"
                        style={{ marginLeft: '0.5rem', textDecoration: 'underline' }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label" style={{ fontWeight: 700 }}>
                      Upload Assignment File <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <div
                      style={{
                        border: '2px dashed #cbd5e1',
                        borderRadius: '10px',
                        padding: '1.5rem',
                        textAlign: 'center',
                        background: '#f8fafc',
                        cursor: 'pointer',
                        transition: 'border-color 0.2s ease',
                      }}
                      onClick={() => document.getElementById('file-upload-input').click()}
                    >
                      <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>📁</span>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.25rem' }}>
                        {submissionFile ? submissionFile.name : 'Choose file or drag & drop here'}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>
                        Allowed: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, JPG, JPEG, PNG (Max 20MB)
                      </span>
                      <input
                        id="file-upload-input"
                        type="file"
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setSubmissionFile(e.target.files[0]);
                          }
                        }}
                      />
                    </div>
                    {submissionFile && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#047857', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span>✓ Selected:</span>
                        <span>{submissionFile.name} ({(submissionFile.size / 1024).toFixed(1)} KB)</span>
                      </div>
                    )}
                  </div>

                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label className="form-label">Submission Notes / Remarks (Optional)</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      placeholder="e.g., Attached complete solutions with diagrams for all questions..."
                      value={submissionNotes}
                      onChange={(e) => setSubmissionNotes(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', height: '44px', fontWeight: 700, fontSize: '0.925rem' }}
                    disabled={submitting || !submissionFile}
                  >
                    {submitting ? 'Uploading & Verifying...' : isReplacing ? 'Upload & Replace Submission' : 'Upload & Submit Assignment'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 2: TEACHER CREATE ASSIGNMENT MODAL */}
      {/* ==================================================== */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '16px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.4rem' }}>📝</span>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Create Class Assignment
                </h2>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '1.2rem', padding: '0.2rem 0.5rem' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAssignment}>
              <div className="form-group">
                <label className="form-label">
                  Assignment Title <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., Newton's Laws of Motion"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div className="form-group">
                  <label className="form-label">
                    Target Class / Section <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select
                    className="form-control"
                    value={createForm.classSection}
                    onChange={(e) => setCreateForm({ ...createForm, classSection: e.target.value })}
                    required
                  >
                    {classOptions.map((c) => (
                      <option key={c} value={c}>Class {c}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Subject <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select
                    className="form-control"
                    value={createForm.subjectId}
                    onChange={(e) => setCreateForm({ ...createForm, subjectId: e.target.value })}
                    required
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.85rem' }}>
                <div className="form-group">
                  <label className="form-label">Assigned Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={createForm.assignedDate}
                    onChange={(e) => setCreateForm({ ...createForm, assignedDate: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Deadline Date <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={createForm.dueDate}
                    onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Deadline Time</label>
                  <input
                    type="time"
                    className="form-control"
                    value={createForm.dueTime}
                    onChange={(e) => setCreateForm({ ...createForm, dueTime: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Maximum Marks</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    className="form-control"
                    value={createForm.totalPoints}
                    onChange={(e) => setCreateForm({ ...createForm, totalPoints: parseInt(e.target.value, 10) || 20 })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Brief Description</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., Explain Newton's three laws with examples."
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Instructions & Questions</label>
                <textarea
                  className="form-control"
                  rows={4}
                  placeholder="Explain Newton's three laws of motion with examples and diagrams..."
                  value={createForm.instructions}
                  onChange={(e) => setCreateForm({ ...createForm, instructions: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Question Paper / Instruction Attachment (Optional)</label>
                <input
                  type="file"
                  className="form-control"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setCreateForm({ ...createForm, attachment: e.target.files[0] });
                    }
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ fontWeight: 700 }}>
                  Create & Publish Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 3: TEACHER VIEW STUDENT SUBMISSIONS & GRADING */}
      {/* ==================================================== */}
      {showSubmissionsModal && selectedAssignment && (
        <div className="modal-backdrop" onClick={() => setShowSubmissionsModal(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '950px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '16px' }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '6px',
                    background: '#eff6ff',
                    color: '#1d4ed8',
                    display: 'inline-block',
                    marginBottom: '0.35rem',
                  }}
                >
                  Class {selectedAssignment.classSection} · {selectedAssignment.subjectName} · Max Marks: {selectedAssignment.totalPoints}
                </span>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Student Submissions — {selectedAssignment.title}
                </h2>
              </div>
              <button
                onClick={() => setShowSubmissionsModal(false)}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '1.2rem', padding: '0.2rem 0.5rem' }}
              >
                ✕
              </button>
            </div>

            {/* Submission Statistics Ribbon */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '0.75rem',
                marginBottom: '1.5rem',
              }}
            >
              <div className="card" style={{ padding: '0.65rem 0.85rem', borderLeft: '4px solid #2563eb' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>TOTAL ENROLLED</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>{submissionsList.length}</div>
              </div>
              <div className="card" style={{ padding: '0.65rem 0.85rem', borderLeft: '4px solid #10b981' }}>
                <div style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 600 }}>SUBMITTED</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#047857' }}>
                  {submissionsList.filter((s) => s.status === 'SUBMITTED' || s.status === 'GRADED').length}
                </div>
              </div>
              <div className="card" style={{ padding: '0.65rem 0.85rem', borderLeft: '4px solid #8b5cf6' }}>
                <div style={{ fontSize: '0.75rem', color: '#6d28d9', fontWeight: 600 }}>GRADED</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#6d28d9' }}>
                  {submissionsList.filter((s) => s.status === 'GRADED').length}
                </div>
              </div>
              <div className="card" style={{ padding: '0.65rem 0.85rem', borderLeft: '4px solid #f59e0b' }}>
                <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 600 }}>PENDING GRADING</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#b45309' }}>
                  {submissionsList.filter((s) => s.status === 'SUBMITTED').length}
                </div>
              </div>
              <div className="card" style={{ padding: '0.65rem 0.85rem', borderLeft: '4px solid #ef4444' }}>
                <div style={{ fontSize: '0.75rem', color: '#b91c1c', fontWeight: 600 }}>NOT SUBMITTED</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#b91c1c' }}>
                  {submissionsList.filter((s) => s.status !== 'SUBMITTED' && s.status !== 'GRADED').length}
                </div>
              </div>
            </div>

            {/* Submissions Table & Inline Grading */}
            {submissionsLoading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                Loading submission deliverables...
              </div>
            ) : submissionsList.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                No students enrolled in Class {selectedAssignment.classSection}.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table" style={{ fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Submission Status</th>
                      <th>Submitted File</th>
                      <th>Marks (Max: {selectedAssignment.totalPoints})</th>
                      <th>Feedback</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissionsList.map((sub) => {
                      const stateKey = sub.id || sub.studentId;
                      const currentState = gradingState[stateKey] || {};
                      const hasSubmission = sub.status === 'SUBMITTED' || sub.status === 'GRADED';

                      return (
                        <tr key={stateKey} style={{ background: sub.status === 'GRADED' ? '#fcfdfd' : 'transparent' }}>
                          <td>
                            <div style={{ fontWeight: 800, color: '#0f172a' }}>{sub.studentName}</div>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              Adm: {sub.admissionNumber || 'ADM001'} · Class {sub.classSection}
                            </span>
                          </td>

                          <td>
                            {renderStatusBadge(sub.status)}
                            {sub.submittedAt && (
                              <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '0.2rem' }}>
                                {new Date(sub.submittedAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                          </td>

                          <td>
                            {hasSubmission && sub.id ? (
                              <button
                                type="button"
                                onClick={() => handleDownloadFile(sub.id, sub.originalFilename)}
                                className="btn btn-ghost btn-sm"
                                style={{
                                  fontSize: '0.775rem',
                                  color: '#2563eb',
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  padding: '0.25rem 0.5rem',
                                  border: '1px solid #bfdbfe',
                                  borderRadius: '6px',
                                  background: '#eff6ff',
                                }}
                                title="Download and inspect student upload"
                              >
                                <IconDownload size={13} />
                                <span>{sub.originalFilename || 'Solution.pdf'}</span>
                              </button>
                            ) : (
                              <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.8rem' }}>
                                No submission received
                              </span>
                            )}
                          </td>

                          <td style={{ minWidth: '110px' }}>
                            {hasSubmission ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <input
                                  type="number"
                                  min={0}
                                  max={selectedAssignment.totalPoints}
                                  step={0.5}
                                  className="form-control"
                                  placeholder="Marks"
                                  value={currentState.marks}
                                  onChange={(e) =>
                                    setGradingState((prev) => ({
                                      ...prev,
                                      [stateKey]: { ...prev[stateKey], marks: e.target.value, saved: false },
                                    }))
                                  }
                                  style={{
                                    width: '65px',
                                    padding: '0.25rem 0.4rem',
                                    fontWeight: 800,
                                    fontSize: '0.85rem',
                                    textAlign: 'center',
                                  }}
                                />
                                <span style={{ color: '#64748b', fontWeight: 600 }}>/ {selectedAssignment.totalPoints}</span>
                              </div>
                            ) : (
                              <span style={{ color: '#94a3b8' }}>-</span>
                            )}
                          </td>

                          <td style={{ minWidth: '180px' }}>
                            {hasSubmission ? (
                              <input
                                type="text"
                                className="form-control"
                                placeholder="e.g. Good explanation and examples."
                                value={currentState.feedback}
                                onChange={(e) =>
                                  setGradingState((prev) => ({
                                    ...prev,
                                    [stateKey]: { ...prev[stateKey], feedback: e.target.value, saved: false },
                                  }))
                                }
                                style={{ fontSize: '0.8rem', padding: '0.3rem 0.5rem' }}
                              />
                            ) : (
                              <span style={{ color: '#94a3b8' }}>-</span>
                            )}
                          </td>

                          <td style={{ textAlign: 'right' }}>
                            {hasSubmission ? (
                              <button
                                type="button"
                                onClick={() => handleSaveGrade(sub)}
                                className={`btn btn-sm ${sub.status === 'GRADED' ? 'btn-secondary' : 'btn-primary'}`}
                                disabled={currentState.saving}
                                style={{ fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap' }}
                              >
                                {currentState.saving ? 'Saving...' : sub.status === 'GRADED' ? 'Update Grade' : 'Save Grade'}
                              </button>
                            ) : (
                              <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
