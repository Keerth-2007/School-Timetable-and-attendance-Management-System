package com.examly.springapp.dto;

import com.examly.springapp.entity.StudentTransportAssignment;
import com.examly.springapp.entity.TransportStop;

import java.util.ArrayList;
import java.util.List;

public class StudentTransportDTO {

    private Long assignmentId;

    // Student Info
    private Long studentId;
    private String studentName;
    private String admissionNumber;
    private String classSection;

    // Transport Status
    private String status; // ACTIVE, SUSPENDED, INACTIVE
    private String academicYear;

    // Vehicle Details
    private Long vehicleId;
    private String busNumber;
    private String registrationNumber;
    private String vehicleType;
    private Integer capacity;
    private String driverName;
    private String driverPhone;
    private String attendantName;
    private String attendantPhone;

    // Route Details
    private Long routeId;
    private String routeNumber;
    private String routeName;
    private String startLocation;
    private String endLocation;
    private String morningStartTime;
    private String morningArrivalTime;
    private String afternoonDepartureTime;
    private String morningRouteDescription;
    private String afternoonRouteDescription;

    // Pickup & Drop
    private Long pickupStopId;
    private String pickupStopName;
    private String pickupTime;

    private Long dropStopId;
    private String dropStopName;
    private String dropTime;

    // Route Stops Timeline
    private List<StopItemDTO> routeStops = new ArrayList<>();

    // Academic Calendar Integration
    private boolean holidayToday = false;
    private String holidayNotice;

    private String notes;

    public static class StopItemDTO {
        private Long id;
        private String stopName;
        private Integer stopOrder;
        private String morningPickupTime;
        private String afternoonDropTime;
        private String landmark;
        private boolean isStudentPickup;
        private boolean isStudentDrop;

        public StopItemDTO() {
        }

        public StopItemDTO(Long id, String stopName, Integer stopOrder,
                           String morningPickupTime, String afternoonDropTime,
                           String landmark, boolean isStudentPickup, boolean isStudentDrop) {
            this.id = id;
            this.stopName = stopName;
            this.stopOrder = stopOrder;
            this.morningPickupTime = morningPickupTime;
            this.afternoonDropTime = afternoonDropTime;
            this.landmark = landmark;
            this.isStudentPickup = isStudentPickup;
            this.isStudentDrop = isStudentDrop;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getStopName() { return stopName; }
        public void setStopName(String stopName) { this.stopName = stopName; }
        public Integer getStopOrder() { return stopOrder; }
        public void setStopOrder(Integer stopOrder) { this.stopOrder = stopOrder; }
        public String getMorningPickupTime() { return morningPickupTime; }
        public void setMorningPickupTime(String morningPickupTime) { this.morningPickupTime = morningPickupTime; }
        public String getAfternoonDropTime() { return afternoonDropTime; }
        public void setAfternoonDropTime(String afternoonDropTime) { this.afternoonDropTime = afternoonDropTime; }
        public String getLandmark() { return landmark; }
        public void setLandmark(String landmark) { this.landmark = landmark; }
        public boolean isStudentPickup() { return isStudentPickup; }
        public void setStudentPickup(boolean studentPickup) { isStudentPickup = studentPickup; }
        public boolean isStudentDrop() { return isStudentDrop; }
        public void setStudentDrop(boolean studentDrop) { isStudentDrop = studentDrop; }
    }

    public StudentTransportDTO() {
    }

    // Getters and Setters

    public Long getAssignmentId() {
        return assignmentId;
    }

    public void setAssignmentId(Long assignmentId) {
        this.assignmentId = assignmentId;
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }

    public String getAdmissionNumber() {
        return admissionNumber;
    }

    public void setAdmissionNumber(String admissionNumber) {
        this.admissionNumber = admissionNumber;
    }

    public String getClassSection() {
        return classSection;
    }

    public void setClassSection(String classSection) {
        this.classSection = classSection;
    }

    public String getStudentClass() {
        return classSection;
    }

    public void setStudentClass(String studentClass) {
        this.classSection = studentClass;
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

    public Long getVehicleId() {
        return vehicleId;
    }

    public void setVehicleId(Long vehicleId) {
        this.vehicleId = vehicleId;
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

    public Long getRouteId() {
        return routeId;
    }

    public void setRouteId(Long routeId) {
        this.routeId = routeId;
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

    public String getMorningRouteDescription() {
        return morningRouteDescription;
    }

    public void setMorningRouteDescription(String morningRouteDescription) {
        this.morningRouteDescription = morningRouteDescription;
    }

    public String getAfternoonRouteDescription() {
        return afternoonRouteDescription;
    }

    public void setAfternoonRouteDescription(String afternoonRouteDescription) {
        this.afternoonRouteDescription = afternoonRouteDescription;
    }

    public Long getPickupStopId() {
        return pickupStopId;
    }

    public void setPickupStopId(Long pickupStopId) {
        this.pickupStopId = pickupStopId;
    }

    public String getPickupStopName() {
        return pickupStopName;
    }

    public void setPickupStopName(String pickupStopName) {
        this.pickupStopName = pickupStopName;
    }

    public String getPickupTime() {
        return pickupTime;
    }

    public void setPickupTime(String pickupTime) {
        this.pickupTime = pickupTime;
    }

    public Long getDropStopId() {
        return dropStopId;
    }

    public void setDropStopId(Long dropStopId) {
        this.dropStopId = dropStopId;
    }

    public String getDropStopName() {
        return dropStopName;
    }

    public void setDropStopName(String dropStopName) {
        this.dropStopName = dropStopName;
    }

    public String getDropTime() {
        return dropTime;
    }

    public void setDropTime(String dropTime) {
        this.dropTime = dropTime;
    }

    public List<StopItemDTO> getRouteStops() {
        return routeStops;
    }

    public void setRouteStops(List<StopItemDTO> routeStops) {
        this.routeStops = routeStops;
    }

    public boolean isHolidayToday() {
        return holidayToday;
    }

    public void setHolidayToday(boolean holidayToday) {
        this.holidayToday = holidayToday;
    }

    public String getHolidayNotice() {
        return holidayNotice;
    }

    public void setHolidayNotice(String holidayNotice) {
        this.holidayNotice = holidayNotice;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
