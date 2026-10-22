import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { environment } from '../../../environment';
import { SettingsService } from '../../../core/services/settings.service';

/**
 * Page publique « Programme pilote » : cible des publicités destinées aux organisateurs.
 * Le paramètre ?src=facebook (etc.) est conservé avec la demande pour savoir quelle publicité fonctionne.
 */
@Component({
  selector: 'app-pilote',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule],
  templateUrl: './pilote.component.html',
  styleUrl: './pilote.component.scss'
})
export class PiloteComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  settings = inject(SettingsService);

  types = ['CHAMPIONNAT', 'COUPE', 'TOURNOI', 'LIGUE', 'AUTRE'];
  f: any = { nom: '', email: '', telephone: '', organisation: '', ville: '', pays: 'Cameroun', typeEvenement: 'TOURNOI',
             nombreEquipes: null, dateSouhaitee: '', message: '', consentement: false, site: '' };
  envoi = signal(false);
  fait = signal(false);
  erreur = signal<string | null>(null);
  source = '';

  ngOnInit(): void {
    this.source = (this.route.snapshot.queryParamMap.get('src') ?? this.route.snapshot.queryParamMap.get('utm_source') ?? '').slice(0, 60);
  }

  get langue(): string { return this.settings.getLanguage(); }
  changerLangue(l: 'fr' | 'en'): void { this.settings.setLanguage(l); }

  valide(): boolean {
    return (this.f.nom ?? '').trim().length >= 2 && /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test((this.f.email ?? '').trim()) && !!this.f.consentement;
  }

  envoyer(): void {
    if (!this.valide() || this.envoi()) return;
    this.envoi.set(true);
    this.erreur.set(null);
    this.http.post(`${environment.apiUrl}/public/pilote`, { ...this.f, nombreEquipes: this.f.nombreEquipes ? Number(this.f.nombreEquipes) : null,
        source: this.source, langue: this.langue }).subscribe({
      next: () => { this.fait.set(true); this.envoi.set(false); },
      error: e => { this.erreur.set(e?.status === 429 ? 'pilote.erreur_trop' : 'pilote.erreur'); this.envoi.set(false); }
    });
  }
}
