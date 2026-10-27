package com.examly.springapp.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "fee_receipts", indexes = {
        @Index(name = "idx_fr_receipt_number", columnList = "receipt_number", unique = true),
        @Index(name = "idx_fr_payment_id", columnList = "payment_id"),
        @Index(name = "idx_fr_student_id", columnList = "student_id")
})
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class FeeReceipt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "receipt_number", nullable = false, unique = true, length = 50)
    private String receiptNumber;

    @OneToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "payment_id", nullable = false)
    private FeePayment payment;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "student_fee_id", nullable = false)
    private StudentFee studentFee;

    @Column(name = "amount_paid", nullable = false, precision = 12, scale = 2)
    private BigDecimal amountPaid;

    @Column(name = "payment_date", nullable = false)
    private LocalDate paymentDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false)
    private PaymentMethod paymentMethod;

    @Column(name = "reference_number")
    private String referenceNumber;

    @Column(name = "previous_pending_amount", precision = 12, scale = 2)
    private BigDecimal previousPendingAmount = BigDecimal.ZERO;

    @Column(name = "remaining_pending_amount", precision = 12, scale = 2)
    private BigDecimal remainingPendingAmount = BigDecimal.ZERO;

    @Column(name = "total_fee_amount", precision = 12, scale = 2)
    private BigDecimal totalFeeAmount = BigDecimal.ZERO;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "issued_by")
    private User issuedBy;

    @Column(name = "school_name")
    private String schoolName = "Apex International School";

    @Column(name = "school_address")
    private String schoolAddress = "104 Institutional Enclave, Sector 12, New Delhi";

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public FeeReceipt() {
    }

    public FeeReceipt(String receiptNumber, FeePayment payment, User student, StudentFee studentFee,
                      BigDecimal amountPaid, LocalDate paymentDate, PaymentMethod paymentMethod,
                      String referenceNumber, BigDecimal previousPendingAmount,
                      BigDecimal remainingPendingAmount, BigDecimal totalFeeAmount, User issuedBy) {
        this.receiptNumber = receiptNumber;
        this.payment = payment;
        this.student = student;
        this.studentFee = studentFee;
        this.amountPaid = amountPaid;
        this.paymentDate = paymentDate;
        this.paymentMethod = paymentMethod;
        this.referenceNumber = referenceNumber;
        this.previousPendingAmount = previousPendingAmount;
        this.remainingPendingAmount = remainingPendingAmount;
        this.totalFeeAmount = totalFeeAmount;
        this.issuedBy = issuedBy;
        this.schoolName = "Apex International School";
        this.schoolAddress = "104 Institutional Enclave, Sector 12, New Delhi";
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getReceiptNumber() {
        return receiptNumber;
    }

    public void setReceiptNumber(String receiptNumber) {
        this.receiptNumber = receiptNumber;
    }

    public FeePayment getPayment() {
        return payment;
    }

    public void setPayment(FeePayment payment) {
        this.payment = payment;
    }

    public User getStudent() {
        return student;
    }

    public void setStudent(User student) {
        this.student = student;
    }

    public StudentFee getStudentFee() {
        return studentFee;
    }

    public void setStudentFee(StudentFee studentFee) {
        this.studentFee = studentFee;
    }

    public BigDecimal getAmountPaid() {
        return amountPaid;
    }

    public void setAmountPaid(BigDecimal amountPaid) {
        this.amountPaid = amountPaid;
    }

    public LocalDate getPaymentDate() {
        return paymentDate;
    }

    public void setPaymentDate(LocalDate paymentDate) {
        this.paymentDate = paymentDate;
    }

    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(PaymentMethod paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getReferenceNumber() {
        return referenceNumber;
    }

    public void setReferenceNumber(String referenceNumber) {
        this.referenceNumber = referenceNumber;
    }

    public BigDecimal getPreviousPendingAmount() {
        return previousPendingAmount;
    }

    public void setPreviousPendingAmount(BigDecimal previousPendingAmount) {
        this.previousPendingAmount = previousPendingAmount;
    }

    public BigDecimal getRemainingPendingAmount() {
        return remainingPendingAmount;
    }

    public void setRemainingPendingAmount(BigDecimal remainingPendingAmount) {
        this.remainingPendingAmount = remainingPendingAmount;
    }

    public BigDecimal getTotalFeeAmount() {
        return totalFeeAmount;
    }

    public void setTotalFeeAmount(BigDecimal totalFeeAmount) {
        this.totalFeeAmount = totalFeeAmount;
    }

    public User getIssuedBy() {
        return issuedBy;
    }

    public void setIssuedBy(User issuedBy) {
        this.issuedBy = issuedBy;
    }

    public String getSchoolName() {
        return schoolName;
    }

    public void setSchoolName(String schoolName) {
        this.schoolName = schoolName;
    }

    public String getSchoolAddress() {
        return schoolAddress;
    }

    public void setSchoolAddress(String schoolAddress) {
        this.schoolAddress = schoolAddress;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
