package com.sante20.controller;


import com.sante20.entity.TypeSanction;
import com.sante20.service.TypeSanctionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/type-sanctions")
@CrossOrigin("*")
public class TypeSanctionController {

    @Autowired
    private TypeSanctionService typeSanctionService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TypeSanction> createTypeSanction(@RequestBody Map<String, Object> request) {
        System.out.println("Requête POST /api/type-sanctions : " + request);
        TypeSanction typeSanction = typeSanctionService.createTypeSanction(request);
        return ResponseEntity.status(201).body(typeSanction);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TypeSanction> updateTypeSanction(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        System.out.println("Requête PUT /api/type-sanctions/" + id + " : " + request);
        TypeSanction typeSanction = typeSanctionService.updateTypeSanction(id, request);
        return ResponseEntity.ok(typeSanction);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<TypeSanction> getTypeSanctionById(@PathVariable Long id) {
        System.out.println("Requête GET /api/type-sanctions/" + id);
        TypeSanction typeSanction = typeSanctionService.getTypeSanctionById(id);
        return ResponseEntity.ok(typeSanction);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<List<TypeSanction>> getAllTypeSanctions() {
        System.out.println("Requête GET /api/type-sanctions");
        List<TypeSanction> typeSanctions = typeSanctionService.getAllTypeSanctions();
        return ResponseEntity.ok(typeSanctions);
    }

//    @GetMapping
//    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
//    public ResponseEntity<List<TypeSanction>> getGroupeTypeSanctions() {
//        List<TypeSanction> typeSanctions = typeSanctionService.getGroupeTypeSanctions();
//        return ResponseEntity.ok(typeSanctions);
//    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteTypeSanction(@PathVariable Long id) {
        System.out.println("Requête DELETE /api/type-sanctions/" + id);
        typeSanctionService.deleteTypeSanction(id);
        return ResponseEntity.noContent().build();
    }
}