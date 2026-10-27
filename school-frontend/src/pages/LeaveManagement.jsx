import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { leaveApi, usersApi } from '../services/api';
import {
  IconUsers,
  IconCheckCircle,
  IconXCircle,
  IconClock,
  IconAlertTriangle,
  IconPlus,
  IconRefreshCw,
} from '../components/Icons';

export default function LeaveManagement() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState(
    ['ADMIN', 'PRINCIPAL'].includes(user?.role) ? 'pending' : 'myLeaves'
  );

  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [myLeaves, setMyLeaves] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Apply Leave Modal
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyError, setApplyError] = useState('');
  const [leaveForm, setLeaveForm] = useState({
    leaveType: 'CL',
    fromDate: new Date().toISOString().split('T')[0],
    toDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    reason: '',
  });

  // Substitution / Approval Modal
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [suggestedSubstitutes, setSuggestedSubstitutes] = useState([]);
  const [selectedSubId, setSelectedSubId] = useState('');
  const [subLoading, setSubLoading] = useState(false);
  const [approveError, setApproveError] = useState('');

  // Rejection Modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingLeave, setRejectingLeave] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);
  const [rejectError, setRejectError] = useState('');

  const isManagement = ['ADMIN', 'PRINCIPAL'].includes(user?.role);

  const fetchLeaveData = async () => {
    setLoading(true);
    setError('');
    try {
      if (isManagement) {
        const pendingRes = await leaveApi.getPending();
        setPendingLeaves(pendingRes.data);
      }
      if (['TEACHER', 'CLASS_TEACHER'].includes(user?.role)) {
        const balanceRes = await leaveApi.getBalance(user.id || user.userId);
        setLeaveBalance(balanceRes.data);
        if (Array.isArray(balanceRes.data?.applications)) {
          setMyLeaves(balanceRes.data.applications);
        } else {
          const histRes = await leaveApi.getHistory(user.id || user.userId);
          setMyLeaves(histRes.data || []);
        }
      } else if (['STUDENT', 'PARENT'].includes(user?.role)) {
        const targetId = user.id || user.userId;
        const histRes = await leaveApi.getHistory(targetId);
        setMyLeaves(histRes.data || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load leave records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveData();
  }, [user]);

  // Submit Leave Application
  const handleApplyLeave = async (e) => {
    e.preventDefault();
    setApplyError('');
    setApplyLoading(true);

    try {
      const payload = {
        teacher: user,
        leaveType: leaveForm.leaveType,
        fromDate: leaveForm.fromDate,
        toDate: leaveForm.toDate,
        reason: leaveForm.reason.trim(),
        status: 'PENDING',
      };

      await leaveApi.apply(payload);
      setSuccessMsg('Leave application submitted successfully for principal review.');
      setShowApplyModal(false);
      fetchLeaveData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setApplyError(err.message);
    } finally {
      setApplyLoading(false);
    }
  };

  // Open Approval Modal & Trigger Substitution Engine (FR6)
  const handleOpenApprove = async (leave) => {
    setSelectedLeave(leave);
    setShowApproveModal(true);
    setSubLoading(true);
    setApproveError('');
    setSuggestedSubstitutes([]);
    setSelectedSubId('');

    try {
      // Calls FR6 substitution engine: finds teachers who have free slots matching absent teacher's periods!
      const subRes = await leaveApi.suggestSubstitutes(leave.teacher.id);
      setSuggestedSubstitutes(subRes.data);
      if (subRes.data.length > 0) {
        setSelectedSubId(subRes.data[0].id);
      }
    } catch (err) {
      setApproveError('Could not calculate substitute teachers: ' + err.message);
    } finally {
      setSubLoading(false);
    }
  };

  // Confirm Approval with Substitute Assignment
  const handleConfirmApproval = async (e) => {
    e.preventDefault();
    if (!selectedSubId) {
      setApproveError('Please select a substitute teacher to ensure uninterrupted instruction (FR6).');
      return;
    }

    setSubLoading(true);
    setApproveError('');
    try {
      await leaveApi.approve(selectedLeave.id, user.id, Number(selectedSubId));
      setSuccessMsg(`Leave approved and substitute successfully confirmed!`);
      setShowApproveModal(false);
      fetchLeaveData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setApproveError(err.message);
    } finally {
      setSubLoading(false);
    }
  };

  // Open Reject Modal
  const handleOpenReject = (leave) => {
    setRejectingLeave(leave);
    setRejectionReason('');
    setRejectError('');
    setShowRejectModal(true);
  };

  // Confirm Rejection with Documented Reason
  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      setRejectError('Documented reason is required for leave rejection per institutional policy.');
      return;
    }
    setRejectLoading(true);
    setRejectError('');
    try {
      await leaveApi.reject(rejectingLeave.id, user.id, rejectionReason.trim());
      setSuccessMsg('Leave application rejected and reason documented.');
      setShowRejectModal(false);
      fetchLeaveData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setRejectError(err.message || 'Failed to reject leave application');
    } finally {
      setRejectLoading(false);
    }
  };

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
            <IconUsers size={26} />
            <span>
              {['STUDENT', 'PARENT'].includes(user?.role)
                ? 'Student Leave Portal & History'
                : 'Staff Leave & Substitution Workflow'}
            </span>
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            {['STUDENT', 'PARENT'].includes(user?.role)
              ? 'Institutional student leave applications, approval tracking, and absence documentation.'
              : 'Automated substitute suggestion engine to ensure uninterrupted classroom instruction (FR6).'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {['TEACHER', 'CLASS_TEACHER', 'STUDENT'].includes(user?.role) && (
            <button onClick={() => setShowApplyModal(true)} className="btn btn-primary btn-sm">
              <IconPlus size={16} />
              <span>{user?.role === 'STUDENT' ? 'Apply for Student Leave' : 'Apply for Leave'}</span>
            </button>
          )}
          <button onClick={fetchLeaveData} className="btn btn-secondary btn-sm" disabled={loading}>
            <IconRefreshCw size={14} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="alert alert-success" style={{ marginBottom: '1.25rem' }}>
          <IconCheckCircle size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>
          <IconAlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        {isManagement && (
          <button
            onClick={() => setActiveTab('pending')}
            className={`btn btn-sm ${activeTab === 'pending' ? 'btn-primary' : 'btn-ghost'}`}
          >
            Pending Approvals ({pendingLeaves.length})
          </button>
        )}
        {['TEACHER', 'CLASS_TEACHER'].includes(user?.role) && (
          <button
            onClick={() => setActiveTab('myLeaves')}
            className={`btn btn-sm ${activeTab === 'myLeaves' ? 'btn-primary' : 'btn-ghost'}`}
          >
            My Leave Applications
          </button>
        )}
        {['STUDENT', 'PARENT'].includes(user?.role) && (
          <button
            onClick={() => setActiveTab('myLeaves')}
            className={`btn btn-sm ${activeTab === 'myLeaves' ? 'btn-primary' : 'btn-ghost'}`}
          >
            Leave History
          </button>
        )}
      </div>

      {/* Management Pending Approvals Tab */}
      {activeTab === 'pending' && isManagement && (
        <div className="card" style={{ padding: '1.25rem' }}>
          <div className="card-header">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
              Pending Staff Leave Applications
            </h3>
          </div>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Teacher</th>
                  <th>Leave Type</th>
                  <th>Date Range</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Workflow Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingLeaves.length > 0 ? (
                  pendingLeaves.map((leave) => (
                    <tr key={leave.id}>
                      <td>
                        <strong>{leave.teacher?.name}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          ID: {leave.teacher?.employeeId || 'EMP'}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-late">{leave.leaveType}</span>
                      </td>
                      <td>
                        {leave.fromDate} to {leave.toDate}
                      </td>
                      <td>"{leave.reason}"</td>
                      <td>
                        <span className="badge badge-pending">PENDING APPROVAL</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleOpenApprove(leave)}
                            className="btn btn-success btn-sm"
                          >
                            Suggest Substitute & Approve
                          </button>
                          <button
                            onClick={() => handleOpenReject(leave)}
                            className="btn btn-ghost btn-sm"
                            style={{ color: '#ef4444' }}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#10b981' }}>
                      ✓ No pending staff leave applications at this time.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Teacher My Leaves Tab */}
      {activeTab === 'myLeaves' && (
        <div>
          {/* Statutory Leave Balances Overview (FR6 & Appendix H) */}
          {leaveBalance && (
            <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
              <div className="card" style={{ borderLeft: '4px solid #2563eb' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>
                  Casual Leave (CL) — Statutory Cap 12 Days
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0' }}>
                  {leaveBalance.casualLeave?.balance ?? 12}{' '}
                  <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748b' }}>days remaining</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Allowed: {leaveBalance.casualLeave?.allowed ?? 12} · Consumed: {leaveBalance.casualLeave?.consumed ?? 0}
                </div>
              </div>

              <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>
                  Sick Leave (SL)
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0' }}>
                  {leaveBalance.sickLeave?.balance ?? 10}{' '}
                  <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748b' }}>days remaining</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Allowed: {leaveBalance.sickLeave?.allowed ?? 10} · Consumed: {leaveBalance.sickLeave?.consumed ?? 0}
                </div>
              </div>

              <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>
                  Privilege Leave (PL)
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0' }}>
                  {leaveBalance.privilegeLeave?.balance ?? 15}{' '}
                  <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748b' }}>days remaining</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Allowed: {leaveBalance.privilegeLeave?.allowed ?? 15} · Consumed: {leaveBalance.privilegeLeave?.consumed ?? 0}
                </div>
              </div>
            </div>
          )}

          <div className="card" style={{ padding: '1.25rem' }}>
            <div className="card-header">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                {user?.role === 'STUDENT' ? 'Student Leave Applications & History' : 'My Leave History & Substitute Allocation'}
              </h3>
            </div>

            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Reason</th>
                    <th>{user?.role === 'STUDENT' ? 'Approved By' : 'Assigned Substitute'}</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {myLeaves.length > 0 ? (
                    myLeaves.map((leave) => (
                      <tr key={leave.id}>
                        <td><strong>{leave.leaveType === 'CL' ? 'Leave' : leave.leaveType}</strong></td>
                        <td>{leave.fromDate}</td>
                        <td>{leave.toDate}</td>
                        <td>"{leave.reason}"</td>
                        <td>
                          {user?.role === 'STUDENT' ? (
                            <span style={{ color: '#065f46', fontWeight: 600 }}>
                              {leave.approvedBy ? (leave.approvedBy.name || 'Principal') : 'Pending Review'}
                            </span>
                          ) : leave.substituteTeacher ? (
                            <span style={{ color: '#065f46', fontWeight: 600 }}>
                              👨‍🏫 {leave.substituteTeacher.name}
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>None</span>
                          )}
                        </td>
                        <td>
                          <div>
                            <span
                              className={`badge ${
                                leave.status === 'APPROVED'
                                  ? 'badge-approved'
                                  : leave.status === 'REJECTED'
                                  ? 'badge-rejected'
                                  : 'badge-pending'
                              }`}
                            >
                              {leave.status}
                            </span>
                            {leave.status === 'REJECTED' && leave.rejectionReason && (
                              <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem', maxWidth: 200 }}>
                                <em>Reason: {leave.rejectionReason}</em>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                        No leave applications submitted yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Apply for Staff Leave</h3>
              <button onClick={() => setShowApplyModal(false)} className="btn btn-ghost btn-sm">×</button>
            </div>

            <form onSubmit={handleApplyLeave}>
              <div className="modal-body">
                {applyError && (
                  <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
                    <IconAlertTriangle size={18} />
                    <span>{applyError}</span>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Leave Type (FR6)</label>
                  <select
                    className="form-control"
                    value={leaveForm.leaveType}
                    onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                  >
                    <option value="CL">Casual Leave (CL)</option>
                    <option value="SL">Sick Leave (SL)</option>
                    <option value="PL">Privilege Leave (PL)</option>
                    <option value="COMP_OFF">Compensatory Off (COMP_OFF)</option>
                    <option value="ON_DUTY">On Duty (ON_DUTY)</option>
                  </select>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">From Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={leaveForm.fromDate}
                      onChange={(e) => setLeaveForm({ ...leaveForm, fromDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">To Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={leaveForm.toDate}
                      onChange={(e) => setLeaveForm({ ...leaveForm, toDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Reason for Absence</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Provide specific reason..."
                    value={leaveForm.reason}
                    onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowApplyModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={applyLoading}>
                  {applyLoading ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approve & Substitute Suggestion Engine Modal (FR6) */}
      {showApproveModal && selectedLeave && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                Assign Substitute & Approve Leave
              </h3>
              <button onClick={() => setShowApproveModal(false)} className="btn btn-ghost btn-sm">×</button>
            </div>

            <form onSubmit={handleConfirmApproval}>
              <div className="modal-body">
                {approveError && (
                  <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
                    <IconAlertTriangle size={18} />
                    <span>{approveError}</span>
                  </div>
                )}

                <div className="alert alert-info" style={{ fontSize: '0.825rem', marginBottom: '1.25rem' }}>
                  <strong>Automated Substitution Engine (FR6):</strong> The algorithm checked timetable schedules
                  and found teachers who are 100% free across all periods taught by{' '}
                  <strong>{selectedLeave.teacher?.name}</strong>.
                </div>

                <div className="form-group">
                  <label className="form-label">Suggested Conflict-Free Substitutes</label>
                  {subLoading ? (
                    <div style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>
                      Querying teacher schedules...
                    </div>
                  ) : suggestedSubstitutes.length > 0 ? (
                    <select
                      className="form-control"
                      value={selectedSubId}
                      onChange={(e) => setSelectedSubId(e.target.value)}
                      required
                    >
                      {suggestedSubstitutes.map((t) => (
                        <option key={t.id} value={t.id}>
                          ✓ {t.name} ({t.employeeId || 'Staff'}) — Free for all periods
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="alert alert-warning" style={{ fontSize: '0.85rem' }}>
                      No teacher is currently free at all of the absent teacher's periods. Please arrange manual relief.
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowApproveModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={subLoading || suggestedSubstitutes.length === 0}
                >
                  Confirm Substitute & Approve Leave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Leave Modal with Documented Reason */}
      {showRejectModal && rejectingLeave && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ef4444' }}>
                Reject Leave Application
              </h3>
              <button onClick={() => setShowRejectModal(false)} className="btn btn-ghost btn-sm">×</button>
            </div>

            <form onSubmit={handleConfirmReject}>
              <div className="modal-body">
                {rejectError && (
                  <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
                    <IconAlertTriangle size={18} />
                    <span>{rejectError}</span>
                  </div>
                )}

                <p style={{ fontSize: '0.9rem', color: '#334155', marginBottom: '1rem' }}>
                  Rejecting leave for <strong>{rejectingLeave.teacher?.name}</strong> ({rejectingLeave.leaveType}, {rejectingLeave.fromDate} to {rejectingLeave.toDate}).
                </p>

                <div className="form-group">
                  <label className="form-label">Mandatory Rejection Reason (Policy Requirement)</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Provide specific justification (e.g., examination duty scheduled, insufficient relief coverage)..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowRejectModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={rejectLoading || !rejectionReason.trim()}
                >
                  {rejectLoading ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
