import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { IconCalendar, IconClock, IconUser, IconLogOut, IconCpu, IconFileText, IconShield } from './Icons';

export default function NavBar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <Link to="/" className="nav-brand">
          <div className="nav-logo-icon">
            <IconCalendar size={22} />
          </div>
          <div className="nav-brand-title">
            <span>School Timetable & Attendance</span>
            <span>Management System</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav>
          <ul className="nav-links">
            <li>
              <NavLink to="/" end className={({ isActive }) => (isActive ? 'nav-link nav-active' : 'nav-link')}>
                Home
              </NavLink>
            </li>

            {isAuthenticated ? (
              <>
                <li>
                  <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'nav-link nav-active' : 'nav-link')}>
                    Dashboard
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/calendar" className={({ isActive }) => (isActive ? 'nav-link nav-active' : 'nav-link')}>
                    Calendar
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/timetable" className={({ isActive }) => (isActive ? 'nav-link nav-active' : 'nav-link')}>
                    Timetable
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/attendance" className={({ isActive }) => (isActive ? 'nav-link nav-active' : 'nav-link')}>
                    Attendance
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/leave" className={({ isActive }) => (isActive ? 'nav-link nav-active' : 'nav-link')}>
                    Leave
                  </NavLink>
                </li>
                {['STUDENT', 'PARENT', 'ADMIN', 'PRINCIPAL'].includes(user?.role) && (
                  <li>
                    <NavLink to="/transport" className={({ isActive }) => (isActive ? 'nav-link nav-active' : 'nav-link')}>
                      Transport
                    </NavLink>
                  </li>
                )}
                <li>
                  <NavLink to="/assignments" className={({ isActive }) => (isActive ? 'nav-link nav-active' : 'nav-link')}>
                    Assignments
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/report-card" className={({ isActive }) => (isActive ? 'nav-link nav-active' : 'nav-link')}>
                    📊 Report Card
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/fees" className={({ isActive }) => (isActive ? 'nav-link nav-active' : 'nav-link')}>
                    💰 Fees
                  </NavLink>
                </li>
                {user?.role === 'PARENT' && (
                  <li>
                    <NavLink to="/parent" className={({ isActive }) => (isActive ? 'nav-link nav-active' : 'nav-link')}>
                      Parent Portal
                    </NavLink>
                  </li>
                )}
                {['ADMIN', 'PRINCIPAL'].includes(user?.role) && (
                  <>
                    <li>
                      <NavLink to="/devices" className={({ isActive }) => (isActive ? 'nav-link nav-active' : 'nav-link')}>
                        Devices
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/reports" className={({ isActive }) => (isActive ? 'nav-link nav-active' : 'nav-link')}>
                        Reports
                      </NavLink>
                    </li>
                  </>
                )}
                {user?.role === 'ADMIN' && (
                  <>
                    <li>
                      <NavLink to="/parent" className={({ isActive }) => (isActive ? 'nav-link nav-active' : 'nav-link')}>
                        Parent Portal
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/admin" className={({ isActive }) => (isActive ? 'nav-link nav-active' : 'nav-link')}>
                        Admin
                      </NavLink>
                    </li>
                  </>
                )}
              </>
            ) : (
              <>
                <li>
                  <NavLink to="/login" className={({ isActive }) => (isActive ? 'nav-link nav-active' : 'nav-link')}>
                    Login
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/register" className={({ isActive }) => (isActive ? 'nav-link nav-active' : 'nav-link')}>
                    Register
                  </NavLink>
                </li>
              </>
            )}
          </ul>
        </nav>

        {/* User profile & actions */}
        <div className="nav-user-actions">
          {isAuthenticated ? (
            <>
              <div className="user-badge-pill">
                <div className="user-avatar">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="user-details">
                  <span className="user-name">{user?.name}</span>
                  <span className={`role-chip ${user?.role}`}>{user?.role?.replace('_', ' ')}</span>
                </div>
              </div>
              <button onClick={handleLogout} className="btn btn-ghost btn-sm" title="Sign Out">
                <IconLogOut size={16} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">
              <IconUser size={16} />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
