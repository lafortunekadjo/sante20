// src/main/java/com/sante20/dto/RoleCustomDTO.java

package com.sante20.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class RoleCustomDTO {
    private Long id;
    private Long groupeId;
    private String nom;
    private String description;
    private String couleur;
    private String icone;
    private Boolean actif;
    private Boolean systeme;
    private Integer niveau;
    private LocalDateTime dateCreation;
    private LocalDateTime dateModification;
    private List<MenuDTO> menus;
    private Integer nombreMembres;
}