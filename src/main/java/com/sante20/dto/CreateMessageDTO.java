// src/main/java/com/sante20/dto/CreateMessageDTO.java

package com.sante20.dto;

import lombok.Data;

@Data
public class CreateMessageDTO {
    private Long discussionId;
    private String contenu;
}