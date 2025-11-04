//package com.sante20.service;
//
//import com.sante20.entity.*;
//import com.sante20.repository.ConversationDefiRepository;
//import com.sante20.repository.MessageRepository;
//import jakarta.persistence.EntityNotFoundException;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.security.access.AccessDeniedException;
//import org.springframework.stereotype.Service;
//
//import java.time.LocalDateTime;
//import java.util.List;
//
//@Service
//public class MessagerieService {
//
//    @Autowired
//    private ConversationDefiRepository conversationRepo;
//    @Autowired private MessageRepository messageRepo;
//    @Autowired private DefiService defiService; // Pour l'accès aux Défis et aux Groupes
//    @Autowired private GroupeService groupeService;
//
//    // ----------------------------------------------------------------------------------
//    // A. Création de la Conversation
//    // ----------------------------------------------------------------------------------
//
//    public ConversationDefi creerConversationPourDefi(DefiMatchAmical defi) {
//        ConversationDefi conversation = new ConversationDefi();
//        conversation.setDefi(defi);
//        conversation.setDateDernierMessage(LocalDateTime.now());
//        return conversationRepo.save(conversation);
//    }
//
//    // *À noter : Vous devriez appeler cette méthode dans le DefiService, juste après avoir
//    // sauvegardé un nouveau DefiMatchAmical.*
//
//    // ----------------------------------------------------------------------------------
//    // B. Envoi et Réception des Messages
//    // ----------------------------------------------------------------------------------
//
//    public Message envoyerMessage(Long conversationId, User expediteur, MessageEnvoiDTO messageDTO) {
//        ConversationDefi conversation = conversationRepo.findById(conversationId)
//                .orElseThrow(() -> new EntityNotFoundException("Conversation non trouvée"));
//
//        // 1. Logique de Sécurité: Vérifier que l'expéditeur est bien un admin du groupe concerné
//        // Un admin de GroupeDemandeur OU de GroupeCible doit être l'expéditeur.
//        Groupe groupeDemandeur = conversation.getDefi().getGroupeDemandeur();
//        Groupe groupeCible = conversation.getDefi().getGroupeCible();
//        Long expediteurGroupeId = expediteur.getGroupe().getId();
//
//        if (expediteurGroupeId == null ||
//            (!expediteurGroupeId.equals(groupeDemandeur.getId()) && !expediteurGroupeId.equals(groupeCible.getId()))) {
//            throw new AccessDeniedException("L'utilisateur n'est pas administrateur d'un des groupes de cette conversation.");
//        }
//
//        // 2. Créer et sauvegarder le message
//        Message message = new Message();
//        message.setConversation(conversation);
//        message.setExpediteur(expediteur);
//        message.setContenu(messageDTO.getContenu());
//        Message nouveauMessage = messageRepo.save(message);
//
//        // 3. Mettre à jour la conversation (pour l'ordre)
//        conversation.setDateDernierMessage(nouveauMessage.getDateEnvoi());
//        conversationRepo.save(conversation);
//
//        // Optionnel: Notifier l'administrateur du groupe adverse
//
//        return nouveauMessage;
//    }
//
//    public List<Message> getHistorique(Long conversationId) {
//        ConversationDefi conversation = conversationRepo.findById(conversationId)
//                .orElseThrow(() -> new EntityNotFoundException("Conversation non trouvée"));
//
//        // Ici, ajouter une vérification de sécurité similaire à l'envoi
//
//        return messageRepo.findByConversationOrderByDateEnvoiAsc(conversation);
//    }
//}