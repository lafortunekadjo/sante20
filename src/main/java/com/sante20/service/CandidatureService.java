package com.sante20.service;

import com.sante20.dto.DemandeDTO;
import com.sante20.dto.QuestionCreationDTO;
import com.sante20.dto.ReponseDTO;
import com.sante20.entity.*;
import com.sante20.repository.*;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CandidatureService {

    @Autowired
    private DemandeIntegrationRepository demandeRepo;
    @Autowired private QuestionCandidatureRepository questionRepo;
    @Autowired private ReponseCandidatureRepository reponseRepo;
    @Autowired private UserRepository userService; // Assurez-vous d'avoir un UserService

    @Autowired private MembreRepository membreRepository;
    @Autowired private GroupeRepository groupeService; // Assurez-vous d'avoir un GroupeService
    
    // ----------------------------------------------------------------------------------
    // A. Logique d'Exploration (pour le Candidat)
    // ----------------------------------------------------------------------------------

    public List<QuestionCandidature> getFormulairePublic(Long groupeId) {
        Groupe groupe = groupeService.findById(groupeId).orElseThrow();
        // Ici, on pourrait ajouter une vérification si le formulaire est public
        return questionRepo.findByGroupeOrderByOrdreAffichageAsc(groupe);
    }
    
    // ----------------------------------------------------------------------------------
    // B. Logique de Soumission (pour le Candidat)
    // ----------------------------------------------------------------------------------

    // Note : On utilise un DTO (Data Transfer Object) pour recevoir les réponses
    public DemandeIntegration soumettreDemande(Long groupeId, User candidat, DemandeDTO demandeDTO) {
        
        // 1. Vérifier si l'utilisateur n'a pas déjà une demande en cours pour ce groupe
        // ... (Logique à implémenter)
        
        // 2. Créer l'entité DemandeIntegration
        Groupe groupeCible = groupeService.findById(groupeId).orElseThrow();
        DemandeIntegration demande = new DemandeIntegration();
        demande.setCandidat(candidat);
        demande.setGroupeCible(groupeCible);
        DemandeIntegration nouvelleDemande = demandeRepo.save(demande);

        // 3. Enregistrer les réponses
        for (ReponseDTO reponseDTO : demandeDTO.getReponses()) {
            QuestionCandidature question = questionRepo.findById(reponseDTO.getQuestionId())
                    .orElseThrow(() -> new EntityNotFoundException("Question non trouvée"));
            
            ReponseCandidature reponse = new ReponseCandidature();
            reponse.setDemande(nouvelleDemande);
            reponse.setQuestion(question);
            reponse.setValeurReponse(reponseDTO.getValeur());
            reponseRepo.save(reponse);
        }
        
        // Optionnel: Envoyer une notification à l'administrateur du Groupe
        
        return nouvelleDemande;
    }
    
    // ----------------------------------------------------------------------------------
    // C. Logique de Traitement (pour l'Administrateur du 2-0)
    // ----------------------------------------------------------------------------------

    public List<DemandeIntegration> getDemandesEnAttente(Long groupeId) {
        Groupe groupe = groupeService.findById(groupeId).orElseThrow();
        return demandeRepo.findByGroupeCibleAndStatut(groupe, StatutDemande.EN_ATTENTE);
    }

    public List<DemandeIntegration> getDemandesByUser(User user) {
        return demandeRepo.findByCandidat(user);
    }

    @Transactional
    public DemandeIntegration traiterDemande(Long demandeId, StatutDemande nouveauStatut) {
        DemandeIntegration demande = demandeRepo.findById(demandeId)
                .orElseThrow(() -> new EntityNotFoundException("Demande non trouvée"));

        // 1. Mettre à jour le statut de la demande
        demande.setStatut(nouveauStatut);
        DemandeIntegration demandeTraitee = demandeRepo.save(demande);

        // 2. SI ACCEPTEE : Mettre à jour le rôle et l'appartenance de l'utilisateur
        if (nouveauStatut == StatutDemande.ACCEPTEE) {
            User candidat = demande.getCandidat();
            Groupe groupe = demande.getGroupeCible();
            
            // a) Mettre à jour le rôle de l'utilisateur de CANDIDAT à MEMBRE
            candidat.getRoles().remove(Role.ERole.ROLE_CANDIDAT);
            candidat.getRoles().add(new Role(Role.ERole.ROLE_MEMBRE));

            userService.save(candidat);
            Membre membre = new Membre();
            membre.setGroupe(groupe);
            membre.setNom(candidat.getUsername());
            membre.setActive(false);
            membre.setEmail(candidat.getEmail());
            membreRepository.save(membre);


        }
        
        // Ajouter l'envoies de la notification
        
        return demandeTraitee;
    }

    public Boolean checkDemandesEnAttente(Long groupeId, Long userId) {

        Groupe groupe = groupeService.findById(groupeId).orElseThrow();
        User user = userService.findById(userId).orElseThrow();
        return demandeRepo.existsByCandidatAndGroupeCible(user, groupe);

    }

    public List<ReponseCandidature> getReponseByDemandeId(Long demandeId) {
        DemandeIntegration demandeIntegration = demandeRepo.findById(demandeId).orElseThrow();
        return reponseRepo.findByDemande(demandeIntegration);
    }

    public List<ReponseDTO> getReponseByDemandeIdDTO(Long demandeId) {
        DemandeIntegration demandeIntegration = demandeRepo.findById(demandeId).orElseThrow();
        List<ReponseCandidature> reponses = reponseRepo.findByDemande(demandeIntegration);

        return reponses.stream()
                .map(rep -> {
                    ReponseDTO dto = new ReponseDTO();
                    dto.setQuestionId(rep.getQuestion().getId());
                    dto.setValeur(rep.getValeurReponse());

                    // Ajouter les détails de la question
                    QuestionCreationDTO questionDTO = new QuestionCreationDTO();
                    questionDTO.setTexteQuestion(rep.getQuestion().getTexteQuestion());
                    questionDTO.setTypeChamp(rep.getQuestion().getTypeChamp());
                    dto.setQuestion(questionDTO);

                    return dto;
                })
                .collect(Collectors.toList());
    }
}