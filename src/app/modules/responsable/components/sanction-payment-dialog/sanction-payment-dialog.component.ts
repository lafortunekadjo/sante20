import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { TranslateModule } from '@ngx-translate/core';

import { SanctionFinanceService } from '../../../../core/services/sanction-finance.service';
import { FinancesService, Caisse } from '../../../../core/services/finances.service';
import { Sanction } from '../../../../core/models/sanction.model';

export interface PaymentDialogData {
  sanction: Sanction;
  caisses: Caisse[];
}

@Component({
  selector: 'app-sanction-payment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatChipsModule,
    TranslateModule
  ],
  template: `
    <div class="payment-dialog">
      <div class="dialog-header">
        <div class="header-icon">
          <mat-icon>monetization_on</mat-icon>
        </div>
        <div class="header-text">
          <h2>Enregistrer un paiement</h2>
          <p>Paiement pour {{ data.sanction.membre}} {{ data.sanction.membre }}</p>
        </div>
        <button mat-icon-button (click)="onCancel()" class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-divider></mat-divider>

      <!-- Résumé de la sanction -->
      <div class="sanction-summary">

        <div class="summary-row">
          <span class="label">Date</span>
          <span class="value">{{ data.sanction.dateSanction | date:'dd/MM/yyyy' }}</span>
        </div>
        <div class="summary-row highlight">
          <span class="label">Montant total</span>
          <span class="value amount">{{ formatMontant(data.sanction.montant) }}</span>
        </div>
        <div class="summary-row" *ngIf="data.sanction.montantPaye > 0">
          <span class="label">Déjà payé</span>
          <span class="value paid">{{ formatMontant(data.sanction.montantPaye) }}</span>
        </div>
       
      </div>

      <mat-divider></mat-divider>

      <!-- Formulaire de paiement -->
      <form [formGroup]="paymentForm" class="payment-form">
        <div class="form-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Montant du paiement (FCFA)</mat-label>
            <input matInput type="number" formControlName="montant" [max]="resteAPayer" min="1">
            <mat-icon matPrefix>attach_money</mat-icon>
            <mat-error *ngIf="paymentForm.get('montant')?.hasError('required')">Montant requis</mat-error>
            <mat-error *ngIf="paymentForm.get('montant')?.hasError('min')">Minimum 1 FCFA</mat-error>
            <mat-error *ngIf="paymentForm.get('montant')?.hasError('max')">Maximum {{ formatMontant(resteAPayer) }}</mat-error>
            <mat-hint>Reste à payer: {{ formatMontant(resteAPayer) }}</mat-hint>
          </mat-form-field>
        </div>

        <div class="form-row two-cols">
          <mat-form-field appearance="outline">
            <mat-label>Date de paiement</mat-label>
            <input matInput [matDatepicker]="datePicker" formControlName="datePaiement">
            <mat-datepicker-toggle matSuffix [for]="datePicker"></mat-datepicker-toggle>
            <mat-datepicker #datePicker></mat-datepicker>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Mode de paiement</mat-label>
            <mat-select formControlName="modePaiement">
              <mat-option value="ESPECES">
                <mat-icon>payments</mat-icon>
                Espèces
              </mat-option>
              <mat-option value="MOBILE_MONEY">
                <mat-icon>phone_android</mat-icon>
                Mobile Money
              </mat-option>
              <mat-option value="VIREMENT">
                <mat-icon>account_balance</mat-icon>
                Virement
              </mat-option>
              <mat-option value="CHEQUE">
                <mat-icon>receipt</mat-icon>
                Chèque
              </mat-option>
              <mat-option value="AUTRE">
                <mat-icon>more_horiz</mat-icon>
                Autre
              </mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div class="form-row" *ngIf="paymentForm.get('modePaiement')?.value !== 'ESPECES'">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Référence de transaction</mat-label>
            <input matInput formControlName="reference" placeholder="Ex: OM-123456789">
            <mat-icon matPrefix>tag</mat-icon>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Caisse de destination</mat-label>
            <mat-select formControlName="caisseId">
              <mat-option [value]="null">
                <mat-icon>auto_awesome</mat-icon>
                Caisse par défaut (selon type de sanction)
              </mat-option>
              <mat-option *ngFor="let caisse of data.caisses" [value]="caisse.id">
                <mat-icon [style.color]="caisse.couleur">account_balance_wallet</mat-icon>
                {{ caisse.nom }} ({{ formatMontant(caisse.soldeActuel) }})
              </mat-option>
            </mat-select>
            <mat-icon matPrefix>account_balance_wallet</mat-icon>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Commentaire (optionnel)</mat-label>
            <textarea matInput formControlName="commentaire" rows="2" placeholder="Note sur le paiement"></textarea>
            <mat-icon matPrefix>comment</mat-icon>
          </mat-form-field>
        </div>
      </form>

      <!-- Quick amount buttons -->
      <div class="quick-amounts" *ngIf="resteAPayer > 0">
        <span class="quick-label">Montants rapides:</span>
        <button mat-stroked-button *ngIf="resteAPayer >= 1000" (click)="setAmount(1000)">1 000</button>
        <button mat-stroked-button *ngIf="resteAPayer >= 2000" (click)="setAmount(2000)">2 000</button>
        <button mat-stroked-button *ngIf="resteAPayer >= 5000" (click)="setAmount(5000)">5 000</button>
        <button mat-stroked-button (click)="setAmount(resteAPayer)">Tout ({{ formatMontant(resteAPayer) }})</button>
      </div>

      <mat-divider></mat-divider>

      <!-- Actions -->
      <div class="dialog-actions">
        <button mat-stroked-button (click)="onCancel()">
          <mat-icon>close</mat-icon>
          Annuler
        </button>
        <button mat-raised-button color="primary" 
                (click)="onSubmit()" 
                [disabled]="paymentForm.invalid || isLoading">
          <mat-spinner *ngIf="isLoading" diameter="20"></mat-spinner>
          <mat-icon *ngIf="!isLoading">check</mat-icon>
          <span *ngIf="!isLoading">Enregistrer le paiement</span>
        </button>
      </div>

      <!-- Error message -->
      <div class="error-message" *ngIf="errorMessage">
        <mat-icon>error</mat-icon>
        {{ errorMessage }}
      </div>
    </div>
  `,
  styles: [`
    .payment-dialog {
      min-width: 450px;
      max-width: 550px;

      @media (max-width: 600px) {
        min-width: 100%;
      }
    }

    .dialog-header {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 20px 24px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      margin: -24px -24px 0;
      color: white;

      .header-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;

        mat-icon {
          font-size: 28px;
          width: 28px;
          height: 28px;
        }
      }

      .header-text {
        flex: 1;

        h2 {
          margin: 0 0 4px;
          font-size: 20px;
          font-weight: 600;
        }

        p {
          margin: 0;
          opacity: 0.9;
          font-size: 14px;
        }
      }

      .close-btn {
        color: white;
        margin: -8px -12px 0 0;
      }
    }

    .sanction-summary {
      padding: 16px 24px;
      background: var(--background-tertiary, #f3f4f6);

      .summary-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;

        &:not(:last-child) {
          border-bottom: 1px dashed var(--border-color, #e5e7eb);
        }

        &.highlight {
          background: rgba(59, 130, 246, 0.05);
          margin: 4px -12px;
          padding: 8px 12px;
          border-radius: 8px;
        }

        .label {
          color: var(--text-secondary, #6b7280);
          font-size: 13px;
        }

        .value {
          font-weight: 500;
          color: var(--text-primary, #1f2937);

          &.amount {
            color: var(--primary-color, #3b82f6);
            font-size: 16px;
          }

          &.paid {
            color: var(--success-color, #10b981);
          }

          &.remaining {
            color: var(--warning-color, #f59e0b);
            font-size: 18px;
            font-weight: 700;
          }
        }
      }
    }

    .payment-form {
      padding: 20px 24px;

      .form-row {
        margin-bottom: 16px;

        &.two-cols {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;

          @media (max-width: 500px) {
            grid-template-columns: 1fr;
          }
        }

        .full-width {
          width: 100%;
        }
      }
    }

    .quick-amounts {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 24px 16px;
      flex-wrap: wrap;

      .quick-label {
        font-size: 13px;
        color: var(--text-secondary, #6b7280);
      }

      button {
        font-size: 12px;
        min-width: auto;
        padding: 4px 12px;
      }
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px;

      button {
        display: flex;
        align-items: center;
        gap: 8px;

        mat-spinner {
          margin: 0;
        }
      }
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      background: rgba(239, 68, 68, 0.1);
      color: var(--error-color, #ef4444);
      font-size: 14px;
      margin: 0 -24px -24px;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    // Dark theme
    :host-context(.dark-theme) {
      .dialog-header {
        background: linear-gradient(135deg, #059669 0%, #047857 100%);
      }

      .sanction-summary {
        background: var(--background-tertiary, #1f2937);

        .summary-row.highlight {
          background: rgba(59, 130, 246, 0.1);
        }
      }
    }
  `]
})
export class SanctionPaymentDialogComponent implements OnInit {
  paymentForm: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<SanctionPaymentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PaymentDialogData,
    private sanctionFinanceService: SanctionFinanceService
  ) {
    this.paymentForm = this.fb.group({
      montant: [this.resteAPayer, [Validators.required, Validators.min(1), Validators.max(this.resteAPayer)]],
      datePaiement: [new Date(), Validators.required],
      modePaiement: ['ESPECES', Validators.required],
      reference: [''],
      caisseId: [null],
      commentaire: ['']
    });
  }

  ngOnInit(): void {}

  get resteAPayer(): number {
    const montant = this.data.sanction.montant || 0;
    const paye = this.data.sanction.montantPaye || 0;
    return montant - paye;
  }

  setAmount(amount: number): void {
    this.paymentForm.patchValue({ montant: amount });
  }

  formatMontant(montant: number | undefined): string {
    if (!montant) return '0 FCFA';
    return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.paymentForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = null;

    const formData = this.paymentForm.value;
    const request = {
      sanctionId: this.data.sanction.id,
      montant: formData.montant,
      datePaiement: this.formatDateForApi(formData.datePaiement),
      modePaiement: formData.modePaiement,
      reference: formData.reference || null,
      caisseId: formData.caisseId,
      commentaire: formData.commentaire || null
    };

    this.sanctionFinanceService.enregistrerPaiement(request).subscribe({
      next: (result) => {
        this.isLoading = false;
        this.dialogRef.close({ success: true, paiement: result });
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Erreur lors de l\'enregistrement du paiement';
        console.error(err);
      }
    });
  }

  private formatDateForApi(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
