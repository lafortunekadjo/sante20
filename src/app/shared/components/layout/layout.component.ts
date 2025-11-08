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

  constructor(
    public authService: AuthService,
    private roleCustomService: RoleCustomService,
    private router: Router,
    private dialog: MatDialog,
    private breakpointObserver: BreakpointObserver
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.setupRoles();
    this.setupResponsiveLayout();
    this.loadMenusCommuns();
    this.loadUserMenus();

    // S'abonner aux changements de groupe
    this.groupeSubscription = this.authService.currentGroupeId$.subscribe(groupeId => {
      if (groupeId && groupeId !== this.currentGroupeId) {
        this.currentGroupeId = groupeId;
        this.loadUserMenus();
      }
    });

    // S'abonner aux changements de menus
    this.menusSubscription = this.roleCustomService.userMenus$.subscribe(menus => {
      if (menus && menus.length > 0) {
        this.organiserMenusParCategorie(menus);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.menusSubscription) {
      this.menusSubscription.unsubscribe();
    }
    if (this.groupeSubscription) {
      this.groupeSubscription.unsubscribe();
    }
  }

  setupRoles(): void {
    this.roles = this.authService.getRoles();
    
    if (this.roles.includes('ROLE_RESPONSABLE') || this.roles.includes('RESPONSABLE')) {
      this.selectedRole = 'RESPONSABLE';
      this.isResponsable = true;
    } else if (this.roles.includes('ROLE_ADMIN') || this.roles.includes('ADMIN')) {
      this.selectedRole = 'ADMIN';
      this.isAdmin = true;
    } else if (this.roles.includes('ROLE_MEMBRE') || this.roles.includes('MEMBRE')) {
      this.selectedRole = 'MEMBRE';
      this.isMembre = true;
    }
  }

  setupResponsiveLayout(): void {
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
    this.user = this.authService.getUser();
    this.userProfileImage = this.user?.profileImage || null;
  }

  /**
   * Charger les menus communs (accessibles à tous les utilisateurs connectés)
   */
  loadMenusCommuns(): void {
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
    ];
  }

  /**
   * Charger les menus de l'utilisateur pour le groupe actuel (si responsable)
   */
  loadUserMenus(): void {
    if(this.authService.isLoggedIn()){
       if (!this.isResponsable) {
      return;
    }

    const groupeId = this.authService.getCurrentGroupeId();
    
    if (!groupeId) {
      this.menuCategories = [];
      return;
    }

    this.isLoadingMenus = true;

    this.roleCustomService.getUserMenus(groupeId).subscribe({
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
   
  }

  /**
   * Organiser les menus par catégorie
   */
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