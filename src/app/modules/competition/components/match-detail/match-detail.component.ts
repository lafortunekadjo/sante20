// match-detail.component.ts — version corrigée

import {
  Component, OnInit, inject, signal, computed
} from '@angular/core';
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

type MatchTab = 'apercu' | 'composition' | 'evenements' | 'saisie';

@Component({
  selector: 'app-match-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule],
  templateUrl: './match-detail.component.html',
  styleUrls: ['./match-detail.component.scss']
})
export class MatchDetailComponent implements OnInit {

  Cote = Cote;

  private route     = inject(ActivatedRoute);
  private api       = inject(MatchApiService);
  private membreApi = inject(MembreEquipeApiService);
  private fb        = inject(FormBuilder);

  match         = signal<MatchDetailDTO | null>(null);
  activeTab     = signal<MatchTab>('apercu');
  savingEvent   = signal(false);
  savingScore   = signal(false);
  savingCompo   = signal(false);
  showEventForm = signal(false);
  compoEditMode = signal(false);

  compoSaisie = signal<{
    domicile:  { membreId: number; nom: string; prenom?: string;
                 numeroDos?: number; poste?: string; titulaire: boolean; equipeId?: number }[];
    exterieur: { membreId: number; nom: string; prenom?: string;
                 numeroDos?: number; poste?: string; titulaire: boolean; equipeId?: number }[];
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

  tabs = [
    { key: 'apercu'      as MatchTab, label: 'Aperçu',      icon: 'visibility' },
    { key: 'composition' as MatchTab, label: 'Composition', icon: 'people' },
    { key: 'evenements'  as MatchTab, label: 'Événements',  icon: 'sports_soccer' },
    { key: 'saisie'      as MatchTab, label: 'Saisie',      icon: 'edit' },
  ];

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

  // ── Computed joueurs ──────────────────────────────────────
  joueursDisponibles = computed(() => {
    const equipe = this.eventEquipe();
    if (!equipe) return [];
    return equipe === 'domicile'
      ? this.joueursDomicileCompo
      : this.joueursExterieurCompo;
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
    const liste = equipe === 'domicile'
      ? this.joueursDomicileCompo
      : this.joueursExterieurCompo;
    // Titulaires ou remplaçants entrés — excluant le joueur entrant sélectionné
    return liste.filter(j => j.membreId !== this.joueurSelectionne()?.membreId);
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
      if (m.butsDomicile != null) {
        this.scoreForm.patchValue({
          butsDomicile:  m.butsDomicile,
          butsExterieur: m.butsExterieur,
        });
      }
    });
  }

  private buildJoueursListes(m: MatchDetailDTO): void {
    this.joueursDomicileCompo = this.compoToOptions(
      m.compositionDomicile, m.domicile?.id, m.domicile?.nomEquipe);
    this.joueursExterieurCompo = this.compoToOptions(
      m.compositionExterieur, m.exterieur?.id, m.exterieur?.nomEquipe);

    if (!m.compositionDomicile?.length && m.domicile?.id) {
      this.membreApi.getJoueurs(this.competitionId, m.domicile.id)
        .subscribe(membres => {
          this.joueursDomicileCompo = membres.map(mb =>
            this.membreToOption(mb, m.domicile!.id, m.domicile?.nomEquipe));
        });
    }
    if (!m.compositionExterieur?.length && m.exterieur?.id) {
      this.membreApi.getJoueurs(this.competitionId, m.exterieur.id)
        .subscribe(membres => {
          this.joueursExterieurCompo = membres.map(mb =>
            this.membreToOption(mb, m.exterieur!.id, m.exterieur?.nomEquipe));
        });
    }
  }

  private compoToOptions(
      compo: MatchCompositionDTO[] | undefined,
      equipeId?: number,
      equipeNom?: string): JoueurOption[] {
    if (!compo?.length || !equipeId) return [];
    return compo.map(c => ({
      // FIX : membreId = MembreEquipeCompetition.id (champ explicite dans MatchComposition)
      //        c.membreEquipeId est l'id de MembreEquipeCompetition
      //        c.id est l'id de MatchComposition (ne pas utiliser pour les events)
      id:        c.joueurId,
      membreId:  (c as any).membreEquipeId ?? c.id,
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
      // FIX : id = MembreEquipeCompetition.id (roster)
      id:        m.id,
      membreId:  m.id,
      nom:       m.nom ?? '',
      prenom:    m.prenom,
      numeroDos: m.numeroDos,
      equipeId,
      equipeNom,
    };
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
    return (!!this.joueurSelectionne() || !!this.joueurManuelNom.trim())
        && this.eventMinute != null && this.eventMinute > 0
        && !!this.eventEquipe()
        && !!this.eventTypeSelect()
        && (!this.isTypeRemplacement() || !!this.joueurSortantSelectionne());
  }

  // ── Soumettre événement ───────────────────────────────────
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
      type:             this.eventTypeSelect(),
      equipeId:         equipe?.id,
      equipeNom:        equipe?.nomEquipe,
      minute:           this.eventMinute!,
      minuteAdditionnel: this.eventMinuteAdd ?? undefined,
      // FIX : joueurId = MembreEquipeCompetition.id (id du roster)
      // pour les externes aussi (pas Membre.id)
      joueurId:         sel?.membreId,   // ← membreId = MembreEquipeCompetition.id
      joueurNom:        sel?.nom ?? this.joueurManuelNom,
      joueurPrenom:     sel?.prenom,
      // FIX : passeurId = MembreEquipeCompetition.id
      passeurId:        passeur?.membreId, // ← membreId
      passeurNom:       passeur
        ? `${passeur.prenom ?? ''} ${passeur.nom}`.trim()
        : undefined,
      joueurSortantId:  sortant?.membreId, // ← membreId
      joueurSortantNom: sortant
        ? `${sortant.prenom ?? ''} ${sortant.nom}`.trim()
        : undefined,
    };

    console.log(dto)

    this.api.ajouterEvenement(this.competitionId, this.matchId, dto)
      .subscribe({
        next: () => {
          this.reload();          // recharger le match pour score + timeline
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

  // ── Statuts ───────────────────────────────────────────────
  setTab(t: MatchTab): void { this.activeTab.set(t); }

  isTermine(): boolean {
    return [StatutMatch.TERMINE, StatutMatch.FORFAIT_DOMICILE,
            StatutMatch.FORFAIT_EXTERIEUR, StatutMatch.FORFAIT_DOUBLE]
      .includes(this.match()?.statut as StatutMatch);
  }

  isEnCours(): boolean { return this.match()?.statut === StatutMatch.EN_COURS; }
  isPlanifie(): boolean { return this.match()?.statut === StatutMatch.PLANIFIE; }
  showScore(): boolean { return this.isTermine() || this.isEnCours(); }

  // FIX : canEdit seulement EN_COURS
  canEdit(): boolean { return this.isEnCours(); }

  // FIX : saisie score possible seulement EN_COURS
  canSaisirScore(): boolean { return this.isEnCours(); }

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

    // FIX : chercher les événements dans plusieurs champs possibles
    const events: any[] = (m as any).evenements
                       ?? (m as any).events
                       ?? (m as any).matchEvents
                       ?? [];
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

  // ── Score ─────────────────────────────────────────────────
  saisirScore(): void {
    if (this.scoreForm.invalid || !this.canSaisirScore()) return;
    this.savingScore.set(true);
    const v = this.scoreForm.value;
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
    if (!this.isPlanifie()) return;
    this.api.demarrerMatch(this.competitionId, this.matchId).subscribe({
      next: m => { this.match.set(m); this.activeTab.set('evenements'); }
    });
  }

  // ── Composition ───────────────────────────────────────────
  // FIX : recharger depuis le serveur avant d'ouvrir l'édition
  toggleCompoEdit(): void {
    if (!this.compoEditMode()) {
      this.api.getById(this.competitionId, this.matchId).subscribe(m => {
        this.match.set(m);
        const toSaisie = (compo: MatchCompositionDTO[] | undefined,
                          equipeId?: number) =>
          (compo ?? [])
            .filter(c => c.joueurNom)
            .map(c => ({
              membreId:  c.id ?? 0,
              nom:       c.joueurNom ?? '',
              prenom:    c.joueurPrenom,
              numeroDos: c.numeroDos,
              poste:     c.poste ? String(c.poste) : undefined,
              titulaire: c.statut !== 'REMPLACANT',
              equipeId
            }));

        const domicile  = toSaisie(m.compositionDomicile,  m.domicile?.id);
        const exterieur = toSaisie(m.compositionExterieur, m.exterieur?.id);

        if (!domicile.length && m.domicile?.id) {
          this.membreApi.getJoueurs(this.competitionId, m.domicile.id)
            .subscribe(membres => {
              this.compoSaisie.update(cs => ({
                ...cs,
                domicile: membres.map(mb => ({
                  membreId: mb.id, nom: mb.nom ?? '', prenom: mb.prenom,
                  numeroDos: mb.numeroDos, titulaire: true, equipeId: m.domicile?.id
                }))
              }));
            });
        } else {
          this.compoSaisie.update(cs => ({ ...cs, domicile }));
        }

        if (!exterieur.length && m.exterieur?.id) {
          this.membreApi.getJoueurs(this.competitionId, m.exterieur.id)
            .subscribe(membres => {
              this.compoSaisie.update(cs => ({
                ...cs,
                exterieur: membres.map(mb => ({
                  membreId: mb.id, nom: mb.nom ?? '', prenom: mb.prenom,
                  numeroDos: mb.numeroDos, titulaire: true, equipeId: m.exterieur?.id
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
    this.compoSaisie.update(cs => ({
      ...cs,
      [side]: cs[side].map(j =>
        j.membreId === membreId ? { ...j, titulaire: !j.titulaire } : j
      )
    }));
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
        statut:      j.titulaire ? 'TITULAIRE' : 'REMPLACANT'
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
    if (p.includes('gardien'))                                   return 'GARDIEN';
    if (p.includes('défenseur') || p.includes('defenseur'))     return 'DEFENSEUR';
    if (p.includes('milieu'))                                    return 'MILIEU';
    if (p.includes('attaquant') || p.includes('ailier'))        return 'ATTAQUANT';
    return poste.toUpperCase();
  }

  // ── Autres actions ────────────────────────────────────────
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