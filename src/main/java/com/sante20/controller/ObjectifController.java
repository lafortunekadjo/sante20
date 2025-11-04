package com.sante20.controller;

import com.sante20.entity.Objectif;
import com.sante20.service.MembreService;
import com.sante20.service.ObjectifService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/objectifs")
@CrossOrigin("*")
public class ObjectifController {
    private final ObjectifService objectifService;
    private final MembreService membreService;

    public ObjectifController(ObjectifService objectifService, MembreService membreService) {
        this.objectifService = objectifService;
        this.membreService = membreService;
    }

    @GetMapping("/membre/{membreId}")
    public List<Objectif> getObjectifsByMembre(@PathVariable Long membreId) {
        return objectifService.findByMembreId(membreId);
    }

    @PostMapping
    public ResponseEntity<Objectif> createObjectif(@RequestBody Objectif objectif) {
        // Validation et association du membre
        // Dans une vraie application, l'ID du membre serait récupéré du token d'authentification
        objectif.setMembre(membreService.getMembreById(objectif.getMembre().getId()));
        Objectif savedObjectif = objectifService.save(objectif);
        return ResponseEntity.ok(savedObjectif);
    }
}