package com.examly.springapp.service;

import com.examly.springapp.dto.LoginResponse;
import com.examly.springapp.entity.User;
import com.examly.springapp.exception.DuplicateStudentException;
import com.examly.springapp.exception.ResourceNotFoundException;
import com.examly.springapp.repository.UserRepository;
import com.examly.springapp.security.JwtService;
import com.examly.springapp.util.ValidationUtil;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    // =========================================================
    // REGISTER USER
    // =========================================================

    public User register(User user) {

        if (user == null) {
            throw new IllegalArgumentException("User details are required");
        }

        ValidationUtil.validateName(user.getName());
        ValidationUtil.validatePhone(user.getPhone());

        if (user.getEmail() == null || user.getEmail().isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }

        if (user.getPassword() == null || user.getPassword().isBlank()) {
            throw new IllegalArgumentException("Password is required");
        }
        ValidationUtil.validatePassword(user.getPassword());

        if (user.getRole() == null) {
            throw new IllegalArgumentException("Role is required");
        }

        if (userRepository.existsByEmail(user.getEmail())) {
            throw new DuplicateStudentException(
                    "An account with this email is already registered"
            );
        }

        user.setPassword(
                passwordEncoder.encode(user.getPassword())
        );

        return userRepository.save(user);
    }

    public boolean existsByEmail(String email) {
        if (email == null || email.isBlank()) return false;
        return userRepository.existsByEmail(email.trim());
    }

    // =========================================================
    // LOGIN
    // =========================================================

    public LoginResponse login(String email, String password) {

        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }

        if (password == null || password.isBlank()) {
            throw new IllegalArgumentException("Password is required");
        }

        String trimmed = email.trim();
        User user = userRepository.findByEmail(trimmed)
                .or(() -> userRepository.findByEmail(trimmed.toLowerCase()))
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Invalid email or password"
                        )
                );

        boolean matches = passwordEncoder.matches(
                password,
                user.getPassword()
        );

        /*
         * This part allows old users whose passwords were stored
         * as plain text before PasswordEncoder was added.
         */
        if (!matches
                && user.getPassword() != null
                && user.getPassword().equals(password)) {

            user.setPassword(
                    passwordEncoder.encode(password)
            );

            userRepository.save(user);

            matches = true;
        }

        if (!matches) {
            throw new ResourceNotFoundException(
                    "Invalid email or password"
            );
        }

        Duration validity;

        switch (user.getRole()) {

            case ADMIN:
                validity = Duration.ofHours(24);
                break;

            case TEACHER:
            case CLASS_TEACHER:
            case PRINCIPAL:
                validity = Duration.ofHours(12);
                break;

            case STUDENT:
            case PARENT:
            default:
                validity = Duration.ofHours(8);
                break;
        }

        String token = jwtService.generateToken(
                user.getId(),
                user.getEmail(),
                user.getRole().name(),
                validity
        );

        return new LoginResponse(
                token,
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole().name(),
                user.getClassSection()
        );
    }

    // =========================================================
    // GET ALL USERS
    // =========================================================

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // =========================================================
    // GET USER BY ID
    // =========================================================

    public User getUserById(Long id) {

        if (id == null) {
            throw new IllegalArgumentException("User ID is required");
        }

        return userRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found with id: " + id
                        )
                );
    }

    // =========================================================
    // GET USER BY EMAIL
    // Used by ParentController
    // =========================================================

    public User getUserByEmail(String email) {

        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }

        return userRepository.findByEmail(email)
                .or(() -> userRepository.findByEmail(email.trim().toLowerCase()))
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found with email: " + email
                        )
                );
    }

    // =========================================================
    // GET USERS BY ROLE
    // =========================================================

    public List<User> getUsersByRole(User.Role role) {

        if (role == null) {
            throw new IllegalArgumentException("Role is required");
        }

        return userRepository.findByRole(role);
    }

    // =========================================================
    // UPDATE USER
    // =========================================================

    public User updateUser(Long id, User updatedUser) {

        if (updatedUser == null) {
            throw new IllegalArgumentException(
                    "Updated user details are required"
            );
        }

        User existingUser = getUserById(id);

        ValidationUtil.validateName(updatedUser.getName());
        ValidationUtil.validatePhone(updatedUser.getPhone());

        existingUser.setName(updatedUser.getName());
        existingUser.setPhone(updatedUser.getPhone());
        existingUser.setClassSection(
                updatedUser.getClassSection()
        );
        existingUser.setParentMobile(
                updatedUser.getParentMobile()
        );
        existingUser.setEmployeeId(
                updatedUser.getEmployeeId()
        );

        /*
         * Update password only when a new password is supplied.
         */
        if (updatedUser.getPassword() != null
                && !updatedUser.getPassword().isBlank()) {

            existingUser.setPassword(
                    passwordEncoder.encode(
                            updatedUser.getPassword()
                    )
            );
        }

        return userRepository.save(existingUser);
    }

    // =========================================================
    // LINK PARENT WITH STUDENT
    // =========================================================

    @Transactional
    public User linkChild(Long parentId, Long studentId) {

        User parent = getUserById(parentId);
        User student = getUserById(studentId);

        if (parent.getRole() != User.Role.PARENT) {
            throw new IllegalArgumentException(
                    "Selected user is not a parent"
            );
        }

        if (student.getRole() != User.Role.STUDENT) {
            throw new IllegalArgumentException(
                    "Selected user is not a student"
            );
        }

        if (parent.getChildren() == null) {
            parent.setChildren(new java.util.ArrayList<>());
        }

        boolean alreadyLinked = parent.getChildren()
                .stream()
                .anyMatch(child ->
                        child.getId().equals(student.getId())
                );

        if (!alreadyLinked) {
            parent.getChildren().add(student);
        }

        return userRepository.save(parent);
    }

    // =========================================================
    // GET CHILDREN OF PARENT
    // =========================================================

    @Transactional(readOnly = true)
    public List<User> getChildren(Long parentId) {

        User parent = getUserById(parentId);

        if (parent.getRole() != User.Role.PARENT) {
            throw new IllegalArgumentException(
                    "Selected user is not a parent"
            );
        }

        return parent.getChildren();
    }

    // =========================================================
    // DELETE USER
    // =========================================================

    public void deleteUser(Long id) {

        User user = getUserById(id);

        userRepository.delete(user);
    }

    public List<User> getStudentsByClass(String classSection) {
        return userRepository.findByClassSectionAndRole(classSection, User.Role.STUDENT);
    }
}