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

export const routes: Routes = [
  // ==================== ROUTES PUBLIQUES (sans authentification) ====================
  {
    path: '',
    component: GroupesExploreComponent,
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

  // ==================== ROUTES PROTÉGÉES (avec Layout et authentification) ====================
  {
    path: '',
    component: LayoutComponent,
    children: [
      // ==================== ROUTES COMMUNES (tous les utilisateurs connectés) ====================
      {
        path: 'explorer',
        component: GroupesExploreComponent,
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN', 'RESPONSABLE', 'MEMBRE', 'ROLE_ADMIN', 'ROLE_RESPONSABLE', 'ROLE_MEMBRE'] }
      },
      {
        path: 'mes-demandes',
        component: MesDemandesComponent,
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN', 'RESPONSABLE', 'MEMBRE', 'ROLE_ADMIN', 'ROLE_RESPONSABLE', 'ROLE_MEMBRE'] }
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
        data: { roles: ['RESPONSABLE', 'MEMBRE', 'ROLE_RESPONSABLE', 'ROLE_MEMBRE'] }
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
          // Dashboard - accessible à tous les responsables (pas de MenuGuard)
          {
            path: 'dashboard',
            component: RDashboardComponent
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
            canActivate: [MenuGuard]
          },
          {
            path: 'presences/:id',
            component: PresenceFormComponent,
            canActivate: [MenuGuard]
          },
          {
            path: 'presences/:matchId',
            component: PresenceFormComponent,
            canActivate: [MenuGuard]
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

          // FINANCES - Protégé par MenuGuard
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
  { path: '**', redirectTo: '' }
];