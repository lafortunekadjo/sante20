package com.sante20.controller;


import com.sante20.entity.Contribution;
import com.sante20.entity.ContributionIndividuelle;
import com.sante20.service.ContributionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/contributions")
@CrossOrigin("*")
public class ContributionController {

    @Autowired
    private ContributionService contributionService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Contribution> createContribution(@RequestBody Map<String, Object> request) {
        System.out.println("Requête POST /api/contributions : " + request);
        Contribution contribution = contributionService.createContribution1(request);
        return ResponseEntity.status(201).body(contribution);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Contribution> updateContribution(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        System.out.println("Requête PUT /api/contributions/" + id + " : " + request);
        Contribution contribution = contributionService.updateContribution(id, request);
        return ResponseEntity.ok(contribution);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<Contribution> getContributionById(@PathVariable Long id) {
        System.out.println("Requête GET /api/contributions/" + id);
        Contribution contribution = contributionService.getContributionById(id);
        return ResponseEntity.ok(contribution);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<List<Contribution>> getAllContributions() {
        System.out.println("Requête GET /api/contributions");
        List<Contribution> contributions = contributionService.getAllContributions();
        return ResponseEntity.ok(contributions);
    }

    @GetMapping("/individuelles")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<List<ContributionIndividuelle>> getAllContributionsIndividuelles() {
        System.out.println("Requête GET /api/contributionsIndi");
        List<ContributionIndividuelle> contributions = contributionService.getAllContributionsIndividuelles();
        return ResponseEntity.ok(contributions);
    }

    @PutMapping("/individuelles/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<ContributionIndividuelle> updateContributionsIndividuelles(@PathVariable Long id, @RequestBody Map<String, Object> request ) {
        System.out.println("Requête GET /api/contributionsIndi");
        ContributionIndividuelle contributions = contributionService.updateContributionIndividuelle(id, request);
        return ResponseEntity.ok(contributions);
    }

    @GetMapping("/individuelles/contribution/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<List<ContributionIndividuelle>> getContributionsIndividuellesByContribution(@PathVariable Long id) {
        System.out.println("Requête GET /api/contributionsIndiBycontrib");
        List<ContributionIndividuelle> contributions = contributionService.getContributionsIndividuellesByContribution(id);
        return ResponseEntity.ok(contributions);
    }

    @GetMapping("/membre/{membreId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<List<Contribution>> getContributionsByMembreId(@PathVariable Long membreId) {
        System.out.println("Requête GET /api/contributions/membre/" + membreId);
        List<Contribution> contributions = contributionService.getContributionsByMembreId(membreId);
        return ResponseEntity.ok(contributions);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteContribution(@PathVariable Long id) {
        System.out.println("Requête DELETE /api/contributions/" + id);
        contributionService.deleteContribution(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/creer-campagne")
    @ResponseStatus(HttpStatus.CREATED)
    public Contribution createCampaign(@RequestBody Map<String, Object> contributionData) {
        return contributionService.createContribution(contributionData);
    }

    @PostMapping("/contribuer")
    @ResponseStatus(HttpStatus.CREATED)
    public ContributionIndividuelle contribute(@RequestBody Map<String, Object> contributionData) {
        return contributionService.contribute(contributionData);
    }

}