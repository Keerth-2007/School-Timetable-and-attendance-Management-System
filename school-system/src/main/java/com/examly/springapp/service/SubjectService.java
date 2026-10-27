package com.examly.springapp.service;

import com.examly.springapp.entity.Subject;
import com.examly.springapp.exception.ResourceNotFoundException;
import com.examly.springapp.repository.SubjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SubjectService {

    @Autowired
    private SubjectRepository subjectRepository;

    public Subject create(Subject subject) {
        return subjectRepository.save(subject);
    }

    public List<Subject> getAll() {
        return subjectRepository.findAll();
    }

    public Subject getById(Long id) {
        return subjectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found with id: " + id));
    }

    public void delete(Long id) {
        subjectRepository.delete(getById(id));
    }
}
