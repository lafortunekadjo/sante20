// poster-polling.service.ts
import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject, interval, switchMap, takeWhile, catchError, of, timer } from 'rxjs';
import { PosterService, AsyncPosterResponse } from './poster.service';

@Injectable({
  providedIn: 'root'
})
export class PosterPollingService implements OnDestroy {
  private activePolling = new Map<string, Subject<AsyncPosterResponse>>();

  constructor(private posterService: PosterService) {}

  /**
   * Lance un polling pour suivre la génération asynchrone
   */
  startPolling(jobId: string, pollInterval: number = 2000): Observable<AsyncPosterResponse> {
    // Arrêter tout polling existant pour ce job
    this.stopPolling(jobId);
    
    const subject = new Subject<AsyncPosterResponse>();
    this.activePolling.set(jobId, subject);
    
    timer(0, pollInterval).pipe(
      switchMap(() => this.posterService.getPosterStatus(jobId)),
      takeWhile(response => {
        const isComplete = response.status === 'COMPLETED' || response.status === 'FAILED';
        if (isComplete) {
          this.stopPolling(jobId);
        }
        return !isComplete;
      }),
      catchError(error => {
        console.error('Polling error:', error);
        this.stopPolling(jobId);
        subject.error(error);
        return of(null);
      })
    ).subscribe(response => {
      if (response) {
        subject.next(response);
        if (response.status === 'FAILED') {
          subject.error(new Error(response.errorMessage || 'Génération échouée'));
        }
      }
    });
    
    return subject.asObservable();
  }

  /**
   * Arrête le polling pour un job
   */
  stopPolling(jobId: string): void {
    const subject = this.activePolling.get(jobId);
    if (subject) {
      subject.complete();
      this.activePolling.delete(jobId);
    }
  }

  /**
   * Arrête tous les pollings actifs
   */
  stopAllPolling(): void {
    this.activePolling.forEach((subject, jobId) => {
      subject.complete();
    });
    this.activePolling.clear();
  }

  ngOnDestroy(): void {
    this.stopAllPolling();
  }
}