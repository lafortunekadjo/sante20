package com.sante20.controller;

import com.sante20.entity.User;
import com.sante20.repository.UserRepository;
import com.sante20.service.StatisticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;

@RestController
@CrossOrigin("*")
@RequestMapping("/api")
public class StatController {

    @Autowired
    private StatisticsService dashboardService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/admin/stats")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Map<String, Object>> getAdminStats(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        if (startDate != null && endDate != null && startDate.isAfter(endDate)) {
            return ResponseEntity.badRequest().body(Map.of("error", "startDate must be before endDate"));
        }
        return ResponseEntity.ok(dashboardService.getAdminStats(startDate, endDate));
    }

    @GetMapping("/responsable/stats")
    @PreAuthorize("hasAnyAuthority('RESPONSABLE', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getResponsableStats(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        if (startDate != null && endDate != null && startDate.isAfter(endDate)) {
            return ResponseEntity.badRequest().body(Map.of("error", "startDate must be before endDate"));
        }
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        System.out.println(authentication);
        String username = authentication.getName();
        Optional<User> user = userRepository.findByUsername(username);
        Long groupeId = user.get().getMembre().getGroupe().getId();
        return ResponseEntity.ok(dashboardService.getResponsableStats(groupeId, startDate, endDate));
    }

    @GetMapping("/membre/stats")
    @PreAuthorize("hasAnyAuthority('MEMBRE', 'RESPONSABLE', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getMembreStats(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        if (startDate != null && endDate != null && startDate.isAfter(endDate)) {
            return ResponseEntity.badRequest().body(Map.of("error", "startDate must be before endDate"));
        }
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        System.out.println(authentication);
        String username = authentication.getName();
        Optional<User> user = userRepository.findByUsername(username);
        Long membreId = user.get().getMembre().getId();
        return ResponseEntity.ok(dashboardService.getMembreStats(membreId, startDate, endDate));
    }


}
