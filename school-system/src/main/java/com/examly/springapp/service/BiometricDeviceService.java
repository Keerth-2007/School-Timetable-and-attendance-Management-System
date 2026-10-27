package com.examly.springapp.service;

import com.examly.springapp.entity.BiometricDevice;
import com.examly.springapp.exception.ResourceNotFoundException;
import com.examly.springapp.repository.BiometricDeviceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BiometricDeviceService {

    @Autowired
    private BiometricDeviceRepository biometricDeviceRepository;

    public BiometricDevice create(BiometricDevice device) {
        return biometricDeviceRepository.save(device);
    }

    public List<BiometricDevice> getAll() {
        return biometricDeviceRepository.findAll();
    }

    public BiometricDevice getById(Long id) {
        return biometricDeviceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Device not found with id: " + id));
    }

    public BiometricDevice update(Long id, BiometricDevice updated) {
        BiometricDevice existing = getById(id);
        existing.setDeviceName(updated.getDeviceName());
        existing.setLocation(updated.getLocation());
        existing.setDeviceType(updated.getDeviceType());
        existing.setLastSync(updated.getLastSync());
        existing.setBatteryLevel(updated.getBatteryLevel());
        existing.setStatus(updated.getStatus());
        return biometricDeviceRepository.save(existing);
    }

    public void delete(Long id) {
        BiometricDevice existing = getById(id);
        biometricDeviceRepository.delete(existing);
    }
}
