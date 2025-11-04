package com.sante20.controller;


import com.sante20.entity.Equipe;
import com.sante20.service.EquipeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/equipes")
@CrossOrigin("*")
public class EquipeController {

    @Autowired
    private EquipeService equipeService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Equipe> createEquipe(@RequestBody Map<String, Object> request) {
        System.out.println("Requête POST /api/equipes : " + request);
        Equipe equipe = equipeService.createEquipe(request);
        return ResponseEntity.status(201).body(equipe);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Equipe> updateEquipe(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        System.out.println("Requête PUT /api/equipes/" + id + " : " + request);
        Equipe equipe = equipeService.updateEquipe(id, request);
        return ResponseEntity.ok(equipe);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<Equipe> getEquipeById(@PathVariable Long id) {
        System.out.println("Requête GET /api/equipes/" + id);
        Equipe equipe = equipeService.getEquipeById(id);
        return ResponseEntity.ok(equipe);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<List<Equipe>> getAllEquipes() {
        System.out.println("Requête GET /api/equipes");
        List<Equipe> equipes = equipeService.getAllEquipes();
        return ResponseEntity.ok(equipes);
    }


    @GetMapping("/groupe")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<List<Equipe>> getAllEquipesByGroupe() {
        System.out.println("Requête GET /api/equipes");
        List<Equipe> equipes = equipeService.getAllEquipesByGroupe();
        return ResponseEntity.ok(equipes);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteEquipe(@PathVariable Long id) {
        System.out.println("Requête DELETE /api/equipes/" + id);
        equipeService.deleteEquipe(id);
        return ResponseEntity.noContent().build();
    }
}