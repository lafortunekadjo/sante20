import { TranslateModule } from '@ngx-translate/core';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { toPng } from 'html-to-image';
import * as QRCode from 'qrcode';
import { AuthService, MonGroupeDTO } from '../../../core/services/auth.service';
import { ProfileService, PlayerProfile } from '../../../core/services/profile.service';
import { CompetitionApiService } from '../../../core/services/competition/competition-api.service';

type Portee = 'global' | 'un' | 'selection';
type Theme = 'nuit' | 'or' | 'terrain' | 'aurore';
type Format = 'carte' | 'story';

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

  /** Niveau : petit jeu de progression d'après l'activité (matchs, buts, passes, trophées). */
  niveau = computed(() => {
    const t = this.totaux();
    const pts = t.matchs * 2 + t.buts * 3 + t.passes * 2 + t.trophees * 25 + t.competitions * 5;
    const paliers = [
      { min: 0, nom: 'Recrue', icone: '🌱' }, { min: 20, nom: 'Titulaire', icone: '⚽' }, { min: 80, nom: 'Cadre', icone: '🔥' },
      { min: 200, nom: 'Pro', icone: '💎' }, { min: 450, nom: 'Légende', icone: '👑' }
    ];
    const idx = paliers.reduce((acc, p, i) => (pts >= p.min ? i : acc), 0);
    const cur = paliers[idx], next = paliers[idx + 1];
    return { ...cur, points: pts, prochain: next?.nom ?? null, progression: next ? Math.round(((pts - cur.min) / (next.min - cur.min)) * 100) : 100 };
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
      a.download = `carte-my2-0-${this.nomAffiche()}-${this.portee()}.png`;
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
