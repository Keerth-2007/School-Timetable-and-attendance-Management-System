package com.examly.springapp.dto;

public class LoginResponse {
    private String token;
    private Long id;
    private Long userId;
    private String name;
    private String email;
    private String role;
    private String classSection;

    public LoginResponse() {}

    public LoginResponse(String token, Long userId, String name, String email, String role) {
        this.token = token;
        this.id = userId;
        this.userId = userId;
        this.name = name;
        this.email = email;
        this.role = role;
    }

    public LoginResponse(String token, Long userId, String name, String email, String role, String classSection) {
        this.token = token;
        this.id = userId;
        this.userId = userId;
        this.name = name;
        this.email = email;
        this.role = role;
        this.classSection = classSection;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public Long getId() { return id != null ? id : userId; }
    public void setId(Long id) { this.id = id; this.userId = id; }

    public Long getUserId() { return userId != null ? userId : id; }
    public void setUserId(Long userId) { this.userId = userId; this.id = userId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getClassSection() { return classSection; }
    public void setClassSection(String classSection) { this.classSection = classSection; }
}
