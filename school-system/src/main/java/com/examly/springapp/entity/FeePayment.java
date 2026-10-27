package com.examly.springapp.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "fee_payments", indexes = {
        @Index(name = "idx_fp_receipt_number", columnList = "receipt_number", unique = true),
        @Index(name = "idx_fp_student_id", columnList = "student_id"),
        @Index(name = "idx_fp_student_fee_id", columnList = "student_fee_id"),
        @Index(name = "idx_fp_payment_date", columnList = "payment_date")
})
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class FeePayment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "receipt_number", nullable = false, unique = true, length = 50)
    private String receiptNumber;

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
    private PaymentMethod paymentMethod = PaymentMethod.CASH;

    @Column(name = "reference_number")
    private String referenceNumber;

    @Column(columnDefinition = "TEXT")
    private String remarks;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "recorded_by")
    private User recordedBy;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public FeePayment() {
    }

    public FeePayment(String receiptNumber, User student, StudentFee studentFee, BigDecimal amountPaid,
                      LocalDate paymentDate, PaymentMethod paymentMethod, String referenceNumber,
                      String remarks, User recordedBy) {
        this.receiptNumber = receiptNumber;
        this.student = student;
        this.studentFee = studentFee;
        this.amountPaid = amountPaid;
        this.paymentDate = paymentDate;
        this.paymentMethod = paymentMethod;
        this.referenceNumber = referenceNumber;
        this.remarks = remarks;
        this.recordedBy = recordedBy;
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (paymentDate == null) {
            paymentDate = LocalDate.now();
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

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public User getRecordedBy() {
        return recordedBy;
    }

    public void setRecordedBy(User recordedBy) {
        this.recordedBy = recordedBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
