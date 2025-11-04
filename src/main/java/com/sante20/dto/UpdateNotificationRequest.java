package com.sante20.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UpdateNotificationRequest {
    
    private Boolean isMuted;
    private LocalDateTime mutedUntil;
}