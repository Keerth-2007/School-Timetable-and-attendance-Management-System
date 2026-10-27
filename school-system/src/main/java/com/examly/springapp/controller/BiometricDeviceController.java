package com.examly.springapp.controller;

import com.examly.springapp.entity.BiometricDevice;
import com.examly.springapp.service.BiometricDeviceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/devices")
@CrossOrigin(origins = "*")
public class BiometricDeviceController {

    @Autowired
    private BiometricDeviceService biometricDeviceService;

    @PostMapping
    public ResponseEntity<BiometricDevice> create(@RequestBody BiometricDevice device) {
        return new ResponseEntity<>(biometricDeviceService.create(device), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<BiometricDevice>> getAll() {
        return ResponseEntity.ok(biometricDeviceService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<BiometricDevice> getById(@PathVariable Long id) {
        return ResponseEntity.ok(biometricDeviceService.getById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BiometricDevice> update(@PathVariable Long id, @RequestBody BiometricDevice device) {
        return ResponseEntity.ok(biometricDeviceService.update(id, device));
    }

    @Autowired
    private com.examly.springapp.service.AttendanceService attendanceService;

    @Autowired
    private com.examly.springapp.service.UserService userService;

    // FR5 & FR11: Simulate instant hardware biometric / RFID tap event
    @PostMapping("/{id}/tap")
    public ResponseEntity<java.util.Map<String, Object>> simulateTap(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, Object> tapData) {
        BiometricDevice device = biometricDeviceService.getById(id);
        device.setLastSync(java.time.LocalDateTime.now());
        device.setStatus(BiometricDevice.Status.ONLINE);
        biometricDeviceService.update(id, device);

        Long studentId = tapData.get("studentId") != null ? Long.valueOf(tapData.get("studentId").toString()) : 6L;
        com.examly.springapp.entity.User student = userService.getUserById(studentId);

        com.examly.springapp.entity.Attendance att = new com.examly.springapp.entity.Attendance();
        att.setStudent(student);
        att.setDate(java.time.LocalDate.now());
        att.setCapturedBy(device.getDeviceType() == BiometricDevice.DeviceType.RFID ? com.examly.springapp.entity.Attendance.CapturedBy.RFID : com.examly.springapp.entity.Attendance.CapturedBy.BIOMETRIC);
        att.setStatus(com.examly.springapp.entity.Attendance.Status.PRESENT);

        com.examly.springapp.entity.Attendance saved = attendanceService.markAttendance(att);

        return ResponseEntity.ok(java.util.Map.of(
                "status", "SUCCESS",
                "message", "Biometric tap event processed in real time (<3s sync)",
                "device", device.getDeviceName(),
                "student", student.getName(),
                "timestamp", java.time.LocalDateTime.now(),
                "attendanceId", saved.getId()
        ));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        biometricDeviceService.delete(id);
        return ResponseEntity.ok("Device deleted successfully");
    }
}
