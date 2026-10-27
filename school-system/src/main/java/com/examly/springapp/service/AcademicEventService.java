package com.examly.springapp.service;

import com.examly.springapp.dto.AcademicEventDTO;
import com.examly.springapp.entity.AcademicEvent;
import com.examly.springapp.entity.LeaveApplication;
import com.examly.springapp.entity.Notification;
import com.examly.springapp.entity.Subject;
import com.examly.springapp.entity.User;
import com.examly.springapp.exception.ResourceNotFoundException;
import com.examly.springapp.repository.AcademicEventRepository;
import com.examly.springapp.repository.LeaveApplicationRepository;
import com.examly.springapp.repository.NotificationRepository;
import com.examly.springapp.repository.SubjectRepository;
import com.examly.springapp.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AcademicEventService {

    private final AcademicEventRepository academicEventRepository;
    private final UserRepository userRepository;
    private final SubjectRepository subjectRepository;
    private final NotificationRepository notificationRepository;
    private final LeaveApplicationRepository leaveApplicationRepository;

    public AcademicEventService(AcademicEventRepository academicEventRepository,
                                UserRepository userRepository,
                                SubjectRepository subjectRepository,
                                NotificationRepository notificationRepository,
                                LeaveApplicationRepository leaveApplicationRepository) {
        this.academicEventRepository = academicEventRepository;
        this.userRepository = userRepository;
        this.subjectRepository = subjectRepository;
        this.notificationRepository = notificationRepository;
        this.leaveApplicationRepository = leaveApplicationRepository;
    }

    // ----------------------------------------------------
    // GET EVENTS WITH ROLE-BASED VISIBILITY & FILTERS
    // ----------------------------------------------------

    @Transactional(readOnly = true)
    public List<AcademicEventDTO> getEvents(User currentUser,
                                           String academicYear,
                                           Integer year,
                                           Integer month,
                                           LocalDate startDate,
                                           LocalDate endDate,
                                           String eventTypeStr,
                                           String classSectionFilter,
                                           String search) {
        // Resolve date range
        LocalDate rangeStart = startDate;
        LocalDate rangeEnd = endDate;

        if (year != null && month != null) {
            YearMonth ym = YearMonth.of(year, month);
            rangeStart = ym.atDay(1);
            rangeEnd = ym.atEndOfMonth();
        } else if (rangeStart == null || rangeEnd == null) {
            // Default to entire academic year or current year window
            int y = (year != null) ? year : (rangeStart != null ? rangeStart.getYear() : 2026);
            rangeStart = LocalDate.of(y, 1, 1);
            rangeEnd = LocalDate.of(y, 12, 31);
        }

        final LocalDate finalStart = rangeStart;
        final LocalDate finalEnd = rangeEnd;

        // Fetch active events from DB
        List<AcademicEvent> events = academicEventRepository.findActiveEventsInDateRange(finalStart, finalEnd);

        // Fetch approved leaves in this range to guarantee leave synchronization
        List<LeaveApplication> approvedLeaves = leaveApplicationRepository
                .findByStatus(LeaveApplication.Status.APPROVED)
                .stream()
                .filter(l -> l.getFromDate() != null && l.getToDate() != null &&
                        !l.getFromDate().isAfter(finalEnd) && !l.getToDate().isBefore(finalStart))
                .collect(Collectors.toList());

        // Merge any approved leave that doesn't already have an event in the list
        Set<Long> existingLeaveIds = events.stream()
                .map(AcademicEvent::getLeaveApplication)
                .filter(Objects::nonNull)
                .map(LeaveApplication::getId)
                .collect(Collectors.toSet());

        for (LeaveApplication l : approvedLeaves) {
            if (!existingLeaveIds.contains(l.getId())) {
                AcademicEvent virtualEvent = mapLeaveToEvent(l);
                events.add(virtualEvent);
            }
        }

        // Filter by Role & Permissions
        List<AcademicEvent> authorizedEvents = events.stream()
                .filter(e -> isUserAuthorizedToView(currentUser, e))
                .collect(Collectors.toList());

        // Apply Academic Year Filter
        if (academicYear != null && !academicYear.trim().isEmpty() && !academicYear.equalsIgnoreCase("ALL")) {
            authorizedEvents = authorizedEvents.stream()
                    .filter(e -> e.getAcademicYear() != null && e.getAcademicYear().equalsIgnoreCase(academicYear.trim()))
                    .collect(Collectors.toList());
        }

        // Apply Event Type Filter
        if (eventTypeStr != null && !eventTypeStr.trim().isEmpty() && !eventTypeStr.equalsIgnoreCase("ALL")) {
            try {
                AcademicEvent.EventType type = AcademicEvent.EventType.valueOf(eventTypeStr.trim().toUpperCase());
                authorizedEvents = authorizedEvents.stream()
                        .filter(e -> e.getEventType() == type)
                        .collect(Collectors.toList());
            } catch (IllegalArgumentException ignored) {
            }
        }

        // Apply Class/Section Filter
        if (classSectionFilter != null && !classSectionFilter.trim().isEmpty() && !classSectionFilter.equalsIgnoreCase("ALL")) {
            authorizedEvents = authorizedEvents.stream()
                    .filter(e -> e.getClassSection() == null || e.getClassSection().equalsIgnoreCase(classSectionFilter.trim()))
                    .collect(Collectors.toList());
        }

        // Apply Search
        if (search != null && !search.trim().isEmpty()) {
            String q = search.trim().toLowerCase();
            authorizedEvents = authorizedEvents.stream()
                    .filter(e -> (e.getTitle() != null && e.getTitle().toLowerCase().contains(q)) ||
                                 (e.getDescription() != null && e.getDescription().toLowerCase().contains(q)) ||
                                 (e.getLocation() != null && e.getLocation().toLowerCase().contains(q)) ||
                                 (e.getClassSection() != null && e.getClassSection().toLowerCase().contains(q)) ||
                                 (e.getSubject() != null && e.getSubject().getName().toLowerCase().contains(q)) ||
                                 (e.getTeacher() != null && e.getTeacher().getName().toLowerCase().contains(q)))
                    .collect(Collectors.toList());
        }

        // Sort chronologically
        authorizedEvents.sort(Comparator.comparing(AcademicEvent::getStartDate)
                .thenComparing(e -> e.getStartTime() != null ? e.getStartTime() : "00:00"));

        // Convert to DTOs with privacy masking for leaves
        return authorizedEvents.stream()
                .map(e -> toDTOWithPrivacy(currentUser, e))
                .collect(Collectors.toList());
    }

    // ----------------------------------------------------
    // GET UPCOMING EVENTS (FOR DASHBOARDS)
    // ----------------------------------------------------

    @Transactional(readOnly = true)
    public List<AcademicEventDTO> getUpcomingEvents(User currentUser, int limit) {
        LocalDate today = LocalDate.now();
        // If system date is outside September 2026 academic window, anchor to 2026-09-01 for demo compatibility
        if (today.isBefore(LocalDate.of(2026, 9, 1)) || today.isAfter(LocalDate.of(2026, 9, 30))) {
            today = LocalDate.of(2026, 9, 1);
        }

        LocalDate futureWindow = today.plusDays(60);
        List<AcademicEventDTO> events = getEvents(currentUser, "2026-2027", null, null, today, futureWindow, null, null, null);

        return events.stream()
                .filter(e -> !e.getStartDate().isBefore(LocalDate.of(2026, 9, 1)))
                .limit(limit > 0 ? limit : 5)
                .collect(Collectors.toList());
    }

    // ----------------------------------------------------
    // GET EVENT BY ID
    // ----------------------------------------------------

    @Transactional(readOnly = true)
    public AcademicEventDTO getEventById(Long id, User currentUser) {
        AcademicEvent event = academicEventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Academic event not found with id: " + id));

        if (!isUserAuthorizedToView(currentUser, event)) {
            throw new org.springframework.security.access.AccessDeniedException("Not authorized to view this calendar event");
        }

        return toDTOWithPrivacy(currentUser, event);
    }

    // ----------------------------------------------------
    // CREATE EVENT (ADMIN / AUTHORIZED)
    // ----------------------------------------------------

    @Transactional
    public AcademicEventDTO createEvent(AcademicEventDTO dto, User creator) {
        if (dto.getTitle() == null || dto.getTitle().trim().isEmpty()) {
            throw new IllegalArgumentException("Event title is required");
        }
        if (dto.getEventType() == null) {
            throw new IllegalArgumentException("Event category/type is required");
        }
        if (dto.getStartDate() == null) {
            throw new IllegalArgumentException("Start date is required");
        }
        if (dto.getEndDate() == null) {
            dto.setEndDate(dto.getStartDate());
        }

        AcademicEvent event = new AcademicEvent();
        event.setTitle(dto.getTitle().trim());
        event.setDescription(dto.getDescription());
        event.setEventType(dto.getEventType());
        event.setStartDate(dto.getStartDate());
        event.setEndDate(dto.getEndDate());
        event.setStartTime(dto.getStartTime());
        event.setEndTime(dto.getEndTime());
        event.setLocation(dto.getLocation());
        event.setAcademicYear(dto.getAcademicYear() != null ? dto.getAcademicYear() : "2026-2027");
        event.setClassSection(dto.getClassSection());
        event.setTargetAudience(dto.getTargetAudience() != null ? dto.getTargetAudience() : AcademicEvent.TargetAudience.ALL);
        event.setStatus(dto.getStatus() != null ? dto.getStatus() : AcademicEvent.Status.PUBLISHED);
        event.setCreatedBy(creator);

        if (dto.getSubjectId() != null) {
            subjectRepository.findById(dto.getSubjectId()).ifPresent(event::setSubject);
        }

        if (dto.getTeacherId() != null) {
            userRepository.findById(dto.getTeacherId()).ifPresent(event::setTeacher);
        }

        AcademicEvent saved = academicEventRepository.save(event);

        // Dispatch notifications if published
        if (saved.getStatus() == AcademicEvent.Status.PUBLISHED) {
            dispatchNotificationsForEvent(saved);
        }

        return AcademicEventDTO.fromEntity(saved);
    }

    // ----------------------------------------------------
    // UPDATE EVENT
    // ----------------------------------------------------

    @Transactional
    public AcademicEventDTO updateEvent(Long id, AcademicEventDTO dto, User updater) {
        AcademicEvent event = academicEventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Academic event not found with id: " + id));

        if (dto.getTitle() != null) event.setTitle(dto.getTitle().trim());
        if (dto.getDescription() != null) event.setDescription(dto.getDescription());
        if (dto.getEventType() != null) event.setEventType(dto.getEventType());
        if (dto.getStartDate() != null) event.setStartDate(dto.getStartDate());
        if (dto.getEndDate() != null) event.setEndDate(dto.getEndDate());
        if (dto.getStartTime() != null) event.setStartTime(dto.getStartTime());
        if (dto.getEndTime() != null) event.setEndTime(dto.getEndTime());
        if (dto.getLocation() != null) event.setLocation(dto.getLocation());
        if (dto.getAcademicYear() != null) event.setAcademicYear(dto.getAcademicYear());
        if (dto.getClassSection() != null) event.setClassSection(dto.getClassSection());
        if (dto.getTargetAudience() != null) event.setTargetAudience(dto.getTargetAudience());
        if (dto.getStatus() != null) event.setStatus(dto.getStatus());

        if (dto.getSubjectId() != null) {
            subjectRepository.findById(dto.getSubjectId()).ifPresent(event::setSubject);
        }

        if (dto.getTeacherId() != null) {
            userRepository.findById(dto.getTeacherId()).ifPresent(event::setTeacher);
        }

        AcademicEvent updated = academicEventRepository.save(event);
        return AcademicEventDTO.fromEntity(updated);
    }

    // ----------------------------------------------------
    // CANCEL EVENT
    // ----------------------------------------------------

    @Transactional
    public AcademicEventDTO cancelEvent(Long id) {
        AcademicEvent event = academicEventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Academic event not found with id: " + id));
        event.setStatus(AcademicEvent.Status.CANCELLED);
        AcademicEvent updated = academicEventRepository.save(event);
        return AcademicEventDTO.fromEntity(updated);
    }

    // ----------------------------------------------------
    // PUBLISH EVENT
    // ----------------------------------------------------

    @Transactional
    public AcademicEventDTO publishEvent(Long id) {
        AcademicEvent event = academicEventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Academic event not found with id: " + id));
        event.setStatus(AcademicEvent.Status.PUBLISHED);
        AcademicEvent updated = academicEventRepository.save(event);
        dispatchNotificationsForEvent(updated);
        return AcademicEventDTO.fromEntity(updated);
    }

    // ----------------------------------------------------
    // DELETE EVENT
    // ----------------------------------------------------

    @Transactional
    public void deleteEvent(Long id) {
        AcademicEvent event = academicEventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Academic event not found with id: " + id));
        academicEventRepository.delete(event);
    }

    // ----------------------------------------------------
    // SYNC APPROVED LEAVE TO CALENDAR
    // ----------------------------------------------------

    @Transactional
    public AcademicEvent syncApprovedLeave(LeaveApplication leave) {
        if (leave == null || leave.getStatus() != LeaveApplication.Status.APPROVED) {
            return null;
        }

        Optional<AcademicEvent> existing = academicEventRepository.findFirstByLeaveApplicationId(leave.getId());
        AcademicEvent event = existing.orElseGet(AcademicEvent::new);

        User applicant = leave.getTeacher();
        boolean isStudent = applicant != null && applicant.getRole() == User.Role.STUDENT;

        if (isStudent) {
            event.setTitle(applicant.getName() + " — Approved Leave");
            event.setEventType(AcademicEvent.EventType.STUDENT_LEAVE);
            event.setTargetAudience(AcademicEvent.TargetAudience.CLASS);
            event.setClassSection(applicant.getClassSection());
            event.setDescription("Approved student leave.");
        } else {
            String staffName = applicant != null ? applicant.getName() : "Staff";
            event.setTitle(staffName + " — Staff Leave");
            event.setEventType(AcademicEvent.EventType.STAFF_LEAVE);
            event.setTargetAudience(AcademicEvent.TargetAudience.TEACHERS);
            event.setDescription("Approved faculty absence.");
        }

        event.setStartDate(leave.getFromDate());
        event.setEndDate(leave.getToDate() != null ? leave.getToDate() : leave.getFromDate());
        event.setStatus(AcademicEvent.Status.PUBLISHED);
        event.setAcademicYear("2026-2027");
        event.setLeaveApplication(leave);
        event.setTeacher(applicant);

        return academicEventRepository.save(event);
    }

    // ----------------------------------------------------
    // CHECK SCHOOL HOLIDAY
    // ----------------------------------------------------

    @Transactional(readOnly = true)
    public boolean isSchoolHoliday(LocalDate date) {
        return academicEventRepository.isSchoolHoliday(date);
    }

    // ----------------------------------------------------
    // WORKING DAYS SUMMARY (FR12)
    // ----------------------------------------------------

    @Transactional(readOnly = true)
    public Map<String, Object> getWorkingDaysSummary(String academicYear, int year, int month) {
        YearMonth ym = YearMonth.of(year, month);
        int totalDays = ym.lengthOfMonth();
        int sundays = 0;
        int holidays = 0;

        List<AcademicEvent> events = academicEventRepository.findByAcademicYear(academicYear != null ? academicYear : "2026-2027");
        Set<LocalDate> holidayDates = new HashSet<>();

        for (AcademicEvent e : events) {
            if (e.getEventType() == AcademicEvent.EventType.HOLIDAY && e.getStatus() == AcademicEvent.Status.PUBLISHED) {
                LocalDate cur = e.getStartDate();
                while (!cur.isAfter(e.getEndDate())) {
                    if (cur.getYear() == year && cur.getMonthValue() == month) {
                        holidayDates.add(cur);
                    }
                    cur = cur.plusDays(1);
                }
            }
        }

        for (int day = 1; day <= totalDays; day++) {
            LocalDate date = ym.atDay(day);
            if (date.getDayOfWeek() == DayOfWeek.SUNDAY) {
                sundays++;
            } else if (holidayDates.contains(date)) {
                holidays++;
            }
        }

        int workingDays = totalDays - sundays - holidays;

        Map<String, Object> res = new HashMap<>();
        res.put("academicYear", academicYear);
        res.put("year", year);
        res.put("month", month);
        res.put("totalDays", totalDays);
        res.put("sundays", sundays);
        res.put("holidays", holidays);
        res.put("workingDays", Math.max(0, workingDays));
        return res;
    }

    // ----------------------------------------------------
    // HELPER: ROLE-BASED ACCESS CHECK
    // ----------------------------------------------------

    private boolean isUserAuthorizedToView(User user, AcademicEvent event) {
        if (user == null) return false;
        User.Role role = user.getRole();

        // Admin and Principal have full access
        if (role == User.Role.ADMIN || role == User.Role.PRINCIPAL) {
            return true;
        }

        // Public school-wide events
        if (event.getTargetAudience() == AcademicEvent.TargetAudience.ALL) {
            return true;
        }

        // Teacher visibility
        if (role == User.Role.TEACHER || role == User.Role.CLASS_TEACHER) {
            if (event.getTargetAudience() == AcademicEvent.TargetAudience.TEACHERS) return true;
            if (event.getTeacher() != null && event.getTeacher().getId().equals(user.getId())) return true;
            if (event.getClassSection() != null && event.getClassSection().equalsIgnoreCase(user.getClassSection())) return true;
            if (event.getEventType() == AcademicEvent.EventType.SPECIAL_CLASS || event.getEventType() == AcademicEvent.EventType.EXAM) {
                return true; // Teachers can see exams and special classes
            }
            if (event.getEventType() == AcademicEvent.EventType.STUDENT_LEAVE && event.getClassSection() != null &&
                    event.getClassSection().equalsIgnoreCase(user.getClassSection())) {
                return true; // Class teacher sees student leave in their class
            }
            return false;
        }

        // Student visibility
        if (role == User.Role.STUDENT) {
            if (event.getTargetAudience() == AcademicEvent.TargetAudience.STUDENTS) return true;
            if (event.getClassSection() != null && event.getClassSection().equalsIgnoreCase(user.getClassSection())) {
                // Class-specific events (Special class, exams, etc.)
                if (event.getEventType() == AcademicEvent.EventType.STUDENT_LEAVE) {
                    // Only see their own approved leave
                    return event.getLeaveApplication() != null &&
                           event.getLeaveApplication().getTeacher() != null &&
                           event.getLeaveApplication().getTeacher().getId().equals(user.getId());
                }
                return true;
            }
            return false;
        }

        // Parent visibility
        if (role == User.Role.PARENT) {
            if (event.getTargetAudience() == AcademicEvent.TargetAudience.PARENTS) return true;
            List<User> children = user.getChildren();
            if (children != null && !children.isEmpty()) {
                Set<String> childClasses = children.stream()
                        .map(User::getClassSection)
                        .filter(Objects::nonNull)
                        .map(String::toUpperCase)
                        .collect(Collectors.toSet());

                Set<Long> childIds = children.stream()
                        .map(User::getId)
                        .collect(Collectors.toSet());

                if (event.getClassSection() != null && childClasses.contains(event.getClassSection().toUpperCase())) {
                    if (event.getEventType() == AcademicEvent.EventType.STUDENT_LEAVE) {
                        return event.getLeaveApplication() != null &&
                               event.getLeaveApplication().getTeacher() != null &&
                               childIds.contains(event.getLeaveApplication().getTeacher().getId());
                    }
                    return true;
                }
            }
            return false;
        }

        return false;
    }

    // ----------------------------------------------------
    // HELPER: MAP LEAVE TO VIRTUAL EVENT
    // ----------------------------------------------------

    private AcademicEvent mapLeaveToEvent(LeaveApplication leave) {
        AcademicEvent e = new AcademicEvent();
        e.setId(100000L + leave.getId());
        User applicant = leave.getTeacher();
        boolean isStudent = applicant != null && applicant.getRole() == User.Role.STUDENT;

        if (isStudent) {
            e.setTitle(applicant.getName() + " — Approved Leave");
            e.setEventType(AcademicEvent.EventType.STUDENT_LEAVE);
            e.setTargetAudience(AcademicEvent.TargetAudience.CLASS);
            e.setClassSection(applicant.getClassSection());
            e.setDescription("Approved student leave.");
        } else {
            String name = applicant != null ? applicant.getName() : "Staff";
            e.setTitle(name + " — Staff Leave");
            e.setEventType(AcademicEvent.EventType.STAFF_LEAVE);
            e.setTargetAudience(AcademicEvent.TargetAudience.TEACHERS);
            e.setDescription("Approved faculty leave.");
        }

        e.setStartDate(leave.getFromDate());
        e.setEndDate(leave.getToDate() != null ? leave.getToDate() : leave.getFromDate());
        e.setStatus(AcademicEvent.Status.PUBLISHED);
        e.setAcademicYear("2026-2027");
        e.setLeaveApplication(leave);
        e.setTeacher(applicant);
        return e;
    }

    // ----------------------------------------------------
    // HELPER: PRIVACY MASKING FOR DTO
    // ----------------------------------------------------

    private AcademicEventDTO toDTOWithPrivacy(User viewer, AcademicEvent event) {
        AcademicEventDTO dto = AcademicEventDTO.fromEntity(event);
        if (event.getEventType() == AcademicEvent.EventType.STUDENT_LEAVE || event.getEventType() == AcademicEvent.EventType.STAFF_LEAVE) {
            boolean isSelf = event.getTeacher() != null && event.getTeacher().getId().equals(viewer.getId());
            boolean isAdmin = viewer.getRole() == User.Role.ADMIN || viewer.getRole() == User.Role.PRINCIPAL;
            boolean isParentOfStudent = false;
            if (viewer.getRole() == User.Role.PARENT && viewer.getChildren() != null && event.getTeacher() != null) {
                isParentOfStudent = viewer.getChildren().stream().anyMatch(c -> c.getId().equals(event.getTeacher().getId()));
            }

            // Hide private diagnostic/medical notes if not self, parent, or admin
            if (!isSelf && !isAdmin && !isParentOfStudent) {
                dto.setDescription("Approved Leave");
            }
        }
        return dto;
    }

    // ----------------------------------------------------
    // HELPER: DISPATCH NOTIFICATIONS
    // ----------------------------------------------------

    private void dispatchNotificationsForEvent(AcademicEvent event) {
        try {
            if (event.getClassSection() == null || event.getClassSection().trim().isEmpty()) {
                return;
            }

            String classSec = event.getClassSection().trim();
            List<User> students = userRepository.findByClassSectionAndRole(classSec, User.Role.STUDENT);

            String notifType = "CALENDAR_EVENT";
            String title = "Academic Update: " + event.getTitle();
            String timeInfo = event.getStartTime() != null ? " at " + event.getStartTime() : "";

            if (event.getEventType() == AcademicEvent.EventType.SPECIAL_CLASS) {
                title = "Special Class: " + event.getTitle();
                notifType = "SPECIAL_CLASS";
            } else if (event.getEventType() == AcademicEvent.EventType.EXAM) {
                title = "Exam Notice: " + event.getTitle();
                notifType = "EXAM";
            } else if (event.getEventType() == AcademicEvent.EventType.MEETING) {
                title = "Meeting Notice: " + event.getTitle();
                notifType = "MEETING";
            }

            for (User student : students) {
                // Notify student
                Notification sNotif = new Notification();
                sNotif.setTitle(title);
                sNotif.setType(notifType);
                sNotif.setMessage(event.getTitle() + " scheduled for Class " + classSec + " on " + event.getStartDate() + timeInfo + ".");
                sNotif.setRecipient(student);
                notificationRepository.save(sNotif);

                // Notify parent if linked
                List<User> parents = userRepository.findParentsByStudentId(student.getId());
                for (User parent : parents) {
                    Notification pNotif = new Notification();
                    pNotif.setTitle(title);
                    pNotif.setType(notifType);
                    pNotif.setMessage(student.getName() + " has " + event.getTitle() + " on " + event.getStartDate() + timeInfo + ".");
                    pNotif.setParent(parent);
                    pNotif.setRecipient(parent);
                    notificationRepository.save(pNotif);
                }
            }

            // Notify assigned teacher
            if (event.getTeacher() != null) {
                Notification tNotif = new Notification();
                tNotif.setTitle(title);
                tNotif.setType(notifType);
                tNotif.setMessage(event.getTitle() + " scheduled for Class " + classSec + " on " + event.getStartDate() + timeInfo + ".");
                tNotif.setRecipient(event.getTeacher());
                notificationRepository.save(tNotif);
            }
        } catch (Exception ex) {
            System.err.println("Failed to dispatch calendar notifications: " + ex.getMessage());
        }
    }
}
