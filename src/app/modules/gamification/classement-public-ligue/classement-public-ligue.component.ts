import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../../core/services/auth.service';
import { XpService, ClassementSaisonDTO } from '../../../core/services/gamification/xp.service';

@Component({
  selector: 'app-classement-public-ligue',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    MatTabsModule, MatIconModule, MatButtonModule,
    MatProgressSpinnerModule, MatSelectModule
  ],
  templateUrl: './classement-public-ligue.component.html',
  styleUrl:    './classement-public-ligue.component.scss'
})
export class ClassementPublicLigueComponent implements OnInit {
  private xpService  = inject(XpService);
  private auth       = inject(AuthService);
  private router     = inject(Router);

  isLoading   = signal(true);
  classement  = signal<ClassementSaisonDTO | null>(null);
  error       = signal(false);

  isLoggedIn  = false;
  anneeMois   = this.getCurrentMois();
  moisDispos: string[] = this.buildMoisDispos();

  ngOnInit(): void {
    this.isLoggedIn = this.auth.isLoggedIn();
    this.chargerClassement();
  }

  chargerClassement(): void {
    this.isLoading.set(true);
    this.xpService.getClassementPublic(this.anneeMois).subscribe({
      next: c  => { this.classement.set(c); this.isLoading.set(false); console.log(c) },
      error: () => { this.error.set(true);  this.isLoading.set(false); }
    });
  }

  onMoisChange(): void {
    this.chargerClassement();
  }

  getMedal(rang: number): string {
    return ['🥇', '🥈', '🥉'][rang - 1] ?? `#${rang}`;
  }

  getNiveauColor(niveau: number): string {
    return this.xpService.getNiveauColor(niveau);
  }

  getNiveauLabel(niveau: number): string {
    return this.xpService.getNiveauLabel(niveau);
  }

  rejoindre(): void {
    this.router.navigate(['/signup']);
  }

  seConnecter(): void {
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: '/ligue' }
    });
  }

  voirMaProgression(): void {
    this.router.navigate(['/membre/ligue']);
  }

  getMoisLabel(mois: string): string {
    const [annee, m] = mois.split('-');
    const labels = ['Jan','Fév','Mar','Avr','Mai','Jun',
                    'Jul','Aoû','Sep','Oct','Nov','Déc'];
    return `${labels[parseInt(m) - 1]} ${annee}`;
  }

  private getCurrentMois(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  private buildMoisDispos(): string[] {
    const mois: string[] = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      mois.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return mois;
  }
}