import React, { useState, useEffect } from 'react';
import { usersApi, metadataApi, authApi, transportApi } from '../services/api';
import {
  IconShield,
  IconUsers,
  IconBookOpen,
  IconPlus,
  IconCheckCircle,
  IconAlertTriangle,
  IconRefreshCw,
} from '../components/Icons';

export default function AdminManagement() {
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'subjects', 'rooms', 'transport'

  const [usersList, setUsersList] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);
  const [roomsList, setRoomsList] = useState([]);
  const [assignmentsList, setAssignmentsList] = useState([]);
  const [vehiclesList, setVehiclesList] = useState([]);
  const [routesList, setRoutesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  // Modals
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '' });

  const [showRoomModal, setShowRoomModal] = useState(false);
  const [roomForm, setRoomForm] = useState({ roomName: '', capacity: 40, type: 'CLASSROOM' });

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({
    studentId: '',
    vehicleId: '',
    routeId: '',
    pickupStopId: '',
    dropStopId: '',
    pickupTime: '07:30 AM',
    dropTime: '04:30 PM',
    status: 'ACTIVE',
    academicYear: '2026-2027',
    notes: '',
  });
  const [availableStops, setAvailableStops] = useState([]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [uRes, sRes, rRes, aRes, vRes, rtRes] = await Promise.all([
        usersApi.getAll(),
        metadataApi.getSubjects(),
        metadataApi.getRooms(),
        transportApi.getAssignments().catch(() => ({ data: [] })),
        transportApi.getVehicles().catch(() => ({ data: [] })),
        transportApi.getRoutes().catch(() => ({ data: [] })),
      ]);
      setUsersList(uRes.data);
      setSubjectsList(sRes.data);
      setRoomsList(rRes.data);
      setAssignmentsList(aRes.data || []);
      setVehiclesList(vRes.data || []);
      setRoutesList(rtRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    try {
      await metadataApi.createSubject(subjectForm);
      setMsg(`Subject "${subjectForm.name}" created successfully.`);
      setShowSubjectModal(false);
      setSubjectForm({ name: '', code: '' });
      fetchAll();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      await metadataApi.createRoom({
        ...roomForm,
        capacity: Number(roomForm.capacity),
      });
      setMsg(`Room "${roomForm.roomName}" created successfully.`);
      setShowRoomModal(false);
      setRoomForm({ roomName: '', capacity: 40, type: 'CLASSROOM' });
      fetchAll();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await usersApi.delete(id);
      setMsg('User removed.');
      fetchAll();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteAssignment = async (id) => {
    if (!window.confirm('Are you sure you want to remove this transport allocation?')) return;
    try {
      await transportApi.deleteAssignment(id);
      setMsg('Transport allocation removed successfully.');
      fetchAll();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleRouteChange = async (routeId) => {
    setAssignForm((prev) => ({ ...prev, routeId, pickupStopId: '', dropStopId: '' }));
    if (!routeId) {
      setAvailableStops([]);
      return;
    }
    try {
      const res = await transportApi.getStopsByRoute(routeId);
      setAvailableStops(res.data || []);
    } catch (err) {
      console.error('Failed to load stops', err);
    }
  };

  const handleAssignStudent = async (e) => {
    e.preventDefault();
    try {
      await transportApi.assignStudent(assignForm);
      setMsg('Student transport successfully allocated and parent notified!');
      setShowAssignModal(false);
      setAssignForm({
        studentId: '',
        vehicleId: '',
        routeId: '',
        pickupStopId: '',
        dropStopId: '',
        pickupTime: '07:30 AM',
        dropTime: '04:30 PM',
        status: 'ACTIVE',
        academicYear: '2026-2027',
        notes: '',
      });
      fetchAll();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      alert(err.response?.data?.message || err.message);
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
            <IconShield size={26} />
            <span>Institutional Administration & Master Setup</span>
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Manage user directory, academic subjects, classrooms, and specialist laboratories.
          </p>
        </div>

        <button onClick={fetchAll} className="btn btn-secondary btn-sm" disabled={loading}>
          <IconRefreshCw size={14} />
          <span>Refresh Data</span>
        </button>
      </div>

      {msg && (
        <div className="alert alert-success" style={{ marginBottom: '1.25rem' }}>
          <IconCheckCircle size={18} />
          <span>{msg}</span>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('users')}
          className={`btn btn-sm ${activeTab === 'users' ? 'btn-primary' : 'btn-ghost'}`}
        >
          Users Directory ({usersList.length})
        </button>
        <button
          onClick={() => setActiveTab('subjects')}
          className={`btn btn-sm ${activeTab === 'subjects' ? 'btn-primary' : 'btn-ghost'}`}
        >
          Subjects ({subjectsList.length})
        </button>
        <button
          onClick={() => setActiveTab('rooms')}
          className={`btn btn-sm ${activeTab === 'rooms' ? 'btn-primary' : 'btn-ghost'}`}
        >
          Rooms & Labs ({roomsList.length})
        </button>
        <button
          onClick={() => setActiveTab('transport')}
          className={`btn btn-sm ${activeTab === 'transport' ? 'btn-primary' : 'btn-ghost'}`}
        >
          🚍 Transport ({assignmentsList.length})
        </button>
      </div>

      {/* TAB 1: Users Directory */}
      {activeTab === 'users' && (
        <div className="card" style={{ padding: '1.25rem' }}>
          <div className="card-header">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>System Users Directory</h3>
          </div>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Role Details</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((u) => (
                  <tr key={u.id}>
                    <td>#{u.id}</td>
                    <td><strong>{u.name}</strong></td>
                    <td>{u.email}</td>
                    <td>{u.phone}</td>
                    <td>
                      <span className={`role-chip ${u.role}`}>
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {u.admissionNumber ? `Adm: ${u.admissionNumber} (${u.classSection})` : ''}
                      {u.employeeId ? `Emp ID: ${u.employeeId}` : ''}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="btn btn-ghost btn-sm"
                        style={{ color: '#ef4444' }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Subjects */}
      {activeTab === 'subjects' && (
        <div className="card" style={{ padding: '1.25rem' }}>
          <div className="card-header">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Academic Subjects</h3>
            <button onClick={() => setShowSubjectModal(true)} className="btn btn-primary btn-sm">
              <IconPlus size={15} />
              <span>Add Subject</span>
            </button>
          </div>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Subject Code</th>
                  <th>Subject Name</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subjectsList.map((s) => (
                  <tr key={s.id}>
                    <td><strong>{s.code}</strong></td>
                    <td>{s.name}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={async () => {
                          if (window.confirm('Delete subject?')) {
                            await metadataApi.deleteSubject(s.id);
                            fetchAll();
                          }
                        }}
                        className="btn btn-ghost btn-sm"
                        style={{ color: '#ef4444' }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Rooms */}
      {activeTab === 'rooms' && (
        <div className="card" style={{ padding: '1.25rem' }}>
          <div className="card-header">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Rooms & Specialized Labs</h3>
            <button onClick={() => setShowRoomModal(true)} className="btn btn-primary btn-sm">
              <IconPlus size={15} />
              <span>Add Room / Lab</span>
            </button>
          </div>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Room Name</th>
                  <th>Facility Type</th>
                  <th>Seating Capacity</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {roomsList.map((r) => (
                  <tr key={r.id}>
                    <td><strong>{r.roomName}</strong></td>
                    <td>
                      <span className="badge badge-late">{r.type}</span>
                    </td>
                    <td>{r.capacity} Students</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={async () => {
                          if (window.confirm('Delete room?')) {
                            await metadataApi.deleteRoom(r.id);
                            fetchAll();
                          }
                        }}
                        className="btn btn-ghost btn-sm"
                        style={{ color: '#ef4444' }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: School Transport Management */}
      {activeTab === 'transport' && (
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>School Transport Roster & Allocations</h3>
              <p style={{ margin: '0.2rem 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                Institutional fleet monitoring, driver safety assignments, and student pickup/drop scheduling
              </p>
            </div>
            <button onClick={() => setShowAssignModal(true)} className="btn btn-primary btn-sm">
              <IconPlus size={16} />
              <span>Allocate Student Transport</span>
            </button>
          </div>

          {/* Quick stats */}
          <div className="grid-3" style={{ marginBottom: '1.25rem' }}>
            <div style={{ background: '#f8fafc', padding: '0.85rem 1.15rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Active Fleet Vehicles</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>{vehiclesList.length} Vehicles</div>
            </div>
            <div style={{ background: '#f8fafc', padding: '0.85rem 1.15rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Transit Routes</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>{routesList.length} Routes</div>
            </div>
            <div style={{ background: '#f8fafc', padding: '0.85rem 1.15rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Assigned Students</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>{assignmentsList.length} Students</div>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Vehicle</th>
                  <th>Route</th>
                  <th>Pickup Stop & Time</th>
                  <th>Drop Stop & Time</th>
                  <th>Driver Contact</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignmentsList.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                      No student transport allocations found. Click "Allocate Student Transport" to assign.
                    </td>
                  </tr>
                ) : (
                  assignmentsList.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <strong>{a.studentName}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Class: {a.studentClass || 'N/A'}</div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: '#1e293b' }}>{a.busNumber}</span>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{a.registrationNumber}</div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{a.routeNumber}</span>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{a.routeName}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{a.pickupStopName}</div>
                        <span style={{ fontSize: '0.8rem', color: '#047857', fontWeight: 700 }}>🌅 {a.pickupTime}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{a.dropStopName}</div>
                        <span style={{ fontSize: '0.8rem', color: '#b45309', fontWeight: 700 }}>🌇 {a.dropTime}</span>
                      </td>
                      <td>
                        <div>{a.driverName}</div>
                        <a href={`tel:${a.driverPhone}`} style={{ fontSize: '0.8rem', color: '#2563eb' }}>{a.driverPhone}</a>
                      </td>
                      <td>
                        <span className={`badge ${a.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`}>
                          {a.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => handleDeleteAssignment(a.id)}
                          className="btn btn-ghost btn-sm"
                          style={{ color: '#ef4444' }}
                        >
                          Unassign
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Subject Modal */}
      {showSubjectModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Add Academic Subject</h3>
              <button onClick={() => setShowSubjectModal(false)} className="btn btn-ghost btn-sm">×</button>
            </div>
            <form onSubmit={handleCreateSubject}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Subject Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Computer Science"
                    value={subjectForm.name}
                    onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Subject Code</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. CS101"
                    value={subjectForm.code}
                    onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowSubjectModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Subject</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Room Modal */}
      {showRoomModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Add Room / Facility</h3>
              <button onClick={() => setShowRoomModal(false)} className="btn btn-ghost btn-sm">×</button>
            </div>
            <form onSubmit={handleCreateRoom}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Room / Lab Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Room 204 or Physics Lab B"
                    value={roomForm.roomName}
                    onChange={(e) => setRoomForm({ ...roomForm, roomName: e.target.value })}
                    required
                  />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Type</label>
                    <select
                      className="form-control"
                      value={roomForm.type}
                      onChange={(e) => setRoomForm({ ...roomForm, type: e.target.value })}
                    >
                      <option value="CLASSROOM">Classroom</option>
                      <option value="LAB">Specialist Lab</option>
                      <option value="AUDITORIUM">Auditorium</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Capacity (Seats)</label>
                    <input
                      type="number"
                      min={10}
                      className="form-control"
                      value={roomForm.capacity}
                      onChange={(e) => setRoomForm({ ...roomForm, capacity: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowRoomModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Room</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Allocate Student Transport Modal */}
      {showAssignModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Allocate Student School Transport</h3>
              <button onClick={() => setShowAssignModal(false)} className="btn btn-ghost btn-sm">×</button>
            </div>
            <form onSubmit={handleAssignStudent}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Select Student *</label>
                  <select
                    className="form-control"
                    value={assignForm.studentId}
                    onChange={(e) => setAssignForm({ ...assignForm, studentId: e.target.value })}
                    required
                  >
                    <option value="">-- Choose Student --</option>
                    {usersList
                      .filter((u) => u.role === 'STUDENT')
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.classSection || 'No Class'} · #{u.id})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Fleet Vehicle / Bus *</label>
                    <select
                      className="form-control"
                      value={assignForm.vehicleId}
                      onChange={(e) => setAssignForm({ ...assignForm, vehicleId: e.target.value })}
                      required
                    >
                      <option value="">-- Choose Bus --</option>
                      {vehiclesList.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.busNumber} ({v.vehicleType} · {v.driverName})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Transit Route *</label>
                    <select
                      className="form-control"
                      value={assignForm.routeId}
                      onChange={(e) => handleRouteChange(e.target.value)}
                      required
                    >
                      <option value="">-- Choose Route --</option>
                      {routesList.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.routeNumber} - {r.routeName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Morning Pickup Stop *</label>
                    <select
                      className="form-control"
                      value={assignForm.pickupStopId}
                      onChange={(e) => setAssignForm({ ...assignForm, pickupStopId: e.target.value })}
                      required
                      disabled={!assignForm.routeId}
                    >
                      <option value="">-- Choose Pickup Stop --</option>
                      {availableStops.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.stopOrder}. {s.stopName} ({s.morningPickupTime})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Afternoon Drop Stop *</label>
                    <select
                      className="form-control"
                      value={assignForm.dropStopId}
                      onChange={(e) => setAssignForm({ ...assignForm, dropStopId: e.target.value })}
                      required
                      disabled={!assignForm.routeId}
                    >
                      <option value="">-- Choose Drop Stop --</option>
                      {availableStops.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.stopOrder}. {s.stopName} ({s.afternoonDropTime})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Scheduled Pickup Time</label>
                    <input
                      type="text"
                      className="form-control"
                      value={assignForm.pickupTime}
                      onChange={(e) => setAssignForm({ ...assignForm, pickupTime: e.target.value })}
                      placeholder="e.g. 07:30 AM"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Scheduled Drop Time</label>
                    <input
                      type="text"
                      className="form-control"
                      value={assignForm.dropTime}
                      onChange={(e) => setAssignForm({ ...assignForm, dropTime: e.target.value })}
                      placeholder="e.g. 04:35 PM"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Allocation Notes / Seat Details</label>
                  <input
                    type="text"
                    className="form-control"
                    value={assignForm.notes}
                    onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
                    placeholder="e.g. Seat #14, near attendant"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowAssignModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Allocate Transport</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
