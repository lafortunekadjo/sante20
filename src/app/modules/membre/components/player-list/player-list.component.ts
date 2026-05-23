import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { PlayerProfile, ProfileService } from '../../../../core/services/profile.service';


@Component({
  selector: 'app-player-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule, MatCardModule, 
    MatIconModule, MatInputModule, MatButtonModule, MatProgressSpinnerModule
  ],
  templateUrl: './player-list.component.html',
  styleUrl: './player-list.component.scss'
})
export class PlayerListComponent implements OnInit {
  players: PlayerProfile[] = [];
  filteredPlayers: PlayerProfile[] = [];
  searchQuery = '';
  isLoading = true;

  constructor(private profileService: ProfileService) {}

  ngOnInit(): void {
    this.profileService.getAllPlayers().subscribe({
      next: (data) => {
        this.players = data;
        this.filteredPlayers = data;
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  filterPlayers(): void {
    const query = this.searchQuery.toLowerCase().trim();
    this.filteredPlayers = this.players.filter(p => 
      p.username.toLowerCase().includes(query)
    );
  }
}