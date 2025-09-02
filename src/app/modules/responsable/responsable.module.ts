import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { Routes, RouterModule } from '@angular/router';
import { ContributionFormComponent } from './components/contribution-form/contribution-form.component';
import { GroupeConfigComponent } from './components/groupe-config/groupe-config.component';
import { MatchFormComponent } from './components/match-form/match-form.component';
import { MembreFormComponent } from './components/membre-form/membre-form.component';
import { PaiementSanctionFormComponent } from './components/paiement-sanction-form/paiement-sanction-form.component';
import { PresenceFormComponent } from './components/presence-form/presence-form.component';
import { SanctionFormComponent } from './components/sanction-form/sanction-form.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { BaseChartDirective } from 'ng2-charts';



const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'config', component: GroupeConfigComponent },
  { path: 'membres/new', component: MembreFormComponent },
  { path: 'contributions/new', component: ContributionFormComponent },
  { path: 'sanctions/new', component: SanctionFormComponent },
  { path: 'sanctions/:id/paiements/new', component: PaiementSanctionFormComponent },
  { path: 'matchs/new', component: MatchFormComponent },
  { path: 'matchs/:id/presences', component: PresenceFormComponent }
];

@NgModule({
  declarations: [
    DashboardComponent,
    GroupeConfigComponent,
    MembreFormComponent,
    ContributionFormComponent,
    SanctionFormComponent,
    PaiementSanctionFormComponent,
    MatchFormComponent,
    PresenceFormComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    FormsModule,
    ReactiveFormsModule,
    BaseChartDirective
  ]
})
export class ResponsableModule {}