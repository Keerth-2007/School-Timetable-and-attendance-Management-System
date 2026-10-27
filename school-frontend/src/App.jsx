import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TimetableView from './pages/TimetableView';
import AttendanceDashboard from './pages/AttendanceDashboard';
import LeaveManagement from './pages/LeaveManagement';
import BiometricMonitor from './pages/BiometricMonitor';
import MISReports from './pages/MISReports';
import AdminManagement from './pages/AdminManagement';
import ParentPortal from './pages/ParentPortal';
import AcademicCalendar from './pages/AcademicCalendar';
import StudentTransport from './pages/StudentTransport';
import Assignments from './pages/Assignments';
import ReportCard from './pages/ReportCard';
import FeesManagement from './pages/FeesManagement';

import './App.css';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Routes (SRS Appendix I) */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/calendar"
                element={
                  <ProtectedRoute>
                    <AcademicCalendar />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/transport"
                element={
                  <ProtectedRoute>
                    <StudentTransport />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/assignments"
                element={
                  <ProtectedRoute>
                    <Assignments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/report-card"
                element={
                  <ProtectedRoute>
                    <ReportCard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/timetable"
                element={
                  <ProtectedRoute>
                    <TimetableView />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/attendance"
                element={
                  <ProtectedRoute>
                    <AttendanceDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leave"
                element={
                  <ProtectedRoute>
                    <LeaveManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/fees"
                element={
                  <ProtectedRoute>
                    <FeesManagement />
                  </ProtectedRoute>
                }
              />

              {/* Elevated Role Protected Routes */}
              <Route
                path="/devices"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'PRINCIPAL']}>
                    <BiometricMonitor />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'PRINCIPAL']}>
                    <MISReports />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/parent"
                element={
                  <ProtectedRoute allowedRoles={['PARENT', 'ADMIN']}>
                    <ParentPortal />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminManagement />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
