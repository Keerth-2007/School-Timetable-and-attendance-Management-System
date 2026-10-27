package com.examly.springapp.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "transport_vehicles")
public class TransportVehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "bus_number", nullable = false, unique = true)
    private String busNumber; // e.g. "BUS-03"

    @Column(name = "registration_number")
    private String registrationNumber; // e.g. "TN 38 AB 1234"

    @Column(name = "vehicle_type")
    private String vehicleType = "School Bus";

    private Integer capacity = 40;

    @Column(name = "driver_name")
    private String driverName;

    @Column(name = "driver_phone")
    private String driverPhone;

    @Column(name = "attendant_name")
    private String attendantName;

    @Column(name = "attendant_phone")
    private String attendantPhone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.ACTIVE;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public enum Status {
        ACTIVE,
        MAINTENANCE,
        INACTIVE
    }

    public TransportVehicle() {
    }

    public TransportVehicle(String busNumber, String registrationNumber, String vehicleType,
                            Integer capacity, String driverName, String driverPhone,
                            String attendantName, String attendantPhone, Status status) {
        this.busNumber = busNumber;
        this.registrationNumber = registrationNumber;
        this.vehicleType = vehicleType;
        this.capacity = capacity;
        this.driverName = driverName;
        this.driverPhone = driverPhone;
        this.attendantName = attendantName;
        this.attendantPhone = attendantPhone;
        this.status = status;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getBusNumber() {
        return busNumber;
    }

    public void setBusNumber(String busNumber) {
        this.busNumber = busNumber;
    }

    public String getRegistrationNumber() {
        return registrationNumber;
    }

    public void setRegistrationNumber(String registrationNumber) {
        this.registrationNumber = registrationNumber;
    }

    public String getVehicleType() {
        return vehicleType;
    }

    public void setVehicleType(String vehicleType) {
        this.vehicleType = vehicleType;
    }

    public Integer getCapacity() {
        return capacity;
    }

    public void setCapacity(Integer capacity) {
        this.capacity = capacity;
    }

    public String getDriverName() {
        return driverName;
    }

    public void setDriverName(String driverName) {
        this.driverName = driverName;
    }

    public String getDriverPhone() {
        return driverPhone;
    }

    public void setDriverPhone(String driverPhone) {
        this.driverPhone = driverPhone;
    }

    public String getAttendantName() {
        return attendantName;
    }

    public void setAttendantName(String attendantName) {
        this.attendantName = attendantName;
    }

    public String getAttendantPhone() {
        return attendantPhone;
    }

    public void setAttendantPhone(String attendantPhone) {
        this.attendantPhone = attendantPhone;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
