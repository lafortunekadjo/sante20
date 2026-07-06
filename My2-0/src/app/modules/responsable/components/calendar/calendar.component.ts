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
import { TranslateModule, TranslateService } from '@ngx-translate/core';

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
  buteurs: { nom: string; buts: number; penalti: number; butsContreSonCamp: number; total: number }[];
  passeurs: { nom: string; count: number }[];
  presentsCount: number;
  isPlayed: boolean;
  hdm?: string;
  images?: string[];
  // Ajustement pour les MVP
  mvpEnseigne1?: string; // MVP de l'équipe 1 (ou locale)
  mvpEnseigne2?: string; // MVP de l'équipe 2 (si match interne/duel)
  isMultiMvp: boolean;   // Flag pour savoir si on affiche un ou deux blocs MVP
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
    FormsModule,
    TranslateModule,
    MatIconModule
  ],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss'
})
export class CalendarComponent implements OnInit {
 get dayNamesShort(): string[] {
  return [
    this.translate.instant('calendar.days.sun'),
    this.translate.instant('calendar.days.mon'),
    this.translate.instant('calendar.days.tue'),
    this.translate.instant('calendar.days.wed'),
    this.translate.instant('calendar.days.thu'),
    this.translate.instant('calendar.days.fri'),
    this.translate.instant('calendar.days.sat')
  ];
}

get monthNames(): string[] {
  return [
    this.translate.instant('calendar.months.jan'),
    this.translate.instant('calendar.months.feb'),
    this.translate.instant('calendar.months.mar'),
    this.translate.instant('calendar.months.apr'),
    this.translate.instant('calendar.months.may'),
    this.translate.instant('calendar.months.jun'),
    this.translate.instant('calendar.months.jul'),
    this.translate.instant('calendar.months.aug'),
    this.translate.instant('calendar.months.sep'),
    this.translate.instant('calendar.months.oct'),
    this.translate.instant('calendar.months.nov'),
    this.translate.instant('calendar.months.dec')
  ];
}

  currentMonth: number;
  currentYear: number;
  isMobile: boolean;

  selectedMatch = signal<any | null>(null);
  matchDetails = signal<any | null>(null);
  isLoadingDetails = signal(false);
  
  private _calendarDays: CalendarDay[] = [];
  private _lastMonth = -1;
  private _lastYear = -1;

  constructor(
    private presenceService: PresenceService,
    public dialogRef: MatDialogRef<CalendarComponent>,
    private translate: TranslateService,
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
      return { total: 0, played: 0, missed: 0, future: 0, interne: 0, duel: 0, amical: 0, anniversaire: 0 };
    }

    const monthMatches = this.data.matches.filter(m => {
      const d = new Date(m.dateMatch);
      return d.getMonth() === this.currentMonth && d.getFullYear() === this.currentYear;
    });

    return {
      total:        monthMatches.length,
      played:       monthMatches.filter(m => this.isMatchPlayed(m)).length,
      missed:       monthMatches.filter(m => this.isMatchMissed(m)).length,
      future:       monthMatches.filter(m => this.isMatchFuture(m)).length,
      interne:      monthMatches.filter(m => m.typeMatch === 'INTERNE').length,
      duel:         monthMatches.filter(m => m.typeMatch === 'DUEL').length,
      amical:       monthMatches.filter(m => m.typeMatch === 'AMICAL').length,
      anniversaire: monthMatches.filter(m => m.typeMatch === 'ANNIVERSAIRE').length,
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

loadMatchDetails(match: any): void {
  this.isLoadingDetails.set(true);
  this.matchDetails.set(null);

  this.presenceService.getPresencesByMatch(this.data.groupeActif?.id, match.id!).pipe(
    map((presences: any[]) => {
      const isPlayed = this.isMatchPlayed(match);
      
      let scoreLocal = match.scoreEquipe1 ?? 0;
      let scoreAdverse = match.scoreEquipe2 ?? match.scoreAdversaire ?? 0;

      // Map des buteurs stockant l'objet membre pour pouvoir le formater plus tard
      const buteursMap = new Map<string, { membre: any, nomOccasionnel: string, nomAffiche: string, nomAbrege: string, buts: number; penalti: number; butsContreSonCamp: number; total: number }>();
      const passeursMap = new Map<string, { membre: any, nomOccasionnel: string, nomAffiche: string, nomAbrege: string, count: number }>();

      presences.forEach(p => {
        // Clé unique pour le regroupement (identifiant ou nom)
        const key = p.membre ? `m_${p.membre.id}` : `o_${p.nomOccasionnel}`;
        const nomAffiche = this.formatNomComplet(p.membre, p.nomOccasionnel, false);
        const nomAbrege = this.formatNomComplet(p.membre, p.nomOccasionnel, true);

        if (!nomAffiche) return;

        const nbButs = p.buts ?? 0;
        const nbPenalties = p.penalti ?? p.penalty ?? 0;
        const nbCsc = p.csc ?? 0;
        const totalButsJoueur = nbButs + nbPenalties + nbCsc;

        if (totalButsJoueur > 0) {
          const currentData = buteursMap.get(key) || { 
            membre: p.membre, 
            nomOccasionnel: p.nomOccasionnel,
            nomAffiche: nomAffiche, 
            nomAbrege: nomAbrege, 
            buts: 0, 
            penalti: 0, 
            butsContreSonCamp: 0, 
            total: 0 
          };
          currentData.buts += nbButs;
          currentData.penalti += nbPenalties;
          currentData.butsContreSonCamp += nbCsc;
          currentData.total += totalButsJoueur;
          
          buteursMap.set(key, currentData);
        }

        if (p.passes && p.passes > 0) {
          const currentPass = passeursMap.get(key) || {
            membre: p.membre,
            nomOccasionnel: p.nomOccasionnel,
            nomAffiche: nomAffiche,
            nomAbrege: nomAbrege,
            count: 0
          };
          currentPass.count += p.passes;
          passeursMap.set(key, currentPass);
        }
      });

      const buteurs = Array.from(buteursMap.values()).sort((a, b) => b.total - a.total);
      const p_list = Array.from(passeursMap.values()).sort((a, b) => b.count - a.count);

      const type = match.typeMatch;
      const isMultiMvp = type === 'INTERNE' || type === 'DUEL';

      let mvpEnseigne1: string | undefined = undefined;
      let mvpEnseigne1Abrege: string | undefined = undefined;
      let mvpEnseigne2: string | undefined = undefined;
      let mvpEnseigne2Abrege: string | undefined = undefined;

      const eq1Nom = match.equipe1Nom || (match as any).equipe1Id;
      const eq2Nom = match.equipe2Nom || (match as any).equipe2Id;

      if (isMultiMvp) {
        // Recherche du MVP pour l'équipe 1
        const pMvp1 = presences.find(p => (p.estHommeDuMatchEq || p.isMvp || p.mvp) && p.equipeMatch === eq1Nom);
        if (pMvp1) {
          mvpEnseigne1 = this.formatNomComplet(pMvp1.membre, pMvp1.nomOccasionnel, false);
          mvpEnseigne1Abrege = this.formatNomComplet(pMvp1.membre, pMvp1.nomOccasionnel, true);
        }

        // Recherche du MVP pour l'équipe 2
        const pMvp2 = presences.find(p => (p.estHommeDuMatchEq || p.isMvp || p.mvp) && p.equipeMatch === eq2Nom);
        if (pMvp2) {
          mvpEnseigne2 = this.formatNomComplet(pMvp2.membre, pMvp2.nomOccasionnel, false);
          mvpEnseigne2Abrege = this.formatNomComplet(pMvp2.membre, pMvp2.nomOccasionnel, true);
        }

      } else {
        // Match Classique / Externe
        const pMvp = presences.find(p => p.estHommeDuMatchEq || p.isMvp || p.mvp);
        if (pMvp) {
          mvpEnseigne1 = this.formatNomComplet(pMvp.membre, pMvp.nomOccasionnel, false);
          mvpEnseigne1Abrege = this.formatNomComplet(pMvp.membre, pMvp.nomOccasionnel, true);
        }
      }
          
      // Homme du match général
      const pHdm = presences.find(p => p.estHommeDuMatch);
      const hdmName = pHdm ? this.formatNomComplet(pHdm.membre, pHdm.nomOccasionnel, false) : undefined;
      const hdmNameAbrege = pHdm ? this.formatNomComplet(pHdm.membre, pHdm.nomOccasionnel, true) : undefined;

      let matchImages: string[] = [];
      if (match.mediaUrls && Array.isArray(match.mediaUrls)) {
        matchImages = match.mediaUrls;
      } else if ((match as any).mediaUrls) {
        matchImages = [(match as any).mediaUrls];
      }

      return {
        match,
        scoreLocal,
        scoreAdverse,
        buteurs,
        passeurs: p_list,
        presentsCount: presences.filter(p => p.aJoue).length,
        isPlayed,
        mvpEnseigne1,
        mvpEnseigne1Abrege,
        mvpEnseigne2,
        mvpEnseigne2Abrege,
        isMultiMvp,
        hdm: hdmName,
        hdmAbrege: hdmNameAbrege,
        images: matchImages
      };
    }),
    catchError(err => {
      console.error('Erreur détails calendrier:', err);
      return of(null);
    }),
    finalize(() => this.isLoadingDetails.set(false))
  ).subscribe(details => this.matchDetails.set(details as any));
}

  formatNomComplet(membre: any, nomOccasionnel?: string, abridge: boolean = false): string {
  if (!membre) return nomOccasionnel || '';
  
  const nom = membre.nom?.trim() || '';
  const prenom = membre.prenom?.trim() || '';

  if (!prenom) return nom;

  // Si on demande d'abréger (ex: "MBA KADJO Vanessa" devient "MBA KADJO V.")
  if (abridge) {
    return `${nom} ${prenom.charAt(0).toUpperCase()}.`.trim();
  }

  return `${nom} ${prenom}`.trim();
}

  // ✅ Méthode utilitaire pour télécharger une image
  downloadImage(url: string, index: number): void {
    const link = document.createElement('a');
    link.href = url;
    link.download = `Match_${this.selectedMatch()?.dateMatch || 'photo'}_${index + 1}.jpg`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
  if (!match?.typeMatch) {
    return [
      this.translate.instant('calendar.teams.team1'), 
      this.translate.instant('calendar.teams.team2')
    ];
  }

  switch (match.typeMatch) {
    case 'INTERNE':
    case 'DUEL':
      return [
        match.equipe1?.nom || (match as any).equipe1Nom || this.translate.instant('calendar.teams.team1'), 
        match.equipe2?.nom || (match as any).equipe2Nom || this.translate.instant('calendar.teams.team2')
      ];
    case 'AMICAL':
      const local = this.data.groupeActif?.abreviation || this.data.groupeActif?.nom || this.translate.instant('calendar.teams.we');
      let adv = this.translate.instant('calendar.teams.opponent');
      if (match.groupeAdverse) {
        adv = match.groupeAdverse.abreviation || match.groupeAdverse.nom;
      } else if (match.nomAdversaireManuel) {
        adv = match.nomAdversaireManuel;
      } else if ((match as any).adversaire) {
        adv = (match as any).adversaire;
      }
      return [local, adv];
    case 'ANNIVERSAIRE':
      return [
        this.translate.instant('calendar.teams.celebrated'), 
        this.translate.instant('calendar.teams.opposing')
      ];
    default:
      return [
        this.translate.instant('calendar.teams.team1'), 
        this.translate.instant('calendar.teams.team2')
      ];
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
    'INTERNE': this.translate.instant('calendar.types.internal'),
    'DUEL': this.translate.instant('calendar.types.duel'),
    'AMICAL': this.translate.instant('calendar.types.friendly'),
    'ANNIVERSAIRE': this.translate.instant('calendar.types.birthday')
  };
  return labels[type || ''] || this.translate.instant('calendar.types.default');
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

  getMonthIndexForDay(day: CalendarDay): number {
  return day.date.getMonth();
}

getMatchesForMonthIndex(monthIndex: number): Match[] {
  if (!this.data.matches) return [];
  return this.data.matches.filter(m => {
    const d = new Date(m.dateMatch);
    return d.getFullYear() === this.currentYear && d.getMonth() === monthIndex;
  });
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
  if (this.isMatchPlayed(match)) return this.translate.instant('calendar.status.completed');
  if (this.isMatchMissed(match)) return this.translate.instant('calendar.status.unvalidated');
  return this.translate.instant('calendar.status.future');
}

  onClose(): void {
    this.dialogRef.close();
  }
}