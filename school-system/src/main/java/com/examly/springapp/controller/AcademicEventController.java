package com.examly.springapp.controller;

import com.examly.springapp.dto.AcademicEventDTO;
import com.examly.springapp.entity.User;
import com.examly.springapp.repository.UserRepository;
import com.examly.springapp.service.AcademicEventService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/calendar")
@CrossOrigin(origins = "*")
public class AcademicEventController {

    private final AcademicEventService academicEventService;
    private final UserRepository userRepository;

    public AcademicEventController(AcademicEventService academicEventService,
                                   UserRepository userRepository) {
        this.academicEventService = academicEventService;
        this.userRepository = userRepository;
    }

    private User getCurrentUser(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            return null;
        }
        return userRepository.findByEmail(auth.getName())
                .orElse(null);
    }

    // ----------------------------------------------------
    // GET EVENTS (CENTRAL CALENDAR FEED)
    // ----------------------------------------------------

    @GetMapping("/events")
    public ResponseEntity<List<AcademicEventDTO>> getEvents(
            @RequestParam(required = false) String academicYear,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String classSection,
            @RequestParam(required = false) String search,
            Authentication auth) {

        User currentUser = getCurrentUser(auth);
        List<AcademicEventDTO> events = academicEventService.getEvents(
                currentUser, academicYear, year, month, startDate, endDate, type, classSection, search
        );
        return ResponseEntity.ok(events);
    }

    // ----------------------------------------------------
    // GET UPCOMING EVENTS (FOR DASHBOARDS)
    // ----------------------------------------------------

    @GetMapping("/upcoming")
    public ResponseEntity<List<AcademicEventDTO>> getUpcoming(
            @RequestParam(required = false, defaultValue = "5") int limit,
            Authentication auth) {

        User currentUser = getCurrentUser(auth);
        List<AcademicEventDTO> events = academicEventService.getUpcomingEvents(currentUser, limit);
        return ResponseEntity.ok(events);
    }

    // ----------------------------------------------------
    // GET EVENT BY ID
    // ----------------------------------------------------

    @GetMapping("/events/{id}")
    public ResponseEntity<AcademicEventDTO> getEventById(
            @PathVariable Long id,
            Authentication auth) {

        User currentUser = getCurrentUser(auth);
        return ResponseEntity.ok(academicEventService.getEventById(id, currentUser));
    }

    // ----------------------------------------------------
    // CREATE EVENT (ADMIN / AUTHORIZED FACULTY)
    // ----------------------------------------------------

    @PostMapping("/events")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRINCIPAL', 'TEACHER', 'CLASS_TEACHER')")
    public ResponseEntity<AcademicEventDTO> createEvent(
            @RequestBody AcademicEventDTO dto,
            Authentication auth) {

        User currentUser = getCurrentUser(auth);
        AcademicEventDTO created = academicEventService.createEvent(dto, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // ----------------------------------------------------
    // UPDATE EVENT
    // ----------------------------------------------------

    @PutMapping("/events/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRINCIPAL')")
    public ResponseEntity<AcademicEventDTO> updateEvent(
            @PathVariable Long id,
            @RequestBody AcademicEventDTO dto,
            Authentication auth) {

        User currentUser = getCurrentUser(auth);
        AcademicEventDTO updated = academicEventService.updateEvent(id, dto, currentUser);
        return ResponseEntity.ok(updated);
    }

    // ----------------------------------------------------
    // CANCEL EVENT
    // ----------------------------------------------------

    @PutMapping("/events/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRINCIPAL')")
    public ResponseEntity<AcademicEventDTO> cancelEvent(@PathVariable Long id) {
        return ResponseEntity.ok(academicEventService.cancelEvent(id));
    }

    // ----------------------------------------------------
    // PUBLISH EVENT
    // ----------------------------------------------------

    @PutMapping("/events/{id}/publish")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRINCIPAL')")
    public ResponseEntity<AcademicEventDTO> publishEvent(@PathVariable Long id) {
        return ResponseEntity.ok(academicEventService.publishEvent(id));
    }

    // ----------------------------------------------------
    // DELETE EVENT
    // ----------------------------------------------------

    @DeleteMapping("/events/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRINCIPAL')")
    public ResponseEntity<Map<String, String>> deleteEvent(@PathVariable Long id) {
        academicEventService.deleteEvent(id);
        return ResponseEntity.ok(Map.of("message", "Academic event removed successfully"));
    }

    // ----------------------------------------------------
    // WORKING DAYS SUMMARY (FR12)
    // ----------------------------------------------------

    @GetMapping("/working-days")
    public ResponseEntity<Map<String, Object>> getWorkingDays(
            @RequestParam(required = false, defaultValue = "2026-2027") String academicYear,
            @RequestParam(required = false, defaultValue = "2026") int year,
            @RequestParam(required = false, defaultValue = "9") int month) {

        return ResponseEntity.ok(academicEventService.getWorkingDaysSummary(academicYear, year, month));
    }
}
