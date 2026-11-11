import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { Language, SettingsService } from '../../../core/services/settings.service';

/**
 * Sélecteur FR | EN pour les pages publiques (connexion, inscription, accueil) :
 * la barre de navigation est masquée sur téléphone et le tiroir « Plus » n'existe qu'une fois connecté.
 * Il disparaît automatiquement quand l'utilisateur est authentifié.
 */
@Component({
  selector: 'app-lang-switch',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="lang-switch" role="group" aria-label="Langue / Language" *ngIf="!connecte">
      <button type="button" *ngFor="let l of langues" [class.on]="l === current"
              [attr.aria-pressed]="l === current" (click)="choisir(l)">{{ l.toUpperCase() }}</button>
    </div>`,
  styles: [`
    .lang-switch {
      flex-shrink: 0;
      display: inline-flex; padding: 3px; gap: 2px; border-radius: 999px;
      background: rgba(255, 255, 255, .12);
      border: 1px solid rgba(255, 255, 255, .25);
    }
    button {
      min-width: 34px; height: 28px; padding: 0 8px; border: 0; border-radius: 999px;
      background: transparent; color: rgba(255, 255, 255, .85);
      font-family: inherit; font-size: 12px; font-weight: 600; line-height: 1; letter-spacing: .04em; cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    button.on { background: #fff; color: #0f172a; }
    button:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
  `]
})
export class LangSwitchComponent implements OnInit, OnDestroy {
  readonly langues: Language[] = ['fr', 'en'];
  current: Language = 'fr';
  connecte = false;
  private sub?: Subscription;

  constructor(private settings: SettingsService, private auth: AuthService) {}

  ngOnInit(): void {
    this.connecte = this.auth.isAuthenticated();
    this.sub = this.settings.settings$.subscribe(s => this.current = s.language);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  choisir(l: Language): void {
    if (l !== this.current) this.settings.setLanguage(l);
  }
}
