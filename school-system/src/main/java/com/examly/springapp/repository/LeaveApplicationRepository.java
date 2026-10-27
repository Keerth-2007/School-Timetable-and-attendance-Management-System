package com.examly.springapp.repository;

import com.examly.springapp.entity.LeaveApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LeaveApplicationRepository extends JpaRepository<LeaveApplication, Long> {

    List<LeaveApplication> findByStatus(LeaveApplication.Status status);

    List<LeaveApplication> findByTeacherId(Long teacherId);
}
