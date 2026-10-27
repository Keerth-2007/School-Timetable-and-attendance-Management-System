package com.examly.springapp.dto;

import com.examly.springapp.entity.Attendance;
import java.time.LocalDate;
import java.util.List;

public class SessionAttendanceRequest {

    private String classSection;
    private LocalDate date;
    private Integer period;
    private Long subjectId;
    private Long timetableId;
    private Long recordedById;
    private List<StudentAttendanceItem> attendances;

    public static class StudentAttendanceItem {
        private Long studentId;
        private Attendance.Status status;
        private String remarks;
        private Attendance.CapturedBy capturedBy;

        public StudentAttendanceItem() {}

        public StudentAttendanceItem(Long studentId, Attendance.Status status, String remarks) {
            this.studentId = studentId;
            this.status = status;
            this.remarks = remarks;
        }

        public Long getStudentId() {
            return studentId;
        }

        public void setStudentId(Long studentId) {
            this.studentId = studentId;
        }

        public Attendance.Status getStatus() {
            return status;
        }

        public void setStatus(Attendance.Status status) {
            this.status = status;
        }

        public String getRemarks() {
            return remarks;
        }

        public void setRemarks(String remarks) {
            this.remarks = remarks;
        }

        public Attendance.CapturedBy getCapturedBy() {
            return capturedBy;
        }

        public void setCapturedBy(Attendance.CapturedBy capturedBy) {
            this.capturedBy = capturedBy;
        }
    }

    public SessionAttendanceRequest() {}

    public String getClassSection() {
        return classSection;
    }

    public void setClassSection(String classSection) {
        this.classSection = classSection;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public Integer getPeriod() {
        return period;
    }

    public void setPeriod(Integer period) {
        this.period = period;
    }

    public Long getSubjectId() {
        return subjectId;
    }

    public void setSubjectId(Long subjectId) {
        this.subjectId = subjectId;
    }

    public Long getTimetableId() {
        return timetableId;
    }

    public void setTimetableId(Long timetableId) {
        this.timetableId = timetableId;
    }

    public Long getRecordedById() {
        return recordedById;
    }

    public void setRecordedById(Long recordedById) {
        this.recordedById = recordedById;
    }

    public List<StudentAttendanceItem> getAttendances() {
        return attendances;
    }

    public void setAttendances(List<StudentAttendanceItem> attendances) {
        this.attendances = attendances;
    }
}
