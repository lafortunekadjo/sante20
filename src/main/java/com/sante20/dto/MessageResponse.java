package com.sante20.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.sante20.entity.Message;
import com.sante20.entity.MessageType;
import com.sante20.entity.SystemMessageType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class MessageResponse {
    
    private Long id;
    private Long conversationId;
    private UserResponse sender;
    private MessageType type;
    private String content;
    private Boolean isSystemMessage;
    private SystemMessageType systemMessageType;
    private Boolean isEdited;
    private Boolean isDeleted;
    private LocalDateTime createdAt;
    private LocalDateTime editedAt;
    
    private List<AttachmentResponse> attachments;
    private List<ReadStatusResponse> readStatuses;
    
    public static MessageResponse fromEntity(Message message) {
        return MessageResponse.builder()
            .id(message.getId())
            .conversationId(message.getConversation().getId())
            .sender(message.getSender() != null ? UserResponse.fromEntity(message.getSender()) : null)
            .type(message.getType())
            .content(message.getContent())
            .isSystemMessage(message.getIsSystemMessage())
            .systemMessageType(message.getSystemMessageType())
            .isEdited(message.getIsEdited())
            .isDeleted(message.getIsDeleted())
            .createdAt(message.getCreatedAt())
            .editedAt(message.getEditedAt())
            .attachments(message.getAttachments().stream()
                .map(AttachmentResponse::fromEntity)
                .collect(Collectors.toList()))
            .readStatuses(message.getReadStatuses().stream()
                .map(ReadStatusResponse::fromEntity)
                .collect(Collectors.toList()))
            .build();
    }
}