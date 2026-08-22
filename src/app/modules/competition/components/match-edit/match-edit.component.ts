import {
  Component, Input, Output, EventEmitter,
  OnInit, inject, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';
import { MatchApiService }       from '../../../../core/services/competition/match-api.service';
import { CompetitionApiService } from '../../../../core/services/competition/competition-api.service';
import { MatchDetailDTO }        from '../../../../core/models/competition.models';

interface Participant {
  id:       number;
  nomEquipe: string;
  logoUrl?:  string;
}

@Component({
  selector:    'app-match-edit',
  standalone:  true,
  imports:     [CommonModule, FormsModule],
  templateUrl: './match-edit.component.html',
  styleUrls:   ['./match-edit.component.scss']
})
export class MatchEditComponent implements OnInit {
  @Input()  match!:         MatchDetailDTO;
  @Input()  competitionId!: number;
  @Output() onClose  = new EventEmitter<void>();
  @Output() onSaved  = new EventEmitter<MatchDetailDTO>();

  private matchApi = inject(MatchApiService);
  private compApi  = inject(CompetitionApiService);

  // ── State ──────────────────────────────────────────────────
  saving               = signal(false);
  loadingParticipants  = signal(false);
  participantsDisponibles = signal<Participant[]>([]);

  // Formulaire
  dateHeure    = '';
  lieu         = '';
  domicileId:  number | null = null;
  exterieurId: number | null = null;

  // Correction résultat (match terminé)
  butsDomicile:  number | null = null;
  butsExterieur: number | null = null;

  // ── Init ──────────────────────────────────────────────────
  ngOnInit(): void {
    this.dateHeure   = this.match.dateHeure?.slice(0, 16) ?? '';
    this.lieu        = this.match.lieu ?? '';
    this.domicileId  = this.match.domicile?.id ?? null;
    this.exterieurId = this.match.exterieur?.id ?? null;
    this.butsDomicile  = this.match.butsDomicile ?? null;
    this.butsExterieur = this.match.butsExterieur ?? null;

    // Charger TOUS les participants de la compétition
    this.loadingParticipants.set(true);
    this.compApi.getParticipants(this.competitionId)
      .subscribe({
        next: p => {
          this.participantsDisponibles.set(p);
          this.loadingParticipants.set(false);
        },
        error: () => this.loadingParticipants.set(false)
      });
  }

  // ── Validation ────────────────────────────────────────────
  memeEquipe(): boolean {
    return !!this.domicileId
        && !!this.exterieurId
        && this.domicileId === this.exterieurId;
  }

  isTermine(): boolean {
    return ['TERMINE', 'FORFAIT_DOMICILE',
            'FORFAIT_EXTERIEUR', 'FORFAIT_DOUBLE']
      .includes(this.match.statut);
  }

  canSave(): boolean {
    return !this.memeEquipe() && !this.saving();
  }

  // ── Sauvegarde ────────────────────────────────────────────
  sauvegarder(): void {
    if (!this.canSave()) return;
    this.saving.set(true);

    const dto: any = {};
    if (this.dateHeure)    dto.dateHeure    = this.dateHeure;
    if (this.lieu)         dto.lieu         = this.lieu;
    if (this.domicileId  !== this.match.domicile?.id)
      dto.domicileId  = this.domicileId;
    if (this.exterieurId !== this.match.exterieur?.id)
      dto.exterieurId = this.exterieurId;

    // Correction résultat si terminé
    if (this.isTermine()
        && this.butsDomicile  != null
        && this.butsExterieur != null) {
      dto.butsDomicile  = this.butsDomicile;
      dto.butsExterieur = this.butsExterieur;
    }

    this.compApi.modifierMatch(this.competitionId, this.match.id, dto)
      .subscribe({
        next: m => {
          this.saving.set(false);
          this.onSaved.emit(m);
        },
        error: () => this.saving.set(false)
      });
  }
}