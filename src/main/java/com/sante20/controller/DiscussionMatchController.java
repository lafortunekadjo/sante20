// src/main/java/com/sante20/controller/DiscussionMatchController.java

package com.sante20.controller;

import com.sante20.dto.CreateMessageDTO;
import com.sante20.dto.DiscussionMatchDTO;
import com.sante20.dto.MessageDiscussionMatchDTO;
import com.sante20.entity.User;
import com.sante20.service.CustomUserDetailsService;
import com.sante20.service.DiscussionMatchService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/discussions-match")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DiscussionMatchController {

    private final DiscussionMatchService discussionMatchService;

    @Autowired
    private CustomUserDetailsService userService;

    /**
     * Créer ou récupérer une discussion pour un défi match
     */
    @PostMapping("/create-or-get")
    public ResponseEntity<DiscussionMatchDTO> creerOuRecupererDiscussion(
        @RequestParam Long defiMatchId,
        Authentication authentication
    ) {
        Long currentUserId = extractUserId(authentication);
        DiscussionMatchDTO discussion = discussionMatchService.creerOuRecupererDiscussion(defiMatchId, currentUserId);
        return ResponseEntity.ok(discussion);
    }

    /**
     * Récupérer une discussion par son ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<DiscussionMatchDTO> getDiscussion(
        @PathVariable Long id,
        Authentication authentication
    ) {
        Long currentUserId = extractUserId(authentication);
        DiscussionMatchDTO discussion = discussionMatchService.getDiscussion(id, currentUserId);
        return ResponseEntity.ok(discussion);
    }

    /**
     * Récupérer toutes les discussions d'un groupe
     */
    @GetMapping("/groupe/{groupeId}")
    public ResponseEntity<List<DiscussionMatchDTO>> getDiscussionsParGroupe(
        @PathVariable Long groupeId
    ) {
        List<DiscussionMatchDTO> discussions = discussionMatchService.getDiscussionsParGroupe(groupeId);
        return ResponseEntity.ok(discussions);
    }

    /**
     * Envoyer un message dans une discussion
     */
    @PostMapping("/messages")
    public ResponseEntity<MessageDiscussionMatchDTO> envoyerMessage(
        @RequestBody CreateMessageDTO dto,
        Authentication authentication
    ) {
        Long currentUserId = extractUserId(authentication);
        MessageDiscussionMatchDTO message = discussionMatchService.envoyerMessage(dto, currentUserId);
        return ResponseEntity.ok(message);
    }

    /**
     * Extraire l'ID de l'utilisateur depuis l'authentification
     */
    private Long extractUserId(Authentication authentication) {
        System.out.println(authentication);
        String username = authentication.getName();
        User currentUser = userService.findByUsername(username).orElseThrow();
        return currentUser.getId();
    }
}