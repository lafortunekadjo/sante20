package com.sante20.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class EditMessageRequest {
    
    @NotBlank(message = "Le nouveau contenu est obligatoire")
    private String newContent;
}