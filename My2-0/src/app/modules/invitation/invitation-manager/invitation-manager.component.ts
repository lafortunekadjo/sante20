// ============================================================
// MY2-0 - GESTION DES INVITATIONS (RESPONSABLE)
// Component Angular - invitation-manager.component.ts
// ============================================================

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
        title: 'Régénérer le code',
        message: 'L\'ancien code sera désactivé. Les personnes ayant l\'ancien lien ne pourront plus l\'utiliser.',
        confirmText: 'Régénérer',
        cancelText: 'Annuler',
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
            this.snackBar.open('Nouveau code généré !', 'OK', { duration: 3000 });
          },
          error: (err) => {
            console.error('Erreur régénération:', err);
            this.isRegenerating = false;
            this.snackBar.open('Erreur lors de la régénération', 'Fermer', { duration: 3000 });
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
      this.snackBar.open('Lien copié ! 📋', 'OK', { duration: 2000 });
    } else {
      this.snackBar.open('Impossible de copier le lien', 'Fermer', { duration: 3000 });
    }
  }

  async copierCode(): Promise<void> {
    if (!this.invitation) return;

    this.isCopying = true;
    const success = await this.invitationService.copierLien(this.invitation.code);
    this.isCopying = false;

    if (success) {
      this.snackBar.open('Code copié ! 📋', 'OK', { duration: 2000 });
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
        this.snackBar.open('Erreur lors de l\'acceptation', 'Fermer', { duration: 3000 });
      }
    });
  }

  refuserDemande(demande: DemandeAdhesion): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Refuser la demande',
        message: `Voulez-vous vraiment refuser la demande de ${demande.prenom} ${demande.nom} ?`,
        confirmText: 'Refuser',
        cancelText: 'Annuler',
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
            
            this.snackBar.open('Demande refusée', 'OK', { duration: 3000 });
          },
          error: (err) => {
            console.error('Erreur refus:', err);
            this.isProcessing[demande.id] = false;
            this.snackBar.open('Erreur lors du refus', 'Fermer', { duration: 3000 });
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