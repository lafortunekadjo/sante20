package com.sante20.controller;

import com.sante20.entity.Evenement;
import com.sante20.service.EvenementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/evenements")
@CrossOrigin("*")
public class EvenementController {

    @Autowired
    private EvenementService evenementService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Evenement create(@RequestBody Map<String, Object> evenementData) {
        return evenementService.createEvenement(evenementData);
    }

    @PutMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public Evenement update(@PathVariable Long id, @RequestBody Map<String, Object> evenementData) {
        return evenementService.updateEvenement(id, evenementData);
    }

    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public List<Evenement> getAll() {
        return evenementService.getAllEvenements();
    }

    @GetMapping("/groupe")
    @ResponseStatus(HttpStatus.OK)
    public List<Evenement> getAllGroupe() {
        return evenementService.getAllEvenementsGroupe();
    }

    // Autres méthodes GET, PUT, DELETE pour les Evenements
    // ...
}
