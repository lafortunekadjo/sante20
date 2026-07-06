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
    TranslateModule
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit, OnDestroy {
  currentTheme: Theme = 'light';
  currentLanguage: string = 'fr';
  
  // Options de simulation pour les notifications
  emailNotifications = true;
  pushNotifications = false;
  matchReminders = true;

  private destroy$ = new Subject<void>();

  constructor(
    private settingsService: SettingsService,
    private snackBar: MatSnackBar,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    // Écouter les changements globaux de configuration (Thème & Langue)
    this.settingsService.settings$
      .pipe(takeUntil(this.destroy$))
      .subscribe(settings => {
        this.currentTheme = settings.theme;
        this.currentLanguage = settings.language;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onThemeChange(theme: Theme): void {
    if (this.currentTheme !== theme) {
      this.settingsService.toggleTheme(); // Ou une méthode spécifique setSelection(theme) si disponible
      this.showSaveFeedback();
    }
  }

  onLanguageChange(lang: string): void {
    if (this.currentLanguage !== lang) {
      this.settingsService.toggleLanguage(); // Aligne le changement avec votre service existant
      this.showSaveFeedback();
    }
  }

  toggleNotification(setting: string): void {
    this.showSaveFeedback();
  }

  private showSaveFeedback(): void {
    const message = this.translate.instant('settings.saved') || 'Paramètres mis à jour !';
    this.snackBar.open(message, 'OK', {
      duration: 2500,
      panelClass: ['snackbar-success']
    });
  }
}