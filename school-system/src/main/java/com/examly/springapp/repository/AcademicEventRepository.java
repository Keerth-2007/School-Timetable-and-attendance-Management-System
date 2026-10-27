package com.examly.springapp.repository;

import com.examly.springapp.entity.AcademicEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AcademicEventRepository extends JpaRepository<AcademicEvent, Long> {

    List<AcademicEvent> findByAcademicYear(String academicYear);

    List<AcademicEvent> findByStartDateBetween(LocalDate startDate, LocalDate endDate);

    List<AcademicEvent> findByAcademicYearAndStartDateBetween(String academicYear, LocalDate startDate, LocalDate endDate);

    List<AcademicEvent> findByLeaveApplicationId(Long leaveApplicationId);

    Optional<AcademicEvent> findFirstByLeaveApplicationId(Long leaveApplicationId);

    @Query("SELECT e FROM AcademicEvent e WHERE e.status != 'CANCELLED' AND " +
           "((e.startDate BETWEEN :start AND :end) OR (e.endDate BETWEEN :start AND :end) OR " +
           "(e.startDate <= :start AND e.endDate >= :end)) ORDER BY e.startDate ASC, e.startTime ASC")
    List<AcademicEvent> findActiveEventsInDateRange(@Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT e FROM AcademicEvent e WHERE e.status != 'CANCELLED' AND e.startDate >= :today " +
           "ORDER BY e.startDate ASC, e.startTime ASC")
    List<AcademicEvent> findUpcomingEvents(@Param("today") LocalDate today);

    @Query("SELECT CASE WHEN COUNT(e) > 0 THEN true ELSE false END FROM AcademicEvent e " +
           "WHERE e.eventType = 'HOLIDAY' AND e.status = 'PUBLISHED' " +
           "AND :date BETWEEN e.startDate AND e.endDate")
    boolean isSchoolHoliday(@Param("date") LocalDate date);
}
