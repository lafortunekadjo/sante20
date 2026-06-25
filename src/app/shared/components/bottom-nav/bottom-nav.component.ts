import {
  Component, OnInit, OnDestroy, Input, Output, EventEmitter,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { Menu, MenuCategorie } from '../../../core/models/menu.model';

// ── Interface tab dynamique ──
interface NavTab {
  id:     string;
  label:  string;
  icon:   string;
  route:  string;
  badge?: number;
}

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, TranslateModule],
  templateUrl: './bottom-nav.component.html',
  styleUrl:    './bottom-nav.component.scss',
})
export class BottomNavComponent implements OnInit, OnDestroy {

  // ── Inputs depuis le layout ──
  @Input() unreadCount       = 0;
  @Input() upcomingMatchCount = 0;
  @Input() moreDrawerOpen    = false;
  // Menus chargés par le layout (proviennent du backend via RoleCustomService)
  @Input() set menusCommuns(v: Menu[])          { this._menusCommuns = v;    this.buildTabs(); }
  @Input() set menuCategories(v: MenuCategorie[]){ this._menuCategories = v; this.buildTabs(); }

  @Output() moreClick = new EventEmitter<void>();

  // ── State ──
  tabs:     NavTab[] = [];
  isHidden = false;

  private _menusCommuns:    Menu[]          = [];
  private _menuCategories:  MenuCategorie[] = [];
  private destroy$ = new Subject<void>();

  private readonly HIDDEN_ROUTES = [
    '/login', '/signup', '/reset-password', '/forgot-password',
    '/join/', '/j/', '/adhesion/'
  ];

  constructor(
    private authService: AuthService,
    private router:      Router,
    private cdr:         ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Rebuild tabs quand l'auth change
    this.authService.isUserReady$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(ready => {
      if (ready) this.buildTabs();
      this.cdr.markForCheck();
    });

    // Rebuild tabs quand le groupe réel arrive (peut être émis après
    // isUserReady$ lors de la toute première connexion — sans cette
    // souscription, hasGroup peut rester figé à false sur mobile et les
    // tabs/menus du "Plus" ne sont jamais recalculés tant qu'aucun refresh
    // n'a lieu).
    this.authService.currentGroupeId$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.buildTabs();
      this.cdr.markForCheck();
    });

    // Masque selon la route
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((e: any) => {
      this.isHidden = this.shouldHide(e.urlAfterRedirects);
      this.cdr.markForCheck();
    });

    this.isHidden = this.shouldHide(this.router.url);
    this.buildTabs();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ──────────────────────────────────────────────────────────
  // Construction dynamique des tabs selon le rôle et les menus
  // ──────────────────────────────────────────────────────────
  private buildTabs(): void {
    if (!this.authService.isLoggedIn()) {
      this.tabs = [];
      this.cdr.markForCheck();
      return;
    }

    const roles   = this.authService.getRoles() || [];
    const groupe  = this.authService.getGroupe();
    const hasGroup = !!groupe && groupe > 0;

    const isAdmin       = roles.some(r => r === 'ADMIN'       || r === 'ROLE_ADMIN');
    const isResponsable = roles.some(r => r === 'RESPONSABLE' || r === 'ROLE_RESPONSABLE');
    const isMembre      = roles.some(r => r === 'MEMBRE'      || r === 'ROLE_MEMBRE');
    const isPartenaire  = roles.some(r => r === 'PARTENAIRE'  || r === 'ROLE_PARTENAIRE');

    const tabs: NavTab[] = [];

    // ── Tab 1 : Accueil — toujours présent ──
    tabs.push({ id: 'home', label: 'Accueil', icon: 'home', route: '/home' });

    // ── Tabs selon rôle ──
    if (isAdmin) {
      tabs.push({ id: 'groups',  label: 'Groupes',  icon: 'group',     route: '/admin/groupes'      });
      tabs.push({ id: 'users',   label: 'Utilisateurs', icon: 'person', route: '/admin/utilisateurs' });

    } else if (isResponsable && hasGroup) {
      // Vérifier quels menus sont disponibles via les catégories chargées
      const hasMatchMenu    = this.hasMenuInCategories('MATCHS')    || this.hasMenuInCategories('SPORT');
      const hasMembresMenu  = this.hasMenuInCategories('MEMBRES')   || this.hasMenuInCategories('GESTION');
      const hasFinanceMenu  = this.hasMenuInCategories('FINANCES');
      const hasChatMenu     = this.hasMenuCommun('CHAT') || true; // chat toujours si connecté

      if (hasMembresMenu) {
        tabs.push({ id: 'membres', label: 'Membres', icon: 'group', route: '/responsable/membres' });
      }
      if (hasMatchMenu) {
        tabs.push({
          id: 'matchs', label: 'Matchs', icon: 'sports_soccer',
          route: '/responsable/matchs',
          badge: this.upcomingMatchCount > 0 ? this.upcomingMatchCount : undefined
        });
      }
      if (hasFinanceMenu) {
        tabs.push({ id: 'finances', label: 'Finances', icon: 'account_balance', route: '/responsable/finances/dashboard' });
      }

    } else if (isMembre && hasGroup) {
      tabs.push({ id: 'actus',   label: 'Actus',   icon: 'newspaper',     route: '/actualites'    });
      tabs.push({ id: 'tableau', label: 'Tableau',  icon: 'dashboard',     route: '/membre/dashboard' });

    } else if (isPartenaire) {
      tabs.push({ id: 'dashboard', label: 'Dashboard', icon: 'dashboard', route: '/partenaire/dashboard' });
      tabs.push({ id: 'pubs',      label: 'Publicités', icon: 'campaign', route: '/partenaire/publicite' });

    } else {
      // Pas de groupe — tab explorer
      tabs.push({ id: 'explorer', label: 'Explorer', icon: 'explore', route: '/explorer' });
    }

    // ── Tab Chat — si connecté avec groupe (sauf admin) ──
    if ((isResponsable || isMembre) && hasGroup) {
      tabs.push({
        id: 'chat', label: 'Chat', icon: 'chat_bubble_outline',
        route: '/chat',
        badge: this.unreadCount > 0 ? this.unreadCount : undefined
      });
    }

    // ── Tab Plus — TOUJOURS présent, TOUJOURS en 5ème position ──
    // Les autres tabs se limitent à 4 pour lui laisser la place
    const contentTabs = tabs.slice(0, 4);
    contentTabs.push({ id: 'more', label: 'Plus', icon: 'more_horiz', route: '' });
    this.tabs = contentTabs;
    this.cdr.markForCheck();
  }

  // Vérifie si une catégorie de menu existe dans les menus chargés
  private hasMenuInCategories(keyword: string): boolean {
    return this._menuCategories.some(c =>
      c.code.toUpperCase().includes(keyword) ||
      c.menus.some(m => m.code.toUpperCase().includes(keyword))
    );
  }

  // Vérifie si un menu commun existe
  private hasMenuCommun(code: string): boolean {
    return this._menusCommuns.some(m => m.code.toUpperCase() === code.toUpperCase());
  }

  private shouldHide(url: string): boolean {
    if (!this.authService.isLoggedIn()) return true;
    return this.HIDDEN_ROUTES.some(r => url.startsWith(r));
  }

  isTabActive(tab: NavTab): boolean {
    if (tab.id === 'more') return this.moreDrawerOpen;
    return this.router.url.startsWith(tab.route);
  }

  onTabClick(tab: NavTab): void {
    if (tab.id === 'more') {
      this.moreClick.emit();
      return;
    }
    if (tab.route) {
      this.router.navigate([tab.route]);
    }
    // Haptic feedback Capacitor
    try {
      const cap = (window as any).Capacitor;
      if (cap?.isPluginAvailable?.('Haptics')) {
        cap.Plugins.Haptics.impact({ style: 'light' });
      }
    } catch {}
  }
}