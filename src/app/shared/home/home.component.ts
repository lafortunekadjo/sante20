import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environment';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatRippleModule } from '@angular/material/core';
import { AuthService } from '../../core/services/auth.service';
import { TranslateModule } from '@ngx-translate/core';
import { CampagneBannerComponent } from '../../modules/gamification/campagne-banner/campagne-banner.component';

interface Feature {
  icon: string;
  /** Clé de traduction : home.data.features.<cle>.title / .description */
  cle: string;
  color: string;
}

/** Titre et description : home.data.tutorials.<id>.title / .description. Catégorie : home.data.tutorialCategories.<category>. */
interface Tutorial {
  id: number;
  type: 'video' | 'pdf';
  url: string;
  thumbnail?: string;
  duration?: string;
  category: string;
}

/** Question et réponse : home.data.faq.<cle>.q / .a. Catégorie : home.data.faqCategories.<category>. */
interface FAQ {
  cle: string;
  category: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatChipsModule,
    MatDividerModule,
    MatRippleModule,
    TranslateModule,
    CampagneBannerComponent
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  isLoggedIn = false;
  currentYear = new Date().getFullYear();

  // Fonctionnalités principales
  features: Feature[] = [
    { icon: 'groups', cle: 'group', color: '#1976d2' },
    { icon: 'sports_soccer', cle: 'matches', color: '#388e3c' },
    { icon: 'how_to_reg', cle: 'attendance', color: '#f57c00' },
    { icon: 'emoji_events', cle: 'stats', color: '#7b1fa2' },
    { icon: 'attach_money', cle: 'finances', color: '#00796b' },
    { icon: 'notifications_active', cle: 'notifications', color: '#c2185b' }
  ];

  // Tutoriels
  tutorials: Tutorial[] = [
    { id: 1, type: 'video', url: 'assets/tutorials/getting-started.mp4', thumbnail: 'assets/tutorials/thumbnails/getting-started.svg', duration: '5:30', category: 'start' },
    { id: 2, type: 'video', url: 'assets/tutorials/manage-members.mp4', thumbnail: 'assets/tutorials/thumbnails/members.svg', duration: '4:15', category: 'members' },
    { id: 3, type: 'video', url: 'assets/tutorials/create-match.mp4', thumbnail: 'assets/tutorials/thumbnails/match.svg', duration: '6:45', category: 'matches' },
    { id: 4, type: 'video', url: 'assets/tutorials/presences.mp4', thumbnail: 'assets/tutorials/thumbnails/presences.svg', duration: '7:20', category: 'attendance' },
    { id: 5, type: 'pdf', url: 'assets/tutorials/guide-complet-sante2.pdf', category: 'docs' },
    { id: 6, type: 'video', url: 'assets/tutorials/match-amical.mp4', thumbnail: 'assets/tutorials/thumbnails/amical.svg', duration: '5:00', category: 'matches' },
    { id: 7, type: 'pdf', url: 'assets/tutorials/guide-finances.pdf', category: 'finances' },
    { id: 8, type: 'video', url: 'assets/tutorials/print-sheets.mp4', thumbnail: 'assets/tutorials/thumbnails/print.svg', duration: '3:10', category: 'attendance' }
  ];

  // FAQ
  faqs: FAQ[] = [
    { cle: 'createGroup', category: 'group' },
    { cle: 'addMember', category: 'members' },
    { cle: 'matchTypes', category: 'matches' },
    { cle: 'friendly', category: 'matches' },
    { cle: 'recordStats', category: 'attendance' },
    { cle: 'printSheet', category: 'attendance' },
    { cle: 'dues', category: 'finances' },
    { cle: 'groupStats', category: 'stats' },
    { cle: 'mobile', category: 'general' }
  ];

  // Catégories (identifiants : le libellé affiché vient de home.data.*Categories.<id>)
  tutorialCategories = ['all', 'start', 'members', 'matches', 'attendance', 'finances', 'docs'];
  selectedTutorialCategory = 'all';
  tutoTab: 'video' | 'pdf' = 'video';

  // Catégories FAQ
  faqCategories = ['all', 'group', 'members', 'matches', 'attendance', 'finances', 'stats', 'general'];
  selectedFaqCategory = 'all';

  constructor(
    private router: Router,
    private authService: AuthService,
    private http: HttpClient
  ) {}

  // Chiffres réels de la plateforme (groupes publics actifs, joueurs, matchs joués). Masqués si indisponibles.
  chiffres: { groupes: number; joueurs: number; matchs: number } | null = null;

  ngOnInit(): void {
    this.isLoggedIn = this.authService.isAuthenticated();
    this.http.get<{ groupes: number; joueurs: number; matchs: number }>(`${environment.apiUrl}/public/chiffres`).subscribe({
      next: c => { this.chiffres = c && (c.groupes || c.joueurs || c.matchs) ? c : null; },
      error: () => { this.chiffres = null; }
    });
  }

  /** « 12 » reste « 12 », 137 devient « 130+ », 2 480 devient « 2400+ » : un ordre de grandeur honnête, jamais gonflé. */
  arrondi(n: number): string {
    if (n < 10) return String(n);
    const pas = n < 100 ? 10 : n < 1000 ? 50 : 100;
    return Math.floor(n / pas) * pas + '+';
  }

  navigateToPilote(): void {
    this.router.navigate(['/pilote']);
  }

  // Tutoriels dont le fichier existe réellement ; les autres affichent « Bientôt » au lieu d'un lien mort.
  private readonly disponibles = new Set<string>(['assets/tutorials/getting-started.mp4']);

  estDisponible(t: Tutorial): boolean {
    return this.disponibles.has(t.url);
  }

  // Navigation
  navigateToExplore(): void {
    this.router.navigate(['/explorer']);
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  navigateToRegister(): void {
    this.router.navigate(['/signup']);
  }

  navigateToDashboard(): void {
    this.router.navigate(['/membre/dashboard']);
  }

  // Tutoriels
  get filteredTutorials(): Tutorial[] {
    if (this.selectedTutorialCategory === 'all') {
      return this.tutorials;
    }
    return this.tutorials.filter(t => t.category === this.selectedTutorialCategory);
  }

  get videoTutorials(): Tutorial[] {
    return this.filteredTutorials.filter(t => t.type === 'video');
  }

  get pdfTutorials(): Tutorial[] {
    return this.filteredTutorials.filter(t => t.type === 'pdf');
  }

  selectTutorialCategory(category: string): void {
    this.selectedTutorialCategory = category;
  }

  openTutorial(tutorial: Tutorial): void {
    if (!this.estDisponible(tutorial)) return;
    if (tutorial.type === 'video') {
      // Ouvrir dans un modal ou nouvelle page
      window.open(tutorial.url, '_blank');
    } else {
      // Télécharger le PDF
      window.open(tutorial.url, '_blank');
    }
  }

  // FAQ
  get filteredFaqs(): FAQ[] {
    if (this.selectedFaqCategory === 'all') {
      return this.faqs;
    }
    return this.faqs.filter(f => f.category === this.selectedFaqCategory);
  }

  selectFaqCategory(category: string): void {
    this.selectedFaqCategory = category;
  }

  // Tutoriels — helpers
  getThumbnail(tutorial: Tutorial): string {
    if (tutorial.thumbnail) return tutorial.thumbnail;
    // Si c'est une URL YouTube, extraire la miniature automatiquement
    const ytMatch = tutorial.url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (ytMatch) {
      return `https://img.youtube.com/vi/${ytMatch[1]}/mqdefault.jpg`;
    }
    return 'assets/images/video-placeholder.jpg';
  }

  onThumbError(event: any): void {
    event.target.src = 'assets/images/video-placeholder.jpg';
  }

  // Contact
  contactSupport(): void {
    window.location.href = 'mailto:support@my2-0.cloud?subject=Support My2-0';
  }

  openWhatsApp(): void {
    window.open('https://wa.me/237691191385?text=Bonjour, j\'ai besoin d\'aide avec My2-0', '_blank');
  }
}