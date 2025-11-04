// src/main/java/com/sante20/mapper/DiscussionMatchMapper.java

package com.sante20.mapper;


import com.sante20.dto.DiscussionMatchDTO;
import com.sante20.dto.MessageDiscussionMatchDTO;
import com.sante20.entity.DiscussionMatch;
import com.sante20.entity.Groupe;
import com.sante20.entity.MessageDiscussionMatch;
import com.sante20.repository.MessageDiscussionMatchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class DiscussionMatchMapper {

    private final MessageDiscussionMatchRepository messageRepository;

    public DiscussionMatchDTO toDTO(DiscussionMatch entity, Long currentGroupeId) {
        if (entity == null) {
            return null;
        }

        DiscussionMatchDTO dto = new DiscussionMatchDTO();
        dto.setId(entity.getId());
        dto.setDefiMatchId(entity.getDefiMatch().getId());
        dto.setDateCreation(entity.getDateCreation());
        dto.setActive(entity.getActive());

        // Mapper les groupes
        if (entity.getDefiMatch().getGroupeDemandeur() != null) {
            dto.setGroupeEmetteur(toGroupeSimpleDTO(entity.getDefiMatch().getGroupeDemandeur()));
        }

        if (entity.getDefiMatch().getGroupeCible() != null) {
            dto.setGroupeCible(toGroupeSimpleDTO(entity.getDefiMatch().getGroupeCible()));
        }

        // Compter les messages non lus
        Integer messagesNonLus = messageRepository.countMessagesNonLus(entity.getId(), currentGroupeId);
        dto.setMessagesNonLus(messagesNonLus);

        // Récupérer le dernier message
        List<MessageDiscussionMatch> derniers = messageRepository.findDernierMessage(entity.getId());
        if (!derniers.isEmpty()) {
            dto.setDernierMessage(toMessageDTO(derniers.get(0)));
        }

        return dto;
    }

    public DiscussionMatchDTO toDTOWithMessages(DiscussionMatch entity, Long currentGroupeId) {
        DiscussionMatchDTO dto = toDTO(entity, currentGroupeId);
        
        if (entity.getMessages() != null) {
            dto.setMessages(
                entity.getMessages().stream()
                    .map(this::toMessageDTO)
                    .collect(Collectors.toList())
            );
        }

        return dto;
    }

    public MessageDiscussionMatchDTO toMessageDTO(MessageDiscussionMatch entity) {
        if (entity == null) {
            return null;
        }

        MessageDiscussionMatchDTO dto = new MessageDiscussionMatchDTO();
        dto.setId(entity.getId());
        dto.setDiscussionId(entity.getDiscussion().getId());
        dto.setContenu(entity.getContenu());
        dto.setDateEnvoi(entity.getDateEnvoi());
        dto.setLu(entity.getLu());

        if (entity.getAuteur() != null) {
            dto.setAuteurId(entity.getAuteur().getId());
            dto.setAuteurNom(entity.getAuteur().getMembre().getNom());
            dto.setAuteurPrenom(entity.getAuteur().getMembre().getPrenom());
            dto.setAuteurPhotoUrl(entity.getAuteur().getProfilePhotoUrl());
        }

        if (entity.getGroupeAuteur() != null) {
            dto.setGroupeAuteurId(entity.getGroupeAuteur().getId());
            dto.setGroupeAuteurNom(entity.getGroupeAuteur().getNom());
        }

        return dto;
    }

    private Groupe toGroupeSimpleDTO(com.sante20.entity.Groupe groupe) {
        if (groupe == null) {
            return null;
        }
        return new Groupe (
            groupe.getId(),
            groupe.getNom(),
            groupe.getProfilePhotoUrl(),
            groupe.getDiscipline(),
            groupe.getVille()
        );
    }
}