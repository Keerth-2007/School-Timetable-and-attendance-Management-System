package com.examly.springapp.dto;

public class PublishReportCardRequest {

    private Long studentId;
    private String examName;
    private String academicYear = "2026-2027";
    private String teacherRemarks;
    private String status = "PUBLISHED"; // "DRAFT", "PUBLISHED"

    public PublishReportCardRequest() {
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
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

    public String getTeacherRemarks() {
        return teacherRemarks;
    }

    public void setTeacherRemarks(String teacherRemarks) {
        this.teacherRemarks = teacherRemarks;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
