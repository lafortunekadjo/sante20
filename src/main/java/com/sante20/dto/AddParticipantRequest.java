package com.sante20.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AddParticipantRequest {
    
    @NotNull(message = "L'ID de l'utilisateur est obligatoire")
    private Long userId;
}