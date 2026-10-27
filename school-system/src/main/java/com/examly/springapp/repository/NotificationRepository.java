package com.examly.springapp.repository;

import com.examly.springapp.entity.Notification;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository
        extends JpaRepository<Notification, Long> {

    List<Notification> findByParentIdOrderByCreatedAtDesc(
            Long parentId
    );

    List<Notification> findByRecipientIdOrderByCreatedAtDesc(
            Long recipientId
    );

    @org.springframework.data.jpa.repository.Query("SELECT n FROM Notification n WHERE n.parent.id = :userId OR n.recipient.id = :userId ORDER BY n.createdAt DESC")
    List<Notification> findForUser(@org.springframework.data.repository.query.Param("userId") Long userId);
}