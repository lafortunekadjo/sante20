import { TranslateModule } from '@ngx-translate/core';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { environment } from '../../../../environment';

interface MonMatch {
  matchId: number;
  competitionId: number;
  competitionNom: string;
  journee: number | null;
  dateHeure: string | null;
  lieu: string | null;
  domicile: string;
  exterieur: string;
  statut: string;
  butsDomicile: number | null;
  butsExterieur: number | null;
  monRole: string;
  roleMatch: string | null;
  designe: boolean;
  peutAgir: boolean;
}

const ROLES: Record<string, string> = {
  RESPONSABLE: 'Responsable', SECRETAIRE: 'Secrétaire', ARBITRE: 'Arbitre', COMMISSAIRE: 'Commissaire',
  MEDECIN: 'Médecin', DELEGUE: 'Délégué', OFFICIEL: 'Officiel',
  ARBITRE_PRINCIPAL: 'Arbitre principal', ARBITRE_ASSISTANT: 'Arbitre assistant', QUATRIEME_ARBITRE: '4ᵉ arbitre',
  COMMISSAIRE_MATCH: 'Commissaire de match', DELEGUE_TECHNIQUE: 'Délégué technique'
};

const STATUTS: Record<string, string> = {
  PLANIFIE: 'Planifié', EN_COURS: 'En cours', TERMINE: 'Terminé', REPORTE: 'Reporté',
  FORFAIT_DOMICILE: 'Forfait', FORFAIT_EXTERIEUR: 'Forfait', FORFAIT_DOUBLE: 'Forfait'
};

/**
 * « Mes matchs » : les matchs qu'un arbitre, un commissaire, un secrétaire ou un responsable a à gérer, toutes
 * compétitions confondues — en cours d'abord, puis à venir, puis terminés récemment.
 */
@Component({
  selector: 'app-mes-matchs',
  standalone: true,
  imports: [TranslateModule, CommonModule, FormsModule, RouterLink],
  templateUrl: './mes-matchs.component.html',
  styleUrl: './mes-matchs.component.scss'
})
export class MesMatchsComponent implements OnInit {
  private http = inject(HttpClient);

  chargement = signal(true);
  erreur = signal(false);
  matchs = signal<MonMatch[]>([]);
  filtreCompetition = signal<number | null>(null);
  seulementMiens = signal(false);

  competitions = computed(() => {
    const m = new Map<number, string>();
    this.matchs().forEach(x => m.set(x.competitionId, x.competitionNom));
    return [...m.entries()].map(([id, nom]) => ({ id, nom }));
  });

  private filtres = computed(() => this.matchs().filter(m =>
    (this.filtreCompetition() == null || m.competitionId === this.filtreCompetition())
    && (!this.seulementMiens() || m.designe)));

  enCours = computed(() => this.filtres().filter(m => m.statut === 'EN_COURS'));
  aVenir = computed(() => this.filtres().filter(m => ['PLANIFIE', 'REPORTE'].includes(m.statut)));
  termines = computed(() => this.filtres().filter(m => !['EN_COURS', 'PLANIFIE', 'REPORTE'].includes(m.statut)));
  aujourdhui = computed(() => this.aVenir().filter(m => this.estAujourdhui(m)).length);

  ngOnInit(): void {
    this.http.get<MonMatch[]>(`${environment.apiUrl}/competitions/mes-matchs`).subscribe({
      next: m => { this.matchs.set(m); this.chargement.set(false); },
      error: () => { this.erreur.set(true); this.chargement.set(false); }
    });
  }

  role(m: MonMatch): string { return ROLES[m.roleMatch ?? ''] ?? ROLES[m.monRole] ?? m.monRole; }
  statut(m: MonMatch): string { return STATUTS[m.statut] ?? m.statut; }

  estAujourdhui(m: MonMatch): boolean {
    if (!m.dateHeure) return false;
    return new Date(m.dateHeure).toDateString() === new Date().toDateString();
  }

  /** « Dans 2 h », « Dans 3 j », « Demain »... pour repérer l'urgence d'un coup d'œil. */
  delai(m: MonMatch): string {
    if (!m.dateHeure) return 'Date à fixer';
    const ms = new Date(m.dateHeure).getTime() - Date.now();
    const h = ms / 3600000;
    if (h < -3) return 'Heure dépassée';
    if (h < 1) return h < 0 ? 'À démarrer' : 'Dans moins d\'1 h';
    if (h < 24) return `Dans ${Math.round(h)} h`;
    const j = Math.round(h / 24);
    return j === 1 ? 'Demain' : `Dans ${j} j`;
  }
}
