package com.sante20.service;

import com.sante20.entity.Match;
import com.sante20.entity.Membre;
import com.sante20.entity.User;
import com.sante20.repository.GroupeRepository;
import com.sante20.repository.MatchRepository;
import com.sante20.repository.MembreRepository;
import com.sante20.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Consumer;

@Service
public class MatchService {
    @Autowired
    private MatchRepository matchRepository;

    @Autowired
    private GroupeRepository groupeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MembreRepository membreRepository;

    public Match createMatch(Map<String, Object> request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        Match match = new Match();

        // Adversaire
        match.setAdversaire((String) request.get("adversaire"));

        // Membre anniversaire
        Optional.ofNullable(request.get("membreAnniversaire"))
                .filter(val -> !val.toString().isBlank())
                .ifPresent(val -> {
                    Long membreId = Long.parseLong(val.toString());
                    Membre membre = membreRepository.findById(membreId)
                            .orElseThrow(() -> new RuntimeException("Membre non trouvé avec l'ID: " + membreId));
                    match.setMembre(membre.getNom() + " " + membre.getPrenom());
                    match.setMembre1(membre);
                });

        // Date match
        match.setDateMatch(LocalDate.parse(request.get("dateMatch").toString()));

        // Lieu et groupe
        match.setGroupe(user.getMembre().getGroupe());
        match.setLieu(user.getMembre().getGroupe().getStade().getNom());

        // Type match
        match.setTypeMatch(Match.TypeMatch.valueOf((String) request.get("typeMatch")));

        // forfait
        if (request.containsKey("forfait")) {
            match.setForfait(Boolean.parseBoolean(request.get("forfait").toString()));
        }

        if (request.containsKey("equipeForfait") && request.get("equipeForfait")!=null && request.get("equipeForfait").toString().isEmpty()) {
            match.setEquipeForfait((String) request.get("equipeForfait"));
        }

        // Commentaire
        match.setCommentaire((String) request.get("commentaire"));

        // Arbitre principal
        setMembreOrOccasionnel(
                match::setArbitrePrincipal,
                match::setArbitrePrincipalNomOccasionnel,
                request.get("arbitrePrincipalId"),
                request.get("arbitrePrincipalNom")
        );

        // Arbitre assistant
        setMembreOrOccasionnel(
                match::setArbitreAssistant,
                match::setArbitreAssistantNomOccasionnel,
                request.get("arbitreAssistantId"),
                request.get("arbitreAssistantNom")
        );

        // Rapporteur
        setMembreOrOccasionnel(
                match::setRapporteur,
                match::setRapporteurNomOccasionnel,
                request.get("rapporteurId"),
                request.get("rapporteurNom")
        );

        return matchRepository.save(match);
    }


    public Match updateMatch(Long id, Map<String, Object> request) {
        Match match = matchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Match non trouvé"));

        // Membre anniversaire
        Optional.ofNullable(request.get("membreAnniversaire"))
                .filter(val -> !val.toString().isBlank())
                .ifPresent(val -> {
                    Long membreId = Long.parseLong(val.toString());
                    Membre membre = membreRepository.findById(membreId)
                            .orElseThrow(() -> new RuntimeException("Membre non trouvé avec l'ID: " + membreId));
                    match.setMembre(membre.getNom() + " " + membre.getPrenom());
                    match.setMembre1(membre);
                });

        match.setDateMatch(LocalDate.parse(request.get("dateMatch").toString()));
        match.setAdversaire((String) request.get("adversaire"));
        match.setTypeMatch(Match.TypeMatch.valueOf((String) request.get("typeMatch")));
        match.setCommentaire((String) request.get("commentaire"));
        // forfait
        if (request.containsKey("forfait") && request.get("forfait")!=null && !request.get("forfait").toString().isEmpty()) {
            match.setForfait(Boolean.parseBoolean(request.get("forfait").toString()));
        }

        if (request.containsKey("equipeForfait") && request.get("equipeForfait")!=null && !request.get("equipeForfait").toString().isEmpty()) {
            match.setEquipeForfait((String) request.get("equipeForfait"));
        }
        if (request.containsKey("scoreAdversaire") && request.get("scoreAdversaire")!=null && !request.get("scoreAdversaire").toString().isEmpty()) {
            match.setScoreAdversaire(Integer.parseInt(request.get("scoreAdversaire").toString()));
        }

        // Arbitre principal
        setMembreOrOccasionnel(
                match::setArbitrePrincipal,
                match::setArbitrePrincipalNomOccasionnel,
                request.get("arbitrePrincipalId"),
                request.get("arbitrePrincipalNom")
        );

        // Arbitre assistant
        setMembreOrOccasionnel(
                match::setArbitreAssistant,
                match::setArbitreAssistantNomOccasionnel,
                request.get("arbitreAssistantId"),
                request.get("arbitreAssistantNom")
        );

        // Rapporteur
        setMembreOrOccasionnel(
                match::setRapporteur,
                match::setRapporteurNomOccasionnel,
                request.get("rapporteurId"),
                request.get("rapporteurNom")
        );

        return matchRepository.save(match);
    }

    private void setMembreOrOccasionnel(
            Consumer<Membre> membreSetter,
            Consumer<String> nomOccasionnelSetter,
            Object membreIdObj,
            Object nomOccasionnelObj
    ) {
        if (membreIdObj != null && !membreIdObj.toString().isBlank()) {
            Long membreId = Long.parseLong(membreIdObj.toString());
            Membre membre = membreRepository.findById(membreId)
                    .orElseThrow(() -> new RuntimeException("Membre non trouvé avec l'ID: " + membreId));
            membreSetter.accept(membre);
            nomOccasionnelSetter.accept(null);
        } else if (nomOccasionnelObj != null && !nomOccasionnelObj.toString().isBlank()) {
            membreSetter.accept(null);
            nomOccasionnelSetter.accept(nomOccasionnelObj.toString());
        } else {
            membreSetter.accept(null);
            nomOccasionnelSetter.accept(null);
        }
    }


    public Match getMatchById(Long id) {
        return matchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Match non trouvé"));
    }

    public List<Match> getAllMatches() {
        return matchRepository.findAll();
    }

    public List<Match> getMatchesByGroupeId(Long groupeId) {
        return matchRepository.findByGroupeId(groupeId);
    }

    public List<Match> getMatchesByGroupe() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Utilisateur non connecté"));
        return matchRepository.findByGroupeId(user.getGroupe().getId());
    }



    public void deleteMatch(Long id) {
        if (!matchRepository.existsById(id)) {
            throw new RuntimeException("Match non trouvé");
        }
        matchRepository.deleteById(id);
    }
}