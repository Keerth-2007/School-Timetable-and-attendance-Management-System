package com.examly.springapp.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class FeeDashboardSummaryDTO {

    private BigDecimal totalFees = BigDecimal.ZERO;
    private BigDecimal totalCollected = BigDecimal.ZERO;
    private BigDecimal totalPending = BigDecimal.ZERO;
    private BigDecimal totalOverdue = BigDecimal.ZERO;

    private long paidStudentsCount;
    private long pendingStudentsCount;
    private long partiallyPaidStudentsCount;
    private long totalStudentsWithFees;
    private long totalStructuresCount;

    private List<FeePaymentDTO> recentPayments = new ArrayList<>();

    public FeeDashboardSummaryDTO() {
    }

    public BigDecimal getTotalFees() {
        return totalFees;
    }

    public void setTotalFees(BigDecimal totalFees) {
        this.totalFees = totalFees;
    }

    public BigDecimal getTotalCollected() {
        return totalCollected;
    }

    public void setTotalCollected(BigDecimal totalCollected) {
        this.totalCollected = totalCollected;
    }

    public BigDecimal getTotalPending() {
        return totalPending;
    }

    public void setTotalPending(BigDecimal totalPending) {
        this.totalPending = totalPending;
    }

    public BigDecimal getTotalOverdue() {
        return totalOverdue;
    }

    public void setTotalOverdue(BigDecimal totalOverdue) {
        this.totalOverdue = totalOverdue;
    }

    public long getPaidStudentsCount() {
        return paidStudentsCount;
    }

    public void setPaidStudentsCount(long paidStudentsCount) {
        this.paidStudentsCount = paidStudentsCount;
    }

    public long getPendingStudentsCount() {
        return pendingStudentsCount;
    }

    public void setPendingStudentsCount(long pendingStudentsCount) {
        this.pendingStudentsCount = pendingStudentsCount;
    }

    public long getPartiallyPaidStudentsCount() {
        return partiallyPaidStudentsCount;
    }

    public void setPartiallyPaidStudentsCount(long partiallyPaidStudentsCount) {
        this.partiallyPaidStudentsCount = partiallyPaidStudentsCount;
    }

    public long getTotalStudentsWithFees() {
        return totalStudentsWithFees;
    }

    public void setTotalStudentsWithFees(long totalStudentsWithFees) {
        this.totalStudentsWithFees = totalStudentsWithFees;
    }

    public long getTotalStructuresCount() {
        return totalStructuresCount;
    }

    public long getTotalStructures() {
        return totalStructuresCount;
    }

    public long getPaidCount() {
        return paidStudentsCount;
    }

    public void setTotalStructuresCount(long totalStructuresCount) {
        this.totalStructuresCount = totalStructuresCount;
    }

    public List<FeePaymentDTO> getRecentPayments() {
        return recentPayments;
    }

    public void setRecentPayments(List<FeePaymentDTO> recentPayments) {
        this.recentPayments = recentPayments;
    }
}
