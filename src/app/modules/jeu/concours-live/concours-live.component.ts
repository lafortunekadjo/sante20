import {
  Component, OnInit, OnDestroy
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  trigger, transition, animate, style, keyframes
} from '@angular/animations';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ConcoursService } from '../../../core/services/concours.service';
import { ConcoursWebSocketService } from '../../../core/services/concours-web-socket.service';


// ── Types ────────────────────────────────────────────────────

type Phase = 'attente' | 'demarre' | 'melange' | 'revelation' | 'resultats';

interface LiveEvent {
  type: string;
  message: string;
  rang?: number;
  lotLabel?: string;
  lotValeur?: string;
  gagnantNomMasque?: string;
  totalParticipants?: number;
  timestamp: number;
}

interface GagnantResultat {
  rang: number;
  lotLabel: string;
  lotValeur: string;
  gagnant: string;
}

interface TimeLeft { days: string; hours: string; minutes: string; seconds: string; }

interface LogEntry { time: string; message: string; }

interface Particle { x: number; y: number; delay: number; emoji: string; }

// ── Composant ────────────────────────────────────────────────

@Component({
  selector: 'app-concours-live',
  standalone: true,
  imports: [
    CommonModule, DatePipe,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule
  ],
  templateUrl: './concours-live.component.html',
  styleUrls: ['./concours-live.component.scss'],
  animations: [
    trigger('revealAnim', [
      transition(':enter', [
        animate('600ms cubic-bezier(0.175, 0.885, 0.32, 1.275)', keyframes([
          style({ transform: 'scale(0.7) translateY(30px)', opacity: 0, offset: 0 }),
          style({ transform: 'scale(1.05) translateY(-5px)', opacity: 1, offset: 0.7 }),
          style({ transform: 'scale(1) translateY(0)',       opacity: 1, offset: 1 })
        ]))
      ])
    ])
  ]
})
export class ConcoursLiveComponent implements OnInit, OnDestroy {

  concours: any = null;
  phase: Phase = 'attente';
  currentMessage = '';
  messagePulse = false;

  dernierGagnant: LiveEvent | null = null;
  gagnants: GagnantResultat[] = [];
  dateEffectif: Date | null = null;

  liveLog: LogEntry[] = [];
  timeLeft: TimeLeft | null = null;
  wsDisconnected = false;
  particles: Particle[] = [];

  private slug = '';
  private concoursId = 0;
  private destroy$ = new Subject<void>();
  private reconnectTimer: any;

  constructor(
    private route: ActivatedRoute,
    private concoursService: ConcoursService,
    private wsService: ConcoursWebSocketService
  ) {}

  ngOnInit(): void {
    this.slug = this.route.snapshot.paramMap.get('slug') || '';
    this.genererParticles();
    this.loadConcours();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.wsService.disconnect();
    clearTimeout(this.reconnectTimer);
  }

  // ── Chargement initial ────────────────────────────────────────

  private loadConcours(): void {
    this.concoursService.getConcoursPublic(this.slug).subscribe({
      next: (c) => {
        this.concours = c;
        this.concoursId = c.id;

        if (c.tirageEffectue) {
          // Tirage déjà fait → charger les résultats directement
          this.phase = 'resultats';
          this.chargerResultats();
        } else {
          // Tirage pas encore fait → countdown + écoute WebSocket
          this.startCountdown();
          this.connecterWebSocket();
        }
      },
      error: () => console.error('Erreur chargement concours')
    });
  }

  private chargerResultats(): void {
    this.concoursService.getResultats(this.slug).subscribe({
      next: (res: GagnantResultat[]) => {
        this.gagnants = res;
        this.dateEffectif = this.concours?.dateTirageEffectif
          ? new Date(this.concours.dateTirageEffectif) : null;
      }
    });
  }

  // ── WebSocket ─────────────────────────────────────────────────

  private connecterWebSocket(): void {
    this.wsService.connect(this.concoursId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (event: LiveEvent) => this.handleLiveEvent(event),
        error: () => {
          this.wsDisconnected = true;
          this.scheduleReconnect();
        }
      });

    this.wsService.connectionStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe(connected => {
        this.wsDisconnected = !connected;
      });
  }

  private scheduleReconnect(): void {
    this.reconnectTimer = setTimeout(() => {
      this.connecterWebSocket();
    }, 5000);
  }

  // ── Gestion événements live ───────────────────────────────────

  private handleLiveEvent(event: LiveEvent): void {
    // Ajouter au log
    this.addLog(event.message);
    this.showMessage(event.message);

    switch (event.type) {
      case 'TIRAGE_DEMARRE':
        this.phase = 'demarre';
        break;

      case 'MELANGE_EN_COURS':
        this.phase = 'melange';
        this.genererParticles();
        break;

      case 'GAGNANT_REVELE':
        this.phase = 'revelation';
        this.dernierGagnant = event;
        // Ajouter à la liste des gagnants révélés
        this.gagnants.unshift({
          rang:       event.rang!,
          lotLabel:  event.lotLabel!,
          lotValeur: event.lotValeur!,
          gagnant:   event.gagnantNomMasque!
        });
        break;

      case 'TIRAGE_TERMINE':
        // Attendre 2s puis basculer vers les résultats complets
        setTimeout(() => {
          this.phase = 'resultats';
          this.chargerResultats();  // recharger avec les vrais noms
        }, 2000);
        break;
    }
  }

  private showMessage(msg: string): void {
    this.currentMessage = msg;
    this.messagePulse = true;
    setTimeout(() => this.messagePulse = false, 500);
  }

  private addLog(message: string): void {
    const time = new Date().toLocaleTimeString('fr', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.liveLog.unshift({ time, message }); // plus récent en haut
    if (this.liveLog.length > 20) this.liveLog.pop(); // garder 20 entrées max
  }

  // ── Countdown ────────────────────────────────────────────────

  private startCountdown(): void {
    if (!this.concours?.dateTirage) return;

    const update = () => {
      const end  = new Date(this.concours.dateTirage).getTime();
      const diff = end - Date.now();

      if (diff <= 0) { this.timeLeft = null; return; }

      const d = Math.floor(diff / 86_400_000);
      const h = Math.floor((diff % 86_400_000) / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);

      this.timeLeft = {
        days:    String(d).padStart(2, '0'),
        hours:   String(h).padStart(2, '0'),
        minutes: String(m).padStart(2, '0'),
        seconds: String(s).padStart(2, '0')
      };
    };

    update();
    interval(1000).pipe(takeUntil(this.destroy$)).subscribe(update);
  }

  // ── Partage ───────────────────────────────────────────────────

  partagerResultats(): void {
    const url  = `${window.location.origin}/concours/${this.slug}/live`;
    const text = `🏆 Résultats du concours "${this.concours?.titre}" sur My2-0 !`;

    if (navigator.share) {
      navigator.share({ title: this.concours?.titre, text, url });
    } else {
      navigator.clipboard.writeText(`${text}\n${url}`);
    }
  }

  // ── Helpers template ─────────────────────────────────────────

  isLiveActif(): boolean {
    return ['demarre', 'melange', 'revelation'].includes(this.phase);
  }

 // Remplacer la signature de ta méthode dans concours-live.component.ts
getRangEmoji(rang: number | undefined): string {
  const i = (rang ?? 1) - 1;  // rang commence à 1, index à 0
  return ['🥇', '🥈', '🥉'][i] ?? `${rang}`;
}

  private genererParticles(): void {
    const emojis = ['⭐', '🎉', '✨', '🎊', '💫', '🌟'];
    this.particles = Array.from({ length: 12 }, (_, i) => ({
      x:     Math.random() * 100,
      y:     Math.random() * 100,
      delay: (i * 0.15),
      emoji: emojis[i % emojis.length]
    }));
  }
}