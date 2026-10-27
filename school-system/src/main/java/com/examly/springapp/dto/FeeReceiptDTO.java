package com.examly.springapp.dto;

import com.examly.springapp.entity.FeeReceipt;
import com.examly.springapp.entity.FeeStatus;
import com.examly.springapp.entity.FeeType;
import com.examly.springapp.entity.PaymentMethod;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class FeeReceiptDTO {

    private Long id;
    private String receiptNumber;
    private Long paymentId;
    private Long studentId;
    private String studentName;
    private String studentEmail;
    private String admissionNumber;
    private String classSection;
    private Long studentFeeId;
    private FeeType feeType;
    private String feeName;
    private String academicYear;
    private BigDecimal amountPaid;
    private LocalDate paymentDate;
    private PaymentMethod paymentMethod;
    private String referenceNumber;
    private BigDecimal previousPendingAmount;
    private BigDecimal remainingPendingAmount;
    private BigDecimal totalFeeAmount;
    private FeeStatus studentFeeStatus;
    private String issuedByName;
    private String schoolName;
    private String schoolAddress;
    private LocalDateTime createdAt;

    public FeeReceiptDTO() {
    }

    public static FeeReceiptDTO fromEntity(FeeReceipt entity) {
        if (entity == null) return null;
        FeeReceiptDTO dto = new FeeReceiptDTO();
        dto.setId(entity.getId());
        dto.setReceiptNumber(entity.getReceiptNumber());
        if (entity.getPayment() != null) {
            dto.setPaymentId(entity.getPayment().getId());
        }
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
            dto.setAcademicYear(entity.getStudentFee().getAcademicYear());
            dto.setStudentFeeStatus(entity.getStudentFee().getStatus());
            if (dto.getClassSection() == null) {
                dto.setClassSection(entity.getStudentFee().getClassSection());
            }
        }
        dto.setAmountPaid(entity.getAmountPaid());
        dto.setPaymentDate(entity.getPaymentDate());
        dto.setPaymentMethod(entity.getPaymentMethod());
        dto.setReferenceNumber(entity.getReferenceNumber());
        dto.setPreviousPendingAmount(entity.getPreviousPendingAmount());
        dto.setRemainingPendingAmount(entity.getRemainingPendingAmount());
        dto.setTotalFeeAmount(entity.getTotalFeeAmount());
        if (entity.getIssuedBy() != null) {
            dto.setIssuedByName(entity.getIssuedBy().getName());
        }
        dto.setSchoolName(entity.getSchoolName());
        dto.setSchoolAddress(entity.getSchoolAddress());
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

    public Long getPaymentId() {
        return paymentId;
    }

    public void setPaymentId(Long paymentId) {
        this.paymentId = paymentId;
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

    public String getAcademicYear() {
        return academicYear;
    }

    public void setAcademicYear(String academicYear) {
        this.academicYear = academicYear;
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

    public BigDecimal getBalanceRemaining() {
        return remainingPendingAmount;
    }

    public BigDecimal getRemainingBalance() {
        return remainingPendingAmount;
    }

    public FeeStatus getStudentFeeStatus() {
        return studentFeeStatus;
    }

    public void setStudentFeeStatus(FeeStatus studentFeeStatus) {
        this.studentFeeStatus = studentFeeStatus;
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

    public String getIssuedByName() {
        return issuedByName;
    }

    public void setIssuedByName(String issuedByName) {
        this.issuedByName = issuedByName;
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
