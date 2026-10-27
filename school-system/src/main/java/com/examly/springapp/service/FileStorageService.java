package com.examly.springapp.service;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path fileStorageLocation;

    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList(
            "pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "jpg", "jpeg", "png"
    );

    private static final long MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

    public FileStorageService() {
        this.fileStorageLocation = Paths.get("uploads", "assignments")
                .toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("Could not create the upload directory for assignments.", ex);
        }
    }

    public void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Cannot upload empty file.");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File size exceeds the 20MB limit.");
        }

        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "");
        String extension = "";
        int i = originalFilename.lastIndexOf('.');
        if (i > 0) {
            extension = originalFilename.substring(i + 1).toLowerCase();
        }

        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException("Invalid file type: ." + extension + ". Allowed formats: " +
                    String.join(", ", ALLOWED_EXTENSIONS));
        }

        if (originalFilename.contains("..")) {
            throw new IllegalArgumentException("Filename contains invalid path sequence " + originalFilename);
        }
    }

    public String storeFile(MultipartFile file, String prefix) {
        validateFile(file);

        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "file");
        // Sanitize
        originalFilename = originalFilename.replaceAll("[^a-zA-Z0-9\\.\\-_]", "_");
        String uniqueFileName = (prefix != null ? prefix + "_" : "") + UUID.randomUUID().toString().substring(0, 8) + "_" + originalFilename;

        try {
            Path targetLocation = this.fileStorageLocation.resolve(uniqueFileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            return uniqueFileName;
        } catch (IOException ex) {
            throw new RuntimeException("Could not store file " + originalFilename + ". Please try again!", ex);
        }
    }

    public Resource loadFileAsResource(String fileName) {
        try {
            Path filePath = this.fileStorageLocation.resolve(fileName).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new RuntimeException("File not found or not readable: " + fileName);
            }
        } catch (MalformedURLException ex) {
            throw new RuntimeException("File not found: " + fileName, ex);
        }
    }

    public boolean deleteFile(String fileName) {
        if (fileName == null || fileName.isBlank()) return false;
        try {
            Path filePath = this.fileStorageLocation.resolve(fileName).normalize();
            return Files.deleteIfExists(filePath);
        } catch (IOException ex) {
            return false;
        }
    }
}
