package com.examly.springapp.controller;

import com.examly.springapp.dto.LoginRequest;
import com.examly.springapp.dto.LoginResponse;
import com.examly.springapp.entity.User;
import com.examly.springapp.service.UserService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserService userService;


    // =========================
    // LOGIN
    // =========================

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @RequestBody LoginRequest request) {

        LoginResponse response = userService.login(
                request.getEmail(),
                request.getPassword()
        );

        return ResponseEntity.ok(response);
    }


    // =========================
    // PROFILE
    // =========================

    @GetMapping("/profile")
    public ResponseEntity<User> getProfile(
            Authentication authentication) {

        Long id = (Long)
                ((org.springframework.security.authentication
                        .UsernamePasswordAuthenticationToken)
                        authentication)
                        .getDetails();

        return ResponseEntity.ok(
                userService.getUserById(id)
        );
    }


    // =========================
    // PROFILE BY ID
    // =========================

    @GetMapping("/profile/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('PRINCIPAL')")
    public ResponseEntity<User> getProfileById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                userService.getUserById(id)
        );
    }


    // =========================
    // ALL USERS
    // =========================

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('PRINCIPAL')")
    public ResponseEntity<List<User>> getAllUsers() {

        return ResponseEntity.ok(
                userService.getAllUsers()
        );
    }


    // =========================
    // USERS BY ROLE
    // =========================

    @GetMapping("/role/{role}")
    @PreAuthorize("hasAnyRole('ADMIN','PRINCIPAL','TEACHER','CLASS_TEACHER')")
    public ResponseEntity<List<User>> getUsersByRole(
            @PathVariable User.Role role) {

        return ResponseEntity.ok(
                userService.getUsersByRole(role)
        );
    }

    // =========================
    // STUDENTS BY CLASS
    // =========================

    @GetMapping("/class/{classSection}")
    @PreAuthorize("hasAnyRole('ADMIN','PRINCIPAL','TEACHER','CLASS_TEACHER')")
    public ResponseEntity<List<User>> getStudentsByClass(
            @PathVariable String classSection) {

        return ResponseEntity.ok(
                userService.getStudentsByClass(classSection)
        );
    }


    // =========================
    // UPDATE USER
    // =========================

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('PRINCIPAL')")
    public ResponseEntity<User> updateUser(
            @PathVariable Long id,
            @RequestBody User user) {

        return ResponseEntity.ok(
                userService.updateUser(id, user)
        );
    }


    // =========================
    // DELETE USER
    // =========================

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> deleteUser(
            @PathVariable Long id) {

        userService.deleteUser(id);

        return ResponseEntity.ok(
                "User deleted successfully"
        );
    }
}