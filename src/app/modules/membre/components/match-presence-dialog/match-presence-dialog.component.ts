import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { trigger, transition, style, animate } from '@angular/animations';

export interface Presence {
  id: number;
  membre?: {
    id: number;
    nom: string;
    prenom: string;
    user?: {
      profilePhotoUrl?: string;
    };
  };
  nomOccasionnel?: string;
  equipeMatch: string;
  aJoue: boolean;
  estCapitaine: boolean;
  estHommeDuMatch: boolean;
  buts: number;
  passes: number;
  penalti: number;
  butsContreSonCamp: number;
  cartonsJaunes: number;
  cartonsRouges: number;
}

export interface PresenceDialogData {
  match: {
    id: number;
    dateMatch: Date;
    adversaire: string;
  };
  presences: Presence[] | any;
}

@Component({
  selector: 'app-match-presence-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatMenuModule,
    MatDividerModule,
    MatSnackBarModule,
    TranslateModule
  ],
  templateUrl: './match-presence-dialog.component.html',
  styleUrls: ['./match-presence-dialog.component.scss'],
  animations: [
    trigger('cardAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ])
  ]
})
export class MatchPresenceDialogComponent implements OnInit {
  
  selectedTeam = 'all';
  searchTerm = '';
  teams: string[] = [];
  filteredPresences: Presence[] = [];
  
  // Liste des présences normalisée (toujours un tableau)
  private presencesList: Presence[] = [];
  
  // Gradients pour avatars
  private avatarGradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #30cfd0 0%, #330867 100%)'
  ];

  constructor(
    public dialogRef: MatDialogRef<MatchPresenceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PresenceDialogData,
    private snackBar: MatSnackBar,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.normalizePresences();
    this.extractTeams();
    this.filterPresences();
  }

  // ===== NORMALISATION DES DONNÉES =====

  private normalizePresences(): void {
    // Gérer les différents formats possibles de data.presences
    if (Array.isArray(this.data?.presences)) {
      this.presencesList = this.data.presences;
    } else if (this.data?.presences && typeof this.data.presences === 'object') {
      // Si c'est un objet, essayer de le convertir en tableau
      this.presencesList = Object.values(this.data.presences);
    } else {
      this.presencesList = [];
      console.warn('MatchPresenceDialog: presences n\'est pas un tableau valide', this.data?.presences);
    }
  }

  // ===== EXTRACTION DES ÉQUIPES =====

  private extractTeams(): void {
    const teamSet = new Set<string>();
    this.presencesList.forEach(p => {
      if (p?.equipeMatch) {
        teamSet.add(p.equipeMatch);
      }
    });
    this.teams = Array.from(teamSet).sort();
  }

  // ===== FILTRES =====

  filterByTeam(): void {
    this.filterPresences();
  }

  filterPresences(): void {
    console.log(this.data.presences)
    let filtered = [...this.presencesList];

    // Filtre par équipe
    if (this.selectedTeam !== 'all') {
      filtered = filtered.filter(p => p?.equipeMatch === this.selectedTeam);
    }

    // Filtre par recherche
    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(p => {
        const name = this.getPlayerName(p).toLowerCase();
        return name.includes(search);
      });
    }

    // Tri: capitaines d'abord, puis homme du match, puis ceux qui ont joué
    filtered.sort((a, b) => {
      if (a?.estCapitaine !== b?.estCapitaine) return a?.estCapitaine ? -1 : 1;
      if (a?.estHommeDuMatch !== b?.estHommeDuMatch) return a?.estHommeDuMatch ? -1 : 1;
      if (a?.aJoue !== b?.aJoue) return a?.aJoue ? -1 : 1;
      return this.getPlayerName(a).localeCompare(this.getPlayerName(b));
    });

    this.filteredPresences = filtered;
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filterPresences();
  }

  // ===== COMPTEURS =====

  getTotalCount(): number {
    return this.presencesList.length;
  }

  getTeamCount(team: string): number {
    return this.presencesList.filter(p => p?.equipeMatch === team).length;
  }

  getPlayedCount(): number {
    return this.presencesList.filter(p => p?.aJoue).length;
  }

  getBenchCount(): number {
    return this.presencesList.filter(p => !p?.aJoue).length;
  }

  getMotmCount(): number {
    return this.presencesList.filter(p => p?.estHommeDuMatch).length;
  }

  // ===== INFOS JOUEUR =====

  getPlayerName(presence: Presence): string {
    if (!presence) return 'Joueur inconnu';
    
    if (presence.nomOccasionnel) {
      return presence.nomOccasionnel;
    }
    if (presence.membre) {
      return `${presence.membre.prenom || ''} ${presence.membre.nom || ''}`.trim();
    }
    return 'Joueur inconnu';
  }

  getPlayerInitials(presence: Presence): string {
    if (!presence) return '??';
    
    if (presence.nomOccasionnel) {
      const parts = presence.nomOccasionnel.split(' ');
      return parts.length >= 2 
        ? `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase()
        : presence.nomOccasionnel.substring(0, 2).toUpperCase();
    }
    if (presence.membre) {
      const prenom = presence.membre.prenom || '';
      const nom = presence.membre.nom || '';
      return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
    }
    return '??';
  }

  getPlayerPhoto(presence: Presence): string | null {
    if (presence?.membre?.user?.profilePhotoUrl) {
      return presence.membre.user.profilePhotoUrl;
    }
    return null;
  }

  onImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.style.display = 'none';
  }

  getAvatarGradient(presence: Presence): string {
    const name = this.getPlayerName(presence);
    const index = name.charCodeAt(0) % this.avatarGradients.length;
    return this.avatarGradients[index];
  }

  // ===== STATISTIQUES =====

  hasStats(presence: Presence): boolean {
    if (!presence) return false;
    
    return (
      (presence.buts || 0) > 0 ||
      (presence.passes || 0) > 0 ||
      (presence.penalti || 0) > 0 ||
      (presence.butsContreSonCamp || 0) > 0 ||
      (presence.cartonsJaunes || 0) > 0 ||
      (presence.cartonsRouges || 0) > 0
    );
  }

  // ===== PARTAGE =====

  shareOnWhatsApp(): void {
    const text = this.generateShareText();
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }

  shareOnFacebook(): void {
    const text = this.generateShareText();
    const url = `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }

  copyShareText(): void {
    const text = this.generateShareText();
    navigator.clipboard.writeText(text).then(() => {
      this.showSnackbar(this.translate.instant('presence.textCopied'), 'success');
    }).catch(() => {
      this.showSnackbar(this.translate.instant('presence.copyError'), 'error');
    });
  }

  private generateShareText(): string {
    const match = this.data?.match;
    const dateStr = match?.dateMatch ? new Date(match.dateMatch).toLocaleDateString('fr-FR') : 'Date inconnue';
    
    let text = `⚽ Match du ${dateStr}\n`;
    text += `🆚 ${match?.adversaire || 'Adversaire'}\n\n`;
    text += `📋 Présents: ${this.getTotalCount()}\n`;
    text += `🎮 Ont joué: ${this.getPlayedCount()}\n`;
    text += `🪑 Spectateurs: ${this.getBenchCount()}\n\n`;

    // Top buteurs
    const scorers = this.presencesList.filter(p => (p?.buts || 0) > 0).sort((a, b) => (b?.buts || 0) - (a?.buts || 0));
    if (scorers.length > 0) {
      text += `⚽ Buteurs:\n`;
      scorers.forEach(p => {
        text += `  • ${this.getPlayerName(p)}: ${p?.buts || 0} but(s)\n`;
      });
      text += '\n';
    }

    // Homme du match
    const motm = this.presencesList.find(p => p?.estHommeDuMatch);
    if (motm) {
      text += `⭐ Homme du match: ${this.getPlayerName(motm)}\n`;
    }

    text += '\n#My20 #Football';
    return text;
  }

  // ===== EXPORT =====

  exportToExcel(): void {
    const headers = ['Nom', 'Équipe', 'A joué', 'Capitaine', 'MOTM', 'Buts', 'Passes', 'Penalties', 'CSC', 'Jaunes', 'Rouges'];
    const rows = this.presencesList.map(p => [
      this.getPlayerName(p),
      p?.equipeMatch || '',
      p?.aJoue ? 'Oui' : 'Non',
      p?.estCapitaine ? 'Oui' : 'Non',
      p?.estHommeDuMatch ? 'Oui' : 'Non',
      p?.buts || 0,
      p?.passes || 0,
      p?.penalti || 0,
      p?.butsContreSonCamp || 0,
      p?.cartonsJaunes || 0,
      p?.cartonsRouges || 0
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.join(';'))
      .join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const dateStr = this.data?.match?.dateMatch 
      ? new Date(this.data.match.dateMatch).toISOString().split('T')[0] 
      : 'match';
    
    link.setAttribute('href', url);
    link.setAttribute('download', `presences_${dateStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.showSnackbar(this.translate.instant('presence.exportSuccess'), 'success');
  }

  // ===== UTILITAIRES =====

  close(): void {
    this.dialogRef.close();
  }

  private showSnackbar(message: string, type: 'success' | 'error' | 'info'): void {
    const panelClass = type === 'success' ? 'snackbar-success' : 
                       type === 'error' ? 'snackbar-error' : 'snackbar-info';
    
    this.snackBar.open(message, '✕', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [panelClass]
    });
  }
}