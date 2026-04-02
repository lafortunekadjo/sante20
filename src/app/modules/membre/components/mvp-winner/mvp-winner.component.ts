import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { InvitationService } from '../../../../core/services/invitation.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-mvp-winner',
  standalone: true,
  imports: [
    CommonModule, 
    MatIconModule, 
    MatButtonModule, 
    MatProgressSpinnerModule, 
    TranslateModule
  ],
  templateUrl: './mvp-winner.component.html',
  styleUrls: ['./mvp-winner.component.scss']
})
export class MvpWinnerComponent implements OnInit {
  private voteService = inject(InvitationService);
  private authService = inject(AuthService);
  private translate = inject(TranslateService);

  // Signaux pour la gestion d'état
  winner = signal<any>(null);
  funnyComments = signal<string[]>([]);
  isLoading = signal(true);
  currentPeriodLabel = signal<string>('');
  calculatedPeriode: string = '';

  ngOnInit() {
    this.computePeriode();
    this.loadMvpData();
  }

  loadMvpData() {
    const gId = this.authService.getGroupe();
    if (!gId) return;

    // 1. Détermination de la période (Mars 2026 si on est début Avril)
    const now = new Date();
    let targetDate = new Date();
    
    if (now.getDate() <= 7) {
      targetDate.setMonth(now.getMonth() - 1);
    }

    // Formatage pour l'API : "MM-YYYY"
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const year = targetDate.getFullYear();
    const periodeStr = `${month}-${year}`;

    // Libellé pour l'affichage (ex: "Mars 2026")
    this.currentPeriodLabel.set(
      targetDate.toLocaleDateString(this.translate.currentLang, { month: 'long', year: 'numeric' })
    );

    // 2. Appel à l'API du vainqueur
    this.voteService.getMvpWinner(gId, periodeStr).subscribe({
      next: (data) => {
        if (data) {
          this.winner.set(data);
          this.funnyComments.set(data.funnyComments || []);
          console.log(data)
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erreur My2-0:', err);
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Partage le résultat sur les réseaux sociaux / WhatsApp
   */
 // mvp-winner.component.ts

 private computePeriode() {
    const now = new Date();
    const targetDate = new Date();

    // LOGIQUE MY2-0 : 
    // Si on est dans les 7 premiers jours du mois, on regarde le mois précédent
    if (now.getDate() <= 7) {
      targetDate.setMonth(now.getMonth() - 1);
    }

    // 1. Format pour l'API (MM-YYYY)
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const year = targetDate.getFullYear();
    this.calculatedPeriode = `${month}-${year}`;

    // 2. Format pour l'affichage utilisateur (ex: "Mars 2026")
    this.currentPeriodLabel.set(
      targetDate.toLocaleDateString(this.translate.currentLang, { 
        month: 'long', 
        year: 'numeric' 
      })
    );
  }

downloadMvpCard() {
  const gId = this.authService.getGroupe();
  if (!gId || !this.winner()) return;

  this.isLoading.set(true);

  this.voteService.getMvpWinnerImage(gId, this.calculatedPeriode).subscribe({
    next: (blob: Blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      // Nom du fichier : MVP_Mars_2026_My20.jpg
      link.download = `MVP_${this.calculatedPeriode}_My20.jpg`;
      link.click();
      window.URL.revokeObjectURL(url);
      this.isLoading.set(false);
    },
    error: () => this.isLoading.set(false)
  });
}

private downloadImage(blob: Blob) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `MVP_My20_${this.calculatedPeriode}.jpg`;
  link.click();
  window.URL.revokeObjectURL(url);
}

  /**
   * Helper pour les initiales si pas de photo
   */
  getInitials(prenom: string, nom: string): string {
    return (prenom?.[0] || '') + (nom?.[0] || '');
  }

  getAvatarGradient(playerId: number): string {
  const gradients = [
    'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', // Indigo-Purple
    'linear-gradient(135deg, #2563eb 0%, #c026d3 100%)', // Blue-Fuchsia
    'linear-gradient(135deg, #059669 0%, #16a34a 100%)', // Emerald-Green
    'linear-gradient(135deg, #d946ef 0%, #1d4ed8 100%)'  // Pink-Blue
  ];
  const index = (playerId || 0) % gradients.length;
  return gradients[index];
}



}