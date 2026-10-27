package com.examly.springapp.controller;

import com.examly.springapp.entity.Notification;
import com.examly.springapp.service.NotificationService;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "http://localhost:8081")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    // Get notifications for a parent
    @GetMapping("/parent/{parentId}")
    public List<Notification> getParentNotifications(
            @PathVariable Long parentId) {

        return notificationService.getForParent(parentId);
    }

    // Mark notification as read
    @PutMapping("/{id}/read")
    public Notification markAsRead(
            @PathVariable Long id) {

        return notificationService.markAsRead(id);
    }
}