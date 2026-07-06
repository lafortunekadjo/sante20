import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface JoueurInviteResponse {
  id: number;
  nom: string;
  prenom: string;
  numeroMaillot?: number;
  poste?: string;
  estCapitaine: boolean;
  estGardien: boolean;
}

export interface PlayersListDialogData {
  nomEquipeAdverse: string;
  emailContact?: string;
  telephoneContact?: string;
  joueurs: JoueurInviteResponse[];
  canValidate: boolean;
  invitationId?: number;
}

@Component({
  selector: 'app-players-list-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './players-list-dialog.component.html',
  styleUrls: ['./players-list-dialog.component.scss']
})
export class PlayersListDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<PlayersListDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PlayersListDialogData
  ) {}

  // ===== UTILITAIRES =====

  getInitiales(joueur: JoueurInviteResponse): string {
    const prenom = joueur.prenom?.charAt(0) || '';
    const nom = joueur.nom?.charAt(0) || '';
    return (prenom + nom).toUpperCase();
  }

  getCapitaineNom(): string {
    const capitaine = this.data.joueurs.find(j => j.estCapitaine);
    if (capitaine) {
      return `${capitaine.prenom} ${capitaine.nom.charAt(0)}.`;
    }
    return 'Non défini';
  }

  countGardiens(): number {
    return this.data.joueurs.filter(j => j.estGardien).length;
  }

  // ===== ACTIONS =====

  close(): void {
    this.dialogRef.close();
  }

  validate(): void {
    this.dialogRef.close({ action: 'validate', invitationId: this.data.invitationId });
  }

  reject(): void {
    this.dialogRef.close({ action: 'reject', invitationId: this.data.invitationId });
  }
}