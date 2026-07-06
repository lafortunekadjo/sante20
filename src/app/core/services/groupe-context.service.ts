import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * Service léger pour broadcaster le changement de groupe
 * aux composants qui écoutent, sans rechargement de page.
 *
 * USAGE dans un composant :
 *
 * ngOnInit(): void {
 *   // Charger les données initiales
 *   this.loadData();
 *
 *   // Recharger quand le groupe change
 *   this.groupeContext.groupeChanged$.pipe(
 *     takeUntil(this.destroy$)
 *   ).subscribe(() => this.loadData());
 * }
 */
@Injectable({ providedIn: 'root' })
export class GroupeContextService {

  // Subject émis après chaque switch de groupe réussi
  private groupeChangedSource = new Subject<number>();

  /** S'abonner pour être notifié d'un changement de groupe */
  groupeChanged$ = this.groupeChangedSource.asObservable();

  /** Appelé par GroupeSwitcherComponent après un switch réussi */
  notifyGroupeChanged(groupeId: number): void {
    this.groupeChangedSource.next(groupeId);
  }
}