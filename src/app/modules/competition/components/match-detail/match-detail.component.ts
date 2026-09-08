// match-detail.component.ts — version corrigée

import {
  Component, OnInit, inject, signal, computed, Input
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { FeuilleMatchComponent } from '../feuille-match/feuille-match.component';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import {
  ReactiveFormsModule, FormsModule,
  FormBuilder, Validators, FormGroup
} from '@angular/forms';
import {
  Cote, MatchDetailDTO, TypeEvent, PosteJoueur,
  StatutComposition, MatchCompositionDTO, MembreEquipeDTO,
  MatchEventDTO, StatutMatch
} from '../../../../core/models/competition.models';
import { MatchApiService } from '../../../../core/services/competition/match-api.service';
import { CompetitionApiService } from '../../../../core/services/competition/competition-api.service';
import { MembreEquipeApiService } from '../../../../core/services/competition/membre-equipe-api.service';
import { forkJoin } from 'rxjs';

interface JoueurOption {
  id?: number;
  membreId?: number;
  nom: string;
  prenom?: string;
  numeroDos?: number;
  equipeId: number;
  equipeNom?: string;
}

type MatchTab = 'apercu' | 'composition' | 'evenements' | 'saisie' | 'feuille';

@Component({
  selector: 'app-match-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, TranslateModule,
    MatIconModule,
    FeuilleMatchComponent],
  templateUrl: './match-detail.component.html',
  styleUrls: ['./match-detail.component.scss']
})
export class MatchDetailComponent implements OnInit {

  Cote = Cote;

  // ── Permissions passées par competition-detail ────────────
  // @Input() permissions: string[] = [];
    permissions   = signal<string[]>([]);

  // private hasPermission(perm: string): boolean {
  //   return this.permissions.includes(perm);
  // }

  private route     = inject(ActivatedRoute);
  private api           = inject(MatchApiService);
  private compApi       = inject(CompetitionApiService);
  private membreApi = inject(MembreEquipeApiService);
  private fb        = inject(FormBuilder);

  match         = signal<MatchDetailDTO | null>(null);

  // ── Permissions ────────────────────────────────────────────

  isAdminMyApp  = false;

  canSaisirScores      = () => this.isAdminMyApp || this.permissions().includes('SAISIR_SCORES');
  canGererCompositions = () => this.isAdminMyApp || this.permissions().includes('GERER_COMPOSITIONS');
  canPlanifierMatchs   = () => this.isAdminMyApp || this.permissions().includes('PLANIFIER_MATCHS');
  activeTab     = signal<MatchTab>('apercu');
  savingEvent   = signal(false);
  savingScore   = signal(false);
  savingCompo   = signal(false);
  showEventForm = signal(false);
  compoEditMode = signal(false);

  compoSaisie = signal<{
    domicile:  { membreId: number; nom: string; prenom?: string;
                 numeroDos?: number; poste?: string; titulaire: boolean;
                 statut?: string; capitaine?: boolean; equipeId?: number }[];
    exterieur: { membreId: number; nom: string; prenom?: string;
                 numeroDos?: number; poste?: string; titulaire: boolean;
                 statut?: string; capitaine?: boolean; equipeId?: number }[];
  }>({ domicile: [], exterieur: [] });

  // Formulaire événement
  eventTypeSelect  = signal<TypeEvent>(TypeEvent.BUT);
  eventEquipe      = signal<'domicile' | 'exterieur' | null>(null);
  eventMinute: number | null = null;
  eventMinuteAdd: number | null = null;
  joueurSearch     = '';
  joueurManuelNom  = '';
  passeurSearch    = '';
  joueurSelectionne         = signal<JoueurOption | null>(null);
  passeurSelectionne        = signal<JoueurOption | null>(null);
  joueurSortantSelectionne  = signal<JoueurOption | null>(null);

  private joueursDomicileCompo:  JoueurOption[] = [];
  private joueursExterieurCompo: JoueurOption[] = [];

  scoreForm = this.fb.group({
    butsDomicile:         [0, [Validators.required, Validators.min(0)]],
    butsExterieur:        [0, [Validators.required, Validators.min(0)]],
    butsDomicileProlong:  [null as number | null],
    butsExterieurProlong: [null as number | null],
    tabDomicile:          [null as number | null],
    tabExterieur:         [null as number | null],
    avecProlong:          [false],
    avecTab:              [false],
  });

  tempsForm!: FormGroup;
  nouvelleDateHeure = '';

  // Tous les tabs disponibles
  private allTabs = [
    { key: 'apercu'      as MatchTab, label: 'Aperçu',      icon: 'visibility',    perm: null },
    { key: 'composition' as MatchTab, label: 'Composition', icon: 'people',        perm: 'GERER_COMPOSITIONS' },
    { key: 'evenements'  as MatchTab, label: 'Événements',  icon: 'sports_soccer', perm: 'SAISIR_SCORES' },
    { key: 'saisie'      as MatchTab, label: 'Saisie',      icon: 'edit',          perm: 'SAISIR_SCORES' },
    { key: 'feuille'     as MatchTab, label: 'Feuille',     icon: 'description',   perm: null },
  ];

  // Tabs visibles selon les permissions
  tabs = computed(() =>
    this.allTabs.filter(t =>
      t.perm === null || this.hasPermission(t.perm)
    )
  );

  postes = [
    { value: PosteJoueur.GARDIEN,   label: 'Gardien' },
    { value: PosteJoueur.DEFENSEUR, label: 'Défenseurs' },
    { value: PosteJoueur.MILIEU,    label: 'Milieux' },
    { value: PosteJoueur.ATTAQUANT, label: 'Attaquants' },
  ];

  eventTypes = [
    { value: TypeEvent.BUT,                       emoji: '⚽', label: 'But' },
    { value: TypeEvent.PENALTY_MARQUE,            emoji: '⚽', label: 'Penalty' },
    { value: TypeEvent.PENALTY_RATE,              emoji: '❌', label: 'Pen. raté' },
    { value: TypeEvent.CONTRE_SON_CAMP,           emoji: '⚽', label: 'CSC' },
    { value: TypeEvent.CARTON_JAUNE,              emoji: '🟨', label: 'Jaune' },
    { value: TypeEvent.CARTON_ROUGE,              emoji: '🟥', label: 'Rouge' },
    { value: TypeEvent.CARTON_ROUGE_DOUBLE_JAUNE, emoji: '🟥', label: '2J=R' },
    { value: TypeEvent.REMPLACEMENT,              emoji: '🔄', label: 'Rempl.' },
    { value: TypeEvent.BUT_ANNULE,                emoji: '❌', label: 'But annulé' },
  ];

  // ── Helper tri alphabétique ───────────────────────────────
  private trierAlpha(joueurs: JoueurOption[]): JoueurOption[] {
    return [...joueurs].sort((a, b) => {
      const nomA = `${a.nom} ${a.prenom ?? ''}`.trim().toLowerCase();
      const nomB = `${b.nom} ${b.prenom ?? ''}`.trim().toLowerCase();
      return nomA.localeCompare(nomB, 'fr');
    });
  }
// totalDom(): number {
//   const m = this.match()!;
//   if (this.isTermine())
//     return (m.butsDomicile ?? 0) + (m.butsDomicileProlong ?? 0);
//   return this.scoreDepuisEvenements('domicile');
// }

// totalExt(): number {
//   const m = this.match()!;
//   if (this.isTermine())
//     return (m.butsExterieur ?? 0) + (m.butsExterieurProlong ?? 0);
//   return this.scoreDepuisEvenements('exterieur');
// }
  // ── Computed joueurs ──────────────────────────────────────
  joueursDisponibles = computed(() => {
    const equipe = this.eventEquipe();
    if (!equipe) return [];
    const liste = equipe === 'domicile'
      ? this.joueursDomicileCompo
      : this.joueursExterieurCompo;

    const minute = this.eventMinute ?? 0;
    const compo  = equipe === 'domicile'
      ? (this.match()?.compositionDomicile ?? [])
      : (this.match()?.compositionExterieur ?? []);

    // Si pas de composition saisie → retourner tout le monde
    if (!compo.length) return liste;

    return liste.filter(j => {
      const c = compo.find(c =>
        ((c as any).membreEquipeId ?? c.id) === j.membreId);
      if (!c) return false;
      // Non convoqué → jamais disponible
      if (c.statut === 'NON_CONVOQUE') return false;
      // Titulaire → sur le terrain sauf si sorti avant la minute
      if (c.statut === 'TITULAIRE' || c.statut !== 'REMPLACANT') {
        return c.minuteSortie == null || c.minuteSortie > minute;
      }
      // Remplaçant → disponible seulement s'il est entré avant la minute
      return c.minuteEntree != null
          && c.minuteEntree <= minute
          && (c.minuteSortie == null || c.minuteSortie > minute);
    });
  });

  joueursFiltres = computed(() => {
    const q = this.joueurSearch.toLowerCase().trim();
    if (!q) return this.joueursDisponibles();
    return this.joueursDisponibles().filter(j =>
      j.nom.toLowerCase().includes(q) ||
      (j.prenom?.toLowerCase().includes(q) ?? false) ||
      String(j.numeroDos ?? '').includes(q)
    );
  });

  passeursDisponibles = computed(() => {
    const sel = this.joueurSelectionne();
    return this.joueursDisponibles().filter(j => j.membreId !== sel?.membreId);
  });

  passeursFiltres = computed(() => {
    const q = this.passeurSearch.toLowerCase().trim();
    if (!q) return this.passeursDisponibles();
    return this.passeursDisponibles().filter(j =>
      j.nom.toLowerCase().includes(q) ||
      (j.prenom?.toLowerCase().includes(q) ?? false)
    );
  });

  joueursSortants = computed(() => {
    const equipe = this.eventEquipe();
    if (!equipe) return [];
    const minute = this.eventMinute ?? 0;
    const compo  = equipe === 'domicile'
      ? (this.match()?.compositionDomicile ?? [])
      : (this.match()?.compositionExterieur ?? []);
    const liste = equipe === 'domicile'
      ? this.joueursDomicileCompo
      : this.joueursExterieurCompo;

    return liste.filter(j => {
      // Ne pas proposer le joueur entrant comme sortant
      if (j.membreId === this.joueurSelectionne()?.membreId) return false;
      if (!compo.length) return true;
      const c = compo.find(c =>
        ((c as any).membreEquipeId ?? c.id) === j.membreId);
      if (!c) return false;
      if (c.statut === 'NON_CONVOQUE') return false;
      // Doit être sur le terrain actuellement
      if (c.statut === 'TITULAIRE' || c.statut !== 'REMPLACANT') {
        return c.minuteSortie == null || c.minuteSortie > minute;
      }
      return c.minuteEntree != null
          && c.minuteEntree <= minute
          && (c.minuteSortie == null || c.minuteSortie > minute);
    });
  });

  // Remplaçants disponibles = pas encore entrés ET pas non-convoqués
  joueursEntrants = computed(() => {
    const equipe = this.eventEquipe();
    if (!equipe) return [];
    const compo = equipe === 'domicile'
      ? (this.match()?.compositionDomicile ?? [])
      : (this.match()?.compositionExterieur ?? []);
    const liste = equipe === 'domicile'
      ? this.joueursDomicileCompo
      : this.joueursExterieurCompo;

    return liste.filter(j => {
      if (!compo.length) return true;
      const c = compo.find(c =>
        ((c as any).membreEquipeId ?? c.id) === j.membreId);
      if (!c) return false;
      if (c.statut === 'NON_CONVOQUE') return false;
      // Doit être remplaçant pas encore entré
      return c.statut === 'REMPLACANT' && c.minuteEntree == null;
    });
  });

  get competitionId(): number {
    return Number(this.route.snapshot.paramMap.get('id'));
  }
  get matchId(): number {
    return Number(this.route.snapshot.paramMap.get('matchId'));
  }

  ngOnInit(): void {
    this.buildTempsForm();
    this.reload();
    this.chargerPermissions();
  }

  private chargerPermissions(): void {
    this.compApi.getMonRole(this.competitionId).subscribe({
      next: (r: any) => {
        this.permissions.set(r.permissions ?? []);
        this.isAdminMyApp = r.role === 'ADMIN' || r.isAdmin === true;
      },
      error: () => this.permissions.set([])
    });
  }

  buildTempsForm(): void {
    this.tempsForm = this.fb.group({
      heureEffectiveDebut:   [''],
      heureEffectiveMiTemps: [''],
      heureEffectiveReprise: [''],
      heureEffectiveFin:     [''],
      tempsAdditionnel1:     [null],
      tempsAdditionnel2:     [null],
      tempsAdditionnelP1:    [null],
      tempsAdditionnelP2:    [null],
      conditions:            [''],
    });
  }

reload(): void {
  this.api.getById(this.competitionId, this.matchId).subscribe(m => {
    this.match.set(m);
    this.buildJoueursListes(m);
    this.buildTousJoueurs(m);

    if ((m as any).commentaire) this.commentaireMatch = (m as any).commentaire;
    if ((m as any).hommeDuMatchId) {
      const hdm = this.tousJoueurs
        .find(j => j.membreId === (m as any).hommeDuMatchId);
      if (hdm) this.hommeDuMatch.set(hdm);
    }

    // FIX : pré-remplir TOUS les champs du score
    if (m.butsDomicile != null) {
      const avecProlong = m.butsDomicileProlong != null;
      const avecTab     = m.tabDomicile != null;

      this.scoreForm.patchValue({
        butsDomicile:         m.butsDomicile,
        butsExterieur:        m.butsExterieur,
        butsDomicileProlong:  m.butsDomicileProlong ?? null,
        butsExterieurProlong: m.butsExterieurProlong ?? null,
        tabDomicile:          m.tabDomicile ?? null,
        tabExterieur:         m.tabExterieur ?? null,
        avecProlong,
        avecTab,
      });
    }
  });
}

  private buildJoueursListes(m: MatchDetailDTO): void {
    // FIX : trier alphabétiquement après le mapping
    this.joueursDomicileCompo = this.trierAlpha(
      this.compoToOptions(m.compositionDomicile, m.domicile?.id, m.domicile?.nomEquipe)
    );
    this.joueursExterieurCompo = this.trierAlpha(
      this.compoToOptions(m.compositionExterieur, m.exterieur?.id, m.exterieur?.nomEquipe)
    );

    if (!m.compositionDomicile?.length && m.domicile?.id) {
      this.membreApi.getJoueurs(this.competitionId, m.domicile.id)
        .subscribe(membres => {
          this.joueursDomicileCompo = this.trierAlpha(
            membres.map(mb => this.membreToOption(mb, m.domicile!.id, m.domicile?.nomEquipe))
          );
          // Reconstruire tousJoueurs après chargement async
          this.tousJoueurs = this.trierAlpha([
            ...this.joueursDomicileCompo,
            ...this.joueursExterieurCompo
          ]);
        });
    }
    if (!m.compositionExterieur?.length && m.exterieur?.id) {
      this.membreApi.getJoueurs(this.competitionId, m.exterieur.id)
        .subscribe(membres => {
          this.joueursExterieurCompo = this.trierAlpha(
            membres.map(mb => this.membreToOption(mb, m.exterieur!.id, m.exterieur?.nomEquipe))
          );
          // Reconstruire tousJoueurs après chargement async
          this.tousJoueurs = this.trierAlpha([
            ...this.joueursDomicileCompo,
            ...this.joueursExterieurCompo
          ]);
        });
    }
  }

private compoToOptions(
    compo: MatchCompositionDTO[] | undefined,
    equipeId?: number,
    equipeNom?: string): JoueurOption[] {
  if (!compo?.length || !equipeId) return [];
  return compo.map(c => ({
    id:        c.id,
    membreId:  c.membreEquipeId ?? c.membreId ?? c.id, // ← priorité membreEquipeId
    nom:       c.joueurNom ?? '',
    prenom:    c.joueurPrenom,
    numeroDos: c.numeroDos,
    equipeId,
    equipeNom,
  }));
}

  private membreToOption(
      m: MembreEquipeDTO,
      equipeId: number,
      equipeNom?: string): JoueurOption {
    return {
      id:        m.id,
      membreId:  m.id,
      nom:       m.nom ?? '',
      prenom:    m.prenom,
      numeroDos: m.numeroDos,
      equipeId,
      equipeNom,
    };
    // Note : le tri est appliqué dans buildJoueursListes via trierAlpha()
  }

  // ── Handlers formulaire événement ────────────────────────
  onTypeChange(type: TypeEvent): void {
    this.eventTypeSelect.set(type);
    this.joueurSelectionne.set(null);
    this.passeurSelectionne.set(null);
    this.joueurSortantSelectionne.set(null);
    this.joueurSearch = '';
    this.passeurSearch = '';
  }

  onEquipeChange(equipe: 'domicile' | 'exterieur'): void {
    this.eventEquipe.set(equipe);
    this.joueurSelectionne.set(null);
    this.passeurSelectionne.set(null);
    this.joueurSortantSelectionne.set(null);
    this.joueurSearch = '';
    this.passeurSearch = '';
  }

  selectionnerJoueur(j: JoueurOption): void {
    this.joueurSelectionne.set(j);
    this.joueurSearch = '';
    this.passeurSelectionne.set(null);
    this.joueurSortantSelectionne.set(null);
  }

  selectionnerPasseur(j: JoueurOption): void {
    this.passeurSelectionne.set(j);
    this.passeurSearch = '';
  }

  toggleEventForm(): void {
    this.showEventForm.update(v => !v);
    if (!this.showEventForm()) this.resetEventForm();
  }

  resetEventForm(): void {
    this.eventTypeSelect.set(TypeEvent.BUT);
    this.eventEquipe.set(null);
    this.eventMinute    = null;
    this.eventMinuteAdd = null;
    this.joueurSelectionne.set(null);
    this.passeurSelectionne.set(null);
    this.joueurSortantSelectionne.set(null);
    this.joueurSearch    = '';
    this.passeurSearch   = '';
    this.joueurManuelNom = '';
    this.showEventForm.set(false);
  }

  isTypeBut(): boolean {
    return [TypeEvent.BUT, TypeEvent.PENALTY_MARQUE, TypeEvent.CONTRE_SON_CAMP]
      .includes(this.eventTypeSelect());
  }

  isTypeRemplacement(): boolean {
    return this.eventTypeSelect() === TypeEvent.REMPLACEMENT;
  }

  joueurLabel(): string {
    const labels: Partial<Record<TypeEvent, string>> = {
      [TypeEvent.BUT]:                       'Buteur',
      [TypeEvent.PENALTY_MARQUE]:            'Tireur',
      [TypeEvent.PENALTY_RATE]:              'Tireur',
      [TypeEvent.CONTRE_SON_CAMP]:           'Joueur (CSC)',
      [TypeEvent.CARTON_JAUNE]:              'Joueur averti',
      [TypeEvent.CARTON_ROUGE]:              'Joueur exclu',
      [TypeEvent.CARTON_ROUGE_DOUBLE_JAUNE]: 'Joueur exclu',
      [TypeEvent.REMPLACEMENT]:              'Joueur entrant',
      [TypeEvent.BUT_ANNULE]:                'Auteur du but annulé',
    };
    return labels[this.eventTypeSelect()] ?? 'Joueur';
  }

  canSubmitEvent(): boolean {
    const hasMinute  = this.eventMinute != null && this.eventMinute > 0;
    const hasEquipe  = !!this.eventEquipe();
    const hasType    = !!this.eventTypeSelect();

    if (this.isTypeRemplacement()) {
      // Remplacement : joueur entrant (joueurSelectionne) ET sortant obligatoires
      return hasMinute && hasEquipe && hasType
          && !!this.joueurSelectionne()        // entrant
          && !!this.joueurSortantSelectionne(); // sortant
    }

    // Autres types : joueur principal (ou saisie manuelle)
    return hasMinute && hasEquipe && hasType
        && (!!this.joueurSelectionne() || !!this.joueurManuelNom.trim());
  }

  ajouterEvenement(): void {
    if (!this.canSubmitEvent()) return;
    this.savingEvent.set(true);

    const sel     = this.joueurSelectionne();
    const passeur = this.passeurSelectionne();
    const sortant = this.joueurSortantSelectionne();
    const equipe  = this.eventEquipe() === 'domicile'
      ? this.match()!.domicile
      : this.match()!.exterieur;

    const dto: MatchEventDTO = {
      type:              this.eventTypeSelect(),
      equipeId:          equipe?.id,
      equipeNom:         equipe?.nomEquipe,
      minute:            this.eventMinute!,
      minuteAdditionnel: this.eventMinuteAdd ?? undefined,
      joueurId:          sel?.membreId,
      joueurNom:         sel?.nom ?? this.joueurManuelNom,
      joueurPrenom:      sel?.prenom,
      passeurId:         passeur?.membreId,
      passeurNom:        passeur
        ? `${passeur.prenom ?? ''} ${passeur.nom}`.trim()
        : undefined,
      joueurSortantId:   sortant?.membreId,
      joueurSortantNom:  sortant
        ? `${sortant.prenom ?? ''} ${sortant.nom}`.trim()
        : undefined,
    };

    this.api.ajouterEvenement(this.competitionId, this.matchId, dto)
      .subscribe({
        next: () => {
          this.reload();
          this.resetEventForm();
          this.savingEvent.set(false);
        },
        error: () => this.savingEvent.set(false)
      });
  }

  supprimerEvenement(eventId: number): void {
    this.api.supprimerEvenement(this.competitionId, this.matchId, eventId)
      .subscribe(() => this.reload());
  }

  setTab(t: MatchTab): void { this.activeTab.set(t); }

  isTermine(): boolean {
    return [StatutMatch.TERMINE, StatutMatch.FORFAIT_DOMICILE,
            StatutMatch.FORFAIT_EXTERIEUR, StatutMatch.FORFAIT_DOUBLE]
      .includes(this.match()?.statut as StatutMatch);
  }

  isEnCours(): boolean  { return this.match()?.statut === StatutMatch.EN_COURS; }
  isPlanifie(): boolean { return this.match()?.statut === StatutMatch.PLANIFIE; }
  showScore(): boolean  { return this.isTermine() || this.isEnCours(); }

  // ── Helpers permissions ──────────────────────────────────
  hasPermission(perm: string): boolean {
    if (this.isAdminMyApp) return true;
    return this.permissions().includes(perm);
  }

  // ── Guards basés sur permissions + statut ─────────────────
  canEdit(): boolean {
    return this.isEnCours() && this.hasPermission('SAISIR_SCORES');
  }
  canSaisirScore(): boolean {
    return this.isEnCours() && this.hasPermission('SAISIR_SCORES');
  }
  canGererComposition(): boolean {
    return this.hasPermission('GERER_COMPOSITIONS')
        && !this.isTermine();
  }
  canDemarrerMatch(): boolean {
    return this.isPlanifie() && this.hasPermission('SAISIR_SCORES');
  }
  canValiderFeuille(): boolean { return this.hasPermission('VALIDER_FEUILLES'); }
  canPlanifier(): boolean {
    return this.hasPermission('PLANIFIER_MATCHS') && !this.isTermine();
  }

  isWinner(side: 'home' | 'away'): boolean {
    if (!this.isTermine()) return false;
    const m = this.match()!;
    if (m.tabDomicile != null)
      return side === 'home'
        ? m.tabDomicile! > m.tabExterieur!
        : m.tabExterieur! > m.tabDomicile!;
    return side === 'home'
      ? this.totalDom() > this.totalExt()
      : this.totalExt() > this.totalDom();
  }

  totalDom(): number {
    const m = this.match()!;
    if (this.isTermine())
      return (m.butsDomicile ?? 0) + (m.butsDomicileProlong ?? 0);
    return this.scoreDepuisEvenements('domicile');
  }

  totalExt(): number {
    const m = this.match()!;
    if (this.isTermine())
      return (m.butsExterieur ?? 0) + (m.butsExterieurProlong ?? 0);
    return this.scoreDepuisEvenements('exterieur');
  }

  scoreDepuisEvenements(side: 'domicile' | 'exterieur'): number {
    const m = this.match();
    if (!m) return 0;
    const events: any[] = (m as any).evenements ?? (m as any).events ?? [];
    if (!events.length) return 0;
    const equipeId = side === 'domicile' ? m.domicile?.id : m.exterieur?.id;
    return events.reduce((total: number, e: any) => {
      const isBut = ['BUT', 'PENALTY_MARQUE', 'PENALTY'].includes(e.type);
      const isCSC = ['CONTRE_SON_CAMP', 'BUT_CSC'].includes(e.type);
      if (isBut && e.equipeId === equipeId) return total + 1;
      if (isCSC) {
        const adv = side === 'domicile' ? m.exterieur?.id : m.domicile?.id;
        if (e.equipeId === adv) return total + 1;
      }
      return total;
    }, 0);
  }

  sortedEvents(): any[] {
    const m = this.match();
    if (!m) return [];
    const events = (m as any).evenements ?? (m as any).events ?? [];
    return [...events].sort((a: any, b: any) => (a.minute ?? 0) - (b.minute ?? 0));
  }

  isExterieurEvent(e: any): boolean {
    return e.equipeId === this.match()?.exterieur?.id;
  }

  getCompo(side: string): MatchCompositionDTO[] {
    return side === 'domicile'
      ? (this.match()?.compositionDomicile ?? [])
      : (this.match()?.compositionExterieur ?? []);
  }

  getRemplacants(side: string): MatchCompositionDTO[] {
    return this.getCompo(side).filter(p => p.statut === 'REMPLACANT');
  }

  getByPoste(compo: MatchCompositionDTO[], poste: PosteJoueur): MatchCompositionDTO[] {
    return compo.filter(p => p.poste === poste);
  }

  eventIcon(type: TypeEvent | string): string {
    const icons: Record<string, string> = {
      'BUT': '⚽', 'PENALTY_MARQUE': '⚽', 'PENALTY_RATE': '❌',
      'CONTRE_SON_CAMP': '⚽', 'BUT_CSC': '⚽',
      'CARTON_JAUNE': '🟨', 'CARTON_ROUGE': '🟥',
      'CARTON_ROUGE_DOUBLE_JAUNE': '🟥',
      'REMPLACEMENT': '🔄', 'BUT_ANNULE': '❌',
    };
    return icons[type as string] ?? '•';
  }

  statutLabel(): string {
    const labels: Partial<Record<StatutMatch, string>> = {
      [StatutMatch.PLANIFIE]:          'À venir',
      [StatutMatch.EN_COURS]:          'En cours',
      [StatutMatch.TERMINE]:           'Terminé',
      [StatutMatch.REPORTE]:           'Reporté',
      [StatutMatch.FORFAIT_DOMICILE]:  'Forfait domicile',
      [StatutMatch.FORFAIT_EXTERIEUR]: 'Forfait extérieur',
      [StatutMatch.FORFAIT_DOUBLE]:    'Double forfait',
      [StatutMatch.ANNULE]:            'Annulé',
    };
    return labels[this.match()?.statut as StatutMatch] ?? (this.match()?.statut ?? '');
  }

  getInitials(name?: string): string {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  }

  goBack(): void { history.back(); }

  saisirScore(): void {
    if (this.scoreForm.invalid || !this.canSaisirScore()) return;
    this.savingScore.set(true);
    const v = this.scoreForm.value;
    const isBracket = !!(this.match() as any).bracketNoeudId;
    if (isBracket) {
      const dom = v.butsDomicile ?? 0;
      const ext = v.butsExterieur ?? 0;
      if (dom === ext && !v.avecProlong && !v.avecTab) {
        alert('Un match d\'élimination directe doit avoir un vainqueur.');
        this.savingScore.set(false);
        return;
      }
      if (v.avecTab && v.tabDomicile === v.tabExterieur) {
        alert('Les tirs au but ne peuvent pas être à égalité.');
        this.savingScore.set(false);
        return;
      }
    }
    this.api.saisirResultat(this.competitionId, this.matchId, {
      butsDomicile:         v.butsDomicile!,
      butsExterieur:        v.butsExterieur!,
      butsDomicileProlong:  v.avecProlong ? (v.butsDomicileProlong ?? undefined) : undefined,
      butsExterieurProlong: v.avecProlong ? (v.butsExterieurProlong ?? undefined) : undefined,
      tabDomicile:          v.avecTab ? (v.tabDomicile ?? undefined) : undefined,
      tabExterieur:         v.avecTab ? (v.tabExterieur ?? undefined) : undefined,
    }).subscribe({
      next: m => { this.match.set(m); this.savingScore.set(false); },
      error: () => this.savingScore.set(false)
    });
  }

  demarrerMatch(): void {
    if (!this.canDemarrerMatch()) return;
    this.api.demarrerMatch(this.competitionId, this.matchId).subscribe({
      next: m => { this.match.set(m); this.activeTab.set('evenements'); }
    });
  }

  toggleCompoEdit(): void {
    if (!this.compoEditMode()) {
      this.api.getById(this.competitionId, this.matchId).subscribe(m => {
        this.match.set(m);
        const toSaisie = (compo: MatchCompositionDTO[] | undefined, equipeId?: number) =>
          // FIX : trier alphabétiquement dans le mode édition aussi
          [...(compo ?? []).filter(c => c.joueurNom)]
            .sort((a, b) =>
              `${a.joueurNom} ${a.joueurPrenom ?? ''}`.trim()
                .localeCompare(`${b.joueurNom} ${b.joueurPrenom ?? ''}`.trim(), 'fr'))
            .map(c => ({
              membreId: c.membreEquipeId ?? c.membreId ?? c.id ?? 0,
              nom:       c.joueurNom ?? '',
              prenom:    c.joueurPrenom,
              numeroDos: c.numeroDos,
              poste:     c.poste ? String(c.poste) : undefined,
              titulaire: c.statut === 'TITULAIRE',
              statut:    c.statut ?? 'REMPLACANT',
              capitaine: c.capitaine ?? false,  // ← capitaine du jour
              equipeId
            }));

            

        const domicile  = toSaisie(m.compositionDomicile,  m.domicile?.id);
        const exterieur = toSaisie(m.compositionExterieur, m.exterieur?.id);

        if (!domicile.length && m.domicile?.id) {
          this.membreApi.getJoueurs(this.competitionId, m.domicile.id)
            .subscribe(membres => {
              this.compoSaisie.update(cs => ({
                ...cs,
                domicile: [...membres]
                  .sort((a, b) => `${a.nom} ${a.prenom ?? ''}`.trim()
                    .localeCompare(`${b.nom} ${b.prenom ?? ''}`.trim(), 'fr'))
                  .map(mb => ({
                    membreId: mb.id, nom: mb.nom ?? '', prenom: mb.prenom,
                    numeroDos: mb.numeroDos,
                    titulaire: false, statut: 'REMPLACANT',  // ← défaut
                    capitaine: false, equipeId: m.domicile?.id
                  }))
              }));
            });
        } else {
          this.compoSaisie.update(cs => ({ ...cs, domicile }));
        }

        if (!exterieur.length && m.exterieur?.id) {
          this.membreApi.getJoueurs(this.competitionId, m.exterieur.id)
            .subscribe(membres => {
               console.log('Roster domicile chargé:', membres.map(mb => ({
      id: mb.id, nom: mb.nom, prenom: mb.prenom
    })));
              this.compoSaisie.update(cs => ({
                ...cs,
                exterieur: [...membres]
                  .sort((a, b) => `${a.nom} ${a.prenom ?? ''}`.trim()
                    .localeCompare(`${b.nom} ${b.prenom ?? ''}`.trim(), 'fr'))
                  .map(mb => ({
                    membreId: mb.id, nom: mb.nom ?? '', prenom: mb.prenom,
                    numeroDos: mb.numeroDos,
                    titulaire: false, statut: 'REMPLACANT',  // ← défaut
                    capitaine: false, equipeId: m.exterieur?.id
                  }))
              }));
            });
        } else {
          this.compoSaisie.update(cs => ({ ...cs, exterieur }));
        }

        this.compoEditMode.set(true);
      });
    } else {
      this.compoEditMode.set(false);
    }
  }

  toggleTitulaire(side: 'domicile' | 'exterieur', membreId: number): void {
    // Garde pour compatibilité — cycle 3 états via setStatut()
    this.compoSaisie.update(cs => ({
      ...cs,
      [side]: cs[side].map(j =>
        j.membreId === membreId ? { ...j, titulaire: !j.titulaire } : j
      )
    }));
  }

  // Nouveau : statut à 3 états
  toggleCapitaine(side: 'domicile' | 'exterieur', membreId: number): void {
    this.compoSaisie.update(cs => ({
      ...cs,
      [side]: cs[side].map(j => ({
        ...j,
        // Un seul capitaine par équipe — désactiver les autres
        capitaine: j.membreId === membreId ? !j.capitaine : false
      }))
    }));
  }

  setStatut(side: 'domicile' | 'exterieur',
            membreId: number,
            statut: 'TITULAIRE' | 'REMPLACANT' | 'NON_CONVOQUE'): void {
    this.compoSaisie.update(cs => ({
      ...cs,
      [side]: cs[side].map(j =>
        j.membreId === membreId
          ? { ...j, statut, titulaire: statut === 'TITULAIRE' }
          : j
      )
    }));
  }

  getStatut(j: { titulaire: boolean; statut?: string }): string {
    if ((j as any).statut === 'NON_CONVOQUE') return 'NON_CONVOQUE';
    return j.titulaire ? 'TITULAIRE' : 'REMPLACANT';
  }

  enregistrerComposition(): void {
    const cs = this.compoSaisie();
    const m  = this.match();
    if (!m?.domicile?.id || !m?.exterieur?.id) return;
    this.savingCompo.set(true);

    const toDTO = (joueurs: typeof cs.domicile) =>
      joueurs.map(j => ({
        membreId:    j.membreId,
        joueurNom:   j.nom,
        joueurPrenom: j.prenom,
        numeroDos:   j.numeroDos,
        poste:       this.mapPosteToEnum(j.poste),
        // FIX : utiliser statut explicite (3 états)
        statut:    (j as any).statut ?? (j.titulaire ? 'TITULAIRE' : 'REMPLACANT'),
        capitaine: (j as any).capitaine ?? false
      }));

    forkJoin([
      this.api.saisirComposition(this.competitionId, this.matchId,
        m.domicile.id, toDTO(cs.domicile)),
      this.api.saisirComposition(this.competitionId, this.matchId,
        m.exterieur.id, toDTO(cs.exterieur))
    ]).subscribe({
      next: () => {
        this.api.getById(this.competitionId, this.matchId).subscribe(maj => {
          this.match.set(maj);
          this.buildJoueursListes(maj);
          this.compoEditMode.set(false);
          this.savingCompo.set(false);
        });
      },
      error: () => this.savingCompo.set(false)
    });
  }

  private mapPosteToEnum(poste: string | undefined): string | null {
    if (!poste) return null;
    const p = poste.toLowerCase();
    if (p.includes('gardien'))                               return 'GARDIEN';
    if (p.includes('défenseur') || p.includes('defenseur')) return 'DEFENSEUR';
    if (p.includes('milieu'))                                return 'MILIEU';
    if (p.includes('attaquant') || p.includes('ailier'))    return 'ATTAQUANT';
    return poste.toUpperCase();
  }

  // ── Homme du match ───────────────────────────────────────
  hommeDuMatch    = signal<JoueurOption | null>(null);
  hdmSearch       = '';
  commentaireMatch = '';
  savingFin       = signal(false);
  private tousJoueurs: JoueurOption[] = [];

  hdmFiltres = computed(() => {
    const q = this.hdmSearch.toLowerCase().trim();
    if (!q) return this.tousJoueurs;
    return this.tousJoueurs.filter(j =>
      j.nom.toLowerCase().includes(q) ||
      (j.prenom?.toLowerCase().includes(q) ?? false) ||
      (j.equipeNom?.toLowerCase().includes(q) ?? false)
    );
  });

  private buildTousJoueurs(m: MatchDetailDTO): void {
    // FIX : utiliser joueursDomicileCompo/joueursExterieurCompo qui ont
    // déjà le bon membreId (MembreEquipeCompetition.id)
    // Ces listes sont remplies par buildJoueursListes() — appeler après lui
    if (this.joueursDomicileCompo.length || this.joueursExterieurCompo.length) {
      this.tousJoueurs = this.trierAlpha([
        ...this.joueursDomicileCompo,
        ...this.joueursExterieurCompo
      ]);
    } else {
      // Fallback si listes pas encore chargées (async)
      // → sera mis à jour par buildJoueursListes une fois chargé
      this.tousJoueurs = [];
    }
  }

  selectionnerHommeDuMatch(j: JoueurOption): void {
    this.hommeDuMatch.set(j);
    this.hdmSearch = '';
  }

  saisirFin(): void {
    this.savingFin.set(true);

    console.log(this.hommeDuMatch())
    const dto = {
      hommeDuMatchId: this.hommeDuMatch()?.membreId ?? null,
      commentaire:    this.commentaireMatch || null
    };
    this.api.saisirFin(this.competitionId, this.matchId, dto).subscribe({
      next: m => { this.match.set(m); this.savingFin.set(false); },
      error: () => this.savingFin.set(false)
    });
  }

    declarerForfait(equipe: Cote): void {
    this.api.declarerForfait(this.competitionId, this.matchId,
      { equipeForfait: equipe }).subscribe(m => this.match.set(m));
  }

  reporter(): void {
    if (!this.nouvelleDateHeure) return;
    this.api.reporter(this.competitionId, this.matchId,
      { nouvelleDate: this.nouvelleDateHeure }).subscribe(m => this.match.set(m));
  }

  saisirTemps(): void {
    const v = this.tempsForm.value;
    this.api.saisirTemps(this.competitionId, this.matchId, {
      heureEffectiveDebut:   v.heureEffectiveDebut || undefined,
      heureEffectiveMiTemps: v.heureEffectiveMiTemps || undefined,
      heureEffectiveReprise: v.heureEffectiveReprise || undefined,
      heureEffectiveFin:     v.heureEffectiveFin || undefined,
      tempsAdditionnel1:     v.tempsAdditionnel1 ?? undefined,
      tempsAdditionnel2:     v.tempsAdditionnel2 ?? undefined,
    }).subscribe(m => this.match.set(m));
  }
}