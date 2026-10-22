import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AuthService } from '../../../../core/services/auth.service';
import { Exercice, FinancesService } from '../../../../core/services/finances.service';
import { RapportResume, RapportService, TypeRapport } from '../../../../core/services/rapport.service';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';

type ModePeriode = 'EXERCICE' | 'PERIODE';

/**
 * Rapports PDF : financier, sportif ou global, sur un exercice (en cours ou passé) ou une période libre,
 * en français ou en anglais. Chaque rapport généré est archivé et peut être rouvert tel qu'il a été émis.
 */
@Component({
  selector: 'app-rapports',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatDialogModule, MatProgressSpinnerModule, TranslateModule],
  templateUrl: './rapports.component.html',
  styleUrl: './rapports.component.scss'
})
export class RapportsComponent implements OnInit, OnDestroy {
  private rapports = inject(RapportService);
  private finances = inject(FinancesService);
  private auth = inject(AuthService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private sanitizer = inject(DomSanitizer);
  private translate = inject(TranslateService);

  readonly types: { code: TypeRapport; icone: string }[] = [
    { code: 'FINANCIER', icone: 'account_balance_wallet' },
    { code: 'SPORTIF', icone: 'sports_soccer' },
    { code: 'GLOBAL', icone: 'dashboard' }
  ];

  loading = signal(true);
  generating = signal(false);
  exercices = signal<Exercice[]>([]);
  archive = signal<RapportResume[]>([]);

  type: TypeRapport = 'FINANCIER';
  mode: ModePeriode = 'EXERCICE';
  exerciceId: number | null = null;
  debut = '';
  fin = '';
  langue: 'fr' | 'en' = this.translate.currentLang === 'en' ? 'en' : 'fr';
  inclureCompetitions = false;

  /** Aperçu en cours (PDF dans une fenêtre intégrée). */
  apercu = signal<{ rapport: RapportResume; url: SafeResourceUrl } | null>(null);
  private urlObjet: string | null = null;

  exerciceChoisi = computed(() => this.exercices().find(e => e.id === this.exerciceId) ?? null);

  ngOnInit(): void {
    const groupeId = this.auth.getGroupe();
    forkJoin({
      exercices: groupeId ? this.finances.getExercicesGroupe(groupeId).pipe(catchError(() => of([] as Exercice[]))) : of([] as Exercice[]),
      archive: this.rapports.lister().pipe(catchError(() => {
        this.snackBar.open(this.translate.instant('rapports.loadError'), this.translate.instant('rapports.close'), { duration: 5000 });
        return of([] as RapportResume[]);
      }))
    }).subscribe(({ exercices, archive }) => {
      const tries = [...exercices].sort((a, b) => (b.annee ?? 0) - (a.annee ?? 0));
      this.exercices.set(tries);
      this.exerciceId = (tries.find(e => e.actif) ?? tries[0])?.id ?? null;
      if (!tries.length) this.mode = 'PERIODE';
      this.archive.set(archive);
      this.loading.set(false);
    });
  }

  ngOnDestroy(): void { this.libererApercu(); }

  // ── Formulaire ────────────────────────────────────────────
  get avecCompetitions(): boolean { return this.type !== 'FINANCIER'; }

  get periodeValide(): boolean {
    if (this.mode === 'EXERCICE') return this.exerciceId != null;
    return !!this.debut && !!this.fin && this.debut <= this.fin;
  }

  private iso(d: Date): string {
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }

  raccourci(nom: 'mois' | 'moisPrecedent' | 'trimestre' | 'douzeMois'): void {
    const n = new Date();
    let d: Date, f: Date = n;
    switch (nom) {
      case 'mois': d = new Date(n.getFullYear(), n.getMonth(), 1); break;
      case 'moisPrecedent': d = new Date(n.getFullYear(), n.getMonth() - 1, 1); f = new Date(n.getFullYear(), n.getMonth(), 0); break;
      case 'trimestre': d = new Date(n.getFullYear(), Math.floor(n.getMonth() / 3) * 3, 1); break;
      default: d = new Date(n.getFullYear() - 1, n.getMonth(), n.getDate() + 1);
    }
    this.debut = this.iso(d);
    this.fin = this.iso(f);
  }

  generer(): void {
    if (!this.periodeValide || this.generating()) return;
    this.generating.set(true);
    this.rapports.generer({
      type: this.type,
      langue: this.langue,
      exerciceId: this.mode === 'EXERCICE' ? this.exerciceId : null,
      dateDebut: this.mode === 'PERIODE' ? this.debut : null,
      dateFin: this.mode === 'PERIODE' ? this.fin : null,
      inclureCompetitions: this.avecCompetitions && this.inclureCompetitions
    }).subscribe({
      next: r => {
        this.generating.set(false);
        this.archive.update(l => [r, ...l]);
        this.snackBar.open(this.translate.instant('rapports.generated'), undefined, { duration: 3000 });
        this.voir(r);
      },
      error: err => {
        this.generating.set(false);
        this.snackBar.open(err?.error?.message ?? this.translate.instant('rapports.genError'),
          this.translate.instant('rapports.close'), { duration: 6000 });
      }
    });
  }

  // ── Archive ───────────────────────────────────────────────
  voir(r: RapportResume): void {
    this.rapports.pdf(r.id).subscribe({
      next: blob => {
        this.libererApercu();
        this.urlObjet = URL.createObjectURL(blob);
        this.apercu.set({ rapport: r, url: this.sanitizer.bypassSecurityTrustResourceUrl(this.urlObjet) });
      },
      error: () => this.snackBar.open(this.translate.instant('rapports.openError'), this.translate.instant('rapports.close'), { duration: 5000 })
    });
  }

  fermerApercu(): void { this.libererApercu(); this.apercu.set(null); }

  private libererApercu(): void {
    if (this.urlObjet) { URL.revokeObjectURL(this.urlObjet); this.urlObjet = null; }
  }

  telecharger(r: RapportResume): void {
    this.rapports.pdf(r.id).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = r.titre.replace(/[^\p{L}\p{N} _.-]/gu, '').trim().replace(/\s+/g, '_') + '.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      },
      error: () => this.snackBar.open(this.translate.instant('rapports.openError'), this.translate.instant('rapports.close'), { duration: 5000 })
    });
  }

  supprimer(r: RapportResume): void {
    this.dialog.open(ConfirmationDialogComponent, { data: { message: this.translate.instant('rapports.deleteConfirm') } })
      .afterClosed().subscribe(oui => {
        if (!oui) return;
        this.rapports.supprimer(r.id).subscribe({
          next: () => {
            this.archive.update(l => l.filter(x => x.id !== r.id));
            if (this.apercu()?.rapport.id === r.id) this.fermerApercu();
          },
          error: err => this.snackBar.open(err?.error?.message ?? this.translate.instant('rapports.deleteError'),
            this.translate.instant('rapports.close'), { duration: 5000 })
        });
      });
  }

  icone(type: TypeRapport): string { return this.types.find(t => t.code === type)?.icone ?? 'summarize'; }
  taille(octets: number): string { return octets >= 1048576 ? (octets / 1048576).toFixed(1) + ' Mo' : Math.max(1, Math.round(octets / 1024)) + ' Ko'; }
}
