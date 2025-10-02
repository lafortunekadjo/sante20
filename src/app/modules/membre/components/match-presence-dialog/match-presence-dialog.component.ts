// match-presence-dialog.component.ts
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { Presence } from '../../../../core/models/presence.model';
import { BehaviorSubject } from 'rxjs';



@Component({
  selector: 'app-match-presence-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatButtonToggleModule,
    FormsModule,
    MatCardModule,
    MatSnackBarModule,
    
  ],
  templateUrl: './match-presence-dialog.component.html',
  styleUrls: ['./match-presence-dialog.component.scss']
})
export class MatchPresenceDialogComponent implements OnInit {
  allPresences: Presence[] = [];
  filteredPresences: Presence[] = [];
  teams: string[] = [];
  selectedTeam: string = 'all';
  searchTerm: string = '';

  constructor(
    public dialogRef: MatDialogRef<MatchPresenceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { match: any; presences: BehaviorSubject<Presence[]> }
  ) {}

  ngOnInit(): void {
    // Filtrer les présences pour ce match spécifique
    // Tous ceux dans la liste sont présents
    this.allPresences = this.data.presences.value.filter(
      p => p.match.id === this.data.match.id
    );
    
    // Extraire les équipes uniques
    this.teams = [...new Set(this.allPresences.map(p => p.equipeMatch))].filter(Boolean);
    
    // Trier : capitaines en premier, puis par équipe, puis par nom
    this.allPresences.sort((a, b) => {
      if (a.estCapitaine !== b.estCapitaine) {
        return a.estCapitaine ? -1 : 1;
      }
      if (a.equipeMatch !== b.equipeMatch) {
        return a.equipeMatch.localeCompare(b.equipeMatch);
      }
      return this.getPlayerName(a).localeCompare(this.getPlayerName(b));
    });
    
    // Initialiser la liste filtrée
    this.filteredPresences = [...this.allPresences];
  }

  /**
   * Récupère le nom complet du joueur
   */
  getPlayerName(presence: Presence): string {
    if (presence.nomOccasionnel) {
      return presence.nomOccasionnel;
    }
    if (presence.membre) {
      return `${presence.membre.prenom} ${presence.membre.nom}`;
    }
    return 'Joueur inconnu';
  }

  /**
   * Récupère les initiales du joueur pour l'avatar
   */
  getPlayerInitials(presence: Presence): string {
    const name = this.getPlayerName(presence);
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  /**
   * Génère une couleur d'avatar basée sur le nom
   */
  getAvatarColor(presence: Presence): string {
    const colors = [
      'linear-gradient(135deg, #667eea, #764ba2)',
      'linear-gradient(135deg, #f093fb, #f5576c)',
      'linear-gradient(135deg, #4facfe, #00f2fe)',
      'linear-gradient(135deg, #43e97b, #38f9d7)',
      'linear-gradient(135deg, #fa709a, #fee140)',
      'linear-gradient(135deg, #30cfd0, #330867)',
      'linear-gradient(135deg, #a8edea, #fed6e3)',
      'linear-gradient(135deg, #ff9a9e, #fecfef)'
    ];
    
    const name = this.getPlayerName(presence);
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  }

  /**
   * Retourne le statut de participation du joueur
   */
  getPlayerStatus(presence: Presence): string {
    if (presence.estHommeDuMatch) {
      return 'Homme du match';
    }
    if (presence.estHommeDuMatchEq) {
      return 'Homme du match (équipe)';
    }
    if (presence.estCapitaine) {
      return 'Capitaine';
    }
    if (presence.aJoue) {
      return 'A joué';
    }
    return 'Présent (banc)';
  }

  /**
   * Compte le total de présents
   */
  getTotalCount(): number {
    return this.allPresences.length;
  }

  /**
   * Compte ceux qui ont joué
   */
  getPlayedCount(): number {
    return this.allPresences.filter(p => p.aJoue).length;
  }

  /**
   * Compte ceux sur le banc
   */
  getBenchCount(): number {
    return this.allPresences.filter(p => !p.aJoue).length;
  }

  /**
   * Compte le nombre de joueurs par équipe
   */
  getTeamCount(team: string): number {
    return this.allPresences.filter(p => p.equipeMatch === team).length;
  }

  /**
   * Récupère les stats d'un joueur
   */
  getPlayerStats(presence: Presence): string {
    const stats: string[] = [];
    
    if (presence.buts > 0) {
      stats.push(`${presence.buts} but${presence.buts > 1 ? 's' : ''}`);
    }
    if (presence.butsContreSonCamp > 0) {
      stats.push(`${presence.butsContreSonCamp} CSC`);
    }
    if (presence.passes > 0) {
      stats.push(`${presence.passes} passe${presence.passes > 1 ? 's' : ''}`);
    }
    if (presence.penalti > 0) {
      stats.push(`${presence.penalti} penalty`);
    }
    if (presence.cartonsJaunes > 0) {
      stats.push(`${presence.cartonsJaunes} 🟨`);
    }
    if (presence.cartonsRouges > 0) {
      stats.push(`${presence.cartonsRouges} 🟥`);
    }
    
    return stats.length > 0 ? stats.join(', ') : 'Aucune stat';
  }

  /**
   * Vérifie si un joueur a des stats notables
   */
  hasStats(presence: Presence): boolean {
    return presence.buts > 0 || 
           presence.passes > 0 || 
           presence.cartonsJaunes > 0 || 
           presence.cartonsRouges > 0 ||
           presence.butsContreSonCamp > 0 ||
           presence.penalti > 0;
  }

  /**
   * Filtre par équipe
   */
  filterByTeam(): void {
    this.filterPresences();
  }

  /**
   * Filtre les présences selon les critères sélectionnés
   */
  filterPresences(): void {
    let filtered = [...this.allPresences];

    // Filtre par équipe
    if (this.selectedTeam !== 'all') {
      filtered = filtered.filter(p => p.equipeMatch === this.selectedTeam);
    }

    // Filtre par recherche
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        this.getPlayerName(p).toLowerCase().includes(search) ||
        p.equipeMatch.toLowerCase().includes(search)
      );
    }

    this.filteredPresences = filtered;
  }

  /**
   * Réinitialise la recherche
   */
  clearSearch(): void {
    this.searchTerm = '';
    this.filterPresences();
  }

  /**
   * Exporte les présences vers CSV
   */
  exportToExcel(): void {
    const csvData = this.convertToCSV(this.filteredPresences);
    const blob = new Blob(['\ufeff' + csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `presences_${this.data.match.adversaire}_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Convertit les présences en CSV
   */
  private convertToCSV(presences: Presence[]): string {
    const headers = ['Joueur', 'Type', 'Équipe', 'A joué', 'Capitaine', 'Buts', 'Passes', 'Cartons J', 'Cartons R', 'Homme du match'];
    const rows = presences.map(p => [
      this.getPlayerName(p),
      p.nomOccasionnel ? 'Occasionnel' : 'Membre',
      p.equipeMatch,
      p.aJoue ? 'Oui' : 'Non',
      p.estCapitaine ? 'Oui' : 'Non',
      p.buts.toString(),
      p.passes.toString(),
      p.cartonsJaunes.toString(),
      p.cartonsRouges.toString(),
      p.estHommeDuMatch ? 'Oui' : 'Non'
    ]);
    
    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n');
    
    return csvContent;
  }

  /**
   * Ferme le dialog
   */
  close(): void {
    this.dialogRef.close();
  }
}

// Dans votre composant feed, ajoutez cette méthode pour ouvrir le dialog :
/*
import { MatDialog } from '@angular/material/dialog';
import { MatchPresenceDialogComponent } from './match-presence-dialog/match-presence-dialog.component';

constructor(private dialog: MatDialog) {}

openPresenceDialog(match: any): void {
  this.dialog.open(MatchPresenceDialogComponent, {
    width: '800px',
    maxWidth: '95vw',
    maxHeight: '90vh',
    data: {
      match: match,
      presences: this.allPresences // Votre liste complète de présences
    },
    panelClass: 'modern-dialog'
  });
}
*/