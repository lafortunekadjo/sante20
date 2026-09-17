import {
  Component, Input, Output, EventEmitter,
  OnInit, inject, signal, computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';
import { MatchApiService }       from '../../../../core/services/competition/match-api.service';
import { CompetitionApiService } from '../../../../core/services/competition/competition-api.service';
import { MatchDetailDTO }        from '../../../../core/models/competition.models';

interface Participant {
  id:        number;
  nomEquipe: string;
  logoUrl?:  string;
}

interface OfficielMatch {
  id?:          number;  // matchOfficielId
  officielId:   number;
  nom:          string;
  prenom?:      string;
  roleMatch:    string;
  licenceNumero?: string;
}

interface OfficielComp {
  id:           number;
  nom:          string;
  prenom?:      string;
  typeOfficiel: string;
  licenceNumero?: string;
  actif:        boolean;
}

const ROLES_MATCH = [
  { value: 'ARBITRE_PRINCIPAL',   label: 'Arbitre principal'     },
  { value: 'ARBITRE_ASSISTANT',   label: '1er Arbitre assistant' },
  { value: 'QUATRIEME_ARBITRE',   label: 'Quatrième arbitre'     },
  { value: 'ARBITRE_VIDEO',       label: 'Arbitre vidéo'         },
  { value: 'COMMISSAIRE_MATCH',   label: 'Commissaire de match'  },
  { value: 'DELEGUE_TECHNIQUE',   label: 'Délégué technique'     },
  { value: 'MEDECIN_MATCH',       label: 'Médecin référent'      },
  { value: 'OBSERVATEUR_ARBITRE', label: 'Officier médias'       },
];

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
  @Input()  bracketMode    = false;
  @Output() onClose  = new EventEmitter<void>();
  @Output() onSaved  = new EventEmitter<MatchDetailDTO>();

  private matchApi = inject(MatchApiService);
  private compApi  = inject(CompetitionApiService);

  // ── State ──────────────────────────────────────────────────
  saving              = signal(false);
  loadingParticipants = signal(false);
  loadingOfficiels    = signal(false);
  participantsDisponibles = signal<Participant[]>([]);

  // Officiels du match
  officielsMatch      = signal<OfficielMatch[]>([]);
  // Officiels disponibles depuis la compétition
  officielsComp       = signal<OfficielComp[]>([]);
  // Recherche
  searchOfficiel      = '';
  roleSelectionne     = 'ARBITRE_PRINCIPAL';
  officielSelectionne = signal<OfficielComp | null>(null);
  showOfficielPicker  = signal(false);
  savingOfficiel      = signal(false);

  rolesMatch = ROLES_MATCH;

  // Officiels filtrés par recherche
  officielsFiltres = computed(() => {
    const q = this.searchOfficiel.toLowerCase().trim();
    const dejaAssignes = new Set(this.officielsMatch().map(o => o.officielId));
    return this.officielsComp()
      .filter(o => o.actif && !dejaAssignes.has(o.id))
      .filter(o => !q
        || o.nom.toLowerCase().includes(q)
        || (o.prenom?.toLowerCase().includes(q) ?? false));
  });

  // Formulaire match
  dateHeure    = '';
  lieu         = '';
  domicileId:  number | null = null;
  exterieurId: number | null = null;
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

    this.chargerParticipants();
    this.chargerOfficiels();
  }

  private chargerParticipants(): void {
    this.loadingParticipants.set(true);
    this.compApi.getParticipants(this.competitionId).subscribe({
      next: p => { this.participantsDisponibles.set(p); this.loadingParticipants.set(false); },
      error: () => this.loadingParticipants.set(false)
    });
  }

  private chargerOfficiels(): void {
    this.loadingOfficiels.set(true);
    // Officiels déjà assignés au match
    this.compApi.officielsDuMatch(this.competitionId, this.match.id).subscribe({
      next: om => { this.officielsMatch.set(om); this.loadingOfficiels.set(false); },
      error: () => this.loadingOfficiels.set(false)
    });
    // Tous les officiels de la compétition
    this.compApi.listerOfficiels(this.competitionId).subscribe({
      next: oc => this.officielsComp.set(oc),
      error: () => {}
    });
  }

  // ── Officiels du match ────────────────────────────────────
  roleLabel(role: string): string {
    return ROLES_MATCH.find(r => r.value === role)?.label ?? role;
  }

  ouvrirPicker(): void {
    this.searchOfficiel = '';
    this.officielSelectionne.set(null);
    this.showOfficielPicker.set(true);
  }

  selectionnerOfficiel(o: OfficielComp): void {
    this.officielSelectionne.set(o);
    this.searchOfficiel = `${o.nom}${o.prenom ? ' ' + o.prenom : ''}`;
  }

  assignerOfficiel(): void {
    const o = this.officielSelectionne();
    if (!o) return;
    this.savingOfficiel.set(true);
    this.compApi.assignerOfficiel(this.competitionId, this.match.id, {
      officielId: o.id,
      roleMatch:  this.roleSelectionne
    }).subscribe({
      next: () => {
        this.chargerOfficiels();
        this.showOfficielPicker.set(false);
        this.officielSelectionne.set(null);
        this.searchOfficiel = '';
        this.savingOfficiel.set(false);
      },
      error: () => this.savingOfficiel.set(false)
    });
  }

  retirerOfficiel(om: OfficielMatch): void {
    if (!om.id) return;
    this.compApi.retirerOfficielDuMatch(this.competitionId, this.match.id, om.officielId)
      .subscribe({ next: () => this.chargerOfficiels() });
  }

  // ── Validation / Sauvegarde ──────────────────────────────
  memeEquipe(): boolean {
    return !!this.domicileId && !!this.exterieurId
        && this.domicileId === this.exterieurId;
  }

  isTermine(): boolean {
    return ['TERMINE','FORFAIT_DOMICILE',
            'FORFAIT_EXTERIEUR','FORFAIT_DOUBLE']
      .includes(this.match.statut);
  }

  canSave(): boolean { return !this.memeEquipe() && !this.saving(); }

  sauvegarder(): void {
    if (!this.canSave()) return;
    this.saving.set(true);
    const dto: any = {};
    if (this.dateHeure) dto.dateHeure = this.dateHeure;
    if (this.lieu)      dto.lieu      = this.lieu;
    if (this.domicileId  !== this.match.domicile?.id)
      dto.domicileId  = this.domicileId;
    if (this.exterieurId !== this.match.exterieur?.id)
      dto.exterieurId = this.exterieurId;
    if (this.isTermine() && this.butsDomicile != null && this.butsExterieur != null) {
      dto.butsDomicile  = this.butsDomicile;
      dto.butsExterieur = this.butsExterieur;
    }
    this.compApi.modifierMatch(this.competitionId, this.match.id, dto).subscribe({
      next: m => { this.saving.set(false); this.onSaved.emit(m); },
      error: () => this.saving.set(false)
    });
  }
}