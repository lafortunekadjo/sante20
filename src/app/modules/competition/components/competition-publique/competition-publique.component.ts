import { t } from '../../../../core/i18n/traduire';
import {
  Component, OnInit, inject, signal, computed
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PubliciteFeedComponent } from '../../../publicite/publicite-feed/publicite-feed.component';
import { CompetitionApiService } from '../../../../core/services/competition/competition-api.service';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../../core/services/auth.service';
import { InscriptionModalComponent } from '../inscription-modal/inscription-modal.component';
import { PalmaresBannerComponent } from '../palmares-banner/palmares-banner.component';
import { InscriptionRapideComponent } from '../inscription-rapide/inscription-rapide.component';


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
  recompenses?: RecompensePublicDTO[];
  championNom?:       string;
  finalisteNom?:      string;
  troisiemeNom?:      string;
  // Conditions d'inscription
  dateLimiteInscription?: string;
  montantEngagement?:     number;
  licencesActivees?:      boolean;
  licencesGratuites?:     number;
  montantLicenceSup?:     number;
  nombreEquipesMax?:      number;
  placesRestantes?:       number | null;
  effectifMin?:           number | null;
  dateLimiteEffectif?:    string | null;
}

// Nouvelle interface à ajouter
interface RecompensePublicDTO {
  rang:           number;
  label?:         string;
  typeRecompense: 'MONETAIRE' | 'TROPHEE' | 'MEDAILLE' | 'COUPE' | 'AUTRE';
  montant?:       number;
  devise:         string;
  description?:   string;
  materiau?:      string | null;
  quantite?:      number | null;
  cible?:         string;
}

type MainTab = 'apercu' | 'classement' | 'resultats' | 'palmares';
type FiltreMatch = 'tous' | 'a_venir' | 'en_cours' | 'termines';

@Component({
  selector:    'app-competition-publique',
  standalone:  true,
  imports:     [CommonModule, RouterModule, DatePipe,MatIconModule, TranslateModule, InscriptionModalComponent, PalmaresBannerComponent, InscriptionRapideComponent, PubliciteFeedComponent],
  templateUrl: './competition-publique.component.html',
  styleUrls:   ['./competition-publique.component.scss']
})
export class CompetitionPubliqueComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private api   = inject(CompetitionApiService);

  competition  = signal<CompetitionPublicDTO | null>(null);
  stats        = signal<any>(null);
  recompensesPub = signal<any[]>([]);

  /** Récompenses regroupées : un bloc par rang (plusieurs lots possibles), puis les prix individuels. */
  groupesRecompenses = computed(() => {
    const liste = this.recompensesPub();
    const equipe = liste.filter(r => !r.cible || r.cible === 'EQUIPE');
    const rangs = [...new Set(equipe.map(r => r.rang))].sort((a, b) => a - b);
    const ind = { BUTEUR: 'Meilleur buteur', PASSEUR: 'Meilleur passeur', GARDIEN: 'Meilleur gardien', DEFENSEUR: t('ui.ts_meilleur_defenseur_a667'), MVP: t('ui.ts_meilleur_joueur_83d4'), FAIR_PLAY: 'Fair-play' } as Record<string, string>;
    return [
      ...rangs.map(rang => {
        const lots = equipe.filter(r => r.rang === rang);
        const medaille = rang === 1 ? '🥇' : rang === 2 ? '🥈' : rang === 3 ? '🥉' : '🏅';
        return { titre: lots[0]?.label || `${rang}e place`, icone: medaille, lots: lots.map(l => this.libelleLot(l)) };
      }),
      ...liste.filter(r => r.cible && r.cible !== 'EQUIPE').map(r => ({ titre: r.cible === 'AUTRE_PRIX' ? (r.label || 'Distinction') : (ind[r.cible] ?? r.cible), icone: '⭐', lots: [this.libelleLot(r)] }))
    ];
  });

  libelleLot(r: any): string {
    const type = (r.typeRecompense as string) ?? 'AUTRE';
    const nom = t('reward.lot.' + (['MONETAIRE', 'TROPHEE', 'MEDAILLE', 'COUPE'].includes(type) ? type : 'AUTRE'));
    const mat = r.materiau && ['OR', 'ARGENT', 'BRONZE'].includes(r.materiau) ? t('reward.materiau.' + r.materiau) : '';
    const icone = type === 'MONETAIRE' ? '💰' : type === 'MEDAILLE' ? '🏅' : (type === 'COUPE' || type === 'TROPHEE') ? '🏆' : '🎁';
    let texte = `${icone} ${r.quantite > 1 ? r.quantite + ' × ' : ''}${nom}${mat}`;
    if (type === 'MONETAIRE' && r.montant) texte += ` : ${Number(r.montant).toLocaleString()} ${r.devise ?? 'FCFA'}`;
    if (r.description) texte += ` — ${r.description}`;
    return texte;
  }
  loading      = signal(true);

  // Tabs principal
  activeTab    = signal<MainTab>('apercu');

  // Classement — phase + poule sélectionnée
  phaseSelectId  = signal<number | null>(null);
  pouleSelectId  = signal<number | null>(null);

  // Résultats — filtre
  filtreMatch    = signal<FiltreMatch>('tous');
  phaseMatchId   = signal<number | null>(null); // filtre par phase

  private auth   = inject(AuthService);
private router = inject(Router);

showInscriptionModal = signal(false);
  showConnexion = signal(false);
  showRapide = signal(false);      // inscription sans compte

  /** Équipe déjà inscrite depuis cet appareil (lien de gestion mémorisé) : on propose d'y revenir. */
  monEquipe = signal<{ nomEquipe: string; token: string } | null>(null);
  /** Toutes les équipes inscrites depuis cet appareil pour cette compétition (une personne peut en avoir plusieurs). */
  mesEquipesLiens = signal<{ nomEquipe: string; token: string }[]>([]);

  ouvrirRapide(): void {
    this.showConnexion.set(false);
    this.showRapide.set(true);
  }

  chargerMonEquipe(): void {
    try {
      const liste = JSON.parse(localStorage.getItem('equipes_liens') ?? '[]') as
        { competitionId: number; nomEquipe: string; token: string }[];
      const miennes = liste.filter(x => x.competitionId === this.competitionId);
      const uniques = [...new Map(miennes.map(x => [x.token, { nomEquipe: x.nomEquipe, token: x.token }])).values()];
      this.mesEquipesLiens.set(uniques);
      const e = [...miennes].reverse()[0];
      this.monEquipe.set(e ? { nomEquipe: e.nomEquipe, token: e.token } : null);
    } catch { this.monEquipe.set(null); }
  }   // fenêtre « un compte est nécessaire » (au lieu d'une redirection brutale)

  get competitionId(): number {
    return Number(this.route.snapshot.paramMap.get('id'));
  }

  ngOnInit(): void {
    this.chargerMonEquipe();
    this.api.getPublic(this.competitionId).subscribe({
      next: c => {
        this.competition.set(c);
        this.loading.set(false);
        // Retour de connexion/création de compte depuis « Inscrire mon équipe » : on rouvre le formulaire
        if (this.route.snapshot.queryParamMap.get('inscrire') === '1' && this.auth.isLoggedIn()
            && c.statut === 'INSCRIPTION_OUVERTE') {
          this.showInscriptionModal.set(true);
        }
        // Sélectionner la phase active par défaut
        this.initSelections(c);
        this.api.getRecompenses(this.competitionId).subscribe({ next: r => this.recompensesPub.set(r ?? []), error: () => {} });
        // Stats en parallèle
        this.api.getPublicStats(this.competitionId).subscribe({
          next: s => this.stats.set(s),
          error: () => {}
        });
      },
      error: () => this.loading.set(false)
    });
  }

 // Dans ouvrirInscription()
ouvrirInscription(event?: Event): void {
 

  if (!this.auth.isLoggedIn()) {
    // On montre d'abord les conditions et pourquoi un compte est utile, sans brusquer
    this.showConnexion.set(true);
    return;
  }
  this.showInscriptionModal.set(true);
}

  /** Connexion ou création de compte, puis retour ici avec le formulaire d'inscription ouvert. */
  allerAuthentification(destination: 'login' | 'signup'): void {
    this.showConnexion.set(false);
    this.router.navigate(['/' + destination], {
      queryParams: { returnUrl: `/competitions/${this.competitionId}/public?inscrire=1` }
    });
  }

  // ── Conditions d'inscription ──────────────────────────────
  inscriptionOuverte = computed(() => this.competition()?.statut === 'INSCRIPTION_OUVERTE');

  /** Jours avant la clôture des inscriptions ; null sans date limite. */
  joursAvantCloture = computed(() => {
    const d = this.competition()?.dateLimiteInscription;
    if (!d) return null;
    const fin = new Date(d + 'T23:59:59');
    return Math.ceil((fin.getTime() - Date.now()) / 86400000) - 1;
  });

  complet = computed(() => this.competition()?.placesRestantes === 0);
  clotureDepassee = computed(() => {
    const j = this.joursAvantCloture();
    return j !== null && j < 0;
  });
  inscriptionPossible = computed(() => this.inscriptionOuverte() && !this.complet() && !this.clotureDepassee());

  /** Utilisateur connecté : la barre de navigation du bas est visible, la barre d'inscription se place au-dessus. */
  get connecte(): boolean { return this.auth.isLoggedIn(); }

  fcfa(n?: number | null): string {
    return (n ?? 0).toLocaleString('fr-FR') + ' FCFA';
  }

  /** Phrase courte pour la barre d'inscription : le prix en premier. */
  resumeDroits(): string {
    const c = this.competition();
    if (!c) return '';
    return c.montantEngagement ? `Droits : ${this.fcfa(c.montantEngagement)} / équipe` : 'Inscription gratuite';
  }

  clotureTexte(): string {
    const j = this.joursAvantCloture();
    if (j === null) return '';
    if (j < 0) return 'Inscriptions closes';
    if (j === 0) return 'Dernier jour';
    return j === 1 ? 'Clôture demain' : `Clôture dans ${j} jours`;
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
      TOUR_PRELIMINAIRE: t('ui.ts_tours_preliminaires_d07a'),
      SEIZIEME:          '32es de finale',
      HUITIEME:          '16es de finale',
      QUART_DE_FINALE:   'Quarts de finale',
      DEMI_FINALE:       'Demi-finales',
      TROISIEME_PLACE:   t('ui.ts_match_pour_la_3e_place_88e2'),
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
      TERMINE:             t('partenaire.publicites.status.TERMINEE'),
      ANNULE:              t('invitation.cancelled'),
    };
    return m[statut] ?? statut;
  }

  formatLabel(format: string): string {
    const m: Record<string, string> = {
      ALLER_SIMPLE:       'Championnat',
      ALLER_RETOUR:       'Championnat A/R',
      ELIMINATION_SIMPLE: 'Coupe',
      MIXTE:              t('ui.ts_groupes_elimination_1283'),
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