package com.examly.springapp.dto;

import com.examly.springapp.entity.PaymentMethod;

import java.math.BigDecimal;
import java.time.LocalDate;

public class RecordPaymentRequest {

    private Long studentId;
    private Long studentFeeId;
    private BigDecimal amountPaid;
    private LocalDate paymentDate = LocalDate.now();
    private PaymentMethod paymentMethod = PaymentMethod.CASH;
    private String referenceNumber;
    private String remarks;

    public RecordPaymentRequest() {
    }

    public RecordPaymentRequest(Long studentId, Long studentFeeId, BigDecimal amountPaid,
                                LocalDate paymentDate, PaymentMethod paymentMethod,
                                String referenceNumber, String remarks) {
        this.studentId = studentId;
        this.studentFeeId = studentFeeId;
        this.amountPaid = amountPaid;
        this.paymentDate = paymentDate;
        this.paymentMethod = paymentMethod;
        this.referenceNumber = referenceNumber;
        this.remarks = remarks;
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public Long getStudentFeeId() {
        return studentFeeId;
    }

    public void setStudentFeeId(Long studentFeeId) {
        this.studentFeeId = studentFeeId;
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

    public BigDecimal getAmount() {
        return amountPaid;
    }

    public void setAmount(BigDecimal amount) {
        this.amountPaid = amount;
    }

    public String getTransactionReference() {
        return referenceNumber;
    }

    public void setTransactionReference(String transactionReference) {
        this.referenceNumber = transactionReference;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }
}
