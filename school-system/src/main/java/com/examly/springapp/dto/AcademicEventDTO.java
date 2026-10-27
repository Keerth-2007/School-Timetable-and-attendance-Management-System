package com.examly.springapp.dto;

import com.examly.springapp.entity.AcademicEvent;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class AcademicEventDTO {

    private Long id;
    private String title;
    private String description;
    private AcademicEvent.EventType eventType;
    private LocalDate startDate;
    private LocalDate endDate;
    private String startTime;
    private String endTime;
    private String location;
    private String academicYear;
    private String classSection;

    private Long subjectId;
    private String subjectName;
    private String subjectCode;

    private Long teacherId;
    private String teacherName;
    private String teacherEmail;

    private AcademicEvent.TargetAudience targetAudience;
    private AcademicEvent.Status status;

    private Long createdById;
    private String createdByName;

    private Long leaveApplicationId;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public AcademicEventDTO() {
    }

    public static AcademicEventDTO fromEntity(AcademicEvent event) {
        if (event == null) return null;
        AcademicEventDTO dto = new AcademicEventDTO();
        dto.setId(event.getId());
        dto.setTitle(event.getTitle());
        dto.setDescription(event.getDescription());
        dto.setEventType(event.getEventType());
        dto.setStartDate(event.getStartDate());
        dto.setEndDate(event.getEndDate());
        dto.setStartTime(event.getStartTime());
        dto.setEndTime(event.getEndTime());
        dto.setLocation(event.getLocation());
        dto.setAcademicYear(event.getAcademicYear());
        dto.setClassSection(event.getClassSection());

        if (event.getSubject() != null) {
            dto.setSubjectId(event.getSubject().getId());
            dto.setSubjectName(event.getSubject().getName());
            dto.setSubjectCode(event.getSubject().getCode());
        }

        if (event.getTeacher() != null) {
            dto.setTeacherId(event.getTeacher().getId());
            dto.setTeacherName(event.getTeacher().getName());
            dto.setTeacherEmail(event.getTeacher().getEmail());
        }

        dto.setTargetAudience(event.getTargetAudience());
        dto.setStatus(event.getStatus());

        if (event.getCreatedBy() != null) {
            dto.setCreatedById(event.getCreatedBy().getId());
            dto.setCreatedByName(event.getCreatedBy().getName());
        }

        if (event.getLeaveApplication() != null) {
            dto.setLeaveApplicationId(event.getLeaveApplication().getId());
        }

        dto.setCreatedAt(event.getCreatedAt());
        dto.setUpdatedAt(event.getUpdatedAt());
        return dto;
    }

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public AcademicEvent.EventType getEventType() {
        return eventType;
    }

    public void setEventType(AcademicEvent.EventType eventType) {
        this.eventType = eventType;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public String getStartTime() {
        return startTime;
    }

    public void setStartTime(String startTime) {
        this.startTime = startTime;
    }

    public String getEndTime() {
        return endTime;
    }

    public void setEndTime(String endTime) {
        this.endTime = endTime;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getAcademicYear() {
        return academicYear;
    }

    public void setAcademicYear(String academicYear) {
        this.academicYear = academicYear;
    }

    public String getClassSection() {
        return classSection;
    }

    public void setClassSection(String classSection) {
        this.classSection = classSection;
    }

    public Long getSubjectId() {
        return subjectId;
    }

    public void setSubjectId(Long subjectId) {
        this.subjectId = subjectId;
    }

    public String getSubjectName() {
        return subjectName;
    }

    public void setSubjectName(String subjectName) {
        this.subjectName = subjectName;
    }

    public String getSubjectCode() {
        return subjectCode;
    }

    public void setSubjectCode(String subjectCode) {
        this.subjectCode = subjectCode;
    }

    public Long getTeacherId() {
        return teacherId;
    }

    public void setTeacherId(Long teacherId) {
        this.teacherId = teacherId;
    }

    public String getTeacherName() {
        return teacherName;
    }

    public void setTeacherName(String teacherName) {
        this.teacherName = teacherName;
    }

    public String getTeacherEmail() {
        return teacherEmail;
    }

    public void setTeacherEmail(String teacherEmail) {
        this.teacherEmail = teacherEmail;
    }

    public AcademicEvent.TargetAudience getTargetAudience() {
        return targetAudience;
    }

    public void setTargetAudience(AcademicEvent.TargetAudience targetAudience) {
        this.targetAudience = targetAudience;
    }

    public AcademicEvent.Status getStatus() {
        return status;
    }

    public void setStatus(AcademicEvent.Status status) {
        this.status = status;
    }

    public Long getCreatedById() {
        return createdById;
    }

    public void setCreatedById(Long createdById) {
        this.createdById = createdById;
    }

    public String getCreatedByName() {
        return createdByName;
    }

    public void setCreatedByName(String createdByName) {
        this.createdByName = createdByName;
    }

    public Long getLeaveApplicationId() {
        return leaveApplicationId;
    }

    public void setLeaveApplicationId(Long leaveApplicationId) {
        this.leaveApplicationId = leaveApplicationId;
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
