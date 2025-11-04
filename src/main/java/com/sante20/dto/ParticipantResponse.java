package com.sante20.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import com.sante20.entity.ConversationParticipant;
import com.sante20.entity.ParticipantRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ParticipantResponse {
    
    private Long id;
    private UserResponse user;
    private ParticipantRole role;
    private Boolean isMuted;
    private LocalDateTime mutedUntil;
    private LocalDateTime lastReadAt;
    private Integer unreadCount;
    private LocalDateTime joinedAt;
    
    public static ParticipantResponse fromEntity(ConversationParticipant participant) {
        return ParticipantResponse.builder()
            .id(participant.getId())
            .user(UserResponse.fromEntity(participant.getUser()))
            .role(participant.getRole())
            .isMuted(participant.getIsMuted())
            .mutedUntil(participant.getMutedUntil())
            .lastReadAt(participant.getLastReadAt())
            .unreadCount(participant.getUnreadCount())
            .joinedAt(participant.getJoinedAt())
            .build();
    }
}