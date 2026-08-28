import {
  Component, Input, OnInit, inject, signal, computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';
import { CompetitionApiService } from '../../../../core/services/competition/competition-api.service';

type RoleCompetition =
  'RESPONSABLE' | 'SECRETAIRE' | 'ARBITRE' | 'MEDECIN' |
  'KINESITHERAPEUTE' | 'COMMISSAIRE' | 'DELEGUE' | 'OBSERVATEUR';

interface AccesDTO {
  id:            number;
  userId:        number;
  username:      string;
  nomComplet:    string;
  photoUrl?:     string;
  role:          RoleCompetition;
  roleLabel:     string;
  participantId?: number;
  nomEquipe?:    string;
  createdAt:     string;
}

interface RoleInfo {
  value:       RoleCompetition;
  label:       string;
  description: string;
  icone:       string;
  couleur:     string;
}

@Component({
  selector:    'app-tab-acces',
  standalone:  true,
  imports:     [CommonModule, FormsModule],
  templateUrl: './tab-acces.component.html',
  styleUrls:   ['./tab-acces.component.scss']
})
export class TabAccesComponent implements OnInit {
  @Input() competition!: any;
  @Input() currentUserRole: RoleCompetition | null = null;

  private api = inject(CompetitionApiService);

  // ── State ──────────────────────────────────────────────────
  acces        = signal<AccesDTO[]>([]);
  loading      = signal(true);
  showModal    = signal(false);
  saving       = signal(false);
  error        = signal<string | null>(null);

  // Formulaire invitation
  searchUser   = '';
  selectedRole = signal<RoleCompetition>('SECRETAIRE');
  selectedParticipantId = signal<number | null>(null);

  // ── Rôles disponibles ─────────────────────────────────────
  roles: RoleInfo[] = [
    {
      value: 'SECRETAIRE',
      label: 'Secrétaire',
      description: 'Saisie des matchs, compositions et événements',
      icone: 'edit_note',
      couleur: '#3b82f6'
    },
    {
      value: 'ARBITRE',
      label: 'Arbitre',
      description: 'Saisie de ses matchs assignés uniquement',
      icone: 'sports',
      couleur: '#f59e0b'
    },
    {
      value: 'MEDECIN',
      label: 'Médecin',
      description: 'Accès aux fiches médicales des joueurs',
      icone: 'medical_services',
      couleur: '#ef4444'
    },
    {
      value: 'KINESITHERAPEUTE',
      label: 'Kinésithérapeute',
      description: 'Accès aux fiches médicales des joueurs',
      icone: 'healing',
      couleur: '#ec4899'
    },
    {
      value: 'COMMISSAIRE',
      label: 'Commissaire',
      description: 'Validation des feuilles de match et réclamations',
      icone: 'gavel',
      couleur: '#8b5cf6'
    },
    {
      value: 'DELEGUE',
      label: 'Délégué d\'équipe',
      description: 'Représentant d\'une équipe — voir sa feuille',
      icone: 'groups',
      couleur: '#10b981'
    },
    {
      value: 'OBSERVATEUR',
      label: 'Observateur',
      description: 'Lecture seule sur toute la compétition',
      icone: 'visibility',
      couleur: '#6b7280'
    },
  ];

  // Grouper les accès par rôle pour l'affichage
  accesParRole = computed(() => {
    const map = new Map<string, AccesDTO[]>();
    this.acces().forEach(a => {
      if (!map.has(a.role)) map.set(a.role, []);
      map.get(a.role)!.push(a);
    });
    return map;
  });

  // ── Init ──────────────────────────────────────────────────
  ngOnInit(): void { this.charger(); }

  charger(): void {
    this.loading.set(true);
    this.api.listerAcces(this.competition.id).subscribe({
      next: a => { this.acces.set(a); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  // ── Permissions ───────────────────────────────────────────
  isResponsable(): boolean {
    return this.currentUserRole === 'RESPONSABLE';
  }

  getRoleInfo(role: RoleCompetition): RoleInfo | undefined {
    return this.roles.find(r => r.value === role);
  }

  // ── Inviter ───────────────────────────────────────────────
  ouvrirModal(): void {
    this.showModal.set(true);
    this.searchUser   = '';
    this.error.set(null);
    this.selectedRole.set('SECRETAIRE');
    this.selectedParticipantId.set(null);
  }

  fermerModal(): void {
    this.showModal.set(false);
    this.error.set(null);
  }

  inviter(): void {
    if (!this.searchUser.trim()) return;
    this.saving.set(true);
    this.error.set(null);

    const dto: any = {
      username: this.searchUser.trim(),
      email:    this.searchUser.includes('@') ? this.searchUser.trim() : undefined,
      role:     this.selectedRole(),
    };
    if (this.selectedRole() === 'DELEGUE' && this.selectedParticipantId())
      dto.participantId = this.selectedParticipantId();

    this.api.donnerAcces(this.competition.id, dto).subscribe({
      next: () => {
        this.charger();
        this.fermerModal();
        this.saving.set(false);
      },
      error: err => {
        this.error.set(err?.error?.message ?? 'Utilisateur introuvable ou déjà invité');
        this.saving.set(false);
      }
    });
  }

  // ── Révoquer ──────────────────────────────────────────────
  revoquer(acces: AccesDTO): void {
    if (!confirm(`Retirer l'accès de ${acces.nomComplet || acces.username} ?`)) return;
    this.api.revoquerAcces(this.competition.id, acces.id).subscribe({
      next: () => this.charger()
    });
  }

  getInitials(name: string): string {
    return (name ?? '').split(' ').map(w => w[0])
      .join('').substring(0, 2).toUpperCase();
  }

  totalAcces(): number { return this.acces().length; }
}