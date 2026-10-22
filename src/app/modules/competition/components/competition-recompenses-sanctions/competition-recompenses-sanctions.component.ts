import { t } from '../../../../core/i18n/traduire';
import { TranslateModule } from '@ngx-translate/core';
import {
  Component, OnInit, inject, signal, computed, Input
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { CompetitionApiService } from '../../../../core/services/competition/competition-api.service';

type TypeRecompense = 'MONETAIRE' | 'TROPHEE' | 'MEDAILLE' | 'COUPE' | 'AUTRE';
type TypeEvenement  = 'CARTON_JAUNE' | 'CARTON_ROUGE' | 'EXCLUSION' |
                      'RETARD' | 'FORFAIT' | 'INDISCIPLINE' | 'AUTRE';
type StatutSanction = 'EN_ATTENTE' | 'PAYEE' | 'DISPENSEE';

interface Recompense {
  rang:           number;
  label:          string;
  typeRecompense: TypeRecompense;
  montant?:       number;
  devise:         string;
  description?:   string;
  materiau?:      Materiau | null;   // médaille / trophée / coupe : or, argent, bronze
  quantite?:      number | null;     // nombre d'exemplaires remis
  cible?:         Cible;             // EQUIPE (par rang) ou prix individuel
  publique?:      boolean;           // affichée sur la page publique ? (les distinctions restent internes par défaut)
}

type Materiau = 'OR' | 'ARGENT' | 'BRONZE' | 'AUTRE';
type Cible = 'EQUIPE' | 'BUTEUR' | 'PASSEUR' | 'GARDIEN' | 'DEFENSEUR' | 'MVP' | 'FAIR_PLAY' | 'AUTRE_PRIX';

const CIBLE_LABELS: Record<Exclude<Cible, 'EQUIPE'>, string> = {
  BUTEUR: '⚽ Meilleur buteur', PASSEUR: '🎯 Meilleur passeur', GARDIEN: '🧤 Meilleur gardien',
  DEFENSEUR: '🛡️ Meilleur défenseur', MVP: '⭐ Meilleur joueur', FAIR_PLAY: '🤝 Fair-play',
  AUTRE_PRIX: '✏️ Autre distinction (à nommer)'
};

interface BaremeSanction {
  id?:            number;
  typeEvenement:  TypeEvenement;
  libelle?:       string;
  montant:        number;
  devise:         string;
}

interface SanctionResultDTO {
  id:             number;
  equipeNom:      string;
  joueurNom?:     string;
  typeEvenement:  TypeEvenement;
  libelle:        string;
  montant:        number;
  devise:         string;
  statut:         StatutSanction;
  dateSanction:   string;
  datePaiement?:  string;
  notes?:         string;
}

interface RecapEquipe {
  participantId:    number;
  equipeNom:        string;
  totalDu:          number;
  totalPaye:        number;
  soldeEnAttente:   number;
  nombreSanctions:  number;
}

const TYPE_RECOMPENSE_LABELS: Record<TypeRecompense, string> = {
  MONETAIRE: 'Dotation financière',
  TROPHEE:   'Trophée',
  MEDAILLE:  'Médaille',
  COUPE:     'Coupe',
  AUTRE:     'Autre'
};

const TYPE_EVENEMENT_LABELS: Record<TypeEvenement, string> = {
  CARTON_JAUNE: 'Carton jaune',
  CARTON_ROUGE: 'Carton rouge',
  EXCLUSION:    'Exclusion directe',
  RETARD:       'Retard',
  FORFAIT:      'Forfait',
  INDISCIPLINE: 'Indiscipline',
  AUTRE:        'Autre'
};

const RANG_LABELS: Record<number, string> = {
  1: '🥇 1er — Vainqueur',
  2: '🥈 2e — Finaliste',
  3: '🥉 3e place',
  4: '4e place'
};

@Component({
  selector:    'app-competition-recompenses-sanctions',
  standalone:  true,
  imports: [TranslateModule, CommonModule, FormsModule, MatIconModule],
  templateUrl: './competition-recompenses-sanctions.component.html',
  styleUrls:   ['./competition-recompenses-sanctions.component.scss']
})
export class CompetitionRecompensesSanctionsComponent implements OnInit {

  @Input() competitionId!: number;

  private api = inject(CompetitionApiService);
    @Input() canEdit      = false;

  // ── Onglet actif ──────────────────────────────────────────────
  activeTab = signal<'recompenses' | 'bareme' | 'sanctions'>('recompenses');

  // ── Récompenses ───────────────────────────────────────────────
  recompenses  = signal<Recompense[]>([]);
  /** Rangs de la compétition (1er, 2e…) : un rang peut avoir PLUSIEURS lots (trophée + médaille d'argent + dotation). */
  rangs        = computed(() => [...new Set(this.recompenses().filter(r => this.estEquipe(r)).map(r => r.rang))].sort((a, b) => a - b));
  individuels  = computed(() => this.recompenses().filter(r => !this.estEquipe(r)));
  materiaux: { v: Materiau; l: string }[] = [
    { v: 'OR', l: '🥇 Or' }, { v: 'ARGENT', l: '🥈 Argent' }, { v: 'BRONZE', l: '🥉 Bronze' }, { v: 'AUTRE', l: 'Autre' }
  ];
  ciblesIndividuelles = (Object.keys(CIBLE_LABELS) as Exclude<Cible, 'EQUIPE'>[]).map(v => ({ v, l: CIBLE_LABELS[v] }));
  estEquipe = (r: Recompense) => !r.cible || r.cible === 'EQUIPE';
  avecMateriau = (r: Recompense) => ['TROPHEE', 'MEDAILLE', 'COUPE'].includes(r.typeRecompense);
  /** Budget : somme des dotations financières (les médailles et trophées n'ont pas de montant). */
  budget = computed(() => {
    const m = (r: Recompense) => (r.typeRecompense === 'MONETAIRE' ? Number(r.montant) || 0 : 0);
    const l = this.recompenses();
    return { total: l.reduce((s, r) => s + m(r), 0), publie: l.filter(r => r.publique).reduce((s, r) => s + m(r), 0),
             interne: l.filter(r => !r.publique).reduce((s, r) => s + m(r), 0) };
  });
  lotsDuRang = (rang: number) => this.recompenses().filter(r => this.estEquipe(r) && r.rang === rang);
  savingR      = signal(false);

  // ── Barème ────────────────────────────────────────────────────
  bareme       = signal<BaremeSanction[]>([]);
  savingB      = signal(false);
  newBaremeItem: Partial<BaremeSanction> = { devise: 'FCFA' };
  showBaremeForm = signal(false);

  // ── Sanctions ─────────────────────────────────────────────────
  sanctions    = signal<SanctionResultDTO[]>([]);
  recapEquipes = signal<RecapEquipe[]>([]);
  vueRecap     = signal(true);      // true = recap / false = liste détaillée
  loadingS     = signal(false);
  actionMsg    = signal<string | null>(null);

  // Types constants exposés au template
  typesRecompense: TypeRecompense[] = ['MONETAIRE','TROPHEE','MEDAILLE','COUPE','AUTRE'];
  typesEvenement:  TypeEvenement[]  = [
    'CARTON_JAUNE','CARTON_ROUGE','EXCLUSION','RETARD','FORFAIT','INDISCIPLINE','AUTRE'
  ];

  typeRecompenseLabel  = (t: TypeRecompense) => TYPE_RECOMPENSE_LABELS[t];
  typeEvenementLabel   = (t: TypeEvenement)  => TYPE_EVENEMENT_LABELS[t];
  rangLabel            = (n: number) => RANG_LABELS[n] ?? `${n}e place`;

  ngOnInit(): void {
    this.loadAll();
  }

  private loadAll(): void {
    this.api.getRecompensesGestion(this.competitionId).subscribe({
      next: r => this.recompenses.set(r),
      error: () => {}
    });
    this.api.getBaremeSanctions(this.competitionId).subscribe({
      next: b => this.bareme.set(b),
      error: () => {}
    });
    this.loadSanctions();
  }

  private loadSanctions(): void {
    this.loadingS.set(true);
    this.api.getSanctions(this.competitionId).subscribe({
      next: s => { this.sanctions.set(s); this.loadingS.set(false); },
      error: () => this.loadingS.set(false)
    });
    this.api.getRecapSanctions(this.competitionId).subscribe({
      next: r => this.recapEquipes.set(r),
      error: () => {}
    });
  }

  // ── Récompenses : ajout / suppression ────────────────────────

  ajouterRang(): void {
    const existants = this.rangs();
    const newRang = existants.length ? Math.max(...existants) + 1 : 1;
    // pré-remplissage utile : 1er → trophée, 2e → médaille d'argent, 3e → médaille de bronze
    const modele: Partial<Recompense> = newRang === 1 ? { typeRecompense: 'TROPHEE', materiau: 'OR' }
      : newRang === 2 ? { typeRecompense: 'MEDAILLE', materiau: 'ARGENT' }
      : newRang === 3 ? { typeRecompense: 'MEDAILLE', materiau: 'BRONZE' } : { typeRecompense: 'MONETAIRE' };
    this.recompenses.update(list => [...list, {
      rang: newRang, label: RANG_LABELS[newRang] ?? `${newRang}e place`, devise: 'FCFA', cible: 'EQUIPE', publique: true,
      typeRecompense: 'MONETAIRE', ...modele
    }]);
  }

  /** Un lot de plus pour ce rang (ex. une dotation en plus du trophée). */
  ajouterLot(rang: number): void {
    const label = this.lotsDuRang(rang)[0]?.label ?? RANG_LABELS[rang] ?? `${rang}e place`;
    this.recompenses.update(list => [...list, { rang, label, typeRecompense: 'MONETAIRE', devise: 'FCFA', cible: 'EQUIPE', publique: true }]);
  }

  supprimerLot(lot: Recompense): void {
    this.recompenses.update(list => list.filter(r => r !== lot));
  }

  supprimerRang(rang: number): void {
    this.recompenses.update(list => list.filter(r => !(this.estEquipe(r) && r.rang === rang)));
  }

  /** L'intitulé du rang est partagé par tous ses lots. */
  renommerRang(rang: number, label: string): void {
    this.lotsDuRang(rang).forEach(r => r.label = label);
  }

  ajouterPrixIndividuel(): void {
    const pris = new Set(this.individuels().map(r => r.cible));
    const cible = (this.ciblesIndividuelles.find(c => !pris.has(c.v)) ?? this.ciblesIndividuelles[0]).v;
    this.recompenses.update(list => [...list, {
      rang: 100 + list.filter(r => !this.estEquipe(r)).length, label: CIBLE_LABELS[cible], typeRecompense: 'TROPHEE',
      materiau: null, devise: 'FCFA', cible, publique: false
    }]);
  }

  changerCible(r: Recompense): void {
    r.label = r.cible === 'AUTRE_PRIX' ? '' : (CIBLE_LABELS[r.cible as Exclude<Cible, 'EQUIPE'>] ?? r.label);
  }

  sauvegarderRecompenses(): void {
    this.savingR.set(true);
    this.api.saveRecompenses(this.competitionId, this.recompenses()).subscribe({
      next: r => {
        this.recompenses.set(r);
        this.savingR.set(false);
        this.actionMsg.set('Récompenses sauvegardées ✓');
        setTimeout(() => this.actionMsg.set(null), 3000);
      },
      error: () => this.savingR.set(false)
    });
  }

  // ── Barème : ajout d'un item ──────────────────────────────────

  ajouterBaremeItem(): void {
    if (!this.newBaremeItem.typeEvenement || !this.newBaremeItem.montant) return;
    this.savingB.set(true);
    this.api.saveBaremeItem(this.competitionId, this.newBaremeItem as BaremeSanction).subscribe({
      next: b => {
        // Remplacer ou ajouter dans la liste locale
        this.bareme.update(list => {
          const idx = list.findIndex(x => x.typeEvenement === b.typeEvenement);
          if (idx >= 0) { list[idx] = b; return [...list]; }
          return [...list, b];
        });
        this.newBaremeItem = { devise: 'FCFA' };
        this.showBaremeForm.set(false);
        this.savingB.set(false);
      },
      error: () => this.savingB.set(false)
    });
  }

  supprimerBaremeItem(item: BaremeSanction): void {
    if (!item.id) return;
    this.api.deleteBaremeItem(this.competitionId, item.id).subscribe({
      next: () => this.bareme.update(list => list.filter(x => x.id !== item.id)),
      error: () => {}
    });
  }

  // ── Sanctions : payer / dispenser ────────────────────────────

  marquerPayee(sanction: SanctionResultDTO): void {
    this.api.marquerSanctionPayee(this.competitionId, sanction.id).subscribe({
      next: s => {
        this.sanctions.update(list => list.map(x => x.id === s.id ? s : x));
        this.loadSanctions(); // refresh recap
      },
      error: () => {}
    });
  }

  dispenser(sanction: SanctionResultDTO): void {
    const motif = prompt('Motif de dispense (optionnel)') ?? undefined;
    this.api.dispenserSanction(this.competitionId, sanction.id, motif).subscribe({
      next: s => {
        this.sanctions.update(list => list.map(x => x.id === s.id ? s : x));
        this.loadSanctions();
      },
      error: () => {}
    });
  }

  statutClass(s: StatutSanction): string {
    return { EN_ATTENTE: 'badge--warning', PAYEE: 'badge--success', DISPENSEE: 'badge--neutral' }[s];
  }

  statutLabel(s: StatutSanction): string {
    return { EN_ATTENTE: 'En attente', PAYEE: t('membres.paid'), DISPENSEE: t('ui.ts_dispensee_50c7') }[s];
  }

  sanctionsEnAttente = computed(() =>
    this.sanctions().filter(s => s.statut === 'EN_ATTENTE'));
}