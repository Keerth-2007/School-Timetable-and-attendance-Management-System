package com.examly.springapp.repository;

import com.examly.springapp.entity.TransportRoute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TransportRouteRepository extends JpaRepository<TransportRoute, Long> {
    Optional<TransportRoute> findByRouteNumber(String routeNumber);
}
