import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SettingsService, Theme } from '../../../core/services/settings.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatButtonToggleModule,
    MatDividerModule,
    MatSnackBarModule,
    TranslateModule,
    RouterModule
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit, OnDestroy {
  currentTheme: Theme = 'light';
  currentLanguage: string = 'fr';

  emailNotifications = true;
  pushNotifications = false;
  matchReminders = true;

  // FIX : profil public — chargé depuis l'user connecté
  isPublic = true;

  private destroy$ = new Subject<void>();

  constructor(
    private settingsService: SettingsService,
    private snackBar: MatSnackBar,
    private translate: TranslateService,
    private router: Router,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.settingsService.settings$
      .pipe(takeUntil(this.destroy$))
      .subscribe(settings => {
        this.currentTheme    = settings.theme;
        this.currentLanguage = settings.language;
      });

    // Charger l'état isPublic depuis le cache user
    const user = this.authService.getUser();
    if (user) {
      this.isPublic = user.public ?? user.isPublic ?? true;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Thème / Langue (existant) ─────────────────────────────────
  onThemeChange(theme: Theme): void {
    if (this.currentTheme !== theme) {
      this.settingsService.toggleTheme();
      this.showSaveFeedback();
    }
  }

  onLanguageChange(lang: string): void {
    if (this.currentLanguage !== lang) {
      this.settingsService.toggleLanguage();
      this.showSaveFeedback();
    }
  }

  toggleNotification(setting: string): void {
    this.showSaveFeedback();
  }

  // ── Compte ────────────────────────────────────────────────────

  toggleProfilPublic(event: any): void {
    const isPublic = event.checked;
    this.authService.updateUserProfile({ isPublic }).subscribe({
      next: () => this.snackBar.open(
        isPublic ? 'Profil rendu public ✓' : 'Profil masqué ✓',
        'OK', { duration: 2500 }
      ),
      error: () => {
        // Rollback si erreur
        this.isPublic = !isPublic;
        this.snackBar.open('Erreur lors de la mise à jour', 'Fermer', { duration: 3000 });
      }
    });
  }

  onLogout(): void {
    this.authService.logout();
  }

  // ── Suppression — navigue vers la page dédiée ─────────────────
  onDeleteAccount(): void {
    this.router.navigate(['/settings/delete-account']);
  }

  private showSaveFeedback(): void {
    const message = this.translate.instant('settings.saved') || 'Paramètres mis à jour !';
    this.snackBar.open(message, 'OK', {
      duration: 2500,
      panelClass: ['snackbar-success']
    });
  }
}