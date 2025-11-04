package com.sante20.controller;


import com.sante20.dto.MonthlyStatsDTO;
import com.sante20.service.StatsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/stats")
@CrossOrigin(origins = "*")
public class StatsController {

    @Autowired
    private StatsService statsService;

    /**
     * Récupérer les stats du membre avec filtre de dates
     */
//    @GetMapping("/member")
//    public ResponseEntity<MemberStatsDTO> getMemberStats(
//            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
//            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
//
//        MemberStatsDTO stats = statsService.getMemberStats(startDate, endDate);
//        return ResponseEntity.ok(stats);
//    }

    /**
     * Récupérer les stats mensuelles pour un mois donné
     */
    @GetMapping("/monthly/{month}")
    public ResponseEntity<MonthlyStatsDTO> getMonthlyStats(@PathVariable String month) {
        MonthlyStatsDTO stats = statsService.getMonthlyStats(month);
        return ResponseEntity.ok(stats);
    }

    /**
     * Récupérer la liste des mois disponibles
     */
    @GetMapping("/available-months")
    public ResponseEntity<List<Map<String, String>>> getAvailableMonths() {
        List<Map<String, String>> months = statsService.getAvailableMonths();
        return ResponseEntity.ok(months);
    }

    /**
     * Récupérer les stats du membre avec les stats mensuelles
     */
//    @GetMapping("/member/with-monthly")
//    public ResponseEntity<MemberStatsDTO> getMemberStatsWithMonthly(
//            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
//            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
//            @RequestParam(required = false) String month) {
//
//        MemberStatsDTO stats = statsService.getMemberStatsWithMonthly(startDate, endDate, month);
//        return ResponseEntity.ok(stats);
//    }
}