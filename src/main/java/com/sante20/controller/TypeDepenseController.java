package com.sante20.controller;

import com.sante20.entity.TypeDepense;
import com.sante20.service.TypeDepenseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/types-depenses")
public class TypeDepenseController {

    @Autowired
    private TypeDepenseService typeDepenseService;

    // Endpoint pour créer un nouveau type de dépense
    @PostMapping
    public ResponseEntity<TypeDepense> createTypeDepense(@RequestBody Map<String, Object> request) {
        try {
            TypeDepense nouveauType = typeDepenseService.createTypeDepense(request);
            return new ResponseEntity<>(nouveauType, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Endpoint pour récupérer tous les types de dépenses
    @GetMapping
    public ResponseEntity<List<TypeDepense>> getAllTypesDepenses() {
        List<TypeDepense> types = typeDepenseService.getAllTypesDepenses();
        return new ResponseEntity<>(types, HttpStatus.OK);
    }

    // Endpoint pour supprimer un type de dépense
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTypeDepense(@PathVariable Long id) {
        typeDepenseService.deleteTypeDepense(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}
