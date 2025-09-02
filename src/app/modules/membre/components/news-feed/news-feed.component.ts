import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { forkJoin, Observable, BehaviorSubject } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
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

@Component({
  selector: 'app-news-feed',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatExpansionModule,
    MatProgressSpinnerModule
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
  apiBaseUrl = 'http://localhost:8082';
  mediaBlobUrls: { [key: string]: { url: string; type: string } } = {};
    mediaLoadingErrors: { [key: string]: boolean } = {};

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

  loadFeedData(): void {
    this.isLoading = true;
    const today = new Date();
    forkJoin({
      events: this.generalService.getAllEvenements(),
      matches: this.matchService.getAllMatches(),
      contributions: this.contributionService.getAllContributions(),
      membres: this.membreService.getAllMembres(),
      presences: this.matchService.getAllPresences()
    }).pipe(
      tap(({ presences }) => this.allPresences$.next(presences)), // Mettre à jour les présences une seule fois
      map(({ events, matches, contributions, membres, presences }) => {
        const typedEvents: Evenement[] = events;
        const typedMatches: Match[] = matches;
        const typedContributions: Contribution[] = contributions;
        const typedMembres: Membre[] = membres;
        const typedPresences: Presence[] = presences;

        this.currentEvents = typedEvents.filter(e => e.estContributionOuverte && new Date(e.dateCreation) <= today);
        this.recentMatches = typedMatches.filter(m => {
          const matchDate = new Date(m.dateMatch);
          const thirtyDaysAgo = new Date(today);
          thirtyDaysAgo.setDate(today.getDate() - 30);
          return matchDate >= thirtyDaysAgo && matchDate <= today;
        });
        this.ongoingContributions = typedContributions
          .map(contrib => ({
            contribution: contrib,
            individuelles: this.contributionService.getContributionsIndividuellesById(contrib.idContribution || 0) || []
          }))
          .filter(c => new Date(c.contribution.delaiContribution) >= today);
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
        this.groupAnnouncements = []; // Remplace par this.generalService.getGroupAnnouncements().subscribe(ann => this.groupAnnouncements = ann);

        const scorerMap = new Map<number, number>();
        const passerMap = new Map<number, number>();
        typedPresences.forEach(p => {
          scorerMap.set(p.membre.id, (scorerMap.get(p.membre.id) || 0) + p.buts);
          passerMap.set(p.membre.id, (passerMap.get(p.membre.id) || 0) + p.passes);
        });
        this.topScorers = Array.from(scorerMap.entries())
          .map(([id, buts]) => ({ membre: typedMembres.find(m => m.id === id)!, buts }))
          .sort((a, b) => b.buts - a.buts)
          .slice(0, 5);
          console.log(this.topScorers)
        this.topPassers = Array.from(passerMap.entries())
          .map(([id, passes]) => ({ membre: typedMembres.find(m => m.id === id)!, passes }))
          .sort((a, b) => b.passes - a.passes)
          .slice(0, 5);
        console.log('Top Scorers:', this.topScorers); // Débogage
      console.log('Top Passers:', this.topPassers); // Débogage

        return { events: typedEvents, matches: typedMatches, contributions: typedContributions, membres: typedMembres, presences: typedPresences };
      })
    ).subscribe({
      next: () => this.isLoading = false,
      error: (err) => {
        console.error('Erreur lors du chargement du fil d\'actualités:', err);
        this.isLoading = false;
      }
    });
  }

  getScore(match: Match): string {
    const presences = this.allPresences$.value; // Utiliser les présences déjà chargées
    const [team1, team2] = match.adversaire.split(' vs ').map(team => team.trim());
    let team1Goals = 0;
    let team2Goals = 0;

    presences
      .filter(p => p.match.id === match.id)
      .forEach(p => {
        if (p.equipeMatch === team1) {
          team1Goals += p.buts;
        } else if (p.equipeMatch === team2) {
          team2Goals += p.buts;
        }
      });

    return `${team1Goals} - ${team2Goals}` || '0 - 0';
  }

  getButeurs(match: Match): string {
  const presences = this.allPresences$.value;
  const [team1, team2] = match.adversaire.split(' vs ').map(team => team.trim());
  return presences
    .filter(p => p.match.id === match.id && p.buts > 0)
    .map(p => `${p.membre.prenom} ${p.membre.nom} (${p.buts}) - ${p.equipeMatch}`)
    .join(', ') || 'Aucun buteur';
}

getPasseurs(match: Match): string {
  const presences = this.allPresences$.value;
  const [team1, team2] = match.adversaire.split(' vs ').map(team => team.trim());
  return presences
    .filter(p => p.match.id === match.id && p.passes > 0)
    .map(p => `${p.membre.prenom} ${p.membre.nom} (${p.passes}) - ${p.equipeMatch}`)
    .join(', ') || 'Aucun passeur';
}
  getHommeDuMatch(match: Match): string {
    const presences = this.allPresences$.value;
    const found = presences.find(p => p.match.id === match.id && p.estHommeDuMatch);
    const [team1] = match.adversaire.split(' vs ').map(team => team.trim()); // Simplifié, à ajuster si besoin
    return found ? `${found.membre.prenom} ${found.membre.nom} - ${found.equipeMatch === team1 }` : 'Non défini';
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
    const individuelles = this.contributionService.getContributionsIndividuellesById(contribution.idContribution || 0) || [];
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
}