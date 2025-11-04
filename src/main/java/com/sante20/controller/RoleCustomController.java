// src/main/java/com/sante20/controller/RoleCustomController.java

package com.sante20.controller;

import com.sante20.dto.CreateRoleCustomDTO;
import com.sante20.dto.MenuDTO;
import com.sante20.dto.RoleCustomDTO;
import com.sante20.dto.UserMenusDTO;
import com.sante20.entity.User;
import com.sante20.service.CustomUserDetailsService;
import com.sante20.service.RoleCustomService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/roles-custom")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class RoleCustomController {

    private final RoleCustomService roleCustomService;
    @Autowired
    private CustomUserDetailsService userService;

    /**
     * Récupérer tous les menus disponibles
     */
    @GetMapping("/menus")
    public ResponseEntity<List<MenuDTO>> getAllMenus() {
        return ResponseEntity.ok(roleCustomService.getAllMenus());
    }

    /**
     * Récupérer les rôles d'un groupe
     */
    @GetMapping("/groupe")
    public ResponseEntity<List<RoleCustomDTO>> getRolesByGroupe() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        System.out.println(authentication);
        String username = authentication.getName();
        User currentUser = userService.findByUsername(username).orElseThrow();
        return ResponseEntity.ok(roleCustomService.getRolesByGroupe(currentUser.getGroupe().getId()));
    }

    /**
     * Récupérer un rôle par son ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<RoleCustomDTO> getRoleById(@PathVariable Long id) {
        return ResponseEntity.ok(roleCustomService.getRoleById(id));
    }

    /**
     * Créer un nouveau rôle
     */
    @PostMapping("/groupe")
    public ResponseEntity<RoleCustomDTO> createRole(
        @RequestBody CreateRoleCustomDTO dto
    ) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        System.out.println(authentication);
        String username = authentication.getName();
        User currentUser = userService.findByUsername(username).orElseThrow();
        return ResponseEntity.ok(roleCustomService.createRole(currentUser.getGroupe().getId(), dto));
    }

    /**
     * Mettre à jour un rôle
     */
    @PutMapping("/{id}")
    public ResponseEntity<RoleCustomDTO> updateRole(
        @PathVariable Long id,
        @RequestBody CreateRoleCustomDTO dto
    ) {
        return ResponseEntity.ok(roleCustomService.updateRole(id, dto));
    }

    /**
     * Supprimer un rôle
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRole(@PathVariable Long id) {
        roleCustomService.deleteRole(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Activer/Désactiver un rôle
     */
    @PatchMapping("/{id}/toggle")
    public ResponseEntity<RoleCustomDTO> toggleRoleStatus(@PathVariable Long id) {
        return ResponseEntity.ok(roleCustomService.toggleRoleStatus(id));
    }

    /**
     * Récupérer les menus de l'utilisateur connecté pour un groupe
     */
    @GetMapping("/user-menus")
    public ResponseEntity<UserMenusDTO> getUserMenus(


    ) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        System.out.println(authentication);
        String username = authentication.getName();
        User currentUser = userService.findByUsername(username).orElseThrow();
        Long userId = currentUser.getId();
        return ResponseEntity.ok(roleCustomService.getUserMenus(userId, currentUser.getGroupe().getId()));
    }

    /**
     * Assigner un rôle à un membre
     */
    @PatchMapping("/assign")
    public ResponseEntity<Void> assignRoleToMembre(
        @RequestParam Long membreId,
        @RequestParam(required = false) Long roleId
    ) {
        roleCustomService.assignRoleToMembre(membreId, roleId);
        return ResponseEntity.ok().build();
    }

    /**
     * Créer les rôles par défaut pour un groupe
     */
    @PostMapping("/default")
    public ResponseEntity<Void> createDefaultRoles() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        System.out.println(authentication);
        String username = authentication.getName();
        User currentUser = userService.findByUsername(username).orElseThrow();
        roleCustomService.createDefaultRoles(currentUser.getGroupe().getId());
        return ResponseEntity.ok().build();
    }

//    private Long extractUserId(Authentication authentication) {
//        return ((com.sante20.security.UserDetailsImpl) authentication.getPrincipal()).getId();
//    }
}