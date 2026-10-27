package com.examly.springapp.service;

import com.examly.springapp.entity.Attendance;
import com.examly.springapp.entity.LeaveApplication;
import com.examly.springapp.entity.Notification;
import com.examly.springapp.entity.Timetable;
import com.examly.springapp.entity.User;
import com.examly.springapp.exception.ResourceNotFoundException;
import com.examly.springapp.repository.AttendanceRepository;
import com.examly.springapp.repository.LeaveApplicationRepository;
import com.examly.springapp.repository.NotificationRepository;
import com.examly.springapp.repository.TimetableRepository;
import com.examly.springapp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class LeaveApplicationService {

    @Autowired
    private LeaveApplicationRepository leaveApplicationRepository;

    @Autowired
    private TimetableRepository timetableRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    @org.springframework.context.annotation.Lazy
    private AcademicEventService academicEventService;

    // FR6: submit leave application (status defaults to PENDING)
    public LeaveApplication apply(LeaveApplication application) {
        application.setStatus(LeaveApplication.Status.PENDING);
        return leaveApplicationRepository.save(application);
    }

    public List<LeaveApplication> getPending() {
        return leaveApplicationRepository.findByStatus(LeaveApplication.Status.PENDING);
    }

    public List<LeaveApplication> getByTeacher(Long teacherId) {
        return leaveApplicationRepository.findByTeacherId(teacherId);
    }

    // FR6 & Appendix H: structured leave balance summary per teacher
    public java.util.Map<String, Object> getLeaveBalanceSummary(Long teacherId) {
        List<LeaveApplication> apps = leaveApplicationRepository.findByTeacherId(teacherId);
        long clUsed = apps.stream()
                .filter(a -> a.getStatus() == LeaveApplication.Status.APPROVED && a.getLeaveType() == LeaveApplication.LeaveType.CL)
                .mapToLong(a -> java.time.temporal.ChronoUnit.DAYS.between(a.getFromDate(), a.getToDate()) + 1)
                .sum();
        long slUsed = apps.stream()
                .filter(a -> a.getStatus() == LeaveApplication.Status.APPROVED && a.getLeaveType() == LeaveApplication.LeaveType.SL)
                .mapToLong(a -> java.time.temporal.ChronoUnit.DAYS.between(a.getFromDate(), a.getToDate()) + 1)
                .sum();
        long plUsed = apps.stream()
                .filter(a -> a.getStatus() == LeaveApplication.Status.APPROVED && a.getLeaveType() == LeaveApplication.LeaveType.PL)
                .mapToLong(a -> java.time.temporal.ChronoUnit.DAYS.between(a.getFromDate(), a.getToDate()) + 1)
                .sum();
        long odUsed = apps.stream()
                .filter(a -> a.getStatus() == LeaveApplication.Status.APPROVED && a.getLeaveType() == LeaveApplication.LeaveType.ON_DUTY)
                .count();

        // Under school policy (FR6): Casual leave cannot exceed 12 days per academic year
        return java.util.Map.of(
                "teacherId", teacherId,
                "casualLeave", java.util.Map.of("allowed", 12, "consumed", clUsed, "balance", Math.max(0, 12 - clUsed)),
                "sickLeave", java.util.Map.of("allowed", 10, "consumed", slUsed, "balance", Math.max(0, 10 - slUsed)),
                "privilegeLeave", java.util.Map.of("allowed", 15, "consumed", plUsed, "balance", Math.max(0, 15 - plUsed)),
                "onDuty", java.util.Map.of("consumed", odUsed),
                "applications", apps
        );
    }

    // FR6: principal approves leave and confirms a substitute in one step
    public LeaveApplication approve(Long leaveId, User approvedBy, User substituteTeacher) {
        LeaveApplication leave = getById(leaveId);
        leave.setStatus(LeaveApplication.Status.APPROVED);
        leave.setApprovedBy(approvedBy);
        leave.setSubstituteTeacher(substituteTeacher);
        LeaveApplication savedLeave = leaveApplicationRepository.save(leave);

        // Automated workflow: LEAVE APPROVED -> DATABASE -> ATTENDANCE UPDATED -> PARENT NOTIFICATION CREATED -> CALENDAR SYNC
        applyStudentLeaveAttendanceAndNotification(savedLeave, approvedBy);

        try {
            if (academicEventService != null) {
                academicEventService.syncApprovedLeave(savedLeave);
            }
        } catch (Exception ex) {
            System.err.println("Failed to sync leave to academic calendar: " + ex.getMessage());
        }

        return savedLeave;
    }

    public void applyStudentLeaveAttendanceAndNotification(LeaveApplication leave, User approvedBy) {
        User applicant = leave.getTeacher();
        if (applicant == null) return;

        boolean isStudent = applicant.getRole() == User.Role.STUDENT
                || (applicant.getClassSection() != null && !applicant.getClassSection().isBlank());
        if (!isStudent) {
            return;
        }

        String classSection = applicant.getClassSection();
        LocalDate cur = leave.getFromDate();
        LocalDate end = leave.getToDate() != null ? leave.getToDate() : leave.getFromDate();

        while (!cur.isAfter(end)) {
            Timetable.Day ttDay = getTimetableDay(cur.getDayOfWeek());
            if (ttDay != null && classSection != null) {
                List<Timetable> slots = timetableRepository.findByClassSectionAndDayAndIsActiveTrueOrderByPeriodAsc(classSection, ttDay);
                for (Timetable slot : slots) {
                    if (slot.getPeriod() == null || slot.getPeriod() > 6) continue;
                    Optional<Attendance> existing = attendanceRepository.findByStudentIdAndDateAndPeriod(applicant.getId(), cur, slot.getPeriod());
                    Attendance att;
                    if (existing.isPresent()) {
                        att = existing.get();
                        att.setStatus(Attendance.Status.EXCUSED);
                        att.setModificationReason("Approved Leave");
                        att.setCapturedBy(Attendance.CapturedBy.MANUAL);
                        att.setModifiedAt(LocalDateTime.now());
                        if (approvedBy != null) att.setModifiedBy(approvedBy);
                    } else {
                        att = new Attendance();
                        att.setStudent(applicant);
                        att.setDate(cur);
                        att.setPeriod(slot.getPeriod());
                        att.setStatus(Attendance.Status.EXCUSED);
                        att.setModificationReason("Approved Leave");
                        att.setCapturedBy(Attendance.CapturedBy.MANUAL);
                        att.setRecordedBy(approvedBy);
                        att.setSubject(slot.getSubject());
                        att.setTimetable(slot);
                    }
                    attendanceRepository.save(att);
                }
            }

            createParentAbsenceNotification(applicant, cur, leave.getReason());
            cur = cur.plusDays(1);
        }
    }

    private Timetable.Day getTimetableDay(DayOfWeek dow) {
        switch (dow) {
            case MONDAY: return Timetable.Day.MON;
            case TUESDAY: return Timetable.Day.TUE;
            case WEDNESDAY: return Timetable.Day.WED;
            case THURSDAY: return Timetable.Day.THU;
            case FRIDAY: return Timetable.Day.FRI;
            case SATURDAY: return Timetable.Day.SAT;
            default: return null;
        }
    }

    private void createParentAbsenceNotification(User student, LocalDate date, String reason) {
        User parent = null;
        if (student.getParentId() != null) {
            parent = userRepository.findById(student.getParentId()).orElse(null);
        }
        if (parent == null) {
            List<User> allParents = userRepository.findByRole(User.Role.PARENT);
            for (User p : allParents) {
                if (p.getChildren() != null && p.getChildren().stream().anyMatch(c -> c.getId().equals(student.getId()))) {
                    parent = p;
                    break;
                }
            }
        }

        if (parent != null) {
            String formattedDate = date.format(DateTimeFormatter.ofPattern("d MMMM yyyy", Locale.ENGLISH));
            String displayReason = (reason != null && !reason.trim().isEmpty()) ? reason.trim() : "Approved Leave";

            Notification notif = new Notification();
            notif.setParent(parent);
            notif.setRecipient(parent);
            notif.setTitle("Attendance Alert — " + student.getName());
            notif.setType("ATTENDANCE_ALERT");
            notif.setMessage(student.getName() + " was absent from school on " + formattedDate + ".\n\nReason: " + displayReason + "\n\nClass: " + (student.getClassSection() != null ? student.getClassSection() : "8A"));
            notif.setChannel("IN_APP");
            notif.setReadStatus(false);
            notif.setReadFlag(false);
            notif.setCreatedAt(LocalDateTime.now());
            notificationRepository.save(notif);
        }
    }

    // FR6 & Appendix H: reject leave with documented reason
    public LeaveApplication reject(Long leaveId, User approvedBy, String reason) {
        LeaveApplication leave = getById(leaveId);
        leave.setStatus(LeaveApplication.Status.REJECTED);
        leave.setApprovedBy(approvedBy);
        if (reason != null && !reason.trim().isEmpty()) {
            leave.setRejectionReason(reason.trim());
        }
        return leaveApplicationRepository.save(leave);
    }

    public LeaveApplication getById(Long id) {
        return leaveApplicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Leave application not found with id: " + id));
    }

    /**
     * FR6: Substitution engine - suggests teachers who are FREE (no class
     * scheduled) at every day+period the absent teacher normally teaches.
     * Simple, explainable approach:
     *   1. Get all timetable slots of the absent teacher.
     *   2. For each slot, get every OTHER teacher already busy at that slot.
     *   3. Any teacher never found "busy" across all those slots is a valid substitute.
     */
    public List<User> suggestSubstitutes(Long absentTeacherId, List<User> allTeachers) {
        List<Timetable> absentTeacherSlots = timetableRepository.findByTeacherIdAndIsActiveTrue(absentTeacherId);

        List<User> candidates = new ArrayList<>(allTeachers);
        candidates.removeIf(t -> t.getId().equals(absentTeacherId));

        for (Timetable slot : absentTeacherSlots) {
            List<Timetable> busyAtThisSlot =
                    timetableRepository.findByDayAndPeriodAndIsActiveTrue(slot.getDay(), slot.getPeriod());

            List<Long> busyTeacherIds = busyAtThisSlot.stream()
                    .map(t -> t.getTeacher().getId())
                    .collect(Collectors.toList());

            candidates.removeIf(t -> busyTeacherIds.contains(t.getId()));
        }
        return candidates;
    }
}
