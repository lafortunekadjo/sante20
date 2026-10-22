// ============================================================
// MY2-0 - GESTION DES INVITATIONS (RESPONSABLE)
// Component Angular - invitation-manager.component.ts
// ============================================================

import { t } from '../../../core/i18n/traduire';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { Subject, takeUntil, interval } from 'rxjs';

import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { InvitationGroupe, InvitationStats, InvitationService, DemandeAdhesion } from '../../../core/services/invitation.service';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-invitation-manager',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatBadgeModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatMenuModule,
    MatSnackBarModule,
    MatDialogModule,
    MatChipsModule,
    MatDividerModule,
    TranslateModule
  ],
  templateUrl: './invitation-manager.component.html',
  styleUrls: ['./invitation-manager.component.scss']
})
export class InvitationManagerComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  // États
  isLoading = true;
  isRegenerating = false;
  isCopying = false;
  isProcessing: { [key: number]: boolean } = {};

  // Données
  invitation: InvitationGroupe | null = null;
  demandesEnAttente: DemandeAdhesion[] = [];
  stats: InvitationStats | null = null;
  groupeId: number = 0;

  // UI
  activeTab = 0;
  showQRCode = false;

  constructor(
    private invitationService: InvitationService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.groupeId = this.authService.getGroupe() || 0;
    
    if (this.groupeId) {
      this.loadData();
      this.setupAutoRefresh();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================================
  // CHARGEMENT DES DONNÉES
  // ============================================================

  loadData(): void {
    this.isLoading = true;

    // Charger l'invitation
    this.invitationService.getInvitation(this.groupeId).subscribe({
      next: (inv) => {
        this.invitation = inv;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement invitation:', err);
        this.isLoading = false;
      }
    });

    // Charger les demandes en attente
    this.loadDemandesEnAttente();

    // Charger les stats
    this.loadStats();
  }

  loadDemandesEnAttente(): void {
    this.invitationService.getDemandesEnAttente(this.groupeId).subscribe({
      next: (demandes) => {
        this.demandesEnAttente = demandes;
      },
      error: (err) => {
        console.error('Erreur chargement demandes:', err);
      }
    });
  }

  loadStats(): void {
    this.invitationService.getStats(this.groupeId).subscribe({
      next: (stats) => {
        this.stats = stats;
      },
      error: (err) => {
        console.error('Erreur chargement stats:', err);
      }
    });
  }

  setupAutoRefresh(): void {
    // Rafraîchir les demandes toutes les 30 secondes
    interval(30000).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.loadDemandesEnAttente();
    });
  }

  // ============================================================
  // GESTION DE L'INVITATION
  // ============================================================

  regenererCode(): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: t('invitation.actions.regenerer'),
        message: t('ui.ts_l_ancien_code_sera_desactive_les_2827'),
        confirmText: t('ui.ts_regenerer_dd38'),
        cancelText: t('common.CANCEL'),
        color: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.isRegenerating = true;
        
        this.invitationService.regenererInvitation(this.groupeId).subscribe({
          next: (inv) => {
            this.invitation = inv;
            this.isRegenerating = false;
            this.snackBar.open(t('ui.ts_nouveau_code_genere_06b8'), 'OK', { duration: 3000 });
          },
          error: (err) => {
            console.error('Erreur régénération:', err);
            this.isRegenerating = false;
            this.snackBar.open(t('ui.ts_erreur_lors_de_la_regeneration_abdd'), 'Fermer', { duration: 3000 });
          }
        });
      }
    });
  }

  async copierLien(): Promise<void> {
    if (!this.invitation) return;

    this.isCopying = true;
    const success = await this.invitationService.copierLien(this.invitation.lienComplet);
    this.isCopying = false;

    if (success) {
      this.snackBar.open(t('ui.ts_lien_copie_f3b1'), 'OK', { duration: 2000 });
    } else {
      this.snackBar.open(t('ui.ts_impossible_de_copier_le_lien_0189'), 'Fermer', { duration: 3000 });
    }
  }

  async copierCode(): Promise<void> {
    if (!this.invitation) return;

    this.isCopying = true;
    const success = await this.invitationService.copierLien(this.invitation.code);
    this.isCopying = false;

    if (success) {
      this.snackBar.open(t('ui.ts_code_copie_3eb3'), 'OK', { duration: 2000 });
    }
  }

  async partagerWhatsApp(): Promise<void> {
    if (!this.invitation) return;

    const lienWhatsApp = this.invitationService.getLienWhatsApp(
      this.invitation.lienComplet,
      this.invitation.groupeNom
    );
    window.open(lienWhatsApp, '_blank');
  }

  async partagerNatif(): Promise<void> {
    if (!this.invitation) return;

    const success = await this.invitationService.partagerLien(
      this.invitation.lienComplet,
      this.invitation.groupeNom
    );

    if (!success) {
      // Fallback: copier le lien
      this.copierLien();
    }
  }

  // ============================================================
  // GESTION DES DEMANDES
  // ============================================================

  accepterDemande(demande: DemandeAdhesion): void {
    this.isProcessing[demande.id] = true;

    this.invitationService.accepterDemande(demande.id).subscribe({
      next: () => {
        this.isProcessing[demande.id] = false;
        this.demandesEnAttente = this.demandesEnAttente.filter(d => d.id !== demande.id);
        this.loadStats();
        
        this.snackBar.open(
          `${demande.prenom} ${demande.nom} a été accepté ! 🎉`, 
          'OK', 
          { duration: 3000 }
        );
      },
      error: (err) => {
        console.error('Erreur acceptation:', err);
        this.isProcessing[demande.id] = false;
        this.snackBar.open(t('ui.ts_erreur_lors_de_l_acceptation_09a7'), 'Fermer', { duration: 3000 });
      }
    });
  }

  refuserDemande(demande: DemandeAdhesion): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: t('ui.ts_refuser_la_demande_0caf'),
        message: `Voulez-vous vraiment refuser la demande de ${demande.prenom} ${demande.nom} ?`,
        confirmText: t('demands.reject'),
        cancelText: t('common.CANCEL'),
        color: 'warn',
        showInput: true,
        inputLabel: 'Motif du refus (optionnel)'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result !== undefined && result !== false) {
        this.isProcessing[demande.id] = true;
        const motif = typeof result === 'string' ? result : undefined;

        this.invitationService.refuserDemande(demande.id, motif).subscribe({
          next: () => {
            this.isProcessing[demande.id] = false;
            this.demandesEnAttente = this.demandesEnAttente.filter(d => d.id !== demande.id);
            this.loadStats();
            
            this.snackBar.open(t('ui.ts_demande_refusee_8c83'), 'OK', { duration: 3000 });
          },
          error: (err) => {
            console.error('Erreur refus:', err);
            this.isProcessing[demande.id] = false;
            this.snackBar.open(t('ui.ts_erreur_lors_du_refus_068b'), 'Fermer', { duration: 3000 });
          }
        });
      }
    });
  }

  // ============================================================
  // HELPERS
  // ============================================================

  getTimeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  }

  getInitials(prenom: string, nom: string): string {
    return (prenom.charAt(0) + nom.charAt(0)).toUpperCase();
  }
}