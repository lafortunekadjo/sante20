package com.sante20.controller;

import com.sante20.dto.DemandeDTO;
import com.sante20.dto.ReponseDTO;
import com.sante20.entity.*;
import com.sante20.service.CandidatureService;
import com.sante20.service.CustomUserDetailsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/candidatures")
public class CandidatureController {
    
    @Autowired
    private CandidatureService candidatureService;

    @Autowired
    private CustomUserDetailsService userService;

    // ---------------------------------------------------------
    // Endpoint 1: Obtenir le formulaire pour un 2-0 (Public/Candidat)
    // ---------------------------------------------------------
    @GetMapping("/groupes/{groupeId}/formulaire")
    public List<QuestionCandidature> getFormulaire(@PathVariable Long groupeId) {
        // La question est publique, pas besoin d'être membre/admin pour la voir
        return candidatureService.getFormulairePublic(groupeId);
    }
    
    // ---------------------------------------------------------
    // Endpoint 2: Soumettre une demande (Candidat - nécessite d'être connecté)
    // ---------------------------------------------------------
    // NOTE: Le candidat doit être connecté (rôle CANDIDAT) pour que son ID soit récupéré.
    @PostMapping("/groupes/{groupeId}/soumettre")
    public ResponseEntity<DemandeIntegration> soumettreDemande(
            @PathVariable Long groupeId,// Utilisation de Spring Security pour l'utilisateur
            @RequestBody DemandeDTO demandeDTO) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        System.out.println(authentication);
        String username = authentication.getName();

        // L'utilisateur 'candidat' est récupéré via Spring Security
        User candidat = userService.findByUsername(username).orElseThrow();
        
        DemandeIntegration nouvelleDemande = candidatureService.soumettreDemande(groupeId, candidat, demandeDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(nouvelleDemande);
    }

    // ---------------------------------------------------------
    // Endpoint 3: Récupérer les demandes en attente (Admin du 2-0)
    // ---------------------------------------------------------
    @GetMapping("/groupes/en-attente")
    // @PreAuthorize("hasRole('ADMIN') and @securityService.isAdminDuGroupe(#groupeId)") // Exemple de sécurisation
    public List<DemandeIntegration> getDemandesEnAttente() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        System.out.println(authentication);
        String username = authentication.getName();
        User candidat = userService.findByUsername(username).orElseThrow();
        // Logique de sécurité: s'assurer que seul l'admin du 2-0 peut accéder à cet endpoint
        return candidatureService.getDemandesEnAttente(candidat.getGroupe().getId());
    }

    // ---------------------------------------------------------
    // Endpoint 4: Traiter une demande (Admin du 2-0)
    // ---------------------------------------------------------
    @PutMapping("/{demandeId}/traiter")
    // @PreAuthorize("hasRole('ADMIN')")
    public DemandeIntegration traiterDemande(
            @PathVariable Long demandeId,
            @RequestParam StatutDemande statut) {
        // Logique de sécurité: s'assurer que l'admin est celui du groupe ciblé par la demande
        return candidatureService.traiterDemande(demandeId, statut);
    }
// Verifier si la demande d'un utilisateur existe pour un gr oupe
    @GetMapping("/check/{groupeId}/{userId}")
    // @PreAuthorize("hasRole('ADMIN') and @securityService.isAdminDuGroupe(#groupeId)") // Exemple de sécurisation
    public Boolean checkDemandesEnAttente(@PathVariable Long groupeId, @PathVariable Long userId) {
        // Logique de sécurité: s'assurer que seul l'admin du 2-0 peut accéder à cet endpoint
        return candidatureService.checkDemandesEnAttente(groupeId, userId);
    }

    // Verifier si la demande d'un utilisateur existe pour un gr oupe
    @GetMapping("/demandes-adhesion/mes-demandes")
    // @PreAuthorize("hasRole('ADMIN') and @securityService.isAdminDuGroupe(#groupeId)") // Exemple de sécurisation
    public List<DemandeIntegration> getDemandesCandidat() {
        // Logique de sécurité: s'assurer que seul l'admin du 2-0 peut accéder à cet endpoint
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User candidat = userService.findByUsername(username).orElseThrow();
        return candidatureService.getDemandesByUser(candidat);
    }

    @GetMapping("/demande/reponse/{demandeId}")
    // @PreAuthorize("hasRole('ADMIN') and @securityService.isAdminDuGroupe(#groupeId)") // Exemple de sécurisation
    public List<ReponseDTO> getReponse(@PathVariable Long demandeId) {

        return candidatureService.getReponseByDemandeIdDTO(demandeId);
    }
}