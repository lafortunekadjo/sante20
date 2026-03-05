// ============================================================
// LAYOUT COMPONENT - AVEC INTÉGRATION PUBLICITÉS
// ============================================================

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
import { Subscription, distinctUntilChanged, skip } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { RoleCustomService } from '../../../core/services/role-custom.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { ProfilEditComponent } from '../profil-edit/profil-edit.component';
import { Menu, MenuCategorie } from '../../../core/models/menu.model';
import { TranslateModule } from '@ngx-translate/core';
import { OnboardingService } from '../../../core/services/onboarding.service';
import { PubliciteAffichageService } from '../../../core/services/publicite-affichage.service';
import { PubliciteBannerComponent } from '../../../modules/publicite/publicite-banner/publicite-banner.component';
import { PubliciteSidebarComponent } from '../../../modules/publicite/publicite-sidebar/publicite-sidebar.component';
import { PubliciteSplashComponent } from '../../../modules/publicite/publicite-splash/publicite-splash.component';
import { SplashScreenService } from '../../../core/services/splash-screen.service';






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
    TranslateModule,
    // ✅ COMPOSANTS PUBLICITÉ
    PubliciteSplashComponent,
    PubliciteBannerComponent,
  ],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit, OnDestroy {
  @ViewChild('sidenav') sidenav!: MatSidenav;

  // Rôles et permissions
  isAdmin: boolean = false;
  isPartenaire: boolean = false;
  isResponsable: boolean = false;
  isMembre: boolean = false;
  roles: string[] = [];
  selectedRole: string = '';
  
  // État du groupe utilisateur
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

  // ✅ PUBLICITÉS - Ville pour ciblage
  userVille: string | undefined;

  private menusSubscription?: Subscription;
  private groupeSubscription?: Subscription;
  private authStatusSubscription?: Subscription;
  private menuRefreshSubscription?: Subscription;

  constructor(
    public authService: AuthService,
    private roleCustomService: RoleCustomService,
    private router: Router,
    private dialog: MatDialog,
    private breakpointObserver: BreakpointObserver,
    public onboardingService: OnboardingService,
    private publiciteService: PubliciteAffichageService, // ✅ INJECTION SERVICE PUB
    private splashService: SplashScreenService
  ) {}

  ngOnInit(): void {
    this.setupResponsiveLayout();

    this.authStatusSubscription = this.authService.isUserReady$.subscribe(isReady => {
      if (isReady && this.authService.isLoggedIn()) {
        this.isLoggedIn = true;
        this.loadUserData();
        this.setupRoles();
        this.updateGroupStatus();
        this.loadMenusCommuns();
        this.loadUserMenus();
        this.setupGroupeSubscription();
        
        // ✅ PUBLICITÉS - Récupérer la ville de l'utilisateur et afficher splash
        this.setupPublicites();
      } else if (isReady && !this.authService.isLoggedIn()) {
        this.isLoggedIn = false;
        this.resetUserSpecificState();
      }
    });

    this.menuRefreshSubscription = this.authService.forceMenuRefresh$.pipe(
      skip(1),
      distinctUntilChanged()
    ).subscribe(() => {
      console.log('[LayoutComponent] Signal de refresh reçu');
      this.setupRoles();
      this.updateGroupStatus();
      this.loadMenusCommuns();
      this.loadUserMenus();
    });

    this.menusSubscription = this.roleCustomService.userMenus$.subscribe(menus => {
      if (menus && menus.length > 0) {
        this.organiserMenusParCategorie(menus);
      } else {
        this.menuCategories = [];
      }
    });

    this.checkOnboardingStatus();
  }

  // ✅ NOUVELLE MÉTHODE - Configuration des publicités
  // private setupPublicites(): void {
  //   // Récupérer la ville depuis le profil utilisateur ou le groupe
  //   const user = this.authService.getUser();
  //   this.userVille = user?.ville || user?.groupe?.ville;
    
  //   // Afficher le splash screen (une fois par jour)
  //   setTimeout(() => {
  //     this.publiciteService.showSplash();
  //   }, 1000); // Délai pour laisser la page se charger
  // }

  // private setupPublicites(): void {
  //   const userVille = this.authService.getUser()?.ville || '';
    
  //   // // Splash au login (1x/jour)
  //   // this.splashService.checkAndShowLoginSplash(userVille);
    
  //   // // Splash après 10 min (1x/session)
  //   // this.splashService.startUsageTimer(10, userVille);
  // }


  private updateGroupStatus(): void {
    const groupeId = this.authService.getGroupe();
    this.userHasGroup = groupeId !== null && groupeId !== undefined && groupeId > 0;
    this.currentGroupeId = groupeId;
    console.log('[LayoutComponent] userHasGroup:', this.userHasGroup, 'groupeId:', groupeId);
  }

  setupRoles(): void {
    this.roles = this.authService.getRoles();
    
    console.log('[LayoutComponent] setupRoles - Rôles:', this.roles);
    
    this.isAdmin = false;
    this.isResponsable = false;
    this.isMembre = false;

    if (this.roles.includes('RESPONSABLE') || this.roles.includes('ROLE_RESPONSABLE')) {
      this.selectedRole = 'RESPONSABLE';
      this.isResponsable = true;
    } else if (this.roles.includes('ADMIN') || this.roles.includes('ROLE_ADMIN')) {
      this.selectedRole = 'ADMIN';
      this.isAdmin = true;
    } else if (this.roles.includes('PARTENAIRE') || this.roles.includes('ROLE_PARTENAIRE')) {
      this.selectedRole = 'PARTENAIRE';
      this.isPartenaire = true;
    } else if (this.roles.includes('MEMBRE') || this.roles.includes('ROLE_MEMBRE')) {
      this.selectedRole = 'MEMBRE';
      this.isMembre = true;
    }
    

  }

  setupGroupeSubscription(): void {
    if (this.groupeSubscription) {
      this.groupeSubscription.unsubscribe();
    }
    
    this.groupeSubscription = this.authService.currentGroupeId$.pipe(
      distinctUntilChanged()
    ).subscribe(groupeId => {
      console.log('[LayoutComponent] currentGroupeId$ changé:', groupeId);
      
      if (groupeId !== this.currentGroupeId) {
        this.currentGroupeId = groupeId;
        this.userHasGroup = !!groupeId && groupeId > 0;
        
        this.loadMenusCommuns();
        
        if (this.isLoggedIn && this.isResponsable) {
          this.loadUserMenus();
        }
      }
    });
  }

  private checkOnboardingStatus(): void {
    const currentStep = this.onboardingService.getStep();
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
    event.stopPropagation();
    this.onboardingService.stopTemporarily();
  }

  resetUserSpecificState(): void {
    this.user = null;
    this.roles = [];
    this.isAdmin = false;
    this.isResponsable = false;
    this.isPartenaire = false;
    this.isMembre = false;
    this.userHasGroup = false;
    this.menuCategories = [];
    this.menusCommuns = [];
    this.currentGroupeId = null;
    this.userVille = undefined; // ✅ Reset ville

    this.groupeSubscription?.unsubscribe();
    this.groupeSubscription = undefined;
  }

  ngOnDestroy(): void {
    this.menusSubscription?.unsubscribe();
    this.groupeSubscription?.unsubscribe();
    this.authStatusSubscription?.unsubscribe();
    this.menuRefreshSubscription?.unsubscribe();
    // this.splashService.cancelUsageTimer();
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

  loadMenusCommuns(): void {
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
      },
         {
        id: 11,
        code: 'INV',
        label: 'Invitation a rejoindre',
        icone: 'lightbulb',
        route: '/responsable/invitations',
        description: 'Envoyez des invitations a rejoindre le groupe',
        ordre: 6,
        actif: true,
        categorie: 'COMMUN'
      }
    ];

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

    if (this.userHasGroup) {
      baseMenus.push(
        {
          id: 10,
          code: 'TB',
          label: 'Tableau de bord',
          icone: 'newspaper',
          route: '/membre',
          description: 'Tableau de bord du membre',
          ordre: 1,
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

    this.menusCommuns = baseMenus.sort((a, b) => a.ordre - b.ordre);
    console.log('[LayoutComponent] Menus communs chargés:', this.menusCommuns.map(m => m.code));
  }

  loadUserMenus(): void {
    console.log('[LayoutComponent] loadUserMenus - isResponsable:', this.isResponsable, 'userHasGroup:', this.userHasGroup);
    
    if (!this.isResponsable) {
      console.log('[LayoutComponent] Pas responsable, skip loadUserMenus');
      this.menuCategories = [];
      return;
    }

    if (!this.userHasGroup) {
      console.log('[LayoutComponent] Pas de groupe, skip loadUserMenus');
      this.menuCategories = [];
      return;
    }

    this.isLoadingMenus = true;

    this.roleCustomService.getUserMenus().subscribe({
      next: (userMenus) => {
        console.log('[LayoutComponent] Menus utilisateur reçus:', userMenus);
        this.organiserMenusParCategorie(userMenus.menus);
        this.isLoadingMenus = false;
      },
      error: (err) => {
        console.error('[LayoutComponent] Erreur chargement menus:', err);
        this.menuCategories = [];
        this.isLoadingMenus = false;
      }
    });
  }

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

  // Helpers
  trackByMenuId(index: number, menu: Menu): any {
    return menu.id;
  }

  trackByCategoryId(index: number, category: MenuCategorie): any {
    return category.code;
  }

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
    if (menuCode === 'CREATEG' && this.onboardingService.getStep() === 'CREATE_GROUPE') {
      // Avancer l'onboarding
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

  private setupPublicites(): void {
    const userVille = this.authService.getUser()?.ville || '';
    
    // Splash au login (1x/jour)
    this.splashService.checkAndShowLoginSplash(userVille);
    
    // Splash après 10 min (1x/session)
    this.splashService.startUsageTimer(10, userVille);
  }
}