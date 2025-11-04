package com.sante20.repository;

import com.sante20.entity.Objectif;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ObjectifRepository extends JpaRepository<Objectif, Long> {
    List<Objectif> findByMembreId(Long membreId);
    Optional<Objectif> findByIdAndMembreId(Long id, Long membreId);
}