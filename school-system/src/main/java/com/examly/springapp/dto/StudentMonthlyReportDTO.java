package com.examly.springapp.dto;

import com.examly.springapp.entity.Attendance;
import java.time.LocalDate;
import java.util.List;

public class StudentMonthlyReportDTO {

    private Long studentId;
    private String studentName;
    private String admissionNumber;
    private String classSection;
    private int year;
    private int month;
    private String monthName;
    private int totalSessions;
    private int daysPresent;
    private int daysAbsent;
    private int lateCount;
    private int excusedCount;
    private double attendancePercentage;
    private boolean thresholdBreached;
    private List<AttendanceSessionDetail> sessions;

    public static class AttendanceSessionDetail {
        private Long id;
        private LocalDate date;
        private Integer period;
        private Long subjectId;
        private String subjectName;
        private String subjectCode;
        private String teacherName;
        private Attendance.Status status;
        private Attendance.CapturedBy capturedBy;
        private String remarks;

        public AttendanceSessionDetail() {}

        public AttendanceSessionDetail(Long id, LocalDate date, Integer period,
                                       Long subjectId, String subjectName, String subjectCode,
                                       String teacherName, Attendance.Status status,
                                       Attendance.CapturedBy capturedBy, String remarks) {
            this.id = id;
            this.date = date;
            this.period = period;
            this.subjectId = subjectId;
            this.subjectName = subjectName;
            this.subjectCode = subjectCode;
            this.teacherName = teacherName;
            this.status = status;
            this.capturedBy = capturedBy;
            this.remarks = remarks;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public LocalDate getDate() { return date; }
        public void setDate(LocalDate date) { this.date = date; }

        public Integer getPeriod() { return period; }
        public void setPeriod(Integer period) { this.period = period; }

        public Long getSubjectId() { return subjectId; }
        public void setSubjectId(Long subjectId) { this.subjectId = subjectId; }

        public String getSubjectName() { return subjectName; }
        public void setSubjectName(String subjectName) { this.subjectName = subjectName; }

        public String getSubjectCode() { return subjectCode; }
        public void setSubjectCode(String subjectCode) { this.subjectCode = subjectCode; }

        public String getTeacherName() { return teacherName; }
        public void setTeacherName(String teacherName) { this.teacherName = teacherName; }

        public Attendance.Status getStatus() { return status; }
        public void setStatus(Attendance.Status status) { this.status = status; }

        public Attendance.CapturedBy getCapturedBy() { return capturedBy; }
        public void setCapturedBy(Attendance.CapturedBy capturedBy) { this.capturedBy = capturedBy; }

        public String getRemarks() { return remarks; }
        public void setRemarks(String remarks) { this.remarks = remarks; }

        public String getModificationReason() { return remarks; }
        public void setModificationReason(String modificationReason) { this.remarks = modificationReason; }
    }

    public StudentMonthlyReportDTO() {}

    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }

    public String getStudentName() { return studentName; }
    public void setStudentName(String studentName) { this.studentName = studentName; }

    public String getAdmissionNumber() { return admissionNumber; }
    public void setAdmissionNumber(String admissionNumber) { this.admissionNumber = admissionNumber; }

    public String getClassSection() { return classSection; }
    public void setClassSection(String classSection) { this.classSection = classSection; }

    public int getYear() { return year; }
    public void setYear(int year) { this.year = year; }

    public int getMonth() { return month; }
    public void setMonth(int month) { this.month = month; }

    public String getMonthName() { return monthName; }
    public void setMonthName(String monthName) { this.monthName = monthName; }

    public int getTotalSessions() { return totalSessions; }
    public void setTotalSessions(int totalSessions) { this.totalSessions = totalSessions; }

    public int getDaysPresent() { return daysPresent; }
    public void setDaysPresent(int daysPresent) { this.daysPresent = daysPresent; }

    public int getDaysAbsent() { return daysAbsent; }
    public void setDaysAbsent(int daysAbsent) { this.daysAbsent = daysAbsent; }

    public int getLateCount() { return lateCount; }
    public void setLateCount(int lateCount) { this.lateCount = lateCount; }

    public int getExcusedCount() { return excusedCount; }
    public void setExcusedCount(int excusedCount) { this.excusedCount = excusedCount; }

    public double getAttendancePercentage() { return attendancePercentage; }
    public void setAttendancePercentage(double attendancePercentage) { this.attendancePercentage = attendancePercentage; }

    public boolean isThresholdBreached() { return thresholdBreached; }
    public void setThresholdBreached(boolean thresholdBreached) { this.thresholdBreached = thresholdBreached; }

    public List<AttendanceSessionDetail> getSessions() { return sessions; }
    public void setSessions(List<AttendanceSessionDetail> sessions) { this.sessions = sessions; }
}
