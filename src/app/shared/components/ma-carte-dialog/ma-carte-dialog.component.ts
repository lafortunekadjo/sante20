import { TranslateModule } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environment';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { toPng } from 'html-to-image';
import * as QRCode from 'qrcode';
import { AuthService, MonGroupeDTO } from '../../../core/services/auth.service';
import { ProfileService, PlayerProfile, SaisonStats } from '../../../core/services/profile.service';
import { CompetitionApiService } from '../../../core/services/competition/competition-api.service';

type Portee = 'global' | 'un' | 'selection';
type Theme = 'nuit' | 'or' | 'terrain' | 'aurore';
type Format = 'carte' | 'story';
/** Période de la carte : tout le parcours, la saison en cours, la précédente, ou des saisons choisies à la main. */
type Periode = 'tout' | 'courante' | 'precedente' | 'choix';

interface Totaux { matchs: number; buts: number; passes: number; competitions: number; trophees: number; }

/**
 * « Ma carte My2-0 » : carte de joueur à télécharger (PNG) et à partager.
 *   • portée : tout mon parcours (tous mes 2-0 + compétitions), un seul 2-0, ou une sélection de 2-0 ;
 *   • 4 thèmes, 2 formats (carte paysage, story verticale) ;
 *   • QR code vers le profil public, niveau calculé d'après les statistiques.
 */
@Component({
  selector: 'app-ma-carte-dialog',
  standalone: true,
  imports: [TranslateModule, CommonModule, MatDialogModule, MatIconModule],
  templateUrl: './ma-carte-dialog.component.html',
  styleUrls: ['./ma-carte-dialog.component.scss']
})
export class MaCarteDialogComponent implements OnInit {
  private auth = inject(AuthService);
  private profileApi = inject(ProfileService);
  private compApi = inject(CompetitionApiService);
  private ref = inject(MatDialogRef<MaCarteDialogComponent>);
  private http = inject(HttpClient);

  chargement = signal(true);
  erreur = signal<string | null>(null);
  export = signal(false);

  profil = signal<PlayerProfile | null>(null);
  groupes = signal<MonGroupeDTO[]>([]);
  compStats = signal<any>(null);
  photo = signal<string | null>(null);
  logos = signal<Record<number, string | null>>({});
  qr = signal<string>('');

  portee = signal<Portee>('global');
  groupeUn = signal<number | null>(null);
  selection = signal<Set<number>>(new Set());
  theme = signal<Theme>('nuit');
  format = signal<Format>('carte');
  periode = signal<Periode>('tout');
  /** Saisons cochées (clé « club|exercice ») quand la période est « choix ». */
  saisonsChoisies = signal<Set<string>>(new Set());

  themes: { v: Theme; l: string }[] = [
    { v: 'nuit', l: 'Nuit' }, { v: 'or', l: 'Or' }, { v: 'terrain', l: 'Terrain' }, { v: 'aurore', l: 'Aurore' }
  ];

  /** Groupes pris en compte selon la portée choisie. */
  groupesCarte = computed(() => {
    const tous = this.groupes();
    switch (this.portee()) {
      case 'un': return tous.filter(g => g.groupeId === this.groupeUn());
      case 'selection': return tous.filter(g => this.selection().has(g.groupeId));
      default: return tous;
    }
  });

  totaux = computed<Totaux>(() => {
    const p = this.profil();
    const t: Totaux = { matchs: 0, buts: 0, passes: 0, competitions: 0, trophees: 0 };
    if (!p) return t;
    // Une période de saison : on additionne les saisons retenues. Les compétitions et trophées ne sont pas rattachés à une saison de club.
    if (this.periode() !== 'tout') {
      for (const s of this.saisonsRetenues()) { t.matchs += s.matchsJoues ?? 0; t.buts += s.buts ?? 0; t.passes += s.passes ?? 0; }
      return t;
    }
    const cs = this.compStats();
    if (this.portee() === 'global') {
      t.matchs = p.totalMatchsJoues ?? 0; t.buts = p.totalButsGlobal ?? 0; t.passes = p.totalPassesGlobal ?? 0;
      t.competitions = cs?.global?.competitionsCount ?? 0; t.trophees = cs?.global?.awardsCount ?? 0;
      return t;
    }
    // portée restreinte : on additionne l'historique des clubs choisis (par nom) et les compétitions jouées sous ce nom d'équipe
    const noms = new Set(this.groupesCarte().map(g => (g.nom ?? '').trim().toLowerCase()));
    for (const h of p.historiqueClubs ?? []) {
      if (noms.has((h.clubNom ?? '').trim().toLowerCase())) { t.matchs += h.matchsJoues ?? 0; t.buts += h.buts ?? 0; t.passes += h.passes ?? 0; }
    }
    for (const c of cs?.competitions ?? []) {
      if (noms.has((c.equipeNom ?? '').trim().toLowerCase())) t.competitions++;
    }
    return t;
  });

  /** Niveau officiel de la Ligue des Légendes (le même que sur le profil et la page Ligue). */
  niveauLigue = signal<{ titre: string; xpTotal: number; progression: number; prochainTitre?: string | null; niveauMax: boolean } | null>(null);
  niveau = computed(() => {
    const n = this.niveauLigue();
    return n ?? { titre: '', xpTotal: 0, progression: 0, prochainTitre: null, niveauMax: false };
  });

  numero = computed(() => 'M2-' + String(this.profil()?.userId ?? this.profil()?.id ?? 0).padStart(6, '0'));
  nomAffiche = computed(() => this.profil()?.username ?? this.auth.getUsername() ?? '');
  titreCarte = computed(() => {
    const g = this.groupesCarte();
    if (this.portee() === 'global') return g.length > 1 ? `Joueur de ${g.length} clubs` : 'Joueur My2-0';
    return g.length === 1 ? g[0].nom : `${g.length} clubs My2-0`;
  });
  roleUn = computed(() => (this.portee() === 'un' && this.groupesCarte()[0]?.roleInGroupe) || '');
  maxLogos = computed(() => (this.format() === 'story' ? 8 : 6));

  // ── Saisons : chaque 2-0 a ses propres dates d'exercice (début et fin de saison), donc ses propres saisons ───────
  cle(s: SaisonStats): string { return (s.clubNom ?? '') + '|' + s.exerciceId; }

  private nom(v?: string | null): string { return (v ?? '').trim().toLowerCase(); }

  /** Saisons de mes clubs (hors « hors saison ») dans la portée choisie, de la plus récente à la plus ancienne. */
  saisonsDansLaPortee = computed<SaisonStats[]>(() => {
    const noms = new Set(this.groupesCarte().map(g => this.nom(g.nom)));
    return (this.profil()?.historiqueSaisons ?? [])
      .filter(s => s.exerciceId !== -1 && !!s.dateDebut && !!s.dateFin)
      .filter(s => this.portee() === 'global' || noms.has(this.nom(s.clubNom)))
      .sort((a, b) => String(b.dateDebut).localeCompare(String(a.dateDebut)));
  });

  /** Saisons prises en compte selon la période : pour chaque club, sa saison en cours, sa dernière saison terminée, ou mon choix. */
  saisonsRetenues = computed<SaisonStats[]>(() => {
    const periode = this.periode();
    if (periode === 'tout') return [];
    const toutes = this.saisonsDansLaPortee();
    if (periode === 'choix') return toutes.filter(s => this.saisonsChoisies().has(this.cle(s)));
    const aujourdhui = new Date().toISOString().substring(0, 10);
    const parClub = new Map<string, SaisonStats[]>();
    for (const s of toutes) {
      const k = this.nom(s.clubNom);
      parClub.set(k, [...(parClub.get(k) ?? []), s]);
    }
    const retenues: SaisonStats[] = [];
    for (const saisons of parClub.values()) {
      if (periode === 'courante') {
        retenues.push(...saisons.filter(s => String(s.dateDebut).substring(0, 10) <= aujourdhui && aujourdhui <= String(s.dateFin).substring(0, 10)));
      } else {
        const finies = saisons.filter(s => String(s.dateFin).substring(0, 10) < aujourdhui);
        if (finies.length) retenues.push(finies.reduce((a, b) => (String(a.dateFin) >= String(b.dateFin) ? a : b)));
      }
    }
    return retenues;
  });

  /** Libellé de la période, imprimé sur la carte (ex. « Exercice 2026 »). Vide pour tout le parcours. */
  saisonsLibelle = computed(() => {
    const noms = [...new Set(this.saisonsRetenues().map(s => s.exerciceLibelle).filter(Boolean))];
    return noms.length > 2 ? noms.slice(0, 2).join(' + ') + ' +' + (noms.length - 2) : noms.join(' + ');
  });

  aucuneSaison = computed(() => this.periode() !== 'tout' && this.saisonsRetenues().length === 0);

  basculerSaison(s: SaisonStats): void {
    const set = new Set(this.saisonsChoisies());
    const k = this.cle(s);
    if (set.has(k)) set.delete(k); else set.add(k);
    this.saisonsChoisies.set(set);
  }

  ngOnInit(): void {
    const username = this.auth.getUsername() ?? '';
    const groupes = (this.auth.getMesGroupesCache() ?? []).filter(g => g.actif !== false);
    this.groupes.set(groupes);
    this.groupeUn.set(groupes[0]?.groupeId ?? null);
    this.selection.set(new Set(groupes.map(g => g.groupeId)));

    this.profileApi.getProfileByUsername(username).subscribe({
      next: async p => {
        this.profil.set(p);
        this.chargement.set(false);
        this.photo.set(await this.enDataUrl(p.profilePhotoUrl));
        const logos: Record<number, string | null> = {};
        await Promise.all(groupes.map(async g => { logos[g.groupeId] = await this.enDataUrl(g.profilePhotoUrl); }));
        this.logos.set(logos);
        this.qr.set(await QRCode.toDataURL(`${window.location.origin}/p/${encodeURIComponent(username)}`,
          { margin: 1, width: 220, color: { dark: '#0b1d4d', light: '#ffffff' } }));
      },
      error: () => { this.erreur.set('Impossible de charger votre profil.'); this.chargement.set(false); }
    });
    this.http.get<any>(`${environment.apiUrl}/profiles/${encodeURIComponent(username)}/niveau`).subscribe({
      next: r => this.niveauLigue.set(r?.niveau ?? null), error: () => {}
    });
    this.compApi.getMesStatsCompetitions().subscribe({ next: s => this.compStats.set(s), error: () => {} });
  }

  // ── choix ────────────────────────────────────────────────────
  basculer(id: number): void {
    const s = new Set(this.selection());
    if (s.has(id)) s.delete(id); else s.add(id);
    this.selection.set(s);
  }

  // ── export ───────────────────────────────────────────────────
  private png(noeud: HTMLElement): Promise<string> {
    return toPng(noeud, { pixelRatio: 2, cacheBust: true, style: { transform: 'none' } });
  }

  async telecharger(noeud: HTMLElement): Promise<void> {
    this.export.set(true);
    try {
      const a = document.createElement('a');
      a.href = await this.png(noeud);
      a.download = `carte-my2-0-${this.nomAffiche()}-${this.portee()}${this.periode() === 'tout' ? '' : '-' + this.periode()}.png`;
      a.click();
    } catch {
      this.erreur.set('Le téléchargement a échoué. Réessayez.');
    } finally {
      this.export.set(false);
    }
  }

  async partager(noeud: HTMLElement): Promise<void> {
    this.export.set(true);
    try {
      const blob = await (await fetch(await this.png(noeud))).blob();
      const fichier = new File([blob], 'carte-my2-0.png', { type: 'image/png' });
      const nav: any = navigator;
      if (nav.canShare?.({ files: [fichier] })) await nav.share({ files: [fichier], title: 'Ma carte My2-0' });
      else await this.telecharger(noeud);
    } catch { /* partage annulé */ } finally { this.export.set(false); }
  }

  fermer(): void { this.ref.close(); }

  initiales(): string { return (this.nomAffiche() ?? '?').slice(0, 2).toUpperCase(); }

  /** Les images distantes sont converties en data-URL : sans cela l'export PNG échoue sur les images d'un autre domaine. */
  private async enDataUrl(url?: string | null): Promise<string | null> {
    if (!url) return null;
    try {
      const r = await fetch(url, { mode: 'cors', cache: 'force-cache' });
      if (!r.ok) return null;
      const b = await r.blob();
      return await new Promise<string>((ok, ko) => { const f = new FileReader(); f.onload = () => ok(f.result as string); f.onerror = ko; f.readAsDataURL(b); });
    } catch { return null; }
  }
}
