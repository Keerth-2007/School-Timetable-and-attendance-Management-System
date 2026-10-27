import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { transportApi, parentApi } from '../services/api';
import {
  IconCalendar,
  IconClock,
  IconCheckCircle,
  IconAlertTriangle,
  IconXCircle,
  IconRefreshCw,
  IconArrowRight,
  IconUser,
} from '../components/Icons';

export default function StudentTransport() {
  const { user } = useAuth();
  const [transport, setTransport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState(null);

  const isParent = user?.role === 'PARENT';

  const fetchTransportData = async (targetStudentId = null) => {
    setLoading(true);
    setError('');
    try {
      if (isParent) {
        // If parent, first fetch children list if not loaded
        let chList = children;
        if (chList.length === 0) {
          const parentId = user?.id || user?.userId;
          const chRes = await parentApi.getChildren(parentId);
          chList = chRes.data || [];
          setChildren(chList);
        }

        const effectiveChildId = targetStudentId || selectedChildId || (chList.length > 0 ? chList[0].id : null);
        if (effectiveChildId) {
          setSelectedChildId(effectiveChildId);
          const res = await transportApi.getStudentTransport(effectiveChildId);
          setTransport(res.status === 204 ? null : res.data);
        } else {
          setTransport(null);
        }
      } else {
        // Logged-in Student
        const res = await transportApi.getMyTransport();
        setTransport(res.status === 204 ? null : res.data);
      }
    } catch (err) {
      console.error('Error fetching transport data:', err);
      setError(err.message || 'Could not load transport details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransportData();
  }, [user]);

  const handleSelectChild = (childId) => {
    setSelectedChildId(childId);
    fetchTransportData(childId);
  };

  const getStatusBadge = (status) => {
    if (status === 'ACTIVE') {
      return (
        <span
          style={{
            background: '#ecfdf5',
            color: '#065f46',
            border: '1px solid #a7f3d0',
            padding: '0.35rem 0.85rem',
            borderRadius: '9999px',
            fontWeight: 800,
            fontSize: '0.825rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          <span>🟢</span>
          <span>Active</span>
        </span>
      );
    } else if (status === 'SUSPENDED') {
      return (
        <span
          style={{
            background: '#fffbeb',
            color: '#92400e',
            border: '1px solid #fde68a',
            padding: '0.35rem 0.85rem',
            borderRadius: '9999px',
            fontWeight: 800,
            fontSize: '0.825rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          <span>🟡</span>
          <span>Temporarily Suspended</span>
        </span>
      );
    } else {
      return (
        <span
          style={{
            background: '#fef2f2',
            color: '#991b1b',
            border: '1px solid #fecaca',
            padding: '0.35rem 0.85rem',
            borderRadius: '9999px',
            fontWeight: 800,
            fontSize: '0.825rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          <span>🔴</span>
          <span>Inactive</span>
        </span>
      );
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '3.5rem' }}>
      {/* Page Header */}
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
          <h1
            style={{
              fontSize: '1.85rem',
              fontWeight: 800,
              color: '#0f172a',
              margin: '0 0 0.25rem 0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
            }}
          >
            <span>🚍</span>
            <span>My School Transport</span>
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
            {isParent
              ? "Monitor your child's assigned school bus route, stops, pickup timing, and driver communication."
              : 'Real-time assignment details, route schedule, bus crew contact, and designated stops.'}
          </p>
        </div>

        <button
          onClick={() => fetchTransportData(selectedChildId)}
          className="btn btn-secondary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <IconRefreshCw size={14} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Parent Child Switcher Tabs */}
      {isParent && children.length > 1 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem', display: 'block' }}>
            SELECT ENROLLED CHILD:
          </label>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {children.map((ch) => (
              <button
                key={ch.id}
                onClick={() => handleSelectChild(ch.id)}
                style={{
                  border: selectedChildId === ch.id ? '2px solid #2563eb' : '1px solid #cbd5e1',
                  background: selectedChildId === ch.id ? '#eff6ff' : '#ffffff',
                  color: selectedChildId === ch.id ? '#1d4ed8' : '#334155',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <span>👤</span>
                <span>{ch.name} ({ch.classSection || 'N/A'})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Holiday Alert Banner (Academic Calendar Integration) */}
      {transport && transport.holidayToday && (
        <div
          className="alert alert-warning"
          style={{
            marginBottom: '1.5rem',
            background: '#fffbeb',
            border: '1.5px solid #fde68a',
            padding: '1rem 1.25rem',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <span style={{ fontSize: '1.5rem' }}>🏖️</span>
          <div>
            <strong style={{ color: '#92400e', fontSize: '0.95rem' }}>
              Academic Calendar Notice: Scheduled School Holiday
            </strong>
            <p style={{ margin: '0.2rem 0 0', color: '#78350f', fontSize: '0.85rem' }}>
              {transport.holidayNotice || 'Regular school transport services are suspended on official school holidays.'}
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      {loading ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
          <IconRefreshCw size={28} className="spin" style={{ marginBottom: '1rem', color: '#2563eb' }} />
          <div>Retrieving verified transport records from school database...</div>
        </div>
      ) : error ? (
        <div className="alert alert-warning">
          <IconAlertTriangle size={18} />
          <span>{error}</span>
        </div>
      ) : !transport ? (
        /* Empty State */
        <div
          className="card"
          style={{
            padding: '3rem 2rem',
            textAlign: 'center',
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
          }}
        >
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🚍</div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
            No Transport Assigned
          </h2>
          <p style={{ color: '#64748b', maxWidth: '480px', margin: '0 auto 1.5rem', fontSize: '0.9rem', lineHeight: '1.5' }}>
            No active school bus route or transport service has been assigned to your account. Please contact the school administration office to request bus transport.
          </p>
        </div>
      ) : (
        /* Transport Information Display */
        <>
          {/* Top Banner Card */}
          <div
            className="card"
            style={{
              padding: '1.5rem',
              marginBottom: '1.5rem',
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              color: '#ffffff',
              borderRadius: '14px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    letterSpacing: '0.05em',
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                  }}
                >
                  STUDENT TRANSPORT PROFILE
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.35rem' }}>
                  <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                    {transport.studentName}
                  </h2>
                  <span
                    style={{
                      background: 'rgba(255, 255, 255, 0.15)',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                    }}
                  >
                    Class {transport.classSection || '8A'}
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '0.35rem' }}>
                  Admission: {transport.admissionNumber} • Academic Year: {transport.academicYear}
                </div>
              </div>

              <div>{getStatusBadge(transport.status)}</div>
            </div>
          </div>

          {/* Key Metric Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem',
            }}
          >
            {/* Bus Card */}
            <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #2563eb' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>ASSIGNED VEHICLE</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', margin: '0.35rem 0' }}>
                {transport.busNumber}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                {transport.vehicleType} • {transport.registrationNumber}
              </div>
            </div>

            {/* Route Card */}
            <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #10b981' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>TRANSIT ROUTE</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#047857', margin: '0.35rem 0' }}>
                {transport.routeNumber}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                {transport.routeName}
              </div>
            </div>

            {/* Morning Pickup */}
            <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #d97706' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>MORNING PICKUP</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#b45309', margin: '0.35rem 0' }}>
                {transport.pickupTime || '07:30 AM'}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                {transport.pickupStopName || 'Designated Stop'}
              </div>
            </div>

            {/* Afternoon Drop */}
            <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #8b5cf6' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>AFTERNOON DROP</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#6d28d9', margin: '0.35rem 0' }}>
                {transport.dropTime || '04:35 PM'}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                {transport.dropStopName || transport.pickupStopName}
              </div>
            </div>
          </div>

          {/* Details Grid: Pickup & Drop Schedule + Crew Contact */}
          <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
            {/* Pickup & Arrival Details */}
            <div className="card">
              <h3
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <span>📍</span>
                <span>Pickup & School Arrival</span>
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ padding: '0.85rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>DESIGNATED PICKUP STOP</div>
                  <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{transport.pickupStopName}</strong>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div style={{ padding: '0.85rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>BOARDING TIME</div>
                    <strong style={{ fontSize: '1.1rem', color: '#d97706' }}>{transport.pickupTime}</strong>
                  </div>

                  <div style={{ padding: '0.85rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>EXPECTED ARRIVAL</div>
                    <strong style={{ fontSize: '1.1rem', color: '#047857' }}>
                      {transport.morningArrivalTime || '08:15 AM'}
                    </strong>
                  </div>
                </div>

                <div style={{ padding: '0.85rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>MORNING TRANSIT DIRECTION</div>
                  <div style={{ fontSize: '0.875rem', color: '#1e293b', fontWeight: 600, marginTop: '0.2rem' }}>
                    {transport.morningRouteDescription || `${transport.startLocation} → ${transport.endLocation}`}
                  </div>
                </div>
              </div>
            </div>

            {/* Drop & Departure Details */}
            <div className="card">
              <h3
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <span>🏫</span>
                <span>Departure & Afternoon Drop</span>
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ padding: '0.85rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>DESIGNATED DROP STOP</div>
                  <strong style={{ fontSize: '1rem', color: '#0f172a' }}>
                    {transport.dropStopName || transport.pickupStopName}
                  </strong>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div style={{ padding: '0.85rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>CAMPUS DEPARTURE</div>
                    <strong style={{ fontSize: '1.1rem', color: '#2563eb' }}>
                      {transport.afternoonDepartureTime || '04:15 PM'}
                    </strong>
                  </div>

                  <div style={{ padding: '0.85rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>ESTIMATED DROP TIME</div>
                    <strong style={{ fontSize: '1.1rem', color: '#6d28d9' }}>{transport.dropTime}</strong>
                  </div>
                </div>

                <div style={{ padding: '0.85rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>AFTERNOON TRANSIT DIRECTION</div>
                  <div style={{ fontSize: '0.875rem', color: '#1e293b', fontWeight: 600, marginTop: '0.2rem' }}>
                    {transport.afternoonRouteDescription || `${transport.endLocation} → ${transport.startLocation}`}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle & Crew Contacts Card */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3
              style={{
                fontSize: '1.1rem',
                fontWeight: 800,
                color: '#0f172a',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span>🚌</span>
              <span>Vehicle Specifications & Crew Contacts</span>
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              {/* Driver Card */}
              <div
                style={{
                  padding: '1rem',
                  borderRadius: '10px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>ASSIGNED DRIVER</div>
                  <strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>{transport.driverName || 'Designated Driver'}</strong>
                  <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '0.25rem' }}>
                    Contact: {transport.driverPhone || 'Not available'}
                  </div>
                </div>

                {transport.driverPhone && (
                  <a
                    href={`tel:${transport.driverPhone.replace(/\s+/g, '')}`}
                    className="btn btn-primary btn-sm"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      textDecoration: 'none',
                    }}
                  >
                    <span>📞</span>
                    <span>Call Driver</span>
                  </a>
                )}
              </div>

              {/* Attendant Card */}
              <div
                style={{
                  padding: '1rem',
                  borderRadius: '10px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>BUS ATTENDANT</div>
                  <strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>
                    {transport.attendantName || 'Designated Attendant'}
                  </strong>
                  <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '0.25rem' }}>
                    Contact: {transport.attendantPhone || 'Not available'}
                  </div>
                </div>

                {transport.attendantPhone && (
                  <a
                    href={`tel:${transport.attendantPhone.replace(/\s+/g, '')}`}
                    className="btn btn-secondary btn-sm"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      textDecoration: 'none',
                    }}
                  >
                    <span>📞</span>
                    <span>Call Attendant</span>
                  </a>
                )}
              </div>

              {/* Vehicle Specs */}
              <div
                style={{
                  padding: '1rem',
                  borderRadius: '10px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                  fontSize: '0.85rem',
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>VEHICLE SPECIFICATIONS</div>
                <div><strong>Bus Number:</strong> {transport.busNumber}</div>
                <div><strong>Reg. Plate:</strong> {transport.registrationNumber}</div>
                <div><strong>Vehicle Type:</strong> {transport.vehicleType}</div>
                <div><strong>Total Seating:</strong> {transport.capacity} passengers</div>
              </div>
            </div>
          </div>

          {/* Route Stops Sequence Timeline */}
          {transport.routeStops && transport.routeStops.length > 0 && (
            <div className="card">
              <h3
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <span>🗺️</span>
                <span>Transit Route Stops Sequence ({transport.routeName})</span>
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {transport.routeStops.map((stop, index) => {
                  const isUserStop = stop.isStudentPickup || stop.isStudentDrop;

                  return (
                    <div
                      key={stop.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.85rem 1.1rem',
                        borderRadius: '8px',
                        background: isUserStop ? '#eff6ff' : '#f8fafc',
                        border: isUserStop ? '1.5px solid #3b82f6' : '1px solid #e2e8f0',
                        gap: '1rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: isUserStop ? '#2563eb' : '#cbd5e1',
                            color: '#ffffff',
                            fontWeight: 800,
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {stop.stopOrder}
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>{stop.stopName}</strong>
                            {isUserStop && (
                              <span
                                style={{
                                  background: '#2563eb',
                                  color: '#ffffff',
                                  fontSize: '0.675rem',
                                  fontWeight: 800,
                                  padding: '0.15rem 0.5rem',
                                  borderRadius: '9999px',
                                }}
                              >
                                YOUR DESIGNATED STOP
                              </span>
                            )}
                          </div>
                          {stop.landmark && (
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              Landmark: {stop.landmark}
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', fontSize: '0.825rem' }}>
                        <div>
                          <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Pickup: </span>
                          <strong style={{ color: '#d97706' }}>{stop.morningPickupTime}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Drop: </span>
                          <strong style={{ color: '#6d28d9' }}>{stop.afternoonDropTime}</strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
