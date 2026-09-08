import {
  Component, OnInit, inject, signal, computed
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CompetitionApiService } from '../../../../core/services/competition/competition-api.service';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector:    'app-competitions-publiques',
  standalone:  true,
  imports:     [CommonModule, RouterModule, FormsModule, DatePipe,MatIconModule, TranslateModule],
  templateUrl: './competitions-publiques.component.html',
  styleUrls:   ['./competitions-publiques.component.scss']
})
export class CompetitionsPubliquesComponent implements OnInit {

  private api    = inject(CompetitionApiService);
  private router = inject(Router);

  // ── State ──────────────────────────────────────────────────
  competitions = signal<any[]>([]);
  loading      = signal(true);
  searchQuery  = '';
  filtreStatut = signal<string>('');

  // ── Compétitions filtrées ─────────────────────────────────
  competitionsFiltrees = computed(() => {
    let liste = this.competitions();
    const q   = this.searchQuery.toLowerCase().trim();
    const s   = this.filtreStatut();

    if (q) {
      liste = liste.filter(c =>
        c.nom.toLowerCase().includes(q) ||
        (c.description?.toLowerCase().includes(q)) ||
        (c.organisateurNom?.toLowerCase().includes(q)));
    }
    if (s) {
      liste = liste.filter(c => c.statut === s);
    }
    return liste;
  });

  // ── Stats par statut ──────────────────────────────────────
  nbEnCours  = computed(() => this.competitions().filter(c => c.statut === 'EN_COURS').length);
  nbAVenir   = computed(() => this.competitions().filter(c =>
    ['BROUILLON','INSCRIPTION_OUVERTE'].includes(c.statut)).length);
  nbTermines = computed(() => this.competitions().filter(c => c.statut === 'TERMINE').length);

  // ── Init ──────────────────────────────────────────────────
  ngOnInit(): void {
    this.api.listerPublic().subscribe({
      next: c => { this.competitions.set(c); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  ouvrirCompetition(c: any): void {
    this.router.navigate(['/competitions', c.id, 'public']);
  }

  statutLabel(statut: string): string {
    const m: Record<string, string> = {
      BROUILLON:           'À venir',
      INSCRIPTION_OUVERTE: 'Inscriptions ouvertes',
      EN_COURS:            'En cours',
      TERMINE:             'Terminée',
      ANNULE:              'Annulée',
    };
    return m[statut] ?? statut;
  }

  formatLabel(format: string): string {
    const m: Record<string, string> = {
      ALLER_SIMPLE:       'Championnat',
      ALLER_RETOUR:       'Championnat A/R',
      ELIMINATION_SIMPLE: 'Coupe',
      MIXTE:              'Groupes + Élimination',
    };
    return m[format] ?? format;
  }

  getInitials(name: string): string {
    return (name ?? '').split(' ').map((w: string) => w[0])
      .join('').substring(0, 2).toUpperCase();
  }
}