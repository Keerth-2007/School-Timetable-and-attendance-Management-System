package com.examly.springapp.controller;

import com.examly.springapp.entity.Timetable;
import com.examly.springapp.service.TimetableService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/timetable")
@CrossOrigin(origins = "*")
public class TimetableController {

    @Autowired
    private TimetableService timetableService;

    // GET /api/timetable/class/{id} - here {id} is treated as the class section name, e.g. "8A"
    @GetMapping("/class/{classSection}")
    public ResponseEntity<List<Timetable>> getClassTimetable(@PathVariable String classSection) {
        return ResponseEntity.ok(timetableService.getByClassSection(classSection));
    }

    // GET /api/timetable/class/{classSection}/date/{date}
    @GetMapping("/class/{classSection}/date/{date}")
    public ResponseEntity<List<Timetable>> getClassTimetableForDate(
            @PathVariable String classSection,
            @PathVariable String date) {
        return ResponseEntity.ok(timetableService.getByClassSectionAndDate(classSection, java.time.LocalDate.parse(date)));
    }

    // GET /api/timetable/teacher/{id}
    @GetMapping("/teacher/{id}")
    public ResponseEntity<List<Timetable>> getTeacherTimetable(@PathVariable Long id) {
        return ResponseEntity.ok(timetableService.getByTeacher(id));
    }

    // POST /api/timetable/generate - here used as "add a new slot" (clash-checked)
    // A full constraint-solver is out of scope for the demo; this endpoint enforces
    // the core hard constraint from FR4: no teacher double-booking.
    @PostMapping("/generate")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('PRINCIPAL','ADMIN')")
    public ResponseEntity<Timetable> createSlot(@RequestBody Timetable timetable) {
        Timetable saved = timetableService.createSlot(timetable);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    // PUT /api/timetable/{id}
    @PutMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('PRINCIPAL','ADMIN')")
    public ResponseEntity<Timetable> updateSlot(@PathVariable Long id, @RequestBody Timetable timetable) {
        return ResponseEntity.ok(timetableService.updateSlot(id, timetable));
    }

    @DeleteMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('PRINCIPAL','ADMIN')")
    public ResponseEntity<String> deleteSlot(@PathVariable Long id) {
        timetableService.deleteSlot(id);
        return ResponseEntity.ok("Timetable slot deleted successfully");
    }

    // GET /api/timetable/clashes - FR4 & Appendix H: detect and list all scheduling conflicts
    @GetMapping("/clashes")
    public ResponseEntity<List<java.util.Map<String, Object>>> getClashes() {
        return ResponseEntity.ok(timetableService.detectClashes());
    }

    @GetMapping
    public ResponseEntity<List<Timetable>> getAll() {
        return ResponseEntity.ok(timetableService.getAll());
    }
}
