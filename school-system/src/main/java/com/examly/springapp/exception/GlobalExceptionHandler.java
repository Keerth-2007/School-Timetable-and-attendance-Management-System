package com.examly.springapp.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Catches every exception thrown anywhere in the app and turns it into a
 * clean, consistent JSON error response instead of a stack trace.
 * This is what makes FR10 (Exception Handling) work.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private Map<String, Object> buildBody(String message, HttpStatus status) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", status.value());
        body.put("message", message);
        return body;
    }

    @ExceptionHandler(InvalidNameException.class)
    public ResponseEntity<Object> handleInvalidName(InvalidNameException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(buildBody(ex.getMessage(), HttpStatus.BAD_REQUEST));
    }

    @ExceptionHandler(InvalidPhoneException.class)
    public ResponseEntity<Object> handleInvalidPhone(InvalidPhoneException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(buildBody(ex.getMessage(), HttpStatus.BAD_REQUEST));
    }

    @ExceptionHandler(DuplicateStudentException.class)
    public ResponseEntity<Object> handleDuplicate(DuplicateStudentException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(buildBody(ex.getMessage(), HttpStatus.CONFLICT));
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Object> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(buildBody(ex.getMessage(), HttpStatus.NOT_FOUND));
    }

    @ExceptionHandler(TimetableClashException.class)
    public ResponseEntity<Object> handleClash(TimetableClashException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(buildBody(ex.getMessage(), HttpStatus.CONFLICT));
    }

    @ExceptionHandler(AttendanceOverrideException.class)
    public ResponseEntity<Object> handleOverride(AttendanceOverrideException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(buildBody(ex.getMessage(), HttpStatus.BAD_REQUEST));
    }

    @ExceptionHandler(UnauthorisedAccessException.class)
    public ResponseEntity<Object> handleUnauthorised(UnauthorisedAccessException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(buildBody(ex.getMessage(), HttpStatus.FORBIDDEN));
    }

    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<Object> handleAccessDenied(org.springframework.security.access.AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(buildBody("Access is denied: " + ex.getMessage(), HttpStatus.FORBIDDEN));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Object> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(buildBody(ex.getMessage(), HttpStatus.BAD_REQUEST));
    }

    // Triggered automatically when @Valid fails on a request body (bean validation)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Object> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().isEmpty()
                ? "Validation failed"
                : ex.getBindingResult().getFieldErrors().get(0).getDefaultMessage();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(buildBody(message, HttpStatus.BAD_REQUEST));
    }

    // Catch-all safety net so no raw stack trace ever reaches the client
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> handleGeneric(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(buildBody("Something went wrong: " + ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR));
    }
}
