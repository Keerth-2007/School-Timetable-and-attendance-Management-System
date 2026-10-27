package com.examly.springapp.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "fee_structures", indexes = {
        @Index(name = "idx_fs_academic_year", columnList = "academic_year"),
        @Index(name = "idx_fs_class_section", columnList = "class_section"),
        @Index(name = "idx_fs_fee_type", columnList = "fee_type")
})
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class FeeStructure {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "academic_year", nullable = false)
    private String academicYear = "2026-2027";

    @Column(name = "class_section")
    private String classSection; // e.g. "8A" or "8" or "ALL"

    @Enumerated(EnumType.STRING)
    @Column(name = "fee_type", nullable = false)
    private FeeType feeType = FeeType.TUITION;

    @Column(name = "fee_name", nullable = false)
    private String feeName;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "term")
    private String term; // e.g. "Term 1", "Semester 1", "Annual"

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private boolean active = true;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public FeeStructure() {
    }

    public FeeStructure(String academicYear, String classSection, FeeType feeType, String feeName,
                        BigDecimal amount, LocalDate dueDate, String term, String description, User createdBy) {
        this.academicYear = academicYear;
        this.classSection = classSection;
        this.feeType = feeType;
        this.feeName = feeName;
        this.amount = amount;
        this.dueDate = dueDate;
        this.term = term;
        this.description = description;
        this.createdBy = createdBy;
        this.active = true;
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
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

    public User getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(User createdBy) {
        this.createdBy = createdBy;
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
