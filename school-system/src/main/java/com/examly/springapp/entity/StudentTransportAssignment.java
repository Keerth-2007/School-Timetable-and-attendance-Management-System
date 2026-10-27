package com.examly.springapp.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "student_transport_assignments")
public class StudentTransportAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "student_id", nullable = false, unique = true)
    private User student;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private TransportVehicle vehicle;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "route_id", nullable = false)
    private TransportRoute route;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "pickup_stop_id")
    private TransportStop pickupStop;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "drop_stop_id")
    private TransportStop dropStop;

    @Column(name = "pickup_time")
    private String pickupTime; // e.g. "07:30 AM"

    @Column(name = "drop_time")
    private String dropTime; // e.g. "04:35 PM"

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.ACTIVE;

    @Column(name = "academic_year", nullable = false)
    private String academicYear = "2026-2027";

    private String notes;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public enum Status {
        ACTIVE,
        SUSPENDED,
        INACTIVE
    }

    public StudentTransportAssignment() {
    }

    public StudentTransportAssignment(User student, TransportVehicle vehicle, TransportRoute route,
                                      TransportStop pickupStop, TransportStop dropStop,
                                      String pickupTime, String dropTime, Status status, String academicYear) {
        this.student = student;
        this.vehicle = vehicle;
        this.route = route;
        this.pickupStop = pickupStop;
        this.dropStop = dropStop;
        this.pickupTime = pickupTime;
        this.dropTime = dropTime;
        this.status = status;
        this.academicYear = academicYear;
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

    public User getStudent() {
        return student;
    }

    public void setStudent(User student) {
        this.student = student;
    }

    public TransportVehicle getVehicle() {
        return vehicle;
    }

    public void setVehicle(TransportVehicle vehicle) {
        this.vehicle = vehicle;
    }

    public TransportRoute getRoute() {
        return route;
    }

    public void setRoute(TransportRoute route) {
        this.route = route;
    }

    public TransportStop getPickupStop() {
        return pickupStop;
    }

    public void setPickupStop(TransportStop pickupStop) {
        this.pickupStop = pickupStop;
    }

    public TransportStop getDropStop() {
        return dropStop;
    }

    public void setDropStop(TransportStop dropStop) {
        this.dropStop = dropStop;
    }

    public String getPickupTime() {
        return pickupTime;
    }

    public void setPickupTime(String pickupTime) {
        this.pickupTime = pickupTime;
    }

    public String getDropTime() {
        return dropTime;
    }

    public void setDropTime(String dropTime) {
        this.dropTime = dropTime;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public String getAcademicYear() {
        return academicYear;
    }

    public void setAcademicYear(String academicYear) {
        this.academicYear = academicYear;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
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
