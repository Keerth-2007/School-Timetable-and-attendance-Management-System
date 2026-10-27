package com.examly.springapp.repository;

import com.examly.springapp.entity.FeeReceipt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FeeReceiptRepository extends JpaRepository<FeeReceipt, Long> {

    Optional<FeeReceipt> findByReceiptNumber(String receiptNumber);

    Optional<FeeReceipt> findByPaymentId(Long paymentId);

    List<FeeReceipt> findByStudentIdOrderByCreatedAtDesc(Long studentId);
}
