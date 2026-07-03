import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MonGroupeDTO, AuthService } from '../../../../core/services/auth.service';
import { GroupeContextService } from '../../../../core/services/groupe-context.service';
import { JoinGroupDialogComponent } from '../../../membre/components/join-group-dialog/join-group-dialog.component';

@Component({
  selector: 'app-groupe-switcher',
  standalone: true,
  imports: [
    CommonModule, MatButtonModule, MatIconModule,
    MatMenuModule, MatDividerModule, MatProgressSpinnerModule, MatSnackBarModule, MatDialogModule
  ],
  template: `
    <button mat-button [matMenuTriggerFor]="groupeMenu" class="switcher-btn">
      <div class="switcher-inner">
        <img *ngIf="groupeActif()?.profilePhotoUrl"
             [src]="groupeActif()?.profilePhotoUrl"
             class="groupe-avatar">
        <div *ngIf="!groupeActif()?.profilePhotoUrl" class="groupe-avatar placeholder">
          {{ groupeActif()?.abreviation?.[0] || groupeActif()?.nom?.[0] }}
        </div>
        <div class="switcher-text">
          <span class="groupe-nom">{{ groupeActif()?.nom || 'Mon groupe' }}</span>
          <span class="groupe-role">{{ groupeActif()?.roleInGroupe || '' }}</span>
        </div>
        <mat-icon class="switcher-arrow">expand_more</mat-icon>
      </div>
    </button>

    <mat-menu #groupeMenu="matMenu" class="groupe-menu">
      <div class="menu-header">Mes groupes</div>

      <button mat-menu-item
              *ngFor="let g of mesGroupes()"
              (click)="onSwitch(g)"
              [class.active]="g.groupeId === groupeActifId()">
        <div class="menu-item-inner">
          <img *ngIf="g.profilePhotoUrl" [src]="g.profilePhotoUrl" class="menu-avatar">
          <div *ngIf="!g.profilePhotoUrl" class="menu-avatar placeholder">
            {{ g.abreviation?.[0] || g.nom?.[0] }}
          </div>
          <div class="menu-item-text">
            <span class="menu-nom">{{ g.nom }}</span>
            <span class="menu-role">{{ g.roleInGroupe }}</span>
          </div>
          <mat-icon *ngIf="g.groupeId === groupeActifId()" class="check">check</mat-icon>
        </div>
      </button>

      <div class="menu-empty" *ngIf="mesGroupes().length === 0">
        Aucun groupe trouvé
      </div>

      <mat-divider></mat-divider>

      <!-- Bouton créer un nouveau groupe -->
      <button mat-menu-item (click)="onCreerNouveauGroupe()" class="creer-btn">
        <div class="menu-item-inner">
          <div class="menu-avatar creer-icon">
            <mat-icon>add</mat-icon>
          </div>
          <div class="menu-item-text">
            <span class="menu-nom">Créer un nouveau 2-0</span>
            <span class="menu-role">Deviens responsable de ton groupe</span>
          </div>
        </div>
      </button>

      <!-- Bouton rejoindre via code -->
      <button mat-menu-item (click)="onRejoindreViaCode()" class="rejoindre-btn">
        <div class="menu-item-inner">
          <div class="menu-avatar rejoindre-icon">
            <mat-icon>vpn_key</mat-icon>
          </div>
          <div class="menu-item-text">
            <span class="menu-nom">Rejoindre via un code</span>
            <span class="menu-role">Entre un code d'invitation</span>
          </div>
        </div>
      </button>
    </mat-menu>
  `,
  styles: [`
    .switcher-btn {
      padding: 4px 8px !important;
      border-radius: 12px !important;
      background: rgba(255,255,255,.12) !important;
      min-width: 0 !important;
    }
    .switcher-inner { display: flex; align-items: center; gap: 8px; }
    .groupe-avatar, .menu-avatar {
      width: 28px; height: 28px; border-radius: 8px;
      object-fit: cover; flex-shrink: 0;
    }
    .groupe-avatar.placeholder, .menu-avatar.placeholder {
      display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,.2);
      color: white; font-weight: 700; font-size: 12px;
    }
    .switcher-text {
      display: flex; flex-direction: column; align-items: flex-start;
    }
    @media (max-width: 480px) { .switcher-text { display: none; } }
    .groupe-nom { font-size: 13px; font-weight: 600; color: white; line-height: 1; }
    .groupe-role { font-size: 10px; color: rgba(255,255,255,.7); margin-top: 1px; }
    .switcher-arrow {
      color: white !important; font-size: 18px !important;
      width: 18px !important; height: 18px !important;
    }
    .menu-header {
      padding: 8px 16px 4px;
      font-size: 11px; font-weight: 700;
      text-transform: uppercase; letter-spacing: .4px;
      color: var(--text-tertiary);
    }
    .menu-item-inner { display: flex; align-items: center; gap: 10px; width: 100%; }
    .menu-item-text {
      display: flex; flex-direction: column; flex: 1; min-width: 0;
    }
    .menu-nom { font-size: 13px; font-weight: 600; }
    .menu-role { font-size: 11px; color: var(--text-tertiary); }
    .check {
      color: #1A3EB5 !important; font-size: 18px !important;
      width: 18px !important; height: 18px !important;
    }
    button[mat-menu-item].active { background: rgba(26,62,181,.06); }
    .menu-empty {
      padding: 12px 16px;
      font-size: 13px; color: var(--text-tertiary); text-align: center;
    }
    .creer-btn, .rejoindre-btn { border-top: none; }
    
   
  `]
})
export class GroupeSwitcherComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  mesGroupes    = signal<MonGroupeDTO[]>([]);
  groupeActifId = signal<number | null>(null);
  isSwitching   = signal(false);

  groupeActif = () =>
    this.mesGroupes().find(g => g.groupeId === this.groupeActifId()) ?? null;

  constructor(
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router,
    private groupeContext: GroupeContextService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    const cached = this.authService.getMesGroupesCache();
    if (cached.length > 0) this.mesGroupes.set(cached);

    this.authService.getMesGroupes().subscribe(groupes => {
      this.mesGroupes.set(groupes);
    });

    this.authService.currentGroupeId$
      .pipe(takeUntil(this.destroy$))
      .subscribe(id => this.groupeActifId.set(id));

    // Recharger la liste après chaque switch ou création de groupe
    this.groupeContext.groupeChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.authService.getMesGroupes().subscribe(groupes => {
          this.mesGroupes.set(groupes);
        });
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSwitch(groupe: MonGroupeDTO): void {
    if (groupe.groupeId === this.groupeActifId() || this.isSwitching()) return;

    this.isSwitching.set(true);

    this.authService.switchGroupe(groupe.groupeId).subscribe({
      next: (response) => {
        this.isSwitching.set(false);

        if (response.success) {
          this.snackBar.open(
            `✓ ${response.groupeNom}`,
            undefined,
            { duration: 1500, panelClass: ['snackbar-success'] }
          );

          this.groupeContext.notifyGroupeChanged(response.groupeId);

          const currentUrl = this.router.url;
          this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
            this.router.navigate([currentUrl]);
          });

        } else {
          this.snackBar.open(response.message, '✕', { duration: 3000 });
        }
      },
      error: () => {
        this.isSwitching.set(false);
        this.snackBar.open('Erreur lors du changement de groupe', '✕', { duration: 3000 });
      }
    });
  }

  onCreerNouveauGroupe(): void {
    this.router.navigate(['/creategroup'], {
      queryParams: { mode: 'add' }
    });
  }

  onRejoindreViaCode(): void {
    this.dialog.open(JoinGroupDialogComponent, {
      width: '480px',
      maxWidth: '95vw',
      panelClass: 'join-dialog-panel'
    }).afterClosed().subscribe(success => {
      if (success) {
        // Recharger la liste des groupes si une demande a été envoyée
        this.authService.getMesGroupes().subscribe(groupes => {
          this.mesGroupes.set(groupes);
        });
      }
    });
  }
}