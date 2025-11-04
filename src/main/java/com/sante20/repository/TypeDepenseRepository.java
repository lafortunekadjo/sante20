package com.sante20.repository;

import com.sante20.entity.TypeDepense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TypeDepenseRepository extends JpaRepository<TypeDepense, Long> {

}