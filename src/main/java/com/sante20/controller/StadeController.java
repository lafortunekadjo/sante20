package com.sante20.controller;


import com.sante20.entity.Stade;
import com.sante20.service.StadeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/stades")
@CrossOrigin("*")
public class StadeController {

    @Autowired
    private StadeService stadeService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Stade> createStade(@RequestBody Map<String, Object> request) {
        System.out.println("Requête POST /api/stades : " + request);
        Stade stade = stadeService.createStade(request);
        return ResponseEntity.status(201).body(stade);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Stade> updateStade(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        System.out.println("Requête PUT /api/stades/" + id + " : " + request);
        Stade stade = stadeService.updateStade(id, request);
        return ResponseEntity.ok(stade);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<Stade> getStadeById(@PathVariable Long id) {
        System.out.println("Requête GET /api/stades/" + id);
        Stade stade = stadeService.getStadeById(id);
        return ResponseEntity.ok(stade);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<List<Stade>> getAllStades() {
        System.out.println("Requête GET /api/stades");
        List<Stade> stades = stadeService.getAllStades();
        return ResponseEntity.ok(stades);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteStade(@PathVariable Long id) {
        System.out.println("Requête DELETE /api/stades/" + id);
        stadeService.deleteStade(id);
        return ResponseEntity.noContent().build();
    }
}