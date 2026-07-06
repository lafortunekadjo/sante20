// equipe-members-dialog.component.ts

import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MembreService } from '../../../../core/services/membre.service';
import { Equipe } from '../../../../core/models/groupe.model copy';
import { Membre } from '../../../../core/models/membre.model';

@Component({
  selector: 'app-equipe-members-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './equipe-members-dialog.component.html',
  styleUrl: './equipe-members-dialog.component.scss'
})
export class EquipeMembersDialogComponent implements OnInit {
  members: Membre[] = [];
  isLoading = true;

  // Couleurs pour les avatars
  private avatarColors = [
    '#1976d2', '#388e3c', '#f57c00', '#d32f2f',
    '#7b1fa2', '#0097a7', '#689f38', '#fbc02d'
  ];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { equipe: Equipe },
    private dialogRef: MatDialogRef<EquipeMembersDialogComponent>,
    private membreService: MembreService
  ) {}

  ngOnInit(): void {
    this.loadMembers();
  }

  loadMembers(): void {
    this.isLoading = true;
    
    // Récupérer les membres de l'équipe
    this.membreService.getMembresByEquipeId(this.data.equipe.id).subscribe({
      next: (membres) => {
        this.members = membres;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des membres:', error);
        this.members = [];
        this.isLoading = false;
      }
    });
  }

  getInitials(prenom: string, nom: string): string {
    const prenomInitial = prenom ? prenom.charAt(0).toUpperCase() : '';
    const nomInitial = nom ? nom.charAt(0).toUpperCase() : '';
    return `${prenomInitial}${nomInitial}`;
  }

  getAvatarColor(index: number): string {
    return this.avatarColors[index % this.avatarColors.length];
  }

  exportMembers(): void {
    // Créer un CSV avec les données des membres
    const headers = ['Prénom', 'Nom', 'Email', 'Téléphone', 'Statut'];
    const rows = this.members.map(m => [
      m.prenom || '',
      m.nom || '',
      m.email || '',
      m.tel || '',
      m.active ? 'Actif' : 'Inactif'
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n');

    // Créer un blob et télécharger
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `membres_${this.data.equipe.nom}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}