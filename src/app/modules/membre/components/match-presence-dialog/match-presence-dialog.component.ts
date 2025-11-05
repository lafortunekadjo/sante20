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
import { MatMenuModule } from "@angular/material/menu";
import { MatListModule } from "@angular/material/list";



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
    MatMenuModule,
    MatListModule,
    
    
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
  snackBar: any;

  constructor(
    public dialogRef: MatDialogRef<MatchPresenceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { match: any; presences: BehaviorSubject<Presence[]> }
  ) {}

  ngOnInit(): void {
    // Filtrer les présences pour ce match spécifique
    // Tous ceux dans la liste sont présents
    console.log(this.data.presences.value)
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
   * Génère le texte formaté pour le partage
   */
  generateShareText(): string {
    const matchDate = new Date(this.data.match.dateMatch);
    const dateStr = matchDate.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });

    let text = `⚽ COMPOSITION DU MATCH du ${this.data.match.dateMatch}\n`;
    text += `📅 ${dateStr} - ${this.data.match.adversaire}\n`;
    text += `${this.data.match.typeMatch ? `🏆 ${this.data.match.typeMatch}\n` : ''}`;
    text += `\n━━━━━━━━━━━━━━━━━━\n`;
    text += `👥 ${this.getTotalCount()} joueurs présents\n`;
    text += `⚽ ${this.getPlayedCount()} ont joué | 🪑 ${this.getBenchCount()} spectateur(s)\n`;
    text += `\n`;

    // Statistiques globales
    const totalButs = this.allPresences.reduce((sum, p) => sum + p.buts + p.penalti + p.butsContreSonCamp, 0);
    const totalPasses = this.allPresences.reduce((sum, p) => sum + p.passes, 0);
    if (totalButs > 0 || totalPasses > 0) {
      text += `📊 STATISTIQUES GLOBALES\n`;
      if (totalButs > 0) text += `⚽ ${totalButs} but${totalButs > 1 ? 's' : ''} marqué${totalButs > 1 ? 's' : ''}\n`;
      if (totalPasses > 0) text += `🎯 ${totalPasses} passe${totalPasses > 1 ? 's' : ''} décisive${totalPasses > 1 ? 's' : ''}\n`;
      text += `\n`;
    }

    // Par équipe
    this.teams.forEach(team => {
      const teamPresences = this.allPresences.filter(p => p.equipeMatch === team);
      text += `━━━━━━━━━━━━━━━━━━\n`;
      text += `🛡️ ÉQUIPE ${team.toUpperCase()}\n`;
      text += `━━━━━━━━━━━━━━━━━━\n\n`;

      teamPresences.forEach(p => {
        const name = this.getPlayerName(p);
        let line = p.estCapitaine ? `👑 ${name}` : `• ${name}`;
        
        if (p.estHommeDuMatch) {
          line += ` ⭐`;
        }
        
        const stats: string[] = [];
        if (p.buts > 0) stats.push(`⚽${p.buts}`);
        if (p.penalti > 0) stats.push(`⚡️${p.penalti}`);
        if (p.butsContreSonCamp > 0) stats.push(`🤦${p.butsContreSonCamp}`);
        if (p.passes > 0) stats.push(`🎯${p.passes}`);
        if (p.cartonsJaunes > 0) stats.push(`🟨${p.cartonsJaunes}`);
        if (p.cartonsRouges > 0) stats.push(`🟥${p.cartonsRouges}`);
        
        if (stats.length > 0) {
          line += ` (${stats.join(' ')})`;
        }
        
        if (!p.aJoue) {
          line += ` 🪑`;
        }
        
        text += line + '\n';
      });
      text += `\n`;
    });

    // Homme du match
    const motm = this.allPresences.find(p => p.estHommeDuMatch);
    if (motm) {
      text += `━━━━━━━━━━━━━━━━━━\n`;
      text += `⭐ HOMME DU MATCH\n`;
      text += `${this.getPlayerName(motm)}\n`;
      if (this.hasStats(motm)) {
        text += `${this.getPlayerStats(motm)}\n`;
      }
      text += `\n`;
    }

    text += `━━━━━━━━━━━━━━━━━━\n`;
    text += `🏅 Légende : ⚽ Buts | 🎯 Passes | 🟨 Carton jaune | 🟥 Carton rouge | 🪑 Remplaçant | 👑 Capitaine | ⭐ Homme du match`;

    return text;
  }

  /**
   * Partage sur WhatsApp
   */
  shareOnWhatsApp(): void {
    const text = this.generateShareText();
    const encodedText = encodeURIComponent(text);
    
    // WhatsApp Web
    const whatsappUrl = `https://wa.me/?text=${encodedText}`;
    
    // Tenter d'ouvrir dans une nouvelle fenêtre
    const newWindow = window.open(whatsappUrl, '_blank');
    
    if (!newWindow) {
      // Si le popup est bloqué, copier dans le presse-papier
      this.copyToClipboard(text);
      this.snackBar.open('Texte copié ! Collez-le dans WhatsApp', 'OK', {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['success-snackbar']
      });
    } else {
      this.snackBar.open('Ouverture de WhatsApp...', '', {
        duration: 2000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom'
      });
    }
  }

  /**
   * Partage sur Facebook
   */
  shareOnFacebook(): void {
    const text = this.generateShareText();
    
    // Facebook ne supporte pas le partage de texte pur via URL
    // On copie le texte dans le presse-papier
    this.copyToClipboard(text);
    
    // Ouvrir Facebook pour créer un post
    const facebookUrl = 'https://www.facebook.com/';
    window.open(facebookUrl, '_blank');
    
    this.snackBar.open('Texte copié ! Collez-le dans votre publication Facebook', 'OK', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['info-snackbar']
    });
  }

  /**
   * Copie le texte dans le presse-papier
   */
  private copyToClipboard(text: string): void {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(err => {
        console.error('Erreur lors de la copie:', err);
        this.fallbackCopyToClipboard(text);
      });
    } else {
      this.fallbackCopyToClipboard(text);
    }
  }

  /**
   * Méthode de secours pour copier dans le presse-papier
   */
  private fallbackCopyToClipboard(text: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('Erreur lors de la copie:', err);
    }
    
    document.body.removeChild(textArea);
  }

  /**
   * Partage générique (copie dans le presse-papier)
   */
  copyShareText(): void {
    const text = this.generateShareText();
    this.copyToClipboard(text);
    
    this.snackBar.open('✓ Texte copié dans le presse-papier !', 'OK', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['success-snackbar']
    });
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