import {
  Component, Input, OnInit, inject, signal, computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { CompetitionApiService } from '../../../../core/services/competition/competition-api.service';

type RoleCompetition =
  'RESPONSABLE' | 'SECRETAIRE' | 'ARBITRE' | 'MEDECIN' |
  'KINESITHERAPEUTE' | 'COMMISSAIRE' | 'DELEGUE' | 'OBSERVATEUR';

type Permission =
  'VOIR' | 'SAISIR_SCORES' | 'GERER_COMPOSITIONS' | 'VALIDER_FEUILLES' |
  'FICHES_MEDICALES' | 'GERER_OFFICIELS' | 'GERER_STAFF' | 'MODIFIER_CONFIG' |
  'ATTRIBUER_AWARDS' | 'GERER_PHASES' | 'PLANIFIER_MATCHS';

interface PermissionInfo {
  value:       Permission;
  label:       string;
  description: string;
  icone:       string;
}

interface AccesDTO {
  id:          number;
  userId:      number;
  username:    string;
  nomComplet:  string;
  photoUrl?:   string;
  role:        RoleCompetition;
  roleLabel:   string;
  permissions: Permission[];
  createdAt:   string;
}

@Component({
  selector:    'app-tab-acces',
  standalone:  true,
  imports:     [CommonModule, FormsModule, MatIconModule, TranslateModule],
  templateUrl: './tab-acces.component.html',
  styleUrls:   ['./tab-acces.component.scss']
})
export class TabAccesComponent implements OnInit {
  @Input() competition!: any;
  @Input() currentUserRole: string | null = null;

  private api = inject(CompetitionApiService);

  // ── State ──────────────────────────────────────────────────
  acces           = signal<AccesDTO[]>([]);
  loading         = signal(true);
  showModal       = signal(false);
  showPermModal   = signal(false);
  selectedAcces   = signal<AccesDTO | null>(null);
  saving          = signal(false);
  error           = signal<string | null>(null);

  // Formulaire invitation
  searchUser      = '';
  selectedRole    = signal<RoleCompetition>('SECRETAIRE');

  // Permissions disponibles
  allPermissions: PermissionInfo[] = [
    { value: 'VOIR',               label: 'Voir',                  icone: 'visibility',      description: 'Accès en lecture seule' },
    { value: 'SAISIR_SCORES',      label: 'Saisir scores',         icone: 'scoreboard',      description: 'Saisir résultats et événements' },
    { value: 'GERER_COMPOSITIONS', label: 'Compositions',          icone: 'people',          description: 'Gérer les titulaires et remplaçants' },
    { value: 'VALIDER_FEUILLES',   label: 'Valider feuilles',      icone: 'fact_check',      description: 'Validation officielle des feuilles' },
    { value: 'FICHES_MEDICALES',   label: 'Fiches médicales',      icone: 'medical_services',description: 'Accès aux données médicales' },
    { value: 'GERER_OFFICIELS',    label: 'Gérer officiels',       icone: 'sports',          description: 'Ajouter/retirer des officiels' },
    { value: 'PLANIFIER_MATCHS',   label: 'Planifier matchs',      icone: 'event',           description: 'Définir dates et stades' },
    { value: 'GERER_PHASES',       label: 'Gérer phases',          icone: 'account_tree',    description: 'Tirage et passage de phases' },
    { value: 'ATTRIBUER_AWARDS',   label: 'Palmarès',              icone: 'emoji_events',    description: 'Attribuer les distinctions' },
    { value: 'GERER_STAFF',        label: 'Gérer le staff',        icone: 'manage_accounts', description: 'Inviter et gérer les accès' },
    { value: 'MODIFIER_CONFIG',    label: 'Modifier config',       icone: 'settings',        description: 'Paramètres de la compétition' },
  ];

  // Permissions sélectionnées dans le modal
  permissionsSelectionnees = signal<Set<Permission>>(new Set());

  // Roles disponibles pour invitation
  roles = [
    { value: 'SECRETAIRE'     as RoleCompetition, label: 'Secrétaire',        icone: 'edit_note'        },
    { value: 'ARBITRE'        as RoleCompetition, label: 'Arbitre',            icone: 'sports'           },
    { value: 'MEDECIN'        as RoleCompetition, label: 'Médecin',            icone: 'medical_services' },
    { value: 'KINESITHERAPEUTE' as RoleCompetition, label: 'Kinésithérapeute', icone: 'healing'          },
    { value: 'COMMISSAIRE'    as RoleCompetition, label: 'Commissaire',        icone: 'gavel'            },
    { value: 'DELEGUE'        as RoleCompetition, label: 'Délégué',            icone: 'groups'           },
    { value: 'OBSERVATEUR'    as RoleCompetition, label: 'Observateur',        icone: 'visibility'       },
  ];

  // Permissions par défaut selon le rôle
  defaultPermissions: Record<RoleCompetition, Permission[]> = {
    RESPONSABLE:     ['VOIR','SAISIR_SCORES','GERER_COMPOSITIONS','VALIDER_FEUILLES',
                      'FICHES_MEDICALES','GERER_OFFICIELS','GERER_STAFF','MODIFIER_CONFIG',
                      'ATTRIBUER_AWARDS','GERER_PHASES','PLANIFIER_MATCHS'],
    SECRETAIRE:      ['VOIR','SAISIR_SCORES','GERER_COMPOSITIONS','GERER_OFFICIELS',
                      'ATTRIBUER_AWARDS','PLANIFIER_MATCHS'],
    ARBITRE:         ['VOIR','SAISIR_SCORES'],
    COMMISSAIRE:     ['VOIR','VALIDER_FEUILLES','SAISIR_SCORES'],
    MEDECIN:         ['VOIR','FICHES_MEDICALES'],
    KINESITHERAPEUTE:['VOIR','FICHES_MEDICALES'],
    DELEGUE:         ['VOIR'],
    OBSERVATEUR:     ['VOIR'],
  };

  // ── Grouper par rôle ──────────────────────────────────────
  accesParRole = computed(() => {
    const map = new Map<string, AccesDTO[]>();
    this.acces().forEach(a => {
      if (!map.has(a.role)) map.set(a.role, []);
      map.get(a.role)!.push(a);
    });
    return map;
  });

  ngOnInit(): void { this.charger(); }

  charger(): void {
    this.loading.set(true);
    this.api.listerAcces(this.competition.id).subscribe({
      next: a => { this.acces.set(a); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  isResponsable(): boolean {
    return this.currentUserRole === 'RESPONSABLE';
  }

  // ── Inviter ───────────────────────────────────────────────
  ouvrirModal(): void {
    this.showModal.set(true);
    this.searchUser = '';
    this.error.set(null);
    this.selectedRole.set('SECRETAIRE');
    // Pré-sélectionner les permissions par défaut
    this.permissionsSelectionnees.set(
      new Set(this.defaultPermissions['SECRETAIRE']));
  }

  onRoleChange(role: RoleCompetition): void {
    this.selectedRole.set(role);
    // Mettre à jour les permissions par défaut
    this.permissionsSelectionnees.set(
      new Set(this.defaultPermissions[role]));
  }

  togglePermission(perm: Permission): void {
    const set = new Set(this.permissionsSelectionnees());
    if (perm === 'VOIR') return; // VOIR toujours obligatoire
    if (set.has(perm)) set.delete(perm);
    else set.add(perm);
    this.permissionsSelectionnees.set(set);
  }

  hasPermission(perm: Permission): boolean {
    return this.permissionsSelectionnees().has(perm);
  }

  inviter(): void {
    if (!this.searchUser.trim()) return;
    this.saving.set(true);
    this.error.set(null);

    this.api.donnerAcces(this.competition.id, {
      username:    this.searchUser.trim(),
      role:        this.selectedRole(),
      permissions: Array.from(this.permissionsSelectionnees()),
    }).subscribe({
      next: () => { this.charger(); this.fermerModal(); this.saving.set(false); },
      error: err => {
        this.error.set(err?.error?.message ?? 'Utilisateur introuvable ou déjà invité');
        this.saving.set(false);
      }
    });
  }

  fermerModal(): void {
    this.showModal.set(false);
    this.error.set(null);
  }

  // ── Modifier permissions ──────────────────────────────────
  ouvrirPermissions(acces: AccesDTO): void {
    this.selectedAcces.set(acces);
    this.permissionsSelectionnees.set(new Set(acces.permissions));
    this.showPermModal.set(true);
  }

  sauvegarderPermissions(): void {
    const acces = this.selectedAcces();
    if (!acces) return;
    this.saving.set(true);

    this.api.modifierPermissions(
      this.competition.id,
      acces.id,
      Array.from(this.permissionsSelectionnees())
    ).subscribe({
      next: () => { this.charger(); this.fermerPermModal(); this.saving.set(false); },
      error: () => this.saving.set(false)
    });
  }

  reinitialiserPermissions(): void {
    const acces = this.selectedAcces();
    if (!acces) return;
    this.api.reinitialiserPermissions(this.competition.id, acces.id)
      .subscribe({
        next: () => { this.charger(); this.fermerPermModal(); },
      });
  }

  fermerPermModal(): void {
    this.showPermModal.set(false);
    this.selectedAcces.set(null);
  }

  // ── Révoquer ──────────────────────────────────────────────
  revoquer(acces: AccesDTO): void {
    if (!confirm(`Retirer l'accès de ${acces.nomComplet || acces.username} ?`)) return;
    this.api.revoquerAcces(this.competition.id, acces.id).subscribe({
      next: () => this.charger()
    });
  }

  permLabel(perm: string): string {
    const m: Record<string, string> = {
      VOIR:               'Voir',
      SAISIR_SCORES:      'Scores',
      GERER_COMPOSITIONS: 'Compos',
      VALIDER_FEUILLES:   'Feuilles',
      FICHES_MEDICALES:   'Médical',
      GERER_OFFICIELS:    'Officiels',
      PLANIFIER_MATCHS:   'Planning',
      GERER_PHASES:       'Phases',
      ATTRIBUER_AWARDS:   'Awards',
      GERER_STAFF:        'Staff',
      MODIFIER_CONFIG:    'Config',
    };
    return m[perm] ?? perm;
  }

  getInitials(name: string): string {
    return (name ?? '').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  }

  totalAcces(): number { return this.acces().length; }
}