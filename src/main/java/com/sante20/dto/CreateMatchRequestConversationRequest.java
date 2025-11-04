package com.sante20.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class CreateMatchRequestConversationRequest {
    
    @NotNull(message = "L'ID de la demande de match est obligatoire")
    private Long matchRequestId;
    
    @NotEmpty(message = "La liste des responsables ne peut pas être vide")
    private List<Long> responsableIds;
}