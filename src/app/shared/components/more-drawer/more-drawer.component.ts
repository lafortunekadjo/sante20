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

const CATEGORIE_CONFIG: Record<string, { icone: string; couleur: string; ordre: number }> = {
  GESTION:       { icone: 'settings',        couleur: 'blue',   ordre: 1 },
  SPORT:         { icone: 'sports_soccer',   couleur: 'green',  ordre: 2 },
  FINANCES:      { icone: 'account_balance', couleur: 'amber',  ordre: 3 },
  COMMUNICATION: { icone: 'campaign',        couleur: 'purple', ordre: 4 },
  COMPETITION: { icone: 'emoji_events',        couleur: 'red', ordre: 5 },
};

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
  @Output() joinGroup    = new EventEmitter<void>();

  user:         any    = null;
  userImage:    string | null = null;
  userInitials  = '??';
  avatarBg      = '#1a3a8a';
  groupeNom     = '';

  isResponsable = false;
  isMembre      = false;
  isAdmin       = false;
  isPartenaire  = false;
  isCompetition  = true;
  userHasGroup  = false;

  isDark      = false;
  currentLang = 'fr';

  openGroups = new Set<string>(['GESTION']);

  readonly categorieConfig = CATEGORIE_CONFIG;

  get roleLabel(): string {
    if (this.isAdmin)       return 'Administrateur';
    if (this.isResponsable) return 'Responsable';
    if (this.isMembre)      return 'Membre';
    if (this.isPartenaire)  return 'Partenaire';
    return 'Utilisateur';
  }

  get sortedCategories(): MenuCategorie[] {
    return [...this.menuCategories].sort((a, b) => {
      const oa = CATEGORIE_CONFIG[a.code]?.ordre ?? 99;
      const ob = CATEGORIE_CONFIG[b.code]?.ordre ?? 99;
      return oa - ob;
    });
  }

  private destroy$ = new Subject<void>();

  private swipeTouchStartY = 0;
  private swipeCurrentY    = 0;
  drawerTranslateY         = 0;
  private swipeThreshold   = 80;

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

    this.authService.isUserReady$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(ready => {
      if (ready) { this.loadUser(); this.setupRoles(); this.cdr.markForCheck(); }
    });

    this.authService.currentGroupeId$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.loadUser(); this.setupRoles(); this.cdr.markForCheck();
    });

    // FIX : s'abonner à groupeActifAccess$ pour détecter
    // estResponsableGroupe et roleCustom sur mobile
    this.authService.groupeActifAccess$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.setupRoles();
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

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

    this.groupeNom = this.user?.groupe?.nom || this.user?.groupeNom || '';
  }

  private setupRoles(): void {
    const roles = this.authService.getRoles() || [];
    const groupe = this.authService.getGroupe();
    this.userHasGroup  = !!groupe && groupe > 0;

    this.isAdmin       = roles.some(r => r === 'ADMIN'      || r === 'ROLE_ADMIN');
    this.isPartenaire  = roles.some(r => r === 'PARTENAIRE' || r === 'ROLE_PARTENAIRE');

    // FIX : utiliser authService.isResponsable() qui lit groupeActifAccess
    // couvre les users ROLE_MEMBRE avec estResponsableGroupe=true ou roleCustom
    this.isResponsable = !this.isAdmin && !this.isPartenaire
                         && this.authService.isResponsable();

    this.isMembre      = !this.isAdmin && !this.isPartenaire && !this.isResponsable
                         && roles.some(r => r === 'MEMBRE' || r === 'ROLE_MEMBRE');
  }

  toggleGroup(code: string): void {
    if (this.openGroups.has(code)) this.openGroups.delete(code);
    else                           this.openGroups.add(code);
    this.cdr.markForCheck();
  }

  isGroupOpen(code: string): boolean { return this.openGroups.has(code); }

  getCategorieIcon(code: string):  string { return CATEGORIE_CONFIG[code]?.icone  || 'folder'; }
  getCategorieColor(code: string): string { return CATEGORIE_CONFIG[code]?.couleur || 'gray';   }
  getMenuIcon(menu: Menu):         string { return menu.icone || COMMUN_ICONS[menu.code] || 'chevron_right'; }

  close(): void { this.closeDrawer.emit(); }

  navigate(route: string): void {
    if (route) this.router.navigate([route]);
    this.close();
  }

  handleMenuClick(menu: Menu): void {
    if (menu.route) {
      this.navigate(menu.route);
    } else {
      this.close();
      if (menu.code === 'JOIN') this.joinGroup.emit();
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

  openEditVideos(): void { this.close(); this.videoEdit.emit(); }
  openVideoEdit():  void { this.router.navigate(['/membre/videos']); }

  goToNotifs():   void { this.navigate('/notifications'); }
  goToSettings(): void { this.navigate('/settings'); }
  openProfile():  void { this.close(); this.profileOpen.emit(); }
  openVideos():   void { this.close(); this.videoOpen.emit(); }
  logout():       void { this.close(); this.logout$.emit(); }

  onDrawerTouchStart(event: TouchEvent): void {
    this.swipeTouchStartY = event.touches[0].clientY;
    this.swipeCurrentY    = 0;
    this.drawerTranslateY = 0;
  }

  onDrawerTouchMove(event: TouchEvent): void {
    const dy = event.touches[0].clientY - this.swipeTouchStartY;
    if (dy > 0) {
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
      this.drawerTranslateY = 0;
      this.cdr.markForCheck();
    }
    this.swipeCurrentY = 0;
  }
}