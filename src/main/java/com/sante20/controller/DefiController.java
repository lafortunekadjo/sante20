package com.sante20.controller;

import com.sante20.entity.DefiCreationDTO;
import com.sante20.entity.DefiMatchAmical;
import com.sante20.entity.StatutDefi;
import com.sante20.entity.User;
import com.sante20.repository.UserRepository;
import com.sante20.service.DefiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/defis")
public class DefiController {

    @Autowired
    private DefiService defiService;
    @Autowired
    private UserRepository userService; // Pour récupérer le groupe de l'utilisateur connecté

    // ---------------------------------------------------------
    // Endpoint 1: Lancer un nouveau Défi (Requiert le rôle ADMIN du groupe demandeur)
    // ---------------------------------------------------------
    @PostMapping("/lancer")
    // @PreAuthorize("hasRole('ADMIN')") // Sécurité: Seulement un ADMIN peut lancer
    public ResponseEntity<DefiMatchAmical> lancerDefi(
            @RequestBody DefiCreationDTO defiDTO) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        System.out.println(authentication);
        String username = authentication.getName();
        User userDetails = userService.findByUsername(username).orElseThrow();
        
        // Récupérer le groupe de l'utilisateur connecté (celui qui lance le défi)
        Long groupeDemandeurId = userDetails.getGroupe().getId();

        DefiMatchAmical nouveauDefi = defiService.lancerDefi(groupeDemandeurId, defiDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(nouveauDefi);
    }
    
    // ---------------------------------------------------------
    // Endpoint 2: Obtenir les défis reçus en attente (Requiert le rôle ADMIN du groupe cible)
    // ---------------------------------------------------------
    @GetMapping("/recus/attente")
    // @PreAuthorize("hasRole('ADMIN')")
    public List<DefiMatchAmical> getDefisRecus() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        System.out.println(authentication);
        String username = authentication.getName();
        User currentUser = userService.findByUsername(username).orElseThrow();
        
        // Récupérer le groupe de l'utilisateur connecté (le groupe cible)


        return defiService.getDefisRecusEnAttente(currentUser.getGroupe().getId());
    }

    @GetMapping("/recus/all")
    // @PreAuthorize("hasRole('ADMIN')")
    public List<DefiMatchAmical> getDefisRecusAll() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        System.out.println(authentication);
        String username = authentication.getName();
        User currentUser = userService.findByUsername(username).orElseThrow();

        // Récupérer le groupe de l'utilisateur connecté (le groupe cible)


        return defiService.getDefisRecu(currentUser.getGroupe().getId());
    }

    // ---------------------------------------------------------
    // Endpoint 3: Répondre à un Défi (ACCEPTE/REFUSE/REPORTE)
    // ---------------------------------------------------------
    @PutMapping("/{defiId}/refuse")
    // @PreAuthorize("hasRole('ADMIN')")
    public DefiMatchAmical refuseDefi(
            @PathVariable Long defiId) { // Statut doit être ACCEPTE, REFUSE ou REPORTE
        
        // Il faudrait ajouter une vérification de sécurité ici pour s'assurer
        // que l'utilisateur est bien l'admin du Groupe Cible avant de répondre.
        
        return defiService.repondreDefi(defiId, StatutDefi.REFUSE);
    }

    @PutMapping("/{defiId}/reporter")
    // @PreAuthorize("hasRole('ADMIN')")
    public DefiMatchAmical reporterDefi(
            @PathVariable Long defiId) { // Statut doit être ACCEPTE, REFUSE ou REPORTE

        // Il faudrait ajouter une vérification de sécurité ici pour s'assurer
        // que l'utilisateur est bien l'admin du Groupe Cible avant de répondre.

        return defiService.repondreDefi(defiId, StatutDefi.REPORTE);
    }

    @PutMapping("/{defiId}/accept")
    // @PreAuthorize("hasRole('ADMIN')")
    public DefiMatchAmical acceptDefi(
            @PathVariable Long defiId) { // Statut doit être ACCEPTE, REFUSE ou REPORTE

        // Il faudrait ajouter une vérification de sécurité ici pour s'assurer
        // que l'utilisateur est bien l'admin du Groupe Cible avant de répondre.

        return defiService.repondreDefi(defiId, StatutDefi.ACCEPTE);
    }

    @GetMapping("/envoye")
    // @PreAuthorize("hasRole('ADMIN')")
    public List<DefiMatchAmical> getDefisEnvoyes() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        System.out.println(authentication);
        String username = authentication.getName();
        User currentUser = userService.findByUsername(username).orElseThrow();
        return defiService.getDefisEnvoye(currentUser.getGroupe().getId());
    }
}