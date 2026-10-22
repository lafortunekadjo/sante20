import {
  Component, Input, OnInit, Output, EventEmitter,
  inject, signal, computed
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import {
  CompetitionDetailDTO, CompetitionParticipantDTO,
  StatutInscription, TypeParticipant
} from '../../../../core/models/competition.models';
import { CompetitionApiService } from '../../../../core/services/competition/competition-api.service';
import { AuthService }           from '../../../../core/services/auth.service';
import { RosterComponent } from '../roster/roster.component';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environment';
import { EquipeEspace } from '../equipe-espace/equipe-espace.component';
import { partagerLien, urlApplication } from '../../../../core/utils/partage';

interface GroupeOption {
  id:       number;
  nom:      string;
  logoUrl?: string;
}

@Component({
  selector:    'app-tab-participants',
  standalone:  true,
  imports:     [CommonModule, FormsModule, ReactiveFormsModule, RosterComponent,
    TranslateModule,
    MatIconModule],
  templateUrl: './tab-participants.component.html',
  styleUrls:   ['./tab-participants.component.scss']
})
export class TabParticipantsComponent implements OnInit {
  @Input()  competition!: CompetitionDetailDTO;
  @Input()  permissions: string[] = []; // permissions du user connecté
  @Output() updated = new EventEmitter<void>();

  private api  = inject(CompetitionApiService);
  private auth = inject(AuthService);
  private fb   = inject(FormBuilder);
  private http = inject(HttpClient);

  /** Avancement de l'effectif de chaque équipe (promoteur) : fiches à compléter, photos manquantes. */
  avancement = signal<Record<number, EquipeEspace>>({});
  messageLien = signal<string | null>(null);

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

  chargerAvancement(): void {
    this.http.get<EquipeEspace[]>(`${environment.apiUrl}/competitions/${this.competition.id}/equipes/avancement`).subscribe({
      next: liste => this.avancement.set(Object.fromEntries(liste.map(e => [e.participantId, e]))),
      error: () => { /* réservé au promoteur : sans droit, on n'affiche simplement pas l'avancement */ }
    });
  }

  /** Lien de gestion à envoyer au responsable d'une équipe (surtout hors plateforme). */
  async partagerLienEquipe(p: CompetitionParticipantDTO): Promise<void> {
    this.http.get<{ token: string }>(
      `${environment.apiUrl}/competitions/${this.competition.id}/participants/${p.id}/lien-gestion`
    ).subscribe({
      next: async r => {
        const texte = `Gérez l'effectif de ${p.nomEquipe} (${this.competition.nom}) : `;
        const moyen = await partagerLien('Gestion de mon équipe', texte, urlApplication(`/equipe/${r.token}`));
        if (moyen === 'copie') this.messageLien.set('Lien copié : collez-le dans un message au responsable.');
      },
      error: err => this.messageLien.set(err?.error?.message ?? 'Lien indisponible')
    });
  }

  load(): void {
    this.chargerAvancement();
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
  return !['TERMINE', 'ANNULE'].includes(this.competition.statut as string)
      && this.hasPermission('GERER_COMPOSITIONS');
}

  // ── Actions participants ───────────────────────────────────
  valider(p: CompetitionParticipantDTO): void {
    const av = this.avancement()[p.id];
    if (av && (av.sousMinimum || av.nbFichesIncompletes > 0)) {
      // Information, pas un blocage : une équipe amateur complète souvent son effectif après validation
      const reste: string[] = [];
      if (av.sousMinimum) reste.push(`${av.nbJoueurs} joueur(s) sur ${av.effectifMin} visés`);
      if (av.nbFichesIncompletes > 0) reste.push(`${av.nbFichesIncompletes} fiche(s) à compléter`);
      if (!confirm(`${p.nomEquipe} : ${reste.join(', ')}.\n\nValider quand même ? L'équipe pourra compléter son effectif ensuite.`)) return;
    }
    this.api.validerInscription(this.competition.id, p.id)
      .subscribe(() => { this.load(); this.updated.emit(); });
  }

  // ── Refus d'une inscription : le motif est demandé (l'équipe le voit et peut corriger puis repostuler) ──
  refusCible = signal<CompetitionParticipantDTO | null>(null);
  motifRefus = '';
  readonly motifsRapides = ['Dossier incomplet', 'Effectif insuffisant', 'Compétition complète', 'Équipe déjà engagée', 'Informations non conformes'];

  rejeter(p: CompetitionParticipantDTO): void {
    this.motifRefus = '';
    this.refusCible.set(p);
  }

  confirmerRefus(): void {
    const p = this.refusCible();
    if (!p || this.motifRefus.trim().length < 3) return;
    this.api.rejeterInscription(this.competition.id, p.id, this.motifRefus.trim())
      .subscribe(() => { this.refusCible.set(null); this.load(); });
  }

  retirer(p: CompetitionParticipantDTO): void {
    if (!confirm(`Retirer "${p.nomEquipe}" de la compétition ?`)) return;
    this.api.retirerParticipant(this.competition.id, p.id)
      .subscribe(() => { this.load(); this.updated.emit(); });
  }

  // ── Helpers ───────────────────────────────────────────────
  hasPermission(perm: string): boolean {
    return this.permissions.includes('MODIFIER_CONFIG') // responsable
        || this.permissions.includes(perm);
  }

  canInscrire(): boolean {
    return ['BROUILLON', 'INSCRIPTION_OUVERTE'].includes(this.competition.statut)
        && this.hasPermission('MODIFIER_CONFIG');
  }

  canRetirer(p: CompetitionParticipantDTO): boolean {
    return p.statutInscription === StatutInscription.VALIDE
        && this.competition.statut !== 'EN_COURS' as any
        && this.hasPermission('MODIFIER_CONFIG');
  }

  canValiderRejeter(): boolean {
    return this.hasPermission('MODIFIER_CONFIG');
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
