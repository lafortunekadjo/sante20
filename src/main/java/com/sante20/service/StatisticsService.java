package com.sante20.service;


import com.sante20.dto.ContributionByGroupDTO;
import com.sante20.dto.UserStatistics;
import com.sante20.entity.*;
import com.sante20.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class StatisticsService {

    @Autowired
    private GroupeRepository groupeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ContributionRepository contributionRepository;

    @Autowired
    private ContributionIndividuelleRepository contributionIndividuelleRepository;

    @Autowired
    private MembreRepository membreRepository;

    @Autowired
    private  SanctionRepository sanctionRepository;
    @Autowired
    private  MatchRepository matchRepository;
    @Autowired
    private  PresenceRepository presenceRepository;

    public UserStatistics getUserStatistics() {
        UserStatistics stats = new UserStatistics();

        // 1. groupCount: Nombre de groupes actifs
        stats.setGroupCount((int) groupeRepository.countByIsActive(true));

        // 2. userCount: Nombre d'utilisateurs actifs
        List<User> activeUsers = userRepository.findByIsActiveTrue();
        stats.setUserCount(activeUsers.size());

        // 3. roleDistribution: Répartition des utilisateurs actifs par rôle
        Map<String, Integer> roleDistribution = new HashMap<>();
        for (User user : activeUsers) {
            String roleName = user.getRole(); // Convertit l'énumération en String
            roleDistribution.put(roleName, roleDistribution.getOrDefault(roleName, 0) + 1);
        }
        stats.setRoleDistribution(roleDistribution);

        // 4. totalContributions: Somme des montants des contributions valides
        List<Contribution> validContributions = contributionRepository.findAll();
        double totalContributions = 0.0; // Initialisation à 0.0 pour double
        for (Contribution contribution : validContributions) {
            totalContributions += contribution.getMontant(); // Somme directement les doubles
        }
        stats.setTotalContributions(totalContributions);

        // 5. totalCartons: Somme des cartons des membres actifs
        List<Membre> activeMembers = membreRepository.findAll();
        int totalCartons = 0;
        for (Membre member : activeMembers) {
            totalCartons += member.getCartons();
        }
        stats.setTotalCartons(totalCartons);

        System.out.print(stats);

        return stats;
    }



    public Map<String, Object> getAdminStats(LocalDate startDate, LocalDate endDate) {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalGroups", groupeRepository.countByIsDeleteFalse());
        stats.put("totalUsers", membreRepository.countByIsDeleteFalse());

        List<Map<String, Object>> usersByGroup = groupeRepository.findAll().stream()
                .filter(g -> !g.isDelete())
                .map(g -> {
                    Map<String, Object> groupData = new HashMap<>();
                    groupData.put("groupName", g.getNom());
                    groupData.put("userCount", g.getMembres().stream().filter(m -> m.isDelete()).count());
                    groupData.put("users", g.getMembres().stream()
                            .filter(m -> m.isDelete())
                            .map(m -> {
                                Map<String, Object> userData = new HashMap<>();
                                userData.put("id", m.getId());
                                userData.put("name", m.getNom() + " " + m.getPrenom());
                                userData.put("role", m.getRoleCO());
                                return userData;
                            })
                            .collect(Collectors.toList()));
                    return groupData;
                })
                .collect(Collectors.toList());
        stats.put("usersByGroup", usersByGroup);

        List<ContributionIndividuelle> contributions = startDate != null && endDate != null
                ? contributionIndividuelleRepository.findByDateContributionBetween(startDate, endDate)
                : contributionIndividuelleRepository.findAll();
        stats.put("totalContributions", contributions.stream().mapToDouble(ContributionIndividuelle::getMontant).sum());

        List<Sanction> sanctions = startDate != null && endDate != null
                ? sanctionRepository.findByDateSanctionBetween(startDate, endDate)
                : sanctionRepository.findAll();
        Map<String, Object> paidSanctions = new HashMap<>();
        paidSanctions.put("amount", sanctions.stream()
                .filter(s -> s.getEtat() == Sanction.EtatSanction.PAYEE && s.getMontant() != null)
                .mapToDouble(Sanction::getMontant).sum());
        paidSanctions.put("count", sanctions.stream()
                .filter(s -> s.getEtat() == Sanction.EtatSanction.PAYEE).count());
        stats.put("paidSanctions", paidSanctions);
        Map<String, Object> unpaidSanctions = new HashMap<>();
        unpaidSanctions.put("amount", sanctions.stream()
                .filter(s -> s.getEtat() == Sanction.EtatSanction.NON_PAYEE && s.getMontant() != null)
                .mapToDouble(Sanction::getMontant).sum());
        unpaidSanctions.put("count", sanctions.stream()
                .filter(s -> s.getEtat() == Sanction.EtatSanction.NON_PAYEE).count());
        stats.put("unpaidSanctions", unpaidSanctions);

        stats.put("totalMatches", startDate != null && endDate != null
                ? matchRepository.findByDateMatchBetween(startDate, endDate).size()
                : matchRepository.count());

        Map<String, Long> usersByRole = new HashMap<>();
        usersByRole.put("admin", membreRepository.countByRoleCOAndIsDeleteFalse("ADMIN"));
        usersByRole.put("responsable", membreRepository.countByRoleCOAndIsDeleteFalse("RESPONSABLE"));
        usersByRole.put("membre", membreRepository.countByRoleCOAndIsDeleteFalse("MEMBRE"));
        stats.put("usersByRole", usersByRole);

        List<ContributionByGroupDTO> contributionsByGroup = startDate != null && endDate != null
                ? contributionRepository.findContributionsByGroup(startDate, endDate)
                : contributionRepository.findContributionsByGroup(LocalDate.of(2000, 1, 1), LocalDate.now());
        stats.put("contributionsByGroup", contributionsByGroup);

        List<Map<String, Object>> recentActivity = groupeRepository.findAll().stream()
                .filter(g -> !g.isDelete())
                .map(g -> {
                    Map<String, Object> activity = new HashMap<>();
                    LocalDateTime createdDate = g.getCreatedAt();
                    activity.put("date", createdDate != null ? createdDate.toLocalDate() : LocalDate.now());
                    activity.put("action", "Création du groupe " + g.getNom());
                    return activity;
                })
                .sorted((a, b) -> ((LocalDate) b.get("date")).compareTo((LocalDate) a.get("date")))
                .limit(5)
                .collect(Collectors.toList());
        stats.put("recentActivity", recentActivity);

        return stats;
    }



    public Map<String, Object> getResponsableStats(Long groupeId, LocalDate startDate, LocalDate endDate) {
        Groupe groupe = groupeRepository.findById(groupeId).orElseThrow();
        Map<String, Object> stats = new HashMap<>();
        stats.put("memberCount", membreRepository.findByGroupeIdAndIsDeleteFalseOrderByNomDesc(groupeId).size());

        List<ContributionIndividuelle> contributions = startDate != null && endDate != null
                ? contributionIndividuelleRepository.findByGroupeIdAndDateContributionBetween(groupeId, startDate, endDate)
                : contributionIndividuelleRepository.findAll().stream()
                .filter(c -> c.getMembre().getGroupe().getId().equals(groupeId))
                .collect(Collectors.toList());
        stats.put("totalContributions", contributions.stream().mapToDouble(ContributionIndividuelle::getMontant).sum());

        List<Sanction> sanctions = startDate != null && endDate != null
                ? sanctionRepository.findByGroupeIdAndDateSanctionBetween(groupeId, startDate, endDate)
                : sanctionRepository.findAll().stream()
                .filter(s -> s.getMembre().getGroupe().getId().equals(groupeId))
                .collect(Collectors.toList());
        Map<String, Object> paidSanctions = new HashMap<>();
        paidSanctions.put("amount", sanctions.stream()
                .filter(s -> s.getEtat() == Sanction.EtatSanction.PAYEE)
                .mapToDouble(Sanction::getMontant).sum());
        paidSanctions.put("count", sanctions.stream()
                .filter(s -> s.getEtat() == Sanction.EtatSanction.PAYEE).count());
        stats.put("paidSanctions", paidSanctions);
        Map<String, Object> unpaidSanctions = new HashMap<>();
        unpaidSanctions.put("amount", sanctions.stream()
                .filter(s -> s.getEtat() == Sanction.EtatSanction.NON_PAYEE)
                .mapToDouble(Sanction::getMontant).sum());
        unpaidSanctions.put("count", sanctions.stream()
                .filter(s -> s.getEtat() == Sanction.EtatSanction.NON_PAYEE).count());
        stats.put("unpaidSanctions", unpaidSanctions);
        stats.put("sanctionsPercentage", sanctions.isEmpty() ? 0 : (double) ((Long) paidSanctions.get("count")) / sanctions.size() * 100);

        List<Map<String, Object>> contributionsByMonth = contributions.stream()
                .collect(Collectors.groupingBy(
                        c -> c.getDateContribution().getMonth().toString(),
                        Collectors.summarizingDouble(ContributionIndividuelle::getMontant)
                ))
                .entrySet().stream()
                .map(e -> {
                    Map<String, Object> monthData = new HashMap<>();
                    monthData.put("month", e.getKey());
                    monthData.put("amount", e.getValue().getSum());
                    monthData.put("date", contributions.stream()
                            .filter(c -> c.getDateContribution().getMonth().toString().equals(e.getKey()))
                            .map(ContributionIndividuelle::getDateContribution)
                            .max(LocalDate::compareTo)
                            .orElse(null));
                    return monthData;
                })
                .collect(Collectors.toList());
        stats.put("contributionsByMonth", contributionsByMonth);

        List<Map<String, Object>> upcomingMatches = matchRepository.findByGroupeIdAndDateMatchAfter(groupeId, LocalDate.now())
                .stream()
                .map(m -> {
                    Map<String, Object> matchData = new HashMap<>();
                    matchData.put("date", m.getDateMatch());
                    matchData.put("opponent", m.getAdversaire());
                    return matchData;
                })
                .collect(Collectors.toList());
        stats.put("upcomingMatches", upcomingMatches);

        // Meilleurs buteurs (top 10 ou tous si < 10)
        List<Map<String, Object>> topScorers = presenceRepository.findByMatchGroupeIdAndAJoueTrue(groupeId)
                .stream()
                .collect(Collectors.groupingBy(
                        p -> p.getMembre().getId(),
                        Collectors.summingInt(p -> p.getButs())
                ))
                .entrySet().stream()
                .map(e -> {
                    Membre membre = membreRepository.findById(e.getKey()).orElse(null);
                    Map<String, Object> scorerData = new HashMap<>();
                    scorerData.put("name", membre != null ? membre.getNom() + " " + membre.getPrenom() : "Inconnu");
                    if (membre.getEquipe()!=null){
                        scorerData.put("team", membre != null ? membre.getEquipe().getNom() : "Aucune");
                    }else{
                        scorerData.put("team","Aucune");
                    }
                    scorerData.put("goals", e.getValue());
                    return scorerData;
                })
                .sorted((a, b) -> ((Number) b.get("goals")).intValue() - ((Number) a.get("goals")).intValue())
                .limit(10)
                .collect(Collectors.toList());
        stats.put("topScorers", topScorers);

        // Meilleurs passeurs (top 10 ou tous si < 10)
        List<Map<String, Object>> topAssists = presenceRepository.findByMatchGroupeIdAndAJoueTrue(groupeId)
                .stream()
                .collect(Collectors.groupingBy(
                        p -> p.getMembre().getId(),
                        Collectors.summingInt(p -> p.getPasses())
                ))
                .entrySet().stream()
                .map(e -> {
                    Membre membre = membreRepository.findById(e.getKey()).orElse(null);
                    Map<String, Object> assistData = new HashMap<>();
                    assistData.put("name", membre != null ? membre.getNom() + " " + membre.getPrenom() : "Inconnu");
                    if (membre.getEquipe()!=null){
                        assistData.put("team", membre != null ? membre.getEquipe().getNom() : "Aucune");
                    }else{
                        assistData.put("team","Aucune");
                    }
                    assistData.put("assists", e.getValue());
                    return assistData;
                })
                .sorted((a, b) -> ((Number) b.get("assists")).intValue() - ((Number) a.get("assists")).intValue())
                .limit(10)
                .collect(Collectors.toList());
        stats.put("topAssists", topAssists);

        // Membres les plus présents (top 10 ou tous si < 10)
        List<Map<String, Object>> topAttendance = presenceRepository.findByMatchGroupeId(groupeId)
                .stream()
                .filter(p -> p.isaJoue())
                .collect(Collectors.groupingBy(
                        p -> p.getMembre().getId(),
                        Collectors.counting()
                ))
                .entrySet().stream()
                .map(e -> {
                    Membre membre = membreRepository.findById(e.getKey()).orElse(null);
                    Map<String, Object> attendanceData = new HashMap<>();
                    attendanceData.put("name", membre != null ? membre.getNom() + " " + membre.getPrenom() : "Inconnu");
                    if (membre.getEquipe()!=null){
                        attendanceData.put("team", membre != null ? membre.getEquipe().getNom() : "Aucune");
                    }else{
                        attendanceData.put("team","Aucune");
                    }
                    attendanceData.put("appearances", e.getValue());
                    return attendanceData;
                })
                .sorted((a, b) -> (int) (((Number) b.get("appearances")).longValue() - ((Number) a.get("appearances")).longValue()))
                .limit(10)
                .collect(Collectors.toList());
        stats.put("topAttendance", topAttendance);

        return stats;
    }

    public Map<String, Object> getMembreStats(Long membreId, LocalDate startDate, LocalDate endDate) {
        Membre membre1 = membreRepository.findById(membreId).orElseThrow();
        Groupe groupe = groupeRepository.findById(membre1.getGroupe().getId()).orElseThrow();
        Map<String, Object> stats = new HashMap<>();
        List<Presence> presences = startDate != null && endDate != null
                ? presenceRepository.findByMembreIdAndAJoueTrueAndMatchDateMatchBetween(membreId, startDate, endDate)
                : presenceRepository.findAll().stream()
                .filter(p -> p.getMembre() != null && p.getMembre().getId().equals(membreId) && p.isAJoue())
                .collect(Collectors.toList());

        stats.put("matchesPlayed", presences.size());
        stats.put("totalPasses", presences.stream().mapToLong(Presence::getPasses).sum());
        stats.put("successfulPasses", Math.round(presences.stream().mapToLong(Presence::getPasses).sum() * 0.8)); // Estimation
        stats.put("totalPlayingTime", presences.size() * 90); // 90 min par match
        stats.put("goalsScored", presences.stream().mapToLong(Presence::getButs).sum());

        List<Sanction> sanctions = startDate != null && endDate != null
                ? sanctionRepository.findByMembreIdAndDateSanctionBetween(membreId, startDate, endDate)
                : sanctionRepository.findAll().stream()
                .filter(s -> s.getMembre().getId().equals(membreId))
                .collect(Collectors.toList());
        Map<String, Object> sanctionsData = new HashMap<>();
        sanctionsData.put("paid", Map.of(
                "amount", sanctions.stream().filter(s -> s.getEtat() == Sanction.EtatSanction.PAYEE).mapToDouble(Sanction::getMontant).sum(),
                "count", sanctions.stream().filter(s -> s.getEtat() == Sanction.EtatSanction.PAYEE).count()
        ));
        sanctionsData.put("unpaid", Map.of(
                "amount", sanctions.stream().filter(s -> s.getEtat() == Sanction.EtatSanction.NON_PAYEE).mapToDouble(Sanction::getMontant).sum(),
                "count", sanctions.stream().filter(s -> s.getEtat() == Sanction.EtatSanction.NON_PAYEE).count()
        ));
        sanctionsData.put("yellowCards", presences.stream().mapToLong(Presence::getCartonsJaunes).sum());
        sanctionsData.put("redCards", presences.stream().mapToLong(Presence::getCartonsRouges).sum());
        stats.put("sanctions", sanctionsData);

        List<Map<String, Object>> passesByMatch = presences.stream()
                .map(p -> {
                    Map<String, Object> matchData = new HashMap<>();
                    matchData.put("match", "Match " + p.getMatch().getId());
                    matchData.put("date", p.getMatch().getDateMatch());
                    matchData.put("passes", p.getPasses());
                    return matchData;
                })
                .collect(Collectors.toList());
        stats.put("passesByMatch", passesByMatch);

        List<Map<String, Object>> recentMatches = presences.stream()
                .map(p -> {
                    Map<String, Object> matchData = new HashMap<>();
                    matchData.put("date", p.getMatch().getDateMatch());
                    matchData.put("opponent", p.getMatch().getAdversaire());
                    return matchData;
                })
                .sorted((a, b) -> ((LocalDate) b.get("date")).compareTo((LocalDate) a.get("date")))
                .limit(3)
                .collect(Collectors.toList());
        stats.put("recentMatches", recentMatches);

        // Meilleurs buteurs (top 10 ou tous si < 10)
        List<Map<String, Object>> topScorers = presenceRepository.findByMembreAndAJoueTrue(groupe.getId())
                .stream()
                .collect(Collectors.groupingBy(
                        p -> p.getMembre().getId(),
                        Collectors.summingInt(p -> p.getButs())
                ))
                .entrySet().stream()
                .map(e -> {
                    Membre membre = membreRepository.findById(e.getKey()).orElse(null);
                    Map<String, Object> scorerData = new HashMap<>();
                    scorerData.put("name", membre != null ? membre.getNom() + " " + membre.getPrenom() : "Inconnu");
                    if (membre.getEquipe()!=null){
                        scorerData.put("team", membre != null ? membre.getEquipe().getNom() : "Aucune");
                    }else{
                        scorerData.put("team","Aucune");
                    }

                    scorerData.put("goals", e.getValue());
                    return scorerData;
                })
                .sorted((a, b) -> ((Number) b.get("goals")).intValue() - ((Number) a.get("goals")).intValue())
                .limit(10)
                .collect(Collectors.toList());
        stats.put("topScorers", topScorers);

        // Meilleurs passeurs (top 10 ou tous si < 10)
        List<Map<String, Object>> topAssists = presenceRepository.findByMembreAndAJoueTrue(groupe.getId())
                .stream()
                .collect(Collectors.groupingBy(
                        p -> p.getMembre().getId(),
                        Collectors.summingInt(p -> p.getPasses())
                ))
                .entrySet().stream()
                .map(e -> {
                    Membre membre = membreRepository.findById(e.getKey()).orElse(null);
                    Map<String, Object> assistData = new HashMap<>();
                    assistData.put("name", membre != null ? membre.getNom() + " " + membre.getPrenom() : "Inconnu");
                    if (membre.getEquipe()!=null){
                        assistData.put("team", membre != null ? membre.getEquipe().getNom() : "Aucune");
                    }else{
                        assistData.put("team","Aucune");
                    }
                    assistData.put("assists", e.getValue());
                    return assistData;
                })
                .sorted((a, b) -> ((Number) b.get("assists")).intValue() - ((Number) a.get("assists")).intValue())
                .limit(10)
                .collect(Collectors.toList());
        stats.put("topAssists", topAssists);

        // Membres les plus présents (top 10 ou tous si < 10)
        List<Map<String, Object>> topAttendance = presenceRepository.findByMatchGroupeId(groupe.getId())
                .stream()
                .filter(p -> p.isaJoue())
                .collect(Collectors.groupingBy(
                        p -> p.getMembre().getId(),
                        Collectors.counting()
                ))
                .entrySet().stream()
                .map(e -> {
                    Membre membre = membreRepository.findById(e.getKey()).orElse(null);
                    Map<String, Object> attendanceData = new HashMap<>();
                    attendanceData.put("name", membre != null ? membre.getNom() + " " + membre.getPrenom() : "Inconnu");
                    if (membre.getEquipe()!=null){
                        attendanceData.put("team", membre != null ? membre.getEquipe().getNom() : "Aucune");
                    }else{
                        attendanceData.put("team","Aucune");
                    }
                    attendanceData.put("appearances", e.getValue());
                    return attendanceData;
                })
                .sorted((a, b) -> (int) (((Number) b.get("appearances")).longValue() - ((Number) a.get("appearances")).longValue()))
                .limit(10)
                .collect(Collectors.toList());
        stats.put("topAttendance", topAttendance);

        return stats;
    }
}