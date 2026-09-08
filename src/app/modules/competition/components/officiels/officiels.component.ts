import {
  Component, Input, OnInit, inject, signal, computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { CompetitionApiService } from '../../../../core/services/competition/competition-api.service';

type TypeOfficiel =
  'ARBITRE_PRINCIPAL' | 'ARBITRE_ASSISTANT' | 'QUATRIEME_ARBITRE' |
  'ARBITRE_VIDEO' | 'COMMISSAIRE_MATCH' | 'DELEGUE_TECHNIQUE' |
  'MEDECIN_MATCH' | 'OBSERVATEUR_ARBITRE';

interface OfficielDTO {
  id:           number;
  userId?:      number;
  nom:          string;
  prenom?:      string;
  email?:       string;
  telephone?:   string;
  photoUrl?:    string;
  typeOfficiel: TypeOfficiel;
  typeLabel:    string;
  actif:        boolean;
  licenceNumero?: string;
  niveau?:      string;
  aCompteMyApp: boolean;
}

@Component({
  selector:    'app-officiels',
  standalone:  true,
  imports:     [CommonModule, FormsModule, ReactiveFormsModule,
                MatIconModule, TranslateModule],
  templateUrl: './officiels.component.html',
  styleUrls:   ['./officiels.component.scss']
})
export class OfficielsComponent implements OnInit {
  @Input() competition!: any;
  @Input() canEdit = false;

  private api = inject(CompetitionApiService);
  private fb  = inject(FormBuilder);

  // ── State ──────────────────────────────────────────────────
  officiels    = signal<OfficielDTO[]>([]);
  loading      = signal(true);
  showModal    = signal(false);
  saving       = signal(false);
  error        = signal<string | null>(null);

  // Mode recherche
  searchMode   = signal<'search' | 'create'>('search');
  searchQuery  = '';
  searchResults = signal<any[]>([]);
  searching    = signal(false);

  // Types d'officiels
  typeOptions: { value: TypeOfficiel; label: string; icone: string }[] = [
    { value: 'ARBITRE_PRINCIPAL',   label: 'Arbitre principal',    icone: 'sports' },
    { value: 'ARBITRE_ASSISTANT',   label: 'Arbitre assistant',    icone: 'sports' },
    { value: 'QUATRIEME_ARBITRE',   label: '4ème arbitre',         icone: 'sports' },
    { value: 'ARBITRE_VIDEO',       label: 'Arbitre vidéo (VAR)',   icone: 'videocam' },
    { value: 'COMMISSAIRE_MATCH',   label: 'Commissaire du match', icone: 'gavel' },
    { value: 'DELEGUE_TECHNIQUE',   label: 'Délégué technique',    icone: 'badge' },
    { value: 'MEDECIN_MATCH',       label: 'Médecin du match',     icone: 'medical_services' },
    { value: 'OBSERVATEUR_ARBITRE', label: 'Observateur arbitre',  icone: 'visibility' },
  ];

  // Formulaire création
  createForm = this.fb.group({
    nom:          ['', Validators.required],
    prenom:       [''],
    email:        ['', [Validators.required, Validators.email]],
    telephone:    [''],
    typeOfficiel: ['ARBITRE_PRINCIPAL', Validators.required],
    licenceNumero:[''],
    niveau:       [''],
    creerCompte:  [true],
  });

  typeSelectModal = signal<TypeOfficiel>('ARBITRE_PRINCIPAL');
  userSelectionne = signal<any | null>(null);

  // ── Grouper par type ──────────────────────────────────────
  officielsParType = computed(() => {
    const map = new Map<string, OfficielDTO[]>();
    this.officiels().forEach(o => {
      if (!map.has(o.typeLabel)) map.set(o.typeLabel, []);
      map.get(o.typeLabel)!.push(o);
    });
    return map;
  });

  typesPresents = computed(() => [...this.officielsParType().keys()]);

  // ── Init ──────────────────────────────────────────────────
  ngOnInit(): void { this.charger(); }

  charger(): void {
    this.loading.set(true);
    this.api.listerOfficiels(this.competition.id).subscribe({
      next: o => { this.officiels.set(o); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  // ── Rechercher un user My2-0 ──────────────────────────────
  rechercherUser(): void {
    if (!this.searchQuery.trim()) return;
    this.searching.set(true);
    this.searchResults.set([]);
    this.api.rechercherUser(this.searchQuery).subscribe({
      next: (users: any[]) => {
        this.searchResults.set(Array.isArray(users) ? users : [users]);
        this.searching.set(false);
      },
      error: () => { this.searching.set(false); this.searchResults.set([]); }
    });
  }

  selectionnerUser(user: any): void {
    this.userSelectionne.set(user);
  }

  // ── Ajouter officiel (user existant) ─────────────────────
  ajouterExistant(): void {
    if (!this.userSelectionne()) return;
    this.saving.set(true);
    this.api.ajouterOfficiel(this.competition.id, {
      userId:       this.userSelectionne().id,
      typeOfficiel: this.typeSelectModal(),
    }).subscribe({
      next: () => { this.charger(); this.fermerModal(); this.saving.set(false); },
      error: err => {
        this.error.set(err?.error?.message ?? 'Erreur lors de l\'ajout');
        this.saving.set(false);
      }
    });
  }

  // ── Créer un nouveau compte + officiel ────────────────────
  creerEtAjouter(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const v = this.createForm.value;
    this.api.ajouterOfficiel(this.competition.id, {
      ...v,
      typeOfficiel: this.typeSelectModal(),
      creerCompte: v.creerCompte ?? true,
    }).subscribe({
      next: () => { this.charger(); this.fermerModal(); this.saving.set(false); },
      error: err => {
        this.error.set(err?.error?.message ?? 'Erreur lors de la création');
        this.saving.set(false);
      }
    });
  }

  // ── Supprimer ─────────────────────────────────────────────
  supprimer(o: OfficielDTO): void {
    if (!confirm(`Retirer ${o.prenom ?? ''} ${o.nom} ?`)) return;
    this.api.supprimerOfficiel(this.competition.id, o.id).subscribe({
      next: () => this.charger()
    });
  }

  // ── Modal ─────────────────────────────────────────────────
  ouvrirModal(): void {
    this.showModal.set(true);
    this.searchMode.set('search');
    this.searchQuery = '';
    this.userSelectionne.set(null);
    this.searchResults.set([]);
    this.createForm.reset({ typeOfficiel: 'ARBITRE_PRINCIPAL', creerCompte: true });
    this.error.set(null);
  }

  fermerModal(): void {
    this.showModal.set(false);
    this.error.set(null);
  }

  // ── Helpers ───────────────────────────────────────────────
  getInitials(o: OfficielDTO): string {
    return ((o.prenom?.[0] ?? '') + (o.nom?.[0] ?? '')).toUpperCase();
  }

  getTypeIcon(type: TypeOfficiel): string {
    return this.typeOptions.find(t => t.value === type)?.icone ?? 'person';
  }

  isInvalid(field: string): boolean {
    const c = this.createForm.get(field);
    return !!(c?.invalid && c?.touched);
  }
}