package com.examly.springapp.controller;

import com.examly.springapp.dto.SessionAttendanceRequest;
import com.examly.springapp.dto.StudentMonthlyReportDTO;
import com.examly.springapp.dto.TeacherMonthlySummaryDTO;
import com.examly.springapp.entity.Attendance;
import com.examly.springapp.entity.User;
import com.examly.springapp.service.AttendanceService;
import com.examly.springapp.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/attendance")
@CrossOrigin(origins = "*")
public class AttendanceController {

    @Autowired
    private AttendanceService attendanceService;

    @Autowired
    private UserService userService;

    // ----------------------------------------------------
    // POST /api/attendance/session - Batch mark session attendance
    // ----------------------------------------------------
    @PostMapping("/session")
    @PreAuthorize("hasAnyRole('TEACHER','CLASS_TEACHER','PRINCIPAL','ADMIN')")
    public ResponseEntity<List<Attendance>> markSessionAttendance(
            @RequestBody SessionAttendanceRequest request,
            Authentication authentication) {

        User recordedBy = null;
        if (authentication != null && authentication.getName() != null) {
            try {
                recordedBy = userService.getUserByEmail(authentication.getName());
            } catch (Exception ignored) {}
        }

        List<Attendance> saved = attendanceService.saveSessionAttendance(request, recordedBy);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    // ----------------------------------------------------
    // GET /api/attendance/session - Get attendance by class, date, and period
    // ----------------------------------------------------
    @GetMapping("/session")
    public ResponseEntity<List<Attendance>> getSessionAttendance(
            @RequestParam("classSection") String classSection,
            @RequestParam("date") String date,
            @RequestParam(value = "period", required = false) Integer period) {

        return ResponseEntity.ok(attendanceService.getSessionAttendance(
                classSection,
                LocalDate.parse(date),
                period
        ));
    }

    // ----------------------------------------------------
    // GET /api/attendance/student/{id}/month - Student Monthly Report & Timeline
    // ----------------------------------------------------
    @GetMapping("/student/{id}/month")
    public ResponseEntity<?> getStudentMonthlyReport(
            @PathVariable Long id,
            @RequestParam(value = "year", required = false) Integer year,
            @RequestParam(value = "month", required = false) Integer month,
            Authentication authentication) {

        // Backend Authorization Check (SRS Section 19)
        if (authentication != null && authentication.getName() != null) {
            try {
                User caller = userService.getUserByEmail(authentication.getName());
                if (caller.getRole() == User.Role.STUDENT) {
                    // Enforce that a student always accesses their own attendance record
                    id = caller.getId();
                }
            } catch (Exception ignored) {}
        }

        LocalDate now = LocalDate.now();
        int y = year != null ? year : now.getYear();
        int m = month != null ? month : now.getMonthValue();

        StudentMonthlyReportDTO report = attendanceService.getStudentMonthlyReport(id, y, m);
        return ResponseEntity.ok(report);
    }

    // ----------------------------------------------------
    // GET /api/attendance/summary/monthly - Teacher Monthly Aggregated Summary
    // ----------------------------------------------------
    @GetMapping("/summary/monthly")
    @PreAuthorize("hasAnyRole('TEACHER','CLASS_TEACHER','PRINCIPAL','ADMIN')")
    public ResponseEntity<List<TeacherMonthlySummaryDTO>> getTeacherMonthlySummary(
            @RequestParam(value = "classSection", required = false) String classSection,
            @RequestParam(value = "year", required = false) Integer year,
            @RequestParam(value = "month", required = false) Integer month) {

        LocalDate now = LocalDate.now();
        int y = year != null ? year : now.getYear();
        int m = month != null ? month : now.getMonthValue();

        return ResponseEntity.ok(attendanceService.getTeacherMonthlySummary(classSection, y, m));
    }

    // ----------------------------------------------------
    // Existing Single Record APIs
    // ----------------------------------------------------

    // POST /api/attendance - submit a class attendance record
    @PostMapping
    @PreAuthorize("hasAnyRole('TEACHER','CLASS_TEACHER','PRINCIPAL','ADMIN')")
    public ResponseEntity<Attendance> markAttendance(@RequestBody Attendance attendance) {
        Attendance saved = attendanceService.markAttendance(attendance);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    // GET /api/attendance/class/{classSection}/date/{date}
    @GetMapping({"/class/{classSection}/date/{date}", "/class/{classSection}/date/{date}/"})
    public ResponseEntity<List<Attendance>> getClassAttendance(
            @PathVariable("classSection") String classSection,
            @PathVariable("date") String date) {
        return ResponseEntity.ok(attendanceService.getByClassAndDate(classSection, LocalDate.parse(date)));
    }

    // GET /api/attendance/student/{id}
    @GetMapping("/student/{id}")
    public ResponseEntity<?> getStudentAttendance(
            @PathVariable Long id,
            Authentication authentication) {

        if (authentication != null && authentication.getName() != null) {
            try {
                User caller = userService.getUserByEmail(authentication.getName());
                if (caller.getRole() == User.Role.STUDENT && !caller.getId().equals(id)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body(Map.of("message", "Access denied: Students can only view their own attendance."));
                }
            } catch (Exception ignored) {}
        }

        return ResponseEntity.ok(attendanceService.getByStudent(id));
    }

    // GET /api/attendance/student/{id}/percentage
    @GetMapping("/student/{id}/percentage")
    public ResponseEntity<Map<String, Object>> getStudentPercentage(@PathVariable Long id) {
        double percentage = attendanceService.calculateAttendancePercentage(id);
        return ResponseEntity.ok(Map.of("studentId", id, "attendancePercentage", percentage));
    }

    // PUT /api/attendance/{id}/override -> body: { "status": "PRESENT", "reason": "..." }
    @PutMapping("/{id}/override")
    @PreAuthorize("hasAnyRole('CLASS_TEACHER','PRINCIPAL','ADMIN')")
    public ResponseEntity<Attendance> overrideAttendance(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication authentication) {
        String statusStr = body.get("status");
        if (statusStr == null) {
            throw new IllegalArgumentException("Status is required");
        }
        Attendance.Status status = Attendance.Status.valueOf(statusStr.toUpperCase());
        String reason = body.get("reason");

        User modifier = null;
        if (authentication != null && authentication.getName() != null) {
            try {
                modifier = userService.getUserByEmail(authentication.getName());
            } catch (Exception ignored) {}
        }

        return ResponseEntity.ok(attendanceService.overrideAttendance(id, status, reason, modifier));
    }

    // GET /api/attendance/below75
    @GetMapping("/below75")
    @PreAuthorize("hasAnyRole('PRINCIPAL','ADMIN')")
    public ResponseEntity<List<User>> getStudentsBelow75() {
        return ResponseEntity.ok(attendanceService.getStudentsBelow75());
    }
}
