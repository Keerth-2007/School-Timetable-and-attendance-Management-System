package com.examly.springapp.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "transport_routes")
public class TransportRoute {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "route_number", nullable = false)
    private String routeNumber; // e.g. "Route 3"

    @Column(name = "route_name", nullable = false)
    private String routeName; // e.g. "Main Campus Route"

    @Column(name = "start_location")
    private String startLocation; // e.g. "Gandhi Nagar Bus Stop"

    @Column(name = "end_location")
    private String endLocation = "School Campus";

    @Column(name = "morning_start_time")
    private String morningStartTime = "07:15 AM";

    @Column(name = "morning_arrival_time")
    private String morningArrivalTime = "08:15 AM";

    @Column(name = "afternoon_departure_time")
    private String afternoonDepartureTime = "04:15 PM";

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "vehicle_id")
    private TransportVehicle vehicle;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public TransportRoute() {
    }

    public TransportRoute(String routeNumber, String routeName, String startLocation, String endLocation,
                          String morningStartTime, String morningArrivalTime, String afternoonDepartureTime,
                          TransportVehicle vehicle) {
        this.routeNumber = routeNumber;
        this.routeName = routeName;
        this.startLocation = startLocation;
        this.endLocation = endLocation;
        this.morningStartTime = morningStartTime;
        this.morningArrivalTime = morningArrivalTime;
        this.afternoonDepartureTime = afternoonDepartureTime;
        this.vehicle = vehicle;
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

    public String getRouteNumber() {
        return routeNumber;
    }

    public void setRouteNumber(String routeNumber) {
        this.routeNumber = routeNumber;
    }

    public String getRouteName() {
        return routeName;
    }

    public void setRouteName(String routeName) {
        this.routeName = routeName;
    }

    public String getStartLocation() {
        return startLocation;
    }

    public void setStartLocation(String startLocation) {
        this.startLocation = startLocation;
    }

    public String getEndLocation() {
        return endLocation;
    }

    public void setEndLocation(String endLocation) {
        this.endLocation = endLocation;
    }

    public String getMorningStartTime() {
        return morningStartTime;
    }

    public void setMorningStartTime(String morningStartTime) {
        this.morningStartTime = morningStartTime;
    }

    public String getMorningArrivalTime() {
        return morningArrivalTime;
    }

    public void setMorningArrivalTime(String morningArrivalTime) {
        this.morningArrivalTime = morningArrivalTime;
    }

    public String getAfternoonDepartureTime() {
        return afternoonDepartureTime;
    }

    public void setAfternoonDepartureTime(String afternoonDepartureTime) {
        this.afternoonDepartureTime = afternoonDepartureTime;
    }

    public TransportVehicle getVehicle() {
        return vehicle;
    }

    public void setVehicle(TransportVehicle vehicle) {
        this.vehicle = vehicle;
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
