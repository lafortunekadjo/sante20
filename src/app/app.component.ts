import { Component, OnInit } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { SettingsService } from './core/services/settings.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  
  constructor(private router: Router) {}

  ngOnInit(): void {
    console.log('🚀 Application started');
    
    // Tracer TOUTES les navigations
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        console.log('==========================================');
        console.log('🔄 NAVIGATION START:', event.url);
        console.log('Navigation ID:', event.id);
        console.log('Trigger:', event.navigationTrigger);
        console.log('Restore scroll position:', event.restoredState);
        
        // Afficher la stack trace pour voir d'où vient la navigation
        console.trace('Navigation triggered from:');
        console.log('==========================================');
      } 
      else if (event instanceof NavigationEnd) {
        console.log('✅ NAVIGATION END:', event.url);
      } 
      else if (event instanceof NavigationCancel) {
        console.log('⚠️ NAVIGATION CANCELLED:', event.url);
        console.log('Reason:', event.reason);
      } 
      else if (event instanceof NavigationError) {
        console.error('❌ NAVIGATION ERROR:', event.url);
        console.error('Error:', event.error);
      }
    });
  
  }
}