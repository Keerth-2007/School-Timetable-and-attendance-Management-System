package com.examly.springapp.service;

import com.examly.springapp.entity.Timetable;
import com.examly.springapp.exception.ResourceNotFoundException;
import com.examly.springapp.exception.TimetableClashException;
import com.examly.springapp.repository.TimetableRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class TimetableService {

    @Autowired
    private TimetableRepository timetableRepository;

    private void validatePeriod(Integer period) {
        if (period == null || period < 1 || period > 8) {
            throw new IllegalArgumentException("Period must be between 1 and 8");
        }
    }

    // FR4: create a slot only if the teacher is not already booked at that day+period
    public Timetable createSlot(Timetable slot) {
        validatePeriod(slot.getPeriod());
        if (slot.getTeacher() != null && slot.getTeacher().getId() != null) {
            checkClash(slot.getTeacher().getId(), slot.getDay(), slot.getPeriod());
        }
        slot.setIsActive(true);
        return timetableRepository.save(slot);
    }

    public Timetable updateSlot(Long id, Timetable updated) {
        Timetable existing = getById(id);
        validatePeriod(updated.getPeriod());

        // Only re-check clash if teacher/day/period actually changed
        boolean teacherOrSlotChanged =
                (existing.getTeacher() != null && updated.getTeacher() != null
                        && !existing.getTeacher().getId().equals(updated.getTeacher().getId()))
                        || existing.getDay() != updated.getDay()
                        || !existing.getPeriod().equals(updated.getPeriod());

        if (teacherOrSlotChanged && updated.getTeacher() != null && updated.getTeacher().getId() != null) {
            checkClash(updated.getTeacher().getId(), updated.getDay(), updated.getPeriod());
        }

        existing.setClassSection(updated.getClassSection());
        existing.setDay(updated.getDay());
        existing.setPeriod(updated.getPeriod());
        existing.setSubject(updated.getSubject());
        existing.setTeacher(updated.getTeacher());
        existing.setRoom(updated.getRoom());
        existing.setEffectiveFrom(updated.getEffectiveFrom());
        return timetableRepository.save(existing);
    }

    // Throws TimetableClashException if the teacher already has a class in this slot (FR10)
    private void checkClash(Long teacherId, Timetable.Day day, Integer period) {
        List<Timetable> existingSlots =
                timetableRepository.findByTeacherIdAndDayAndPeriodAndIsActiveTrue(teacherId, day, period);
        if (!existingSlots.isEmpty()) {
            throw new TimetableClashException(
                    "Teacher already assigned at this time slot — cannot double-book");
        }
    }

    // FR4 & Appendix H: Detect and list all scheduling conflicts across teachers & rooms
    public List<Map<String, Object>> detectClashes() {
        List<Timetable> activeSlots = timetableRepository.findAll().stream()
                .filter(t -> Boolean.TRUE.equals(t.getIsActive()))
                .toList();
        List<Map<String, Object>> clashes = new ArrayList<>();

        Map<String, List<Timetable>> byDayPeriod = activeSlots.stream()
                .collect(Collectors.groupingBy(t -> t.getDay() + "-" + t.getPeriod()));

        for (Map.Entry<String, List<Timetable>> entry : byDayPeriod.entrySet()) {
            List<Timetable> slotList = entry.getValue();

            // Teacher clashes
            Map<Long, List<Timetable>> byTeacher = slotList.stream()
                    .filter(t -> t.getTeacher() != null && t.getTeacher().getId() != null)
                    .collect(Collectors.groupingBy(t -> t.getTeacher().getId()));

            for (Map.Entry<Long, List<Timetable>> teacherEntry : byTeacher.entrySet()) {
                if (teacherEntry.getValue().size() > 1) {
                    List<String> classes = teacherEntry.getValue().stream().map(Timetable::getClassSection).toList();
                    clashes.add(Map.of(
                            "type", "TEACHER_CLASH",
                            "day", teacherEntry.getValue().get(0).getDay().name(),
                            "period", teacherEntry.getValue().get(0).getPeriod(),
                            "teacherName", teacherEntry.getValue().get(0).getTeacher().getName(),
                            "teacherId", teacherEntry.getKey(),
                            "conflictingClasses", classes,
                            "message", "Teacher already assigned at this time slot — cannot double-book"
                    ));
                }
            }

            // Room clashes
            Map<Long, List<Timetable>> byRoom = slotList.stream()
                    .filter(t -> t.getRoom() != null && t.getRoom().getId() != null)
                    .collect(Collectors.groupingBy(t -> t.getRoom().getId()));

            for (Map.Entry<Long, List<Timetable>> roomEntry : byRoom.entrySet()) {
                if (roomEntry.getValue().size() > 1) {
                    List<String> classes = roomEntry.getValue().stream().map(Timetable::getClassSection).toList();
                    clashes.add(Map.of(
                            "type", "ROOM_CLASH",
                            "day", roomEntry.getValue().get(0).getDay().name(),
                            "period", roomEntry.getValue().get(0).getPeriod(),
                            "roomName", roomEntry.getValue().get(0).getRoom().getRoomName(),
                            "roomId", roomEntry.getKey(),
                            "conflictingClasses", classes,
                            "message", "Room already allocated to multiple classes at this time slot"
                    ));
                }
            }
        }
        return clashes;
    }

    public Timetable getById(Long id) {
        return timetableRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Timetable slot not found with id: " + id));
    }

    public List<Timetable> getByClassSection(String classSection) {
        return timetableRepository.findByClassSectionAndIsActiveTrue(classSection);
    }

    public List<Timetable> getByClassSectionAndDate(String classSection, java.time.LocalDate date) {
        java.time.DayOfWeek dow = date.getDayOfWeek();
        if (dow == java.time.DayOfWeek.SUNDAY) {
            return java.util.Collections.emptyList();
        }
        Timetable.Day dayEnum;
        switch (dow) {
            case MONDAY: dayEnum = Timetable.Day.MON; break;
            case TUESDAY: dayEnum = Timetable.Day.TUE; break;
            case WEDNESDAY: dayEnum = Timetable.Day.WED; break;
            case THURSDAY: dayEnum = Timetable.Day.THU; break;
            case FRIDAY: dayEnum = Timetable.Day.FRI; break;
            case SATURDAY: dayEnum = Timetable.Day.SAT; break;
            default: return java.util.Collections.emptyList();
        }
        return timetableRepository.findByClassSectionAndDayAndIsActiveTrueOrderByPeriodAsc(classSection, dayEnum);
    }

    public List<Timetable> getByTeacher(Long teacherId) {
        return timetableRepository.findByTeacherIdAndIsActiveTrue(teacherId);
    }

    public List<Timetable> getAll() {
        return timetableRepository.findAll();
    }

    public void deleteSlot(Long id) {
        Timetable existing = getById(id);
        timetableRepository.delete(existing);
    }
}
