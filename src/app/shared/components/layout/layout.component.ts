import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators'; // Import nécessaire

import { AuthService } from '../../../core/services/auth.service';
import { RoleCustomService } from '../../../core/services/role-custom.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { ProfilEditComponent } from '../profil-edit/profil-edit.component';
import { Menu, MenuCategorie } from '../../../core/models/menu.model';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatSidenavModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    RouterModule,
    MatSelectModule,
    MatFormFieldModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule,
    NavbarComponent,
    TranslateModule
  ],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit, OnDestroy {
  @ViewChild('sidenav') sidenav!: MatSidenav;

  // Rôles et permissions
  isAdmin: boolean = false;
  isResponsable: boolean = false;
  isMembre: boolean = false;
  roles: string[] = [];
  selectedRole: string = '';

  // Menus dynamiques
  menuCategories: MenuCategorie[] = [];
  menusCommuns: Menu[] = []; // Menus accessibles à tous
  isLoadingMenus = false;
  
  // UI State
  user: any = null;
  userProfileImage: string | null = null;
  isMobile = false;
  sidebarOpen = true;
  currentGroupeId: number | null = null;
  isLoggedIn = false

  private menusSubscription?: Subscription;
  private groupeSubscription?: Subscription;
  private authStatusSubscription?: Subscription; // Nouvelle subscription

  constructor(
    public authService: AuthService,
    private roleCustomService: RoleCustomService,
    private router: Router,
    private dialog: MatDialog,
    private breakpointObserver: BreakpointObserver
  ) {}

  ngOnInit(): void {
    // 1. Logique statique/UI
    this.setupResponsiveLayout();
    this.loadMenusCommuns();

    // 2. Logique dépendante de l'état d'authentification (LE PLUS IMPORTANT)
    // Nous nous abonnons à l'état prêt pour garantir que les rôles sont chargés.
    this.authStatusSubscription = this.authService.isUserReady$
        .subscribe(isReady => {
            if (isReady && this.authService.isLoggedIn()) {
                // L'utilisateur est connecté et l'état est stable
                this.isLoggedIn = true;
                this.loadUserData(); // Charge l'utilisateur et son image
                this.setupRoles(); // Met à jour isResponsable, isAdmin, etc.

                // Charger les menus spécifiques maintenant que les rôles sont définis
                this.loadUserMenus(); 
                
                // S'abonner aux changements de groupe (doit être fait APRES que l'utilisateur soit chargé)
                this.setupGroupeSubscription();
            } else if (isReady && !this.authService.isLoggedIn()) {
                // L'état est stable, mais l'utilisateur est déconnecté
                this.isLoggedIn = false;
                this.resetUserSpecificState();
            }
        });
        
    // 3. S'abonner aux changements de menus (Laissé ici car il réagit à un service)
    this.menusSubscription = this.roleCustomService.userMenus$.subscribe(menus => {
      if (menus && menus.length > 0) {
        this.organiserMenusParCategorie(menus);
      } else {
        this.menuCategories = []; // Vider si le service émet null/vide
      }
    });
  }

  /**
   * Encapsule l'abonnement aux changements de groupe.
   */
  setupGroupeSubscription(): void {
    // Si la subscription existait déjà, on la nettoie pour éviter les doubles abonnements
    if (this.groupeSubscription) {
        this.groupeSubscription.unsubscribe();
    }
    
    this.groupeSubscription = this.authService.currentGroupeId$.subscribe(groupeId => {
        if (groupeId !== this.currentGroupeId) { // Vérifier si l'ID a réellement changé
            this.currentGroupeId = groupeId;
            // Recharger les menus si le groupe change
            if (this.isLoggedIn) {
                this.loadUserMenus();
            }
        }
    });
  }
  
  /**
   * Nettoie les états spécifiques à l'utilisateur lors de la déconnexion
   */
  resetUserSpecificState(): void {
    this.user = null;
    this.roles = [];
    this.isAdmin = false;
    this.isResponsable = false;
    this.isMembre = false;
    this.menuCategories = [];
    this.currentGroupeId = null;

    if (this.groupeSubscription) {
        this.groupeSubscription.unsubscribe();
        this.groupeSubscription = undefined;
    }
  }

  ngOnDestroy(): void {
    if (this.menusSubscription) {
      this.menusSubscription.unsubscribe();
    }
    if (this.groupeSubscription) {
      this.groupeSubscription.unsubscribe();
    }
    if (this.authStatusSubscription) { // Nettoyage du nouvel abonnement
      this.authStatusSubscription.unsubscribe();
    }
  }

  setupRoles(): void {
    // On met à jour les rôles à partir de l'état stable
    this.roles = this.authService.getRoles();
    
    // Réinitialisation des flags (important si l'utilisateur change de rôle ou si l'état change)
    this.isAdmin = false;
    this.isResponsable = false;
    this.isMembre = false;

    if (this.roles.includes('RESPONSABLE') || this.roles.includes('ROLE_RESPONSABLE')) {
      this.selectedRole = 'RESPONSABLE';
      this.isResponsable = true;
    } else if (this.roles.includes('ADMIN') || this.roles.includes('ROLE_ADMIN')) {
      this.selectedRole = 'ADMIN';
      this.isAdmin = true;
    } else if (this.roles.includes('MEMBRE') || this.roles.includes('ROLE_MEMBRE')) {
      this.selectedRole = 'MEMBRE';
      this.isMembre = true;
    }
  }

  setupResponsiveLayout(): void {
// ... (méthode non modifiée)
    this.breakpointObserver
      .observe([Breakpoints.Handset, Breakpoints.Tablet])
      .subscribe(result => {
        this.isMobile = result.matches;
        this.sidebarOpen = !this.isMobile;
        
        if (this.isMobile && this.sidenav) {
          this.sidenav.close();
        }
      });
  }

  loadUserData(): void {
    // Assurez-vous que getUser() lit bien les données stockées après l'initialisation asynchrone
    this.user = this.authService.getUser();
    this.userProfileImage = this.user?.profileImage || null;
  }

  /**
   * Charger les menus communs (accessibles à tous les utilisateurs connectés)
   */
  loadMenusCommuns(): void {
// ... (méthode non modifiée)
    this.menusCommuns = [
      {
        id: 1,
        code: 'EXPLORER',
        label: 'Explorer',
        icone: 'explore',
        route: '/explorer',
        description: 'Explorer les groupes',
        ordre: 1,
        actif: true,
        categorie: 'COMMUN'
      },
      {
        id: 2,
        code: 'MES_DEMANDES',
        label: 'Mes demandes',
        icone: 'inbox',
        route: '/mes-demandes',
        description: 'Mes demandes d\'adhésion',
        ordre: 2,
        actif: true,
        categorie: 'COMMUN'
      },
      {
        id: 3,
        code: 'ACTUALITES',
        label: 'Actualités',
        icone: 'newspaper',
        route: '/actualites',
        description: 'Fil d\'actualités',
        ordre: 3,
        actif: true,
        categorie: 'COMMUN'
      },
      {
        id: 4,
        code: 'CHAT',
        label: 'Messages',
        icone: 'chat',
        route: '/chat',
        description: 'Messagerie',
        ordre: 4,
        actif: true,
        categorie: 'COMMUN'
      }
      ,
      {
        id: 6,
        code: 'SUGGESTIONS',
        label: 'Suggestions',
        icone: 'newspaper',
        route: '/suggestions',
        description: 'Faites des suggestions',
        ordre: 6,
        actif: true,
        categorie: 'COMMUN'
      },
      ,
      {
        id: 5,
        code: 'OBJECTIFS',
        label: 'Objectifs',
        icone: 'newspaper',
        route: '/objectifs',
        description: 'Fixer vos objectifs',
        ordre: 5,
        actif: true,
        categorie: 'COMMUN'
      },
    ];
  }

  /**
   * Charger les menus de l'utilisateur pour le groupe actuel (si responsable)
   */
  loadUserMenus(): void {
    console.log("lodmenu", !this.isResponsable)
    // La vérification isLoggedIn() est faite par l'abonnement à isUserReady$
    
    if (!this.isResponsable) {
        this.menuCategories = []; // Important: vider les anciens menus
      return;
    }

//     const groupeId = this.authService.getGroupId();
// console.log("lodmenu", !this.isResponsable, groupeId)
    
//     if (!groupeId) {
//       this.menuCategories = [];
//       return;
//     }

    this.isLoadingMenus = true;

    this.roleCustomService.getUserMenus().subscribe({
      next: (userMenus) => {
        console.log("les menus", userMenus)
        this.organiserMenusParCategorie(userMenus.menus);
        this.isLoadingMenus = false;
      },
      error: (err) => {
        console.error('Erreur chargement menus:', err);
        this.menuCategories = [];
        this.isLoadingMenus = false;
      }
    });
   
  }

  /**
   * Organiser les menus par catégorie
   */
// ... (méthode non modifiée)
  organiserMenusParCategorie(menus: Menu[]): void {
    const categoriesMap = new Map<string, Menu[]>();

    menus.forEach(menu => {
      if (!categoriesMap.has(menu.categorie)) {
        categoriesMap.set(menu.categorie, []);
      }
      categoriesMap.get(menu.categorie)?.push(menu);
    });

    const categoriesConfig = {
      'GESTION': { label: 'Gestion', icone: 'settings' },
      'SPORT': { label: 'Sport', icone: 'sports_soccer' },
      'FINANCES': { label: 'Finances', icone: 'account_balance' },
      'COMMUNICATION': { label: 'Communication', icone: 'campaign' }
    };

    this.menuCategories = Array.from(categoriesMap.entries())
      .map(([code, menus]) => ({
        code,
        label: categoriesConfig[code as keyof typeof categoriesConfig]?.label || code,
        icone: categoriesConfig[code as keyof typeof categoriesConfig]?.icone || 'folder',
        menus: menus.sort((a, b) => a.ordre - b.ordre)
      }))
      .sort((a, b) => {
        const order = ['GESTION', 'SPORT', 'FINANCES', 'COMMUNICATION'];
        return order.indexOf(a.code) - order.indexOf(b.code);
      });
    console.log(this.menuCategories)
  }

  // ===== HELPERS POUR LE TRACKING (optimisation Angular) =====

  /**
   * TrackBy function pour les menus (optimisation Angular)
   */
  trackByMenuId(index: number, menu: Menu): any {
    return menu.id;
  }

  /**
   * TrackBy function pour les catégories (optimisation Angular)
   */
  trackByCategoryId(index: number, category: MenuCategorie): any {
    return category.code;
  }

  // ===== HELPERS POUR LES FONCTIONS D'UI =====

  /**
   * Obtenir la date actuelle
   */
  getCurrentDate(): Date {
    return new Date();
  }

  // Sidebar
  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
    
    if (this.sidenav) {
      this.sidenav.toggle();
    }
  }

  closeSidebar(): void {
    if (this.isMobile) {
      this.sidebarOpen = false;
      
      if (this.sidenav) {
        this.sidenav.close();
      }
    }
  }

  onNavClick(): void {
    this.closeSidebar();
  }

  // Profil
  openProfileEdit(): void {
    const dialogRef = this.dialog.open(ProfilEditComponent, {
      width: '400px',
      data: { user: this.user }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadUserData();
      }
    });
  }

  viewNotifications(): void {
    this.router.navigate(['/notifications']);
  }

  viewSettings(): void {
    this.router.navigate(['/settings']);
  }

  logout(): void {
    this.authService.logout();
    this.roleCustomService.clearUserMenus();
    this.router.navigate(['/']);
  }
}
