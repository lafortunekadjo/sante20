// src/app/core/services/back-button.service.ts

import { Injectable, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { filter } from 'rxjs/operators';
import { Subject, takeUntil } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class BackButtonService implements OnDestroy {

  private destroy$ = new Subject<void>();
  private history: string[] = [];

  constructor(private router: Router) {}

  public init(): void {
    if (!Capacitor.isNativePlatform()) return;

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((event: any) => {
      this.history.push(event.urlAfterRedirects);
    });

    App.addListener('backButton', () => {
      if (this.history.length > 1) {
        this.history.pop();
        this.router.navigateByUrl(this.history[this.history.length - 1]);
      } else {
        App.exitApp();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    App.removeAllListeners();
  }
}