package com.examly.springapp.repository;

import com.examly.springapp.entity.FeeStructure;
import com.examly.springapp.entity.FeeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeeStructureRepository extends JpaRepository<FeeStructure, Long> {

    List<FeeStructure> findByAcademicYearOrderByCreatedAtDesc(String academicYear);

    List<FeeStructure> findByActiveTrueOrderByCreatedAtDesc();

    List<FeeStructure> findByClassSectionAndAcademicYear(String classSection, String academicYear);

    List<FeeStructure> findByFeeType(FeeType feeType);
}
