package com.sante20.repository;

import com.sante20.entity.Evenement;
import com.sante20.entity.Groupe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EvenementRepository extends JpaRepository<Evenement, Long> {

    List<Evenement> findByGroupe(Groupe groupe);

}