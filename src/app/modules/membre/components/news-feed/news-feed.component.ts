import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { forkJoin, Observable, BehaviorSubject, of, Subject, lastValueFrom } from 'rxjs';
import { catchError, finalize, map, switchMap, tap, takeUntil } from 'rxjs/operators';
import { Evenement } from '../../../../core/models/evenement.model';
import { Match, TypeMatch } from '../../../../core/models/match.model';
import { Contribution, ContributionIndividuelle } from '../../../../core/models/contribution.model';
import { Membre } from '../../../../core/models/membre.model';
import { Presence } from '../../../../core/models/presence.model';
import { Groupe } from '../../../../core/models/groupe.model';
import { GeneralService } from '../../../../core/services/general.service';
import { MatchService } from '../../../../core/services/match.service';
import { ContributionService } from '../../../../core/services/contribution.service';
import { MembreService } from '../../../../core/services/membre.service';
import { GroupeService } from '../../../../core/services/groupe.service';
import { Exercice, FinancesService, MouvementCaisse, TypeContribution } from '../../../../core/services/finances.service';
import { MatDialog } from '@angular/material/dialog';
import { MediaPreviewDialogComponent } from '../media-preview-dialog/media-preview-dialog.component';
import { AuthService } from '../../../../core/services/auth.service';
import { environment } from '../../../../environment';
import { MatIconModule } from '@angular/material/icon';
import { MatchPresenceDialogComponent } from '../match-presence-dialog/match-presence-dialog.component';
import { ContributionDialogComponent } from '../../../responsable/components/contribution-dialog/contribution-dialog.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from "@angular/material/menu"; 
import { TranslateModule } from '@ngx-translate/core';
import { CalendarComponent } from '../../../responsable/components/calendar/calendar.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PresenceService } from '../../../../core/services/presence.service';
import { PubliciteBannerComponent } from '../../../publicite/publicite-banner/publicite-banner.component';
import { PubliciteAffichageComponent } from '../../../publicite/publicite-affichage/publicite-affichage.component';
import { PubliciteFeedComponent } from '../../../publicite/publicite-feed/publicite-feed.component';
import { MvpVoteCardComponent } from '../mvp-vote-card/mvp-vote-card.component';
import { Announcement, AnnouncementService } from '../../../../core/services/announcement.service';

// // Interface Exercice
// interface Exercice {
//   id: number;
//   nom: string;
//   dateDebut: string;
//   dateFin: string;
//   actif: boolean;
//   cloture: boolean;
// }

@Component({
  selector: 'app-news-feed',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatExpansionModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatTooltipModule,
   MvpVoteCardComponent,
    MatMenuModule,
    TranslateModule,
     PubliciteBannerComponent,
    PubliciteAffichageComponent,
    PubliciteFeedComponent
  ],
  templateUrl: './news-feed.component.html',
  styleUrls: ['./news-feed.component.scss']
})
export class NewsFeedComponent implements OnInit, OnDestroy {
  
  private destroy$ = new Subject<void>();
  
    // ✅ AJOUT: Ville pour ciblage publicitaire
    public canShowFeedAd = false;
  userVille: string | undefined;
  isLoading: boolean = true;
  currentEvents: Evenement[] = [];
  recentMatches: Match[] = [];
  ongoingContributions: { contribution: TypeContribution; individuelles: any[] }[] = [];
  upcomingBirthdays: { membre: Membre; date: Date }[] = [];
  groupAnnouncements: Announcement[] = [];
  topScorers: { membre: Membre; buts: number }[] = [];
  topPassers: { membre: Membre; passes: number }[] = [];
  allMembres$: Observable<Membre[]>;
  allPresences$: BehaviorSubject<Presence[]> = new BehaviorSubject<Presence[]>([]);
  apiBaseUrl = environment.apiUrl;
  mediaBlobUrls: { [key: string]: { url: string; type: string } } = {};
  mediaLoadingErrors: { [key: string]: boolean } = {};
  allPresences: Presence[] = [];
  showAllMatches: boolean = false;
  allMatches: Match[] = [];
  allMembresValue: Membre[]=[]
  
  // Groupe actif pour les matchs amicaux
  groupeActif: Groupe | null = null;
    groupeId: number | null = null;
    
  
  // ✅ NOUVEAU: Exercice en cours
  exerciceEnCours: Exercice | null = null;
  exerciceId: number | undefined 
  exerciceDateDebut: Date | null = null;
  exerciceDateFin: Date | null = null;
  isOpeningDialog = false;

  constructor(
    private generalService: GeneralService,
    private matchService: MatchService,
    private contributionService: ContributionService,
    private membreService: MembreService,
    private groupeService: GroupeService,
    private financesService: FinancesService,
    private authService: AuthService,
    private presenceService: PresenceService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private financeService: FinancesService,
    private announcementService: AnnouncementService

  ) {
    this.allMembres$ = this.membreService.getAllMembres();
  }

  ngOnInit(): void {
    this.groupeId = this.authService.getGroupe();
    this.loadGroupeAndExercice();
    this.loadAnnouncements();
  }

    loadAnnouncements(): void {
    if (!this.groupeId) return;
    this.announcementService.getByGroupe(this.groupeId).subscribe({
      next: (data) => {
        this.groupAnnouncements = data;
      
      },
      error: (err) => console.error('Erreur lors du chargement des actualités', err)
    });
  }



  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.allPresences$.complete();
    Object.values(this.mediaBlobUrls).forEach(({ url }) => window.URL.revokeObjectURL(url));
  }

  // ===== CHARGEMENT DU GROUPE ET DE L'EXERCICE EN COURS =====
  
  private loadGroupeAndExercice(): void {
    const userId = this.authService.getUserId();
    const groupeId = this.authService.getGroupe();

   
    
    if (!userId || !groupeId) {
      console.error('User ID ou Groupe ID non trouvé');
      this.loadFeedData();
      return;
    }

    // Charger le groupe et l'exercice en parallèle
    forkJoin({
      groupe: this.groupeService.getGroupe(userId),
      exercice: this.financesService.getExerciceActif(groupeId).pipe(
        catchError(err => {
          console.warn('Pas d\'exercice actif trouvé:', err);
          return of(null);
        })
      )
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: ({ groupe, exercice }) => {
        this.groupeActif = groupe;
        
        if (exercice) {
          this.exerciceEnCours = exercice;
          this.exerciceId=exercice.id
          this.exerciceDateDebut = new Date(exercice.dateDebut);
          this.exerciceDateFin = new Date(exercice.dateFin);
          
          console.log('Exercice en cours:', exercice.libelle);
          console.log('Période:', this.exerciceDateDebut, '-', this.exerciceDateFin);
        }

          if (groupe?.ville) {
          this.userVille = groupe.ville.nom;
        }
        
        this.loadFeedData();
      },
      error: (err) => {
        console.error('Erreur chargement groupe/exercice:', err);
        this.loadFeedData();
      }
    });
  }

  // ===== MÉTHODE CLÉ: Vérifier si une date est dans l'exercice en cours =====
  
  private isDateInCurrentExercice(date: Date | string): boolean {
    if (!this.exerciceDateDebut || !this.exerciceDateFin) {
      return true; // Si pas d'exercice défini, tout afficher
    }
    
    const checkDate = typeof date === 'string' ? new Date(date) : date;
    checkDate.setHours(0, 0, 0, 0);
    
    const start = new Date(this.exerciceDateDebut);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(this.exerciceDateFin);
    end.setHours(23, 59, 59, 999);
    
    return checkDate >= start && checkDate <= end;
  }

  // ===== MÉTHODE CLÉ: Obtenir les noms d'équipes selon le type de match =====

  getEquipeNames(match: any): [string, string] {
    if (!match || !match.typeMatch) return ['Équipe 1', 'Équipe 2'];
    switch (match.typeMatch) {
      case 'INTERNE':
      case 'DUEL':
        return [
          match.equipe1Nom || 'Équipe 1',
          match.equipe2Nom || 'Équipe 2'
        ];

      case 'AMICAL':
        const localeName = this.groupeActif?.abreviation || this.groupeActif?.nom || 'Locale';
        let adversaireName = 'Adverse';
        
        if (match.groupeAdverse) {
          adversaireName = match.groupeAdverse.abreviation || match.groupeAdverse.nom;
        } else if (match.equipe2Nom) {
          adversaireName = match.equipe2Nom;
        }
        
        return [localeName, adversaireName];

      case 'ANNIVERSAIRE':
        return ['Équipe Fêtés', 'Équipe Adverses'];

      default:
        return ['Équipe 1', 'Équipe 2'];
    }
  }

  // ===== MÉTHODE: Obtenir le titre du match =====

  getMatchTitle(match: Match): string {
    if (!match || !match.typeMatch) return 'Match';



    const [team1, team2] = this.getEquipeNames(match);

    switch (match.typeMatch) {
      case 'INTERNE':
      case 'DUEL':
      case 'AMICAL':
        return `${team1} vs ${team2}`;

      case 'ANNIVERSAIRE':
        const fetes = match.membresAnniversaire?.map(m => m.prenom).join(', ') || '';
        return fetes ? `Anniversaire de ${fetes}` : 'Match Anniversaire';

      default:
        return `${team1} vs ${team2}`;
    }
  }

  // ===== MÉTHODE: Obtenir le label du type de match =====

  getTypeMatchLabel(type: TypeMatch | undefined): string {
    if (!type) return 'Match';
    const labels: Record<TypeMatch, string> = {
      'INTERNE': 'Match Interne',
      'DUEL': 'Duel',
      'AMICAL': 'Match Amical',
      'ANNIVERSAIRE': 'Match Anniversaire'
    };
    return labels[type] || 'Match';
  }

  // ===== FILTRER LES MATCHS RÉCENTS (MODIFIÉ POUR EXERCICE) =====
  
  private filterAndSortRecentMatches(matches: Match[], allPresences: Presence[], today: Date): Match[] {
    const playedMatchIds = new Set<number>();
    
    for (const p of allPresences) {
      if (p.aJoue === true && p.match?.id) {
        playedMatchIds.add(p.match.id);
      }
    }

    // Filtrer par exercice en cours si disponible
    const startDate = this.exerciceDateDebut || new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000);
    const endDate = this.exerciceDateFin || today;
    
    return matches
      .filter(m => {
        const matchDate = new Date(m.dateMatch);
        
        // Le match doit être dans l'exercice en cours
        const isInExercice = this.isDateInCurrentExercice(matchDate);
        
        // Le match doit avoir été joué
        const hasBeenPlayed = playedMatchIds.has(m.id);
        
        // Le match ne doit pas être dans le futur
        const isNotFuture = matchDate <= today;
        
        return isInExercice && hasBeenPlayed && isNotFuture;
      })
      .sort((a, b) => new Date(b.dateMatch).getTime() - new Date(a.dateMatch).getTime());
  }

  get matchesToDisplay(): Match[] {
    if (this.showAllMatches) {
      return this.recentMatches;
    } else if (this.recentMatches.length > 0) {
      return [this.recentMatches[0]];
    }
    return [];
  }

  toggleDisplay(): void {
    this.showAllMatches = !this.showAllMatches;
  }

  

  

  // ===== CHARGEMENT DES DONNÉES (MODIFIÉ POUR EXERCICE) =====
  
 loadFeedData(): void {
  this.isLoading = true;
  this.ongoingContributions = [];

  const mainData$ = forkJoin({
    events: this.generalService.getAllEvenements(),
    matches: this.matchService.getAllMatches(),
    contributions: this.financeService.getTypesContributionByExercice(this.exerciceId),
    membres: this.membreService.getAllMembres(),
    presences: this.matchService.getAllPresences()
  });

  mainData$.pipe(
    // 1. Mise à jour des sujets et stockage local des membres pour getStaticMembreName
    tap(({ presences, membres }) => {
      this.allPresences$.next(presences);
      // On s'assure que la liste des membres est disponible pour les fonctions synchrones
      this.allMembresValue = membres; 
    }),

    // 2. Traitement des données et déclenchement des appels imbriqués pour les contributions
    switchMap(({ events, matches, contributions, membres, presences }) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // --- FILTRAGE ÉVÉNEMENTS & MATCHS ---
      this.currentEvents = events.filter(e => {
        const eventDate = new Date(e.dateEvenement);
        return e.estContributionOuverte && eventDate <= today && this.isDateInCurrentExercice(eventDate);
      });

      this.recentMatches = this.filterAndSortRecentMatches(matches, presences, today);
      this.allMatches = matches.filter(m => this.isDateInCurrentExercice(m.dateMatch));

      // --- ANNIVERSAIRES (Les 10 prochains) ---
      this.upcomingBirthdays = membres
        .filter(m => !!m.dateNaissance)
        .map(m => {
          const birthDate = new Date(m.dateNaissance);
          let nextBirthDate = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
          if (nextBirthDate < today) nextBirthDate.setFullYear(today.getFullYear() + 1);
          return { membre: m, date: nextBirthDate };
        })
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .slice(0, 10);

      // --- TOP SCORERS & PASSERS ---
      const presencesExercice = presences.filter(p => p.match?.dateMatch && this.isDateInCurrentExercice(p.match.dateMatch));
      this.calculateStats(presencesExercice, membres);

      // --- GESTION DES CONTRIBUTIONS (Flux réactif propre) ---
      const activeContribs = contributions.filter(c => c.actif === true);
      
      if (activeContribs.length === 0) {
        return of({ recentMatches: this.recentMatches, contributions: [] });
      }

      const contribObservables = activeContribs.map(contrib => 
        this.financeService.getHistoriqueContrib(contrib.id || 0).pipe(
          map(individuelles => ({
            contribution: contrib,
            // ON MAPPE LE NOM ICI POUR ÉVITER LE BLANC DANS LE HTML
            individuelles: individuelles.map(indiv => ({
              ...indiv,
              displayName: this.getStaticMembreName(indiv.membre)
            }))
          }))
        )
      );

      return forkJoin(contribObservables).pipe(
        map(results => ({ recentMatches: this.recentMatches, contributions: results }))
      );
    }),

    // 3. Préchargement des médias après avoir récupéré les contributions
    switchMap(({ recentMatches, contributions }) => {
      this.ongoingContributions = contributions;
      const token = this.authService.getToken();
      
      if (!token || !recentMatches.length) return of(null);

      const mediaObservables: Observable<any>[] = [];
      recentMatches.forEach(match => {
        match.mediaUrls?.forEach(mediaUrl => {
          if (!this.mediaBlobUrls[mediaUrl] && !this.mediaLoadingErrors[mediaUrl]) {
            mediaObservables.push(this.preloadMedia(mediaUrl, token));
          }
        });
      });

      return mediaObservables.length > 0 ? forkJoin(mediaObservables).pipe(catchError(() => of(null))) : of(null);
    }),

    finalize(() => this.isLoading = false)
  ).subscribe({
    error: (err) => console.error('Erreur News Feed:', err)
  });
}

// --- MÉTHODES UTILITAIRES ---

private calculateStats(presences: any[], membres: any[]): void {
  // On change le type de scorerMap pour stocker un objet avec le détail
  const scorerMap = new Map<number, { buts: number, penalti: number }>();
  const passerMap = new Map<number, number>();

  presences.forEach(p => {
    if (p.membre?.id) {
      // --- Gestion des Buteurs ---
      const currentStats = scorerMap.get(p.membre.id) || { buts: 0, penalti: 0 };
      scorerMap.set(p.membre.id, {
        buts: currentStats.buts + (p.buts || 0),
        penalti: currentStats.penalti + (p.penalti || 0)
      });

      // --- Gestion des Passeurs ---
      passerMap.set(p.membre.id, (passerMap.get(p.membre.id) || 0) + (p.passes || 0));
    }
  });

  // Transformation et Tri des Buteurs
  this.topScorers = Array.from(scorerMap.entries())
    .map(([id, stats]) => {
      const membre = membres.find(m => m.id === id);
      return {
        membre: membre!,
        buts: stats.buts + stats.penalti,
        penalties: stats.penalti,
        total: stats.buts + stats.penalti // Cumul pour le classement
      };
    })
    .filter(s => s.membre && s.total > 0)
    .sort((a, b) => b.total - a.total) // On trie par le total (buts + pen)
    .slice(0, 5);

  // Top Passeurs (inchangé)
  this.topPassers = Array.from(passerMap.entries())
    .map(([id, passes]) => ({ membre: membres.find(m => m.id === id)!, passes }))
    .filter(p => p.membre && p.passes > 0)
    .sort((a, b) => b.passes - a.passes)
    .slice(0, 5);
}

private preloadMedia(url: string, token: string): Observable<any> {
  return new Observable(observer => {
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.blob() : Promise.reject())
      .then(blob => {
        this.mediaBlobUrls[url] = { url: window.URL.createObjectURL(blob), type: blob.type };
        observer.next(null);
        observer.complete();
      })
      .catch(() => {
        this.mediaLoadingErrors[url] = true;
        observer.next(null);
        observer.complete();
      });
  });
}

getStaticMembreName(membreObj: any): string {
  const id = membreObj?.id || membreObj;
  const m = this.allMembresValue?.find((member: any) => member.id === id);
  return m ? `${m.prenom} ${m.nom}` : 'Membre inconnu';
}

  // ===== MÉTHODE: Calcul du score =====

  getScore(match: Match): string {
    let team1Score = match.scoreEquipe1;
    let team2Score = match.scoreEquipe2;
    return `${team1Score} - ${team2Score}`;
  }

  // ===== MÉTHODE: Liste des buteurs =====

getButeurs(match: Match): string {
  const presences = this.allPresences$.value;
  const matchPresences = presences.filter(p => p.match?.id === match.id);
  
  const buteursList: string[] = [];

  matchPresences.forEach(p => {
    // 1. Détermination du nom (Occasionnel prioritaire, puis Membre, sinon Inconnu)
    const displayName = p.nomOccasionnel 
      ? p.nomOccasionnel 
      : (p.membre ? `${p.membre.prenom} ${p.membre.nom}` : 'Joueur inconnu');

    const totalButs = (p.buts || 0) + (p.penalti || 0);

    // 2. Gestion des buts classiques et penalties
    if (totalButs > 0) {
      let butsDetails = `${p.buts || 0}`;
      if ((p.penalti || 0) > 0) {
        butsDetails += (p.buts || 0) > 0 ? `, ${p.penalti}p` : `${p.penalti}p`;
      }
      
      const details = `(${butsDetails}) - ${p.equipeMatch}`;
      buteursList.push(`${displayName} ${details}`);
    }
    
    // 3. Gestion des buts contre son camp (BCSC)
    if ((p.butsContreSonCamp || 0) > 0) {
      buteursList.push(`${displayName} (BCSC) - ${p.equipeMatch}`);
    }
  });

  return buteursList.length > 0 ? buteursList.join(', ') : 'Aucun buteur';
}
  // ===== MÉTHODE: Liste des passeurs =====

getPasseurs(match: Match): string {
  const presences = this.allPresences$.value;
  
  const passeurs = presences
    .filter(p => p.match?.id === match.id && (p.passes || 0) > 0)
    .map(p => {
      // Priorité au nom occasionnel, sinon prénom + nom du membre
      const displayName = p.nomOccasionnel 
        ? p.nomOccasionnel 
        : (p.membre ? `${p.membre.prenom} ${p.membre.nom}` : 'Joueur inconnu');
        
      return `${displayName} (${p.passes}) - ${p.equipeMatch}`;
    });

  return passeurs.length > 0 ? passeurs.join(', ') : 'Aucun passeur';
}

  // ===== MÉTHODE: Homme du match =====

getHommeDuMatch(match: Match): string {
  const presences = this.allPresences$.value;
  const found = presences.find(p => p.match?.id === match.id && p.estHommeDuMatch);
  
  if (!found) return 'Non défini';

  return found.nomOccasionnel 
    ? found.nomOccasionnel 
    : (found.membre ? `${found.membre.prenom} ${found.membre.nom}` : 'Inconnu');
}


  private getDisplayName(p: any): string {
  if (p.nomOccasionnel) return p.nomOccasionnel;
  if (p.membre) return `${p.membre.prenom || ''} ${p.membre.nom || ''}`.trim();
  return 'Joueur inconnu';
}

  getTotalContributions(contribution: Contribution): number {
    const individuelles = this.contributionService.getContributionsIndividuellesById(contribution.id || 0) || [];
    return individuelles.reduce((sum: number, c: { montant: any; }) => sum + (c.montant || 0), 0);
  }

  openMediaPreview(match: Match, mediaUrl: string): void {
    this.dialog.open(MediaPreviewDialogComponent, {
      data: {
        mediaUrl: mediaUrl,
        isImage: this.isImageUrl(mediaUrl),
        isVideo: this.isVideoUrl(mediaUrl),
        matchId: match.id,
        allMediaUrls: match.mediaUrls
      },
      panelClass: 'media-preview-dialog',
      maxWidth: '95vw',
      maxHeight: '95vh'
    });
  }

  downloadMedia(match: Match): void {
    if (match.mediaUrls && Array.isArray(match.mediaUrls) && match.mediaUrls.length > 0) {
      match.mediaUrls.forEach((url, index) => {
        if (url && typeof url === 'string') {
          const fullMediaUrl = `${this.apiBaseUrl}${url}`;
          const token = this.authService.getToken();
          const link = document.createElement('a');
          link.href = fullMediaUrl;
          if (token) {
            fetch(fullMediaUrl, {
              headers: { Authorization: `Bearer ${token}` }
            })
              .then(response => response.blob())
              .then(blob => {
                const urlObj = window.URL.createObjectURL(blob);
                link.href = urlObj;
                const fileExtension = url.includes('.') ? url.slice(url.lastIndexOf('.')) : '.jpg';
                link.download = `media_match_${match.id}_${index}${fileExtension}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(urlObj);
              })
              .catch(err => console.error('Erreur de téléchargement:', err));
          } else {
            const fileExtension = url.includes('.') ? url.slice(url.lastIndexOf('.')) : '.jpg';
            link.download = `media_match_${match.id}_${index}${fileExtension}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        }
      });
    }
  }

  private getMediaTypeFromUrl(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase() || '';
    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return 'image';
      case 'mp4':
      case 'mov':
      case 'webm':
        return 'video';
      case 'pdf':
        return 'application/pdf';
      default:
        return 'unknown';
    }
  }


//  async openPresenceDialog(match: Match): Promise<void> {
//   // 1. On récupère les données avant (le dialogue ne s'ouvre pas encore)
//   const presencesRecues = await this.getPresenceByMatch(match);
  
//   // 2. On ouvre le dialogue avec les données réelles
//   this.dialog.open(MatchPresenceDialogComponent, {
//     width: '800px',
//     maxWidth: '95vw',
//     maxHeight: '90vh',
//     data: {
//       match: match,
//       presences: presencesRecues, // Ici c'est un Presence[] et non une Promise
//       equipeNames: this.getEquipeNames(match)
//     },
//     panelClass: 'modern-dialog',
//     autoFocus: false
//   });
// }

async openPresenceDialog(match: Match): Promise<void> {
 if (this.isOpeningDialog) return;

  this.isOpeningDialog = true; // Active le spinner sur le bouton
  try {
    const presencesRecues = await this.getPresenceByMatch(match);
    this.dialog.open(MatchPresenceDialogComponent, { width: '800px',
    maxWidth: '95vw',
    maxHeight: '90vh',
    data: {
      match: match,
      presences: presencesRecues, // Ici c'est un Presence[] et non une Promise
      equipeNames: this.getEquipeNames(match)
    },
    panelClass: 'modern-dialog',
    autoFocus: false });
  } finally {
    this.isOpeningDialog = false; // Désactive le spinner

  }}

 async getPresenceByMatch(match: Match): Promise<Presence[]> {
  if (!match?.id) return [];
  
  try {

    const presences = await lastValueFrom(this.presenceService.getPresencesByMatch(this.groupeActif?.id, match.id));
    return presences;
  } catch (error) {
    console.error('Erreur de récupération', error);
    return [];
  }
}

// getPresenceByMatch(match: Match): void {
//   if (!match?.id) return;

//   this.presenceService.getPresencesByMatch(match.groupe.id, match.id).subscribe({
//     next: (data) => {
//       this.presences = data;
//       console.log('Présences récupérées', data);
//     },
//     error: (err) => console.error('Erreur lors de la récupération', err)
//   });
// }

  


  viewContributions(contributionId: number) {
    this.financeService.getMouvementsByContribution(contributionId).subscribe({
      next: (contributions: any[]) => {
        const groupedMap = new Map<number, {
          montant: number,
          membre: {
            id: number,
            nom: string,
            prenom: string,
            tel?: string,
            adresse?: string,
            email?: string,
            poste?: string
          }
        }>();
 
        for (const c of contributions) {
          const membre = c.membre;
          if (!membre?.id) continue;
 
          const montant = c.montant ?? 0;
 
          if (!groupedMap.has(membre.id)) {
            groupedMap.set(membre.id, {
              montant,
              membre: {
                id: membre.id,
                nom: membre.nom?.trim() ?? '',
                prenom: membre.prenom?.trim() ?? '',
                tel: membre.tel,
                adresse: membre.adresse,
                email: membre.email,
                poste: membre.poste
              }
            });
          } else {
            const existing = groupedMap.get(membre.id)!;
            existing.montant += montant;
          }
        }
 
        const formattedContributions = Array.from(groupedMap.values());
        formattedContributions.sort((a, b) => b.montant - a.montant);
 
        const total = formattedContributions.reduce((sum, c) => sum + c.montant, 0);
 
        this.dialog.open(ContributionDialogComponent, {
          width: '600px',
          data: {
            contributions: formattedContributions,
            total
          }
        });
      },
 
      error: (err: any) => {
        console.error('Erreur lors du chargement des contributions:', err);
        this.dialog.open(ContributionDialogComponent, {
          width: '600px',
          data: {
            contributions: [],
            total: 0
          }
        });
      }
    });
  }

  isImageUrl(url: string): boolean {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    
    if (lowerUrl.match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/)) {
      return true;
    }
    
    if (lowerUrl.includes('/image/upload/') || lowerUrl.includes('/image/')) {
      return true;
    }
    
    return !this.isVideoUrl(url);
  }

  isVideoUrl(url: string): boolean {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    
    if (lowerUrl.match(/\.(mp4|mov|avi|webm)(\?.*)?$/)) {
      return true;
    }
    
    if (lowerUrl.includes('/video/upload/') || lowerUrl.includes('/video/')) {
      return true;
    }
    
    return false;
  }

  // Méthode pour ouvrir le calendrier depuis news-feed
  openCalendar(): void {
    const matches = this.allMatches.length > 0 ? this.allMatches : this.recentMatches;
    
    if (!matches || matches.length === 0) {
      this.matchService.getAllMatches().subscribe({
        next: (loadedMatches) => {
          // Filtrer par exercice en cours
          const filteredMatches = loadedMatches.filter(m => this.isDateInCurrentExercice(m.dateMatch));
          this.openCalendarDialog(filteredMatches);
        },
        error: () => {
          this.snackBar.open('Impossible de charger les matchs', 'Fermer', { duration: 3000 });
        }
      });
      return;
    }
    
    this.openCalendarDialog(matches);
  }

  private openCalendarDialog(matches: Match[]): void {
    const sortedMatches = [...matches].sort((a, b) => 
      new Date(a.dateMatch).getTime() - new Date(b.dateMatch).getTime()
    );

    this.dialog.open(CalendarComponent, {
      width: '95vw',
      maxWidth: '900px',
      height: '85vh',
      maxHeight: '700px',
      panelClass: 'calendar-dialog',
      data: { 
        matches: sortedMatches,
        jourDeMatch: this.groupeActif?.jourMatch || 'Dimanche',
        groupeActif: this.groupeActif,
        exerciceEnCours: this.exerciceEnCours
      }
    });
  }
  
  // ===== GETTER: Nom de l'exercice en cours =====
  
  get exerciceNom(): string {
    return this.exerciceEnCours?.libelle || 'Saison en cours';
  }
  
  // ===== GETTER: Période de l'exercice formatée =====
  
  get exercicePeriode(): string {
    if (!this.exerciceEnCours) return '';
    
    const debut = new Date(this.exerciceEnCours.dateDebut).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const fin = new Date(this.exerciceEnCours.dateFin).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    
    return `${debut} - ${fin}`;
  }
}
