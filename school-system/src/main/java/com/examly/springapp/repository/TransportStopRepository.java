package com.examly.springapp.repository;

import com.examly.springapp.entity.TransportStop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransportStopRepository extends JpaRepository<TransportStop, Long> {
    List<TransportStop> findByRouteIdOrderByStopOrderAsc(Long routeId);
}
