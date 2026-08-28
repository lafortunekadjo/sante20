import {
  Component, Input, OnInit, inject, signal, computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';
import { CompetitionApiService } from '../../../../core/services/competition/competition-api.service';

interface StatIndividuelleDTO {
  membreEquipeId: number;
  nom:            string;
  prenom?:        string;
  nomEquipe:      string;
  valeur:         number;
}

interface StatEquipeDTO {
  participantId: number;
  nomEquipe:     string;
  valeur:        number;
}

interface AwardDTO {
  id?:                 number;
  type:                string;
  typeLabel:           string;
  membreEquipeId?:     number;
  nomJoueur?:          string;
  nomEquipe?:          string;
  participantId?:      number;
  nomEquipeCollectif?: string;
  valeur?:             number;
  commentaire?:        string;
}

interface CompetitionStatsDTO {
  topButeurs:          StatIndividuelleDTO[];
  topPasseurs:         StatIndividuelleDTO[];
  topGardiens:         StatIndividuelleDTO[];
  gardiens:            StatIndividuelleDTO[]; // tous les gardiens du roster
  meilleuresAttaques:  StatEquipeDTO[];
  meilleuresDefenses:  StatEquipeDTO[];
  fairPlay:            StatEquipeDTO[];
  awards:              AwardDTO[];
}

interface AwardType {
  type:      string;
  label:     string;
  emoji:     string;
  collectif: boolean;
}

// Candidat générique pour le modal
interface Candidat {
  id:      number;
  nom:     string;
  equipe?: string;
  valeur?: number;
}

@Component({
  selector:    'app-tab-awards',
  standalone:  true,
  imports:     [CommonModule, FormsModule],
  templateUrl: './tab-awards.component.html',
  styleUrls:   ['./tab-awards.component.scss']
})
export class TabAwardsComponent implements OnInit {
  @Input() competition!: any;

  private api = inject(CompetitionApiService);

  // ── State ──────────────────────────────────────────────────
  loading     = signal(true);
  stats       = signal<CompetitionStatsDTO | null>(null);
  savingAward = signal(false);
  modalAward  = signal<AwardType | null>(null);
  searchNom   = '';
  selectedId  = signal<number | null>(null);
  commentaire = '';

  // ── Types d'awards — séparés par catégorie ────────────────
  awardTypesSportifs: AwardType[] = [
    { type: 'CHAMPION',  label: 'Champion',  emoji: '🏆', collectif: true },
    { type: 'FINALISTE', label: 'Finaliste', emoji: '🥈', collectif: true },
    { type: 'TROISIEME', label: '3e place',  emoji: '🥉', collectif: true },
  ];

  awardTypesIndividuels: AwardType[] = [
    { type: 'MVP',              label: 'MVP',              emoji: '⭐', collectif: false },
    { type: 'MEILLEUR_BUTEUR',  label: 'Meilleur buteur',  emoji: '⚽', collectif: false },
    { type: 'MEILLEUR_PASSEUR', label: 'Meilleur passeur', emoji: '🅰️', collectif: false },
    { type: 'MEILLEUR_GARDIEN', label: 'Meilleur gardien', emoji: '🧤', collectif: false },
    { type: 'MEILLEURE_JEUNE',  label: 'Meilleure jeune',  emoji: '🌟', collectif: false },
  ];

  awardTypesCollectifs: AwardType[] = [
    { type: 'MEILLEURE_ATTAQUE', label: 'Meilleure attaque', emoji: '🔥', collectif: true },
    { type: 'MEILLEURE_DEFENSE', label: 'Meilleure défense', emoji: '🛡️', collectif: true },
    { type: 'FAIR_PLAY',         label: 'Fair-play',         emoji: '🟨', collectif: true },
  ];

  // ── Init ──────────────────────────────────────────────────
  ngOnInit(): void { this.chargerStats(); }

  chargerStats(): void {
    this.loading.set(true);
    this.api.getCompetitionStats(this.competition.id).subscribe({
      next: s => { this.stats.set(s); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  // ── Award existant ────────────────────────────────────────
  getAward(type: string): AwardDTO | undefined {
    return this.stats()?.awards?.find(a => a.type === type);
  }

  // ── Stats de référence dans le modal ─────────────────────
  // Affiche les stats pertinentes selon le type d'award
  statsRef = computed((): Candidat[] => {
    const modal = this.stats();
    const type  = this.modalAward()?.type;
    if (!modal || !type) return [];

    switch (type) {
      case 'MEILLEUR_BUTEUR':
        return modal.topButeurs.map(j => ({
          id: j.membreEquipeId, nom: this.nomComplet(j),
          equipe: j.nomEquipe,  valeur: j.valeur
        }));
      case 'MEILLEUR_PASSEUR':
        return modal.topPasseurs.map(j => ({
          id: j.membreEquipeId, nom: this.nomComplet(j),
          equipe: j.nomEquipe,  valeur: j.valeur
        }));
      case 'MEILLEUR_GARDIEN':
        // Utiliser la liste des gardiens du roster (pas les clean sheets)
        const gardiens = (modal as any).gardiens as StatIndividuelleDTO[] ?? [];
        if (gardiens.length)
          return gardiens.map(j => ({
            id: j.membreEquipeId, nom: this.nomComplet(j),
            equipe: j.nomEquipe,  valeur: j.valeur
          }));
        // Fallback : top gardiens clean sheets
        return modal.topGardiens.map(j => ({
          id: j.membreEquipeId, nom: this.nomComplet(j),
          equipe: j.nomEquipe,  valeur: j.valeur
        }));
      case 'MEILLEURE_ATTAQUE':
        return modal.meilleuresAttaques.map(e => ({
          id: e.participantId, nom: e.nomEquipe, valeur: e.valeur
        }));
      case 'MEILLEURE_DEFENSE':
        return modal.meilleuresDefenses.map(e => ({
          id: e.participantId, nom: e.nomEquipe, valeur: e.valeur
        }));
      case 'FAIR_PLAY':
        return modal.fairPlay.map(e => ({
          id: e.participantId, nom: e.nomEquipe, valeur: e.valeur
        }));
      case 'MVP':
        // MVP → top buteurs comme suggestion
        return modal.topButeurs.slice(0, 5).map(j => ({
          id: j.membreEquipeId, nom: this.nomComplet(j),
          equipe: j.nomEquipe,  valeur: j.valeur
        }));
      default:
        // Sportifs (Champion, Finaliste, 3e) → toutes les équipes
        return this.toutesEquipes().map(e => ({
          id: e.participantId, nom: e.nomEquipe
        }));
    }
  });

  // Recherche libre parmi tous les candidats
  candidats = computed(() => {
    const modal = this.modalAward();
    const s     = this.stats();
    if (!modal || !s || !this.searchNom.trim()) return [];

    const q = this.searchNom.toLowerCase().trim();

    if (modal.collectif) {
      return this.toutesEquipes()
        .filter(e => e.nomEquipe.toLowerCase().includes(q))
        .map(e => ({ ...e, participantId: e.participantId, nom: e.nomEquipe } as any));
    } else {
      return [
        ...s.topButeurs, ...s.topPasseurs, ...s.topGardiens
      ]
      .filter((j, idx, arr) =>
        arr.findIndex(x => x.membreEquipeId === j.membreEquipeId) === idx)
      .filter(j =>
        this.nomComplet(j).toLowerCase().includes(q) ||
        j.nomEquipe.toLowerCase().includes(q))
      .map(j => ({
        ...j,
        membreEquipeId: j.membreEquipeId,
        nom: this.nomComplet(j)
      } as any));
    }
  });

  private toutesEquipes(): StatEquipeDTO[] {
    const map = new Map<number, StatEquipeDTO>();
    [
      ...this.stats()?.meilleuresAttaques ?? [],
      ...this.stats()?.meilleuresDefenses ?? [],
      ...this.stats()?.fairPlay ?? []
    ].forEach(e => {
      if (!map.has(e.participantId)) map.set(e.participantId, e);
    });
    return [...map.values()].sort((a, b) =>
      a.nomEquipe.localeCompare(b.nomEquipe, 'fr'));
  }

  // ── Modal ─────────────────────────────────────────────────
  ouvrirModal(awardType: AwardType): void {
    this.modalAward.set(awardType);
    this.selectedId.set(null);
    this.searchNom  = '';
    this.commentaire = '';
    // Pré-sélectionner l'award existant
    const existing = this.getAward(awardType.type);
    if (existing) {
      this.selectedId.set(
        existing.membreEquipeId ?? existing.participantId ?? null);
      this.commentaire = existing.commentaire ?? '';
    }
  }

  fermerModal(): void {
    this.modalAward.set(null);
    this.selectedId.set(null);
    this.searchNom = '';
  }

  selectionner(id: number): void {
    this.selectedId.set(id);
    this.searchNom = '';
  }

  // ── Attribuer ─────────────────────────────────────────────
  attribuer(): void {
    const modal = this.modalAward();
    if (!modal || !this.selectedId()) return;
    this.savingAward.set(true);

    const dto: any = {
      type:        modal.type,
      commentaire: this.commentaire || null
    };

    if (modal.collectif) dto.participantId  = this.selectedId();
    else                 dto.membreEquipeId = this.selectedId();

    // Valeur depuis les stats de référence
    const ref = this.statsRef().find(r => r.id === this.selectedId());
    if (ref?.valeur != null) dto.valeur = ref.valeur;

    this.api.attribuerAward(this.competition.id, dto).subscribe({
      next: () => {
        this.chargerStats();
        this.fermerModal();
        this.savingAward.set(false);
      },
      error: () => this.savingAward.set(false)
    });
  }

  supprimerAward(award: AwardDTO): void {
    if (!award.id) return;
    this.api.supprimerAward(this.competition.id, award.id)
      .subscribe({ next: () => this.chargerStats() });
  }

  canEdit(): boolean {
    return ['BROUILLON','EN_COURS','TERMINE'].includes(
      this.competition.statut as string);
  }

  getInitials(name: string): string {
    return (name ?? '').split(' ').map((w: string) => w[0])
      .join('').substring(0, 2).toUpperCase();
  }

  nomComplet(j: StatIndividuelleDTO): string {
    return `${j.prenom ?? ''} ${j.nom}`.trim();
  }
}