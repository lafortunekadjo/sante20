package com.sante20.repository;


import com.sante20.entity.Groupe;
import com.sante20.entity.TypeSanction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TypeSanctionRepository extends JpaRepository<TypeSanction, Long> {
    Optional<TypeSanction> findByNom(String typeSanctionNom);

    List<TypeSanction> findByGroupe(Groupe groupe);
}