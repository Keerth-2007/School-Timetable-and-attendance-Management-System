package com.examly.springapp.repository;

import com.examly.springapp.entity.StudentTransportAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentTransportAssignmentRepository extends JpaRepository<StudentTransportAssignment, Long> {

    Optional<StudentTransportAssignment> findByStudentId(Long studentId);

    List<StudentTransportAssignment> findByVehicleId(Long vehicleId);

    List<StudentTransportAssignment> findByRouteId(Long routeId);
}
