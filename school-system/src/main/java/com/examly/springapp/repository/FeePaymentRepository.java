package com.examly.springapp.repository;

import com.examly.springapp.entity.FeePayment;
import com.examly.springapp.entity.PaymentMethod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface FeePaymentRepository extends JpaRepository<FeePayment, Long> {

    Optional<FeePayment> findByReceiptNumber(String receiptNumber);

    List<FeePayment> findByStudentIdOrderByPaymentDateDescCreatedAtDesc(Long studentId);

    List<FeePayment> findByStudentFeeIdOrderByPaymentDateDescCreatedAtDesc(Long studentFeeId);

    List<FeePayment> findAllByOrderByPaymentDateDescCreatedAtDesc();

    @Query("SELECT p FROM FeePayment p WHERE " +
            "(:studentId IS NULL OR p.student.id = :studentId) AND " +
            "(:classSection IS NULL OR p.student.classSection = :classSection) AND " +
            "(:paymentMethod IS NULL OR p.paymentMethod = :paymentMethod) AND " +
            "(:startDate IS NULL OR p.paymentDate >= :startDate) AND " +
            "(:endDate IS NULL OR p.paymentDate <= :endDate) " +
            "ORDER BY p.paymentDate DESC, p.createdAt DESC")
    List<FeePayment> searchPayments(@Param("studentId") Long studentId,
                                    @Param("classSection") String classSection,
                                    @Param("paymentMethod") PaymentMethod paymentMethod,
                                    @Param("startDate") LocalDate startDate,
                                    @Param("endDate") LocalDate endDate);

    @Query("SELECT COUNT(p) FROM FeePayment p")
    long countTotalPayments();
}
