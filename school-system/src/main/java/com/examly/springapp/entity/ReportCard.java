package com.examly.springapp.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "report_cards", uniqueConstraints = {
        @UniqueConstraint(name = "uk_student_exam", columnNames = {"student_id", "exam_name", "academic_year"})
})
public class ReportCard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @Column(name = "exam_name", nullable = false)
    private String examName;

    @Column(name = "academic_year", nullable = false)
    private String academicYear = "2026-2027";

    @Column(name = "class_section")
    private String classSection;

    @Column(name = "total_marks", nullable = false)
    private Double totalMarks;

    @Column(name = "max_marks", nullable = false)
    private Double maxMarks;

    @Column(nullable = false)
    private Double percentage;

    @Column(name = "overall_grade")
    private String overallGrade;

    @Column(name = "attendance_percentage")
    private Double attendancePercentage;

    @Column(name = "total_working_days")
    private Integer totalWorkingDays;

    @Column(name = "present_days")
    private Integer presentDays;

    @Column(name = "absent_days")
    private Integer absentDays;

    @Column(name = "teacher_remarks", columnDefinition = "TEXT")
    private String teacherRemarks;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "class_teacher_id")
    private User classTeacher;

    @Column(nullable = false)
    private String status = "PUBLISHED"; // 'DRAFT', 'PUBLISHED'

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public ReportCard() {
    }

    public ReportCard(User student, String examName, String academicYear, String classSection,
                      Double totalMarks, Double maxMarks, Double percentage, String overallGrade,
                      Double attendancePercentage, Integer totalWorkingDays, Integer presentDays,
                      Integer absentDays, String teacherRemarks, User classTeacher, String status) {
        this.student = student;
        this.examName = examName;
        this.academicYear = academicYear != null ? academicYear : "2026-2027";
        this.classSection = classSection;
        this.totalMarks = totalMarks;
        this.maxMarks = maxMarks;
        this.percentage = percentage;
        this.overallGrade = overallGrade;
        this.attendancePercentage = attendancePercentage;
        this.totalWorkingDays = totalWorkingDays;
        this.presentDays = presentDays;
        this.absentDays = absentDays;
        this.teacherRemarks = teacherRemarks;
        this.classTeacher = classTeacher;
        this.status = status != null ? status : "PUBLISHED";
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if ("PUBLISHED".equalsIgnoreCase(this.status)) {
            this.publishedAt = LocalDateTime.now();
        }
    }

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

    public String getExamName() {
        return examName;
    }

    public void setExamName(String examName) {
        this.examName = examName;
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

    public Double getTotalMarks() {
        return totalMarks;
    }

    public void setTotalMarks(Double totalMarks) {
        this.totalMarks = totalMarks;
    }

    public Double getMaxMarks() {
        return maxMarks;
    }

    public void setMaxMarks(Double maxMarks) {
        this.maxMarks = maxMarks;
    }

    public Double getPercentage() {
        return percentage;
    }

    public void setPercentage(Double percentage) {
        this.percentage = percentage;
    }

    public String getOverallGrade() {
        return overallGrade;
    }

    public void setOverallGrade(String overallGrade) {
        this.overallGrade = overallGrade;
    }

    public Double getAttendancePercentage() {
        return attendancePercentage;
    }

    public void setAttendancePercentage(Double attendancePercentage) {
        this.attendancePercentage = attendancePercentage;
    }

    public Integer getTotalWorkingDays() {
        return totalWorkingDays;
    }

    public void setTotalWorkingDays(Integer totalWorkingDays) {
        this.totalWorkingDays = totalWorkingDays;
    }

    public Integer getPresentDays() {
        return presentDays;
    }

    public void setPresentDays(Integer presentDays) {
        this.presentDays = presentDays;
    }

    public Integer getAbsentDays() {
        return absentDays;
    }

    public void setAbsentDays(Integer absentDays) {
        this.absentDays = absentDays;
    }

    public String getTeacherRemarks() {
        return teacherRemarks;
    }

    public void setTeacherRemarks(String teacherRemarks) {
        this.teacherRemarks = teacherRemarks;
    }

    public User getClassTeacher() {
        return classTeacher;
    }

    public void setClassTeacher(User classTeacher) {
        this.classTeacher = classTeacher;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
        if ("PUBLISHED".equalsIgnoreCase(status) && this.publishedAt == null) {
            this.publishedAt = LocalDateTime.now();
        }
    }

    public LocalDateTime getPublishedAt() {
        return publishedAt;
    }

    public void setPublishedAt(LocalDateTime publishedAt) {
        this.publishedAt = publishedAt;
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
