import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { forkJoin, Observable, BehaviorSubject, of } from 'rxjs';
import { catchError, finalize, map, switchMap, tap } from 'rxjs/operators';
import { Evenement } from '../../../../core/models/evenement.model';
import { Match } from '../../../../core/models/match.model';
import { Contribution, ContributionIndividuelle } from '../../../../core/models/contribution.model';
import { Membre } from '../../../../core/models/membre.model';
import { Presence } from '../../../../core/models/presence.model';
import { Announcement } from '../../../../core/models/announcement.model';
import { GeneralService } from '../../../../core/services/general.service';
import { MatchService } from '../../../../core/services/match.service';
import { ContributionService } from '../../../../core/services/contribution.service';
import { MembreService } from '../../../../core/services/membre.service';
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
    imageUrl = environment.imageUrl;
  mediaBlobUrls: { [key: string]: { url: string; type: string } } = {};
    mediaLoadingErrors: { [key: string]: boolean } = {};
    allPresences: Presence[] = [];
    showAllMatches: boolean = false; 

  constructor(
    private generalService: GeneralService,
    private matchService: MatchService,
    private contributionService: ContributionService,
    private membreService: MembreService,
    private authService: AuthService,
    private dialog: MatDialog
  ) {
    this.allMembres$ = this.membreService.getAllMembres();
  }

  ngOnInit(): void {
    this.loadFeedData();
    this.preloadMediaUrls();
  }

  ngOnDestroy(): void {
    // Nettoyage des souscriptions si nécessaire (ici géré par BehaviorSubject)
    this.allPresences$.complete();
     Object.values(this.mediaBlobUrls).forEach(({ url }) => window.URL.revokeObjectURL(url));
  }

private filterAndSortRecentMatches(matches: Match[], allPresences: Presence[], today: Date): Match[] {
    
    // 1. Déterminer les IDs de tous les Matchs qui ont été effectivement joués.
    const playedMatchIds = new Set<number>();
    
    for (const p of allPresences) {
        // Vérifie si la présence a activement joué ET si l'objet match est bien défini
        if (p.aJoue === true && p.match?.id) {
            playedMatchIds.add(p.match.id);
        }
    }

    // Calculer la date limite (30 jours en arrière)
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 60);
    
    // 2. Filtrer l'array principal des Matchs
    return matches
        .filter(m => {
            const matchDate = new Date(m.dateMatch);
            
            // a. Vérification de la date : Le match est-il récent (dans les 30 derniers jours)?
            const isRecent = matchDate >= thirtyDaysAgo && matchDate <= today;

            // b. Vérification de la participation : L'ID du match est-il dans la liste des matchs joués?
            const hasBeenPlayed = playedMatchIds.has(m.id);

            // 3. Inclure le match s'il est récent ET a été joué
            return isRecent && hasBeenPlayed;
        })
        .sort((a, b) => new Date(b.dateMatch).getTime() - new Date(a.dateMatch).getTime());
}

  get matchesToDisplay(): Match[] {
        if (this.showAllMatches) {
            // Si VRAI, on affiche tout
            return this.recentMatches;
        } else if (this.recentMatches.length > 0) {
            // Si FAUX, on affiche seulement le premier match
            return [this.recentMatches[0]];
        }
        // S'il n'y a pas de matchs, retourne un array vide
        return [];
    }

       toggleDisplay(): void {
        this.showAllMatches = !this.showAllMatches;
    }
loadFeedData(): void {
    this.isLoading = true;

    // Définir la source des données principales (les 5 appels en parallèle)
    const mainData$ = forkJoin({
        events: this.generalService.getAllEvenements(),
        matches: this.matchService.getAllMatches(),
        contributions: this.contributionService.getAllContributions(),
        membres: this.membreService.getAllMembres(),
        presences: this.matchService.getAllPresences()
    });

    mainData$.pipe(
        // 1. Gérer les présences immédiatement
        tap(({ presences }) => this.allPresences$.next(presences)),

        // 2. Traitement des données et affectation des propriétés
        map(({ events, matches, contributions, membres, presences }) => {
            const today = new Date();
            const typedMembres: Membre[] = membres;
            const typedPresences: Presence[] = presences;
            const typedContributions: Contribution[] = contributions;
            
            // Logique de filtrage et tri (synchrone)
            this.currentEvents = events.filter(e => e.estContributionOuverte && new Date(e.dateEvenement) <= today);

            // Supposons que 'matches' est la liste complète des matchs, et que 'today' est une date Date()
            this.recentMatches = this.filterAndSortRecentMatches(matches, presences, new Date());
            // Correction de la gestion des contributions individuelles (assumons que c'est synchrone)
            this.ongoingContributions = typedContributions
                .map(contrib => ({
                    contribution: contrib,
                    // S'assurer que getContributionsIndividuellesById retourne toujours un tableau []
                    individuelles: Array.isArray(this.contributionService.getContributionsIndividuellesById(contrib.id || 0)) 
                        ? this.contributionService.getContributionsIndividuellesById(contrib.id || 0) 
                        : []
                }))
                .filter(c => new Date(c.contribution.delaiContribution) >= today);

            // ... (Logique pour Upcoming Birthdays) ...
            this.upcomingBirthdays = typedMembres
                .map(m => {
                    const birthDate = new Date(m.dateNaissance);
                    const nextBirthDate = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
                    if (nextBirthDate < today) nextBirthDate.setFullYear(today.getFullYear() + 1);
                    return { membre: m, date: nextBirthDate };
                })
                .filter(b => {
                    const thirtyDaysLater = new Date(today);
                    thirtyDaysLater.setDate(today.getDate() + 30);
                    return b.date >= today && b.date <= thirtyDaysLater;
                });
            
            this.groupAnnouncements = []; // Tâche à faire
            
            // Logique Top Scorers / Passers
            const scorerMap = new Map<number, number>();
            const passerMap = new Map<number, number>();
            typedPresences.forEach(p => {
                scorerMap.set(p.membre?.id, (scorerMap.get(p.membre?.id) || 0) + p.buts);
                passerMap.set(p.membre?.id, (passerMap.get(p.membre?.id) || 0) + p.passes);
            });
            this.topScorers = Array.from(scorerMap.entries())
                .map(([id, buts]) => ({ membre: typedMembres.find(m => m.id === id)!, buts }))
                .sort((a, b) => b.buts - a.buts)
                .slice(0, 5);
            this.topPassers = Array.from(passerMap.entries())
                .map(([id, passes]) => ({ membre: typedMembres.find(m => m.id === id)!, passes }))
                .sort((a, b) => b.passes - a.passes)
                .slice(0, 5);

            // Retourner les matches pour la prochaine étape (Préchargement)
            return this.recentMatches;
        }),

        // 3. Nouvelle étape : Gestion asynchrone du préchargement des médias
        switchMap((recentMatches: Match[]) => {
            const token = this.authService.getToken();
            if (!token || !recentMatches.length) {
                return of(null); // Si pas de token ou pas de matchs, on passe
            }

            const mediaObservables: Observable<any>[] = [];

            recentMatches.forEach(match => {
                match.mediaUrls?.forEach(mediaUrl => {
                    const fullMediaUrl = `${this.imageUrl}${mediaUrl}`;

                    if (!this.mediaBlobUrls[fullMediaUrl] && !this.mediaLoadingErrors[fullMediaUrl]) {
                        // Transformer l'appel 'fetch' en un Observable pour l'intégrer à RxJS
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
                                observer.next(null); // Succès
                                observer.complete();
                            })
                            .catch(err => {
                                console.error(`Erreur de préchargement pour ${fullMediaUrl}:`, err);
                                this.mediaLoadingErrors[fullMediaUrl] = true;
                                observer.next(null); // Échoue mais continue (important)
                                observer.complete();
                            });
                        });
                        mediaObservables.push(fetch$);
                    }
                });
            });

            // Lancer tous les préchargements en parallèle et attendre leur fin
            return mediaObservables.length > 0 ? forkJoin(mediaObservables).pipe(catchError(() => of(null))) : of(null);
        }),

        // 4. Finalisation
        finalize(() => this.isLoading = false)
        
    ).subscribe({
        error: (err) => {
            console.error('Erreur globale lors du chargement du fil d\'actualités:', err);
        }
    });
}

getScore(match: Match): string {
    const presences = this.allPresences$.value;
    const [team1, team2] = match.adversaire.split(' vs ').map(team => team.trim());
    let team1Score = 0;
    let team2Score = 0;

    presences
        .filter(p => p.match.id === match.id)
        .forEach(p => {
            const butsMarques = p.buts + p.penalti;
            
            if (p.equipeMatch === team1) {
                // L'équipe 1 marque ses propres buts
                team1Score += butsMarques;
                
                // L'équipe 2 reçoit les BCSC marqués par l'équipe 1
                team2Score += p.butsContreSonCamp; // <-- BCSC de p.equipeMatch (team 1) va au score de team 2
                
            } else if (p.equipeMatch === team2) {
                // L'équipe 2 marque ses propres buts
                team2Score += butsMarques;
                
                // L'équipe 1 reçoit les BCSC marqués par l'équipe 2
                team1Score += p.butsContreSonCamp; // <-- BCSC de p.equipeMatch (team 2) va au score de team 1
            }
        });
    
    return `${team1Score} - ${team2Score}` || '0 - 0';
}

 getButeurs(match: Match): string {
    const presences = this.allPresences$.value;
    const matchPresences = presences.filter(p => p.match.id === match.id);
    
    // 1. Collecter tous les buts (réguliers et penalti) pour chaque joueur
    const buteursList: string[] = [];

    matchPresences.forEach(p => {
        let details = '';
        let totalButs = p.buts + p.penalti;

        if (totalButs > 0) {
            
            // Formatage des détails (par exemple : (3 dont 1p))
            let butsDetails = `${p.buts}`;
            if (p.penalti > 0) {
                butsDetails += p.buts > 0 ? `, ${p.penalti}p` : `${p.penalti}p`;
            }
            
            // Si le total est > 0, on ajoute à la liste
            details = `(${butsDetails}) - ${p.equipeMatch}`;
            
            buteursList.push(`${p.membre?.prenom} ${p.membre?.nom} ${details}`);
        }
        
        // 2. Traitement séparé pour les BCSC (Buts Contre Son Camp)
        if (p.butsContreSonCamp > 0) {
             buteursList.push(`${p.membre?.prenom} ${p.membre?.nom} (BCSC) - ${p.equipeMatch}`);
        }
    });

    return buteursList.length > 0 ? buteursList.join(', ') : 'Aucun buteur';
}

getPasseurs(match: Match): string {
  const presences = this.allPresences$.value;
  const [team1, team2] = match.adversaire.split(' vs ').map(team => team.trim());
  return presences
    .filter(p => p.match.id === match.id && p.passes > 0)
    .map(p => `${p.membre?.prenom} ${p.membre?.nom} (${p.passes}) - ${p.equipeMatch}`)
    .join(', ') || 'Aucun passeur';
}
  getHommeDuMatch(match: Match): string {
    const presences = this.allPresences$.value;
    const found = presences.find(p => p.match.id === match.id && p.estHommeDuMatch);
    const [team1] = match.adversaire.split(' vs ').map(team => team.trim()); // Simplifié, à ajuster si besoin
    return found ? `${found.membre.prenom} ${found.membre.nom} ` : 'Non défini';
  }

  getMembreName(id: number): Observable<string> {
    return this.allMembres$.pipe(
      map(membres => {
        const membre = membres.find(m => m.id === id);
        return membre ? `${membre.prenom} ${membre.nom}` : 'Membre non trouvé';
      })
    );
  }

  getTotalContributions(contribution: Contribution): number {
    const individuelles = this.contributionService.getContributionsIndividuellesById(contribution.id || 0) || [];
    return individuelles.reduce((sum: number, c: { montant: any; }) => sum + (c.montant || 0), 0);
  }

openMediaPreview(match: Match, mediaUrl: string): void {
    if (mediaUrl) {
      const fullMediaUrl = `${this.apiBaseUrl}${mediaUrl}`;
      const token = this.authService.getToken();
      if (token && !this.mediaBlobUrls[fullMediaUrl]) {
        fetch(fullMediaUrl, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.blob();
          })
          .then(blob => {
            const blobUrl = window.URL.createObjectURL(blob);
            const contentType = blob.type || this.getMediaTypeFromUrl(mediaUrl);
            this.mediaBlobUrls[fullMediaUrl] = { url: blobUrl, type: contentType };
            this.dialog.open(MediaPreviewDialogComponent, {
              data: { matchId: match.id, mediaUrl: blobUrl, mediaType: contentType },
              width: '80%',
              maxHeight: '90vh'
            });
            this.dialog.afterAllClosed.subscribe(() => {
              window.URL.revokeObjectURL(blobUrl);
              delete this.mediaBlobUrls[fullMediaUrl];
            });
          })
          .catch(err => {
            console.error('Erreur lors de l\'aperçu:', err);
            this.mediaLoadingErrors[fullMediaUrl] = true;
          });
      } else if (this.mediaBlobUrls[fullMediaUrl]) {
        this.dialog.open(MediaPreviewDialogComponent, {
          data: { matchId: match.id, mediaUrl: this.mediaBlobUrls[fullMediaUrl].url, mediaType: this.mediaBlobUrls[fullMediaUrl].type },
          width: '80%',
          maxHeight: '90vh'
        });
      } else if (this.mediaLoadingErrors[fullMediaUrl]) {
        console.error(`Échec précédent du chargement de ${fullMediaUrl}`);
      } else {
        console.error('Token d\'authentification manquant');
      }
    }
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

  private preloadMediaUrls(): void {
    const token = this.authService.getToken();
     console.log(this.recentMatches)
    if (token && this.recentMatches) {
     
      this.recentMatches.forEach(match => {
        match.mediaUrls?.forEach(mediaUrl => {
          const fullMediaUrl = `${this.apiBaseUrl}${mediaUrl}`;
          if (!this.mediaBlobUrls[fullMediaUrl] && !this.mediaLoadingErrors[fullMediaUrl]) {
            console.log(`Préchargement de ${fullMediaUrl}`);
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
                console.log(`Préchargé avec succès: ${fullMediaUrl}`);
              })
              .catch(err => {
                console.error(`Erreur de préchargement pour ${fullMediaUrl}:`, err);
                this.mediaLoadingErrors[fullMediaUrl] = true;
              });
          }
        });
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
        return 'unknown'; // Gérer les cas non pris en charge
    }
  }

   openPresenceDialog(match: any): void {
    this.dialog.open(MatchPresenceDialogComponent, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: {
        match: match,
        presences: this.allPresences$
      },
      panelClass: 'modern-dialog',
      autoFocus: false
    });
  }

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

        // --- DÉBUT DE LA MODIFICATION : Tri par Montant Décroissant ---
        formattedContributions.sort((a, b) => b.montant - a.montant);
        // --- FIN DE LA MODIFICATION ---
 
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


}