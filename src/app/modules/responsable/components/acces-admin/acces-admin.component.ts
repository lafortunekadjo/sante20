import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';

import { AccesAdmin, AccesAdminService } from '../../../../core/services/acces-admin.service';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';

/**
 * Page où le responsable répond à une demande d'accès d'un administrateur à son groupe (cible du clic sur la
 * notification) : un gros bouton « Accepter », un bouton « Refuser », et « Retirer l'accès » quand il est actif.
 */
@Component({
  selector: 'app-acces-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatDialogModule, MatProgressSpinnerModule, TranslateModule],
  templateUrl: './acces-admin.component.html',
  styleUrl: './acces-admin.component.scss'
})
export class AccesAdminComponent implements OnInit {
  private api = inject(AccesAdminService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);

  readonly durees = [1, 7, 30];

  loading = signal(true);
  working = signal(false);
  acces = signal<AccesAdmin[]>([]);
  /** Durée choisie par demande (7 jours par défaut). */
  jours: Record<number, number> = {};

  enAttente = computed(() => this.acces().filter(a => a.statut === 'DEMANDE'));
  actifs = computed(() => this.acces().filter(a => a.actif));
  historique = computed(() => this.acces().filter(a => a.statut !== 'DEMANDE' && !a.actif));

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    this.loading.set(true);
    this.api.pourMonGroupe().subscribe({
      next: liste => {
        this.acces.set(liste);
        liste.forEach(a => { if (!this.jours[a.id]) this.jours[a.id] = 7; });
        this.loading.set(false);
      },
      error: err => {
        this.loading.set(false);
        this.afficherErreur(err);
      }
    });
  }

  accepter(a: AccesAdmin): void {
    this.executer(this.api.accorder(a.id, this.jours[a.id] ?? 7), 'accesAdmin.acceptedDone');
  }

  refuser(a: AccesAdmin): void {
    this.executer(this.api.refuser(a.id), 'accesAdmin.refusedDone');
  }

  retirer(a: AccesAdmin): void {
    this.dialog.open(ConfirmationDialogComponent, { data: { message: this.translate.instant('accesAdmin.confirmRevoke'), type: 'warning' } })
      .afterClosed().subscribe(oui => { if (oui) this.executer(this.api.revoquer(a.id), 'accesAdmin.revokedDone'); });
  }

  private executer(appel: Observable<unknown>, cleSucces: string): void {
    this.working.set(true);
    appel.subscribe({
      next: () => {
        this.working.set(false);
        this.snackBar.open(this.translate.instant(cleSucces), this.translate.instant('accesAdmin.close'), { duration: 3500 });
        this.charger();
      },
      error: err => {
        this.working.set(false);
        this.afficherErreur(err);
      }
    });
  }

  private afficherErreur(err: any): void {
    const message = err?.error?.message ?? (typeof err?.error === 'string' ? err.error : this.translate.instant('accesAdmin.errorGeneric'));
    this.snackBar.open(message, this.translate.instant('accesAdmin.close'), { duration: 5000 });
  }
}
