// match-detail.component.ts — version complète mise à jour

import {
  Component, OnInit, inject, signal, computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import {
  ReactiveFormsModule, FormsModule,
  FormBuilder, Validators, FormGroup
} from '@angular/forms';
import { Cote, MatchDetailDTO, TypeEvent, PosteJoueur, StatutComposition, MatchCompositionDTO, MembreEquipeDTO, MatchEventDTO, StatutMatch } from '../../../../core/models/competition.models';
import { MatchApiService } from '../../../../core/services/competition/match-api.service';
import { MembreEquipeApiService } from '../../../../core/services/competition/membre-equipe-api.service';


// Structure interne pour le picker de joueur
interface JoueurOption {
  id?: number;          // joueurId (my2-0)
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
  templateUrl:'./match-detail.component.html',
  styleUrls: ['./match-detail.component.scss']
})
export class MatchDetailComponent implements OnInit {

  Cote = Cote;

  private route      = inject(ActivatedRoute);
  private api        = inject(MatchApiService);
  private membreApi  = inject(MembreEquipeApiService);
  private fb         = inject(FormBuilder);

  // ── State match
  match          = signal<MatchDetailDTO | null>(null);
  activeTab      = signal<MatchTab>('apercu');
  savingEvent    = signal(false);
  savingScore    = signal(false);
  showEventForm  = signal(false);

  // ── State formulaire événement
  eventTypeSelect   = signal<TypeEvent>(TypeEvent.BUT);
  eventEquipe       = signal<'domicile' | 'exterieur' | null>(null);
  eventMinute: number | null = null;
  eventMinuteAdd: number | null = null;

  // Joueur principal
  joueurSearch       = '';
  joueurManuelNom    = '';
  joueurSelectionne  = signal<JoueurOption | null>(null);

  // Passeur
  passeurSearch       = '';
  passeurSelectionne  = signal<JoueurOption | null>(null);

  // Joueur sortant (remplacement)
  joueurSortantSelectionne = signal<JoueurOption | null>(null);

  // ── Listes joueurs (depuis composition)
  private joueursDomicileCompo: JoueurOption[] = [];
  private joueursExterieurCompo: JoueurOption[] = [];

  // ── Formulaires
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

  // ── Config
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

  // ── Computed : joueurs disponibles selon équipe + minute
  joueursDisponibles = computed(() => {
    const equipe = this.eventEquipe();
    if (!equipe) return [];
    const liste = equipe === 'domicile'
      ? this.joueursDomicileCompo
      : this.joueursExterieurCompo;

    const minute = this.eventMinute ?? 0;

    // Filtrer selon présence à la minute
    return liste.filter(j => {
      const compo = this.getCompoJoueur(j.membreId, equipe);
      if (!compo) return true; // pas de compo → on inclut tout
      return this.etaitSurLeTerrain(compo, minute);
    });
  });

  joueursFiltres = computed(() => {
    const q = this.joueurSearch.toLowerCase().trim();
    if (!q) return this.joueursDisponibles();
    return this.joueursDisponibles().filter(j =>
      j.nom.toLowerCase().includes(q) ||
      j.prenom?.toLowerCase().includes(q) ||
      String(j.numeroDos ?? '').includes(q)
    );
  });

  // Passeurs = même équipe, excluant le buteur
  passeursDisponibles = computed(() => {
    const liste = this.joueursDisponibles();
    const sel   = this.joueurSelectionne();
    return liste.filter(j => j.membreId !== sel?.membreId);
  });

  passeursFiltres = computed(() => {
    const q = this.passeurSearch.toLowerCase().trim();
    if (!q) return this.passeursDisponibles();
    return this.passeursDisponibles().filter(j =>
      j.nom.toLowerCase().includes(q) ||
      j.prenom?.toLowerCase().includes(q)
    );
  });

  // Joueurs sortants = titulaires en jeu (pour remplacement)
  joueursSortants = computed(() => {
    const equipe = this.eventEquipe();
    if (!equipe) return [];
    const liste = equipe === 'domicile'
      ? this.joueursDomicileCompo
      : this.joueursExterieurCompo;
    const minute = this.eventMinute ?? 0;
    // Seulement les titulaires encore sur le terrain
    return liste.filter(j => {
      const compo = this.getCompoJoueur(j.membreId, equipe);
      if (!compo) return false;
      return compo.statut === StatutComposition.TITULAIRE
          && this.etaitSurLeTerrain(compo, minute);
    });
  });

  // ── Getters
  get competitionId(): number {
    return Number(this.route.snapshot.paramMap.get('competitionId'));
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

      // Pré-remplir score
      if (m.butsDomicile != null) {
        this.scoreForm.patchValue({
          butsDomicile:  m.butsDomicile,
          butsExterieur: m.butsExterieur,
        });
      }
      // Pré-remplir temps
      this.tempsForm.patchValue({
        heureEffectiveDebut:   m.heureEffectiveDebut?.slice(0, 16) ?? '',
        heureEffectiveMiTemps: m.heureEffectiveMiTemps?.slice(0, 16) ?? '',
        heureEffectiveReprise: m.heureEffectiveReprise?.slice(0, 16) ?? '',
        heureEffectiveFin:     m.heureEffectiveFin?.slice(0, 16) ?? '',
        tempsAdditionnel1:     m.tempsAdditionnel1,
        tempsAdditionnel2:     m.tempsAdditionnel2,
        tempsAdditionnelP1:    m.tempsAdditionnelP1,
        tempsAdditionnelP2:    m.tempsAdditionnelP2,
        conditions:            m.conditions ?? '',
      });
    });
  }

  // ── Construction des listes depuis la composition
  private buildJoueursListes(m: MatchDetailDTO): void {
    this.joueursDomicileCompo = this.compoToOptions(
      m.compositionDomicile, m.domicile?.id, m.domicile?.nomEquipe);
    this.joueursExterieurCompo = this.compoToOptions(
      m.compositionExterieur, m.exterieur?.id, m.exterieur?.nomEquipe);

    // Si composition vide → charger depuis l'API membres
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
      id:         c.joueurId,
      membreId:   c.id, // id de la composition comme identifiant
      nom:        c.joueurNom,
      prenom:     c.joueurPrenom,
      numeroDos:  c.numeroDos,
      equipeId,
      equipeNom,
    }));
  }

  private membreToOption(
      m: MembreEquipeDTO,
      equipeId: number,
      equipeNom?: string): JoueurOption {
    return {
      id:        m.joueurId,
      membreId:  m.id,
      nom:       m.nom,
      prenom:    m.prenom,
      numeroDos: m.numeroDos,
      equipeId,
      equipeNom,
    };
  }

  // ── Vérifier présence sur le terrain à une minute donnée
  private etaitSurLeTerrain(
      compo: MatchCompositionDTO,
      minute: number): boolean {
    if (compo.statut === StatutComposition.TITULAIRE) {
      return compo.minuteSortie == null || compo.minuteSortie > minute;
    }
    if (compo.statut === StatutComposition.REMPLACANT) {
      return compo.minuteEntree != null
          && compo.minuteEntree <= minute
          && (compo.minuteSortie == null || compo.minuteSortie > minute);
    }
    return false;
  }

  private getCompoJoueur(
      membreId: number | undefined,
      equipe: 'domicile' | 'exterieur'): MatchCompositionDTO | undefined {
    if (!membreId) return undefined;
    const compo = equipe === 'domicile'
      ? this.match()?.compositionDomicile
      : this.match()?.compositionExterieur;
    // Cherche par id de compo
    return compo?.find(c => c.id === membreId);
  }

  // ── Handlers formulaire
  onTypeChange(type: TypeEvent): void {
    this.eventTypeSelect.set(type);
    this.joueurSelectionne.set(null);
    this.passeurSelectionne.set(null);
    this.joueurSortantSelectionne.set(null);
    this.joueurSearch  = '';
    this.passeurSearch = '';
  }

  onEquipeChange(equipe: 'domicile' | 'exterieur'): void {
    this.eventEquipe.set(equipe);
    this.joueurSelectionne.set(null);
    this.passeurSelectionne.set(null);
    this.joueurSortantSelectionne.set(null);
    this.joueurSearch  = '';
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

  // ── Helpers type
  isTypeBut(): boolean {
    return [
      TypeEvent.BUT,
      TypeEvent.PENALTY_MARQUE,
      TypeEvent.CONTRE_SON_CAMP
    ].includes(this.eventTypeSelect());
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
    const hasJoueur = !!this.joueurSelectionne()
                   || !!this.joueurManuelNom.trim();
    const hasMinute = this.eventMinute != null && this.eventMinute > 0;
    const hasEquipe = !!this.eventEquipe();
    const hasType   = !!this.eventTypeSelect();
    const hasSortant = !this.isTypeRemplacement()
                    || !!this.joueurSortantSelectionne();
    return hasJoueur && hasMinute && hasEquipe && hasType && hasSortant;
  }

  // ── Soumettre événement
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
      // Joueur principal
      joueurId:  sel?.id,
      joueurNom: sel?.nom ?? this.joueurManuelNom,
      joueurPrenom: sel?.prenom,
      // Passeur
      passeurId:  passeur?.id,
      passeurNom: passeur ? `${passeur.prenom ?? ''} ${passeur.nom}`.trim() : undefined,
      // Joueur sortant
      joueurSortantId:  sortant?.id,
      joueurSortantNom: sortant
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

  // ── Helpers inchangés
  setTab(t: MatchTab): void { this.activeTab.set(t); }

  isTermine(): boolean {
    return [StatutMatch.TERMINE, StatutMatch.FORFAIT_DOMICILE,
            StatutMatch.FORFAIT_EXTERIEUR, StatutMatch.FORFAIT_DOUBLE]
      .includes(this.match()!.statut);
  }

  canEdit(): boolean {
    return ![StatutMatch.TERMINE, StatutMatch.ANNULE]
      .includes(this.match()!.statut);
  }

  isWinner(side: 'home' | 'away'): boolean {
    if (!this.isTermine()) return false;
    const m = this.match()!;
    if (m.tabDomicile != null) {
      return side === 'home'
        ? m.tabDomicile! > m.tabExterieur!
        : m.tabExterieur! > m.tabDomicile!;
    }
    return side === 'home'
      ? this.totalDom() > this.totalExt()
      : this.totalExt() > this.totalDom();
  }

  totalDom(): number {
    const m = this.match()!;
    return (m.butsDomicile ?? 0) + (m.butsDomicileProlong ?? 0);
  }

  totalExt(): number {
    const m = this.match()!;
    return (m.butsExterieur ?? 0) + (m.butsExterieurProlong ?? 0);
  }

  sortedEvents(): MatchEventDTO[] {
    return [...(this.match()?.evenements ?? [])]
      .sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0));
  }

  isExterieurEvent(e: MatchEventDTO): boolean {
    return e.equipeId === this.match()?.exterieur?.id;
  }

  getCompo(side: string): MatchCompositionDTO[] {
    return side === 'domicile'
      ? (this.match()?.compositionDomicile ?? [])
      : (this.match()?.compositionExterieur ?? []);
  }

  getByPoste(compo: MatchCompositionDTO[],
             poste: PosteJoueur): MatchCompositionDTO[] {
    return compo.filter(p => p.poste === poste);
  }

  eventIcon(type: TypeEvent): string {
    const icons: Partial<Record<TypeEvent, string>> = {
      [TypeEvent.BUT]:                       '⚽',
      [TypeEvent.PENALTY_MARQUE]:            '⚽',
      [TypeEvent.PENALTY_RATE]:              '❌',
      [TypeEvent.CONTRE_SON_CAMP]:           '⚽',
      [TypeEvent.CARTON_JAUNE]:              '🟨',
      [TypeEvent.CARTON_ROUGE]:              '🟥',
      [TypeEvent.CARTON_ROUGE_DOUBLE_JAUNE]: '🟥',
      [TypeEvent.REMPLACEMENT]:              '🔄',
      [TypeEvent.BUT_ANNULE]:                '❌',
    };
    return icons[type] ?? '•';
  }

  statutLabel(): string {
    const labels: Record<StatutMatch, string> = {
      [StatutMatch.PLANIFIE]:          'À venir',
      [StatutMatch.EN_COURS]:          'En cours',
      [StatutMatch.TERMINE]:           'Terminé',
      [StatutMatch.REPORTE]:           'Reporté',
      [StatutMatch.FORFAIT_DOMICILE]:  'Forfait domicile',
      [StatutMatch.FORFAIT_EXTERIEUR]: 'Forfait extérieur',
      [StatutMatch.FORFAIT_DOUBLE]:    'Double forfait',
      [StatutMatch.ANNULE]:            'Annulé',
    };
    return labels[this.match()!.statut] ?? this.match()!.statut;
  }

  getInitials(name?: string): string {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  }

  goBack(): void { history.back(); }

  saisirScore(): void {
    if (this.scoreForm.invalid) return;
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

  declarerForfait(equipe: Cote): void {
    this.api.declarerForfait(this.competitionId, this.matchId,
      { equipeForfait: equipe })
      .subscribe(m => this.match.set(m));
  }

  reporter(): void {
    if (!this.nouvelleDateHeure) return;
    this.api.reporter(this.competitionId, this.matchId,
      { nouvelleDate: this.nouvelleDateHeure })
      .subscribe(m => this.match.set(m));
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
      tempsAdditionnelP1:    v.tempsAdditionnelP1 ?? undefined,
      tempsAdditionnelP2:    v.tempsAdditionnelP2 ?? undefined,
      conditions:            v.conditions || undefined,
    }).subscribe(m => this.match.set(m));
  }
}