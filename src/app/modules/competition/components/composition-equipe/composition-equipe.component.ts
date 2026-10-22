import { TranslateModule } from '@ngx-translate/core';
import { Component, Input, OnChanges, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

type StatutCompo = 'TITULAIRE' | 'REMPLACANT' | 'NON_CONVOQUE';

interface MatchAComposer {
  matchId: number;
  journee: number | null;
  dateHeure: string | null;
  lieu: string | null;
  adversaire: string;
  domicile: boolean;
  statutMatch: 'PLANIFIE' | 'EN_COURS';
  titulaires: number;
  remplacants: number;
  modifiable: boolean;
}

interface LigneCompo {
  membreId: number;
  nom: string;
  prenom: string | null;
  numeroDos: number | null;
  poste: string | null;
  statut: StatutCompo;
  capitaine: boolean;
  gardienTitulaire: boolean;
  eligible: boolean;
  raison: string | null;
}

interface CompoEquipe {
  matchId: number;
  equipe: string;
  adversaire: string;
  dateHeure: string | null;
  modifiable: boolean;
  minTitulaires: number;
  maxTitulaires: number;
  maxRemplacants: number;
  joueurs: LigneCompo[];
}

/**
 * Composition des matchs par le gérant de l'équipe : il choisit ses titulaires et remplaçants parmi son effectif,
 * jusqu'au coup d'envoi. Fonctionne avec un compte (responsable, adjoint, promoteur) comme avec le lien de gestion.
 * Les règles (11 titulaires maximum, joueurs de l'équipe uniquement, match encore à jouer) sont vérifiées par le serveur.
 */
@Component({
  selector: 'app-composition-equipe',
  standalone: true,
  imports: [TranslateModule, CommonModule],
  templateUrl: './composition-equipe.component.html',
  styleUrl: './composition-equipe.component.scss'
})
export class CompositionEquipeComponent implements OnChanges {
  private http = inject(HttpClient);

  /** Racine des appels : `/api/public/equipe/<jeton>` (lien) ou `/api/competitions/<c>/participants/<p>` (compte). */
  @Input({ required: true }) apiBase!: string;
  /** Vrai avec un lien de gestion : la liste des matchs n'a pas la même adresse. */
  @Input() parLien = false;

  matchs = signal<MatchAComposer[]>([]);
  chargement = signal(true);
  compo = signal<CompoEquipe | null>(null);
  lignes = signal<LigneCompo[]>([]);
  envoi = signal(false);
  message = signal<string | null>(null);
  erreur = signal<string | null>(null);

  nbTitulaires = computed(() => this.lignes().filter(l => l.statut === 'TITULAIRE').length);
  nbRemplacants = computed(() => this.lignes().filter(l => l.statut === 'REMPLACANT').length);
  depasse = computed(() => {
    const c = this.compo();
    return !!c && (this.nbTitulaires() > c.maxTitulaires || this.nbRemplacants() > c.maxRemplacants);
  });

  ngOnChanges(): void { this.charger(); }

  charger(): void {
    this.chargement.set(true);
    const url = this.parLien ? `${this.apiBase}/matchs` : `${this.apiBase}/matchs-composition`;
    this.http.get<MatchAComposer[]>(url).subscribe({
      next: m => { this.matchs.set(m); this.chargement.set(false); },
      error: () => { this.matchs.set([]); this.chargement.set(false); }
    });
  }

  ouvrir(m: MatchAComposer): void {
    this.erreur.set(null);
    this.message.set(null);
    this.http.get<CompoEquipe>(`${this.apiBase}/matchs/${m.matchId}/composition`).subscribe({
      next: c => { this.compo.set(c); this.lignes.set(c.joueurs.map(j => ({ ...j }))); },
      error: err => this.erreur.set(err?.error?.message ?? 'Composition indisponible')
    });
  }

  fermer(): void { this.compo.set(null); this.charger(); }

  // ── Édition ───────────────────────────────────────────────
  definir(l: LigneCompo, statut: StatutCompo): void {
    this.lignes.update(ls => ls.map(x => x.membreId !== l.membreId ? x : {
      ...x, statut,
      capitaine: statut === 'NON_CONVOQUE' ? false : x.capitaine,
      gardienTitulaire: statut === 'TITULAIRE' ? x.gardienTitulaire : false
    }));
  }

  /** Dorsal pour CE match (vide = celui de la fiche, s'il y en a un). */
  definirDorsal(l: LigneCompo, valeur: string): void {
    const n = valeur === '' ? null : Number(valeur);
    this.lignes.update(ls => ls.map(x => x.membreId !== l.membreId ? x : { ...x, numeroDos: n }));
  }

  basculerCapitaine(l: LigneCompo): void {
    this.lignes.update(ls => ls.map(x => ({ ...x, capitaine: x.membreId === l.membreId ? !x.capitaine : false })));
  }

  basculerGardien(l: LigneCompo): void {
    this.lignes.update(ls => ls.map(x => ({ ...x, gardienTitulaire: x.membreId === l.membreId ? !x.gardienTitulaire : false })));
  }

  toutVider(): void {
    this.lignes.update(ls => ls.map(x => ({ ...x, statut: 'NON_CONVOQUE' as StatutCompo, capitaine: false, gardienTitulaire: false })));
  }

  enregistrer(): void {
    const c = this.compo();
    if (!c || this.envoi() || this.depasse()) return;
    this.envoi.set(true);
    this.erreur.set(null);
    const corps = this.lignes()
      .filter(l => l.statut !== 'NON_CONVOQUE')
      .map(l => ({ membreId: l.membreId, statut: l.statut, capitaine: l.capitaine, gardienTitulaire: l.gardienTitulaire, numeroDos: l.numeroDos }));
    this.http.put<CompoEquipe>(`${this.apiBase}/matchs/${c.matchId}/composition`, corps).subscribe({
      next: r => {
        this.envoi.set(false);
        this.compo.set(r);
        this.lignes.set(r.joueurs.map(j => ({ ...j })));
        const nonEligibles = r.joueurs.filter(j => j.statut !== 'NON_CONVOQUE' && !j.eligible).length;
        this.message.set(nonEligibles
          ? `Composition enregistrée. Attention : ${nonEligibles} joueur(s) choisi(s) ne sont pas éligibles (voir les alertes).`
          : 'Composition enregistrée.');
      },
      error: err => { this.envoi.set(false); this.erreur.set(err?.error?.message ?? 'Enregistrement impossible'); }
    });
  }

  nomComplet(l: LigneCompo): string { return `${l.prenom ?? ''} ${l.nom ?? ''}`.trim(); }
  abrege(poste: string | null): string { return (poste ?? '').slice(0, 3).toUpperCase(); }
}
