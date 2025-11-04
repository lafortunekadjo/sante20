package com.sante20.service;


import com.sante20.dto.ApiResponse;
import com.sante20.dto.CheckInRequest;
import com.sante20.entity.*;
import com.sante20.repository.*;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PresenceService {

    @Autowired
    private PresenceRepository presenceRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MembreRepository membreRepository;

    @Autowired
    private MatchRepository matchRepository;

    @Autowired
    private SanctionRepository sanctionRepository;

    @Autowired
    private TypeSanctionRepository typeSanctionRepository;


    @Autowired
    private JoueurOccasionnelService joueurOccasionnelService;

    @Autowired
    private EquipeRepository equipeRepository;

    @Transactional
    public Presence createPresence(Map<String, Object> request) {
        Long membreId = Long.parseLong(request.get("membreId").toString());
        Long matchId = Long.parseLong(request.get("matchId").toString());

        // Supprimer les présences existantes pour ce match
        presenceRepository.deleteByMatchId(matchId);

        Membre membre = membreRepository.findById(membreId)
                .orElseThrow(() -> new RuntimeException("Membre non trouvé"));
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match non trouvé"));

        Presence presence = new Presence();
        presence.setMembre(membre);
        presence.setMatch(match);
        presence.setaJoue(Boolean.parseBoolean(request.get("aJoue").toString()));
        presence.setEstCapitaine(Boolean.parseBoolean(request.get("estCapitaine").toString()));
        presence.setButs(Integer.parseInt(request.get("butsContreSonCamp").toString()));
        presence.setButs(Integer.parseInt(request.get("buts").toString()));
        presence.setPasses(Integer.parseInt(request.get("passes").toString()));
        presence.setEstHommeDuMatch(Boolean.parseBoolean(request.get("estHommeDuMatch").toString()));
        presence.setEquipeMatch((String) request.get("equipeMatch"));

        // Enregistrer les cartons jaunes et rouges
        presence.setCartonsJaunes(Integer.parseInt(request.getOrDefault("cartonsJaunes", "0").toString()));
        presence.setCartonsRouges(Integer.parseInt(request.getOrDefault("cartonsRouges", "0").toString()));

        // Enregistrer la présence
        Presence savedPresence = presenceRepository.save(presence);

        // Créer des sanctions si des cartons sont présents
        if (presence.getCartonsJaunes() > 0) {
            System.out.print(presence);
            createSanctionForCarton(membre, match, "Carton jaune", presence.getCartonsJaunes());
        }
        if (presence.getCartonsRouges() > 0) {
            createSanctionForCarton(membre, match, "Carton rouge", presence.getCartonsRouges());
        }

        return savedPresence;
    }

    private void createSanctionForCarton(Membre membre, Match match, String typeSanctionNom, int nombreCartons) {
        TypeSanction typeSanction = typeSanctionRepository.findByNom(typeSanctionNom)
                .orElseThrow(() -> new RuntimeException("Type de sanction '" + typeSanctionNom + "' non trouvé"));

        // Créer une sanction pour chaque carton
        for (int i = 0; i < nombreCartons; i++) {
            Sanction sanction = new Sanction();
            sanction.setMembre(membre);
            sanction.setMatch(match);
            sanction.setTypeSanction(typeSanction);
            sanction.setDateSanction(match.getDateMatch());
            sanction.setMontant(typeSanction.getMontantParDefaut());
            sanction.setEtat(Sanction.EtatSanction.NON_PAYEE);
            sanction.setCommentaire("Sanction automatique pour carton " + typeSanctionNom.toLowerCase());
            sanction.setTotalPaiements(0.0);

            sanctionRepository.save(sanction);
        }
    }

    public Presence updatePresence(Long id, Map<String, Object> request) {
        Presence presence = presenceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Presence non trouvée"));

        Long membreId = Long.parseLong(request.get("membreId").toString());
        Long matchId = Long.parseLong(request.get("matchId").toString());

        Membre membre = membreRepository.findById(membreId)
                .orElseThrow(() -> new RuntimeException("Membre non trouvé"));
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match non trouvé"));

        presence.setMembre(membre);
        presence.setMatch(match);
        presence.setaJoue(Boolean.parseBoolean(request.get("aJoue").toString()));
        presence.setEstCapitaine(Boolean.parseBoolean(request.get("estCapitaine").toString()));
        presence.setButs(Integer.parseInt(request.get("buts").toString()));
        presence.setPasses(Integer.parseInt(request.get("passes").toString()));
        presence.setButs(Integer.parseInt(request.get("butsContreSonCamp").toString()));
        presence.setEstHommeDuMatch(Boolean.parseBoolean(request.get("estHommeDuMatch").toString()));
        presence.setEquipeMatch((String) request.get("equipeMatch"));

        return presenceRepository.save(presence);
    }

    public Presence getPresenceById(Long id) {
        return presenceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Presence non trouvée"));
    }

    public List<Presence> getAllPresences() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        System.out.println(authentication);
        String username = authentication.getName();
        Optional<User> user = userRepository.findByUsername(username);
        return presenceRepository.findAll();
    }

    public List<Presence> getPresencesByMatchId(Long matchId) {
        return presenceRepository.findByMatchId(matchId);
    }

    public List<Presence> getPresencesByMembreId(Long membreId) {
        return presenceRepository.findByMembreId(membreId);
    }

    public void deletePresence(Long id) {
        if (!presenceRepository.existsById(id)) {
            throw new RuntimeException("Presence non trouvée");
        }
        presenceRepository.deleteById(id);
    }

    @Transactional()
    public void savePresences(Long matchId, List<Map<String, Object>> presences) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match non trouvé"));

        // Supprimer les présences existantes pour ce match (optionnel, selon la logique)
        presenceRepository.deleteByMatchId(matchId);
        sanctionRepository.deleteByMatchId(matchId);
        System.out.print("ce que je recois:" + presences.size());

        for (Map<String, Object> request : presences) {
//            Long membreId = Long.parseLong(request.get("membre").toString());
//            Membre membre = membreRepository.findById(membreId)
//                    .orElseThrow(() -> new RuntimeException("Membre non trouvé"));
            Presence presence = new Presence();
            // Gérer les membres et les joueurs occasionnels
            if (request.containsKey("membre") && request.get("membre") != null && !request.get("membre").toString().isEmpty() ) {
                Long membreId = Long.parseLong(request.get("membre").toString());
                Membre membre = membreRepository.findById(membreId)
                        .orElseThrow(() -> new RuntimeException("Membre non trouvé"));

                presence.setMembre(membre);
                presence.setNomOccasionnel(null);
                // Enregistrer les cartons jaunes et rouges
                presence.setCartonsJaunes(Integer.parseInt(request.getOrDefault("cartonsJaunes", "0").toString()));
                presence.setCartonsRouges(Integer.parseInt(request.getOrDefault("cartonsRouges", "0").toString()));
                // Créer des sanctions si des cartons sont présents
                if (presence.getCartonsJaunes() > 0) {
                    createSanctionForCarton(membre, match, "Carton jaune", presence.getCartonsJaunes());
                }
                if (presence.getCartonsRouges() > 0) {
                    createSanctionForCarton(membre, match, "Carton rouge", presence.getCartonsRouges());
                }
            } else if (request.containsKey("nomOccasionnel") && request.get("nomOccasionnel") != null && !request.get("nomOccasionnel").toString().isEmpty()) {
                // Gérer le joueur occasionnel
                System.out.print("pas vide");
                joueurOccasionnelService.findOrCreateOccasionalPlayer((String) request.get("nomOccasionnel"));
                presence.setMembre(null);
                presence.setNomOccasionnel((String) request.get("nomOccasionnel"));
                // Créer des sanctions si des cartons sont présents
//                if (presence.getCartonsJaunes() > 0) {
//                    createSanctionForCarton(membre, match, "Carton jaune", presence.getCartonsJaunes());
//                }
//                if (presence.getCartonsRouges() > 0) {
//                    createSanctionForCarton(membre, match, "Carton rouge", presence.getCartonsRouges());
//                }
            }

            presence.setMatch(match);
            presence.setaJoue(Boolean.parseBoolean(request.get("aJoue").toString()));
            presence.setEstCapitaine(Boolean.parseBoolean(request.get("estCapitaine").toString()));
            presence.setButs(Integer.parseInt(request.get("buts").toString()));
            presence.setButsContreSonCamp(Integer.parseInt(request.get("butsContreSonCamp").toString()));
            presence.setPenalti(Integer.parseInt(request.get("penalti").toString()));
            presence.setPasses(Integer.parseInt(request.get("passes").toString()));
            presence.setCartonsJaunes(Integer.parseInt(request.get("cartonsJaunes").toString()));
            presence.setCartonsRouges(Integer.parseInt(request.get("cartonsRouges").toString()));
            presence.setEstHommeDuMatch(Boolean.parseBoolean(request.get("estHommeDuMatch").toString()));
            presence.setEstHommeDuMatchEq(Boolean.parseBoolean(request.get("estHommeDuMatchEq").toString()));
            presence.setEquipeMatch((String) request.get("equipeMatch"));
            // Créer des sanctions si des cartons sont présents
//            if (presence.getCartonsJaunes() > 0) {
//                createSanctionForCarton(membre, match, "Carton jaune", presence.getCartonsJaunes());
//            }
//            if (presence.getCartonsRouges() > 0) {
//                createSanctionForCarton(membre, match, "Carton rouge", presence.getCartonsRouges());
//            }

            presenceRepository.save(presence);
        }
    }

    @Transactional()
    public List<Sanction> getSanctionsByGroupe() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        System.out.println(authentication);
        String username = authentication.getName();
        Optional<User> user = userRepository.findByUsername(username);
        // Récupérer tous les membres du groupe
        List<Membre> membres = membreRepository.findByGroupeIdOrderByNomAsc(user.get().getMembre().getGroupe().getId());

        // Extraire les IDs des membres
        List<Long> membreIds = membres.stream()
                .map(Membre::getId)
                .collect(Collectors.toList());

        // Récupérer toutes les sanctions pour ces membres
        return sanctionRepository.findByMembreIdIn(membreIds);
    }

    public void deleteByMatchId(Long matchId) {
        presenceRepository.deleteByMatchId(matchId);
    }



    public ResponseEntity<ApiResponse> checkIn(CheckInRequest request) {


        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(new ApiResponse("Utilisateur non authentifié"));
        }
        String username = authentication.getName();
        Optional<User> userOptional = userRepository.findByUsername(username);

        if (userOptional.isEmpty()) {
            return ResponseEntity.badRequest().body(new ApiResponse("Utilisateur non trouvé"));
        }

        User user = userOptional.get();
        Membre membre = user.getMembre(); // Assurez-vous que getMembre() existe
        if (membre == null || membre.getGroupe() == null) {
            return ResponseEntity.badRequest().body(new ApiResponse("Membre ou groupe non associé"));
        }

        // Trouver le match du jour pour le groupe du membre
        LocalDate today = LocalDate.now(ZoneId.of("Africa/Douala"));
        Optional<Match> matchOptional = matchRepository.findByGroupeIdAndDateMatch(membre.getGroupe().getId(), today);

        if (matchOptional.isEmpty()) {
            return ResponseEntity.badRequest().body(new ApiResponse("Aucun match prévu aujourd'hui pour votre groupe"));
        }

        Equipe equipe = equipeRepository.findById(request.getEquipe()).orElseThrow();

        Match match = matchOptional.get();

        // Vérifier si le membre a déjà check-in pour ce match
        boolean hasAlreadyCheckedIn = presenceRepository.existsByMembreAndMatch(membre, match);
        if (hasAlreadyCheckedIn) {
            return ResponseEntity.badRequest().body(new ApiResponse("Vous avez déjà enregistré votre présence pour ce match"));
        }
        double stadiumLat = user.getMembre().getGroupe().getStade().getStadiumLat();
        double stadiumLon = user.getMembre().getGroupe().getStade().getStadiumLon();
        double radius = user.getMembre().getGroupe().getStade().getRadius(); // Rayon en mètres
        double distance = calculateDistance(request.getLatitude(), request.getLongitude(), stadiumLat, stadiumLon);

        if (distance <= radius) {
            Presence presence = new Presence();
            presence.setMatch(match);
            presence.setMembre(user.getMembre()); // Assurez-vous que getMembre() existe
            presence.setTimestamp(LocalDateTime.now(ZoneId.of("Africa/Douala")));
            presence.setLocationValid(true);
            presence.setAJoue(true);
            presence.setEquipeMatch(equipe.getNom());
            presenceRepository.save(presence);
            return ResponseEntity.ok(new ApiResponse("Présence enregistrée avec succès"));
        } else {
            return ResponseEntity.badRequest().body(new ApiResponse("Vous n'êtes pas au stade. Présence non validée. Distance : " + distance + "m"));
        }
    }

    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371000; // Rayon de la Terre en mètres
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    public List<Membre> getMembersByMatchId(Long matchId) {
        // Find all presence records for the given match ID
        List<Presence> presences = presenceRepository.findByMatchId(matchId);

        // Map the list of Presence objects to a list of Membre objects
        return presences.stream()
                .map(Presence::getMembre)
                .collect(Collectors.toList());
    }


    public List<Presence> getAllPresencesByGroupe() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        System.out.println(authentication);
        String username = authentication.getName();
        Optional<User> user = userRepository.findByUsername(username);
        return presenceRepository.findByMatchGroupeId(user.get().getGroupe().getId());
    }
}