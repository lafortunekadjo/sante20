import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatRippleModule } from '@angular/material/core';
import { AuthService } from '../../core/services/auth.service';
import { TranslateModule } from '@ngx-translate/core';

interface Feature {
  icon: string;
  title: string;
  description: string;
  color: string;
}

interface Tutorial {
  id: number;
  title: string;
  description: string;
  type: 'video' | 'pdf';
  url: string;
  thumbnail?: string;
  duration?: string;
  category: string;
}

interface FAQ {
  question: string;
  answer: string;
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
    MatTabsModule,
    MatChipsModule,
    MatDividerModule,
    MatRippleModule,
    TranslateModule
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  isLoggedIn = false;
  currentYear = new Date().getFullYear();

  // Fonctionnalités principales
  features: Feature[] = [
    {
      icon: 'groups',
      title: 'Gestion de Groupe',
      description: 'Créez et gérez votre 2-0. Ajoutez des membres, définissez des équipes internes et organisez votre effectif.',
      color: '#1976d2'
    },
    {
      icon: 'sports_soccer',
      title: 'Organisation des Matchs',
      description: 'Planifiez vos matchs internes, duels inter-équipes, rencontres amicales et événements spéciaux comme les anniversaires.',
      color: '#388e3c'
    },
    {
      icon: 'how_to_reg',
      title: 'Suivi des Présences',
      description: 'Enregistrez les présences, suivez les statistiques de participation et générez des fiches de match imprimables.',
      color: '#f57c00'
    },
    {
      icon: 'emoji_events',
      title: 'Statistiques & Classements',
      description: 'Consultez les statistiques détaillées : buts, passes, cartons, hommes du match et classements des joueurs.',
      color: '#7b1fa2'
    },
    {
      icon: 'attach_money',
      title: 'Gestion Financière',
      description: 'Suivez les cotisations, les pénalités et la trésorerie de votre groupe avec des rapports détaillés.',
      color: '#00796b'
    },
    {
      icon: 'notifications_active',
      title: 'Invitations & Notifications',
      description: 'Envoyez des invitations pour les matchs amicaux et recevez les confirmations de présence en temps réel.',
      color: '#c2185b'
    }
  ];

  // Tutoriels
  tutorials: Tutorial[] = [
    {
      id: 1,
      title: 'Premiers pas avec My2-0',
      description: 'Découvrez comment créer votre compte et configurer votre premier groupe sportif.',
      type: 'video',
      url: 'assets/tutorials/getting-started.mp4',
      thumbnail: 'assets/tutorials/thumbnails/getting-started.jpg',
      duration: '5:30',
      category: 'Démarrage'
    },
    {
      id: 2,
      title: 'Ajouter et gérer les membres',
      description: 'Apprenez à ajouter des membres, définir leurs rôles et les assigner à des équipes.',
      type: 'video',
      url: 'assets/tutorials/manage-members.mp4',
      thumbnail: 'assets/tutorials/thumbnails/members.jpg',
      duration: '4:15',
      category: 'Membres'
    },
    {
      id: 3,
      title: 'Créer et planifier un match',
      description: 'Comment créer différents types de matchs et configurer les équipes participantes.',
      type: 'video',
      url: 'assets/tutorials/create-match.mp4',
      thumbnail: 'assets/tutorials/thumbnails/match.jpg',
      duration: '6:45',
      category: 'Matchs'
    },
    {
      id: 4,
      title: 'Enregistrer les présences et stats',
      description: 'Tutoriel complet sur l\'enregistrement des présences, buts, passes et cartons.',
      type: 'video',
      url: 'assets/tutorials/presences.mp4',
      thumbnail: 'assets/tutorials/thumbnails/presences.jpg',
      duration: '7:20',
      category: 'Présences'
    },
    {
      id: 5,
      title: 'Guide complet de l\'application',
      description: 'Documentation PDF complète couvrant toutes les fonctionnalités de la plateforme.',
      type: 'pdf',
      url: 'assets/tutorials/guide-complet-sante2.pdf',
      category: 'Documentation'
    },
    {
      id: 6,
      title: 'Organiser un match amical',
      description: 'Comment inviter un autre groupe et gérer les présences des deux équipes.',
      type: 'video',
      url: 'assets/tutorials/match-amical.mp4',
      thumbnail: 'assets/tutorials/thumbnails/amical.jpg',
      duration: '5:00',
      category: 'Matchs'
    },
    {
      id: 7,
      title: 'Gestion financière du groupe',
      description: 'Guide PDF sur la gestion des cotisations, pénalités et trésorerie.',
      type: 'pdf',
      url: 'assets/tutorials/guide-finances.pdf',
      category: 'Finances'
    },
    {
      id: 8,
      title: 'Imprimer les fiches de match',
      description: 'Comment générer et imprimer les fiches de présence et feuilles de match.',
      type: 'video',
      url: 'assets/tutorials/print-sheets.mp4',
      thumbnail: 'assets/tutorials/thumbnails/print.jpg',
      duration: '3:10',
      category: 'Présences'
    }
  ];

  // FAQ
  faqs: FAQ[] = [
    {
      question: 'Comment créer un nouveau groupe ?',
      answer: 'Après vous être connecté, accédez à "Créer un groupe". Remplissez les informations du groupe (nom, ville et abrieviation) puis cree le groupe, une fois valide, vous serez notifiez.',
      category: 'Groupe'
    },
    {
      question: 'Comment ajouter un membre à mon groupe ?',
      answer: 'Dans la section "Gestion des membres", cliquez sur "Ajouter un membre". Renseignez le nom, prénom, poste préféré et assignez-le optionnellement à une équipe interne. Le membre recevra une notification s\'il a un compte.',
      category: 'Membres'
    },
    {
      question: 'Quels sont les différents types de matchs ?',
      answer: 'La plateforme supporte 4 types de matchs : INTERNE (entre équipes du groupe), DUEL (défi entre 2 équipes), AMICAL (contre un autre groupe ou équipe externe), et ANNIVERSAIRE (match spécial pour célébrer les membres).',
      category: 'Matchs'
    },
    {
      question: 'Comment organiser un match amical avec un autre groupe ?',
      answer: 'Créez un match de type "AMICAL" et recherchez le groupe adverse sur la plateforme ou generez une invitation et transferez a l\'adversaire.',
      category: 'Matchs'
    },
    {
      question: 'Comment enregistrer les statistiques d\'un match ?',
      answer: 'Dans la section Match, cliquer sur fiche de presence, Sur la fiche de présence du match, ajoutez les joueurs, cochez "A joué" pour chaque participant, puis renseignez les buts, passes décisives, pénaltys, cartons et désignez le capitaine et l\'homme du match pour chaque équipe.',
      category: 'Présences'
    },
    {
      question: 'Comment imprimer la feuille de match ?',
      answer: 'Sur la page de présence d\'un match, utilisez les boutons "Imprimer Fiche" ou "Télécharger PDF" pour générer un document officiel avec les compositions d\'équipes, statistiques et espaces de signature.',
      category: 'Présences'
    },
    {
      question: 'Comment gérer les cotisations des membres ?',
      answer: 'Accédez à la section "Finances" de votre groupe. Vous pouvez définir le montant des cotisations, enregistrer les paiements et suivre les arriérés. Des rappels automatiques peuvent être envoyés.',
      category: 'Finances'
    },
    
    {
      question: 'Comment voir les statistiques de mon groupe ?',
      answer: 'Le tableau de bord affiche les KPIs essentiels. Pour des statistiques détaillées, consultez la section "Classements" qui présente les meilleurs buteurs, passeurs et le palmarès des matchs.',
      category: 'Statistiques'
    },
    {
      question: 'L\'application est-elle disponible sur mobile ?',
      answer: 'Oui, My2-0 est une application responsive qui fonctionne parfaitement sur smartphone et tablette. Une application mobile native est également en développement.',
      category: 'Général'
    }
  ];

  // Catégories de tutoriels
  tutorialCategories = ['Tous', 'Démarrage', 'Membres', 'Matchs', 'Présences', 'Finances', 'Documentation'];
  selectedTutorialCategory = 'Tous';

  // Catégories FAQ
  faqCategories = ['Tous', 'Groupe', 'Membres', 'Matchs', 'Présences', 'Finances', 'Statistiques', 'Général'];
  selectedFaqCategory = 'Tous';

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.isLoggedIn = this.authService.isAuthenticated();
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
    if (this.selectedTutorialCategory === 'Tous') {
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
    if (this.selectedFaqCategory === 'Tous') {
      return this.faqs;
    }
    return this.faqs.filter(f => f.category === this.selectedFaqCategory);
  }

  selectFaqCategory(category: string): void {
    this.selectedFaqCategory = category;
  }

  // Contact
  contactSupport(): void {
    window.location.href = 'mailto:support@sante2.cm?subject=Support Santé 2.0';
  }

  openWhatsApp(): void {
    window.open('https://wa.me/237600000000?text=Bonjour, j\'ai besoin d\'aide avec Santé 2.0', '_blank');
  }
}