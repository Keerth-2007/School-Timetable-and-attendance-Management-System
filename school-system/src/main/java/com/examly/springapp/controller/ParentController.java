package com.examly.springapp.controller;

import com.examly.springapp.entity.Attendance;
import com.examly.springapp.entity.Notification;
import com.examly.springapp.entity.User;
import com.examly.springapp.service.AttendanceService;
import com.examly.springapp.service.NotificationService;
import com.examly.springapp.service.UserService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/parent")
@CrossOrigin(origins = "*")
@PreAuthorize("hasAnyRole('PARENT', 'ADMIN')")
public class ParentController {

    private final UserService users;
    private final AttendanceService attendance;
    private final NotificationService notifications;
    private final com.examly.springapp.service.AssignmentService assignmentService;
    private final com.examly.springapp.service.ReportCardService reportCardService;

    public ParentController(
            UserService users,
            AttendanceService attendance,
            NotificationService notifications,
            com.examly.springapp.service.AssignmentService assignmentService,
            com.examly.springapp.service.ReportCardService reportCardService) {

        this.users = users;
        this.attendance = attendance;
        this.notifications = notifications;
        this.assignmentService = assignmentService;
        this.reportCardService = reportCardService;
    }

    // ----------------------------------------------------
    // CHECK PARENT OWNER
    // ----------------------------------------------------

    private void checkOwner(Long parentId, Authentication auth) {

        boolean admin = auth.getAuthorities()
                .stream()
                .anyMatch(a ->
                        a.getAuthority().equals("ROLE_ADMIN"));

        if (admin) {
            return;
        }

        /*
         * Your JWT contains the user ID.
         * Depending on your JwtAuthenticationFilter,
         * the authenticated username may be the email.
         */

        User currentUser = users.getUserByEmail(auth.getName());

        if (!parentId.equals(currentUser.getId())) {
            throw new AccessDeniedException(
                    "You can access only your own parent account");
        }

        if (currentUser.getRole() != User.Role.PARENT) {
            throw new AccessDeniedException(
                    "User is not a parent");
        }
    }

    // ----------------------------------------------------
    // GET CHILDREN
    // ----------------------------------------------------

    @GetMapping("/{parentId}/children")
    public ResponseEntity<List<User>> children(
            @PathVariable Long parentId,
            Authentication auth) {

        checkOwner(parentId, auth);

        return ResponseEntity.ok(
                users.getChildren(parentId)
        );
    }

    // ----------------------------------------------------
    // GET CHILD ATTENDANCE
    // ----------------------------------------------------

    @GetMapping("/{parentId}/child/{studentId}/attendance")
    public ResponseEntity<List<Attendance>> childAttendance(
            @PathVariable Long parentId,
            @PathVariable Long studentId,
            Authentication auth) {

        checkOwner(parentId, auth);

        boolean linked = users.getChildren(parentId)
                .stream()
                .anyMatch(child ->
                        child.getId().equals(studentId));

        if (!linked) {
            throw new AccessDeniedException(
                    "Child is not linked to this parent");
        }

        return ResponseEntity.ok(
                attendance.getByStudent(studentId)
        );
    }

    // ----------------------------------------------------
    // GET CHILD ATTENDANCE PERCENTAGE
    // ----------------------------------------------------

    @GetMapping("/{parentId}/child/{studentId}/attendance/percentage")
    public ResponseEntity<Map<String, Object>> childPercentage(
            @PathVariable Long parentId,
            @PathVariable Long studentId,
            Authentication auth) {

        checkOwner(parentId, auth);

        boolean linked = users.getChildren(parentId)
                .stream()
                .anyMatch(child ->
                        child.getId().equals(studentId));

        if (!linked) {
            throw new AccessDeniedException(
                    "Child is not linked to this parent");
        }

        double percentage =
                attendance.calculateAttendancePercentage(studentId);

        return ResponseEntity.ok(
                Map.of(
                        "studentId", studentId,
                        "attendancePercentage", percentage
                )
        );
    }

    // ----------------------------------------------------
    // GET PARENT NOTIFICATIONS
    // ----------------------------------------------------

    @GetMapping("/{parentId}/notifications")
    public ResponseEntity<List<Notification>> notifications(
            @PathVariable Long parentId,
            Authentication auth) {

        checkOwner(parentId, auth);

        return ResponseEntity.ok(
                notifications.getForParent(parentId)
        );
    }

    // ----------------------------------------------------
    // GET CHILD ASSIGNMENTS
    // ----------------------------------------------------

    @GetMapping("/{parentId}/child/{studentId}/assignments")
    public ResponseEntity<List<com.examly.springapp.dto.AssignmentDTO>> childAssignments(
            @PathVariable Long parentId,
            @PathVariable Long studentId,
            Authentication auth) {

        checkOwner(parentId, auth);

        boolean linked = users.getChildren(parentId)
                .stream()
                .anyMatch(child ->
                        child.getId().equals(studentId));

        if (!linked) {
            throw new AccessDeniedException(
                    "Child is not linked to this parent");
        }

        return ResponseEntity.ok(
                assignmentService.getChildAssignments(parentId, studentId)
        );
    }

    // ----------------------------------------------------
    // GET CHILD REPORT CARD
    // ----------------------------------------------------

    @GetMapping("/{parentId}/child/{studentId}/report-card")
    public ResponseEntity<com.examly.springapp.dto.ReportCardDTO> childReportCard(
            @PathVariable Long parentId,
            @PathVariable Long studentId,
            @RequestParam(required = false) String examName,
            @RequestParam(required = false) String academicYear,
            Authentication auth) {

        checkOwner(parentId, auth);

        boolean linked = users.getChildren(parentId)
                .stream()
                .anyMatch(child ->
                        child.getId().equals(studentId));

        if (!linked) {
            throw new AccessDeniedException(
                    "Child is not linked to this parent");
        }

        return ResponseEntity.ok(
                reportCardService.getReportCardForParent(parentId, studentId, examName, academicYear)
        );
    }

    // ----------------------------------------------------
    // GET CHILD AVAILABLE EXAMS
    // ----------------------------------------------------

    @GetMapping("/{parentId}/child/{studentId}/exams")
    public ResponseEntity<List<String>> childExams(
            @PathVariable Long parentId,
            @PathVariable Long studentId,
            Authentication auth) {

        checkOwner(parentId, auth);

        boolean linked = users.getChildren(parentId)
                .stream()
                .anyMatch(child ->
                        child.getId().equals(studentId));

        if (!linked) {
            throw new AccessDeniedException(
                    "Child is not linked to this parent");
        }

        return ResponseEntity.ok(
                reportCardService.getAvailableExamNames(studentId)
        );
    }

    // ----------------------------------------------------
    // LINK CHILD
    // ----------------------------------------------------

    @PostMapping("/{parentId}/children/{studentId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> linkChild(
            @PathVariable Long parentId,
            @PathVariable Long studentId) {

        return ResponseEntity.ok(
                users.linkChild(parentId, studentId)
        );
    }
}