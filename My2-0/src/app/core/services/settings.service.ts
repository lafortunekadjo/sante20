import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

export type Theme = 'light' | 'dark' | 'auto';
export type Language = 'fr' | 'en';

export interface AppSettings {
  theme: Theme;
  language: Language;
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private readonly STORAGE_KEY = 'app-settings';
  private readonly DEFAULT_SETTINGS: AppSettings = {
    theme: 'light',
    language: 'fr'
  };

  private settingsSubject = new BehaviorSubject<AppSettings>(this.DEFAULT_SETTINGS);
  public settings$ = this.settingsSubject.asObservable();

  constructor(private translate: TranslateService) {
    this.loadSettings();
    this.initializeLanguage();
    this.initializeTheme();
  }

  /**
   * Charger les paramètres depuis le localStorage
   */
  private loadSettings(): void {
    const savedSettings = localStorage.getItem(this.STORAGE_KEY);
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings) as AppSettings;
        this.settingsSubject.next(settings);
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres:', error);
        this.saveSettings(this.DEFAULT_SETTINGS);
      }
    } else {
      // Détecter la langue du navigateur
      const browserLang = this.translate.getBrowserLang();
      const detectedLang = browserLang === 'fr' || browserLang === 'en' ? browserLang as Language : 'fr';
      
      const initialSettings = {
        ...this.DEFAULT_SETTINGS,
        language: detectedLang
      };
      
      this.saveSettings(initialSettings);
    }
  }

  /**
   * Sauvegarder les paramètres dans le localStorage
   */
  private saveSettings(settings: AppSettings): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
    this.settingsSubject.next(settings);
  }

  /**
   * Initialiser la langue
   */
  private initializeLanguage(): void {
    const currentSettings = this.settingsSubject.value;
    this.translate.setDefaultLang(currentSettings.language);
    this.translate.use(currentSettings.language);
  }

  /**
   * Initialiser le thème
   */
  private initializeTheme(): void {
    const currentSettings = this.settingsSubject.value;
    this.applyTheme(currentSettings.theme);
  }

  /**
   * Obtenir les paramètres actuels
   */
  getSettings(): AppSettings {
    return this.settingsSubject.value;
  }

  /**
   * Obtenir le thème actuel
   */
  getTheme(): Theme {
    return this.settingsSubject.value.theme;
  }

  /**
   * Obtenir la langue actuelle
   */
  getLanguage(): Language {
    return this.settingsSubject.value.language;
  }

  /**
   * Changer la langue
   */
  setLanguage(language: Language): void {
    this.translate.use(language);
    const currentSettings = this.settingsSubject.value;
    this.saveSettings({ ...currentSettings, language });
  }

  /**
   * Changer le thème
   */
  setTheme(theme: Theme): void {
    const currentSettings = this.settingsSubject.value;
    this.saveSettings({ ...currentSettings, theme });
    this.applyTheme(theme);
  }

  /**
   * Appliquer le thème au DOM
   */
  private applyTheme(theme: Theme): void {
    const body = document.body;
    
    // Retirer toutes les classes de thème
    body.classList.remove('light-theme', 'dark-theme');

    if (theme === 'auto') {
      // Détecter le thème système
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      body.classList.add(prefersDark ? 'dark-theme' : 'light-theme');
      
      // Écouter les changements du thème système
      this.watchSystemTheme();
    } else {
      body.classList.add(`${theme}-theme`);
    }
  }

  /**
   * Surveiller les changements du thème système
   */
  private watchSystemTheme(): void {
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    darkModeQuery.addEventListener('change', (e) => {
      if (this.getTheme() === 'auto') {
        const body = document.body;
        body.classList.remove('light-theme', 'dark-theme');
        body.classList.add(e.matches ? 'dark-theme' : 'light-theme');
      }
    });
  }

  /**
   * Réinitialiser aux paramètres par défaut
   */
  resetSettings(): void {
    this.saveSettings(this.DEFAULT_SETTINGS);
    this.initializeLanguage();
    this.initializeTheme();
  }

  /**
   * Basculer entre les thèmes
   */
  toggleTheme(): void {
    const currentTheme = this.getTheme();
    const newTheme: Theme = currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  /**
   * Basculer entre les langues
   */
  toggleLanguage(): void {
    const currentLang = this.getLanguage();
    const newLang: Language = currentLang === 'fr' ? 'en' : 'fr';
    this.setLanguage(newLang);
  }
}