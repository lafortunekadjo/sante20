import { t } from '../../../../core/i18n/traduire';
import { TranslateModule } from '@ngx-translate/core';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { environment } from '../../../../environment';
import { RosterComponent } from '../roster/roster.component';
import { CompositionEquipeComponent } from '../composition-equipe/composition-equipe.component';
import { partagerLien, urlApplication } from '../../../../core/utils/partage';
import { AuthService } from '../../../../core/services/auth.service';

export interface EquipeEspace {
  participantId: number;
  competitionId: number;
  competitionNom?: string;
  statutCompetition?: string;
  nomEquipe: string;
  logoUrl?: string;
  statutInscription: string;
  groupeMy20: boolean;
  responsableNom?: string;
  responsableTel?: string;
  adjointNom?: string;
  nbJoueurs: number;
  nbStaff: number;
  nbFichesIncompletes: number;
  nbSansPhoto: number;
  photoRequise: boolean;
  effectifPret: boolean;
  effectifMin?: number | null;
  dateLimiteEffectif?: string | null;
  joursRestants?: number | null;
  sousMinimum?: boolean;
  enRetard?: boolean;
  roleAcces: 'PROMOTEUR' | 'RESPONSABLE' | 'ADJOINT' | 'LIEN';
  lienGestion?: string;
  motifRefus?: string | null;
  inscriptionsOuvertes?: boolean;
}

/**
 * Espace d'une équipe : avancement de l'effectif + gestion des joueurs.
 *  - /mes-equipes/:competitionId/:participantId : responsable, adjoint ou promoteur connectés ;
 *  - /equipe/:token : équipe gérée par son lien, SANS compte.
 * Le compte reste facultatif : un encart présente ses avantages sans jamais bloquer.
 */
@Component({
  selector: 'app-equipe-espace',
  standalone: true,
  imports: [TranslateModule, CommonModule, FormsModule, RouterLink, RosterComponent, CompositionEquipeComponent],
  templateUrl: './equipe-espace.component.html',
  styleUrls: ['./equipe-espace.component.scss']
})
export class EquipeEspaceComponent implements OnInit {
  private http  = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private auth  = inject(AuthService);

  get connecte(): boolean { return this.auth.isAuthenticated(); }

  /** Rattache l'équipe inscrite par lien au compte connecté : notifications et « Mes équipes ». */
  rattacher(): void {
    if (!this.token) return;
    this.http.post<EquipeEspace>(`${environment.apiUrl}/competitions/equipes/rattacher/${this.token}`, {}).subscribe({
      next: e => { this.espace.set(e); this.message.set('Équipe rattachée à votre compte. Retrouvez-la dans « Mes équipes ».'); },
      error: err => this.message.set(err?.error?.message ?? 'Rattachement impossible')
    });
  }

  token: string | null = null;
  espace  = signal<EquipeEspace | null>(null);
  erreur  = signal<string | null>(null);
  loading = signal(true);
  message = signal<string | null>(null);
  bandeauMasque = signal(this.lireBandeauMasque());
  emailAdjoint = '';

  /** Racine des appels « joueurs » : par lien, ou la gestion connectée (défaut du roster). */
  apiBase = computed(() => this.token ? `${environment.apiUrl}/public/equipe/${this.token}/joueurs` : undefined);

  /** Racine des appels « compositions » : par lien, ou par la gestion connectée. */
  apiCompo = computed(() => {
    const e = this.espace();
    if (this.token) return `${environment.apiUrl}/public/equipe/${this.token}`;
    return e ? `${environment.apiUrl}/competitions/${e.competitionId}/participants/${e.participantId}` : '';
  });

  /** Les compositions n'ont de sens qu'une fois l'équipe validée et le calendrier tiré. */
  afficheCompositions = computed(() => {
    const e = this.espace();
    return !!e && e.statutInscription === 'VALIDE' && !['BROUILLON', 'TERMINE', 'ANNULE'].includes(e.statutCompetition ?? '');
  });

  peutGerer = computed(() => {
    const e = this.espace();
    return !!e && e.statutCompetition !== 'TERMINE' && e.statutCompetition !== 'ANNULE';
  });
  peutPartagerLien = computed(() => ['PROMOTEUR', 'RESPONSABLE'].includes(this.espace()?.roleAcces ?? ''));
  estResponsable = computed(() => this.espace()?.roleAcces === 'RESPONSABLE' || this.espace()?.roleAcces === 'PROMOTEUR');
  sansCompte = computed(() => this.espace()?.roleAcces === 'LIEN');

  /** Pourcentage de joueurs dont la fiche est prête (complète, photo comprise). */
  progression = computed(() => {
    const e = this.espace();
    if (!e || e.nbJoueurs === 0) return 0;
    // un joueur à compléter ou sans photo compte une seule fois : on borne par le nombre de joueurs
    const bloques = Math.min(e.nbJoueurs, e.nbFichesIncompletes + e.nbSansPhoto);
    return Math.round(((e.nbJoueurs - bloques) / e.nbJoueurs) * 100);
  });

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token');
    this.charger();
  }

  charger(): void {
    const url = this.token
      ? `${environment.apiUrl}/public/equipe/${this.token}`
      : `${environment.apiUrl}/competitions/${this.route.snapshot.paramMap.get('competitionId')}`
        + `/participants/${this.route.snapshot.paramMap.get('participantId')}/espace`;
    this.http.get<EquipeEspace>(url).subscribe({
      next: e => { this.espace.set(e); this.loading.set(false); },
      error: err => {
        this.erreur.set(err?.error?.message ?? 'Équipe introuvable ou lien invalide.');
        this.loading.set(false);
      }
    });
  }

  /** Recharge seulement le tableau d'avancement (après un ajout, une photo...). */
  rafraichir(): void {
    const e = this.espace();
    if (!e) return;
    const url = this.token
      ? `${environment.apiUrl}/public/equipe/${this.token}`
      : `${environment.apiUrl}/competitions/${e.competitionId}/participants/${e.participantId}/espace`;
    this.http.get<EquipeEspace>(url).subscribe({ next: x => this.espace.set(x) });
  }

  /** Une équipe refusée peut corriger son dossier puis repostuler (inscriptions encore ouvertes). */
  repostuler(): void {
    if (!this.espace()) return;
    this.http.post<EquipeEspace>(`${this.apiCompo()}/repostuler`, {}).subscribe({
      next: e => { this.espace.set(e); this.message.set('Votre demande a été renvoyée à l\'organisateur.'); },
      error: err => this.message.set(err?.error?.message ?? 'Impossible de repostuler pour le moment')
    });
  }

  statutLabel(): string {
    switch (this.espace()?.statutInscription) {
      case 'EN_ATTENTE': return 'En attente de validation par l\'organisateur';
      case 'VALIDE': return 'Inscription validée';
      case 'REJETE': return 'Inscription refusée';
      default: return this.espace()?.statutInscription ?? '';
    }
  }

  // ── Lien de gestion (équipes sans compte, ou délégation) ──
  async partagerAcces(): Promise<void> {
    const e = this.espace();
    if (!e) return;
    const jeton = await this.jetonGestion(e, false);
    if (!jeton) return;
    const texte = `Gérez l'effectif de ${e.nomEquipe} (${e.competitionNom ?? 'compétition'}) : `;
    const moyen = await partagerLien('Gestion de mon équipe', texte, urlApplication(`/equipe/${jeton}`));
    if (moyen === 'copie') this.message.set('Lien copié : collez-le dans un message.');
  }

  async regenerer(): Promise<void> {
    const e = this.espace();
    if (!e || !confirm(t('ui.ts_generer_un_nouveau_lien_l_ancien_090e'))) return;
    const jeton = await this.jetonGestion(e, true);
    if (jeton) this.message.set('Nouveau lien créé. L\'ancien ne fonctionne plus.');
  }

  private jetonGestion(e: EquipeEspace, regenerer: boolean): Promise<string | null> {
    const base = `${environment.apiUrl}/competitions/${e.competitionId}/participants/${e.participantId}/lien-gestion`;
    const requete = regenerer
      ? this.http.post<{ token: string }>(`${base}/regenerer`, {})
      : this.http.get<{ token: string }>(base);
    return new Promise(resolve => requete.subscribe({
      next: r => resolve(r.token),
      error: err => { this.message.set(err?.error?.message ?? 'Lien indisponible'); resolve(null); }
    }));
  }

  // ── Adjoint ───────────────────────────────────────────────
  definirAdjoint(retirer = false): void {
    const e = this.espace();
    if (!e) return;
    this.http.put<EquipeEspace>(
      `${environment.apiUrl}/competitions/${e.competitionId}/participants/${e.participantId}/adjoint`,
      { email: retirer ? '' : this.emailAdjoint.trim() }
    ).subscribe({
      next: x => { this.espace.set(x); this.emailAdjoint = ''; this.message.set(retirer ? 'Adjoint retiré.' : 'Adjoint ajouté.'); },
      error: err => this.message.set(err?.error?.message ?? 'Impossible de définir l\'adjoint')
    });
  }

  // ── Bandeau « compte facultatif » ─────────────────────────
  masquerBandeau(): void {
    try { localStorage.setItem('bandeau_compte_equipe', '1'); } catch { /* stockage indisponible */ }
    this.bandeauMasque.set(true);
  }

  private lireBandeauMasque(): boolean {
    try { return localStorage.getItem('bandeau_compte_equipe') === '1'; } catch { return false; }
  }
}
