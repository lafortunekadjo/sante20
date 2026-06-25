import {
  Component, OnInit, OnDestroy, Input, Output, EventEmitter,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService }        from '../../../core/services/auth.service';
import { Menu, MenuCategorie } from '../../../core/models/menu.model';

// ── Icônes et labels par catégorie de menu ──────────────────
const CATEGORIE_CONFIG: Record<string, { icone: string; couleur: string; ordre: number }> = {
  GESTION:       { icone: 'settings',        couleur: 'blue',   ordre: 1 },
  SPORT:         { icone: 'sports_soccer',   couleur: 'green',  ordre: 2 },
  FINANCES:      { icone: 'account_balance', couleur: 'amber',  ordre: 3 },
  COMMUNICATION: { icone: 'campaign',        couleur: 'purple', ordre: 4 },
};

// ── Menus communs avec icônes natives ───────────────────────
const COMMUN_ICONS: Record<string, string> = {
  EXPLORER:    'explore',
  SUGGESTIONS: 'lightbulb',
  sc:          'manage_search',
  TB:          'dashboard',
  ACTUALITES:  'newspaper',
  OBJECTIFS:   'flag',
  CREATEG:     'group_add',
  JOIN:        'login',
};

@Component({
  selector: 'app-more-drawer',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatRippleModule, TranslateModule],
  templateUrl: './more-drawer.component.html',
  styleUrl:    './more-drawer.component.scss',
})
export class MoreDrawerComponent implements OnInit, OnDestroy {

  @Input()  isOpen = false;
  @Input()  notifCount = 0;
  @Input()  menuCategories: MenuCategorie[] = [];
  @Input()  menusCommuns:   Menu[]          = [];

  @Output() closeDrawer  = new EventEmitter<void>();
  @Output() logout$      = new EventEmitter<void>();
  @Output() profileOpen  = new EventEmitter<void>();
  @Output() videoEdit    = new EventEmitter<void>();
  @Output() videoOpen    = new EventEmitter<void>();
  @Output() joinGroup    = new EventEmitter<void>(); // action JOIN (pas de route)

  // ── User ──
  user:         any    = null;
  userImage:    string | null = null;
  userInitials  = '??';
  avatarBg      = '#1a3a8a';
  groupeNom     = '';

  // ── Rôles ──
  isResponsable = false;
  isMembre      = false;
  isAdmin       = false;
  isPartenaire  = false;
  userHasGroup  = false;

  // ── Thème / langue ──
  isDark     = false;
  currentLang = 'fr';

  // ── Accordéon : quels groupes sont ouverts ──
  openGroups = new Set<string>(['GESTION']); // Gestion ouvert par défaut

  // ── Config catégories exposée au template ──
  readonly categorieConfig = CATEGORIE_CONFIG;

  get roleLabel(): string {
    if (this.isAdmin)       return 'Administrateur';
    if (this.isResponsable) return 'Responsable';
    if (this.isMembre)      return 'Membre';
    if (this.isPartenaire)  return 'Partenaire';
    return 'Utilisateur';
  }

  // Catégories triées par ordre
  get sortedCategories(): MenuCategorie[] {
    return [...this.menuCategories].sort((a, b) => {
      const oa = CATEGORIE_CONFIG[a.code]?.ordre ?? 99;
      const ob = CATEGORIE_CONFIG[b.code]?.ordre ?? 99;
      return oa - ob;
    });
  }

  private destroy$ = new Subject<void>();

  // ── Swipe to dismiss ────────────────────────────────────────
  private swipeTouchStartY = 0;
  private swipeCurrentY    = 0;
  drawerTranslateY         = 0; // bindé dans le template via [style.transform]
  private swipeThreshold   = 80; // px vers le bas pour fermer

  constructor(
    private authService: AuthService,
    private router:      Router,
    private translate:   TranslateService,
    private cdr:         ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUser();
    this.setupRoles();
    this.isDark      = document.body.classList.contains('dark-theme');
    this.currentLang = this.translate.currentLang || 'fr';

    // ── Re-synchronisation user/rôles ─────────────────────────
    // À la toute première connexion (surtout sur mobile), ce composant
    // peut être initialisé avant que AuthService n'ait fini de résoudre
    // l'utilisateur et le groupe réels (isUserReady$ / currentGroupeId$
    // émettent en arrière-plan après le premier rendu). Sans cette
    // re-synchronisation, "user", "userInitials", "roleLabel",
    // "isResponsable" et "userHasGroup" restent figés sur leurs valeurs
    // par défaut ('??', 'Utilisateur', false, false...) et la section
    // "Menus Responsable" (qui dépend de isResponsable && userHasGroup)
    // ne s'affiche jamais tant que le drawer n'est pas recréé.
    this.authService.isUserReady$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(ready => {
      if (ready) {
        this.loadUser();
        this.setupRoles();
        this.cdr.markForCheck();
      }
    });

    this.authService.currentGroupeId$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.loadUser();
      this.setupRoles();
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ──────────────────────────────────────────────────────────

  private loadUser(): void {
    this.user      = this.authService.getUser();
    this.userImage = this.user?.profileImage || null;

    const nom    = this.user?.nom    || '';
    const prenom = this.user?.prenom || '';
    const uname  = this.user?.username || '';

    if (nom && prenom)   this.userInitials = (nom[0] + prenom[0]).toUpperCase();
    else if (uname)      this.userInitials = uname.slice(0, 2).toUpperCase();

    const hash   = (this.user?.id || 1) % 8;
    const colors = ['#1a3a8a','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316'];
    this.avatarBg = colors[hash];

    // Nom du groupe
    this.groupeNom = this.user?.groupe?.nom || this.user?.groupeNom || '';
  }

  private setupRoles(): void {
    const roles = this.authService.getRoles() || [];
    this.isAdmin       = roles.some(r => r === 'ADMIN'       || r === 'ROLE_ADMIN');
    this.isResponsable = roles.some(r => r === 'RESPONSABLE' || r === 'ROLE_RESPONSABLE');
    this.isMembre      = roles.some(r => r === 'MEMBRE'      || r === 'ROLE_MEMBRE');
    this.isPartenaire  = roles.some(r => r === 'PARTENAIRE'  || r === 'ROLE_PARTENAIRE');
    const groupe       = this.authService.getGroupe();
    this.userHasGroup  = !!groupe && groupe > 0;
  }

  // ── Accordéon ──────────────────────────────────────────────

  toggleGroup(code: string): void {
    if (this.openGroups.has(code)) this.openGroups.delete(code);
    else                           this.openGroups.add(code);
    this.cdr.markForCheck();
  }

  isGroupOpen(code: string): boolean {
    return this.openGroups.has(code);
  }

  getCategorieIcon(code: string): string {
    return CATEGORIE_CONFIG[code]?.icone || 'folder';
  }

  getCategorieColor(code: string): string {
    return CATEGORIE_CONFIG[code]?.couleur || 'gray';
  }

  getMenuIcon(menu: Menu): string {
    return menu.icone || COMMUN_ICONS[menu.code] || 'chevron_right';
  }

  // ── Actions ────────────────────────────────────────────────

  close(): void { this.closeDrawer.emit(); }

  navigate(route: string): void {
    if (route) this.router.navigate([route]);
    this.close();
  }

  handleMenuClick(menu: Menu): void {
    if (menu.route) {
      this.navigate(menu.route);
    } else {
      // Actions sans route — déléguer au layout via Output
      this.close();
      if (menu.code === 'JOIN') {
        this.joinGroup.emit();
      }
    }
  }

  toggleTheme(): void {
    const isDark = document.body.classList.toggle('dark-theme');
    document.body.classList.toggle('light-theme', !isDark);
    this.isDark = isDark;
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    this.cdr.markForCheck();
  }

  toggleLanguage(): void {
    const next = this.currentLang === 'fr' ? 'en' : 'fr';
    this.translate.use(next);
    this.currentLang = next;
    localStorage.setItem('lang', next);
    this.cdr.markForCheck();
  }

  openEditVideos(): void {
    this.close();
    this.videoEdit.emit();
  }



    openVideoEdit(): void{
    this.router.navigate(['/membre/videos']);
  }

  goToNotifs():   void { this.navigate('/notifications'); }
  goToSettings(): void { this.navigate('/settings'); }
  openProfile():  void { this.close(); this.profileOpen.emit(); }
  openVideos():  void { this.close(); this.videoOpen.emit(); }
  logout():       void { this.close(); this.logout$.emit(); }

  // ── Swipe to dismiss ────────────────────────────────────────
  onDrawerTouchStart(event: TouchEvent): void {
    this.swipeTouchStartY = event.touches[0].clientY;
    this.swipeCurrentY    = 0;
    this.drawerTranslateY = 0;
  }

  onDrawerTouchMove(event: TouchEvent): void {
    const dy = event.touches[0].clientY - this.swipeTouchStartY;
    if (dy > 0) { // seulement vers le bas
      this.swipeCurrentY    = dy;
      this.drawerTranslateY = dy;
      this.cdr.markForCheck();
    }
  }

  onDrawerTouchEnd(): void {
    if (this.swipeCurrentY >= this.swipeThreshold) {
      this.drawerTranslateY = 0;
      this.close();
    } else {
      // Rembobiner le drawer à sa position initiale
      this.drawerTranslateY = 0;
      this.cdr.markForCheck();
    }
    this.swipeCurrentY = 0;
  }
}