package com.examly.springapp.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "biometric_devices")
public class BiometricDevice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String deviceName;
    private String location;

    @Enumerated(EnumType.STRING)
    private DeviceType deviceType;

    private LocalDateTime lastSync;
    private Integer batteryLevel;

    @Enumerated(EnumType.STRING)
    private Status status;

    public enum DeviceType {
        FINGERPRINT, RFID, FACE
    }

    public enum Status {
        ONLINE, OFFLINE, MAINTENANCE
    }

    public BiometricDevice() {
    }

    // ---------- Getters and Setters ----------

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getDeviceName() {
        return deviceName;
    }

    public void setDeviceName(String deviceName) {
        this.deviceName = deviceName;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public DeviceType getDeviceType() {
        return deviceType;
    }

    public void setDeviceType(DeviceType deviceType) {
        this.deviceType = deviceType;
    }

    public LocalDateTime getLastSync() {
        return lastSync;
    }

    public void setLastSync(LocalDateTime lastSync) {
        this.lastSync = lastSync;
    }

    public Integer getBatteryLevel() {
        return batteryLevel;
    }

    public void setBatteryLevel(Integer batteryLevel) {
        this.batteryLevel = batteryLevel;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }
}
