import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../../../core/services/auth.service';
import { PlayerProfile, ProfileService } from '../../../../core/services/profile.service';


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
    MatDividerModule
  ],
  templateUrl: './player-profile.component.html',
  styleUrls: ['./player-profile.component.scss']
})
export class PlayerProfileComponent implements OnInit {
  playerProfile: PlayerProfile | null = null;
  isLoading = true;
  hasError = false;
  isOwnProfile = false; // Flag pour savoir si c'est le profil de l'utilisateur connecté

  constructor(
    private route: ActivatedRoute,
    private profileService: ProfileService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Écouter les changements de paramètres dans l'URL (ex: /p/vanessa)
    this.route.params.subscribe(params => {
      const usernameFromUrl = params['username'];
      if (usernameFromUrl) {
        this.loadProfile(usernameFromUrl);
      }
    });
  }

  private loadProfile(username: string): void {
    this.isLoading = true;
    this.hasError = false;

    this.profileService.getProfileByUsername(username).subscribe({
      next: (profile) => {
        this.playerProfile = profile;
        this.isLoading = false;
        
        // Vérification d'identité
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
    if (!this.playerProfile?.username) return '?';
    return this.playerProfile.username.substring(0, 2).toUpperCase();
  }
}