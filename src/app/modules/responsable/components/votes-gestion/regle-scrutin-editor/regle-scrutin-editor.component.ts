import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import {
  CRITERES_DEPARTAGE, CRITERES_HISTORIQUE, CritereDepartage, Departage, ModeEligibilite, ModeNomines, RegleScrutin, TypeScrutin
} from '../../../../../core/services/scrutin.service';

/**
 * Éditeur des règles d'un vote : qui vote, qui est élu, nominés, voix, poids stats / votes, points par action,
 * minimum de votes et critères de départage (choisis et ordonnés). Modifie directement l'objet `regles` reçu.
 * Utilisé à la création d'un vote et pour les règles par défaut du groupe.
 */
@Component({
  selector: 'app-regle-scrutin-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslateModule],
  templateUrl: './regle-scrutin-editor.component.html',
  styleUrl: './regle-scrutin-editor.component.scss'
})
export class RegleScrutinEditorComponent {
  @Input({ required: true }) regles!: RegleScrutin;
  @Input({ required: true }) type!: TypeScrutin;
  /** Préfixe des noms de champs : évite les doublons quand plusieurs éditeurs sont affichés ensemble. */
  @Input() prefixe = 'r';

  readonly modesEligibilite: ModeEligibilite[] = ['TOUS', 'PRESENCE_MIN', 'PRESENTS_AU_MATCH', 'JOUEURS_DU_MATCH'];
  readonly modesNomines: ModeNomines[] = ['AUTO_TOP_N', 'TOUS_ELIGIBLES', 'MANUEL'];
  readonly modesDepartage: Departage[] = ['HIERARCHIE', 'AUCUN'];

  /** Les deux poids font toujours 100. */
  changerPoidsStats(valeur: number): void {
    const v = Math.min(100, Math.max(0, Math.round(Number(valeur) || 0)));
    this.regles.poidsStats = v;
    this.regles.poidsVotes = 100 - v;
  }

  /** Les points par action ne servent que si les stats comptent dans le score (le fair-play a son propre barème). */
  get besoinPoints(): boolean { return this.regles.poidsStats > 0 && this.type !== 'FAIR_PLAY_MOIS'; }
  get besoinPresenceVotants(): boolean { return this.regles.votants === 'PRESENCE_MIN'; }
  get besoinPresenceCandidats(): boolean { return this.regles.candidats === 'PRESENCE_MIN'; }

  /** Les modes liés à un match n'ont de sens que pour le MVP du match. */
  modesDisponibles(): ModeEligibilite[] {
    return this.type === 'MVP_MATCH'
      ? this.modesEligibilite
      : this.modesEligibilite.filter(m => m === 'TOUS' || m === 'PRESENCE_MIN');
  }

  // ── Critères de départage ───────────────────────────────
  get criteresChoisis(): CritereDepartage[] { return this.regles.criteresDepartage ?? []; }
  get criteresDisponibles(): CritereDepartage[] { return CRITERES_DEPARTAGE.filter(c => !this.criteresChoisis.includes(c)); }

  ajouterCritere(c: CritereDepartage): void {
    this.regles.criteresDepartage = [...this.criteresChoisis, c];
  }

  retirerCritere(c: CritereDepartage): void {
    this.regles.criteresDepartage = this.criteresChoisis.filter(x => x !== c);
  }

  deplacer(index: number, sens: -1 | 1): void {
    const liste = [...this.criteresChoisis];
    const cible = index + sens;
    if (cible < 0 || cible >= liste.length) return;
    [liste[index], liste[cible]] = [liste[cible], liste[index]];
    this.regles.criteresDepartage = liste;
  }

  ordreHistorique(): void {
    this.regles.criteresDepartage = [...CRITERES_HISTORIQUE];
  }
}
