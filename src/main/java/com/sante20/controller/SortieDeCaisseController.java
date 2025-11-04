package com.sante20.controller;


import com.sante20.entity.SortieDeCaisse;
import com.sante20.service.SortieDeCaisseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sorties-de-caisse")
public class SortieDeCaisseController {

    @Autowired
    private SortieDeCaisseService sortieDeCaisseService;

    // Endpoint pour créer une nouvelle sortie de caisse
    @PostMapping
    public ResponseEntity<SortieDeCaisse> createSortieDeCaisse(@RequestBody Map<String, Object> request) {
        try {
            SortieDeCaisse nouvelleSortie = sortieDeCaisseService.createSortieDeCaisse(request);
            return new ResponseEntity<>(nouvelleSortie, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            // Gère les erreurs de validation
System.out.print(e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            // Gère les erreurs inattendues
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Endpoint pour récupérer toutes les sorties de caisse
    @GetMapping
    public ResponseEntity<List<SortieDeCaisse>> getAllSortiesDeCaisse() {
        List<SortieDeCaisse> sorties = sortieDeCaisseService.getAllSortiesDeCaisse();
        return new ResponseEntity<>(sorties, HttpStatus.OK);
    }

    // Endpoint pour supprimer une sortie de caisse
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSortieDeCaisse(@PathVariable Long id) {
        sortieDeCaisseService.deleteSortieDeCaisse(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}
