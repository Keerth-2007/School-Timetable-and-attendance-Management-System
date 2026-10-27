package com.examly.springapp.dto;

public class StudentTransportAssignmentRequest {

    private Long studentId;
    private Long vehicleId;
    private Long routeId;
    private Long pickupStopId;
    private Long dropStopId;
    private String pickupTime;
    private String dropTime;
    private String status; // ACTIVE, SUSPENDED, INACTIVE
    private String academicYear = "2026-2027";
    private String notes;

    public StudentTransportAssignmentRequest() {
    }

    // Getters and Setters

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public Long getVehicleId() {
        return vehicleId;
    }

    public void setVehicleId(Long vehicleId) {
        this.vehicleId = vehicleId;
    }

    public Long getRouteId() {
        return routeId;
    }

    public void setRouteId(Long routeId) {
        this.routeId = routeId;
    }

    public Long getPickupStopId() {
        return pickupStopId;
    }

    public void setPickupStopId(Long pickupStopId) {
        this.pickupStopId = pickupStopId;
    }

    public Long getDropStopId() {
        return dropStopId;
    }

    public void setDropStopId(Long dropStopId) {
        this.dropStopId = dropStopId;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
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
}
