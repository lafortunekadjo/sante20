import { Injectable, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { DEVISE_PAR_DEFAUT, DEVISES, deviseCourante } from '../devise';
import { GroupeContextService } from './groupe-context.service';
import { GroupeService } from './groupe.service';

/**
 * Tient à jour la devise du groupe actif : chargée une fois connecté, rechargée au changement de groupe
 * et après chaque modification de la configuration du groupe.
 */
@Injectable({ providedIn: 'root' })
export class DeviseService implements OnDestroy {
  readonly devises = DEVISES;
  private abonnement?: Subscription;

  constructor(private groupeService: GroupeService, private contexte: GroupeContextService) {}

  /** À appeler quand l'utilisateur est connecté (idempotent). */
  demarrer(): void {
    if (!this.abonnement) {
      this.abonnement = this.contexte.groupeChanged$.subscribe(() => this.charger());
    }
    this.charger();
  }

  charger(): void {
    this.groupeService.getGroupeConn().subscribe({
      next: groupe => deviseCourante.set((groupe as any)?.devise || DEVISE_PAR_DEFAUT),
      error: () => { /* sans groupe (administrateur, candidat) : la devise par défaut reste */ }
    });
  }

  ngOnDestroy(): void { this.abonnement?.unsubscribe(); }
}
