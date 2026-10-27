package com.examly.springapp.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    private String type;

    @Column(length = 1000)
    private String message;

    @Column(name = "read_status")
    private boolean readStatus = false;

    @Column(name = "read_flag")
    private boolean readFlag = false;

    private String channel = "IN_APP";

    private LocalDateTime createdAt;

    @ManyToOne
    @JoinColumn(name = "parent_id")
    private User parent;

    @ManyToOne
    @JoinColumn(name = "recipient_id")
    private User recipient;

    public Notification() {
        this.createdAt = LocalDateTime.now();
        this.readStatus = false;
        this.readFlag = false;
        this.channel = "IN_APP";
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public boolean isReadStatus() {
        return readStatus;
    }

    public void setReadStatus(boolean readStatus) {
        this.readStatus = readStatus;
    }

    public boolean isReadFlag() {
        return readFlag;
    }

    public void setReadFlag(boolean readFlag) {
        this.readFlag = readFlag;
    }

    public String getChannel() {
        return channel;
    }

    public void setChannel(String channel) {
        this.channel = channel;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public User getParent() {
        return parent;
    }

    public void setParent(User parent) {
        this.parent = parent;
    }

    public User getRecipient() {
        return recipient;
    }

    public void setRecipient(User recipient) {
        this.recipient = recipient;
    }
}