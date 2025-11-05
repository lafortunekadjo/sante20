import { CommonModule, DatePipe } from '@angular/common';
import { Component, Inject, signal } from '@angular/core';
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
import { BehaviorSubject, Observable} from 'rxjs';
import { PresenceService } from '../../../../core/services/presence.service';
import { map, switchMap, catchError, debounceTime, distinctUntilChanged, tap, finalize } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';

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
  constructor( private presenceService: PresenceService,
    public dialogRef: MatDialogRef<CalendarComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { matches: Match[]; jourDeMatch: string },
    // DatePipe est maintenant disponible via CommonModule
  ) {}
  onClose(): void {
    this.dialogRef.close();
  }
  public hoverSubject = new BehaviorSubject<Match | null>(null);
    public isLoading = signal(false);
      public activeMatchId: number | null = null;


  isMatchPlayed(match: Match): boolean {
  const matchDate = new Date(match.dateMatch);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const hasRapporteur =
    !!match.rapporteur ||
    !!(match.rapporteurNomOccasionnel && match.rapporteurNomOccasionnel.trim() !== '');

  return matchDate < today && hasRapporteur;
}

isMatchMissed(match: Match): boolean {
  const matchDate = new Date(match.dateMatch);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const hasRapporteur =
    !!match.rapporteur ||
    (match.rapporteurNomOccasionnel && match.rapporteurNomOccasionnel.trim() !== '');

  return matchDate < today && !hasRapporteur;
}

  isMatchFuture(matchDate: string): boolean {
    const matchDateObj = new Date(matchDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return matchDateObj >= today;
  }

    public hoverDetails = toSignal(
    this.hoverSubject.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      tap(() => this.isLoading.set(true)), // Start loading
      switchMap(match => {
        if (!match) {
          this.isLoading.set(false);
          return new Observable<string>(observer => {
            observer.next('');
            observer.complete();
          });
        }
        return this.getMatchDetails(match).pipe(
          finalize(() => this.isLoading.set(false)), // Stop loading when done
          catchError(err => {
            console.error('Erreur lors de la récupération des détails:', err);
            return new Observable<string>(observer => {
              observer.next('Erreur de chargement');
              observer.complete();
            });
          })
        );
      }),
    ),
    { initialValue: '' }
  );

    onMouseEnter(match: Match) {
    this.activeMatchId = match.id;
    this.hoverSubject.next(match);
  }

  onMouseLeave() {
    this.activeMatchId = null;
    this.hoverSubject.next(null);
  }

getMatchDetails(match: Match): Observable<string> {
    const localTeamName = match.adversaire.split(' vs ')[0];
 console.log("start2")
    return this.presenceService.getPresencesByMatchId(match.id).pipe(
      map(presences => {
        const localGoals = presences
          .filter(p => p.equipeMatch === localTeamName)
          .reduce((sum, p) => sum + p.buts, 0);
         console.log(presences)
        const buteurs = presences
          .filter(p => p.buts > 0 && p.equipeMatch === localTeamName)
          .map(p => p.membre.nom)
          .join(', ');

        let adverseGoals = 0;
        if (match.typeMatch != 'AMICAL') {
          const adverseTeamName = match.adversaire.split(' vs ')[1];
          adverseGoals = presences
            .filter(p => p.equipeMatch === adverseTeamName)
            .reduce((sum, p) => sum + p.buts, 0);
        } else {
          adverseGoals = match.scoreAdversaire || 0;
        }

        const score = `${localGoals} - ${adverseGoals}`;
        const buteursString = buteurs.length > 0 ? `Buteurs: ${buteurs}` : 'Buteurs: N/A';

        // Retourne la chaîne de caractères finale
        return `Score: ${score}\n${buteursString}`;
      })
    );
  }
// getMatchDetails(match: Match): string {

//     // Simuler des détails (à remplacer par des champs réels si disponibles)

//     const score = match.commentaire?.includes('vs') ? '3-2' : 'Non disponible';

//     const buteurs = 'Joueur 1, Joueur 2'; // Exemple

//     return `Score: ${score}\nButeurs: ${buteurs}`;

//   }
  onMouseOver(match: Match): void {
    console.log('Tooltip for:', match.adversaire); // Log ici
  }

}
