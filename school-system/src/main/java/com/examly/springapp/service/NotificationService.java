package com.examly.springapp.service;

import com.examly.springapp.entity.Notification;
import com.examly.springapp.repository.NotificationRepository;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(
            NotificationRepository notificationRepository) {

        this.notificationRepository = notificationRepository;
    }

    // Get notifications for parent
    public List<Notification> getForParent(Long parentId) {
        return notificationRepository.findForUser(parentId);
    }

    // Mark notification as read
    public Notification markAsRead(Long id) {
        Notification notification = notificationRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Notification not found with id: " + id
                        )
                );

        notification.setReadStatus(true);
        notification.setReadFlag(true);

        return notificationRepository.save(notification);
    }

    // Create notification
    public Notification createNotification(
            Notification notification) {

        return notificationRepository.save(notification);
    }

    // Get all notifications
    public List<Notification> getAllNotifications() {

        return notificationRepository.findAll();
    }
}