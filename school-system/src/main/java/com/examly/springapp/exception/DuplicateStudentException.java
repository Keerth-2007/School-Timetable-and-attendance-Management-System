package com.examly.springapp.exception;

// Name kept as per SRS Appendix E; used here for any duplicate unique field (e.g. email)
public class DuplicateStudentException extends RuntimeException {
    public DuplicateStudentException(String message) {
        super(message);
    }
}
