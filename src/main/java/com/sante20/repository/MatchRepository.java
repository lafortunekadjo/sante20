package com.sante20.repository;

import com.sante20.entity.Match;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface MatchRepository extends JpaRepository<Match, Long> {
    List<Match> findByGroupeId(Long groupeId);

    List<Match> findByGroupeIdAndDateMatchBetween(Long groupeId, LocalDate startDate, LocalDate endDate);
    List<Match> findByGroupeIdAndDateMatchAfter(Long groupeId, LocalDate date);
    List<Match> findByDateMatchBetween(LocalDate startDate, LocalDate endDate);


    Optional<Match> findByGroupeIdAndDateMatch(Long groupeId, LocalDate dateMatch);
}