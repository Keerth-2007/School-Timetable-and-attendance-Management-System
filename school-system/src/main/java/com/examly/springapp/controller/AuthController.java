package com.examly.springapp.controller;

import com.examly.springapp.dto.LoginResponse;
import com.examly.springapp.entity.User;
import com.examly.springapp.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {
    private final UserService userService;
    public AuthController(UserService userService) { this.userService = userService; }

    @PostMapping("/register")
    public ResponseEntity<User> register(@RequestBody User user) {
        return new ResponseEntity<>(userService.register(user), HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody Map<String, String> credentials) {
        return ResponseEntity.ok(userService.login(credentials.get("email"), credentials.get("password")));
    }

    @GetMapping("/check-email")
    public ResponseEntity<Map<String, Object>> checkEmail(@RequestParam String email) {
        boolean exists = userService.existsByEmail(email);
        return ResponseEntity.ok(Map.of("email", email, "exists", exists, "available", !exists));
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout() {
        return ResponseEntity.ok(Map.of("message", "Logout successful. Remove the JWT from the client storage."));
    }
}
