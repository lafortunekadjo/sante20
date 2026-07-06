import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../../core/services/auth.service';
import { ChatService } from '../../../../core/services/chat.service';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PlayerProfile, ProfileService, VideoHighlight } from '../../../../core/services/profile.service';
import { TranslateModule } from '@ngx-translate/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

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
    TranslateModule,
    MatExpansionModule,
    MatSlideToggleModule,
    MatSnackBarModule
  ],
  templateUrl: './player-profile.component.html',
  styleUrls: ['./player-profile.component.scss']
})
export class PlayerProfileComponent implements OnInit {
  playerProfile: any | null = null;
  isLoading = true;
  hasError = false;
  isOwnProfile = false;
  isCreatingChat = false;

  // Gestion de la visionneuse de médias (Lightbox)
  activeMediaUrl: string | null = null;
  activeMediaType: 'image' | 'video' | null = null;
  playerVideos: VideoHighlight[] = [];
  isLoadingVideos = false;

  constructor(
    private route: ActivatedRoute,
    private profileService: ProfileService,
    private authService: AuthService,
    private chatService: ChatService,
    private router: Router,
    private snackBar: MatSnackBar,
    private location: Location
  ) {}

  @HostListener('window:blur', ['$event'])
    onWindowBlur() {
      this.closeLightbox(); // Ferme immédiatement la photo si la fenêtre perd le focus
    }

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
  startPrivateChat(): void {
    if (!this.playerProfile?.id) {
      this.snackBar.open(
        'Ce joueur ne possède pas encore de compte My2-0',
        '✕', { duration: 3000, panelClass: ['snackbar-warning'] }
      );
      return;
    }

    this.isCreatingChat = true;

    this.chatService.createPrivateConversation(this.playerProfile.id).subscribe({
      next: (conversation) => {
        this.isCreatingChat = false;
        // Naviguer vers le chat et ouvrir la conversation
        this.router.navigate(['/chat', conversation.id]);
      },
      error: (err) => {
        this.isCreatingChat = false;
        const msg = err.status === 409
          ? 'Conversation déjà existante — redirection...'
          : 'Impossible d"ouvrir le chat pour le moment';
        this.snackBar.open(msg, '✕', { duration: 3000 });

        // Si 409 (conversation existante) — l'API retourne souvent la conv dans err.error
        if (err.status === 409 && err.error?.id) {
          this.router.navigate(['/chat', err.error.id]);
        }
      }
    });
  }

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
        console.log(this.playerProfile)
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

  

  // À ajouter dans ta classe PlayerProfileComponent
openPhotoLightbox(photoUrl: string | null): void {
  if (photoUrl) {
    this.activeMediaUrl = photoUrl;
    // Si tu as un booléen ou un string pour suivre le type de média (ex: activeMediaType = 'image') ajoute-le ici
  }
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