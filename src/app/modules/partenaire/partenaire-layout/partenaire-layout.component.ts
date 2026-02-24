// ============================================================
// PARTENAIRE LAYOUT COMPONENT
// Layout spécifique pour l'espace partenaire
// Même architecture que le layout principal
// ============================================================

import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription, filter } from 'rxjs';



import { PartenaireAuthService } from '../../../core/services/partenaire-auth.service';
import { ThemeService } from 'ng2-charts';
import { PartenaireDTO } from '../../../core/models/partenaire.model';
import { PartenaireService } from '../../../core/services/partenaire.service';
import { MatFormFieldModule } from '@angular/material/form-field';

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  badge?: number;
  badgeColor?: string;
  category?: string;
}

interface MenuCategory {
  id: string;
  label: string;
  icon: string;
  items: MenuItem[];
}

@Component({
  selector: 'app-partenaire-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
    MatBadgeModule,
    MatProgressSpinnerModule,
    TranslateModule,
    MatButtonModule,
    MatToolbarModule,
    MatTooltipModule,
    MatFormFieldModule
  ],
  templateUrl: './partenaire-layout.component.html',
  styleUrls: ['./partenaire-layout.component.scss']
})
export class PartenaireLayoutComponent implements OnInit, OnDestroy {
  @ViewChild('sidenav') sidenav!: MatSidenav;

  // État utilisateur
  partenaire: PartenaireDTO | null = null;
  user: any = null;
  userRole: string = '';
  isLoading = true;

  // UI State
  isMobile = false;
  sidebarOpen = true;
  currentRoute = '';
  isDarkTheme = false;
  currentLang = 'fr';

  // Menus
  menuCategories: MenuCategory[] = [];
  pendingAdsCount = 0;

  private subscriptions: Subscription[] = [];

  constructor(
    public authService: PartenaireAuthService,
    private partenaireService: PartenaireService,
    private themeService: ThemeService,
    private translateService: TranslateService,
    private router: Router,
    private breakpointObserver: BreakpointObserver
  ) {}

  ngOnInit(): void {
    this.setupResponsiveLayout();
    this.setupLanguage();
    this.loadPartenaireData();
    this.buildMenus();
    this.trackRouteChanges();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // ===== SETUP =====

  private setupResponsiveLayout(): void {
    const sub = this.breakpointObserver
      .observe([Breakpoints.Handset, Breakpoints.Tablet])
      .subscribe(result => {
        this.isMobile = result.matches;
        this.sidebarOpen = !this.isMobile;
      });
    this.subscriptions.push(sub);
  }

  // private setupTheme(): void {
  //   const sub = this.themeService.isDarkTheme$.subscribe((isDark: boolean) => {
  //     this.isDarkTheme = isDark;
  //   });
  //   this.subscriptions.push(sub);
  // }

  private setupLanguage(): void {
    this.currentLang = this.translateService.currentLang || 'fr';
    const sub = this.translateService.onLangChange.subscribe(event => {
      this.currentLang = event.lang;
    });
    this.subscriptions.push(sub);
  }

  private trackRouteChanges(): void {
    this.currentRoute = this.router.url;
    const sub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.currentRoute = event.urlAfterRedirects;
      if (this.isMobile) {
        this.closeSidebar();
      }
    });
    this.subscriptions.push(sub);
  }

  // ===== DATA LOADING =====

  private loadPartenaireData(): void {
    this.isLoading = true;
    
    // Charger les infos utilisateur
    this.user = this.authService.getUser();
    this.userRole = this.authService.getRole();

    // Charger les infos partenaire
    const sub = this.partenaireService.getMonPartenaire().subscribe({
      next: (partenaire) => {
        this.partenaire = partenaire;
        this.isLoading = false;
        this.loadPendingAdsCount();
      },
      error: (err) => {
        console.error('Erreur chargement partenaire:', err);
        this.isLoading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  private loadPendingAdsCount(): void {
    const sub = this.partenaireService.getMesPublicites('EN_ATTENTE').subscribe({
      next: (pubs) => {
        this.pendingAdsCount = pubs.length;
        this.updateMenuBadges();
      },
      error: () => {
        this.pendingAdsCount = 0;
      }
    });
    this.subscriptions.push(sub);
  }

  // ===== MENUS =====

  private buildMenus(): void {
    this.menuCategories = [
      {
        id: 'main',
        label: 'partenaire.nav.gestion',
        icon: 'dashboard',
        items: [
          {
            id: 'dashboard',
            label: 'partenaire.nav.dashboard',
            icon: 'dashboard',
            route: '/partenaire/dashboard'
          },
          {
            id: 'entreprises',
            label: 'partenaire.nav.entreprises',
            icon: 'business',
            route: '/partenaire/entreprises'
          },
          {
            id: 'publicites',
            label: 'partenaire.nav.publicites',
            icon: 'campaign',
            route: '/partenaire/publicites',
            badge: this.pendingAdsCount,
            badgeColor: 'warn'
          }
        ]
      },
      {
        id: 'analytics',
        label: 'partenaire.nav.marketing',
        icon: 'analytics',
        items: [
          {
            id: 'statistiques',
            label: 'partenaire.nav.statistiques',
            icon: 'bar_chart',
            route: '/partenaire/statistiques'
          }
        ]
      },
      {
        id: 'settings',
        label: 'partenaire.nav.parametres',
        icon: 'settings',
        items: [
          {
            id: 'utilisateurs',
            label: 'partenaire.nav.utilisateurs',
            icon: 'people',
            route: '/partenaire/utilisateurs'
          },
          {
            id: 'parametres',
            label: 'partenaire.nav.parametres',
            icon: 'settings',
            route: '/partenaire/parametres'
          }
        ]
      }
    ];
  }

  private updateMenuBadges(): void {
    // Mettre à jour le badge des publicités
    const mainCategory = this.menuCategories.find(c => c.id === 'main');
    if (mainCategory) {
      const pubItem = mainCategory.items.find(i => i.id === 'publicites');
      if (pubItem) {
        pubItem.badge = this.pendingAdsCount > 0 ? this.pendingAdsCount : undefined;
      }
    }
  }

  // ===== UI ACTIONS =====

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar(): void {
    if (this.isMobile) {
      this.sidebarOpen = false;
    }
  }

  onNavClick(item: MenuItem): void {
    this.router.navigate([item.route]);
    this.closeSidebar();
  }

  isRouteActive(route: string): boolean {
    return this.currentRoute.startsWith(route);
  }

  // ===== THEME & LANGUAGE =====

  // toggleTheme(): void {
  //   this.themeService.toggleTheme();
  // }

  switchLanguage(lang: string): void {
    this.translateService.use(lang);
    localStorage.setItem('lang', lang);
  }

  // ===== USER ACTIONS =====

  openProfile(): void {
    this.router.navigate(['/partenaire/parametres']);
    this.closeSidebar();
  }

  openHelp(): void {
    // Ouvrir l'aide
    window.open('https://support.my2-0.com/partenaires', '_blank');
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/partenaire/login']);
  }

  // ===== HELPERS =====

  getContractStatusClass(): string {
    if (!this.partenaire) return '';
    
    const endDate = this.partenaire.dateFinContrat;
    if (!endDate) return 'status-active';
    
    const daysRemaining = this.getDaysRemaining();
    if (daysRemaining < 0) return 'status-expired';
    if (daysRemaining <= 30) return 'status-warning';
    return 'status-active';
  }

  getDaysRemaining(): number {
    if (!this.partenaire?.dateFinContrat) return 999;
    const end = new Date(this.partenaire.dateFinContrat);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  getInitials(): string {
    if (!this.user) return 'P';
    const prenom = this.user.prenom || '';
    const nom = this.user.nom || '';
    return (prenom.charAt(0) + nom.charAt(0)).toUpperCase();
  }

  getCurrentYear(): number {
    return new Date().getFullYear();
  }

  trackByCategory(index: number, category: MenuCategory): string {
    return category.id;
  }

  trackByItem(index: number, item: MenuItem): string {
    return item.id;
  }
}