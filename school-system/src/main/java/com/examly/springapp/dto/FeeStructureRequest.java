package com.examly.springapp.dto;

import com.examly.springapp.entity.FeeType;

import java.math.BigDecimal;
import java.time.LocalDate;

public class FeeStructureRequest {

    private String academicYear = "2026-2027";
    private String classSection;
    private FeeType feeType = FeeType.TUITION;
    private String feeName;
    private BigDecimal amount;
    private LocalDate dueDate;
    private String term;
    private String description;
    private Boolean active = true;

    public FeeStructureRequest() {
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

    public void setName(String name) {
        this.feeName = name;
    }

    public String getFrequency() {
        return term;
    }

    public void setFrequency(String frequency) {
        this.term = frequency;
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

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }
}
