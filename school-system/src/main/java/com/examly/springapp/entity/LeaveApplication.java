package com.examly.springapp.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "leave_applications")
public class LeaveApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "teacher_id")
    private User teacher;

    @Enumerated(EnumType.STRING)
    private LeaveType leaveType;

    private LocalDate fromDate;
    private LocalDate toDate;
    private String reason;

    @Enumerated(EnumType.STRING)
    private Status status = Status.PENDING;

    @ManyToOne
    @JoinColumn(name = "approved_by")
    private User approvedBy;

    @ManyToOne
    @JoinColumn(name = "substitute_teacher_id")
    private User substituteTeacher;

    @Column(name = "rejection_reason")
    private String rejectionReason;

    @Column(name = "is_half_day")
    private Boolean isHalfDay = false;

    @Column(name = "half_day_session")
    private String halfDaySession;

    @Column(name = "is_emergency")
    private Boolean isEmergency = false;

    @Column(name = "supporting_document_url")
    private String supportingDocumentUrl;

    public enum LeaveType {
        CL, SL, PL, COMP_OFF, ON_DUTY, LEAVE
    }

    public enum Status {
        PENDING, APPROVED, REJECTED
    }

    public LeaveApplication() {
    }

    // ---------- Getters and Setters ----------

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getTeacher() {
        return teacher;
    }

    public void setTeacher(User teacher) {
        this.teacher = teacher;
    }

    public LeaveType getLeaveType() {
        return leaveType;
    }

    public void setLeaveType(LeaveType leaveType) {
        this.leaveType = leaveType;
    }

    public LocalDate getFromDate() {
        return fromDate;
    }

    public void setFromDate(LocalDate fromDate) {
        this.fromDate = fromDate;
    }

    public LocalDate getToDate() {
        return toDate;
    }

    public void setToDate(LocalDate toDate) {
        this.toDate = toDate;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public User getApprovedBy() {
        return approvedBy;
    }

    public void setApprovedBy(User approvedBy) {
        this.approvedBy = approvedBy;
    }

    public User getSubstituteTeacher() {
        return substituteTeacher;
    }

    public void setSubstituteTeacher(User substituteTeacher) {
        this.substituteTeacher = substituteTeacher;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public Boolean getIsHalfDay() {
        return isHalfDay;
    }

    public void setIsHalfDay(Boolean halfDay) {
        isHalfDay = halfDay;
    }

    public String getHalfDaySession() {
        return halfDaySession;
    }

    public void setHalfDaySession(String halfDaySession) {
        this.halfDaySession = halfDaySession;
    }

    public Boolean getIsEmergency() {
        return isEmergency;
    }

    public void setIsEmergency(Boolean emergency) {
        isEmergency = emergency;
    }

    public String getSupportingDocumentUrl() {
        return supportingDocumentUrl;
    }

    public void setSupportingDocumentUrl(String supportingDocumentUrl) {
        this.supportingDocumentUrl = supportingDocumentUrl;
    }
}
