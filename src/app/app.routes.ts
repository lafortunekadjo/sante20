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
import { BilanComponent } from "./modules/responsable/components/bilan/bilan.component";
import { CaisseDetailComponent } from "./modules/responsable/components/caisse-detail/caisse-detail.component";
import { CaissesComponent } from "./modules/responsable/components/caisses/caisses.component";
import { EcheancierComponent } from "./modules/responsable/components/echeancier/echeancier.component";
import { MouvementsHistoriqueComponent } from "./modules/responsable/components/mouvements-historique/mouvements-historique.component";
import { TypeDepenseComponent } from "./modules/responsable/components/type-depense/type-depense.component";
import { AnalyticsDashboardComponent } from "./modules/admin/components/analytics-dashboard/analytics-dashboard.component";
import { NotificationComponent } from "./shared/components/notification/notification.component";
import { NotificationsPageComponent } from "./modules/responsable/components/notifications-page/notifications-page.component";
import { PartenaireLayoutComponent } from "./modules/partenaire/partenaire-layout/partenaire-layout.component";
import { PartenaireDashboardComponent } from "../app/modules/partenaire/partenaire-dashboard/partenaire-dashboard.component";
import { EntreprisesListComponent } from "../app/modules/partenaire/entreprises-list/entreprises-list.component";
import { EntrepriseFormComponent } from "../app/modules/partenaire/entreprise-form/entreprise-form.component";
import { PublicitesListComponent } from "./modules/partenaire/publicites-list/publicites-list.component";
import { PubliciteFormComponent } from "./modules/partenaire/publicite-form/publicite-form.component";
import { PartenaireFormComponent } from "./modules/partenaire/partenaire-form/partenaire-form.component";
import { PartenairesListComponent } from "./modules/partenaire/partenaires-list/partenaires-list.component";
import { PartenaireDetailComponent } from "./modules/partenaire/partenaire-detail/partenaire-detail.component";
import { StatistiquesComponent } from "./modules/partenaire/statistiques/statistiques.component";
import { PubliciteDetailComponent } from "./modules/partenaire/publicite-detail/publicite-detail.component";
import { EntrepriseDetailComponent } from "./modules/partenaire/entreprise-detail/entreprise-detail.component";
import { AdminPublicitesListComponent } from "./modules/partenaire/admin-publicites-list/admin-publicites-list.component";
import { AdminStatsComponent } from "./modules/partenaire/admin-stats/admin-stats.component";
import { AdminPubliciteDetailComponent } from "./modules/partenaire/admin-publicite-detail/admin-publicite-detail.component";
import { AdminPartenaireDashboardComponent } from "./modules/partenaire/admin-partenaire-dashboard/admin-partenaire-dashboard.component";
import { AuditListComponent } from "./modules/responsable/components/audit-list/audit-list.component";
import { MvpVoteComponent } from "./modules/membre/components/mvp-vote/mvp-vote.component";
import { MvpWinnerComponent } from "./modules/membre/components/mvp-winner/mvp-winner.component";
import { DemandeAdhesionComponent } from "./shared/components/demande-adhesion/demande-adhesion.component";
import { JoinGroupDialogComponent } from "./modules/membre/components/join-group-dialog/join-group-dialog.component";
import { StadeGestionComponent } from "./modules/admin/components/stade-gestion/stade-gestion.component";
import { AdminAnalyticsComponent } from "./modules/admin/components/admin-analytics/admin-analytics.component";
import { AnnouncementAdminComponent } from "./modules/responsable/components/announcement-admin/announcement-admin.component";
import { SettingsComponent } from "./shared/components/settings/settings.component";
import { PlayerProfileComponent } from "./modules/membre/components/player-profile/player-profile.component";
import { PlayerListComponent } from "./modules/membre/components/player-list/player-list.component";
import { VideoManagementComponent } from "./modules/membre/components/video-management/video-management.component";
import { ForgotPasswordComponent } from "./shared/components/forgot-password/forgot-password.component";
import { ResetPasswordComponent } from "./shared/components/reset-password/reset-password.component";
import { StatsDashboardComponent } from "./modules/responsable/components/stats-dashboard/stats-dashboard.component";
import { PrivacyPolicyComponent } from "./modules/doc/privacy-policy/privacy-policy.component";
import { SecurityPolicyComponent } from "./modules/doc/security-policy/security-policy.component";
import { TermsOfServiceComponent } from "./modules/doc/terms-of-service/terms-of-service.component";
import { ConcoursPublicComponent } from "./modules/jeu/concours-public/concours-public.component";
import { ConcoursAdminComponent } from "./modules/jeu/concoursadmin/concoursadmin.component";
import { ConcoursLiveComponent } from "./modules/jeu/concours-live/concours-live.component";
import { responsableGuard } from "./core/guards/responsable.guard";
import { UserMergeComponent } from "./modules/shared/components/user-merge/user-merge.component";

//import { CaisseComponent } from "./modules/responsable/components/caisses/caisse.component";
//import { CaisseDetailComponent } from "./modules/responsable/components/caisse-detail/caisse-detail.component";
//import { MouvementsHistoriqueComponent } from "./modules/responsable/components/mouvements-historique/mouvements-historique.component";
//import { BilanComponent } from "./modules/responsable/components/bilan/bilan.component";
//import { EcheancierComponent } from "./modules/responsable/components/echeancier/echeancier.component";

// ==================== FINANCES - NOUVEAUX COMPOSANTS ====================



export const routes: Routes = [

  // { path: 'generator', component: QrGeneratorComponent },
  // { path: 'dashboard', component: QrDashboardComponent },

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
  path: 'privacy',
  component: PrivacyPolicyComponent
},
{
  path: 'terms',
  component: TermsOfServiceComponent
},
{
  path: 'security',
  component: SecurityPolicyComponent
},


  {
    path: 'competitions',
    loadComponent: () =>
      import('./modules/competition/components/competition-list/competition-list.component')
        .then(m => m.CompetitionListComponent)
  },
 
   {
    path: 'competitions/new',
    loadComponent: () =>
      import('./modules/competition/components/competition-create/competition-create.component')
        .then(m => m.CompetitionCreateComponent)
  },
 {
    path: 'competitions/:id',
    loadComponent: () =>
      import('./modules/competition/components/competition-detail/competition-detail.component')
        .then(m => m.CompetitionDetailComponent)
  },
  {
    path: ':competitionId/matchs/card',
    loadComponent: () =>
      import('./modules/competition/components/match-card/match-card.component')
        .then(m => m.MatchCardComponent)
  },
  {
    path: ':competitionId/matchs/:matchId',
    loadComponent: () =>
      import('./modules/competition/components/match-detail/match-detail.component')
        .then(m => m.MatchDetailComponent)
  },
  {
    path: 'competition/participants',
    loadComponent: () =>
      import('./modules/competition/components/tab-participants/tab-participants.component')
        .then(m => m.TabParticipantsComponent)
  },
    {
    path: 'competition/phases',
    loadComponent: () =>
      import('./modules/competition/components/tab-phases/tab-phases.component')
        .then(m => m.TabPhasesComponent)
  },
  
    {
    path: 'competition/resume',
    loadComponent: () =>
      import('./modules/competition/components/tab-resume/tab-resume.component')
        .then(m => m.TabResumeComponent)
  },

    {
    path: 'competition/classement',
    loadComponent: () =>
      import('./modules/competition/components/tab-phases/tab-phases.component')
        .then(m => m.TabPhasesComponent)
  },
   {
    path: 'officiels',
    loadComponent: () =>
      import('./modules/competition/components/officiels/officiels.component')
        .then(m => m.OfficielsComponent)
  },
  // {
  //   path: 'competition/match',
  //   loadComponent: () =>
  //     import('./modules/competition/components/match-card/match-card.component')
  //       .then(m => m.MatchCardComponent)
  // },

  //  {
  //   path: 'competition/match-details',
  //   loadComponent: () =>
  //     import('./modules/competition/components/match-detail/match-detail.component')
  //       .then(m => m.MatchDetailComponent)
  // },

   {
    path: 'competitions/:competitionId/matchs/:matchId',
    loadComponent: () =>
      import('./modules/competition/components/match-detail/match-detail.component')
        .then(m => m.MatchDetailComponent)
  },
{
  path: 'concours/:slug',
  component: ConcoursPublicComponent
},

{
  path: 'concours/:slug/live',
  component: ConcoursLiveComponent
},


      {
        path: 'match/invite/:token',
        component: PublicMatchInviteComponent,
      },
      { path: 'forgot-password', component: ForgotPasswordComponent },
       { path: 'reset-password', component: ResetPasswordComponent },
      {
        path:'p/:username',
        component: PlayerProfileComponent
      },
      {
        path: 'joueurs',
        component: PlayerListComponent
      },
            
      {
        path: 'creategroup',
        component: UserGroupRegisterComponent,
      },
       {
        path: 'joingroup',
        component: JoinGroupDialogComponent,
      },
      {
        path: 'apropos',
        component: HomeComponent,
      },
       {
        path: 'settings',
        component: SettingsComponent,
      },
       {
        path: 'adhesion/:id/candidature',
        component: DemandeAdhesionComponent,
      },
      {
        path: 'home',
        component: HomeComponent,
      },
        {
        path: 'notifications',
        component: NotificationsPageComponent,
      },

       {
        path: 'join/:code',
        loadComponent: () => import('../app/modules/invitation/join/join.component')
          .then(m => m.JoinComponent),
        title: 'Rejoindre un groupe - My 2.0'
      },
      // Route alternative avec juste le code (sans /join)
      {
        path: 'j/:code',
        redirectTo: 'join/:code'
      },

      // ==================== ROUTES COMMUNES (tous les utilisateurs connectés) ====================
      {
        path: 'explorer',
        component: GroupesExploreComponent,
      },
        {
        path: 'memberstat',
        component: StatsDashboardComponent,
      },
      {
        path: 'mes-demandes',
        component: MesDemandesComponent,
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN', 'RESPONSABLE', 'MEMBRE', 'ROLE_ADMIN', 'ROLE_RESPONSABLE', 'ROLE_MEMBRE', 'CANDIDAT', 'ROLE_CANDIDAT'] }
      },
       {
            path: 'membre/videos',
            component: VideoManagementComponent
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
            component: AnalyticsDashboardComponent
          },
            {
            path: 'merge',
            component: UserMergeComponent
          },
           {
            path: 'tirage',
            component: ConcoursAdminComponent
          },
        
          { path: 'analytics', 
            component: AdminAnalyticsComponent },
          {
            path: 'groupes',
            component: GroupeListComponent
          },
           {
            path: 'stades',
            component: StadeGestionComponent
          },
           {
            path: 'audit',
            component: AuditListComponent
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
            path: 'partenaires',
            component: PartenairesListComponent
          },
          
           {
            path: 'partenaires/new',
            component: PartenaireFormComponent
          },
          {
            path: 'partenaires/:id',
            component: PartenaireDetailComponent
          },
          {
            path: 'partenaires/:id/edit',
           component: PartenaireFormComponent
          },
           // Publicités
          {
            path: 'publicites',  
            children: [
              {
                path: '',
                component: AdminPublicitesListComponent           
              },
               {
                path: 'dashboard1',
                component: AdminPartenaireDashboardComponent
              },
                {
                path: 'stats',
                component: AdminStatsComponent           
              },
                {
                path: ':id',
                component: AdminPubliciteDetailComponent           
              },
                {
                path: 'dashboard',
                component: AdminPartenaireDashboardComponent
              },
            
            ]
          },

    


          {
            path: '',
            redirectTo: 'dashboard',
            pathMatch: 'full'
          }
        ]
      },
       // ==================== ROUTES ADMIN ====================
      {
        path: 'partenaire',
        canActivate: [RoleGuard],
        data: { roles: ['PARTENAIRE', 'ROLE_PARTENAIRE'] },
        children: [
          {
            path: 'dashboard',
            component: PartenaireDashboardComponent
          },
          {
            path: 'entreprise',
            component: EntreprisesListComponent
          },
           {
            path: 'entreprises/new',
            component: EntrepriseFormComponent
          },
           {
            path: 'publicite',
            component: PublicitesListComponent
          },
           {
            path: 'publicite/new',
            component: PubliciteFormComponent
          },
         {
            path: 'publicites/:id',
            component: PubliciteDetailComponent
          },
          {
            path: 'publicite/:id/edit',
           component: PubliciteFormComponent
          },
          
           {
            path: 'statistiques',
            component: StatistiquesComponent
          },
           {
            path: 'entreprises/:id', 
            component: EntrepriseDetailComponent
          },
           {
            path: 'entreprises/:id/edit',
           component: EntrepriseFormComponent
          },
          //  {
          //   path: 'publicite/new',
          //   component: PubliciteFormComponent
          // },
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
            path: 'vote',
            component: MvpVoteComponent
          },
           {
            path: 'vote/winner',
            component: MvpWinnerComponent
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
        canActivate: [responsableGuard],
        data: { roles: ['RESPONSABLE', 'ROLE_RESPONSABLE'] },
        children: [
          // Dashboard - accessible à tous les responsables
          {
            path: 'dashboard',
            component: RDashboardComponent
          },
            {
            path: 'actualites',
            component: AnnouncementAdminComponent,
            canActivate: [RoleGuard],
            data: { roles: ['ADMIN', 'RESPONSABLE', 'ROLE_ADMIN', 'ROLE_RESPONSABLE'] }
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
            canActivate: [RoleGuard]
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
                path: 'finances/caisses/:id',
                component: CaisseDetailComponent,
                data: { title: 'Détail de la caisse' },
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

           {
            path: 'invitations',
            loadComponent: () => import('../app/modules/invitation/invitation-manager/invitation-manager.component')
              .then(m => m.InvitationManagerComponent),
            title: 'Gestion des invitations - My 2.0'
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


              // Gestion des caisses
              {
                path: 'caisses',
                component: CaissesComponent,
                data: { title: 'Gestion des caisses' }
              },
             

              // Historique et rapports
              {
                path: 'mouvements',
                component: MouvementsHistoriqueComponent,
                data: { title: 'Historique des mouvements' }
              },
              {
                path: 'bilan',
                component: BilanComponent,
                data: { title: 'Bilan financier' }
              },
              {
                path: 'echeancier',
                component: EcheancierComponent,
                data: { title: 'Échéancier des cotisations' }
              },
                // Types de depense
              {
                path: 'types-depenses',
                component: TypeDepenseComponent,
                data: { title: 'Types de depenses' }
              },


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

  // {
  //   path: 'partenaire',
  //   component: PartenaireLayoutComponent,
  //   canActivate: [RoleGuard],
  //   data: { roles: ['PARTENAIRE', 'ROLE_PARTENAIRE'] },
  //   children: [
  //     {
  //       path: '',
  //       redirectTo: 'dashboard',
  //       pathMatch: 'full'
  //     },
  //     {
  //       path: 'dashboard',
  //       loadComponent: () => 
  //         import('../app/modules/partenaire/partenaire-dashboard/partenaire-dashboard.component')
  //           .then(m => m.PartenaireDashboardComponent),
  //       data: { title: 'Dashboard' }
  //     },
  //     {
  //       path: 'entreprises',
  //       children: [
  //         {
  //           path: '',
  //           loadComponent: () => 
  //             import('../app/modules/partenaire/entreprises-list/entreprises-list.component')
  //               .then(m => m.EntreprisesListComponent),
  //           data: { title: 'Mes entreprises' }
  //         },
  //         {
  //           path: 'new',
  //           loadComponent: () => 
  //             import('../app/modules/partenaire/entreprise-form/entreprise-form.component')
  //               .then(m => m.EntrepriseFormComponent),
  //           data: { title: 'Nouvelle entreprise' }
  //         },
  //         // {
  //         //   path: ':id',
  //         //   loadComponent: () => 
  //         //     import('../app/modules/partenaire/entreprise-detail/entreprise-detail.component')
  //         //       .then(m => m.EntrepriseDetailComponent),
  //         //   data: { title: 'Détail entreprise' }
  //         // },
  //         {
  //           path: ':id/edit',
  //           loadComponent: () => 
  //             import('../app/modules/partenaire/entreprise-form/entreprise-form.component')
  //               .then(m => m.EntrepriseFormComponent),
  //           data: { title: 'Modifier entreprise' }
  //         }
  //       ]
  //     },
  //     // {
  //     //   path: 'publicites',
  //     //   children: [
  //     //     {
  //     //       path: '',
  //     //       loadComponent: () => 
  //     //         import('../app/modules/partenaire/publicites-list/publicites-list.component')
  //     //           .then(m => m.PublicitesListComponent),
  //     //       data: { title: 'Mes publicités' }
  //     //     },
  //     //     {
  //     //       path: 'new',
  //     //       loadComponent: () => 
  //     //         import('../app/modules/partenaire/publicite-form/publicite-form.component')
  //     //           .then(m => m.PubliciteFormComponent),
  //     //       data: { title: 'Nouvelle publicité' }
  //     //     },
  //     //     {
  //     //       path: ':id',
  //     //       loadComponent: () => 
  //     //         import('../app/modules/partenaire/publicite-detail/publicite-detail.component')
  //     //           .then(m => m.PubliciteDetailComponent),
  //     //       data: { title: 'Détail publicité' }
  //     //     },
  //     //     {
  //     //       path: ':id/edit',
  //     //       loadComponent: () => 
  //     //         import('../app/modules/partenaire/publicite-form/publicite-form.component')
  //     //           .then(m => m.PubliciteFormComponent),
  //     //       data: { title: 'Modifier publicité' }
  //     //     }
  //     //   ]
  //     // },
  //     // {
  //     //   path: 'statistiques',
  //     //   loadComponent: () => 
  //     //     import('../app/modules/partenaire/statistiques.component')
  //     //       .then(m => m.StatistiquesComponent),
  //     //   data: { title: 'Statistiques' }
  //     // },
  // //     {
  // //       path: 'utilisateurs',
  // //       loadComponent: () => 
  // //         import('./pages/utilisateurs/utilisateurs.component')
  // //           .then(m => m.UtilisateursComponent),
  // //       canActivate: [PartenaireAuthGuard],
  // //       data: { 
  // //         title: 'Utilisateurs',
  // //         requiresAdmin: true 
  // //       }
  // //     },
  // //     {
  // //       path: 'parametres',
  // //       loadComponent: () => 
  // //         import('./pages/parametres/parametres.component')
  // //           .then(m => m.ParametresComponent),
  // //       data: { title: 'Paramètres' }
  // //     }
  // //   ]
  // // },
  // // {
  // //   path: 'login',
  // //   loadComponent: () => 
  // //     import('./pages/login/login.component')
  // //       .then(m => m.PartenaireLoginComponent),
  // //   data: { title: 'Connexion Partenaire' }
  // // },
  // // {
  // //   path: 'forgot-password',
  // //   loadComponent: () => 
  // //     import('./pages/forgot-password/forgot-password.component')
  // //       .then(m => m.ForgotPasswordComponent),
  // //   data: { title: 'Mot de passe oublié' }
  // // },
  // // {
  // //   path: 'reset-password',
  // //   loadComponent: () => 
  // //     import('./pages/reset-password/reset-password.component')
  // //       .then(m => m.ResetPasswordComponent),
  // //   data: { title: 'Réinitialiser mot de passe' }
  // // }
  //   ]},

  // Route par défaut - redirection vers accueil public
  { path: '**', redirectTo: '/home' }
];
