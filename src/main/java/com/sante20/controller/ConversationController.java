package com.sante20.controller;


import com.sante20.dto.*;
import com.sante20.entity.Conversation;
import com.sante20.entity.ConversationParticipant;
import com.sante20.entity.User;
import com.sante20.service.ConversationService;
import com.sante20.service.CustomUserDetailsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
//@Tag(name = "Conversations", description = "API de gestion des conversations")
@PreAuthorize("isAuthenticated()")
public class ConversationController {
    
    private final ConversationService conversationService;
    @Autowired
    private CustomUserDetailsService userService;
    
    @PostMapping("/match-request")
   // @Operation(summary = "Créer une conversation pour une demande de match")
    public ResponseEntity<ConversationResponse> createMatchRequestConversation(
            @Valid @RequestBody CreateMatchRequestConversationRequest request

    ) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        System.out.println(authentication);
        String username = authentication.getName();
        User currentUser = userService.findByUsername(username).orElseThrow();
        Conversation conversation = conversationService.createMatchRequestConversation(
            request.getMatchRequestId(),
            request.getResponsableIds(),
            currentUser.getId()
        );
        
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ConversationResponse.fromEntity(conversation, currentUser.getId()));
    }
    
    @PostMapping("/private")
   // @Operation(summary = "Créer une conversation privée entre 2 utilisateurs")
    public ResponseEntity<ConversationResponse> createPrivateConversation(
            @Valid @RequestBody CreatePrivateConversationRequest request

    ) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        System.out.println(authentication);
        String username = authentication.getName();
        User currentUser = userService.findByUsername(username).orElseThrow();
        Conversation conversation = conversationService.createPrivateConversation(
            currentUser.getId(),
            request.getOtherUserId()
        );
        
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ConversationResponse.fromEntity(conversation, currentUser.getId()));
    }
    
    @PostMapping("/group")
   // @Operation(summary = "Créer une conversation de groupe")
    public ResponseEntity<ConversationResponse> createGroupConversation(
            @Valid @RequestBody CreateGroupConversationRequest request

    ) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        System.out.println(authentication);
        String username = authentication.getName();
        User currentUser = userService.findByUsername(username).orElseThrow();
        Conversation conversation = conversationService.createGroupConversation(
            request.getTitre(),
            request.getParticipantIds(),
            request.getAdminIds(),
            currentUser.getId()
        );
        
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ConversationResponse.fromEntity(conversation, currentUser.getId()));
    }
    
    @GetMapping
   // @Operation(summary = "Récupérer toutes les conversations de l'utilisateur")
    public ResponseEntity<List<ConversationResponse>> getUserConversations(

    ) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        System.out.println(authentication);
        String username = authentication.getName();
        User currentUser = userService.findByUsername(username).orElseThrow();
        List<Conversation> conversations = conversationService.getUserConversations(currentUser.getId());
        
        List<ConversationResponse> response = conversations.stream()
            .map(conv -> ConversationResponse.fromEntity(conv, currentUser.getId()))
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/{conversationId}")
   // @Operation(summary = "Récupérer une conversation par ID")
    public ResponseEntity<ConversationResponse> getConversationById(
            @PathVariable Long conversationId
    ) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        System.out.println(authentication);
        String username = authentication.getName();
        User currentUser = userService.findByUsername(username).orElseThrow();
        Conversation conversation = conversationService.getConversationById(
            conversationId,
            currentUser.getId()
        );
        
        return ResponseEntity.ok(
            ConversationResponse.fromEntity(conversation, currentUser.getId())
        );
    }
    
    @PostMapping("/{conversationId}/participants")
  //  @Operation(summary = "Ajouter un participant à une conversation")
    public ResponseEntity<ParticipantResponse> addParticipant(
            @PathVariable Long conversationId,
            @Valid @RequestBody AddParticipantRequest request
    ) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        System.out.println(authentication);
        String username = authentication.getName();
        User currentUser = userService.findByUsername(username).orElseThrow();
        ConversationParticipant participant = conversationService.addParticipant(
            conversationId,
            request.getUserId(),
            currentUser.getId()
        );
        
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ParticipantResponse.fromEntity(participant));
    }
    
    @PostMapping("/{conversationId}/leave")
   // @Operation(summary = "Quitter une conversation")
    public ResponseEntity<ApiResponse> leaveConversation(
            @PathVariable Long conversationId
    ) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        System.out.println(authentication);
        String username = authentication.getName();
        User currentUser = userService.findByUsername(username).orElseThrow();
        conversationService.leaveConversation(conversationId, currentUser.getId());
        
        return ResponseEntity.ok(
            new ApiResponse("Vous avez quitté la conversation")
        );
    }
    
    @PutMapping("/{conversationId}/archive")
  //  @Operation(summary = "Archiver une conversation")
    public ResponseEntity<ApiResponse> archiveConversation(
            @PathVariable Long conversationId
    ) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        System.out.println(authentication);
        String username = authentication.getName();
        User currentUser = userService.findByUsername(username).orElseThrow();
        conversationService.archiveConversation(conversationId, currentUser.getId());
        
        return ResponseEntity.ok(
            new ApiResponse( "Conversation archivée")
        );
    }
    
    @PutMapping("/{conversationId}/notifications")
   // @Operation(summary = "Mettre à jour les paramètres de notification")
    public ResponseEntity<ParticipantResponse> updateNotificationSettings(
            @PathVariable Long conversationId,
            @Valid @RequestBody UpdateNotificationRequest request
    ) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        System.out.println(authentication);
        String username = authentication.getName();
        User currentUser = userService.findByUsername(username).orElseThrow();
        ConversationParticipant participant = conversationService.updateNotificationSettings(
            conversationId,
            currentUser.getId(),
            request.getIsMuted(),
            request.getMutedUntil()
        );
        
        return ResponseEntity.ok(ParticipantResponse.fromEntity(participant));
    }
    
    @PostMapping("/{conversationId}/mark-read")
  //  @Operation(summary = "Marquer tous les messages comme lus")
    public ResponseEntity<ApiResponse> markAsRead(
            @PathVariable Long conversationId
    ) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        System.out.println(authentication);
        String username = authentication.getName();
        User currentUser = userService.findByUsername(username).orElseThrow();
        conversationService.markAsRead(conversationId, currentUser.getId());
        
        return ResponseEntity.ok(
            new ApiResponse( "Messages marqués comme lus")
        );
    }
    
    @GetMapping("/unread-count")
   // @Operation(summary = "Récupérer le nombre total de messages non lus")
    public ResponseEntity<UnreadCountResponse> getTotalUnreadCount(

    ) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        System.out.println(authentication);
        String username = authentication.getName();
        User currentUser = userService.findByUsername(username).orElseThrow();
        Integer count = conversationService.getTotalUnreadCount(currentUser.getId());
        
        return ResponseEntity.ok(new UnreadCountResponse(count));
    }
}