import { CommonModule, DatePipe } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { Match } from '../../../../core/models/match.model';
import { MatGridListModule } from '@angular/material/grid-list';

@Component({
  selector: 'app-calendar',
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
    FormsModule,
    MatGridListModule
    ],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss'
})
export class CalendarComponent {
  constructor(
    public dialogRef: MatDialogRef<CalendarComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { matches: Match[]; jourDeMatch: string },
    // DatePipe est maintenant disponible via CommonModule
  ) {}
  onClose(): void {
    this.dialogRef.close();
  }

  isMatchPlayed(matchDate: string): boolean {
    const matchDateObj = new Date(matchDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return matchDateObj < today;
  }

  isMatchMissed(matchDate: string): boolean {
    const matchDateObj = new Date(matchDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return matchDateObj < today && !this.isMatchPlayed(matchDate); // À ajuster si "non joué" a une définition différente
  }

  isMatchFuture(matchDate: string): boolean {
    const matchDateObj = new Date(matchDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return matchDateObj >= today;
  }

  getMatchDetails(match: Match): string {
    // Simuler des détails (à remplacer par des champs réels si disponibles)
    const score = match.commentaire?.includes('vs') ? '3-2' : 'Non disponible';
    const buteurs = 'Joueur 1, Joueur 2'; // Exemple
    return `Score: ${score}\nButeurs: ${buteurs}`;
  }
  onMouseOver(match: Match): void {
    console.log('Tooltip for:', match.adversaire); // Log ici
  }

}
