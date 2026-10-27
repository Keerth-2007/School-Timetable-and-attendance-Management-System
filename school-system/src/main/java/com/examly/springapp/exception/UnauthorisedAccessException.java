package com.examly.springapp.exception;

/**
 * Thrown when a user accesses a resource outside their assigned role (SRS Appendix E).
 * HTTP Status: 403 Forbidden
 */
public class UnauthorisedAccessException extends RuntimeException {
    public UnauthorisedAccessException(String message) {
        super(message);
    }
}
