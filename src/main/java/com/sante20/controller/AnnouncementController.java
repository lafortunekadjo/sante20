package com.sante20.controller;


import com.sante20.entity.Announcement;
import com.sante20.service.AnnouncementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/announcements")
@CrossOrigin("*")
public class AnnouncementController {

    @Autowired
    private AnnouncementService announcementService;

    @PostMapping("/groupe/{groupeId}")
    public ResponseEntity<Announcement> createAnnouncement(@PathVariable Long groupeId, @RequestBody Announcement announcement) {
        Announcement created = announcementService.createAnnouncement(groupeId, announcement.getTitle(), announcement.getContent());
        return ResponseEntity.ok(created);
    }

    @GetMapping("/groupe/{groupeId}")
    public ResponseEntity<List<Announcement>> getAnnouncementsByGroupe(@PathVariable Long groupeId) {
        List<Announcement> announcements = announcementService.getAnnouncementsByGroupe(groupeId);
        return ResponseEntity.ok(announcements);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Announcement> getAnnouncementById(@PathVariable Long id) {
        return announcementService.getAnnouncementById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Announcement> updateAnnouncement(@PathVariable Long id, @RequestBody Announcement announcement) {
        Announcement updated = announcementService.updateAnnouncement(id, announcement.getTitle(), announcement.getContent());
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAnnouncement(@PathVariable Long id) {
        announcementService.deleteAnnouncement(id);
        return ResponseEntity.noContent().build();
    }
}