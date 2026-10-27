package com.examly.springapp.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "exam_results")
public class ExamResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "academic_year")
    private String academicYear = "2026-2027";

    @Column(name = "exam_date")
    private LocalDate examDate;

    @Column(name = "exam_name", nullable = false)
    private String examName;

    private String grade;

    @Column(name = "grade_points")
    private Double gradePoints;

    @Column(name = "marks_obtained", nullable = false)
    private Double marksObtained;

    @Column(name = "max_marks", nullable = false)
    private Double maxMarks = 100.0;

    @Column(length = 1000)
    private String remarks;

    @Column(name = "is_published")
    private Boolean isPublished = true;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    public ExamResult() {
    }

    public ExamResult(User student, Subject subject, String examName, String academicYear,
                      Double marksObtained, Double maxMarks, String grade, Double gradePoints, String remarks) {
        this.student = student;
        this.subject = subject;
        this.examName = examName;
        this.academicYear = academicYear != null ? academicYear : "2026-2027";
        this.marksObtained = marksObtained;
        this.maxMarks = maxMarks != null ? maxMarks : 100.0;
        this.grade = grade;
        this.gradePoints = gradePoints;
        this.remarks = remarks;
        this.examDate = LocalDate.now();
        this.isPublished = true;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getAcademicYear() {
        return academicYear;
    }

    public void setAcademicYear(String academicYear) {
        this.academicYear = academicYear;
    }

    public LocalDate getExamDate() {
        return examDate;
    }

    public void setExamDate(LocalDate examDate) {
        this.examDate = examDate;
    }

    public String getExamName() {
        return examName;
    }

    public void setExamName(String examName) {
        this.examName = examName;
    }

    public String getGrade() {
        return grade;
    }

    public void setGrade(String grade) {
        this.grade = grade;
    }

    public Double getGradePoints() {
        return gradePoints;
    }

    public void setGradePoints(Double gradePoints) {
        this.gradePoints = gradePoints;
    }

    public Double getMarksObtained() {
        return marksObtained;
    }

    public void setMarksObtained(Double marksObtained) {
        this.marksObtained = marksObtained;
    }

    public Double getMaxMarks() {
        return maxMarks;
    }

    public void setMaxMarks(Double maxMarks) {
        this.maxMarks = maxMarks;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public Boolean getIsPublished() {
        return isPublished;
    }

    public void setIsPublished(Boolean published) {
        isPublished = published;
    }

    public User getStudent() {
        return student;
    }

    public void setStudent(User student) {
        this.student = student;
    }

    public Subject getSubject() {
        return subject;
    }

    public void setSubject(Subject subject) {
        this.subject = subject;
    }
}
