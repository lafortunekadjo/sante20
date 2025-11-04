// src/main/java/com/sante20/mapper/MenuMapper.java

package com.sante20.mapper;

import com.sante20.dto.MenuDTO;
import com.sante20.entity.Menu;
import org.springframework.stereotype.Component;

@Component
public class MenuMapper {

    public MenuDTO toDTO(Menu entity) {
        if (entity == null) {
            return null;
        }

        MenuDTO dto = new MenuDTO();
        dto.setId(entity.getId());
        dto.setCode(entity.getCode());
        dto.setLabel(entity.getLabel());
        dto.setIcone(entity.getIcone());
        dto.setRoute(entity.getRoute());
        dto.setDescription(entity.getDescription());
        dto.setOrdre(entity.getOrdre());
        dto.setActif(entity.getActif());
        dto.setCategorie(entity.getCategorie());

        return dto;
    }
}