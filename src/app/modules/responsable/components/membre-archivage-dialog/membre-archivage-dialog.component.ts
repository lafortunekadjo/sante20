import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { MembreService } from '../../../../core/services/membre.service';

export type ModeArchivage = 'archiver' | 'retour' | 'historique';

export interface ArchivageDialogData {
  mode: ModeArchivage;
  membre: { id: number; prenom?: string; nom?: string; dateDepart?: string | null; motifDepart?: string | null };
}

export interface EvenementMembre {
  type: 'ARRIVEE' | 'DEPART' | 'RETOUR';
  date: string;
  motif?: string | null;
  commentaire?: string | null;
  auteur?: string | null;
}

/** Archiver un membre (motif, date, commentaire), enregistrer son retour, ou consulter son parcours. */
@Component({
  selector: 'app-membre-archivage-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, TranslateModule],
  templateUrl: './membre-archivage-dialog.component.html',
  styleUrl: './membre-archivage-dialog.component.scss'
})
export class MembreArchivageDialogComponent implements OnInit {
  readonly motifs = ['DEMENAGEMENT', 'ABANDON', 'BLESSURE', 'TRAVAIL', 'EXCLUSION', 'AUTRE'];

  motif = '';
  commentaire = '';
  date = new Date().toISOString().substring(0, 10);
  readonly aujourdhui = this.date;

  envoiEnCours = false;
  erreur = '';

  evenements: EvenementMembre[] = [];
  chargement = false;

  constructor(
    private dialogRef: MatDialogRef<MembreArchivageDialogComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public data: ArchivageDialogData,
    private membreService: MembreService
  ) {}

  get nom(): string {
    return `${this.data.membre.prenom ?? ''} ${this.data.membre.nom ?? ''}`.trim();
  }

  ngOnInit(): void {
    if (this.data.mode === 'historique') {
      this.chargement = true;
      this.membreService.historiqueMembre(this.data.membre.id).subscribe({
        next: l => { this.evenements = l; this.chargement = false; },
        error: () => { this.erreur = 'membres.archive.loadError'; this.chargement = false; }
      });
    }
  }

  get valide(): boolean {
    if (this.data.mode === 'archiver') return !!this.motif && !!this.date;
    return !!this.date;
  }

  icone(type: string): string {
    return type === 'DEPART' ? 'logout' : type === 'RETOUR' ? 'login' : 'person_add';
  }

  valider(): void {
    if (!this.valide || this.envoiEnCours) return;
    this.envoiEnCours = true;
    this.erreur = '';
    const appel = this.data.mode === 'archiver'
      ? this.membreService.archiverMembre(this.data.membre.id, { motif: this.motif, commentaire: this.commentaire, dateDepart: this.date })
      : this.membreService.reactiverMembre(this.data.membre.id, { commentaire: this.commentaire, dateRetour: this.date });
    appel.subscribe({
      next: () => { this.envoiEnCours = false; this.dialogRef.close(true); },
      error: err => {
        this.envoiEnCours = false;
        this.erreur = err?.error?.message || 'membres.archive.error';
      }
    });
  }

  fermer(): void {
    this.dialogRef.close(false);
  }
}
