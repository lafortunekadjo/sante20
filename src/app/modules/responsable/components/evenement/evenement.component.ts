import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject, forkJoin, of, takeUntil } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { GeneralService } from '../../../../core/services/general.service';
import { FinancesService } from '../../../../core/services/finances.service';
import { MembreService } from '../../../../core/services/membre.service';
import { AuthService } from '../../../../core/services/auth.service';
import { GroupeContextService } from '../../../../core/services/groupe-context.service';
import { Membre } from '../../../../core/models/membre.model';
import {
  EvenementBilan, EvenementCollecte, MODES_COLLECTE, ModeCollecte, modeDe
} from '../../../../core/models/collecte.model';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { EvenementBilanDialogComponent } from '../evenement-bilan-dialog/evenement-bilan-dialog.component';

/** Catégories d'événement : famille (heureux / malheureux) et collecte proposée par défaut. Libellés : collecte.types.<CODE>. */
const TYPES: Record<string, { famille: 'heureux' | 'malheureux' | 'neutre'; collecteParDefaut: boolean }> = {
  DECES:        { famille: 'malheureux', collecteParDefaut: true },
  MARIAGE:      { famille: 'heureux',    collecteParDefaut: true },
  NAISSANCE:    { famille: 'heureux',    collecteParDefaut: true },
  BAPTEME:      { famille: 'heureux',    collecteParDefaut: true },
  ANNIVERSAIRE: { famille: 'heureux',    collecteParDefaut: false },
  AUTRE:        { famille: 'neutre',     collecteParDefaut: false },
  // anciennes valeurs saisies avant les catégories ci-dessus
  Heureux:      { famille: 'heureux',    collecteParDefaut: true },
  Malheureux:   { famille: 'malheureux', collecteParDefaut: true }
};

interface FormEvenement {
  id: number | null;
  nomEvenement: string;
  description: string;
  typeEvenement: string;
  dateEvenement: Date;
  idMembreLie: number | null;
  ouvrirCollecte: boolean;
  modeCollecte: ModeCollecte;
  montant: number | null;
  objectif: number | null;
  delai: Date | null;
}

/**
 * Événements du groupe et leur collecte.
 * Une collecte n'exige plus de « type de contribution » : chaque versement est une entrée de la caisse Événements
 * rattachée à l'événement (voir « Entrée de caisse »), et le bilan se lit par événement.
 */
@Component({
  selector: 'app-evenement',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule, TranslateModule,
    MatDialogModule, MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatCheckboxModule,
    MatDatepickerModule, MatNativeDateModule, MatProgressSpinnerModule, MatTooltipModule
  ],
  templateUrl: './evenement.component.html',
  styleUrl: './evenement.component.scss'
})
export class EvenementComponent implements OnInit, OnDestroy {
  private evenementService = inject(GeneralService);
  private finances = inject(FinancesService);
  private membreService = inject(MembreService);
  private authService = inject(AuthService);
  private groupeContext = inject(GroupeContextService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);
  private destroy$ = new Subject<void>();

  readonly modes = MODES_COLLECTE;
  readonly types = Object.keys(TYPES).filter(k => !['Heureux', 'Malheureux'].includes(k));

  isLoading = true;
  showCreateRow = false;
  saving = signal(false);
  erreur = signal<string | null>(null);

  evenements = signal<EvenementCollecte[]>([]);
  bilans = signal<Record<number, EvenementBilan>>({});
  membres: Membre[] = [];

  form: FormEvenement = this.formVide();

  nbCollectesOuvertes = computed(() => this.evenements().filter(e => e.estContributionOuverte).length);
  totalCollecte = computed(() => Object.values(this.bilans()).reduce((s, b) => s + (b.totalCollecte ?? 0), 0));

  ngOnInit(): void {
    this.charger();
    this.membreService.getGroupMembers().subscribe({ next: m => this.membres = m, error: () => {} });
    this.groupeContext.groupeChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => this.charger());
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  // ── Chargement ────────────────────────────────────────────
  charger(): void {
    this.isLoading = true;
    // endpoint du GROUPE (l'ancien chargeait les événements de tous les groupes)
    this.finances.getEvenementsGroupe().subscribe({
      next: liste => {
        this.evenements.set([...liste].sort((a, b) => (b.dateEvenement ?? '').localeCompare(a.dateEvenement ?? '')));
        this.isLoading = false;
        this.chargerBilans(liste);
      },
      error: () => { this.isLoading = false; this.snackBar.open(this.t('page.loadError'), this.t('page.close'), { duration: 4000 }); }
    });
  }

  private chargerBilans(liste: EvenementCollecte[]): void {
    if (!liste.length) { this.bilans.set({}); return; }
    forkJoin(liste.map(e => this.finances.getEvenementBilan(e.id).pipe(catchError(() => of(null)))))
      .subscribe(res => {
        const map: Record<number, EvenementBilan> = {};
        res.forEach(b => { if (b) map[b.evenementId] = b; });
        this.bilans.set(map);
      });
  }

  // ── Présentation ──────────────────────────────────────────
  private t(cle: string, params?: object): string { return this.translate.instant('collecte.' + cle, params); }
  label(type: string): string { return TYPES[type] ? this.t('types.' + type) : type; }
  famille(type: string): string { return TYPES[type]?.famille ?? 'neutre'; }
  mode(e: EvenementCollecte): ModeCollecte { return modeDe(e); }
  fcfa(n: number | null | undefined): string { return (n ?? 0).toLocaleString('fr-FR') + ' FCFA'; }
  pourcent(v: number, total: number): number { return total > 0 ? Math.min(100, Math.round((v / total) * 100)) : 0; }
  nomMembre(id: number | null | undefined): string {
    const m = this.membres.find(x => x.id === id);
    return m ? `${m.prenom ?? ''} ${m.nom ?? ''}`.trim() : '';
  }

  // ── Formulaire ────────────────────────────────────────────
  private formVide(): FormEvenement {
    return { id: null, nomEvenement: '', description: '', typeEvenement: 'AUTRE', dateEvenement: new Date(), idMembreLie: null,
             ouvrirCollecte: false, modeCollecte: 'LIBRE', montant: null, objectif: null, delai: null };
  }

  toggleCreateRow(): void {
    this.showCreateRow = !this.showCreateRow;
    if (this.showCreateRow) { this.form = this.formVide(); this.erreur.set(null); }
  }

  cancelCreate(): void { this.showCreateRow = false; this.erreur.set(null); }

  /** À chaque changement de catégorie, la collecte est proposée (ou non) selon l'usage habituel — modifiable. */
  onTypeChange(): void {
    if (!this.form.id) this.form.ouvrirCollecte = TYPES[this.form.typeEvenement]?.collecteParDefaut ?? false;
  }

  modifier(e: EvenementCollecte): void {
    this.form = {
      id: e.id, nomEvenement: e.nomEvenement, description: e.description ?? '', typeEvenement: e.typeEvenement,
      dateEvenement: e.dateEvenement ? new Date(e.dateEvenement) : new Date(), idMembreLie: e.membreLie?.id ?? null,
      ouvrirCollecte: e.estContributionOuverte, modeCollecte: modeDe(e), montant: e.montantRequisParMembre ?? null,
      objectif: e.objectifGlobal ?? null, delai: e.delaiCollecte ? new Date(e.delaiCollecte) : null
    };
    this.erreur.set(null);
    this.showCreateRow = true;
  }

  formValide(): boolean {
    const f = this.form;
    if (!f.nomEvenement.trim()) return false;
    if (!f.ouvrirCollecte) return true;
    if (f.modeCollecte === 'FIXE') return (f.montant ?? 0) > 0;
    if (f.modeCollecte === 'OBJECTIF') return (f.objectif ?? 0) > 0;
    return true;
  }
  isCreateFormValid(): boolean { return this.formValide(); }

  saveEvenement(): void {
    if (!this.formValide() || this.saving()) return;
    const f = this.form;
    const iso = (d: Date | null) => d ? new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10) : null;
    const corps: any = {
      nomEvenement: f.nomEvenement.trim(), description: f.description.trim(), typeEvenement: f.typeEvenement,
      dateEvenement: new Date(f.dateEvenement).toISOString(), idMembreLie: f.idMembreLie,
      estContributionOuverte: f.ouvrirCollecte,
      modeCollecte: f.ouvrirCollecte ? f.modeCollecte : null,
      montantRequisParMembre: f.ouvrirCollecte && f.modeCollecte === 'FIXE' ? f.montant : null,
      objectifGlobal: f.ouvrirCollecte && f.modeCollecte === 'OBJECTIF' ? f.objectif : null,
      delaiCollecte: f.ouvrirCollecte ? iso(f.delai) : null
    };
    this.saving.set(true);
    this.erreur.set(null);
    const requete = f.id
      ? this.evenementService.updateEvenement(f.id, corps)
      : this.evenementService.createEvenement(corps);
    requete.subscribe({
      next: () => { this.saving.set(false); this.showCreateRow = false; this.charger(); },
      error: err => { this.saving.set(false); this.erreur.set(err?.error?.message ?? this.t('page.saveError')); }
    });
  }

  // ── Actions sur un événement ──────────────────────────────
  ouvrirBilan(e: EvenementCollecte): void {
    this.dialog.open(EvenementBilanDialogComponent, { data: { evenementId: e.id }, width: '560px', maxWidth: '96vw' })
      .afterClosed().subscribe(modifie => { if (modifie) this.charger(); });
  }

  basculerCollecte(e: EvenementCollecte): void {
    const appel = e.estContributionOuverte ? this.finances.fermerCollecte(e.id) : this.finances.ouvrirCollecte(e.id);
    appel.subscribe({
      next: () => this.charger(),
      error: err => this.snackBar.open(err?.error?.message ?? this.t('page.actionError'), this.t('page.close'), { duration: 5000 })
    });
  }

  openDeleteDialog(id: number): void {
    this.dialog.open(ConfirmationDialogComponent, { data: { message: this.t('page.deleteConfirm') } })
      .afterClosed().subscribe(oui => {
        if (!oui) return;
        this.evenementService.deleteEvenement(id).subscribe({
          next: () => this.charger(),
          // un événement qui a reçu de l'argent ne se supprime pas : le serveur l'explique, on l'affiche tel quel
          error: err => this.snackBar.open(err?.error?.message ?? this.t('page.deleteError'), this.t('page.close'), { duration: 7000 })
        });
      });
  }
}
