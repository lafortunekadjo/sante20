import {
  Component, Input, Output, EventEmitter,
  OnInit, inject, signal, computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';
import { CompetitionApiService } from '../../../../core/services/competition/competition-api.service';

interface QualifieDTO {
  id:          number;
  nomEquipe:   string;
  logoUrl?:    string;
  rang:        number;
  points:      number;
  goalAverage: number;
}

interface QualifieGroupeDTO {
  nomGroupe: string;
  qualifies: QualifieDTO[];
}

interface PaireDTO {
  participant1Id: number | null;
  participant2Id: number | null;
}

interface QualifiesDTO {
  groupes:        QualifieGroupeDTO[];
  tirageSuggere:  PaireDTO[];
}

@Component({
  selector:    'app-modal-tirage-finale',
  standalone:  true,
  imports:     [CommonModule, FormsModule],
  templateUrl: './modal-tirage-finale.component.html',
  styleUrls:   ['./modal-tirage-finale.component.scss']
})
export class ModalTirageFinaleComponent implements OnInit {
  @Input()  competitionId!: number;
  @Output() closed    = new EventEmitter<void>();
  @Output() validated = new EventEmitter<void>();

  private api = inject(CompetitionApiService);

  // ── State ──────────────────────────────────────────────────
  loading     = signal(true);
  saving      = signal(false);
  error       = signal<string | null>(null);
  qualifies   = signal<QualifiesDTO | null>(null);
  paires      = signal<PaireDTO[]>([]);

  // Tous les qualifiés à plat pour les dropdowns
  tousQualifies = computed(() => {
    const q = this.qualifies();
    if (!q) return [];
    return q.groupes.flatMap(g => g.qualifies)
      .sort((a, b) => a.nomEquipe.localeCompare(b.nomEquipe, 'fr'));
  });

  // ── Init ──────────────────────────────────────────────────
  ngOnInit(): void {
    this.api.getQualifies(this.competitionId).subscribe({
      next: q => {
        this.qualifies.set(q);
        // Pré-remplir avec le tirage suggéré
        this.paires.set(q.tirageSuggere.map((p: any) => ({ ...p })));
        this.loading.set(false);
      },
      error: err => {
        this.error.set(err?.error?.message ?? 'Erreur lors du chargement');
        this.loading.set(false);
      }
    });
  }

  // ── Gestion des paires ────────────────────────────────────
  ajouterPaire(): void {
    this.paires.update(p => [...p, { participant1Id: null, participant2Id: null }]);
  }

  supprimerPaire(index: number): void {
    this.paires.update(p => p.filter((_, i) => i !== index));
  }

  setPaire(index: number, side: 1 | 2, id: number | null): void {
    this.paires.update(p => p.map((paire, i) =>
      i === index
        ? { ...paire, [`participant${side}Id`]: id }
        : paire
    ));
  }

  resetSuggere(): void {
    const q = this.qualifies();
    if (q) this.paires.set(q.tirageSuggere.map(p => ({ ...p })));
  }

  // ── Computed pour le template (pas de arrow fn dans Angular templates) ──
  hasMemesEquipes = computed(() =>
    this.paires().some(p =>
      p.participant1Id != null &&
      p.participant1Id === p.participant2Id)
  );

  hasPairesIncompletes = computed(() =>
    this.paires().some(p => !p.participant1Id || !p.participant2Id)
  );

  // ── Validation ────────────────────────────────────────────
  canValider = computed(() => {
    const p = this.paires();
    if (!p.length) return false;
    // Toutes les paires complètes
    if (p.some(x => !x.participant1Id || !x.participant2Id)) return false;
    // Pas d'équipe vs elle-même
    if (p.some(x => x.participant1Id === x.participant2Id)) return false;
    // Pas de doublon
    const ids = p.flatMap(x => [x.participant1Id, x.participant2Id]);
    return new Set(ids).size === ids.length;
  });

  // Ids déjà utilisés dans les paires (pour désactiver dans les dropdowns)
  idsUtilises(excludePaireIdx: number, excludeSide: 1 | 2): Set<number> {
    const used = new Set<number>();
    this.paires().forEach((p, i) => {
      if (i === excludePaireIdx) {
        // Exclure seulement l'autre side de la même paire
        const autreId = excludeSide === 1 ? p.participant2Id : p.participant1Id;
        if (autreId) used.add(autreId);
      } else {
        if (p.participant1Id) used.add(p.participant1Id);
        if (p.participant2Id) used.add(p.participant2Id);
      }
    });
    return used;
  }

  // ── Soumettre ─────────────────────────────────────────────
  valider(): void {
    if (!this.canValider()) return;
    this.saving.set(true);
    this.error.set(null);

    this.api.passerPhaseSuivante(this.competitionId, {
      paires: this.paires()
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.validated.emit();
      },
      error: err => {
        this.error.set(err?.error?.message ?? 'Erreur lors du lancement');
        this.saving.set(false);
      }
    });
  }

  getInitials(name: string): string {
    return (name ?? '').split(' ').map(w => w[0]).join('')
      .substring(0, 2).toUpperCase();
  }

  rangLabel(rang: number): string {
    return rang === 1 ? '1er' : rang === 2 ? '2e' : `${rang}e`;
  }
}