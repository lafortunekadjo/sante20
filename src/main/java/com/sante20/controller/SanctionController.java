package com.sante20.controller;

import com.sante20.entity.Sanction;
import com.sante20.service.GroupeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@CrossOrigin("*")
@RequestMapping("/api/sanctions")

public class SanctionController {
    @Autowired
    private GroupeService groupeService;

    @PutMapping("/{id}")
    public ResponseEntity<Sanction> updateSanction(@PathVariable Long id, @RequestBody Map<String, Object> request) {

        try {
            System.out.print("recu" + request);
            Sanction updatedSanction = groupeService.updateSanction(id, request);
            return ResponseEntity.ok(updatedSanction);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @GetMapping("/payer/{id}")
    public ResponseEntity<Sanction> paySanction(@PathVariable Long id) {

        try {

            Sanction updatedSanction = groupeService.payerSanction(id);
            return ResponseEntity.ok(updatedSanction);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }


}