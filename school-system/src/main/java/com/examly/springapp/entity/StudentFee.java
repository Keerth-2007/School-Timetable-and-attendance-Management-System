package com.examly.springapp.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "student_fees", indexes = {
        @Index(name = "idx_sf_student_id", columnList = "student_id"),
        @Index(name = "idx_sf_academic_year", columnList = "academic_year"),
        @Index(name = "idx_sf_class_section", columnList = "class_section"),
        @Index(name = "idx_sf_fee_type", columnList = "fee_type"),
        @Index(name = "idx_sf_due_date", columnList = "due_date"),
        @Index(name = "idx_sf_status", columnList = "status")
})
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class StudentFee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "fee_structure_id")
    private FeeStructure feeStructure;

    @Column(name = "academic_year", nullable = false)
    private String academicYear = "2026-2027";

    @Column(name = "class_section")
    private String classSection;

    @Enumerated(EnumType.STRING)
    @Column(name = "fee_type", nullable = false)
    private FeeType feeType = FeeType.TUITION;

    @Column(name = "fee_name", nullable = false)
    private String feeName;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount = BigDecimal.ZERO;

    @Column(precision = 12, scale = 2)
    private BigDecimal discount = BigDecimal.ZERO;

    @Column(name = "discount_reason")
    private String discountReason;

    @Column(name = "final_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal finalAmount = BigDecimal.ZERO;

    @Column(name = "paid_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal paidAmount = BigDecimal.ZERO;

    @Column(name = "pending_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal pendingAmount = BigDecimal.ZERO;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FeeStatus status = FeeStatus.PENDING;

    @Column(name = "calendar_event_id")
    private Long calendarEventId;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public StudentFee() {
    }

    public StudentFee(User student, FeeStructure feeStructure, String academicYear, String classSection,
                      FeeType feeType, String feeName, BigDecimal amount, BigDecimal discount,
                      String discountReason, LocalDate dueDate) {
        this.student = student;
        this.feeStructure = feeStructure;
        this.academicYear = academicYear;
        this.classSection = classSection;
        this.feeType = feeType;
        this.feeName = feeName;
        this.amount = amount != null ? amount : BigDecimal.ZERO;
        this.discount = discount != null ? discount : BigDecimal.ZERO;
        this.discountReason = discountReason;
        this.dueDate = dueDate;
        this.paidAmount = BigDecimal.ZERO;
        recalculate();
    }

    public void recalculate() {
        if (amount == null) amount = BigDecimal.ZERO;
        if (discount == null) discount = BigDecimal.ZERO;
        if (paidAmount == null) paidAmount = BigDecimal.ZERO;

        finalAmount = amount.subtract(discount);
        if (finalAmount.compareTo(BigDecimal.ZERO) < 0) {
            finalAmount = BigDecimal.ZERO;
        }

        pendingAmount = finalAmount.subtract(paidAmount);
        if (pendingAmount.compareTo(BigDecimal.ZERO) < 0) {
            pendingAmount = BigDecimal.ZERO;
        }

        // Automatic Status calculation
        if (paidAmount.compareTo(finalAmount) >= 0 && finalAmount.compareTo(BigDecimal.ZERO) > 0) {
            status = FeeStatus.PAID;
            pendingAmount = BigDecimal.ZERO;
        } else if (dueDate != null && LocalDate.now().isAfter(dueDate) && pendingAmount.compareTo(BigDecimal.ZERO) > 0) {
            status = FeeStatus.OVERDUE;
        } else if (paidAmount.compareTo(BigDecimal.ZERO) > 0 && paidAmount.compareTo(finalAmount) < 0) {
            status = FeeStatus.PARTIALLY_PAID;
        } else {
            status = FeeStatus.PENDING;
        }
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        updatedAt = LocalDateTime.now();
        recalculate();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        recalculate();
    }

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getStudent() {
        return student;
    }

    public void setStudent(User student) {
        this.student = student;
    }

    public FeeStructure getFeeStructure() {
        return feeStructure;
    }

    public void setFeeStructure(FeeStructure feeStructure) {
        this.feeStructure = feeStructure;
    }

    public String getAcademicYear() {
        return academicYear;
    }

    public void setAcademicYear(String academicYear) {
        this.academicYear = academicYear;
    }

    public String getClassSection() {
        return classSection;
    }

    public void setClassSection(String classSection) {
        this.classSection = classSection;
    }

    public FeeType getFeeType() {
        return feeType;
    }

    public void setFeeType(FeeType feeType) {
        this.feeType = feeType;
    }

    public String getFeeName() {
        return feeName;
    }

    public void setFeeName(String feeName) {
        this.feeName = feeName;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public BigDecimal getDiscount() {
        return discount;
    }

    public void setDiscount(BigDecimal discount) {
        this.discount = discount;
    }

    public String getDiscountReason() {
        return discountReason;
    }

    public void setDiscountReason(String discountReason) {
        this.discountReason = discountReason;
    }

    public BigDecimal getFinalAmount() {
        return finalAmount;
    }

    public void setFinalAmount(BigDecimal finalAmount) {
        this.finalAmount = finalAmount;
    }

    public BigDecimal getPaidAmount() {
        return paidAmount;
    }

    public void setPaidAmount(BigDecimal paidAmount) {
        this.paidAmount = paidAmount;
    }

    public BigDecimal getPendingAmount() {
        return pendingAmount;
    }

    public void setPendingAmount(BigDecimal pendingAmount) {
        this.pendingAmount = pendingAmount;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public FeeStatus getStatus() {
        return status;
    }

    public void setStatus(FeeStatus status) {
        this.status = status;
    }

    public Long getCalendarEventId() {
        return calendarEventId;
    }

    public void setCalendarEventId(Long calendarEventId) {
        this.calendarEventId = calendarEventId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
