package com.examly.springapp.controller;

import com.examly.springapp.dto.ExamResultDTO;
import com.examly.springapp.dto.PublishReportCardRequest;
import com.examly.springapp.dto.ReportCardDTO;
import com.examly.springapp.dto.SaveExamMarksRequest;
import com.examly.springapp.entity.User;
import com.examly.springapp.service.ReportCardService;
import com.examly.springapp.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/report-cards")
@CrossOrigin(origins = "*")
public class ReportCardController {

    private final ReportCardService reportCardService;
    private final UserService userService;

    public ReportCardController(ReportCardService reportCardService, UserService userService) {
        this.reportCardService = reportCardService;
        this.userService = userService;
    }

    // ----------------------------------------------------
    // GET STUDENT REPORT CARD
    // ----------------------------------------------------
    @GetMapping("/student/{studentId}")
    public ResponseEntity<ReportCardDTO> getStudentReportCard(
            @PathVariable Long studentId,
            @RequestParam(required = false) String examName,
            @RequestParam(required = false) String academicYear,
            Authentication auth) {

        User currentUser = userService.getUserByEmail(auth.getName());
        boolean isTeacherOrAdmin = currentUser.getRole() == User.Role.ADMIN ||
                currentUser.getRole() == User.Role.PRINCIPAL ||
                currentUser.getRole() == User.Role.TEACHER ||
                currentUser.getRole() == User.Role.CLASS_TEACHER;

        if (currentUser.getRole() == User.Role.STUDENT) {
            if (!currentUser.getId().equals(studentId)) {
                throw new AccessDeniedException("Students can only view their own report card");
            }
        } else if (currentUser.getRole() == User.Role.PARENT) {
            reportCardService.validateParentChildAccess(currentUser.getId(), studentId);
        }

        boolean parentView = currentUser.getRole() == User.Role.PARENT;
        return ResponseEntity.ok(
                reportCardService.getReportCard(studentId, examName, academicYear, parentView)
        );
    }

    // ----------------------------------------------------
    // GET AVAILABLE EXAMS FOR STUDENT
    // ----------------------------------------------------
    @GetMapping("/student/{studentId}/exams")
    public ResponseEntity<List<String>> getStudentExams(
            @PathVariable Long studentId,
            Authentication auth) {

        User currentUser = userService.getUserByEmail(auth.getName());
        if (currentUser.getRole() == User.Role.STUDENT && !currentUser.getId().equals(studentId)) {
            throw new AccessDeniedException("Access denied to another student's exams");
        } else if (currentUser.getRole() == User.Role.PARENT) {
            reportCardService.validateParentChildAccess(currentUser.getId(), studentId);
        }

        return ResponseEntity.ok(reportCardService.getAvailableExamNames(studentId));
    }

    // ----------------------------------------------------
    // GET ALL DISTINCT EXAMS
    // ----------------------------------------------------
    @GetMapping("/exams")
    public ResponseEntity<List<String>> getAllExams() {
        return ResponseEntity.ok(reportCardService.getAllExams());
    }

    // ----------------------------------------------------
    // ENTER / SAVE EXAM MARKS (TEACHER / ADMIN)
    // ----------------------------------------------------
    @PostMapping("/marks")
    @PreAuthorize("hasAnyRole('TEACHER', 'CLASS_TEACHER', 'ADMIN', 'PRINCIPAL')")
    public ResponseEntity<ExamResultDTO> saveMarks(
            @RequestBody SaveExamMarksRequest request,
            Authentication auth) {

        User currentUser = userService.getUserByEmail(auth.getName());
        ExamResultDTO dto = reportCardService.saveExamMarks(request, currentUser.getId());
        return ResponseEntity.ok(dto);
    }

    // ----------------------------------------------------
    // PUBLISH REPORT CARD (TEACHER / ADMIN)
    // ----------------------------------------------------
    @PostMapping("/publish")
    @PreAuthorize("hasAnyRole('TEACHER', 'CLASS_TEACHER', 'ADMIN', 'PRINCIPAL')")
    public ResponseEntity<ReportCardDTO> publishReportCard(
            @RequestBody PublishReportCardRequest request,
            Authentication auth) {

        User currentUser = userService.getUserByEmail(auth.getName());
        ReportCardDTO dto = reportCardService.publishReportCard(request, currentUser.getId());
        return ResponseEntity.ok(dto);
    }
}
