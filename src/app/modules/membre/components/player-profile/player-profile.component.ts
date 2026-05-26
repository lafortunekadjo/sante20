import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../../core/services/auth.service';
import { PlayerProfile, ProfileService, VideoHighlight } from '../../../../core/services/profile.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-player-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatButtonModule,
    TranslateModule
  ],
  templateUrl: './player-profile.component.html',
  styleUrls: ['./player-profile.component.scss']
})
export class PlayerProfileComponent implements OnInit {
  playerProfile: any | null = null;
  isLoading = true;
  hasError = false;
  isOwnProfile = false;

  // Gestion de la visionneuse de médias (Lightbox)
  activeMediaUrl: string | null = null;
  activeMediaType: 'image' | 'video' | null = null;
  playerVideos: VideoHighlight[] = [];
  isLoadingVideos = false;

  constructor(
    private route: ActivatedRoute,
    private profileService: ProfileService,
    private authService: AuthService,
    private location: Location // Injection pour le bouton retour
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const usernameFromUrl = params['username'];
      if (usernameFromUrl) {
        this.loadProfile(usernameFromUrl);
        this.loadPlayerVideos(usernameFromUrl);
      }
    });
  }

  calculateAge(dateNaissance: string | Date | undefined | null): number | null {
  if (!dateNaissance) return null;

  const birthDate = new Date(dateNaissance);
  
  // Vérifie si la date est valide
  if (isNaN(birthDate.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();

  // Ajuste l'âge si l'anniversaire n'est pas encore passé cette année
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

  // Action du bouton retour
  goBackToList(): void {
    this.location.back();
  }

  private loadPlayerVideos(username: string): void {
    this.isLoadingVideos = true;
    this.profileService.getVideosByUsername(username).subscribe({
      next: (videos) => {
        this.playerVideos = videos;
        this.isLoadingVideos = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des vidéos du profil', err);
        this.isLoadingVideos = false;
      }
    });
  }

  // // --- GESTION DES MÉDIAS (LIGHTBOX) ---
  
  // openLightbox(url: string): void {
  //   this.activeMediaUrl = url;
  // }

  // closeLightbox(): void {
  //   this.activeMediaUrl = null;
  // }

  private loadProfile(username: string): void {
    this.isLoading = true;
    this.hasError = false;

    this.profileService.getProfileByUsername(username).subscribe({
      next: (profile) => {
        this.playerProfile = profile;
        this.isLoading = false;
        
        const currentUser = this.authService.getUser();
        this.isOwnProfile = currentUser?.username === profile.username;
      },
      error: (err) => {
        console.error('Erreur lors du chargement du profil athlète', err);
        this.isLoading = false;
        this.hasError = true;
      }
    });
  }

  getInitials(): string {
    if (!this.playerProfile?.username) return '20';
    return this.playerProfile.username.substring(0, 2).toUpperCase();
  }

  // --- GESTION DES MÉDIAS ---
  
  isUrlVideo(url: string): boolean {
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
    return videoExtensions.some(ext => url.toLowerCase().endsWith(ext)) || url.includes('video');
  }

  openLightbox(url: string): void {
    this.activeMediaUrl = url;
    this.activeMediaType = this.isUrlVideo(url) ? 'video' : 'image';
  }

  closeLightbox(): void {
    this.activeMediaUrl = null;
    this.activeMediaType = null;
  }
}