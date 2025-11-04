package com.sante20.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SendMessageRequest {
    
    @NotBlank(message = "Le contenu du message est obligatoire")
    private String content;
}