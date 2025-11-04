package com.sante20.repository;

import com.sante20.entity.Groupe;
import com.sante20.entity.RoleCustom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoleCustomRepository extends JpaRepository<RoleCustom, Long> {
    
    List<RoleCustom> findByGroupeAndActifTrueOrderByNiveauAsc(Groupe groupe);
    
    List<RoleCustom> findByGroupeOrderByNiveauAsc(Groupe groupe);
    
    Optional<RoleCustom> findByGroupeAndNom(Groupe groupe, String nom);
    
    @Query("SELECT COUNT(m) FROM Membre m WHERE m.roleCustom.id = :roleId")
    Integer countMembresByRoleId(@Param("roleId") Long roleId);
}