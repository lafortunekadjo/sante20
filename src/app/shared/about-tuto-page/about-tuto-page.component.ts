import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';


@Component({
  selector: 'app-about-tuto-page',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatDividerModule
  ],
  template: `
    <div class="page-container">
      <mat-card class="info-card">
        <mat-card-header>
          <mat-card-title><mat-icon>info</mat-icon> À Propos de l'Application</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p class="app-description">
            Bienvenue dans l'outil de gestion de présence. Cette application est conçue pour simplifier 
            la gestion des effectifs et l'enregistrement des présences lors de vos événements et matchs. 
            Elle fournit une interface claire pour les administrateurs et managers de groupe.
          </p>

          <mat-divider></mat-divider>
          
          <h3 class="section-title"><mat-icon>help</mat-icon> Tutoriels et FAQ</h3>
          
          <mat-expansion-panel class="tuto-panel">
            <mat-expansion-panel-header>
              <mat-panel-title>
                Comment inscrire un nouveau membre?
              </mat-panel-title>
            </mat-expansion-panel-header>
            <p>
              Naviguez vers la section 'Gestion des Membres'. Cliquez sur le bouton "Ajouter Membre" 
              et remplissez les informations requises (Nom, Prénom, Fonction, etc.). Le membre sera 
              automatiquement ajouté à la liste de votre groupe.
            </p>
          </mat-expansion-panel>

          <mat-expansion-panel class="tuto-panel">
            <mat-expansion-panel-header>
              <mat-panel-title>
                Comment enregistrer la présence pour un match?
              </mat-panel-title>
            </mat-expansion-panel-header>
            <p>
              Dans la section 'Matchs', sélectionnez l'événement souhaité. Une fiche de présence 
              s'ouvrira, vous permettant de cocher la case "Présent" pour chaque membre. Les données sont 
              sauvegardées en temps réel.
            </p>
          </mat-expansion-panel>

          <mat-expansion-panel class="tuto-panel">
            <mat-expansion-panel-header>
              <mat-panel-title>
                Comment imprimer la fiche de présence?
              </mat-panel-title>
            </mat-expansion-panel-header>
            <p>
              Une fois sur la fiche de présence d'un match, cliquez sur le bouton "Imprimer Fiche" 
              en haut de la page. Cela générera un PDF prêt à être imprimé avec les informations des officiels et les signatures.
            </p>
          </mat-expansion-panel>

          <mat-divider></mat-divider>

          <div class="contact-section">
            <p>Pour toute autre question ou support technique, veuillez nous contacter.</p>
            <a mat-flat-button color="primary" href="mailto:support@app.com">
              <mat-icon>mail</mat-icon> Contacter le Support
            </a>
          </div>

        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container {
      display: flex;
      justify-content: center;
      padding: 2rem;
      min-height: 90vh;
      background-color: #f0f2f5;
    }
    
    .info-card {
      max-width: 800px;
      width: 100%;
      border-radius: 12px;
      box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
    }
    
    mat-card-title {
      display: flex;
      align-items: center;
      font-size: 1.8rem;
      font-weight: 700;
      color: #007bff;
      padding-bottom: 1rem;
    }
    
    mat-card-title mat-icon {
      margin-right: 10px;
      font-size: 2rem;
    }

    .app-description {
      font-size: 1.1rem;
      line-height: 1.6;
      margin-bottom: 1.5rem;
      color: #333;
    }
    
    .section-title {
      display: flex;
      align-items: center;
      font-size: 1.4rem;
      font-weight: 600;
      color: #4a4a4a;
      margin-top: 2rem;
      margin-bottom: 1.5rem;
    }

    .section-title mat-icon {
      margin-right: 8px;
      color: #1abc9c;
    }

    .tuto-panel {
      margin-bottom: 10px;
      border-radius: 8px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
    }

    .contact-section {
      text-align: center;
      padding-top: 1.5rem;
      margin-top: 1.5rem;
    }

    .contact-section p {
      margin-bottom: 1rem;
      color: #555;
    }
  `]
})
export class AboutTutoPageComponent {}