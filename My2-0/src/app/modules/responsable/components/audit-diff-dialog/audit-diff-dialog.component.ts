import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-audit-diff-dialog',
  standalone: true, // Crucial pour Angular 17+
  imports: [
    CommonModule, 
    MatDialogModule, 
    MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>Comparaison des modifications</h2>
    <mat-dialog-content>
      <div class="diff-info">
        <p><strong>Par :</strong> {{ data.user }}</p>
        <p><strong>Le :</strong> {{ data.date | date:'short' }}</p>
      </div>

      <div class="diff-table-container">
        <table class="diff-table">
          <thead>
            <tr>
              <th>Champ</th>
              <th>Ancienne valeur</th>
              <th>Nouvelle valeur</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let diff of differences" [class.changed]="diff.isChanged">
              <td class="field-name">{{ diff.field }}</td>
              <td class="old-val">{{ diff.oldValue ?? '---' }}</td>
              <td class="new-val">{{ diff.newValue ?? '---' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onClose()">Fermer</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .diff-info { margin-bottom: 20px; font-size: 0.9rem; color: var(--text-secondary); }
    .diff-table-container { border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden; }
    .diff-table { width: 100%; border-collapse: collapse; background: var(--background-secondary); }
    th { text-align: left; padding: 12px; background: var(--background-tertiary); font-size: 0.8rem; }
    td { padding: 12px; border-top: 1px solid var(--border-color); font-size: 0.9rem; }
    .field-name { font-weight: 600; color: var(--text-secondary); width: 30%; }
    .changed { background: rgba(var(--primary-rgb), 0.05); }
    .old-val { color: #f44336; text-decoration: line-through; }
    .new-val { color: #4caf50; font-weight: 600; }
  `]
})
export class AuditDiffDialogComponent {
  differences: any[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<AuditDiffDialogComponent>
  ) {
    this.calculateDiff();
  }

  calculateDiff() {
    const current = this.data.current || {};
    const previous = this.data.previous || {};
    
    // On récupère toutes les clés uniques des deux objets
    const allKeys = Array.from(new Set([...Object.keys(current), ...Object.keys(previous)]));

    this.differences = allKeys
      .filter(key => key !== 'id' && key !== 'groupeId') // On ignore les IDs techniques
      .map(key => ({
        field: key,
        oldValue: previous[key],
        newValue: current[key],
        isChanged: JSON.stringify(previous[key]) !== JSON.stringify(current[key])
      }))
      .filter(diff => diff.isChanged); // On ne montre que ce qui a changé
  }

  onClose(): void {
    this.dialogRef.close();
  }
}