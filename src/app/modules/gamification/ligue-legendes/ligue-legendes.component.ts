import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { forkJoin } from 'rxjs';
import { XpService, XpProfilDTO, ClassementSaisonDTO, MissionJoueurDTO } from '../../../core/services/gamification/xp.service';


@Component({
  selector: 'app-ligue-legendes',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatTabsModule, MatIconModule,
    MatButtonModule, MatProgressBarModule, MatProgressSpinnerModule,
    MatChipsModule
  ],
  templateUrl: './ligue-legendes.component.html',
  styleUrl:    './ligue-legendes.component.scss'
})
export class LigueLegendesComponent implements OnInit {
  private xpService = inject(XpService);

  isLoading = signal(true);
  profil    = signal<XpProfilDTO | null>(null);
  classement = signal<ClassementSaisonDTO | null>(null);

  readonly NIVEAUX = [
    { niveau: 1, titre: '⚽ Rookie',      xp: 0,    color: '#6b7280' },
    { niveau: 2, titre: '🌟 Prometteur',  xp: 200,  color: '#3b82f6' },
    { niveau: 3, titre: '💪 Confirmé',    xp: 500,  color: '#10b981' },
    { niveau: 4, titre: '🔥 Redoutable',  xp: 1000, color: '#f59e0b' },
    { niveau: 5, titre: '👑 Élite',       xp: 2500, color: '#8b5cf6' },
    { niveau: 6, titre: '🏆 Légende',     xp: 5000, color: '#f97316' },
  ];

  ngOnInit(): void {
    forkJoin({
      profil:     this.xpService.getMonProfil(),
      classement: this.xpService.getClassement()
    }).subscribe({
      next: ({ profil, classement }) => {
        this.profil.set(profil);
        this.classement.set(classement);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  getMissions(type: 'HEBDOMADAIRE' | 'MENSUEL'): MissionJoueurDTO[] {
    return this.profil()?.missions.filter(m => m.type === type) ?? [];
  }

  getProgressionMission(m: MissionJoueurDTO): number {
    return Math.min(100, (m.progression / m.quantiteRequise) * 100);
  }

  getJoursRestants(dateFin: string): number {
    const diff = new Date(dateFin).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  getNiveauColor(niveau: number): string {
    return this.NIVEAUX[Math.min(niveau - 1, 5)].color;
  }

  monRang(): number | null {
    if (!this.profil() || !this.classement()) return null;
    const idx = this.classement()!.individuel
      .findIndex(e => e.membreId === this.profil()!.membreId);
    return idx >= 0 ? idx + 1 : null;
  }
}