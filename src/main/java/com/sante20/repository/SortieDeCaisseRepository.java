package com.sante20.repository;

import com.sante20.entity.SortieDeCaisse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SortieDeCaisseRepository extends JpaRepository<SortieDeCaisse, Long> {

}