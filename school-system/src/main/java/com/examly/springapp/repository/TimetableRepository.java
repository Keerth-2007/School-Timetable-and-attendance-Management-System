package com.examly.springapp.repository;

import com.examly.springapp.entity.Timetable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TimetableRepository extends JpaRepository<Timetable, Long> {

    List<Timetable> findByClassSectionAndIsActiveTrue(String classSection);

    List<Timetable> findByClassSectionAndDayAndIsActiveTrueOrderByPeriodAsc(String classSection, Timetable.Day day);

    List<Timetable> findByTeacherIdAndIsActiveTrue(Long teacherId);

    // Used for clash detection: is this teacher already teaching on this day/period?
    List<Timetable> findByTeacherIdAndDayAndPeriodAndIsActiveTrue(
            Long teacherId, Timetable.Day day, Integer period);

    // Used to find teachers who are FREE at a given day/period (for substitution)
    List<Timetable> findByDayAndPeriodAndIsActiveTrue(Timetable.Day day, Integer period);
}
