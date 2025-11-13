import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { Theme, Language, SettingsService } from '../../../core/services/settings.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    MatDividerModule,
    MatSnackBarModule,
    FormsModule,
    TranslateModule
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
  selectedTheme: Theme = 'light';
  selectedLanguage: Language = 'fr';

  themes: { value: Theme; label: string; icon: string }[] = [
    { value: 'light', label: 'settings.themes.light', icon: 'light_mode' },
    { value: 'dark', label: 'settings.themes.dark', icon: 'dark_mode' },
    { value: 'auto', label: 'settings.themes.auto', icon: 'brightness_auto' }
  ];

  languages: { value: Language; label: string; flag: string }[] = [
    { value: 'fr', label: 'Français', flag: '🇫🇷' },
    { value: 'en', label: 'English', flag: '🇬🇧' }
  ];

  constructor(
    private settingsService: SettingsService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    const currentSettings = this.settingsService.getSettings();
    this.selectedTheme = currentSettings.theme;
    this.selectedLanguage = currentSettings.language;
  }

  onThemeChange(theme: Theme): void {
    this.selectedTheme = theme;
    this.settingsService.setTheme(theme);
    this.showSaveMessage();
  }

  onLanguageChange(language: Language): void {
    this.selectedLanguage = language;
    this.settingsService.setLanguage(language);
    this.showSaveMessage();
  }

  resetSettings(): void {
    if (confirm('Voulez-vous vraiment réinitialiser les paramètres ?')) {
      this.settingsService.resetSettings();
      const defaultSettings = this.settingsService.getSettings();
      this.selectedTheme = defaultSettings.theme;
      this.selectedLanguage = defaultSettings.language;
      this.snackBar.open('Paramètres réinitialisés', 'Fermer', { duration: 3000 });
    }
  }

  private showSaveMessage(): void {
    this.snackBar.open('Paramètres enregistrés', 'Fermer', { duration: 2000 });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}