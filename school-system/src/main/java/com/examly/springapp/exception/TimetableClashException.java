package com.examly.springapp.exception;

public class TimetableClashException extends RuntimeException {
    public TimetableClashException(String message) {
        super(message);
    }
}
