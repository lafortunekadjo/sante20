package com.sante20.repository;

import com.sante20.entity.Groupe;
import com.sante20.entity.QuestionCandidature;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionCandidatureRepository extends JpaRepository<QuestionCandidature, Long> {
    List<QuestionCandidature> findByGroupeOrderByOrdreAffichageAsc(Groupe groupe);
}