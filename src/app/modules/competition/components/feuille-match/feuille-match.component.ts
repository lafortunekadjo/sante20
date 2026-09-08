import {
  Component, Input, OnInit, inject, signal
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatchApiService } from '../../../../core/services/competition/match-api.service';

interface LigneJoueur {
  compositionId:    number;
  numeroDos?:       number;
  nom:              string;
  prenom?:          string;
  poste?:           string;
  statut:           string;
  capitaine:        boolean;
  gardienTitulaire: boolean;
  buts:             string[];
  passesDecisives:  string[];
  cartons:          string[];
  remplacements:    string[];
  note?:            number;
}

interface EquipeFeuille {
  nomEquipe:     string;
  logoUrl?:      string;
  titulaires:    LigneJoueur[];
  remplacants:   LigneJoueur[];
  staff:         LigneJoueur[];   // ← entraîneur etc.
  nbButs:        number;
  nbCartonJaune: number;
  nbCartonRouge: number;
}

interface OfficielFeuille {
  nom:          string;
  prenom?:      string;
  typeLabel:    string;
  licenceNumero?:string;
}

interface EvenementFeuille {
  minute:        string;
  emoji:         string;
  joueurNom:     string;
  passeurNom?:   string;
  equipeNom:     string;
  coteExterieur: boolean;
}

interface FeuilleMatchDTO {
  matchId:            number;
  competition:        string;
  phase?:             string;
  journee?:           string;
  dateHeure:          string;
  stade?:             string;
  lieu?:              string;
  statut:             string;
  valideeParNom?:     string;
  valideeAt?:         string;
  observations?:      string;
  domicile:           EquipeFeuille;
  exterieur:          EquipeFeuille;
  butsDomicile?:      number;
  butsExterieur?:     number;
  butsDomicileProlong?:  number;
  butsExterieurProlong?: number;
  tabDomicile?:       number;
  tabExterieur?:      number;
  officiels:          OfficielFeuille[];
  evenements:         EvenementFeuille[];
  typeCompetition: string;
}

@Component({
  selector:    'app-feuille-match',
  standalone:  true,
  imports:     [CommonModule, FormsModule, MatIconModule, DatePipe],
  templateUrl: './feuille-match.component.html',
  styleUrls:   ['./feuille-match.component.scss']
})
export class FeuilleMatchComponent implements OnInit {
  @Input() competitionId!: number;
  @Input() matchId!:       number;
  @Input() canValider  = false; // permission VALIDER_FEUILLES
  @Input() canCloturer = false; // permission SAISIR_SCORES

  private api = inject(MatchApiService);

  feuille      = signal<FeuilleMatchDTO | null>(null);
  loading      = signal(true);
  saving       = signal(false);
  observations = '';
  showObsForm  = signal(false);
  modePDF      = signal<'complet' | 'resume'>('complet');

  Math = Math;

  // ── Notes joueurs ─────────────────────────────────────
  notes        = signal<Record<number, number>>({}); // compositionId → note
  savingNotes  = signal(false);
  showNotes    = signal(false);

  ngOnInit(): void {
    this.charger();
    this.chargerNotes();
  }

  chargerNotes(): void {
    this.api.getNotes(this.competitionId, this.matchId).subscribe({
      next: (ns: any[]) => {
        const map: Record<number, number> = {};
        ns.forEach(n => { map[n.compositionId] = n.note; });
        this.notes.set(map);
      }
    });
  }

  getNote(compositionId: number): number | null {
    return this.notes()[compositionId] ?? null;
  }

  setNote(compositionId: number, note: number): void {
    this.notes.update(n => ({ ...n, [compositionId]: note }));
  }

  sauvegarderNotes(): void {
    this.savingNotes.set(true);
    const notes = Object.entries(this.notes()).map(([id, note]) => ({
      compositionId: Number(id),
      note
    }));
    this.api.saisirNotes(this.competitionId, this.matchId, { notes })
      .subscribe({
        next: () => { this.savingNotes.set(false); this.charger(); },
        error: () => this.savingNotes.set(false)
      });
  }

  charger(): void {
    this.loading.set(true);
    this.api.getFeuille(this.competitionId, this.matchId).subscribe({
      next: f => { this.feuille.set(f); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  // ── Statut ────────────────────────────────────────────────
  isValidee():   boolean { return this.feuille()?.statut === 'VALIDEE'; }
  isCloturee():  boolean { return this.feuille()?.statut === 'CLOTUREE'; }
  isBrouillon(): boolean { return this.feuille()?.statut === 'BROUILLON'; }

  statutLabel(): string {
    const m: Record<string, string> = {
      BROUILLON: 'Brouillon',
      VALIDEE:   'Validée ✅',
      CLOTUREE:  'Clôturée 🔒',
    };
    return m[this.feuille()?.statut ?? ''] ?? '';
  }

  // ── Valider ───────────────────────────────────────────────
  valider(): void {
    this.saving.set(true);
    this.api.validerFeuille(this.competitionId, this.matchId, this.observations)
      .subscribe({
        next: () => { this.charger(); this.showObsForm.set(false); this.saving.set(false); },
        error: () => this.saving.set(false)
      });
  }

  // ── Score affiché ─────────────────────────────────────────
  scoreLabel(): string {
    const f = this.feuille();
    if (!f || f.butsDomicile == null) return '– : –';
    let s = `${f.butsDomicile} : ${f.butsExterieur}`;
    if (f.butsDomicileProlong != null)
      s += ` (${f.butsDomicileProlong} : ${f.butsExterieurProlong} ap)`;
    if (f.tabDomicile != null)
      s += ` [${f.tabDomicile} : ${f.tabExterieur} tab]`;
    return s;
  }

  // ── Téléchargement PDF via le service ────────────────────
  telechargerAvant(): void {
    this.api.telechargerFeuillePdf(this.competitionId, this.matchId, 'avant')
      .subscribe(blob => this.ouvrirBlob(blob, `feuille-match-${this.matchId}.pdf`));
  }

  telechargerRapport(): void {
    this.api.telechargerFeuillePdf(this.competitionId, this.matchId, 'rapport')
      .subscribe(blob => this.ouvrirBlob(blob, `rapport-match-${this.matchId}.pdf`));
  }

  private ouvrirBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  imprimer(): void { window.print(); }

  // ── Helpers ───────────────────────────────────────────────
  getInitials(nom: string): string {
    return (nom ?? '').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  }

  posteAbbr(poste?: string): string {
    const m: Record<string, string> = {
      GARDIEN: 'G', DEFENSEUR: 'D', MILIEU: 'M', ATTAQUANT: 'A'
    };
    return m[poste ?? ''] ?? '';
  }

  // Générer des lignes vides pour atteindre 16 lignes minimum
  getLignesVides(equipe: EquipeFeuille): number[] {
    const total = (equipe.titulaires?.length ?? 0)
                + (equipe.remplacants?.length ?? 0);
    const min = 16;
    const manque = Math.max(0, min - total);
    return Array.from({ length: manque }, (_, i) => i);
  }


}