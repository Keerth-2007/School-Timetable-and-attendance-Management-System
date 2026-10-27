package com.examly.springapp.dto;

import java.time.LocalDate;

public class TeacherMonthlySummaryDTO {

    private LocalDate date;
    private String classSection;
    private Long subjectId;
    private String subjectName;
    private Integer period;
    private Long timetableId;
    private int presentCount;
    private int absentCount;
    private int lateCount;
    private int excusedCount;
    private int totalStudents;
    private String status; // "Saved", "Pending", etc.
    private String teacherName;

    public TeacherMonthlySummaryDTO() {}

    public TeacherMonthlySummaryDTO(LocalDate date, String classSection, Long subjectId,
                                   String subjectName, Integer period, Long timetableId,
                                   int presentCount, int absentCount, int lateCount,
                                   int excusedCount, int totalStudents, String status,
                                   String teacherName) {
        this.date = date;
        this.classSection = classSection;
        this.subjectId = subjectId;
        this.subjectName = subjectName;
        this.period = period;
        this.timetableId = timetableId;
        this.presentCount = presentCount;
        this.absentCount = absentCount;
        this.lateCount = lateCount;
        this.excusedCount = excusedCount;
        this.totalStudents = totalStudents;
        this.status = status;
        this.teacherName = teacherName;
    }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public String getClassSection() { return classSection; }
    public void setClassSection(String classSection) { this.classSection = classSection; }

    public Long getSubjectId() { return subjectId; }
    public void setSubjectId(Long subjectId) { this.subjectId = subjectId; }

    public String getSubjectName() { return subjectName; }
    public void setSubjectName(String subjectName) { this.subjectName = subjectName; }

    public Integer getPeriod() { return period; }
    public void setPeriod(Integer period) { this.period = period; }

    public Long getTimetableId() { return timetableId; }
    public void setTimetableId(Long timetableId) { this.timetableId = timetableId; }

    public int getPresentCount() { return presentCount; }
    public void setPresentCount(int presentCount) { this.presentCount = presentCount; }

    public int getAbsentCount() { return absentCount; }
    public void setAbsentCount(int absentCount) { this.absentCount = absentCount; }

    public int getLateCount() { return lateCount; }
    public void setLateCount(int lateCount) { this.lateCount = lateCount; }

    public int getExcusedCount() { return excusedCount; }
    public void setExcusedCount(int excusedCount) { this.excusedCount = excusedCount; }

    public int getTotalStudents() { return totalStudents; }
    public void setTotalStudents(int totalStudents) { this.totalStudents = totalStudents; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getTeacherName() { return teacherName; }
    public void setTeacherName(String teacherName) { this.teacherName = teacherName; }
}
