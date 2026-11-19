import { Component, DoCheck, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatchService } from '../../../../core/services/match.service';
import { MembreService } from '../../../../core/services/membre.service';
import { FicheMatchService, SuggestionsFiche } from '../../../../core/services/fiche-match.service';
import { PresenceService } from '../../../../core/services/presence.service';
import { nomComplet } from '../../../../core/utils/nom';

type Equipe = 0 | 1 | 2;
/** `equipe` à 0 = pas coché. `dansAppel` : le membre figure sur la liste d'appel (habitué, pointé ou ajouté). */
interface Ligne { membre: any; equipe: Equipe; existante?: any; pointe: boolean; dansAppel: boolean; rang: number; matchs?: number; derniere: Equipe; fixe: Equipe; sansJouer: boolean; }
interface Invite { nom: string; equipe: 1 | 2; existante?: any; }

/**
 * Étape 1 de la saisie par un scribe : l'appel. La liste ne montre que les habitués et les joueurs pointés ;
 * le scribe coche ceux qui jouent. Le reste du groupe s'ajoute par la recherche. Les statistiques se notent ensuite pendant le match.
 */
@Component({
  selector: 'app-saisie-presents',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <div class="sp" [style.padding-bottom.px]="110 + decalageNav">
      <a class="sp-retour" [routerLink]="['/membre/saisie', matchId]"><mat-icon>arrow_back</mat-icon> Retour à la saisie</a>
      <h1><mat-icon>how_to_reg</mat-icon> Qui joue ?</h1>

      <div class="sp-etat" *ngIf="chargement"><mat-spinner diameter="32"></mat-spinner></div>

      <ng-container *ngIf="!chargement">
        <p class="sp-hint">Coche les joueurs présents. Une fois coché, tu peux changer son équipe ou le marquer <strong>sans jouer</strong> (présent mais n'a pas joué).</p>

        <div class="sp-raccourcis">
          <button type="button" *ngIf="sugg?.dernierMatch?.length" (click)="commeDernierMatch()">
            <mat-icon>history</mat-icon> Comme le {{ dateCourte(sugg!.dateDernierMatch) }}
          </button>
          <button type="button" (click)="toutCocher()"><mat-icon>done_all</mat-icon> Tout cocher</button>
          <button type="button" *ngIf="total" (click)="toutDecocher()"><mat-icon>remove_done</mat-icon> Tout décocher</button>
        </div>

        <section class="sp-carte">
          <h2>
            <mat-icon>groups</mat-icon> Appel
            <span class="sp-n">{{ appel.length }}</span>
          </h2>
          <ul>
            <li *ngFor="let l of appel" class="sp-ligne" [class.sp-coche]="l.equipe" [class.sp-banc]="l.equipe && l.sansJouer" (click)="basculer(l)">
              <span class="sp-case" [class.on]="l.equipe && !l.sansJouer" [class.banc]="l.equipe && l.sansJouer"><mat-icon>{{ l.equipe && l.sansJouer ? 'event_seat' : 'check' }}</mat-icon></span>
              <span class="sp-nom">{{ nomDe(l.membre) }}<span class="sp-badge" *ngIf="l.pointe">pointé</span></span>
              <small class="sp-assid" *ngIf="l.matchs && !l.equipe">{{ l.matchs }}/5</small>
              <div class="sp-controles" *ngIf="l.equipe" (click)="\$event.stopPropagation()">
                <span class="sp-equipe">
                  <button type="button" [class.on]="l.equipe === 1" (click)="l.equipe = 1">{{ court(0) }}</button>
                  <button type="button" class="e2" [class.on]="l.equipe === 2" (click)="l.equipe = 2">{{ court(1) }}</button>
                </span>
                <button type="button" class="sp-sans" [class.on]="l.sansJouer" (click)="l.sansJouer = !l.sansJouer">
                  <mat-icon>event_seat</mat-icon> Sans jouer
                </button>
              </div>
            </li>
            <li class="sp-vide" *ngIf="!appel.length">Aucun habitué : cherche un joueur ci-dessous.</li>
          </ul>
        </section>

        <section class="sp-carte">
          <h2><mat-icon>person_add</mat-icon> Un autre joueur du groupe ?</h2>
          <input class="sp-champ" type="search" [(ngModel)]="recherche" placeholder="Chercher un nom…" autocomplete="off">
          <ul *ngIf="recherche.trim()">
            <li class="sp-ligne" *ngFor="let l of resultats" (click)="ajouter(l)">
              <span class="sp-case"><mat-icon>add</mat-icon></span>
              <span class="sp-nom">{{ nomDe(l.membre) }}</span>
            </li>
            <li class="sp-vide" *ngIf="!resultats.length">Aucun membre trouvé — ajoute-le comme invité ci-dessous.</li>
          </ul>
        </section>

        <section class="sp-carte">
          <h2><mat-icon>emoji_people</mat-icon> Invités (non membres) <span class="sp-n" *ngIf="invites.length">{{ invites.length }}</span></h2>
          <ul *ngIf="invites.length">
            <li *ngFor="let i of invites">
              <span class="sp-nom">{{ i.nom }}<span class="sp-badge sp-badge--invite">invité</span></span>
              <span class="sp-equipe">
                <button type="button" [class.on]="i.equipe === 1" (click)="i.equipe = 1">1</button>
                <button type="button" [class.on]="i.equipe === 2" class="e2" (click)="i.equipe = 2">2</button>
                <button type="button" class="sp-x" (click)="retirerInvite(i)" aria-label="Retirer"><mat-icon>close</mat-icon></button>
              </span>
            </li>
          </ul>
          <div class="sp-invite">
            <input class="sp-champ" type="text" [(ngModel)]="nouvelInvite" maxlength="60" placeholder="Nom de l'invité" (keyup.enter)="ajouterInvite()">
            <button type="button" class="sp-add" [disabled]="!nouvelInvite.trim()" (click)="ajouterInvite()">Ajouter</button>
          </div>
        </section>

        <p class="sp-alerte" *ngIf="desequilibre"><mat-icon>balance</mat-icon> Équipes déséquilibrées ({{ compte(1) }} contre {{ compte(2) }}) — vérifie la répartition.</p>
      </ng-container>

      <div class="sp-pied" [class.sur-nav]="decalageNav > 0" [style.bottom.px]="decalageNav" *ngIf="!chargement">
        <span class="sp-total"><strong>{{ total }}</strong> joueur(s)<small>{{ noms[0] }} {{ compte(1) }} · {{ noms[1] }} {{ compte(2) }}<ng-container *ngIf="nbSansJouer"> · {{ nbSansJouer }} sans jouer</ng-container></small>
          <small class="sp-sauv" [class.err]="sauvegarde === 'erreur'" *ngIf="sauvegarde">{{ sauvegarde === 'encours' ? 'Enregistrement…' : sauvegarde === 'ok' ? '✓ Enregistré' : '⚠ Non enregistré' }}</small></span>
        <button mat-flat-button color="primary" type="button" [disabled]="!total || envoi" (click)="enregistrer()">
          <mat-spinner *ngIf="envoi" diameter="18"></mat-spinner><span *ngIf="!envoi">Continuer vers le match</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .sp { max-width: 640px; margin: 0 auto; padding: 12px 16px 110px; color: var(--text-primary); }
    .sp-retour { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; text-decoration: none; color: var(--text-secondary); min-height: 36px; }
    h1 { display: flex; align-items: center; gap: 8px; font-size: 22px; margin: 4px 0 6px; }
    h1 mat-icon { color: var(--primary-color); }
    .sp-hint { margin: 0 0 10px; font-size: 13px; color: var(--text-secondary); }
    .sp-etat { text-align: center; padding: 28px 0; }

    .sp-raccourcis { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
    .sp-raccourcis button { display: inline-flex; align-items: center; gap: 4px; height: 38px; padding: 0 12px 0 8px; border-radius: 999px; border: 1px solid var(--primary-color); background: transparent; color: var(--primary-color); font-size: 13px; font-weight: 600; cursor: pointer; }
    .sp-raccourcis mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .sp-carte { background: var(--background-primary, #fff); border: 1px solid var(--border-color, rgba(128,128,128,.3)); border-radius: 16px; padding: 12px 12px 6px; margin-bottom: 12px; box-shadow: 0 1px 3px var(--shadow-color, rgba(0,0,0,.08)); }
    .sp-carte h2 { display: flex; align-items: center; gap: 8px; margin: 0 0 4px; font-size: 15px; font-weight: 700; }
    .sp-carte h2 mat-icon { font-size: 20px; width: 20px; height: 20px; color: var(--primary-color); }
    .sp-n { margin-left: auto; font-size: 12px; font-weight: 700; padding: 2px 9px; border-radius: 999px; background: color-mix(in srgb, var(--primary-color) 14%, transparent); }

    ul { list-style: none; margin: 0; padding: 0; }
    li { display: flex; align-items: center; gap: 10px; min-height: 52px; border-top: 1px solid var(--divider-color, rgba(128,128,128,.18)); }
    li:first-child { border-top: 0; }
    .sp-ligne { cursor: pointer; -webkit-tap-highlight-color: transparent; }
    .sp-ligne:active { background: color-mix(in srgb, var(--primary-color) 8%, transparent); }
    .sp-coche { background: color-mix(in srgb, var(--primary-color) 6%, transparent); }

    .sp-case { flex: none; width: 28px; height: 28px; border-radius: 8px; border: 2px solid var(--border-color, rgba(128,128,128,.55)); display: inline-flex; align-items: center; justify-content: center; color: transparent; }
    .sp-case mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .sp-case.on { background: var(--primary-color); border-color: var(--primary-color); color: #fff; }
    .sp-ligne:not(.sp-coche) .sp-case mat-icon { color: var(--text-secondary); }
    .sp-nom { flex: 1; font-size: 15px; font-weight: 600; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
    .sp-assid { flex: none; color: var(--text-secondary); font-size: 12px; }
    .sp-badge { margin-left: 8px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .03em; padding: 2px 7px; border-radius: 999px; background: color-mix(in srgb, var(--accent-color) 20%, transparent); color: var(--accent-dark, inherit); vertical-align: middle; }
    .sp-badge--invite { background: color-mix(in srgb, var(--warning-color, #f59e0b) 22%, transparent); color: inherit; }
    .sp-vide { color: var(--text-secondary); font-size: 13px; font-style: italic; min-height: 40px; }

    .sp-ligne { flex-wrap: wrap; }
    .sp-case.banc { background: var(--warning-color, #f59e0b); border-color: var(--warning-color, #f59e0b); color: #fff; }
    .sp-banc { background: color-mix(in srgb, var(--warning-color, #f59e0b) 8%, transparent); }
    .sp-controles { flex-basis: 100%; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 0 0 10px 38px; cursor: default; }
    .sp-sans { display: inline-flex; align-items: center; gap: 4px; height: 40px; padding: 0 12px 0 8px; border-radius: 10px; border: 1px solid var(--border-color, rgba(128,128,128,.4)); background: transparent; color: inherit; font-size: 13px; font-weight: 600; cursor: pointer; }
    .sp-sans mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .sp-sans.on { background: var(--warning-color, #f59e0b); border-color: transparent; color: #fff; }
    .sp-equipe { display: inline-flex; flex: none; gap: 4px; }
    .sp-equipe button { padding: 0 12px; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .sp-equipe button { min-width: 40px; height: 40px; border-radius: 10px; border: 1px solid var(--border-color, rgba(128,128,128,.4)); background: transparent; color: inherit; font-size: 15px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; }
    .sp-equipe button.on { background: var(--primary-color); color: #fff; border-color: transparent; }
    .sp-equipe button.e2.on { background: var(--accent-color); }
    .sp-equipe .sp-x { border-color: transparent; color: var(--text-secondary); }
    .sp-equipe mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .sp-tag { flex: none; font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 999px; background: color-mix(in srgb, var(--primary-color) 16%, transparent); }
    .sp-tag.e2 { background: color-mix(in srgb, var(--accent-color) 22%, transparent); }

    .sp-champ { width: 100%; box-sizing: border-box; height: 44px; padding: 0 12px; border-radius: 12px; border: 1px solid var(--border-color, rgba(128,128,128,.4)); background: var(--background-secondary, transparent); color: inherit; font-size: 16px; margin: 4px 0 6px; }
    .sp-invite { display: flex; align-items: center; gap: 8px; }
    .sp-invite .sp-champ { margin: 4px 0 6px; flex: 1; min-width: 0; }
    .sp-add { flex: none; height: 44px; padding: 0 16px; border-radius: 12px; border: 1px solid var(--primary-color); background: transparent; color: var(--primary-color); font-weight: 700; cursor: pointer; }
    .sp-add[disabled] { opacity: .4; }

    .sp-alerte { display: flex; align-items: center; gap: 8px; margin: 0 0 12px; padding: 9px 12px; border-radius: 12px; font-size: 13px; background: color-mix(in srgb, var(--warning-color, #f59e0b) 16%, transparent); }
    .sp-alerte mat-icon { flex: none; font-size: 18px; width: 18px; height: 18px; }

    .sp-pied { position: fixed; left: 0; right: 0; bottom: 0; z-index: 5; display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 10px 16px calc(10px + env(safe-area-inset-bottom)); background: var(--background-primary, #fff); border-top: 1px solid var(--border-color, rgba(128,128,128,.3)); box-shadow: 0 -2px 8px var(--shadow-color, rgba(0,0,0,.08)); }
    .sp-total { display: flex; flex-direction: column; font-size: 14px; line-height: 1.2; min-width: 0; }
    .sp-sauv { color: var(--accent-dark, #059669) !important; font-weight: 600; }
    .sp-sauv.err { color: var(--error-color, #dc2626) !important; }
    .sp-total small { color: var(--text-secondary); font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    /* quand la navigation du bas est affichée, la barre d'action se place au-dessus (hauteur mesurée) */
    .sp-pied.sur-nav { padding-bottom: 10px; }
    .sp-pied button { flex: none; min-height: 46px; padding: 0 20px; border-radius: 12px; font-weight: 700; }
  `]
})
export class SaisiePresentsComponent implements OnInit, DoCheck, OnDestroy {
  matchId = 0;
  typeMatch = '';
  noms: [string, string] = ['Équipe 1', 'Équipe 2'];
  lignes: Ligne[] = [];
  invites: Invite[] = [];
  sugg: SuggestionsFiche | null = null;
  /** Vrai quand les joueurs sont rattachés à l'une des deux équipes du match : l'équipe est alors automatique. */
  equipesFixes = false;
  nouvelInvite = '';
  recherche = '';
  chargement = true;
  envoi = false;
  /** Enregistrement automatique : chaque changement est sauvegardé sans attendre le bouton. */
  sauvegarde: '' | 'encours' | 'ok' | 'erreur' = '';
  /** Hauteur de la navigation du bas si elle est visible, sinon 0. */
  decalageNav = 0;
  private sigSauvee = '';
  private sigPlanifiee = '';
  private minuteur: any = null;
  private enVol = false;

  constructor(
    private route: ActivatedRoute, private router: Router,
    private matchs: MatchService, private membreService: MembreService, private presences: PresenceService,
    private fiches: FicheMatchService, private snackBar: MatSnackBar
  ) {}

  @HostListener('window:resize')
  mesurerNav(): void {
    const nav = document.querySelector('app-bottom-nav .bottom-nav') as HTMLElement | null;
    const visible = !!nav && !nav.classList.contains('hidden') && getComputedStyle(nav).display !== 'none';
    this.decalageNav = visible ? nav!.offsetHeight : 0;
  }

  ngOnInit(): void {
    this.mesurerNav();
    this.matchId = Number(this.route.snapshot.paramMap.get('matchId'));
    forkJoin({
      match: this.matchs.getMatch(this.matchId),
      membres: this.membreService.getGroupMembers(),
      presences: this.presences.getPresencesByMatchId(this.matchId),
      sugg: this.fiches.suggestions(this.matchId).pipe(catchError(() => of(null)))
    }).subscribe({
      next: ({ match, membres, presences, sugg }) => {
        this.sugg = sugg;
        this.typeMatch = match.typeMatch ?? '';
        this.noms = this.nomsEquipes(match);
        this.composer(membres ?? [], presences ?? [], sugg);
        // seul un changement fait par le scribe déclenche une sauvegarde, pas le pré-remplissage
        this.sigSauvee = this.sigPlanifiee = this.signature();
        this.chargement = false;
        setTimeout(() => this.mesurerNav());   // la navigation du bas est alors rendue
      },
      error: () => { this.chargement = false; this.snackBar.open('Chargement impossible.', 'Fermer', { duration: 3500 }); }
    });
  }

  /** Construit la liste d'appel : habitués + pointés + déjà saisis. Seuls les pointés et les déjà saisis sont cochés d'office. */
  private composer(membres: any[], presences: any[], sugg: SuggestionsFiche | null): void {
    const parMembre = new Map<number, any>();
    for (const p of presences) {
      if (p.membre?.id) parMembre.set(p.membre.id, p);
      else if (p.nomOccasionnel) this.invites.push({ nom: p.nomOccasionnel, equipe: p.equipePosition === 2 ? 2 : 1, existante: p });
    }
    const position = (n: any): Equipe => n === 2 ? 2 : n === 1 ? 1 : 0;
    const enEquipe = (m: any): Equipe => {
      const nom = m.equipe?.nom;
      return nom && nom === this.noms[1] ? 2 : nom && nom === this.noms[0] ? 1 : 0;
    };

    // l'API ne renvoie pas de champ « present » : une présence existante signifie que la personne était là
    const commence = presences.some(p => p.aJoue);
    this.lignes = membres.filter(m => m?.active !== false).map(m => {
      const ex = parMembre.get(m.id);
      const h = sugg?.habitues?.find(x => x.membreId === m.id);
      const fixe = enEquipe(m);
      const derniere = position(h?.equipePosition);
      const l: Ligne = {
        membre: m, equipe: 0, existante: ex, pointe: !!ex && !ex.aJoue && !commence, matchs: h?.matchs, derniere, fixe,
        dansAppel: !!h || !!ex, rang: 0, sansJouer: false
      };
      if (ex) l.equipe = position(ex.equipePosition) || fixe || derniere || 1;
      // feuille déjà commencée : présent sans avoir joué = remplaçant ; sinon (pointage seul) on suppose qu'il joue
      if (ex && !ex.aJoue && commence) l.sansJouer = true;
      return l;
    });
    this.equipesFixes = this.lignes.some(l => l.fixe);
    // ordre fixé une fois pour toutes : les lignes ne sautent pas quand on coche
    this.lignes
      .sort((a, b) => Number(b.dansAppel) - Number(a.dansAppel) || (b.matchs ?? 0) - (a.matchs ?? 0) || this.nomDe(a.membre).localeCompare(this.nomDe(b.membre), 'fr'))
      .forEach((l, i) => l.rang = i);
  }

  dateCourte(d: string | null | undefined): string {
    if (!d) return 'dernier match';
    const [, m, j] = d.split('-');
    return `${j}/${m}`;
  }

  private nomsEquipes(m: any): [string, string] {
    if (m.typeMatch === 'AMICAL') {
      const local = m.groupe?.abreviation || m.groupe?.nom || 'Locale';
      const adverse = m.groupeAdverse ? (m.groupeAdverse.abreviation || m.groupeAdverse.nom) : (m.nomAdversaireManuel || 'Adverse');
      return [local, adverse];
    }
    if (m.typeMatch === 'ANNIVERSAIRE') return ['Équipe Fêtés', 'Équipe Adverses'];
    return [m.equipe1?.nom || 'Équipe 1', m.equipe2?.nom || 'Équipe 2'];
  }

  nomDe(m: any): string { return nomComplet(m, true) || '—'; }

  /** Libellé court d'une équipe (le nom s'il est court, sinon le numéro). */
  court(i: 0 | 1): string {
    const n = (this.noms[i] ?? '').trim();
    return n && n.length <= 8 ? n : String(i + 1);
  }

  get appel(): Ligne[] { return this.lignes.filter(l => l.dansAppel).sort((a, b) => a.rang - b.rang); }

  get resultats(): Ligne[] {
    const q = this.recherche.trim().toLowerCase();
    return this.lignes.filter(l => !l.dansAppel && this.nomDe(l.membre).toLowerCase().includes(q)).slice(0, 8);
  }

  /** Coche ou décoche : l'équipe vient du groupe, sinon de la dernière fois, sinon l'équipe 1. */
  basculer(l: Ligne): void {
    l.equipe = l.equipe ? 0 : (l.fixe || l.derniere || 1);
    l.sansJouer = false;
  }

  /** Ajoute à l'appel un membre trouvé par la recherche, déjà coché. */
  ajouter(l: Ligne): void {
    l.dansAppel = true;
    l.rang = Math.min(...this.lignes.map(x => x.rang)) - 1;   // en haut de la liste
    l.equipe = l.fixe || l.derniere || 1;
    this.recherche = '';
  }

  commeDernierMatch(): void {
    for (const j of this.sugg?.dernierMatch ?? []) {
      const l = this.lignes.find(x => x.membre.id === j.membreId);
      if (!l) continue;
      l.dansAppel = true;
      l.equipe = (this.equipesFixes && l.fixe) || (j.equipePosition === 2 ? 2 : 1);
    }
  }

  toutCocher(): void { for (const l of this.appel) if (!l.equipe) l.equipe = l.fixe || l.derniere || 1; }

  toutDecocher(): void { for (const l of this.lignes) l.equipe = 0; }

  ajouterInvite(): void {
    const nom = this.nouvelInvite.trim();
    if (!nom) return;
    this.invites.push({ nom, equipe: 1 });
    this.nouvelInvite = '';
  }

  retirerInvite(i: Invite): void { this.invites = this.invites.filter(x => x !== i); }

  /** Joueurs d'une équipe (les présents « sans jouer » ne comptent pas). */
  compte(e: 1 | 2): number { return this.lignes.filter(l => l.equipe === e && !l.sansJouer).length + this.invites.filter(i => i.equipe === e).length; }

  get total(): number { return this.compte(1) + this.compte(2); }

  get nbSansJouer(): number { return this.lignes.filter(l => l.equipe && l.sansJouer).length; }

  /** Avertissement (sans blocage) quand un match interne est très déséquilibré. */
  get desequilibre(): boolean {
    if (this.typeMatch === 'AMICAL' || this.typeMatch === 'ANNIVERSAIRE') return false;
    return this.total > 0 && Math.abs(this.compte(1) - this.compte(2)) >= 3;
  }

  private signature(): string {
    return JSON.stringify([
      this.lignes.filter(l => l.equipe).map(l => [l.membre.id, l.equipe, l.sansJouer]),
      this.invites.map(i => [i.nom, i.equipe])
    ]);
  }

  ngDoCheck(): void {
    if (this.chargement) return;
    const sig = this.signature();
    if (sig === this.sigSauvee || sig === this.sigPlanifiee) return;
    this.sigPlanifiee = sig;
    clearTimeout(this.minuteur);
    this.minuteur = setTimeout(() => this.sauvegarder(), 700);
  }

  ngOnDestroy(): void {
    clearTimeout(this.minuteur);
    // on quitte la page avec une modification en attente : on l'envoie tout de suite
    if (!this.chargement && this.signature() !== this.sigSauvee) this.sauvegarder();
  }

  private charge(): any[] {
    const base = (ex: any, aJoue = true) => ({ ...(ex ?? {}), present: true, aJoue });
    return [
      ...this.lignes.filter(l => l.equipe).map(l => ({
        ...base(l.existante, !l.sansJouer), membre: { id: l.membre.id }, equipePosition: l.equipe, equipeMatch: this.noms[l.equipe - 1]
      })),
      ...this.invites.map(i => ({
        ...base(i.existante), membre: null, nomOccasionnel: i.nom, equipePosition: i.equipe, equipeMatch: this.noms[i.equipe - 1]
      }))
    ];
  }

  /** Sauvegarde silencieuse. Une liste vide n'est jamais envoyée automatiquement (elle effacerait toutes les présences). */
  private sauvegarder(): void {
    if (this.enVol) { this.minuteur = setTimeout(() => this.sauvegarder(), 500); return; }
    const sig = this.signature();
    if (sig === this.sigSauvee || (!this.total && !this.nbSansJouer && !this.invites.length)) return;
    this.enVol = true;
    this.sauvegarde = 'encours';
    this.presences.savePresences(this.matchId, this.charge()).subscribe({
      next: () => { this.enVol = false; this.sigSauvee = sig; this.sauvegarde = 'ok'; },
      error: err => {
        this.enVol = false;
        this.sauvegarde = 'erreur';
        this.snackBar.open(err?.error?.message || 'Enregistrement automatique impossible.', 'Fermer', { duration: 5000 });
      }
    });
  }

  enregistrer(): void {
    if (!this.total || this.envoi) return;
    this.envoi = true;
    clearTimeout(this.minuteur);
    this.sigSauvee = this.signature();
    this.presences.savePresences(this.matchId, this.charge()).subscribe({
      next: () => { this.envoi = false; this.router.navigate(['/membre/saisie', this.matchId]); },
      error: err => {
        this.envoi = false;
        this.snackBar.open(err?.error?.message || 'Enregistrement impossible : seuls le responsable et les scribes peuvent saisir cette feuille.', 'Fermer', { duration: 5000 });
      }
    });
  }
}
