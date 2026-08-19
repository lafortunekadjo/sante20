import {
  Component, Input, OnInit, Output, EventEmitter,
  inject, signal, computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import {
  CompetitionDetailDTO, CompetitionParticipantDTO,
  StatutInscription, TypeParticipant
} from '../../../../core/models/competition.models';
import { CompetitionApiService } from '../../../../core/services/competition/competition-api.service';
import { AuthService }           from '../../../../core/services/auth.service';
import { RosterComponent } from '../roster/roster.component';

interface GroupeOption {
  id:       number;
  nom:      string;
  logoUrl?: string;
}

@Component({
  selector:    'app-tab-participants',
  standalone:  true,
  imports:     [CommonModule, FormsModule, ReactiveFormsModule, RosterComponent],
  templateUrl: './tab-participants.component.html',
  styleUrls:   ['./tab-participants.component.scss']
})
export class TabParticipantsComponent implements OnInit {
  @Input()  competition!: CompetitionDetailDTO;
  @Output() updated = new EventEmitter<void>();

  private api  = inject(CompetitionApiService);
  private auth = inject(AuthService);
  private fb   = inject(FormBuilder);

  // ── État ──────────────────────────────────────────────────
  participants          = signal<CompetitionParticipantDTO[]>([]);
  showForm              = signal(false);
  saving                = signal(false);
  filtreStatut          = signal<StatutInscription | null>(null);
  participantSelectionne = signal<CompetitionParticipantDTO | null>(null);

  // Liste des groupes My2-0 disponibles (chargée si type = GROUPE_MY20)
  groupesDisponibles    = signal<GroupeOption[]>([]);
  loadingGroupes        = signal(false);
  groupeDejaInscrit     = signal<number | null>(null); // groupeId déjà inscrit

  // ── Formulaire ────────────────────────────────────────────
  form = this.fb.nonNullable.group({
    type:               ['EXTERNE' as TypeParticipant | string],
    nomEquipe:          [''],
    contactResponsable: [''],
    seed:               [null as number | null],
    groupeId:           [null as number | null],
  });

  // Détecter le changement de type
  typeSelectionne = computed(() => this.form.get('type')?.value as TypeParticipant);

  // ── Options ───────────────────────────────────────────────
  statutOptions = [
    { value: StatutInscription.EN_ATTENTE, label: 'En attente' },
    { value: StatutInscription.VALIDE,     label: 'Validées'   },
    { value: StatutInscription.REJETE,     label: 'Rejetées'   },
  ];

  filteredParticipants = computed(() => {
    const s = this.filtreStatut();
    if (!s) return this.participants();
    return this.participants().filter(p => p.statutInscription === s);
  });

  // ── Cycle de vie ─────────────────────────────────────────
  ngOnInit(): void {
    this.load();

    // Écouter le changement de type dans le formulaire
    this.form.get('type')!.valueChanges.subscribe(type => {
      if (type === 'GROUPE_MY20') {
        this.chargerGroupesDisponibles();
        this.form.get('nomEquipe')!.clearValidators();
        this.form.get('groupeId')!.setValidators(Validators.required);
      } else {
        this.form.get('nomEquipe')!.setValidators(Validators.required);
        this.form.get('groupeId')!.clearValidators();
        this.form.get('groupeId')!.setValue(null);
      }
      this.form.get('nomEquipe')!.updateValueAndValidity();
      this.form.get('groupeId')!.updateValueAndValidity();
    });

    // Initialiser les validateurs pour EXTERNE par défaut
    this.form.get('nomEquipe')!.setValidators(Validators.required);
    this.form.get('nomEquipe')!.updateValueAndValidity();
  }

  load(): void {
    this.api.getParticipants(this.competition.id).subscribe(p => {
      this.participants.set(p);
      // Mémoriser les groupes déjà inscrits pour griser dans la liste
      const inscrits = p
        .filter(x => x.clubId != null)
        .map(x => x.clubId!);
      this.groupeDejaInscrit.set(inscrits[0] ?? null);
    });
  }

  // ── Groupes My2-0 disponibles ─────────────────────────────
  chargerGroupesDisponibles(): void {
    if (this.groupesDisponibles().length > 0) return;
    this.loadingGroupes.set(true);

    const isAdmin = this.auth.getRoles()?.some(
      (r: string) => r === 'ADMIN' || r === 'ROLE_ADMIN'
    );

    if (isAdmin) {
      // Admin → tous les groupes My2-0 de la plateforme
      this.api.getTousLesGroupes().subscribe({
        next: groupes => {
          this.groupesDisponibles.set(groupes.map((g: any) => ({
            id:      g.id ?? g.groupeId,
            nom:     g.nom,
            logoUrl: g.profilePhotoUrl ?? g.logoUrl
          })));
          this.loadingGroupes.set(false);
        },
        error: () => this.loadingGroupes.set(false)
      });
    } else {
      // Responsable → seulement ses propres groupes
      const cache = this.auth.getMesGroupesCache();
      if (cache?.length) {
        this.groupesDisponibles.set(cache.map((g: any) => ({
          id:      g.groupeId,
          nom:     g.nom,
          logoUrl: g.profilePhotoUrl
        })));
        this.loadingGroupes.set(false);
      } else {
        this.auth.getMesGroupes().subscribe({
          next: groupes => {
            this.groupesDisponibles.set((groupes as any[]).map(g => ({
              id:      g.groupeId,
              nom:     g.nom,
              logoUrl: g.profilePhotoUrl
            })));
            this.loadingGroupes.set(false);
          },
          error: () => this.loadingGroupes.set(false)
        });
      }
    }
  }

  // Quand un groupe est sélectionné → pré-remplir le nom
  onGroupeChange(groupeId: number): void {
    const groupe = this.groupesDisponibles().find(g => g.id === groupeId);
    if (groupe) {
      this.form.patchValue({ nomEquipe: groupe.nom });
    }
  }

  // Vérifier si un groupe est déjà inscrit
  isGroupeDejaInscrit(groupeId: number): boolean {
    return this.participants().some(p => p.clubId === groupeId);
  }

  // ── Inscription ───────────────────────────────────────────
  inscrire(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const v = this.form.value;



    const dto: any = {
      type:               v.type,
      contactResponsable: v.contactResponsable || undefined,
      seed:               v.seed               || undefined,
    };

    if (v.type === 'GROUPE_MY20') {
      // Équipe My2-0 — nom depuis le groupe sélectionné
     
         
      const groupe = this.groupesDisponibles().find(g => g.id === v.groupeId);
      dto.clubId  = v.groupeId;
      dto.nomEquipe = groupe?.nom ?? v.nomEquipe;
      dto.logoUrl   = groupe?.logoUrl;
    } else {
      // Équipe externe — nom saisi manuellement
      dto.nomEquipe = v.nomEquipe;
    }

    console.log(dto)

    this.api.inscrire(this.competition.id, dto).subscribe({
      next: () => {
        this.load();
        this.form.reset({ type: 'EXTERNE' });
        this.showForm.set(false);
        this.saving.set(false);
        this.updated.emit();
      },
      error: () => this.saving.set(false)
    });
  }

  // Ajouter après canInscrire()
peutGererRoster(): boolean {
  return !['TERMINE', 'ANNULE'].includes(this.competition.statut as string);
}

  // ── Actions participants ───────────────────────────────────
  valider(p: CompetitionParticipantDTO): void {
    this.api.validerInscription(this.competition.id, p.id)
      .subscribe(() => { this.load(); this.updated.emit(); });
  }

  rejeter(p: CompetitionParticipantDTO): void {
    this.api.rejeterInscription(this.competition.id, p.id)
      .subscribe(() => this.load());
  }

  retirer(p: CompetitionParticipantDTO): void {
    if (!confirm(`Retirer "${p.nomEquipe}" de la compétition ?`)) return;
    this.api.retirerParticipant(this.competition.id, p.id)
      .subscribe(() => { this.load(); this.updated.emit(); });
  }

  // ── Helpers ───────────────────────────────────────────────
  canInscrire(): boolean {
    return ['BROUILLON', 'INSCRIPTION_OUVERTE'].includes(this.competition.statut);
  }

  canRetirer(p: CompetitionParticipantDTO): boolean {
    return p.statutInscription === StatutInscription.VALIDE
        && this.competition.statut !== 'EN_COURS' as any;
  }

  countByStatut(s: StatutInscription): number {
    return this.participants().filter(p => p.statutInscription === s).length;
  }

  getInitials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  }

  statutLabel(s: StatutInscription): string {
    const m: Record<StatutInscription, string> = {
      [StatutInscription.EN_ATTENTE]: 'En attente',
      [StatutInscription.VALIDE]:     'Validée',
      [StatutInscription.REJETE]:     'Rejetée',
      [StatutInscription.RETIRE]:     'Retirée',
    };
    return m[s] ?? s;
  }
}