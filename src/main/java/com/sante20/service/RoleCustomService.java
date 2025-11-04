// src/main/java/com/sante20/service/RoleCustomService.java

package com.sante20.service;

import com.sante20.dto.CreateRoleCustomDTO;
import com.sante20.dto.MenuDTO;
import com.sante20.dto.RoleCustomDTO;
import com.sante20.dto.UserMenusDTO;
import com.sante20.entity.*;
import com.sante20.mapper.MenuMapper;
import com.sante20.mapper.RoleCustomMapper;
import com.sante20.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class RoleCustomService {

    private final RoleCustomRepository roleCustomRepository;
    private final MenuRepository menuRepository;
    private final GroupeRepository groupeRepository;
    private final UserRepository userRepository;
    private final MembreRepository membreRepository;
    private final RoleCustomMapper roleCustomMapper;
    private final MenuMapper menuMapper;

    /**
     * Récupérer tous les menus disponibles
     */
    @Transactional(readOnly = true)
    public List<MenuDTO> getAllMenus() {
        return menuRepository.findByActifTrueOrderByOrdreAsc().stream()
            .map(menuMapper::toDTO)
            .collect(Collectors.toList());
    }

    /**
     * Récupérer tous les rôles d'un groupe
     */
    @Transactional(readOnly = true)
    public List<RoleCustomDTO> getRolesByGroupe(Long groupeId) {
        Groupe groupe = groupeRepository.findById(groupeId)
            .orElseThrow(() -> new RuntimeException("Groupe non trouvé"));

        return roleCustomRepository.findByGroupeOrderByNiveauAsc(groupe).stream()
            .map(roleCustomMapper::toDTO)
            .collect(Collectors.toList());
    }

    /**
     * Récupérer un rôle par son ID
     */
    @Transactional(readOnly = true)
    public RoleCustomDTO getRoleById(Long roleId) {
        RoleCustom role = roleCustomRepository.findById(roleId)
            .orElseThrow(() -> new RuntimeException("Rôle non trouvé"));

        return roleCustomMapper.toDTO(role);
    }

    /**
     * Créer un nouveau rôle
     */
    public RoleCustomDTO createRole(Long groupeId, CreateRoleCustomDTO dto) {
        Groupe groupe = groupeRepository.findById(groupeId)
            .orElseThrow(() -> new RuntimeException("Groupe non trouvé"));

        // Vérifier que le nom n'existe pas déjà
        if (roleCustomRepository.findByGroupeAndNom(groupe, dto.getNom()).isPresent()) {
            throw new RuntimeException("Un rôle avec ce nom existe déjà dans ce groupe");
        }

        RoleCustom role = new RoleCustom();
        role.setGroupe(groupe);
        role.setNom(dto.getNom());
        role.setDescription(dto.getDescription());
        role.setCouleur(dto.getCouleur() != null ? dto.getCouleur() : "#1976d2");
        role.setIcone(dto.getIcone() != null ? dto.getIcone() : "badge");
        role.setNiveau(dto.getNiveau() != null ? dto.getNiveau() : 10);
        role.setActif(true);
        role.setSysteme(false);

        // Associer les menus
        if (dto.getMenuIds() != null && !dto.getMenuIds().isEmpty()) {
            Set<Menu> menus = new HashSet<>();
            for (Long menuId : dto.getMenuIds()) {
                Menu menu = menuRepository.findById(menuId)
                    .orElseThrow(() -> new RuntimeException("Menu non trouvé : " + menuId));
                menus.add(menu);
            }
            role.setMenus(menus);
        }

        RoleCustom savedRole = roleCustomRepository.save(role);

        return roleCustomMapper.toDTO(savedRole);
    }

    /**
     * Mettre à jour un rôle
     */
    public RoleCustomDTO updateRole(Long roleId, CreateRoleCustomDTO dto) {
        RoleCustom role = roleCustomRepository.findById(roleId)
            .orElseThrow(() -> new RuntimeException("Rôle non trouvé"));

        // Vérifier que ce n'est pas un rôle système
        if (role.getSysteme()) {
            throw new RuntimeException("Les rôles système ne peuvent pas être modifiés");
        }

        // Vérifier le nom unique
        roleCustomRepository.findByGroupeAndNom(role.getGroupe(), dto.getNom())
            .ifPresent(existingRole -> {
                if (!existingRole.getId().equals(roleId)) {
                    throw new RuntimeException("Un rôle avec ce nom existe déjà dans ce groupe");
                }
            });

        role.setNom(dto.getNom());
        role.setDescription(dto.getDescription());
        role.setCouleur(dto.getCouleur());
        role.setIcone(dto.getIcone());
        role.setNiveau(dto.getNiveau());

        // Mettre à jour les menus
        role.getMenus().clear();
        if (dto.getMenuIds() != null && !dto.getMenuIds().isEmpty()) {
            Set<Menu> menus = new HashSet<>();
            for (Long menuId : dto.getMenuIds()) {
                Menu menu = menuRepository.findById(menuId)
                    .orElseThrow(() -> new RuntimeException("Menu non trouvé : " + menuId));
                menus.add(menu);
            }
            role.setMenus(menus);
        }

        RoleCustom savedRole = roleCustomRepository.save(role);

        return roleCustomMapper.toDTO(savedRole);
    }

    /**
     * Supprimer un rôle
     */
    public void deleteRole(Long roleId) {
        RoleCustom role = roleCustomRepository.findById(roleId)
            .orElseThrow(() -> new RuntimeException("Rôle non trouvé"));

        // Vérifier que ce n'est pas un rôle système
        if (role.getSysteme()) {
            throw new RuntimeException("Les rôles système ne peuvent pas être supprimés");
        }

        // Vérifier qu'aucun membre n'a ce rôle
        Integer nombreMembres = roleCustomRepository.countMembresByRoleId(roleId);
        if (nombreMembres > 0) {
            throw new RuntimeException("Impossible de supprimer ce rôle car " + nombreMembres + " membre(s) l'utilisent");
        }

        roleCustomRepository.delete(role);
    }

    /**
     * Activer/Désactiver un rôle
     */
    public RoleCustomDTO toggleRoleStatus(Long roleId) {
        RoleCustom role = roleCustomRepository.findById(roleId)
            .orElseThrow(() -> new RuntimeException("Rôle non trouvé"));

        if (role.getSysteme()) {
            throw new RuntimeException("Les rôles système ne peuvent pas être désactivés");
        }

        role.setActif(!role.getActif());
        RoleCustom savedRole = roleCustomRepository.save(role);

        return roleCustomMapper.toDTO(savedRole);
    }

    /**
     * Récupérer les menus accessibles pour un utilisateur dans un groupe
     */
    @Transactional(readOnly = true)
    public UserMenusDTO getUserMenus(Long userId, Long groupeId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        Groupe groupe = groupeRepository.findById(groupeId)
            .orElseThrow(() -> new RuntimeException("Groupe non trouvé"));

        // Trouver le membre dans ce groupe
        Membre membre = membreRepository.findByUserAndGroupe(user, groupe)
            .orElseThrow(() -> new RuntimeException("Vous n'êtes pas membre de ce groupe"));

        UserMenusDTO dto = new UserMenusDTO();
        dto.setUserId(userId);
        dto.setGroupeId(groupeId);
        dto.setGroupeNom(groupe.getNom());

        // Si le membre a un rôle personnalisé
        if (membre.getRoleCustom() != null) {
            dto.setRoleCustom(roleCustomMapper.toDTOWithoutMenus(membre.getRoleCustom()));
            
            // Récupérer les menus du rôle
            List<MenuDTO> menus = membre.getRoleCustom().getMenus().stream()
                .filter(Menu::getActif)
                .sorted((m1, m2) -> m1.getOrdre().compareTo(m2.getOrdre()))
                .map(menuMapper::toDTO)
                .collect(Collectors.toList());
            
            dto.setMenus(menus);
        } else {
            // Si pas de rôle personnalisé, vérifier le rôle système (ROLE_RESPONSABLE)
            boolean isResponsable = user.getRoles().stream()
                .anyMatch(role -> role.getName() == Role.ERole.ROLE_RESPONSABLE);

            if (isResponsable) {
                // Tous les menus pour les responsables sans rôle custom
                dto.setMenus(menuRepository.findByActifTrueOrderByOrdreAsc().stream()
                    .map(menuMapper::toDTO)
                    .collect(Collectors.toList()));
            } else {
                // Menus de base pour les membres simples
                dto.setMenus(menuRepository.findByActifTrueOrderByOrdreAsc().stream()
                    .filter(menu -> menu.getCode().equals("DASHBOARD") || 
                                   menu.getCode().equals("PROFIL"))
                    .map(menuMapper::toDTO)
                    .collect(Collectors.toList()));
            }
        }

        return dto;
    }

    /**
     * Assigner un rôle à un membre
     */
    public void assignRoleToMembre(Long membreId, Long roleId) {
        Membre membre = membreRepository.findById(membreId)
            .orElseThrow(() -> new RuntimeException("Membre non trouvé"));

        if (roleId == null) {
            membre.setRoleCustom(null);
        } else {
            RoleCustom role = roleCustomRepository.findById(roleId)
                .orElseThrow(() -> new RuntimeException("Rôle non trouvé"));

            // Vérifier que le rôle appartient au même groupe
            if (!role.getGroupe().getId().equals(membre.getGroupe().getId())) {
                throw new RuntimeException("Le rôle ne correspond pas au groupe du membre");
            }

            if (!role.getActif()) {
                throw new RuntimeException("Ce rôle est désactivé");
            }

            membre.setRoleCustom(role);
        }

        membreRepository.save(membre);
    }

    /**
     * Créer les rôles par défaut pour un nouveau groupe
     */
    public void createDefaultRoles(Long groupeId) {
        Groupe groupe = groupeRepository.findById(groupeId)
            .orElseThrow(() -> new RuntimeException("Groupe non trouvé"));

        // Récupérer tous les menus
        List<Menu> tousLesMenus = menuRepository.findByActifTrueOrderByOrdreAsc();
        Set<Menu> menusSet = new HashSet<>(tousLesMenus);

        // Rôle 1 : Président (accès complet)
        RoleCustom president = new RoleCustom();
        president.setGroupe(groupe);
        president.setNom("Président");
        president.setDescription("Accès complet à toutes les fonctionnalités");
        president.setCouleur("#d32f2f");
        president.setIcone("stars");
        president.setNiveau(0);
        president.setActif(true);
        president.setSysteme(true);
        president.setMenus(menusSet);
        roleCustomRepository.save(president);

        // Rôle 2 : Trésorier (finances + gestion)
        RoleCustom tresorier = new RoleCustom();
        tresorier.setGroupe(groupe);
        tresorier.setNom("Trésorier");
        tresorier.setDescription("Gestion des finances et cotisations");
        tresorier.setCouleur("#388e3c");
        tresorier.setIcone("account_balance");
        tresorier.setNiveau(1);
        tresorier.setActif(true);
        tresorier.setSysteme(false);
        Set<Menu> menusTresorier = tousLesMenus.stream()
            .filter(m -> m.getCategorie().equals("FINANCES") || 
                        m.getCode().equals("DASHBOARD") ||
                        m.getCode().equals("MEMBRES"))
            .collect(Collectors.toSet());
        tresorier.setMenus(menusTresorier);
        roleCustomRepository.save(tresorier);

        // Rôle 3 : Capitaine (sport + équipes)
        RoleCustom capitaine = new RoleCustom();
        capitaine.setGroupe(groupe);
        capitaine.setNom("Capitaine");
        capitaine.setDescription("Gestion des matchs et compositions d'équipes");
        capitaine.setCouleur("#1976d2");
        capitaine.setIcone("sports_soccer");
        capitaine.setNiveau(1);
        capitaine.setActif(true);
        capitaine.setSysteme(false);
        Set<Menu> menusCapitaine = tousLesMenus.stream()
            .filter(m -> m.getCategorie().equals("SPORT") || 
                        m.getCode().equals("DASHBOARD"))
            .collect(Collectors.toSet());
        capitaine.setMenus(menusCapitaine);
        roleCustomRepository.save(capitaine);

        // Rôle 4 : Secrétaire (communication + membres)
        RoleCustom secretaire = new RoleCustom();
        secretaire.setGroupe(groupe);
        secretaire.setNom("Secrétaire");
        secretaire.setDescription("Gestion des communications et membres");
        secretaire.setCouleur("#7b1fa2");
        secretaire.setIcone("edit_note");
        secretaire.setNiveau(2);
        secretaire.setActif(true);
        secretaire.setSysteme(false);
        Set<Menu> menusSecretaire = tousLesMenus.stream()
            .filter(m -> m.getCategorie().equals("COMMUNICATION") || 
                        m.getCode().equals("DASHBOARD") ||
                        m.getCode().equals("MEMBRES"))
            .collect(Collectors.toSet());
        secretaire.setMenus(menusSecretaire);
        roleCustomRepository.save(secretaire);
    }
}