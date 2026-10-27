package com.examly.springapp.repository;

import com.examly.springapp.entity.FeeStatus;
import com.examly.springapp.entity.FeeType;
import com.examly.springapp.entity.StudentFee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface StudentFeeRepository extends JpaRepository<StudentFee, Long> {

    List<StudentFee> findByStudentIdOrderByCreatedAtDesc(Long studentId);

    List<StudentFee> findByStudentIdAndAcademicYear(Long studentId, String academicYear);

    List<StudentFee> findByClassSectionOrderByCreatedAtDesc(String classSection);

    List<StudentFee> findByClassSectionAndAcademicYear(String classSection, String academicYear);

    List<StudentFee> findByStatus(FeeStatus status);

    List<StudentFee> findByAcademicYear(String academicYear);

    @Query("SELECT sf FROM StudentFee sf WHERE " +
            "(:academicYear IS NULL OR sf.academicYear = :academicYear) AND " +
            "(:classSection IS NULL OR sf.classSection = :classSection) AND " +
            "(:feeType IS NULL OR sf.feeType = :feeType) AND " +
            "(:status IS NULL OR sf.status = :status) " +
            "ORDER BY sf.createdAt DESC")
    List<StudentFee> searchFees(@Param("academicYear") String academicYear,
                                @Param("classSection") String classSection,
                                @Param("feeType") FeeType feeType,
                                @Param("status") FeeStatus status);

    @Query("SELECT sf FROM StudentFee sf WHERE sf.pendingAmount > 0 ORDER BY sf.dueDate ASC")
    List<StudentFee> findAllPendingFees();

    @Query("SELECT sf FROM StudentFee sf WHERE sf.feeStructure.id = :feeStructureId")
    List<StudentFee> findByFeeStructureId(@Param("feeStructureId") Long feeStructureId);

    @Query("SELECT COALESCE(SUM(sf.finalAmount), 0) FROM StudentFee sf")
    BigDecimal sumTotalFees();

    @Query("SELECT COALESCE(SUM(sf.paidAmount), 0) FROM StudentFee sf")
    BigDecimal sumTotalCollected();

    @Query("SELECT COALESCE(SUM(sf.pendingAmount), 0) FROM StudentFee sf")
    BigDecimal sumTotalPending();

    @Query("SELECT COALESCE(SUM(sf.pendingAmount), 0) FROM StudentFee sf WHERE sf.status = com.examly.springapp.entity.FeeStatus.OVERDUE")
    BigDecimal sumTotalOverdue();

    long countByStatus(FeeStatus status);

    @Query("SELECT COUNT(DISTINCT sf.student.id) FROM StudentFee sf")
    long countDistinctStudentsWithFees();

    @Query("SELECT COUNT(DISTINCT sf.student.id) FROM StudentFee sf WHERE sf.status = com.examly.springapp.entity.FeeStatus.PAID")
    long countDistinctPaidStudents();

    @Query("SELECT COUNT(DISTINCT sf.student.id) FROM StudentFee sf WHERE sf.status IN (com.examly.springapp.entity.FeeStatus.PENDING, com.examly.springapp.entity.FeeStatus.PARTIALLY_PAID, com.examly.springapp.entity.FeeStatus.OVERDUE)")
    long countDistinctPendingStudents();
}
