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
import { Announcement } from '../../../../core/models/announcement.model';
import { Groupe } from '../../../../core/models/groupe.model';
import { GeneralService } from '../../../../core/services/general.service';
import { MatchService } from '../../../../core/services/match.service';
import { ContributionService } from '../../../../core/services/contribution.service';
import { MembreService } from '../../../../core/services/membre.service';
import { GroupeService } from '../../../../core/services/groupe.service';
import { Exercice, FinancesService } from '../../../../core/services/finances.service';
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
    
    MatMenuModule,
    TranslateModule
  ],
  templateUrl: './news-feed.component.html',
  styleUrls: ['./news-feed.component.scss']
})
export class NewsFeedComponent implements OnInit, OnDestroy {
  
  private destroy$ = new Subject<void>();
  
  isLoading: boolean = true;
  currentEvents: Evenement[] = [];
  recentMatches: Match[] = [];
  ongoingContributions: { contribution: Contribution; individuelles: ContributionIndividuelle[] }[] = [];
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
  
  // Groupe actif pour les matchs amicaux
  groupeActif: Groupe | null = null;
  
  // ✅ NOUVEAU: Exercice en cours
  exerciceEnCours: Exercice | null = null;
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
    private snackBar: MatSnackBar
  ) {
    this.allMembres$ = this.membreService.getAllMembres();
  }

  ngOnInit(): void {
    this.loadGroupeAndExercice();
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
          this.exerciceDateDebut = new Date(exercice.dateDebut);
          this.exerciceDateFin = new Date(exercice.dateFin);
          
          console.log('Exercice en cours:', exercice.libelle);
          console.log('Période:', this.exerciceDateDebut, '-', this.exerciceDateFin);
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
        } else if (match.nomAdversaireManuel) {
          adversaireName = match.nomAdversaireManuel;
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

    const mainData$ = forkJoin({
      events: this.generalService.getAllEvenements(),
      matches: this.matchService.getAllMatches(),
      contributions: this.contributionService.getAllContributions(),
      membres: this.membreService.getAllMembres(),
      presences: this.matchService.getAllPresences()
    });

    mainData$.pipe(
      tap(({ presences }) => this.allPresences$.next(presences)),

      map(({ events, matches, contributions, membres, presences }) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const typedMembres: Membre[] = membres;
        const typedPresences: Presence[] = presences;
        const typedContributions: Contribution[] = contributions;
        
        // ✅ FILTRER les événements par exercice en cours
        this.currentEvents = events.filter(e => {
          const eventDate = new Date(e.dateEvenement);
          return e.estContributionOuverte && 
                 eventDate <= today && 
                 this.isDateInCurrentExercice(eventDate);
        });
        
        // ✅ FILTRER les matchs par exercice en cours
        this.recentMatches = this.filterAndSortRecentMatches(matches, presences, today);
        this.allMatches = matches.filter(m => this.isDateInCurrentExercice(m.dateMatch));

        // ✅ FILTRER les contributions par exercice en cours
        this.ongoingContributions = typedContributions
          .filter(contrib => {
            const delaiDate = new Date(contrib.delaiContribution);
            return delaiDate >= today && this.isDateInCurrentExercice(contrib.delaiContribution);
          })
          .map(contrib => ({
            contribution: contrib,
            individuelles: Array.isArray(this.contributionService.getContributionsIndividuellesById(contrib.id || 0)) 
              ? this.contributionService.getContributionsIndividuellesById(contrib.id || 0) 
              : []
          }));
        
        // Anniversaires (pas de filtre exercice - toujours pertinent)
        this.upcomingBirthdays = typedMembres
            .filter(m => !!m.dateNaissance)
            .map(m => {
                const birthDate = new Date(m.dateNaissance);
                const nextBirthDate = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
                nextBirthDate.setHours(0, 0, 0, 0);
                
                if (nextBirthDate < today) {
                    nextBirthDate.setFullYear(today.getFullYear() + 1);
                }
                
                return { membre: m, date: nextBirthDate };
            })
            .filter(b => {
                const thirtyDaysLater = new Date(today);
                thirtyDaysLater.setDate(today.getDate() + 30);
                return b.date >= today && b.date <= thirtyDaysLater;
            })
            .sort((a, b) => a.date.getTime() - b.date.getTime());
        
        this.groupAnnouncements = [];
        
        // ✅ CALCULER LES STATS UNIQUEMENT SUR L'EXERCICE EN COURS
        const presencesExercice = typedPresences.filter(p => {
          if (!p.match?.dateMatch) return false;
          return this.isDateInCurrentExercice(p.match.dateMatch);
        });
        
        const scorerMap = new Map<number, number>();
        const passerMap = new Map<number, number>();
        
        presencesExercice.forEach(p => {
          if (p.membre?.id) {
            scorerMap.set(p.membre.id, (scorerMap.get(p.membre.id) || 0) + (p.buts || 0));
            passerMap.set(p.membre.id, (passerMap.get(p.membre.id) || 0) + (p.passes || 0));
          }
        });
        
        this.topScorers = Array.from(scorerMap.entries())
          .map(([id, buts]) => ({ membre: typedMembres.find(m => m.id === id)!, buts }))
          .filter(s => s.membre && s.buts > 0)
          .sort((a, b) => b.buts - a.buts)
          .slice(0, 5);
          
        this.topPassers = Array.from(passerMap.entries())
          .map(([id, passes]) => ({ membre: typedMembres.find(m => m.id === id)!, passes }))
          .filter(p => p.membre && p.passes > 0)
          .sort((a, b) => b.passes - a.passes)
          .slice(0, 5);

        return this.recentMatches;
      }),

      switchMap((recentMatches: Match[]) => {
        const token = this.authService.getToken();
        if (!token || !recentMatches.length) {
          return of(null);
        }

        const mediaObservables: Observable<any>[] = [];

        recentMatches.forEach(match => {
          match.mediaUrls?.forEach(mediaUrl => {
            const fullMediaUrl = `${mediaUrl}`;

            if (!this.mediaBlobUrls[fullMediaUrl] && !this.mediaLoadingErrors[fullMediaUrl]) {
              const fetch$ = new Observable(observer => {
                fetch(fullMediaUrl, {
                  headers: { Authorization: `Bearer ${token}` }
                })
                .then(response => {
                  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                  return response.blob();
                })
                .then(blob => {
                  const contentType = blob.type || this.getMediaTypeFromUrl(mediaUrl);
                  this.mediaBlobUrls[fullMediaUrl] = { url: window.URL.createObjectURL(blob), type: contentType };
                  observer.next(null);
                  observer.complete();
                })
                .catch(err => {
                  console.error(`Erreur de préchargement pour ${fullMediaUrl}:`, err);
                  this.mediaLoadingErrors[fullMediaUrl] = true;
                  observer.next(null);
                  observer.complete();
                });
              });
              mediaObservables.push(fetch$);
            }
          });
        });

        return mediaObservables.length > 0 ? forkJoin(mediaObservables).pipe(catchError(() => of(null))) : of(null);
      }),

      finalize(() => this.isLoading = false)
      
    ).subscribe({
      error: (err) => {
        console.error('Erreur globale lors du chargement du fil d\'actualités:', err);
      }
    });
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

  getMembreName(id: number): Observable<string> {
    return this.allMembres$.pipe(
      map(membres => {
        const membre = membres.find(m => m.id === id);
        return membre ? `${membre.prenom} ${membre.nom}` : 'Membre non trouvé';
      })
    );
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
    console.log(match)
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
    this.generalService.getContributionIndividuellesByContributionId(contributionId).subscribe({
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
