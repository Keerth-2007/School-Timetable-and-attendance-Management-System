package com.examly.springapp.controller;

import com.examly.springapp.dto.*;
import com.examly.springapp.entity.FeeStatus;
import com.examly.springapp.entity.FeeType;
import com.examly.springapp.entity.PaymentMethod;
import com.examly.springapp.entity.User;
import com.examly.springapp.exception.UnauthorisedAccessException;
import com.examly.springapp.service.FeeService;
import com.examly.springapp.service.UserService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/fees")
@CrossOrigin(origins = "*")
public class FeeController {

    private final FeeService feeService;
    private final UserService userService;

    public FeeController(FeeService feeService, UserService userService) {
        this.feeService = feeService;
        this.userService = userService;
    }

    private User getAuthenticatedUser(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            throw new UnauthorisedAccessException("User not authenticated");
        }
        return userService.getUserByEmail(auth.getName());
    }

    // ==========================================
    // 1. DASHBOARD & SUMMARY
    // ==========================================

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRINCIPAL')")
    public ResponseEntity<FeeDashboardSummaryDTO> getSummary(
            @RequestParam(required = false) String academicYear) {
        return ResponseEntity.ok(feeService.getDashboardSummary(academicYear));
    }

    // ==========================================
    // 2. FEE STRUCTURES (ADMIN)
    // ==========================================

    @GetMapping("/structures")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRINCIPAL')")
    public ResponseEntity<List<FeeStructureDTO>> getStructures(
            @RequestParam(required = false) String academicYear,
            @RequestParam(required = false) String classSection,
            @RequestParam(required = false) Boolean activeOnly) {
        return ResponseEntity.ok(feeService.getFeeStructures(academicYear, classSection, activeOnly));
    }

    @GetMapping("/structures/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRINCIPAL')")
    public ResponseEntity<FeeStructureDTO> getStructureById(@PathVariable Long id) {
        return ResponseEntity.ok(feeService.getFeeStructureById(id));
    }

    @PostMapping("/structures")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FeeStructureDTO> createStructure(
            @RequestBody FeeStructureRequest req,
            Authentication auth) {
        User currentUser = getAuthenticatedUser(auth);
        return ResponseEntity.status(HttpStatus.CREATED).body(feeService.createFeeStructure(req, currentUser));
    }

    @PutMapping("/structures/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FeeStructureDTO> updateStructure(
            @PathVariable Long id,
            @RequestBody FeeStructureRequest req) {
        return ResponseEntity.ok(feeService.updateFeeStructure(id, req));
    }

    @DeleteMapping("/structures/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> deleteStructure(@PathVariable Long id) {
        return ResponseEntity.ok(feeService.deleteOrDeactivateFeeStructure(id));
    }

    // ==========================================
    // 3. STUDENT FEE ASSIGNMENT (ADMIN)
    // ==========================================

    @PostMapping("/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<StudentFeeDTO>> assignFees(
            @RequestBody AssignFeeRequest req,
            Authentication auth) {
        User currentUser = getAuthenticatedUser(auth);
        return ResponseEntity.status(HttpStatus.CREATED).body(feeService.assignFees(req, currentUser));
    }

    // ==========================================
    // 4. STUDENT FEES RETRIEVAL & FILTERING
    // ==========================================

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PRINCIPAL')")
    public ResponseEntity<List<StudentFeeDTO>> getAllStudentFees(
            @RequestParam(required = false) String academicYear,
            @RequestParam(required = false) String classSection,
            @RequestParam(required = false) FeeType feeType,
            @RequestParam(required = false) FeeStatus status,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(feeService.getAllStudentFees(academicYear, classSection, feeType, status, search));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRINCIPAL')")
    public ResponseEntity<List<StudentFeeDTO>> getPendingFees(
            @RequestParam(required = false) String academicYear,
            @RequestParam(required = false) String classSection) {
        return ResponseEntity.ok(feeService.getPendingAndOverdueFees(academicYear, classSection));
    }

    // STUDENT OWN FEES (Derived securely from token)
    @GetMapping("/my")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<StudentFeeDTO>> getMyFees(Authentication auth) {
        User currentUser = getAuthenticatedUser(auth);
        return ResponseEntity.ok(feeService.getMyStudentFees(currentUser.getId()));
    }

    // STUDENT / PARENT / ADMIN FEE LOOKUP
    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasAnyRole('STUDENT', 'PARENT', 'ADMIN', 'PRINCIPAL')")
    public ResponseEntity<List<StudentFeeDTO>> getStudentFees(
            @PathVariable Long studentId,
            Authentication auth) {
        User currentUser = getAuthenticatedUser(auth);

        if (currentUser.getRole() == User.Role.STUDENT) {
            if (!currentUser.getId().equals(studentId)) {
                throw new UnauthorisedAccessException("Access Denied: Students can only view their own fee records");
            }
            return ResponseEntity.ok(feeService.getMyStudentFees(currentUser.getId()));
        } else if (currentUser.getRole() == User.Role.PARENT) {
            return ResponseEntity.ok(feeService.getChildFees(currentUser.getId(), studentId));
        } else {
            // ADMIN / PRINCIPAL
            return ResponseEntity.ok(feeService.getMyStudentFees(studentId));
        }
    }

    // TEACHER VIEW (Read-only, authorized class)
    @GetMapping("/teacher/class/{classSection}")
    @PreAuthorize("hasAnyRole('TEACHER', 'CLASS_TEACHER', 'ADMIN', 'PRINCIPAL')")
    public ResponseEntity<List<StudentFeeDTO>> getTeacherClassFees(
            @PathVariable String classSection,
            Authentication auth) {
        User currentUser = getAuthenticatedUser(auth);
        return ResponseEntity.ok(feeService.getTeacherClassStudentFees(currentUser.getId(), classSection));
    }

    // ==========================================
    // 5. PAYMENTS & RECEIPTS
    // ==========================================

    @PostMapping("/payments")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FeeReceiptDTO> recordPayment(
            @RequestBody RecordPaymentRequest req,
            Authentication auth) {
        User currentUser = getAuthenticatedUser(auth);
        return ResponseEntity.status(HttpStatus.CREATED).body(feeService.recordPayment(req, currentUser));
    }

    @GetMapping("/payments")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRINCIPAL')")
    public ResponseEntity<List<FeePaymentDTO>> getPayments(
            @RequestParam(required = false) Long studentId,
            @RequestParam(required = false) String classSection,
            @RequestParam(required = false) PaymentMethod paymentMethod,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(feeService.getPaymentHistory(studentId, classSection, paymentMethod, startDate, endDate));
    }

    @GetMapping("/payments/my")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<FeePaymentDTO>> getMyPayments(Authentication auth) {
        User currentUser = getAuthenticatedUser(auth);
        return ResponseEntity.ok(feeService.getMyPayments(currentUser.getId()));
    }

    @GetMapping("/payments/student/{studentId}")
    @PreAuthorize("hasAnyRole('STUDENT', 'PARENT', 'ADMIN', 'PRINCIPAL')")
    public ResponseEntity<List<FeePaymentDTO>> getStudentPayments(
            @PathVariable Long studentId,
            Authentication auth) {
        User currentUser = getAuthenticatedUser(auth);

        if (currentUser.getRole() == User.Role.STUDENT) {
            if (!currentUser.getId().equals(studentId)) {
                throw new UnauthorisedAccessException("Access Denied: Students can only view their own payment history");
            }
            return ResponseEntity.ok(feeService.getMyPayments(currentUser.getId()));
        } else if (currentUser.getRole() == User.Role.PARENT) {
            return ResponseEntity.ok(feeService.getChildPayments(currentUser.getId(), studentId));
        } else {
            return ResponseEntity.ok(feeService.getMyPayments(studentId));
        }
    }

    @GetMapping("/receipts/{receiptNumber}")
    @PreAuthorize("hasAnyRole('STUDENT', 'PARENT', 'ADMIN', 'PRINCIPAL')")
    public ResponseEntity<FeeReceiptDTO> getReceiptByNumber(
            @PathVariable String receiptNumber,
            Authentication auth) {
        User currentUser = getAuthenticatedUser(auth);
        return ResponseEntity.ok(feeService.getReceiptByReceiptNumber(receiptNumber, currentUser));
    }

    @GetMapping("/receipts/payment/{paymentId}")
    @PreAuthorize("hasAnyRole('STUDENT', 'PARENT', 'ADMIN', 'PRINCIPAL')")
    public ResponseEntity<FeeReceiptDTO> getReceiptByPaymentId(
            @PathVariable Long paymentId,
            Authentication auth) {
        User currentUser = getAuthenticatedUser(auth);
        return ResponseEntity.ok(feeService.getReceiptByPaymentId(paymentId, currentUser));
    }
}
