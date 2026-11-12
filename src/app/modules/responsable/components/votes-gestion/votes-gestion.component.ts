import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AuthService } from '../../../../core/services/auth.service';
import { MatchService } from '../../../../core/services/match.service';
import { MembreService } from '../../../../core/services/membre.service';
import {
  ConfigScrutin, ModeDeclenchement, ModifierConfigScrutin, RegleScrutin, ScrutinDetail,
  ScrutinResume, ScrutinService, TYPES_SCRUTIN, TypeScrutin
} from '../../../../core/services/scrutin.service';
import { RegleScrutinEditorComponent } from './regle-scrutin-editor/regle-scrutin-editor.component';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';

type Vue = 'votes' | 'reglages';

/**
 * Gestion des votes du groupe : le responsable (ou un rôle ayant le menu « Votes ») lance, ouvre, clôture
 * et annule les scrutins, et règle le lancement automatique du MVP du match.
 * Les votes sont anonymes : cet écran n'affiche jamais qui a voté pour qui.
 */
@Component({
  selector: 'app-votes-gestion',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatDialogModule, MatProgressSpinnerModule, TranslateModule, RegleScrutinEditorComponent],
  templateUrl: './votes-gestion.component.html',
  styleUrl: './votes-gestion.component.scss'
})
export class VotesGestionComponent implements OnInit {
  private api = inject(ScrutinService);
  private matchs = inject(MatchService);
  private membres = inject(MembreService);
  private auth = inject(AuthService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);

  readonly types = TYPES_SCRUTIN;
  readonly icones: Record<TypeScrutin, string> = {
    MVP_MATCH: 'sports_soccer',
    MVP_MOIS: 'military_tech',
    FAIR_PLAY_MOIS: 'handshake',
    BALLON_OR_ANNEE: 'emoji_events',
    PERSONNALISE: 'tune'
  };

  vue = signal<Vue>('votes');
  loading = signal(true);
  saving = signal(false);
  scrutins = signal<ScrutinResume[]>([]);
  configs = signal<ConfigScrutin[]>([]);
  resultats = signal<ScrutinDetail | null>(null);

  /** Scrutins actifs en premier, puis l'historique. */
  enCours = computed(() => this.scrutins().filter(s => s.statut === 'OUVERT' || s.statut === 'PROGRAMME'));
  historique = computed(() => this.scrutins().filter(s => s.statut === 'CLOS' || s.statut === 'ANNULE'));

  // ── Formulaire de création ──────────────────────────────
  creation = signal(false);
  erreur = signal('');
  type: TypeScrutin = 'MVP_MOIS';
  titre = '';
  matchId: number | null = null;
  mois = '';
  annee = new Date().getFullYear();
  periodeDebut = '';
  periodeFin = '';
  programmer = false;
  ouvertureAt = '';
  fermetureAt = '';
  regles: RegleScrutin | null = null;
  reglesOuvertes = false;
  nominesManuels = new Set<number>();
  matchsRecents = signal<{ id: number; libelle: string }[]>([]);
  membresGroupe = signal<{ id: number; nom: string }[]>([]);

  /** Modification de la date limite d'un scrutin en cours. */
  edition: { id: number; valeur: string } | null = null;

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    this.loading.set(true);
    forkJoin({
      scrutins: this.api.lister(),
      configs: this.api.configs().pipe(catchError(() => of([] as ConfigScrutin[])))
    }).subscribe({
      next: r => {
        this.scrutins.set(r.scrutins);
        this.configs.set(r.configs);
        this.loading.set(false);
      },
      error: err => {
        this.loading.set(false);
        this.afficherErreur(err);
      }
    });
  }

  // ── Création ────────────────────────────────────────────
  ouvrirCreation(): void {
    this.creation.set(true);
    this.erreur.set('');
    this.titre = '';
    this.programmer = false;
    this.ouvertureAt = '';
    this.fermetureAt = '';
    this.nominesManuels.clear();
    this.choisirType('MVP_MOIS');
  }

  fermerCreation(): void {
    this.creation.set(false);
  }

  choisirType(type: TypeScrutin): void {
    this.type = type;
    this.regles = null;
    this.reglesOuvertes = false;
    this.mois = this.moisParDefaut();
    this.api.reglesParDefaut(type).subscribe({
      next: r => this.regles = r,
      error: err => this.afficherErreur(err)
    });
    if (type === 'MVP_MATCH') this.chargerMatchs();
    if (type === 'PERSONNALISE') this.chargerMembres();
  }

  /** Comme le serveur : du 1er au 7, on vote pour le mois précédent. */
  private moisParDefaut(): string {
    const d = new Date();
    if (d.getDate() <= 7) d.setMonth(d.getMonth() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  private chargerMatchs(): void {
    const fin = new Date();
    const debut = new Date();
    debut.setDate(debut.getDate() - 45);
    const iso = (d: Date) => d.toISOString().slice(0, 10);
    this.matchs.getMatchesByDateRange(iso(debut), iso(fin)).subscribe({
      next: liste => {
        this.matchsRecents.set(
          [...liste]
            .sort((a, b) => (b.dateMatch || '').localeCompare(a.dateMatch || ''))
            .map(m => ({
              id: m.id,
              libelle: `${m.dateMatch}${m.lieu ? ' – ' + m.lieu : ''}${m.typeMatch ? ' (' + m.typeMatch + ')' : ''}`
            }))
        );
      },
      error: err => this.afficherErreur(err)
    });
  }

  private chargerMembres(): void {
    const groupeId = this.auth.getGroupe();
    if (!groupeId) return;
    this.membres.getMembresByGroupeId(groupeId).subscribe({
      next: liste => this.membresGroupe.set(
        liste.map(m => ({ id: m.id, nom: `${m.prenom ?? ''} ${m.nom ?? ''}`.trim() }))
             .sort((a, b) => a.nom.localeCompare(b.nom))
      ),
      error: err => this.afficherErreur(err)
    });
  }

  basculerNomine(id: number): void {
    if (this.nominesManuels.has(id)) this.nominesManuels.delete(id);
    else this.nominesManuels.add(id);
  }

  creer(): void {
    this.erreur.set('');
    const manque = this.verifierFormulaire();
    if (manque) { this.erreur.set(manque); return; }

    this.saving.set(true);
    this.api.creer({
      type: this.type,
      titre: this.titre.trim() || null,
      matchId: this.type === 'MVP_MATCH' ? this.matchId : null,
      mois: this.type === 'MVP_MOIS' || this.type === 'FAIR_PLAY_MOIS' ? this.mois : null,
      annee: this.type === 'BALLON_OR_ANNEE' ? this.annee : null,
      periodeDebut: this.type === 'PERSONNALISE' && this.periodeDebut ? this.periodeDebut : null,
      periodeFin: this.type === 'PERSONNALISE' && this.periodeFin ? this.periodeFin : null,
      ouvertureAt: this.programmer && this.ouvertureAt ? this.ouvertureAt : null,
      fermetureAt: this.fermetureAt || null,
      regles: this.regles,
      nominesManuels: this.regles?.nomines === 'MANUEL' ? [...this.nominesManuels] : null
    }).subscribe({
      next: s => {
        this.saving.set(false);
        this.creation.set(false);
        this.snackBar.open(this.translate.instant(s.statut === 'OUVERT' ? 'scrutins.createdOpen' : 'scrutins.createdScheduled'),
          this.translate.instant('scrutins.close'), { duration: 4000 });
        this.charger();
      },
      error: err => {
        this.saving.set(false);
        this.erreur.set(this.messageErreur(err));
      }
    });
  }

  private verifierFormulaire(): string {
    if (!this.regles) return this.translate.instant('scrutins.errors.rulesLoading');
    if (this.type === 'MVP_MATCH' && !this.matchId) return this.translate.instant('scrutins.errors.pickMatch');
    if ((this.type === 'MVP_MOIS' || this.type === 'FAIR_PLAY_MOIS') && !this.mois) return this.translate.instant('scrutins.errors.pickMonth');
    if (this.type === 'BALLON_OR_ANNEE' && !this.annee) return this.translate.instant('scrutins.errors.pickYear');
    if (this.regles.nomines === 'MANUEL' && this.nominesManuels.size < 2) return this.translate.instant('scrutins.errors.pickNominees');
    if (this.programmer && !this.ouvertureAt) return this.translate.instant('scrutins.errors.pickOpening');
    if (this.ouvertureAt && this.fermetureAt && this.fermetureAt <= this.ouvertureAt) return this.translate.instant('scrutins.errors.closingAfterOpening');
    return '';
  }

  // ── Actions sur un scrutin ──────────────────────────────
  ouvrir(s: ScrutinResume): void {
    this.executer(this.api.ouvrir(s.id), 'scrutins.openedDone');
  }

  cloturer(s: ScrutinResume): void {
    this.confirmer('scrutins.confirmClose', 'warning', () => this.executer(this.api.cloturer(s.id), 'scrutins.closedDone'));
  }

  annuler(s: ScrutinResume): void {
    this.confirmer('scrutins.confirmCancel', 'danger', () => this.executer(this.api.annuler(s.id), 'scrutins.cancelledDone'));
  }

  commencerEdition(s: ScrutinResume): void {
    this.edition = { id: s.id, valeur: (s.fermetureAt ?? '').slice(0, 16) };
  }

  enregistrerEdition(): void {
    if (!this.edition?.valeur) return;
    const { id, valeur } = this.edition;
    this.executer(this.api.modifierFermeture(id, valeur), 'scrutins.deadlineDone', () => this.edition = null);
  }

  voirResultats(s: ScrutinResume): void {
    if (this.resultats()?.scrutin.id === s.id) { this.resultats.set(null); return; }
    this.api.detail(s.id).subscribe({
      next: d => this.resultats.set(d),
      error: err => this.afficherErreur(err)
    });
  }

  private executer(appel: Observable<unknown>, cleSucces: string, apres?: () => void): void {
    this.saving.set(true);
    appel.subscribe({
      next: () => {
        this.saving.set(false);
        apres?.();
        this.snackBar.open(this.translate.instant(cleSucces), this.translate.instant('scrutins.close'), { duration: 3000 });
        this.charger();
      },
      error: err => {
        this.saving.set(false);
        this.afficherErreur(err);
      }
    });
  }

  private confirmer(cleMessage: string, type: 'warning' | 'danger', action: () => void): void {
    this.dialog.open(ConfirmationDialogComponent, { data: { message: this.translate.instant(cleMessage), type } })
      .afterClosed().subscribe(oui => { if (oui) action(); });
  }

  // ── Réglages du groupe ──────────────────────────────────
  basculerActif(c: ConfigScrutin): void {
    this.modifierConfig(c, { actif: !c.actif });
  }

  changerDeclenchement(c: ConfigScrutin, valeur: ModeDeclenchement): void {
    this.modifierConfig(c, { declenchement: valeur });
  }

  changerDuree(c: ConfigScrutin, valeur: number): void {
    const heures = Math.round(Number(valeur));
    if (!heures || heures < 1) return;
    this.modifierConfig(c, { dureeHeures: heures });
  }

  // ── Règles par défaut du groupe ─────────────────────────
  /** Règles du groupe en cours de modification (un seul type à la fois). */
  reglesGroupe: { type: TypeScrutin; regles: RegleScrutin } | null = null;

  ouvrirReglesGroupe(c: ConfigScrutin): void {
    this.reglesGroupe = { type: c.type, regles: JSON.parse(JSON.stringify(c.reglesParDefaut)) as RegleScrutin };
  }

  enregistrerReglesGroupe(): void {
    if (!this.reglesGroupe) return;
    const { type, regles } = this.reglesGroupe;
    this.modifierConfig({ type } as ConfigScrutin, { reglesParDefaut: regles }, () => this.reglesGroupe = null);
  }

  reinitialiserReglesGroupe(c: ConfigScrutin): void {
    this.confirmer('scrutins.groupRules.confirmReset', 'warning',
      () => this.modifierConfig(c, { reinitialiserRegles: true }, () => this.reglesGroupe = null));
  }

  private modifierConfig(c: ConfigScrutin, demande: ModifierConfigScrutin, apres?: () => void): void {
    this.api.modifierConfig(c.type, demande).subscribe({
      next: maj => {
        this.configs.update(l => l.map(x => x.type === maj.type ? maj : x));
        apres?.();
        this.snackBar.open(this.translate.instant('scrutins.settingsSaved'), this.translate.instant('scrutins.close'), { duration: 2500 });
      },
      error: err => {
        this.afficherErreur(err);
        this.charger(); // on remet l'écran d'accord avec le serveur
      }
    });
  }

  // ── Outils ──────────────────────────────────────────────
  private messageErreur(err: any): string {
    return err?.error?.message ?? (typeof err?.error === 'string' ? err.error : this.translate.instant('scrutins.errors.generic'));
  }

  private afficherErreur(err: any): void {
    this.snackBar.open(this.messageErreur(err), this.translate.instant('scrutins.close'), { duration: 5000 });
  }
}
