package com.examly.springapp.service;

import com.examly.springapp.dto.StudentTransportAssignmentRequest;
import com.examly.springapp.dto.StudentTransportDTO;
import com.examly.springapp.entity.*;
import com.examly.springapp.exception.ResourceNotFoundException;
import com.examly.springapp.repository.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class TransportService {

    private final StudentTransportAssignmentRepository assignmentRepository;
    private final TransportVehicleRepository vehicleRepository;
    private final TransportRouteRepository routeRepository;
    private final TransportStopRepository stopRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final AcademicEventRepository academicEventRepository;

    public TransportService(StudentTransportAssignmentRepository assignmentRepository,
                            TransportVehicleRepository vehicleRepository,
                            TransportRouteRepository routeRepository,
                            TransportStopRepository stopRepository,
                            UserRepository userRepository,
                            NotificationRepository notificationRepository,
                            @org.springframework.context.annotation.Lazy AcademicEventRepository academicEventRepository) {
        this.assignmentRepository = assignmentRepository;
        this.vehicleRepository = vehicleRepository;
        this.routeRepository = routeRepository;
        this.stopRepository = stopRepository;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
        this.academicEventRepository = academicEventRepository;
    }

    // ----------------------------------------------------
    // GET LOGGED-IN STUDENT'S TRANSPORT
    // ----------------------------------------------------

    @Transactional(readOnly = true)
    public StudentTransportDTO getMyTransport(User currentUser) {
        if (currentUser == null) {
            throw new AccessDeniedException("User is not authenticated");
        }
        return getStudentTransportById(currentUser.getId(), currentUser);
    }

    // ----------------------------------------------------
    // GET STUDENT TRANSPORT BY ID WITH ROLE-BASED ACCESS
    // ----------------------------------------------------

    @Transactional(readOnly = true)
    public StudentTransportDTO getStudentTransportById(Long studentId, User requester) {
        if (requester == null) {
            throw new AccessDeniedException("User is not authenticated");
        }

        User.Role role = requester.getRole();

        // Security check
        if (role == User.Role.ADMIN || role == User.Role.PRINCIPAL) {
            // Admin/Principal have full access
        } else if (role == User.Role.STUDENT) {
            if (!requester.getId().equals(studentId)) {
                throw new AccessDeniedException("You are not authorized to view another student's transport details");
            }
        } else if (role == User.Role.PARENT) {
            List<User> children = requester.getChildren();
            boolean isChild = children != null && children.stream().anyMatch(c -> c.getId().equals(studentId));
            if (!isChild) {
                throw new AccessDeniedException("You are not authorized to view transport details for this student");
            }
        } else {
            throw new AccessDeniedException("Unauthorized to access student transport information");
        }

        Optional<StudentTransportAssignment> assignmentOpt = assignmentRepository.findByStudentId(studentId);
        if (assignmentOpt.isEmpty()) {
            return null; // Empty state
        }

        StudentTransportAssignment assignment = assignmentOpt.get();
        return mapToDTO(assignment);
    }

    // ----------------------------------------------------
    // ASSIGN STUDENT TO TRANSPORT
    // ----------------------------------------------------

    @Transactional
    public StudentTransportDTO assignStudent(StudentTransportAssignmentRequest request, User admin) {
        if (request.getStudentId() == null || request.getVehicleId() == null || request.getRouteId() == null) {
            throw new IllegalArgumentException("Student, Vehicle, and Route are required");
        }

        User student = userRepository.findById(request.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + request.getStudentId()));

        TransportVehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + request.getVehicleId()));

        TransportRoute route = routeRepository.findById(request.getRouteId())
                .orElseThrow(() -> new ResourceNotFoundException("Route not found with id: " + request.getRouteId()));

        TransportStop pickupStop = null;
        if (request.getPickupStopId() != null) {
            pickupStop = stopRepository.findById(request.getPickupStopId()).orElse(null);
        }

        TransportStop dropStop = null;
        if (request.getDropStopId() != null) {
            dropStop = stopRepository.findById(request.getDropStopId()).orElse(null);
        }

        Optional<StudentTransportAssignment> existing = assignmentRepository.findByStudentId(student.getId());
        StudentTransportAssignment assignment = existing.orElseGet(StudentTransportAssignment::new);

        assignment.setStudent(student);
        assignment.setVehicle(vehicle);
        assignment.setRoute(route);
        assignment.setPickupStop(pickupStop);
        assignment.setDropStop(dropStop);

        String pickupTime = request.getPickupTime();
        if ((pickupTime == null || pickupTime.isBlank()) && pickupStop != null) {
            pickupTime = pickupStop.getMorningPickupTime();
        }
        assignment.setPickupTime(pickupTime);

        String dropTime = request.getDropTime();
        if ((dropTime == null || dropTime.isBlank()) && dropStop != null) {
            dropTime = dropStop.getAfternoonDropTime();
        }
        assignment.setDropTime(dropTime);

        if (request.getStatus() != null) {
            try {
                assignment.setStatus(StudentTransportAssignment.Status.valueOf(request.getStatus().toUpperCase()));
            } catch (IllegalArgumentException ignored) {}
        } else {
            assignment.setStatus(StudentTransportAssignment.Status.ACTIVE);
        }

        if (request.getAcademicYear() != null && !request.getAcademicYear().isBlank()) {
            assignment.setAcademicYear(request.getAcademicYear());
        }

        assignment.setNotes(request.getNotes());

        StudentTransportAssignment saved = assignmentRepository.save(assignment);

        // Dispatch notifications
        dispatchTransportNotification(student, "🚍 School Transport Assignment",
                "You have been assigned to " + vehicle.getBusNumber() + " (" + route.getRouteName() + ")." +
                        (pickupStop != null ? " Pickup: " + pickupStop.getStopName() + " at " + assignment.getPickupTime() : ""));

        return mapToDTO(saved);
    }

    // ----------------------------------------------------
    // UPDATE TRANSPORT ASSIGNMENT
    // ----------------------------------------------------

    @Transactional
    public StudentTransportDTO updateAssignment(Long id, StudentTransportAssignmentRequest request, User admin) {
        StudentTransportAssignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transport assignment not found with id: " + id));

        if (request.getVehicleId() != null) {
            TransportVehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found"));
            assignment.setVehicle(vehicle);
        }

        if (request.getRouteId() != null) {
            TransportRoute route = routeRepository.findById(request.getRouteId())
                    .orElseThrow(() -> new ResourceNotFoundException("Route not found"));
            assignment.setRoute(route);
        }

        if (request.getPickupStopId() != null) {
            TransportStop pickupStop = stopRepository.findById(request.getPickupStopId()).orElse(null);
            assignment.setPickupStop(pickupStop);
        }

        if (request.getDropStopId() != null) {
            TransportStop dropStop = stopRepository.findById(request.getDropStopId()).orElse(null);
            assignment.setDropStop(dropStop);
        }

        if (request.getPickupTime() != null && !request.getPickupTime().isBlank()) {
            assignment.setPickupTime(request.getPickupTime());
        }

        if (request.getDropTime() != null && !request.getDropTime().isBlank()) {
            assignment.setDropTime(request.getDropTime());
        }

        if (request.getStatus() != null) {
            try {
                assignment.setStatus(StudentTransportAssignment.Status.valueOf(request.getStatus().toUpperCase()));
            } catch (IllegalArgumentException ignored) {}
        }

        if (request.getNotes() != null) {
            assignment.setNotes(request.getNotes());
        }

        StudentTransportAssignment updated = assignmentRepository.save(assignment);

        // Dispatch update notification
        User student = updated.getStudent();
        dispatchTransportNotification(student, "🚍 School Transport Update",
                student.getName() + "'s school bus assignment has been updated. New Bus: " +
                        updated.getVehicle().getBusNumber() + ", Pickup Time: " + updated.getPickupTime() + ".");

        return mapToDTO(updated);
    }

    // ----------------------------------------------------
    // UNASSIGN / DELETE
    // ----------------------------------------------------

    @Transactional
    public void unassignStudent(Long id, User admin) {
        StudentTransportAssignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transport assignment not found with id: " + id));
        assignmentRepository.delete(assignment);
    }

    // ----------------------------------------------------
    // METADATA & ADMIN RETRIEVAL
    // ----------------------------------------------------

    @Transactional(readOnly = true)
    public List<StudentTransportDTO> getAllAssignments() {
        return assignmentRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TransportVehicle> getAllVehicles() {
        return vehicleRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<TransportRoute> getAllRoutes() {
        return routeRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<TransportStop> getStopsByRoute(Long routeId) {
        return stopRepository.findByRouteIdOrderByStopOrderAsc(routeId);
    }

    // ----------------------------------------------------
    // HELPER: MAP TO DTO
    // ----------------------------------------------------

    private StudentTransportDTO mapToDTO(StudentTransportAssignment a) {
        StudentTransportDTO dto = new StudentTransportDTO();
        dto.setAssignmentId(a.getId());
        dto.setStatus(a.getStatus().name());
        dto.setAcademicYear(a.getAcademicYear());
        dto.setNotes(a.getNotes());

        // Student Info
        User student = a.getStudent();
        if (student != null) {
            dto.setStudentId(student.getId());
            dto.setStudentName(student.getName());
            dto.setAdmissionNumber(student.getAdmissionNumber() != null ? student.getAdmissionNumber() : "ADM-" + student.getId());
            dto.setClassSection(student.getClassSection());
        }

        // Vehicle Details
        TransportVehicle v = a.getVehicle();
        if (v != null) {
            dto.setVehicleId(v.getId());
            dto.setBusNumber(v.getBusNumber());
            dto.setRegistrationNumber(v.getRegistrationNumber());
            dto.setVehicleType(v.getVehicleType());
            dto.setCapacity(v.getCapacity());
            dto.setDriverName(v.getDriverName());
            dto.setDriverPhone(v.getDriverPhone());
            dto.setAttendantName(v.getAttendantName());
            dto.setAttendantPhone(v.getAttendantPhone());
        }

        // Route Details
        TransportRoute r = a.getRoute();
        if (r != null) {
            dto.setRouteId(r.getId());
            dto.setRouteNumber(r.getRouteNumber());
            dto.setRouteName(r.getRouteName());
            dto.setStartLocation(r.getStartLocation());
            dto.setEndLocation(r.getEndLocation());
            dto.setMorningStartTime(r.getMorningStartTime());
            dto.setMorningArrivalTime(r.getMorningArrivalTime());
            dto.setAfternoonDepartureTime(r.getAfternoonDepartureTime());

            dto.setMorningRouteDescription(r.getStartLocation() + " → " + r.getEndLocation());
            dto.setAfternoonRouteDescription(r.getEndLocation() + " → " + r.getStartLocation());

            // Populate stops sequence
            List<TransportStop> stops = stopRepository.findByRouteIdOrderByStopOrderAsc(r.getId());
            List<StudentTransportDTO.StopItemDTO> stopDTOs = new ArrayList<>();
            for (TransportStop s : stops) {
                boolean isPickup = a.getPickupStop() != null && a.getPickupStop().getId().equals(s.getId());
                boolean isDrop = a.getDropStop() != null && a.getDropStop().getId().equals(s.getId());
                stopDTOs.add(new StudentTransportDTO.StopItemDTO(
                        s.getId(), s.getStopName(), s.getStopOrder(),
                        s.getMorningPickupTime(), s.getAfternoonDropTime(),
                        s.getLandmark(), isPickup, isDrop
                ));
            }
            dto.setRouteStops(stopDTOs);
        }

        // Pickup & Drop
        if (a.getPickupStop() != null) {
            dto.setPickupStopId(a.getPickupStop().getId());
            dto.setPickupStopName(a.getPickupStop().getStopName());
        }
        dto.setPickupTime(a.getPickupTime());

        if (a.getDropStop() != null) {
            dto.setDropStopId(a.getDropStop().getId());
            dto.setDropStopName(a.getDropStop().getStopName());
        }
        dto.setDropTime(a.getDropTime());

        // Academic Calendar Holiday Check
        LocalDate today = LocalDate.now();
        if (academicEventRepository != null && academicEventRepository.isSchoolHoliday(today)) {
            dto.setHolidayToday(true);
            dto.setHolidayNotice("School Holiday: Regular school transport service suspended today.");
        }

        return dto;
    }

    // ----------------------------------------------------
    // HELPER: DISPATCH NOTIFICATION
    // ----------------------------------------------------

    private void dispatchTransportNotification(User student, String title, String message) {
        try {
            // Notify Student
            Notification sNotif = new Notification();
            sNotif.setTitle(title);
            sNotif.setType("TRANSPORT");
            sNotif.setMessage(message);
            sNotif.setRecipient(student);
            notificationRepository.save(sNotif);

            // Notify Parents
            List<User> parents = userRepository.findParentsByStudentId(student.getId());
            for (User parent : parents) {
                Notification pNotif = new Notification();
                pNotif.setTitle(title);
                pNotif.setType("TRANSPORT");
                pNotif.setMessage(message);
                pNotif.setParent(parent);
                pNotif.setRecipient(parent);
                notificationRepository.save(pNotif);
            }
        } catch (Exception ex) {
            System.err.println("Failed to dispatch transport notification: " + ex.getMessage());
        }
    }
}
