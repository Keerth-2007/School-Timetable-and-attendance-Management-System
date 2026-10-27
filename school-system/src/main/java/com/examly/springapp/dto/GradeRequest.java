package com.examly.springapp.dto;

public class GradeRequest {

    private Double marks;
    private String feedback;
    private String grade;

    public GradeRequest() {
    }

    public GradeRequest(Double marks, String feedback) {
        this.marks = marks;
        this.feedback = feedback;
    }

    public Double getMarks() {
        return marks;
    }

    public void setMarks(Double marks) {
        this.marks = marks;
    }

    public String getFeedback() {
        return feedback;
    }

    public void setFeedback(String feedback) {
        this.feedback = feedback;
    }

    public String getGrade() {
        return grade;
    }

    public void setGrade(String grade) {
        this.grade = grade;
    }
}
