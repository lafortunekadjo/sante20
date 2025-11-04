package com.sante20.controller;


import com.sante20.dto.ApiResponse;
import com.sante20.dto.CheckInRequest;
import com.sante20.entity.Membre;
import com.sante20.entity.Presence;
import com.sante20.entity.Sanction;
import com.sante20.service.PresenceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/presences")
@CrossOrigin("*")
public class PresenceController {

    @Autowired
    private PresenceService presenceService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Presence> createPresence(@RequestBody Map<String, Object> request) {
        System.out.println("Requête POST /api/presences : " + request);
        Presence presence = presenceService.createPresence(request);
        return ResponseEntity.status(201).body(presence);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Presence> updatePresence(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        System.out.println("Requête PUT /api/presences/" + id + " : " + request);
        Presence presence = presenceService.updatePresence(id, request);
        return ResponseEntity.ok(presence);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<Presence> getPresenceById(@PathVariable Long id) {
        System.out.println("Requête GET /api/presences/" + id);
        Presence presence = presenceService.getPresenceById(id);
        return ResponseEntity.ok(presence);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<List<Presence>> getAllPresences() {
        System.out.println("Requête GET /api/presences");
        List<Presence> presences = presenceService.getAllPresences();
        return ResponseEntity.ok(presences);
    }

    @GetMapping("/match/{matchId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<List<Presence>> getPresencesByMatchId(@PathVariable Long matchId) {
        System.out.println("Requête GET /api/presences/match/" + matchId);
        List<Presence> presences = presenceService.getPresencesByMatchId(matchId);
        return ResponseEntity.ok(presences);
    }

    @GetMapping("/groupe")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<List<Presence>> getAllPresencesGroupe() {
        List<Presence> presences = presenceService.getAllPresencesByGroupe();
        return ResponseEntity.ok(presences);
    }

    @GetMapping("/sanctions")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<List<Sanction>> getSanctionsByGroupe() {
        System.out.println("Requête GET /api/sanction/groupe/" );
        List<Sanction> sanctions = presenceService.getSanctionsByGroupe();
        return ResponseEntity.ok(sanctions);
    }

    @GetMapping("/membre/{membreId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<List<Presence>> getPresencesByMembreId(@PathVariable Long membreId) {
        System.out.println("Requête GET /api/presences/membre/" + membreId);
        List<Presence> presences = presenceService.getPresencesByMembreId(membreId);
        return ResponseEntity.ok(presences);
    }

    @PostMapping("/match/{matchId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> savePresences(@PathVariable Long matchId, @RequestBody List<Map<String, Object>> presences) {
        System.out.println("Requête POST /api/presences/match/" + matchId + " : " + presences);
        presenceService.savePresences(matchId, presences);
        return ResponseEntity.status(201).build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deletePresence(@PathVariable Long id) {
        System.out.println("Requête DELETE /api/presences/" + id);
        presenceService.deletePresence(id);
        return ResponseEntity.noContent().build();
    }


    @PostMapping("/check-in")
    public ResponseEntity<ApiResponse> checkIn(@RequestBody CheckInRequest request) {

            return presenceService.checkIn(request);
    }

    @GetMapping("/matchAll/{id}")
    public ResponseEntity<List<Membre>> getMembreByMatch(@PathVariable Long id) {
        System.out.println("Requête GET /api/membres/" + id);
        List<Membre> membre = presenceService.getMembersByMatchId(id);
        return ResponseEntity.ok(membre);
    }
}