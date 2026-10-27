package com.examly.springapp.controller;

import com.examly.springapp.entity.Subject;
import com.examly.springapp.service.SubjectService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subjects")
@CrossOrigin(origins = "*")
public class SubjectController {

    @Autowired
    private SubjectService subjectService;

    @PostMapping
    public ResponseEntity<Subject> create(@RequestBody Subject subject) {
        return new ResponseEntity<>(subjectService.create(subject), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<Subject>> getAll() {
        return ResponseEntity.ok(subjectService.getAll());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        subjectService.delete(id);
        return ResponseEntity.ok("Subject deleted successfully");
    }
}
