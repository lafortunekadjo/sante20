// src/main/java/com/sante20/dto/MenuDTO.java

package com.sante20.dto;

import lombok.Data;

@Data
public class MenuDTO {
    private Long id;
    private String code;
    private String label;
    private String icone;
    private String route;
    private String description;
    private Integer ordre;
    private Boolean actif;
    private String categorie;
}