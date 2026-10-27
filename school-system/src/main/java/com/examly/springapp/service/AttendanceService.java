package com.examly.springapp.service;

import com.examly.springapp.dto.SessionAttendanceRequest;
import com.examly.springapp.dto.StudentMonthlyReportDTO;
import com.examly.springapp.dto.TeacherMonthlySummaryDTO;
import com.examly.springapp.entity.Attendance;
import com.examly.springapp.entity.Subject;
import com.examly.springapp.entity.Timetable;
import com.examly.springapp.entity.User;
import com.examly.springapp.exception.AttendanceOverrideException;
import com.examly.springapp.exception.ResourceNotFoundException;
import com.examly.springapp.repository.AcademicEventRepository;
import com.examly.springapp.repository.AttendanceRepository;
import com.examly.springapp.repository.SubjectRepository;
import com.examly.springapp.repository.TimetableRepository;
import com.examly.springapp.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final UserRepository userRepository;
    private final SubjectRepository subjectRepository;
    private final TimetableRepository timetableRepository;
    private final AcademicEventRepository academicEventRepository;

    public AttendanceService(AttendanceRepository attendanceRepository,
                             UserRepository userRepository,
                             SubjectRepository subjectRepository,
                             TimetableRepository timetableRepository,
                             @org.springframework.context.annotation.Lazy AcademicEventRepository academicEventRepository) {
        this.attendanceRepository = attendanceRepository;
        this.userRepository = userRepository;
        this.subjectRepository = subjectRepository;
        this.timetableRepository = timetableRepository;
        this.academicEventRepository = academicEventRepository;
    }

    // ----------------------------------------------------
    // MARK / SAVE SESSION ATTENDANCE (BATCH)
    // ----------------------------------------------------

    @Transactional
    public List<Attendance> saveSessionAttendance(SessionAttendanceRequest request, User recordedBy) {
        if (request.getClassSection() == null || request.getDate() == null || request.getPeriod() == null) {
            throw new IllegalArgumentException("Class section, date, and period are required");
        }

        if (academicEventRepository != null && academicEventRepository.isSchoolHoliday(request.getDate())) {
            throw new IllegalArgumentException("Cannot record session attendance on " + request.getDate() +
                    ": Date is designated as a School Holiday in the Academic Calendar");
        }

        Subject subject = null;
        if (request.getSubjectId() != null) {
            subject = subjectRepository.findById(request.getSubjectId()).orElse(null);
        }

        Timetable timetable = null;
        if (request.getTimetableId() != null) {
            timetable = timetableRepository.findById(request.getTimetableId()).orElse(null);
            if (subject == null && timetable != null) {
                subject = timetable.getSubject();
            }
        }

        List<Attendance> savedRecords = new ArrayList<>();

        if (request.getAttendances() != null) {
            for (SessionAttendanceRequest.StudentAttendanceItem item : request.getAttendances()) {
                if (item.getStudentId() == null) continue;

                User student = userRepository.findById(item.getStudentId())
                        .orElseThrow(() -> new ResourceNotFoundException("Student not found with id " + item.getStudentId()));

                Optional<Attendance> existing = attendanceRepository.findByStudentIdAndDateAndPeriod(
                        student.getId(), request.getDate(), request.getPeriod()
                );

                Attendance record;
                if (existing.isPresent()) {
                    record = existing.get();
                    record.setStatus(item.getStatus() != null ? item.getStatus() : Attendance.Status.PRESENT);
                    if (item.getRemarks() != null && !item.getRemarks().trim().isEmpty()) {
                        record.setModificationReason(item.getRemarks().trim());
                    }
                    if (item.getCapturedBy() != null) {
                        record.setCapturedBy(item.getCapturedBy());
                    }
                    record.setModifiedAt(LocalDateTime.now());
                    if (recordedBy != null) {
                        record.setModifiedBy(recordedBy);
                    }
                    if (subject != null) record.setSubject(subject);
                    if (timetable != null) record.setTimetable(timetable);
                } else {
                    record = new Attendance();
                    record.setStudent(student);
                    record.setDate(request.getDate());
                    record.setPeriod(request.getPeriod());
                    record.setStatus(item.getStatus() != null ? item.getStatus() : Attendance.Status.PRESENT);
                    record.setCapturedBy(item.getCapturedBy() != null ? item.getCapturedBy() : Attendance.CapturedBy.MANUAL);
                    record.setRecordedBy(recordedBy);
                    if (item.getRemarks() != null && !item.getRemarks().trim().isEmpty()) {
                        record.setModificationReason(item.getRemarks().trim());
                    }
                    if (subject != null) record.setSubject(subject);
                    if (timetable != null) record.setTimetable(timetable);
                }

                savedRecords.add(attendanceRepository.save(record));
            }
        }

        return savedRecords;
    }

    // ----------------------------------------------------
    // GET ATTENDANCE FOR A SPECIFIC SESSION
    // ----------------------------------------------------

    public List<Attendance> getSessionAttendance(String classSection, LocalDate date, Integer period) {
        if (period != null) {
            return attendanceRepository.findByStudentClassSectionAndDateAndPeriod(classSection, date, period);
        }
        return attendanceRepository.findByStudentClassSectionAndDateOrderByPeriodAsc(classSection, date);
    }

    // ----------------------------------------------------
    // GET STUDENT MONTHLY REPORT & TIMELINE
    // ----------------------------------------------------

    public StudentMonthlyReportDTO getStudentMonthlyReport(Long studentId, int year, int month) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id " + studentId));

        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();

        List<Attendance> records = attendanceRepository
                .findByStudentIdAndDateBetweenOrderByDateAscPeriodAsc(studentId, startDate, endDate);

        StudentMonthlyReportDTO report = new StudentMonthlyReportDTO();
        report.setStudentId(student.getId());
        report.setStudentName(student.getName());
        report.setAdmissionNumber(student.getAdmissionNumber() != null ? student.getAdmissionNumber() : "ADM-" + student.getId());
        report.setClassSection(student.getClassSection());
        report.setYear(year);
        report.setMonth(month);
        report.setMonthName(yearMonth.getMonth().getDisplayName(TextStyle.FULL, Locale.ENGLISH) + " " + year);

        int total = records.size();
        int present = 0;
        int absent = 0;
        int late = 0;
        int excused = 0;

        List<StudentMonthlyReportDTO.AttendanceSessionDetail> sessionDetails = new ArrayList<>();

        for (Attendance a : records) {
            if (a.getStatus() == Attendance.Status.PRESENT) {
                present++;
            } else if (a.getStatus() == Attendance.Status.ABSENT) {
                absent++;
            } else if (a.getStatus() == Attendance.Status.LATE) {
                late++;
            } else if (a.getStatus() == Attendance.Status.EXCUSED) {
                excused++;
            }

            String subjectName = "General Academic";
            String subjectCode = "GEN";
            Long subjectId = null;
            if (a.getSubject() != null) {
                subjectName = a.getSubject().getName();
                subjectCode = a.getSubject().getCode();
                subjectId = a.getSubject().getId();
            } else if (a.getTimetable() != null && a.getTimetable().getSubject() != null) {
                subjectName = a.getTimetable().getSubject().getName();
                subjectCode = a.getTimetable().getSubject().getCode();
                subjectId = a.getTimetable().getSubject().getId();
            }

            String teacherName = "Staff";
            if (a.getRecordedBy() != null) {
                teacherName = a.getRecordedBy().getName();
            } else if (a.getTimetable() != null && a.getTimetable().getTeacher() != null) {
                teacherName = a.getTimetable().getTeacher().getName();
            }

            sessionDetails.add(new StudentMonthlyReportDTO.AttendanceSessionDetail(
                    a.getId(),
                    a.getDate(),
                    a.getPeriod() != null ? a.getPeriod() : 1,
                    subjectId,
                    subjectName,
                    subjectCode,
                    teacherName,
                    a.getStatus(),
                    a.getCapturedBy() != null ? a.getCapturedBy() : Attendance.CapturedBy.MANUAL,
                    a.getModificationReason()
            ));
        }

        report.setTotalSessions(total);
        report.setDaysPresent(present);
        report.setDaysAbsent(absent);
        report.setLateCount(late);
        report.setExcusedCount(excused);

        // Calculate attendance %
        // Present + Late + Excused count toward student compliance per SRS / institutional rules
        double percentage = 0.0;
        if (total > 0) {
            long attended = (long) present + late + excused;
            percentage = Math.round((attended * 100.0 / total) * 10.0) / 10.0;
        }
        report.setAttendancePercentage(percentage);
        report.setThresholdBreached(total > 0 && percentage < 75.0);
        report.setSessions(sessionDetails);

        return report;
    }

    // ----------------------------------------------------
    // GET TEACHER MONTHLY SUMMARY
    // ----------------------------------------------------

    public List<TeacherMonthlySummaryDTO> getTeacherMonthlySummary(String classSection, int year, int month) {
        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();

        List<Attendance> records;
        if (classSection != null && !classSection.trim().isEmpty()) {
            records = attendanceRepository.findByStudentClassSectionAndDateBetweenOrderByDateAscPeriodAsc(classSection, startDate, endDate);
        } else {
            records = attendanceRepository.findAll().stream()
                    .filter(a -> a.getDate() != null && !a.getDate().isBefore(startDate) && !a.getDate().isAfter(endDate))
                    .collect(Collectors.toList());
        }

        // Group by (date, period, classSection)
        Map<String, List<Attendance>> grouped = records.stream()
                .collect(Collectors.groupingBy(a ->
                        a.getDate() + "_" + (a.getPeriod() != null ? a.getPeriod() : 1) + "_" +
                                (a.getStudent() != null ? a.getStudent().getClassSection() : classSection)));

        List<TeacherMonthlySummaryDTO> summaries = new ArrayList<>();

        for (Map.Entry<String, List<Attendance>> entry : grouped.entrySet()) {
            List<Attendance> list = entry.getValue();
            if (list.isEmpty()) continue;

            Attendance first = list.get(0);
            LocalDate date = first.getDate();
            Integer period = first.getPeriod() != null ? first.getPeriod() : 1;
            String section = first.getStudent() != null ? first.getStudent().getClassSection() : classSection;

            Long subjectId = null;
            String subjectName = "General Academic";
            Long timetableId = null;
            String teacherName = "Staff";

            if (first.getSubject() != null) {
                subjectId = first.getSubject().getId();
                subjectName = first.getSubject().getName();
            } else if (first.getTimetable() != null && first.getTimetable().getSubject() != null) {
                subjectId = first.getTimetable().getSubject().getId();
                subjectName = first.getTimetable().getSubject().getName();
            }

            if (first.getTimetable() != null) {
                timetableId = first.getTimetable().getId();
                if (first.getTimetable().getTeacher() != null) {
                    teacherName = first.getTimetable().getTeacher().getName();
                }
            } else if (first.getRecordedBy() != null) {
                teacherName = first.getRecordedBy().getName();
            }

            int present = 0, absent = 0, late = 0, excused = 0;
            for (Attendance a : list) {
                if (a.getStatus() == Attendance.Status.PRESENT) present++;
                else if (a.getStatus() == Attendance.Status.ABSENT) absent++;
                else if (a.getStatus() == Attendance.Status.LATE) late++;
                else if (a.getStatus() == Attendance.Status.EXCUSED) excused++;
            }

            summaries.add(new TeacherMonthlySummaryDTO(
                    date,
                    section,
                    subjectId,
                    subjectName,
                    period,
                    timetableId,
                    present,
                    absent,
                    late,
                    excused,
                    list.size(),
                    "Saved",
                    teacherName
            ));
        }

        // Sort by date descending, then period ascending
        summaries.sort((a, b) -> {
            int dateCmp = b.getDate().compareTo(a.getDate());
            if (dateCmp != 0) return dateCmp;
            return Integer.compare(a.getPeriod() != null ? a.getPeriod() : 0, b.getPeriod() != null ? b.getPeriod() : 0);
        });

        return summaries;
    }

    // ----------------------------------------------------
    // MARK SINGLE ATTENDANCE (BACKWARDS COMPATIBILITY)
    // ----------------------------------------------------

    public Attendance markAttendance(Attendance attendance) {
        if (attendance.getStudent() == null || attendance.getStudent().getId() == null) {
            throw new IllegalArgumentException("Student is required");
        }

        User student = userRepository.findById(attendance.getStudent().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));

        if (student.getRole() != User.Role.STUDENT) {
            throw new IllegalArgumentException("Selected user is not a student");
        }

        attendance.setStudent(student);

        if (attendance.getDate() == null) {
            attendance.setDate(LocalDate.now());
        }

        if (attendance.getStatus() == null) {
            attendance.setStatus(Attendance.Status.PRESENT);
        }

        if (attendance.getId() == null) {
            Integer period = attendance.getPeriod() != null ? attendance.getPeriod() : 1;
            Optional<Attendance> existing = attendanceRepository.findByStudentIdAndDateAndPeriod(
                    student.getId(), attendance.getDate(), period);
            if (existing.isPresent()) {
                Attendance rec = existing.get();
                rec.setStatus(attendance.getStatus());
                if (attendance.getCapturedBy() != null) rec.setCapturedBy(attendance.getCapturedBy());
                if (attendance.getRecordedBy() != null) rec.setRecordedBy(attendance.getRecordedBy());
                if (attendance.getSubject() != null) rec.setSubject(attendance.getSubject());
                if (attendance.getTimetable() != null) rec.setTimetable(attendance.getTimetable());
                return attendanceRepository.save(rec);
            }
        }

        return attendanceRepository.save(attendance);
    }

    // ----------------------------------------------------
    // GET ATTENDANCE BY CLASS AND DATE
    // ----------------------------------------------------

    public List<Attendance> getByClassAndDate(String classSection, LocalDate date) {
        return attendanceRepository.findByStudentClassSectionAndDateOrderByPeriodAsc(classSection, date);
    }

    // ----------------------------------------------------
    // GET ATTENDANCE BY STUDENT
    // ----------------------------------------------------

    public List<Attendance> getByStudent(Long studentId) {
        if (!userRepository.existsById(studentId)) {
            throw new ResourceNotFoundException("Student not found");
        }
        return attendanceRepository.findByStudentIdOrderByDateAscPeriodAsc(studentId);
    }

    // ----------------------------------------------------
    // CALCULATE ATTENDANCE PERCENTAGE
    // ----------------------------------------------------

    public double calculateAttendancePercentage(Long studentId) {
        List<Attendance> records = attendanceRepository.findByStudentIdOrderByDateAscPeriodAsc(studentId);

        if (records.isEmpty()) {
            return 0.0;
        }

        long totalDays = records.size();

        long presentDays = records.stream()
                .filter(a ->
                        a.getStatus() == Attendance.Status.PRESENT ||
                                a.getStatus() == Attendance.Status.LATE ||
                                a.getStatus() == Attendance.Status.EXCUSED)
                .count();

        return Math.round((presentDays * 100.0 / totalDays) * 10.0) / 10.0;
    }

    // ----------------------------------------------------
    // OVERRIDE ATTENDANCE (FR5, FR10)
    // ----------------------------------------------------

    public Attendance overrideAttendance(Long attendanceId, Attendance.Status status, String reason) {
        return overrideAttendance(attendanceId, status, reason, null);
    }

    public Attendance overrideAttendance(Long attendanceId, Attendance.Status status, String reason, User modifiedBy) {
        if (reason == null || reason.trim().isEmpty()) {
            throw new AttendanceOverrideException("Reason is required for attendance modification");
        }

        Attendance attendance = attendanceRepository.findById(attendanceId)
                .orElseThrow(() -> new ResourceNotFoundException("Attendance record not found with id: " + attendanceId));

        attendance.setStatus(status);
        attendance.setModificationReason(reason.trim());
        attendance.setModifiedAt(LocalDateTime.now());
        if (modifiedBy != null) {
            attendance.setModifiedBy(modifiedBy);
        }

        return attendanceRepository.save(attendance);
    }

    // ----------------------------------------------------
    // STUDENTS BELOW 75%
    // ----------------------------------------------------

    public List<User> getStudentsBelow75() {
        List<User> students = userRepository.findAll();
        return students.stream()
                .filter(user -> user.getRole() == User.Role.STUDENT)
                .filter(user -> calculateAttendancePercentage(user.getId()) < 75.0)
                .toList();
    }
}