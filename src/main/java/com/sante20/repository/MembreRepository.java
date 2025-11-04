package com.sante20.repository;

import com.sante20.entity.Groupe;
import com.sante20.entity.Membre;
import com.sante20.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MembreRepository extends JpaRepository<Membre, Long> {
    List<Membre> findByGroupeId(Long groupeId);
    List<Membre> findByGroupeIdOrderByNomAsc(Long groupeId);
    List<Membre> findByEquipeId(Long equipeId);
    List<Membre> findByGroupeIdOrderByNomDesc(Long groupeId);
    List<Membre> findByEquipeIdOrderByNomDesc(Long groupeId);
    Membre findByUserId(Long userId);

    long countByIsDeleteFalse();
    long countByRoleCOAndIsDeleteFalse(String roleCO);
    List<Membre> findByGroupeIdAndIsDeleteFalse(Long groupeId);
    List<Membre> findByGroupeIdAndIsDeleteFalseOrderByNomDesc(Long groupeId);

    Optional<Membre> findByUserAndGroupe(User user, Groupe groupe);
}