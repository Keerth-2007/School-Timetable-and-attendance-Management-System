package com.examly.springapp.controller;

import com.examly.springapp.dto.StudentTransportAssignmentRequest;
import com.examly.springapp.dto.StudentTransportDTO;
import com.examly.springapp.entity.TransportRoute;
import com.examly.springapp.entity.TransportStop;
import com.examly.springapp.entity.TransportVehicle;
import com.examly.springapp.entity.User;
import com.examly.springapp.repository.UserRepository;
import com.examly.springapp.service.TransportService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/transport")
@CrossOrigin(origins = "*")
public class TransportController {

    private final TransportService transportService;
    private final UserRepository userRepository;

    public TransportController(TransportService transportService, UserRepository userRepository) {
        this.transportService = transportService;
        this.userRepository = userRepository;
    }

    private User getCurrentUser(Authentication auth) {
        if (auth == null || auth.getName() == null) return null;
        return userRepository.findByEmail(auth.getName()).orElse(null);
    }

    // ----------------------------------------------------
    // GET CURRENT AUTHENTICATED STUDENT'S TRANSPORT
    // ----------------------------------------------------

    @GetMapping("/my-transport")
    public ResponseEntity<StudentTransportDTO> getMyTransport(Authentication auth) {
        User currentUser = getCurrentUser(auth);
        StudentTransportDTO dto = transportService.getMyTransport(currentUser);
        if (dto == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(dto);
    }

    // ----------------------------------------------------
    // GET STUDENT TRANSPORT BY ID (ROLE-SECURED)
    // ----------------------------------------------------

    @GetMapping("/student/{studentId}")
    public ResponseEntity<StudentTransportDTO> getStudentTransport(
            @PathVariable Long studentId,
            Authentication auth) {

        User currentUser = getCurrentUser(auth);
        StudentTransportDTO dto = transportService.getStudentTransportById(studentId, currentUser);
        if (dto == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(dto);
    }

    // ----------------------------------------------------
    // GET ALL ROUTES
    // ----------------------------------------------------

    @GetMapping("/routes")
    public ResponseEntity<List<TransportRoute>> getRoutes() {
        return ResponseEntity.ok(transportService.getAllRoutes());
    }

    // ----------------------------------------------------
    // GET ALL VEHICLES
    // ----------------------------------------------------

    @GetMapping("/vehicles")
    public ResponseEntity<List<TransportVehicle>> getVehicles() {
        return ResponseEntity.ok(transportService.getAllVehicles());
    }

    // ----------------------------------------------------
    // GET STOPS FOR ROUTE
    // ----------------------------------------------------

    @GetMapping("/stops/route/{routeId}")
    public ResponseEntity<List<TransportStop>> getStopsByRoute(@PathVariable Long routeId) {
        return ResponseEntity.ok(transportService.getStopsByRoute(routeId));
    }

    // ----------------------------------------------------
    // ADMIN: GET ALL ASSIGNMENTS
    // ----------------------------------------------------

    @GetMapping("/assignments")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRINCIPAL')")
    public ResponseEntity<List<StudentTransportDTO>> getAllAssignments() {
        return ResponseEntity.ok(transportService.getAllAssignments());
    }

    // ----------------------------------------------------
    // ADMIN: ASSIGN STUDENT
    // ----------------------------------------------------

    @PostMapping("/assign")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRINCIPAL')")
    public ResponseEntity<StudentTransportDTO> assignStudent(
            @RequestBody StudentTransportAssignmentRequest request,
            Authentication auth) {

        User admin = getCurrentUser(auth);
        StudentTransportDTO created = transportService.assignStudent(request, admin);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // ----------------------------------------------------
    // ADMIN: UPDATE ASSIGNMENT
    // ----------------------------------------------------

    @PutMapping("/assignment/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRINCIPAL')")
    public ResponseEntity<StudentTransportDTO> updateAssignment(
            @PathVariable Long id,
            @RequestBody StudentTransportAssignmentRequest request,
            Authentication auth) {

        User admin = getCurrentUser(auth);
        StudentTransportDTO updated = transportService.updateAssignment(id, request, admin);
        return ResponseEntity.ok(updated);
    }

    // ----------------------------------------------------
    // ADMIN: UNASSIGN STUDENT
    // ----------------------------------------------------

    @DeleteMapping("/assignment/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRINCIPAL')")
    public ResponseEntity<Map<String, String>> unassignStudent(
            @PathVariable Long id,
            Authentication auth) {

        User admin = getCurrentUser(auth);
        transportService.unassignStudent(id, admin);
        return ResponseEntity.ok(Map.of("message", "Student unassigned from transport successfully"));
    }
}
