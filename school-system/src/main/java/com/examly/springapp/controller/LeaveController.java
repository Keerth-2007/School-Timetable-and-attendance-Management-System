package com.examly.springapp.controller;

import com.examly.springapp.entity.LeaveApplication;
import com.examly.springapp.entity.User;
import com.examly.springapp.service.LeaveApplicationService;
import com.examly.springapp.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/leave")
@CrossOrigin(origins = "*")
public class LeaveController {

    @Autowired
    private LeaveApplicationService leaveApplicationService;

    @Autowired
    private UserService userService;

    // POST /api/leave - submit leave application
    @PostMapping
    public ResponseEntity<LeaveApplication> apply(@RequestBody LeaveApplication application) {
        LeaveApplication saved = leaveApplicationService.apply(application);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    // GET /api/leave/pending - pending approvals for principal
    @GetMapping("/pending")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('PRINCIPAL','ADMIN')")
    public ResponseEntity<List<LeaveApplication>> getPending() {
        return ResponseEntity.ok(leaveApplicationService.getPending());
    }

    // GET /api/leave/suggest-substitute/{teacherId} - FR6 substitution engine
    @GetMapping("/suggest-substitute/{teacherId}")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('TEACHER','CLASS_TEACHER','PRINCIPAL','ADMIN')")
    public ResponseEntity<List<User>> suggestSubstitute(@PathVariable Long teacherId) {
        List<User> allTeachers = userService.getUsersByRole(User.Role.TEACHER);
        return ResponseEntity.ok(leaveApplicationService.suggestSubstitutes(teacherId, allTeachers));
    }

    // PUT /api/leave/{id}/approve -> body: { "approvedById": 1, "substituteTeacherId": 5 }
    @PutMapping("/{id}/approve")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('PRINCIPAL','ADMIN')")
    public ResponseEntity<LeaveApplication> approve(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            org.springframework.security.core.Authentication auth) {
        Long approvedById = body.get("approvedById") != null ? Long.valueOf(body.get("approvedById").toString()) : null;
        Long subId = body.get("substituteTeacherId") != null ? Long.valueOf(body.get("substituteTeacherId").toString()) : null;

        User approvedBy = approvedById != null ? userService.getUserById(approvedById) : userService.getUserByEmail(auth.getName());
        User substitute = subId != null ? userService.getUserById(subId) : null;
        return ResponseEntity.ok(leaveApplicationService.approve(id, approvedBy, substitute));
    }

    // PUT /api/leave/{id}/reject -> body: { "approvedById": 1, "reason": "Exam week coverage needed" }
    @PutMapping("/{id}/reject")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('PRINCIPAL','ADMIN')")
    public ResponseEntity<LeaveApplication> reject(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> body,
            org.springframework.security.core.Authentication auth) {
        Long approvedById = (body != null && body.get("approvedById") != null) ? Long.valueOf(body.get("approvedById").toString()) : null;
        String reason = (body != null && body.get("reason") != null) ? body.get("reason").toString() : null;

        User approvedBy = approvedById != null ? userService.getUserById(approvedById) : (auth != null ? userService.getUserByEmail(auth.getName()) : null);
        return ResponseEntity.ok(leaveApplicationService.reject(id, approvedBy, reason));
    }

    // GET /api/leave/balance/{teacherId} - FR6 & Appendix H: structured leave balance summary
    @GetMapping("/balance/{teacherId}")
    public ResponseEntity<Map<String, Object>> getBalance(@PathVariable Long teacherId) {
        return ResponseEntity.ok(leaveApplicationService.getLeaveBalanceSummary(teacherId));
    }

    // GET /api/leave/history/{teacherId}
    @GetMapping({"/history/{teacherId}", "/student/{teacherId}"})
    public ResponseEntity<List<LeaveApplication>> getHistory(@PathVariable Long teacherId) {
        return ResponseEntity.ok(leaveApplicationService.getByTeacher(teacherId));
    }
}
