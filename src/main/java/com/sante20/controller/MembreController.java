package com.sante20.controller;


import com.sante20.entity.Membre;
import com.sante20.entity.User;
import com.sante20.service.CustomUserDetailsService;
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
@RequestMapping("/api/membres")
@CrossOrigin("*")
public class MembreController {

    @Autowired
    private MembreService membreService;

    @Autowired
    private CustomUserDetailsService userService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Membre> createMembre(@RequestBody Map<String, Object> request) {
        System.out.println("Requête POST /api/membres : " + request);
        Membre membre = membreService.createMembre(request);
        return ResponseEntity.status(201).body(membre);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Membre> updateMembre(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        System.out.println("Requête PUT /api/membres/" + id + " : " + request);
        Membre membre = membreService.updateMembre(id, request);
        return ResponseEntity.ok(membre);
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Membre> updateMembre2(@RequestBody Map<String, Object> request) {
        System.out.println("Requête PUT /api/membres/" + " : " + request);
        Membre membre = membreService.updateMembre2(request);
        return ResponseEntity.ok(membre);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<Membre> getMembreById(@PathVariable Long id) {
        System.out.println("Requête GET /api/membres/" + id);
        Membre membre = membreService.getMembreById(id);
        return ResponseEntity.ok(membre);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<List<Membre>> getAllMembres() {
        System.out.println("Requête GET /api/membres");
        List<Membre> membres = membreService.getAllMembres();
        return ResponseEntity.ok(membres);
    }

    @GetMapping("/groupe")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<List<Membre>> getMembresByGroupeId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        System.out.println(authentication);
        String username = authentication.getName();
        User candidat = userService.findByUsername(username).orElseThrow();
        List<Membre> membres = membreService.getMembresByGroupeId(candidat.getGroupe().getId());
        return ResponseEntity.ok(membres);
    }

    @GetMapping("/equipe/{equipeId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<List<Membre>> getMembresByEquipeId(@PathVariable Long equipeId) {
        System.out.println("Requête GET /api/membres/equipe/" + equipeId);
        List<Membre> membres = membreService.getMembresByEquipeId(equipeId);
        return ResponseEntity.ok(membres);
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<Membre> getMembreByUserId(@PathVariable Long userId) {
        System.out.println("Requête GET /api/membres/user/" + userId);
        Membre membre = membreService.getMembreByUserId(userId);
        return ResponseEntity.ok(membre);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteMembre(@PathVariable Long id) {
        System.out.println("Requête DELETE /api/membres/" + id);
        membreService.deleteMembre(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/enable/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Membre> enableUser(@PathVariable Long userId) {
        System.out.println("Requête POST /api/users/enable : ");

        Membre user = membreService.enableUser(userId);
        return ResponseEntity.status(201).body(user);
    }

    @PutMapping("/disable/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Membre> disableUser(@PathVariable Long userId) {
        System.out.println("Requête POST /api/membre/disable : ");

        Membre user = membreService.disableUser(userId);
        return ResponseEntity.status(201).body(user);
    }


}