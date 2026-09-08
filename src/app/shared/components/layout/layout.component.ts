// ============================================================
// LAYOUT COMPONENT — Mobile-first refactor
// ============================================================

import {
  Component, OnInit, OnDestroy,
  ChangeDetectorRef,
  NgZone
} from '@angular/core';
import { MatToolbarModule }   from '@angular/material/toolbar';
import { MatSidenavModule }   from '@angular/material/sidenav';
import { MatIconModule }      from '@angular/material/icon';
import { MatButtonModule }    from '@angular/material/button';
import { MatListModule }      from '@angular/material/list';
import { CommonModule }       from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { MatSelectModule }    from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatMenuModule }      from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule }   from '@angular/material/divider';
import { MatTooltipModule }   from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatDialog }          from '@angular/material/dialog';
import { Subject, Subscription, distinctUntilChanged, skip, takeUntil } from 'rxjs';

import { AuthService }            from '../../../core/services/auth.service';
import { RoleCustomService }      from '../../../core/services/role-custom.service';
import { NavbarComponent }        from '../navbar/navbar.component';
import { ProfilEditComponent }    from '../profil-edit/profil-edit.component';
import { Menu, MenuCategorie }    from '../../../core/models/menu.model';
import { TranslateModule }        from '@ngx-translate/core';
import { OnboardingService }      from '../../../core/services/onboarding.service';
import { SplashScreenService }    from '../../../core/services/splash-screen.service';
import { JoinGroupDialogComponent } from '../../../modules/membre/components/join-group-dialog/join-group-dialog.component';
import { BottomNavComponent } from '../bottom-nav/bottom-nav.component';
import { MoreDrawerComponent } from '../more-drawer/more-drawer.component';
import { VideoManagementComponent } from '../../../modules/membre/components/video-management/video-management.component';
import { SafeUrl } from '@angular/platform-browser';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { EquipeSelectionDialogComponent } from '../equipe-selection-dialog/equipe-selection-dialog.component';
import { MembreService } from '../../../core/services/membre.service';
import { GeneralService } from '../../../core/services/general.service';
import { PushNotificationService } from '../../../core/services/push-notification.service';
import { NotificationBellComponent } from '../../../modules/responsable/components/notification-bell/notification-bell.component';
import { GroupeSwitcherComponent } from '../../../modules/shared/components/groupe-switcher/groupe-switcher.component';

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
    MatExpansionModule,
    NavbarComponent,
    TranslateModule,
    BottomNavComponent,
    MoreDrawerComponent,
    NotificationBellComponent,
    GroupeSwitcherComponent,
  ],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent implements OnInit, OnDestroy {

  // ── Rôles ──
  isAdmin       = false;
  isPartenaire  = false;
  isResponsable = false;
  isMembre      = false;
  roles: string[]   = [];
  selectedRole      = '';
  userHasGroup      = false;

  // ── Menus ──
  menuCategories: MenuCategorie[] = [];
  menusCommuns:   Menu[]          = [];
  isLoadingMenus  = false;

  // ── User ──
  user:             any    = null;
  userProfileImage: string | null = null;
  userInitials      = '??';
  avatarBg          = '#2563eb';

  // ── UI ──
  private destroy$ = new Subject<void>();
  isMobile        = false;
  isMobileSize    = false;
  sidebarOpen     = true;
  sidebarCollapsed = false;
  moreDrawerOpen  = false;
  currentGroupeId: number | null = null;

  // ── isLoggedIn : propriété locale synchronisée avec authService ──
  // On utilise une PROPRIÉTÉ (pas authService.isLoggedIn() dans le template)
  // pour que detectChanges() la rende immédiatement dans la vue
  isLoggedIn      = false;

  // ── Capacitor ──
  isCapacitor     = !!(window as any).Capacitor?.isNativePlatform?.();

  // ── Badges ──
  notifCount          = 0;
  unreadChatCount     = 0;
  upcomingMatchCount  = 0;
  error = '';
  isChecking = false;
  success = false;

  private menusSubscription?:      Subscription;
  private groupeSubscription?:     Subscription;
  private authStatusSubscription?: Subscription;
  private menuRefreshSubscription?: Subscription;

  constructor(
    public  authService:       AuthService,
    private roleCustomService: RoleCustomService,
    public  router:            Router,
    private dialog:            MatDialog,
    private breakpointObserver:BreakpointObserver,
    public  onboardingService: OnboardingService,
    private splashService:     SplashScreenService,
    private cdr:               ChangeDetectorRef,
    private memberService:     MembreService,
    private equipeService:     GeneralService,
    private pushService: PushNotificationService
  ) {
    this.isMobile     = window.innerWidth < 768;
    this.isMobileSize = window.innerWidth < 1024;
    this.sidebarOpen  = !this.isMobile;
    // Init isLoggedIn dès le constructeur (évite flash au 1er rendu)
    this.isLoggedIn   = this.authService.isLoggedIn();
  }

  ngOnInit(): void {
    this.setupResponsiveLayout();
    this.loadProfilePhoto();
    this.listenToRouter();
this.authStatusSubscription = this.authService.isUserReady$.subscribe(isReady => {
  if (isReady && this.authService.isLoggedIn()) {
    this.isLoggedIn = true;
    this.loadUserData();
    this.updateGroupStatus();
    this.loadMenusCommuns();
    this.setupGroupeSubscription();
    this.setupPublicites();
    this.pushService.init();
 
    // FIX : charger mes-groupes pour peupler groupeActifAccess
    // AVANT de calculer isResponsable() — sinon setupRoles()
    // tourne avec un accès null et loadUserMenus() ne charge rien.
    this.authService.getMesGroupes().subscribe(() => {
      this.setupRoles();          // calcule isResponsable maintenant correct
      this.loadUserMenus();       // charge les menus du groupe actif réel
      this.cdr.detectChanges();
    });
 
  } else if (isReady && !this.authService.isLoggedIn()) {
    this.isLoggedIn = false;
    this.resetUserSpecificState();
  }
  this.cdr.detectChanges();
});

    this.menuRefreshSubscription = this.authService.forceMenuRefresh$.pipe(
      skip(1), distinctUntilChanged()
    ).subscribe(() => {
      this.setupRoles();
      this.updateGroupStatus();
      this.loadMenusCommuns();
      this.loadUserMenus();
      this.cdr.detectChanges();
    });

    this.menusSubscription = this.roleCustomService.userMenus$.subscribe(menus => {
      if (menus && menus.length > 0) {
        this.organiserMenusParCategorie(menus);
      } else {
        this.menuCategories = [];
      }
      this.cdr.detectChanges();
    });

    this.checkOnboardingStatus();
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

  private revalidateCurrentRoute(): void {
  const currentUrl = this.router.url;
 
  this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
    this.router.navigateByUrl(currentUrl);
    // Si le guard de currentUrl échoue maintenant (plus responsable,
    // ou route hors roleCustom), il redirigera lui-même vers /membre.
    // Si le guard passe, on atterrit simplement sur la même page.
  });
}

  async checkIn(): Promise<void> {
    this.isChecking = true;
    this.error = '';
    this.success = false;

    try {
      const equipes = await this.equipeService.getEquipesByGroupe().toPromise();
      const userId: number | null = this.authService.getUserId();

      if (userId === null) {
        this.isChecking = false;
        this.error = 'Utilisateur non authentifié ou ID introuvable.';
        return;
      }

      const membre = await this.memberService.getMembreByUserId(userId).toPromise();
      const membreEquipeId = membre?.equipe?.id ?? null;

      const dialogRef = this.dialog.open(EquipeSelectionDialogComponent, {
        width: '90vw', maxWidth: '500px',
        data: {
          equipes, defaultEquipeId: membreEquipeId,
          joueur: { id: membre?.id, nom: membre?.nom, prenom: membre?.prenom }
        }
      });

      const checkInResult = await dialogRef.afterClosed().toPromise();

      if (!checkInResult) {
        this.isChecking = false;
        this.error = 'Check-in annulé.';
        return;
      }

      const result = await this.authService.checkIn(
        checkInResult.equipe?.id || null,
        checkInResult.hasPlayed
      );

      this.isChecking = false;

      const confirmRef = this.dialog.open(ConfirmationDialogComponent, {
        width: '90vw', maxWidth: '400px', panelClass: 'scrollable-dialog',
        data: {
          message: checkInResult.hasPlayed
            ? result.message
            : 'Votre présence a été enregistrée. Vous n\'avez pas participé au match.'
        }
      });

      confirmRef.afterClosed().subscribe(confirmed => {
        if (confirmed) this.success = result.success;
        else this.error = result.success ? '' : result.message;
      });

    } catch (err: any) {
      this.isChecking = false;
      this.error = 'Erreur lors du check-in : ' + (err.message || 'inconnue');
      console.error(err);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.menusSubscription?.unsubscribe();
    this.groupeSubscription?.unsubscribe();
    this.authStatusSubscription?.unsubscribe();
    this.menuRefreshSubscription?.unsubscribe();
  }

  // ──────────────────── Setup ────────────────────────────────

  setupResponsiveLayout(): void {
    this.breakpointObserver
      .observe([Breakpoints.Handset, Breakpoints.TabletPortrait, '(max-width: 1023px)'])
      .subscribe(() => this.updateMobileState());
  }

  private listenToRouter(): void {
    this.router.events.pipe(takeUntil(this.destroy$)).subscribe(event => {
      if (event instanceof NavigationEnd) {
        setTimeout(() => this.cdr.detectChanges(), 0);
      }
    });
  }

  private updateMobileState(): void {
    const wasMobile   = this.isMobile;
    this.isMobile     = window.innerWidth < 768;
    this.isMobileSize = window.innerWidth < 1024;

    if (this.isMobile !== wasMobile) {
      this.sidebarOpen = !this.isMobile;
      if (this.moreDrawerOpen && !this.isMobile) this.moreDrawerOpen = false;
    }
    this.cdr.detectChanges();
  }

  private setupPublicites(): void {
    const userVille = this.authService.getUser()?.ville || '';
    this.splashService.checkAndShowLoginSplash(userVille);
    this.splashService.startUsageTimer(10, userVille);
  }

  private updateGroupStatus(): void {
    const groupeId    = this.authService.getGroupe();
    this.userHasGroup = !!groupeId && groupeId > 0;
    this.currentGroupeId = groupeId;
  }

setupRoles(): void {
  this.roles = this.authService.getRoles() || [];
 
  // isAdmin reste basé sur le JWT — ROLE_ADMIN est volontairement
  // global à la plateforme entière (pas par groupe)
  this.isAdmin = this.roles.some(r => r === 'ADMIN' || r === 'ROLE_ADMIN');
 
  // FIX : isResponsable est maintenant calculé PAR GROUPE ACTIF
  // via authService.isResponsable() qui lit l'accès du groupe switché
  this.isResponsable = this.authService.isResponsable();
 
  this.isPartenaire = this.roles.some(r => r === 'PARTENAIRE' || r === 'ROLE_PARTENAIRE');
  this.isMembre      = !this.isAdmin && !this.isResponsable && !this.isPartenaire;
 
  // selectedRole pour l'affichage (badge dans le menu profil)
  if (this.isResponsable)      this.selectedRole = 'RESPONSABLE';
  else if (this.isAdmin)       this.selectedRole = 'ADMIN';
  else if (this.isPartenaire)  this.selectedRole = 'PARTENAIRE';
  else                          this.selectedRole = 'MEMBRE';
}

 setupGroupeSubscription(): void {
  if (this.groupeSubscription) this.groupeSubscription.unsubscribe();
 
  this.groupeSubscription = this.authService.currentGroupeId$.subscribe(groupeId => {
    this.currentGroupeId = groupeId;
    this.userHasGroup     = !!groupeId && groupeId > 0;
    this.loadMenusCommuns();
  });
 
  // FIX : s'abonner AUSSI à l'accès du groupe actif (estResponsableGroupe)
  // pour réévaluer isResponsable + recharger les menus à chaque switch
  this.authService.groupeActifAccess$.subscribe(() => {
    this.setupRoles();             // recalcule isResponsable pour CE groupe
    if (this.isLoggedIn && this.isResponsable) {
      this.loadUserMenus();        // recharge les menus du nouveau groupe
    } else {
      this.menuCategories = [];    // FIX : vider les menus si plus responsable
    }
    this.revalidateCurrentRoute();
  });
}

  // ──────────────────── User data ────────────────────────────

  loadUserData(): void {
    this.user = this.authService.getUser();
    this.loadProfilePhoto();

    const nom    = this.user?.nom    || '';
    const prenom = this.user?.prenom || '';
    const uname  = this.user?.username || '';

    if (nom && prenom) this.userInitials = (nom[0] + prenom[0]).toUpperCase();
    else if (uname)    this.userInitials = uname.slice(0,2).toUpperCase();

    const hash   = (this.user?.userId || 1) % 8;
    const colors = ['#2563eb','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316'];
    this.avatarBg = colors[hash];
  }

  loadProfilePhoto(): void {
    const storedUrl = localStorage.getItem('profilUrl');
    if (storedUrl) {
      this.userProfileImage = this.getFullImageUrl(storedUrl);
    } else {
      this.authService.getProfilePhoto2().subscribe({
        next: (url: SafeUrl) => { this.userProfileImage = url as string; },
        error: () => { this.userProfileImage = null; }
      });
    }
  }

  getFullImageUrl(url: string): string {
    if (!url) return '';
    return url;
  }

  resetUserSpecificState(): void {
    this.user             = null;
    this.userProfileImage = null;
    this.userInitials     = '??';
    this.avatarBg         = '#2563eb';
    this.roles            = [];
    this.isAdmin          = false;
    this.isResponsable    = false;
    this.isMembre         = false;
    this.isPartenaire     = false;
    this.userHasGroup     = false;
    this.menuCategories   = [];
    this.menusCommuns     = [];
    this.currentGroupeId  = null;
    this.moreDrawerOpen   = false;
    this.groupeSubscription?.unsubscribe();
    this.groupeSubscription = undefined;
  }

  // ──────────────────── Navigation ───────────────────────────

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
    if (this.isMobile && this.sidebarOpen) {
      setTimeout(() => this.cdr.detectChanges(), 0);
    }
  }

  toggleCollapse(): void { this.sidebarCollapsed = !this.sidebarCollapsed; }

  closeSidebar(): void {
    if (this.isMobile) this.sidebarOpen = false;
  }

  toggleMoreDrawer(): void {
    this.moreDrawerOpen = !this.moreDrawerOpen;
    this.cdr.detectChanges();
  }

  closeMoreDrawer(): void {
    this.moreDrawerOpen = false;
    this.cdr.detectChanges();
  }

  goToNotifications(): void { this.router.navigate(['/notifications']); }

  // ──────────────────── Menus ────────────────────────────────

  loadMenusCommuns(): void {
    const isPartenaire  = this.isPartenaire;
    const baseMenus: Menu[] = [
      { id:1,  code:'EXPLORER',    label:'Explorer',    icone:'explore',    route:'/explorer',    description:'', ordre:1, actif:true, categorie:'COMMUN' },
      { id:5,  code:'SUGGESTIONS', label:'Suggestions', icone:'lightbulb',  route:'/suggestions', description:'', ordre:6, actif:true, categorie:'COMMUN' },
      { id:11, code:'sc',          label:'Scouting',    icone:'search',     route:'/joueurs',     description:'', ordre:5, actif:true, categorie:'COMMUN' },
      
    ];

    if (!this.userHasGroup) {
      baseMenus.push(
        { id:6,  code:'CREATEG', label:'Créer un groupe',    icone:'group_add', route:'/creategroup', description:'', ordre:2, actif:true, categorie:'COMMUN' },
        { id:13, code:'JOIN',    label:'Rejoindre un groupe', icone:'group_add', route:null as any,    description:'', ordre:3, actif:true, categorie:'COMMUN' },
      );
    }

    if (this.userHasGroup) {
      baseMenus.push(
        { id:10, code:'TB',         label:'Tableau de bord', icone:'newspaper', route:'/membre',     description:'', ordre:1, actif:true, categorie:'COMMUN' },
        { id:3,  code:'ACTUALITES', label:'Actualités',      icone:'newspaper', route:'/actualites', description:'', ordre:3, actif:true, categorie:'COMMUN' },
        { id:4,  code:'OBJECTIFS',  label:'Objectifs',       icone:'flag',      route:'/objectifs',  description:'', ordre:5, actif:true, categorie:'COMMUN' },
      );
    }
    this.menusCommuns = baseMenus.sort((a,b) => a.ordre - b.ordre);
  }

  handleMenuAction(code: string): void {
    if (code === 'JOIN') this.openJoinGroupDialog();
  }

 openJoinGroupDialog(): void {
    // Fermer le more-drawer EN PREMIER
    // z-index drawer (1070) > dialog (1060) => drawer masque le dialog sur mobile
    this.closeMoreDrawer();

    this.dialog.open(JoinGroupDialogComponent, {
      width: '450px',
      maxWidth: '90vw',
      disableClose: false
    });

    if (this.isMobile) {
      this.closeSidebar();
    }
  }

  loadUserMenus(): void {
  if (!this.isResponsable || !this.userHasGroup) {
    // Même sans groupe/responsable, ajouter COMPETITION
    this.menuCategories = [];
    this.ajouterCategorieCompetition();
    return;
  }

  this.isLoadingMenus = true;
  this.roleCustomService.getUserMenus().subscribe({
    next: (um) => {
      this.organiserMenusParCategorie(um.menus);
      // Ajouter COMPETITION si pas déjà dans les menus BD
      this.ajouterCategorieCompetition();
      this.isLoadingMenus = false;
      this.cdr.detectChanges();
    },
    error: () => {
      this.menuCategories = [];
      this.ajouterCategorieCompetition();
      this.isLoadingMenus = false;
      this.cdr.detectChanges();
    }
  });
}

private ajouterCategorieCompetition(): void {
  // TODO: remplacer !this.isPartenaire par this.authService.hasModule('COMPETITION')
  if (this.isPartenaire) return;

  // Déjà présente depuis la BD → ne pas dupliquer
  const dejaPresente = this.menuCategories.some(c => c.code === 'COMPETITION');
  if (dejaPresente) return;

  const sousMenus: Menu[] = [
    { id: 20, code: 'COMPT', label: 'Mes compétitions',
      icone: 'emoji_events', route: '/competitions',
      description: '', ordre: 1, actif: true, categorie: 'COMPETITION' },
    { id: 21, code: 'COMPTEXPL', label: 'Explorer',
      icone: 'public', route: '/competitions/public',
      description: '', ordre: 2, actif: true, categorie: 'COMPETITION' },
  ];

 

  this.menuCategories.push({
    code:  'COMPETITION',
    label: 'Compétitions',
    icone: 'emoji_events',
    menus: sousMenus
  });
}

  organiserMenusParCategorie(menus: Menu[]): void {
    const map = new Map<string, Menu[]>();
    menus.forEach(m => {
      if (!map.has(m.categorie)) map.set(m.categorie, []);
      map.get(m.categorie)!.push(m);
    });
    const cfg: Record<string,{label:string;icone:string}> = {
      'GESTION':       { label:'Gestion',       icone:'settings'       },
      'SPORT':         { label:'Sport',          icone:'sports_soccer'  },
      'FINANCES':      { label:'Finances',       icone:'account_balance'},
      'COMMUNICATION': { label:'Communication',  icone:'campaign'       },
       'COMPETITION':   { label:'Compétitions',   icone:'emoji_events'    },
    };
    this.menuCategories = Array.from(map.entries())
      .map(([code, menus]) => ({
        code, label: cfg[code]?.label || code, icone: cfg[code]?.icone || 'folder',
        menus: menus.sort((a,b) => a.ordre - b.ordre)
      }))
      .sort((a,b) =>
        ['GESTION','SPORT','FINANCES','COMMUNICATION','COMPETITION'].indexOf(a.code) -
        ['GESTION','SPORT','FINANCES','COMMUNICATION','COMPETITION'].indexOf(b.code)
      );
  }

  // ──────────────────── Actions ───────────────────────────────

  openProfileEdit(): void {
    this.dialog.open(ProfilEditComponent, { width:'400px', data:{ user: this.user } })
      .afterClosed().subscribe(r => { if(r) this.loadUserData(); });
  }

  openVideoEdit(): void {
    import('../../../modules/membre/components/video-management/video-management.component')
      .then(m => {
        this.dialog.open(m.VideoManagementComponent, {
          width: '95vw', maxWidth: '600px', maxHeight: '90vh',
        });
      });
  }

  openVideo(): void {
    this.dialog.open(VideoManagementComponent, { width:'400px', data:{ user: this.user } })
      .afterClosed().subscribe(r => { if(r) this.loadUserData(); });
  }

  logout(): void {
    // 1. Nettoyer état local + repaint immédiat
    this.isLoggedIn = false;
    this.resetUserSpecificState();
    this.cdr.detectChanges();
 
    // 2. Supprimer token FCM Android
    this.pushService.removeFcmToken();
 
    // 3. Nettoyer auth + menus
    this.authService.logout(false);
    this.roleCustomService.clearUserMenus();
 
    // 4. Naviguer
    this.router.navigate(['/home']);
  }
}