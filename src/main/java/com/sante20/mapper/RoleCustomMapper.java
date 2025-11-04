// src/main/java/com/sante20/mapper/RoleCustomMapper.java

package com.sante20.mapper;

import com.sante20.dto.RoleCustomDTO;
import com.sante20.entity.Menu;
import com.sante20.entity.RoleCustom;
import com.sante20.repository.RoleCustomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class RoleCustomMapper {

    private final MenuMapper menuMapper;
    private final RoleCustomRepository roleCustomRepository;

    public RoleCustomDTO toDTO(RoleCustom entity) {

        if (entity == null) {
            return null;
        }

        RoleCustomDTO dto = new RoleCustomDTO();
        dto.setId(entity.getId());
        dto.setGroupeId(entity.getGroupe().getId());
        dto.setNom(entity.getNom());
        dto.setDescription(entity.getDescription());
        dto.setCouleur(entity.getCouleur());
        dto.setIcone(entity.getIcone());
        dto.setActif(entity.getActif());
        dto.setSysteme(entity.getSysteme());
        dto.setNiveau(entity.getNiveau());
        dto.setDateCreation(entity.getDateCreation());
        dto.setDateModification(entity.getDateModification());

        // Mapper les menus - Correction de la ConcurrentModificationException (CME)
        if (entity.getMenus() != null) {
            // CRÉATION D'UNE COPIE IMMÉDIATE :
            // Nous créons une nouvelle ArrayList à partir de la collection renvoyée
            // par getMenus(). Cela isole notre itération (via .stream()) de toute
            // modification concurrente effectuée par un autre thread.
            List<Menu> menusStables = new ArrayList<>(entity.getMenus());

            dto.setMenus(
                    menusStables.stream()
                            .map(menuMapper::toDTO)
                            .collect(Collectors.toList())
            );
        }

        // Compter le nombre de membres
        dto.setNombreMembres(roleCustomRepository.countMembresByRoleId(entity.getId()));

        return dto;
    }

    public RoleCustomDTO toDTOWithoutMenus(RoleCustom entity) {
        if (entity == null) {
            return null;
        }

        RoleCustomDTO dto = new RoleCustomDTO();
        dto.setId(entity.getId());
        dto.setGroupeId(entity.getGroupe().getId());
        dto.setNom(entity.getNom());
        dto.setDescription(entity.getDescription());
        dto.setCouleur(entity.getCouleur());
        dto.setIcone(entity.getIcone());
        dto.setActif(entity.getActif());
        dto.setSysteme(entity.getSysteme());
        dto.setNiveau(entity.getNiveau());
        dto.setDateCreation(entity.getDateCreation());
        dto.setDateModification(entity.getDateModification());
        dto.setNombreMembres(roleCustomRepository.countMembresByRoleId(entity.getId()));

        return dto;
    }
}