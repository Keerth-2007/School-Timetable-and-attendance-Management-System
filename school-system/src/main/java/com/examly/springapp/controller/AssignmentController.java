package com.examly.springapp.controller;

import com.examly.springapp.dto.AssignmentDTO;
import com.examly.springapp.dto.AssignmentSubmissionDTO;
import com.examly.springapp.dto.GradeRequest;
import com.examly.springapp.entity.Assignment;
import com.examly.springapp.entity.AssignmentSubmission;
import com.examly.springapp.entity.User;
import com.examly.springapp.service.AssignmentService;
import com.examly.springapp.service.UserService;
import org.springframework.core.io.Resource;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/assignments")
@CrossOrigin(origins = "*")
public class AssignmentController {

    private final AssignmentService assignmentService;
    private final UserService userService;

    public AssignmentController(AssignmentService assignmentService, UserService userService) {
        this.assignmentService = assignmentService;
        this.userService = userService;
    }

    private Long getCurrentUserId(Authentication auth) {
        if (auth != null && auth.getDetails() instanceof Long) {
            return (Long) auth.getDetails();
        }
        if (auth != null && auth.getName() != null) {
            User user = userService.getUserByEmail(auth.getName());
            if (user != null) return user.getId();
        }
        return null;
    }

    private String getCurrentUserRole(Authentication auth) {
        if (auth != null && !auth.getAuthorities().isEmpty()) {
            return auth.getAuthorities().iterator().next().getAuthority();
        }
        return "ROLE_STUDENT";
    }

    // ----------------------------------------------------
    // TEACHER: CREATE ASSIGNMENT (Multipart Form Data)
    // ----------------------------------------------------
    @PostMapping(consumes = {MediaType.MULTIPART_FORM_DATA_VALUE})
    @PreAuthorize("hasAnyRole('TEACHER', 'CLASS_TEACHER', 'ADMIN', 'PRINCIPAL')")
    public ResponseEntity<AssignmentDTO> createAssignment(
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "instructions", required = false) String instructions,
            @RequestParam("classSection") String classSection,
            @RequestParam("subjectId") Long subjectId,
            @RequestParam(value = "teacherId", required = false) Long teacherId,
            @RequestParam(value = "assignedDate", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate assignedDate,
            @RequestParam("dueDate")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dueDate,
            @RequestParam(value = "dueTime", required = false, defaultValue = "23:59") String dueTime,
            @RequestParam(value = "totalPoints", required = false, defaultValue = "20") Integer totalPoints,
            @RequestParam(value = "attachment", required = false) MultipartFile attachment,
            Authentication auth) {

        Long effectiveTeacherId = teacherId != null ? teacherId : getCurrentUserId(auth);
        if (effectiveTeacherId == null) {
            effectiveTeacherId = getCurrentUserId(auth);
        }

        AssignmentDTO created = assignmentService.createAssignment(
                title, description, instructions, classSection, subjectId,
                effectiveTeacherId, assignedDate, dueDate, dueTime, totalPoints, attachment
        );

        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    // ----------------------------------------------------
    // GET ASSIGNMENT BY ID
    // ----------------------------------------------------
    @GetMapping("/{id}")
    public ResponseEntity<AssignmentDTO> getAssignment(@PathVariable Long id, Authentication auth) {
        Long userId = getCurrentUserId(auth);
        return ResponseEntity.ok(assignmentService.getAssignmentById(id, userId));
    }

    // ----------------------------------------------------
    // UPDATE ASSIGNMENT
    // ----------------------------------------------------
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('TEACHER', 'CLASS_TEACHER', 'ADMIN', 'PRINCIPAL')")
    public ResponseEntity<AssignmentDTO> updateAssignment(
            @PathVariable Long id,
            @RequestBody AssignmentDTO dto,
            Authentication auth) {
        Long userId = getCurrentUserId(auth);
        return ResponseEntity.ok(assignmentService.updateAssignment(id, dto, userId));
    }

    // ----------------------------------------------------
    // DELETE ASSIGNMENT
    // ----------------------------------------------------
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('TEACHER', 'CLASS_TEACHER', 'ADMIN', 'PRINCIPAL')")
    public ResponseEntity<Void> deleteAssignment(@PathVariable Long id) {
        assignmentService.deleteAssignment(id);
        return ResponseEntity.noContent().build();
    }

    // ----------------------------------------------------
    // TEACHER: GET ASSIGNMENTS LIST WITH METRICS
    // ----------------------------------------------------
    @GetMapping("/teacher/{teacherId}")
    @PreAuthorize("hasAnyRole('TEACHER', 'CLASS_TEACHER', 'ADMIN', 'PRINCIPAL')")
    public ResponseEntity<List<AssignmentDTO>> getTeacherAssignments(@PathVariable Long teacherId) {
        return ResponseEntity.ok(assignmentService.getTeacherAssignments(teacherId));
    }

    // ----------------------------------------------------
    // TEACHER: GET SUBMISSIONS FOR ASSIGNMENT
    // ----------------------------------------------------
    @GetMapping("/{id}/submissions")
    @PreAuthorize("hasAnyRole('TEACHER', 'CLASS_TEACHER', 'ADMIN', 'PRINCIPAL')")
    public ResponseEntity<List<AssignmentSubmissionDTO>> getAssignmentSubmissions(@PathVariable Long id) {
        return ResponseEntity.ok(assignmentService.getAssignmentSubmissions(id));
    }

    // ----------------------------------------------------
    // TEACHER: GRADE SUBMISSION
    // ----------------------------------------------------
    @PostMapping("/submissions/{submissionId}/grade")
    @PreAuthorize("hasAnyRole('TEACHER', 'CLASS_TEACHER', 'ADMIN', 'PRINCIPAL')")
    public ResponseEntity<AssignmentSubmissionDTO> gradeSubmission(
            @PathVariable Long submissionId,
            @RequestBody GradeRequest gradeRequest,
            Authentication auth) {
        Long teacherId = getCurrentUserId(auth);
        return ResponseEntity.ok(assignmentService.gradeSubmission(submissionId, teacherId, gradeRequest));
    }

    // ----------------------------------------------------
    // STUDENT: GET MY ASSIGNMENTS (Auto-detects from JWT)
    // ----------------------------------------------------
    @GetMapping("/my-assignments")
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN', 'PRINCIPAL')")
    public ResponseEntity<List<AssignmentDTO>> getMyAssignments(Authentication auth) {
        Long studentId = getCurrentUserId(auth);
        return ResponseEntity.ok(assignmentService.getStudentAssignments(studentId));
    }

    // ----------------------------------------------------
    // STUDENT: GET ASSIGNMENTS BY STUDENT ID
    // ----------------------------------------------------
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<AssignmentDTO>> getStudentAssignments(@PathVariable Long studentId) {
        return ResponseEntity.ok(assignmentService.getStudentAssignments(studentId));
    }

    // ----------------------------------------------------
    // STUDENT: SUBMIT ASSIGNMENT (WITH SERVER-SIDE DEADLINE)
    // ----------------------------------------------------
    @PostMapping(value = "/{id}/submit", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE})
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
    public ResponseEntity<AssignmentSubmissionDTO> submitAssignment(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "submissionText", required = false) String submissionText,
            Authentication auth) {
        Long studentId = getCurrentUserId(auth);
        AssignmentSubmissionDTO result = assignmentService.submitAssignment(id, studentId, file, submissionText);
        return ResponseEntity.ok(result);
    }

    // ----------------------------------------------------
    // STUDENT: GET OWN SUBMISSION
    // ----------------------------------------------------
    @GetMapping("/{id}/my-submission")
    public ResponseEntity<AssignmentSubmissionDTO> getMySubmission(@PathVariable Long id, Authentication auth) {
        Long studentId = getCurrentUserId(auth);
        Optional<AssignmentSubmissionDTO> submission = assignmentService.getStudentSubmission(id, studentId);
        return submission.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    // ----------------------------------------------------
    // FILE DOWNLOAD: SUBMITTED STUDENT FILE
    // ----------------------------------------------------
    @GetMapping("/submissions/{id}/download")
    public ResponseEntity<Resource> downloadSubmissionFile(@PathVariable Long id, Authentication auth) {
        Long userId = getCurrentUserId(auth);
        String role = getCurrentUserRole(auth);

        Resource fileResource = assignmentService.loadSubmissionFile(id, userId, role);
        AssignmentSubmission entity = assignmentService.getSubmissionEntity(id);

        String filename = entity.getOriginalFilename() != null ? entity.getOriginalFilename() : "submission.pdf";
        String contentType = entity.getFileType() != null ? entity.getFileType() : MediaType.APPLICATION_OCTET_STREAM_VALUE;

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(fileResource);
    }

    // ----------------------------------------------------
    // FILE DOWNLOAD: TEACHER ASSIGNMENT QUESTION ATTACHMENT
    // ----------------------------------------------------
    @GetMapping("/{id}/attachment/download")
    public ResponseEntity<Resource> downloadAttachmentFile(@PathVariable Long id) {
        Resource fileResource = assignmentService.loadAssignmentAttachment(id);
        Assignment entity = assignmentService.getAssignmentEntity(id);

        String filename = entity.getAttachmentName() != null ? entity.getAttachmentName() : "assignment_question.pdf";

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(fileResource);
    }
}
