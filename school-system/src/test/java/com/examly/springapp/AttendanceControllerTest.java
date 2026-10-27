package com.examly.springapp;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Basic API tests for /api/attendance.
 * DataLoader seeds student id=6 (Arjun, PRESENT today) and id=7 (Meera, ABSENT today).
 */
@SpringBootTest
@AutoConfigureMockMvc
@org.springframework.security.test.context.support.WithMockUser(roles = {"ADMIN", "CLASS_TEACHER"})
class AttendanceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private com.examly.springapp.repository.AttendanceRepository attendanceRepository;

    @Autowired
    private com.examly.springapp.repository.UserRepository userRepository;

    @Test
    void override_withoutReason_shouldReturn400() throws Exception {
        Map<String, String> body = new HashMap<>();
        body.put("status", "PRESENT");
        // "reason" intentionally missing

        com.examly.springapp.entity.Attendance att = attendanceRepository.findAll().stream().findFirst().orElseGet(() -> {
            com.examly.springapp.entity.User student = userRepository.findAll().stream()
                    .filter(u -> u.getRole() == com.examly.springapp.entity.User.Role.STUDENT).findFirst().orElse(null);
            com.examly.springapp.entity.Attendance a = new com.examly.springapp.entity.Attendance();
            a.setStudent(student);
            a.setDate(java.time.LocalDate.now());
            a.setStatus(com.examly.springapp.entity.Attendance.Status.ABSENT);
            a.setCapturedBy(com.examly.springapp.entity.Attendance.CapturedBy.BIOMETRIC);
            return attendanceRepository.save(a);
        });

        mockMvc.perform(put("/api/attendance/" + att.getId() + "/override")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Reason is required for attendance modification"));
    }

    @Test
    void override_withReason_shouldSucceed() throws Exception {
        Map<String, String> body = new HashMap<>();
        body.put("status", "PRESENT");
        body.put("reason", "Biometric device malfunctioned, verified manually");

        com.examly.springapp.entity.Attendance att = attendanceRepository.findAll().stream().findFirst().orElseGet(() -> {
            com.examly.springapp.entity.User student = userRepository.findAll().stream()
                    .filter(u -> u.getRole() == com.examly.springapp.entity.User.Role.STUDENT).findFirst().orElse(null);
            com.examly.springapp.entity.Attendance a = new com.examly.springapp.entity.Attendance();
            a.setStudent(student);
            a.setDate(java.time.LocalDate.now());
            a.setStatus(com.examly.springapp.entity.Attendance.Status.ABSENT);
            a.setCapturedBy(com.examly.springapp.entity.Attendance.CapturedBy.BIOMETRIC);
            return attendanceRepository.save(a);
        });

        mockMvc.perform(put("/api/attendance/" + att.getId() + "/override")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PRESENT"))
                .andExpect(jsonPath("$.capturedBy").value("MANUAL"));
    }

    @Test
    void getStudentAttendance_shouldReturnList() throws Exception {
        mockMvc.perform(get("/api/attendance/student/6"))
                .andExpect(status().isOk());
    }

    @Test
    void getBelow75_shouldReturnOk() throws Exception {
        mockMvc.perform(get("/api/attendance/below75"))
                .andExpect(status().isOk());
    }
}
