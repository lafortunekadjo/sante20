import { t } from '../../../../core/i18n/traduire';
import { MatDialog } from '@angular/material/dialog';
import { SignalementDialogComponent } from '../../../../shared/components/signalement-dialog/signalement-dialog.component';
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
import { NiveauJoueurComponent } from '../../../../shared/components/niveau-joueur/niveau-joueur.component';
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
    MatSnackBarModule,
    NiveauJoueurComponent
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
    private location: Location,
    private dialog: MatDialog
  ) {}

  /** Signaler ce profil (et proposer de bloquer la personne). */
  signalerProfil(): void {
    const p: any = this.playerProfile;
    this.dialog.open(SignalementDialogComponent, {
      width: '480px', maxWidth: '96vw', autoFocus: false,
      data: { cible: 'PROFIL', cibleId: p?.userId ?? null, utilisateurId: p?.userId ?? null, utilisateurNom: p?.username }
    });
  }

  // ── Lecture « scouting » du profil ─────────────────────────────

  /** Gardien : « Gardien », « Gardien de but », « Goalkeeper »… */
  get estGardien(): boolean {
    return /gardien|goal/i.test(this.playerProfile?.poste || '');
  }

  /** Les données contiennent « M », « masculin », « F », « féminin »… */
  get estHomme(): boolean {
    return (this.playerProfile?.sexe || '').trim().toUpperCase().startsWith('M');
  }

  private ratio(total: number | undefined, matchs: number | undefined): number {
    return matchs ? Math.round(100 * (total || 0) / matchs) / 100 : 0;
  }

  get butsParMatch(): number { return this.ratio(this.playerProfile?.totalButsGlobal, this.playerProfile?.totalMatchsJoues); }
  get passesParMatch(): number { return this.ratio(this.playerProfile?.totalPassesGlobal, this.playerProfile?.totalMatchsJoues); }
  get contributionsParMatch(): number {
    return this.ratio((this.playerProfile?.totalButsGlobal || 0) + (this.playerProfile?.totalPassesGlobal || 0), this.playerProfile?.totalMatchsJoues);
  }
  get encaissesParMatch(): number { return this.ratio(this.playerProfile?.butsEncaisses, this.playerProfile?.totalMatchsJoues); }
  get tauxCleanSheets(): number {
    const m = this.playerProfile?.totalMatchsJoues || 0;
    return m ? Math.round(100 * (this.playerProfile?.cleanSheets || 0) / m) : 0;
  }

  /** Les 6 dernières saisons, de la plus ancienne à la plus récente, pour le graphique de progression. */
  get saisonsChrono(): any[] {
    const l: any[] = [...(this.playerProfile?.historiqueSaisons || [])];
    l.sort((a, b) => String(a.dateDebut || '').localeCompare(String(b.dateDebut || '')));
    return l.slice(-6);
  }

  /** Valeur de la barre : buts / passes pour un joueur de champ, clean sheets pour un gardien. */
  valeurSaison(s: any, type: 'a' | 'b'): number {
    if (this.estGardien) return type === 'a' ? (s.cleanSheets || 0) : (s.matchsJoues || 0);
    return type === 'a' ? (s.buts || 0) : (s.passes || 0);
  }

  get maxSaison(): number {
    let m = 0;
    for (const s of this.saisonsChrono) m = Math.max(m, this.valeurSaison(s, 'a'), this.valeurSaison(s, 'b'));
    return m;
  }

  hauteur(valeur: number): number {
    return this.maxSaison ? Math.max(valeur ? 6 : 0, Math.round(100 * valeur / this.maxSaison)) : 0;
  }

  /** Parcours : un résumé par club (le serveur renvoie une ligne par fiche de membre). */
  get clubs(): any[] {
    return this.playerProfile?.historiqueClubs || [];
  }

  async partager(): Promise<void> {
    const url = `${window.location.origin}/p/${this.playerProfile?.username}`;
    try {
      if (navigator.share) { await navigator.share({ title: '@' + this.playerProfile?.username, url }); return; }
      await navigator.clipboard.writeText(url);
      this.snackBar.open(t('invitation.linkCopied'), 'OK', { duration: 2000 });
    } catch { /* partage annulé */ }
  }

  signalerVideo(video: any, event: Event): void {
    event.stopPropagation();
    const p: any = this.playerProfile;
    this.dialog.open(SignalementDialogComponent, {
      width: '480px', maxWidth: '96vw', autoFocus: false,
      data: { cible: 'VIDEO', cibleId: video.id, utilisateurId: p?.userId ?? null, utilisateurNom: p?.username }
    });
  }

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
        t('ui.ts_ce_joueur_ne_possede_pas_encore__5f12'),
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