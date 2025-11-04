package com.sante20.repository;


import com.sante20.entity.Equipe;
import com.sante20.entity.Groupe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EquipeRepository extends JpaRepository<Equipe, Long> {

    List<Equipe> findByGroupe(Groupe groupe);
}