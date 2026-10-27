package com.examly.springapp.dto;

import com.examly.springapp.entity.FeeStructure;
import com.examly.springapp.entity.FeeType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class FeeStructureDTO {

    private Long id;
    private String academicYear;
    private String classSection;
    private FeeType feeType;
    private String feeName;
    private BigDecimal amount;
    private LocalDate dueDate;
    private String term;
    private String description;
    private boolean active;
    private String createdByName;
    private Long createdById;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public FeeStructureDTO() {
    }

    public static FeeStructureDTO fromEntity(FeeStructure entity) {
        if (entity == null) return null;
        FeeStructureDTO dto = new FeeStructureDTO();
        dto.setId(entity.getId());
        dto.setAcademicYear(entity.getAcademicYear());
        dto.setClassSection(entity.getClassSection());
        dto.setFeeType(entity.getFeeType());
        dto.setFeeName(entity.getFeeName());
        dto.setAmount(entity.getAmount());
        dto.setDueDate(entity.getDueDate());
        dto.setTerm(entity.getTerm());
        dto.setDescription(entity.getDescription());
        dto.setActive(entity.isActive());
        if (entity.getCreatedBy() != null) {
            dto.setCreatedByName(entity.getCreatedBy().getName());
            dto.setCreatedById(entity.getCreatedBy().getId());
        }
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

    public String getName() {
        return feeName;
    }

    public String getFrequency() {
        return term;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public String getTerm() {
        return term;
    }

    public void setTerm(String term) {
        this.term = term;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public String getCreatedByName() {
        return createdByName;
    }

    public void setCreatedByName(String createdByName) {
        this.createdByName = createdByName;
    }

    public Long getCreatedById() {
        return createdById;
    }

    public void setCreatedById(Long createdById) {
        this.createdById = createdById;
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
