import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { IconCalendar, IconEye, IconEyeOff, IconAlertTriangle, IconUser, IconArrowRight } from '../components/Icons';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    setLoading(true);
    try {
      const u = await login(email, password);
      if (u?.role === 'PARENT') {
        navigate('/parent');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      // Per SRS Appendix I: "Invalid credentials. Please check your email and password."
      setError('Invalid credentials. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  // One-click quick login for presentation & viva evaluation
  const handleQuickLogin = async (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
    setLoading(true);
    try {
      const u = await login(demoEmail, demoPassword);
      if (u?.role === 'PARENT') {
        navigate('/parent');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Could not login with demo account. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: 440, width: '100%' }}>
        <div className="card" style={{ padding: '2.25rem 2rem', boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: 'white',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
                boxShadow: '0 4px 10px rgba(37, 99, 235, 0.25)',
              }}
            >
              <IconCalendar size={26} />
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>
              Account Sign In
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              School Timetable and Attendance Management System
            </p>
          </div>

          {error && (
            <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>
              <IconAlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                className="form-control"
                placeholder="name@school.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  style={{ paddingRight: '2.5rem' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem', height: '44px' }}
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: '#64748b' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>
              Register here
            </Link>
          </div>

          {/* Quick Demo Sign-Ins */}
          <div
            style={{
              marginTop: '1.75rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid var(--border-color)',
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.75rem', textAlign: 'center', letterSpacing: '0.05em' }}>
              Quick Demo Logins (One Click)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleQuickLogin('admin@school.com', 'Admin@123')}
              >
                Admin
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleQuickLogin('principal@school.com', 'Principal@123')}
              >
                Principal
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleQuickLogin('ravi.teacher@school.com', 'Teacher@123')}
              >
                Teacher (Ravi)
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleQuickLogin('suresh.classteacher@school.com', 'Teacher@123')}
              >
                Class Teacher
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => handleQuickLogin('keerthana@gmail.com', 'Student@123')}
                style={{ gridColumn: 'span 2', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: 'white', fontWeight: 700 }}
              >
                ⭐ Student (Keerthana — 89.3% Attendance Log)
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleQuickLogin('arjun.student@school.com', 'Student@123')}
              >
                Student (Arjun)
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleQuickLogin('rajesh.parent@school.com', 'Parent@123')}
              >
                Parent (Rajesh)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
