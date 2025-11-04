package com.sante20.controller;

import com.sante20.entity.Match;
import com.sante20.service.MatchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin("*")
@RequestMapping("/api/matchs")
public class MatchController {
    @Autowired
    private MatchService matchService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Match> createMatch(@RequestBody Map<String, Object> request) {
        System.out.println("Requête POST /api/matches : " + request);
        Match match = matchService.createMatch(request);
        return ResponseEntity.status(201).body(match);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Match> updateMatch(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        System.out.println("Requête PUT /api/matches/" + id + " : " + request);
        Match match = matchService.updateMatch(id, request);
        return ResponseEntity.ok(match);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<Match> getMatchById(@PathVariable Long id) {
        System.out.println("Requête GET /api/matches/" + id);
        Match match = matchService.getMatchById(id);
        return ResponseEntity.ok(match);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<List<Match>> getAllMatches() {
        System.out.println("Requête GET /api/matches");
        List<Match> matches = matchService.getAllMatches();
        return ResponseEntity.ok(matches);
    }

    @GetMapping("/groupe/{groupeId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<List<Match>> getMatchesByGroupeId(@PathVariable Long groupeId) {
        System.out.println("Requête GET /api/matches/groupe/" + groupeId);
        List<Match> matches = matchService.getMatchesByGroupeId(groupeId);
        return ResponseEntity.ok(matches);
    }

    @GetMapping("/groupe")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<List<Match>> getMatchesByGroupe() {
        List<Match> matches = matchService.getMatchesByGroupe();
        return ResponseEntity.ok(matches);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteMatch(@PathVariable Long id) {
        System.out.println("Requête DELETE /api/matches/" + id);
        matchService.deleteMatch(id);
        return ResponseEntity.noContent().build();
    }
}