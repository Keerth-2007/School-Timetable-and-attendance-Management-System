package com.examly.springapp.service;

import com.examly.springapp.dto.AssignmentDTO;
import com.examly.springapp.dto.AssignmentSubmissionDTO;
import com.examly.springapp.dto.GradeRequest;
import com.examly.springapp.entity.*;
import com.examly.springapp.exception.ResourceNotFoundException;
import com.examly.springapp.exception.UnauthorisedAccessException;
import com.examly.springapp.repository.*;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final AssignmentSubmissionRepository submissionRepository;
    private final UserRepository userRepository;
    private final SubjectRepository subjectRepository;
    private final NotificationRepository notificationRepository;
    private final AcademicEventRepository academicEventRepository;
    private final FileStorageService fileStorageService;

    public AssignmentService(
            AssignmentRepository assignmentRepository,
            AssignmentSubmissionRepository submissionRepository,
            UserRepository userRepository,
            SubjectRepository subjectRepository,
            NotificationRepository notificationRepository,
            AcademicEventRepository academicEventRepository,
            FileStorageService fileStorageService) {
        this.assignmentRepository = assignmentRepository;
        this.submissionRepository = submissionRepository;
        this.userRepository = userRepository;
        this.subjectRepository = subjectRepository;
        this.notificationRepository = notificationRepository;
        this.academicEventRepository = academicEventRepository;
        this.fileStorageService = fileStorageService;
    }

    // ----------------------------------------------------
    // TEACHER: CREATE ASSIGNMENT
    // ----------------------------------------------------
    public AssignmentDTO createAssignment(
            String title,
            String description,
            String instructions,
            String classSection,
            Long subjectId,
            Long teacherId,
            LocalDate assignedDate,
            LocalDate dueDate,
            String dueTime,
            Integer totalPoints,
            MultipartFile attachment) {

        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher not found with id: " + teacherId));

        Subject subject = null;
        if (subjectId != null) {
            subject = subjectRepository.findById(subjectId)
                    .orElseThrow(() -> new ResourceNotFoundException("Subject not found with id: " + subjectId));
        }

        Assignment assignment = new Assignment();
        assignment.setTitle(title);
        assignment.setDescription(description);
        assignment.setInstructions(instructions);
        assignment.setClassSection(classSection);
        assignment.setSubject(subject);
        assignment.setAssignedBy(teacher);
        assignment.setAssignedDate(assignedDate != null ? assignedDate : LocalDate.now());
        assignment.setDueDate(dueDate);
        assignment.setDueTime(dueTime != null && !dueTime.isBlank() ? dueTime : "23:59");
        assignment.setTotalPoints(totalPoints != null ? totalPoints : 20);
        assignment.setStatus("PUBLISHED");
        assignment.setAcademicYear("2026-2027");

        // Compute deadline
        LocalTime time = LocalTime.of(23, 59);
        if (assignment.getDueTime() != null) {
            try {
                time = LocalTime.parse(assignment.getDueTime(), DateTimeFormatter.ofPattern("HH:mm"));
            } catch (Exception ignored) {
                try {
                    time = LocalTime.parse(assignment.getDueTime());
                } catch (Exception ignored2) {}
            }
        }
        assignment.setDeadline(LocalDateTime.of(dueDate, time));

        // Handle teacher attachment if present
        if (attachment != null && !attachment.isEmpty()) {
            String storedFileName = fileStorageService.storeFile(attachment, "q_" + (classSection != null ? classSection : "all"));
            assignment.setAttachmentUrl(storedFileName);
            assignment.setAttachmentName(attachment.getOriginalFilename());
        }

        Assignment saved = assignmentRepository.save(assignment);

        // 1. Dispatch in-app notifications to all students in the class
        List<User> students = userRepository.findByClassSectionAndRole(classSection, User.Role.STUDENT);
        String subjectName = subject != null ? subject.getName() : "Subject";
        String formattedDeadline = dueDate.format(DateTimeFormatter.ofPattern("dd MMMM yyyy")) + ", " + assignment.getDueTime();

        for (User student : students) {
            Notification studentNotif = new Notification();
            studentNotif.setRecipient(student);
            studentNotif.setType("ASSIGNMENT");
            studentNotif.setTitle("📝 New Assignment: " + subjectName);
            studentNotif.setMessage(String.format("New %s assignment '%s' has been assigned by %s. Deadline: %s. Max Marks: %d.",
                    subjectName, title, teacher.getName(), formattedDeadline, saved.getTotalPoints()));
            studentNotif.setCreatedAt(LocalDateTime.now());
            notificationRepository.save(studentNotif);

            // Notify parents of this student
            List<User> parents = userRepository.findParentsByStudentId(student.getId());
            for (User parent : parents) {
                Notification parentNotif = new Notification();
                parentNotif.setRecipient(parent);
                parentNotif.setParent(parent);
                parentNotif.setType("ASSIGNMENT");
                parentNotif.setTitle("📝 New Assignment for " + student.getName());
                parentNotif.setMessage(String.format("New %s assignment '%s' assigned to %s. Deadline: %s.",
                        subjectName, title, student.getName(), formattedDeadline));
                parentNotif.setCreatedAt(LocalDateTime.now());
                notificationRepository.save(parentNotif);
            }
        }

        // 2. Integrate with Academic Calendar (Requirement 28)
        try {
            AcademicEvent event = new AcademicEvent();
            event.setTitle("📝 " + subjectName + " Assignment Deadline: " + title);
            event.setDescription("Assignment deadline: " + title + " (" + subjectName + "). Instructions: " + instructions);
            event.setEventType(AcademicEvent.EventType.ASSIGNMENT_DEADLINE);
            event.setStartDate(dueDate);
            event.setEndDate(dueDate);
            event.setStartTime(assignment.getDueTime());
            event.setEndTime(assignment.getDueTime());
            event.setClassSection(classSection);
            event.setSubject(subject);
            event.setTeacher(teacher);
            event.setCreatedBy(teacher);
            event.setTargetAudience(AcademicEvent.TargetAudience.CLASS);
            event.setStatus(AcademicEvent.Status.PUBLISHED);
            event.setAcademicYear("2026-2027");
            academicEventRepository.save(event);
        } catch (Exception ex) {
            // Calendar event creation is best-effort and should not abort assignment creation
            System.err.println("Could not create calendar event for assignment: " + ex.getMessage());
        }

        return mapToDTO(saved, null);
    }

    // ----------------------------------------------------
    // GET SINGLE ASSIGNMENT
    // ----------------------------------------------------
    public AssignmentDTO getAssignmentById(Long id, Long currentUserId) {
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + id));

        return mapToDTO(assignment, currentUserId);
    }

    // ----------------------------------------------------
    // UPDATE ASSIGNMENT
    // ----------------------------------------------------
    public AssignmentDTO updateAssignment(Long id, AssignmentDTO updateDTO, Long teacherId) {
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + id));

        if (updateDTO.getTitle() != null) assignment.setTitle(updateDTO.getTitle());
        if (updateDTO.getDescription() != null) assignment.setDescription(updateDTO.getDescription());
        if (updateDTO.getInstructions() != null) assignment.setInstructions(updateDTO.getInstructions());
        if (updateDTO.getTotalPoints() != null) assignment.setTotalPoints(updateDTO.getTotalPoints());
        if (updateDTO.getDueDate() != null) {
            assignment.setDueDate(updateDTO.getDueDate());
            LocalTime time = LocalTime.of(23, 59);
            if (updateDTO.getDueTime() != null) assignment.setDueTime(updateDTO.getDueTime());
            try {
                time = LocalTime.parse(assignment.getDueTime());
            } catch (Exception ignored) {}
            assignment.setDeadline(LocalDateTime.of(assignment.getDueDate(), time));
        }

        Assignment saved = assignmentRepository.save(assignment);
        return mapToDTO(saved, teacherId);
    }

    // ----------------------------------------------------
    // DELETE ASSIGNMENT
    // ----------------------------------------------------
    public void deleteAssignment(Long id) {
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + id));

        // Delete submissions and attached files
        List<AssignmentSubmission> submissions = submissionRepository.findByAssignmentId(id);
        for (AssignmentSubmission sub : submissions) {
            if (sub.getAttachmentUrl() != null) {
                fileStorageService.deleteFile(sub.getAttachmentUrl());
            }
        }
        submissionRepository.deleteAll(submissions);

        if (assignment.getAttachmentUrl() != null) {
            fileStorageService.deleteFile(assignment.getAttachmentUrl());
        }

        assignmentRepository.delete(assignment);
    }

    // ----------------------------------------------------
    // TEACHER: LIST ASSIGNMENTS WITH SUBMISSION METRICS
    // ----------------------------------------------------
    public List<AssignmentDTO> getTeacherAssignments(Long teacherId) {
        List<Assignment> assignments;
        User user = userRepository.findById(teacherId).orElse(null);
        if (user != null && (user.getRole() == User.Role.ADMIN || user.getRole() == User.Role.PRINCIPAL)) {
            assignments = assignmentRepository.findAll();
        } else {
            assignments = assignmentRepository.findByAssignedByIdOrderByCreatedAtDesc(teacherId);
        }

        return assignments.stream().map(a -> {
            AssignmentDTO dto = mapToDTO(a, null);
            List<User> students = userRepository.findByClassSectionAndRole(a.getClassSection(), User.Role.STUDENT);
            List<AssignmentSubmission> subs = submissionRepository.findByAssignmentId(a.getId());

            int totalStudents = students.size();
            int submittedCount = subs.size();
            int gradedCount = (int) subs.stream().filter(s -> "GRADED".equalsIgnoreCase(s.getStatus())).count();
            int pendingGradingCount = submittedCount - gradedCount;
            int notSubmittedCount = Math.max(0, totalStudents - submittedCount);

            dto.setTotalStudents(totalStudents);
            dto.setSubmittedCount(submittedCount);
            dto.setGradedCount(gradedCount);
            dto.setPendingGradingCount(pendingGradingCount);
            dto.setNotSubmittedCount(notSubmittedCount);

            return dto;
        }).collect(Collectors.toList());
    }

    // ----------------------------------------------------
    // TEACHER: GET ALL SUBMISSIONS FOR AN ASSIGNMENT
    // ----------------------------------------------------
    public List<AssignmentSubmissionDTO> getAssignmentSubmissions(Long assignmentId) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + assignmentId));

        List<User> students = userRepository.findByClassSectionAndRole(assignment.getClassSection(), User.Role.STUDENT);
        List<AssignmentSubmission> submissions = submissionRepository.findByAssignmentId(assignmentId);

        Map<Long, AssignmentSubmission> subMap = submissions.stream()
                .collect(Collectors.toMap(s -> s.getStudent().getId(), s -> s, (s1, s2) -> s1));

        boolean deadlinePassed = LocalDateTime.now().isAfter(assignment.getDeadline());

        List<AssignmentSubmissionDTO> result = new ArrayList<>();
        for (User student : students) {
            AssignmentSubmission sub = subMap.get(student.getId());
            AssignmentSubmissionDTO dto = new AssignmentSubmissionDTO();
            dto.setAssignmentId(assignment.getId());
            dto.setAssignmentTitle(assignment.getTitle());
            dto.setMaxScore((double) assignment.getTotalPoints());
            dto.setStudentId(student.getId());
            dto.setStudentName(student.getName());
            dto.setAdmissionNumber(student.getAdmissionNumber());
            dto.setClassSection(student.getClassSection());

            if (sub != null) {
                dto.setId(sub.getId());
                dto.setSubmittedAt(sub.getSubmittedAt());
                dto.setStatus(sub.getStatus());
                dto.setScore(sub.getScore());
                if (sub.getScore() != null && assignment.getTotalPoints() > 0) {
                    dto.setPercentage((sub.getScore() / assignment.getTotalPoints()) * 100.0);
                }
                dto.setGrade(sub.getGrade());
                dto.setFeedback(sub.getFeedback());
                if (sub.getGradedBy() != null) {
                    dto.setGradedById(sub.getGradedBy().getId());
                    dto.setGradedByName(sub.getGradedBy().getName());
                }
                dto.setGradedAt(sub.getGradedAt());
                dto.setOriginalFilename(sub.getOriginalFilename());
                dto.setFileType(sub.getFileType());
                dto.setFileSize(sub.getFileSize());
                dto.setAttachmentUrl(sub.getAttachmentUrl());
                dto.setSubmissionText(sub.getSubmissionText());
                dto.setHasFile(sub.getAttachmentUrl() != null && !sub.getAttachmentUrl().isBlank());
            } else {
                dto.setStatus(deadlinePassed ? "OVERDUE" : "PENDING");
                dto.setHasFile(false);
            }

            result.add(dto);
        }

        // Sort: Submitted & Graded first, then PENDING / OVERDUE
        result.sort((a, b) -> {
            boolean aSubmitted = "SUBMITTED".equals(a.getStatus()) || "GRADED".equals(a.getStatus());
            boolean bSubmitted = "SUBMITTED".equals(b.getStatus()) || "GRADED".equals(b.getStatus());
            if (aSubmitted != bSubmitted) return aSubmitted ? -1 : 1;
            return a.getStudentName().compareToIgnoreCase(b.getStudentName());
        });

        return result;
    }

    // ----------------------------------------------------
    // TEACHER: GRADE STUDENT SUBMISSION
    // ----------------------------------------------------
    public AssignmentSubmissionDTO gradeSubmission(Long submissionId, Long teacherId, GradeRequest req) {
        AssignmentSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found with id: " + submissionId));

        Assignment assignment = submission.getAssignment();
        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher not found with id: " + teacherId));

        Double maxScore = (double) assignment.getTotalPoints();
        Double marks = req.getMarks();

        if (marks == null) {
            throw new IllegalArgumentException("Marks are required for grading.");
        }
        if (marks < 0) {
            throw new IllegalArgumentException("Marks cannot be negative.");
        }
        if (marks > maxScore) {
            throw new IllegalArgumentException("Marks (" + marks + ") cannot exceed maximum marks of " + maxScore + ".");
        }

        submission.setScore(marks);
        submission.setMaxScore(maxScore);
        submission.setFeedback(req.getFeedback());
        submission.setGrade(req.getGrade());
        submission.setStatus("GRADED");
        submission.setGradedBy(teacher);
        submission.setGradedAt(LocalDateTime.now());

        AssignmentSubmission saved = submissionRepository.save(submission);

        // Notify student of grading result
        User student = saved.getStudent();
        double pct = (marks / maxScore) * 100.0;
        Notification notif = new Notification();
        notif.setRecipient(student);
        notif.setType("ASSIGNMENT_GRADED");
        notif.setTitle("✅ Assignment Graded: " + assignment.getTitle());
        notif.setMessage(String.format("Your assignment '%s' (%s) was graded by %s. Marks: %.1f / %.0f (%.1f%%). Feedback: \"%s\"",
                assignment.getTitle(),
                assignment.getSubject() != null ? assignment.getSubject().getName() : "Subject",
                teacher.getName(),
                marks, maxScore, pct,
                req.getFeedback() != null ? req.getFeedback() : "Well done."));
        notif.setCreatedAt(LocalDateTime.now());
        notificationRepository.save(notif);

        // Notify parent if linked
        List<User> parents = userRepository.findParentsByStudentId(student.getId());
        for (User parent : parents) {
            Notification parentNotif = new Notification();
            parentNotif.setRecipient(parent);
            parentNotif.setParent(parent);
            parentNotif.setType("ASSIGNMENT_GRADED");
            parentNotif.setTitle("✅ " + student.getName() + "'s Assignment Graded");
            parentNotif.setMessage(String.format("%s's assignment '%s' was graded. Marks: %.1f / %.0f. Feedback: \"%s\"",
                    student.getName(), assignment.getTitle(), marks, maxScore, req.getFeedback() != null ? req.getFeedback() : "Graded"));
            parentNotif.setCreatedAt(LocalDateTime.now());
            notificationRepository.save(parentNotif);
        }

        return mapToSubmissionDTO(saved);
    }

    // ----------------------------------------------------
    // STUDENT: LIST ASSIGNMENTS FOR STUDENT
    // ----------------------------------------------------
    public List<AssignmentDTO> getStudentAssignments(Long studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));

        String classSection = student.getClassSection();
        if (classSection == null || classSection.isBlank()) {
            return Collections.emptyList();
        }

        List<Assignment> assignments = assignmentRepository.findByClassSectionOrderByDeadlineAsc(classSection);
        return assignments.stream()
                .map(a -> mapToDTO(a, studentId))
                .collect(Collectors.toList());
    }

    // ----------------------------------------------------
    // STUDENT: SUBMIT ASSIGNMENT (WITH STRICT DEADLINE CHECK)
    // ----------------------------------------------------
    public AssignmentSubmissionDTO submitAssignment(Long assignmentId, Long studentId, MultipartFile file, String submissionText) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + assignmentId));

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));

        // Enforce student belongs to class section
        if (student.getClassSection() == null || !student.getClassSection().equalsIgnoreCase(assignment.getClassSection())) {
            throw new UnauthorisedAccessException("You are not enrolled in class section " + assignment.getClassSection());
        }

        LocalDateTime now = LocalDateTime.now();

        // STRICT SERVER-SIDE DEADLINE ENFORCEMENT (Requirement 6 & 7)
        if (now.isAfter(assignment.getDeadline())) {
            throw new IllegalArgumentException("Submission closed. The deadline has passed (" +
                    assignment.getDeadline().format(DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a")) + ").");
        }

        // File is required
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Please select a valid assignment file to upload.");
        }

        // Validate file type & size via FileStorageService
        fileStorageService.validateFile(file);

        // Store file securely
        String storedFileName = fileStorageService.storeFile(file, "a" + assignmentId + "_s" + studentId);

        // Check if student already submitted (allow resubmission before deadline per Requirement 9)
        Optional<AssignmentSubmission> existingOpt = submissionRepository.findByAssignmentIdAndStudentId(assignmentId, studentId);
        AssignmentSubmission submission;

        if (existingOpt.isPresent()) {
            submission = existingOpt.get();
            // Delete old file if present
            if (submission.getAttachmentUrl() != null) {
                fileStorageService.deleteFile(submission.getAttachmentUrl());
            }
        } else {
            submission = new AssignmentSubmission();
            submission.setAssignment(assignment);
            submission.setStudent(student);
        }

        submission.setSubmittedAt(now);
        submission.setStatus("SUBMITTED");
        submission.setAttachmentUrl(storedFileName);
        submission.setOriginalFilename(file.getOriginalFilename());
        submission.setFileType(file.getContentType());
        submission.setFileSize(file.getSize());
        submission.setMaxScore((double) assignment.getTotalPoints());
        if (submissionText != null && !submissionText.isBlank()) {
            submission.setSubmissionText(submissionText);
        }

        AssignmentSubmission saved = submissionRepository.save(submission);
        return mapToSubmissionDTO(saved);
    }

    // ----------------------------------------------------
    // GET STUDENT SUBMISSION
    // ----------------------------------------------------
    public Optional<AssignmentSubmissionDTO> getStudentSubmission(Long assignmentId, Long studentId) {
        return submissionRepository.findByAssignmentIdAndStudentId(assignmentId, studentId)
                .map(this::mapToSubmissionDTO);
    }

    // ----------------------------------------------------
    // PARENT: GET CHILD ASSIGNMENTS
    // ----------------------------------------------------
    public List<AssignmentDTO> getChildAssignments(Long parentId, Long studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));

        return getStudentAssignments(student.getId());
    }

    // ----------------------------------------------------
    // FILE DOWNLOAD & RETRIEVAL WITH AUTHORIZATION
    // ----------------------------------------------------
    public Resource loadSubmissionFile(Long submissionId, Long currentUserId, String userRole) {
        AssignmentSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found with id: " + submissionId));

        // Authorization check: Student owner, Teacher who assigned, Parent, Admin/Principal
        boolean isOwner = submission.getStudent().getId().equals(currentUserId);
        boolean isAssignedTeacher = submission.getAssignment().getAssignedBy() != null &&
                submission.getAssignment().getAssignedBy().getId().equals(currentUserId);
        boolean isAdmin = "ROLE_ADMIN".equals(userRole) || "ADMIN".equals(userRole) ||
                "ROLE_PRINCIPAL".equals(userRole) || "PRINCIPAL".equals(userRole);

        boolean isParent = false;
        if ("ROLE_PARENT".equals(userRole) || "PARENT".equals(userRole)) {
            List<User> parents = userRepository.findParentsByStudentId(submission.getStudent().getId());
            isParent = parents.stream().anyMatch(p -> p.getId().equals(currentUserId));
        }

        if (!isOwner && !isAssignedTeacher && !isAdmin && !isParent) {
            throw new UnauthorisedAccessException("You are not authorized to view or download this submission file.");
        }

        if (submission.getAttachmentUrl() == null || submission.getAttachmentUrl().isBlank()) {
            throw new ResourceNotFoundException("No file attached to this submission.");
        }

        return fileStorageService.loadFileAsResource(submission.getAttachmentUrl());
    }

    public Resource loadAssignmentAttachment(Long assignmentId) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + assignmentId));

        if (assignment.getAttachmentUrl() == null || assignment.getAttachmentUrl().isBlank()) {
            throw new ResourceNotFoundException("No question attachment found for this assignment.");
        }

        return fileStorageService.loadFileAsResource(assignment.getAttachmentUrl());
    }

    public AssignmentSubmission getSubmissionEntity(Long submissionId) {
        return submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found with id: " + submissionId));
    }

    public Assignment getAssignmentEntity(Long assignmentId) {
        return assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + assignmentId));
    }

    // ----------------------------------------------------
    // MAPPER HELPERS
    // ----------------------------------------------------
    private AssignmentDTO mapToDTO(Assignment a, Long studentId) {
        AssignmentDTO dto = new AssignmentDTO();
        dto.setId(a.getId());
        dto.setTitle(a.getTitle());
        dto.setDescription(a.getDescription());
        dto.setInstructions(a.getInstructions());
        dto.setClassSection(a.getClassSection());

        if (a.getSubject() != null) {
            dto.setSubjectId(a.getSubject().getId());
            dto.setSubjectName(a.getSubject().getName());
            dto.setSubjectCode(a.getSubject().getCode());
        }

        if (a.getAssignedBy() != null) {
            dto.setTeacherId(a.getAssignedBy().getId());
            dto.setTeacherName(a.getAssignedBy().getName());
        }

        dto.setAssignedDate(a.getAssignedDate());
        dto.setDueDate(a.getDueDate());
        dto.setDueTime(a.getDueTime());
        dto.setDeadline(a.getDeadline());
        dto.setTotalPoints(a.getTotalPoints());

        dto.setAttachmentUrl(a.getAttachmentUrl());
        dto.setAttachmentName(a.getAttachmentName());
        dto.setStatus(a.getStatus());
        dto.setAcademicYear(a.getAcademicYear());
        dto.setCreatedAt(a.getCreatedAt());
        dto.setUpdatedAt(a.getUpdatedAt());

        boolean deadlinePassed = LocalDateTime.now().isAfter(a.getDeadline());
        dto.setIsOverdue(deadlinePassed);

        // Student-specific submission enrichment
        if (studentId != null) {
            Optional<AssignmentSubmission> subOpt = submissionRepository.findByAssignmentIdAndStudentId(a.getId(), studentId);
            if (subOpt.isPresent()) {
                AssignmentSubmission sub = subOpt.get();
                dto.setSubmissionId(sub.getId());
                dto.setSubmissionStatus(sub.getStatus());
                dto.setSubmittedAt(sub.getSubmittedAt());
                dto.setScore(sub.getScore());
                if (sub.getScore() != null && a.getTotalPoints() > 0) {
                    dto.setPercentage((sub.getScore() / a.getTotalPoints()) * 100.0);
                }
                dto.setGrade(sub.getGrade());
                dto.setFeedback(sub.getFeedback());
                dto.setGradedAt(sub.getGradedAt());
                dto.setSubmittedFileName(sub.getOriginalFilename());
                dto.setSubmittedFileSize(sub.getFileSize());
                dto.setCanSubmit(!deadlinePassed);
            } else {
                dto.setSubmissionStatus(deadlinePassed ? "OVERDUE" : "PENDING");
                dto.setCanSubmit(!deadlinePassed);
            }
        } else {
            dto.setSubmissionStatus(deadlinePassed ? "OVERDUE" : "PENDING");
            dto.setCanSubmit(!deadlinePassed);
        }

        return dto;
    }

    private AssignmentSubmissionDTO mapToSubmissionDTO(AssignmentSubmission sub) {
        AssignmentSubmissionDTO dto = new AssignmentSubmissionDTO();
        dto.setId(sub.getId());
        dto.setAssignmentId(sub.getAssignment().getId());
        dto.setAssignmentTitle(sub.getAssignment().getTitle());
        dto.setMaxScore((double) sub.getAssignment().getTotalPoints());

        dto.setStudentId(sub.getStudent().getId());
        dto.setStudentName(sub.getStudent().getName());
        dto.setAdmissionNumber(sub.getStudent().getAdmissionNumber());
        dto.setClassSection(sub.getStudent().getClassSection());

        dto.setSubmittedAt(sub.getSubmittedAt());
        dto.setStatus(sub.getStatus());
        dto.setScore(sub.getScore());
        if (sub.getScore() != null && sub.getAssignment().getTotalPoints() > 0) {
            dto.setPercentage((sub.getScore() / sub.getAssignment().getTotalPoints()) * 100.0);
        }
        dto.setGrade(sub.getGrade());
        dto.setFeedback(sub.getFeedback());

        if (sub.getGradedBy() != null) {
            dto.setGradedById(sub.getGradedBy().getId());
            dto.setGradedByName(sub.getGradedBy().getName());
        }
        dto.setGradedAt(sub.getGradedAt());

        dto.setOriginalFilename(sub.getOriginalFilename());
        dto.setFileType(sub.getFileType());
        dto.setFileSize(sub.getFileSize());
        dto.setAttachmentUrl(sub.getAttachmentUrl());
        dto.setSubmissionText(sub.getSubmissionText());
        dto.setHasFile(sub.getAttachmentUrl() != null && !sub.getAttachmentUrl().isBlank());

        return dto;
    }
}
