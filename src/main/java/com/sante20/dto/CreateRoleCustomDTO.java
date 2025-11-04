// src/main/java/com/sante20/dto/CreateRoleCustomDTO.java

package com.sante20.dto;

import lombok.Data;
import java.util.List;

@Data
public class CreateRoleCustomDTO {
    private String nom;
    private String description;
    private String couleur;
    private String icone;
    private Integer niveau;
    private List<Long> menuIds;
}