import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

// Angular Material Imports
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

// Core Services & Models de ton application My2-0
import { Announcement, AnnouncementService } from '../../../../core/services/announcement.service';
import { GeneralService } from '../../../../core/services/general.service';
import { MembreEquipeApiService } from '../../../../core/services/competition/membre-equipe-api.service';
import { RoleCustomService } from '../../../../core/services/role-custom.service';
import { Equipe } from '../../../../core/models/groupe.model copy';
import { RoleCustom } from '../../../../core/models/role-custom.model';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-announcement-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatOptionModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: './announcement-admin.component.html',
  styleUrls: ['./announcement-admin.component.scss']
})
export class AnnouncementAdminComponent implements OnInit {
   currentGroupeId: number | null = null;

  announcements: Announcement[] = [];
  filteredAnnouncements: Announcement[] = [];
  equipes: Equipe[] = [];
  roles: RoleCustom[] = [];

  announcementForm!: FormGroup;
  showForm = false;
  isEditing = false;
  editingId: number | null = null;

  // Variables de filtrage de la barre d'actions
  searchTerm: string = '';
  selectedEquipe: number | 'all' = 'all';
  selectedRole: number | 'all' = 'all';

  constructor(
    private fb: FormBuilder,
    private announcementService: AnnouncementService,
    private generalService: GeneralService,
    private roleCustomService: RoleCustomService,
    private authService: AuthService
  ) {}

   ngOnInit(): void {
    this.initForm();
    this.currentGroupeId = this.authService.getGroupe();

    if (this.currentGroupeId) {
      this.loadAnnouncements();
      this.loadMetadata();
    
    }
  }

  initForm(): void {
    this.announcementForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      content: ['', [Validators.required, Validators.minLength(5)]],
      equipeId: [null],
      roleCible: [null]
    });
  }

  loadAnnouncements(): void {
    if (!this.currentGroupeId) return;
    this.announcementService.getByGroupe(this.currentGroupeId).subscribe({
      next: (data) => {
        this.announcements = data;
        this.filteredAnnouncements = [...data]; // ✅ initialisation
      },
      error: (err) => console.error('Erreur lors du chargement des actualités', err)
    });
  }

  loadMetadata(): void {
    // Chargement des équipes liées à la compétition / groupe
    this.generalService.getEquipesByGroupe().subscribe(eqs => this.equipes = eqs);
    // Chargement des rôles paramétrés dans le système (Joueur, Trésorier, etc.)
    this.roleCustomService.getRolesByGroupe().subscribe(rls => this.roles = rls);
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.announcementForm.reset();
      this.isEditing = false;
      this.editingId = null;
    }
  }

  submitAnnouncement(): void {
    if (this.announcementForm.invalid || !this.currentGroupeId) return;

    const announcementData: Announcement = this.announcementForm.value;
    if (this.isEditing && this.editingId) {
      this.announcementService.update(this.editingId, announcementData).subscribe({
        next: (updated) => {
          const index = this.announcements.findIndex(a => a.id === this.editingId);
          if (index !== -1) this.announcements[index] = updated;
          this.toggleForm();
        },
        error: (err) => console.error('Erreur lors de la modification', err)
      });
    } else {
      this.announcementService.create(this.currentGroupeId, announcementData).subscribe({
        next: (created) => {
          this.announcements.unshift(created);
          this.toggleForm();
          this.updateFilters();
        },
        error: (err) => console.error('Erreur lors de la création', err)
      });
    }
  }

  editAnnouncement(actu: Announcement): void {
    if (!actu.id) return;
    this.isEditing = true;
    this.editingId = actu.id;
    this.announcementForm.patchValue({
      title: actu.title,
      content: actu.content,
      equipeId: actu.equipeId,
      roleCible: actu.roleCible
    });
    this.showForm = true;
  }

  deleteAnnouncement(id: number | undefined): void {
    if (!id || !confirm('Voulez-vous vraiment supprimer cette actualité ?')) return;

    this.announcementService.delete(id).subscribe({
      next: () => {
        this.announcements = this.announcements.filter(a => a.id !== id);
        this.updateFilters();
      },
      error: (err) => console.error('Erreur suppression', err)
    });
  }

  applySearch(): void {
    this.updateFilters();
  }

  filterByEquipe(equipeId: number | 'all'): void {
    this.selectedEquipe = equipeId;
    this.updateFilters();
  }

  filterByRole(roleCode: number | 'all'): void {
    this.selectedRole = roleCode;
    this.updateFilters();
  }

  private updateFilters(): void {
    const term = this.searchTerm.toLowerCase();

    this.filteredAnnouncements = this.announcements.filter(a => {
      const matchesSearch = !term || a.title.toLowerCase().includes(term) || a.content.toLowerCase().includes(term);
      const matchesEquipe = this.selectedEquipe === 'all' || a.equipeId === this.selectedEquipe;
      const matchesRole = this.selectedRole === 'all' || a.roleCible === this.selectedRole;

      return matchesSearch && matchesEquipe && matchesRole;
    });
  }

  getTeamName(id: number): string {
    const eq = this.equipes.find(e => e.id === id);
    return eq ? eq.nom : `Équipe (#${id})`;
  }

   getRoleName(id: number): string {
    const eq = this.roles.find(e => e.id === id);
    return eq ? eq.nom : `Role (#${id})`;
  }
}