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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Basic API tests for /api/timetable.
 * DataLoader already books teacher id=3 (Ravi) for MON period 1.
 */
@SpringBootTest
@AutoConfigureMockMvc
@org.springframework.security.test.context.support.WithMockUser(roles = {"ADMIN", "PRINCIPAL"})
class TimetableControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private com.examly.springapp.repository.TimetableRepository timetableRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @org.junit.jupiter.api.BeforeEach
    void cleanSlots() {
        timetableRepository.findAll().stream()
                .filter(t -> "9B".equalsIgnoreCase(t.getClassSection()))
                .forEach(timetableRepository::delete);
    }

    @Test
    void createSlot_clashingWithExisting_shouldReturn409() throws Exception {
        Map<String, Object> slot = new HashMap<>();
        slot.put("classSection", "9B");
        slot.put("day", "MON");
        slot.put("period", 1); // same day+period already taken by teacher id=3
        slot.put("subject", Map.of("id", 1));
        slot.put("teacher", Map.of("id", 3));
        slot.put("room", Map.of("id", 1));

        mockMvc.perform(post("/api/timetable/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(slot)))
                .andExpect(status().isConflict());
    }

    @Test
    void createSlot_noClash_shouldReturn201() throws Exception {
        Map<String, Object> slot = new HashMap<>();
        slot.put("classSection", "9B");
        slot.put("day", "TUE");
        slot.put("period", 3); // free slot for teacher id=3
        slot.put("subject", Map.of("id", 1));
        slot.put("teacher", Map.of("id", 3));
        slot.put("room", Map.of("id", 1));

        mockMvc.perform(post("/api/timetable/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(slot)))
                .andExpect(status().isCreated());
    }

    @Test
    void getClassTimetable_shouldReturnOk() throws Exception {
        mockMvc.perform(get("/api/timetable/class/8A"))
                .andExpect(status().isOk());
    }
}
