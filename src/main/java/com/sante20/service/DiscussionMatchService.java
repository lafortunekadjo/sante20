// src/main/java/com/sante20/service/DiscussionMatchService.java

package com.sante20.service;


import com.sante20.dto.CreateMessageDTO;
import com.sante20.dto.DiscussionMatchDTO;
import com.sante20.dto.MessageDiscussionMatchDTO;
import com.sante20.entity.*;
import com.sante20.mapper.DiscussionMatchMapper;
import com.sante20.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class DiscussionMatchService {

    private final DiscussionMatchRepository discussionRepository;
    private final MessageDiscussionMatchRepository messageRepository;
    private final DefiMatchAmicalRepository defiMatchRepository;
    private final UserRepository userRepository;
    private final GroupeRepository groupeRepository;
    private final DiscussionMatchMapper mapper;

    /**
     * Créer ou récupérer une discussion pour un défi match
     */
    public DiscussionMatchDTO creerOuRecupererDiscussion(Long defiMatchId, Long currentUserId) {
        DefiMatchAmical defiMatch = defiMatchRepository.findById(defiMatchId)
            .orElseThrow(() -> new RuntimeException("Défi match non trouvé"));

        // Vérifier que l'utilisateur est responsable d'un des deux groupes
        User currentUser = userRepository.findById(currentUserId)
            .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        Long currentGroupeId = determinerGroupeUtilisateur(currentUser, defiMatch);

        // Chercher si une discussion existe déjà
        DiscussionMatch discussion = discussionRepository.findByDefiMatch(defiMatch)
            .orElseGet(() -> {
                // Créer une nouvelle discussion
                DiscussionMatch nouvelleDiscussion = new DiscussionMatch();
                nouvelleDiscussion.setDefiMatch(defiMatch);
                nouvelleDiscussion.setActive(true);
                return discussionRepository.save(nouvelleDiscussion);
            });

        return mapper.toDTOWithMessages(discussion, currentGroupeId);
    }

    /**
     * Récupérer une discussion par son ID
     */
    @Transactional(readOnly = true)
    public DiscussionMatchDTO getDiscussion(Long discussionId, Long currentUserId) {
        DiscussionMatch discussion = discussionRepository.findById(discussionId)
            .orElseThrow(() -> new RuntimeException("Discussion non trouvée"));

        User currentUser = userRepository.findById(currentUserId)
            .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        Long currentGroupeId = determinerGroupeUtilisateur(currentUser, discussion.getDefiMatch());

        // Marquer les messages de l'autre groupe comme lus
        marquerMessagesCommeLus(discussion, currentGroupeId);

        return mapper.toDTOWithMessages(discussion, currentGroupeId);
    }

    /**
     * Récupérer toutes les discussions d'un groupe
     */
    @Transactional(readOnly = true)
    public List<DiscussionMatchDTO> getDiscussionsParGroupe(Long groupeId) {
        List<DiscussionMatch> discussions = discussionRepository.findByGroupeId(groupeId);

        return discussions.stream()
            .map(d -> mapper.toDTO(d, groupeId))
            .collect(Collectors.toList());
    }

    /**
     * Envoyer un message dans une discussion
     */
    public MessageDiscussionMatchDTO envoyerMessage(CreateMessageDTO dto, Long currentUserId) {
        DiscussionMatch discussion = discussionRepository.findById(dto.getDiscussionId())
            .orElseThrow(() -> new RuntimeException("Discussion non trouvée"));

        User auteur = userRepository.findById(currentUserId)
            .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        Long groupeAuteurId = determinerGroupeUtilisateur(auteur, discussion.getDefiMatch());
        Groupe groupeAuteur = groupeRepository.findById(groupeAuteurId)
            .orElseThrow(() -> new RuntimeException("Groupe non trouvé"));

        // Créer le message
        MessageDiscussionMatch message = new MessageDiscussionMatch();
        message.setDiscussion(discussion);
        message.setAuteur(auteur);
        message.setGroupeAuteur(groupeAuteur);
        message.setContenu(dto.getContenu());
        message.setLu(false);

        MessageDiscussionMatch savedMessage = messageRepository.save(message);

        return mapper.toMessageDTO(savedMessage);
    }

    /**
     * Marquer les messages comme lus
     */
    private void marquerMessagesCommeLus(DiscussionMatch discussion, Long currentGroupeId) {
        List<MessageDiscussionMatch> messagesNonLus = discussion.getMessages().stream()
            .filter(m -> !m.getGroupeAuteur().getId().equals(currentGroupeId) && !m.getLu())
            .collect(Collectors.toList());

        messagesNonLus.forEach(m -> m.setLu(true));
        
        if (!messagesNonLus.isEmpty()) {
            messageRepository.saveAll(messagesNonLus);
        }
    }

    /**
     * Déterminer le groupe de l'utilisateur pour ce défi match
     */
    // src/main/java/com/sante20/service/DiscussionMatchService.java

    /**
     * Déterminer le groupe de l'utilisateur pour ce défi match
     * Vérifie si l'utilisateur a le rôle RESPONSABLE et appartient à l'un des groupes
     */
    private Long determinerGroupeUtilisateur(User user, DefiMatchAmical defiMatch) {


        // Vérifier si l'utilisateur a le rôle RESPONSABLE
        boolean estResponsable = user.getRoles().stream()
                .anyMatch(role -> role.getName() == Role.ERole.ROLE_RESPONSABLE);

        if (!estResponsable) {
            System.out.print(user.getRoles());
            throw new RuntimeException("Vous devez être responsable pour accéder à cette discussion");
        }



        // Vérifier si l'utilisateur est membre du groupe demandeur
        boolean estMembreGroupeDemandeur = defiMatch.getGroupeDemandeur().getMembres().stream()
                .anyMatch(membre -> membre.getUser().getId().equals(user.getId()));

        if (estMembreGroupeDemandeur) {
            return defiMatch.getGroupeDemandeur().getId();
        }

        // Vérifier si l'utilisateur est membre du groupe cible
        boolean estMembreGroupeCible = defiMatch.getGroupeCible().getMembres().stream()
                .anyMatch(membre -> membre.getUser().getId().equals(user.getId()));

        if (estMembreGroupeCible) {
            return defiMatch.getGroupeCible().getId();
        }

        throw new RuntimeException("Vous n'êtes pas membre d'un des groupes concernés par cette discussion");
    }
}