package com.sante20.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreatePrivateConversationRequest {
    
    @NotNull(message = "L'ID de l'autre utilisateur est obligatoire")
    private Long otherUserId;
}