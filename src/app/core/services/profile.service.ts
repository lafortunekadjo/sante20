import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, EMPTY } from 'rxjs';
import { expand, reduce } from 'rxjs/operators';
import { environment } from '../../environment';


export interface ClubHistory {
  groupeId: number;
  nomGroupe: string;
  posteOccupe: string;
  butsDansCeClub: number;
  passesDansCeClub: number;
  activeInGroup: boolean;
}

export interface PlayerProfile {
  id: number;
  username: string;
  userId: number;
  email: string;
  profilePhotoUrl: string | null;
  poste: string;
  piedFort: string;
  quartier: string;
  sexe: string;
  totalButsGlobal: number;
  totalPenaltysGlobal: number;
  totalPassesGlobal: number;
  totalCartonsGlobal: number;
  totalMatchsJoues: number;
  butsEncaisses: number;
  cleanSheets: number;
  historiqueClubs: MembreHistory[];
  historiqueSaisons: SaisonStats[];
  mediaUrls?: string[];
  isPublic?: boolean;
}

export interface SaisonStats {
  exerciceId: number;
  exerciceLibelle: string;
  dateDebut: string;
  dateFin: string;
  clubNom: string | null;
  statut: string | null;
  matchsJoues: number;
  buts: number;
  passes: number;
  penaltys: number;
  cartons: number;
  butsEncaisses: number;
  cleanSheets: number;
}

export interface MembreHistory {
  id: number;
  clubNom: string;
  exerciceLibelle: string;
  statut: string;
  matchsJoues: number;
  buts: number;
  passes: number;
}

export interface VideoHighlight {
  id: number;
  titre: string;
  description: string;
  videoUrl: string;
  adversaire: string;
  createdDate?: string;
}

// ── Réponse paginée Spring Data ──────────────────────────────
interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  last: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = `${environment.apiUrl}/profiles`;
  private apiUrl2 = `${environment.apiUrl}/videos`;

  constructor(private http: HttpClient) {}

  getProfileByUsername(username: string): Observable<PlayerProfile> {
    return this.http.get<PlayerProfile>(`${this.apiUrl}/${username}`);
  }

  deleteVideo(videoId: number, username: string): Observable<any> {
    return this.http.delete(`${this.apiUrl2}/${videoId}/${username}`);
  }

  uploadPlayerVideo(username: string, formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl2}/${username}/videos`, formData);
  }

  getVideosByUsername(username: string): Observable<VideoHighlight[]> {
    return this.http.get<VideoHighlight[]>(`${environment.apiUrl}/videos/${username}/videos`);
  }

  uploadVideo(formData: FormData): Observable<any> {
    return this.http.post(`${environment.apiUrl}/videos/upload`, formData);
  }

  /**
   * Récupère TOUS les joueurs publics en dépaginant automatiquement.
   *
   * Le backend pagine désormais /api/profiles/all (Page<ProfileStatsDTO>)
   * pour des raisons de performance, mais PlayerListComponent attend
   * toujours un tableau complet pour son filtrage/tri/comparaison
   * côté client. Cette méthode agrège donc toutes les pages en interne
   * — aucun changement requis côté composant.
   */
  getAllPlayers(): Observable<PlayerProfile[]> {
    const pageSize = 100;

    return this.fetchPage(0, pageSize).pipe(
      expand((page: SpringPage<PlayerProfile>) =>
        page.last ? EMPTY : this.fetchPage(page.number + 1, pageSize)
      ),
      reduce((acc: PlayerProfile[], page: SpringPage<PlayerProfile>) =>
        [...acc, ...page.content], [] as PlayerProfile[]
      )
    );
  }

  private fetchPage(page: number, size: number): Observable<SpringPage<PlayerProfile>> {
    return this.http.get<SpringPage<PlayerProfile>>(
      `${this.apiUrl}/all?page=${page}&size=${size}`
    );
  }
}