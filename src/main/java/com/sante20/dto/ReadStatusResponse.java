package com.sante20.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.sante20.entity.MessageReadStatus;
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
public class ReadStatusResponse {
    
    private Long userId;
    private String userName;
    private LocalDateTime readAt;
    
    public static ReadStatusResponse fromEntity(MessageReadStatus readStatus) {
        return ReadStatusResponse.builder()
            .userId(readStatus.getUser().getId())
            .userName(readStatus.getUser().getMembre().getNom() + " " + readStatus.getUser().getMembre().getPrenom())
            .readAt(readStatus.getReadAt())
            .build();
    }
}