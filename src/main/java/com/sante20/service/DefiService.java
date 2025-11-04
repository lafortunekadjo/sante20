package com.sante20.service;

import com.sante20.entity.DefiCreationDTO;
import com.sante20.entity.DefiMatchAmical;
import com.sante20.entity.Groupe;
import com.sante20.entity.StatutDefi;
import com.sante20.repository.DefiMatchAmicalRepository;
import com.sante20.repository.GroupeRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DefiService {

    @Autowired
    private DefiMatchAmicalRepository defiRepo;
    @Autowired private GroupeRepository groupeService;
    // @Autowired private NotificationService notificationService; // Prévu pour les notifications

    // ----------------------------------------------------------------------------------
    // A. Lancement du Défi (par le Groupe Demandeur)
    // ----------------------------------------------------------------------------------
    
    // Le groupeDemandeur est vérifié par Spring Security dans le contrôleur
    @Transactional
    public DefiMatchAmical lancerDefi(Long groupeDemandeurId, DefiCreationDTO defiDTO) {
        
        Groupe demandeur = groupeService.findById(groupeDemandeurId).orElseThrow();
        Groupe cible = groupeService.findById(defiDTO.getGroupeCibleId()).orElseThrow();

        if (demandeur.equals(cible)) {
            throw new IllegalArgumentException("Un groupe ne peut pas se défier lui-même.");
        }

        DefiMatchAmical defi = new DefiMatchAmical();
        defi.setGroupeDemandeur(demandeur);
        defi.setGroupeCible(cible);
        defi.setDateProposee(defiDTO.getDateProposee());
        defi.setLieuPropose(defiDTO.getLieuPropose());
        defi.setDescriptionMessage(defiDTO.getDescriptionMessage());
        defi.setStatut(StatutDefi.EN_ATTENTE);
        
        DefiMatchAmical nouveauDefi = defiRepo.save(defi);
        
        // Optionnel: Envoyer une notification PUSH/email à l'admin du groupeCible
        // notificationService.sendDefiNotification(cible, nouveauDefi);
        
        return nouveauDefi;
    }

    // ----------------------------------------------------------------------------------
    // B. Traitement du Défi (par l'Admin du Groupe Cible)
    // ----------------------------------------------------------------------------------

    public List<DefiMatchAmical> getDefisRecusEnAttente(Long groupeCibleId) {
        Groupe groupeCible = groupeService.findById(groupeCibleId).orElseThrow();
        return defiRepo.findByGroupeCibleAndStatut(groupeCible, StatutDefi.EN_ATTENTE);
    }

    public List<DefiMatchAmical> getDefisRecu(Long groupeCibleId) {
        Groupe groupeCible = groupeService.findById(groupeCibleId).orElseThrow();
        return defiRepo.findByGroupeCible(groupeCible);
    }

    public List<DefiMatchAmical> getDefisEnvoye(Long groupeDemandeurId) {
        Groupe groupeDemandeur = groupeService.findById(groupeDemandeurId).orElseThrow();
        return defiRepo.findByGroupeDemandeur(groupeDemandeur);
    }

    @Transactional
    public DefiMatchAmical repondreDefi(Long defiId, StatutDefi reponseStatut) {
        DefiMatchAmical defi = defiRepo.findById(defiId)
                .orElseThrow(() -> new EntityNotFoundException("Défi non trouvé"));

        if (defi.getStatut() != StatutDefi.EN_ATTENTE) {
            throw new IllegalStateException("Ce défi a déjà été traité.");
        }
        
        // Mettre à jour le statut
        defi.setStatut(reponseStatut);
        DefiMatchAmical defiTraite = defiRepo.save(defi);

        // Si ACCEPTÉ, une entrée de match dans votre module 'Match' existant doit être créée
        if (reponseStatut == StatutDefi.ACCEPTE) {
            // Logique de création de l'entité 'Match' dans votre module existant
            // matchService.creerMatchAmical(defiTraite);
        }
        
        // Optionnel: Notifier le groupe demandeur de la réponse
        // notificationService.sendReponseDefi(defiTraite);
        
        return defiTraite;
    }
}