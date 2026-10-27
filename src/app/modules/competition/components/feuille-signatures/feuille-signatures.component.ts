import { TranslateModule } from '@ngx-translate/core';
import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';

export interface LigneSignature {
  role: string;
  libelle: string;
  obligatoire: boolean;
  attendu?: string;
  statut: 'EN_ATTENTE' | 'SIGNEE' | 'OBSOLETE';
  signataireNom?: string;
  mode?: 'TRACE' | 'CERTIFIE';
  reserve?: string;
  signeLe?: string;
  image?: string;
}

export interface EtatSignatures {
  matchId: number;
  signable: boolean;
  verrouillee: boolean;
  verrouilleeAt?: string;
  codeVerification?: string;
  empreinte: string;
  complete: boolean;
  lignes: LigneSignature[];
  mesRoles: string[];
}

/**
 * Signature électronique de la feuille de match : liste des signataires, panneau de signature (tracé au doigt
 * ou « Je certifie »), réouverture par le promoteur. `base` est l'adresse de l'état des signatures ; la signature
 * est postée à la même adresse.
 */
@Component({
  selector: 'app-feuille-signatures',
  standalone: true,
  imports: [TranslateModule, CommonModule, FormsModule, RouterLink],
  template: `
  <section class="sg">
    <h3 class="sg__titre">{{ 'feuilleSignature.titre' | translate }}</h3>

    @if (etat(); as e) {
      @if (!e.signable) {
        <p class="sg__aide">{{ 'feuilleSignature.pasTermine' | translate }}</p>
      } @else {
        <p class="sg__aide">{{ 'feuilleSignature.aide' | translate }}</p>

        @if (e.verrouillee) {
          <div class="sg__verrou">🔒 {{ 'feuilleSignature.verrouillee' | translate }} · {{ e.verrouilleeAt }}</div>
        }

        <ul class="sg__liste">
          @for (l of e.lignes; track l.role) {
            <li class="sg__ligne" [class.sg__ligne--ok]="l.statut === 'SIGNEE'" [class.sg__ligne--obsolete]="l.statut === 'OBSOLETE'">
              <div class="sg__haut">
                <strong>{{ l.libelle }}</strong>
                <span class="sg__badge">
                  {{ (l.obligatoire ? 'feuilleSignature.obligatoire' : 'feuilleSignature.facultatif') | translate }}
                </span>
                <span class="sg__etat sg__etat--{{ l.statut }}">{{ 'feuilleSignature.statut.' + l.statut | translate }}</span>
              </div>
              @if (l.attendu && l.statut === 'EN_ATTENTE') { <small>{{ l.attendu }}</small> }
              @if (l.statut !== 'EN_ATTENTE') {
                <small>{{ l.signataireNom }} · {{ l.signeLe }}
                  · {{ (l.mode === 'TRACE' ? 'feuilleSignature.modeTrace' : 'feuilleSignature.modeCertifie') | translate }}</small>
                @if (l.image && l.statut === 'SIGNEE') { <img class="sg__image" [src]="l.image" alt=""/> }
                @if (l.reserve) { <small class="sg__reserve">{{ 'feuilleSignature.reserve' | translate }} : {{ l.reserve }}</small> }
              }
              @if (l.statut === 'OBSOLETE') { <small class="sg__alerte">{{ 'feuilleSignature.obsoleteAide' | translate }}</small> }
            </li>
          }
        </ul>

        @if (e.mesRoles.length) {
          <div class="sg__panneau">
            <strong>{{ 'feuilleSignature.signer' | translate }}</strong>
            @if (e.mesRoles.length > 1) {
              <select [(ngModel)]="role" class="sg__champ">
                @for (r of e.mesRoles; track r) { <option [value]="r">{{ libelle(r) }}</option> }
              </select>
            }
            @if (demanderNom) {
              <input class="sg__champ" [(ngModel)]="nom" [placeholder]="'feuilleSignature.nom' | translate" maxlength="150"/>
            }
            <div class="sg__modes">
              <button type="button" class="sg__mode" [class.sg__mode--actif]="mode() === 'TRACE'" (click)="mode.set('TRACE')">
                ✍️ {{ 'feuilleSignature.modeTrace' | translate }}
              </button>
              <button type="button" class="sg__mode" [class.sg__mode--actif]="mode() === 'CERTIFIE'" (click)="mode.set('CERTIFIE')">
                ✔ {{ 'feuilleSignature.modeCertifie' | translate }}
              </button>
            </div>

            @if (mode() === 'TRACE') {
              <canvas #pad class="sg__pad" width="600" height="220"
                      (pointerdown)="debut($event)" (pointermove)="trace($event)"
                      (pointerup)="fin()" (pointerleave)="fin()" (pointercancel)="fin()"></canvas>
              <button type="button" class="sg__lien" (click)="effacer()">{{ 'feuilleSignature.effacer' | translate }}</button>
            } @else {
              <label class="sg__certif">
                <input type="checkbox" [(ngModel)]="certifie"/>
                <span>{{ 'feuilleSignature.certifieTexte' | translate }}</span>
              </label>
            }

            <textarea class="sg__champ" rows="2" maxlength="500" [(ngModel)]="reserve"
                      [placeholder]="'feuilleSignature.reservePlaceholder' | translate"></textarea>

            @if (erreur()) { <p class="sg__erreur">{{ erreur() }}</p> }
            <button type="button" class="sg__bouton" [disabled]="!peutEnvoyer() || envoi()" (click)="signer()">
              {{ 'feuilleSignature.valider' | translate }}
            </button>
          </div>
        }

        @if (e.codeVerification) {
          <p class="sg__aide">
            {{ 'feuilleSignature.code' | translate }} <strong>{{ e.codeVerification }}</strong> ·
            <a [routerLink]="['/verifier', e.codeVerification]">{{ 'feuilleSignature.verifier' | translate }}</a>
          </p>
        }

        @if (canRouvrir && e.verrouillee) {
          <div class="sg__panneau">
            <strong>{{ 'feuilleSignature.rouvrirTitre' | translate }}</strong>
            <textarea class="sg__champ" rows="2" maxlength="250" [(ngModel)]="motif"
                      [placeholder]="'feuilleSignature.motifPlaceholder' | translate"></textarea>
            <button type="button" class="sg__bouton sg__bouton--danger" [disabled]="motif.trim().length < 5 || envoi()" (click)="rouvrir()">
              {{ 'feuilleSignature.rouvrir' | translate }}
            </button>
          </div>
        }
      }
    } @else if (chargement()) {
      <p class="sg__aide">…</p>
    } @else {
      <p class="sg__aide">{{ 'feuilleSignature.indisponible' | translate }}</p>
    }
  </section>
  `,
  styles: [`
    .sg { display: flex; flex-direction: column; gap: 10px; padding: 14px; border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 14px; background: var(--background-primary); }
    .sg__titre { margin: 0; font-size: 16px; }
    .sg__aide { margin: 0; font-size: 13px; color: var(--text-secondary); line-height: 1.5; }
    .sg__verrou { padding: 8px 10px; border-radius: 10px; background: rgba(21,128,61,.12); color: #15803d; font-weight: 600; font-size: 13px; }
    .sg__liste { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
    .sg__ligne { display: flex; flex-direction: column; gap: 3px; padding: 10px 12px; border: 1px solid var(--border-color, #e2e8f0);
                 border-radius: 12px; small { color: var(--text-secondary); font-size: 12.5px; } }
    .sg__ligne--ok { border-color: #15803d; }
    .sg__ligne--obsolete { border-color: #b91c1c; }
    .sg__haut { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
    .sg__badge { font-size: 11px; padding: 1px 8px; border-radius: 999px; background: var(--background-secondary); color: var(--text-secondary); }
    .sg__etat { margin-left: auto; font-size: 12px; font-weight: 700; }
    .sg__etat--SIGNEE { color: #15803d; }
    .sg__etat--OBSOLETE { color: #b91c1c; }
    .sg__etat--EN_ATTENTE { color: var(--text-secondary); }
    .sg__image { max-height: 56px; max-width: 220px; align-self: flex-start; background: #fff; border-radius: 6px; }
    .sg__alerte { color: #b91c1c !important; }
    .sg__panneau { display: flex; flex-direction: column; gap: 8px; padding: 12px; border-radius: 12px; background: var(--background-secondary); }
    .sg__champ { width: 100%; box-sizing: border-box; padding: 8px 10px; border-radius: 10px; border: 1px solid var(--border-color, #cbd5e1);
                 background: var(--background-primary); color: var(--text-primary); font: inherit; }
    .sg__modes { display: flex; gap: 8px; }
    .sg__mode { flex: 1; padding: 8px; border-radius: 10px; border: 1px solid var(--border-color, #cbd5e1); background: var(--background-primary);
                color: var(--text-primary); cursor: pointer; font: inherit; }
    .sg__mode--actif { border-color: #1d4ed8; background: rgba(29,78,216,.1); font-weight: 700; }
    .sg__pad { width: 100%; height: 130px; border: 1px dashed #64748b; border-radius: 12px; background: #fff; touch-action: none; cursor: crosshair; }
    .sg__lien { align-self: flex-start; background: none; border: none; color: #1d4ed8; cursor: pointer; padding: 0; font: inherit; font-size: 13px; }
    .sg__certif { display: flex; gap: 8px; align-items: flex-start; font-size: 13.5px; line-height: 1.4; }
    .sg__erreur { margin: 0; color: #b91c1c; font-size: 13px; }
    .sg__bouton { padding: 10px 14px; border-radius: 10px; border: none; background: #1d4ed8; color: #fff; font-weight: 700; cursor: pointer; font: inherit; }
    .sg__bouton:disabled { opacity: .5; cursor: default; }
    .sg__bouton--danger { background: #b91c1c; }
  `]
})
export class FeuilleSignaturesComponent implements OnChanges {
  private http = inject(HttpClient);

  /** Adresse de l'état des signatures (GET) et de la signature (POST). */
  @Input({ required: true }) base!: string;
  /** Le promoteur peut rouvrir la feuille verrouillée. */
  @Input() canRouvrir = false;
  /** Équipe sans compte : le nom du signataire est demandé. */
  @Input() demanderNom = false;
  @Output() changed = new EventEmitter<EtatSignatures>();

  @ViewChild('pad') set padRef(r: ElementRef<HTMLCanvasElement> | undefined) {
    if (r && r.nativeElement !== this.canvas) { this.canvas = r.nativeElement; this.dessine = false; queueMicrotask(() => this.aTrace.set(false)); }
  }

  etat = signal<EtatSignatures | null>(null);
  chargement = signal(true);
  envoi = signal(false);
  erreur = signal<string | null>(null);
  mode = signal<'TRACE' | 'CERTIFIE'>('TRACE');
  aTrace = signal(false);

  role = '';
  nom = '';
  reserve = '';
  motif = '';
  certifie = false;

  private canvas?: HTMLCanvasElement;
  private dessine = false;

  peutEnvoyer = computed(() => {
    if (this.mode() === 'TRACE' ? !this.aTrace() : !this.certifie) return false;
    return !this.demanderNom || this.nom.trim().length > 1;
  });

  ngOnChanges(): void { this.charger(); }

  libelle(role: string): string {
    return this.etat()?.lignes.find(l => l.role === role)?.libelle ?? role;
  }

  charger(): void {
    if (!this.base) return;
    this.chargement.set(true);
    this.http.get<EtatSignatures>(this.base).subscribe({
      next: e => this.appliquer(e),
      error: () => { this.etat.set(null); this.chargement.set(false); }
    });
  }

  private appliquer(e: EtatSignatures): void {
    this.etat.set(e);
    this.chargement.set(false);
    if (!e.mesRoles.includes(this.role)) this.role = e.mesRoles[0] ?? '';
  }

  // ── Tracé ──
  private point(ev: PointerEvent): { x: number; y: number } {
    const r = this.canvas!.getBoundingClientRect();
    return { x: (ev.clientX - r.left) * (this.canvas!.width / r.width), y: (ev.clientY - r.top) * (this.canvas!.height / r.height) };
  }

  debut(ev: PointerEvent): void {
    if (!this.canvas) return;
    ev.preventDefault();
    this.canvas.setPointerCapture?.(ev.pointerId);
    const c = this.canvas.getContext('2d')!;
    const p = this.point(ev);
    c.lineWidth = 4; c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = '#111827';
    c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x + 0.1, p.y + 0.1); c.stroke();
    this.dessine = true;
    this.aTrace.set(true);
  }

  trace(ev: PointerEvent): void {
    if (!this.dessine || !this.canvas) return;
    ev.preventDefault();
    const c = this.canvas.getContext('2d')!;
    const p = this.point(ev);
    c.lineTo(p.x, p.y); c.stroke();
  }

  fin(): void { this.dessine = false; }

  effacer(): void {
    if (!this.canvas) return;
    this.canvas.getContext('2d')!.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.aTrace.set(false);
  }

  // ── Actions ──
  signer(): void {
    if (!this.peutEnvoyer() || !this.role) return;
    this.envoi.set(true);
    this.erreur.set(null);
    const corps = {
      role: this.role,
      mode: this.mode(),
      image: this.mode() === 'TRACE' ? this.canvas?.toDataURL('image/png') : null,
      reserve: this.reserve.trim() || null,
      nom: this.demanderNom ? this.nom.trim() : null
    };
    this.http.post<EtatSignatures>(this.base, corps).subscribe({
      next: e => { this.envoi.set(false); this.reserve = ''; this.certifie = false; this.appliquer(e); this.changed.emit(e); },
      error: err => { this.envoi.set(false); this.erreur.set(err?.error?.message ?? 'Signature impossible'); }
    });
  }

  rouvrir(): void {
    this.envoi.set(true);
    this.erreur.set(null);
    this.http.post<EtatSignatures>(`${this.base}/rouvrir`, { motif: this.motif.trim() }).subscribe({
      next: e => { this.envoi.set(false); this.motif = ''; this.appliquer(e); this.changed.emit(e); },
      error: err => { this.envoi.set(false); this.erreur.set(err?.error?.message ?? 'Réouverture impossible'); }
    });
  }
}
