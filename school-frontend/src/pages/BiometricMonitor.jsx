import React, { useState, useEffect } from 'react';
import { devicesApi } from '../services/api';
import {
  IconCpu,
  IconCheckCircle,
  IconAlertTriangle,
  IconRefreshCw,
  IconPlus,
} from '../components/Icons';

export default function BiometricMonitor() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Add Device Modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    deviceName: '',
    location: '',
    deviceType: 'RFID',
    batteryLevel: 95,
    status: 'ONLINE',
  });
  const [modalLoading, setModalLoading] = useState(false);

  const fetchDevices = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await devicesApi.getAll();
      setDevices(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load biometric device list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleCreateDevice = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      const payload = {
        ...form,
        batteryLevel: Number(form.batteryLevel),
        lastSync: new Date().toISOString(),
      };
      await devicesApi.create(payload);
      setSuccessMsg(`Biometric device "${form.deviceName}" enrolled successfully.`);
      setShowModal(false);
      setForm({ deviceName: '', location: '', deviceType: 'RFID', batteryLevel: 95, status: 'ONLINE' });
      fetchDevices();
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err) {
      alert(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  const handleSimulateSync = async (device) => {
    try {
      const updated = {
        ...device,
        lastSync: new Date().toISOString(),
        status: 'ONLINE',
      };
      await devicesApi.update(device.id, updated);
      setSuccessMsg(`Simulated real-time sync for "${device.deviceName}". Attendance buffer flushed.`);
      fetchDevices();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert(err.message);
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
            <IconCpu size={26} />
            <span>Biometric Device Fleet & IoT Sync</span>
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Real-time biometric, RFID, and facial recognition capture terminals with offline buffering (FR5, FR11).
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => setShowModal(true)} className="btn btn-primary btn-sm">
            <IconPlus size={16} />
            <span>Enroll Device</span>
          </button>
          <button onClick={fetchDevices} className="btn btn-secondary btn-sm" disabled={loading}>
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

      {/* Device Cards Grid */}
      <div className="grid-3" style={{ marginBottom: '2rem' }}>
        {devices.map((device) => (
          <div key={device.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>{device.deviceName}</h3>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>📍 {device.location}</span>
                </div>
                <span className={`badge ${device.status === 'ONLINE' ? 'badge-online' : 'badge-offline'}`}>
                  ● {device.status}
                </span>
              </div>

              <div style={{ background: 'var(--bg-subtle)', borderRadius: '6px', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ color: '#64748b' }}>Device Type:</span>
                  <strong>{device.deviceType}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ color: '#64748b' }}>Battery Health:</span>
                  <strong>{device.batteryLevel}%</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Last Synced:</span>
                  <span style={{ fontSize: '0.775rem' }}>
                    {device.lastSync ? new Date(device.lastSync).toLocaleTimeString() : 'Never'}
                  </span>
                </div>
              </div>

              {/* Battery bar */}
              <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden', marginBottom: '1rem' }}>
                <div
                  style={{
                    width: `${device.batteryLevel}%`,
                    height: '100%',
                    background: device.batteryLevel > 30 ? '#10b981' : '#ef4444',
                  }}
                />
              </div>
            </div>

            <button
              onClick={() => handleSimulateSync(device)}
              className="btn btn-secondary btn-sm"
              style={{ width: '100%' }}
            >
              <IconRefreshCw size={14} />
              <span>Simulate Real-Time Tap Sync</span>
            </button>
          </div>
        ))}
      </div>

      {/* Enroll Device Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Enroll Biometric Terminal</h3>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost btn-sm">×</button>
            </div>

            <form onSubmit={handleCreateDevice}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Device Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Science Lab Biometric Scanner"
                    value={form.deviceName}
                    onChange={(e) => setForm({ ...form, deviceName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Physical Location</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Science Wing Room 102"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    required
                  />
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Device Type</label>
                    <select
                      className="form-control"
                      value={form.deviceType}
                      onChange={(e) => setForm({ ...form, deviceType: e.target.value })}
                    >
                      <option value="RFID">RFID Card Scanner</option>
                      <option value="FINGERPRINT">Fingerprint Scanner</option>
                      <option value="FACE">Facial Recognition Terminal</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Battery Level (%)</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      className="form-control"
                      value={form.batteryLevel}
                      onChange={(e) => setForm({ ...form, batteryLevel: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={modalLoading}>
                  {modalLoading ? 'Enrolling...' : 'Enroll Terminal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
