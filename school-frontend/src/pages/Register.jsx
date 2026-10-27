import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../services/api';
import { IconCalendar, IconCheckCircle, IconAlertTriangle, IconArrowRight, IconUser } from '../components/Icons';

export default function Register() {
  const navigate = useNavigate();

  // Multi-step form state (Step 1: Account info, Step 2: Role and domain-specific attributes)
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'STUDENT',
    admissionNumber: '',
    classSection: '8A',
    parentMobile: '',
    employeeId: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Per SRS Appendix I: Email uniqueness verified via debounced API call
  useEffect(() => {
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) return;
    const timer = setTimeout(async () => {
      try {
        const res = await authApi.checkEmail(formData.email.trim());
        if (res.data.exists) {
          setErrors((prev) => ({ ...prev, email: 'This email is already registered' }));
        } else {
          setErrors((prev) => {
            const next = { ...prev };
            if (next.email === 'This email is already registered') delete next.email;
            return next;
          });
        }
      } catch (ignored) {}
    }, 400);
    return () => clearTimeout(timer);
  }, [formData.email]);

  // Per SRS Appendix D: Password strength calculation
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: 'None', color: '#cbd5e1' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 2) return { score, label: 'Weak', color: '#ef4444' };
    if (score <= 4) return { score, label: 'Moderate', color: '#f59e0b' };
    return { score, label: 'Strong (Compliant)', color: '#10b981' };
  };

  // Validation rules directly from SRS Appendix C
  const validateStep1 = () => {
    const errs = {};
    const nameRegex = /^[A-Za-z ]{2,100}$/;
    if (!formData.name.trim()) {
      errs.name = 'Name is required';
    } else if (!nameRegex.test(formData.name.trim())) {
      errs.name = 'Name must not contain numbers or special characters';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errs.email = 'Please enter a valid email address';
    } else if (!emailRegex.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email address';
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!formData.phone.trim()) {
      errs.phone = 'Phone Number is required';
    } else if (!phoneRegex.test(formData.phone.trim())) {
      errs.phone = 'Phone Number must be exactly 10 digits long';
    }

    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!formData.password || !pwdRegex.test(formData.password)) {
      errs.password = 'Password must meet security requirements';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs = {};
    if (formData.role === 'STUDENT') {
      if (!formData.admissionNumber.trim()) {
        errs.admissionNumber = 'Admission number is required for students';
      }
      if (!formData.parentMobile.trim() || !/^[0-9]{10}$/.test(formData.parentMobile.trim())) {
        errs.parentMobile = 'Parent mobile must be exactly 10 digits';
      }
    } else if (['TEACHER', 'CLASS_TEACHER', 'PRINCIPAL'].includes(formData.role)) {
      if (!formData.employeeId.trim()) {
        errs.employeeId = 'Employee ID is required for school staff';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setLoading(true);
    setServerError('');
    setSuccessMsg('');

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim(),
        role: formData.role,
        admissionNumber: formData.role === 'STUDENT' ? formData.admissionNumber.trim() : null,
        classSection: ['STUDENT', 'CLASS_TEACHER'].includes(formData.role) ? formData.classSection : null,
        parentMobile: formData.role === 'STUDENT' ? formData.parentMobile.trim() : null,
        employeeId: ['TEACHER', 'CLASS_TEACHER', 'PRINCIPAL'].includes(formData.role) ? formData.employeeId.trim() : null,
      };

      await authApi.register(payload);
      // Per SRS Appendix I:
      setSuccessMsg('Registration successful! Please verify your email.');
    } catch (err) {
      setServerError(err.message || 'Registration failed. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: 520, width: '100%' }}>
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
              Create Account
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              School Timetable and Attendance Management System
            </p>

            {/* Stepper indicator */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 700, color: step === 1 ? 'var(--primary)' : '#10b981' }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: step === 1 ? 'var(--primary)' : '#10b981', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  {step > 1 ? '✓' : '1'}
                </span>
                <span>Account Info</span>
              </div>
              <div style={{ width: 30, height: 2, background: step === 2 ? 'var(--primary)' : '#e2e8f0' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 700, color: step === 2 ? 'var(--primary)' : '#94a3b8' }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: step === 2 ? 'var(--primary)' : '#e2e8f0', color: step === 2 ? 'white' : '#64748b', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  2
                </span>
                <span>Role & Details</span>
              </div>
            </div>
          </div>

          {serverError && (
            <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>
              <IconAlertTriangle size={18} />
              <span>{serverError}</span>
            </div>
          )}

          {successMsg ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ color: '#10b981', marginBottom: '0.75rem', display: 'flex', justifyContent: 'center' }}>
                <IconCheckCircle size={52} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0f172a' }}>
                {successMsg}
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Your profile has been created in the database and is ready for use.
              </p>
              <Link to="/login" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                <span>Proceed to Sign In</span>
                <IconArrowRight size={18} />
              </Link>
            </div>
          ) : (
            <form onSubmit={step === 1 ? handleNext : handleSubmit}>
              {step === 1 ? (
                <>
                  <div className="form-group">
                    <label className="form-label" htmlFor="name">Full Name</label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      className="form-control"
                      placeholder="e.g. Ramesh Kumar"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                    {errors.name && <div className="form-error">{errors.name}</div>}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="email">Email Address</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      className="form-control"
                      placeholder="name@school.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                    {errors.email && <div className="form-error">{errors.email}</div>}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="phone">Phone Number (10 Digits)</label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      maxLength={10}
                      className="form-control"
                      placeholder="9876543210"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                    />
                    {errors.phone && <div className="form-error">{errors.phone}</div>}
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="form-label" htmlFor="password">Password (Security Policy)</label>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      className="form-control"
                      placeholder="Min 8 chars, Uppercase, Lowercase, Digit, Symbol"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />

                    {/* Real-time Password Strength Meter (SRS Appendix D) */}
                    {formData.password && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>
                          <span>Strength:</span>
                          <span style={{ color: getPasswordStrength(formData.password).color }}>
                            {getPasswordStrength(formData.password).label}
                          </span>
                        </div>
                        <div style={{ height: 4, width: '100%', background: '#e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${(getPasswordStrength(formData.password).score / 5) * 100}%`,
                              background: getPasswordStrength(formData.password).color,
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </div>
                      </div>
                    )}
                    {errors.password && <div className="form-error">{errors.password}</div>}
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem', height: '44px' }}>
                    <span>Next: Role Specific Details</span>
                    <IconArrowRight size={16} />
                  </button>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label className="form-label" htmlFor="role">User Role</label>
                    <select
                      id="role"
                      name="role"
                      className="form-control"
                      value={formData.role}
                      onChange={handleChange}
                    >
                      <option value="STUDENT">Student</option>
                      <option value="TEACHER">Teacher</option>
                      <option value="CLASS_TEACHER">Class Teacher</option>
                      <option value="PARENT">Parent</option>
                      <option value="PRINCIPAL">Principal</option>
                      <option value="ADMIN">System Administrator</option>
                    </select>
                  </div>

                  {formData.role === 'STUDENT' && (
                    <>
                      <div className="form-group">
                        <label className="form-label" htmlFor="admissionNumber">Admission Number</label>
                        <input
                          id="admissionNumber"
                          name="admissionNumber"
                          type="text"
                          className="form-control"
                          placeholder="e.g. ADM2024099"
                          value={formData.admissionNumber}
                          onChange={handleChange}
                          required
                        />
                        {errors.admissionNumber && <div className="form-error">{errors.admissionNumber}</div>}
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="classSection">Class Section</label>
                        <select
                          id="classSection"
                          name="classSection"
                          className="form-control"
                          value={formData.classSection}
                          onChange={handleChange}
                        >
                          <option value="8A">Class 8A</option>
                          <option value="8B">Class 8B</option>
                          <option value="9A">Class 9A</option>
                          <option value="9B">Class 9B</option>
                          <option value="10A">Class 10A</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="parentMobile">Parent Mobile Number (SMS Alerts)</label>
                        <input
                          id="parentMobile"
                          name="parentMobile"
                          type="tel"
                          maxLength={10}
                          className="form-control"
                          placeholder="9111111111"
                          value={formData.parentMobile}
                          onChange={handleChange}
                          required
                        />
                        {errors.parentMobile && <div className="form-error">{errors.parentMobile}</div>}
                      </div>
                    </>
                  )}

                  {['TEACHER', 'CLASS_TEACHER', 'PRINCIPAL'].includes(formData.role) && (
                    <div className="form-group">
                      <label className="form-label" htmlFor="employeeId">Employee ID / Staff Code</label>
                      <input
                        id="employeeId"
                        name="employeeId"
                        type="text"
                        className="form-control"
                        placeholder="e.g. EMP045"
                        value={formData.employeeId}
                        onChange={handleChange}
                        required
                      />
                      {errors.employeeId && <div className="form-error">{errors.employeeId}</div>}
                    </div>
                  )}

                  {formData.role === 'CLASS_TEACHER' && (
                    <div className="form-group">
                      <label className="form-label" htmlFor="classSection">Assigned Class Section</label>
                      <select
                        id="classSection"
                        name="classSection"
                        className="form-control"
                        value={formData.classSection}
                        onChange={handleChange}
                      >
                        <option value="8A">Class 8A</option>
                        <option value="8B">Class 8B</option>
                        <option value="9A">Class 9A</option>
                        <option value="10A">Class 10A</option>
                      </select>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setStep(1)}
                      style={{ flex: 1 }}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                      style={{ flex: 2, height: '44px' }}
                    >
                      {loading ? 'Submitting Registration...' : 'Complete Registration'}
                    </button>
                  </div>
                </>
              )}
            </form>
          )}

          <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: '#64748b' }}>
            Already registered?{' '}
            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
              Sign in instead
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
