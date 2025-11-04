// src/main/java/com/sante20/dto/UserMenusDTO.java

package com.sante20.dto;

import lombok.Data;
import java.util.List;

@Data
public class UserMenusDTO {
    private Long userId;
    private Long groupeId;
    private String groupeNom;
    private RoleCustomDTO roleCustom;
    private List<MenuDTO> menus;
}