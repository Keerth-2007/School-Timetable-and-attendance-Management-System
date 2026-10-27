package com.examly.springapp.repository;

import com.examly.springapp.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    boolean existsByEmail(String email);

    Optional<User> findByEmail(String email);

    List<User> findByRole(User.Role role);

    List<User> findByClassSection(String classSection);

    List<User> findByClassSectionAndRole(String classSection, User.Role role);

    @org.springframework.data.jpa.repository.Query("SELECT p FROM User p JOIN p.children c WHERE c.id = :studentId")
    List<User> findParentsByStudentId(@org.springframework.data.repository.query.Param("studentId") Long studentId);
}