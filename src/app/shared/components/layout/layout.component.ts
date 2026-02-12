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
import { OnboardingService } from '../../../core/services/onboarding.service';

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
  
  // ✅ État du groupe utilisateur
  userHasGroup: boolean = false;

  // Menus dynamiques
  menuCategories: MenuCategorie[] = [];
  menusCommuns: Menu[] = [];
  isLoadingMenus = false;
  
  // UI State
  user: any = null;
  userProfileImage: string | null = null;
  isMobile = false;
  sidebarOpen = true;
  currentGroupeId: number | null = null;
  isLoggedIn = false;

  private menusSubscription?: Subscription;
  private groupeSubscription?: Subscription;
  private authStatusSubscription?: Subscription;

  constructor(
    public authService: AuthService,
    private roleCustomService: RoleCustomService,
    private router: Router,
    private dialog: MatDialog,
    private breakpointObserver: BreakpointObserver,
    public onboardingService: OnboardingService
  ) {}

  ngOnInit(): void {
    
    this.setupResponsiveLayout();

    // Logique dépendante de l'état d'authentification
   this.authStatusSubscription = this.authService.isUserReady$
    .subscribe(isReady => {
      if (isReady && this.authService.isLoggedIn()) {
        this.isLoggedIn = true;
        this.loadUserData();
        this.setupRoles();
        
        // --- NOUVELLE LOGIQUE DE SURVEILLANCE DU GROUPE ---
        this.authService.currentGroupeId$.subscribe(groupId => {
          this.userHasGroup = !!groupId; 
          
          // On recharge tout dès que le groupId change (passe de null à un ID)
          this.loadMenusCommuns(); 
          this.loadUserMenus();    // Relance l'appel API vers /user-menus
        });
        // --------------------------------------------------

      } else if (isReady && !this.authService.isLoggedIn()) {
        this.isLoggedIn = false;
        this.resetUserSpecificState();
      }
    });

    // S'abonner aux changements de menus
    this.menusSubscription = this.roleCustomService.userMenus$.subscribe(menus => {
      if (menus && menus.length > 0) {
        this.organiserMenusParCategorie(menus);
      } else {
        this.menuCategories = [];
      }
    });
    this.checkOnboardingStatus();
  }

  private checkOnboardingStatus(): void {
  // On récupère l'étape actuelle
  const currentStep = this.onboardingService.getStep();

  // Si on est encore à l'étape "Créer compte" alors qu'on est déjà dans le layout (donc connecté)
  // Ou si c'est une nouvelle connexion
  if (currentStep === 'CREATE_ACCOUNT' || currentStep === 'NONE') {
    if (this.isMobile) {
      this.onboardingService.setStep('OPEN_MENU');
    } else {
      this.onboardingService.setStep('CREATE_GROUPE');
    }
  }
}

stopOnboarding(event: Event): void {
  event.preventDefault();
  event.stopPropagation(); // Empêche de cliquer sur le lien du menu derrière
  this.onboardingService.stopTemporarily(); 
  // Ou this.onboardingService.complete(); si tu ne veux plus jamais la voir
}

  /**
   * ✅ Vérifier si l'utilisateur appartient à un groupe
   */
  checkUserGroupStatus(): void {
    const groupe = this.authService.getGroupe();
    this.userHasGroup = groupe !== null && groupe !== undefined;
    console.log('User has group:', this.userHasGroup, groupe);
  }

  /**
   * Encapsule l'abonnement aux changements de groupe.
   */
  setupGroupeSubscription(): void {
    if (this.groupeSubscription) {
      this.groupeSubscription.unsubscribe();
    }
    
    this.groupeSubscription = this.authService.currentGroupeId$.subscribe(groupeId => {
      if (groupeId !== this.currentGroupeId) {
        this.currentGroupeId = groupeId;
        
        // ✅ Mettre à jour l'état du groupe et recharger les menus
        this.checkUserGroupStatus();
        this.loadMenusCommuns();
        
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
    this.userHasGroup = false; // ✅ Reset
    this.menuCategories = [];
    this.menusCommuns = [];
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
    if (this.authStatusSubscription) {
      this.authStatusSubscription.unsubscribe();
    }
  }

  setupRoles(): void {
    this.roles = this.authService.getRoles();
    
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
   * ✅ Charger les menus communs avec logique conditionnelle
   */
  loadMenusCommuns(): void {
    // Menus toujours visibles
    const baseMenus: Menu[] = [
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
        id: 5,
        code: 'SUGGESTIONS',
        label: 'Suggestions',
        icone: 'lightbulb',
        route: '/suggestions',
        description: 'Faites des suggestions',
        ordre: 6,
        actif: true,
        categorie: 'COMMUN'
      }
    ];

    // ✅ Menu "Créer un groupe" - seulement si l'utilisateur N'A PAS de groupe
    if (!this.userHasGroup) {
      baseMenus.push({
        id: 6,
        code: 'CREATEG',
        label: 'Créer un groupe',
        icone: 'group_add',
        route: '/creategroup',
        description: 'Envoyez une demande de création de groupe',
        ordre: 2,
        actif: true,
        categorie: 'COMMUN'
      });
    }

    // ✅ Menus visibles seulement si l'utilisateur A un groupe
    if (this.userHasGroup) {
      baseMenus.push(
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
          code: 'OBJECTIFS',
          label: 'Objectifs',
          icone: 'flag',
          route: '/objectifs',
          description: 'Fixer vos objectifs',
          ordre: 5,
          actif: true,
          categorie: 'COMMUN'
        }
      );
    }

    // Trier par ordre
    this.menusCommuns = baseMenus.sort((a, b) => a.ordre - b.ordre);
    
    console.log('Menus communs chargés:', this.menusCommuns.map(m => m.code));
  }

  /**
   * Charger les menus de l'utilisateur pour le groupe actuel (si responsable)
   */
  loadUserMenus(): void {
    if (!this.isResponsable) {
      this.menuCategories = [];
      return;
    }

    this.isLoadingMenus = true;

    this.roleCustomService.getUserMenus().subscribe({
      next: (userMenus) => {
        console.log('Les menus:', userMenus);
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

  // ===== HELPERS POUR LE TRACKING =====

  trackByMenuId(index: number, menu: Menu): any {
    return menu.id;
  }

  trackByCategoryId(index: number, category: MenuCategorie): any {
    return category.code;
  }

  // ===== HELPERS POUR LES FONCTIONS D'UI =====

  getCurrentDate(): Date {
    return new Date();
  }

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

  onNavClick(menuCode: string): void {
    this.closeSidebar();
    // Si on clique sur le bouton mis en évidence, on avance l'onboarding
  if (menuCode === 'CREATEG' && this.onboardingService.getStep() === 'CREATE_GROUPE') {
    // On peut soit laisser l'étape telle quelle jusqu'à la réussite du formulaire
    // soit marquer une étape intermédiaire.
  }
  }

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