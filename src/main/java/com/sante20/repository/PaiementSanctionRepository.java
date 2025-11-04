package com.sante20.repository;

import com.sante20.entity.PaiementSanction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaiementSanctionRepository extends JpaRepository<PaiementSanction, Long> {
    List<PaiementSanction> findBySanctionId(Long sanctionId);
    List<PaiementSanction> findBySanctionMembreId(Long membreId);
    List<PaiementSanction> findBySanctionMembreGroupeId(Long groupeId);
}