// src/app/modules/responsable/components/gestion-roles/gestion-roles.component.ts

import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatBadgeModule } from '@angular/material/badge';
;
import { finalize, Subject, takeUntil } from 'rxjs';
import { Menu, MenuCategorie } from '../../../../../core/models/menu.model';
import { RoleCustom, CreateRoleCustomDTO } from '../../../../../core/models/role-custom.model';
import { RoleCustomService } from '../../../../../core/services/role-custom.service';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../../../core/services/auth.service';
import { GroupeContextService } from '../../../../../core/services/groupe-context.service';

@Component({
  selector: 'app-gestion-roles',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatExpansionModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatSlideToggleModule,
    MatDialogModule,
    MatBadgeModule,
    TranslateModule
  ],
  templateUrl: './gestion-roles.component.html',
  styleUrl: './gestion-roles.component.scss'
})
export class GestionRolesComponent implements OnInit {
  roleForm: FormGroup;
  
  roles: RoleCustom[] = [];
  menus: Menu[] = [];
  menuCategories: MenuCategorie[] = [];
  
  groupeId!: number;
  isLoading = true;
  isSaving = false;
  showRoleForm = false;
  editingRole: RoleCustom | null = null;
  
  // Signals
  isDialogOpen = signal(false);
  selectedMenuIds = signal<number[]>([]);
  private destroy$ = new Subject<void>();

  // Couleurs prédéfinies pour les rôles
  couleursPredefinies = [
    { nom: 'Rouge', valeur: '#d32f2f' },
    { nom: 'Rose', valeur: '#c2185b' },
    { nom: 'Violet', valeur: '#7b1fa2' },
    { nom: 'Indigo', valeur: '#303f9f' },
    { nom: 'Bleu', valeur: '#1976d2' },
    { nom: 'Cyan', valeur: '#0097a7' },
    { nom: 'Vert', valeur: '#388e3c' },
    { nom: 'Orange', valeur: '#f57c00' },
    { nom: 'Marron', valeur: '#5d4037' },
    { nom: 'Gris', valeur: '#616161' }
  ];

  // Icônes prédéfinies pour les rôles
  iconesPredefinies = [
    'stars', 'badge', 'verified', 'workspace_premium', 'military_tech',
    'shield', 'security', 'admin_panel_settings', 'account_balance',
    'sports_soccer', 'sports', 'fitness_center', 'edit_note',
    'mail', 'campaign', 'handshake', 'group_add'
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private roleCustomService: RoleCustomService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private authService: AuthService,
private groupeContext: GroupeContextService
  ) {
    this.roleForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      couleur: ['#1976d2', Validators.required],
      icone: ['badge', Validators.required],
      niveau: [10, [Validators.required, Validators.min(0)]],
      menuIds: [[], Validators.required]
    });
  }

ngOnInit(): void {
  // FIX 1 : utiliser le groupe actif au lieu de la route
  // this.groupeId = +this.route.snapshot.params['id']; ← SUPPRIMER
  this.groupeId = this.authService.getGroupe() ?? 0;
 
  this.loadData();
 
  // FIX 3 : recharger au switch de groupe
  this.groupeContext.groupeChanged$
    .pipe(takeUntil(this.destroy$))
    .subscribe((newGroupeId) => {
      this.groupeId = newGroupeId;
      this.loadData();
    });
}

  ngOnDestroy(): void {
  this.destroy$.next();
  this.destroy$.complete();
}

  loadData(): void {
    this.isLoading = true;

    // Charger les menus et les rôles en parallèle
    Promise.all([
      this.roleCustomService.getAllMenus().toPromise(),
      this.roleCustomService.getRolesByGroupe().toPromise()
    ]).then(([menus, roles]) => {
      this.menus = menus || [];
      this.roles = roles || [];
      this.organiserMenusParCategorie();
      this.isLoading = false;
    }).catch(err => {
      console.error('Erreur chargement données:', err);
      this.snackBar.open('Erreur lors du chargement', 'Fermer', { duration: 3000 });
      this.isLoading = false;
    });
  }

  organiserMenusParCategorie(): void {
    const categoriesMap = new Map<string, Menu[]>();

    this.menus.forEach(menu => {
      if (!categoriesMap.has(menu.categorie)) {
        categoriesMap.set(menu.categorie, []);
      }
      categoriesMap.get(menu.categorie)?.push(menu);
    });

    this.menuCategories = [
      {
        code: 'GESTION',
        label: 'Gestion',
        icone: 'settings',
        menus: categoriesMap.get('GESTION') || []
      },
      {
        code: 'SPORT',
        label: 'Sport',
        icone: 'sports_soccer',
        menus: categoriesMap.get('SPORT') || []
      },
      {
        code: 'FINANCES',
        label: 'Finances',
        icone: 'account_balance',
        menus: categoriesMap.get('FINANCES') || []
      },
      {
        code: 'COMMUNICATION',
        label: 'Communication',
        icone: 'campaign',
        menus: categoriesMap.get('COMMUNICATION') || []
      }
    ].filter(cat => cat.menus.length > 0);
  }

  openRoleForm(): void {
    this.showRoleForm = true;
    this.editingRole = null;
    this.roleForm.reset({
      couleur: '#1976d2',
      icone: 'badge',
      niveau: 10,
      menuIds: []
    });
    this.selectedMenuIds.set([]);
  }

  editRole(role: RoleCustom): void {
    if (role.systeme) {
      this.snackBar.open('Les rôles système ne peuvent pas être modifiés', 'Fermer', { duration: 3000 });
      return;
    }

    this.showRoleForm = true;
    this.editingRole = role;
    
    const menuIds = role.menus.map(m => m.id);
    this.selectedMenuIds.set(menuIds);
    
    this.roleForm.patchValue({
      nom: role.nom,
      description: role.description,
      couleur: role.couleur,
      icone: role.icone,
      niveau: role.niveau,
      menuIds: menuIds
    });
  }

  closeRoleForm(): void {
    this.showRoleForm = false;
    this.editingRole = null;
    this.roleForm.reset();
    this.selectedMenuIds.set([]);
  }

  toggleMenu(menuId: number): void {
    const currentIds = this.selectedMenuIds();
    const index = currentIds.indexOf(menuId);
    
    if (index > -1) {
      // Retirer le menu
      const newIds = currentIds.filter(id => id !== menuId);
      this.selectedMenuIds.set(newIds);
    } else {
      // Ajouter le menu
      this.selectedMenuIds.set([...currentIds, menuId]);
    }
    
    this.roleForm.patchValue({ menuIds: this.selectedMenuIds() });
  }

  isMenuSelected(menuId: number): boolean {
    return this.selectedMenuIds().includes(menuId);
  }

  selectAllMenusInCategory(categorie: MenuCategorie): void {
    const categoryMenuIds = categorie.menus.map(m => m.id);
    const currentIds = this.selectedMenuIds();
    
    // Vérifier si tous les menus de la catégorie sont déjà sélectionnés
    const allSelected = categoryMenuIds.every(id => currentIds.includes(id));
    
    if (allSelected) {
      // Désélectionner tous les menus de la catégorie
      const newIds = currentIds.filter(id => !categoryMenuIds.includes(id));
      this.selectedMenuIds.set(newIds);
    } else {
      // Sélectionner tous les menus de la catégorie
      const newIds = [...new Set([...currentIds, ...categoryMenuIds])];
      this.selectedMenuIds.set(newIds);
    }
    
    this.roleForm.patchValue({ menuIds: this.selectedMenuIds() });
  }

  isCategoryFullySelected(categorie: MenuCategorie): boolean {
    const categoryMenuIds = categorie.menus.map(m => m.id);
    return categoryMenuIds.every(id => this.isMenuSelected(id));
  }

  isCategoryPartiallySelected(categorie: MenuCategorie): boolean {
    const categoryMenuIds = categorie.menus.map(m => m.id);
    const selectedCount = categoryMenuIds.filter(id => this.isMenuSelected(id)).length;
    return selectedCount > 0 && selectedCount < categoryMenuIds.length;
  }

  saveRole(): void {
    if (this.roleForm.invalid) {
      this.snackBar.open('Veuillez remplir tous les champs requis', 'Fermer', { duration: 3000 });
      return;
    }

    if (this.selectedMenuIds().length === 0) {
      this.snackBar.open('Veuillez sélectionner au moins un menu', 'Fermer', { duration: 3000 });
      return;
    }

    this.isSaving = true;

    const dto: CreateRoleCustomDTO = {
      ...this.roleForm.value,
      menuIds: this.selectedMenuIds()
    };

    const operation = this.editingRole
      ? this.roleCustomService.updateRole(this.editingRole.id, dto)
      : this.roleCustomService.createRole(dto);

    operation.pipe(
      finalize(() => this.isSaving = false)
    ).subscribe({
      next: () => {
        this.snackBar.open(
          this.editingRole ? 'Rôle mis à jour !' : 'Rôle créé avec succès !',
          'Fermer',
          { duration: 3000 }
        );
        this.loadData();
        this.closeRoleForm();
      },
      error: (err) => {
        console.error('Erreur sauvegarde rôle:', err);
        this.snackBar.open(
          err.error?.message || 'Erreur lors de la sauvegarde',
          'Fermer',
          { duration: 3000 }
        );
      }
    });
  }

  deleteRole(role: RoleCustom): void {
    if (role.systeme) {
      this.snackBar.open('Les rôles système ne peuvent pas être supprimés', 'Fermer', { duration: 3000 });
      return;
    }

    if (role.nombreMembres > 0) {
      this.snackBar.open(
        `Impossible de supprimer ce rôle car ${role.nombreMembres} membre(s) l'utilisent`,
        'Fermer',
        { duration: 4000 }
      );
      return;
    }

    if (!confirm(`Voulez-vous vraiment supprimer le rôle "${role.nom}" ?`)) {
      return;
    }

    this.roleCustomService.deleteRole(role.id).subscribe({
      next: () => {
        this.snackBar.open('Rôle supprimé !', 'Fermer', { duration: 3000 });
        this.loadData();
      },
      error: (err) => {
        console.error('Erreur suppression rôle:', err);
        this.snackBar.open(
          err.error?.message || 'Erreur lors de la suppression',
          'Fermer',
          { duration: 3000 }
        );
      }
    });
  }

  toggleRoleStatus(role: RoleCustom): void {
    if (role.systeme) {
      this.snackBar.open('Les rôles système ne peuvent pas être désactivés', 'Fermer', { duration: 3000 });
      return;
    }

    this.roleCustomService.toggleRoleStatus(role.id).subscribe({
      next: () => {
        this.snackBar.open(
          role.actif ? 'Rôle désactivé' : 'Rôle activé',
          'Fermer',
          { duration: 3000 }
        );
        this.loadData();
      },
      error: (err) => {
        console.error('Erreur toggle status:', err);
        this.snackBar.open('Erreur lors de la modification', 'Fermer', { duration: 3000 });
      }
    });
  }

  createDefaultRoles(): void {
    if (!confirm('Voulez-vous créer les rôles par défaut ? (Président, Trésorier, Capitaine, Secrétaire)')) {
      return;
    }

    this.roleCustomService.createDefaultRoles(this.groupeId).subscribe({
      next: () => {
        this.snackBar.open('Rôles par défaut créés avec succès !', 'Fermer', { duration: 3000 });
        this.loadData();
      },
      error: (err) => {
        console.error('Erreur création rôles par défaut:', err);
        this.snackBar.open(
          err.error?.message || 'Erreur lors de la création',
          'Fermer',
          { duration: 3000 }
        );
      }
    });
  }

  duplicateRole(role: RoleCustom): void {
    this.showRoleForm = true;
    this.editingRole = null;
    
    const menuIds = role.menus.map(m => m.id);
    this.selectedMenuIds.set(menuIds);
    
    this.roleForm.patchValue({
      nom: `${role.nom} (copie)`,
      description: role.description,
      couleur: role.couleur,
      icone: role.icone,
      niveau: role.niveau + 1,
      menuIds: menuIds
    });
  }

  getRolesByNiveau(): RoleCustom[][] {
    const grouped = new Map<number, RoleCustom[]>();
    
    this.roles.forEach(role => {
      if (!grouped.has(role.niveau)) {
        grouped.set(role.niveau, []);
      }
      grouped.get(role.niveau)?.push(role);
    });

    return Array.from(grouped.values());
  }
}