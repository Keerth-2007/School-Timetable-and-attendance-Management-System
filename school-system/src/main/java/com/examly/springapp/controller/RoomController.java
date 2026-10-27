package com.examly.springapp.controller;

import com.examly.springapp.entity.Room;
import com.examly.springapp.service.RoomService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
@CrossOrigin(origins = "*")
public class RoomController {

    @Autowired
    private RoomService roomService;

    @PostMapping
    public ResponseEntity<Room> create(@RequestBody Room room) {
        return new ResponseEntity<>(roomService.create(room), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<Room>> getAll() {
        return ResponseEntity.ok(roomService.getAll());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        roomService.delete(id);
        return ResponseEntity.ok("Room deleted successfully");
    }
}
