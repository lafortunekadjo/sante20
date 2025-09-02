import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, MatSidenavModule, MatToolbarModule, MatListModule, MatIconModule, MatButtonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements AfterViewInit{
  @ViewChild('sidenav') sidenav!: MatSidenav;
  isAdmin: boolean = false;
  isResponsable: boolean = false;
  isSidenavOpen: boolean = true;

  constructor(private authService: AuthService, private cdr: ChangeDetectorRef) {
    const roles = authService.getRoles() || [];
    this.isAdmin = roles.includes('ADMIN');
    this.isResponsable = roles.includes('RESPONSABLE') || roles.includes('ADMIN');
  }

  ngAfterViewInit(): void {
    // Ensure the sidenav state is synced after view initialization
    this.isSidenavOpen = this.sidenav.opened;
    this.cdr.detectChanges(); // Manually trigger change detection
  }
  toggleSidenav(): void {
    this.isSidenavOpen = !this.isSidenavOpen;
    this.sidenav.toggle();
  }

}
