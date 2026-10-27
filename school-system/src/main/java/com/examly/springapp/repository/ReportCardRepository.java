package com.examly.springapp.repository;

import com.examly.springapp.entity.ReportCard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReportCardRepository extends JpaRepository<ReportCard, Long> {

    List<ReportCard> findByStudentId(Long studentId);

    List<ReportCard> findByStudentIdAndAcademicYear(Long studentId, String academicYear);

    Optional<ReportCard> findByStudentIdAndExamNameAndAcademicYear(Long studentId, String examName, String academicYear);

    List<ReportCard> findByStudentIdAndStatus(Long studentId, String status);

    List<ReportCard> findByStudentIdAndAcademicYearAndStatus(Long studentId, String academicYear, String status);

    @Query("SELECT DISTINCT r.examName FROM ReportCard r WHERE r.student.id = :studentId ORDER BY r.examName")
    List<String> findDistinctExamNamesByStudentId(Long studentId);
}
