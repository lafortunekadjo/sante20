// src/main/java/com/sante20/dto/MessageDiscussionMatchDTO.java

package com.sante20.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class MessageDiscussionMatchDTO {
    private Long id;
    private Long discussionId;
    private Long auteurId;
    private String auteurNom;
    private String auteurPrenom;
    private String auteurPhotoUrl;
    private Long groupeAuteurId;
    private String groupeAuteurNom;
    private String contenu;
    private LocalDateTime dateEnvoi;
    private Boolean lu;
}