import {
  Component, Input, Output, OnInit, inject, signal, computed, EventEmitter
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';
import { CompetitionApiService } from '../../../../core/services/competition/competition-api.service';
import { CompetitionDTO } from '../../../../core/models/competition.models';

interface ParticipantSimule {
  id:       number;
  nomEquipe: string;
  logoUrl?:  string;
  seed?:     number;
}

interface GroupeSimule {
  index:  number;
  nom:    string;
  equipes: ParticipantSimule[];
}

interface NoeudSimule {
  position: number;
  tour:     string;
  equipe1?: ParticipantSimule;
  equipe2?: ParticipantSimule;
}

interface TirageSimule {
  competitionId: number;
  format:        string;
  groupes?:      GroupeSimule[];
  bracket?:      NoeudSimule[];
}

@Component({
  selector:    'app-tab-tirage',
  standalone:  true,
  imports:     [CommonModule, FormsModule],
  templateUrl: './tab-tirage.component.html',
  styleUrls:   ['./tab-tirage.component.scss']
})
export class TabTirageComponent implements OnInit {
  @Input()  competition!: any;
  @Output() launched = new EventEmitter<void>();

  private api    = inject(CompetitionApiService);

  // ── State ──────────────────────────────────────────────────
  tirage        = signal<TirageSimule | null>(null);
  simulating    = signal(false);
  validating    = signal(false);
  error         = signal<string | null>(null);

  // Drag & drop
  dragEquipe:   ParticipantSimule | null = null;
  dragFromGroupe: number | null = null;
  dragFromSlot: 'equipe1' | 'equipe2' | null = null;

  // ── Init ──────────────────────────────────────────────────
  ngOnInit(): void {
    // Simuler automatiquement à l'ouverture
    this.simuler();
  }

  // ── Formats ───────────────────────────────────────────────
  isGroupes(): boolean {
    const f = this.competition?.config?.format;
    return f === 'ALLER_SIMPLE' || f === 'ALLER_RETOUR' || f === 'MIXTE';
  }

  isCoupe(): boolean {
    return this.competition?.config?.format === 'ELIMINATION_SIMPLE';
  }

  tourLabel(tour: string): string {
    const labels: Record<string, string> = {
      FINALE: 'Finale', DEMI_FINALE: 'Demi-finales',
      QUART_DE_FINALE: 'Quarts de finale',
      HUITIEME: '8es de finale', SEIZIEME: '16es de finale',
      TOUR_PRELIMINAIRE: 'Tour préliminaire'
    };
    return labels[tour] ?? tour;
  }

  // Grouper les noeuds bracket par tour
  toursBracket = computed(() => {
    const t = this.tirage();
    if (!t?.bracket) return [];
    const map = new Map<string, NoeudSimule[]>();
    const ordre = ['TOUR_PRELIMINAIRE','SEIZIEME','HUITIEME',
                   'QUART_DE_FINALE','DEMI_FINALE','FINALE'];
    for (const n of t.bracket) {
      if (!n.equipe1 && !n.equipe2) continue; // noeuds vides
      if (!map.has(n.tour)) map.set(n.tour, []);
      map.get(n.tour)!.push(n);
    }
    return ordre
      .filter(k => map.has(k))
      .map(k => ({ tour: k, label: this.tourLabel(k), noeuds: map.get(k)! }));
  });

  // ── Simuler ───────────────────────────────────────────────
  simuler(): void {
    this.simulating.set(true);
    this.error.set(null);
    this.api.simulerTirage(this.competition.id).subscribe({
      next: t => {
        this.tirage.set(t);
        this.simulating.set(false);
      },
      error: err => {
        this.error.set(err?.error?.message ?? 'Erreur lors de la simulation');
        this.simulating.set(false);
      }
    });
  }

  // ── Drag & drop (groupes) ─────────────────────────────────
  onDragStart(equipe: ParticipantSimule, groupeIdx: number): void {
    this.dragEquipe     = equipe;
    this.dragFromGroupe = groupeIdx;
  }

  // Équipe survolée lors du drag — pour le swap ciblé
  dragOverEquipe: ParticipantSimule | null = null;
  dragOverGroupeIdx: number | null = null;

  onDragOverEquipe(equipe: ParticipantSimule, groupeIdx: number): void {
    this.dragOverEquipe    = equipe;
    this.dragOverGroupeIdx = groupeIdx;
  }

  onDropOnGroupe(targetGroupeIdx: number): void {
    if (this.dragEquipe === null || this.dragFromGroupe === null) return;

    const t = this.tirage();
    if (!t?.groupes) return;

    const groupes = t.groupes.map(g => ({ ...g, equipes: [...g.equipes] }));
    const src = groupes[this.dragFromGroupe];
    const dst = groupes[targetGroupeIdx];

    // Trouver l'index de l'équipe draggée dans le groupe source
    const srcIdx = src.equipes.findIndex(e => e.id === this.dragEquipe!.id);
    if (srcIdx === -1) return;

    if (this.dragFromGroupe === targetGroupeIdx) {
      // Même groupe — swap avec l'équipe ciblée
      if (this.dragOverEquipe && this.dragOverEquipe.id !== this.dragEquipe!.id) {
        const dstIdx = dst.equipes.findIndex(e => e.id === this.dragOverEquipe!.id);
        if (srcIdx !== -1 && dstIdx !== -1) {
          // Swap dans le même groupe
          const temp = dst.equipes[dstIdx];
          dst.equipes[dstIdx] = this.dragEquipe!;
          dst.equipes[srcIdx] = temp;
          this.tirage.set({ ...t, groupes });
        }
      }
      this.dragEquipe = null;
      this.dragFromGroupe = null;
      this.dragOverEquipe = null;
      this.dragOverGroupeIdx = null;
      return;
    }

    // Groupe différent — swap avec l'équipe ciblée si elle existe
    if (this.dragOverEquipe && this.dragOverGroupeIdx === targetGroupeIdx) {
      // Trouver l'équipe cible dans le groupe destination
      const dstIdx = dst.equipes.findIndex(e => e.id === this.dragOverEquipe!.id);
      if (dstIdx !== -1) {
        // Swap direct : équipe draggée ↔ équipe cible
        const temp = dst.equipes[dstIdx];
        dst.equipes[dstIdx] = this.dragEquipe!;
        src.equipes[srcIdx] = temp;
        this.tirage.set({ ...t, groupes });
        this.dragEquipe = null;
        this.dragFromGroupe = null;
        this.dragOverEquipe = null;
        this.dragOverGroupeIdx = null;
        return;
      }
    }

    // Pas d'équipe cible (drop sur zone vide) — déplacer si place disponible
    const maxParGroupe = this.competition.config?.equipesParGroupe ?? 4;
    if (dst.equipes.length < maxParGroupe) {
      src.equipes.splice(srcIdx, 1);
      dst.equipes.push(this.dragEquipe!);
      this.tirage.set({ ...t, groupes });
    }
    // Si groupe plein et pas de cible → ne rien faire (l'équipe reste)

    this.dragEquipe = null;
    this.dragFromGroupe = null;
    this.dragOverEquipe = null;
    this.dragOverGroupeIdx = null;
  }

  // ── Drag & drop (bracket — coupe) ─────────────────────────
  onDragStartBracket(equipe: ParticipantSimule,
                      slot: 'equipe1' | 'equipe2',
                      noeudPos: number): void {
    this.dragEquipe   = equipe;
    this.dragFromSlot = slot;
    this.dragFromGroupe = noeudPos; // réutiliser pour stocker la position
  }

  onDropOnSlot(targetPos: number,
               targetSlot: 'equipe1' | 'equipe2'): void {
    if (!this.dragEquipe) return;
    const t = this.tirage();
    if (!t?.bracket) return;

    const bracket = t.bracket.map(n => ({ ...n }));
    const srcNoeud = bracket.find(n => n.position === this.dragFromGroupe);
    const dstNoeud = bracket.find(n => n.position === targetPos);
    if (!srcNoeud || !dstNoeud) return;

    // Récupérer la cible actuelle
    const srcEquipe = this.dragEquipe;
    const dstEquipe = dstNoeud[targetSlot];

    // Échanger
    dstNoeud[targetSlot] = srcEquipe;
    if (this.dragFromSlot)
      (srcNoeud as any)[this.dragFromSlot] = dstEquipe ?? null;

    this.tirage.set({ ...t, bracket });
    this.dragEquipe = this.dragFromSlot = null;
    this.dragFromGroupe = null;
  }

  allowDrop(event: DragEvent): void { event.preventDefault(); }

  // ── Valider ───────────────────────────────────────────────
  valider(): void {
    const t = this.tirage();
    if (!t) return;
    this.validating.set(true);
    this.error.set(null);

    this.api.validerTirage(this.competition.id, t).subscribe({
      next: () => {
        this.validating.set(false);
        // Notifier le parent pour recharger la compétition
        // → competition-detail rechargera et basculera sur l'onglet phases
        this.launched.emit();
      },
      error: err => {
        this.error.set(err?.error?.message ?? 'Erreur lors du lancement');
        this.validating.set(false);
      }
    });
  }

  getInitials(name: string): string {
    return (name ?? '').split(' ').map(w => w[0]).join('')
      .substring(0, 2).toUpperCase();
  }
}