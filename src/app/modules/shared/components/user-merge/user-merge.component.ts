import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { environment } from '../../../../environment';
import { debounceTime, distinctUntilChanged, Subject, switchMap, of } from 'rxjs';

interface UserSummary { id: number; username: string; email: string; }
interface GroupeTransfer { groupeId: number; groupeNom: string; doublon: boolean; }
interface MergePreview {
  userA: UserSummary;
  userB: UserSummary;
  profilANom: string | null;
  profilBNom: string | null;
  groupesATransferer: GroupeTransfer[];
  groupesDoublon: GroupeTransfer[];
}
interface MergeResult {
  success: boolean;
  message: string;
  usernameA: string;
  usernameB: string;
  fichesMembresTransferees: number;
  groupesFusionnes: string[];
  groupesIgnores: string[];
}

@Component({
  selector: 'app-user-merge',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatInputModule,
    MatFormFieldModule, MatAutocompleteModule, MatProgressSpinnerModule,
    MatChipsModule, MatDividerModule, MatSnackBarModule, MatDialogModule
  ],
  templateUrl: './user-merge.component.html',
  styleUrl: './user-merge.component.scss'
})
export class UserMergeComponent {
  private http     = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  private dialog   = inject(MatDialog);
  private base     = `${environment.apiUrl}/admin/users`;

  // ── Recherche users ──────────────────────────────────────────────
  searchA = '';
  searchB = '';
  resultsA: UserSummary[] = [];
  resultsB: UserSummary[] = [];
  selectedA: UserSummary | null = null;
  selectedB: UserSummary | null = null;

  // ── État ─────────────────────────────────────────────────────────
  preview: MergePreview | null = null;
  result:  MergeResult  | null = null;
  isLoadingPreview = false;
  isMerging        = false;

  // ── Recherche autocomplete ────────────────────────────────────────
  searchUsers(query: string, side: 'A' | 'B'): void {
    if (!query || query.length < 2) {
      if (side === 'A') this.resultsA = [];
      else              this.resultsB = [];
      return;
    }
    this.http.get<UserSummary[]>(`${environment.apiUrl}/admin/users/search?q=${query}`)
      .subscribe(users => {
        if (side === 'A') this.resultsA = users;
        else              this.resultsB = users;
      });
  }

  selectUser(user: UserSummary, side: 'A' | 'B'): void {
    if (side === 'A') {
      this.selectedA = user;
      this.searchA   = user.username;
      this.resultsA  = [];
    } else {
      this.selectedB = user;
      this.searchB   = user.username;
      this.resultsB  = [];
    }
    this.preview = null;
    this.result  = null;
  }

  clearSelection(side: 'A' | 'B'): void {
    if (side === 'A') { this.selectedA = null; this.searchA = ''; }
    else              { this.selectedB = null; this.searchB = ''; }
    this.preview = null;
    this.result  = null;
  }

  // ── Preview ───────────────────────────────────────────────────────
  loadPreview(): void {
    if (!this.selectedA || !this.selectedB) return;
    this.isLoadingPreview = true;
    this.preview = null;
    this.result  = null;

    this.http.get<MergePreview>(
      `${this.base}/merge/preview?userAId=${this.selectedA.id}&userBId=${this.selectedB.id}`
    ).subscribe({
      next: p => { this.preview = p; this.isLoadingPreview = false; },
      error: () => {
        this.snackBar.open('Erreur lors de l\'aperçu', 'Fermer', { duration: 3000 });
        this.isLoadingPreview = false;
      }
    });
  }

  // ── Fusion ────────────────────────────────────────────────────────
  confirmMerge(): void {
    if (!this.selectedA || !this.selectedB) return;

    this.dialog.open(ConfirmationDialogComponent, {
      width: '480px',
      data: {
        title: 'Confirmer la fusion',
        message: `Fusionner <strong>${this.selectedB.username}</strong> dans <strong>${this.selectedA.username}</strong> ?
                 <br><br>
                 Cette action est <strong>irréversible</strong>.<br>
                 • ${this.selectedB.username} sera désactivé<br>
                 • Ses fiches membres seront transférées à ${this.selectedA.username}`,
        confirmText: 'Fusionner',
        cancelText: 'Annuler',
        type: 'warning'
      }
    }).afterClosed().subscribe(confirmed => {
      if (confirmed) this.executeMerge();
    });
  }

  private executeMerge(): void {
    if (!this.selectedA || !this.selectedB) return;
    this.isMerging = true;

    this.http.post<MergeResult>(
      `${this.base}/merge?userAId=${this.selectedA.id}&userBId=${this.selectedB.id}`,
      {}
    ).subscribe({
      next: result => {
        this.result  = result;
        this.preview = null;
        this.isMerging = false;
        this.snackBar.open('Fusion réussie !', 'OK', { duration: 4000 });
      },
      error: err => {
        this.snackBar.open(
          err.error?.message || 'Erreur lors de la fusion',
          'Fermer', { duration: 5000 }
        );
        this.isMerging = false;
      }
    });
  }

  // ── Swap A ↔ B ───────────────────────────────────────────────────
  swap(): void {
    [this.selectedA, this.selectedB] = [this.selectedB, this.selectedA];
    [this.searchA,   this.searchB]   = [this.searchB,   this.searchA];
    this.preview = null;
    this.result  = null;
  }

  canPreview(): boolean {
    return !!this.selectedA && !!this.selectedB
        && this.selectedA.id !== this.selectedB.id;
  }

  reset(): void {
    this.selectedA = this.selectedB = null;
    this.searchA   = this.searchB   = '';
    this.preview   = this.result    = null;
  }
}