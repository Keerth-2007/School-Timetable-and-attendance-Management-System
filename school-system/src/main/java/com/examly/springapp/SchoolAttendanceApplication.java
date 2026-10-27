package com.examly.springapp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Entry point of the School Timetable and Attendance Management System backend.
 * Run this class (or `mvn spring-boot:run`) to start the server on port 8080.
 */
@SpringBootApplication
public class SchoolAttendanceApplication {

    public static void main(String[] args) {
        SpringApplication.run(SchoolAttendanceApplication.class, args);
    }
}
