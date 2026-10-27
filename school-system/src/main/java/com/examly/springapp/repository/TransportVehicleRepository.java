package com.examly.springapp.repository;

import com.examly.springapp.entity.TransportVehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TransportVehicleRepository extends JpaRepository<TransportVehicle, Long> {
    Optional<TransportVehicle> findByBusNumber(String busNumber);
}
