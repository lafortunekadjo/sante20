package com.sante20.controller;

import com.sante20.dto.ApiResponse;
import com.sante20.entity.Groupe;
import com.sante20.entity.Match;
import com.sante20.entity.User;
import com.sante20.repository.GroupeRepository;
import com.sante20.repository.MatchRepository;
import com.sante20.repository.UserRepository;
import com.sante20.service.FileStorageService;
import org.springframework.core.io.Resource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@CrossOrigin("*")
public class ImageController {

    private final FileStorageService fileStorageService;

    @Autowired
    private MatchRepository matchRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GroupeRepository groupRepository;

    @Autowired
    public ImageController(FileStorageService fileStorageService) {
        this.fileStorageService = fileStorageService;
    }

    /**
     * Upload photo de profil utilisateur
     */
    @PostMapping("/user/{userId}/profile-photo")
    public ResponseEntity<ApiResponse> uploadUserProfilePhoto(
            @PathVariable Long userId,
            @RequestParam("profilePhoto") MultipartFile file) {
        try {
            // Vérifier que l'utilisateur existe
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            // Stocker le fichier
            String relativePath = fileStorageService.storeUserProfilePhoto(file, userId);
            String fileUrl = "/uploads/" + relativePath;

            // Mettre à jour l'URL dans la base de données
            user.setProfilePhotoUrl(fileUrl);
            userRepository.save(user);

            return ResponseEntity.ok(new ApiResponse(
                    "Photo de profil téléchargée avec succès. URL: " + fileUrl));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponse(
                    "Erreur lors du téléchargement de la photo de profil : " + e.getMessage()));
        }
    }

    /**
     * Upload photo de profil groupe
     */
    @PostMapping("/group/{groupId}/profile-photo")
    public ResponseEntity<ApiResponse> uploadGroupProfilePhoto(
            @PathVariable Long groupId,
            @RequestParam("profilePhoto") MultipartFile file) {
        try {
            // Vérifier que le groupe existe
            Groupe group = groupRepository.findById(groupId)
                    .orElseThrow(() -> new RuntimeException("Groupe non trouvé"));

            // Stocker le fichier
            String relativePath = fileStorageService.storeGroupProfilePhoto(file, groupId);
            String fileUrl = "/uploads/" + relativePath;

            // Mettre à jour l'URL dans la base de données
            group.setProfilePhotoUrl(fileUrl);
            groupRepository.save(group);

            return ResponseEntity.ok(new ApiResponse(
                    "Photo de profil du groupe téléchargée avec succès. URL: " + fileUrl));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponse(
                    "Erreur lors du téléchargement de la photo de profil du groupe : " + e.getMessage()));
        }
    }

    /**
     * Upload médias pour un match
     */
    @PostMapping("/matches/{matchId}/media")
    public ResponseEntity<ApiResponse> uploadMatchMedia(
            @PathVariable Long matchId,
            @RequestParam("matchMedia") List<MultipartFile> files) {
        try {
            // Récupérer le match et vérifier qu'il existe
            Match match = matchRepository.findById(matchId)
                    .orElseThrow(() -> new RuntimeException("Match non trouvé"));

            // Récupérer l'ID du groupe associé au match
            Long groupId = match.getGroupe().getId();

            // Stocker tous les fichiers
            List<String> fileUrls = files.stream()
                    .map(file -> {
                        try {
                            String relativePath = fileStorageService.storeMatchMedia(
                                    file, groupId, matchId, match.getDateMatch()
                            );
                            return "/uploads/" + relativePath;
                        } catch (IOException e) {
                            throw new RuntimeException("Erreur lors de la sauvegarde du fichier : " + e.getMessage(), e);
                        }
                    })
                    .collect(Collectors.toList());

            // Ajouter les URLs à la liste des médias du match
            match.getMediaUrls().addAll(fileUrls);
            matchRepository.save(match);

            return ResponseEntity.ok(new ApiResponse(
                    "Médias du match téléchargés avec succès. Nombre de fichiers: " + fileUrls.size()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponse(
                    "Erreur lors du téléchargement des médias du match : " + e.getMessage()));
        }
    }

    @GetMapping("/matches/{matchId}/media1")
    public ResponseEntity<List<String>> getMatchMedias(@PathVariable Long matchId) {
        try {
            // Récupérer le match et vérifier qu'il existe
            Match match = matchRepository.findById(matchId)
                    .orElseThrow(() -> new RuntimeException("Match non trouvé"));

            // Retourner directement la liste des URLs. Si la liste est vide,
            // le JSON renvoyé sera une liste vide ([]).
            return ResponseEntity.ok(match.getMediaUrls());

        } catch (RuntimeException e) {
            // Gérer l'erreur "Match non trouvé"
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            // Gérer les autres erreurs serveur
            System.err.println("Erreur lors de la récupération des URLs de médias pour le match " + matchId + " : " + e.getMessage());
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Récupérer photo de profil utilisateur
     */
    @GetMapping("/user/{userId}/profile-photo")
    public ResponseEntity<Resource> getUserProfilePhoto(@PathVariable Long userId) {
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            if (user.getProfilePhotoUrl() == null) {
                return ResponseEntity.notFound().build();
            }

            // Enlever le préfixe /uploads/ de l'URL
            String relativePath = user.getProfilePhotoUrl().replace("/uploads/", "");
            Path filePath = fileStorageService.getFile(relativePath);
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                String contentType = determineContentType(filePath);
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_TYPE, contentType)
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Récupérer photo de profil groupe
     */
    @GetMapping("/group/{groupId}/profile-photo")
    public ResponseEntity<Resource> getGroupProfilePhoto(@PathVariable Long groupId) {
        try {
            Groupe group = groupRepository.findById(groupId)
                    .orElseThrow(() -> new RuntimeException("Groupe non trouvé"));

            if (group.getProfilePhotoUrl() == null) {
                return ResponseEntity.notFound().build();
            }

            // Enlever le préfixe /uploads/ de l'URL
            String relativePath = group.getProfilePhotoUrl().replace("/uploads/", "");
            Path filePath = fileStorageService.getFile(relativePath);
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                String contentType = determineContentType(filePath);
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_TYPE, contentType)
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Récupérer un média de match
     */
    @GetMapping("/matches/{matchId}/media/{mediaIndex}")
    public ResponseEntity<Resource> getMatchMedia(
            @PathVariable Long matchId,
            @PathVariable int mediaIndex) {
        try {
            Match match = matchRepository.findById(matchId)
                    .orElseThrow(() -> new RuntimeException("Match non trouvé"));

            if (mediaIndex >= match.getMediaUrls().size()) {
                return ResponseEntity.notFound().build();
            }

            String mediaUrl = match.getMediaUrls().get(mediaIndex);
            String relativePath = mediaUrl.replace("/uploads/", "");
            Path filePath = fileStorageService.getFile(relativePath);
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                String contentType = determineContentType(filePath);
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_TYPE, contentType)
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Supprimer photo de profil utilisateur
     */
    @DeleteMapping("/user/{userId}/profile-photo")
    public ResponseEntity<ApiResponse> deleteUserProfilePhoto(@PathVariable Long userId) {
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            if (user.getProfilePhotoUrl() != null) {
                String relativePath = user.getProfilePhotoUrl().replace("/uploads/", "");
                fileStorageService.deleteFile(relativePath);
                user.setProfilePhotoUrl(null);
                userRepository.save(user);
            }

            return ResponseEntity.ok(new ApiResponse( "Photo de profil supprimée avec succès"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponse(
                    "Erreur lors de la suppression de la photo : " + e.getMessage()));
        }
    }

    /**
     * Détermine le type de contenu basé sur l'extension du fichier
     */
    private String determineContentType(Path filePath) {
        String fileName = filePath.getFileName().toString().toLowerCase();
        if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) {
            return MediaType.IMAGE_JPEG_VALUE;
        } else if (fileName.endsWith(".png")) {
            return MediaType.IMAGE_PNG_VALUE;
        } else if (fileName.endsWith(".gif")) {
            return "image/gif";
        } else if (fileName.endsWith(".mp4")) {
            return "video/mp4";
        } else if (fileName.endsWith(".webm")) {
            return "video/webm";
        } else {
            return MediaType.APPLICATION_OCTET_STREAM_VALUE;
        }
    }
}