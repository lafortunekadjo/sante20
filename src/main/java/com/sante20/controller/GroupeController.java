package com.sante20.controller;

import com.sante20.entity.*;
import com.sante20.service.CustomUserDetailsService;
import com.sante20.service.GroupeService;
import com.sante20.service.MembreService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin("*")
@RequestMapping("/api")
public class GroupeController {
    @Autowired
    private GroupeService groupeService;

    @Autowired
    private MembreService membreService;

    @Autowired
    private CustomUserDetailsService userService;



    @PostMapping("/groupes")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Groupe> createGroupe(@RequestBody Map<String, Object> request) {
        System.out.println("Requête POST /api/groupes : " + request);
        Groupe groupe = groupeService.createGroupe(request);
        return ResponseEntity.status(201).body(groupe);
    }

    @PutMapping("/groupes/{groupeId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('RESPONSABLE')")
    public ResponseEntity<Groupe> updateGroupe(@PathVariable Long groupeId, @RequestBody Map<String, Object> request) {
        System.out.println("Requête PUT /api/groupes/" + groupeId + " : " + request);
        Groupe groupe = groupeService.updateGroupe(groupeId, request);
        return ResponseEntity.ok(groupe);
    }

    @DeleteMapping("/groupes/{groupeId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteGroupe(@PathVariable Long groupeId) {
        System.out.println("Requête DELETE /api/groupes/" + groupeId);
        groupeService.deleteGroupe(groupeId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/groupes/{groupeId}/disable")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> disableGroupe(@PathVariable Long groupeId) {
        System.out.println("Requête PUT /api/groupes/" + groupeId + "/disable");
        groupeService.disableGroupe(groupeId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/groupes/{groupeId}/enable")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> enableGroupe(@PathVariable Long groupeId) {
        System.out.println("Requête PUT /api/groupes/" + groupeId + "enable");
        groupeService.enableGroupe(groupeId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/groupes")
    @PreAuthorize("hasRole('ADMIN') or hasRole('RESPONSABLE')")
    public ResponseEntity<List<Groupe>> getAllGroupes() {
        System.out.println("Requête GET /api/groupes");
        List<Groupe> groupes = groupeService.findAll();
        System.out.println("Groupes retournés : " + groupes);
        return ResponseEntity.ok(groupes);
    }

    @GetMapping("/groupes/active")
    @PreAuthorize("hasRole('ADMIN') or hasRole('RESPONSABLE')")
    public ResponseEntity<List<Groupe>> getAllGroupes2() {
        System.out.println("Requête GET /api/groupes");
        List<Groupe> groupes = groupeService.findAllActive();
        System.out.println("Groupes retournés : " + groupes);
        return ResponseEntity.ok(groupes);
    }

    @GetMapping("/groupes/{groupeId}")
    public ResponseEntity<Groupe> getGroupe(@PathVariable Long groupeId) {
        System.out.println("Requête GET /api/groupes/" + groupeId);
        Groupe groupe = groupeService.findByUser(groupeId);
        return ResponseEntity.ok(groupe);
    }

    @GetMapping("/groupes/byId/{groupeId}")
    public ResponseEntity<Groupe> getGroupe2(@PathVariable Long groupeId) {
        System.out.println("Requête GET /api/groupes/" + groupeId);
        Groupe groupe = groupeService.findById(groupeId);
        return ResponseEntity.ok(groupe);
    }

    @GetMapping("/groupes/connect")
    public ResponseEntity<Groupe> getGroupeCon() {
        System.out.println("Requête GET /api/groupes/" );
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        System.out.println(authentication);
        String username = authentication.getName();
        User candidat = userService.findByUsername(username).orElseThrow();
        Groupe groupe = groupeService.findById(candidat.getGroupe().getId());
        return ResponseEntity.ok(groupe);
    }



    @GetMapping("/groupes/membre1")
    @PreAuthorize("hasRole('ADMIN') or hasRole('RESPONSABLE')")
    public ResponseEntity<List<Membre>> getMembreGroupe() {
        System.out.print("appel membre");
        List<Membre> membre = groupeService.findMembreByGroupe();
        return ResponseEntity.ok(membre);
    }

    @PutMapping("/groupes/{groupeId}/config")
    @PreAuthorize("hasRole('RESPONSABLE', 'ADMIN')")
    public ResponseEntity<Void> configureGroupe(@PathVariable Long groupeId, @RequestBody Map<String, Object> config) {
        System.out.println("Requête PUT /api/groupes/" + groupeId + "/config : " + config);
        groupeService.configureGroupe(groupeId, config);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/groupes/{groupeId}/membres")
    @PreAuthorize("hasRole('RESPONSABLE')")
    public ResponseEntity<Void> removeMembre(@PathVariable Long groupeId, @RequestBody Map<String, String> request) {
        System.out.println("Requête DELETE /api/groupes/" + groupeId + "/membres : " + request);
        groupeService.removeMembre(groupeId, request.get("email"));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/typesanctions")
    @PreAuthorize("hasRole('ADMIN') or hasRole('RESPONSABLE')")
    public ResponseEntity<TypeSanction> createTypeSanction(@RequestBody Map<String, Object> request) {
        System.out.println("Requête POST /api/typesanctions : " + request);
        TypeSanction typeSanction = groupeService.createTypeSanction(request);
        return ResponseEntity.status(201).body(typeSanction);
    }

    @PostMapping("/sanctions")
    @PreAuthorize("hasRole('ADMIN') or hasRole('RESPONSABLE')")
    public ResponseEntity<Sanction> applySanction(@RequestBody Map<String, Object> request) {
        System.out.println("Requête POST /api/groupes/" +  "/sanctions : " + request);
        Sanction sanction = groupeService.applySanction(request);
        return ResponseEntity.status(201).body(sanction);
    }

    @GetMapping("/groupes/{groupeId}/sanctions")
    @PreAuthorize("hasRole('ADMIN') or hasRole('RESPONSABLE')")
    public List<Sanction> getSanction(@PathVariable Long groupeId) {


        return groupeService.listeSanction(groupeId);
    }

    @PostMapping("/groupes/{groupeId}/matchs")
    @PreAuthorize("hasRole('RESPONSABLE')")
    public ResponseEntity<Match> createMatch(@PathVariable Long groupeId, @RequestBody Map<String, Object> request) {
        System.out.println("Requête POST /api/groupes/" + groupeId + "/matchs : " + request);
        Match match = groupeService.createMatch(groupeId, request);
        return ResponseEntity.status(201).body(match);
    }

    @PostMapping("/groupes/{groupeId}/matchs/{matchId}/presences")
    @PreAuthorize("hasRole('RESPONSABLE')")
    public ResponseEntity<Presence> addPresence(@PathVariable Long groupeId, @PathVariable Long matchId, @RequestBody Map<String, Object> request) {
        System.out.println("Requête POST /api/groupes/" + groupeId + "/matchs/" + matchId + "/presences : " + request);
        Presence presence = groupeService.addPresence(groupeId, matchId, request);
        return ResponseEntity.status(201).body(presence);
    }

    @GetMapping("/groupes/{groupeId}/matchs/{matchId}/presences")
    @PreAuthorize("hasRole('ADMIN') or hasRole('RESPONSABLE')")
    public ResponseEntity<List<Presence>> getPresencesByMatch(@PathVariable Long groupeId, @PathVariable Long matchId) {
        System.out.println("Requête GET /api/groupes/" + groupeId + "/matchs/" + matchId + "/presences");
        List<Presence> presences = groupeService.getPresencesByMatch(matchId);
        return ResponseEntity.ok(presences);
    }

    @GetMapping("/membres/{membreId}/stats")
    @PreAuthorize("hasRole('ADMIN') or hasRole('RESPONSABLE')")
    public ResponseEntity<Membre> getMembreWithStats(@PathVariable Long membreId) {
        System.out.println("Requête GET /api/membres/" + membreId + "/stats");
        Membre membre = groupeService.getMembreWithStats(membreId);
        return ResponseEntity.ok(membre);
    }

    @GetMapping("/membres/all")
    @PreAuthorize("hasRole('ADMIN')")
    public List<Membre> getMembres() {
        return groupeService.getMembreAll();
    }


    //contribution


    @PostMapping("/groupes/{groupeId}/membres/{membreId}/contributions")
    @PreAuthorize("hasRole('RESPONSABLE')")
    public ResponseEntity<Contribution> addContribution(@PathVariable Long groupeId, @PathVariable Long membreId, @RequestBody Map<String, Object> request) {
        System.out.println("Requête POST /api/groupes/" + groupeId + "/membres/" + membreId + "/contributions : " + request);
        Contribution contribution = groupeService.addContribution(groupeId, membreId, request);
        return ResponseEntity.status(201).body(contribution);
    }

    @GetMapping("/groupes/{groupeId}/membres/{membreId}/contributions")
    @PreAuthorize("hasRole('ADMIN') or hasRole('RESPONSABLE')")
    public ResponseEntity<List<Contribution>> getContributionsByMembre(@PathVariable Long groupeId, @PathVariable Long membreId) {
        System.out.println("Requête GET /api/groupes/" + groupeId + "/membres/" + membreId + "/contributions");
        List<Contribution> contributions = groupeService.getContributionsByMembre(groupeId, membreId);
        return ResponseEntity.ok(contributions);
    }

    @GetMapping("/groupes/{groupeId}/contributions")
    @PreAuthorize("hasRole('ADMIN') or hasRole('RESPONSABLE')")
    public ResponseEntity<List<Contribution>> getContributionsByGroupe(@PathVariable Long groupeId) {
        System.out.println("Requête GET /api/groupes/" + groupeId + "/contributions");
        List<Contribution> contributions = groupeService.getContributionsByGroupe(groupeId);
        return ResponseEntity.ok(contributions);
    }

    @GetMapping("/groupes/{groupeId}/membres")
    @PreAuthorize("hasRole('ADMIN') or hasRole('RESPONSABLE')")
    public ResponseEntity<List<Membre>> getMembreByGroupe(@PathVariable Long groupeId) {
        System.out.println("Requête GET /api/groupes/" + groupeId + "/contributions");
        List<Membre> membres = membreService.getMembresByGroupe(groupeId);
        return ResponseEntity.ok(membres);
    }


    //sanction

    @PostMapping("/groupes/{groupeId}/membres/{membreId}/sanctions/{sanctionId}/paiements")
    @PreAuthorize("hasRole('RESPONSABLE')")
    public ResponseEntity<PaiementSanction> addPaiementSanction(@PathVariable Long groupeId, @PathVariable Long membreId, @PathVariable Long sanctionId, @RequestBody Map<String, Object> request) {
        System.out.println("Requête POST /api/groupes/" + groupeId + "/membres/" + membreId + "/sanctions/" + sanctionId + "/paiements : " + request);
        PaiementSanction paiement = groupeService.addPaiementSanction(groupeId, membreId, sanctionId, request);
        return ResponseEntity.status(201).body(paiement);
    }

    @GetMapping("/groupes/{groupeId}/membres/{membreId}/sanctions/{sanctionId}/paiements")
    @PreAuthorize("hasRole('ADMIN') or hasRole('RESPONSABLE')")
    public ResponseEntity<List<PaiementSanction>> getPaiementsBySanction(@PathVariable Long groupeId, @PathVariable Long membreId, @PathVariable Long sanctionId) {
        System.out.println("Requête GET /api/groupes/" + groupeId + "/membres/" + membreId + "/sanctions/" + sanctionId + "/paiements");
        List<PaiementSanction> paiements = groupeService.getPaiementsBySanction(groupeId, membreId, sanctionId);
        return ResponseEntity.ok(paiements);
    }

    @GetMapping("/groupes/{groupeId}/sanctions/paiements")
    @PreAuthorize("hasRole('ADMIN') or hasRole('RESPONSABLE')")
    public ResponseEntity<List<PaiementSanction>> getPaiementsByGroupe(@PathVariable Long groupeId) {
        System.out.println("Requête GET /api/groupes/" + groupeId + "/sanctions/paiements");
        List<PaiementSanction> paiements = groupeService.getPaiementsByGroupe(groupeId);
        return ResponseEntity.ok(paiements);
    }

    @GetMapping("/groupes/user/{userId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('RESPONSABLE')")
    public ResponseEntity<Groupe> getByUser(@PathVariable Long userId) {
        System.out.println("Requête GET /api/groupes/" + userId + "/user");
        Groupe groupe = groupeService.findByUser(userId);
        return ResponseEntity.ok(groupe);
    }


    // villes

    @GetMapping("/ville/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Ville>> getVille() {
        return ResponseEntity.ok(groupeService.getVilleAll());
    }

    //stade

    @GetMapping("/stade/all")
    @PreAuthorize("hasRole('ADMIN')")
    public List<Stade> getStade() {
        return groupeService.getStadeAll();
    }


}