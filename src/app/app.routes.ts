import { Routes } from "@angular/router";
import { RoleGuard } from "./core/guards/role.guard";
import { DashboardComponent } from "./modules/admin/components/dashboard/dashboard.component";
import { GroupeListComponent } from "./modules/admin/components/groupe-list/groupe-list.component";
import { MDashboardComponent } from "./modules/membre/components/dashboard/dashboard.component";
import { RDashboardComponent } from "./modules/responsable/components/dashboard/dashboard.component";
import { LoginComponent } from "./shared/components/login/login.component";
import { GroupeFormComponent } from "./modules/admin/components/groupe-form/groupe-form.component";
import { UserFormComponent } from "./modules/admin/components/user-form/user-form.component";
import { MembreFormComponent } from "./modules/responsable/components/membre-form/membre-form.component";
import { SanctionFormComponent } from "./modules/responsable/components/sanction-form/sanction-form.component";
import { ContributionFormComponent } from "./modules/responsable/components/contribution-form/contribution-form.component";
import { MatchFormComponent } from "./modules/responsable/components/match-form/match-form.component";
import { PresenceFormComponent } from "./modules/responsable/components/presence-form/presence-form.component";
import { TypeSanctionComponent } from "./modules/responsable/components/type-sanction/type-sanction.component";
import { PaiementSanctionFormComponent } from "./modules/responsable/components/paiement-sanction-form/paiement-sanction-form.component";
import { EvenementComponent } from "./modules/responsable/components/evenement/evenement.component";
import { LayoutComponent } from "./shared/components/layout/layout.component";
import { PasswordResetDialogComponent } from "./shared/components/password-reset-dialog/password-reset-dialog.component";
import { NewsFeedComponent } from "./modules/membre/components/news-feed/news-feed.component";


export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'reset-password', component: PasswordResetDialogComponent },


  {
    path: '',
    component: LayoutComponent, // Layout pour toutes les autres pages
    children: [
       {
    path: 'admin',
    component: DashboardComponent,
    canActivate: [RoleGuard], // Référence à la classe RoleGuard
    data: { roles: ['ADMIN'] }
  },
    { path: 'news-feed', 
      component: NewsFeedComponent,
    canActivate:[RoleGuard],
   data: { roles: ['ADMIN', 'RESPONSABLE'] }
   },
  {
    path: 'groupes',
    component: GroupeListComponent,
    canActivate: [RoleGuard],
    data: { roles: ['ADMIN', 'RESPONSABLE', 'USER'] }
  },

  
  {
  path: 'new',
  component: GroupeFormComponent,
  canActivate: [RoleGuard],
  data: { roles: ['ADMIN'] }
  }, 

   {
  path: 'user',
  component: UserFormComponent,
  canActivate: [RoleGuard],
  data: { roles: ['ADMIN', 'RESPONSABLE'] }
  }, 

   {
  path: 'membre',
  component: MembreFormComponent,
  canActivate: [RoleGuard],
  data: { roles: [ 'RESPONSABLE'] }
  }, 
  
  {
    path: 'responsable',
    component: RDashboardComponent, // Remplace par le composant ResponsableDashboardComponent
    canActivate: [RoleGuard],
    data: { roles: ['RESPONSABLE'] }
  },

  {
  path: 'membre2',
  component: MDashboardComponent,
  canActivate: [RoleGuard],
  data: { roles: ['RESPONSABLE'] }
 },

  {
  path: 'sanction',
  component: SanctionFormComponent,
  canActivate: [RoleGuard],
  data: { roles: ['RESPONSABLE'] }
 },

   {
  path: 'contribution',
  component: ContributionFormComponent,
  canActivate: [RoleGuard],
  data: { roles: ['RESPONSABLE'] }
 },
 
  { path: 'presence/:matchId', 
    component: PresenceFormComponent ,
    canActivate: [RoleGuard],
    data: { roles: ['RESPONSABLE'] }
  },
   {
  path: 'match',
  component: MatchFormComponent,
  canActivate: [RoleGuard],
  data: { roles: ['RESPONSABLE'] }
 },
    {
    path: 'typesanction',
    component: TypeSanctionComponent, // Remplace par le composant ResponsableDashboardComponent
    canActivate: [RoleGuard],
    data: { roles: ['RESPONSABLE'] }
  },
   {
    path: 'equipe',
    component: PaiementSanctionFormComponent, // Remplace par le composant ResponsableDashboardComponent
    canActivate: [RoleGuard],
    data: { roles: ['RESPONSABLE'] }
  },
   {
    path: 'evenement',
    component: EvenementComponent, // Remplace par le composant ResponsableDashboardComponent
    canActivate: [RoleGuard],
    data: { roles: ['RESPONSABLE'] }
  },
  {
    path: 'membre',
    component: MDashboardComponent, // Remplace par MembreDashboardComponent
    canActivate: [RoleGuard],
    data: { roles: ['USER'] } // Correspond à roles: ["ROLE_USER"]
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' },

  { path: 'match', 
    component: MatchFormComponent ,
    canActivate: [RoleGuard],
    data: { roles: ['RESPONSABLE'] }

  },

  { path: 'presence/:matchId', 
    component: PresenceFormComponent ,
    canActivate: [RoleGuard],
    data: { roles: ['RESPONSABLE'] }
  },


  { path: 'presence', 
    component: PresenceFormComponent ,
    canActivate: [RoleGuard],
    data: { roles: ['RESPONSABLE'] }
  },
    ],
  },
  { path: '**', redirectTo: '/login' },


  
];