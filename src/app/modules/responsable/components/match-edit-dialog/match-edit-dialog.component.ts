import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatRadioModule } from '@angular/material/radio';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { Groupe } from '../../../../core/models/groupe.model';
import { Equipe } from '../../../../core/models/groupe.model copy';
import { Match, SourceAdversaire } from '../../../../core/models/match.model';
import { Membre } from '../../../../core/models/membre.model';
;

export interface MatchEditDialogData {
  match: Match;
  membres: Membre[];
  equipes: Equipe[];
  groupes: Groupe[];
  currentGroupe: Groupe | null;
}

@Component({
  selector: 'app-match-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatIconModule,
    MatChipsModule,
    MatRadioModule,
    MatTabsModule,
    MatDividerModule
  ],
  template: `
    <div class="dialog-container">
      <!-- Header -->
      <div class="dialog-header" [ngClass]="'type-' + editMatch.typeMatch?.toLowerCase()">
        <div class="header-content">
          <mat-icon>{{ getTypeIcon() }}</mat-icon>
          <div>
            <h2>Modifier le match</h2>
            <span class="match-date">{{ formatDate(editMatch.dateMatch) }}</span>
          </div>
        </div>
        <button mat-icon-button (click)="onCancel()" class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Content avec Tabs -->
      <mat-dialog-content>
        <mat-tab-group animationDuration="200ms">
          
          <!-- Tab 1: Informations générales -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon>info</mat-icon>
              <span>Général</span>
            </ng-template>
            
            <div class="tab-content">
              <div class="form-row">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Type de match</mat-label>
                  <mat-select [(ngModel)]="editMatch.typeMatch" (selectionChange)="onTypeChange()">
                    <mat-option value="INTERNE">
                      <mat-icon class="option-icon">groups</mat-icon>
                      Interne
                    </mat-option>
                    <mat-option value="DUEL">
                      <mat-icon class="option-icon">sports</mat-icon>
                      Duel
                    </mat-option>
                    <mat-option value="AMICAL">
                      <mat-icon class="option-icon">handshake</mat-icon>
                      Amical
                    </mat-option>
                    <mat-option value="ANNIVERSAIRE">
                      <mat-icon class="option-icon">cake</mat-icon>
                      Anniversaire
                    </mat-option>
                  </mat-select>
                </mat-form-field>
              </div>

              <div class="form-row two-cols">
                <mat-form-field appearance="outline">
                  <mat-label>Date du match</mat-label>
                  <input matInput type="date" [(ngModel)]="editMatch.dateMatch">
                  <mat-icon matPrefix>event</mat-icon>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Lieu</mat-label>
                  <input matInput [(ngModel)]="editMatch.lieu" placeholder="Stade, terrain...">
                  <mat-icon matPrefix>location_on</mat-icon>
                </mat-form-field>
              </div>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Commentaire</mat-label>
                <textarea matInput [(ngModel)]="editMatch.commentaire" rows="2"></textarea>
                <mat-icon matPrefix>comment</mat-icon>
              </mat-form-field>
            </div>
          </mat-tab>

          <!-- Tab 2: Équipes -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon>groups</mat-icon>
              <span>Équipes</span>
            </ng-template>
            
            <div class="tab-content">
              <!-- Pour INTERNE / DUEL -->
              <div *ngIf="editMatch.typeMatch === 'INTERNE' || editMatch.typeMatch === 'DUEL'" class="teams-section">
                <div class="teams-grid">
                  <div class="team-card team-1">
                    <div class="team-header">
                      <span class="team-badge">Équipe 1</span>
                    </div>
                    <mat-form-field appearance="outline">
                      <mat-label>Sélectionner</mat-label>
                      <mat-select [(ngModel)]="selectedEquipe1Id" (selectionChange)="updateEquipesForForfait()">
                        <mat-option [value]="null">-- Aucune --</mat-option>
                        <mat-option *ngFor="let eq of data.equipes" [value]="eq.id"
                                    [disabled]="eq.id === selectedEquipe2Id">
                          {{ eq.nom }}
                        </mat-option>
                      </mat-select>
                    </mat-form-field>
                    
                    <!-- Score Équipe 1 -->
                    <mat-form-field appearance="outline" class="score-field">
                      <mat-label>Score</mat-label>
                      <input matInput type="number" [(ngModel)]="editMatch.scoreEquipe1" min="0">
                    </mat-form-field>
                    
                    <!-- Affichage de l'équipe actuelle -->
                    <div class="current-value" *ngIf="getEquipe1Name()">
                      <mat-icon>check_circle</mat-icon>
                      <span>Actuel: {{ getEquipe1Name() }}</span>
                    </div>
                  </div>

                  <div class="vs-badge">VS</div>

                  <div class="team-card team-2">
                    <div class="team-header">
                      <span class="team-badge">Équipe 2</span>
                    </div>
                    <mat-form-field appearance="outline">
                      <mat-label>Sélectionner</mat-label>
                      <mat-select [(ngModel)]="selectedEquipe2Id" (selectionChange)="updateEquipesForForfait()">
                        <mat-option [value]="null">-- Aucune --</mat-option>
                        <mat-option *ngFor="let eq of data.equipes" [value]="eq.id"
                                    [disabled]="eq.id === selectedEquipe1Id">
                          {{ eq.nom }}
                        </mat-option>
                      </mat-select>
                    </mat-form-field>
                    
                    <!-- Score Équipe 2 -->
                    <mat-form-field appearance="outline" class="score-field">
                      <mat-label>Score</mat-label>
                      <input matInput type="number" [(ngModel)]="editMatch.scoreEquipe2" min="0">
                    </mat-form-field>
                    
                    <!-- Affichage de l'équipe actuelle -->
                    <div class="current-value" *ngIf="getEquipe2Name()">
                      <mat-icon>check_circle</mat-icon>
                      <span>Actuel: {{ getEquipe2Name() }}</span>
                    </div>
                  </div>
                </div>

                <div class="random-btn">
                  <button mat-stroked-button type="button" (click)="randomizeTeams()">
                    <mat-icon>shuffle</mat-icon>
                    Tirage aléatoire
                  </button>
                </div>
              </div>

              <!-- Pour AMICAL -->
              <div *ngIf="editMatch.typeMatch === 'AMICAL'" class="amical-section">
                <div class="teams-row">
                  <div class="local-team">
                    <span class="team-label">Votre équipe</span>
                    <div class="team-name">{{ data.currentGroupe?.nom || 'Mon équipe' }}</div>
                    
                    <mat-form-field appearance="outline" class="score-field">
                      <mat-label>Score</mat-label>
                      <input matInput type="number" [(ngModel)]="editMatch.scoreEquipe1" min="0">
                    </mat-form-field>
                  </div>

                  <div class="vs-badge">VS</div>

                  <div class="adverse-team">
                    <span class="team-label">Adversaire</span>
                    
                    <mat-radio-group [(ngModel)]="selectedSourceAdversaire" (change)="onSourceChange()" class="source-group">
                      <mat-radio-button value="MANUEL">Saisie manuelle</mat-radio-button>
                      <mat-radio-button value="GROUPE_EXISTANT">Groupe existant</mat-radio-button>
                    </mat-radio-group>

                    <mat-form-field *ngIf="selectedSourceAdversaire === 'MANUEL'" appearance="outline" class="full-width">
                      <mat-label>Nom de l'adversaire</mat-label>
                      <input matInput [(ngModel)]="editMatch.nomAdversaireManuel">
                    </mat-form-field>

                    <mat-form-field *ngIf="selectedSourceAdversaire === 'GROUPE_EXISTANT'" appearance="outline" class="full-width">
                      <mat-label>Sélectionner un groupe</mat-label>
                      <mat-select [(ngModel)]="selectedGroupeAdverseId">
                        <mat-option [value]="null">-- Aucun --</mat-option>
                        <mat-option *ngFor="let g of data.groupes" [value]="g.id">
                          {{ g.nom }} <span *ngIf="g.ville">({{ g.ville.nom }})</span>
                        </mat-option>
                      </mat-select>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="score-field">
                      <mat-label>Score adversaire</mat-label>
                      <input matInput type="number" [(ngModel)]="editMatch.scoreAdversaire" min="0">
                    </mat-form-field>
                    
                    <!-- Affichage adversaire actuel -->
                    <div class="current-value" *ngIf="getCurrentAdversaire()">
                      <mat-icon>check_circle</mat-icon>
                      <span>Actuel: {{ getCurrentAdversaire() }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Pour ANNIVERSAIRE -->
              <div *ngIf="editMatch.typeMatch === 'ANNIVERSAIRE'" class="anniversaire-section">
                <div class="birthday-members">
                  <h4>
                    <mat-icon>cake</mat-icon>
                    Membres fêtés
                  </h4>
                  
                  <mat-chip-set *ngIf="selectedMembresAnniversaire.length > 0">
                    <mat-chip *ngFor="let m of selectedMembresAnniversaire" (removed)="removeMembreAnniversaire(m)">
                      {{ m.prenom }} {{ m.nom }}
                      <button matChipRemove>
                        <mat-icon>cancel</mat-icon>
                      </button>
                    </mat-chip>
                  </mat-chip-set>
                  
                  <div *ngIf="selectedMembresAnniversaire.length === 0" class="no-selection">
                    Aucun membre sélectionné
                  </div>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Ajouter un membre</mat-label>
                    <mat-select (selectionChange)="addMembreAnniversaire($event.value); $event.source.value = null">
                      <mat-option *ngFor="let m of availableMembres" [value]="m">
                        {{ m.nom }} {{ m.prenom }}
                      </mat-option>
                    </mat-select>
                  </mat-form-field>
                </div>

                <mat-divider></mat-divider>

                <!-- Équipes pour anniversaire -->
                <h4 style="margin-top: 16px;">Configuration des équipes</h4>
                <div class="teams-grid">
                  <div class="team-card team-1">
                    <span class="team-badge">Équipe Fêtés</span>
                    <mat-form-field appearance="outline">
                      <mat-select [(ngModel)]="selectedEquipe1Id">
                        <mat-option [value]="null">-- Aucune --</mat-option>
                        <mat-option *ngFor="let eq of data.equipes" [value]="eq.id">
                          {{ eq.nom }}
                        </mat-option>
                      </mat-select>
                    </mat-form-field>
                  </div>
                  <div class="vs-badge">VS</div>
                  <div class="team-card team-2">
                    <span class="team-badge">Équipe Adverses</span>
                    <mat-form-field appearance="outline">
                      <mat-select [(ngModel)]="selectedEquipe2Id">
                        <mat-option [value]="null">-- Aucune --</mat-option>
                        <mat-option *ngFor="let eq of data.equipes" [value]="eq.id">
                          {{ eq.nom }}
                        </mat-option>
                      </mat-select>
                    </mat-form-field>
                  </div>
                </div>
              </div>

              <!-- Section Forfait -->
              <div class="forfait-section">
                <mat-checkbox [(ngModel)]="editMatch.forfait" (change)="onForfaitChange()">
                  Match déclaré forfait
                </mat-checkbox>

                <mat-form-field *ngIf="editMatch.forfait" appearance="outline">
                  <mat-label>Équipe forfait</mat-label>
                  <mat-select [(ngModel)]="editMatch.equipeForfait">
                    <mat-option *ngFor="let eq of equipesForForfait" [value]="eq">
                      {{ eq }}
                    </mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
            </div>
          </mat-tab>

          <!-- Tab 3: Officiels -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon>gavel</mat-icon>
              <span>Officiels</span>
            </ng-template>
            
            <div class="tab-content">
              <div class="officials-grid">
                <!-- Arbitre Principal -->
                <div class="official-card">
                  <div class="official-header">
                    <mat-icon>sports</mat-icon>
                    <span>Arbitre principal</span>
                  </div>
                  
                  <mat-form-field appearance="outline">
                    <mat-label>Membre du groupe</mat-label>
                    <mat-select [(ngModel)]="selectedArbitrePrincipalId">
                      <mat-option [value]="null">-- Aucun --</mat-option>
                      <mat-option *ngFor="let m of data.membres" [value]="m.id">
                        {{ m.nom }} {{ m.prenom }}
                      </mat-option>
                    </mat-select>
                  </mat-form-field>
                  
                  <div class="or-divider">ou</div>
                  
                  <mat-form-field appearance="outline">
                    <mat-label>Nom externe</mat-label>
                    <input matInput [(ngModel)]="editMatch.arbitrePrincipalNomOccasionnel" 
                           placeholder="Nom de l'arbitre externe">
                  </mat-form-field>
                  
                  <!-- Valeur actuelle -->
                  <div class="current-value" *ngIf="getCurrentArbitrePrincipal()">
                    <mat-icon>person</mat-icon>
                    <span>Actuel: {{ getCurrentArbitrePrincipal() }}</span>
                  </div>
                </div>

                <!-- Arbitre Assistant -->
                <div class="official-card">
                  <div class="official-header">
                    <mat-icon>assistant</mat-icon>
                    <span>Arbitre assistant</span>
                  </div>
                  
                  <mat-form-field appearance="outline">
                    <mat-label>Membre du groupe</mat-label>
                    <mat-select [(ngModel)]="selectedArbitreAssistantId">
                      <mat-option [value]="null">-- Aucun --</mat-option>
                      <mat-option *ngFor="let m of data.membres" [value]="m.id">
                        {{ m.nom }} {{ m.prenom }}
                      </mat-option>
                    </mat-select>
                  </mat-form-field>
                  
                  <div class="or-divider">ou</div>
                  
                  <mat-form-field appearance="outline">
                    <mat-label>Nom externe</mat-label>
                    <input matInput [(ngModel)]="editMatch.arbitreAssistantNomOccasionnel"
                           placeholder="Nom de l'assistant externe">
                  </mat-form-field>
                  
                  <!-- Valeur actuelle -->
                  <div class="current-value" *ngIf="getCurrentArbitreAssistant()">
                    <mat-icon>person</mat-icon>
                    <span>Actuel: {{ getCurrentArbitreAssistant() }}</span>
                  </div>
                </div>

                <!-- Rapporteur -->
                <div class="official-card highlighted">
                  <div class="official-header">
                    <mat-icon>description</mat-icon>
                    <span>Rapporteur</span>
                    <span class="required-badge">Important</span>
                  </div>
                  
                  <mat-form-field appearance="outline">
                    <mat-label>Membre du groupe</mat-label>
                    <mat-select [(ngModel)]="selectedRapporteurId">
                      <mat-option [value]="null">-- Aucun --</mat-option>
                      <mat-option *ngFor="let m of data.membres" [value]="m.id">
                        {{ m.nom }} {{ m.prenom }}
                      </mat-option>
                    </mat-select>
                  </mat-form-field>
                  
                  <div class="or-divider">ou</div>
                  
                  <mat-form-field appearance="outline">
                    <mat-label>Nom externe</mat-label>
                    <input matInput [(ngModel)]="editMatch.rapporteurNomOccasionnel"
                           placeholder="Nom du rapporteur externe">
                  </mat-form-field>
                  
                  <!-- Valeur actuelle -->
                  <div class="current-value" *ngIf="getCurrentRapporteur()">
                    <mat-icon>person</mat-icon>
                    <span>Actuel: {{ getCurrentRapporteur() }}</span>
                  </div>
                </div>
              </div>

              <div class="info-box" *ngIf="!hasRapporteur()">
                <mat-icon>info</mat-icon>
                <span>Un rapporteur doit être assigné pour que le match soit considéré comme "joué".</span>
              </div>
            </div>
          </mat-tab>

          <!-- Tab 4: Statut -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon>{{ getStatusIcon() }}</mat-icon>
              <span>Statut</span>
            </ng-template>
            
            <div class="tab-content">
              <div class="status-summary">
                <div class="status-card" [ngClass]="getStatusClass()">
                  <mat-icon>{{ getStatusIcon() }}</mat-icon>
                  <div class="status-info">
                    <h3>{{ getStatusLabel() }}</h3>
                    <p>{{ getStatusDescription() }}</p>
                  </div>
                </div>

                <div class="status-checklist">
                  <h4>Critères de validation</h4>
                  <div class="checklist-item" [class.completed]="isMatchDatePast()">
                    <mat-icon>{{ isMatchDatePast() ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                    <span>Date du match passée</span>
                  </div>
                  <div class="checklist-item" [class.completed]="hasRapporteur()">
                    <mat-icon>{{ hasRapporteur() ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                    <span>Rapporteur assigné</span>
                  </div>
                  <div class="checklist-item" [class.completed]="hasScore()">
                    <mat-icon>{{ hasScore() ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                    <span>Score enregistré</span>
                  </div>
                </div>

                <!-- Actions rapides -->
                <div class="quick-actions" *ngIf="isMatchDatePast() && !hasRapporteur()">
                  <h4>Actions rapides</h4>
                  <button mat-stroked-button color="primary" (click)="markAsPlayed()">
                    <mat-icon>check</mat-icon>
                    Marquer comme joué (sans rapporteur)
                  </button>
                </div>
              </div>
            </div>
          </mat-tab>
        </mat-tab-group>
      </mat-dialog-content>

      <!-- Footer -->
      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">Annuler</button>
        <button mat-raised-button color="primary" (click)="onSave()" [disabled]="!isValid()">
          <mat-icon>save</mat-icon>
          Enregistrer
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-container {
      min-width: 600px;
      max-width: 800px;
      
      @media (max-width: 768px) {
        min-width: unset;
        width: 100%;
      }
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      color: white;
      margin: -24px -24px 0 -24px;

      &.type-interne { background: linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%); }
      &.type-duel { background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); }
      &.type-amical { background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%); }
      &.type-anniversaire { background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); }

      .header-content {
        display: flex;
        align-items: center;
        gap: 16px;

        mat-icon {
          font-size: 36px;
          width: 36px;
          height: 36px;
        }

        h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
        }

        .match-date {
          font-size: 14px;
          opacity: 0.9;
        }
      }
      
      .close-btn {
        color: white;
      }
    }

    mat-dialog-content {
      padding: 0 !important;
      max-height: 60vh;
      overflow-y: auto;
    }

    .tab-content {
      padding: 20px;
    }

    .form-row {
      margin-bottom: 16px;

      &.two-cols {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        
        @media (max-width: 600px) {
          grid-template-columns: 1fr;
        }
      }
    }

    .full-width {
      width: 100%;
    }

    // Teams section
    .teams-section, .amical-section, .anniversaire-section {
      padding: 16px;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .teams-grid {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      gap: 16px;
      align-items: start;
      
      @media (max-width: 600px) {
        grid-template-columns: 1fr;
      }
    }
    
    .teams-row {
      display: flex;
      gap: 16px;
      align-items: flex-start;
      flex-wrap: wrap;
      
      > * {
        flex: 1;
        min-width: 200px;
      }
    }

    .team-card, .local-team, .adverse-team {
      background: white;
      padding: 16px;
      border-radius: 8px;
      text-align: center;

      &.team-1 {
        border-top: 4px solid #fdd835;
      }

      &.team-2 {
        border-top: 4px solid #f44336;
      }

      .team-badge, .team-label {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
        margin-bottom: 12px;
        background: #e0e0e0;
      }
      
      .team-name {
        font-size: 18px;
        font-weight: 600;
        margin: 8px 0 16px;
        color: #1976d2;
      }

      mat-form-field {
        width: 100%;
      }

      .score-field {
        margin-top: 12px;
      }
    }

    .vs-badge {
      font-size: 24px;
      font-weight: 700;
      color: #757575;
      align-self: center;
      
      @media (max-width: 600px) {
        text-align: center;
        padding: 8px 0;
      }
    }

    .random-btn {
      text-align: center;
      margin-top: 16px;
    }
    
    .source-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
    }

    // Current value display
    .current-value {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 8px;
      padding: 8px;
      background: rgba(76, 175, 80, 0.1);
      border-radius: 4px;
      font-size: 12px;
      color: #4caf50;
      
      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
    }
    
    .no-selection {
      padding: 16px;
      text-align: center;
      color: #757575;
      font-style: italic;
    }

    // Forfait section
    .forfait-section {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background: rgba(255, 152, 0, 0.1);
      border-radius: 8px;
      margin-top: 16px;
      border: 1px solid rgba(255, 152, 0, 0.3);
    }

    // Officials section
    .officials-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }

    .official-card {
      background: #f5f5f5;
      padding: 16px;
      border-radius: 8px;

      &.highlighted {
        background: rgba(76, 175, 80, 0.1);
        border: 1px solid rgba(76, 175, 80, 0.3);
      }

      .official-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
        font-weight: 600;
        flex-wrap: wrap;

        mat-icon {
          color: #1976d2;
        }

        .required-badge {
          font-size: 10px;
          background: #4caf50;
          color: white;
          padding: 2px 8px;
          border-radius: 8px;
          margin-left: auto;
        }
      }

      mat-form-field {
        width: 100%;
      }
      
      .or-divider {
        text-align: center;
        color: #757575;
        font-size: 12px;
        margin: 8px 0;
      }
    }

    .info-box {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: rgba(33, 150, 243, 0.1);
      border-radius: 8px;
      margin-top: 16px;

      mat-icon {
        color: #2196f3;
      }

      span {
        font-size: 14px;
        color: #757575;
      }
    }

    // Status tab
    .status-summary {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .status-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      border-radius: 12px;

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
      }

      &.status-played {
        background: rgba(76, 175, 80, 0.1);
        color: #4caf50;
      }

      &.status-missed {
        background: rgba(255, 152, 0, 0.1);
        color: #ff9800;
      }

      &.status-future {
        background: rgba(33, 150, 243, 0.1);
        color: #2196f3;
      }

      .status-info {
        h3 {
          margin: 0;
          font-size: 20px;
        }

        p {
          margin: 4px 0 0;
          font-size: 14px;
          opacity: 0.8;
        }
      }
    }

    .status-checklist {
      background: #f5f5f5;
      padding: 16px;
      border-radius: 8px;

      h4 {
        margin: 0 0 12px;
        font-size: 14px;
        color: #757575;
      }

      .checklist-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 0;
        color: #757575;

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }

        &.completed {
          color: #4caf50;
        }
      }
    }

    .quick-actions {
      h4 {
        margin: 0 0 12px;
        font-size: 14px;
        color: #757575;
      }
    }

    // Birthday members
    .birthday-members {
      h4 {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0 0 12px;

        mat-icon {
          color: #ff9800;
        }
      }

      mat-chip-set {
        margin-bottom: 12px;
      }
    }

    mat-dialog-actions {
      padding: 16px 24px;
      border-top: 1px solid #e0e0e0;
    }

    .option-icon {
      margin-right: 8px;
      vertical-align: middle;
    }

    .score-field {
      max-width: 120px;
      margin: 0 auto;
    }
  `]
})
export class MatchEditDialogComponent implements OnInit {
  editMatch: Partial<Match>;
  
  // IDs sélectionnés pour les relations
  selectedEquipe1Id: number | null = null;
  selectedEquipe2Id: number | null = null;
  selectedGroupeAdverseId: number | null = null;
  selectedArbitrePrincipalId?: number | null = null;
  selectedArbitreAssistantId?: number | null = null;
  selectedRapporteurId?: number | null = null;
  selectedSourceAdversaire: SourceAdversaire = 'MANUEL';
  selectedMembresAnniversaire: Membre[] = [];
  
  equipesForForfait: string[] = [];
  
  // Flag pour forcer le statut "joué"
  forceMarkAsPlayed: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<MatchEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MatchEditDialogData
  ) {
    this.editMatch = { ...data.match };
  }

  ngOnInit() {
    console.log('Match reçu:', this.data.match);
    console.log('Équipes disponibles:', this.data.equipes);
    console.log('Membres disponibles:', this.data.membres);
    
    this.initializeSelections();
    this.updateEquipesForForfait();
  }

  initializeSelections() {
    const match = this.data.match;
    console.log(match )
    this.selectedEquipe1Id = this.data.equipes[0].id;
    this.selectedEquipe2Id = this.data.equipes[1].id;
   this.selectedArbitrePrincipalId = this.editMatch?.arbitrePrincipal?.id
    this.selectedRapporteurId = this.editMatch?.rapporteur?.id
    this.selectedArbitreAssistantId =this.editMatch?.arbitreAssistant?.id
    
    console.log('Équipe 1 ID initialisé:', this.editMatch);
    console.log('Équipe 2 ID initialisé:', this.selectedEquipe2Id);
    
    // ===== ADVERSAIRE (AMICAL) =====
    this.selectedSourceAdversaire = match.sourceAdversaire || 'MANUEL';
    
    if (match.groupeAdverse) {
      if (typeof match.groupeAdverse === 'object' && match.groupeAdverse.id) {
        this.selectedGroupeAdverseId = match.groupeAdverse.id;
      } else if (typeof match.groupeAdverse === 'number') {
        this.selectedGroupeAdverseId = match.groupeAdverse;
      }
    } else if ((match as any).groupeAdverseId) {
      this.selectedGroupeAdverseId = (match as any).groupeAdverseId;
    }
   
    // ===== OFFICIELS =====
    // // Arbitre Principal
    // this.selectedArbitrePrincipalId = this.extractMemberId(match.arbitrePrincipal);
    // console.log('Arbitre Principal ID initialisé:', this.selectedArbitrePrincipalId);
    
    // // Arbitre Assistant
    // this.selectedArbitreAssistantId = this.extractMemberId(match.arbitreAssistant);
    // console.log('Arbitre Assistant ID initialisé:', this.selectedArbitreAssistantId);
    
    // // Rapporteur
    // this.selectedRapporteurId = this.extractMemberId(match.rapporteur);
    // console.log('Rapporteur ID initialisé:', this.selectedRapporteurId);
    
    // ===== MEMBRES ANNIVERSAIRE =====
    if (match.membresAnniversaire && Array.isArray(match.membresAnniversaire)) {
      this.selectedMembresAnniversaire = [...match.membresAnniversaire];
    } else {
      this.selectedMembresAnniversaire = [];
    }
  }
  
  /**
   * Extrait l'ID d'un membre depuis différents formats possibles
   */
  private extractMemberId(membre: any): number | null {
    if (!membre) return null;
    
    // Si c'est un objet avec un ID
    if (typeof membre === 'object' && membre.id) {
      return membre.id;
    }
    
    // Si c'est directement un nombre
    if (typeof membre === 'number') {
      return membre;
    }
    
    // Si c'est une chaîne numérique
    if (typeof membre === 'string' && !isNaN(Number(membre))) {
      return Number(membre);
    }
    
    return null;
  }
  
  /**
   * Formate une date pour l'affichage
   */
  formatDate(date: string | undefined): string {
    if (!date) return '';
    try {
      return new Date(date).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return date;
    }
  }
  
  // ===== GETTERS POUR AFFICHAGE DES VALEURS ACTUELLES =====
  
  getEquipe1Name(): string {
    if (this.selectedEquipe1Id) {
      const equipe = this.data.equipes.find(e => e.id === this.selectedEquipe1Id);
      return equipe?.nom || '';
    }
    if (this.data.match.equipe1) {
      if (typeof this.data.match.equipe1 === 'object') {
        return this.data.match.equipe1.nom || '';
      }
    }
    return (this.data.match as any).equipe1Nom || '';
  }
  
  getEquipe2Name(): string {
    if (this.selectedEquipe2Id) {
      const equipe = this.data.equipes.find(e => e.id === this.selectedEquipe2Id);
      return equipe?.nom || '';
    }
    if (this.data.match.equipe2) {
      if (typeof this.data.match.equipe2 === 'object') {
        return this.data.match.equipe2.nom || '';
      }
    }
    return (this.data.match as any).equipe2Nom || '';
  }
  
  getCurrentAdversaire(): string {
    const match = this.data.match;
    if (match.groupeAdverse) {
      if (typeof match.groupeAdverse === 'object') {
        return match.groupeAdverse.nom || '';
      }
    }
    return match.nomAdversaireManuel ||  '';
  }
  
  getCurrentArbitrePrincipal(): string {
    return this.getOfficialName(
      this.data.match.arbitrePrincipal,
      this.data.match.arbitrePrincipalNomOccasionnel
    );
  }
  
  getCurrentArbitreAssistant(): string {
    return this.getOfficialName(
      this.data.match.arbitreAssistant,
      this.data.match.arbitreAssistantNomOccasionnel
    );
  }
  
  getCurrentRapporteur(): string {
    return this.getOfficialName(
      this.data.match.rapporteur,
      this.data.match.rapporteurNomOccasionnel
    );
  }
  
  private getOfficialName(membre: any, nomOccasionnel: string | null | undefined): string {
    if (nomOccasionnel) return nomOccasionnel;
    
    if (membre) {
      if (typeof membre === 'object' && membre.nom) {
        return `${membre.nom} ${membre.prenom || ''}`.trim();
      }
      if (typeof membre === 'number') {
        const found = this.data.membres.find(m => m.id === membre);
        if (found) return `${found.nom} ${found.prenom}`;
      }
    }
    
    return '';
  }

  // ===== TYPE & ICONS =====
  
  getTypeIcon(): string {
    switch (this.editMatch.typeMatch) {
      case 'INTERNE': return 'groups';
      case 'DUEL': return 'sports';
      case 'AMICAL': return 'handshake';
      case 'ANNIVERSAIRE': return 'cake';
      default: return 'sports_soccer';
    }
  }

  onTypeChange() {
    this.updateEquipesForForfait();
  }

  // ===== ÉQUIPES =====

  randomizeTeams() {
    if (this.data.equipes.length >= 2) {
      const shuffled = [...this.data.equipes].sort(() => Math.random() - 0.5);
      this.selectedEquipe1Id = shuffled[0].id;
      this.selectedEquipe2Id = shuffled[1].id;
      this.updateEquipesForForfait();
    }
  }

  onSourceChange() {
    this.editMatch.sourceAdversaire = this.selectedSourceAdversaire;
    this.updateEquipesForForfait();
  }

  updateEquipesForForfait() {
    const equipes: string[] = [];
    
    if (this.editMatch.typeMatch === 'AMICAL') {
      equipes.push(this.data.currentGroupe?.nom || 'Mon équipe');
      if (this.selectedSourceAdversaire === 'MANUEL' && this.editMatch.nomAdversaireManuel) {
        equipes.push(this.editMatch.nomAdversaireManuel);
      } else if (this.selectedSourceAdversaire === 'GROUPE_EXISTANT' && this.selectedGroupeAdverseId) {
        const groupe = this.data.groupes.find(g => g.id === this.selectedGroupeAdverseId);
        if (groupe) equipes.push(groupe.nom);
      }
    } else {
      if (this.selectedEquipe1Id) {
        const eq1 = this.data.equipes.find(e => e.id === this.selectedEquipe1Id);
        if (eq1) equipes.push(eq1.nom);
      }
      if (this.selectedEquipe2Id) {
        const eq2 = this.data.equipes.find(e => e.id === this.selectedEquipe2Id);
        if (eq2) equipes.push(eq2.nom);
      }
    }
    
    this.equipesForForfait = equipes;
  }

  onForfaitChange() {
    if (!this.editMatch.forfait) {
      this.editMatch.equipeForfait = '';
    }
  }

  // ===== MEMBRES ANNIVERSAIRE =====

  get availableMembres(): Membre[] {
    return this.data.membres.filter(m => 
      !this.selectedMembresAnniversaire.some(s => s.id === m.id)
    );
  }

  addMembreAnniversaire(membre: Membre) {
    if (membre && !this.selectedMembresAnniversaire.some(m => m.id === membre.id)) {
      this.selectedMembresAnniversaire.push(membre);
    }
  }

  removeMembreAnniversaire(membre: Membre) {
    this.selectedMembresAnniversaire = this.selectedMembresAnniversaire.filter(m => m.id !== membre.id);
  }

  // ===== STATUS =====

  isMatchDatePast(): boolean {
    if (!this.editMatch.dateMatch) return false;
    const matchDate = new Date(this.editMatch.dateMatch);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    matchDate.setHours(0, 0, 0, 0);
    return matchDate < today;
  }

  hasRapporteur(): boolean {
    return this.selectedRapporteurId !== null || 
           !!(this.editMatch.rapporteurNomOccasionnel?.trim());
  }

  hasScore(): boolean {
    const score1 = this.editMatch.scoreEquipe1;
    const score2 = this.editMatch.scoreEquipe2 ?? this.editMatch.scoreAdversaire;
    return (score1 !== undefined && score1 !== null) || 
           (score2 !== undefined && score2 !== null);
  }

  getStatusClass(): string {
    if (this.forceMarkAsPlayed) return 'status-played';
    if (!this.isMatchDatePast()) return 'status-future';
    if (this.hasRapporteur() || this.hasScore()) return 'status-played';
    return 'status-missed';
  }

  getStatusIcon(): string {
    const status = this.getStatusClass();
    switch (status) {
      case 'status-played': return 'check_circle';
      case 'status-missed': return 'warning';
      default: return 'schedule';
    }
  }

  getStatusLabel(): string {
    const status = this.getStatusClass();
    switch (status) {
      case 'status-played': return 'Match joué';
      case 'status-missed': return 'Match non validé';
      default: return 'Match à venir';
    }
  }

  getStatusDescription(): string {
    const status = this.getStatusClass();
    switch (status) {
      case 'status-played': return 'Ce match a été joué et validé.';
      case 'status-missed': return 'Ce match est passé mais aucun rapporteur n\'a été assigné.';
      default: return 'Ce match n\'a pas encore eu lieu.';
    }
  }

  markAsPlayed() {
    this.forceMarkAsPlayed = true;
  }

  // ===== VALIDATION =====

  isValid(): boolean {
    if (!this.editMatch.typeMatch || !this.editMatch.dateMatch) return false;

    switch (this.editMatch.typeMatch) {
      case 'INTERNE':
      case 'DUEL':
        return !!this.selectedEquipe1Id && !!this.selectedEquipe2Id &&
               this.selectedEquipe1Id !== this.selectedEquipe2Id;
      
      case 'AMICAL':
        if (this.selectedSourceAdversaire === 'GROUPE_EXISTANT') {
          return !!this.selectedGroupeAdverseId;
        }
        return !!this.editMatch.nomAdversaireManuel?.trim();
      
      case 'ANNIVERSAIRE':
        return this.selectedMembresAnniversaire.length > 0;
      
      default:
        return false;
    }
  }

  // ===== ACTIONS =====

  onCancel() {
    this.dialogRef.close(null);
  }

  onSave() {
    if (!this.isValid()) return;

    const payload: any = {
      id: this.editMatch.id,
      typeMatch: this.editMatch.typeMatch,
      dateMatch: this.editMatch.dateMatch,
      lieu: this.editMatch.lieu || null,
      commentaire: this.editMatch.commentaire || null,
      forfait: this.editMatch.forfait || false,
      equipeForfait: this.editMatch.forfait ? this.editMatch.equipeForfait : null,
      
      // Scores
      scoreEquipe1: this.editMatch.scoreEquipe1,
      scoreEquipe2: this.editMatch.scoreEquipe2,
      scoreAdversaire: this.editMatch.scoreAdversaire,
      
      // Officiels - envoyer les IDs
      arbitrePrincipalId: this.selectedArbitrePrincipalId,
      arbitrePrincipalNom: this.editMatch.arbitrePrincipalNomOccasionnel || null,
      arbitreAssistantId: this.selectedArbitreAssistantId,
      arbitreAssistantNom: this.editMatch.arbitreAssistantNomOccasionnel || null,
      rapporteurId: this.selectedRapporteurId,
      rapporteurNom: this.editMatch.rapporteurNomOccasionnel || null,
      
      // Flag pour forcer le statut
      forceMarkAsPlayed: this.forceMarkAsPlayed
    };

    // Selon le type
    if (this.editMatch.typeMatch === 'INTERNE' || this.editMatch.typeMatch === 'DUEL') {
      payload.equipe1Id = this.selectedEquipe1Id;
      payload.equipe2Id = this.selectedEquipe2Id;
    }

    if (this.editMatch.typeMatch === 'AMICAL') {
      payload.sourceAdversaire = this.selectedSourceAdversaire;
      if (this.selectedSourceAdversaire === 'GROUPE_EXISTANT') {
        payload.groupeAdverseId = this.selectedGroupeAdverseId;
        payload.adversaire = this.editMatch.groupeAdverse?.abreviation;
      } else {
        payload.nomAdversaireManuel = this.editMatch.nomAdversaireManuel;
      }
    }

    if (this.editMatch.typeMatch === 'ANNIVERSAIRE') {
      payload.membresAnniversaireIds = this.selectedMembresAnniversaire.map(m => m.id);
      payload.equipe1Id = this.selectedEquipe1Id;
      payload.equipe2Id = this.selectedEquipe2Id;
    }

    console.log('Payload à envoyer:', payload);
    this.dialogRef.close(payload);
  }
}