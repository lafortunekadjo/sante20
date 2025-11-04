package com.sante20.repository;

import com.sante20.entity.ConversationDefi;
import com.sante20.entity.DefiMatchAmical;
import com.sante20.entity.Groupe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationDefiRepository extends JpaRepository<ConversationDefi, Long> {
    // Trouver la conversation à partir du Défi
    Optional<ConversationDefi> findByDefi(DefiMatchAmical defi);
    
    // Trouver toutes les conversations auxquelles les groupes de l'utilisateur participent
    // (Implique de joindre DefiMatchAmical pour vérifier GroupeDemandeur OU GroupeCible)
    @Query("SELECT c FROM ConversationDefi c WHERE c.defi.groupeDemandeur = :groupe OR c.defi.groupeCible = :groupe ORDER BY c.dateDernierMessage DESC")
    List<ConversationDefi> findConversationsForGroupe(@Param("groupe") Groupe groupe);
}