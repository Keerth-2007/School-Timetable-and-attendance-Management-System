package com.examly.springapp.repository;

import com.examly.springapp.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface AttendanceRepository
        extends JpaRepository<Attendance, Long> {

    List<Attendance> findByStudentIdOrderByDateAsc(Long studentId);

    List<Attendance> findByStudentIdOrderByDateAscPeriodAsc(Long studentId);

    List<Attendance> findByStudentIdAndDateBetweenOrderByDateAscPeriodAsc(
            Long studentId,
            LocalDate startDate,
            LocalDate endDate
    );

    List<Attendance> findByStudentClassSectionAndDate(
            String classSection,
            LocalDate date
    );

    List<Attendance> findByStudentClassSectionAndDateOrderByPeriodAsc(
            String classSection,
            LocalDate date
    );

    List<Attendance> findByStudentClassSectionAndDateAndPeriod(
            String classSection,
            LocalDate date,
            Integer period
    );

    List<Attendance> findByStudentClassSectionAndDateBetweenOrderByDateAscPeriodAsc(
            String classSection,
            LocalDate startDate,
            LocalDate endDate
    );

    java.util.Optional<Attendance> findByStudentIdAndDate(Long studentId, LocalDate date);

    java.util.Optional<Attendance> findByStudentIdAndDateAndPeriod(
            Long studentId,
            LocalDate date,
            Integer period
    );
}