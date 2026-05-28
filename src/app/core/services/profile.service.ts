import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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

}

export interface SaisonStats {
  exerciceId: number;
  exerciceLibelle: string;
  dateDebut: string;       // Reçu sous forme de chaîne ISO (AAAA-MM-JJ)
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
  // Ajout facultatif si tu veux aussi stocker des médias agrégés par club, 
  // ou si tu préfères qu'on liste tous les médias collectés sur ses fiches :
}

// À ajouter dans ton interface PlayerProfile si tu veux embarquer les vidéos directement
export interface VideoHighlight {
  id: number;
  titre: string;
  description: string;
  videoUrl: string;
  adversaire: string;
  createdDate?: string;
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
  
  /**
 * Envoie le FormData (Fichier vidéo binaire + métadonnées) à l'API Spring Boot
 */
uploadPlayerVideo(username: string, formData: FormData): Observable<any> {
  return this.http.post<any>(`${this.apiUrl2}/${username}/videos`, formData);
}
  // Dans ta classe ProfileService :
getVideosByUsername(username: string): Observable<VideoHighlight[]> {
  return this.http.get<VideoHighlight[]>(`${environment.apiUrl}/videos/${username}/videos`);
}

// // Dans ton ProfileService :
// getPlayerVideos(username: string): Observable<VideoHighlight[]> {
//   return this.http.get<VideoHighlight[]>(`${this.apiUrl}/api/profile/${username}/videos`);
// }

uploadVideo(formData: FormData): Observable<any> {
  return this.http.post(`${environment.apiUrl}/videos/upload`, formData);
}

getAllPlayers(): Observable<PlayerProfile[]> {
  return this.http.get<PlayerProfile[]>(`${environment.apiUrl}/profiles/all`);
}
}