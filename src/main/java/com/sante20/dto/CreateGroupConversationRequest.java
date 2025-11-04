package com.sante20.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class CreateGroupConversationRequest {
    
    @NotBlank(message = "Le titre est obligatoire")
    private String titre;
    
    @NotEmpty(message = "La liste des participants ne peut pas être vide")
    private List<Long> participantIds;
    
    private List<Long> adminIds;
}