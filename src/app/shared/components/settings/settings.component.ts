import { t } from '../../../core/i18n/traduire';
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
import { SettingsService, Theme, Language } from '../../../core/services/settings.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
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
    MatTooltipModule,
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
      this.settingsService.setLanguage(lang as Language);
      // Message dans la NOUVELLE langue (une fois celle-ci chargée)
      this.translate.get('settings.saved').subscribe(msg => this.snackBar.open(msg, t('settings.page.ok'), { duration: 2500 }));
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
        t(isPublic ? 'settings.page.profil_public_ok' : 'settings.page.profil_masque_ok'),
        t('settings.page.ok'), { duration: 2500 }
      ),
      error: () => {
        // Rollback si erreur
        this.isPublic = !isPublic;
        this.snackBar.open(t('common.messages.update_error'), t('settings.page.fermer'), { duration: 3000 });
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
    const message = this.translate.instant('settings.saved');
    this.snackBar.open(message, t('settings.page.ok'), {
      duration: 2500,
      panelClass: ['snackbar-success']
    });
  }
}