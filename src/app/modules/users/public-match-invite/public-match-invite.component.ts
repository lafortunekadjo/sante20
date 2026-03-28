import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { JoueurInviteRequest, PublicInvitationResponse, MatchInvitationService, SubmitPlayersRequest } from '../../../core/services/match-invitation.service';
import { TranslateModule } from '@ngx-translate/core';


interface JoueurForm extends JoueurInviteRequest {
  id?: number;
}

@Component({
  selector: 'app-public-match-invite',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    DragDropModule,
    TranslateModule
  ],
  templateUrl: './public-match-invite.component.html',
  styleUrls: ['./public-match-invite.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('400ms ease-out', style({ opacity: 1 }))
      ])
    ]),
    trigger('slideUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('listAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateX(20px)' }))
      ])
    ])
  ]
})
export class PublicMatchInviteComponent implements OnInit {

  token: string = '';
  isLoading = true;
  isSubmitting = false;
  isSubmitted = false;

  logoPreview: string | null = null;
  selectedLogoFile: File | null = null;

  invitation: PublicInvitationResponse | null = null;

  formData = {
    nomEquipe: '',
    emailContact: '',
    telephoneContact: ''
  };

  joueurs: JoueurForm[] = [];

  private playerIdCounter = 0;

  constructor(
    private route: ActivatedRoute,
    private invitationService: MatchInvitationService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') || '';
    
    if (this.token) {
      this.loadInvitation();
    } else {
      this.isLoading = false;
      this.invitation = {
        valide: false,
        messageErreur: 'Lien d\'invitation invalide'
      };
    }
  }

  // ===== CHARGEMENT =====

  loadInvitation(): void {
    this.invitationService.getPublicInvitation(this.token).subscribe({
      next: (response) => {
        this.invitation = response;
        this.isLoading = false;
        console.log(response)
        if (response.valide && response.nom) {
        this.formData.nomEquipe = response.nom;
      }
        // Pré-remplir avec quelques joueurs vides si l'invitation est valide
        if (response.valide && !response.dejaSoumis) {
          this.initializeEmptyPlayers(response.minJoueurs || 7);
        }
      },
      error: (err) => {
        console.error('Erreur chargement invitation:', err);
        this.invitation = {
          valide: false,
          messageErreur: 'Impossible de charger l\'invitation'
        };
        this.isLoading = false;
      }
    });
  }

  private initializeEmptyPlayers(count: number): void {
    for (let i = 0; i < Math.min(count, 5); i++) {
      this.joueurs.push(this.createEmptyPlayer());
    }
  }

  private createEmptyPlayer(): JoueurForm {
    return {
      id: ++this.playerIdCounter,
      nom: '',
      prenom: '',
      numeroMaillot: undefined,
      poste: '',
      estCapitaine: false,
      estGardien: false
    };
  }

  // ===== GESTION DES JOUEURS =====

  addPlayer(): void {
    if (this.invitation?.maxJoueurs && this.joueurs.length >= this.invitation.maxJoueurs) {
      this.showSnackbar('Nombre maximum de joueurs atteint', 'warning');
      return;
    }
    this.joueurs.push(this.createEmptyPlayer());
  }

  removePlayer(index: number): void {
    if (this.joueurs.length <= 1) {
      this.showSnackbar('Vous devez avoir au moins un joueur', 'warning');
      return;
    }
    this.joueurs.splice(index, 1);
  }

  dropPlayer(event: CdkDragDrop<JoueurForm[]>): void {
    moveItemInArray(this.joueurs, event.previousIndex, event.currentIndex);
  }

  toggleCapitaine(index: number): void {
    // Un seul capitaine possible
    this.joueurs.forEach((j, i) => {
      j.estCapitaine = i === index ? !j.estCapitaine : false;
    });
  }

  toggleGardien(index: number): void {
    this.joueurs[index].estGardien = !this.joueurs[index].estGardien;
  }

  // ===== VALIDATION =====

  hasCapitaine(): boolean {
    return this.joueurs.some(j => j.estCapitaine);
  }

  allPlayersValid(): boolean {
    return this.joueurs.every(j => j.nom?.trim() && j.prenom?.trim());
  }

  canSubmit(): boolean {
    return (
      !!this.formData.nomEquipe?.trim() &&
      this.joueurs.length >= (this.invitation?.minJoueurs || 7) &&
      this.hasCapitaine() &&
      this.allPlayersValid()
    );
  }

  // ===== SOUMISSION =====

  submitPlayers(): void {
    if (!this.canSubmit() || this.isSubmitting) return;

    this.isSubmitting = true;

    const request: SubmitPlayersRequest = {
      nomEquipe: this.formData.nomEquipe.trim(),
      emailContact: this.formData.emailContact?.trim() || undefined,
      telephoneContact: this.formData.telephoneContact?.trim() || undefined,
      logoAdversaire: this.logoPreview,
      joueurs: this.joueurs
        .filter(j => j.nom?.trim() && j.prenom?.trim())
        .map(j => ({
          nom: j.nom.trim(),
          prenom: j.prenom.trim(),
          numeroMaillot: j.numeroMaillot,
          poste: j.poste || undefined,
          estCapitaine: j.estCapitaine || false,
          estGardien: j.estGardien || false
        }))
    };

    this.invitationService.submitPlayers(this.token, request).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.isSubmitted = true;
        this.showSnackbar(response.message, 'success');
      },
      error: (err) => {
        this.isSubmitting = false;
        const errorMsg = err.error?.message || 'Erreur lors de l\'envoi';
        this.showSnackbar(errorMsg, 'error');
      }
    });
  }

  // ===== IMPORT EXCEL =====

  openImportDialog(): void {
    // Créer un input file caché
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls,.csv';
    
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        this.importFromExcel(file);
      }
    };
    
    input.click();
  }

  private importFromExcel(file: File): void {
    // TODO: Implémenter l'import Excel avec SheetJS
    // Pour l'instant, on montre juste un message
    this.showSnackbar('Import Excel - Fonctionnalité à venir', 'info');
  }

  downloadTemplate(event: Event): void {
    event.preventDefault();
    
    // Générer un CSV simple comme template
    const headers = ['Prénom', 'Nom', 'Numéro', 'Poste', 'Capitaine (O/N)', 'Gardien (O/N)'];
    const exampleRows = [
      ['Jean', 'Mbarga', '1', 'Gardien', 'N', 'O'],
      ['Pierre', 'Nkodo', '4', 'Défenseur', 'O', 'N'],
      ['Paul', 'Essomba', '10', 'Milieu', 'N', 'N']
    ];

    const csvContent = [headers, ...exampleRows]
      .map(row => row.join(';'))
      .join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'modele_liste_joueurs.csv';
    link.click();
  }

  // ===== UTILITAIRES =====

  private showSnackbar(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    const panelClass = `snackbar-${type}`;
    this.snackBar.open(message, '✕', {
      duration: 4000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: [panelClass]
    });
  }

  // 2. Méthode pour gérer la sélection du fichier
onLogoSelected(event: any): void {
  const file = event.target.files[0];
  if (file) {
    if (file.size > 2 * 1024 * 1024) { // Limite 2Mo
      this.showSnackbar('Le logo est trop lourd (max 2Mo)', 'error');
      return;
    }
    
    this.selectedLogoFile = file;
    const reader = new FileReader();
    reader.onload = () => {
      this.logoPreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }
}
}