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
  userId: number;
  username: string;
  email: string;
  profilePhotoUrl: string | null;
  totalButsGlobal: number;
  totalPassesGlobal: number;
  totalCartonsGlobal: number;
  historiqueClubs: ClubHistory[];
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

  constructor(private http: HttpClient) {}

  getProfileByUsername(username: string): Observable<PlayerProfile> {
    return this.http.get<PlayerProfile>(`${this.apiUrl}/${username}`);
  }

  // Dans ta classe ProfileService :
getVideosByUsername(username: string): Observable<VideoHighlight[]> {
  return this.http.get<VideoHighlight[]>(`${environment.apiUrl}/videos/user/${username}`);
}

uploadVideo(formData: FormData): Observable<any> {
  return this.http.post(`${environment.apiUrl}/videos/upload`, formData);
}

getAllPlayers(): Observable<PlayerProfile[]> {
  return this.http.get<PlayerProfile[]>(`${environment.apiUrl}/profiles/all`);
}
}