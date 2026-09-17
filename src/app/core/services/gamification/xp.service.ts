import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../../environment';

export interface XpProfilDTO {
  membreId:      number;
  nom:           string;
  prenom:        string;
  xpTotal:       number;
  xpSaison:      number;
  niveau:        number;
  titreNiveau:   string;
  prochainNiveau: string;
  xpProchainNiveau: number;
  progressionNiveau: number; // 0-100%
  rangSaison:    number;
  rangGlobal:    number;
  badges:        BadgeDTO[];
  missions:      MissionJoueurDTO[];
  historique:    XpTransactionDTO[];
}

export interface BadgeDTO {
  code:          string;
  nom:           string;
  description:   string;
  emoji:         string;
  dateObtention: string;
}

export interface MissionJoueurDTO {
  missionId:        number;
  titre:            string;
  description:      string;
  type:             'HEBDOMADAIRE' | 'MENSUEL' | 'SPECIAL';
  cible:            'JOUEUR' | 'CLUB' | 'RESPONSABLE';
  progression:      number;
  quantiteRequise:  number;
  xpBonus:          number;
  complete:         boolean;
  dateFin:          string;
}

export interface XpTransactionDTO {
  id:          number;
  codeAction:  string;
  motif:       string;
  xp:          number;
  dateAction:  string;
}

export interface ClassementSaisonDTO {
  individuel: ClassementEntreeDTO[];
  clubs:      ClassementClubDTO[];
  anneeMois:  string;
}

export interface ClassementEntreeDTO {
  rang:      number;
  membreId:  number;
  nom:       string;
  prenom:    string;
  username: string;
  groupeNom: string;
  xpSaison:  number;
  niveau:    number;
  profil: string;
  titreNiveau: string;
}

export interface ClassementClubDTO {
  rang:      number;
  groupeId:  number;
  groupeNom: string;
  photoUrl?: string;
  xpTotal:   number;
  nbMembresActifs: number;
}

@Injectable({ providedIn: 'root' })
export class XpService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/xp`;

  // Cache local pour éviter les requêtes répétées
  private profil$ = new BehaviorSubject<XpProfilDTO | null>(null);
  readonly profilState$ = this.profil$.asObservable();

  getMonProfil(): Observable<XpProfilDTO> {
    return this.http.get<XpProfilDTO>(`${this.base}/profil`).pipe(
      tap(p => this.profil$.next(p))
    );
  }

  getClassement(anneeMois?: string): Observable<ClassementSaisonDTO> {
    const params = anneeMois ? `?anneeMois=${anneeMois}` : '';
    return this.http.get<ClassementSaisonDTO>(`${this.base}/classement${params}`);
  }

  getMesMissions(): Observable<MissionJoueurDTO[]> {
    return this.http.get<MissionJoueurDTO[]>(`${this.base}/missions`);
  }

  getHistorique(): Observable<XpTransactionDTO[]> {
    return this.http.get<XpTransactionDTO[]>(`${this.base}/historique`);
  }

  // Classement public (sans connexion)
  getClassementPublic(anneeMois?: string): Observable<ClassementSaisonDTO> {
    const params = anneeMois ? `?anneeMois=${anneeMois}` : '';
    return this.http.get<ClassementSaisonDTO>(
      `${environment.apiUrl}/public/xp/classement${params}`
    );
  }

  // Cache synchrone
  getProfilCache(): XpProfilDTO | null {
    return this.profil$.getValue();
  }

  clearCache(): void {
    this.profil$.next(null);
  }

  // Helpers UI
  getNiveauColor(niveau: number): string {
    const colors = ['#6b7280', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#f97316'];
    return colors[Math.min(niveau - 1, colors.length - 1)];
  }

  getNiveauLabel(niveau: number): string {
    const labels = [
      '⚽ Rookie', '🌟 Prometteur', '💪 Confirmé',
      '🔥 Redoutable', '👑 Élite', '🏆 Légende'
    ];
    return labels[Math.min(niveau - 1, labels.length - 1)];
  }
}