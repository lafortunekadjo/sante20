package com.sante20.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import com.sante20.dto.ConversationMetadata;
import com.sante20.dto.ConversationSettings;
import com.sante20.entity.*;
import com.sante20.exceptions.ResourceNotFoundException;
import com.sante20.exceptions.UnauthorizedException;
import com.sante20.repository.ConversationParticipantRepository;
import com.sante20.repository.ConversationRepository;
import com.sante20.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ConversationService {
    
    private final ConversationRepository conversationRepository;
    private final ConversationParticipantRepository participantRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    
    /**
     * Créer une conversation de groupe pour une demande de match
     */
    public Conversation createMatchRequestConversation(
            Long matchRequestId,
            List<Long> responsableIds,
            Long creatorId
    ) {
        User creator = getUserOrThrow(creatorId);
        
        // Créer les métadonnées
        ConversationMetadata metadata = new ConversationMetadata();
        metadata.setMatchRequestId(matchRequestId);
        
        // Créer les settings
        ConversationSettings settings = new ConversationSettings();
        settings.setCanLeave(false); // On ne peut pas quitter une conv de match
        settings.setCanAddMembers(false);
        settings.setOnlyAdminsCanWrite(false);
        
        Conversation conversation = new Conversation();
        conversation.setType(ConversationType.MATCH_REQUEST);
        conversation.setMetadata(toJson(metadata));
        conversation.setSettings(toJson(settings));
        conversation.setTitre("Discussion - Demande de match");
        conversation.setIsArchived(false);
        conversation.setCreatedBy(creator);
        
        // Sauvegarder la conversation
        conversation = conversationRepository.save(conversation);
        
        // Ajouter les participants (tous admins pour une demande de match)
        for (Long userId : responsableIds) {
            User user = getUserOrThrow(userId);
            addParticipantToConversation(conversation, user, ParticipantRole.ADMIN);
        }
        
        // Créer un message système
        createSystemMessage(
            conversation, 
            SystemMessageType.CONVERSATION_CREATED,
            "La conversation a été créée pour discuter de la demande de match."
        );
        
        return conversation;
    }
    
    /**
     * Créer une conversation privée entre 2 utilisateurs
     */
    public Conversation createPrivateConversation(Long userId1, Long userId2) {
        // Vérifier si une conversation existe déjà
        return conversationRepository.findPrivateConversationBetweenUsers(userId1, userId2)
            .orElseGet(() -> {
                User user1 = getUserOrThrow(userId1);
                User user2 = getUserOrThrow(userId2);
                
                ConversationSettings settings = new ConversationSettings();
                settings.setCanLeave(true);
                settings.setCanAddMembers(false);
                settings.setOnlyAdminsCanWrite(false);
                
                Conversation conversation = new Conversation();
                conversation.setType(ConversationType.PRIVATE);
                conversation.setSettings(toJson(settings));
                conversation.setIsArchived(false);
                conversation.setCreatedBy(user1);
                
                conversation = conversationRepository.save(conversation);
                
                // Ajouter les 2 participants
                addParticipantToConversation(conversation, user1, ParticipantRole.MEMBER);
                addParticipantToConversation(conversation, user2, ParticipantRole.MEMBER);
                
                return conversation;
            });
    }
    
    /**
     * Créer une conversation de groupe générique
     */
    public Conversation createGroupConversation(
            String titre,
            List<Long> participantIds,
            List<Long> adminIds,
            Long creatorId
    ) {
        User creator = getUserOrThrow(creatorId);
        
        ConversationSettings settings = new ConversationSettings();
        settings.setCanLeave(true);
        settings.setCanAddMembers(true);
        settings.setOnlyAdminsCanWrite(false);
        
        Conversation conversation = new Conversation();
        conversation.setType(ConversationType.GROUP);
        conversation.setTitre(titre);
        conversation.setSettings(toJson(settings));
        conversation.setIsArchived(false);
        conversation.setCreatedBy(creator);
        
        conversation = conversationRepository.save(conversation);
        
        // Ajouter les participants
        for (Long userId : participantIds) {
            User user = getUserOrThrow(userId);
            ParticipantRole role = adminIds.contains(userId) 
                ? ParticipantRole.ADMIN 
                : ParticipantRole.MEMBER;
            addParticipantToConversation(conversation, user, role);
        }
        
        return conversation;
    }
    
    /**
     * Récupérer toutes les conversations d'un utilisateur
     */
    @Transactional(readOnly = true)
    public List<Conversation> getUserConversations(Long userId) {
        return conversationRepository.findActiveConversationsByUserId(userId);
    }
    
    /**
     * Récupérer une conversation par ID
     */
    @Transactional(readOnly = true)
    public Conversation getConversationById(Long conversationId, Long userId) {
        Conversation conversation = conversationRepository.findById(conversationId)
            .orElseThrow(() -> new ResourceNotFoundException("Conversation non trouvée"));
        
        // Vérifier que l'utilisateur est participant
        verifyUserIsParticipant(conversationId, userId);
        
        return conversation;
    }
    
    /**
     * Ajouter un participant à une conversation
     */
    public ConversationParticipant addParticipant(
            Long conversationId, 
            Long userIdToAdd, 
            Long requesterId
    ) {
        Conversation conversation = conversationRepository.findById(conversationId)
            .orElseThrow(() -> new ResourceNotFoundException("Conversation non trouvée"));
        
        // Vérifier les permissions
        ConversationParticipant requester = getParticipantOrThrow(conversationId, requesterId);
        ConversationSettings settings = getSettings(conversation);
        
        if (!settings.getCanAddMembers() && !requester.isAdmin()) {
            throw new UnauthorizedException("Vous n'avez pas la permission d'ajouter des membres");
        }
        
        User userToAdd = getUserOrThrow(userIdToAdd);
        ConversationParticipant participant = addParticipantToConversation(
            conversation, 
            userToAdd, 
            ParticipantRole.MEMBER
        );
        
        // Message système
        createSystemMessage(
            conversation,
            SystemMessageType.USER_JOINED,
            userToAdd.getMembre().getNom() + " " + userToAdd.getMembre().getPrenom() + " a rejoint la conversation"
        );
        
        return participant;
    }
    
    /**
     * Quitter une conversation
     */
    public void leaveConversation(Long conversationId, Long userId) {
        Conversation conversation = conversationRepository.findById(conversationId)
            .orElseThrow(() -> new ResourceNotFoundException("Conversation non trouvée"));
        
        ConversationParticipant participant = getParticipantOrThrow(conversationId, userId);
        ConversationSettings settings = getSettings(conversation);
        
        if (!settings.getCanLeave()) {
            throw new UnauthorizedException("Vous ne pouvez pas quitter cette conversation");
        }
        
        participant.setLeftAt(LocalDateTime.now());
        participantRepository.save(participant);
        
        // Message système
        User user = participant.getUser();
        createSystemMessage(
            conversation,
            SystemMessageType.USER_LEFT,
            user.getMembre().getNom() + " " + user.getMembre().getPrenom() + " a quitté la conversation"
        );
    }
    
    /**
     * Archiver une conversation
     */
    public void archiveConversation(Long conversationId, Long userId) {
        Conversation conversation = conversationRepository.findById(conversationId)
            .orElseThrow(() -> new ResourceNotFoundException("Conversation non trouvée"));
        
        ConversationParticipant participant = getParticipantOrThrow(conversationId, userId);
        
        if (!participant.isAdmin()) {
            throw new UnauthorizedException("Seuls les admins peuvent archiver la conversation");
        }
        
        conversation.setIsArchived(true);
        conversationRepository.save(conversation);
    }
    
    /**
     * Mettre à jour les paramètres de notification d'un participant
     */
    public ConversationParticipant updateNotificationSettings(
            Long conversationId,
            Long userId,
            Boolean isMuted,
            LocalDateTime mutedUntil
    ) {
        ConversationParticipant participant = getParticipantOrThrow(conversationId, userId);
        
        participant.setIsMuted(isMuted);
        participant.setMutedUntil(mutedUntil);
        
        return participantRepository.save(participant);
    }
    
    /**
     * Marquer les messages comme lus
     */
    public void markAsRead(Long conversationId, Long userId) {
        ConversationParticipant participant = getParticipantOrThrow(conversationId, userId);
        
        participant.setLastReadAt(LocalDateTime.now());
        participant.setUnreadCount(0);
        
        participantRepository.save(participant);
    }
    
    /**
     * Récupérer le nombre total de messages non lus pour un utilisateur
     */
    @Transactional(readOnly = true)
    public Integer getTotalUnreadCount(Long userId) {
        Integer count = participantRepository.getTotalUnreadCountForUser(userId);
        return count != null ? count : 0;
    }
    
    // ==================== Méthodes utilitaires ====================
    
    private ConversationParticipant addParticipantToConversation(
            Conversation conversation,
            User user,
            ParticipantRole role
    ) {
        // Vérifier si le participant existe déjà
        return participantRepository.findByConversationIdAndUserId(conversation.getId(), user.getId())
            .map(existing -> {
                if (existing.getLeftAt() != null) {
                    // Réactiver le participant
                    existing.setLeftAt(null);
                    existing.setJoinedAt(LocalDateTime.now());
                    existing.setRole(role);
                    return participantRepository.save(existing);
                }
                return existing;
            })
            .orElseGet(() -> {
                ConversationParticipant participant = new ConversationParticipant();
                participant.setConversation(conversation);
                participant.setUser(user);
                participant.setRole(role);
                participant.setLastReadAt(LocalDateTime.now());
                participant.setUnreadCount(0);
                participant.setIsMuted(false);
                return participantRepository.save(participant);
            });
    }
    
    private void createSystemMessage(
            Conversation conversation,
            SystemMessageType type,
            String content
    ) {
        // Cette méthode sera implémentée dans MessageService
        // Pour l'instant, on la laisse vide ou on appelle MessageService
    }
    
    private void verifyUserIsParticipant(Long conversationId, Long userId) {
        participantRepository.findByConversationIdAndUserId(conversationId, userId)
            .filter(ConversationParticipant::isActive)
            .orElseThrow(() -> new UnauthorizedException("Vous n'êtes pas participant de cette conversation"));
    }
    
    private ConversationParticipant getParticipantOrThrow(Long conversationId, Long userId) {
        return participantRepository.findByConversationIdAndUserId(conversationId, userId)
            .filter(ConversationParticipant::isActive)
            .orElseThrow(() -> new UnauthorizedException("Vous n'êtes pas participant de cette conversation"));
    }
    
    private User getUserOrThrow(Long userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));
    }
    
    private ConversationSettings getSettings(Conversation conversation) {
        try {
            if (conversation.getSettings() == null) {
                return new ConversationSettings();
            }
            return objectMapper.readValue(conversation.getSettings(), ConversationSettings.class);
        } catch (JsonProcessingException e) {
            log.error("Erreur lors de la désérialisation des settings", e);
            return new ConversationSettings();
        }
    }
    
    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            log.error("Erreur lors de la sérialisation JSON", e);
            return "{}";
        }
    }
}