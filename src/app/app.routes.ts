// src/app/app.routes.ts

import { Routes } from "@angular/router";
import { RoleGuard } from "./core/guards/role.guard";
import { MenuGuard } from "./core/guards/menu.guard";

// Pages publiques
import { PasswordResetDialogComponent } from "./shared/components/password-reset-dialog/password-reset-dialog.component";

// Layout
import { LayoutComponent } from "./shared/components/layout/layout.component";

// Admin
import { DashboardComponent as AdminDashboardComponent } from "./modules/admin/components/dashboard/dashboard.component";
import { GroupeListComponent } from "./modules/admin/components/groupe-list/groupe-list.component";
import { GroupeFormComponent } from "./modules/admin/components/groupe-form/groupe-form.component";
import { UserFormComponent } from "./modules/admin/components/user-form/user-form.component";

// Membre
import { MDashboardComponent } from "./modules/membre/components/dashboard/dashboard.component";

// Responsable
import { RDashboardComponent } from "./modules/responsable/components/dashboard/dashboard.component";
import { GestionDemandesGroupeComponent } from "./modules/responsable/components/gestion-demandes-groupe/gestion-demandes-groupe.component";
import { GroupeConfigComponent } from "./modules/responsable/components/groupe-config/groupe-config.component";
import { MatchFormComponent } from "./modules/responsable/components/match-form/match-form.component";
import { PresenceFormComponent } from "./modules/responsable/components/presence-form/presence-form.component";
import { PaiementSanctionFormComponent } from "./modules/responsable/components/paiement-sanction-form/paiement-sanction-form.component";
import { EvenementComponent } from "./modules/responsable/components/evenement/evenement.component";
import { ContributionFormComponent } from "./modules/responsable/components/contribution-form/contribution-form.component";
import { ContributionComponent } from "./modules/responsable/components/contribution/contribution.component";
import { TypeSortieComponent } from "./modules/responsable/components/type-sortie/type-sortie.component";
import { TypeSanctionComponent } from "./modules/responsable/components/type-sanction/type-sanction.component";
import { SanctionFormComponent } from "./modules/responsable/components/sanction-form/sanction-form.component";

// Commun
import { NewsFeedComponent } from "./modules/membre/components/news-feed/news-feed.component";
import { SuggestionsComponent } from "./modules/membre/components/suggestions/suggestions.component";
import { ObjectifsComponent } from "./modules/membre/components/objectifs/objectifs.component";
import { ChatMainComponent } from "./modules/chats/chat-main/chat-main.component";
import { GestionRolesComponent } from "./modules/responsable/components/gestion-roles/gestion-roles/gestion-roles.component";
import { MesDemandesComponent } from "./modules/users/mes-demandes/mes-demandes.component";
import { LoginComponent } from "./shared/components/login/login.component";
import { GroupesExploreComponent } from "./modules/responsable/components/groupes-explore/groupes-explore.component";
import { SignupComponent } from "./shared/components/signup/signup.component";
import { MembreFormComponent } from "./modules/responsable/components/membre-form/membre-form.component";
import { InvitationListComponent } from "./modules/users/invitation-list/invitation-list.component";
import { PublicMatchInviteComponent } from "./modules/users/public-match-invite/public-match-invite.component";
import { UserGroupRegisterComponent } from "./shared/user-group-register/user-group-register.component";
import { AboutTutoPageComponent } from "./shared/about-tuto-page/about-tuto-page.component";
import { HomeComponent } from "./shared/home/home.component";
import { QrGeneratorComponent } from "./shared/qr-generator/qr-generator.component";
import { QrDashboardComponent } from "./shared/qr-dashboard/qr-dashboard.component";
import { EntreeCaisseComponent } from "./modules/responsable/components/entree-caisse/entree-caisse.component";
import { ExerciceManagementComponent } from "./modules/responsable/components/exercice-management/exercice-management.component";
import { FinancialDashboardComponent } from "./modules/responsable/components/financial-dashboard/financial-dashboard.component";
import { SortieCaisseComponent } from "./modules/responsable/components/sortie-caisse/sortie-caisse.component";
import { TypeContributionComponent } from "./modules/responsable/components/type-contribution/type-contribution.component";

//import { CaisseComponent } from "./modules/responsable/components/caisses/caisse.component";
//import { CaisseDetailComponent } from "./modules/responsable/components/caisse-detail/caisse-detail.component";
//import { MouvementsHistoriqueComponent } from "./modules/responsable/components/mouvements-historique/mouvements-historique.component";
//import { BilanComponent } from "./modules/responsable/components/bilan/bilan.component";
//import { EcheancierComponent } from "./modules/responsable/components/echeancier/echeancier.component";

// ==================== FINANCES - NOUVEAUX COMPOSANTS ====================



export const routes: Routes = [

  { path: 'generator', component: QrGeneratorComponent },
  { path: 'dashboard', component: QrDashboardComponent },

  // ==================== ROUTES PROTÉGÉES (avec Layout et authentification) ====================
  
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: '',
        component: HomeComponent,
      },
      {
        path: 'match/invite/:token',
        component: PublicMatchInviteComponent,
      },
      {
        path: 'creategroup',
        component: UserGroupRegisterComponent,
      },
      {
        path: 'apropos',
        component: HomeComponent,
      },
      {
        path: 'home',
        component: HomeComponent,
      },

      // ==================== ROUTES COMMUNES (tous les utilisateurs connectés) ====================
      {
        path: 'explorer',
        component: GroupesExploreComponent,
      },
      {
        path: 'mes-demandes',
        component: MesDemandesComponent,
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN', 'RESPONSABLE', 'MEMBRE', 'ROLE_ADMIN', 'ROLE_RESPONSABLE', 'ROLE_MEMBRE', 'CANDIDAT', 'ROLE_CANDIDAT'] }
      },
      {
        path: 'login',
        component: LoginComponent
      },
      {
        path: 'signup',
        component: SignupComponent
      },
      {
        path: 'reset-password',
        component: PasswordResetDialogComponent
      },
      {
        path: 'actualites',
        component: NewsFeedComponent,
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN', 'RESPONSABLE', 'MEMBRE', 'ROLE_ADMIN', 'ROLE_RESPONSABLE', 'ROLE_MEMBRE'] }
      },
      {
        path: 'suggestions',
        component: SuggestionsComponent,
        canActivate: [RoleGuard],
        data: { roles: ['RESPONSABLE', 'MEMBRE', 'ROLE_RESPONSABLE', 'ROLE_MEMBRE', 'CANDIDAT', 'ROLE_CANDIDAT'] }
      },
      {
        path: 'objectifs',
        component: ObjectifsComponent,
        canActivate: [RoleGuard],
        data: { roles: ['RESPONSABLE', 'MEMBRE', 'ROLE_RESPONSABLE', 'ROLE_MEMBRE'] }
      },
      {
        path: 'chat',
        component: ChatMainComponent,
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN', 'RESPONSABLE', 'MEMBRE', 'ROLE_ADMIN', 'ROLE_RESPONSABLE', 'ROLE_MEMBRE'] }
      },
      {
        path: 'chat/:conversationId',
        component: ChatMainComponent,
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN', 'RESPONSABLE', 'MEMBRE', 'ROLE_ADMIN', 'ROLE_RESPONSABLE', 'ROLE_MEMBRE'] }
      },

      // ==================== ROUTES ADMIN ====================
      {
        path: 'admin',
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN', 'ROLE_ADMIN'] },
        children: [
          {
            path: 'dashboard',
            component: AdminDashboardComponent
          },
          {
            path: 'groupes',
            component: GroupeListComponent
          },
          {
            path: 'groupes/nouveau',
            component: GroupeFormComponent
          },
          {
            path: 'utilisateurs',
            component: UserFormComponent
          },
          {
            path: '',
            redirectTo: 'dashboard',
            pathMatch: 'full'
          }
        ]
      },

      // ==================== ROUTES MEMBRE ====================
      {
        path: 'membre',
        canActivate: [RoleGuard],
        data: { roles: ['MEMBRE', 'ROLE_MEMBRE'] },
        children: [
          {
            path: 'dashboard',
            component: MDashboardComponent
          },
          {
            path: '',
            redirectTo: 'dashboard',
            pathMatch: 'full'
          }
        ]
      },

      // ==================== ROUTES RESPONSABLE ====================
      {
        path: 'responsable',
        canActivate: [RoleGuard],
        data: { roles: ['RESPONSABLE', 'ROLE_RESPONSABLE'] },
        children: [
          // Dashboard - accessible à tous les responsables
          {
            path: 'dashboard',
            component: RDashboardComponent
          },
          {
            path: 'utilisateurs',
            component: UserFormComponent,
            canActivate: [RoleGuard]
          },

          // GESTION - Protégé par MenuGuard
          {
            path: 'membres',
            component: MembreFormComponent,
            canActivate: [MenuGuard]
          },
          {
            path: 'demandes',
            component: GestionDemandesGroupeComponent,
            canActivate: [MenuGuard]
          },
          {
            path: 'invitation',
            component: InvitationListComponent,
          },
          {
            path: 'configuration',
            component: GroupeConfigComponent,
            canActivate: [MenuGuard]
          },
          {
            path: 'roles',
            component: GestionRolesComponent,
            canActivate: [MenuGuard]
          },

          // SPORT - Protégé par MenuGuard
          {
            path: 'matchs',
            component: MatchFormComponent,
            canActivate: [MenuGuard],
            data: { roles: ['RESPONSABLE'] }
          },
          {
            path: 'presences/:matchId',
            component: PresenceFormComponent,
            canActivate: [RoleGuard]
          },
          {
            path: 'equipes',
            component: PaiementSanctionFormComponent,
            canActivate: [MenuGuard]
          },
          {
            path: 'evenements',
            component: EvenementComponent,
            canActivate: [MenuGuard]
          },

          // ==================== FINANCES (ANCIEN SYSTÈME) ====================
          // Ces routes restent pour la rétrocompatibilité
          {
            path: 'cotisations',
            component: ContributionFormComponent,
            canActivate: [MenuGuard]
          },
          {
            path: 'contributions',
            component: ContributionComponent,
            canActivate: [MenuGuard]
          },
          {
            path: 'depenses',
            component: TypeSortieComponent,
            canActivate: [MenuGuard]
          },

          // ==================== NOUVEAU MODULE FINANCES ====================
          {
            path: 'finances',
            canActivate: [MenuGuard],
            children: [
              // Dashboard financier
              {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
              },
              {
                path: 'dashboard',
                component: FinancialDashboardComponent,
                data: { title: 'Tableau de bord financier' }
              },

              // Gestion des exercices
              {
                path: 'exercices',
                component: ExerciceManagementComponent,
                data: { title: 'Gestion des exercices' }
              },

              // Mouvements de caisse
              {
                path: 'entree',
                component: EntreeCaisseComponent,
                data: { title: 'Nouvelle entrée' }
              },
              {
                path: 'sortie',
                component: SortieCaisseComponent,
                data: { title: 'Nouvelle sortie' }
              },

              // Types de contribution
              {
                path: 'types-contributions',
                component: TypeContributionComponent,
                data: { title: 'Types de contributions' }
              },

              // // Gestion des caisses
               // {
               //  path: 'caisses',
               //   component: CaissesComponent,
               //  data: { title: 'Gestion des caisses' }
               // },
               // {
               //  path: 'caisses/:id',
               //   component: CaisseDetailComponent,
               //  data: { title: 'Détail de la caisse' }
               // },

              // // Historique et rapports
               // {
               //   path: 'mouvements',
               //   component: MouvementsHistoriqueComponent,
               //  data: { title: 'Historique des mouvements' }
               // },
               // {
               //   path: 'bilan',
               //   component: BilanComponent,
               //   data: { title: 'Bilan financier' }
               // },
               // {
               //   path: 'echeancier',
               //  component: EcheancierComponent,
               //   data: { title: 'Échéancier des cotisations' }
               // }
            ]
          },

          // DISCIPLINE - Protégé par MenuGuard
          {
            path: 'types-sanction',
            component: TypeSanctionComponent,
            canActivate: [MenuGuard]
          },
          {
            path: 'sanctions',
            component: SanctionFormComponent,
            canActivate: [MenuGuard]
          },

          // Redirection par défaut
          {
            path: '',
            redirectTo: 'dashboard',
            pathMatch: 'full'
          }
        ]
      }
    ]
  },

  // Route par défaut - redirection vers accueil public
  { path: '**', redirectTo: '/home' }
];
