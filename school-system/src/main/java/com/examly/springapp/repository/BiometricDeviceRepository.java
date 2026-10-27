package com.examly.springapp.repository;

import com.examly.springapp.entity.BiometricDevice;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BiometricDeviceRepository extends JpaRepository<BiometricDevice, Long> {
}
