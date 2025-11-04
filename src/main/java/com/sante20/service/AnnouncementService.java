package com.sante20.service;


import com.sante20.entity.Announcement;
import com.sante20.entity.Groupe;
import com.sante20.repository.AnnouncementRepository;
import com.sante20.repository.GroupeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AnnouncementService {

    @Autowired
    private AnnouncementRepository announcementRepository;

    @Autowired
    private GroupeRepository groupeService; // Supposé exister

    // Créer une nouvelle annonce pour un groupe
    public Announcement createAnnouncement(Long groupeId, String title, String content) {
        Groupe groupe = groupeService.findById(groupeId)
                .orElseThrow(() -> new RuntimeException("Groupe non trouvé"));
        Announcement announcement = new Announcement(title, content, groupe);
        return announcementRepository.save(announcement);
    }

    // Récupérer toutes les annonces d'un groupe
    public List<Announcement> getAnnouncementsByGroupe(Long groupeId) {
        return announcementRepository.findByGroupeId(groupeId);
    }

    // Récupérer une annonce par ID
    public Optional<Announcement> getAnnouncementById(Long id) {
        return announcementRepository.findById(id);
    }

    // Mettre à jour une annonce
    public Announcement updateAnnouncement(Long id, String title, String content) {
        Announcement announcement = getAnnouncementById(id)
                .orElseThrow(() -> new RuntimeException("Annonce non trouvée"));
        announcement.setTitle(title);
        announcement.setContent(content);
        return announcementRepository.save(announcement);
    }

    // Supprimer une annonce
    public void deleteAnnouncement(Long id) {
        Announcement announcement = getAnnouncementById(id)
                .orElseThrow(() -> new RuntimeException("Annonce non trouvée"));
        announcementRepository.delete(announcement);
    }
}