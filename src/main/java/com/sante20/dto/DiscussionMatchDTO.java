// src/main/java/com/sante20/dto/DiscussionMatchDTO.java

package com.sante20.dto;

import com.sante20.entity.Groupe;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class DiscussionMatchDTO {
    private Long id;
    private Long defiMatchId;
    private LocalDateTime dateCreation;
    private Boolean active;
    private Groupe groupeEmetteur;
    private Groupe groupeCible;
    private List<MessageDiscussionMatchDTO> messages;
    private Integer messagesNonLus;
    private MessageDiscussionMatchDTO dernierMessage;
}