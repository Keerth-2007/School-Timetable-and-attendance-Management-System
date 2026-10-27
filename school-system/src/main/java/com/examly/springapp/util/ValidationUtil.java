package com.examly.springapp.util;

import com.examly.springapp.exception.InvalidNameException;
import com.examly.springapp.exception.InvalidPhoneException;

/**
 * Small helper with the two validation rules the SRS calls out repeatedly:
 * Name -> alphabetic characters and spaces only
 * Phone -> exactly 10 digits
 */
public class ValidationUtil {

    public static void validateName(String name) {
        if (name == null || !name.matches("^[A-Za-z ]{2,100}$")) {
            throw new InvalidNameException("Name must not contain special characters or numbers");
        }
    }

    public static void validatePhone(String phone) {
        if (phone == null || !phone.matches("^[0-9]{10}$")) {
            throw new InvalidPhoneException("Phone Number must be exactly 10 digits long");
        }
    }

    public static void validatePassword(String password) {
        if (password == null || password.length() < 8 ||
                !password.matches("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$")) {
            throw new IllegalArgumentException("Password must meet security requirements");
        }
    }
}
