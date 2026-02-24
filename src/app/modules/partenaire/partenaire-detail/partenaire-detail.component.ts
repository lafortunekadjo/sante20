// ============================================================
// MY2-0 - DÉTAILS PARTENAIRE (Admin)
// Vue détaillée et gestion d'un partenaire
// ============================================================

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { PartenaireDTO, StatsPartenaireDTO, UtilisateurPartenaireDTO, EntrepriseDTO, PubliciteDTO, EMPLACEMENTS_PUBLICITE } from '../../../core/models/partenaire.model';
import { AdminPartenaireService } from '../../../core/services/admin-partenaire.service';
import { AjouterUtilisateurDialogComponent } from '../ajouter-utilisateur-dialog/ajouter-utilisateur-dialog.component';
import { ModifierLimitesDialogComponent } from '../modifier-limites-dialog/modifier-limites-dialog.component';
import { RenouvelerContratDialogComponent } from '../renouveler-contrat-dialog/renouveler-contrat-dialog.component';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';


@Component({
  selector: 'app-partenaire-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatMenuModule,
    MatChipsModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatDividerModule,
    MatDialogModule,
    MatSnackBarModule,
    TranslateModule
  ],
  templateUrl: './partenaire-detail.component.html',
  styleUrls: ['./partenaire-detail.component.scss']
})
export class PartenaireDetailComponent implements OnInit, OnDestroy {
  // Données
  partenaire: PartenaireDTO | null = null;
  stats: StatsPartenaireDTO | null = null;
  utilisateurs: UtilisateurPartenaireDTO[] = [];
  entreprises: EntrepriseDTO[] = [];
  publicites: PubliciteDTO[] = [];

  // États
  isLoading = true;
  isLoadingStats = true;
  isLoadingUsers = true;
  activeTab = 0;

  // ID partenaire
  partenaireId!: number;

  // Helpers
  emplacements = EMPLACEMENTS_PUBLICITE;

  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private adminService: AdminPartenaireService,
    private translateService: TranslateService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.partenaireId = +this.route.snapshot.params['id'];
    
    if (!this.partenaireId) {
      this.router.navigate(['/admin/partenaires']);
      return;
    }

    this.loadPartenaire();
    this.loadStats();
    this.loadUtilisateurs();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // ============================================================
  // CHARGEMENT DES DONNÉES
  // ============================================================

  private loadPartenaire(): void {
    this.isLoading = true;

    const sub = this.adminService.getPartenaire(this.partenaireId).subscribe({
      next: (partenaire) => {
        this.partenaire = partenaire;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement partenaire:', err);
        this.snackBar.open('Partenaire non trouvé', 'OK', { duration: 3000 });
        this.router.navigate(['/admin/partenaires']);
      }
    });
    this.subscriptions.push(sub);
  }

  private loadStats(): void {
    this.isLoadingStats = true;

    const sub = this.adminService.getStats(this.partenaireId).subscribe({
      next: (stats) => {
        this.stats = stats;
        this.isLoadingStats = false;
      },
      error: (err) => {
        console.error('Erreur chargement stats:', err);
        this.isLoadingStats = false;
      }
    });
    this.subscriptions.push(sub);
  }

  private loadUtilisateurs(): void {
    this.isLoadingUsers = true;

    const sub = this.adminService.getUtilisateurs(this.partenaireId).subscribe({
      next: (users) => {
        this.utilisateurs = users;
        this.isLoadingUsers = false;
      },
      error: (err) => {
        console.error('Erreur chargement utilisateurs:', err);
        this.isLoadingUsers = false;
      }
    });
    this.subscriptions.push(sub);
  }

  // ============================================================
  // ACTIONS STATUT
  // ============================================================

  activerPartenaire(): void {
    this.adminService.activerPartenaire(this.partenaireId).subscribe({
      next: (updated) => {
        this.partenaire = updated;
        this.snackBar.open('Partenaire activé', 'OK', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open('Erreur lors de l\'activation', 'OK', { duration: 3000 });
      }
    });
  }

  suspendrePartenaire(): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Suspendre le partenaire',
        message: `Voulez-vous suspendre "${this.partenaire?.nom}" ? Toutes ses publicités seront désactivées.`,
        confirmText: 'Suspendre',
        cancelText: 'Annuler',
        confirmColor: 'warn',
        icon: 'pause_circle'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.adminService.suspendrePartenaire(this.partenaireId).subscribe({
          next: (updated) => {
            this.partenaire = updated;
            this.snackBar.open('Partenaire suspendu', 'OK', { duration: 3000 });
          },
          error: () => {
            this.snackBar.open('Erreur lors de la suspension', 'OK', { duration: 3000 });
          }
        });
      }
    });
  }

  resilierPartenaire(): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '450px',
      data: {
        title: 'Résilier le contrat',
        message: `Attention ! La résiliation du contrat de "${this.partenaire?.nom}" est définitive. Le partenaire ne pourra plus accéder à son espace.`,
        confirmText: 'Résilier le contrat',
        cancelText: 'Annuler',
        confirmColor: 'warn',
        icon: 'gavel'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.adminService.resilierPartenaire(this.partenaireId).subscribe({
          next: (updated) => {
            this.partenaire = updated;
            this.snackBar.open('Contrat résilié', 'OK', { duration: 3000 });
          },
          error: () => {
            this.snackBar.open('Erreur lors de la résiliation', 'OK', { duration: 3000 });
          }
        });
      }
    });
  }

  deletePartenaire(): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '450px',
      data: {
        title: 'Supprimer définitivement',
        message: `ATTENTION ! Cette action est IRRÉVERSIBLE. Toutes les données de "${this.partenaire?.nom}" seront supprimées : entreprises, publicités, statistiques, utilisateurs.`,
        confirmText: 'Supprimer définitivement',
        cancelText: 'Annuler',
        confirmColor: 'warn',
        icon: 'delete_forever'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.adminService.deletePartenaire(this.partenaireId).subscribe({
          next: () => {
            this.snackBar.open('Partenaire supprimé', 'OK', { duration: 3000 });
            this.router.navigate(['/admin/partenaires']);
          },
          error: () => {
            this.snackBar.open('Erreur lors de la suppression', 'OK', { duration: 3000 });
          }
        });
      }
    });
  }

  // ============================================================
  // ACTIONS CONTRAT
  // ============================================================

  renouvelerContrat(): void {
    const dialogRef = this.dialog.open(RenouvelerContratDialogComponent, {
      width: '450px',
      data: {
        partenaire: this.partenaire
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.adminService.renouvelerContrat(
          this.partenaireId,
          result.dateFinContrat,
          result.montant
        ).subscribe({
          next: (updated) => {
            this.partenaire = updated;
            this.snackBar.open('Contrat renouvelé', 'OK', { duration: 3000 });
          },
          error: () => {
            this.snackBar.open('Erreur lors du renouvellement', 'OK', { duration: 3000 });
          }
        });
      }
    });
  }

  modifierLimites(): void {
    const dialogRef = this.dialog.open(ModifierLimitesDialogComponent, {
      width: '450px',
      data: {
        partenaire: this.partenaire
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.adminService.modifierLimites(
          this.partenaireId,
          result.maxEntreprises,
          result.maxPublicites
        ).subscribe({
          next: (updated) => {
            this.partenaire = updated;
            this.snackBar.open('Limites modifiées', 'OK', { duration: 3000 });
          },
          error: () => {
            this.snackBar.open('Erreur lors de la modification', 'OK', { duration: 3000 });
          }
        });
      }
    });
  }

  // ============================================================
  // ACTIONS UTILISATEURS
  // ============================================================

  ajouterUtilisateur(): void {
    const dialogRef = this.dialog.open(AjouterUtilisateurDialogComponent, {
      width: '500px',
      data: {
        partenaireId: this.partenaireId
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.adminService.addUtilisateur(this.partenaireId, result).subscribe({
          next: () => {
            this.snackBar.open('Utilisateur ajouté', 'OK', { duration: 3000 });
            this.loadUtilisateurs();
          },
          error: (err) => {
            const message = err.error?.message || 'Erreur lors de l\'ajout';
            this.snackBar.open(message, 'OK', { duration: 3000 });
          }
        });
      }
    });
  }

  supprimerUtilisateur(user: UtilisateurPartenaireDTO): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Supprimer l\'utilisateur',
        message: `Voulez-vous supprimer l'accès de ${user.prenom} ${user.nom} ?`,
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.adminService.removeUtilisateur(this.partenaireId, user.id).subscribe({
          next: () => {
            this.snackBar.open('Utilisateur supprimé', 'OK', { duration: 3000 });
            this.loadUtilisateurs();
          },
          error: () => {
            this.snackBar.open('Erreur lors de la suppression', 'OK', { duration: 3000 });
          }
        });
      }
    });
  }

  resetPasswordUtilisateur(user: UtilisateurPartenaireDTO): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Réinitialiser le mot de passe',
        message: `Un nouveau mot de passe temporaire sera généré pour ${user.prenom} ${user.nom}.`,
        confirmText: 'Réinitialiser',
        cancelText: 'Annuler',
        confirmColor: 'primary',
        icon: 'lock_reset'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.adminService.resetPassword(this.partenaireId, user.id).subscribe({
          next: (result) => {
            // Afficher le mot de passe temporaire
            this.dialog.open(ConfirmationDialogComponent, {
              width: '400px',
              data: {
                title: 'Mot de passe réinitialisé',
                message: `Nouveau mot de passe temporaire :\n\n${result.temporaryPassword}\n\nCommuniquez-le à l'utilisateur.`,
                confirmText: 'Compris',
                icon: 'check_circle'
              }
            });
          },
          error: () => {
            this.snackBar.open('Erreur lors de la réinitialisation', 'OK', { duration: 3000 });
          }
        });
      }
    });
  }

  // ============================================================
  // HELPERS
  // ============================================================

  getStatutClass(statut: string): string {
    switch (statut) {
      case 'ACTIF': return 'status-active';
      case 'SUSPENDU': return 'status-suspended';
      case 'RESILIE': return 'status-terminated';
      case 'EN_ATTENTE': return 'status-pending';
      default: return '';
    }
  }

  getStatutLabel(statut: string): string {
    switch (statut) {
      case 'ACTIF': return 'Actif';
      case 'SUSPENDU': return 'Suspendu';
      case 'RESILIE': return 'Résilié';
      case 'EN_ATTENTE': return 'En attente';
      default: return statut;
    }
  }

  getStatutIcon(statut: string): string {
    switch (statut) {
      case 'ACTIF': return 'check_circle';
      case 'SUSPENDU': return 'pause_circle';
      case 'RESILIE': return 'cancel';
      case 'EN_ATTENTE': return 'hourglass_empty';
      default: return 'help';
    }
  }

  getTypeContratClass(type: string): string {
    switch (type) {
      case 'ESSAI': return 'type-trial';
      case 'BASIC': return 'type-basic';
      case 'STANDARD': return 'type-standard';
      case 'PREMIUM': return 'type-premium';
      case 'PERSONNALISE': return 'type-custom';
      default: return '';
    }
  }

  getDaysUntilExpiration(): number | null {
    if (!this.partenaire?.dateFinContrat) return null;
    const end = new Date(this.partenaire.dateFinContrat);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  isExpiringSoon(): boolean {
    const days = this.getDaysUntilExpiration();
    return days !== null && days > 0 && days <= 30;
  }

  isExpired(): boolean {
    const days = this.getDaysUntilExpiration();
    return days !== null && days <= 0;
  }

  getUsagePercent(used: number , max: number| undefined): number {
    if (!max || max === 0) return 0;
    return Math.min(100, Math.round((used / max) * 100));
  }

  getUsageClass(used: number, max: number| undefined): string {
    const percent = this.getUsagePercent(used, max);
    if (percent >= 90) return 'usage-critical';
    if (percent >= 70) return 'usage-warning';
    return 'usage-normal';
  }

  formatDate(date: string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }

  getEmplacementLabel(value: string): string {
    const emp = this.emplacements.find(e => e.value === value);
    return emp ? this.translateService.instant(emp.labelKey) : value;
  }

  getRoleLabel(role: string): string {
    switch (role) {
      case 'ADMIN': return 'Administrateur';
      case 'EDITEUR': return 'Éditeur';
      case 'LECTEUR': return 'Lecteur';
      default: return role;
    }
  }

  goBack(): void {
    this.router.navigate(['/admin/partenaires']);
  }
}