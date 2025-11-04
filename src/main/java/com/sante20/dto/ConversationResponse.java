package com.sante20.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sante20.entity.Conversation;
import com.sante20.entity.ConversationParticipant;
import com.sante20.entity.ConversationType;
import com.sante20.entity.Message;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.Hibernate;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;



@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ConversationResponse {
    
    private Long id;
    private ConversationType type;
    private String titre;
    private String imageUrl;
    private Boolean isArchived;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    private ConversationMetadata metadata;
    private ConversationSettings settings;
    
    private List<ParticipantResponse> participants;
    private Integer unreadCount;
    private MessageResponse lastMessage;
    
    private UserResponse createdBy;

    // ConversationResponse.java - Méthode fromEntity

    public static ConversationResponse fromEntity(Conversation conversation, Long currentUserId) {
        System.out.println("les conversations" + conversation);
        ObjectMapper objectMapper = new ObjectMapper();

        ConversationMetadata metadata = null;
        ConversationSettings settings = null;

        try {
            if (conversation.getMetadata() != null) {
                metadata = objectMapper.readValue(
                        conversation.getMetadata(),
                        ConversationMetadata.class
                );
            }
            if (conversation.getSettings() != null) {
                settings = objectMapper.readValue(
                        conversation.getSettings(),
                        ConversationSettings.class
                );
            }
        } catch (JsonProcessingException e) {
            System.out.print("Error parsing JSON" + e.getMessage());
        }

        // Vérifier si la collection est initialisée
        List<ConversationParticipant> participantsList = new ArrayList<>();
        System.out.println("les participant" + conversation.getParticipants());
        if (Hibernate.isInitialized(conversation.getParticipants())) {

            participantsList.addAll(conversation.getParticipants());
        }

        List<Message> messagesList = new ArrayList<>();
        if (Hibernate.isInitialized(conversation.getMessages())) {
            messagesList.addAll(conversation.getMessages());
        }

        // Récupérer le nombre de messages non lus
        Integer unreadCount = participantsList.stream()
                .filter(p -> p.getUser() != null && p.getUser().getId().equals(currentUserId))
                .findFirst()
                .map(ConversationParticipant::getUnreadCount)
                .orElse(0);

        // Récupérer le dernier message
        MessageResponse lastMessage = messagesList.stream()
                .filter(m -> m != null && !m.getIsDeleted())
                .max(Comparator.comparing(Message::getCreatedAt))
                .map(MessageResponse::fromEntity)
                .orElse(null);

        return ConversationResponse.builder()
                .id(conversation.getId())
                .type(conversation.getType())
                .titre(conversation.getTitre())
                .imageUrl(conversation.getImageUrl())
                .isArchived(conversation.getIsArchived())
                .createdAt(conversation.getCreatedAt())
                .updatedAt(conversation.getUpdatedAt())
                .metadata(metadata)
                .settings(settings)
                .participants(participantsList.stream()
                        .filter(p -> p != null && p.isActive())
                        .map(ParticipantResponse::fromEntity)
                        .collect(Collectors.toList()))
                .unreadCount(unreadCount)
                .lastMessage(lastMessage)
                .createdBy(UserResponse.fromEntity(conversation.getCreatedBy()))
                .build();
    }
}