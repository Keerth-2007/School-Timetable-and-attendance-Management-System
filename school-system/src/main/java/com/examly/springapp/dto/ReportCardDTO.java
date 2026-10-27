package com.examly.springapp.dto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class ReportCardDTO {

    private Long id;
    private Long studentId;
    private String studentName;
    private String admissionNumber;
    private String classSection;

    private String academicYear;
    private String examName;

    private Double totalMarks;
    private Double maxMarks;
    private Double percentage;
    private String overallGrade;

    private Double attendancePercentage;
    private Integer totalWorkingDays;
    private Integer presentDays;
    private Integer absentDays;

    private Integer assignmentsCompleted;
    private Integer totalAssignments;
    private Double averageAssignmentScore;

    private Integer subjectsPassed;
    private Integer subjectsFailed;

    private String teacherRemarks;
    private String classTeacherName;

    private String status; // "DRAFT", "PUBLISHED"
    private LocalDateTime publishedAt;

    private List<ExamResultDTO> subjectResults = new ArrayList<>();

    public ReportCardDTO() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public String getAcademicYear() {
        return academicYear;
    }

    public void setAcademicYear(String academicYear) {
        this.academicYear = academicYear;
    }

    public String getExamName() {
        return examName;
    }

    public void setExamName(String examName) {
        this.examName = examName;
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

    public Integer getAssignmentsCompleted() {
        return assignmentsCompleted;
    }

    public void setAssignmentsCompleted(Integer assignmentsCompleted) {
        this.assignmentsCompleted = assignmentsCompleted;
    }

    public Integer getTotalAssignments() {
        return totalAssignments;
    }

    public void setTotalAssignments(Integer totalAssignments) {
        this.totalAssignments = totalAssignments;
    }

    public Double getAverageAssignmentScore() {
        return averageAssignmentScore;
    }

    public void setAverageAssignmentScore(Double averageAssignmentScore) {
        this.averageAssignmentScore = averageAssignmentScore;
    }

    public Integer getSubjectsPassed() {
        return subjectsPassed;
    }

    public void setSubjectsPassed(Integer subjectsPassed) {
        this.subjectsPassed = subjectsPassed;
    }

    public Integer getSubjectsFailed() {
        return subjectsFailed;
    }

    public void setSubjectsFailed(Integer subjectsFailed) {
        this.subjectsFailed = subjectsFailed;
    }

    public String getTeacherRemarks() {
        return teacherRemarks;
    }

    public void setTeacherRemarks(String teacherRemarks) {
        this.teacherRemarks = teacherRemarks;
    }

    public String getClassTeacherName() {
        return classTeacherName;
    }

    public void setClassTeacherName(String classTeacherName) {
        this.classTeacherName = classTeacherName;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getPublishedAt() {
        return publishedAt;
    }

    public void setPublishedAt(LocalDateTime publishedAt) {
        this.publishedAt = publishedAt;
    }

    public List<ExamResultDTO> getSubjectResults() {
        return subjectResults;
    }

    public void setSubjectResults(List<ExamResultDTO> subjectResults) {
        this.subjectResults = subjectResults;
    }
}
