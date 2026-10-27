package com.examly.springapp.repository;

import com.examly.springapp.entity.ExamResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExamResultRepository extends JpaRepository<ExamResult, Long> {

    List<ExamResult> findByStudentIdAndAcademicYear(Long studentId, String academicYear);

    List<ExamResult> findByStudentIdAndExamNameAndAcademicYear(Long studentId, String examName, String academicYear);

    Optional<ExamResult> findByStudentIdAndSubjectIdAndExamNameAndAcademicYear(
            Long studentId, Long subjectId, String examName, String academicYear);

    @Query("SELECT DISTINCT e.examName FROM ExamResult e WHERE e.student.id = :studentId ORDER BY e.examName")
    List<String> findDistinctExamNamesByStudentId(Long studentId);

    @Query("SELECT DISTINCT e.examName FROM ExamResult e ORDER BY e.examName")
    List<String> findAllDistinctExamNames();

    @Query("SELECT DISTINCT e.academicYear FROM ExamResult e ORDER BY e.academicYear")
    List<String> findAllDistinctAcademicYears();
}
