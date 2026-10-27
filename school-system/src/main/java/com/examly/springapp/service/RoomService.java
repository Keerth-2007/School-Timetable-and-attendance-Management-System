package com.examly.springapp.service;

import com.examly.springapp.entity.Room;
import com.examly.springapp.exception.ResourceNotFoundException;
import com.examly.springapp.repository.RoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RoomService {

    @Autowired
    private RoomRepository roomRepository;

    public Room create(Room room) {
        return roomRepository.save(room);
    }

    public List<Room> getAll() {
        return roomRepository.findAll();
    }

    public Room getById(Long id) {
        return roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with id: " + id));
    }

    public void delete(Long id) {
        roomRepository.delete(getById(id));
    }
}
