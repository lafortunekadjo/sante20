import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, signal, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { Match, TypeMatch } from '../../../../core/models/match.model';
import { Groupe } from '../../../../core/models/groupe.model';
import { of } from 'rxjs';
import { PresenceService } from '../../../../core/services/presence.service';
import { map, catchError, finalize } from 'rxjs/operators';

interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  matches: Match[];
}

interface MatchDetails {
  match: Match;
  scoreLocal: number;
  scoreAdverse: number;
  buteurs: { nom: string; count: number }[];
  passeurs: { nom: string; count: number }[];
  presentsCount: number;
  isPlayed: boolean;
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    FormsModule
  ],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss'
})
export class CalendarComponent implements OnInit {
  dayNamesShort = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

  currentMonth: number;
  currentYear: number;
  isMobile: boolean;

  selectedMatch = signal<Match | null>(null);
  matchDetails = signal<MatchDetails | null>(null);
  isLoadingDetails = signal(false);
  
  private _calendarDays: CalendarDay[] = [];
  private _lastMonth = -1;
  private _lastYear = -1;

  constructor(
    private presenceService: PresenceService,
    public dialogRef: MatDialogRef<CalendarComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { 
      matches: Match[]; 
      jourDeMatch?: string;
      groupeActif?: Groupe;
    }
  ) {
    const today = new Date();
    this.currentMonth = today.getMonth();
    this.currentYear = today.getFullYear();
    this.isMobile = window.innerWidth <= 768;
  }

  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth <= 768;
  }

  ngOnInit() {
    // S'assurer que matches est un tableau
    if (!this.data.matches) {
      this.data.matches = [];
    }
    
    // Positionner le calendrier sur le mois du prochain match ou du dernier match
    if (this.data.matches.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Chercher le prochain match à venir
      const futureMatch = this.data.matches.find(m => {
        const matchDate = new Date(m.dateMatch);
        matchDate.setHours(0, 0, 0, 0);
        return matchDate >= today;
      });
      
      if (futureMatch) {
        const matchDate = new Date(futureMatch.dateMatch);
        this.currentMonth = matchDate.getMonth();
        this.currentYear = matchDate.getFullYear();
      } else {
        // Si pas de match futur, prendre le dernier match
        const lastMatch = this.data.matches[this.data.matches.length - 1];
        if (lastMatch) {
          const matchDate = new Date(lastMatch.dateMatch);
          this.currentMonth = matchDate.getMonth();
          this.currentYear = matchDate.getFullYear();
        }
      }
    }
  }

  // Getter pour le jour de match (avec fallback)
  get jourDeMatch(): string {
    return this.data.jourDeMatch || this.data.groupeActif?.jourMatch || 'Dimanche';
  }

  // Navigation
  previousMonth() {
    this._lastMonth = -1;
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
  }

  nextMonth() {
    this._lastMonth = -1;
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
  }

  goToMonth(month: number) {
    this._lastMonth = -1;
    this.currentMonth = month;
  }

  goToToday() {
    this._lastMonth = -1;
    const today = new Date();
    this.currentMonth = today.getMonth();
    this.currentYear = today.getFullYear();
  }

  // Calendar Generation
  calendarDays(): CalendarDay[] {
    if (this._lastMonth === this.currentMonth && this._lastYear === this.currentYear) {
      return this._calendarDays;
    }
    
    const days: CalendarDay[] = [];
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startPadding = firstDay.getDay();
    const prevMonth = new Date(this.currentYear, this.currentMonth, 0);
    
    for (let i = startPadding - 1; i >= 0; i--) {
      const date = new Date(this.currentYear, this.currentMonth - 1, prevMonth.getDate() - i);
      days.push({ date, dayNumber: date.getDate(), isCurrentMonth: false, isToday: false, matches: this.getMatchesForDate(date) });
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(this.currentYear, this.currentMonth, day);
      days.push({ date, dayNumber: day, isCurrentMonth: true, isToday: date.getTime() === today.getTime(), matches: this.getMatchesForDate(date) });
    }

    const endPadding = 42 - days.length;
    for (let i = 1; i <= endPadding; i++) {
      const date = new Date(this.currentYear, this.currentMonth + 1, i);
      days.push({ date, dayNumber: i, isCurrentMonth: false, isToday: false, matches: this.getMatchesForDate(date) });
    }

    this._calendarDays = days;
    this._lastMonth = this.currentMonth;
    this._lastYear = this.currentYear;
    return days;
  }

  getMatchesForDate(date: Date): Match[] {
    if (!this.data.matches) return [];
    
    return this.data.matches.filter(m => {
      const d = new Date(m.dateMatch);
      return d.getFullYear() === date.getFullYear() && 
             d.getMonth() === date.getMonth() && 
             d.getDate() === date.getDate();
    });
  }

  // Stats
  monthStats() {
    if (!this.data.matches) {
      return { total: 0, played: 0, missed: 0, future: 0 };
    }
    
    const monthMatches = this.data.matches.filter(m => {
      const d = new Date(m.dateMatch);
      return d.getMonth() === this.currentMonth && d.getFullYear() === this.currentYear;
    });
    
    return {
      total: monthMatches.length,
      played: monthMatches.filter(m => this.isMatchPlayed(m)).length,
      missed: monthMatches.filter(m => this.isMatchMissed(m)).length,
      future: monthMatches.filter(m => this.isMatchFuture(m)).length
    };
  }

  // Selection
  isDaySelected(day: CalendarDay): boolean {
    const selected = this.selectedMatch();
    if (!selected) return false;
    const d = new Date(selected.dateMatch);
    return d.getFullYear() === day.date.getFullYear() && 
           d.getMonth() === day.date.getMonth() && 
           d.getDate() === day.date.getDate();
  }

  onDayClick(day: CalendarDay) {
    if (day.matches.length >= 1) {
      this.openMatchDetails(day.matches[0]);
    }
  }

  onMatchClick(match: Match, event: Event) {
    event.stopPropagation();
    this.openMatchDetails(match);
  }

  openMatchDetails(match: Match) {
    const selected = this.selectedMatch();
    if (selected?.id === match.id) { 
      this.closeDetails(); 
      return; 
    }
    this.selectedMatch.set(match);
    this.loadMatchDetails(match);
  }

  closeDetails() {
    this.selectedMatch.set(null);
    this.matchDetails.set(null);
  }

  loadMatchDetails(match: Match) {
    this.isLoadingDetails.set(true);
    this.matchDetails.set(null);

    this.presenceService.getPresencesByMatchId(match.id).pipe(
      map(presences => {
        // Récupérer les noms des équipes depuis le match
        const equipe1Nom = match.equipe1?.nom || (match as any).equipe1Nom;
        const equipe2Nom = match.equipe2?.nom || (match as any).equipe2Nom;

        const played = presences.filter(p => p.aJoue);

        let scoreEquipe1 = 0;
        let scoreEquipe2 = 0;

        if (match.typeMatch === 'AMICAL') {
          // En AMICAL: tous les joueurs présents sont de notre équipe
          scoreEquipe1 = presences.reduce((sum, p) => sum + (p.buts || 0) + (p.penalti || 0), 0);
          scoreEquipe2 = match.scoreAdversaire || 0;
          
          // CSC de nos joueurs = buts pour l'adversaire
          const cscNous = presences.reduce((sum, p) => sum + (p.butsContreSonCamp || 0), 0);
          scoreEquipe2 += cscNous;
          
        } else {
          // Pour INTERNE, DUEL, ANNIVERSAIRE: séparer par equipeMatch
          presences.forEach(p => {
            const buts = (p.buts || 0) + (p.penalti || 0);
            const csc = p.butsContreSonCamp || 0;
            
            // Comparer equipeMatch avec les noms des équipes du match
            const equipeMatchLower = p.equipeMatch?.toLowerCase();
            const equipe1Lower = equipe1Nom?.toLowerCase();
            const equipe2Lower = equipe2Nom?.toLowerCase();
            
            if (equipeMatchLower === equipe1Lower) {
              scoreEquipe1 += buts;
              scoreEquipe2 += csc;
            } else if (equipeMatchLower === equipe2Lower) {
              scoreEquipe2 += buts;
              scoreEquipe1 += csc;
            }
          });
        }

        // Buteurs
        const buteursMap = new Map<string, number>();
        presences.filter(p => (p.buts || 0) > 0 || (p.penalti || 0) > 0).forEach(p => {
          const n = this.getPlayerName(p);
          buteursMap.set(n, (buteursMap.get(n) || 0) + (p.buts || 0) + (p.penalti || 0));
        });

        // Passeurs
        const passeursMap = new Map<string, number>();
        presences.filter(p => (p.passes || 0) > 0).forEach(p => {
          const n = this.getPlayerName(p);
          passeursMap.set(n, (passeursMap.get(n) || 0) + (p.passes || 0));
        });

        return {
          match, 
          scoreLocal: scoreEquipe1, 
          scoreAdverse: scoreEquipe2,
          buteurs: Array.from(buteursMap.entries()).map(([nom, count]) => ({ nom, count })).sort((a, b) => b.count - a.count),
          passeurs: Array.from(passeursMap.entries()).map(([nom, count]) => ({ nom, count })).sort((a, b) => b.count - a.count),
          presentsCount: played.length, 
          isPlayed: played.length > 0
        } as MatchDetails;
      }),
      catchError(err => {
        console.error('Error loading match details:', err);
        return of({ 
          match, 
          scoreLocal: 0, 
          scoreAdverse: 0, 
          buteurs: [], 
          passeurs: [], 
          presentsCount: 0, 
          isPlayed: false 
        } as MatchDetails);
      }),
      finalize(() => this.isLoadingDetails.set(false))
    ).subscribe(d => this.matchDetails.set(d));
  }

  private getPlayerName(presence: any): string {
    if (presence.membre) {
      if (presence.membre.nom && presence.membre.prenom) {
        return `${presence.membre.nom} ${presence.membre.prenom}`;
      }
      return presence.membre.nom || presence.membre.prenom || 'Inconnu';
    }
    return presence.nomOccasionnel || 'Inconnu';
  }

  getEquipeNames(match: Match): [string, string] {
    if (!match?.typeMatch) return ['Équipe 1', 'Équipe 2'];
    
    switch (match.typeMatch) {
      case 'INTERNE':
      case 'DUEL':
        return [
          match.equipe1?.nom || (match as any).equipe1Nom || 'Équipe 1', 
          match.equipe2?.nom || (match as any).equipe2Nom || 'Équipe 2'
        ];
      case 'AMICAL':
        const local = this.data.groupeActif?.abreviation || this.data.groupeActif?.nom || 'Nous';
        let adv = 'Adversaire';
        if (match.groupeAdverse) {
          adv = match.groupeAdverse.abreviation || match.groupeAdverse.nom;
        } else if (match.nomAdversaireManuel) {
          adv = match.nomAdversaireManuel;
        } else if ((match as any).adversaire) {
          adv = (match as any).adversaire;
        }
        return [local, adv];
      case 'ANNIVERSAIRE':
        return ['Fêtés', 'Adverses'];
      default:
        return ['Équipe 1', 'Équipe 2'];
    }
  }

  getTypeEmoji(type?: TypeMatch): string {
    const emojis: Record<string, string> = {
      'INTERNE': '🏠',
      'DUEL': '⚔️',
      'AMICAL': '🤝',
      'ANNIVERSAIRE': '🎂'
    };
    return emojis[type || ''] || '⚽';
  }

  getTypeLabel(type?: TypeMatch): string {
    const labels: Record<string, string> = {
      'INTERNE': 'Interne',
      'DUEL': 'Duel',
      'AMICAL': 'Amical',
      'ANNIVERSAIRE': 'Anniversaire'
    };
    return labels[type || ''] || 'Match';
  }

  isMatchPlayed(match: Match): boolean {
    const d = new Date(match.dateMatch); 
    d.setHours(0, 0, 0, 0);
    const t = new Date(); 
    t.setHours(0, 0, 0, 0);
    
    if (d >= t) return false;
    
    return !!match.rapporteur || 
           !!(match.rapporteurNomOccasionnel?.trim()) || 
           match.scoreEquipe1 != null || 
           match.scoreEquipe2 != null || 
           match.scoreAdversaire != null;
  }

  isMatchMissed(match: Match): boolean {
    const d = new Date(match.dateMatch); 
    d.setHours(0, 0, 0, 0);
    const t = new Date(); 
    t.setHours(0, 0, 0, 0);
    
    return d < t && !this.isMatchPlayed(match);
  }

  isMatchFuture(match: Match): boolean {
    const d = new Date(match.dateMatch); 
    d.setHours(0, 0, 0, 0);
    const t = new Date(); 
    t.setHours(0, 0, 0, 0);
    
    return d >= t;
  }

  getMatchStatusClass(match: Match): string {
    if (this.isMatchPlayed(match)) return 'played';
    if (this.isMatchMissed(match)) return 'missed';
    return 'future';
  }

  getMatchStatusLabel(match: Match): string {
    if (this.isMatchPlayed(match)) return 'Terminé';
    if (this.isMatchMissed(match)) return 'Non validé';
    return 'À venir';
  }

  onClose(): void {
    this.dialogRef.close();
  }
}