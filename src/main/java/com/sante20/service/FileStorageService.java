package com.sante20.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class FileStorageService {

    private final Path rootDirectory = Paths.get("uploads");
    private final Path usersDirectory;
    private final Path groupsDirectory;
    
    // Format pour les noms de fichiers avec timestamp
    // Assurez-vous que ceci est déclaré
    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss");
    // private final Path groupsDirectory; // Doit être injecté ou initialisé


    public FileStorageService() {
        try {
            // Créer la structure de base des dossiers
            Files.createDirectories(rootDirectory);
            this.usersDirectory = rootDirectory.resolve("users");
            this.groupsDirectory = rootDirectory.resolve("groups");
            
            Files.createDirectories(usersDirectory);
            Files.createDirectories(groupsDirectory);
        } catch (IOException e) {
            throw new RuntimeException("Impossible de créer la structure de répertoires", e);
        }
    }

    /**
     * Stocke la photo de profil d'un utilisateur
     * Structure: uploads/users/user_{userId}/profile/photoprofil_{userId}.{ext}
     */
    public String storeUserProfilePhoto(MultipartFile file, Long userId) throws IOException {
        // Créer le dossier de l'utilisateur
        Path userDirectory = usersDirectory.resolve("user_" + userId);
        Path profileDirectory = userDirectory.resolve("profile");
        Files.createDirectories(profileDirectory);

        // Extraire l'extension du fichier
        String extension = getFileExtension(file.getOriginalFilename());
        String fileName = "photoprofil_" + userId + extension;
        
        // Supprimer l'ancienne photo si elle existe
        deleteExistingProfilePhoto(profileDirectory, userId);
        
        // Sauvegarder le nouveau fichier
        Path filePath = profileDirectory.resolve(fileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        // Retourner le chemin relatif depuis uploads/
        return "users/user_" + userId + "/profile/" + fileName;
    }

    /**
     * Stocke la photo de profil d'un groupe
     * Structure: uploads/groups/group_{groupId}/profile/photoprofil_group_{groupId}.{ext}
     */
    public String storeGroupProfilePhoto(MultipartFile file, Long groupId) throws IOException {
        // Créer le dossier du groupe
        Path groupDirectory = groupsDirectory.resolve("group_" + groupId);
        Path profileDirectory = groupDirectory.resolve("profile");
        Files.createDirectories(profileDirectory);

        // Extraire l'extension du fichier
        String extension = getFileExtension(file.getOriginalFilename());
        String fileName = "photoprofil_group_" + groupId + extension;
        
        // Supprimer l'ancienne photo si elle existe
        deleteExistingGroupProfilePhoto(profileDirectory, groupId);
        
        // Sauvegarder le nouveau fichier
        Path filePath = profileDirectory.resolve(fileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        // Retourner le chemin relatif depuis uploads/
        return "groups/group_" + groupId + "/profile/" + fileName;
    }

    /**
     * Stocke les médias d'un match
     * Structure: uploads/groups/group_{groupId}/match_{matchId}_{date}/media_{timestamp}.{ext}
     */
    public String storeMatchMedia(MultipartFile file, Long groupId, Long matchId, LocalDate matchDate) throws IOException {
        // Créer le dossier du groupe si nécessaire
        Path groupDirectory = groupsDirectory.resolve("group_" + groupId);
        Files.createDirectories(groupDirectory);

        // Créer le dossier du match avec la date
        String matchFolderName = String.format("match_%d_%s", 
            matchId, 
            matchDate.format(DateTimeFormatter.ofPattern("yyyyMMdd"))
        );
        Path matchDirectory = groupDirectory.resolve(matchFolderName);
        Files.createDirectories(matchDirectory);

        // Générer un nom unique pour le fichier média
        String extension = getFileExtension(file.getOriginalFilename());
        String timestamp = LocalDateTime.now().format(formatter);
        String fileName = "media_" + timestamp + "_" + System.nanoTime() + extension;
        
        // Sauvegarder le fichier
        Path filePath = matchDirectory.resolve(fileName);
        Files.copy(file.getInputStream(), filePath);

        // Retourner le chemin relatif depuis uploads/
        return "groups/group_" + groupId + "/" + matchFolderName + "/" + fileName;
    }

    /**
     * Récupère un fichier par son chemin relatif
     */
    public Path getFile(String relativePath) {
        return rootDirectory.resolve(relativePath);
    }

    /**
     * Vérifie si un fichier existe
     */
    public boolean fileExists(String relativePath) {
        return Files.exists(rootDirectory.resolve(relativePath));
    }

    /**
     * Supprime un fichier
     */
    public void deleteFile(String relativePath) throws IOException {
        Path filePath = rootDirectory.resolve(relativePath);
        Files.deleteIfExists(filePath);
    }

    /**
     * Extrait l'extension d'un nom de fichier
     */
    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf("."));
    }

    /**
     * Supprime l'ancienne photo de profil d'un utilisateur
     */
    private void deleteExistingProfilePhoto(Path profileDirectory, Long userId) throws IOException {
        Files.list(profileDirectory)
            .filter(path -> path.getFileName().toString().startsWith("photoprofil_" + userId))
            .forEach(path -> {
                try {
                    Files.deleteIfExists(path);
                } catch (IOException e) {
                    // Log l'erreur mais continue
                }
            });
    }

    /**
     * Supprime l'ancienne photo de profil d'un groupe
     */
    private void deleteExistingGroupProfilePhoto(Path profileDirectory, Long groupId) throws IOException {
        Files.list(profileDirectory)
            .filter(path -> path.getFileName().toString().startsWith("photoprofil_group_" + groupId))
            .forEach(path -> {
                try {
                    Files.deleteIfExists(path);
                } catch (IOException e) {
                    // Log l'erreur mais continue
                }
            });
    }

    /**
     * Obtient la structure complète des dossiers sous forme de String (utile pour debug)
     */
    public String getFolderStructure() {
        return """
        uploads/
        ├── users/
        │   └── user_{userId}/
        │       └── profile/
        │           └── photoprofil_{userId}.{ext}
        └── groups/
            └── group_{groupId}/
                ├── profile/
                │   └── photoprofil_group_{groupId}.{ext}
                └── match_{matchId}_{date}/
                    └── media_{timestamp}.{ext}
        """;
    }
}
