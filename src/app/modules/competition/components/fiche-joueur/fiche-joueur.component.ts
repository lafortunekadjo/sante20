import { TranslateModule } from '@ngx-translate/core';
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { environment } from '../../../../environment';
import { AuthService } from '../../../../core/services/auth.service';

interface Fiche {
  nomEquipe: string;
  competitionNom?: string;
  role: string;
  nom: string;
  prenom?: string;
  telephone?: string;
  dateNaissance?: string;
  nationalite?: string;
  poste?: string;
  numeroDos?: number;
  photoUrl?: string;
  photoRequise: boolean;
  complet: boolean;
  champsManquants: string[];
  compteLie: boolean;
}

/**
 * Le joueur complète lui-même sa fiche et envoie sa photo d'identité, depuis le lien reçu — sans compte.
 * Le compte My2-0 est proposé en fin de parcours, jamais exigé.
 */
@Component({
  selector: 'app-fiche-joueur',
  standalone: true,
  imports: [TranslateModule, CommonModule, FormsModule, RouterLink],
  templateUrl: './fiche-joueur.component.html',
  styleUrls: ['./fiche-joueur.component.scss']
})
export class FicheJoueurComponent implements OnInit {
  private http  = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private auth  = inject(AuthService);

  token = '';
  fiche   = signal<Fiche | null>(null);
  erreur  = signal<string | null>(null);
  loading = signal(true);
  saving  = signal(false);
  photoEnCours = signal(false);
  enregistre = signal(false);
  message = signal<string | null>(null);

  form = { nom: '', prenom: '', telephone: '', dateNaissance: '', nationalite: '', poste: '', numeroDos: null as number | null };
  readonly postes = ['GARDIEN', 'DEFENSEUR', 'MILIEU', 'ATTAQUANT'];
  readonly aujourdhui = new Date().toISOString().slice(0, 10);

  get connecte(): boolean { return this.auth.isAuthenticated(); }
  estJoueur(): boolean { return ['JOUEUR', 'GARDIEN', 'CAPITAINE'].includes(this.fiche()?.role ?? 'JOUEUR'); }

  private url(suite = ''): string { return `${environment.apiUrl}/public/fiche/${this.token}${suite}`; }

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') ?? '';
    this.http.get<Fiche>(this.url()).subscribe({
      next: f => { this.appliquer(f); this.loading.set(false); },
      error: err => {
        this.erreur.set(err?.error?.message ?? 'Ce lien n\'est plus valide. Demandez-en un nouveau à votre équipe.');
        this.loading.set(false);
      }
    });
  }

  private appliquer(f: Fiche): void {
    this.fiche.set(f);
    this.form = {
      nom: f.nom ?? '', prenom: f.prenom ?? '', telephone: f.telephone ?? '',
      dateNaissance: (f.dateNaissance ?? '').slice(0, 10), nationalite: f.nationalite ?? '',
      poste: f.poste ?? '', numeroDos: f.numeroDos ?? null
    };
  }

  manque(): string[] {
    const m: string[] = [];
    if (!this.form.nom.trim()) m.push('nom');
    if (!this.form.prenom.trim()) m.push('prénom');
    if (this.estJoueur()) {
      if (!this.form.dateNaissance) m.push('date de naissance');
      if (!this.form.nationalite.trim()) m.push('nationalité');
      if (!this.form.poste) m.push('poste');
      // le dorsal est facultatif ; s'il est renseigné il doit être valide
      if (this.form.numeroDos != null && (this.form.numeroDos < 1 || this.form.numeroDos > 99)) m.push('numéro de dos valide (1 à 99, ou vide)');
    }
    return m;
  }

  enregistrer(): void {
    if (this.manque().length || this.saving()) return;
    this.saving.set(true);
    this.message.set(null);
    this.http.put<Fiche>(this.url(), {
      ...this.form,
      dateNaissance: this.form.dateNaissance || null,
      numeroDos: this.form.numeroDos
    }).subscribe({
      next: f => { this.appliquer(f); this.saving.set(false); this.enregistre.set(true); },
      error: err => {
        this.message.set(err?.error?.message ?? 'Enregistrement impossible');
        this.saving.set(false);
      }
    });
  }

  onPhoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    const fichier = input.files?.[0];
    input.value = '';
    if (!fichier) return;
    if (fichier.size > 5 * 1024 * 1024) { this.message.set('La photo ne doit pas dépasser 5 Mo.'); return; }
    this.photoEnCours.set(true);
    const donnees = new FormData();
    donnees.append('file', fichier);
    this.http.post<Fiche>(this.url('/photo'), donnees).subscribe({
      next: f => { this.fiche.set(f); this.photoEnCours.set(false); this.message.set(null); },
      error: err => {
        this.message.set(err?.error?.message ?? 'Envoi de la photo impossible');
        this.photoEnCours.set(false);
      }
    });
  }

  /** Rattache la fiche au compte connecté (notifications de ses matchs, statistiques). */
  lierCompte(): void {
    this.http.post<Fiche>(`${environment.apiUrl}/competitions/fiches/${this.token}/lier`, {}).subscribe({
      next: f => { this.fiche.set(f); this.message.set('Fiche rattachée à votre compte.'); },
      error: err => this.message.set(err?.error?.message ?? 'Rattachement impossible')
    });
  }
}
