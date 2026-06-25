import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { InvitationService } from '../../../../core/services/invitation.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

interface PeriodOption {
  value: string;        // "03-2026"
  label: string;        // "Mars 2026"
  isCurrent: boolean;
}

@Component({
  selector: 'app-mvp-winner',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule,
    FormsModule,
    TranslateModule
  ],
  templateUrl: './mvp-winner.component.html',
  styleUrls: ['./mvp-winner.component.scss']
})
export class MvpWinnerComponent implements OnInit {
  private voteService  = inject(InvitationService);
  private authService  = inject(AuthService);
  private translate    = inject(TranslateService);

  // ── State ─────────────────────────────────────────────────
  winner          = signal<any>(null);
  funnyComments   = signal<string[]>([]);
  isLoading       = signal(true);
  isDownloading   = signal(false);

  // ── Sélecteur de période ─────────────────────────────────
  periods         = signal<PeriodOption[]>([]);
  selectedPeriod  = signal<string>('');

  selectedLabel = computed(() =>
    this.periods().find(p => p.value === this.selectedPeriod())?.label ?? ''
  );

  isVoteInProgress = computed(() => {
    const now = new Date();
    const target = new Date();
    if (now.getDate() <= 7) target.setMonth(now.getMonth() - 1);
    const activePeriod = this.toApiFormat(target);
    return this.selectedPeriod() === activePeriod;
  });

  ngOnInit(): void {
    this.buildPeriods();
    this.loadMvpData();
  }

  // ── Construire la liste des 12 derniers mois ─────────────
  private buildPeriods(): void {
    const now    = new Date();
    const list: PeriodOption[] = [];

    const currentTarget = new Date();
    if (now.getDate() <= 7) currentTarget.setMonth(now.getMonth() - 1);

    const currentValue = this.toApiFormat(currentTarget);

    for (let i = 0; i < 12; i++) {
      const d = new Date(currentTarget);
      d.setMonth(currentTarget.getMonth() - i);

      const value = this.toApiFormat(d);
      const label = d.toLocaleDateString(this.translate.currentLang, {
        month: 'long', year: 'numeric'
      });

      list.push({ value, label, isCurrent: i === 0 });
    }

    this.periods.set(list);
    this.selectedPeriod.set(currentValue);
  }

  // ── Charger le MVP pour la période sélectionnée ──────────
  loadMvpData(): void {
    const gId = this.authService.getGroupe();
    if (!gId) return;

    this.isLoading.set(true);
    this.winner.set(null);
    this.funnyComments.set([]);

    this.voteService.getMvpWinner(gId, this.selectedPeriod()).subscribe({
      next: (data) => {
        if (data) {
          this.winner.set(data);
          this.funnyComments.set(data.funnyComments || []);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erreur MVP:', err);
        this.isLoading.set(false);
      }
    });
  }

  // ── Changement de période ─────────────────────────────────
  onPeriodChange(value: string): void {
    this.selectedPeriod.set(value);
    this.loadMvpData();
  }

  // ── Télécharger le badge ──────────────────────────────────
  downloadMvpCard(): void {
    const gId = this.authService.getGroupe();
    if (!gId || !this.winner()) return;

    this.isDownloading.set(true);
    const filename = `MVP_${this.selectedPeriod()}_My20.jpg`;

    this.voteService.getMvpWinnerImage(gId, this.selectedPeriod()).subscribe({
      next: async (blob: Blob) => {
        try {
          await this.saveBlob(blob, filename);
        } catch (e) {
          console.error('Erreur sauvegarde MVP:', e);
        }
        this.isDownloading.set(false);
      },
      error: (err) => {
        console.error('Erreur API MVP image:', err);
        this.isDownloading.set(false);
      }
    });
  }

  // ── Sauvegarde multi-plateforme ───────────────────────────
  private async saveBlob(blob: Blob, filename: string): Promise<void> {

    if (Capacitor.isNativePlatform()) {
      // ─── Android / iOS (APK) ──────────────────────────────
      // createObjectURL ne fonctionne pas dans WebView Android
      // → convertir en base64, écrire dans le cache, puis partager

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const saved = await Filesystem.writeFile({
        path: filename,
        data: base64,
        directory: Directory.Cache,   // pas besoin de permission READ/WRITE_EXTERNAL
        recursive: true
      });

      // Ouvre la feuille de partage native Android/iOS
      // L'utilisateur peut choisir "Enregistrer dans Photos", "Télécharger", WhatsApp, etc.
      await Share.share({
        title:       'Badge MVP My2-0',
        text:        '🏆 Badge MVP du mois — My2-0',
        url:          saved.uri,
        dialogTitle: 'Enregistrer ou partager le badge'
      });

    } else {
      // ─── Navigateur web ───────────────────────────────────
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      const isIos    = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const url      = window.URL.createObjectURL(blob);

      if (isSafari || isIos) {
        // Safari / iOS web : l'attribut download est ignoré
        // → ouvrir dans un nouvel onglet, appui long pour enregistrer
        const win = window.open(url, '_blank');
        if (!win) window.location.href = url; // fallback popup bloqué
        setTimeout(() => window.URL.revokeObjectURL(url), 30_000);
      } else {
        // Chrome / Firefox / Edge
        const link = document.createElement('a');
        link.href  = url;
        link.download = filename;
        document.body.appendChild(link);  // requis sur mobile Chrome
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    }
  }

  // ── Helpers ───────────────────────────────────────────────
  toApiFormat(d: Date): string {
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${month}-${d.getFullYear()}`;
  }

  getInitials(prenom: string, nom: string): string {
    return (prenom?.[0] || '') + (nom?.[0] || '');
  }

  getAvatarGradient(playerId: number): string {
    const gradients = [
      'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
      'linear-gradient(135deg, #2563eb 0%, #c026d3 100%)',
      'linear-gradient(135deg, #059669 0%, #16a34a 100%)',
      'linear-gradient(135deg, #d946ef 0%, #1d4ed8 100%)'
    ];
    return gradients[(playerId || 0) % gradients.length];
  }
}