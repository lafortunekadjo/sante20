import {
  Component, Input, Output, EventEmitter,
  inject, signal, computed, OnChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';
import { Router }       from '@angular/router';
import {
  BracketDTO, BracketNoeudDTO, MatchDTO, NomTour
} from '../../../../core/models/competition.models';
import { MatchApiService } from '../../../../core/services/competition/match-api.service';

interface Tour {
  nom:     NomTour | string;
  label:   string;
  noeuds:  BracketNoeudDTO[];
}

@Component({
  selector:    'app-bracket-view',
  standalone:  true,
  imports:     [CommonModule, FormsModule],
  templateUrl: './bracket-view.component.html',
  styleUrls:   ['./bracket-view.component.scss']
})
export class BracketViewComponent implements OnChanges {
  @Input() bracket?:       BracketDTO;
  @Input() competitionId!: number;
  @Input() canEdit =       false;
  @Output() matchClicked = new EventEmitter<MatchDTO>();

  private matchApi = inject(MatchApiService);
  private router   = inject(Router);

  // Edition d'un noeud
  editNoeud           = signal<BracketNoeudDTO | null>(null);
  savingNoeud         = signal(false);
  editParticipant1Id: number | null = null;
  editParticipant2Id: number | null = null;

  // Participants disponibles pour le tirage manuel
  // = tous les participants du bracket (depuis les noeuds)
  participantsDisponibles = computed(() => {
    if (!this.bracket?.noeuds) return [];
    const map = new Map<number, { id: number; nomEquipe: string }>();
    for (const n of this.bracket.noeuds) {
      if (n.participant1?.id) map.set(n.participant1.id,
        { id: n.participant1.id, nomEquipe: n.participant1.nomEquipe ?? '' });
      if (n.participant2?.id) map.set(n.participant2.id,
        { id: n.participant2.id, nomEquipe: n.participant2.nomEquipe ?? '' });
    }
    return [...map.values()]
      .sort((a, b) => a.nomEquipe.localeCompare(b.nomEquipe, 'fr'));
  });

  // Ordre correct : du premier tour → finale
  // Les noeuds sont stockés racine=finale, feuilles=premiers matchs
  // On inverse pour afficher premier tour en premier
  tours = computed<Tour[]>(() => {
    if (!this.bracket?.noeuds?.length) return [];

    // Grouper par tour — fallback si n.tour null
    const total = this.bracket!.noeuds.length;
    const map = new Map<string, BracketNoeudDTO[]>();
    for (const n of this.bracket!.noeuds) {
      // Utiliser n.tour s'il existe, sinon calculer depuis la position
      const key = n.tour ?? this.calculerTourDepuisPosition(n.position, total);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(n);
    }

    // Ordre des tours du plus tôt au plus tard
    const ordre: string[] = [
      'TOUR_PRELIMINAIRE', 'SEIZIEME', 'HUITIEME',
      'QUART_DE_FINALE', 'DEMI_FINALE', 'FINALE'
    ];

    const tours: Tour[] = [];
    for (const key of ordre) {
      if (map.has(key)) {
        tours.push({
          nom:    key as NomTour,
          label:  this.tourLabel(key),
          noeuds: map.get(key)!.sort((a, b) => a.position - b.position)
        });
      }
    }

    // Ajouter les tours non reconnus
    for (const [key, noeuds] of map) {
      if (!ordre.includes(key)) {
        tours.push({ nom: key, label: key, noeuds });
      }
    }

    return tours;
  });

  ngOnChanges(): void {}

  calculerTourDepuisPosition(position: number, _total: number): string {
    // Position 1 = FINALE (racine), positions hautes = premiers tours (feuilles)
    // niveau = floor(log2(position)) : 0→FINALE, 1→DEMI, 2→QF, 3→HUI, 4→16e...
    const niveau = Math.floor(Math.log2(Math.max(position, 1)));
    const tours: Record<number, string> = {
      0: 'FINALE',
      1: 'DEMI_FINALE',
      2: 'QUART_DE_FINALE',
      3: 'HUITIEME',
      4: 'SEIZIEME',
      5: 'TOUR_PRELIMINAIRE',
    };
    return tours[niveau] ?? 'TOUR_PRELIMINAIRE';
  }

tourLabel(tour: string): string {
  const m: Record<string, string> = {
    TOUR_PRELIMINAIRE: 'Tours préliminaires',
    SEIZIEME:          '32es de finale',
    HUITIEME:          '16es de finale',
    QUART_DE_FINALE:   'Quarts de finale',
    DEMI_FINALE:       'Demi-finales',
    TROISIEME_PLACE:   'Match 3e place',  // ← manquant
    FINALE:            'Finale'
  };
  return m[tour] ?? tour;
}

  // ── Clic sur un match du bracket ─────────────────────────
  ouvrirMatch(noeud: BracketNoeudDTO): void {
    const match = noeud.matchAller;
    if (!match) return;
    this.router.navigate([
      '/competitions', this.competitionId, 'matchs', match.id
    ]);
  }

  // ── Edition du noeud (modifier les équipes) ───────────────
  ouvrirEditNoeud(noeud: BracketNoeudDTO): void {
    this.editNoeud.set(noeud);
    this.editParticipant1Id = noeud.participant1?.id ?? null;
    this.editParticipant2Id = noeud.participant2?.id ?? null;
  }

  fermerEdit(): void {
    this.editNoeud.set(null);
  }

  sauvegarderNoeud(): void {
    const n = this.editNoeud();
    if (!n) return;
    if (!this.editParticipant1Id || !this.editParticipant2Id) return;
    if (this.editParticipant1Id === this.editParticipant2Id) {
      alert('Une équipe ne peut pas s"affronter elle-même');
      return;
    }
    this.savingNoeud.set(true);

    this.matchApi.modifierNoeudBracket(
      this.competitionId, n.id, {
        participant1Id: this.editParticipant1Id,
        participant2Id: this.editParticipant2Id
      }
    ).subscribe({
      next: () => {
        this.savingNoeud.set(false);
        this.fermerEdit();
        this.matchClicked.emit(undefined as any);
      },
      error: () => this.savingNoeud.set(false)
    });
  }

  // ── Helpers affichage ─────────────────────────────────────
  getScore(noeud: BracketNoeudDTO): string {
    const m = noeud.matchAller;
    if (!m) return '–';
    if (m.statut === 'TERMINE' || m.statut === 'FORFAIT_DOMICILE'
        || m.statut === 'FORFAIT_EXTERIEUR') {
      return `${m.butsDomicile ?? 0} – ${m.butsExterieur ?? 0}`;
    }
    if (m.statut === 'EN_COURS') return 'En cours';
    if (m.dateHeure) return new Date(m.dateHeure).toLocaleDateString('fr-FR');
    return 'À planifier';
  }

  statutClass(noeud: BracketNoeudDTO): string {
    const s = noeud.matchAller?.statut;
    if (!s) return '';
    if (s === 'TERMINE') return 'noeud--termine';
    if (s === 'EN_COURS') return 'noeud--en-cours';
    return 'noeud--planifie';
  }

  estVainqueur(noeud: BracketNoeudDTO, side: 1 | 2): boolean {
    if (!noeud.vainqueur) return false;
    const p = side === 1 ? noeud.participant1 : noeud.participant2;
    return noeud.vainqueur.id === p?.id;
  }

  isBye(noeud: BracketNoeudDTO): boolean {
    return noeud.bye === true;
  }

  // ── Score avec prolongation / TAB ─────────────────────────
  scoreDom(n: BracketNoeudDTO): number {
    const m = n.matchAller as any;
    if (!m) return 0;
    return (m.butsDomicile ?? 0) + (m.butsDomicileProlong ?? 0);
  }
 
  scoreExt(n: BracketNoeudDTO): number {
    const m = n.matchAller as any;
    if (!m) return 0;
    return (m.butsExterieur ?? 0) + (m.butsExterieurProlong ?? 0);
  }
 
  hasExtra(n: BracketNoeudDTO): boolean {
    const m = n.matchAller as any;
    if (!m || m.statut !== 'TERMINE') return false;
    return (m.tabDomicile !== null && m.tabDomicile !== undefined)
        || (m.butsDomicileProlong !== null && m.butsDomicileProlong !== undefined);
  }
 
  extraLabel(n: BracketNoeudDTO): string {
    const m = n.matchAller as any;
    if (!m) return '';
    if (m.tabDomicile !== null && m.tabDomicile !== undefined)
      return `TAB ${m.tabDomicile}–${m.tabExterieur}`;
    if (m.butsDomicileProlong !== null && m.butsDomicileProlong !== undefined)
      return 'ap';
    return '';
  }
}