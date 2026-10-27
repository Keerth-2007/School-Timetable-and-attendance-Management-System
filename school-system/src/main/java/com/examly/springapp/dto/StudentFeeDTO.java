package com.examly.springapp.dto;

import com.examly.springapp.entity.FeeStatus;
import com.examly.springapp.entity.FeeType;
import com.examly.springapp.entity.StudentFee;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class StudentFeeDTO {

    private Long id;
    private Long studentId;
    private String studentName;
    private String studentEmail;
    private String admissionNumber;
    private String classSection;
    private Long feeStructureId;
    private String academicYear;
    private FeeType feeType;
    private String feeName;
    private BigDecimal amount;
    private BigDecimal discount;
    private String discountReason;
    private BigDecimal finalAmount;
    private BigDecimal paidAmount;
    private BigDecimal pendingAmount;
    private LocalDate dueDate;
    private FeeStatus status;
    private Long calendarEventId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public StudentFeeDTO() {
    }

    public static StudentFeeDTO fromEntity(StudentFee entity) {
        if (entity == null) return null;
        StudentFeeDTO dto = new StudentFeeDTO();
        dto.setId(entity.getId());
        if (entity.getStudent() != null) {
            dto.setStudentId(entity.getStudent().getId());
            dto.setStudentName(entity.getStudent().getName());
            dto.setStudentEmail(entity.getStudent().getEmail());
            dto.setAdmissionNumber(entity.getStudent().getAdmissionNumber());
            dto.setClassSection(entity.getStudent().getClassSection());
        }
        if (entity.getClassSection() != null) {
            dto.setClassSection(entity.getClassSection());
        }
        if (entity.getFeeStructure() != null) {
            dto.setFeeStructureId(entity.getFeeStructure().getId());
        }
        dto.setAcademicYear(entity.getAcademicYear());
        dto.setFeeType(entity.getFeeType());
        dto.setFeeName(entity.getFeeName());
        dto.setAmount(entity.getAmount());
        dto.setDiscount(entity.getDiscount());
        dto.setDiscountReason(entity.getDiscountReason());
        dto.setFinalAmount(entity.getFinalAmount());
        dto.setPaidAmount(entity.getPaidAmount());
        dto.setPendingAmount(entity.getPendingAmount());
        dto.setDueDate(entity.getDueDate());
        dto.setStatus(entity.getStatus());
        dto.setCalendarEventId(entity.getCalendarEventId());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public Long getFeeStructureId() {
        return feeStructureId;
    }

    public void setFeeStructureId(Long feeStructureId) {
        this.feeStructureId = feeStructureId;
    }

    public String getAcademicYear() {
        return academicYear;
    }

    public void setAcademicYear(String academicYear) {
        this.academicYear = academicYear;
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

    public String getName() {
        return feeName;
    }

    public void setFeeName(String feeName) {
        this.feeName = feeName;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public BigDecimal getBaseAmount() {
        return amount;
    }

    public BigDecimal getDiscountAmount() {
        return discount;
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
