package com.examly.springapp.dto;

import com.examly.springapp.entity.FeePayment;
import com.examly.springapp.entity.FeeType;
import com.examly.springapp.entity.PaymentMethod;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class FeePaymentDTO {

    private Long id;
    private String receiptNumber;
    private Long studentId;
    private String studentName;
    private String studentEmail;
    private String admissionNumber;
    private String classSection;
    private Long studentFeeId;
    private FeeType feeType;
    private String feeName;
    private BigDecimal amountPaid;
    private LocalDate paymentDate;
    private PaymentMethod paymentMethod;
    private String referenceNumber;
    private String remarks;
    private String recordedByName;
    private LocalDateTime createdAt;

    public FeePaymentDTO() {
    }

    public static FeePaymentDTO fromEntity(FeePayment entity) {
        if (entity == null) return null;
        FeePaymentDTO dto = new FeePaymentDTO();
        dto.setId(entity.getId());
        dto.setReceiptNumber(entity.getReceiptNumber());
        if (entity.getStudent() != null) {
            dto.setStudentId(entity.getStudent().getId());
            dto.setStudentName(entity.getStudent().getName());
            dto.setStudentEmail(entity.getStudent().getEmail());
            dto.setAdmissionNumber(entity.getStudent().getAdmissionNumber());
            dto.setClassSection(entity.getStudent().getClassSection());
        }
        if (entity.getStudentFee() != null) {
            dto.setStudentFeeId(entity.getStudentFee().getId());
            dto.setFeeType(entity.getStudentFee().getFeeType());
            dto.setFeeName(entity.getStudentFee().getFeeName());
            if (dto.getClassSection() == null) {
                dto.setClassSection(entity.getStudentFee().getClassSection());
            }
        }
        dto.setAmountPaid(entity.getAmountPaid());
        dto.setPaymentDate(entity.getPaymentDate());
        dto.setPaymentMethod(entity.getPaymentMethod());
        dto.setReferenceNumber(entity.getReferenceNumber());
        dto.setRemarks(entity.getRemarks());
        if (entity.getRecordedBy() != null) {
            dto.setRecordedByName(entity.getRecordedBy().getName());
        }
        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
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

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }

    public String getStudentEmail() {
        return studentEmail;
    }

    public void setStudentEmail(String studentEmail) {
        this.studentEmail = studentEmail;
    }

    public String getAdmissionNumber() {
        return admissionNumber;
    }

    public void setAdmissionNumber(String admissionNumber) {
        this.admissionNumber = admissionNumber;
    }

    public String getClassSection() {
        return classSection;
    }

    public void setClassSection(String classSection) {
        this.classSection = classSection;
    }

    public Long getStudentFeeId() {
        return studentFeeId;
    }

    public void setStudentFeeId(Long studentFeeId) {
        this.studentFeeId = studentFeeId;
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

    public BigDecimal getAmountPaid() {
        return amountPaid;
    }

    public BigDecimal getAmount() {
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

    public String getTransactionReference() {
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

    public String getRecordedByName() {
        return recordedByName;
    }

    public void setRecordedByName(String recordedByName) {
        this.recordedByName = recordedByName;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
