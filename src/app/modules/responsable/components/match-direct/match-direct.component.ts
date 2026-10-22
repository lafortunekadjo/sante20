import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';

import { MatchService } from '../../../../core/services/match.service';
import { PresenceService } from '../../../../core/services/presence.service';
import { AjoutEvenement, EvenementMatch, EvenementMatchService, LiveMatch, TypeEvenementMatch } from '../../../../core/services/evenement-match.service';
import { Match } from '../../../../core/models/match.model';
import { Presence } from '../../../../core/models/presence.model';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';

interface Joueur {
  cle: string;
  membreId: number | null;
  nom: string;
  nomOccasionnel: string | null;
  position: number;
}

type EtatChrono = 'avant' | 'premiere' | 'mitemps' | 'seconde';

interface Chrono { etat: EtatChrono; demarreLe: number | null; minuteDeBase: number; dureeMiTemps: number; }

/** Feuille de saisie d'un événement (ouverte par les gros boutons). */
interface Saisie {
  type: TypeEvenementMatch;
  equipe: 1 | 2;
  joueur: Joueur | null;
  passeur: Joueur | null;
  minute: number | null;
  /** Étape en cours : choix du buteur / joueur, puis du passeur (buts de jeu et coups francs). */
  etape: 'joueur' | 'passeur';
}

const TYPES_BUT: TypeEvenementMatch[] = ['BUT', 'COUP_FRANC_MARQUE', 'PENALTI_MARQUE', 'CONTRE_SON_CAMP'];
const TYPES_AUTRES: TypeEvenementMatch[] = ['PENALTI_RATE', 'CARTON_JAUNE', 'CARTON_ROUGE'];

/**
 * Saisie du match en direct, pensée pour le téléphone : deux gros boutons « But », une feuille pour choisir le
 * buteur et le passeur, un chrono, et la chronologie dessous. Chaque action est enregistrée aussitôt ; le score,
 * le score à la mi-temps et les statistiques des joueurs en sont déduits côté serveur.
 */
@Component({
  selector: 'app-match-direct',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, MatDialogModule, MatProgressSpinnerModule, TranslateModule],
  templateUrl: './match-direct.component.html',
  styleUrl: './match-direct.component.scss'
})
export class MatchDirectComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private matchs = inject(MatchService);
  private presences = inject(PresenceService);
  private api = inject(EvenementMatchService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);

  readonly typesBut = TYPES_BUT;
  readonly typesAutres = TYPES_AUTRES;

  matchId = 0;
  match = signal<Match | null>(null);
  chargement = signal(true);
  envoi = signal(false);
  live = signal<LiveMatch | null>(null);
  joueurs = signal<Joueur[]>([]);
  noms = signal<[string, string]>(['Équipe 1', 'Équipe 2']);
  saisie = signal<Saisie | null>(null);
  recherche = '';

  chrono = signal<Chrono>({ etat: 'avant', demarreLe: null, minuteDeBase: 0, dureeMiTemps: 45 });
  private maintenant = signal(Date.now());
  private horloge: ReturnType<typeof setInterval> | null = null;

  equipe = (n: 1 | 2) => this.joueurs().filter(j => j.position === n);
  aDesJoueurs = computed(() => this.joueurs().length > 0);

  /** Une équipe sans joueur sur la feuille est une équipe extérieure : ses buts s'enregistrent sans buteur. */
  sansFiche = (n: 1 | 2) => this.equipe(n).length === 0;

  minuteCourante = computed<number | null>(() => {
    const c = this.chrono();
    if (c.etat === 'avant' || c.etat === 'mitemps' || c.demarreLe == null) return null;
    return c.minuteDeBase + Math.floor((this.maintenant() - c.demarreLe) / 60000) + 1;
  });

  ngOnInit(): void {
    this.matchId = Number(this.route.snapshot.paramMap.get('matchId'));
    this.chargerChrono();
    this.horloge = setInterval(() => this.maintenant.set(Date.now()), 15000);
    forkJoin({
      match: this.matchs.getMatch(this.matchId),
      presences: this.presences.getPresencesByMatchId(this.matchId),
      live: this.api.live(this.matchId)
    }).subscribe({
      next: ({ match, presences, live }) => {
        this.match.set(match);
        this.noms.set(this.nomsEquipes(match));
        this.joueurs.set(this.versJoueurs(presences));
        this.live.set(live);
        if (live.miTemps && this.chrono().etat === 'avant') this.modifierChrono({ etat: 'mitemps' });
        this.chargement.set(false);
      },
      error: () => { this.chargement.set(false); this.alerter(this.translate.instant('direct.loadError')); }
    });
  }

  ngOnDestroy(): void { if (this.horloge) clearInterval(this.horloge); }

  // ── Équipes et joueurs ────────────────────────────────────
  private nomsEquipes(m: Match): [string, string] {
    switch (m.typeMatch) {
      case 'AMICAL': {
        const local = (m.groupe as any)?.abreviation || (m.groupe as any)?.nom || 'Locale';
        const adverse = m.groupeAdverse ? (m.groupeAdverse.abreviation || m.groupeAdverse.nom) : (m.nomAdversaireManuel || 'Adverse');
        return [local, adverse];
      }
      case 'ANNIVERSAIRE': return ['Équipe Fêtés', 'Équipe Adverses'];
      default: return [m.equipe1?.nom || 'Équipe 1', m.equipe2?.nom || 'Équipe 2'];
    }
  }

  private versJoueurs(liste: Presence[]): Joueur[] {
    return liste.filter(p => p.aJoue).map(p => {
      const membre = p.membre;
      const nom = membre ? `${membre.prenom ?? ''} ${membre.nom ?? ''}`.trim() : (p.nomOccasionnel ?? '?');
      return {
        cle: membre ? 'm' + membre.id : 'o' + p.nomOccasionnel,
        membreId: membre?.id ?? null, nom, nomOccasionnel: membre ? null : (p.nomOccasionnel ?? null),
        position: p.equipePosition === 2 ? 2 : 1
      } as Joueur;
    }).sort((a, b) => a.nom.localeCompare(b.nom));
  }

  joueursAffiches(n: 1 | 2, sansPasseur?: Joueur | null): Joueur[] {
    const q = this.recherche.trim().toLowerCase();
    return this.equipe(n).filter(j => j !== sansPasseur && (!q || j.nom.toLowerCase().includes(q)));
  }

  initiale(nom: string): string { return (nom.trim()[0] ?? '?').toUpperCase(); }

  // ── Chrono ────────────────────────────────────────────────
  private cleChrono(): string { return 'chrono-match-' + this.matchId; }

  private chargerChrono(): void {
    try {
      const brut = localStorage.getItem(this.cleChrono());
      if (brut) this.chrono.set(JSON.parse(brut));
    } catch { /* stockage indisponible : le chrono repart de zéro */ }
  }

  private modifierChrono(partiel: Partial<Chrono>): void {
    this.chrono.update(c => ({ ...c, ...partiel }));
    try { localStorage.setItem(this.cleChrono(), JSON.stringify(this.chrono())); } catch { /* sans importance */ }
  }

  coupEnvoi(): void { this.modifierChrono({ etat: 'premiere', demarreLe: Date.now(), minuteDeBase: 0 }); }

  deuxiemeMiTemps(): void { this.modifierChrono({ etat: 'seconde', demarreLe: Date.now(), minuteDeBase: this.chrono().dureeMiTemps }); }

  /** Durée libre d'une mi-temps (1 à 90 min) : sert au repère de mi-temps et à la minute de départ de la 2e période. */
  changerDuree(minutes: number | null): void {
    const v = Math.round(Number(minutes));
    if (Number.isFinite(v) && v >= 1 && v <= 90) this.modifierChrono({ dureeMiTemps: v });
  }

  /** Mi-temps : enregistre le repère (le score à ce moment devient le score à la mi-temps) et arrête le chrono. */
  miTemps(): void {
    this.envoyer({ type: 'MI_TEMPS', minute: this.chrono().dureeMiTemps }, false);
    this.modifierChrono({ etat: 'mitemps', demarreLe: null });
  }

  // ── Feuille de saisie ─────────────────────────────────────
  ouvrir(type: TypeEvenementMatch, equipe: 1 | 2 = 1): void {
    if (!this.aDesJoueurs() && !(this.sansFiche(1) || this.sansFiche(2))) return;
    // une équipe sans fiche ne peut ni recevoir un carton ni concéder un contre son camp : on bascule sur l'autre
    const autre: 1 | 2 = equipe === 1 ? 2 : 1;
    const accepteSansFiche = ['BUT', 'COUP_FRANC_MARQUE', 'PENALTI_MARQUE', 'PENALTI_RATE'].includes(type);
    const eq: 1 | 2 = this.sansFiche(equipe) && !this.sansFiche(autre) && !accepteSansFiche ? autre : equipe;
    this.recherche = '';
    this.saisie.set({ type, equipe: eq, joueur: null, passeur: null, minute: this.minuteCourante() ?? this.derniereMinute(), etape: 'joueur' });
  }

  private derniereMinute(): number | null {
    const l = this.live()?.evenements ?? [];
    const avecMinute = l.filter(e => e.minute != null);
    return avecMinute.length ? Math.max(...avecMinute.map(e => e.minute as number)) : null;
  }

  fermer(): void { this.saisie.set(null); }

  changerType(type: TypeEvenementMatch): void { this.saisie.update(s => s ? { ...s, type, passeur: null, etape: 'joueur' } : s); }

  changerEquipe(n: 1 | 2): void { this.recherche = ''; this.saisie.update(s => s ? { ...s, equipe: n, joueur: null, passeur: null, etape: 'joueur' } : s); }

  /** Types proposés selon l'équipe : une équipe extérieure (sans fiche) ne peut avoir ni carton ni contre son camp. */
  typesProposes(): TypeEvenementMatch[] {
    const s = this.saisie();
    if (!s) return [];
    const tous: TypeEvenementMatch[] = [...TYPES_BUT, ...TYPES_AUTRES];
    return this.sansFiche(s.equipe) ? tous.filter(t => ['BUT', 'COUP_FRANC_MARQUE', 'PENALTI_MARQUE', 'PENALTI_RATE'].includes(t)) : tous;
  }

  avecPasseur(s: Saisie): boolean { return s.type === 'BUT' || s.type === 'COUP_FRANC_MARQUE'; }

  choisirJoueur(j: Joueur): void {
    const s = this.saisie();
    if (!s) return;
    if (this.avecPasseur(s)) this.saisie.set({ ...s, joueur: j, etape: 'passeur' });
    else this.valider({ ...s, joueur: j });
  }

  choisirPasseur(p: Joueur | null): void {
    const s = this.saisie();
    if (s) this.valider({ ...s, passeur: p });
  }

  changerMinute(delta: number): void {
    this.saisie.update(s => s ? { ...s, minute: Math.max(0, Math.min(200, (s.minute ?? 0) + delta)) } : s);
  }

  effacerMinute(): void { this.saisie.update(s => s ? { ...s, minute: null } : s); }

  validerSansJoueur(): void {
    const s = this.saisie();
    if (s) this.valider(s);
  }

  private valider(s: Saisie): void {
    const e: AjoutEvenement = {
      type: s.type, minute: s.minute, equipePosition: s.equipe,
      joueurMembreId: s.joueur?.membreId ?? null, joueurNom: s.joueur?.nomOccasionnel ?? null,
      passeurMembreId: s.passeur?.membreId ?? null, passeurNom: s.passeur?.nomOccasionnel ?? null
    };
    this.envoyer(e, true);
  }

  private envoyer(e: AjoutEvenement, annulable: boolean): void {
    if (this.envoi()) return;
    this.envoi.set(true);
    this.api.ajouter(this.matchId, e).subscribe({
      next: live => {
        this.envoi.set(false);
        const avant = this.live()?.evenements.map(x => x.id) ?? [];
        const nouveau = live.evenements.find(x => !avant.includes(x.id));
        this.live.set(live);
        this.saisie.set(null);
        if (annulable && nouveau) this.proposerAnnulation(nouveau);
      },
      error: err => { this.envoi.set(false); this.alerter(err?.error?.message ?? this.translate.instant('direct.saveError')); }
    });
  }

  private proposerAnnulation(e: EvenementMatch): void {
    this.snackBar.open(this.resume(e), this.translate.instant('direct.undo'), { duration: 6000 })
      .onAction().subscribe(() => this.retirer(e));
  }

  // ── Chronologie ───────────────────────────────────────────
  confirmerSuppression(e: EvenementMatch): void {
    this.dialog.open(ConfirmationDialogComponent, { data: { message: this.translate.instant('direct.deleteConfirm') } })
      .afterClosed().subscribe(oui => { if (oui) this.retirer(e); });
  }

  private retirer(e: EvenementMatch): void {
    this.api.supprimer(this.matchId, e.id).subscribe({
      next: live => {
        this.live.set(live);
        if (e.type === 'MI_TEMPS' && this.chrono().etat === 'mitemps') this.modifierChrono({ etat: 'premiere', demarreLe: Date.now(), minuteDeBase: this.chrono().dureeMiTemps });
      },
      error: err => this.alerter(err?.error?.message ?? this.translate.instant('direct.saveError'))
    });
  }

  icone(t: TypeEvenementMatch): string {
    return { BUT: '⚽', COUP_FRANC_MARQUE: '⚽', PENALTI_MARQUE: '⚽', PENALTI_RATE: '❌', CONTRE_SON_CAMP: '↩️',
             CARTON_JAUNE: '🟨', CARTON_ROUGE: '🟥', MI_TEMPS: '⏸️' }[t];
  }

  nomEquipe(position: number | null): string { return position === 2 ? this.noms()[1] : this.noms()[0]; }

  resume(e: EvenementMatch): string {
    const type = this.translate.instant('direct.types.' + e.type);
    if (e.type === 'MI_TEMPS') return type;
    const joueur = e.joueurNom || this.nomEquipe(e.equipePosition);
    const passe = e.passeurNom ? ` · ${this.translate.instant('direct.assist')} ${e.passeurNom}` : '';
    return `${type} — ${joueur}${passe}`;
  }

  // ── Fin ───────────────────────────────────────────────────
  terminer(): void {
    this.api.terminer(this.matchId).subscribe({
      next: () => {
        this.snackBar.open(this.translate.instant('direct.finished'), undefined, { duration: 3000 });
        this.router.navigate(['/responsable/presences', this.matchId]);
      },
      error: err => this.alerter(err?.error?.message ?? this.translate.instant('direct.saveError'))
    });
  }

  private alerter(message: string): void {
    this.snackBar.open(message, this.translate.instant('direct.close'), { duration: 6000 });
  }
}
