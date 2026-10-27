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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Basic API tests for the /api/auth endpoints.
 * Run with: mvn test
 */
@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void registerAndLogin_shouldSucceed() throws Exception {
        String email = "test.teacher." + System.currentTimeMillis() + "@school.com";
        Map<String, Object> newUser = new HashMap<>();
        newUser.put("name", "Test Teacher");
        newUser.put("email", email);
        newUser.put("password", "Test@1234");
        newUser.put("phone", "9876543210");
        newUser.put("role", "TEACHER");

        // Register
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newUser)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value(email));

        // Login with the same credentials
        Map<String, String> loginRequest = new HashMap<>();
        loginRequest.put("email", email);
        loginRequest.put("password", "Test@1234");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("TEACHER"));
    }

    @Test
    void register_withInvalidName_shouldReturn400() throws Exception {
        Map<String, Object> newUser = new HashMap<>();
        newUser.put("name", "Test123"); // contains digits - invalid
        newUser.put("email", "bad.name@school.com");
        newUser.put("password", "Test@1234");
        newUser.put("phone", "9876543211");
        newUser.put("role", "TEACHER");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newUser)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Name must not contain special characters or numbers"));
    }

    @Test
    void register_withInvalidPhone_shouldReturn400() throws Exception {
        Map<String, Object> newUser = new HashMap<>();
        newUser.put("name", "Valid Name");
        newUser.put("email", "bad.phone@school.com");
        newUser.put("password", "Test@1234");
        newUser.put("phone", "12345"); // not 10 digits - invalid
        newUser.put("role", "TEACHER");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newUser)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Phone Number must be exactly 10 digits long"));
    }

    @Test
    void register_withDuplicateEmail_shouldReturn409() throws Exception {
        String email = "duplicate." + System.currentTimeMillis() + "@school.com";
        Map<String, Object> user = new HashMap<>();
        user.put("name", "Duplicate User");
        user.put("email", email);
        user.put("password", "Test@1234");
        user.put("phone", "9876500000");
        user.put("role", "TEACHER");

        // First registration succeeds
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(user)))
                .andExpect(status().isCreated());

        // Second registration with same email fails
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(user)))
                .andExpect(status().isConflict());
    }
}
