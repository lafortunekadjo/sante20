import {
  Component, OnInit, inject, signal, computed
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CompetitionApiService } from '../../../../core/services/competition/competition-api.service';

interface MatchPublicDTO {
  id:                    number;
  domicileNom?:          string;
  domicileLogo?:         string;
  exterieurNom?:         string;
  exterieurLogo?:        string;
  butsDomicile?:         number;
  butsExterieur?:        number;
  butsDomicileProlong?:  number;
  butsExterieurProlong?: number;
  tabDomicile?:          number;
  tabExterieur?:         number;
  statut?:               string;
  dateHeure?:            string;
  stadeNom?:             string;
  tourLabel?:            string;
  journeeNom?:           string;
  pouleNom?:             string;
}

interface ClassementPublicDTO {
  position:    number;
  nomEquipe:   string;
  logoUrl?:    string;
  matchsJoues: number;
  victoires:   number;
  nuls:        number;
  defaites:    number;
  butsPour:    number;
  butsContre:  number;
  goalAverage: number;
  points:      number;
  qualifie:    boolean;
}

interface PoulePublicDTO {
  id:          number;
  nom:         string;
  classement:  ClassementPublicDTO[];
  matchs:      MatchPublicDTO[];
}

interface NoeudPublicDTO {
  id:              number;
  position:        number;
  tour?:           string;
  typeNoeud:       string;
  participant1Nom?: string;
  participant2Nom?: string;
  vainqueurNom?:   string;
  match?:          MatchPublicDTO;
  bye:             boolean;
}

interface BracketPublicDTO {
  noeuds: NoeudPublicDTO[];
  matchs: MatchPublicDTO[];
}

interface PhasePublicDTO {
  id:      number;
  type:    string;
  nom:     string;
  statut:  string;
  poules?: PoulePublicDTO[];
  bracket?: BracketPublicDTO;
}

interface CompetitionPublicDTO {
  id:                 number;
  nom:                string;
  description?:       string;
  logoUrl?:           string;
  statut:             string;
  organisateurNom?:   string;
  dateDebut?:         string;
  dateFin?:           string;
  nombreParticipants: number;
  format?:            string;
  phases?:            PhasePublicDTO[];
}

type MainTab = 'apercu' | 'classement' | 'resultats' | 'palmares';
type FiltreMatch = 'tous' | 'a_venir' | 'en_cours' | 'termines';

@Component({
  selector:    'app-competition-publique',
  standalone:  true,
  imports:     [CommonModule, RouterModule, DatePipe],
  templateUrl: './competition-publique.component.html',
  styleUrls:   ['./competition-publique.component.scss']
})
export class CompetitionPubliqueComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private api   = inject(CompetitionApiService);

  competition  = signal<CompetitionPublicDTO | null>(null);
  stats        = signal<any>(null);
  loading      = signal(true);

  // Tabs principal
  activeTab    = signal<MainTab>('apercu');

  // Classement — phase + poule sélectionnée
  phaseSelectId  = signal<number | null>(null);
  pouleSelectId  = signal<number | null>(null);

  // Résultats — filtre
  filtreMatch    = signal<FiltreMatch>('tous');
  phaseMatchId   = signal<number | null>(null); // filtre par phase

  get competitionId(): number {
    return Number(this.route.snapshot.paramMap.get('id'));
  }

  ngOnInit(): void {
    this.api.getPublic(this.competitionId).subscribe({
      next: c => {
        this.competition.set(c);
        this.loading.set(false);
        // Sélectionner la phase active par défaut
        this.initSelections(c);
        // Stats en parallèle
        this.api.getPublicStats(this.competitionId).subscribe({
          next: s => this.stats.set(s),
          error: () => {}
        });
      },
      error: () => this.loading.set(false)
    });
  }

  private initSelections(c: CompetitionPublicDTO): void {
    if (!c.phases?.length) return;
    // Sélectionner la phase EN_COURS, sinon la dernière
    const active = c.phases.find(p => p.statut === 'EN_COURS')
                ?? c.phases[c.phases.length - 1];
    this.phaseSelectId.set(active.id);
    this.phaseMatchId.set(active.id);
    // Sélectionner la première poule si phase groupe
    if (active.poules?.length)
      this.pouleSelectId.set(active.poules[0].id);
  }

  // ── Phase sélectionnée ────────────────────────────────────
  phaseSelectionnee = computed(() => {
    const id = this.phaseSelectId();
    return this.competition()?.phases?.find(p => p.id === id) ?? null;
  });

  pouleSelectionnee = computed(() => {
    const phase = this.phaseSelectionnee();
    const id    = this.pouleSelectId();
    return phase?.poules?.find(p => p.id === id) ?? phase?.poules?.[0] ?? null;
  });

  // ── Tous les matchs filtrés ───────────────────────────────
  tousMatchs = computed((): MatchPublicDTO[] => {
    const c = this.competition();
    if (!c?.phases) return [];

    let matchs: MatchPublicDTO[] = [];

    const phaseId = this.phaseMatchId();
    const phases  = phaseId
      ? c.phases.filter(p => p.id === phaseId)
      : c.phases;

    for (const phase of phases) {
      if (phase.poules) {
        for (const poule of phase.poules) {
          matchs.push(...(poule.matchs ?? []));
        }
      }
      if (phase.bracket?.matchs) {
        matchs.push(...phase.bracket.matchs);
      }
    }

    // Appliquer filtre statut
    const filtre = this.filtreMatch();
    if (filtre === 'a_venir')
      matchs = matchs.filter(m => m.statut === 'PLANIFIE' || m.statut === 'REPORTE');
    else if (filtre === 'en_cours')
      matchs = matchs.filter(m => m.statut === 'EN_COURS');
    else if (filtre === 'termines')
      matchs = matchs.filter(m => m.statut === 'TERMINE'
        || m.statut?.startsWith('FORFAIT'));

    // Trier par date
    return matchs.sort((a, b) => {
      if (!a.dateHeure) return 1;
      if (!b.dateHeure) return -1;
      return new Date(a.dateHeure).getTime() - new Date(b.dateHeure).getTime();
    });
  });

  // Matchs groupés par journée/tour
  matchsGroupes = computed(() => {
    const matchs = this.tousMatchs();
    const map    = new Map<string, MatchPublicDTO[]>();

    for (const m of matchs) {
      const key = m.tourLabel ?? m.journeeNom ?? m.pouleNom ?? 'Matchs';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return map;
  });

  matchsGroupesKeys = computed(() => [...this.matchsGroupes().keys()]);

  // Computed pour éviter les arrow fn dans le template (NG5002)
  prochainMatchs = computed(() =>
    this.tousMatchs().filter(m => this.isAVenir(m.statut)).slice(0, 3));

  hasProchainMatchs = computed(() =>
    this.tousMatchs().some(m => this.isAVenir(m.statut)));

  matchsTermines = computed(() =>
    this.tousMatchs().filter(m => this.isTermine(m.statut)));

  // ── Noeuds du bracket par tour ────────────────────────────
  toursOrdreBracket = [
    'TOUR_PRELIMINAIRE','SEIZIEME','HUITIEME',
    'QUART_DE_FINALE','DEMI_FINALE','FINALE','TROISIEME_PLACE'
  ];

  bracketParTour = computed(() => {
    const phase = this.phaseSelectionnee();
    if (!phase?.bracket?.noeuds) return new Map<string, NoeudPublicDTO[]>();

    const map = new Map<string, NoeudPublicDTO[]>();
    for (const n of phase.bracket.noeuds) {
      if (n.bye) continue; // masquer les BYE
      const key = n.tour ?? 'Matchs';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(n);
    }
    // Trier chaque tour par position
    map.forEach(v => v.sort((a, b) => a.position - b.position));
    return map;
  });

  bracketTours = computed(() =>
    this.toursOrdreBracket.filter(t => this.bracketParTour().has(t)));

  tourLabel(tour: string): string {
    const m: Record<string, string> = {
      TOUR_PRELIMINAIRE: 'Tours préliminaires',
      SEIZIEME:          '32es de finale',
      HUITIEME:          '16es de finale',
      QUART_DE_FINALE:   'Quarts de finale',
      DEMI_FINALE:       'Demi-finales',
      TROISIEME_PLACE:   'Match pour la 3e place',
      FINALE:            'Finale'
    };
    return m[tour] ?? tour;
  }

  // ── Helpers ───────────────────────────────────────────────
  statutLabel(statut: string): string {
    const m: Record<string, string> = {
      BROUILLON:           'À venir',
      INSCRIPTION_OUVERTE: 'Inscriptions ouvertes',
      EN_COURS:            'En cours',
      TERMINE:             'Terminée',
      ANNULE:              'Annulée',
    };
    return m[statut] ?? statut;
  }

  formatLabel(format: string): string {
    const m: Record<string, string> = {
      ALLER_SIMPLE:       'Championnat',
      ALLER_RETOUR:       'Championnat A/R',
      ELIMINATION_SIMPLE: 'Coupe',
      MIXTE:              'Groupes + Élimination',
    };
    return m[format] ?? format;
  }

  phaseLabel(p: PhasePublicDTO): string {
    if (p.type === 'GROUPE') return 'Phase de groupes';
    if (p.type === 'ELIMINATOIRE') return 'Phase finale';
    return p.nom;
  }

  isTermine(statut?: string): boolean {
    return statut === 'TERMINE' || statut?.startsWith('FORFAIT') || false;
  }

  isEnCours(statut?: string): boolean { return statut === 'EN_COURS'; }
  isAVenir(statut?: string): boolean  { return statut === 'PLANIFIE' || statut === 'REPORTE'; }

  scoreStr(m: MatchPublicDTO): string {
    if (this.isTermine(m.statut) || this.isEnCours(m.statut))
      return `${m.butsDomicile ?? 0} – ${m.butsExterieur ?? 0}`;
    if (m.dateHeure)
      return new Date(m.dateHeure).toLocaleTimeString('fr-FR',
        { hour: '2-digit', minute: '2-digit' });
    return 'vs';
  }

  getInitials(name?: string): string {
    return (name ?? '').split(' ').map(w => w[0])
      .join('').substring(0, 2).toUpperCase();
  }

  // Score complet avec AP / TAB
  scoreLabel(m: MatchPublicDTO): string {
    if (!this.isTermine(m.statut) && !this.isEnCours(m.statut)) return 'vs';
    const dom = (m.butsDomicile ?? 0);
    const ext = (m.butsExterieur ?? 0);
    return `${dom} – ${ext}`;
  }

  hasExtra(m: MatchPublicDTO): boolean {
    return (m.butsDomicileProlong !== null && m.butsDomicileProlong !== undefined)
        || (m.tabDomicile         !== null && m.tabDomicile         !== undefined);
  }

  extraLabel(m: MatchPublicDTO): string {
    if (m.tabDomicile !== null && m.tabDomicile !== undefined)
      return `TAB ${m.tabDomicile}–${m.tabExterieur}`;
    if (m.butsDomicileProlong !== null && m.butsDomicileProlong !== undefined)
      return 'Après prolongation';
    return '';
  }

  selectPhaseClassement(p: PhasePublicDTO): void {
    this.phaseSelectId.set(p.id);
    if (p.poules?.length) this.pouleSelectId.set(p.poules[0].id);
  }
}