package com.examly.springapp.repository;

import com.examly.springapp.entity.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssignmentRepository extends JpaRepository<Assignment, Long> {

    List<Assignment> findByClassSectionOrderByDeadlineAsc(String classSection);

    List<Assignment> findByAssignedByIdOrderByCreatedAtDesc(Long teacherId);

    List<Assignment> findByClassSectionAndSubjectId(String classSection, Long subjectId);

    @Query("SELECT a FROM Assignment a WHERE a.classSection = :classSection ORDER BY a.deadline ASC")
    List<Assignment> findForClassSection(@Param("classSection") String classSection);
}
