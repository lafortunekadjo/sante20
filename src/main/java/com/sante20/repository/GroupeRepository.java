package com.sante20.repository;

import com.sante20.entity.Groupe;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GroupeRepository extends JpaRepository<Groupe, Long> {

    List<Groupe> findByIsActiveTrue();

    List<Groupe> findByIsPublicTrue();
    long countByIsActive(boolean active); // Compte les groupes actifs

    List<Groupe> findByIsDeleteFalse();
    long countByIsDeleteFalse();





}