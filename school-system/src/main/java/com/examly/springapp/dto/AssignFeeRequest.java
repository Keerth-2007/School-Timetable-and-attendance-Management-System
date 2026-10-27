package com.examly.springapp.dto;

import com.examly.springapp.entity.FeeType;

import java.math.BigDecimal;
import java.time.LocalDate;

public class AssignFeeRequest {

    private Long studentId; // If assigning to single student
    private String classSection; // e.g. "8A" (if assigning to all students in section)
    private Long feeStructureId; // Optional link to fee structure template
    private String academicYear = "2026-2027";
    private FeeType feeType = FeeType.TUITION;
    private String feeName;
    private BigDecimal amount;
    private BigDecimal discount = BigDecimal.ZERO;
    private String discountReason;
    private LocalDate dueDate;

    public AssignFeeRequest() {
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
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

    public void setFeeName(String feeName) {
        this.feeName = feeName;
    }

    public void setName(String name) {
        this.feeName = name;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public void setBaseAmount(BigDecimal baseAmount) {
        this.amount = baseAmount;
    }

    public BigDecimal getDiscount() {
        return discount;
    }

    public void setDiscount(BigDecimal discount) {
        this.discount = discount;
    }

    public void setDiscountAmount(BigDecimal discountAmount) {
        this.discount = discountAmount;
    }

    public String getDiscountReason() {
        return discountReason;
    }

    public void setDiscountReason(String discountReason) {
        this.discountReason = discountReason;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }
}
