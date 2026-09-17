import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../../core/services/auth.service';
import { CampagneService, ClassementPublicDTO } from '../../../core/services/gamification/campagne.service';

@Component({
  selector: 'app-classement-public',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatTabsModule, MatIconModule,
    MatButtonModule, MatProgressSpinnerModule
  ],
  templateUrl: './classement-public.component.html',
  styleUrl:    './classement-public.component.scss'
})
export class ClassementPublicComponent implements OnInit {
  private route   = inject(ActivatedRoute);
  private router  = inject(Router);
  private svc     = inject(CampagneService);
  private auth    = inject(AuthService);

  isLoading    = signal(true);
  data         = signal<ClassementPublicDTO | null>(null);
  error        = signal(false);
  slug         = '';
  showRegles   = false;

  isLoggedIn = false;

  ngOnInit(): void {
    this.slug      = this.route.snapshot.paramMap.get('slug') ?? '';
    this.isLoggedIn = this.auth.isLoggedIn();

    this.svc.getClassementPublic(this.slug).subscribe({
      next: d  => { 
        this.data.set(d); 
        this.isLoading.set(false);
        console.log(d)
       },
      error: () => { this.error.set(true); this.isLoading.set(false); }
    });
  }

  getMedal(rang: number): string {
    return ['🥇', '🥈', '🥉'][rang - 1] ?? `${rang}.`;
  }

  rejoindre(): void {
    this.router.navigate(['/signup']);
  }

  seConnecter(): void {
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: `/c/${this.slug}` }
    });
  }

  toggleRegles(): void {
    this.showRegles = !this.showRegles;
  }
}