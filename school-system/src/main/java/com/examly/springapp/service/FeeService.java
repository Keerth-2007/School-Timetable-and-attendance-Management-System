package com.examly.springapp.service;

import com.examly.springapp.dto.*;
import com.examly.springapp.entity.*;
import com.examly.springapp.exception.ResourceNotFoundException;
import com.examly.springapp.exception.UnauthorisedAccessException;
import com.examly.springapp.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class FeeService {

    private final FeeStructureRepository feeStructureRepository;
    private final StudentFeeRepository studentFeeRepository;
    private final FeePaymentRepository feePaymentRepository;
    private final FeeReceiptRepository feeReceiptRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final AcademicEventRepository academicEventRepository;

    public FeeService(FeeStructureRepository feeStructureRepository,
                      StudentFeeRepository studentFeeRepository,
                      FeePaymentRepository feePaymentRepository,
                      FeeReceiptRepository feeReceiptRepository,
                      UserRepository userRepository,
                      NotificationRepository notificationRepository,
                      AcademicEventRepository academicEventRepository) {
        this.feeStructureRepository = feeStructureRepository;
        this.studentFeeRepository = studentFeeRepository;
        this.feePaymentRepository = feePaymentRepository;
        this.feeReceiptRepository = feeReceiptRepository;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
        this.academicEventRepository = academicEventRepository;
    }

    // ==========================================
    // 1. FEE STRUCTURE MANAGEMENT
    // ==========================================

    @Transactional
    public FeeStructureDTO createFeeStructure(FeeStructureRequest req, User createdBy) {
        if (req.getFeeName() == null || req.getFeeName().trim().isEmpty()) {
            throw new IllegalArgumentException("Fee name is required");
        }
        if (req.getAmount() == null || req.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Fee amount must be greater than zero");
        }

        FeeStructure fs = new FeeStructure();
        fs.setAcademicYear(req.getAcademicYear() != null ? req.getAcademicYear() : "2026-2027");
        fs.setClassSection(req.getClassSection());
        fs.setFeeType(req.getFeeType() != null ? req.getFeeType() : FeeType.TUITION);
        fs.setFeeName(req.getFeeName().trim());
        fs.setAmount(req.getAmount());
        fs.setDueDate(req.getDueDate());
        fs.setTerm(req.getTerm() != null ? req.getTerm() : "Annual");
        fs.setDescription(req.getDescription());
        fs.setActive(req.getActive() != null ? req.getActive() : true);
        fs.setCreatedBy(createdBy);

        FeeStructure saved = feeStructureRepository.save(fs);

        // Sync with Academic Calendar if due date provided
        if (saved.getDueDate() != null) {
            syncAcademicCalendarEvent(saved.getFeeName(), saved.getClassSection(), saved.getAcademicYear(),
                    saved.getDueDate(), createdBy);
        }

        return FeeStructureDTO.fromEntity(saved);
    }

    @Transactional
    public FeeStructureDTO updateFeeStructure(Long id, FeeStructureRequest req) {
        FeeStructure fs = feeStructureRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fee structure not found with id: " + id));

        if (req.getFeeName() != null && !req.getFeeName().trim().isEmpty()) {
            fs.setFeeName(req.getFeeName().trim());
        }
        if (req.getAmount() != null && req.getAmount().compareTo(BigDecimal.ZERO) > 0) {
            fs.setAmount(req.getAmount());
        }
        if (req.getAcademicYear() != null) {
            fs.setAcademicYear(req.getAcademicYear());
        }
        if (req.getClassSection() != null) {
            fs.setClassSection(req.getClassSection());
        }
        if (req.getFeeType() != null) {
            fs.setFeeType(req.getFeeType());
        }
        if (req.getDueDate() != null) {
            fs.setDueDate(req.getDueDate());
        }
        if (req.getTerm() != null) {
            fs.setTerm(req.getTerm());
        }
        if (req.getDescription() != null) {
            fs.setDescription(req.getDescription());
        }
        if (req.getActive() != null) {
            fs.setActive(req.getActive());
        }

        FeeStructure updated = feeStructureRepository.save(fs);
        return FeeStructureDTO.fromEntity(updated);
    }

    @Transactional
    public Map<String, Object> deleteOrDeactivateFeeStructure(Long id) {
        FeeStructure fs = feeStructureRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fee structure not found with id: " + id));

        List<StudentFee> associatedFees = studentFeeRepository.findByFeeStructureId(id);
        if (!associatedFees.isEmpty()) {
            // Soft delete / deactivate to preserve financial history
            fs.setActive(false);
            feeStructureRepository.save(fs);
            return Map.of("message", "Fee structure deactivated to preserve existing student fee records", "deactivated", true);
        } else {
            feeStructureRepository.delete(fs);
            return Map.of("message", "Fee structure deleted successfully", "deleted", true);
        }
    }

    public List<FeeStructureDTO> getFeeStructures(String academicYear, String classSection, Boolean activeOnly) {
        List<FeeStructure> list = feeStructureRepository.findAll();
        return list.stream()
                .filter(fs -> academicYear == null || academicYear.equalsIgnoreCase(fs.getAcademicYear()))
                .filter(fs -> classSection == null || classSection.equalsIgnoreCase(fs.getClassSection()) || "ALL".equalsIgnoreCase(fs.getClassSection()))
                .filter(fs -> activeOnly == null || !activeOnly || fs.isActive())
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(FeeStructureDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public FeeStructureDTO getFeeStructureById(Long id) {
        FeeStructure fs = feeStructureRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fee structure not found with id: " + id));
        return FeeStructureDTO.fromEntity(fs);
    }

    // ==========================================
    // 2. STUDENT FEE ASSIGNMENT
    // ==========================================

    @Transactional
    public List<StudentFeeDTO> assignFees(AssignFeeRequest req, User currentUser) {
        List<StudentFee> createdFees = new ArrayList<>();

        if (req.getStudentId() != null) {
            // Assign to single student
            User student = userRepository.findById(req.getStudentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + req.getStudentId()));
            if (student.getRole() != User.Role.STUDENT) {
                throw new IllegalArgumentException("User with id " + req.getStudentId() + " is not a STUDENT");
            }
            StudentFee sf = createSingleStudentFee(student, req, currentUser);
            createdFees.add(sf);
        } else if (req.getClassSection() != null && !req.getClassSection().trim().isEmpty()) {
            // Batch assign to all students of the class section
            String classSection = req.getClassSection().trim();
            List<User> students = userRepository.findByClassSectionAndRole(classSection, User.Role.STUDENT);
            if (students.isEmpty()) {
                throw new ResourceNotFoundException("No students found in class section: " + classSection);
            }
            for (User student : students) {
                StudentFee sf = createSingleStudentFee(student, req, currentUser);
                createdFees.add(sf);
            }
            // Add class-wide calendar due event
            if (req.getDueDate() != null) {
                syncAcademicCalendarEvent(req.getFeeName() != null ? req.getFeeName() : "Fee Due",
                        classSection, req.getAcademicYear(), req.getDueDate(), currentUser);
            }
        } else {
            throw new IllegalArgumentException("Either studentId or classSection must be provided for fee assignment");
        }

        return createdFees.stream().map(StudentFeeDTO::fromEntity).collect(Collectors.toList());
    }

    private StudentFee createSingleStudentFee(User student, AssignFeeRequest req, User currentUser) {
        FeeStructure structure = null;
        if (req.getFeeStructureId() != null) {
            structure = feeStructureRepository.findById(req.getFeeStructureId()).orElse(null);
        }

        String feeName = req.getFeeName();
        FeeType feeType = req.getFeeType();
        BigDecimal amount = req.getAmount();
        LocalDate dueDate = req.getDueDate();
        String academicYear = req.getAcademicYear();
        String classSection = student.getClassSection();

        if (structure != null) {
            if (feeName == null || feeName.isBlank()) feeName = structure.getFeeName();
            if (feeType == null) feeType = structure.getFeeType();
            if (amount == null) amount = structure.getAmount();
            if (dueDate == null) dueDate = structure.getDueDate();
            if (academicYear == null || academicYear.isBlank()) academicYear = structure.getAcademicYear();
            if (classSection == null && structure.getClassSection() != null) classSection = structure.getClassSection();
        }

        if (feeName == null || feeName.isBlank()) {
            feeName = "School Fee";
        }
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Fee amount must be greater than zero");
        }
        if (academicYear == null || academicYear.isBlank()) {
            academicYear = "2026-2027";
        }
        if (feeType == null) {
            feeType = FeeType.TUITION;
        }

        BigDecimal discount = req.getDiscount() != null ? req.getDiscount() : BigDecimal.ZERO;
        String discountReason = req.getDiscountReason();

        StudentFee sf = new StudentFee(student, structure, academicYear, classSection, feeType,
                feeName, amount, discount, discountReason, dueDate);

        StudentFee saved = studentFeeRepository.save(sf);

        // Send notifications to Student and linked Parents
        dispatchFeeAssignmentNotifications(saved);

        return saved;
    }

    // ==========================================
    // 3. PAYMENT RECORDING & RECEIPT GENERATION
    // ==========================================

    @Transactional
    public FeeReceiptDTO recordPayment(RecordPaymentRequest req, User recordedBy) {
        if (req.getAmountPaid() == null || req.getAmountPaid().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Payment amount must be greater than zero");
        }

        StudentFee studentFee = studentFeeRepository.findById(req.getStudentFeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Student fee not found with id: " + req.getStudentFeeId()));

        User student = studentFee.getStudent();
        if (req.getStudentId() != null && !student.getId().equals(req.getStudentId())) {
            throw new IllegalArgumentException("Supplied studentId does not match the student associated with the fee record");
        }

        // Fresh calculation
        studentFee.recalculate();

        if (req.getAmountPaid().compareTo(studentFee.getPendingAmount()) > 0) {
            throw new IllegalArgumentException(String.format(
                    "Payment amount (₹%.2f) cannot exceed the pending balance (₹%.2f)",
                    req.getAmountPaid(), studentFee.getPendingAmount()));
        }

        BigDecimal previousPending = studentFee.getPendingAmount();
        BigDecimal newPaidAmount = studentFee.getPaidAmount().add(req.getAmountPaid());
        studentFee.setPaidAmount(newPaidAmount);
        studentFee.recalculate();
        studentFeeRepository.save(studentFee);

        // Generate unique receipt number (e.g. REC-2026-000001)
        String receiptNumber = generateUniqueReceiptNumber();

        FeePayment payment = new FeePayment();
        payment.setReceiptNumber(receiptNumber);
        payment.setStudent(student);
        payment.setStudentFee(studentFee);
        payment.setAmountPaid(req.getAmountPaid());
        payment.setPaymentDate(req.getPaymentDate() != null ? req.getPaymentDate() : LocalDate.now());
        payment.setPaymentMethod(req.getPaymentMethod() != null ? req.getPaymentMethod() : PaymentMethod.CASH);
        payment.setReferenceNumber(req.getReferenceNumber());
        payment.setRemarks(req.getRemarks());
        payment.setRecordedBy(recordedBy);
        FeePayment savedPayment = feePaymentRepository.save(payment);

        FeeReceipt receipt = new FeeReceipt(
                receiptNumber,
                savedPayment,
                student,
                studentFee,
                req.getAmountPaid(),
                savedPayment.getPaymentDate(),
                savedPayment.getPaymentMethod(),
                savedPayment.getReferenceNumber(),
                previousPending,
                studentFee.getPendingAmount(),
                studentFee.getFinalAmount(),
                recordedBy
        );
        FeeReceipt savedReceipt = feeReceiptRepository.save(receipt);

        // Dispatch notifications
        dispatchPaymentNotifications(savedReceipt, studentFee);

        return FeeReceiptDTO.fromEntity(savedReceipt);
    }

    private synchronized String generateUniqueReceiptNumber() {
        int currentYear = LocalDate.now().getYear();
        long totalPayments = feePaymentRepository.count();
        long seq = totalPayments + 1;
        String formatted = String.format("REC-%d-%06d", currentYear, seq);

        // Guarantee uniqueness
        while (feePaymentRepository.findByReceiptNumber(formatted).isPresent()) {
            seq++;
            formatted = String.format("REC-%d-%06d", currentYear, seq);
        }
        return formatted;
    }

    // ==========================================
    // 4. DASHBOARD & SUMMARY QUERIES
    // ==========================================

    public FeeDashboardSummaryDTO getDashboardSummary(String academicYear) {
        FeeDashboardSummaryDTO summary = new FeeDashboardSummaryDTO();

        List<StudentFee> allFees = studentFeeRepository.findAll();
        if (academicYear != null && !academicYear.isBlank()) {
            allFees = allFees.stream()
                    .filter(f -> academicYear.equalsIgnoreCase(f.getAcademicYear()))
                    .collect(Collectors.toList());
        }

        BigDecimal totalFees = BigDecimal.ZERO;
        BigDecimal totalCollected = BigDecimal.ZERO;
        BigDecimal totalPending = BigDecimal.ZERO;
        BigDecimal totalOverdue = BigDecimal.ZERO;

        Set<Long> paidStudents = new HashSet<>();
        Set<Long> pendingStudents = new HashSet<>();
        Set<Long> partiallyPaidStudents = new HashSet<>();
        Set<Long> allStudents = new HashSet<>();

        LocalDate today = LocalDate.now();

        for (StudentFee f : allFees) {
            f.recalculate(); // Ensure fresh calculation
            totalFees = totalFees.add(f.getFinalAmount());
            totalCollected = totalCollected.add(f.getPaidAmount());
            totalPending = totalPending.add(f.getPendingAmount());

            if (f.getStatus() == FeeStatus.OVERDUE || (f.getDueDate() != null && today.isAfter(f.getDueDate()) && f.getPendingAmount().compareTo(BigDecimal.ZERO) > 0)) {
                totalOverdue = totalOverdue.add(f.getPendingAmount());
            }

            if (f.getStudent() != null) {
                Long sid = f.getStudent().getId();
                allStudents.add(sid);
                if (f.getStatus() == FeeStatus.PAID) {
                    paidStudents.add(sid);
                } else if (f.getStatus() == FeeStatus.PARTIALLY_PAID) {
                    partiallyPaidStudents.add(sid);
                    pendingStudents.add(sid);
                } else {
                    pendingStudents.add(sid);
                }
            }
        }

        summary.setTotalFees(totalFees);
        summary.setTotalCollected(totalCollected);
        summary.setTotalPending(totalPending);
        summary.setTotalOverdue(totalOverdue);
        summary.setPaidStudentsCount(paidStudents.size());
        summary.setPendingStudentsCount(pendingStudents.size());
        summary.setPartiallyPaidStudentsCount(partiallyPaidStudents.size());
        summary.setTotalStudentsWithFees(allStudents.size());
        summary.setTotalStructuresCount(feeStructureRepository.count());

        List<FeePayment> recentPayments = feePaymentRepository.findAllByOrderByPaymentDateDescCreatedAtDesc();
        summary.setRecentPayments(recentPayments.stream()
                .limit(10)
                .map(FeePaymentDTO::fromEntity)
                .collect(Collectors.toList()));

        return summary;
    }

    // ==========================================
    // 5. STUDENT & PARENT & TEACHER VIEWS
    // ==========================================

    public List<StudentFeeDTO> getMyStudentFees(Long studentUserId) {
        List<StudentFee> fees = studentFeeRepository.findByStudentIdOrderByCreatedAtDesc(studentUserId);
        fees.forEach(StudentFee::recalculate);
        return fees.stream().map(StudentFeeDTO::fromEntity).collect(Collectors.toList());
    }

    public List<FeePaymentDTO> getMyPayments(Long studentUserId) {
        return feePaymentRepository.findByStudentIdOrderByPaymentDateDescCreatedAtDesc(studentUserId)
                .stream().map(FeePaymentDTO::fromEntity).collect(Collectors.toList());
    }

    public List<StudentFeeDTO> getChildFees(Long parentUserId, Long studentId) {
        verifyParentChildLink(parentUserId, studentId);
        List<StudentFee> fees = studentFeeRepository.findByStudentIdOrderByCreatedAtDesc(studentId);
        fees.forEach(StudentFee::recalculate);
        return fees.stream().map(StudentFeeDTO::fromEntity).collect(Collectors.toList());
    }

    public List<FeePaymentDTO> getChildPayments(Long parentUserId, Long studentId) {
        verifyParentChildLink(parentUserId, studentId);
        return feePaymentRepository.findByStudentIdOrderByPaymentDateDescCreatedAtDesc(studentId)
                .stream().map(FeePaymentDTO::fromEntity).collect(Collectors.toList());
    }

    public List<StudentFeeDTO> getTeacherClassStudentFees(Long teacherId, String classSection) {
        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher not found"));

        // If teacher has assigned classSection, verify they only see their class
        if (teacher.getClassSection() != null && !teacher.getClassSection().isBlank()) {
            if (classSection != null && !classSection.equalsIgnoreCase(teacher.getClassSection())) {
                throw new UnauthorisedAccessException("Teachers can only view fee status for their assigned class: " + teacher.getClassSection());
            }
            classSection = teacher.getClassSection();
        }

        List<StudentFee> fees = studentFeeRepository.findByClassSectionOrderByCreatedAtDesc(classSection);
        fees.forEach(StudentFee::recalculate);
        return fees.stream().map(StudentFeeDTO::fromEntity).collect(Collectors.toList());
    }

    public List<StudentFeeDTO> getAllStudentFees(String academicYear, String classSection, FeeType feeType, FeeStatus status, String search) {
        List<StudentFee> fees = studentFeeRepository.findAll();
        fees.forEach(StudentFee::recalculate);

        return fees.stream()
                .filter(f -> academicYear == null || academicYear.isBlank() || academicYear.equalsIgnoreCase(f.getAcademicYear()))
                .filter(f -> classSection == null || classSection.isBlank() || classSection.equalsIgnoreCase(f.getClassSection()))
                .filter(f -> feeType == null || f.getFeeType() == feeType)
                .filter(f -> status == null || f.getStatus() == status)
                .filter(f -> {
                    if (search == null || search.isBlank()) return true;
                    String s = search.toLowerCase();
                    boolean matchName = f.getStudent() != null && f.getStudent().getName() != null && f.getStudent().getName().toLowerCase().contains(s);
                    boolean matchAdm = f.getStudent() != null && f.getStudent().getAdmissionNumber() != null && f.getStudent().getAdmissionNumber().toLowerCase().contains(s);
                    boolean matchFee = f.getFeeName() != null && f.getFeeName().toLowerCase().contains(s);
                    return matchName || matchAdm || matchFee;
                })
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(StudentFeeDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public List<StudentFeeDTO> getPendingAndOverdueFees(String academicYear, String classSection) {
        List<StudentFee> fees = studentFeeRepository.findAll();
        fees.forEach(StudentFee::recalculate);

        return fees.stream()
                .filter(f -> f.getPendingAmount().compareTo(BigDecimal.ZERO) > 0)
                .filter(f -> academicYear == null || academicYear.isBlank() || academicYear.equalsIgnoreCase(f.getAcademicYear()))
                .filter(f -> classSection == null || classSection.isBlank() || classSection.equalsIgnoreCase(f.getClassSection()))
                .sorted((a, b) -> {
                    if (a.getDueDate() == null) return 1;
                    if (b.getDueDate() == null) return -1;
                    return a.getDueDate().compareTo(b.getDueDate());
                })
                .map(StudentFeeDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public List<FeePaymentDTO> getPaymentHistory(Long studentId, String classSection, PaymentMethod paymentMethod,
                                                 LocalDate startDate, LocalDate endDate) {
        return feePaymentRepository.searchPayments(studentId, classSection, paymentMethod, startDate, endDate)
                .stream().map(FeePaymentDTO::fromEntity).collect(Collectors.toList());
    }

    public FeeReceiptDTO getReceiptByReceiptNumber(String receiptNumber, User currentUser) {
        FeeReceipt receipt = feeReceiptRepository.findByReceiptNumber(receiptNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Receipt not found with number: " + receiptNumber));

        authorizeReceiptAccess(receipt, currentUser);
        return FeeReceiptDTO.fromEntity(receipt);
    }

    public FeeReceiptDTO getReceiptByPaymentId(Long paymentId, User currentUser) {
        FeeReceipt receipt = feeReceiptRepository.findByPaymentId(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Receipt not found for payment id: " + paymentId));

        authorizeReceiptAccess(receipt, currentUser);
        return FeeReceiptDTO.fromEntity(receipt);
    }

    // ==========================================
    // 6. AUTHORIZATION HELPERS
    // ==========================================

    private void verifyParentChildLink(Long parentUserId, Long studentId) {
        User parent = userRepository.findById(parentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Parent not found"));

        if (parent.getRole() != User.Role.PARENT && parent.getRole() != User.Role.ADMIN) {
            throw new UnauthorisedAccessException("User is not a parent");
        }

        if (parent.getRole() == User.Role.ADMIN) {
            return; // Admin can access
        }

        boolean isChild = parent.getChildren().stream().anyMatch(c -> c.getId().equals(studentId));
        if (!isChild) {
            // Also check via direct parentId column
            User student = userRepository.findById(studentId).orElse(null);
            if (student != null && parentUserId.equals(student.getParentId())) {
                isChild = true;
            }
        }

        if (!isChild) {
            throw new UnauthorisedAccessException("Access Denied: Child is not linked to your parent account");
        }
    }

    private void authorizeReceiptAccess(FeeReceipt receipt, User currentUser) {
        if (currentUser == null) return;
        if (currentUser.getRole() == User.Role.ADMIN || currentUser.getRole() == User.Role.PRINCIPAL) {
            return;
        }
        Long studentId = receipt.getStudent() != null ? receipt.getStudent().getId() : null;
        if (currentUser.getRole() == User.Role.STUDENT) {
            if (!currentUser.getId().equals(studentId)) {
                throw new UnauthorisedAccessException("You are not authorized to view another student's receipt");
            }
        } else if (currentUser.getRole() == User.Role.PARENT) {
            verifyParentChildLink(currentUser.getId(), studentId);
        } else {
            throw new UnauthorisedAccessException("You are not authorized to view fee receipts");
        }
    }

    // ==========================================
    // 7. NOTIFICATIONS & CALENDAR SYNC
    // ==========================================

    private void dispatchFeeAssignmentNotifications(StudentFee fee) {
        User student = fee.getStudent();
        if (student == null) return;

        String dateStr = fee.getDueDate() != null ? fee.getDueDate().format(DateTimeFormatter.ofPattern("dd MMM yyyy")) : "As scheduled";
        String msg = String.format("A fee record for '%s' of ₹%.2f has been assigned. Due date: %s.",
                fee.getFeeName(), fee.getFinalAmount(), dateStr);

        // Notify Student
        Notification studentNotif = new Notification();
        studentNotif.setTitle("💰 Fee Assigned: " + fee.getFeeName());
        studentNotif.setType("FEE_ASSIGNED");
        studentNotif.setMessage(msg);
        studentNotif.setRecipient(student);
        notificationRepository.save(studentNotif);

        // Notify Parents
        List<User> parents = userRepository.findParentsByStudentId(student.getId());
        if (parents.isEmpty() && student.getParentId() != null) {
            userRepository.findById(student.getParentId()).ifPresent(parents::add);
        }

        for (User parent : parents) {
            Notification parentNotif = new Notification();
            parentNotif.setTitle("💰 Student Fee Assigned: " + student.getName());
            parentNotif.setType("FEE_ASSIGNED");
            parentNotif.setMessage(String.format("Fee '%s' of ₹%.2f assigned to your child %s. Due Date: %s.",
                    fee.getFeeName(), fee.getFinalAmount(), student.getName(), dateStr));
            parentNotif.setParent(parent);
            parentNotif.setRecipient(parent);
            notificationRepository.save(parentNotif);
        }
    }

    private void dispatchPaymentNotifications(FeeReceipt receipt, StudentFee fee) {
        User student = receipt.getStudent();
        if (student == null) return;

        String msg = String.format("Payment of ₹%.2f received for '%s'. Receipt Number: %s. Remaining balance: ₹%.2f.",
                receipt.getAmountPaid(), fee.getFeeName(), receipt.getReceiptNumber(), receipt.getRemainingPendingAmount());

        // Notify Student
        Notification studentNotif = new Notification();
        studentNotif.setTitle("🧾 Payment Received: " + receipt.getReceiptNumber());
        studentNotif.setType("FEE_PAYMENT");
        studentNotif.setMessage(msg);
        studentNotif.setRecipient(student);
        notificationRepository.save(studentNotif);

        // Notify Parents
        List<User> parents = userRepository.findParentsByStudentId(student.getId());
        if (parents.isEmpty() && student.getParentId() != null) {
            userRepository.findById(student.getParentId()).ifPresent(parents::add);
        }

        for (User parent : parents) {
            Notification parentNotif = new Notification();
            parentNotif.setTitle("🧾 Fee Payment Confirmation: " + student.getName());
            parentNotif.setType("FEE_PAYMENT");
            parentNotif.setMessage(String.format("Payment of ₹%.2f received for %s ('%s'). Receipt: %s. Remaining: ₹%.2f.",
                    receipt.getAmountPaid(), student.getName(), fee.getFeeName(), receipt.getReceiptNumber(), receipt.getRemainingPendingAmount()));
            parentNotif.setParent(parent);
            parentNotif.setRecipient(parent);
            notificationRepository.save(parentNotif);
        }
    }

    private void syncAcademicCalendarEvent(String feeName, String classSection, String academicYear,
                                           LocalDate dueDate, User createdBy) {
        try {
            AcademicEvent event = new AcademicEvent();
            String title = feeName.contains("Fee") || feeName.contains("fee") ? feeName + " Due" : feeName + " Fee Due";
            event.setTitle(title);
            event.setDescription("Statutory due date for " + feeName + (classSection != null ? " (" + classSection + ")" : ""));
            event.setEventType(AcademicEvent.EventType.FEE_DUE);
            event.setStartDate(dueDate);
            event.setEndDate(dueDate);
            event.setAcademicYear(academicYear != null ? academicYear : "2026-2027");
            event.setClassSection(classSection);
            event.setTargetAudience(classSection != null ? AcademicEvent.TargetAudience.CLASS : AcademicEvent.TargetAudience.ALL);
            event.setStatus(AcademicEvent.Status.PUBLISHED);
            event.setCreatedBy(createdBy);
            academicEventRepository.save(event);
        } catch (Exception e) {
            // Calendar event sync is non-blocking
            System.err.println("Note: Could not sync calendar event for fee due date: " + e.getMessage());
        }
    }
}
