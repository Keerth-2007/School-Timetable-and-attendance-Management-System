package com.examly.springapp.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "attendance")
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate date;

    @Enumerated(EnumType.STRING)
    private Status status;

    @Enumerated(EnumType.STRING)
    private CapturedBy capturedBy;

    @ManyToOne
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne
    @JoinColumn(name = "recorded_by")
    private User recordedBy;

    @Column(name = "modification_reason")
    private String modificationReason;

    @Column(name = "modified_at")
    private LocalDateTime modifiedAt;

    @ManyToOne
    @JoinColumn(name = "modified_by")
    private User modifiedBy;

    @ManyToOne
    @JoinColumn(name = "subject_id")
    private Subject subject;

    @Column(name = "period")
    private Integer period;

    @ManyToOne
    @JoinColumn(name = "timetable_id")
    private Timetable timetable;

    // Attendance status (SRS Appendix B)
    public enum Status {
        PRESENT,
        ABSENT,
        LATE,
        EXCUSED
    }

    // How attendance was captured (SRS FR5, FR11, Appendix B)
    public enum CapturedBy {
        BIOMETRIC,
        RFID,
        FACE,
        MANUAL
    }

    public Attendance() {
    }

    public Attendance(LocalDate date,
                      Status status,
                      CapturedBy capturedBy,
                      User student,
                      User recordedBy) {
        this.date = date;
        this.status = status;
        this.capturedBy = capturedBy;
        this.student = student;
        this.recordedBy = recordedBy;
    }

    // ---------- Getters and Setters ----------

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public CapturedBy getCapturedBy() {
        return capturedBy;
    }

    public void setCapturedBy(CapturedBy capturedBy) {
        this.capturedBy = capturedBy;
    }

    public User getStudent() {
        return student;
    }

    public void setStudent(User student) {
        this.student = student;
    }

    public User getRecordedBy() {
        return recordedBy;
    }

    public void setRecordedBy(User recordedBy) {
        this.recordedBy = recordedBy;
    }

    public String getModificationReason() {
        return modificationReason;
    }

    public void setModificationReason(String modificationReason) {
        this.modificationReason = modificationReason;
    }

    public LocalDateTime getModifiedAt() {
        return modifiedAt;
    }

    public void setModifiedAt(LocalDateTime modifiedAt) {
        this.modifiedAt = modifiedAt;
    }

    public User getModifiedBy() {
        return modifiedBy;
    }

    public void setModifiedBy(User modifiedBy) {
        this.modifiedBy = modifiedBy;
    }

    public Subject getSubject() {
        return subject;
    }

    public void setSubject(Subject subject) {
        this.subject = subject;
    }

    public Integer getPeriod() {
        return period;
    }

    public void setPeriod(Integer period) {
        this.period = period;
    }

    public Timetable getTimetable() {
        return timetable;
    }

    public void setTimetable(Timetable timetable) {
        this.timetable = timetable;
    }
}