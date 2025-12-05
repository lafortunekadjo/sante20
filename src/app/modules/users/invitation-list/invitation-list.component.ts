import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { trigger, transition, style, animate } from '@angular/animations';


import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { PlayersListDialogComponent, PlayersListDialogData } from '../players-list-dialog/players-list-dialog.component';
import { AuthService } from '../../../core/services/auth.service';
import { InvitationListItem, MatchInvitationService, InvitationStatus } from '../../../core/services/match-invitation.service';

@Component({
  selector: 'app-invitation-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatSelectModule,
    TranslateModule
  ],
  templateUrl: './invitation-list.component.html',
  styleUrls: ['./invitation-list.component.scss'],
  animations: [
    trigger('cardAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class InvitationListComponent implements OnInit {

  @Input() matchId?: number;

  invitations: InvitationListItem[] = [];
  filteredInvitations: InvitationListItem[] = [];
  isLoading = true;
  statusFilter = 'ALL';

  private groupeId: number | null = null;
  private baseUrl = window.location.origin;

  constructor(
    private invitationService: MatchInvitationService,
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {

      this.loadInvitations();
   

  
  }

  // ===== CHARGEMENT =====

  loadInvitations(): void {
  

    this.isLoading = true;
    this.invitationService.getInvitations().subscribe({
      next: (invitations) => {
        this.invitations = invitations;
        
        if (this.matchId) {
          this.invitations = this.invitations.filter(inv => inv.matchId === this.matchId);
        }
        
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement invitations:', err);
        this.isLoading = false;
      }
    });
  }

  // ===== FILTRES =====

  applyFilters(): void {
    if (this.statusFilter === 'ALL') {
      this.filteredInvitations = [...this.invitations];
    } else {
      this.filteredInvitations = this.invitations.filter(inv => inv.statut === this.statusFilter);
    }
  }

  resetFilters(): void {
    this.statusFilter = 'ALL';
    this.applyFilters();
  }

  // ===== COMPTEURS =====

  getCountByStatus(status: InvitationStatus): number {
    return this.invitations.filter(inv => inv.statut === status).length;
  }

  // ===== STATUTS =====

  getStatusLabel(statut: InvitationStatus): string {
    return this.invitationService.getStatutLabel(statut);
  }

  getStatusClass(statut: InvitationStatus): string {
    return this.invitationService.getStatutClass(statut);
  }

  getStatusIcon(statut: InvitationStatus): string {
    const icons: Record<InvitationStatus, string> = {
      'EN_ATTENTE': 'hourglass_empty',
      'SOUMIS': 'inbox',
      'VALIDE': 'check_circle',
      'REFUSE': 'cancel',
      'EXPIRE': 'schedule',
      'ANNULE': 'block'
    };
    return icons[statut] || 'help';
  }

  getExpirationText(dateExpiration: string): string {
    const now = new Date();
    const expDate = new Date(dateExpiration);
    const diffMs = expDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Expiré';
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Demain';
    return `${diffDays} jours`;
  }

  // ===== ACTIONS =====

  copyLink(invitation: InvitationListItem): void {
    const url = `${this.baseUrl}/match/invite/${invitation.token}`;
    navigator.clipboard.writeText(url).then(() => {
      this.showSnackbar(this.translate.instant('invitation.linkCopied'), 'success');
    });
  }

  showQRCode(invitation: InvitationListItem): void {
    const qrUrl = this.invitationService.getQRCodeUrl(invitation.token);
    window.open(qrUrl, '_blank');
  }

  viewPlayersList(invitation: InvitationListItem): void {
  
    this.invitationService.getInvitationDetails(invitation.id).subscribe({
      next: (details) => {
        const dialogData: PlayersListDialogData = {
          nomEquipeAdverse: details.equipeAdverse?.nomEquipe || invitation.nomEquipeAdverse || 'Équipe adverse',
          emailContact: details.equipeAdverse?.emailContact,
          telephoneContact: details.equipeAdverse?.telephoneContact,
          joueurs: details.equipeAdverse?.joueurs || [],
          canValidate: invitation.statut === 'SOUMIS',
          invitationId: invitation.id
        };

        const dialogRef = this.dialog.open(PlayersListDialogComponent, {
          width: '600px',
          maxWidth: '95vw',
          maxHeight: '90vh',
          data: dialogData
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result?.action === 'validate') {
            this.validateInvitation(invitation);
          } else if (result?.action === 'reject') {
            this.rejectInvitation(invitation);
          }
        });
      },
      error: (err) => {
        console.error('Erreur chargement détails:', err);
        this.showSnackbar('Erreur lors du chargement des détails', 'error');
      }
    });
  }

  validateInvitation(invitation: InvitationListItem): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Valider la liste',
        message: this.translate.instant('invitation.validateConfirm')
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.invitationService.validateInvitation(invitation.id).subscribe({
          next: () => {
            this.showSnackbar(this.translate.instant('invitation.validateSuccess'), 'success');
            this.loadInvitations();
          },
          error: (err) => {
            const errorMsg = err.error?.message || 'Erreur lors de la validation';
            this.showSnackbar(errorMsg, 'error');
          }
        });
      }
    });
  }

  rejectInvitation(invitation: InvitationListItem): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Refuser la liste',
        message: this.translate.instant('invitation.rejectConfirm')
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.groupeId) {
        this.invitationService.rejectInvitation( invitation.id).subscribe({
          next: () => {
            this.showSnackbar(this.translate.instant('invitation.rejectSuccess'), 'success');
            this.loadInvitations();
          },
          error: (err) => {
            const errorMsg = err.error?.message || 'Erreur lors du refus';
            this.showSnackbar(errorMsg, 'error');
          }
        });
      }
    });
  }

  cancelInvitation(invitation: InvitationListItem): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Annuler l\'invitation',
        message: this.translate.instant('invitation.cancelConfirm')
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.groupeId) {
        this.invitationService.cancelInvitation( invitation.id).subscribe({
          next: () => {
            this.showSnackbar(this.translate.instant('invitation.cancelSuccess'), 'success');
            this.loadInvitations();
          },
          error: (err) => {
            const errorMsg = err.error?.message || 'Erreur lors de l\'annulation';
            this.showSnackbar(errorMsg, 'error');
          }
        });
      }
    });
  }

  // ===== UTILITAIRES =====

  private showSnackbar(message: string, type: 'success' | 'error'): void {
    const panelClass = type === 'success' ? 'snackbar-success' : 'snackbar-error';
    this.snackBar.open(message, '✕', {
      duration: 4000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [panelClass]
    });
  }
}