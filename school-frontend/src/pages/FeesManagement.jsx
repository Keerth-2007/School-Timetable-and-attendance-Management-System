import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { feesApi, usersApi, parentApi } from '../services/api';
import {
  IconCalendar,
  IconCheckCircle,
  IconXCircle,
  IconAlertTriangle,
  IconClock,
  IconUser,
  IconUsers,
  IconFileText,
  IconRefreshCw,
  IconDownload,
  IconPlus,
  IconEye,
  IconCreditCard,
  IconPrinter,
  IconSearch,
} from '../components/Icons';

export default function FeesManagement() {
  const { user } = useAuth();
  const role = user?.role;
  const isAdmin = role === 'ADMIN';
  const isPrincipal = role === 'PRINCIPAL';
  const isElevated = isAdmin || isPrincipal;
  const isTeacher = role === 'TEACHER' || role === 'CLASS_TEACHER';
  const isStudent = role === 'STUDENT';
  const isParent = role === 'PARENT';

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [academicYear, setAcademicYear] = useState('2026-2027');

  // Admin / Principal State
  const [summary, setSummary] = useState(null);
  const [activeTab, setActiveTab] = useState(isElevated ? 'overview' : 'fees');
  const [structures, setStructures] = useState([]);
  const [studentFees, setStudentFees] = useState([]);
  const [pendingFees, setPendingFees] = useState([]);
  const [payments, setPayments] = useState([]);
  const [studentsList, setStudentsList] = useState([]);

  // Teacher State
  const [teacherClass, setTeacherClass] = useState(user?.classSection || '8A');
  const [teacherClassFees, setTeacherClassFees] = useState([]);

  // Student State
  const [myFees, setMyFees] = useState([]);
  const [myPayments, setMyPayments] = useState([]);

  // Parent State
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [childFees, setChildFees] = useState([]);
  const [childPayments, setChildPayments] = useState([]);

  // Filters
  const [filterClass, setFilterClass] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showStructureModal, setShowStructureModal] = useState(false);
  const [editingStructure, setEditingStructure] = useState(null);
  const [structureForm, setStructureForm] = useState({
    feeName: '',
    feeType: 'TUITION',
    academicYear: '2026-2027',
    classSection: '8A',
    amount: '',
    dueDate: '',
    term: 'Annual',
    description: '',
  });

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignMode, setAssignMode] = useState('STUDENT'); // 'STUDENT' or 'CLASS'
  const [assignForm, setAssignForm] = useState({
    studentId: '',
    classSection: '8A',
    feeStructureId: '',
    feeName: '',
    feeType: 'TUITION',
    academicYear: '2026-2027',
    amount: '',
    discount: '0',
    discountReason: '',
    dueDate: '',
  });

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    studentId: '',
    studentFeeId: '',
    amountPaid: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'UPI',
    referenceNumber: '',
    remarks: '',
  });

  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Load Initial Data
  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      if (isElevated) {
        const [sumRes, structRes, feesRes, pendRes, payRes, usersRes] = await Promise.allSettled([
          feesApi.getSummary(academicYear),
          feesApi.getStructures({ academicYear }),
          feesApi.getAllFees({ academicYear }),
          feesApi.getPendingFees({ academicYear }),
          feesApi.getPayments({}),
          usersApi.getAll(),
        ]);

        if (sumRes.status === 'fulfilled') setSummary(sumRes.value.data);
        if (structRes.status === 'fulfilled') setStructures(structRes.value.data);
        if (feesRes.status === 'fulfilled') setStudentFees(feesRes.value.data);
        if (pendRes.status === 'fulfilled') setPendingFees(pendRes.value.data);
        if (payRes.status === 'fulfilled') setPayments(payRes.value.data);
        if (usersRes.status === 'fulfilled') {
          const stList = usersRes.value.data.filter((u) => u.role === 'STUDENT');
          setStudentsList(stList);
        }
      } else if (isStudent) {
        const [myFeeRes, myPayRes] = await Promise.all([
          feesApi.getMyFees(),
          feesApi.getMyPayments(),
        ]);
        setMyFees(myFeeRes.data || []);
        setMyPayments(myPayRes.data || []);
      } else if (isParent) {
        const parentId = user?.id || user?.userId;
        if (parentId) {
          const chRes = await parentApi.getChildren(parentId);
          setChildren(chRes.data || []);
          if (chRes.data && chRes.data.length > 0) {
            const firstChild = chRes.data.find(c => c.name?.toLowerCase().includes('keerthana')) || chRes.data[0];
            setSelectedChild(firstChild);
            await loadChildFees(firstChild.id);
          }
        }
      } else if (isTeacher) {
        const targetClass = teacherClass || user?.classSection || '8A';
        const res = await feesApi.getTeacherClassFees(targetClass);
        setTeacherClassFees(res.data || []);
      }
    } catch (err) {
      console.error('Error loading fees data:', err);
      setError(err.message || 'Failed to load fee information from the database.');
    } finally {
      setLoading(false);
    }
  };

  const loadChildFees = async (childId) => {
    try {
      const [feeRes, payRes] = await Promise.all([
        feesApi.getStudentFees(childId),
        feesApi.getStudentPayments(childId),
      ]);
      setChildFees(feeRes.data || []);
      setChildPayments(payRes.data || []);
    } catch (err) {
      console.error('Failed to load child fees:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, academicYear]);

  // Trigger Notification Toast
  const notifySuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Helper Formatter
  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Status Badge Component
  const renderStatusBadge = (status) => {
    const map = {
      PAID: { bg: '#dcfce7', text: '#15803d', label: 'PAID' },
      PARTIALLY_PAID: { bg: '#fef3c7', text: '#b45309', label: 'PARTIALLY PAID' },
      PENDING: { bg: '#e0f2fe', text: '#0369a1', label: 'PENDING' },
      OVERDUE: { bg: '#fee2e2', text: '#b91c1c', label: 'OVERDUE' },
    };
    const s = map[status] || { bg: '#f1f5f9', text: '#475569', label: status || 'UNKNOWN' };
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          padding: '0.25rem 0.65rem',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: '0.03em',
          backgroundColor: s.bg,
          color: s.text,
          border: `1px solid ${s.text}22`,
        }}
      >
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: s.text,
          }}
        />
        {s.label}
      </span>
    );
  };

  // -------------------------------------------------------------
  // HANDLERS: Create / Edit Fee Structure
  // -------------------------------------------------------------
  const handleOpenStructureModal = (structure = null) => {
    if (structure) {
      setEditingStructure(structure);
      setStructureForm({
        feeName: structure.feeName,
        feeType: structure.feeType,
        academicYear: structure.academicYear,
        classSection: structure.classSection || '8A',
        amount: structure.amount,
        dueDate: structure.dueDate || '',
        term: structure.term || 'Annual',
        description: structure.description || '',
      });
    } else {
      setEditingStructure(null);
      setStructureForm({
        feeName: '',
        feeType: 'TUITION',
        academicYear: academicYear,
        classSection: '8A',
        amount: '',
        dueDate: '',
        term: 'Annual',
        description: '',
      });
    }
    setShowStructureModal(true);
  };

  const handleSaveStructure = async (e) => {
    e.preventDefault();
    try {
      if (!structureForm.feeName.trim()) {
        alert('Please enter a fee name');
        return;
      }
      if (!structureForm.amount || Number(structureForm.amount) <= 0) {
        alert('Please enter a valid amount');
        return;
      }
      if (editingStructure) {
        await feesApi.updateStructure(editingStructure.id, structureForm);
        notifySuccess('Fee structure updated successfully.');
      } else {
        await feesApi.createStructure(structureForm);
        notifySuccess('Fee structure created successfully and synced to Academic Calendar.');
      }
      setShowStructureModal(false);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to save fee structure');
    }
  };

  const handleDeleteStructure = async (id) => {
    if (!window.confirm('Are you sure you want to delete or deactivate this fee structure?')) return;
    try {
      const res = await feesApi.deleteStructure(id);
      notifySuccess(res.data?.message || 'Fee structure removed successfully.');
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to delete fee structure');
    }
  };

  // -------------------------------------------------------------
  // HANDLERS: Assign Fees
  // -------------------------------------------------------------
  const handleOpenAssignModal = () => {
    setAssignForm({
      studentId: studentsList.length > 0 ? studentsList[0].id : '',
      classSection: '8A',
      feeStructureId: '',
      feeName: '',
      feeType: 'TUITION',
      academicYear: academicYear,
      amount: '',
      discount: '0',
      discountReason: '',
      dueDate: '',
    });
    setAssignMode('STUDENT');
    setShowAssignModal(true);
  };

  const handleStructureSelectionInAssign = (structId) => {
    const s = structures.find((item) => String(item.id) === String(structId));
    if (s) {
      setAssignForm((prev) => ({
        ...prev,
        feeStructureId: s.id,
        feeName: s.feeName,
        feeType: s.feeType,
        academicYear: s.academicYear,
        amount: s.amount,
        dueDate: s.dueDate || '',
        classSection: s.classSection || prev.classSection,
      }));
    }
  };

  const handleSaveFeeAssignment = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        academicYear: assignForm.academicYear,
        feeType: assignForm.feeType,
        feeName: assignForm.feeName,
        amount: Number(assignForm.amount),
        discount: Number(assignForm.discount || 0),
        discountReason: assignForm.discountReason,
        dueDate: assignForm.dueDate || null,
        feeStructureId: assignForm.feeStructureId ? Number(assignForm.feeStructureId) : null,
      };

      if (assignMode === 'STUDENT') {
        if (!assignForm.studentId) {
          alert('Please select a student');
          return;
        }
        payload.studentId = Number(assignForm.studentId);
      } else {
        if (!assignForm.classSection) {
          alert('Please specify a class section');
          return;
        }
        payload.classSection = assignForm.classSection;
      }

      await feesApi.assignFee(payload);
      notifySuccess(
        assignMode === 'STUDENT'
          ? 'Fee successfully assigned to student with instant in-app notification sent.'
          : `Fee successfully assigned to all students in Class ${assignForm.classSection} and calendar deadline updated.`
      );
      setShowAssignModal(false);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to assign fee');
    }
  };

  // -------------------------------------------------------------
  // HANDLERS: Record Payment
  // -------------------------------------------------------------
  const handleOpenPaymentModal = (preselectedStudentFee = null) => {
    if (preselectedStudentFee) {
      setPaymentForm({
        studentId: preselectedStudentFee.studentId,
        studentFeeId: preselectedStudentFee.id,
        amountPaid: preselectedStudentFee.pendingAmount,
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'UPI',
        referenceNumber: 'UPI-' + Date.now().toString().slice(-6),
        remarks: 'Payment via Fee Portal',
      });
    } else {
      const defaultFee = pendingFees.length > 0 ? pendingFees[0] : null;
      setPaymentForm({
        studentId: defaultFee ? defaultFee.studentId : '',
        studentFeeId: defaultFee ? defaultFee.id : '',
        amountPaid: defaultFee ? defaultFee.pendingAmount : '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'UPI',
        referenceNumber: 'UPI-' + Date.now().toString().slice(-6),
        remarks: 'Standard Payment',
      });
    }
    setShowPaymentModal(true);
  };

  const handleStudentFeeChangeInPayment = (sfId) => {
    const allFeesCombined = [...studentFees, ...pendingFees];
    const target = allFeesCombined.find((f) => String(f.id) === String(sfId));
    if (target) {
      setPaymentForm((prev) => ({
        ...prev,
        studentFeeId: target.id,
        studentId: target.studentId,
        amountPaid: target.pendingAmount,
      }));
    }
  };

  const handleSavePayment = async (e) => {
    e.preventDefault();
    try {
      if (!paymentForm.studentFeeId) {
        alert('Please select a student fee record');
        return;
      }
      if (!paymentForm.amountPaid || Number(paymentForm.amountPaid) <= 0) {
        alert('Please enter a valid amount paid greater than 0');
        return;
      }

      const payload = {
        studentFeeId: Number(paymentForm.studentFeeId),
        studentId: Number(paymentForm.studentId),
        amountPaid: Number(paymentForm.amountPaid),
        paymentDate: paymentForm.paymentDate,
        paymentMethod: paymentForm.paymentMethod,
        referenceNumber: paymentForm.referenceNumber,
        remarks: paymentForm.remarks,
      };

      const res = await feesApi.recordPayment(payload);
      setShowPaymentModal(false);
      notifySuccess(`Payment recorded! Generated Receipt #${res.data.receiptNumber}`);
      loadData();

      // Show the receipt modal immediately
      setSelectedReceipt(res.data);
      setShowReceiptModal(true);
    } catch (err) {
      alert(err.message || 'Failed to record payment');
    }
  };

  // -------------------------------------------------------------
  // HANDLER: View Receipt
  // -------------------------------------------------------------
  const handleViewReceipt = async (receiptNumber, paymentId) => {
    try {
      let res;
      if (receiptNumber) {
        res = await feesApi.getReceiptByNumber(receiptNumber);
      } else if (paymentId) {
        res = await feesApi.getReceiptByPaymentId(paymentId);
      }
      if (res && res.data) {
        setSelectedReceipt(res.data);
        setShowReceiptModal(true);
      }
    } catch (err) {
      alert(err.message || 'Could not load receipt details');
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  // Filtered Student Fees List (Admin)
  const filteredStudentFees = studentFees.filter((f) => {
    if (filterClass !== 'ALL' && f.classSection !== filterClass) return false;
    if (filterType !== 'ALL' && f.feeType !== filterType) return false;
    if (filterStatus !== 'ALL' && f.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = f.studentName?.toLowerCase().includes(q);
      const matchAdm = f.admissionNumber?.toLowerCase().includes(q);
      const matchFee = f.feeName?.toLowerCase().includes(q);
      if (!matchName && !matchAdm && !matchFee) return false;
    }
    return true;
  });

  return (
    <div className="container" style={{ paddingBottom: '3.5rem' }}>
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              💰 Fees Management
            </h1>
            <span className={`role-chip ${role}`}>{role?.replace('_', ' ')}</span>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.925rem', margin: 0 }}>
            {isElevated
              ? 'Institutional fee structure, billing, collections, receipts, and statutory compliance'
              : isStudent
              ? `Student Portal: ${user?.name} · Admission: ${user?.admissionNumber || 'ADM2026031'} · Class: ${user?.classSection || '8A'}`
              : isParent
              ? `Parent Portal: Fee statements & receipts for linked wards`
              : `Class ${teacherClass} Student Fee Status Roster (Read-Only)`}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {isElevated && (
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="form-select"
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.875rem', fontWeight: 600 }}
            >
              <option value="2026-2027">Academic Year: 2026–2027</option>
              <option value="2025-2026">Academic Year: 2025–2026</option>
            </select>
          )}
          <button onClick={loadData} className="btn btn-secondary btn-sm" disabled={loading}>
            <IconRefreshCw size={15} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
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

      {/* ============================================================== */}
      {/* 1. ADMIN & PRINCIPAL VIEW */}
      {/* ============================================================== */}
      {isElevated && (
        <>
          {/* Summary KPI Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem',
            }}
          >
            <div className="card" style={{ borderLeft: '4px solid #2563eb', padding: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Total Fees
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0.35rem 0' }}>
                {loading ? '...' : formatCurrency(summary?.totalFees)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Assigned institution-wide</div>
            </div>

            <div className="card" style={{ borderLeft: '4px solid #10b981', padding: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#15803d', textTransform: 'uppercase' }}>
                Total Collected
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0.35rem 0' }}>
                {loading ? '...' : formatCurrency(summary?.totalCollected)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
                {summary?.paidStudentsCount || 0} students fully settled
              </div>
            </div>

            <div className="card" style={{ borderLeft: '4px solid #f59e0b', padding: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#b45309', textTransform: 'uppercase' }}>
                Total Pending
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0.35rem 0' }}>
                {loading ? '...' : formatCurrency(summary?.totalPending)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 600 }}>
                {summary?.pendingStudentsCount || 0} students with balance
              </div>
            </div>

            <div className="card" style={{ borderLeft: '4px solid #ef4444', padding: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#b91c1c', textTransform: 'uppercase' }}>
                Total Overdue
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0.35rem 0' }}>
                {loading ? '...' : formatCurrency(summary?.totalOverdue)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>Past due date</div>
            </div>

            <div className="card" style={{ borderLeft: '4px solid #8b5cf6', padding: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase' }}>
                Paid Students
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0.35rem 0' }}>
                {loading ? '...' : summary?.paidStudentsCount ?? 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Out of {summary?.totalStudentsWithFees ?? 0} students</div>
            </div>

            <div className="card" style={{ borderLeft: '4px solid #ec4899', padding: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#db2777', textTransform: 'uppercase' }}>
                Pending Students
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0.35rem 0' }}>
                {loading ? '...' : summary?.pendingStudentsCount ?? 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Requiring follow-up</div>
            </div>
          </div>

          {/* Action Toolbar */}
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
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.4rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.2rem' }}>
              {[
                { id: 'overview', label: '📊 Dashboard', count: null },
                { id: 'structures', label: '📋 Fee Structures', count: structures.length },
                { id: 'studentFees', label: '🎓 Student Fees', count: studentFees.length },
                { id: 'pending', label: '⏳ Pending & Overdue', count: pendingFees.length },
                { id: 'payments', label: '📜 Payment History', count: payments.length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '0.55rem 1rem',
                    border: 'none',
                    background: activeTab === tab.id ? '#2563eb' : 'transparent',
                    color: activeTab === tab.id ? '#ffffff' : '#64748b',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span>{tab.label}</span>
                  {tab.count !== null && (
                    <span
                      style={{
                        padding: '0.1rem 0.45rem',
                        fontSize: '0.7rem',
                        borderRadius: '9999px',
                        background: activeTab === tab.id ? '#ffffff33' : '#e2e8f0',
                        color: activeTab === tab.id ? '#ffffff' : '#334155',
                      }}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Quick Actions (Admin Only) */}
            {isAdmin && (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button onClick={() => handleOpenStructureModal()} className="btn btn-secondary btn-sm">
                  <IconPlus size={15} />
                  <span>New Fee Structure</span>
                </button>
                <button onClick={handleOpenAssignModal} className="btn btn-secondary btn-sm">
                  <IconPlus size={15} />
                  <span>Assign Fees</span>
                </button>
                <button onClick={() => handleOpenPaymentModal()} className="btn btn-primary btn-sm">
                  <IconCreditCard size={15} />
                  <span>Record Payment</span>
                </button>
              </div>
            )}
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    ⚡ Recent Payments & Receipts
                  </h3>
                  <button onClick={() => setActiveTab('payments')} className="btn btn-ghost btn-sm" style={{ fontSize: '0.8rem' }}>
                    View All
                  </button>
                </div>

                {summary?.recentPayments?.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    No payments recorded yet for this session.
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table" style={{ fontSize: '0.85rem' }}>
                      <thead>
                        <tr>
                          <th>Receipt #</th>
                          <th>Student</th>
                          <th>Amount</th>
                          <th>Method</th>
                          <th>Date</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary?.recentPayments?.map((p) => (
                          <tr key={p.id}>
                            <td style={{ fontWeight: 700, color: '#2563eb' }}>{p.receiptNumber}</td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{p.studentName}</div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Class {p.classSection}</div>
                            </td>
                            <td style={{ fontWeight: 700, color: '#16a34a' }}>{formatCurrency(p.amountPaid)}</td>
                            <td><span className="badge">{p.paymentMethod}</span></td>
                            <td>{p.paymentDate}</td>
                            <td>
                              <button
                                onClick={() => handleViewReceipt(p.receiptNumber, p.id)}
                                className="btn btn-ghost btn-sm"
                                title="View Receipt"
                              >
                                <IconEye size={15} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    ⚠️ Overdue & Urgent Balances
                  </h3>
                  <button onClick={() => setActiveTab('pending')} className="btn btn-ghost btn-sm" style={{ fontSize: '0.8rem' }}>
                    View All
                  </button>
                </div>

                {pendingFees.filter((f) => f.status === 'OVERDUE').length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#10b981' }}>
                    <IconCheckCircle size={28} />
                    <div style={{ marginTop: '0.5rem', fontWeight: 600 }}>Great news! No overdue fees currently.</div>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table" style={{ fontSize: '0.85rem' }}>
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Fee Type</th>
                          <th>Due Date</th>
                          <th>Pending</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingFees
                          .filter((f) => f.status === 'OVERDUE')
                          .slice(0, 5)
                          .map((f) => (
                            <tr key={f.id} style={{ background: '#fef2f2' }}>
                              <td>
                                <div style={{ fontWeight: 700, color: '#991b1b' }}>{f.studentName}</div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Class {f.classSection}</div>
                              </td>
                              <td>{f.feeName}</td>
                              <td style={{ color: '#dc2626', fontWeight: 600 }}>{f.dueDate}</td>
                              <td style={{ fontWeight: 800, color: '#dc2626' }}>{formatCurrency(f.pendingAmount)}</td>
                              <td>
                                <button
                                  onClick={() => handleOpenPaymentModal(f)}
                                  className="btn btn-primary btn-sm"
                                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                                >
                                  Collect
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: FEE STRUCTURES */}
          {activeTab === 'structures' && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Fee Structures ({academicYear})</h3>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                    Standard fee schedules per class, term, and category
                  </p>
                </div>
                {isAdmin && (
                  <button onClick={() => handleOpenStructureModal()} className="btn btn-primary btn-sm">
                    <IconPlus size={15} />
                    <span>Create Fee Structure</span>
                  </button>
                )}
              </div>

              {structures.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                  No fee structures defined for {academicYear}. Click "Create Fee Structure" to add one.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Fee Name</th>
                        <th>Type</th>
                        <th>Class Section</th>
                        <th>Term</th>
                        <th>Amount</th>
                        <th>Due Date</th>
                        <th>Status</th>
                        {isAdmin && <th>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {structures.map((s) => (
                        <tr key={s.id}>
                          <td style={{ fontWeight: 700, color: '#0f172a' }}>{s.feeName}</td>
                          <td><span className="badge">{s.feeType}</span></td>
                          <td>{s.classSection || 'ALL'}</td>
                          <td>{s.term || 'Annual'}</td>
                          <td style={{ fontWeight: 800, color: '#2563eb' }}>{formatCurrency(s.amount)}</td>
                          <td>{s.dueDate || '—'}</td>
                          <td>
                            <span
                              style={{
                                padding: '0.2rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                background: s.active ? '#dcfce7' : '#fee2e2',
                                color: s.active ? '#15803d' : '#b91c1c',
                              }}
                            >
                              {s.active ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                          </td>
                          {isAdmin && (
                            <td>
                              <div style={{ display: 'flex', gap: '0.35rem' }}>
                                <button
                                  onClick={() => handleOpenStructureModal(s)}
                                  className="btn btn-ghost btn-sm"
                                  title="Edit Structure"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteStructure(s.id)}
                                  className="btn btn-ghost btn-sm"
                                  style={{ color: '#ef4444' }}
                                  title="Delete / Deactivate"
                                >
                                  Remove
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: STUDENT FEES */}
          {activeTab === 'studentFees' && (
            <div className="card">
              {/* Search & Filter Bar */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Search student, admission #, fee..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="form-control"
                      style={{ paddingLeft: '2rem', fontSize: '0.85rem', width: '240px' }}
                    />
                    <div style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                      <IconSearch size={14} />
                    </div>
                  </div>

                  <select
                    value={filterClass}
                    onChange={(e) => setFilterClass(e.target.value)}
                    className="form-select"
                    style={{ fontSize: '0.85rem', padding: '0.4rem 0.75rem' }}
                  >
                    <option value="ALL">All Classes</option>
                    <option value="8A">Class 8A</option>
                    <option value="7B">Class 7B</option>
                    <option value="9B">Class 9B</option>
                    <option value="12A">Class 12A</option>
                  </select>

                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="form-select"
                    style={{ fontSize: '0.85rem', padding: '0.4rem 0.75rem' }}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="PAID">PAID</option>
                    <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
                    <option value="PENDING">PENDING</option>
                    <option value="OVERDUE">OVERDUE</option>
                  </select>
                </div>

                {isAdmin && (
                  <button onClick={handleOpenAssignModal} className="btn btn-primary btn-sm">
                    <IconPlus size={15} />
                    <span>Assign Fee</span>
                  </button>
                )}
              </div>

              {filteredStudentFees.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                  No student fee records found matching the filter criteria.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Class</th>
                        <th>Fee Name</th>
                        <th>Base Amount</th>
                        <th>Discount</th>
                        <th>Final Fee</th>
                        <th>Paid</th>
                        <th>Pending</th>
                        <th>Due Date</th>
                        <th>Status</th>
                        {isAdmin && <th>Action</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudentFees.map((sf) => (
                        <tr key={sf.id}>
                          <td>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{sf.studentName}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{sf.admissionNumber || sf.studentEmail}</div>
                          </td>
                          <td style={{ fontWeight: 600 }}>{sf.classSection || '—'}</td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{sf.feeName}</div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{sf.feeType}</div>
                          </td>
                          <td>{formatCurrency(sf.amount)}</td>
                          <td style={{ color: sf.discount > 0 ? '#15803d' : '#94a3b8' }}>
                            {sf.discount > 0 ? `-${formatCurrency(sf.discount)}` : '—'}
                          </td>
                          <td style={{ fontWeight: 700 }}>{formatCurrency(sf.finalAmount)}</td>
                          <td style={{ fontWeight: 700, color: '#16a34a' }}>{formatCurrency(sf.paidAmount)}</td>
                          <td style={{ fontWeight: 700, color: sf.pendingAmount > 0 ? '#dc2626' : '#64748b' }}>
                            {formatCurrency(sf.pendingAmount)}
                          </td>
                          <td style={{ fontSize: '0.85rem' }}>{sf.dueDate || '—'}</td>
                          <td>{renderStatusBadge(sf.status)}</td>
                          {isAdmin && (
                            <td>
                              {sf.pendingAmount > 0 ? (
                                <button
                                  onClick={() => handleOpenPaymentModal(sf)}
                                  className="btn btn-primary btn-sm"
                                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                                >
                                  Collect
                                </button>
                              ) : (
                                <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>Settled</span>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PENDING & OVERDUE */}
          {activeTab === 'pending' && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Pending & Overdue Balances</h3>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                    Chronological schedule of outstanding student fee obligations
                  </p>
                </div>
              </div>

              {pendingFees.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#16a34a' }}>
                  <IconCheckCircle size={32} />
                  <div style={{ marginTop: '0.5rem', fontWeight: 600 }}>All assigned student fees are 100% paid!</div>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Class</th>
                        <th>Fee Name</th>
                        <th>Total Fee</th>
                        <th>Paid Amount</th>
                        <th>Pending Amount</th>
                        <th>Due Date</th>
                        <th>Status</th>
                        {isAdmin && <th>Action</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {pendingFees.map((f) => (
                        <tr key={f.id} style={{ background: f.status === 'OVERDUE' ? '#fff1f2' : 'inherit' }}>
                          <td>
                            <div style={{ fontWeight: 700, color: f.status === 'OVERDUE' ? '#991b1b' : '#0f172a' }}>
                              {f.studentName}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{f.admissionNumber || f.studentEmail}</div>
                          </td>
                          <td style={{ fontWeight: 600 }}>{f.classSection}</td>
                          <td>{f.feeName}</td>
                          <td>{formatCurrency(f.finalAmount)}</td>
                          <td style={{ fontWeight: 700, color: '#16a34a' }}>{formatCurrency(f.paidAmount)}</td>
                          <td style={{ fontWeight: 800, color: '#dc2626' }}>{formatCurrency(f.pendingAmount)}</td>
                          <td style={{ fontWeight: 600, color: f.status === 'OVERDUE' ? '#b91c1c' : '#0f172a' }}>
                            {f.dueDate || '—'}
                          </td>
                          <td>{renderStatusBadge(f.status)}</td>
                          {isAdmin && (
                            <td>
                              <button
                                onClick={() => handleOpenPaymentModal(f)}
                                className="btn btn-primary btn-sm"
                                style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                              >
                                Record Payment
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: PAYMENT HISTORY */}
          {activeTab === 'payments' && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Transaction & Receipt Ledger</h3>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                    Audited ledger of all received payments, payment instruments, and receipts
                  </p>
                </div>
              </div>

              {payments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                  No payment transactions recorded yet.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Receipt Number</th>
                        <th>Student</th>
                        <th>Fee Type</th>
                        <th>Amount Paid</th>
                        <th>Payment Date</th>
                        <th>Method</th>
                        <th>Reference / TXN</th>
                        <th>Recorded By</th>
                        <th>Receipt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p) => (
                        <tr key={p.id}>
                          <td style={{ fontWeight: 800, color: '#2563eb' }}>{p.receiptNumber}</td>
                          <td>
                            <div style={{ fontWeight: 700 }}>{p.studentName}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Class {p.classSection}</div>
                          </td>
                          <td>{p.feeName || p.feeType}</td>
                          <td style={{ fontWeight: 800, color: '#16a34a' }}>{formatCurrency(p.amountPaid)}</td>
                          <td>{p.paymentDate}</td>
                          <td><span className="badge">{p.paymentMethod}</span></td>
                          <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{p.referenceNumber || '—'}</td>
                          <td style={{ fontSize: '0.8rem' }}>{p.recordedByName || 'Admin'}</td>
                          <td>
                            <button
                              onClick={() => handleViewReceipt(p.receiptNumber, p.id)}
                              className="btn btn-secondary btn-sm"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                            >
                              <IconEye size={14} />
                              <span>View Receipt</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ============================================================== */}
      {/* 2. STUDENT VIEW */}
      {/* ============================================================== */}
      {isStudent && (
        <>
          {/* Student KPI Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem',
            }}
          >
            <div className="card" style={{ borderLeft: '4px solid #2563eb', padding: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Total Fees
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', margin: '0.35rem 0' }}>
                {formatCurrency(myFees.reduce((acc, f) => acc + (f.finalAmount || 0), 0))}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Current academic session</div>
            </div>

            <div className="card" style={{ borderLeft: '4px solid #10b981', padding: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#15803d', textTransform: 'uppercase' }}>
                Paid Amount
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', margin: '0.35rem 0' }}>
                {formatCurrency(myFees.reduce((acc, f) => acc + (f.paidAmount || 0), 0))}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>Total cleared</div>
            </div>

            <div className="card" style={{ borderLeft: '4px solid #f59e0b', padding: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#b45309', textTransform: 'uppercase' }}>
                Pending Balance
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', margin: '0.35rem 0' }}>
                {formatCurrency(myFees.reduce((acc, f) => acc + (f.pendingAmount || 0), 0))}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 600 }}>Payable at school office</div>
            </div>

            <div className="card" style={{ borderLeft: '4px solid #ef4444', padding: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#b91c1c', textTransform: 'uppercase' }}>
                Overdue Fees
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', margin: '0.35rem 0' }}>
                {formatCurrency(myFees.filter(f => f.status === 'OVERDUE').reduce((acc, f) => acc + (f.pendingAmount || 0), 0))}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>Attention required</div>
            </div>
          </div>

          {/* Assigned Fees Table */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>
              📋 My Fee Breakdown
            </h3>
            {myFees.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                No fees currently assigned to your account.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Fee Type</th>
                      <th>Fee Name</th>
                      <th>Total Amount</th>
                      <th>Concession</th>
                      <th>Paid Amount</th>
                      <th>Pending Amount</th>
                      <th>Due Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myFees.map((f) => (
                      <tr key={f.id}>
                        <td><span className="badge">{f.feeType}</span></td>
                        <td style={{ fontWeight: 700 }}>{f.feeName}</td>
                        <td style={{ fontWeight: 700 }}>{formatCurrency(f.amount)}</td>
                        <td style={{ color: f.discount > 0 ? '#15803d' : '#94a3b8' }}>
                          {f.discount > 0 ? `-${formatCurrency(f.discount)}` : '—'}
                        </td>
                        <td style={{ fontWeight: 700, color: '#16a34a' }}>{formatCurrency(f.paidAmount)}</td>
                        <td style={{ fontWeight: 800, color: f.pendingAmount > 0 ? '#dc2626' : '#64748b' }}>
                          {formatCurrency(f.pendingAmount)}
                        </td>
                        <td>{f.dueDate || '—'}</td>
                        <td>{renderStatusBadge(f.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Payment History Table */}
          <div className="card">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>
              🧾 My Payment History & Receipts
            </h3>
            {myPayments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                No payment transactions recorded yet.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Receipt Number</th>
                      <th>Date</th>
                      <th>Fee Item</th>
                      <th>Amount Paid</th>
                      <th>Payment Method</th>
                      <th>Reference #</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myPayments.map((p) => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 800, color: '#2563eb' }}>{p.receiptNumber}</td>
                        <td>{p.paymentDate}</td>
                        <td>{p.feeName || p.feeType}</td>
                        <td style={{ fontWeight: 800, color: '#16a34a' }}>{formatCurrency(p.amountPaid)}</td>
                        <td><span className="badge">{p.paymentMethod}</span></td>
                        <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{p.referenceNumber || '—'}</td>
                        <td>
                          <button
                            onClick={() => handleViewReceipt(p.receiptNumber, p.id)}
                            className="btn btn-secondary btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                          >
                            <IconEye size={14} />
                            <span>View Receipt</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ============================================================== */}
      {/* 3. PARENT VIEW */}
      {/* ============================================================== */}
      {isParent && (
        <>
          {/* Child Selector */}
          {children.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, color: '#475569', fontSize: '0.9rem' }}>Select Child:</span>
              {children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => {
                    setSelectedChild(child);
                    loadChildFees(child.id);
                  }}
                  style={{
                    padding: '0.45rem 0.95rem',
                    borderRadius: '9999px',
                    border: '1px solid #cbd5e1',
                    background: selectedChild?.id === child.id ? '#2563eb' : '#ffffff',
                    color: selectedChild?.id === child.id ? '#ffffff' : '#334155',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <IconUser size={14} />
                  <span>{child.name}</span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.85 }}>({child.classSection})</span>
                </button>
              ))}
            </div>
          )}

          {/* Child KPI Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem',
            }}
          >
            <div className="card" style={{ borderLeft: '4px solid #2563eb', padding: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Total Fees ({selectedChild?.name})
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', margin: '0.35rem 0' }}>
                {formatCurrency(childFees.reduce((acc, f) => acc + (f.finalAmount || 0), 0))}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Class {selectedChild?.classSection}</div>
            </div>

            <div className="card" style={{ borderLeft: '4px solid #10b981', padding: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#15803d', textTransform: 'uppercase' }}>
                Paid Amount
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', margin: '0.35rem 0' }}>
                {formatCurrency(childFees.reduce((acc, f) => acc + (f.paidAmount || 0), 0))}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>Cleared to date</div>
            </div>

            <div className="card" style={{ borderLeft: '4px solid #f59e0b', padding: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#b45309', textTransform: 'uppercase' }}>
                Pending Balance
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', margin: '0.35rem 0' }}>
                {formatCurrency(childFees.reduce((acc, f) => acc + (f.pendingAmount || 0), 0))}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 600 }}>Due for payment</div>
            </div>

            <div className="card" style={{ borderLeft: '4px solid #ef4444', padding: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#b91c1c', textTransform: 'uppercase' }}>
                Overdue Balance
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', margin: '0.35rem 0' }}>
                {formatCurrency(childFees.filter(f => f.status === 'OVERDUE').reduce((acc, f) => acc + (f.pendingAmount || 0), 0))}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>Immediate clearance</div>
            </div>
          </div>

          {/* Child Fees Breakdown */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>
              📋 {selectedChild?.name}'s Fee Breakdown
            </h3>
            {childFees.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                No fees currently assigned for this child.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Fee Type</th>
                      <th>Fee Name</th>
                      <th>Total Fee</th>
                      <th>Concession</th>
                      <th>Paid Amount</th>
                      <th>Pending Amount</th>
                      <th>Due Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {childFees.map((f) => (
                      <tr key={f.id}>
                        <td><span className="badge">{f.feeType}</span></td>
                        <td style={{ fontWeight: 700 }}>{f.feeName}</td>
                        <td style={{ fontWeight: 700 }}>{formatCurrency(f.amount)}</td>
                        <td style={{ color: f.discount > 0 ? '#15803d' : '#94a3b8' }}>
                          {f.discount > 0 ? `-${formatCurrency(f.discount)}` : '—'}
                        </td>
                        <td style={{ fontWeight: 700, color: '#16a34a' }}>{formatCurrency(f.paidAmount)}</td>
                        <td style={{ fontWeight: 800, color: f.pendingAmount > 0 ? '#dc2626' : '#64748b' }}>
                          {formatCurrency(f.pendingAmount)}
                        </td>
                        <td>{f.dueDate || '—'}</td>
                        <td>{renderStatusBadge(f.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Child Payment History */}
          <div className="card">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>
              🧾 Official Receipts & Payment History
            </h3>
            {childPayments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                No payments recorded yet for {selectedChild?.name}.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Receipt Number</th>
                      <th>Date</th>
                      <th>Fee Item</th>
                      <th>Amount Paid</th>
                      <th>Payment Method</th>
                      <th>Reference #</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {childPayments.map((p) => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 800, color: '#2563eb' }}>{p.receiptNumber}</td>
                        <td>{p.paymentDate}</td>
                        <td>{p.feeName || p.feeType}</td>
                        <td style={{ fontWeight: 800, color: '#16a34a' }}>{formatCurrency(p.amountPaid)}</td>
                        <td><span className="badge">{p.paymentMethod}</span></td>
                        <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{p.referenceNumber || '—'}</td>
                        <td>
                          <button
                            onClick={() => handleViewReceipt(p.receiptNumber, p.id)}
                            className="btn btn-secondary btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                          >
                            <IconEye size={14} />
                            <span>View Receipt</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ============================================================== */}
      {/* 4. TEACHER VIEW */}
      {/* ============================================================== */}
      {isTeacher && (
        <div className="card">
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
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
                Class {teacherClass} Student Fee Status Roster
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                High-level fee clearance status for class tracking (financial transaction details withheld)
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Class:</label>
              <select
                value={teacherClass}
                onChange={(e) => {
                  setTeacherClass(e.target.value);
                  feesApi.getTeacherClassFees(e.target.value).then((res) => setTeacherClassFees(res.data || []));
                }}
                className="form-select"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
              >
                <option value="8A">8A</option>
                <option value="7B">7B</option>
                <option value="9B">9B</option>
                <option value="12A">12A</option>
              </select>
            </div>
          </div>

          {teacherClassFees.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
              No student fee records found for Class {teacherClass}.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Admission No</th>
                    <th>Fee Name</th>
                    <th>Fee Type</th>
                    <th>Total Fee</th>
                    <th>Paid Amount</th>
                    <th>Pending Balance</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {teacherClassFees.map((f) => (
                    <tr key={f.id}>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>{f.studentName}</td>
                      <td style={{ fontSize: '0.85rem', color: '#64748b' }}>{f.admissionNumber || '—'}</td>
                      <td>{f.feeName}</td>
                      <td><span className="badge">{f.feeType}</span></td>
                      <td>{formatCurrency(f.finalAmount)}</td>
                      <td style={{ color: '#16a34a', fontWeight: 600 }}>{formatCurrency(f.paidAmount)}</td>
                      <td style={{ color: f.pendingAmount > 0 ? '#dc2626' : '#64748b', fontWeight: 700 }}>
                        {formatCurrency(f.pendingAmount)}
                      </td>
                      <td>{renderStatusBadge(f.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: CREATE / EDIT FEE STRUCTURE (ADMIN) */}
      {/* ============================================================== */}
      {showStructureModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '580px', width: '90%' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontWeight: 700 }}>
                {editingStructure ? 'Edit Fee Structure' : 'Create New Fee Structure'}
              </h3>
              <button onClick={() => setShowStructureModal(false)} className="btn-close">&times;</button>
            </div>

            <form onSubmit={handleSaveStructure}>
              <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Fee Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Annual Tuition Fee, Term 1 Exam Fee"
                    value={structureForm.feeName}
                    onChange={(e) => setStructureForm({ ...structureForm, feeName: e.target.value })}
                    className="form-control"
                  />
                </div>

                <div>
                  <label className="form-label">Fee Category / Type *</label>
                  <select
                    value={structureForm.feeType}
                    onChange={(e) => setStructureForm({ ...structureForm, feeType: e.target.value })}
                    className="form-select"
                  >
                    <option value="TUITION">Tuition Fee</option>
                    <option value="ADMISSION">Admission Fee</option>
                    <option value="EXAMINATION">Examination Fee</option>
                    <option value="TRANSPORT">Transport Fee</option>
                    <option value="LIBRARY">Library Fee</option>
                    <option value="LABORATORY">Laboratory Fee</option>
                    <option value="ACTIVITY">Activity Fee</option>
                    <option value="SPORTS">Sports Fee</option>
                    <option value="OTHER">Other Applicable Fee</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Class Section *</label>
                  <select
                    value={structureForm.classSection}
                    onChange={(e) => setStructureForm({ ...structureForm, classSection: e.target.value })}
                    className="form-select"
                  >
                    <option value="8A">8A</option>
                    <option value="7B">7B</option>
                    <option value="9B">9B</option>
                    <option value="12A">12A</option>
                    <option value="ALL">ALL Classes</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Fee Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="e.g. 20000"
                    value={structureForm.amount}
                    onChange={(e) => setStructureForm({ ...structureForm, amount: e.target.value })}
                    className="form-control"
                  />
                </div>

                <div>
                  <label className="form-label">Statutory Due Date</label>
                  <input
                    type="date"
                    value={structureForm.dueDate}
                    onChange={(e) => setStructureForm({ ...structureForm, dueDate: e.target.value })}
                    className="form-control"
                  />
                </div>

                <div>
                  <label className="form-label">Term / Semester</label>
                  <select
                    value={structureForm.term}
                    onChange={(e) => setStructureForm({ ...structureForm, term: e.target.value })}
                    className="form-select"
                  >
                    <option value="Annual">Annual</option>
                    <option value="Term 1">Term 1</option>
                    <option value="Term 2">Term 2</option>
                    <option value="Semester 1">Semester 1</option>
                    <option value="Semester 2">Semester 2</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Academic Year</label>
                  <input
                    type="text"
                    value={structureForm.academicYear}
                    onChange={(e) => setStructureForm({ ...structureForm, academicYear: e.target.value })}
                    className="form-control"
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Description / Remarks</label>
                  <textarea
                    rows={2}
                    placeholder="Notes regarding this fee schedule"
                    value={structureForm.description}
                    onChange={(e) => setStructureForm({ ...structureForm, description: e.target.value })}
                    className="form-control"
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" onClick={() => setShowStructureModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingStructure ? 'Save Changes' : 'Create Structure'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: ASSIGN FEE MODAL (ADMIN) */}
      {/* ============================================================== */}
      {showAssignModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '620px', width: '90%' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontWeight: 700 }}>Assign Fee to Student(s)</h3>
              <button onClick={() => setShowAssignModal(false)} className="btn-close">&times;</button>
            </div>

            <form onSubmit={handleSaveFeeAssignment}>
              <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontWeight: 600 }}>
                    <input
                      type="radio"
                      name="assignMode"
                      checked={assignMode === 'STUDENT'}
                      onChange={() => setAssignMode('STUDENT')}
                    />
                    <span>Single Student</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontWeight: 600 }}>
                    <input
                      type="radio"
                      name="assignMode"
                      checked={assignMode === 'CLASS'}
                      onChange={() => setAssignMode('CLASS')}
                    />
                    <span>Batch Assign Whole Class Section</span>
                  </label>
                </div>

                {assignMode === 'STUDENT' ? (
                  <div style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Select Enrolled Student *</label>
                    <select
                      value={assignForm.studentId}
                      onChange={(e) => setAssignForm({ ...assignForm, studentId: e.target.value })}
                      className="form-select"
                      required
                    >
                      <option value="">-- Choose Student --</option>
                      {studentsList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.classSection || 'N/A'}) - {s.email}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Select Class Section *</label>
                    <select
                      value={assignForm.classSection}
                      onChange={(e) => setAssignForm({ ...assignForm, classSection: e.target.value })}
                      className="form-select"
                      required
                    >
                      <option value="8A">Class 8A (All students)</option>
                      <option value="7B">Class 7B (All students)</option>
                      <option value="9B">Class 9B (All students)</option>
                      <option value="12A">Class 12A (All students)</option>
                    </select>
                  </div>
                )}

                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Pre-fill from Fee Structure (Optional)</label>
                  <select
                    value={assignForm.feeStructureId}
                    onChange={(e) => handleStructureSelectionInAssign(e.target.value)}
                    className="form-select"
                  >
                    <option value="">-- Custom Manual Fee --</option>
                    {structures.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.feeName} - {formatCurrency(s.amount)} ({s.feeType})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Fee Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tuition Fee 2026-2027"
                    value={assignForm.feeName}
                    onChange={(e) => setAssignForm({ ...assignForm, feeName: e.target.value })}
                    className="form-control"
                  />
                </div>

                <div>
                  <label className="form-label">Fee Type *</label>
                  <select
                    value={assignForm.feeType}
                    onChange={(e) => setAssignForm({ ...assignForm, feeType: e.target.value })}
                    className="form-select"
                  >
                    <option value="TUITION">Tuition Fee</option>
                    <option value="ADMISSION">Admission Fee</option>
                    <option value="EXAMINATION">Examination Fee</option>
                    <option value="TRANSPORT">Transport Fee</option>
                    <option value="LIBRARY">Library Fee</option>
                    <option value="LABORATORY">Laboratory Fee</option>
                    <option value="ACTIVITY">Activity Fee</option>
                    <option value="SPORTS">Sports Fee</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Fee Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={assignForm.amount}
                    onChange={(e) => setAssignForm({ ...assignForm, amount: e.target.value })}
                    className="form-control"
                  />
                </div>

                <div>
                  <label className="form-label">Due Date</label>
                  <input
                    type="date"
                    value={assignForm.dueDate}
                    onChange={(e) => setAssignForm({ ...assignForm, dueDate: e.target.value })}
                    className="form-control"
                  />
                </div>

                <div>
                  <label className="form-label">Concession / Discount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={assignForm.discount}
                    onChange={(e) => setAssignForm({ ...assignForm, discount: e.target.value })}
                    className="form-control"
                  />
                </div>

                <div>
                  <label className="form-label">Concession Reason</label>
                  <input
                    type="text"
                    placeholder="e.g. RTE Scholarship / Merit"
                    value={assignForm.discountReason}
                    onChange={(e) => setAssignForm({ ...assignForm, discountReason: e.target.value })}
                    className="form-control"
                  />
                </div>

                <div style={{ gridColumn: 'span 2', background: '#f8fafc', padding: '0.75rem', borderRadius: '6px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Net Payable by Student: </span>
                  <strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>
                    {formatCurrency(Math.max(0, (Number(assignForm.amount) || 0) - (Number(assignForm.discount) || 0)))}
                  </strong>
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" onClick={() => setShowAssignModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm Fee Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: RECORD PAYMENT (ADMIN) */}
      {/* ============================================================== */}
      {showPaymentModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '580px', width: '90%' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontWeight: 700 }}>Record Fee Payment</h3>
              <button onClick={() => setShowPaymentModal(false)} className="btn-close">&times;</button>
            </div>

            <form onSubmit={handleSavePayment}>
              <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Select Student Fee Obligation *</label>
                  <select
                    value={paymentForm.studentFeeId}
                    onChange={(e) => handleStudentFeeChangeInPayment(e.target.value)}
                    className="form-select"
                    required
                  >
                    <option value="">-- Choose Fee Record --</option>
                    {pendingFees.map((sf) => (
                      <option key={sf.id} value={sf.id}>
                        {sf.studentName} ({sf.classSection}) — {sf.feeName} | Pending: {formatCurrency(sf.pendingAmount)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Amount Paid (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={paymentForm.amountPaid}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amountPaid: e.target.value })}
                    className="form-control"
                  />
                </div>

                <div>
                  <label className="form-label">Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={paymentForm.paymentDate}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                    className="form-control"
                  />
                </div>

                <div>
                  <label className="form-label">Payment Method *</label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                    className="form-select"
                  >
                    <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                    <option value="BANK_TRANSFER">Bank Transfer / NEFT / IMPS</option>
                    <option value="CASH">Cash Deposit</option>
                    <option value="CARD">Debit / Credit Card</option>
                    <option value="CHEQUE">Demand Draft / Cheque</option>
                    <option value="ONLINE">Online Portal Payment</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Reference / UTR / Cheque #</label>
                  <input
                    type="text"
                    placeholder="e.g. UPI-928374981"
                    value={paymentForm.referenceNumber}
                    onChange={(e) => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })}
                    className="form-control"
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Remarks / Ledger Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. First installment paid via phone"
                    value={paymentForm.remarks}
                    onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
                    className="form-control"
                  />
                </div>

                {/* Real-time Calculation Card */}
                <div style={{ gridColumn: 'span 2', background: '#f8fafc', padding: '0.85rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  {(() => {
                    const sf = [...studentFees, ...pendingFees].find((f) => String(f.id) === String(paymentForm.studentFeeId));
                    const currentPending = sf ? Number(sf.pendingAmount) : 0;
                    const paying = Number(paymentForm.amountPaid) || 0;
                    const remaining = Math.max(0, currentPending - paying);
                    return (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Current Pending Balance:</div>
                          <strong>{formatCurrency(currentPending)}</strong>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Post-Payment Balance:</div>
                          <strong style={{ color: remaining === 0 ? '#16a34a' : '#b45309' }}>
                            {formatCurrency(remaining)} {remaining === 0 ? '(Fully Cleared 🎉)' : '(Partial)'}
                          </strong>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" onClick={() => setShowPaymentModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm & Generate Official Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: PRINTABLE OFFICIAL RECEIPT VIEWER */}
      {/* ============================================================== */}
      {showReceiptModal && selectedReceipt && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '640px', width: '90%', padding: 0, overflow: 'hidden' }}>
            {/* Action Bar (Not Printed) */}
            <div
              className="receipt-actions-bar"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem 1.25rem',
                background: '#f1f5f9',
                borderBottom: '1px solid #e2e8f0',
              }}
            >
              <div style={{ fontWeight: 700, color: '#334155', fontSize: '0.9rem' }}>
                Official Fee Payment Receipt
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={handlePrintReceipt} className="btn btn-primary btn-sm">
                  <IconPrinter size={15} />
                  <span>Print Receipt</span>
                </button>
                <button onClick={() => setShowReceiptModal(false)} className="btn btn-secondary btn-sm">
                  Close
                </button>
              </div>
            </div>

            {/* Printable Receipt Body */}
            <div id="printable-receipt" style={{ padding: '2rem', background: '#ffffff', color: '#0f172a' }}>
              {/* Header */}
              <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  {selectedReceipt.schoolName || 'Apex International School'}
                </div>
                <div style={{ fontSize: '0.825rem', color: '#475569' }}>
                  {selectedReceipt.schoolAddress || '104 Institutional Enclave, Sector 12, New Delhi'}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.2rem' }}>
                  Affiliated to CBSE · Ph: +91 11 2345 6789 · accounts@school.com
                </div>
                <div
                  style={{
                    display: 'inline-block',
                    marginTop: '0.75rem',
                    padding: '0.25rem 1rem',
                    background: '#0f172a',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    borderRadius: '4px',
                    letterSpacing: '0.08em',
                  }}
                >
                  FEE PAYMENT RECEIPT
                </div>
              </div>

              {/* Receipt Meta & Student Info Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.75rem',
                  fontSize: '0.875rem',
                  marginBottom: '1.25rem',
                  background: '#f8fafc',
                  padding: '1rem',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div>
                  <span style={{ color: '#64748b' }}>Receipt Number: </span>
                  <strong style={{ color: '#2563eb' }}>{selectedReceipt.receiptNumber}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Payment Date: </span>
                  <strong>{selectedReceipt.paymentDate}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Student Name: </span>
                  <strong>{selectedReceipt.studentName}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Class & Section: </span>
                  <strong>Class {selectedReceipt.classSection}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Admission No: </span>
                  <strong>{selectedReceipt.admissionNumber || 'ADM2026031'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Academic Year: </span>
                  <strong>{selectedReceipt.academicYear || '2026-2027'}</strong>
                </div>
              </div>

              {/* Financial Breakdown Table */}
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.875rem',
                  marginBottom: '1.25rem',
                }}
              >
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                    <th style={{ textAlign: 'left', padding: '0.6rem' }}>Particulars</th>
                    <th style={{ textAlign: 'right', padding: '0.6rem' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '0.6rem' }}>
                      <strong>{selectedReceipt.feeName || selectedReceipt.feeType}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Category: {selectedReceipt.feeType}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', padding: '0.6rem', fontWeight: 700 }}>
                      {formatCurrency(selectedReceipt.totalFeeAmount || selectedReceipt.amountPaid)}
                    </td>
                  </tr>

                  <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                    <td style={{ padding: '0.6rem' }}>Previous Balance Outstanding</td>
                    <td style={{ textAlign: 'right', padding: '0.6rem' }}>
                      {formatCurrency(selectedReceipt.previousPendingAmount)}
                    </td>
                  </tr>

                  <tr style={{ borderBottom: '2px solid #0f172a', background: '#f0fdf4' }}>
                    <td style={{ padding: '0.75rem 0.6rem', fontWeight: 800, color: '#16a34a' }}>
                      AMOUNT PAID ({selectedReceipt.paymentMethod})
                    </td>
                    <td style={{ textAlign: 'right', padding: '0.75rem 0.6rem', fontWeight: 900, color: '#16a34a', fontSize: '1.1rem' }}>
                      {formatCurrency(selectedReceipt.amountPaid)}
                    </td>
                  </tr>

                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '0.6rem', fontWeight: 700 }}>Remaining Balance Due</td>
                    <td style={{ textAlign: 'right', padding: '0.6rem', fontWeight: 800, color: selectedReceipt.remainingPendingAmount > 0 ? '#dc2626' : '#15803d' }}>
                      {formatCurrency(selectedReceipt.remainingPendingAmount)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Instrument & Signatures */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  marginTop: '2rem',
                  fontSize: '0.8rem',
                }}
              >
                <div>
                  <div><strong>Payment Mode:</strong> {selectedReceipt.paymentMethod}</div>
                  {selectedReceipt.referenceNumber && (
                    <div><strong>Txn / Ref Number:</strong> {selectedReceipt.referenceNumber}</div>
                  )}
                  <div style={{ color: '#64748b', marginTop: '0.35rem' }}>
                    This is a computer generated official fee receipt.
                  </div>
                </div>

                <div style={{ textAlign: 'center', borderTop: '1px dashed #64748b', width: '160px', paddingTop: '0.35rem' }}>
                  <div style={{ fontWeight: 700 }}>{selectedReceipt.issuedByName || 'Accounts Officer'}</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Authorized Signatory</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
