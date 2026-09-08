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

  @Input() unreadCount        = 0;
  @Input() upcomingMatchCount = 0;
  @Input() moreDrawerOpen     = false;
  @Input() set menusCommuns(v: Menu[])           { this._menusCommuns   = v; this.buildTabs(); }
  @Input() set menuCategories(v: MenuCategorie[]) { this._menuCategories = v; this.buildTabs(); }

  @Output() moreClick = new EventEmitter<void>();

  tabs:     NavTab[] = [];
  isHidden = false;

  private _menusCommuns:   Menu[]          = [];
  private _menuCategories: MenuCategorie[] = [];
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
    this.authService.isUserReady$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(ready => {
      if (ready) this.buildTabs();
      this.cdr.markForCheck();
    });

    this.authService.currentGroupeId$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.buildTabs();
      this.cdr.markForCheck();
    });

    // FIX : reconstruire les tabs quand groupeActifAccess change
    // (switch de groupe ou chargement initial des groupes)
    // Permet de refléter estResponsableGroupe/roleCustom sur mobile
    this.authService.groupeActifAccess$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.buildTabs();
      this.cdr.markForCheck();
    });

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

  private buildTabs(): void {
    if (!this.authService.isLoggedIn()) {
      this.tabs = [];
      this.cdr.markForCheck();
      return;
    }

    const roles   = this.authService.getRoles() || [];
    const groupe  = this.authService.getGroupe();
    const hasGroup = !!groupe && groupe > 0;

    const isAdmin      = roles.some(r => r === 'ADMIN'      || r === 'ROLE_ADMIN');
    const isPartenaire = roles.some(r => r === 'PARTENAIRE' || r === 'ROLE_PARTENAIRE');

    // FIX : utiliser authService.isResponsable() qui lit groupeActifAccess
    // plutôt que les rôles JWT — couvre :
    // - users avec ROLE_RESPONSABLE (grand écran, déjà marchait)
    // - users avec ROLE_MEMBRE mais estResponsableGroupe=true (mobile, fusionnés)
    // - users avec ROLE_MEMBRE mais roleCustom assigné
    const isResponsable = !isAdmin && !isPartenaire && this.authService.isResponsable();
    const isMembre      = !isAdmin && !isPartenaire && !isResponsable
                          && roles.some(r => r === 'MEMBRE' || r === 'ROLE_MEMBRE');

    const tabs: NavTab[] = [];

    // Tab 1 : Accueil — toujours présent
    tabs.push({ id: 'home', label: 'Accueil', icon: 'home', route: '/home' });

    if (isAdmin) {
      tabs.push({ id: 'groups', label: 'Groupes',       icon: 'group',  route: '/admin/groupes'       });
      tabs.push({ id: 'users',  label: 'Utilisateurs',  icon: 'person', route: '/admin/utilisateurs'  });

    } else if (isResponsable && hasGroup) {
      const hasMatchMenu   = this.hasMenuInCategories('MATCHS')  || this.hasMenuInCategories('SPORT');
      const hasMembresMenu = this.hasMenuInCategories('MEMBRES') || this.hasMenuInCategories('GESTION');
      const hasFinanceMenu = this.hasMenuInCategories('FINANCES');

      if (hasMembresMenu) {
        tabs.push({ id: 'membres',  label: 'Membres',  icon: 'group',            route: '/responsable/membres'             });
      }
      if (hasMatchMenu) {
        tabs.push({ id: 'matchs',   label: 'Matchs',   icon: 'sports_soccer',    route: '/responsable/matchs',
                    badge: this.upcomingMatchCount > 0 ? this.upcomingMatchCount : undefined });
      }
      if (hasFinanceMenu) {
        tabs.push({ id: 'finances', label: 'Finances', icon: 'account_balance',  route: '/responsable/finances/dashboard'  });

      }
      if (hasFinanceMenu) {
       // Compétitions — toujours visible pour le responsable
      tabs.push({ id: 'competitions', label: 'Compétitions', icon: 'emoji_events', route: '/competitions' });
      }

    } else if (isMembre && hasGroup) {
      tabs.push({ id: 'actus',   label: 'Actus',   icon: 'newspaper',  route: '/actualites'       });
      tabs.push({ id: 'tableau', label: 'Tableau',  icon: 'dashboard',  route: '/membre/dashboard' });

    } else if (isPartenaire) {
      tabs.push({ id: 'dashboard', label: 'Dashboard',  icon: 'dashboard', route: '/partenaire/dashboard' });
      tabs.push({ id: 'pubs',      label: 'Publicités', icon: 'campaign',  route: '/partenaire/publicite' });

    } else {
      tabs.push({ id: 'explorer', label: 'Explorer', icon: 'explore', route: '/explorer' });
    }

    // Tab Chat
    if ((isResponsable || isMembre) && hasGroup) {
      tabs.push({
        id: 'chat', label: 'Chat', icon: 'chat_bubble_outline',
        route: '/chat',
        badge: this.unreadCount > 0 ? this.unreadCount : undefined
      });
    }

    // Tab Plus — toujours en 5ème position
    const contentTabs = tabs.slice(0, 4);
    contentTabs.push({ id: 'more', label: 'Plus', icon: 'more_horiz', route: '' });
    this.tabs = contentTabs;
    this.cdr.markForCheck();
  }

  private hasMenuInCategories(keyword: string): boolean {
    return this._menuCategories.some(c =>
      c.code.toUpperCase().includes(keyword) ||
      c.menus.some(m => m.code.toUpperCase().includes(keyword))
    );
  }

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
    try {
      const cap = (window as any).Capacitor;
      if (cap?.isPluginAvailable?.('Haptics')) {
        cap.Plugins.Haptics.impact({ style: 'light' });
      }
    } catch {}
  }
}